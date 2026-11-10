// El árbol de partículas de la portada: todos los números en un sitio.
//
// La técnica es la de las portadas de partículas en WebGL (la del tigre de
// TIGRIS): miles de puntos que dibujan una forma sacada de una imagen y que,
// al hacer scroll, se deshacen y se rehacen en otra. Aquí las formas son tres:
// el árbol del símbolo de Aterna, sus raíces y un árbol de verdad que crece de
// ellas y que, al subir «01 — Estudio», se suelta en luz. Las partículas
// llegan dispersas al abrir la página y brillan al pasar el puntero (no se
// mueven con él).

import { withBase } from "@/lib/base";

/** Si cambia la máscara, nueva carpeta (el .htaccess cachea un año). */
const DIR = "/tree/v1";
/** Silueta del símbolo, 512 × 512, blanco = árbol (scripts/tree/make-mask.py). */
export const MASK_URL = withBase(`${DIR}/mark-mask.webp`);
/** Imagen fija para sin JavaScript y sin WebGL (captura del árbol de partículas). */
export const POSTER_URL = withBase(`${DIR}/poster.webp`);

/** La máscara se pide desde el <head> de la portada, como la pide después el script. */
export function preloadTree(preload: (href: string, options: { as: "image"; crossOrigin: "anonymous"; fetchPriority: "high" }) => void) {
  preload(MASK_URL, { as: "image", crossOrigin: "anonymous", fetchPriority: "high" });
}

/** Partículas según el ancho de la pantalla. */
export function particleCount(width: number) {
  if (width < 640) return 30000;
  if (width < 1024) return 44000;
  return 76000;
}

/** Polvo que flota en toda la escena. */
export const DUST_SHARE = 0.07;
/** Parte de las partículas (sin el polvo) que forman la copa del árbol final. */
export const LEAF_SHARE = 0.6;
/** Parte de las partículas del árbol que se reservan al contorno: le da filo. */
export const EDGE_SHARE = 0.22;

/** Semilla fija: la misma escena en cada carga. */
export const SEED = 20261108;

/** Cámara: campo de visión vertical y distancia al plano del árbol. */
export const FOV = (35 * Math.PI) / 180;
export const CAMERA_Z = 5;

/** Morfologías, en progreso del scroll del recorrido (0 a 1). */
export const MORPH = {
  /** Del símbolo a las raíces («Lo que no se ve…»). */
  roots: [0.03, 0.23] as const,
  /** De las raíces al árbol: crece del tronco a la copa. */
  final: [0.33, 0.47] as const,
};

/** La entrada: las partículas llegan desde la profundidad y forman el árbol. */
export const ASSEMBLE_MS = 2600;
/** Al volver a la portada sin recargar, una entrada más corta. */
export const ASSEMBLE_AGAIN_MS = 1500;

/**
 * El brillo del puntero: radio (unidades de escena; el árbol de la entrada
 * mide ~2 de diámetro), puntos de la estela (con la cabeza) y en cuánto se
 * apaga la estela (s, constante de tiempo).
 */
export const GLOW = { radius: 0.24, trail: 10, fade: 0.35 };

/** Tamaño base del punto en px CSS (se multiplica por el dpr). */
export const POINT_SIZE = 2.3;
