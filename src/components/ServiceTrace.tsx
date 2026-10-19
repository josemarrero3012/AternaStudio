"use client";

// Dibujo de cada servicio. En su ficha, bajo «El servicio», la frase clave del
// texto contada con un filamento que nace en la nada y acaba en un nodo, como
// las raíces del vídeo (ServiceTrace). En las tarjetas y en la lista de la
// portada, la misma idea en pequeño, como icono del servicio (ServiceGlyph).
// Cómo se pinta y se anima: ver Trace.tsx.

import type { ServiceSlug } from "@/lib/pricing";
import { Trace, glyph, type Drawing } from "./Trace";

const TRACES: Record<ServiceSlug, Drawing> = {
  // «Partimos de qué tiene que conseguir y a partir de ahí decidimos
  // estructura, dirección de arte y código»: un nodo que se abre en tres.
  web: {
    w: 300,
    h: 120,
    lines: [
      { d: "M0 60 H120", dur: 1 },
      { d: "M120 60 C180 60 204 22 292 22", delay: 1, dur: 1.4 },
      { d: "M120 60 H292", delay: 1, dur: 1.4 },
      { d: "M120 60 C180 60 204 98 292 98", delay: 1, dur: 1.4 },
    ],
    dots: [
      { x: 292, y: 22, delay: 2.4 },
      { x: 292, y: 60, delay: 2.4 },
      { x: 292, y: 98, delay: 2.4 },
    ],
    node: { x: 120, y: 60, delay: 0.8 },
  },
  // «Sube en escalones, no en línea recta». Mesetas de distinta longitud y
  // saltos desiguales: con escalones regulares se leía como una escalera.
  seo: {
    w: 300,
    h: 120,
    lines: [{ d: "M0 112 H74 V102 H122 V84 H146 V78 H196 V52 H226 V44 H270 V18 H292" }],
    node: { x: 292, y: 18, delay: 2.4 },
  },
  // «Una web necesita mantenimiento para seguir rindiendo»: una línea que se
  // sostiene, con revisiones regulares. Contrasta con la que sube en SEO.
  mantenimiento: {
    w: 300,
    h: 60,
    lines: [{ d: "M0 30 H292", dur: 2 }],
    dots: [
      { x: 70, y: 30, delay: 2 },
      { x: 126, y: 30, delay: 2.15 },
      { x: 182, y: 30, delay: 2.3 },
      { x: 238, y: 30, delay: 2.45 },
    ],
    node: { x: 292, y: 30, delay: 2.6 },
  },
  // «El teléfono sigue sonando… un asistente que habla con la voz de tu
  // negocio»: una voz que entra, se resuelve y queda atendida.
  "asistente-ia": {
    w: 300,
    h: 120,
    lines: [
      {
        d: "M0 60 H92 Q100 46 108 60 Q116 80 124 60 Q132 30 140 60 Q148 88 156 60 Q164 38 172 60 Q180 74 188 60 Q196 52 204 60 H292",
      },
    ],
    node: { x: 292, y: 60, delay: 2.4 },
  },
};

// Los mismos dibujos en el lienzo de los iconos, simplificados para que se
// lean a 96 px: menos escalones y menos ondas, con más amplitud.
const GLYPHS: Record<ServiceSlug, Drawing> = {
  web: glyph(
    [
      { d: "M0 20 H34", dur: 0.8 },
      { d: "M34 20 C52 20 58 6 88 6", delay: 0.8, dur: 1.1 },
      { d: "M34 20 H88", delay: 0.8, dur: 1.1 },
      { d: "M34 20 C52 20 58 34 88 34", delay: 0.8, dur: 1.1 },
    ],
    [
      { x: 88, y: 6, delay: 1.9 },
      { x: 88, y: 20, delay: 1.9 },
      { x: 88, y: 34, delay: 1.9 },
    ],
    { x: 34, y: 20, delay: 0.6 },
  ),
  // Mismo ritmo que el grande: un salto corto y uno largo, mesetas desiguales.
  seo: glyph([{ d: "M0 36 H24 V33 H38 V26 H44 V24 H60 V15 H70 V12 H80 V4 H88", dur: 2 }], undefined, {
    x: 88,
    y: 4,
    delay: 2,
  }),
  mantenimiento: glyph(
    [{ d: "M0 20 H88", dur: 1.6 }],
    [
      { x: 21, y: 20, delay: 1.6 },
      { x: 38, y: 20, delay: 1.72 },
      { x: 55, y: 20, delay: 1.84 },
      { x: 72, y: 20, delay: 1.96 },
    ],
    { x: 88, y: 20, delay: 2.1 },
  ),
  "asistente-ia": glyph(
    [{ d: "M0 20 H24 Q27 10 30 20 Q33 34 36 20 Q39 0 42 20 Q45 40 48 20 Q51 6 54 20 Q57 28 60 20 H88", dur: 2 }],
    undefined,
    { x: 88, y: 20, delay: 2 },
  ),
};

export function ServiceTrace({ slug }: { slug: ServiceSlug }) {
  return <Trace drawing={TRACES[slug]} size="wide" className="svc-trace" />;
}

export function ServiceGlyph({ slug, className }: { slug: ServiceSlug; className?: string }) {
  return <Trace drawing={GLYPHS[slug]} size="glyph" className={className} />;
}
