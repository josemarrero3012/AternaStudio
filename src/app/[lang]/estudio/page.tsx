import { EstudioContent } from "@/components/pages";
import { SectionJsonLd } from "@/components/SectionJsonLd";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("estudio", (await params).lang as Locale);
}

export default async function Page({ params }: Props) {
  const locale = (await params).lang as Locale;
  return (
    <>
      <SectionJsonLd locale={locale} path="/estudio" />
      <EstudioContent />
    </>
  );
}
