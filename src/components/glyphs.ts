// Iconos de las listas fijas de la web, en el mismo orden que sus textos en
// dict.ts (igual en los dos idiomas). Cada uno dibuja la frase clave de su
// punto con el vocabulario de Trace.tsx: filamento, puntos y nodo. El círculo
// es siempre «mirar con atención»: la lente de la auditoría y el foco de
// «Pocos proyectos a la vez».

import { glyph, ring } from "./Trace";

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
  // «Cada proyecto tiene la atención que necesita»: el filamento llega a un
  // nodo rodeado por un círculo.
  glyph(
    [
      { d: "M0 20 H61", dur: 1.1 },
      { d: ring(74, 20, 13), delay: 1, dur: 1 },
    ],
    undefined,
    { x: 74, y: 20, delay: 1.9 },
  ),
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
];

/** Cierre y /contacto, «Qué pasa después» (finalCta.next). Tres siluetas
 * distintas (sobre, bocadillo, documento) unidas por el mismo hilo, que
 * llega a cada una por la izquierda a media altura: es una sola conversación. */
export const STEP_GLYPHS = [
  // «Nos escribes»: el hilo se pliega en un sobre y el nodo es el sello.
  glyph(
    [
      { d: "M0 20 H48 V32 H88 V8 H48 V20", dur: 1.8 },
      { d: "M48 8 L68 22 L88 8", delay: 1.6, dur: 0.6 },
    ],
    undefined,
    { x: 68, y: 22, delay: 2.1 },
  ),
  // «Te respondemos»: un bocadillo con los tres puntos de «escribiendo»; el
  // último es la respuesta que llega.
  glyph(
    [{ d: "M0 20 H38 L44 16 V12 Q44 6 50 6 H82 Q88 6 88 12 V28 Q88 34 82 34 H50 Q44 34 44 28 V24 L38 20", dur: 1.9 }],
    [
      { x: 56, y: 20, delay: 1.9 },
      { x: 66, y: 20, delay: 2.1 },
    ],
    { x: 76, y: 20, delay: 2.3 },
  ),
  // «Lo ponemos por escrito»: una página con la esquina doblada, renglones
  // y el nodo como punto final.
  glyph(
    [
      { d: "M0 20 H54 V37 H82 V11 L75 4 H54 V20", dur: 1.8 },
      { d: "M75 4 V11 H82", delay: 1.5, dur: 0.3, faint: true },
      { d: "M59 17 H77", delay: 1.7, dur: 0.3, faint: true },
      { d: "M59 23 H77", delay: 1.85, dur: 0.3, faint: true },
      { d: "M59 29 H69", delay: 2, dur: 0.25, faint: true },
    ],
    undefined,
    { x: 73, y: 29, delay: 2.2 },
  ),
];
