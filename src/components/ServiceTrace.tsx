"use client";

// Dibujo de cada servicio. En su ficha, bajo «El servicio», la frase clave del
// texto contada con un filamento que nace en la nada y acaba en un nodo, como
// las raíces del vídeo (ServiceTrace). En las tarjetas y en la lista de la
// portada, la misma idea en el lienzo de los iconos (ServiceGlyph). Una vez
// dibujados siguen vivos: un pulso de luz recorre la idea en bucle (`flow`).
// Cómo se pinta y se anima: ver Trace.tsx.

import type { ServiceSlug } from "@/lib/pricing";
import { Trace, glyph, type Drawing, type TraceSize } from "./Trace";

const TRACES: Record<ServiceSlug, Drawing> = {
  // «Partimos de qué tiene que conseguir y a partir de ahí decidimos
  // estructura, dirección de arte y código»: un nodo que se abre en tres.
  // En bucle: el pulso llega al nodo y se reparte por las tres ramas.
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
    flow: {
      dur: 4.6,
      pulses: [
        { d: "M0 60 H120", from: 0, to: 0.22, len: 0.3 },
        { d: "M120 60 C180 60 204 22 292 22", from: 0.24, to: 0.6 },
        { d: "M120 60 H292", from: 0.24, to: 0.6 },
        { d: "M120 60 C180 60 204 98 292 98", from: 0.24, to: 0.6 },
      ],
      beats: [
        { target: "node", at: 0.22 },
        { target: 0, at: 0.6 },
        { target: 1, at: 0.6 },
        { target: 2, at: 0.6 },
      ],
    },
  },
  // «Sube en escalones, no en línea recta». Mesetas de distinta longitud y
  // saltos desiguales: con escalones regulares se leía como una escalera.
  // En bucle: el pulso sube los escalones hasta el nodo.
  seo: {
    w: 300,
    h: 120,
    lines: [{ d: "M0 112 H74 V102 H122 V84 H146 V78 H196 V52 H226 V44 H270 V18 H292" }],
    node: { x: 292, y: 18, delay: 2.4 },
    flow: {
      dur: 5,
      pulses: [{ d: "M0 112 H74 V102 H122 V84 H146 V78 H196 V52 H226 V44 H270 V18 H292", from: 0, to: 0.64, len: 0.12 }],
      beats: [{ target: "node", at: 0.64 }],
    },
  },
  // «Una web necesita mantenimiento para seguir rindiendo»: una línea que se
  // sostiene, con revisiones regulares. Contrasta con la que sube en SEO.
  // En bucle: el pulso pasa revista y cada punto se enciende a su paso.
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
    flow: {
      dur: 4.8,
      pulses: [{ d: "M0 30 H292", from: 0, to: 0.72, len: 0.1 }],
      beats: [
        { target: 0, at: 0.23 },
        { target: 1, at: 0.355 },
        { target: 2, at: 0.48 },
        { target: 3, at: 0.6 },
        { target: "node", at: 0.72 },
      ],
    },
  },
  // «El teléfono sigue sonando… un asistente que habla con la voz de tu
  // negocio»: una voz que entra, se resuelve y queda atendida. En bucle: la
  // llamada llega, la voz vibra al contestar y el pulso sigue hasta el nodo.
  "asistente-ia": {
    w: 300,
    h: 120,
    lines: [
      { d: "M0 60 H92", dur: 0.8 },
      {
        d: "M92 60 Q100 46 108 60 Q116 80 124 60 Q132 30 140 60 Q148 88 156 60 Q164 38 172 60 Q180 74 188 60 Q196 52 204 60",
        delay: 0.8,
        dur: 1,
      },
      { d: "M204 60 H292", delay: 1.8, dur: 0.6 },
    ],
    node: { x: 292, y: 60, delay: 2.4 },
    flow: {
      dur: 4.8,
      pulses: [
        { d: "M0 60 H92", from: 0, to: 0.2, len: 0.3 },
        { d: "M204 60 H292", from: 0.52, to: 0.7, len: 0.3 },
      ],
      voice: { line: 1, y: 60, from: 0.2, to: 0.52 },
      beats: [{ target: "node", at: 0.7 }],
    },
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
    {
      dur: 4.2,
      pulses: [
        { d: "M0 20 H34", from: 0, to: 0.2, len: 0.35 },
        { d: "M34 20 C52 20 58 6 88 6", from: 0.22, to: 0.56, len: 0.25 },
        { d: "M34 20 H88", from: 0.22, to: 0.56, len: 0.25 },
        { d: "M34 20 C52 20 58 34 88 34", from: 0.22, to: 0.56, len: 0.25 },
      ],
      beats: [
        { target: "node", at: 0.2 },
        { target: 0, at: 0.56 },
        { target: 1, at: 0.56 },
        { target: 2, at: 0.56 },
      ],
    },
  ),
  // Mismo ritmo que el grande: un salto corto y uno largo, mesetas desiguales.
  seo: glyph(
    [{ d: "M0 36 H24 V33 H38 V26 H44 V24 H60 V15 H70 V12 H80 V4 H88", dur: 2 }],
    undefined,
    { x: 88, y: 4, delay: 2 },
    {
      dur: 4.6,
      pulses: [{ d: "M0 36 H24 V33 H38 V26 H44 V24 H60 V15 H70 V12 H80 V4 H88", from: 0, to: 0.62, len: 0.16 }],
      beats: [{ target: "node", at: 0.62 }],
    },
  ),
  mantenimiento: glyph(
    [{ d: "M0 20 H88", dur: 1.6 }],
    [
      { x: 21, y: 20, delay: 1.6 },
      { x: 38, y: 20, delay: 1.72 },
      { x: 55, y: 20, delay: 1.84 },
      { x: 72, y: 20, delay: 1.96 },
    ],
    { x: 88, y: 20, delay: 2.1 },
    {
      dur: 4.4,
      pulses: [{ d: "M0 20 H88", from: 0, to: 0.7, len: 0.14 }],
      beats: [
        { target: 0, at: 0.225 },
        { target: 1, at: 0.345 },
        { target: 2, at: 0.465 },
        { target: 3, at: 0.585 },
        { target: "node", at: 0.7 },
      ],
    },
  ),
  "asistente-ia": glyph(
    [
      { d: "M0 20 H24", dur: 0.5 },
      { d: "M24 20 Q27 10 30 20 Q33 34 36 20 Q39 0 42 20 Q45 40 48 20 Q51 6 54 20 Q57 28 60 20", delay: 0.5, dur: 1 },
      { d: "M60 20 H88", delay: 1.5, dur: 0.5 },
    ],
    undefined,
    { x: 88, y: 20, delay: 2 },
    {
      dur: 4.4,
      pulses: [
        { d: "M0 20 H24", from: 0, to: 0.16, len: 0.4 },
        { d: "M60 20 H88", from: 0.5, to: 0.66, len: 0.4 },
      ],
      voice: { line: 1, y: 20, from: 0.17, to: 0.5 },
      beats: [{ target: "node", at: 0.66 }],
    },
  ),
};

export function ServiceTrace({ slug }: { slug: ServiceSlug }) {
  return <Trace drawing={TRACES[slug]} size="wide" className="svc-trace" />;
}

export function ServiceGlyph({ slug, size = "glyph", className }: { slug: ServiceSlug; size?: TraceSize; className?: string }) {
  return <Trace drawing={GLYPHS[slug]} size={size} className={className} />;
}
