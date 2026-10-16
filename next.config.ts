import type { NextConfig } from "next";

// Exportación estática (carpeta `out/`) para el hosting compartido de
// Hostinger: sin Node.js en el servidor. Las cabeceras y las URLs limpias
// las resuelve public/.htaccess.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
