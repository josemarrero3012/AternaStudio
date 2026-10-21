import { notFound } from "next/navigation";
import { WorkCaseContent } from "@/components/Work";
import type { Locale } from "@/lib/dict";
import { workMeta } from "@/lib/seo";
import { work, type WorkSlug } from "@/lib/work";

type Props = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

const isSlug = (s: string): s is WorkSlug => work.some((p) => p.slug === s);

export function generateStaticParams() {
  return work.map((p) => ({ slug: p.slug }));
}

// Vista previa para el equipo: noindex, como /trabajo.
export async function generateMetadata({ params }: Props) {
  const { lang, slug } = await params;
  return workMeta(slug, lang as Locale);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return <WorkCaseContent slug={slug} />;
}
