import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, LOCALE_TAGS, localePath, type Locale } from "./dict";
import { routeMeta, type RouteKey } from "./meta";
import { site } from "./site";

/** URL absoluta de `path` (sin idioma) en `locale`. */
export function absoluteUrl(path: string, locale: Locale) {
  const p = localePath(path, locale);
  return p === "/" ? site.url : `${site.url}${p}`;
}

/** Las cuatro versiones de una ruta, más x-default (la española). */
export function languageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(path, l);
  languages["x-default"] = absoluteUrl(path, DEFAULT_LOCALE);
  return languages;
}

/**
 * Metadatos por página y por idioma: título, descripción, canónica, hreflang
 * y Open Graph propios. Las páginas legales tienen un solo texto, así que
 * todas sus versiones apuntan a la española y no se indexan.
 */
export function pageMeta(key: RouteKey, locale: Locale): Metadata {
  const { path, title, description, noindex = false } = routeMeta(key, locale);
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — ${routeMeta("home", locale).tagline}`;
  const url = absoluteUrl(path, noindex ? DEFAULT_LOCALE : locale);
  return {
    title: fullTitle,
    description,
    alternates: noindex ? { canonical: url } : { canonical: url, languages: languageAlternates(path) },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      locale: LOCALE_TAGS[locale].replace("-", "_"),
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_TAGS[l].replace("-", "_")),
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
