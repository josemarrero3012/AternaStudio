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
};

export default nextConfig;
