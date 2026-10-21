import type { Metadata } from "next";
import { NotFoundContent } from "@/components/pages";
import { Shell, rootMetadata, rootViewport } from "@/components/Shell";

// Con dos layouts raíz (español e idiomas con prefijo) la 404 lleva su propio
// documento. Se exporta una sola, en español: es la que sirve 404.html.
export const metadata: Metadata = {
  ...rootMetadata,
  title: "Página no encontrada — Aterna Studio",
  robots: { index: false, follow: true },
};
export const viewport = rootViewport;

export default function GlobalNotFound() {
  return (
    <Shell locale="es" lost>
      <NotFoundContent />
    </Shell>
  );
}
