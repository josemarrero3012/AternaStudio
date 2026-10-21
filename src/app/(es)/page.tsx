import { HomeContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("home", "es");

export default function Page() {
  return <HomeContent />;
}
