// Las formas que dibujan las partículas. Cada partícula tiene un sitio en
// cada forma (mismo índice), y el shader la lleva de uno a otro:
//
//   start  dispersas en la profundidad (de donde llegan al abrir)
//   tree   el árbol del símbolo, leído de su silueta (mark-mask.webp)
//   roots  un sistema de raíces que llena la pantalla, generado aquí
//   final  el árbol otra vez, dentro de un anillo de luz
//
// Todo sale de una semilla fija: la misma escena en cada carga. Las
// coordenadas del árbol van de -1 a 1 (el anillo del símbolo mide ~0,94).

import { DUST_SHARE, EDGE_SHARE, RING_SHARE, SEED } from "./config";

export const KIND = { tree: 0, dust: 1, ring: 2 } as const;

export type Shapes = {
  count: number;
  /**
   * Tramo de partículas para el resplandor (sin el polvo): el anillo y una
   * parte del árbol. Como cada una sale al azar, cualquier tramo es una
   * muestra uniforme de la forma.
   */
  glow: { first: number; count: number };
  start: Float32Array; // vec3
  tree: Float32Array; // vec3
  roots: Float32Array; // vec3
  final: Float32Array; // vec3
  /** x: retardo propio, y: fase del parpadeo, z: tamaño, w: tipo (KIND). */
  rand: Float32Array; // vec4
  /** x: tono del degradado (0 abajo a la izquierda, 1 arriba a la derecha), y: profundidad en la raíz (0 a 1), z: contorno (0 o 1). */
  tone: Float32Array; // vec3
};

/** Generador con semilla (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;

function gauss(r: Rand) {
  // Box-Muller, una de las dos.
  const u = Math.max(1e-7, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

/** Tono del degradado del logo: azul abajo a la izquierda, rosa arriba a la derecha. */
const toneAt = (x: number, y: number) => Math.min(1, Math.max(0, (x * 0.55 + y * 0.85) * 0.5 + 0.5));

// Silueta ---------------------------------------------------------------------

export type Mask = { size: number; inside: Uint32Array; edge: Uint32Array; alpha: Uint8ClampedArray };

/** Lee la silueta: píxeles dentro del árbol y, de ellos, los del contorno. */
export function readMask(img: HTMLImageElement | ImageBitmap): Mask {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Sin canvas 2D para leer la silueta");
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const alpha = new Uint8ClampedArray(size * size);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4]; // gris: R = G = B
  const inside: number[] = [];
  const edge: number[] = [];
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && alpha[y * size + x] > 127;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!on(x, y)) continue;
      const i = y * size + x;
      inside.push(i);
      if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) edge.push(i);
    }
  }
  return { size, inside: Uint32Array.from(inside), edge: Uint32Array.from(edge), alpha };
}

/** Un punto del árbol: de un píxel de la silueta, con un poco de relieve. */
function treePoint(mask: Mask, list: Uint32Array, r: Rand, out: Float32Array, o: number) {
  const i = list[Math.floor(r() * list.length)];
  const px = (i % mask.size) + r();
  const py = Math.floor(i / mask.size) + r();
  const x = (px / mask.size - 0.5) * 2;
  const y = (0.5 - py / mask.size) * 2;
  // Relieve: abombado hacia el centro, con volumen.
  const bulge = 0.24 * Math.max(0, 1 - (x * x + y * y));
  // Borde suelto, como el pelaje del tigre: todas tiemblan un poco y algunas
  // se escapan de la silueta.
  const loose = r() < 0.06 ? 0.022 : 0.0025;
  out[o] = x + gauss(r) * loose;
  out[o + 1] = y + gauss(r) * loose;
  out[o + 2] = bulge + gauss(r) * 0.03;
}

// Raíces ------------------------------------------------------------------------

type Segment = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; r: number; t: number };

/**
 * Raíces que bajan desde arriba del encuadre y se abren hacia los lados y
 * hacia el fondo. Cada tramo guarda su grosor y su distancia al tronco (t),
 * que el shader usa para que la luz baje por ellas.
 */
function growRoots(r: Rand) {
  const segs: Segment[] = [];
  const STEP = 0.045;
  const grow = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, rad: number, depth: number, t: number) => {
    const steps = Math.ceil(len / STEP);
    for (let s = 0; s < steps; s++) {
      // Rumbo: algo de azar, la gravedad, la tendencia a abrirse hacia fuera
      // y un tirón hacia el plano del árbol (que no se pierdan en el fondo).
      dx += (r() - 0.5) * 0.3 + Math.sign(x || dx) * 0.025;
      dy += (r() - 0.5) * 0.2 - 0.04;
      dz += (r() - 0.5) * 0.16 - z * 0.08;
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
      const nx = x + dx * STEP;
      const ny = y + dy * STEP;
      const nz = z + dz * STEP;
      segs.push({ ax: x, ay: y, az: z, bx: nx, by: ny, bz: nz, r: rad, t });
      x = nx;
      y = ny;
      z = nz;
      t += STEP;
      rad *= 0.985;
      if (ny < -1.6 || Math.abs(nx) > 2.7) return; // ya salió del encuadre
      if (depth < 5 && r() < 0.055 + depth * 0.012) {
        const side = r() < 0.5 ? -1 : 1;
        const a = side * (0.45 + r() * 0.55);
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        grow(x, y, z, dx * ca - dy * sa, dx * sa + dy * ca, dz + (r() - 0.5) * 0.5, len * (0.4 + r() * 0.3), rad * 0.64, depth + 1, t);
      }
    }
  };
  // El tronco entra por arriba del encuadre y se reparte en raíces principales.
  const MAIN = 7;
  for (let k = 0; k < MAIN; k++) {
    const spread = (k / (MAIN - 1) - 0.5) * 2; // -1 a 1
    const a = spread * 1.25 + (r() - 0.5) * 0.18; // ángulo desde la vertical
    grow(spread * 0.06, 1.45, (r() - 0.5) * 0.1, Math.sin(a), -Math.cos(a), (r() - 0.5) * 0.5, 2.6 + r() * 0.8, 0.04 + r() * 0.015, 0, 0);
  }
  let maxT = 0;
  for (const s of segs) maxT = Math.max(maxT, s.t);
  return { segs, maxT };
}

/** Elige tramos al azar con peso longitud × grosor (tabla acumulada + búsqueda binaria). */
function segmentPicker(segs: Segment[]) {
  const acc = new Float64Array(segs.length);
  let sum = 0;
  segs.forEach((s, i) => {
    sum += Math.hypot(s.bx - s.ax, s.by - s.ay, s.bz - s.az) * (s.r + 0.012);
    acc[i] = sum;
  });
  return (u: number) => {
    const v = u * sum;
    let lo = 0;
    let hi = acc.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (acc[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return segs[lo];
  };
}

// Todas ------------------------------------------------------------------------

export function buildShapes(mask: Mask, count: number): Shapes {
  const r = rng(SEED);
  const start = new Float32Array(count * 3);
  const tree = new Float32Array(count * 3);
  const roots = new Float32Array(count * 3);
  const final = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const tone = new Float32Array(count * 3);

  const { segs, maxT } = growRoots(r);
  const pickSeg = segmentPicker(segs);
  const dustN = Math.round(count * DUST_SHARE);
  const ringN = Math.round(count * RING_SHARE);

  for (let i = 0; i < count; i++) {
    const o3 = i * 3;
    const o4 = i * 4;
    const kind = i < dustN ? KIND.dust : i < dustN + ringN ? KIND.ring : KIND.tree;

    // De dónde llega: una nube grande, sobre todo por detrás.
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    const rad = 2.6 + r() * 4.2;
    start[o3] = Math.sin(ph) * Math.cos(th) * rad * 1.3;
    start[o3 + 1] = Math.sin(ph) * Math.sin(th) * rad * 0.8;
    start[o3 + 2] = -Math.abs(Math.cos(ph)) * rad - 1.0;

    rand[o4] = r();
    rand[o4 + 1] = r();
    rand[o4 + 2] = 0.55 + Math.pow(r(), 3) * 1.1; // casi todas finas, alguna gruesa
    rand[o4 + 3] = kind;

    if (kind === KIND.dust) {
      // El polvo: flota igual en todas las formas, repartido por la escena.
      const x = (r() - 0.5) * 6.4;
      const y = (r() - 0.5) * 4.2;
      const z = -r() * 4 + 1.2;
      for (const arr of [tree, roots, final]) {
        arr[o3] = x;
        arr[o3 + 1] = y;
        arr[o3 + 2] = z;
      }
      rand[o4 + 2] *= 0.8;
      tone[o3] = r();
      tone[o3 + 1] = r();
      continue;
    }

    // El árbol: parte de las partículas, al contorno.
    const edge = r() < EDGE_SHARE;
    treePoint(mask, edge ? mask.edge : mask.inside, r, tree, o3);
    tone[o3] = toneAt(tree[o3], tree[o3 + 1]);
    tone[o3 + 2] = edge ? 1 : 0;

    // Las raíces: un punto de un tramo, repartido en su grosor.
    const s = pickSeg(r());
    const u = r();
    const spread = s.r * Math.sqrt(r());
    const a = r() * Math.PI * 2;
    roots[o3] = s.ax + (s.bx - s.ax) * u + Math.cos(a) * spread;
    roots[o3 + 1] = s.ay + (s.by - s.ay) * u + Math.sin(a) * spread * 0.6;
    roots[o3 + 2] = s.az + (s.bz - s.az) * u + Math.sin(a) * spread;
    tone[o3 + 1] = s.t / maxT;

    if (kind === KIND.ring) {
      // El anillo del árbol crecido, con algo de polvo que se escapa.
      const ang = r() * Math.PI * 2;
      const loose = r() < 0.16;
      const rr = loose ? 1.12 + Math.abs(gauss(r)) * 0.22 : 1.075 + gauss(r) * 0.009;
      final[o3] = Math.cos(ang) * rr;
      final[o3 + 1] = Math.sin(ang) * rr;
      final[o3 + 2] = gauss(r) * (loose ? 0.08 : 0.018);
      tone[o3] = toneAt(final[o3], final[o3 + 1]);
    } else {
      final[o3] = tree[o3];
      final[o3 + 1] = tree[o3 + 1];
      final[o3 + 2] = tree[o3 + 2];
    }
  }

  const glow = { first: dustN, count: Math.round((count - dustN) * 0.36) };
  return { count, glow, start, tree, roots, final, rand, tone };
}

/** Carga la silueta (mismo origen; crossOrigin como la precarga, para reutilizarla). */
export function loadMask(url: string) {
  return new Promise<Mask>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        resolve(readMask(img));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });
}
