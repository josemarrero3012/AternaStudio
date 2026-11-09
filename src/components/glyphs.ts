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

/** Rectángulo de esquinas redondas como trazo: empieza tras la esquina de
 * arriba a la izquierda y va en el sentido del reloj. */
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y}`;

// Servicios ---------------------------------------------------------------
// Mismo nivel que los pilares: cada uno es una pequeña escena reconocible
// (no un hilo suelto), que llena el panel negro y tiene su bucle.

// «Diseño y desarrollo web»: una ventana de navegador con la maqueta dentro.
const WEB_FRAME = rrect(6, 3, 84, 34, 3);
const WEB_BAR = "M6 10 H90";
const WEB_HERO = rrect(12, 14, 44, 12, 2);
const WEB_TEXT = ["M62 15 H84", "M62 19.5 H78", "M62 24 H82"];
const WEB_CARDS = ["M12 31.5 H26", "M33 31.5 H47", "M54 31.5 H68"];

// «SEO»: la búsqueda arriba y, debajo, los resultados; el tuyo, el primero.
const SEO_SEARCH = rrect(6, 3, 84, 9, 4.5);
const SEO_LENS = ring(12, 7.5, 2.1);
const SEO_QUERY = "M19 7.5 H46";
const SEO_FIRST = "M10 19 H58";
const SEO_REST = ["M10 23 H68", "M10 29.5 H48", "M10 33.5 H62"];
// Y a la derecha, la flecha que sube: tu resultado escala posiciones.
const SEO_CLIMB = "M82 36 V17";
const SEO_HEAD = "M77.5 21.5 L82 17 L86.5 21.5";

// «Mantenimiento»: tres servidores con su piloto, conectados a un escudo.
const RACKS = [4, 15.5, 27].map((y) => rrect(6, y, 42, 9, 2));
const RACK_SLOTS = [8.5, 20, 31.5].map((y) => `M18 ${y} H40`);
const RACK_BUS = "M48 8.5 H54 V31.5 H48 M54 20 H64";
const SHIELD = "M76 4 L88 8 V18 Q88 30 76 36 Q64 30 64 18 V8 L76 4";
const SHIELD_CHECK = "M70 19.5 L74.5 24 L82.5 15";

// «Asistente telefónico»: el auricular, la voz que sale y la llamada atendida.
const HANDSET =
  "M11 9 Q8 9 7 12 Q5 20 13 29 Q21 37 28 34 Q30.5 33 30 30.5 L27.5 27.5 Q26.5 26 24.5 27 L22 28.5 Q17 25.5 14 20 L15.5 17.5 Q16.5 15.5 15 14 L12.5 10 Q12 9 11 9";
const CALL_ARCS = ["M35 15 Q38 20 35 25", "M39 11 Q44 20 39 29"];
const VOICE = "M46 20 Q49 11 52 20 Q55 31 58 20 Q61 5 64 20 Q67 35 70 20 Q73 13 76 20";
const VOICE_TAIL = "M76 20 H88";

/** Portada, /servicios y cada ficha: el dibujo de cada servicio, en el panel
 * negro de su tarjeta (tamaño xl). Mismo orden que pricing (slug). */
export const SERVICE_GLYPHS = {
  // La ventana se dibuja, luego la maqueta; en bucle, un pulso rodea la
  // ventana, otro recorre la cabecera de la página y el botón se enciende.
  web: glyph(
    [
      { d: WEB_FRAME, dur: 1.8 },
      { d: WEB_BAR, delay: 1, dur: 0.6, faint: true },
      { d: WEB_HERO, delay: 1.3, dur: 1 },
      ...WEB_TEXT.map((d, k) => ({ d, delay: 1.6 + k * 0.12, dur: 0.5, faint: k > 0 })),
      ...WEB_CARDS.map((d, k) => ({ d, delay: 1.9 + k * 0.12, dur: 0.4, faint: true })),
    ],
    [
      { x: 10.5, y: 6.5, delay: 1.2 },
      { x: 14.5, y: 6.5, delay: 1.3 },
      { x: 18.5, y: 6.5, delay: 1.4 },
    ],
    { x: 81, y: 31.5, delay: 2.4 },
    {
      dur: 5,
      pulses: [
        { d: WEB_FRAME, from: 0, to: 0.5, len: 0.12 },
        { d: WEB_HERO, from: 0.3, to: 0.62, len: 0.2 },
        { d: WEB_TEXT[0], from: 0.5, to: 0.62, len: 0.5 },
      ],
      beats: [
        { target: 0, at: 0.06 },
        { target: 1, at: 0.1 },
        { target: 2, at: 0.14 },
        { target: "node", at: 0.68 },
      ],
    },
  ),
  // Se escribe la búsqueda y aparece tu resultado arriba, con su nodo.
  seo: glyph(
    [
      { d: SEO_SEARCH, dur: 1.4 },
      { d: SEO_LENS, delay: 0.9, dur: 0.4, faint: true },
      { d: SEO_QUERY, delay: 1.2, dur: 0.6 },
      { d: SEO_FIRST, delay: 1.7, dur: 0.6 },
      ...SEO_REST.map((d, k) => ({ d, delay: 1.9 + k * 0.12, dur: 0.5, faint: true })),
      { d: ring(64, 19, 3.2), delay: 2.3, dur: 0.4 },
      { d: SEO_CLIMB, delay: 2, dur: 0.6 },
      { d: SEO_HEAD, delay: 2.5, dur: 0.3 },
    ],
    undefined,
    { x: 64, y: 19, delay: 2.4 },
    {
      dur: 4.8,
      pulses: [
        { d: SEO_QUERY, from: 0, to: 0.24, len: 0.4 },
        { d: SEO_CLIMB, from: 0.26, to: 0.44, len: 0.4 },
        { d: SEO_FIRST, from: 0.4, to: 0.62, len: 0.3 },
      ],
      beats: [{ target: "node", at: 0.64 }],
    },
  ),
  // Los pilotos laten uno tras otro, el pulso baja por el bus hasta el
  // escudo, lo rodea y el visto se enciende.
  mantenimiento: glyph(
    [
      ...RACKS.map((d, k) => ({ d, delay: k * 0.2, dur: 1.2 })),
      ...RACK_SLOTS.map((d, k) => ({ d, delay: 0.9 + k * 0.15, dur: 0.4, faint: true })),
      { d: RACK_BUS, delay: 1.3, dur: 0.6, faint: true },
      { d: SHIELD, delay: 1.5, dur: 1.2 },
      { d: SHIELD_CHECK, delay: 2.4, dur: 0.4 },
    ],
    [
      { x: 11.5, y: 8.5, delay: 1 },
      { x: 11.5, y: 20, delay: 1.15 },
      { x: 11.5, y: 31.5, delay: 1.3 },
    ],
    { x: 74.5, y: 24, delay: 2.7 },
    {
      dur: 5,
      pulses: [
        { d: "M54 20 H64", from: 0.3, to: 0.38, len: 0.6 },
        { d: SHIELD, from: 0.38, to: 0.72, len: 0.16 },
      ],
      beats: [
        { target: 0, at: 0.06 },
        { target: 1, at: 0.14 },
        { target: 2, at: 0.22 },
        { target: "node", at: 0.76 },
      ],
    },
  ),
  // Suena, la voz sale del auricular en ondas, vibra al contestar y la
  // llamada llega a su nodo: atendida.
  "asistente-ia": glyph(
    [
      { d: HANDSET, dur: 1.4 },
      ...CALL_ARCS.map((d, k) => ({ d, delay: 1 + k * 0.15, dur: 0.4, faint: k > 0 })),
      { d: VOICE, delay: 1.4, dur: 0.9 },
      { d: VOICE_TAIL, delay: 2.2, dur: 0.4 },
    ],
    undefined,
    { x: 88, y: 20, delay: 2.5 },
    {
      dur: 4.6,
      pulses: [
        { d: CALL_ARCS[0], from: 0, to: 0.1, len: 0.6 },
        { d: CALL_ARCS[1], from: 0.06, to: 0.18, len: 0.6 },
        { d: VOICE_TAIL, from: 0.54, to: 0.66, len: 0.5 },
      ],
      voice: { line: 3, y: 20, from: 0.18, to: 0.54 },
      beats: [{ target: "node", at: 0.68 }],
    },
  ),
};

// En qué creemos (/estudio) -------------------------------------------------
// Antes eran ilustraciones aparte, con otro estilo; ahora hablan como los
// pilares de la portada.

// «Primero la auditoría»: la lupa sobre la línea rota; el nodo es la rotura.
const AUDIT_A = "M4 26 H40";
const AUDIT_B = "M50 26 H92";
const AUDIT_LENS = ring(45, 24, 8.5);
const AUDIT_HANDLE = "M51 30 L58 37";
const AUDIT_PAGE = ["M4 9 H30", "M4 14 H22", "M66 9 H92", "M74 14 H92"];

// «Ninguna cifra inventada»: tres barras con su valor real; sobre la del
// medio, la cifra inflada, apenas un trazo apagado.
const BARS = ["M20 36 V24 H30 V36", "M43 36 V14 H53 V36", "M66 36 V20 H76 V36"];
const BAR_GHOST = "M43 14 V3 H53 V14";

// «El movimiento con motivo»: la curva de la marca con sus tiradores y,
// abajo, el recorrido que sigue.
const EASE = "M8 33 C24 5 40 5 88 5";
const EASE_HANDLES = "M8 33 L24 5 M88 5 L40 5";
const EASE_TRACK = "M8 38 H88";

export const BELIEF_GLYPHS = [
  glyph(
    [
      { d: AUDIT_A, dur: 1 },
      { d: AUDIT_B, delay: 0.4, dur: 1.2 },
      ...AUDIT_PAGE.map((d, k) => ({ d, delay: 0.6 + k * 0.1, dur: 0.4, faint: true })),
      { d: AUDIT_LENS, delay: 1.4, dur: 0.8 },
      { d: AUDIT_HANDLE, delay: 2, dur: 0.3 },
    ],
    [
      { x: 16, y: 26, delay: 1 },
      { x: 66, y: 26, delay: 1.4 },
      { x: 82, y: 26, delay: 1.5 },
    ],
    { x: 45, y: 26, delay: 2.2 },
    {
      dur: 4.8,
      pulses: [
        { d: AUDIT_A, from: 0, to: 0.3, len: 0.3 },
        { d: AUDIT_LENS, from: 0.34, to: 0.66, len: 0.18 },
      ],
      beats: [
        { target: 0, at: 0.14 },
        { target: "node", at: 0.32 },
      ],
    },
  ),
  glyph(
    [
      { d: "M8 36 H88", dur: 1, faint: true },
      ...BARS.map((d, k) => ({ d, delay: 0.5 + k * 0.2, dur: 1 })),
      { d: BAR_GHOST, delay: 1.8, dur: 0.6, faint: true },
    ],
    [
      { x: 25, y: 24, delay: 1.5 },
      { x: 71, y: 20, delay: 1.9 },
    ],
    { x: 48, y: 14, delay: 1.7 },
    {
      dur: 4.6,
      pulses: BARS.map((d, k) => ({ d, from: k * 0.1, to: k * 0.1 + 0.4, len: 0.2 })),
      beats: [
        { target: 0, at: 0.24 },
        { target: "node", at: 0.34 },
        { target: 1, at: 0.44 },
      ],
    },
  ),
  glyph(
    [
      { d: EASE_HANDLES, dur: 0.8, faint: true },
      { d: EASE, delay: 0.4, dur: 1.6 },
      { d: EASE_TRACK, delay: 0.8, dur: 1, faint: true },
    ],
    [
      { x: 24, y: 5, delay: 0.8 },
      { x: 40, y: 5, delay: 0.9 },
    ],
    { x: 88, y: 5, delay: 2 },
    {
      dur: 4.4,
      pulses: [
        { d: EASE, from: 0, to: 0.6, len: 0.12 },
        { d: EASE_TRACK, from: 0, to: 0.6, len: 0.06 },
      ],
      beats: [{ target: "node", at: 0.62 }],
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
