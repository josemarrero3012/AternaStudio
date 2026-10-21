"use client";

// «Casos de éxito» (sección «Trabajo»): los proyectos, presentados con las
// piezas de la propia web. Si work.badge (dict.ts) lleva texto, cada caso
// muestra esa insignia (por ejemplo, «Prototipo»).
// Cada uno va en un marco de navegador hecho con CSS (no es una imagen): la
// captura de la página entera baja despacio al pasar el puntero, un móvil
// asoma por la esquina y su firma se dibuja con Trace, como los servicios.
// La web real solo se carga si se pide (LivePreview): así la portada no
// arrastra dos webs ajenas.
//
// Es una vista previa para el equipo: las páginas van con noindex y fuera
// del sitemap (ver app/(es)/trabajo y app/[lang]/trabajo).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { withBase } from "@/lib/base";
import type { Dict } from "@/lib/dict";
import { Link, useI18n } from "@/lib/i18n";
import { useReveal } from "@/lib/reveal";
import { shortUrl, work, workBySlug, type WorkProject, type WorkSlug } from "@/lib/work";
import { WORK_GLYPHS } from "./glyphs";
import { ArrowExternal, ArrowRight } from "./icons";
import { FinalCTA } from "./sections";
import { Trace } from "./Trace";
import { WordReveal } from "./WordReveal";

type Item = Dict["work"]["items"][number];

const fill = (text: string, name: string) => text.replace("{name}", name);

/** "03 — Trabajo": como el resto de secciones de la portada. */
const eyebrow = (text: string, n?: number) => (n ? `${String(n).padStart(2, "0")} — ${text}` : text);

/** Marco de navegador: tres filetes, la dirección en una píldora y la web dentro. */
export function BrowserFrame({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`frame${className ? ` ${className}` : ""}`}>
      <div className="frame__bar" aria-hidden="true">
        <span className="frame__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="frame__url">{shortUrl(url)}</span>
      </div>
      <div className="frame__view">{children}</div>
    </div>
  );
}

/** Móvil: el mismo vidrio, con la captura de la primera pantalla. */
function Phone({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`phone${className ? ` ${className}` : ""}`}>
      <img src={withBase(src)} alt={alt} width={780} height={1688} loading="lazy" decoding="async" />
    </div>
  );
}

/**
 * Captura de la página entera en una ventana de 1440 × 900: al pasar el
 * puntero por la fila (o al enfocar su enlace) baja hasta el final, a una
 * velocidad que depende de lo larga que sea.
 */
function ScrollShot({ project, alt }: { project: WorkProject; alt: string }) {
  const style = {
    "--shot-travel": `${-(1 - 900 / project.desktopH) * 100}%`,
    "--shot-dur": `${(project.desktopH / 650).toFixed(1)}s`,
  } as CSSProperties;
  return (
    <img
      className="shot"
      src={withBase(project.shots.desktop)}
      alt={alt}
      width={1440}
      height={project.desktopH}
      loading="lazy"
      decoding="async"
      style={style}
    />
  );
}

/** Una fila del escaparate: el marco a un lado y la historia al otro. */
function WorkRow({ item, index, heading }: { item: Item; index: number; heading: "h2" | "h3" }) {
  const { t } = useI18n();
  const project = workBySlug[item.slug as WorkSlug];
  const Heading = heading;
  const href = `/trabajo/${item.slug}`;
  return (
    <article className="work-row" data-flip={index % 2 ? "" : undefined}>
      {/* La imagen repite el enlace del caso: fuera del tabulador y del lector. */}
      <Link href={href} className="work-row__media" tabIndex={-1} aria-hidden="true">
        <BrowserFrame url={project.url}>
          <ScrollShot project={project} alt="" />
        </BrowserFrame>
        <Phone src={project.shots.mobile} alt="" className="work-row__phone" />
      </Link>
      <div className="work-row__copy">
        <div className="work-row__top">
          <span className="t-index work-row__index">{String(index + 1).padStart(2, "0")}</span>
          {t.work.badge ? <span className="t-label work-badge">{t.work.badge}</span> : null}
        </div>
        <p className="t-label dim">{item.sector}</p>
        <Heading className="t-title work-row__title">{item.name}</Heading>
        <p className="t-body muted">{item.summary}</p>
        <ul className="work-facts">
          {item.facts.map((fact, i) => (
            <li key={i} className="t-small">
              {fact}
            </li>
          ))}
        </ul>
        <div className="work-row__glyph">
          <Trace drawing={WORK_GLYPHS[item.slug]} size="md" />
        </div>
        <div className="work-row__actions">
          <Link href={href} className="btn-ghost">
            {t.work.more}
            <ArrowRight />
          </Link>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="link-cta">
            {t.work.live}
            <ArrowExternal size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}

function WorkList({ heading }: { heading: "h2" | "h3" }) {
  const { t } = useI18n();
  const list = useReveal<HTMLDivElement>({ selector: ".work-row", y: 32, stagger: 0.12 });
  return (
    <div className="work-list" ref={list}>
      {t.work.items.map((item, i) => (
        <WorkRow item={item} index={i} heading={heading} key={item.slug} />
      ))}
    </div>
  );
}

/** Portada: la sección «Trabajo», tras el método. */
export function WorkSection({ n }: { n?: number }) {
  const { t } = useI18n();
  return (
    <section className="section band-indigo work" id="trabajo" aria-labelledby="work-title">
      <div className="container">
        <div className="work__head">
          <header className="section-head">
            <p className="t-label dim">{eyebrow(t.work.eyebrow, n)}</p>
            <WordReveal as="h2" id="work-title" className="t-display" text={t.work.title} />
            <p className="t-lead muted">{t.work.lead}</p>
          </header>
          <Link href="/trabajo" className="btn-ghost work__all">
            {t.work.all}
            <ArrowRight />
          </Link>
        </div>
        <WorkList heading="h3" />
      </div>
    </section>
  );
}

// /trabajo ------------------------------------------------------------------

export function WorkIndexContent() {
  const { t } = useI18n();
  return (
    <>
      <section className="container page-head page-head--lit">
        <p className="t-label dim page-head__eyebrow">{t.work.eyebrow}</p>
        <WordReveal as="h1" className="t-display" text={t.work.title} onScroll={false} delay={0.1} />
        <p className="t-lead muted page-head__lead">{t.work.lead}</p>
      </section>
      <section className="section section--flush-top band-indigo work" aria-label={t.work.eyebrow}>
        <div className="container">
          <WorkList heading="h2" />
        </div>
      </section>
      <FinalCTA />
    </>
  );
}

// /trabajo/<slug> -----------------------------------------------------------

/**
 * La web real dentro de la página, a escala: en escritorio se pinta a
 * 1280 px y se reduce al ancho disponible; en móvil, a 390 px dentro del
 * marco de teléfono. No se carga hasta que se pide.
 */
function LivePreview({ project, name }: { project: WorkProject; name: string }) {
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // El marco toma su proporción del CSS (aspect-ratio); aquí solo se escala
  // la web cargada para que quepa en él.
  const view = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const base = device === "desktop" ? { w: 1280, h: 800 } : { w: 390, h: 760 };

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / base.w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [base.w]);

  return (
    <div className="live">
      <div className="live__bar">
        <div className="live__devices" role="group" aria-label={t.work.previewTitle}>
          {(["desktop", "mobile"] as const).map((d) => (
            <button key={d} type="button" className="live__device" aria-pressed={device === d} onClick={() => setDevice(d)}>
              {t.work[d]}
            </button>
          ))}
        </div>
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="link-cta">
          {t.work.live}
          <ArrowExternal size={13} />
        </a>
      </div>
      <div className="live__stage">
        <div className={device === "desktop" ? "frame live__frame" : "phone live__phone"}>
          {device === "desktop" ? (
            <div className="frame__bar" aria-hidden="true">
              <span className="frame__dots">
                <i />
                <i />
                <i />
              </span>
              <span className="frame__url">{shortUrl(project.url)}</span>
            </div>
          ) : null}
          <div className="live__viewport" ref={view}>
            {on ? (
              <iframe
                src={project.url}
                title={fill(t.work.frameLabel, name)}
                width={base.w}
                height={base.h}
                style={{ transform: `scale(${scale})` }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="live__poster">
                <img
                  src={withBase(device === "desktop" ? project.shots.desktop : project.shots.mobile)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <button type="button" className="btn-primary live__open" onClick={() => setOn(true)}>
                  {t.work.previewOpen}
                  <ArrowRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkCaseContent({ slug }: { slug: WorkSlug }) {
  const { t } = useI18n();
  const items = t.work.items;
  const index = items.findIndex((i) => i.slug === slug);
  const item = items[index];
  const next = items[(index + 1) % items.length];
  const project = workBySlug[slug];
  const names: Record<string, string> = Object.fromEntries(t.servicePages.index.cards.map((c) => [c.slug, c.title]));
  const features = useReveal<HTMLUListElement>({ selector: ".work-feature", y: 24, stagger: 0.1 });
  const alt = fill(t.work.shotAlt, item.name);

  return (
    <>
      <section className="container page-head page-head--lit work-head">
        <nav aria-label="Breadcrumb" className="t-label crumbs page-head__eyebrow">
          <ol>
            <li>
              <Link href="/trabajo" className="link-underline">
                {t.work.eyebrow}
              </Link>
            </li>
            <li aria-current="page">{item.name}</li>
          </ol>
        </nav>
        <div className="work-head__title">
          <WordReveal as="h1" className="t-display" text={item.name} onScroll={false} delay={0.1} />
          {t.work.badge ? <span className="t-label work-badge">{t.work.badge}</span> : null}
        </div>
        <p className="t-lead muted work-head__lead">{item.summary}</p>
        <dl className="work-meta">
          <div>
            <dt className="t-label dim">{item.sector.split(" · ")[0]}</dt>
            <dd className="t-small">{item.sector.split(" · ").slice(1).join(" · ")}</dd>
          </div>
          <div>
            <dt className="t-label dim">{t.work.stack}</dt>
            <dd className="t-small">{project.stack.join(" · ")}</dd>
          </div>
          <div>
            <dt className="t-label dim">{t.work.services}</dt>
            <dd className="work-meta__chips">
              {project.services.map((s) => (
                <Link key={s} href={`/servicios/${s}`} className="case__chip">
                  {names[s]}
                </Link>
              ))}
            </dd>
          </div>
          <div className="work-meta__links">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
              {t.work.live}
              <ArrowExternal size={13} />
            </a>
            <a href={project.repo} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              {t.work.code}
              <ArrowExternal size={13} />
            </a>
          </div>
        </dl>
      </section>

      {/* La web entera en su marco, a todo el ancho del contenido. */}
      <section className="container work-hero" aria-label={alt}>
        <div className="work-hero__media">
          <BrowserFrame url={project.url} className="work-hero__frame">
            <ScrollShot project={project} alt={alt} />
          </BrowserFrame>
          <Phone src={project.shots.mobile} alt="" className="work-hero__phone" />
        </div>
      </section>

      <section className="section band-indigo" aria-labelledby="work-story">
        <div className="container work-story">
          <h2 id="work-story" className="sr-only">
            {t.work.problem} · {t.work.solution}
          </h2>
          <div className="work-story__glyph">
            <Trace drawing={WORK_GLYPHS[slug]} size="lg" />
          </div>
          <dl className="work-story__list">
            <div>
              <dt className="t-label dim">{t.work.problem}</dt>
              <dd className="t-lead">{item.problem}</dd>
            </div>
            <div>
              <dt className="t-label dim">{t.work.solution}</dt>
              <dd className="t-body muted-strong">{item.solution}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section container" aria-labelledby="work-features">
        <header className="section-head">
          <WordReveal as="h2" id="work-features" className="t-display" text={t.work.featuresTitle} />
        </header>
        <ul className="work-features" ref={features}>
          {item.features.map((f, i) => (
            <li className="work-feature" key={i}>
              <span className="t-index work-feature__index">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-card">{f.title}</h3>
              <p className="t-small muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section--flush-top container" aria-labelledby="work-gallery">
        <h2 id="work-gallery" className="t-label dim work-gallery__title">
          {t.work.galleryTitle}
        </h2>
        <div className="work-gallery">
          <BrowserFrame url={project.url} className="work-gallery__frame">
            <img src={withBase(project.shots.detail)} alt={alt} width={1440} height={900} loading="lazy" decoding="async" />
          </BrowserFrame>
          <Phone src={project.shots.mobile} alt={alt} className="work-gallery__phone" />
        </div>
      </section>

      <section className="section band-violet" aria-labelledby="work-live">
        <div className="container">
          <header className="section-head">
            <WordReveal as="h2" id="work-live" className="t-display" text={t.work.previewTitle} />
            <p className="t-lead muted">{t.work.previewLead}</p>
          </header>
          <LivePreview project={project} name={item.name} />
        </div>
      </section>

      <section className="section container work-next" aria-label={t.work.next}>
        <Link href={`/trabajo/${next.slug}`} className="work-next__link" data-spot>
          <span className="t-label dim">{t.work.next}</span>
          <span className="t-display work-next__name">
            {next.name}
            <ArrowRight size={32} />
          </span>
          <span className="t-small muted">{next.sector}</span>
        </Link>
      </section>

      <FinalCTA />
    </>
  );
}

export const workSlugs = work.map((p) => p.slug);
