import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

const routes: [string, number][] = [
  ["", 1],
  ["/servicios", 0.8],
  ["/servicios/web", 0.7],
  ["/servicios/seo", 0.7],
  ["/servicios/mantenimiento", 0.7],
  ["/servicios/asistente-ia", 0.7],
  ["/estudio", 0.6],
  ["/contacto", 0.6],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(([path, priority]) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
