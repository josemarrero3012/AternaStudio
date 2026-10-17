// Prefijo de ruta cuando la web se sirve bajo una subruta (GitHub Pages).
// Vacío en producción (Hostinger, raíz del dominio).
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => `${basePath}${path}`;
