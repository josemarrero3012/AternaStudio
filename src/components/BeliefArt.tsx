"use client";

// Dibujos de «En qué creemos» (/estudio), en el mismo orden que
// pages.estudio.beliefs en dict.ts. Mismo lenguaje que los pilares de la
// portada (glyphs.ts, BELIEF_GLYPHS):
//   1. Primero la auditoría: la lupa sobre la línea rota; el nodo es la rotura.
//   2. Ninguna cifra inventada: tres barras con su valor real y, sobre la del
//      medio, la cifra inflada apenas como un trazo apagado.
//   3. El movimiento con motivo: la curva de la marca con sus tiradores y el
//      recorrido que sigue abajo.

import { BELIEF_GLYPHS } from "./glyphs";
import { Trace } from "./Trace";

export function BeliefArt({ index }: { index: number }) {
  const drawing = BELIEF_GLYPHS[index];
  if (!drawing) return null;
  return <Trace drawing={drawing} size="xl" className="belief-art" />;
}
