import { Shell, rootMetadata, rootViewport } from "@/components/Shell";

// Layout raíz del español, que vive en la raíz del sitio. Los demás idiomas
// tienen el suyo en app/[lang].
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <Shell locale="es">{children}</Shell>;
}
