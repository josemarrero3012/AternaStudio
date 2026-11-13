"use client";

// Contenido de cada página. Los textos salen del idioma de la ruta (ver
// LanguageProvider): cada idioma se exporta ya traducido.

import { withBase } from "@/lib/base";
import { useEffect, useState } from "react";
import { Link, useI18n } from "@/lib/i18n";
import { useReveal } from "@/lib/reveal";
import { formatPrice, pricing, slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { growthRings } from "@/lib/rings";
import { site } from "@/lib/site";
import { BeliefArt } from "./BeliefArt";
import { CopyEmail } from "./CopyEmail";
import { whatsappHref } from "./Chrome";
import { ArrowDown, ArrowExternal, ArrowRight } from "./icons";
import { FinalCTA, StartingPrice } from "./sections";
import { ServiceGlyph } from "./ServiceTrace";
import { WordReveal } from "./WordReveal";

// /servicios ----------------------------------------------------------------

/**
 * El catálogo, con la raíz de las fichas: los cuatro servicios cuelgan de
 * ella como filas grandes (dibujo, qué es, cómo se paga y desde cuánto), sin
 * tarjetas de color; la raíz acaba en la llamada final. Ver styles/servicio.css.
 */
export function ServiciosContent() {
  const { t } = useI18n();
  const page = t.servicePages.index;
  const [h1a, h1b = ""] = page.h1.split("\n");
  return (
    <div className="raiz">
      <div className="container">
        <div className="raiz__tronco">
          <div className="raiz__linea" aria-hidden="true">
            <span className="raiz__luz" />
          </div>

          <section className="tramo r-head">
            <h1 className="r-h1">
              <span>{h1a}</span> <span>{h1b}</span>
            </h1>
            <p className="r-lead r-head__lead">{page.lead}</p>
          </section>

          <section className="tramo r-catalog-wrap" aria-labelledby="catalogo">
            <h2 className="sr-only" id="catalogo">
              {page.eyebrow}
            </h2>
            <ul className="r-catalog">
              {page.cards.map((card) => {
                const slug = card.slug as ServiceSlug;
                return (
                  <li key={slug} className="nodo">
                    <Link href={`/servicios/${slug}`} className="r-service">
                      <span className="r-service__art">
                        <ServiceGlyph slug={slug} size="xl" />
                      </span>
                      <span className="r-service__text">
                        <h3 className="r-service__name">{card.title}</h3>
                        <span className="r-service__body">{card.body}</span>
                      </span>
                      <span className="r-service__meta">
                        <span className="r-service__kicker">{card.kicker}</span>
                        <StartingPrice slug={slug} className="r-service__price" />
                        <span className="r-service__cta">
                          {card.cta}
                          <ArrowRight />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="raiz__cabo" aria-hidden="true" />
        </div>
        <RaizEnd />
      </div>
    </div>
  );
}

/** Los tres pasos de «Qué pasa después», con la numeración de la raíz. */
function RaizNext({ heading: Heading = "h3", node = false }: { heading?: "h2" | "h3"; node?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="r-next">
      <Heading className={`r-next__title${node ? " nodo" : ""}`}>{t.finalCta.nextTitle}</Heading>
      <ol className="r-next__list">
        {t.finalCta.next.map((step, i) => (
          <li key={i}>
            <span className="r-n">{i + 1}</span>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>
      <p className="r-next__note">{t.finalCta.availability}</p>
    </div>
  );
}

/** Donde acaba la raíz: la llamada final de las páginas con raíz. */
function RaizEnd() {
  const { t } = useI18n();
  return (
    <section className="tramo r-end" aria-labelledby="fin-titulo">
      <h2 className="r-end__title nodo nodo--fin" id="fin-titulo">
        {t.finalCta.title.split("\n").map((line, i) => (
          <span key={i}>{line} </span>
        ))}
      </h2>
      <div className="r-end__row">
        <p className="r-lead">{t.finalCta.lead}</p>
        <div className="r-end__actions">
          <Link href="/contacto" className="btn-primary">
            {t.cta}
            <ArrowRight />
          </Link>
          <p className="r-end__mail">
            {t.finalCta.mailLabel}:{" "}
            <a className="link-underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
        </div>
      </div>
      <RaizNext />
    </section>
  );
}

// /servicios/<slug> -----------------------------------------------------------

/**
 * Ficha de un servicio («Raíz»). La página sigue una raíz de luz que baja
 * desde el árbol del logo: cada bloque se agarra a ella con un nodo, una luz
 * la recorre con el scroll (es posición, no animación) y la raíz acaba en la
 * llamada final. Los planes son anillos de crecimiento: cada plan contiene al
 * anterior. Elegir un plan enciende sus anillos y cambia la llamada; funciona
 * sin JavaScript (radios y :has(), ver styles/servicio.css). Todo el texto
 * se ve desde el primer momento, sin esperar a ninguna entrada.
 */
export function ServiceProductContent({ slug }: { slug: ServiceSlug }) {
  const { t, locale } = useI18n();
  const product = slugToProduct[slug];
  const page = t.servicePages[product];
  const prices = pricing[product];
  const cards = t.servicePages.index.cards;
  const card = cards.find((c) => c.slug === slug)!;
  const [h1a, h1b = ""] = page.h1.split("\n");
  // Solo en diseño web «Qué incluye» es un orden (de la auditoría a la
  // entrega): ahí lleva números. En los demás es una lista.
  const ordered = product === "web";
  const featured = Math.max(0, page.plans.findIndex((p) => p.featured));
  const tiers = growthRings(page.plans.length);
  const planHref = (name: string) =>
    `/contacto?mensaje=${encodeURIComponent(t.common.planMessage.replace("{plan}", name).replace("{service}", card.title))}`;

  return (
    <div className="raiz">
      <div className="container">
        <div className="raiz__tronco">
          <div className="raiz__linea" aria-hidden="true">
            <span className="raiz__luz" />
          </div>

          <section className="tramo r-head">
            <nav className="r-crumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link href="/servicios" className="link-underline">
                    {t.servicePages.index.eyebrow}
                  </Link>
                </li>
                <li aria-current="page">{card.title}</li>
              </ol>
            </nav>
            <h1 className="r-h1">
              <span>{h1a}</span> <span>{h1b}</span>
            </h1>
            <div className="r-head__grid">
              <div>
                <p className="r-lead">{page.lead}</p>
                <div className="r-offer">
                  <p className="r-price">
                    <StartingPrice slug={slug} />
                    <span className="r-price__unit">{card.kicker}</span>
                  </p>
                  <div className="r-offer__actions">
                    <Link href="/contacto" className="btn-primary">
                      {t.cta}
                      <ArrowRight />
                    </Link>
                    <a href="#planes" className="btn-ghost">
                      {t.common.seePlans}
                      <ArrowDown />
                    </a>
                  </div>
                </div>
              </div>
              <div className="r-head__art">
                <ServiceGlyph slug={slug} size="xl" />
              </div>
            </div>
          </section>

          <section className="tramo r-statement" aria-label={t.common.overview}>
            {page.intro.map((p, i) => (
              <p key={i} className={i === 0 ? "nodo" : "r-statement__more"}>
                {p}
              </p>
            ))}
          </section>

          <section className="tramo" aria-labelledby="incluye">
            <h2 className="r-h2 nodo" id="incluye">
              {page.includesTitle}
            </h2>
            <ul className={`r-steps${ordered ? " r-steps--ordered" : ""}`}>
              {page.includes.map((item, i) => (
                <li key={i}>
                  {ordered ? <span className="r-n">{i + 1}</span> : null}
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {page.report ? (
            <section className="tramo" aria-labelledby="informe">
              <h2 className="r-h2 nodo" id="informe">
                {page.reportTitle}
              </h2>
              <p className="r-report">{page.report}</p>
              {page.examples.length > 0 ? (
                <>
                  <p className="r-note r-report__lead">{page.examplesLead}</p>
                  <ul className="r-index">
                    {page.examples.map((ex, i) => (
                      <li key={i}>
                        <a className="r-row" href={withBase(ex.href)} target="_blank" rel="noopener noreferrer">
                          <span className="r-row__name">
                            {ex.title}
                            <ArrowExternal />
                          </span>
                          <span className="r-row__body">{ex.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ) : null}

          <section className="tramo r-plans" id="planes" aria-labelledby="planes-titulo">
            <header className="r-plans__head">
              <h2 className="r-h2 nodo" id="planes-titulo">
                {page.plansTitle}
              </h2>
              <p className="r-note">{page.plansNote}</p>
            </header>
            <div className="r-plans__grid">
              <figure className="r-rings" aria-hidden="true">
                <svg viewBox="0 0 400 400" focusable="false">
                  {tiers.map((tier) => (
                    <g key={tier.level} className="anillo" data-nivel={tier.level}>
                      {tier.rings.map((d, j) => (
                        <path key={j} d={d} className={j === tier.rings.length - 1 ? "anillo__borde" : undefined} />
                      ))}
                    </g>
                  ))}
                  <circle className="r-rings__halo" cx="200" cy="200" r="16" />
                  <circle className="r-rings__pith" cx="200" cy="200" r="3.5" />
                </svg>
                <figcaption>{t.common.plansContain}</figcaption>
              </figure>

              <fieldset className="r-plans__list">
                <legend className="sr-only">{page.plansTitle}</legend>
                {page.plans.map((plan, i) => {
                  const p = prices[i];
                  const id = `plan-${i + 1}`;
                  return (
                    <div className="r-plan" data-nivel={i + 1} key={i}>
                      <input className="r-plan__radio" type="radio" name="plan" id={id} value={plan.name} defaultChecked={i === featured} />
                      <h3 className="r-plan__name">
                        <label htmlFor={id}>{plan.name}</label>
                        {plan.featured ? <span className="r-plan__flag">{t.common.recommended}</span> : null}
                      </h3>
                      <p className="r-plan__price">
                        {p.custom ? (
                          <span className="r-plan__text">{t.common.customPrice}</span>
                        ) : (
                          <>
                            {p.from ? <span>{t.common.priceFrom} </span> : null}
                            {formatPrice(p.amount, locale)}
                            {p.unit === "month" ? <span>{t.common.perMonth}</span> : <span className="r-plan__unit">{t.common.oncePayment}</span>}
                          </>
                        )}
                      </p>
                      <p className="r-plan__tagline">{plan.tagline}</p>
                      <ul className="r-plan__features">
                        {plan.features.map((f, j) => (
                          <li key={j}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {/* Con :has(), solo se ve la llamada del plan elegido; sin él,
                    la genérica. Cada una deja el plan escrito en el formulario. */}
                <p className="r-plans__cta">
                  {page.plans.map((plan, i) => (
                    <Link key={i} href={planHref(plan.name)} className="btn-primary" data-plan={i + 1}>
                      {t.common.startWith.replace("{plan}", plan.name)}
                      <ArrowRight />
                    </Link>
                  ))}
                  <Link href="/contacto" className="btn-primary" data-plan="0">
                    {t.cta}
                    <ArrowRight />
                  </Link>
                </p>
              </fieldset>
            </div>
          </section>

          <section className="tramo" aria-labelledby="faq">
            <h2 className="r-h2 nodo" id="faq">
              {page.faqTitle}
            </h2>
            <dl className="r-faq">
              {page.faq.map((item, i) => (
                <div key={i}>
                  <dt>{item.q}</dt>
                  <dd>{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="tramo" aria-labelledby="otros">
            <h2 className="r-h2 nodo" id="otros">
              {t.common.otherServices}
            </h2>
            <ul className="r-index">
              {cards
                .filter((c) => c.slug !== slug)
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={`/servicios/${c.slug}`} className="r-row r-row--service">
                      <span className="r-row__art">
                        <ServiceGlyph slug={c.slug as ServiceSlug} size="xl" />
                      </span>
                      <span className="r-row__name">{c.title}</span>
                      <span className="r-row__body">{c.body}</span>
                      <StartingPrice slug={c.slug as ServiceSlug} className="r-row__price" />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>

          <div className="raiz__cabo" aria-hidden="true" />
        </div>

        <RaizEnd />
      </div>
    </div>
  );
}

// /estudio ------------------------------------------------------------------

export function EstudioContent() {
  const { t } = useI18n();
  const page = t.pages.estudio;
  const manifesto = useReveal<HTMLOListElement>({ selector: ".belief", y: 32, stagger: 0.12 });
  return (
    <>
      <section className="container page-head">
        <p className="t-label dim eyebrow page-head__eyebrow">{page.eyebrow}</p>
        <WordReveal as="h1" className="t-display" text={page.h1} onScroll={false} delay={0.1} />
      </section>
      <section className="section band-indigo estudio-about" aria-label={page.eyebrow}>
        <div className="container estudio__grid">
          <p className="t-lead estudio__lead">{page.prose[0]}</p>
          <div className="prose estudio__prose">
            <p className="t-body muted-strong">{page.prose[1]}</p>
            <p className="t-body muted-strong">{page.prose[2]}</p>
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="beliefs-title">
        <div className="container">
          <header className="section-head">
            <WordReveal as="h2" id="beliefs-title" className="t-display" text={page.beliefsTitle} />
          </header>
          {/* Manifiesto: una raíz de luz baja por el centro y las creencias
              alternan de lado, con su ilustración en un escenario propio. */}
          <ol className="manifesto" ref={manifesto}>
            {page.beliefs.map((b, i) => (
              <li className="belief" key={i}>
                {/* El dibujo, en el panel negro de una tarjeta de marca. */}
                <div className={`belief__stage aurora-card${i % 2 ? " aurora-card--soft" : ""}`}>
                  <div className="belief__panel aurora-panel">
                    <BeliefArt index={i} />
                  </div>
                </div>
                <div className="belief__copy">
                  <span className="t-index belief__index">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-title belief__title">{b.title}</h3>
                  <p className="t-body muted belief__body">{b.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* Lo que creemos, aplicado: el método está en la portada. */}
          <div className="section-foot">
            <Link href="/#metodo" className="btn-ghost">
              {t.approach.link}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}

// /contacto -----------------------------------------------------------------

type FormState = "idle" | "sending" | "sent" | "error";

function ContactForm() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // trampa para bots
  const [state, setState] = useState<FormState>("idle");
  const sending = state === "sending";

  // El asistente puede traer el mensaje ya escrito (/contacto?mensaje=…).
  useEffect(() => {
    const draft = new URLSearchParams(window.location.search).get("mensaje");
    if (draft) setMessage(draft.slice(0, 2000));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    setState("sending");
    try {
      const res = await fetch("/contacto.php", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, consent, company }),
      });
      if (!res.ok || (await res.json())?.ok !== true) throw new Error("request_failed");
      // reset() nativo: además de vaciar, olvida que los campos se tocaron y
      // así no aparecen marcados como inválidos tras un envío correcto.
      form.reset();
      setState("sent");
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
    } catch {
      setState("error");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  // El texto de reposo ya está en la columna izquierda; aquí solo el estado.
  const note = state === "sent" ? t.contactForm.sent : state === "error" ? t.contactForm.error : "";

  return (
    // El formulario, en el panel negro de una tarjeta de marca.
    <div className="contact-frame aurora-card">
      <form className="contact-form aurora-panel" onSubmit={onSubmit} aria-busy={sending}>
        <div className="contact-form__field">
          <label htmlFor="cf-name">{t.contactForm.name}</label>
          <input id="cf-name" name="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={sending} />
        </div>
        <div className="contact-form__field">
          <label htmlFor="cf-email">{t.contactForm.email}</label>
          <input id="cf-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sending} />
        </div>
        <div className="contact-form__field">
          <label htmlFor="cf-message">{t.contactForm.message}</label>
          <textarea id="cf-message" name="message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} />
        </div>
        <fieldset className="contact-form__consent">
          <legend>
            {t.contactForm.consentLegend} <span aria-hidden="true">*</span>
          </legend>
          <label htmlFor="cf-consent">
            <input id="cf-consent" name="consent" type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={sending} />
            <span>
              {t.contactForm.consentText} {t.contactForm.consentMore}{" "}
              <Link href={t.contactForm.consentHref} className="link-underline">
                {t.contactForm.consentLink}
              </Link>
              .
            </span>
          </label>
        </fieldset>
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="contact-form__trap"
        />
        <div className="contact-form__footer">
          <button type="submit" className="btn-primary contact-form__submit" disabled={sending}>
            {sending ? t.contactForm.sending : t.contactForm.submit}
            {!sending ? <ArrowRight /> : null}
          </button>
          <p className="t-small contact-form__note" data-state={state} role="status" aria-live="polite">
            {note}
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * Contacto con la raíz: baja por la columna del texto (titular, canales y
 * qué pasa después). El formulario conserva su tarjeta de marca: es la
 * acción de la página.
 */
export function ContactoContent() {
  const { t } = useI18n();
  const page = t.pages.contacto;
  const [h1a, h1b = ""] = page.h1.split("\n");
  return (
    <div className="raiz">
      <div className="container">
        <div className="raiz__tronco c-raiz">
          <div className="raiz__linea" aria-hidden="true">
            <span className="raiz__luz" />
          </div>
          <div className="c-raiz__copy">
            <section className="tramo r-head">
              <h1 className="r-h1">
                <span>{h1a}</span> <span>{h1b}</span>
              </h1>
              <p className="r-lead r-head__lead">{page.lead}</p>
            </section>
            <div className="tramo c-raiz__channels">
              <div className="nodo">
                <CopyEmail email={site.email} />
              </div>
              <a href={whatsappHref(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                WhatsApp
                <ArrowExternal />
              </a>
            </div>
            <div className="tramo c-raiz__next">
              <RaizNext heading="h2" node />
            </div>
          </div>
          <div className="tramo c-raiz__form">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}

// 404 -----------------------------------------------------------------------

export function NotFoundContent() {
  const { t } = useI18n();
  const page = t.pages.notFound;
  return (
    <section className="container page-head page-head--lit not-found">
      <div className="not-found__copy">
        <p className="t-label dim eyebrow page-head__eyebrow">{page.eyebrow}</p>
        <h1 className="t-display">{page.h1}</h1>
        <p className="t-lead muted page-head__lead">{page.lead}</p>
        <div className="not-found__actions">
          <Link href="/" className="btn-primary">
            {page.back}
            <ArrowRight />
          </Link>
          <Link href="/servicios" className="btn-ghost">
            {t.services.all}
            <ArrowRight />
          </Link>
        </div>
      </div>
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
    </section>
  );
}
