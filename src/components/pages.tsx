"use client";

// Contenido de cada página. Son componentes de cliente porque los textos
// cambian con el selector de idioma; el HTML exportado sale en español.

import { withBase } from "@/lib/base";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatAmount, pricing, slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { site } from "@/lib/site";
import { CopyEmail } from "./CopyEmail";
import { Arrow, Check } from "./icons";
import { IllContact, IllLost, IllStudio, serviceIllustrations } from "./illustrations";
import { Approach, FinalCTA, useStartingPriceLabel } from "./sections";
import { WordReveal } from "./WordReveal";

// /servicios ----------------------------------------------------------------

export function ServiciosContent() {
  const { t } = useI18n();
  const page = t.servicePages.index;
  const price = useStartingPriceLabel();
  return (
    <>
      <section className="container page-head">
        <p className="t-label dim page-head__eyebrow">{page.eyebrow}</p>
        <WordReveal as="h1" className="t-display" text={page.h1} onScroll={false} delay={0.1} />
        <p className="t-lead muted page-head__lead">{page.lead}</p>
      </section>
      <section className="container section section--flush-top" aria-label={page.eyebrow}>
        <div className="svc-cards">
          {page.cards.map((card) => {
            const slug = card.slug as ServiceSlug;
            const Illus = serviceIllustrations[slug];
            const p = price(slug);
            return (
              <Link key={slug} href={`/servicios/${slug}`} className="svc-card">
                <Illus className="svc-card__ill" />
                <p className="t-label dim svc-card__kicker">{card.kicker}</p>
                <h2 className="svc-card__title">{card.title}</h2>
                <p className="t-body muted svc-card__body">{card.body}</p>
                <p className="svc-card__price">
                  {p.label}
                  {p.once ? <span className="t-label dim svc-card__once"> · {t.common.oncePayment}</span> : null}
                </p>
                <span className="t-small svc-card__cta">
                  {card.cta}
                  <Arrow />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <Approach />
      <FinalCTA />
    </>
  );
}

// /servicios/<slug> -----------------------------------------------------------

function Plan({
  name,
  priceLabel,
  pricePrefix,
  priceSuffix,
  unitNote,
  tagline,
  features,
  featured,
}: {
  name: string;
  priceLabel: string;
  pricePrefix?: string;
  priceSuffix?: string;
  unitNote?: string;
  tagline: string;
  features: string[];
  featured: boolean;
}) {
  return (
    <article className={`plan${featured ? " plan--featured" : ""}`}>
      <header className="plan__head">
        <h3 className="t-label plan__name">{name}</h3>
        <p className={`plan__price${priceSuffix === undefined && !/\d/.test(priceLabel) ? " plan__price--text" : ""}`}>
          {pricePrefix ? <span className="plan__prefix">{pricePrefix}</span> : null}
          {priceLabel}
          {priceSuffix ? <span className="plan__suffix">{priceSuffix}</span> : null}
        </p>
        {unitNote ? <p className="t-label dim plan__unit">{unitNote}</p> : null}
        <p className="t-small muted plan__tagline">{tagline}</p>
      </header>
      <ul className="plan__features">
        {features.map((f, i) => (
          <li key={i}>
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ServiceProductContent({ slug }: { slug: ServiceSlug }) {
  const { t } = useI18n();
  const product = slugToProduct[slug];
  const page = t.servicePages[product];
  const prices = pricing[product];
  const Illus = serviceIllustrations[slug];

  return (
    <>
      <section className="container page-head svc-head">
        <div className="svc-head__intro">
          <p className="t-label dim page-head__eyebrow">{page.eyebrow}</p>
          <WordReveal as="h1" className="t-display svc-h1" text={page.h1} onScroll={false} delay={0.1} />
        </div>
        <p className="t-lead muted svc-head__lead">{page.lead}</p>
      </section>

      <section className="container section svc-row svc-row--first" aria-label={t.common.overview}>
        <div className="svc-row__label">
          <span className="t-label dim">{t.common.overview}</span>
          <Illus className="svc-row__ill" />
        </div>
        <div className="svc-row__body svc-prose">
          {page.intro.map((p, i) => (
            <p key={i} className={i === 0 ? "t-lead" : "t-body muted"}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="container section svc-row">
        <div className="svc-row__label">
          <h2 className="t-label dim">{page.includesTitle}</h2>
        </div>
        <ul className="svc-row__body svc-list">
          {page.includes.map((item, i) => (
            <li key={i}>
              <Check />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {page.report ? (
        <section className="container section svc-row">
          <div className="svc-row__label">
            <h2 className="t-label dim">{page.reportTitle}</h2>
          </div>
          <p className="svc-row__body t-lead svc-report__body">{page.report}</p>
        </section>
      ) : null}

      {page.examples.length > 0 ? (
        <section className="container section svc-row">
          <div className="svc-row__label">
            <h2 className="t-label dim">{page.examplesTitle}</h2>
          </div>
          <div className="svc-row__body">
            <p className="t-body muted svc-examples__lead">{page.examplesLead}</p>
            <div className="ex-cards">
              {page.examples.map((ex, i) => (
                <a key={i} className="ex-card" href={withBase(ex.href)} target="_blank" rel="noopener noreferrer">
                  <span className="t-label dim ex-card__label">{ex.label}</span>
                  <span className="ex-card__title">
                    {ex.title}
                    <Arrow />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container section svc-plans" id="planes" aria-labelledby="plans-title">
        <header className="svc-plans__head">
          <h2 id="plans-title" className="t-display">
            {page.plansTitle}
          </h2>
          <p className="t-small dim svc-plans__note">{page.plansNote}</p>
        </header>
        <div className="plans" data-count={page.plans.length}>
          {page.plans.map((plan, i) => {
            const p = prices[i];
            if (p.custom) {
              return (
                <Plan
                  key={i}
                  name={plan.name}
                  priceLabel={t.common.customPrice}
                  unitNote={t.common.customPriceNote}
                  tagline={plan.tagline}
                  features={plan.features}
                  featured={plan.featured}
                />
              );
            }
            const amount = `€${formatAmount(p.amount)}`;
            return (
              <Plan
                key={i}
                name={plan.name}
                priceLabel={amount}
                pricePrefix={p.from ? t.common.priceFrom : undefined}
                priceSuffix={p.unit === "month" ? t.common.perMonth : undefined}
                unitNote={p.unit === "month" ? undefined : t.common.oncePayment}
                tagline={plan.tagline}
                features={plan.features}
                featured={plan.featured}
              />
            );
          })}
        </div>
      </section>

      <section className="container section svc-row">
        <div className="svc-row__label">
          <h2 className="t-label dim">{page.faqTitle}</h2>
        </div>
        <dl className="svc-row__body svc-faq__list">
          {page.faq.map((item, i) => (
            <div className="svc-faq__item" key={i}>
              <dt className="svc-faq__q">{item.q}</dt>
              <dd className="t-body muted svc-faq__a">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <FinalCTA />
    </>
  );
}

// /estudio ------------------------------------------------------------------

export function EstudioContent() {
  const { t } = useI18n();
  const page = t.pages.estudio;
  return (
    <>
      <section className="container page-head">
        <p className="t-label dim page-head__eyebrow">{page.eyebrow}</p>
        <WordReveal as="h1" className="t-display" text={page.h1} onScroll={false} delay={0.1} />
      </section>
      <section className="section on-paper" aria-label={page.eyebrow}>
        <div className="container estudio__grid">
          <div className="prose">
            <p className="t-lead">{page.prose[0]}</p>
            <p className="t-body muted-strong">{page.prose[1]}</p>
            <p className="t-body muted-strong">{page.prose[2]}</p>
          </div>
          <IllStudio className="estudio__ill" label={page.prose[0].split(".").slice(0, 2).join(".") + "."} />
        </div>
      </section>
      <section className="section" aria-labelledby="beliefs-title">
        <div className="container">
          <header className="section-head">
            <WordReveal as="h2" id="beliefs-title" className="t-display" text={page.beliefsTitle} />
          </header>
          <ul className="services__list services__list--static">
            {page.beliefs.map((b, i) => (
              <li className="service" key={i}>
                <div className="service__inner">
                  <span className="t-index service__index">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-title service__title">{b.title}</h3>
                  <p className="t-body muted service__body">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/contacto.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, consent, company }),
      });
      if (!res.ok) throw new Error("request_failed");
      setState("sent");
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
    } catch {
      setState("error");
    }
  }

  // El texto de reposo ya está en la columna izquierda; aquí solo el estado.
  const note = state === "sent" ? t.contactForm.sent : state === "error" ? t.contactForm.error : "";

  return (
    <form className="contact-form" onSubmit={onSubmit}>
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
          {!sending ? <Arrow /> : null}
        </button>
        <p className="t-small contact-form__note" data-state={state} role="status" aria-live="polite">
          {note}
        </p>
      </div>
    </form>
  );
}

export function ContactoContent() {
  const { t } = useI18n();
  const page = t.pages.contacto;
  return (
    <section className="container page-head contacto">
      <p className="t-label dim page-head__eyebrow">{page.eyebrow}</p>
      <WordReveal as="h1" className="t-hero contacto__title" text={page.h1} onScroll={false} delay={0.1} />
      <div className="contact-grid">
        <div className="contact-grid__copy">
          <div className="prose">
            <p className="t-lead">{page.prose[0]}</p>
            <p className="t-body muted">{page.prose[1]}</p>
          </div>
          <div className="contact-grid__email">
            <CopyEmail email={site.email} />
          </div>
          <IllContact className="contact-grid__ill" />
        </div>
        <ContactForm />
      </div>
      <dl className="detail__facts">
        {page.facts.map((f) => (
          <div className="detail__fact" key={f.dt}>
            <dt className="t-label">{f.dt}</dt>
            <dd className="t-small">{f.dd}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// 404 -----------------------------------------------------------------------

export function NotFoundContent() {
  const { t } = useI18n();
  const page = t.pages.notFound;
  return (
    <section className="container page-head not-found">
      <div className="not-found__copy">
        <p className="t-label dim page-head__eyebrow">{page.eyebrow}</p>
        <h1 className="t-display">{page.h1}</h1>
        <p className="t-lead muted page-head__lead">{page.lead}</p>
        <div className="not-found__actions">
          <Link href="/" className="btn-primary">
            {page.back}
            <Arrow />
          </Link>
          <Link href="/servicios" className="btn-ghost">
            {t.services.all}
            <Arrow />
          </Link>
        </div>
      </div>
      <IllLost className="not-found__ill" />
    </section>
  );
}
