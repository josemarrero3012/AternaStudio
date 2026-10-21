import { WorkIndexContent } from "@/components/Work";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

// Vista previa para el equipo: no se indexa ni va en el sitemap.
export async function generateMetadata({ params }: Props) {
  return pageMeta("trabajo", (await params).lang as Locale);
}

export default function Page() {
  return <WorkIndexContent />;
}
