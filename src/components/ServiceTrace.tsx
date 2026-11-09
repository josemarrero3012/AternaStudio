"use client";

// Dibujo de cada servicio (glyphs.ts, SERVICE_GLYPHS): una pequeña escena con
// el vocabulario de Trace.tsx (filamentos, puntos y un nodo encendido) que
// se dibuja al entrar en pantalla y después sigue viva en bucle. Va en el
// panel negro de las tarjetas (portada, /servicios) y, en cada ficha, bajo
// «El servicio».

import type { ServiceSlug } from "@/lib/pricing";
import { SERVICE_GLYPHS } from "./glyphs";
import { Trace, type TraceSize } from "./Trace";

/** En la ficha del servicio, en su propio panel negro. */
export function ServiceTrace({ slug }: { slug: ServiceSlug }) {
  return (
    <div className="svc-trace aurora-panel">
      <Trace drawing={SERVICE_GLYPHS[slug]} size="xl" />
    </div>
  );
}

export function ServiceGlyph({ slug, size = "glyph", className }: { slug: ServiceSlug; size?: TraceSize; className?: string }) {
  return <Trace drawing={SERVICE_GLYPHS[slug]} size={size} className={className} />;
}
