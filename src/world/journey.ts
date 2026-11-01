// El recorrido de la cámara por la portada, atado al scroll nativo (no se
// secuestra la rueda: se suaviza la cámara, no el desplazamiento).
//
//   u 0 → 1  Acto 0, el Sello: quieto, a la derecha del titular.
//   u 1 → 2  La cámara avanza y cruza el árbol por el hueco de su izquierda.
//   u 2 → 3  Al otro lado: niebla lavanda, el suelo y las raíces debajo.
//   u 3 → 4  Acto 1, el estudio: la escena se queda quieta mientras se lee.
//   u 4 → 5  Baja bajo la línea del suelo y se inclina hacia las raíces.
//   u 5 → 6  Acto 2, el método (sección fijada): recorre las raíces de
//            izquierda a derecha y cada fase enciende un nudo.
//   u 6 → 7  Se apaga antes de los servicios.
//
// Las paradas (posiciones de scroll de cada u entero) se miden en la página;
// entre paradas, cada valor se interpola con una curva suave.

import { Color, Vector3 } from "three";
import { ScrollTrigger } from "@/lib/motion";

export type Key = {
  pos: Vector3;
  tgt: Vector3;
  /** Desplazamiento de la imagen en coordenadas de pantalla (−1…1). */
  shift: [number, number];
  bg: Color;
  fog: number;
  roots: number;
  pulse: number;
  ground: number;
  rise: number;
  dust: number;
  halo: number;
  opacity: number;
};

export const NIGHT = new Color("#13163b");
const MIST = new Color("#181c4b");
export const ABYSS = new Color("#0a0c22");

/** El hueco a la izquierda del tronco, por donde se cruza el árbol (radio del Sello = 1). */
export const HOLE = new Vector3(-0.5, -0.2, 0);

/** Radio exterior del Sello con su anillo. */
export const SEAL_R = 1.2;
const FOV = 30;

/**
 * Dónde y a qué tamaño se ve el Sello en el acto 0 según la ventana: a la
 * derecha del titular, con el diámetro más pequeño de 64 % del alto o 40 %
 * del ancho.
 */
export function sealFraming(w: number, h: number) {
  const frac = Math.min(0.64, (0.4 * w) / h);
  const distance = (2 * SEAL_R) / (frac * 2 * Math.tan(((FOV / 2) * Math.PI) / 180));
  const diameter = frac * h;
  const cx = 1 - (0.06 * w + diameter / 2) / w;
  return { distance, shiftX: 2 * cx - 1, shiftY: 0.07 };
}

export const CAMERA_FOV = FOV;

const key = (k: Omit<Key, "pos" | "tgt"> & { pos: [number, number, number]; tgt: [number, number, number] }): Key => ({
  ...k,
  pos: new Vector3(...k.pos),
  tgt: new Vector3(...k.tgt),
});

export function buildKeys(w: number, h: number): Key[] {
  const { distance: D, shiftX: sx, shiftY: sy } = sealFraming(w, h);
  const surface = { bg: NIGHT, fog: 0.022, roots: 0.5, pulse: 0.8, ground: 0.35, rise: 0, dust: 0.8, halo: 1, opacity: 1 };
  return [
    // 0 · El Sello
    key({ ...surface, pos: [0, 0, D], tgt: [0, 0, 0], shift: [sx, sy] }),
    // 1 · Empieza a acercarse
    key({ ...surface, pos: [-0.05, -0.02, D * 0.9], tgt: [-0.05, -0.02, 0], shift: [sx * 0.92, sy] }),
    // 2 · Dentro del hueco del árbol
    key({ ...surface, fog: 0.03, halo: 0.6, pos: [HOLE.x, HOLE.y, 0], tgt: [HOLE.x, HOLE.y - 0.02, -10], shift: [0, 0] }),
    // 3 · Al otro lado: el estudio
    key({ bg: MIST, fog: 0.05, roots: 0.38, pulse: 0.7, ground: 0.8, rise: 0, dust: 1, halo: 0, opacity: 1, pos: [HOLE.x, -0.55, -3.4], tgt: [-0.3, -1.45, -14], shift: [0, 0] }),
    // 4 · Fin del estudio, antes de bajar
    key({ bg: MIST, fog: 0.05, roots: 0.42, pulse: 0.75, ground: 0.8, rise: 0, dust: 1, halo: 0, opacity: 1, pos: [-0.75, -0.95, -3.8], tgt: [-0.5, -2.3, -14], shift: [0, 0] }),
    // 5 · Bajo tierra, primera fase. La cámara se ha retirado para ver la
    //     red entera bajo el árbol; mirada horizontal: la línea del suelo
    //     queda a media altura, donde el eje del método.
    key({ bg: ABYSS, fog: 0.045, roots: 0.72, pulse: 1, ground: 0.8, rise: 1, dust: 0.9, halo: 0, opacity: 1, pos: [-2.6, -1.75, 4.2], tgt: [-2.0, -1.75, -10], shift: [0, 0] }),
    // 6 · Última fase
    key({ bg: ABYSS, fog: 0.045, roots: 0.72, pulse: 1, ground: 0.8, rise: 1, dust: 0.9, halo: 0, opacity: 1, pos: [2.6, -1.78, 3.8], tgt: [2.0, -1.78, -10], shift: [0, 0] }),
    // 7 · Fuera. La imagen sube con la página (el eje del método se va
    //     hacia arriba) mientras se apaga.
    key({ bg: ABYSS, fog: 0.06, roots: 0.6, pulse: 1, ground: 0.4, rise: 1, dust: 0.6, halo: 0, opacity: 0, pos: [3.0, -1.8, 3.6], tgt: [2.4, -1.8, -10], shift: [0, 0.8] }),
  ];
}

/** Posiciones de scroll (px) de cada u entero. null si falta alguna sección. */
export function measureStations(): number[] | null {
  const vh = window.innerHeight;
  const studio = document.getElementById("estudio");
  const method = document.getElementById("metodo");
  if (!studio || !method) return null;
  const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  const pin = method.querySelector(".rail-pin");
  // El método se fija mientras pasan sus fases (ApproachRail): su tramo es
  // el de la cámara recorriendo las raíces.
  const rail = ScrollTrigger.getAll().find((st) => st.pin === pin);
  const methodTop = top(method);
  const railStart = rail ? rail.start : methodTop;
  const railEnd = rail ? Math.max(rail.end, railStart + vh) : methodTop + Math.max(method.offsetHeight - vh, vh);
  const studioTop = top(studio);
  const studioBottom = studioTop + studio.offsetHeight;
  const s = [
    0,
    vh * 0.1,
    studioTop - vh * 0.42,
    studioTop - vh * 0.06,
    Math.max(studioTop - vh * 0.06 + 1, studioBottom - vh * 1.05),
    railStart,
    railEnd,
    // Apagado del todo antes de que el titular de servicios llegue arriba.
    railEnd + vh * 0.4,
  ];
  // Siempre crecientes, aunque la página sea rara (zoom extremo).
  for (let i = 1; i < s.length; i++) s[i] = Math.max(s[i], s[i - 1] + 1);
  return s;
}

/** Scroll → u (0…7). */
export function journeyAt(y: number, stations: number[]) {
  if (y <= stations[0]) return 0;
  for (let i = 1; i < stations.length; i++) {
    if (y < stations[i]) return i - 1 + (y - stations[i - 1]) / (stations[i] - stations[i - 1]);
  }
  return stations.length - 1;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/** El estado de la escena en `u`, escrito en `out`. */
export function sample(keys: Key[], u: number, out: Key) {
  const i = Math.min(keys.length - 2, Math.max(0, Math.floor(u)));
  const raw = Math.min(1, Math.max(0, u - i));
  // Recorriendo las raíces (5 → 6) y al salir (6 → 7) la imagen va al paso
  // del scroll, como la página.
  const t = i >= 5 ? raw : ease(raw);
  const a = keys[i];
  const b = keys[i + 1];
  const mix = (x: number, y: number) => x + (y - x) * t;
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.tgt.lerpVectors(a.tgt, b.tgt, t);
  out.shift[0] = mix(a.shift[0], b.shift[0]);
  out.shift[1] = mix(a.shift[1], b.shift[1]);
  out.bg.lerpColors(a.bg, b.bg, t);
  out.fog = mix(a.fog, b.fog);
  out.roots = mix(a.roots, b.roots);
  out.pulse = mix(a.pulse, b.pulse);
  out.ground = mix(a.ground, b.ground);
  out.rise = mix(a.rise, b.rise);
  out.dust = mix(a.dust, b.dust);
  out.halo = mix(a.halo, b.halo);
  out.opacity = mix(a.opacity, b.opacity);
  return out;
}

export function blankKey(): Key {
  return { pos: new Vector3(), tgt: new Vector3(), shift: [0, 0], bg: new Color(), fog: 0, roots: 0, pulse: 0, ground: 0, rise: 0, dust: 0, halo: 0, opacity: 1 };
}
