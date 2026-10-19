// Iconos de las listas fijas de la web, en el mismo orden que sus textos en
// dict.ts (igual en los dos idiomas). Cada uno dibuja la frase clave de su
// punto con el vocabulario de Trace.tsx: filamento, puntos y nodo. El círculo
// es siempre «mirar con atención»: la lente de la auditoría y el foco de
// «Pocos proyectos a la vez».

import { glyph, ring } from "./Trace";

// «Cada proyecto tiene la atención que necesita»: el filamento llega a un
// nodo rodeado por un círculo. Lo comparten el pilar y la creencia.
const FOCUS = glyph(
  [
    { d: "M0 20 H61", dur: 1.1 },
    { d: ring(74, 20, 13), delay: 1, dur: 1 },
  ],
  undefined,
  { x: 74, y: 20, delay: 1.9 },
);

/** Portada, «Estudio»: los tres compromisos (studioHome.pillars). */
export const PILLAR_GLYPHS = [
  // «Quien diseña, programa»: dos hebras, diseño y código, que se hacen una.
  glyph(
    [
      { d: "M0 6 C26 6 26 20 48 20", dur: 1.1 },
      { d: "M0 34 C26 34 26 20 48 20", dur: 1.1 },
      { d: "M48 20 H88", delay: 1.1, dur: 0.8 },
    ],
    [{ x: 48, y: 20, delay: 1.1 }],
    { x: 88, y: 20, delay: 1.8 },
  ),
  // «Cualquier otro estudio puede continuarlo»: nuestro tramo acaba en un
  // nodo y deja el camino marcado para quien venga después.
  glyph(
    [{ d: "M0 20 H52", dur: 1.2 }],
    [
      { x: 64, y: 20, delay: 1.4 },
      { x: 75, y: 20, delay: 1.55 },
      { x: 86, y: 20, delay: 1.7 },
    ],
    { x: 52, y: 20, delay: 1 },
  ),
  FOCUS,
];

/** /estudio, «En qué creemos» (pages.estudio.beliefs). */
export const BELIEF_GLYPHS = [
  // «Miramos qué hay y qué está roto»: una lupa sobre la línea partida.
  glyph(
    [
      { d: "M0 18 H43", dur: 1 },
      { d: "M53 18 H88", delay: 0.5, dur: 0.9 },
      { d: ring(48, 18, 11), delay: 1, dur: 0.9 },
      { d: "M55.8 25.8 L62 32", delay: 1.8, dur: 0.3 },
    ],
    undefined,
    { x: 88, y: 18, delay: 2 },
  ),
  // «Ninguna cifra inventada»: una regla y la marca justo donde cae el dato.
  glyph(
    [
      { d: "M0 32 H88", dur: 1.2 },
      { d: "M16 32 V27", delay: 0.3, dur: 0.2, faint: true },
      { d: "M32 32 V27", delay: 0.45, dur: 0.2, faint: true },
      { d: "M48 32 V27", delay: 0.6, dur: 0.2, faint: true },
      { d: "M80 32 V27", delay: 0.9, dur: 0.2, faint: true },
      { d: "M64 32 V10", delay: 1.1, dur: 0.6 },
    ],
    undefined,
    { x: 64, y: 10, delay: 1.6 },
  ),
  // «El movimiento con motivo»: la curva de la marca, cubic-bezier(0.16, 1,
  // 0.3, 1) (--e-aterna), con sus puntos de control como en un editor.
  glyph(
    [
      { d: "M8 36 L20.8 4", dur: 0.5, faint: true },
      { d: "M8 36 C20.8 4 32 4 88 4", delay: 0.3, dur: 1.6 },
    ],
    [
      { x: 8, y: 36, delay: 0 },
      { x: 20.8, y: 4, delay: 0.5 },
      { x: 32, y: 4, delay: 0.7 },
    ],
    { x: 88, y: 4, delay: 1.8 },
  ),
  FOCUS,
];

/** Cierre y /contacto, «Qué pasa después» (finalCta.next). */
export const STEP_GLYPHS = [
  // «No hace falta que traigas un briefing»: ideas sueltas que se hacen línea.
  glyph(
    [{ d: "M28 20 H88", delay: 0.45, dur: 1.1 }],
    [
      { x: 5, y: 31, delay: 0 },
      { x: 13, y: 11, delay: 0.15 },
      { x: 20, y: 26, delay: 0.3 },
    ],
    { x: 88, y: 20, delay: 1.5 },
  ),
  // «Te respondemos»: ida y vuelta, como la tecla de retorno.
  glyph([{ d: "M0 11 H64 C82 11 82 29 64 29 H34", dur: 1.8 }], undefined, { x: 34, y: 29, delay: 1.8 }),
  // «Lo ponemos por escrito»: tres renglones y el nodo como punto final.
  glyph(
    [
      { d: "M8 8 H88", dur: 0.8 },
      { d: "M8 20 H76", delay: 0.5, dur: 0.7 },
      { d: "M8 32 H52", delay: 1, dur: 0.5 },
    ],
    undefined,
    { x: 52, y: 32, delay: 1.5 },
  ),
];
