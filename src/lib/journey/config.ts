// El recorrido de la portada: fotogramas, tiempos y todos los números del
// movimiento. Los fotogramas los renderiza Blender (scripts/journey/) y viven
// en public/journey/<versión>/: si se vuelven a renderizar, cambia la versión
// (el .htaccess los cachea un año como inmutables).

import { withBase } from "@/lib/base";

export const FRAME_COUNT = 120;
/** Proporción de lo visible de cada fotograma (16:9). */
export const FRAME_ASPECT = 16 / 9;

const DIR = "/journey/v2";
const pad = (i: number) => String(i).padStart(3, "0");
const asset = (path: string) => withBase(`${DIR}/${path}`);

/** El manifiesto: cajas de las capas, modelos de profundidad y pesos (lo escribe post.py). */
export const MANIFEST_URL = asset("journey.json");

/**
 * Familias de imágenes. `layers`: base + atlas por capas, para el paralaje
 * (ordenador con ratón). `flat`: todo compuesto, apaisado. `portrait`: el
 * centro 3:4 de la plana (móvil en vertical). `fallback`: WebP plano para
 * navegadores sin AVIF.
 */
export type Family = "layers" | "flat" | "portrait" | "fallback";

export function frameUrls(family: Family, tier: number, i: number) {
  switch (family) {
    case "layers":
      return [asset(`layers/${tier}/f${pad(i)}-base.avif`), asset(`layers/${tier}/f${pad(i)}-atlas.avif`)];
    case "flat":
      return [asset(`flat/${tier}/f${pad(i)}.avif`)];
    case "portrait":
      return [asset(`portrait/${tier}/f${pad(i)}.avif`)];
    case "fallback":
      return [asset(`fallback/f${pad(i)}.webp`)];
  }
}

/** La versión ligera de cada familia (la menor resolución que escribe post.py). */
export const LIGHT_TIER: Record<Family, number> = { layers: 1280, flat: 1280, portrait: 720, fallback: 1920 };

/** Sin JavaScript: el primer fotograma plano. */
export const POSTER = { avif: frameUrls("flat", 1920, 0)[0], webp: frameUrls("fallback", 0, 0)[0] };

/** Proporción (ancho / alto) por debajo de la cual se usa el recorte vertical 3:4. */
export const PORTRAIT_ASPECT = 0.75;

/** Consultas de familia, para precargar desde el <head> solo lo que se va a usar. */
const FINE = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const PRELOADS: { family: Family; media: string }[] = [
  { family: "portrait", media: `(max-aspect-ratio: 3/4)` },
  // Exactamente 3:4 es vertical (como en chooseFamily): lo apaisado empieza justo después.
  { family: "layers", media: `(min-aspect-ratio: 751/1000) and ${FINE}` },
  { family: "flat", media: `(min-aspect-ratio: 751/1000) and (not (${FINE}))` },
];

/**
 * El manifiesto y el fotograma 0 ligero de la familia que toca, pedidos
 * desde el <head> de la portada (va en las páginas, que son de servidor). Con
 * `as: "fetch"`: la secuencia los pide con fetch y reutiliza la descarga.
 */
export function preloadJourney(
  preload: (href: string, options: { as: "fetch"; crossOrigin: "anonymous"; fetchPriority: "high"; media?: string }) => void,
) {
  preload(MANIFEST_URL, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "high" });
  for (const { family, media } of PRELOADS) {
    for (const href of frameUrls(family, LIGHT_TIER[family], 0)) preload(href, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "high", media });
  }
}

export const SCROLL_SMOOTHING = 0.09; // por fotograma a 60 fps
export const POINTER_SMOOTHING = 0.055; // por fotograma a 60 fps
export const CURSOR_SMOOTHING = 0.2; // por fotograma a 60 fps

/** Fundido de la versión ligera a la HD del mismo fotograma. */
export const HD_FADE_MS = 150;
/** Ventanas (en fotogramas) alrededor del actual: descarga y decodificación. */
export const WINDOW = { lightDecode: 2, hdDecode: 1, hdFetch: 1, hdIdleFetch: 3 };
/** Por encima de esta velocidad del scroll (fotogramas/s) no se pide ni se decodifica HD. */
export const HD_MAX_SPEED = 8;
/** Caché de bytes comprimidos de la HD (la ligera se guarda entera). */
export const HD_CACHE_MB = { desktop: 60, mobile: 20 };

export type Range = readonly [number, number];
export type Timing = { enter?: Range; exit?: Range };

/** En progreso del scroll, de 0 a 1. */
export const TIMING = {
  hero: { exit: [0.16, 0.28] },
  mid: { enter: [0.38, 0.46], exit: [0.58, 0.68] },
  cards: { enter: [0.76, 0.84] },
  final: { enter: [0.82, 0.9] },
} satisfies Record<string, Timing>;

export const ENTER_RISE = 24; // px de diseño
export const EXIT_LIFT = -16; // px de diseño

export const MIN_LOADER_MS = 1500;
export const LOADER_TIMEOUT_MS = 8000;
export const BURN_MS = 1150;
export const INTRO_AT_MS = 760;
export const CARD_BLUR = 24; // px CSS
