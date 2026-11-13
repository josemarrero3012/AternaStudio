"use client";

// Secciones de la portada (estudio, método, casos y servicios). Van aparte
// de sections.tsx para que el resto de páginas no las descarguen.

import { useEffect, useRef } from "react";
import { Link, useI18n } from "@/lib/i18n";
import { gsap, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { useReveal } from "@/lib/reveal";
import { PILLAR_GLYPHS } from "./glyphs";
import { ArrowRight, Check } from "./icons";
import { ApproachRail } from "./ApproachRail";
import { MethodRoot } from "./MethodRoot";
import { Rootlets } from "./Rootlets";
import { ServiceGlyph } from "./ServiceTrace";
import { Trace } from "./Trace";
import { WordReveal } from "./WordReveal";
import { StartingPrice, eyebrow } from "./sections";


export function StudioStatement({ n }: { n?: number }) {
  const { t } = useI18n();
  const body = useReveal({ selector: "[data-r]", y: 24, stagger: 0.12 });
  const pillars = useReveal<HTMLUListElement>({ selector: ".pillar", y: 24, stagger: 0.1 });
  return (
    <section className="section section-lg band-indigo studio" id="estudio" aria-labelledby="studio-title">
      <div className="container studio__inner">
        <p className="t-label eyebrow studio__eyebrow">{eyebrow(t.studioHome.eyebrow, n)}</p>
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
            <li className={`pillar aurora-card${i % 2 ? " aurora-card--soft" : ""}`} key={i}>
              <h3 className="t-title pillar__title">{p.title}</h3>
              <p className="t-small pillar__body">{p.body}</p>
              {PILLAR_GLYPHS[i] ? (
                <div className="pillar__stage aurora-panel">
                  <Trace drawing={PILLAR_GLYPHS[i]} size="xl" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
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
          <p className="t-label dim eyebrow">{eyebrow(c.eyebrow, n)}</p>
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
  const list = useReveal<HTMLUListElement>({ selector: ".service", y: 32, stagger: 0.1 });
  return (
    <section className="section services" id="servicios" aria-labelledby="services-title">
      <div className="container">
        {/* Cabecera con el enlace al catálogo a la derecha: antes iba al pie,
            solo en mucho espacio, y parecía una sección vacía. */}
        <div className="services__head">
          <header className="section-head">
            <p className="t-label dim eyebrow">{eyebrow(t.services.eyebrow, n)}</p>
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
                {/* Misma tarjeta que los pilares de «Estudio»: texto arriba,
                    el dibujo del servicio en el panel negro y, debajo, qué
                    incluye y el precio. En rejilla de 2×2, la intensidad del
                    marco alterna en damero. */}
                <Link href={`/servicios/${slug}`} className={`service__inner aurora-card${i === 1 || i === 2 ? " aurora-card--soft" : ""}`} data-spot>
                  <div className="service__head">
                    <span className="t-index service__index">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="t-title service__title">{card.title}</h3>
                  </div>
                  <p className="service__lead">{card.body}</p>
                  <div className="service__wire aurora-panel" data-service={slug}>
                    <ServiceGlyph slug={slug} size="xl" className="service__glyph" />
                  </div>
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
          <p className="t-label dim eyebrow">{eyebrow(t.approach.eyebrow, n)}</p>
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

