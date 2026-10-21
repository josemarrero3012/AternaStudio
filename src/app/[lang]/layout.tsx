import { notFound } from "next/navigation";
import { Shell, rootMetadata, rootViewport } from "@/components/Shell";
import { PREFIXED_LOCALES, isLocale } from "@/lib/dict";

// Layout raíz de /en, /nl y /de. El español tiene el suyo en app/(es).
export const metadata = rootMetadata;
export const viewport = rootViewport;

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <Shell locale={lang}>{children}</Shell>;
}
