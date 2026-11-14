import { JsonLd } from "@/components/JsonLd";
import { ServiceProductContent } from "@/components/pages";
import { dict, type Locale } from "@/lib/dict";
import { pricing, slugToProduct, type Price, type ServiceSlug } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";
import { ORGANIZATION_ID, breadcrumbs } from "@/lib/structured";

export const serviceParams = () => Object.keys(slugToProduct).map((slug) => ({ slug }));

export const isServiceSlug = (s: string): s is ServiceSlug => s in slugToProduct;

/**
 * Oferta de un plan. Los mensuales llevan la unidad (sin ella, «390 €»
 * parece un pago único); los «desde», el importe como precio mínimo; los de
 * precio personalizado, sin importe.
 */
function offer(name: string, p: Price, url: string) {
  const base = { "@type": "Offer", name, url, priceCurrency: "EUR" };
  if (p.custom) return { "@type": "Offer", name, url };
  const price = String(p.amount);
  if (p.unit === "month") {
    return {
      ...base,
      price,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "EUR",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    };
  }
  return p.from
    ? { ...base, price, priceSpecification: { "@type": "PriceSpecification", minPrice: price, priceCurrency: "EUR" } }
    : { ...base, price };
}

/** Ficha de un servicio con sus datos estructurados en el idioma de la página. */
export function ServicePage({ slug, locale }: { slug: ServiceSlug; locale: Locale }) {
  const t = dict[locale];
  const product = slugToProduct[slug];
  const page = t.servicePages[product];
  const card = t.servicePages.index.cards.find((c) => c.slug === slug)!;
  const path = `/servicios/${slug}`;
  const url = absoluteUrl(path, locale);
  const services = t.nav.find((n) => n.href === "/servicios")?.label ?? t.servicePages.index.eyebrow;
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: card.title,
      serviceType: card.title,
      description: page.lead,
      url,
      inLanguage: locale,
      provider: { "@id": ORGANIZATION_ID },
      offers: page.plans.map((plan, i) => offer(plan.name, pricing[product][i], url)),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: page.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    breadcrumbs(locale, [
      { name: services, path: "/servicios" },
      { name: card.title, path },
    ]),
  ];
  return (
    <>
      <JsonLd data={structured} />
      <ServiceProductContent slug={slug} />
    </>
  );
}
