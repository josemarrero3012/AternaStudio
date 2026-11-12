"use client";

// Dibujo de cada servicio (glyphs.ts, SERVICE_GLYPHS): una pequeña escena con
// el vocabulario de Trace.tsx (filamentos, puntos y un nodo encendido) que
// se dibuja al entrar en pantalla y después sigue viva en bucle. Va en el
// panel negro de las tarjetas (portada, /servicios) y, en cada ficha, en la
// cabecera y en «Otros servicios», sin panel.

import type { ServiceSlug } from "@/lib/pricing";
import { SERVICE_GLYPHS } from "./glyphs";
import { Trace, type TraceSize } from "./Trace";

export function ServiceGlyph({ slug, size = "glyph", className }: { slug: ServiceSlug; size?: TraceSize; className?: string }) {
  return <Trace drawing={SERVICE_GLYPHS[slug]} size={size} className={className} />;
}
