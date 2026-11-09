import { preload } from "react-dom";
import { HomeContent } from "@/components/pages";
import { preloadTree } from "@/lib/tree/config";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("home", "es");

export default function Page() {
  preloadTree(preload);
  return <HomeContent />;
}
