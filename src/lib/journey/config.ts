// El recorrido de la portada: fotogramas, tiempos y todos los números del
// movimiento. Los fotogramas los renderiza Blender (scripts/journey/) y viven
// en public/journey/<versión>/: si se vuelven a renderizar, cambia la versión
// (el .htaccess los cachea un año como inmutables).

import { withBase } from "@/lib/base";

export const FRAME_COUNT = 120;
/** Proporción de los fotogramas (1600 × 900, WebP; la profundidad, 800 × 450). */
export const FRAME_ASPECT = 16 / 9;

const DIR = "/journey/v1";
const pad = (i: number) => String(i).padStart(3, "0");
export const colorUrl = (i: number) => withBase(`${DIR}/journey-${pad(i)}.webp`);
export const depthUrl = (i: number) => withBase(`${DIR}/depth-${pad(i)}.webp`);

/**
 * El primer fotograma, pedido desde el <head> de la portada (va en las
 * páginas, que son de servidor). Con crossorigin, como lo pide después la
 * secuencia: así se reutiliza la misma descarga.
 */
export function preloadFirstFrame(preload: (href: string, options: { as: "image"; crossOrigin: "anonymous"; fetchPriority: "high" }) => void) {
  for (const href of [colorUrl(0), depthUrl(0)]) preload(href, { as: "image", crossOrigin: "anonymous", fetchPriority: "high" });
}

export const SCROLL_SMOOTHING = 0.09; // por fotograma a 60 fps
export const DEPTH_STRENGTH = { x: 0.0144, y: 0.0108 };
export const POINTER_SMOOTHING = 0.3; // por fotograma a 60 fps (el brillo sigue al puntero de cerca)
export const CURSOR_SMOOTHING = 0.2; // por fotograma a 60 fps

export type Range = readonly [number, number];
export type Timing = { enter?: Range; exit?: Range };

/** En progreso del scroll, de 0 a 1. */
export const TIMING = {
  // El nombre grande se va en cuanto empieza el scroll; el resto de la
  // entrada, justo después (las partículas empiezan a bajar a las raíces).
  name: { exit: [0.004, 0.04] },
  hero: { exit: [0.015, 0.07] },
  mid: { enter: [0.3, 0.36], exit: [0.46, 0.53] },
  // El árbol, con sus tarjetas y su lema; todo se va antes de que llegue
  // «01 — Estudio», que sube por encima en el último tramo (desde ~0,72 con
  // --journey-scene-h: 460vh; ver --journey-handoff en tokens.css).
  cards: { enter: [0.6, 0.66], exit: [0.7, 0.76] },
  final: { enter: [0.61, 0.67], exit: [0.69, 0.75] },
} satisfies Record<string, Timing>;

export const ENTER_RISE = 24; // px de diseño
export const EXIT_LIFT = -16; // px de diseño

export const MIN_LOADER_MS = 1500;
export const LOADER_TIMEOUT_MS = 8000;
export const BURN_MS = 1150;
export const INTRO_AT_MS = 760;
export const CARD_BLUR = 24; // px CSS
