import { preload } from "react-dom";
import { HomeContent } from "@/components/HomeContent";
import type { Locale } from "@/lib/dict";
import { preloadTree } from "@/lib/tree/config";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("home", (await params).lang as Locale);
}

export default function Page() {
  preloadTree(preload);
  return <HomeContent />;
}
