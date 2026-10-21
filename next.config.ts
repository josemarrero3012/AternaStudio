import type { NextConfig } from "next";

// Exportación estática (carpeta `out/`) para el hosting compartido de
// Hostinger: sin Node.js en el servidor. Las cabeceras y las URLs limpias
// las resuelve public/.htaccess.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  // En GitHub Pages la web vive en /AternaStudio (ver .github/workflows).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // Hay dos layouts raíz (español en la raíz, /en, /nl y /de en app/[lang]):
  // la 404 global va aparte, en app/global-not-found.tsx.
  experimental: { globalNotFound: true },
};

export default nextConfig;
