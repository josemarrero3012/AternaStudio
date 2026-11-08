// Las formas que dibujan las partículas. Cada partícula tiene un sitio en
// cada forma (mismo índice), y el shader la lleva de uno a otro:
//
//   start  dispersas en la profundidad (de donde llegan al abrir)
//   tree   el árbol del símbolo, leído de su silueta (mark-mask.webp)
//   roots  un sistema de raíces que llena la pantalla, generado aquí
//   final  un árbol de verdad (tronco, ramas, copa redonda y raíces de
//          superficie), generado aquí, que crece desde la base al subir de
//          las raíces y que, al llegar «01 — Estudio», se suelta en luz
//
// Todo sale de una semilla fija: la misma escena en cada carga. Las
// coordenadas de los árboles van de -1 a 1 (el símbolo mide ±0,89; el árbol
// final va del suelo, y = -1, a la copa, y = 1).

import { DUST_SHARE, EDGE_SHARE, LEAF_SHARE, SEED } from "./config";

/** tree: partícula de madera en el árbol final; leaf: de la copa; dust: polvo. */
export const KIND = { tree: 0, dust: 1, leaf: 2 } as const;

export type Shapes = {
  count: number;
  /**
   * Tramo de partículas para el resplandor (sin el polvo): las hojas del
   * árbol final y parte de la madera. Como cada una sale al azar, cualquier tramo es una
   * muestra uniforme de la forma.
   */
  glow: { first: number; count: number };
  start: Float32Array; // vec3
  tree: Float32Array; // vec3
  roots: Float32Array; // vec3
  final: Float32Array; // vec3
  /** x: retardo propio, y: fase del parpadeo, z: tamaño, w: tipo (KIND). */
  rand: Float32Array; // vec4
  /**
   * x: tono del degradado en el símbolo (0 abajo a la izquierda, 1 arriba a
   * la derecha), y: profundidad en la raíz (0 a 1), z: contorno del símbolo
   * (0 o 1), w: orden de crecimiento en el árbol final (0 la base, 1 la copa).
   */
  tone: Float32Array; // vec4
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
function segmentPicker<T extends { ax: number; ay: number; az: number; bx: number; by: number; bz: number; r: number }>(segs: T[]) {
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

// Árbol final ------------------------------------------------------------------

type Wood = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; r: number; g: number };
type Leaf = { x: number; y: number; z: number; r: number; g: number };

/** Gira la dirección d un ángulo `ang` hacia el lado `az` (alrededor de d). */
function turn(dx: number, dy: number, dz: number, az: number, ang: number): [number, number, number] {
  // Base perpendicular a d: u = d × eje auxiliar, v = d × u.
  const up = Math.abs(dy) < 0.9;
  const hx = up ? 0 : 1;
  const hy = up ? 1 : 0;
  let ux = dy * 0 - dz * hy;
  let uy = dz * hx - dx * 0;
  let uz = dx * hy - dy * hx;
  const un = Math.hypot(ux, uy, uz) || 1;
  ux /= un;
  uy /= un;
  uz /= un;
  const vx = dy * uz - dz * uy;
  const vy = dz * ux - dx * uz;
  const vz = dx * uy - dy * ux;
  const px = Math.cos(az) * ux + Math.sin(az) * vx;
  const py = Math.cos(az) * uy + Math.sin(az) * vy;
  const pz = Math.cos(az) * uz + Math.sin(az) * vz;
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  const nx = c * dx + sn * px;
  const ny = c * dy + sn * py;
  const nz = c * dz + sn * pz;
  const n = Math.hypot(nx, ny, nz) || 1;
  return [nx / n, ny / n, nz / n];
}

/**
 * Un árbol de copa ancha y redonda, como el del símbolo pero de verdad:
 * tronco, cinco ramas maestras repartidas (una guía hacia arriba, dos a cada
 * lado, delante y detrás), horquillas que se abren y buscan la luz, racimos
 * de hojas en las puntas y unas raíces de superficie que agarran el suelo.
 * Las ramas crecen hasta el contorno de la copa (un elipsoide, con algo de
 * azar en cada una): así la copa sale llena y en cúpula. Cada tramo y cada
 * racimo guardan su distancia a la base (g): el shader hace crecer el árbol
 * de abajo arriba.
 */
const CROWN = { y: 0.42, rx: 1.12, ry: 0.82, rz: 0.82 };
function growNaturalTree(r: Rand) {
  const wood: Wood[] = [];
  const leaves: Leaf[] = [];
  const MAX = 6;
  const crownD = (x: number, y: number, z: number) => Math.hypot(x / CROWN.rx, (y - CROWN.y) / CROWN.ry, z / CROWN.rz);
  const branch = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, rad: number, depth: number, g: number) => {
    const steps = Math.max(3, Math.ceil(len / 0.035));
    const step = len / steps;
    // Hasta dónde llega esta rama: el contorno de la copa, algo irregular.
    const edge = 0.9 + r() * 0.16;
    for (let s = 0; s < steps; s++) {
      // Algo de azar, la búsqueda de la luz y, en las ramas, abrirse hacia fuera.
      dx += (r() - 0.5) * 0.1 + (depth > 1 ? Math.sign(x || dx) * 0.008 : 0);
      dy += (r() - 0.5) * 0.06 + (depth > 1 ? 0.006 : 0);
      dz += (r() - 0.5) * 0.1;
      if (depth > 0 && dy < -0.1) dy = -0.1; // las ramas no caen
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
      const nx = x + dx * step;
      const ny = y + dy * step;
      const nz = z + dz * step;
      const d = crownD(nx, ny, nz);
      if (depth > 0 && d > edge && d > crownD(x, y, z)) {
        leaves.push({ x, y, z, r: 0.11 + r() * 0.06, g });
        return;
      }
      wood.push({ ax: x, ay: y, az: z, bx: nx, by: ny, bz: nz, r: rad, g });
      x = nx;
      y = ny;
      z = nz;
      g += step;
      rad *= 0.988;
      // Hojas también a lo largo de las ramas, no solo en las puntas: en las
      // finas y en todas las que ya están en la parte de fuera de la copa.
      const outer = crownD(x, y, z);
      if (depth >= 2 && r() < (depth >= MAX - 2 ? 0.4 : 0.12) + (outer > 0.55 ? 0.25 : 0)) leaves.push({ x, y, z, r: 0.07 + r() * 0.07 * outer, g });
    }
    if (depth >= MAX) {
      leaves.push({ x, y, z, r: 0.1 + r() * 0.06, g });
      return;
    }
    if (depth === 0) {
      // Las ramas maestras, repartidas a mano para que la copa quede
      // equilibrada (ángulo desde la vertical, hacia qué lado, largo).
      const tilt = r() * 0.4;
      const limbs: [number, number, number][] = [
        [0.12, r() * 6.28, 0.95],
        [0.92, tilt, 1.0],
        [0.92, Math.PI + tilt, 1.0],
        [0.62, Math.PI / 2 + 0.5 + tilt, 0.85],
        [0.62, -Math.PI / 2 - 0.5 + tilt, 0.85],
        [0.5, Math.PI / 2 - 0.6 + tilt, 0.8],
        [0.5, -Math.PI / 2 + 0.6 + tilt, 0.8],
      ];
      for (const [th, ph, l] of limbs) {
        const th1 = th + (r() - 0.5) * 0.12;
        branch(x, y, z, Math.sin(th1) * Math.cos(ph), Math.cos(th1), Math.sin(th1) * Math.sin(ph), 0.62 * l, rad * 0.6, 1, g);
      }
      return;
    }
    const kids = depth < 3 ? 3 : r() < 0.3 ? 3 : 2;
    const az0 = r() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const az = az0 + (k / kids) * Math.PI * 2 + (r() - 0.5) * 0.6;
      const spread = 0.42 + r() * 0.3;
      const [nx, ny, nz] = turn(dx, dy, dz, az, spread);
      branch(x, y, z, nx, ny, nz, len * (0.74 + r() * 0.14), rad * 0.66, depth + 1, g);
    }
  };
  branch(0, -1, 0, 0, 1, 0, 0.78, 0.09, 0, 0);

  // Raíces de superficie: salen de la base, se abren y se hunden un poco.
  const ROOTS = 8;
  for (let k = 0; k < ROOTS; k++) {
    const a = (k / ROOTS) * Math.PI * 2 + (r() - 0.5) * 0.5;
    let x = 0;
    let y = -0.9;
    let z = 0;
    let dx = Math.cos(a);
    let dy = -0.3;
    let dz = Math.sin(a) * 0.7;
    let rad = 0.06;
    const len = 0.35 + r() * 0.3;
    const steps = Math.ceil(len / 0.03);
    for (let s = 0; s < steps; s++) {
      dx += (r() - 0.5) * 0.2;
      dy += (r() - 0.5) * 0.1 - 0.02;
      dz += (r() - 0.5) * 0.2;
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
      const nx = x + dx * 0.03;
      const ny = y + dy * 0.03;
      const nz = z + dz * 0.03;
      wood.push({ ax: x, ay: y, az: z, bx: nx, by: ny, bz: nz, r: rad, g: 0 });
      x = nx;
      y = ny;
      z = nz;
      rad *= 0.93;
    }
  }

  // Encaja el árbol: del suelo (y = -1) a la copa (y = 1), centrado en el
  // tronco, sin pasar de ±1,2 de ancho, y algo más plano de fondo.
  let minY = Infinity;
  let maxY = -Infinity;
  let maxX = 0;
  for (const w of wood) {
    minY = Math.min(minY, w.by);
    maxY = Math.max(maxY, w.by);
    maxX = Math.max(maxX, Math.abs(w.bx));
  }
  for (const l of leaves) {
    maxY = Math.max(maxY, l.y + l.r);
    maxX = Math.max(maxX, Math.abs(l.x) + l.r);
  }
  const k = Math.min(2 / (maxY - minY), 1.2 / maxX);
  const fit = (x: number, y: number, z: number): [number, number, number] => [x * k, (y - minY) * k - 1, z * k * 0.7];
  let maxG = 0;
  for (const w of wood) {
    [w.ax, w.ay, w.az] = fit(w.ax, w.ay, w.az);
    [w.bx, w.by, w.bz] = fit(w.bx, w.by, w.bz);
    w.r *= k;
    maxG = Math.max(maxG, w.g);
  }
  for (const l of leaves) {
    [l.x, l.y, l.z] = fit(l.x, l.y, l.z);
    l.r *= k;
    maxG = Math.max(maxG, l.g);
  }
  for (const w of wood) w.g /= maxG;
  for (const l of leaves) l.g /= maxG;
  return { wood, leaves };
}

// Todas ------------------------------------------------------------------------

export function buildShapes(mask: Mask, count: number): Shapes {
  const r = rng(SEED);
  const start = new Float32Array(count * 3);
  const tree = new Float32Array(count * 3);
  const roots = new Float32Array(count * 3);
  const final = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const tone = new Float32Array(count * 4);

  const { segs, maxT } = growRoots(r);
  const pickSeg = segmentPicker(segs);
  const natural = growNaturalTree(r);
  const pickWood = segmentPicker(natural.wood);
  const dustN = Math.round(count * DUST_SHARE);
  const leafN = Math.round((count - dustN) * LEAF_SHARE);

  for (let i = 0; i < count; i++) {
    const o3 = i * 3;
    const o4 = i * 4;
    const kind = i < dustN ? KIND.dust : i < dustN + leafN ? KIND.leaf : KIND.tree;

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
      tone[o4] = r();
      tone[o4 + 1] = r();
      continue;
    }

    // El árbol: parte de las partículas, al contorno.
    const edge = r() < EDGE_SHARE;
    treePoint(mask, edge ? mask.edge : mask.inside, r, tree, o3);
    tone[o4] = toneAt(tree[o3], tree[o3 + 1]);
    tone[o4 + 2] = edge ? 1 : 0;

    // Las raíces: un punto de un tramo, repartido en su grosor.
    const s = pickSeg(r());
    const u = r();
    const spread = s.r * Math.sqrt(r());
    const a = r() * Math.PI * 2;
    roots[o3] = s.ax + (s.bx - s.ax) * u + Math.cos(a) * spread;
    roots[o3 + 1] = s.ay + (s.by - s.ay) * u + Math.sin(a) * spread * 0.6;
    roots[o3 + 2] = s.az + (s.bz - s.az) * u + Math.sin(a) * spread;
    tone[o4 + 1] = s.t / maxT;

    if (kind === KIND.leaf) {
      // La copa: racimos mullidos alrededor de cada punto de hojas.
      const l = natural.leaves[Math.floor(r() * natural.leaves.length)];
      final[o3] = l.x + gauss(r) * l.r * 0.55;
      final[o3 + 1] = l.y + gauss(r) * l.r * 0.42;
      final[o3 + 2] = l.z + gauss(r) * l.r * 0.55;
      tone[o4 + 3] = Math.min(1, l.g + r() * 0.06);
    } else {
      // La madera: tronco, ramas y raíces de superficie, en su grosor.
      const w = pickWood(r());
      const u2 = r();
      const sp = w.r * Math.sqrt(r());
      const a2 = r() * Math.PI * 2;
      final[o3] = w.ax + (w.bx - w.ax) * u2 + Math.cos(a2) * sp;
      final[o3 + 1] = w.ay + (w.by - w.ay) * u2 + Math.sin(a2) * sp * 0.4;
      final[o3 + 2] = w.az + (w.bz - w.az) * u2 + Math.sin(a2) * sp;
      tone[o4 + 3] = w.g;
    }
  }

  const glow = { first: dustN, count: Math.round((count - dustN) * 0.4) };
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
