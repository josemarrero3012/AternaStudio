export type Product = "web" | "seo" | "care" | "voice";

/** Slug de la URL (/servicios/<slug>) → clave del producto. */
export const slugToProduct = {
  web: "web",
  seo: "seo",
  mantenimiento: "care",
  "asistente-ia": "voice",
} as const satisfies Record<string, Product>;

export type ServiceSlug = keyof typeof slugToProduct;
