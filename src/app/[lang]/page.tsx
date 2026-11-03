import { preload } from "react-dom";
import { HomeContent } from "@/components/pages";
import type { Locale } from "@/lib/dict";
import { preloadJourney } from "@/lib/journey/config";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("home", (await params).lang as Locale);
}

export default function Page() {
  preloadJourney(preload);
  return <HomeContent />;
}
