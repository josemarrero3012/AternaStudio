import type { Metadata } from "next";
import { site } from "./site";

/** Metadatos por página: título, descripción, canónica y Open Graph propios. */
export function pageMeta({
  title,
  description = site.description,
  path,
  noindex = false,
}: {
  title?: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — ${site.tagline}`;
  const url = path === "/" ? site.url : `${site.url}${path}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      locale: "es_ES",
      title: fullTitle,
      description,
      images: [{ url: `${site.url}/brand/og.jpg`, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${site.url}/brand/og.jpg`],
    },
  };
}
