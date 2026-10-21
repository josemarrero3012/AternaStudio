import { EstudioContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("estudio", "es");

export default function Page() {
  return <EstudioContent />;
}
