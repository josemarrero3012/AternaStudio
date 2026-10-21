"use client";

// Asistente de Aterna: un orbe fijo en la esquina inferior derecha, encima
// del botón de WhatsApp. Al pulsarlo se abre un panel de vidrio para
// preguntar; mientras «piensa», una esfera de puntos gira y se ilumina por
// zonas (adaptada del MorphOrb, con la paleta de la web) y las etiquetas van
// cambiando; luego la respuesta aparece palabra a palabra, con un enlace a la
// página donde está la información. Responde con el contenido de la web
// (lib/assistant.ts), sin servidor. Esc o el botón de cerrar lo cierran y el
// foco vuelve al orbe. Con movimiento reducido no hay giro ni aparición.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { answer, replyFor, type Reply, type ReplyId } from "@/lib/assistant";
import { Link, useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

type Phase = "idle" | "think" | "answered";

/** Tiempo mínimo «pensando»: menos se leía como un salto, no como una respuesta. */
const MIN_THINK = 1700;

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

export function Assistant() {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [value, setValue] = useState("");
  const [asked, setAsked] = useState("");
  const [replyId, setReplyId] = useState<ReplyId | null>(null);
  const [label, setLabel] = useState(0);
  const [overFooter, setOverFooter] = useState(false);
  const orbRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;
  const timer = useRef<number | undefined>(undefined);

  // Como WhatsApp: se aparta cuando el pie está en pantalla (salvo abierto).
  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setOverFooter(e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  // Al cambiar de página se cierra.
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

  // La esfera solo gira mientras piensa; las etiquetas cambian cada 1,1 s.
  useEffect(() => {
    if (phase !== "think" || !canvasRef.current) return;
    const still = prefersReducedMotion();
    const stop = spinOrb(canvasRef.current, () => phaseRef.current === "think", still);
    const id = window.setInterval(() => setLabel((l) => (l + 1) % a.labels.length), 1100);
    return () => {
      stop();
      window.clearInterval(id);
    };
  }, [phase, a.labels.length]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || phase === "think") {
      if (!q) inputRef.current?.focus();
      return;
    }
    setAsked(q);
    setValue("");
    setLabel(0);
    setPhase("think");
    const id = answer(q, t, locale);
    timer.current = window.setTimeout(
      () => {
        setReplyId(id);
        setPhase("answered");
        answerRef.current?.focus({ preventScroll: true });
      },
      prefersReducedMotion() ? 300 : MIN_THINK,
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(value);
  };

  const again = () => {
    setReplyId(null);
    setAsked("");
    setPhase("idle");
    inputRef.current?.focus({ preventScroll: true });
  };

  // La respuesta se calcula con el idioma actual: si se cambia de idioma con
  // una respuesta en pantalla, la respuesta cambia con él.
  const reply: Reply | null = phase === "answered" && replyId !== null ? replyFor(replyId, t, locale) : null;
  const words = reply?.text.split(/\s+/).filter(Boolean) ?? [];

  return (
    <aside className="assistant" data-open={open} data-hidden={overFooter && !open} aria-label={a.title}>
      <div
        id={panelId}
        className="assistant__panel"
        role="dialog"
        aria-label={a.title}
        data-phase={phase}
        data-lenis-prevent
        hidden={!open}
      >
        <header className="assistant__head">
          <span className="assistant__dot" aria-hidden="true" />
          <p className="t-label">{a.title}</p>
          <button type="button" className="assistant__close" onClick={close} aria-label={a.close}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="assistant__body">
          {phase === "idle" ? (
            <>
              <p className="t-small assistant__hello">{a.hello}</p>
              <ul className="assistant__chips">
                {a.suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" className="assistant__chip" onClick={() => ask(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {phase !== "idle" ? <p className="t-small assistant__asked">{asked}</p> : null}

          {phase === "think" ? (
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

          {phase === "answered" && reply ? (
            <div className="assistant__answer" ref={answerRef} tabIndex={-1}>
              <p className="t-label assistant__answer-head">
                <span className="assistant__dot" aria-hidden="true" />
                {a.answer}
              </p>
              <p className="t-small assistant__text">
                {words.map((w, i) => (
                  <span key={i} className="assistant__word" style={{ animationDelay: `${Math.min(i * 28, 900)}ms` }}>
                    {w}{" "}
                  </span>
                ))}
              </p>
              <div className="assistant__actions">
                {reply.href && reply.link ? (
                  <Link href={reply.href} className="link-cta" onClick={() => setOpen(false)}>
                    {reply.link}
                    <svg className="arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </Link>
                ) : null}
                <button type="button" className="assistant__again" onClick={again}>
                  {a.again}
                </button>
              </div>
            </div>
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
            disabled={phase === "think"}
          />
          <button type="submit" className="assistant__send" aria-label={a.send} data-ready={value.trim() ? "" : undefined} disabled={phase === "think"}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" />
              <path d="M5.5 11.5L12 5l6.5 6.5" />
            </svg>
          </button>
        </form>
        <p className="assistant__note">{a.note}</p>
        <div className="sr-only" role="status" aria-live="polite">
          {phase === "think" ? a.labels[0] : phase === "answered" ? reply?.text : ""}
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
