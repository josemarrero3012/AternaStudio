export type Price = {
  amount: number;
  unit: "once" | "month";
  from?: boolean;
  /** El precio real se cierra con el cliente (p. ej. según minutos de llamada). */
  custom?: boolean;
};

export type Product = "web" | "seo" | "care" | "voice";

export const pricing: Record<Product, Price[]> = {
  web: [
    { amount: 1490, unit: "once", from: true },
    { amount: 2900, unit: "once", from: true },
    { amount: 5900, unit: "once", from: true },
  ],
  seo: [
    { amount: 390, unit: "month" },
    { amount: 590, unit: "month" },
    { amount: 890, unit: "month" },
  ],
  care: [
    { amount: 59, unit: "month" },
    { amount: 99, unit: "month" },
  ],
  voice: [
    { amount: 99, unit: "month", custom: true },
    { amount: 790, unit: "month", custom: true },
    { amount: 1490, unit: "month", custom: true },
  ],
};

export const startingPrice: Record<Product, Price> = {
  web: pricing.web[0],
  seo: pricing.seo[0],
  care: pricing.care[0],
  voice: pricing.voice[0],
};

/** Slug de la URL (/servicios/<slug>) → clave del producto. */
export const slugToProduct = {
  web: "web",
  seo: "seo",
  mantenimiento: "care",
  "asistente-ia": "voice",
} as const satisfies Record<string, Product>;

export type ServiceSlug = keyof typeof slugToProduct;

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-ES").format(amount);
}
