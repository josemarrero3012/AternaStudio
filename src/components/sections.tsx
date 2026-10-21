"use client";

// Secciones compartidas entre páginas.

import { withBase } from "@/lib/base";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  ATERNA_EASE,
  DURATION,
  ScrollTrigger,
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/motion";
import { formatPrice, pricing, slugToProduct, startingPrice, type ServiceSlug } from "@/lib/pricing";
import { heroReady, onIntro } from "@/lib/intro";
import { useReveal } from "@/lib/reveal";
import { site } from "@/lib/site";
import { CopyEmail } from "./CopyEmail";
import { PILLAR_GLYPHS, STEP_GLYPHS } from "./glyphs";
import { ArrowRight, Check } from "./icons";
import { ApproachRail } from "./ApproachRail";
import { MethodRoot } from "./MethodRoot";
import { Rootlets } from "./Rootlets";
import { ServiceGlyph } from "./ServiceTrace";
import { useStepWire } from "./StepWire";
import { Trace } from "./Trace";
import { WordReveal } from "./WordReveal";

/** "01 — Estudio": la numeración la pone cada página según su orden real. */
function eyebrow(text: string, n?: number) {
  return n ? `${String(n).padStart(2, "0")} — ${text}` : text;
}

/** Pantallas que necesitan el vídeo de 2560 px. */
const WIDE = "(min-width: 1440px), (min-resolution: 2dppx) and (min-width: 1000px)";
/** Pantallas altas: el recorte vertical. */
const TALL = "(max-aspect-ratio: 3/4)";

/**
 * La versión del vídeo para esta pantalla, decidida aquí y no solo con
 * <source media>, que no todos los navegadores respetan en <video> (algunos
 * se quedaban con la primera fuente: el recorte vertical en escritorio).
 * Siempre MP4 (H.264): se decodifica por hardware en todos los navegadores
 * y, a igual tamaño, lleva más calidad que el WebM.
 */
function heroSrc() {
  const size = matchMedia(TALL).matches ? "portrait" : matchMedia(WIDE).matches ? "2560" : "1920";
  return withBase(`/brand/hero-tree-${size}.mp4`);
}

/** Quien pide ahorrar datos no se descarga el vídeo: ve la imagen fija. */
function saveData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(c?.saveData);
}

export function Hero() {
  const { t } = useI18n();
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const row = useRef<HTMLDivElement>(null);

  // El vídeo. Empieza en negro y el árbol crece: su primer fotograma es del
  // color de la página, así que mientras carga no se ve nada «parado». Antes
  // llevaba de póster el árbol ya crecido y, según la red, se veía quieto y
  // luego saltaba a negro para empezar a crecer.
  useEffect(() => {
    const el = media.current;
    const v = video.current;
    if (!el || !v) return;
    // La imagen fija: con movimiento reducido, ahorro de datos o si el
    // navegador no deja reproducir (p. ej. modo de bajo consumo del iPhone).
    const still = () => {
      el.dataset.state = "still";
      v.pause();
      heroReady();
    };
    if (prefersReducedMotion() || saveData()) {
      still();
      return;
    }
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

    const src = heroSrc();
    if (!v.currentSrc.endsWith(src)) {
      v.src = src;
      v.load();
    }
    let started = false;
    let visible = true;
    // Puede arrancar sin cortes: la cortina ya puede subir.
    const onReady = () => heroReady();
    if (v.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) onReady();
    v.addEventListener("canplay", onReady);
    v.addEventListener("error", still);
    // Con <source>, el error llega en cada fuente: si ya no queda ninguna, fija.
    const sources = Array.from(v.querySelectorAll("source"));
    const onSourceError = () => {
      if (v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) still();
    };
    sources.forEach((source) => source.addEventListener("error", onSourceError));
    const onPlaying = () => {
      // Calentamiento (ver abajo): ya ha arrancado; se para en el primer
      // fotograma hasta que empiece la entrada.
      if (!started) {
        v.pause();
        v.currentTime = 0;
        heroReady();
        return;
      }
      el.dataset.state = "playing";
    };
    v.addEventListener("playing", onPlaying);
    const play = () => {
      v.play().catch((err: DOMException) => {
        // Bloqueado por el navegador: la imagen fija. Si solo se interrumpió
        // (pausa al salir de pantalla), no pasa nada.
        if (err?.name === "NotAllowedError" || err?.name === "NotSupportedError") still();
      });
    };
    // Calentamiento tras la cortina: algunos navegadores (Safari en iPhone)
    // no cargan el vídeo hasta que se le da a play. Se le da, se para en
    // cuanto arranca y espera tapado; si el navegador no deja, imagen fija.
    if (document.documentElement.dataset.curtain !== "skip" && document.documentElement.dataset.intro !== "on") play();
    // Al empezar la entrada, desde el primer fotograma.
    let slow = 0;
    const off = onIntro(() => {
      started = true;
      if (v.currentTime > 0) v.currentTime = 0;
      if (visible) play();
      // Red muy lenta: si a los 5 s sigue sin arrancar, imagen fija y deja
      // de descargar (que no aparezca más tarde a destiempo).
      slow = window.setTimeout(() => {
        if (!visible || el.dataset.state !== "wait") return;
        still();
        v.removeAttribute("src");
        sources.forEach((source) => source.remove());
        v.load();
      }, 5000);
    });
    // Solo se reproduce mientras se ve (batería y CPU).
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!started) return;
      if (visible) play();
      else v.pause();
    });
    io.observe(v);

    // Si se gira el móvil y cambia la proporción, la versión que toca,
    // desde el mismo punto.
    const tall = matchMedia(TALL);
    const onTurn = () => {
      const next = heroSrc();
      if (v.currentSrc.endsWith(next)) return;
      const at = v.currentTime;
      v.src = next;
      v.addEventListener(
        "loadedmetadata",
        () => {
          v.currentTime = at;
          if (started && visible) play();
        },
        { once: true },
      );
      v.load();
    };
    tall.addEventListener("change", onTurn);

    return () => {
      off();
      window.clearTimeout(slow);
      io.disconnect();
      tall.removeEventListener("change", onTurn);
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("error", still);
      v.removeEventListener("playing", onPlaying);
      sources.forEach((source) => source.removeEventListener("error", onSourceError));
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    registerGsap();
    let off = () => {};
    const ctx = gsap.context(() => {
      if (media.current) {
        gsap.to(media.current, {
          opacity: 0.15,
          ease: "none",
          scrollTrigger: { trigger: media.current, start: "top top", end: "+=520", scrub: 0.6 },
        });
      }
      // La fila de apoyo, después del titular, contando desde la entrada.
      if (row.current) {
        const el = row.current;
        gsap.set(el, { opacity: 0, y: 16 });
        off = onIntro(() => {
          gsap.to(el, { opacity: 1, y: 0, duration: DURATION.cine, ease: ATERNA_EASE, delay: 1.15 });
        });
      }
    });
    return () => {
      off();
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media" ref={media} data-state="wait" aria-hidden="true">
        {/* Si no hay vídeo: el árbol ya crecido, que aparece fundido. */}
        <img className="hero__still" src={withBase("/brand/hero-tree-poster-1920.webp")} alt="" decoding="async" />
        <video ref={video} className="hero__video" muted loop playsInline preload="auto">
          {/* Escalado con Real-ESRGAN desde el 720p original. Estas fuentes
              son para empezar a cargar antes del JavaScript en los
              navegadores que respetan media; después heroSrc() confirma la
              versión. Nombres nuevos a propósito: .htaccess cachea los
              vídeos un año como inmutables. */}
          <source media={TALL} src={withBase("/brand/hero-tree-portrait.mp4")} type="video/mp4" />
          <source media={WIDE} src={withBase("/brand/hero-tree-2560.mp4")} type="video/mp4" />
          <source src={withBase("/brand/hero-tree-1920.mp4")} type="video/mp4" />
        </video>
        <div className="hero__scrim" />
      </div>
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="t-label hero__eyebrow muted">{t.hero.eyebrow}</p>
          <WordReveal as="h1" id="hero-title" className="t-hero hero__title" text={t.hero.headline} onScroll="intro" delay={0.85} accent={1} />
        </div>
        <div className="hero__row" ref={row}>
          <div className="hero__support-group">
            <p className="t-lead hero__support muted">{t.hero.support}</p>
            <p className="t-small hero__tagline">{t.hero.tagline}</p>
          </div>
          <div className="hero__actions">
            <Link href="/contacto" className="btn-primary hero__cta">
              {t.cta}
              <ArrowRight />
            </Link>
            <Link href="/servicios" className="btn-ghost">
              {t.hero.secondary}
              <ArrowRight />
            </Link>
          </div>
        </div>
        <hr className="hairline hero__rule" />
        <div className="hero__meta">
          <span className="t-label dim hero__disciplines">{t.common.disciplines.join(" · ")}</span>
          <span className="t-label dim hero__scroll" aria-hidden="true">
            {t.common.scroll} <span className="hero__scroll-arrow">↓</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export function StudioStatement({ n }: { n?: number }) {
  const { t } = useI18n();
  const body = useReveal({ selector: "[data-r]", y: 24, stagger: 0.12 });
  const pillars = useReveal<HTMLUListElement>({ selector: ".pillar", y: 24, stagger: 0.1 });
  return (
    <section className="section section-lg band-indigo studio" id="estudio" aria-labelledby="studio-title">
      <div className="container studio__inner">
        <p className="t-label studio__eyebrow">{eyebrow(t.studioHome.eyebrow, n)}</p>
        <WordReveal as="h2" id="studio-title" className="t-display studio__title" text={t.studioHome.title} accent={1} />
        {/* La entradilla presenta los pilares; para quién trabajamos ya lo
            dice el hero y lo amplía /estudio. */}
        <div className="studio__body" ref={body}>
          <p className="t-lead" data-r>
            {t.studioHome.lead}
          </p>
          <p data-r>
            <Link href="/estudio" className="btn-ghost">
              {t.studioHome.link}
              <ArrowRight />
            </Link>
          </p>
        </div>
        <ul className="pillars" ref={pillars}>
          {t.studioHome.pillars.map((p, i) => (
            <li className="pillar" key={i}>
              {PILLAR_GLYPHS[i] ? (
                <div className="pillar__stage">
                  <Trace drawing={PILLAR_GLYPHS[i]} size="lg" />
                </div>
              ) : null}
              <h3 className="t-title pillar__title">{p.title}</h3>
              <p className="t-small muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Precio de salida de un servicio, igual en toda la web: "Desde 1490 €",
 * "Desde 390 €/mes" o "Precio personalizado". Siempre lleva "desde" porque
 * cada servicio tiene varios planes.
 */
export function StartingPrice({ slug, className }: { slug: ServiceSlug; className?: string }) {
  const { t, locale } = useI18n();
  const product = slugToProduct[slug];
  const p = startingPrice[product];
  const cls = `price-tag${className ? ` ${className}` : ""}`;
  if (p.custom) return <span className={cls}>{t.common.customPrice}</span>;
  const from = p.from || pricing[product].length > 1;
  return (
    <span className={cls}>
      {from ? <span className="price-tag__soft">{t.common.priceFrom} </span> : null}
      <span className="price-tag__amount">{formatPrice(p.amount, locale)}</span>
      {p.unit === "month" ? <span className="price-tag__soft">{t.common.perMonth}</span> : null}
    </span>
  );
}

/**
 * Home: casos de uso. Cada tarjeta cuenta un negocio, su reto y qué
 * hicimos, con enlaces a los servicios usados. Mientras un caso no sea real
 * lleva `pending` y se ve como un hueco por rellenar (borde discontinuo y
 * etiqueta «Pendiente»): no se inventan clientes ni resultados. La portada
 * no muestra la sección hasta que haya al menos un caso real (app/page.tsx).
 */
export function Cases({ n }: { n?: number }) {
  const { t } = useI18n();
  const c = t.cases;
  const list = useReveal<HTMLUListElement>({ selector: ".case", y: 24, stagger: 0.1 });
  const names: Record<string, string> = Object.fromEntries(t.servicePages.index.cards.map((card) => [card.slug, card.title]));
  return (
    <section className="section cases" id="casos" aria-labelledby="cases-title">
      <div className="container">
        <header className="section-head">
          <p className="t-label dim">{eyebrow(c.eyebrow, n)}</p>
          <WordReveal as="h2" id="cases-title" className="t-display" text={c.title} />
          <p className="t-lead muted">{c.lead}</p>
        </header>
        <ul className="cases__list" ref={list}>
          {c.items.map((item, i) => (
            <li className="case" key={i} data-pending={item.pending ? "" : undefined}>
              <div className="case__top">
                <span className="t-index case__index">{String(i + 1).padStart(2, "0")}</span>
                {item.pending ? <span className="t-label case__badge">{c.pending}</span> : null}
              </div>
              <p className="t-label dim">{item.sector}</p>
              <h3 className="t-card case__title">{item.title}</h3>
              <dl className="case__story">
                <div>
                  <dt className="t-label dim">{c.problem}</dt>
                  <dd className="t-small muted">{item.problem}</dd>
                </div>
                <div>
                  <dt className="t-label dim">{c.solution}</dt>
                  <dd className="t-small muted">{item.solution}</dd>
                </div>
              </dl>
              {item.services.length ? (
                <ul className="case__services">
                  {item.services.map((s) => (
                    <li key={s}>
                      <Link href={`/servicios/${s}`} className="case__chip">
                        {names[s] ?? s}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Home: los cuatro servicios, cada uno con su página. */
export function Services({ n }: { n?: number }) {
  const { t } = useI18n();
  const list = useReveal<HTMLUListElement>({ selector: ".service", y: 24, stagger: 0.1 });

  // El icono va centrado bajo su propio titular (su línea más larga, no la
  // columna). Se rehace con el tamaño y el idioma.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      el.querySelectorAll<HTMLElement>(".service__head").forEach((head) => {
        const title = head.querySelector(".service__title");
        if (!title) return;
        const range = document.createRange();
        range.selectNodeContents(title);
        const width = Math.max(0, ...Array.from(range.getClientRects(), (r) => r.width));
        head.style.setProperty("--title-w", `${width}px`);
      });
    };
    measure();
    // Con la fuente definitiva los titulares cambian de ancho.
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [list]);
  return (
    <section className="section services" id="servicios" aria-labelledby="services-title">
      <div className="container">
        {/* Cabecera con el enlace al catálogo a la derecha: antes iba al pie,
            solo en mucho espacio, y parecía una sección vacía. */}
        <div className="services__head">
          <header className="section-head">
            <p className="t-label dim">{eyebrow(t.services.eyebrow, n)}</p>
            <WordReveal as="h2" id="services-title" className="t-display" text={t.services.title} />
          </header>
          <Link href="/servicios" className="btn-ghost services__all">
            {t.services.all}
            <ArrowRight />
          </Link>
        </div>
        <ul className="services__list" ref={list}>
          {t.servicePages.index.cards.map((card, i) => {
            const slug = card.slug as ServiceSlug;
            const includes = t.servicePages[slugToProduct[slug]].includes.slice(0, 3);
            return (
              <li className="service" key={slug}>
                <Link href={`/servicios/${slug}`} className="service__inner" data-spot>
                  <span className="t-index service__index">{String(i + 1).padStart(2, "0")}</span>
                  <div className="service__head">
                    <h3 className="t-title service__title">{card.title}</h3>
                    {/* El icono, un solo trazo centrado bajo el titular. */}
                    <div className="service__wire" data-service={slug}>
                      <ServiceGlyph slug={slug} size="lg" className="service__glyph" />
                    </div>
                  </div>
                  <div className="service__body">
                    <p className="t-body muted">{card.body}</p>
                    <ul className="t-small service__includes">
                      {includes.map((item, j) => (
                        <li key={j}>
                          <Check />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="service__meta">
                      <StartingPrice slug={slug} className="t-small" />
                      <span className="link-cta">
                        {card.cta}
                        <ArrowRight />
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * El método. Con movimiento, la sección se fija y las cuatro fases pasan en
 * horizontal sobre un eje que se dibuja con el scroll (ApproachRail: en la
 * portada, una sola vez). Con movimiento reducido o sin JavaScript se ve la
 * línea de siempre: vertical en móvil, horizontal en escritorio, sin fijar.
 */
export function Approach({ n }: { n?: number }) {
  const { t } = useI18n();
  const ctas: Record<string, string> = Object.fromEntries(t.servicePages.index.cards.map((card) => [card.slug, card.cta]));
  const section = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const track = root.querySelector<HTMLElement>(".approach__track");
    const line = root.querySelector<HTMLElement>(".approach__line");
    const fill = root.querySelector<HTMLElement>(".approach__line-fill");
    const head = root.querySelector<HTMLElement>(".approach__line-head");
    const phases = Array.from(root.querySelectorAll<HTMLElement>(".phase"));
    const light = (p: HTMLElement, on: boolean) => {
      p.dataset.on = String(on);
      p.dataset.lit = String(on);
    };
    if (prefersReducedMotion()) {
      phases.forEach((p) => light(p, true));
      if (fill) fill.style.transform = "none";
      return;
    }
    // Desde 768 px manda la versión horizontal (ApproachRail); en móvil, esta
    // línea vertical. La luz arranca cuando «01» llega a un cuarto de
    // pantalla desde arriba y desde ahí baja a esa misma altura, la de
    // lectura: cada fase (punto y números) se enciende cuando la luz llega a
    // su punto y se apaga si se vuelve atrás. Antes arrancaba con la sección
    // aún abajo y encendía las fases antes de leerlas.
    registerGsap();
    const mm = gsap.matchMedia(root);
    mm.add("(max-width: 767px)", () => {
      if (!track || !line || !fill) return;
      // Dónde cae sobre la línea (px desde su arranque) el punto de cada fase
      // y el nacimiento de cada raicilla: la luz los enciende al pasar.
      const roots = phases.map((p) => p.querySelector<HTMLElement>(".phase__roots"));
      let marks: number[] = [];
      let rootMarks: number[] = [];
      const measure = () => {
        const top = line.offsetTop;
        marks = phases.map((p) => {
          const dot = p.querySelector<HTMLElement>(".phase__dot");
          return p.offsetTop + (dot ? dot.offsetTop + dot.offsetHeight / 2 : 0) - top;
        });
        rootMarks = phases.map((p, i) => p.offsetTop + (roots[i]?.offsetTop ?? 0) - top);
      };
      measure();
      const tween = gsap.fromTo(
        fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top 25%",
            end: "bottom 25%",
            scrub: 0.4,
            invalidateOnRefresh: true,
            onRefresh: measure,
          },
          onUpdate() {
            const progress = this.progress();
            const tip = progress * line.offsetHeight;
            if (head) {
              head.style.transform = `translate3d(0, ${tip}px, 0)`;
              head.style.opacity = progress > 0.001 && progress < 0.999 ? "1" : "0";
            }
            phases.forEach((p, i) => {
              const lit = progress > 0.001 && tip >= marks[i] - 2;
              if ((p.dataset.lit === "true") !== lit) light(p, lit);
              const r = roots[i];
              const grown = progress > 0.001 && (tip >= rootMarks[i] - 2 || progress > 0.995);
              if (r && (r.dataset.lit === "true") !== grown) r.dataset.lit = String(grown);
            });
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        phases.forEach((p) => light(p, false));
        roots.forEach((r) => r?.setAttribute("data-lit", "false"));
        if (head) head.style.opacity = "0";
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} className="section band-violet approach" id="metodo" aria-labelledby="approach-title">
      <ApproachRail section={section} eyebrow={eyebrow(t.approach.eyebrow, n)} />
      <div className="container approach__static" ref={ref}>
        <header className="section-head">
          <p className="t-label dim">{eyebrow(t.approach.eyebrow, n)}</p>
          <WordReveal as="h2" id="approach-title" className="t-display" text={t.approach.title} />
        </header>
        <MethodRoot variant="static" />
        <div className="approach__track">
          <div className="approach__line" aria-hidden="true">
            <span className="approach__line-fill" />
            <span className="approach__line-head" />
          </div>
          <ol className="approach__phases">
            {t.approach.items.map((item, i) => (
              <li className="phase" data-on="false" data-lit="false" data-n={String(i + 1).padStart(2, "0")} key={i}>
                <span className="phase__dot" aria-hidden="true" />
                <span className="t-index phase__index">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="phase__title">{item.title}</h3>
                <p className="t-small phase__body">{item.body}</p>
                {item.service ? (
                  <Link href={`/servicios/${item.service}`} className="link-cta phase__link">
                    {ctas[item.service]}
                    <ArrowRight />
                  </Link>
                ) : null}
                {/* Móvil: una raicilla sale de la línea en el hueco tras la
                    fase; en la última, donde acaba la línea, echa raíces. */}
                <Rootlets shape={i === t.approach.items.length - 1 ? "tail" : "side"} trigger="lit" className="phase__roots" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Cierre de página: el contacto, en la banda más luminosa. En la portada lleva número. */
export function FinalCTA({ n }: { n?: number }) {
  const { t } = useI18n();
  const tail = useReveal({ selector: "[data-r]", y: 20, stagger: 0.1 });
  return (
    <section className="section section-lg band-aurora final-cta" aria-labelledby="cta-title">
      <div className="container final-cta__inner" ref={tail}>
        <div className="final-cta__marks">
          <p className="t-label final-cta__eyebrow">{eyebrow(t.finalCta.eyebrow, n)}</p>
        </div>
        <WordReveal as="h2" id="cta-title" className="t-hero final-cta__title" text={t.finalCta.title} accent={1} />
        {/* Una sola entradilla: que respondemos siempre lo cuenta el paso 2. */}
        <div className="final-cta__copy">
          <p className="t-lead" data-r>
            {t.finalCta.lead}
          </p>
        </div>
        <div className="final-cta__contact" data-r>
          <Link href="/contacto" className="btn-primary">
            {t.cta}
            <ArrowRight />
          </Link>
          <div className="final-cta__mail">
            <p className="t-label dim">{t.finalCta.mailLabel}</p>
            <CopyEmail email={site.email} />
          </div>
        </div>
        <NextSteps className="final-cta__next" />
      </div>
    </section>
  );
}

/** Qué pasa después de escribirnos: tres pasos unidos por un hilo y la disponibilidad. */
export function NextSteps({ className }: { className?: string }) {
  const { t } = useI18n();
  const list = useReveal<HTMLDivElement>({ selector: ".next-step", y: 20, stagger: 0.1 });
  const flow = useRef<HTMLDivElement>(null);
  useStepWire(flow, `wire${useId().replace(/[^\w-]/g, "")}`);
  return (
    <div className={`next-steps${className ? ` ${className}` : ""}`} ref={list}>
      <h3 className="t-label dim">{t.finalCta.nextTitle}</h3>
      <div className="next-steps__flow" ref={flow}>
        <ol className="next-steps__list">
          {t.finalCta.next.map((step, i) => (
            <li className="next-step" key={i}>
              {STEP_GLYPHS[i] ? <Trace drawing={STEP_GLYPHS[i]} size="glyph" className="next-step__glyph" /> : null}
              <span className="t-index next-step__index">{String(i + 1).padStart(2, "0")}</span>
              <p className="next-step__title">{step.title}</p>
              <p className="t-small muted">{step.body}</p>
            </li>
          ))}
        </ol>
        {/* Encima de la lista: el pulso pasa por delante de los iconos. Lo dibuja useStepWire. */}
        <svg className="next-steps__wire" aria-hidden="true" focusable="false" />
      </div>
      <p className="t-small next-steps__availability">
        <span className="next-steps__pulse" aria-hidden="true" />
        {t.finalCta.availability}
      </p>
    </div>
  );
}
