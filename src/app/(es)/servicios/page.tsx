import { ServiciosContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("servicios", "es");

export default function Page() {
  return <ServiciosContent />;
}
