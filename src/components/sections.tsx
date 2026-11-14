"use client";

// Secciones compartidas entre páginas.

import { useId, useRef, type ReactNode } from "react";
import { Link, useI18n } from "@/lib/i18n";
import { type ServiceSlug } from "@/lib/pricing";
import { useReveal } from "@/lib/reveal";
import { site } from "@/lib/site";
import { CopyEmail } from "./CopyEmail";
import { STEP_GLYPHS } from "./glyphs";
import { ArrowRight } from "./icons";
import { useStepWire } from "./StepWire";
import { Trace } from "./Trace";
import { WordReveal } from "./WordReveal";

/** "01 — Estudio": la numeración la pone cada página según su orden real. */
export function eyebrow(text: string, n?: number): ReactNode {
  if (!n) return text;
  return (
    <>
      <span className="eyebrow__n">{String(n).padStart(2, "0")}</span>
      <span className="eyebrow__sep">—</span>
      {text}
    </>
  );
}

/** Presupuesto flexible compartido por las tarjetas de servicios. */
export function StartingPrice({ className }: { slug: ServiceSlug; className?: string }) {
  const { t } = useI18n();
  return <span className={`price-tag${className ? ` ${className}` : ""}`}>{t.common.customPrice}</span>;
}

/** Cierre de página: el contacto, en la banda más luminosa. En la portada lleva número. */
export function FinalCTA({ n }: { n?: number }) {
  const { t } = useI18n();
  const tail = useReveal({ selector: "[data-r]", y: 20, stagger: 0.1 });
  return (
    <section className="section section-lg band-aurora final-cta" aria-labelledby="cta-title">
      <div className="container final-cta__inner" ref={tail}>
        <div className="final-cta__marks">
          <p className="t-label eyebrow final-cta__eyebrow">{eyebrow(t.finalCta.eyebrow, n)}</p>
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
export function NextSteps({ className, heading: Heading = "h3" }: { className?: string; heading?: "h2" | "h3" }) {
  const { t } = useI18n();
  const list = useReveal<HTMLDivElement>({ selector: ".next-step", y: 20, stagger: 0.1 });
  const flow = useRef<HTMLDivElement>(null);
  useStepWire(flow, `wire${useId().replace(/[^\w-]/g, "")}`);
  return (
    <div className={`next-steps${className ? ` ${className}` : ""}`} ref={list}>
      <Heading className="t-label dim">{t.finalCta.nextTitle}</Heading>
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
