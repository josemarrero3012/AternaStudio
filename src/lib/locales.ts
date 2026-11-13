// Idiomas de la web y sus rutas. Va aparte de dict.ts para que el código del
// navegador pueda usarlo sin cargar los textos de los cuatro idiomas: cada
// página recibe solo los suyos (ver LanguageProvider, en i18n.tsx).

export const LOCALES = ["es", "en", "nl", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** El español vive en la raíz; los demás idiomas, bajo /en, /nl y /de. */
export const DEFAULT_LOCALE: Locale = "es";
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** Ruta de `path` (sin idioma, p. ej. "/servicios" o "/#metodo") en `locale`. */
export function localePath(path: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/")) return path;
  return path === "/" || path.startsWith("/#") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** Quita el prefijo de idioma de una ruta: "/en/estudio" -> "/estudio". */
export function stripLocale(pathname: string) {
  const seg = pathname.split("/")[1] ?? "";
  if (seg === DEFAULT_LOCALE || !isLocale(seg)) return pathname;
  return pathname.slice(seg.length + 1) || "/";
}

/** Nombre de cada idioma en su propio idioma: así se encuentra en el selector. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
};

/** Convención de números y moneda de cada idioma (Intl). */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  nl: "nl-NL",
  de: "de-DE",
};
