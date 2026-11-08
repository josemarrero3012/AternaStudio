// Las formas que dibujan las partículas. Cada partícula tiene un sitio en
// cada forma (mismo índice), y el shader la lleva de uno a otro:
//
//   start  dispersas en la profundidad (de donde llegan al abrir)
//   tree   el árbol del símbolo, leído de su silueta (mark-mask.webp)
//   roots  un sistema de raíces que llena la pantalla, generado aquí
//   final  un árbol de verdad con el concepto del símbolo (cabe en un
//          círculo: tronco trenzado, ramas, copa y raíces), generado aquí,
//          que crece desde la base al subir de las raíces y que, al llegar
//          «01 — Estudio», se suelta en luz
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
 * Un árbol de verdad, pero con el concepto del símbolo (el árbol de la vida):
 * todo cabe en un círculo, casi simétrico. El tronco, corto, son tres hebras
 * que se trenzan; arriba se abren en ramas maestras que suben como un jarrón
 * y, al llegar al borde del círculo, lo siguen y se curvan hacia fuera y
 * hacia abajo (como las del logo); abajo, las raíces se abren anchas y
 * también siguen el círculo. Hojas en racimos en las puntas y a lo largo de
 * las ramas finas. Se genera la mitad derecha y se refleja (con la
 * profundidad invertida, para que no se vea calcada); el tronco va aparte.
 * Cada tramo y cada racimo guardan su distancia a la base (g): el shader hace
 * crecer el árbol de abajo arriba.
 */
const CIRCLE = { r: 1, z: 0.55 };
const TRUNK = { base: -0.5, top: -0.04 };
function growNaturalTree(r: Rand) {
  const wood: Wood[] = [];
  const leaves: Leaf[] = [];
  const MAX = 6;
  /** Distancia al centro del círculo (en z, el círculo es más fino). */
  const circD = (x: number, y: number, z: number) => Math.hypot(x, y, z / CIRCLE.z) / CIRCLE.r;

  // Sigue el borde del círculo: la tangente que se aleja de la vertical
  // (arriba, hacia fuera; a los lados, hacia abajo). Las raíces, al revés:
  // desde abajo, hacia fuera y hacia arriba.
  const follow = (x: number, y: number, dx: number, dy: number, k: number, up: boolean): [number, number] => {
    const rr = Math.hypot(x, y) || 1;
    const ux = x / rr;
    const uy = y / rr;
    const side = Math.sign(x || dx) || 1;
    let tx = uy * side;
    let ty = -ux * side;
    if (!up) {
      tx = -tx;
      ty = -ty;
    }
    return [dx + (tx - dx) * k, dy + (ty - dy) * k];
  };

  const branch = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, rad: number, depth: number, g: number) => {
    const steps = Math.max(3, Math.ceil(len / 0.03));
    const step = len / steps;
    const edge = 0.93 + r() * 0.1;
    for (let s = 0; s < steps; s++) {
      dx += (r() - 0.5) * 0.08;
      dy += (r() - 0.5) * 0.05 + (depth > 1 ? 0.004 : 0);
      dz += (r() - 0.5) * 0.08;
      // Cerca del borde, lo sigue (cuanto más cerca, más).
      const d0 = circD(x, y, z);
      const k = Math.min(1, Math.max(0, (d0 - 0.7) / 0.26)) * 0.16;
      if (k > 0) [dx, dy] = follow(x, y, dx, dy, k, true);
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
      const nx = x + dx * step;
      const ny = y + dy * step;
      const nz = z + dz * step;
      const d = circD(nx, ny, nz);
      if ((d > edge && d > d0) || ny < TRUNK.top - 0.05) {
        leaves.push({ x, y, z, r: 0.09 + r() * 0.05, g });
        return;
      }
      wood.push({ ax: x, ay: y, az: z, bx: nx, by: ny, bz: nz, r: rad, g });
      x = nx;
      y = ny;
      z = nz;
      g += step;
      rad *= 0.986;
      const outer = circD(x, y, z);
      if (depth >= 2 && r() < (depth >= MAX - 2 ? 0.38 : 0.1) + (outer > 0.6 ? 0.22 : 0)) leaves.push({ x, y, z, r: 0.06 + r() * 0.06 * outer, g });
    }
    if (depth >= MAX) {
      leaves.push({ x, y, z, r: 0.09 + r() * 0.05, g });
      return;
    }
    const kids = depth < 2 ? 3 : r() < 0.3 ? 3 : 2;
    const az0 = r() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const az = az0 + (k / kids) * Math.PI * 2 + (r() - 0.5) * 0.6;
      const [nx, ny, nz] = turn(dx, dy, dz, az, 0.36 + r() * 0.3);
      branch(x, y, z, nx, ny, nz, len * (0.72 + r() * 0.12), rad * 0.66, depth + 1, g);
    }
  };

  const root = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, rad: number, depth: number) => {
    const steps = Math.max(3, Math.ceil(len / 0.03));
    const step = len / steps;
    for (let s = 0; s < steps; s++) {
      dx += (r() - 0.5) * 0.12;
      dy += (r() - 0.5) * 0.08 - 0.01;
      dz += (r() - 0.5) * 0.12;
      const k = Math.min(1, Math.max(0, (circD(x, y, z) - 0.6) / 0.3)) * 0.26;
      if (k > 0) [dx, dy] = follow(x, y, dx, dy, k, false);
      const n = Math.hypot(dx, dy, dz) || 1;
      dx /= n;
      dy /= n;
      dz /= n;
      const nx = x + dx * step;
      const ny = y + dy * step;
      const nz = z + dz * step;
      if (circD(nx, ny, nz) > 0.98 || ny > TRUNK.base + 0.25) return;
      wood.push({ ax: x, ay: y, az: z, bx: nx, by: ny, bz: nz, r: rad, g: 0 });
      x = nx;
      y = ny;
      z = nz;
      rad *= 0.975;
      // Raicillas que salen hacia abajo y hacia fuera.
      if (depth < 2 && s > 2 && r() < 0.09) {
        const [cx, cy, cz] = turn(dx, dy, dz, r() * Math.PI * 2, 0.5 + r() * 0.3);
        root(x, y, z, cx, cy, cz, len * 0.45, rad * 0.6, depth + 1);
      }
    }
  };

  // El tronco: tres hebras que se trenzan (como en el símbolo).
  const STRANDS = 3;
  const twist = Math.PI * 1.1;
  const tSteps = 22;
  for (let k = 0; k < STRANDS; k++) {
    const a0 = (k / STRANDS) * Math.PI * 2;
    for (let s = 0; s < tSteps; s++) {
      const t0 = s / tSteps;
      const t1 = (s + 1) / tSteps;
      // Más abiertas abajo (se van a las raíces) y arriba (a las ramas).
      const spread = (t: number) => 0.05 + 0.06 * Math.pow(Math.abs(t - 0.45) / 0.55, 2);
      const at = (t: number): [number, number, number] => {
        const a = a0 + twist * t;
        const sp = spread(t);
        return [Math.cos(a) * sp, TRUNK.base + (TRUNK.top - TRUNK.base) * t, Math.sin(a) * sp * 0.8];
      };
      const [ax, ay, az] = at(t0);
      const [bx, by, bz] = at(t1);
      wood.push({ ax, ay, az, bx, by, bz, r: 0.04, g: (by - TRUNK.base) * 0.6 });
    }
  }
  const gTop = (TRUNK.top - TRUNK.base) * 0.6;

  // La mitad derecha: ramas maestras (ángulo desde la vertical, hacia qué
  // lado en profundidad, largo) y raíces (ángulo bajo la horizontal).
  const half0 = { wood: wood.length, leaves: leaves.length };
  const limbs: [number, number, number][] = [
    [0.1, 0.4, 0.9], // la guía (con su reflejo, dos hebras que suben trenzadas)
    [0.42, -0.5, 0.86],
    [0.62, 0.7, 0.82],
    [0.95, -0.2, 0.74],
    [1.2, 0.5, 0.62],
  ];
  for (const [th, ph, l] of limbs) {
    const th1 = th + (r() - 0.5) * 0.08;
    const zd = Math.sin(ph) * 0.35;
    const x0 = 0.03;
    branch(x0, TRUNK.top, 0, Math.sin(th1), Math.cos(th1), zd, 0.7 * l, 0.034, 1, gTop);
  }
  const rootsDef: [number, number, number][] = [
    [0.25, 0.3, 0.95],
    [0.55, -0.4, 0.8],
    [0.9, 0.6, 0.6],
  ];
  for (const [down, ph, l] of rootsDef) {
    const dzr = Math.sin(ph) * 0.4;
    root(0.04, TRUNK.base + 0.04, 0, Math.cos(down), -Math.sin(down), dzr, 0.9 * l, 0.036, 0);
  }
  // El reflejo, a la izquierda.
  const wEnd = wood.length;
  for (let i = half0.wood; i < wEnd; i++) {
    const w = wood[i];
    wood.push({ ax: -w.ax, ay: w.ay, az: -w.az, bx: -w.bx, by: w.by, bz: -w.bz, r: w.r, g: w.g });
  }
  const lEnd = leaves.length;
  for (let i = half0.leaves; i < lEnd; i++) {
    const l = leaves[i];
    leaves.push({ x: -l.x, y: l.y + (r() - 0.5) * 0.03, z: -l.z, r: l.r, g: l.g });
  }

  // Relleno de la copa: donde quedan huecos junto a una rama fina, otro
  // racimo (entre un punto al azar de la copa y esa rama, más cerca del punto).
  const twigs = wood.filter((w) => w.r < 0.025 && w.by > TRUNK.top);
  for (let i = 0; i < 240; i++) {
    const a = (r() - 0.5) * Math.PI * 1.15; // la mitad de arriba y algo más
    const d = 0.35 + r() * 0.55;
    const px = Math.sin(a) * d;
    const py = Math.cos(a) * d;
    const pz = (r() - 0.5) * 2 * CIRCLE.z * 0.6;
    let best: Wood | null = null;
    let bestD = 0.35 * 0.35;
    for (const w of twigs) {
      const dd = (w.bx - px) ** 2 + (w.by - py) ** 2 + (w.bz - pz) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = w;
      }
    }
    if (best) leaves.push({ x: px + (best.bx - px) * 0.35, y: py + (best.by - py) * 0.35, z: pz + (best.bz - pz) * 0.35, r: 0.08 + r() * 0.05, g: best.g });
  }

  // Encaja el árbol: de la punta de las raíces (y = -1) a la copa (y = 1),
  // centrado en el tronco, sin pasar de ±1,2 de ancho, y algo más plano de
  // fondo.
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
