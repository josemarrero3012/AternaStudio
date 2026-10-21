import { WorkIndexContent } from "@/components/Work";
import { pageMeta } from "@/lib/seo";

// Vista previa para el equipo: no se indexa ni va en el sitemap.
export const metadata = pageMeta("trabajo", "es");

export default function Page() {
  return <WorkIndexContent />;
}
