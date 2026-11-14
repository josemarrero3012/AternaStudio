import { JsonLd } from "@/components/JsonLd";
import type { Locale } from "@/lib/dict";
import { sectionBreadcrumbs } from "@/lib/structured";

/** Ruta de navegación de una página de primer nivel (/servicios, /estudio, /contacto). */
export function SectionJsonLd({ locale, path }: { locale: Locale; path: "/servicios" | "/estudio" | "/contacto" }) {
  return <JsonLd data={sectionBreadcrumbs(locale, path)} />;
}
