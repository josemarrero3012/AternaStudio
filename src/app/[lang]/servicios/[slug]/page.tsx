import { notFound } from "next/navigation";
import { ServicePage, isServiceSlug, serviceParams } from "@/components/ServicePage";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = serviceParams;

export async function generateMetadata({ params }: Props) {
  const { lang, slug } = await params;
  return isServiceSlug(slug) ? pageMeta(slug, lang as Locale) : {};
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  return <ServicePage slug={slug} locale={lang as Locale} />;
}
