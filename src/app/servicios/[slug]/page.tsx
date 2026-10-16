import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ServiceProductContent } from "@/components/pages";
import { dict } from "@/lib/dict";
import { pricing, slugToProduct, type ServiceSlug } from "@/lib/pricing";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export const dynamicParams = false;

const meta: Record<ServiceSlug, { title: string; description: string }> = {
  web: {
    title: "Diseño y desarrollo web",
    description:
      "Diseño, dirección de arte y desarrollo web a medida. Sin plantillas ni plugins. Código propio, rápido y accesible. Desde 1.490 €.",
  },
  seo: {
    title: "SEO y crecimiento orgánico",
    description:
      "SEO y crecimiento orgánico con foco local, para hoteles, bodegas y restaurantes. Trabajo mensual, medido y reportado con honestidad. Desde 390 €/mes.",
  },
  mantenimiento: {
    title: "Mantenimiento y soporte",
    description:
      "Mantenimiento web: hosting, copias, actualizaciones, seguridad y soporte. Tu web siempre rápida, segura y al día. Desde 59 €/mes.",
  },
  "asistente-ia": {
    title: "Asistente telefónico con IA 24/7",
    description:
      "Un asistente de voz con IA que contesta las llamadas de tu negocio 24 horas al día: resuelve dudas, toma reservas y te pasa los recados. Precio personalizado según tus minutos.",
  },
};

const isSlug = (s: string): s is ServiceSlug => s in slugToProduct;

export function generateStaticParams() {
  return Object.keys(slugToProduct).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) return {};
  return pageMeta({ ...meta[slug], path: `/servicios/${slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const product = slugToProduct[slug];
  const page = dict.es.servicePages[product];
  const url = `${site.url}/servicios/${slug}`;
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.eyebrow,
      description: page.lead,
      url,
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
