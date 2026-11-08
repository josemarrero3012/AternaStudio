// El árbol de partículas de la portada: todos los números en un sitio.
//
// La técnica es la de las portadas de partículas en WebGL (la del tigre de
// TIGRIS): miles de puntos que dibujan una forma sacada de una imagen y que,
// al hacer scroll, se deshacen y se rehacen en otra. Aquí las formas son tres:
// el árbol del símbolo de Aterna, sus raíces y el árbol otra vez, ya crecido,
// dentro de su anillo. Las partículas llegan dispersas al abrir la página y
// se apartan del puntero.

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

/** Partículas según el ancho de la pantalla (y la mitad con movimiento reducido no hace falta: no se animan). */
export function particleCount(width: number) {
  if (width < 640) return 26000;
  if (width < 1024) return 38000;
  return 56000;
}

/** Reparto: polvo que flota en toda la escena y anillo del árbol final. */
export const DUST_SHARE = 0.07;
export const RING_SHARE = 0.11;
/** Parte de las partículas del árbol que se reservan al contorno: le da filo. */
export const EDGE_SHARE = 0.32;

/** Semilla fija: la misma escena en cada carga. */
export const SEED = 20261108;

/** Cámara: campo de visión vertical y distancia al plano del árbol. */
export const FOV = (35 * Math.PI) / 180;
export const CAMERA_Z = 5;

/** Morfologías, en progreso del scroll del recorrido (0 a 1). */
export const MORPH = {
  /** Del árbol a las raíces («Lo que no se ve…»). */
  roots: [0.12, 0.44] as const,
  /** De las raíces al árbol crecido, con las tarjetas. */
  final: [0.56, 0.86] as const,
};

/** La entrada: las partículas llegan desde la profundidad y forman el árbol. */
export const ASSEMBLE_MS = 2600;
/** Al volver a la portada sin recargar, una entrada más corta. */
export const ASSEMBLE_AGAIN_MS = 1500;

/** Rotación máxima con el puntero (radianes) y vaivén lento del árbol. */
export const TILT = { yaw: 0.32, pitch: 0.14 };
export const SWAY = 0.06;

/** Empuje del puntero: radio (unidades de escena) y fuerza. */
export const REPEL = { radius: 0.26, strength: 0.17 };

/** Tamaño base del punto en px CSS (se multiplica por el dpr). */
export const POINT_SIZE = 2.3;
