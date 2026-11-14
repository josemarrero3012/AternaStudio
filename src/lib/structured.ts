// Datos estructurados (schema.org) que comparten varias páginas. Se pintan
// en el servidor con <JsonLd>. Lo validan tests/seo.spec.ts.

import { dict, type Locale } from "./dict";
import { absoluteUrl } from "./seo";
import { site } from "./site";

/** La organización se declara una vez (Shell) y las demás piezas la citan. */
export const ORGANIZATION_ID = `${site.url}/#organization`;

type Crumb = { name: string; path: string };

/** Ruta de navegación (Inicio › … › página), con URLs absolutas del idioma. */
export function breadcrumbs(locale: Locale, trail: Crumb[]) {
  const items = [{ name: site.name, path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path, locale),
    })),
  };
}

/** Las páginas de primer nivel, con el nombre que lleva el menú. */
export function sectionBreadcrumbs(locale: Locale, path: "/servicios" | "/estudio" | "/contacto") {
  const label = dict[locale].nav.find((n) => n.href === path)?.label ?? path;
  return breadcrumbs(locale, [{ name: label, path }]);
}
