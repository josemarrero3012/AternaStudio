import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkCaseContent } from "@/components/Work";
import { dict } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";
import { work, type WorkSlug } from "@/lib/work";

export const dynamicParams = false;

const isSlug = (s: string): s is WorkSlug => work.some((p) => p.slug === s);

export function generateStaticParams() {
  return work.map((p) => ({ slug: p.slug }));
}

// Vista previa para el equipo: noindex, como /trabajo.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = dict.es.work.items.find((i) => i.slug === slug);
  if (!item) return {};
  return pageMeta({ title: item.name, description: item.summary, path: `/trabajo/${slug}`, noindex: true });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return <WorkCaseContent slug={slug} />;
}
