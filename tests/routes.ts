// Las rutas de la web, sin idioma, como las da src/lib/meta.ts.
export const LOCALES = ["es", "en", "nl", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const ROUTES = [
  "/",
  "/servicios",
  "/servicios/web",
  "/servicios/seo",
  "/servicios/mantenimiento",
  "/servicios/asistente-ia",
  "/estudio",
  "/contacto",
  "/legal",
  "/impressum",
  "/datenschutz",
] as const;

/** Las legales tienen un solo texto: no se indexan y su canónica es la española. */
export const NOINDEX = new Set<string>(["/legal", "/impressum", "/datenschutz"]);

export const SITE = "https://aternastudio.com";

/** Ruta local de `path` en `locale` (español en la raíz). */
export function localPath(path: string, locale: Locale) {
  if (locale === "es") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** URL pública (canónica) de `path` en `locale`. */
export function publicUrl(path: string, locale: Locale) {
  const p = localPath(path, locale);
  return p === "/" ? SITE : `${SITE}${p}`;
}

/** Las páginas que se miran en cada prueba larga (accesibilidad, capturas). */
export const KEY_PAGES = ["/", "/servicios", "/servicios/web", "/estudio", "/contacto"] as const;
