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

export const MIN_LOADER_MS = 1500;
export const LOADER_TIMEOUT_MS = 8000;
export const BURN_MS = 1150;
export const INTRO_AT_MS = 760;
