// Iconos de las listas fijas de la web, en el mismo orden que sus textos en
// dict.ts (igual en los dos idiomas). Cada uno dibuja la frase clave de su
// punto con el vocabulario de Trace.tsx: filamento, puntos y nodo. Las
// ilustraciones de «En qué creemos» van aparte, en BeliefArt.tsx.

import { glyph, ring } from "./Trace";

/** Trazo muestreado de una función y(x) entre x0 y x1, para curvas que no
 * caben en un par de béziers (la hélice). Coordenadas redondeadas a 0,01: el
 * SVG sale igual en el servidor y en el navegador. */
function curve(f: (x: number) => number, x0: number, x1: number, steps = 64) {
  const pts: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const x = x0 + ((x1 - x0) * k) / steps;
    pts.push(`${x.toFixed(2)} ${f(x).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
}

/** Elipse como trazo: empieza en su punto izquierdo y sube en el sentido del reloj. */
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;

// Hélice de «Quien diseña, programa»: dos hebras que se cruzan tres veces
// y, ya separadas, se cierran suaves en el nodo.
const HELIX_END = 80;
const CROSS_END = 58;
const helixAmp = (x: number) => {
  const t = Math.min(1, Math.max(0, (x - CROSS_END) / (HELIX_END - CROSS_END)));
  return 13 * (1 - t * t * (3 - 2 * t));
};
const helix = (sign: 1 | -1) =>
  curve((x) => 20 - sign * helixAmp(x) * Math.cos((3 * Math.PI * Math.min(x, CROSS_END)) / CROSS_END), 2, HELIX_END, 96);
const HELIX_A = helix(1);
const HELIX_B = helix(-1);
const HELIX_TAIL = `M${HELIX_END} 20 H88`;

// Código de «El código es tuyo»: líneas sangradas entre dos llaves { }.
const CODE: [number, number, number][] = [
  [22, 9, 36],
  [27, 14, 24],
  [27, 19, 30],
  [32, 24, 16],
  [27, 29, 20],
  [22, 34, 10],
];
const CODE_LINES = CODE.map(([x, y, l]) => `M${x} ${y} H${x + l}`);
const BRACE_L = "M15 2 Q10 2 10 7 V15 Q10 20 5 20 Q10 20 10 25 V33 Q10 38 15 38";
const BRACE_R = "M81 2 Q86 2 86 7 V15 Q86 20 91 20 Q86 20 86 25 V33 Q86 38 81 38";

// Órbita de «Pocos proyectos a la vez»: tres proyectos sobre una órbita; el
// tuyo, abajo a la izquierda, con su anillo.
const ORBIT = ellipse(48, 20, 38, 13);
const r2 = (v: number) => Math.round(v * 100) / 100;
const at = (deg: number) => ({ x: r2(48 + 38 * Math.cos((deg * Math.PI) / 180)), y: r2(20 + 13 * Math.sin((deg * Math.PI) / 180)) });
const YOURS = at(125);
const OTHER_1 = at(215);
const OTHER_2 = at(340);

/** Portada, «Estudio»: los tres compromisos (studioHome.pillars). Van grandes
 * en su tarjeta (tamaño xl) y se mueven en bucle (`flow`, ver Trace.tsx). */
export const PILLAR_GLYPHS = [
  // «Quien diseña, programa»: dos hebras, diseño y código, que se trenzan
  // hasta hacerse una en el nodo. En bucle: un pulso recorre cada hebra a la
  // vez, se juntan y el nodo se enciende.
  glyph(
    [
      { d: HELIX_A, dur: 2 },
      { d: HELIX_B, dur: 2 },
      { d: HELIX_TAIL, delay: 1.8, dur: 0.4 },
    ],
    undefined,
    { x: 88, y: 20, delay: 2.1 },
    {
      dur: 4.4,
      pulses: [
        { d: HELIX_A, from: 0, to: 0.62, len: 0.16 },
        { d: HELIX_B, from: 0, to: 0.62, len: 0.16 },
        { d: HELIX_TAIL, from: 0.62, to: 0.7, len: 0.6 },
      ],
      beats: [{ target: "node", at: 0.7 }],
    },
  ),
  // «El código es tuyo»: el código, abierto y legible entre dos llaves, con
  // el cursor al final de una línea. En bucle: un pulso lee cada línea, una
  // tras otra, y el cursor (el nodo) late al acabar.
  glyph(
    [
      { d: BRACE_L, dur: 1.2, faint: true },
      { d: BRACE_R, dur: 1.2, faint: true },
      ...CODE_LINES.map((d, k) => ({ d, delay: 0.5 + k * 0.15, dur: 0.6 })),
    ],
    undefined,
    { x: 61, y: 19, delay: 1.8 },
    {
      dur: 4.6,
      pulses: CODE_LINES.map((d, k) => ({ d, from: k * 0.11, to: k * 0.11 + 0.1, len: 0.35 })),
      beats: [{ target: "node", at: 0.68 }],
    },
  ),
  // «Pocos proyectos a la vez»: solo tres proyectos en la órbita y el tuyo
  // con su propio anillo. En bucle: un pulso da la vuelta a la órbita y, al
  // pasar por el tuyo, se enciende.
  glyph(
    [
      { d: ORBIT, dur: 2.2 },
      { d: ring(YOURS.x, YOURS.y, 4.5), delay: 1.6, dur: 0.6 },
      { d: ring(OTHER_1.x, OTHER_1.y, 3), delay: 1.2, dur: 0.5, faint: true },
      { d: ring(OTHER_2.x, OTHER_2.y, 3), delay: 1.4, dur: 0.5, faint: true },
    ],
    undefined,
    { ...YOURS, delay: 2 },
    {
      dur: 4.8,
      pulses: [{ d: ORBIT, from: 0, to: 0.9, len: 0.14 }],
      beats: [{ target: "node", at: 0.77 }],
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
