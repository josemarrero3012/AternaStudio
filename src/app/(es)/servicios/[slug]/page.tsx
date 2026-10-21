import { notFound } from "next/navigation";
import { ServicePage, isServiceSlug, serviceParams } from "@/components/ServicePage";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export const generateStaticParams = serviceParams;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return isServiceSlug(slug) ? pageMeta(slug, "es") : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  return <ServicePage slug={slug} locale="es" />;
}
