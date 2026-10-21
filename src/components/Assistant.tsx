"use client";

// Asistente de Aterna: un orbe fijo en la esquina inferior derecha, encima
// del botón de WhatsApp. Al pulsarlo se abre un panel de vidrio con una
// conversación: cada respuesta se queda en pantalla, con un enlace a la
// página donde está la información y dos preguntas que suelen venir después.
// Mientras «piensa», una esfera de puntos gira y se ilumina por zonas
// (adaptada del MorphOrb, con la paleta de la web); luego la respuesta
// aparece palabra a palabra. Responde con el contenido de la web
// (lib/assistant.ts), sin servidor; en ordenador se ayuda de un modelo que
// corre en el navegador (lib/semantic.ts).
//
// «Ayúdame a elegir» abre tres preguntas con botones (qué necesita, a qué se
// dedica, para cuándo) y deja el mensaje escrito para mandarlo por WhatsApp
// o por el formulario de contacto. Si no encuentra la respuesta, propone las
// fichas más cercanas y ofrece preguntar por WhatsApp con la pregunta ya
// escrita. Esc o el botón de cerrar lo cierran y el foco vuelve al orbe. Con
// movimiento reducido no hay giro ni aparición.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { answer, followUps, labelFor, nearest, replyFor, semanticGroups, type ReplyId } from "@/lib/assistant";
import { Link, useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";
import { formatPrice, pricing, slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { index, similarities, warmUp } from "@/lib/semantic";
import { whatsappHref } from "./Chrome";

type Step = "need" | "sector" | "when";
const STEPS: Step[] = ["need", "sector", "when"];

/** La conversación. Las respuestas se guardan por id: si cambia el idioma, cambian con él. */
type Msg =
  | { from: "user"; text?: string; entry?: number; flow?: true; step?: Step; option?: number }
  | { from: "bot"; reply: ReplyId; question: string; near: number[] }
  | { from: "step"; step: Step }
  | { from: "summary"; picks: Record<Step, number> };

/** Tiempo mínimo «pensando»: lo justo para que la respuesta no parezca un salto. */
const MIN_THINK = 700;

/* ── Esfera de puntos (del MorphOrb, simplificada) ─────────────────────── */

const RINGS = 14;
const DOTS = (() => {
  const out: { x: number; y: number; z: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(26 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * Math.PI * 2 + k * 0.35;
      out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r });
    }
  }
  return out;
})();

/** Dibuja la esfera mientras `running()`; devuelve cómo pararla. */
function spinOrb(canvas: HTMLCanvasElement, running: () => boolean, still: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const size = canvas.clientWidth || 120;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(canvas);
  const lav = css.getPropertyValue("--lavender").trim() || "#9aa3ff";
  const orc = css.getPropertyValue("--orchid").trim() || "#d77cf5";
  const R = size * 0.38;
  const C = size / 2;
  const tilt = 0.35;
  let raf = 0;
  let t = 0;
  let last = performance.now();

  const draw = () => {
    ctx.clearRect(0, 0, size, size);
    const yaw = t * 0.9;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    // Dos focos de luz que recorren la esfera: «busca» por zonas.
    const a1 = t * 1.1;
    const b1 = Math.sin(t * 0.7) * 0.8;
    const fx = Math.cos(b1) * Math.cos(a1);
    const fy = Math.sin(b1);
    const fz = Math.cos(b1) * Math.sin(a1);
    for (const d of DOTS) {
      const x1 = d.x * cy + d.z * sy;
      const z1 = -d.x * sy + d.z * cy;
      const y2 = d.y * Math.cos(tilt) - z1 * Math.sin(tilt);
      const z2 = d.y * Math.sin(tilt) + z1 * Math.cos(tilt);
      const depth = (z2 + 1) / 2;
      const f = 2.8 / (2.8 - z2);
      const lit = Math.max(0, (d.x * fx + d.y * fy + d.z * fz - 0.7) / 0.3);
      ctx.globalAlpha = Math.min(1, 0.12 + 0.45 * depth * depth + 0.8 * lit * lit);
      ctx.fillStyle = lit > 0.35 ? orc : lav;
      ctx.beginPath();
      ctx.arc(C + x1 * R * f, C - y2 * R * f, (0.6 + 0.9 * depth + 0.8 * lit) * f, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw();
    raf = running() ? requestAnimationFrame(frame) : 0;
  };
  if (still) {
    t = 1.2;
    draw();
  } else {
    raf = requestAnimationFrame(frame);
  }
  return () => cancelAnimationFrame(raf);
}

/* ── Componente ─────────────────────────────────────────────────────────── */

const Arrow = () => (
  <svg className="arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

/** Texto que aparece palabra a palabra (solo el último mensaje). */
function Words({ text, animate }: { text: string; animate: boolean }) {
  if (!animate) return <>{text}</>;
  return (
    <>
      {text
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) => (
          <span key={i} className="assistant__word" style={{ animationDelay: `${Math.min(i * 28, 900)}ms` }}>
            {w}{" "}
          </span>
        ))}
    </>
  );
}

export function Assistant() {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const f = a.flow;
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [value, setValue] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [label, setLabel] = useState(0);
  const [overFooter, setOverFooter] = useState(false);
  const orbRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef(false);
  thinkingRef.current = thinking;
  const timer = useRef<number | undefined>(undefined);
  /** Si la última pregunta llegó por un botón, el foco va a la respuesta. */
  const focusAnswer = useRef(false);

  // Como WhatsApp: se aparta cuando el pie está en pantalla (salvo abierto).
  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setOverFooter(e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  // Al cambiar de página se cierra (la conversación se queda).
  useEffect(() => setOpen(false), [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    orbRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Con el panel abierto, el modelo (si el dispositivo lo merece) prepara las
  // fichas del idioma actual.
  useEffect(() => {
    if (!open) return;
    warmUp();
    index(locale, semanticGroups(t, locale));
  }, [open, t, locale]);

  // La esfera solo gira mientras piensa; las etiquetas cambian cada 1,1 s.
  useEffect(() => {
    if (!thinking || !canvasRef.current) return;
    const still = prefersReducedMotion();
    const stop = spinOrb(canvasRef.current, () => thinkingRef.current, still);
    const id = window.setInterval(() => setLabel((l) => (l + 1) % a.labels.length), 1100);
    return () => {
      stop();
      window.clearInterval(id);
    };
  }, [thinking, a.labels.length]);

  // Cada mensaje nuevo baja la conversación hasta el final.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !open) return;
    body.scrollTo({ top: body.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (focusAnswer.current && !thinking) {
      focusAnswer.current = false;
      lastRef.current?.focus({ preventScroll: true });
    }
  }, [log, thinking, open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Responde con la ficha `id` sin buscar (botones de seguimiento). */
  const show = (id: number) => {
    if (thinking) return;
    focusAnswer.current = true;
    setLog((l) => [...l, { from: "user", entry: id }, { from: "bot", reply: id, question: "", near: [] }]);
  };

  const ask = async (text: string, viaButton = false) => {
    const q = text.trim();
    if (!q || thinking) {
      if (!q) inputRef.current?.focus();
      return;
    }
    focusAnswer.current = viaButton;
    setValue("");
    setLabel(0);
    setThinking(true);
    setLog((l) => [...l, { from: "user", text: q }]);
    const started = performance.now();
    const sims = await similarities(locale, q);
    const reply = answer(q, t, locale, sims ?? undefined);
    const near = reply === "fallback" ? nearest(q, t, locale, sims ?? undefined) : [];
    const rest = prefersReducedMotion() ? 0 : Math.max(0, MIN_THINK - (performance.now() - started));
    timer.current = window.setTimeout(() => {
      setThinking(false);
      setLog((l) => [...l, { from: "bot", reply, question: q, near }]);
    }, rest);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(value);
  };

  /* Ayúdame a elegir: tres pasos con botones y un resumen. */
  const startFlow = () => {
    if (thinking) return;
    focusAnswer.current = true;
    setLog((l) => [...l, { from: "user", flow: true }, { from: "step", step: "need" }]);
  };

  const pick = (step: Step, option: number) => {
    focusAnswer.current = true;
    setLog((l) => {
      const next: Msg[] = [...l, { from: "user", step, option }];
      const following = STEPS[STEPS.indexOf(step) + 1];
      if (following) return [...next, { from: "step", step: following }];
      const picks = { need: 0, sector: 0, when: 0 };
      for (const m of next) if (m.from === "user" && m.step) picks[m.step] = m.option ?? 0;
      return [...next, { from: "summary", picks }];
    });
  };

  const restart = () => {
    window.clearTimeout(timer.current);
    setThinking(false);
    setLog([]);
    inputRef.current?.focus({ preventScroll: true });
  };

  // Fichas ya respondidas: no se vuelven a proponer.
  const seen = useMemo(() => new Set(log.flatMap((m) => (m.from === "bot" && typeof m.reply === "number" ? [m.reply] : []))), [log]);
  const flowUsed = log.some((m) => m.from === "step");

  const stepOptions = (step: Step) => (step === "need" ? f.need.options.map((o) => o.label) : f[step].options);

  /** El mensaje que se manda al final del flujo, en el idioma de la web. */
  const summaryOf = (picks: Record<Step, number>) => {
    const slug = f.need.options[picks.need]?.service as ServiceSlug | "";
    const card = slug ? t.servicePages.index.cards.find((c) => c.slug === slug) : undefined;
    let text = f.summaryUnsure;
    if (slug && card) {
      const plans = pricing[slugToProduct[slug]];
      const from = Math.min(...plans.map((p) => p.amount));
      const unit = plans[0].unit === "month" ? t.common.perMonth : "";
      const price = plans[0].custom ? a.custom : `${t.common.priceFrom} ${formatPrice(from, locale)}${unit}`;
      text = f.summary.replace("{service}", card.title).replace("{price}", price);
    }
    const message = [
      f.intro,
      `${f.fields.service}: ${card?.title ?? f.unsure}`,
      `${f.fields.sector}: ${f.sector.options[picks.sector]}`,
      `${f.fields.when}: ${f.when.options[picks.when]}`,
    ].join("\n");
    return { text, message, href: slug ? `/servicios/${slug}#planes` : undefined };
  };

  const last = log.length - 1;
  const lastBot = log[last]?.from === "bot" ? (log[last] as Extract<Msg, { from: "bot" }>) : null;
  const next = lastBot && !thinking ? followUps(lastBot.reply, seen, t, locale) : [];
  const status =
    thinking ? a.labels[0] : lastBot ? replyFor(lastBot.reply, t, locale).text : log[last]?.from === "step" ? f[(log[last] as { step: Step }).step].q : "";

  return (
    <aside className="assistant" data-open={open} data-hidden={overFooter && !open} aria-label={a.title}>
      <div
        id={panelId}
        className="assistant__panel"
        role="dialog"
        aria-label={a.title}
        data-lenis-prevent
        hidden={!open}
        onPointerEnter={warmUp}
      >
        <header className="assistant__head">
          <span className="assistant__dot" aria-hidden="true" />
          <p className="t-label">{a.title}</p>
          {log.length ? (
            <button type="button" className="assistant__close" onClick={restart} aria-label={a.restart} title={a.restart}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.4-5.7" />
                <path d="M4 4v4.5h4.5" />
              </svg>
            </button>
          ) : null}
          <button type="button" className="assistant__close" onClick={close} aria-label={a.close}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="assistant__body" ref={bodyRef}>
          <p className="t-small assistant__hello">{a.hello}</p>
          {!log.length ? (
            <ul className="assistant__chips">
              <li>
                <button type="button" className="assistant__chip assistant__chip--flow" onClick={startFlow}>
                  {f.start}
                </button>
              </li>
              {a.suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className="assistant__chip" onClick={() => ask(s, true)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {log.map((m, i) => {
            const isLast = i === last && !thinking;
            const ref = isLast ? lastRef : undefined;
            if (m.from === "user") {
              return (
                <p key={i} className="t-small assistant__asked">
                  {m.flow ? f.start : m.step ? stepOptions(m.step)[m.option ?? 0] : m.entry !== undefined ? labelFor(m.entry, t, locale) : m.text}
                </p>
              );
            }
            if (m.from === "step") {
              return (
                <div key={i} className="assistant__answer" ref={ref} tabIndex={-1}>
                  <p className="t-small assistant__text">{f[m.step].q}</p>
                  {isLast ? (
                    <ul className="assistant__chips">
                      {stepOptions(m.step).map((o, k) => (
                        <li key={o}>
                          <button type="button" className="assistant__chip" onClick={() => pick(m.step, k)}>
                            {o}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            }
            if (m.from === "summary") {
              const s = summaryOf(m.picks);
              return (
                <div key={i} className="assistant__answer" ref={ref} tabIndex={-1}>
                  <p className="t-small assistant__text">
                    <Words text={s.text} animate={isLast} />
                  </p>
                  <pre className="assistant__draft">{s.message}</pre>
                  <div className="assistant__cta">
                    <a href={whatsappHref(s.message)} target="_blank" rel="noopener noreferrer" className="btn-primary assistant__btn">
                      {f.whatsapp}
                    </a>
                    <Link href={`/contacto?mensaje=${encodeURIComponent(s.message)}`} className="btn-ghost assistant__btn" onClick={() => setOpen(false)}>
                      {f.form}
                    </Link>
                  </div>
                  {s.href ? (
                    <div className="assistant__actions">
                      <Link href={s.href} className="link-cta" onClick={() => setOpen(false)}>
                        {t.common.seePlans}
                        <Arrow />
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            }
            const reply = replyFor(m.reply, t, locale);
            return (
              <div key={i} className="assistant__answer" ref={ref} tabIndex={-1}>
                <p className="t-small assistant__text">
                  <Words text={reply.text} animate={isLast} />
                </p>
                {m.reply === "fallback" ? (
                  <>
                    {m.near.length ? (
                      <>
                        <p className="t-small assistant__hint">{a.nearest}</p>
                        <ul className="assistant__chips">
                          {m.near.map((id) => (
                            <li key={id}>
                              <button type="button" className="assistant__chip" onClick={() => show(id)} disabled={!isLast}>
                                {labelFor(id, t, locale)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <div className="assistant__cta">
                      <a href={whatsappHref(a.question.replace("{q}", m.question))} target="_blank" rel="noopener noreferrer" className="btn-ghost assistant__btn">
                        {a.askWhatsApp}
                      </a>
                    </div>
                  </>
                ) : null}
                {reply.href && reply.link ? (
                  <div className="assistant__actions">
                    <Link href={reply.href} className="link-cta" onClick={() => setOpen(false)}>
                      {reply.link}
                      <Arrow />
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}

          {thinking ? (
            <div className="assistant__think" aria-hidden="true">
              <canvas ref={canvasRef} className="assistant__sphere" />
              <p key={label} className="t-label assistant__label">
                {a.labels[label]}
                <span className="assistant__dots">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            </div>
          ) : null}

          {/* Lo que suele venir después: solo bajo la última respuesta. */}
          {next.length || (lastBot && !flowUsed && !thinking) ? (
            <ul className="assistant__chips assistant__chips--next">
              {next.map((id) => (
                <li key={id}>
                  <button type="button" className="assistant__chip" onClick={() => show(id)}>
                    {labelFor(id, t, locale)}
                  </button>
                </li>
              ))}
              {!flowUsed ? (
                <li>
                  <button type="button" className="assistant__chip assistant__chip--flow" onClick={startFlow}>
                    {f.start}
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <form className="assistant__form" onSubmit={onSubmit} autoComplete="off">
          <svg className="assistant__spark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7L10 3.5z" />
            <path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
          </svg>
          <input
            ref={inputRef}
            className="assistant__field"
            type="text"
            value={value}
            maxLength={200}
            placeholder={a.placeholder}
            aria-label={a.placeholder}
            onChange={(e) => setValue(e.target.value)}
            disabled={thinking}
          />
          <button type="submit" className="assistant__send" aria-label={a.send} data-ready={value.trim() ? "" : undefined} disabled={thinking}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" />
              <path d="M5.5 11.5L12 5l6.5 6.5" />
            </svg>
          </button>
        </form>
        <p className="assistant__note">{a.note}</p>
        <div className="sr-only" role="status" aria-live="polite">
          {status}
        </div>
      </div>

      {/* El orbe: una esfera de la paleta de la marca con dos ojos que parpadean. */}
      <button
        ref={orbRef}
        type="button"
        className="assistant__orb"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? a.close : a.open}
        tabIndex={overFooter && !open ? -1 : undefined}
        onPointerEnter={warmUp}
        onFocus={warmUp}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="assistant__eyes" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>
    </aside>
  );
}
