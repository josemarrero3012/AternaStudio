import { preload } from "react-dom";
import { HomeContent } from "@/components/pages";
import { preloadFirstFrame } from "@/lib/journey/config";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("home", "es");

export default function Page() {
  preloadFirstFrame(preload);
  return <HomeContent />;
}
