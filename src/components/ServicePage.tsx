import { JsonLd } from "@/components/JsonLd";
import { ServiceProductContent } from "@/components/pages";
import { dict, type Locale } from "@/lib/dict";
import { pricing, slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const serviceParams = () => Object.keys(slugToProduct).map((slug) => ({ slug }));

export const isServiceSlug = (s: string): s is ServiceSlug => s in slugToProduct;

/** Ficha de un servicio con sus datos estructurados en el idioma de la página. */
export function ServicePage({ slug, locale }: { slug: ServiceSlug; locale: Locale }) {
  const product = slugToProduct[slug];
  const page = dict[locale].servicePages[product];
  const url = absoluteUrl(`/servicios/${slug}`, locale);
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.eyebrow,
      description: page.lead,
      url,
      inLanguage: locale,
      provider: { "@type": "Organization", name: site.name, url: site.url },
      areaServed: "ES",
      offers: page.plans.map((plan, i) => {
        const p = pricing[product][i];
        return p.custom
          ? { "@type": "Offer", name: plan.name, url }
          : { "@type": "Offer", name: plan.name, price: String(p.amount), priceCurrency: "EUR", url };
      }),
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
  ];
  return (
    <>
      <JsonLd data={structured} />
      <ServiceProductContent slug={slug} />
    </>
  );
}
