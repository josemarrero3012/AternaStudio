import type { Metadata } from "next";
import { NotFoundContent } from "@/components/pages";
import { PREFIXED_LOCALES, type Locale } from "@/lib/dict";
import { site } from "@/lib/site";

// La 404 de cada idioma (en/404.html, nl/404.html, de/404.html). El servidor
// la sirve para las direcciones que no existen bajo /en, /nl y /de: ver el
// .htaccess de cada carpeta en public/. Sin prefijo, la de la raíz.
const titles: Record<Exclude<Locale, "es">, string> = {
  en: "Page not found",
  nl: "Pagina niet gevonden",
  de: "Seite nicht gefunden",
};

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params).lang as keyof typeof titles;
  return { title: `${titles[lang]} — ${site.name}`, robots: { index: false, follow: true } };
}

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export default function Page() {
  return <NotFoundContent />;
}
