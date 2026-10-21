import { EstudioContent } from "@/components/pages";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("estudio", (await params).lang as Locale);
}

export default function Page() {
  return <EstudioContent />;
}
