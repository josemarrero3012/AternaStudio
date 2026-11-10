// El recorrido de la portada: tiempos y todos los números del movimiento.
// El árbol de partículas tiene los suyos en src/lib/tree/config.ts.

export const SCROLL_SMOOTHING = 0.09; // por fotograma a 60 fps
export const POINTER_SMOOTHING = 0.3; // por fotograma a 60 fps (el brillo sigue al puntero de cerca)
export const CURSOR_SMOOTHING = 0.2; // por fotograma a 60 fps

export type Range = readonly [number, number];
export type Timing = { enter?: Range; exit?: Range };

/** En progreso del scroll, de 0 a 1. */
export const TIMING = {
  // El nombre grande se va en cuanto empieza el scroll; el resto de la
  // entrada, justo después (las partículas empiezan a bajar a las raíces).
  name: { exit: [0.003, 0.03] },
  hero: { exit: [0.01, 0.05] },
  mid: { enter: [0.22, 0.26], exit: [0.33, 0.38] },
  // Con el árbol ya formado, el texto que se escribe (WRITE); se va antes
  // de que llegue «01 — Estudio», que sube por encima en el último tramo
  // (desde 0,8 con --journey-scene-h: 600vh: (600 − 200) / (600 − 100)).
  write: { enter: [0.46, 0.5], exit: [0.73, 0.78] },
} satisfies Record<string, Timing>;

/** Cuándo se escribe el texto, de la primera letra a la última. */
export const WRITE: Range = [0.48, 0.7];

export const ENTER_RISE = 24; // px de diseño
export const EXIT_LIFT = -16; // px de diseño
