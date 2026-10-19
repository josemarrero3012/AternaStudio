// Iconos de las listas fijas de la web, en el mismo orden que sus textos en
// dict.ts (igual en los dos idiomas). Cada uno dibuja la frase clave de su
// punto con el vocabulario de Trace.tsx: filamento, puntos y nodo. Las
// ilustraciones de «En qué creemos» van aparte, en BeliefArt.tsx.

import { glyph, ring } from "./Trace";

/** Portada, «Estudio»: los tres compromisos (studioHome.pillars). Van grandes
 * en su tarjeta y se mueven en bucle (`flow`, ver Trace.tsx). */
export const PILLAR_GLYPHS = [
  // «Quien diseña, programa»: dos hebras, diseño y código, que se hacen una.
  // En bucle: un pulso baja por cada hebra, se juntan y siguen hasta el nodo.
  glyph(
    [
      { d: "M0 6 C26 6 26 20 48 20", dur: 1.1 },
      { d: "M0 34 C26 34 26 20 48 20", dur: 1.1 },
      { d: "M48 20 H88", delay: 1.1, dur: 0.8 },
    ],
    [{ x: 48, y: 20, delay: 1.1 }],
    { x: 88, y: 20, delay: 1.8 },
    {
      dur: 3.8,
      pulses: [
        { d: "M0 6 C26 6 26 20 48 20", from: 0, to: 0.34, len: 0.3 },
        { d: "M0 34 C26 34 26 20 48 20", from: 0, to: 0.34, len: 0.3 },
        { d: "M48 20 H88", from: 0.36, to: 0.6, len: 0.35 },
      ],
      beats: [
        { target: 0, at: 0.35 },
        { target: "node", at: 0.6 },
      ],
    },
  ),
  // «Cualquier otro estudio puede continuarlo»: nuestro tramo acaba en un
  // nodo y deja el camino marcado para quien venga después. En bucle: el
  // pulso llega al nodo y los puntos se encienden uno tras otro.
  glyph(
    [{ d: "M0 20 H52", dur: 1.2 }],
    [
      { x: 64, y: 20, delay: 1.4 },
      { x: 75, y: 20, delay: 1.55 },
      { x: 86, y: 20, delay: 1.7 },
    ],
    { x: 52, y: 20, delay: 1 },
    {
      dur: 3.8,
      pulses: [{ d: "M0 20 H52", from: 0, to: 0.32, len: 0.3 }],
      beats: [
        { target: "node", at: 0.32 },
        { target: 0, at: 0.44 },
        { target: 1, at: 0.54 },
        { target: 2, at: 0.64 },
      ],
    },
  ),
  // «Cada proyecto tiene la atención que necesita»: el filamento llega a un
  // nodo rodeado por un círculo. En bucle: el pulso llega y rodea el nodo.
  glyph(
    [
      { d: "M0 20 H61", dur: 1.1 },
      { d: ring(74, 20, 13), delay: 1, dur: 1 },
    ],
    undefined,
    { x: 74, y: 20, delay: 1.9 },
    {
      dur: 4.2,
      pulses: [
        { d: "M0 20 H61", from: 0, to: 0.28, len: 0.3 },
        { d: ring(74, 20, 13), from: 0.3, to: 0.76, len: 0.2 },
      ],
      beats: [{ target: "node", at: 0.78 }],
    },
  ),
];

/** Cierre y /contacto, «Qué pasa después» (finalCta.next). Tres siluetas
 * distintas (sobre, bocadillo, documento) unidas por el mismo hilo, que
 * llega a cada una por la izquierda a media altura: es una sola conversación.
 * El hilo entre iconos y el pulso que lo recorre los dibuja StepWire.ts. */
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

/** Dónde entra el hilo en cada icono de STEP_GLYPHS, dónde está su nodo y por
 * dónde sale (x en el lienzo de 96, todo a media altura salvo el nodo). */
export const STEP_PORTS = [
  { in: 48, node: 68, out: 88 },
  { in: 38, node: 76, out: 88 },
  { in: 54, node: 73, out: 82 },
];
