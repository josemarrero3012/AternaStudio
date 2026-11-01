// El recorrido de la cámara por la portada, atado al scroll nativo (no se
// secuestra la rueda: se suaviza la cámara, no el desplazamiento).
//
//   u 0 → 1    Acto 0, el Sello: quieto, a la derecha del titular.
//   u 1 → 2    La cámara avanza y cruza el árbol por el hueco de su izquierda.
//   u 2 → 3    Al otro lado: niebla lavanda, el suelo y las raíces debajo.
//   u 3 → 4    Acto 1, el estudio: la escena se queda quieta mientras se lee.
//   u 4 → 5    Baja bajo la línea del suelo y se inclina hacia las raíces.
//   u 5 → 6    Acto 2, el método (sección fijada): recorre las raíces de
//              izquierda a derecha y cada fase enciende un nudo.
//   u 6 → 7    Se apaga al salir del método.
//   u 7 → 8    A oscuras, la cámara sube a la superficie, delante del árbol.
//   u 8 → 10   Acto 4, la copa (servicios): mira hacia arriba, a la copa
//              abierta, y gira unos 40° a su alrededor mientras pasan las
//              filas; cada una lleva su objeto (objects.ts).
//   u 10 → 11  Se aleja hasta ver el árbol entero en su anillo, junto al
//              titular del contacto.
//   u 11 → 12  Acto 5, la semilla: el Sello acompaña al titular y la
//              Semilla cae de la copa al botón (seed.ts).
//   u 12 → 13  Se apaga antes del pie.
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
  /** Luz difusa que cae de la copa (acto 4). */
  sky: number;
  /** Cuánto se ancla el Sello al titular del contacto (acto 5). */
  anchor: number;
  opacity: number;
};

export const NIGHT = new Color("#13163b");
const MIST = new Color("#181c4b");
export const ABYSS = new Color("#0a0c22");
/** La copa: algo más clara que la noche, más aire. */
const CANOPY = new Color("#171b4a");
/** El contacto: la noche con un punto violeta, más cálida. */
const DUSK = new Color("#1a1745");

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

/** Distancia a la que el Sello mide `diam` píxeles de diámetro. */
function sealDistance(diam: number, h: number) {
  return (2 * SEAL_R) / ((diam / h) * 2 * Math.tan(((FOV / 2) * Math.PI) / 180));
}

export function buildKeys(w: number, h: number, layout: Layout | null): Key[] {
  const { distance: D, shiftX: sx, shiftY: sy } = sealFraming(w, h);
  const surface = { bg: NIGHT, fog: 0.022, roots: 0.5, pulse: 0.8, ground: 0.35, rise: 0, dust: 0.8, halo: 1, sky: 0, anchor: 0, opacity: 1 };
  const under = { bg: ABYSS, fog: 0.045, roots: 0.72, pulse: 1, ground: 0.8, rise: 1, dust: 0.9, halo: 0, sky: 0, anchor: 0, opacity: 1 };
  const canopy = { bg: CANOPY, fog: 0.028, roots: 0, pulse: 0.6, ground: 0, rise: -0.35, dust: 0.85, halo: 0.35, sky: 0.7, anchor: 0, opacity: 1 };
  // Acto 5: el Sello del tamaño que quepa junto al titular del contacto.
  const D5 = sealDistance(layout?.seal.diam ?? h * 0.33, h);
  const anchorX = layout ? (layout.seal.x / w) * 2 - 1 : 0.6;
  const dusk = { bg: DUSK, fog: 0.012, roots: 0, pulse: 0.6, ground: 0, rise: -0.2, dust: 0.75, halo: 1, sky: 0.25, anchor: 1, opacity: 1 };
  return [
    // 0 · El Sello
    key({ ...surface, pos: [0, 0, D], tgt: [0, 0, 0], shift: [sx, sy] }),
    // 1 · Empieza a acercarse
    key({ ...surface, pos: [-0.05, -0.02, D * 0.9], tgt: [-0.05, -0.02, 0], shift: [sx * 0.92, sy] }),
    // 2 · Dentro del hueco del árbol
    key({ ...surface, fog: 0.03, halo: 0.6, pos: [HOLE.x, HOLE.y, 0], tgt: [HOLE.x, HOLE.y - 0.02, -10], shift: [0, 0] }),
    // 3 · Al otro lado: el estudio
    key({ ...surface, bg: MIST, fog: 0.05, roots: 0.38, pulse: 0.7, ground: 0.8, dust: 1, halo: 0, pos: [HOLE.x, -0.55, -3.4], tgt: [-0.3, -1.45, -14], shift: [0, 0] }),
    // 4 · Fin del estudio, antes de bajar
    key({ ...surface, bg: MIST, fog: 0.05, roots: 0.42, pulse: 0.75, ground: 0.8, dust: 1, halo: 0, pos: [-0.75, -0.95, -3.8], tgt: [-0.5, -2.3, -14], shift: [0, 0] }),
    // 5 · Bajo tierra, primera fase. La cámara se ha retirado para ver la
    //     red entera bajo el árbol; mirada horizontal: la línea del suelo
    //     queda a media altura, donde el eje del método.
    key({ ...under, pos: [-2.6, -1.75, 4.2], tgt: [-2.0, -1.75, -10], shift: [0, 0] }),
    // 6 · Última fase
    key({ ...under, pos: [2.6, -1.78, 3.8], tgt: [2.0, -1.78, -10], shift: [0, 0] }),
    // 7 · Fuera. La imagen sube con la página (el eje del método se va
    //     hacia arriba) mientras se apaga.
    key({ ...under, fog: 0.06, roots: 0.6, ground: 0.4, dust: 0.6, opacity: 0, pos: [3.0, -1.8, 3.6], tgt: [2.4, -1.8, -10], shift: [0, 0.8] }),
    // 8 · A oscuras, ya en la superficie: delante del árbol, girada unos
    //     40° y mirando a lo alto (el Sello queda por debajo del encuadre).
    key({ ...canopy, opacity: 0, pos: [5.6, 0.05, 6.6], tgt: [0.2, 5.0, -1], shift: [0, 0] }),
    // 9 · Acto 4: primera fila de servicios. La copa abierta, motas de luz
    //     que caen despacio.
    key({ ...canopy, pos: [5.0, 0.15, 7.1], tgt: [0.15, 4.9, -1], shift: [0, 0] }),
    // 10 · Última fila: ha girado casi de frente, aún mirando a lo alto (el
    //      Sello, justo debajo del encuadre, entra con el contacto).
    //      Ya a la altura del ancla del acto 5: el Sello sube en vertical.
    key({ ...canopy, sky: 0.5, halo: 0.6, pos: [1.2, 0.3, 8.8], tgt: [0.1, 4.0, 0], shift: [anchorX, 0] }),
    // 11 · Acto 5: el árbol entero en su anillo, junto al titular del
    //      contacto (el desplazamiento lo pone el ancla, ver scene.ts).
    key({ ...dusk, pos: [0, 0, D5], tgt: [0, 0, 0], shift: [0, 0] }),
    // 12 · Leyendo el contacto: quieta.
    key({ ...dusk, pos: [0, 0, D5], tgt: [0, 0, 0], shift: [0, 0] }),
    // 13 · Se apaga antes del pie.
    key({ ...dusk, bg: NIGHT, sky: 0, opacity: 0, pos: [0, 0, D5 * 1.04], tgt: [0, 0, 0], shift: [0, 0] }),
  ];
}

/**
 * Lo que se mide en la página: las paradas del recorrido y, para el acto 5,
 * dónde va el Sello (junto al titular del contacto) y dónde se posa la Semilla
 * (junto al botón). Las posiciones verticales son del documento (px).
 */
export type Layout = {
  stations: number[];
  seal: { x: number; yDoc: number; diam: number };
  seed: { x: number; yDoc: number; from: number; to: number };
};

/** Mide la portada. null si falta alguna sección (no es la portada). */
export function measureLayout(): Layout | null {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const studio = document.getElementById("estudio");
  const method = document.getElementById("metodo");
  const rows = document.querySelectorAll(".services .service");
  const cta = document.querySelector<HTMLElement>(".final-cta");
  const title = cta?.querySelector(".final-cta__title");
  const button = cta?.querySelector(".btn-primary");
  const footer = document.querySelector("footer");
  if (!studio || !method || !rows.length || !cta || !title || !button || !footer) return null;
  const sy = window.scrollY;
  const top = (el: Element) => el.getBoundingClientRect().top + sy;
  const bottom = (el: Element) => el.getBoundingClientRect().bottom + sy;
  const pin = method.querySelector(".rail-pin");
  // El método se fija mientras pasan sus fases (ApproachRail): su tramo es
  // el de la cámara recorriendo las raíces.
  const rail = ScrollTrigger.getAll().find((st) => st.pin === pin);
  const methodTop = top(method);
  const railStart = rail ? rail.start : methodTop;
  const railEnd = rail ? Math.max(rail.end, railStart + vh) : methodTop + Math.max(method.offsetHeight - vh, vh);
  const studioTop = top(studio);
  const studioBottom = studioTop + studio.offsetHeight;
  const firstRow = top(rows[0]);
  const lastRow = bottom(rows[rows.length - 1]);

  // El Sello del acto 5: a la derecha del titular, en el hueco que deja su
  // línea más larga (en pantallas anchas, algo hacia el margen).
  const range = document.createRange();
  range.selectNodeContents(title);
  const lines = Array.from(range.getClientRects());
  const textRight = Math.max(...lines.map((r) => r.right), title.getBoundingClientRect().left);
  const inner = cta.querySelector(".final-cta__inner") ?? cta;
  const colRight = inner.getBoundingClientRect().right;
  const edge = vw - Math.max(24, (vw - colRight) * 0.6);
  const diam = Math.min(340, vh * 0.4, Math.max(120, edge - textRight - 36));
  const titleRect = title.getBoundingClientRect();
  const titleMid = titleRect.top + sy + titleRect.height / 2;
  const btn = button.getBoundingClientRect();
  const btnMid = btn.top + sy + btn.height / 2;

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
    firstRow - vh * 0.95,
    firstRow - vh * 0.6,
    lastRow - vh,
    // El titular del contacto, a un poco más de media pantalla.
    titleMid - vh * 0.62,
    top(footer) - vh * 0.9,
    top(footer) - vh * 0.45,
  ];
  // Siempre crecientes, aunque la página sea rara (zoom extremo).
  for (let i = 1; i < s.length; i++) s[i] = Math.max(s[i], s[i - 1] + 1);
  return {
    stations: s,
    seal: { x: edge - diam / 2, yDoc: titleMid, diam },
    // Cae mientras el botón sube de abajo a media pantalla.
    seed: { x: btn.right + 30, yDoc: btnMid, from: s[11], to: Math.max(s[11] + 1, btnMid - vh * 0.52) },
  };
}

/** Scroll → u (0…13). */
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
  // del scroll, como la página; después vuelve la curva suave.
  const t = i === 5 || i === 6 ? raw : ease(raw);
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
  out.sky = mix(a.sky, b.sky);
  out.anchor = mix(a.anchor, b.anchor);
  out.opacity = mix(a.opacity, b.opacity);
  return out;
}

export function blankKey(): Key {
  return { pos: new Vector3(), tgt: new Vector3(), shift: [0, 0], bg: new Color(), fog: 0, roots: 0, pulse: 0, ground: 0, rise: 0, dust: 0, halo: 0, sky: 0, anchor: 0, opacity: 1 };
}
