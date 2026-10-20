import { WorkIndexContent } from "@/components/Work";
import { pageMeta } from "@/lib/seo";

// Vista previa para el equipo: no se indexa ni va en el sitemap.
export const metadata = pageMeta({
  title: "Casos de éxito",
  path: "/trabajo",
  description: "Casos de éxito de Aterna Studio: Calma Café, en Maspalomas, y The Fragrance Bar, en Las Palmas de Gran Canaria.",
  noindex: true,
});

export default function Page() {
  return <WorkIndexContent />;
}
