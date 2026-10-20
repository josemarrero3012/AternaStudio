// Proyectos de la sección «Trabajo»: enlaces, capturas y stack. Los textos
// (ES/EN) van en dict.ts → work.items, en el mismo orden y con el mismo slug.
// Las capturas salen de scripts/work-shots.js (public/work/).

import type { ServiceSlug } from "./pricing";

export type WorkSlug = "calma-cafe" | "the-fragrance-bar";

export type WorkProject = {
  slug: WorkSlug;
  /** Web publicada (GitHub Pages): la que se abre y se embebe. */
  url: string;
  repo: string;
  /** Capturas: página entera en escritorio, primera pantalla en móvil y una página interior. */
  shots: { desktop: string; mobile: string; detail: string };
  /** Alto de la captura de escritorio (todas miden 1440 de ancho). */
  desktopH: number;
  stack: string[];
  services: ServiceSlug[];
};

export const work: WorkProject[] = [
  {
    slug: "calma-cafe",
    url: "https://josemarrero3012.github.io/CalmaCafe/",
    repo: "https://github.com/josemarrero3012/CalmaCafe",
    shots: {
      desktop: "/work/calma-cafe-desktop.webp",
      mobile: "/work/calma-cafe-mobile.webp",
      detail: "/work/calma-cafe-carta.webp",
    },
    desktopH: 3494,
    stack: ["Astro", "CSS propio", "JavaScript", "GitHub Actions"],
    services: ["web", "seo"],
  },
  {
    slug: "the-fragrance-bar",
    url: "https://josemarrero3012.github.io/TheFragrancerBar/",
    repo: "https://github.com/josemarrero3012/TheFragrancerBar",
    shots: {
      desktop: "/work/the-fragrance-bar-desktop.webp",
      mobile: "/work/the-fragrance-bar-mobile.webp",
      detail: "/work/the-fragrance-bar-ficha.webp",
    },
    desktopH: 5200,
    stack: ["HTML", "CSS", "JavaScript", "Vite"],
    services: ["web", "seo"],
  },
];

export const workBySlug = Object.fromEntries(work.map((p) => [p.slug, p])) as Record<WorkSlug, WorkProject>;

/** Dirección corta para la barra del marco: sin protocolo ni barra final. */
export const shortUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
