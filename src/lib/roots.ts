// Raíces de luz generadas, no dibujadas a mano.
//
// Son las raíces del árbol del vídeo de portada en pequeño: haces de fibras
// finas que nacen juntos, se abren hacia fuera y hacia abajo y se van
// separando en haces más pequeños hasta acabar en hebras sueltas, cada una
// con su punta. El grosor de una raíz es el número de fibras que lleva (así
// se afina sola al soltarlas), y cada haz serpentea con ondas largas,
// nunca con temblor. Determinista: con la misma semilla sale siempre igual.
//
// Aquí solo hay geometría y pintura en un lienzo 2D. Qué raíces se piden y
// dónde (pie, método…) lo decide quien llama (Rootlets.tsx, MethodRoot.tsx).

export type Vec = readonly [number, number];

export type RootSeed = {
  /** Punto del que nace (px del lienzo). */
  at: Vec;
  /** Dirección inicial en grados (90 = hacia abajo). */
  angle?: number;
  /** Fibras del haz (su grosor). */
  strands: number;
  /** Longitud de la raíz principal (px). */
  length: number;
  /** Punta obligada: la raíz principal acaba exactamente aquí (etiquetas). */
  to?: Vec;
  /** Cuándo empieza a crecer, en px de crecimiento (0 = al momento). */
  offset?: number;
  /** 0 = primer plano; 1 = al fondo (más tenue y desenfocada). */
  depth?: number;
  /** Ancho con el que nace, de 0 (todas las fibras de un punto) a 1 (ya abiertas). */
  open?: number;
  /** Hacia qué lado se abre al nacer (-1 izquierda, 1 derecha); por defecto, según el ángulo. */
  lean?: number;
  /** Cuánto se abre hacia su lado antes de bajar (grados desde la vertical). */
  flare?: number;
};

export type RootField = {
  seed: number;
  seeds: RootSeed[];
  /** Escala de la textura (paso, ondas, separación entre fibras). 1 = 1 px. */
  scale?: number;
  /** Separación entre fibras de un haz (px a escala 1). */
  gap?: number;
  /** Altura del suelo: ninguna raíz sube por encima. */
  ground?: number;
  /** Paredes suaves a izquierda y derecha (px). */
  walls?: Vec;
};

export type StrandPoint = { x: number; y: number; c: number };

export type Strand = {
  pts: StrandPoint[];
  /** Plano (0 delante, 1 al fondo) y brillo propio (0–1). */
  depth: number;
  light: number;
  /** Grosor de la fibra (px). */
  width: number;
  /** Crecimiento (px) al que nace y al que llega a su punta. */
  c0: number;
  c1: number;
  /** La hebra que acaba en la punta obligada de su semilla. */
  tip?: Vec;
};

export type RootSystem = { strands: Strand[]; reach: number };

const DOWN = Math.PI / 2;
const TAU = Math.PI * 2;

function prng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;

/** Normal aproximada (media 0, desviación 1), barata y determinista. */
const gauss = (r: Rand) => (r() + r() + r() - 1.5) * 2;

/** Diferencia angular más corta de a hacia b. */
function turn(b: number, a: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

type Skel = { x: number; y: number; a: number; c: number }[];

type Ctx = {
  r: Rand;
  scale: number;
  step: number;
  gap: number;
  ground: number;
  walls?: Vec;
  out: Map<number, Strand>;
  /** Carril propio de cada fibra dentro del haz y su torsión (rompen el peinado perfecto). */
  lane: Map<number, { at: number; wave: number; phase: number }>;
};

/**
 * El eje de un haz. Las ondas son largas y suaves; cuantas menos fibras
 * lleva, más serpentea (una hebra suelta se riza; un haz grueso, no).
 * Las ramas bajan abiertas hacia su lado y se van cerrando hacia abajo.
 */
function walk(k: Ctx, x: number, y: number, a: number, length: number, count: number, side: number, flare: number, c0: number, to?: Vec): Skel {
  const { r, scale } = k;
  const n = Math.max(3, Math.ceil(length / k.step));
  const ds = length / n;
  const loose = 1 / (1 + 0.18 * (count - 1));
  const l1 = (80 + r() * 100) * scale;
  const l2 = (26 + r() * 24) * scale;
  const p1 = r() * TAU;
  const p2 = r() * TAU;
  const a1 = ((0.006 + 0.012 * loose) / scale) * (0.6 + r() * 0.8);
  const a2 = a1 * (0.2 + r() * 0.35) * (0.4 + loose);
  const pull = (0.006 + 0.006 * (1 - loose)) / scale;
  const pts: Skel = [{ x, y, a, c: c0 }];
  let c = c0;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const s = i * ds;
    const bend = a1 * Math.sin((TAU * s) / l1 + p1) + a2 * Math.sin((TAU * s) / l2 + p2);
    const rest = DOWN - side * flare * (1 - 0.65 * u);
    a += bend * ds + gauss(r) * 0.004 * loose + turn(rest, a) * pull * ds;
    if (to) a += turn(Math.atan2(to[1] - y, to[0] - x), a) * (0.002 + 0.035 * u * u) * ds;
    if (k.walls) {
      const [lo, hi] = k.walls;
      if (x < lo + 14) a += turn(0.4, a) * 0.08;
      if (x > hi - 14) a += turn(Math.PI - 0.4, a) * 0.08;
    }
    const nx = x + Math.cos(a) * ds;
    const ny = Math.max(k.ground + 0.8, y + Math.sin(a) * ds);
    // Cerca del suelo, hacia abajo: una fibra no se arrastra por la línea.
    const near = 1 - (ny - k.ground) / (10 * scale);
    if (near > 0) a += turn(DOWN, a) * 0.16 * near;
    c += Math.hypot(nx - x, ny - y);
    x = nx;
    y = ny;
    pts.push({ x, y, a, c });
  }
  if (to) land(pts, to);
  return pts;
}

/** Gira y escala el eje alrededor de su origen para que acabe en `to`. */
function land(pts: Skel, to: Vec) {
  const o = pts[0];
  const e = pts[pts.length - 1];
  const turnBy = Math.atan2(to[1] - o.y, to[0] - o.x) - Math.atan2(e.y - o.y, e.x - o.x);
  const k = Math.hypot(to[0] - o.x, to[1] - o.y) / Math.max(1e-6, Math.hypot(e.x - o.x, e.y - o.y));
  const cs = Math.cos(turnBy) * k;
  const sn = Math.sin(turnBy) * k;
  let c = o.c;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const x = o.x + dx * cs - dy * sn;
    const y = o.y + dx * sn + dy * cs;
    c += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    p.x = x;
    p.y = y;
    p.a += turnBy;
    p.c = c;
  }
}

type Split = { at: number; take: number; side: number };

/**
 * Dónde suelta fibras el haz: al principio, haces grandes; hacia la punta,
 * hebras sueltas. Siempre queda una que llega a la punta.
 */
function plan(r: Rand, count: number, n: number): Split[] {
  const out: Split[] = [];
  let left = count;
  let side = r() < 0.5 ? -1 : 1;
  let u = 0.08 + r() * 0.12;
  while (left > 1 && u < 0.94) {
    side = r() < 0.75 ? -side : side;
    const big = left > 3 && u < 0.6 && r() < 0.7;
    const take = Math.min(left - 1, big ? Math.max(2, Math.round(left * (0.3 + r() * 0.22))) : 1);
    out.push({ at: Math.min(n - 2, Math.max(1, Math.round(u * n))), take, side });
    left -= take;
    const room = 0.94 - u;
    u += Math.max(0.04, (room / (left + 0.5)) * (0.55 + r() * 0.9));
  }
  // Las que sobran se abren en pincel al final.
  while (left > 1) {
    side = -side;
    out.push({ at: Math.max(1, n - 2 - Math.floor(r() * 3)), take: 1, side });
    left--;
  }
  return out.sort((p, q) => p.at - q.at);
}

function bundle(k: Ctx, x: number, y: number, a: number, ids: number[], start: number[], length: number, side: number, flare: number, c0: number, depth: number, to?: Vec) {
  const { r } = k;
  const skel = walk(k, x, y, a, length, ids.length, side, side ? flare : 0, c0, to);
  const splits = plan(r, ids.length, skel.length);
  const live = ids.slice();
  const off = new Map<number, number>(ids.map((id, i) => [id, start[i] ?? 0]));
  const settle = 14 * k.scale;
  let next = 0;
  for (let i = 0; i < skel.length; i++) {
    const p = skel[i];
    const ds = i ? p.c - skel[i - 1].c : 0;
    // Las fibras se reparten a lo ancho y se aflojan un poco al bajar.
    const gap = k.gap * (1 + (p.c - c0) / (260 * k.scale));
    const nx = Math.sin(p.a);
    const ny = -Math.cos(p.a);
    live.forEach((id, j) => {
      const lane = k.lane.get(id);
      const twist = lane && live.length > 1 ? lane.at + 0.45 * Math.sin(p.c / lane.wave + lane.phase) : 0;
      const target = (j - (live.length - 1) / 2 + twist) * gap;
      const o = off.get(id) ?? 0;
      const v = i ? o + (target - o) * Math.min(1, ds / settle) : o;
      off.set(id, v);
      k.out.get(id)?.pts.push({ x: p.x + nx * v, y: p.y + ny * v, c: p.c });
    });
    while (next < splits.length && splits[next].at === i) {
      const s = splits[next++];
      const take = s.side > 0 ? live.splice(live.length - s.take, s.take) : live.splice(0, s.take);
      const offs = take.map((id) => off.get(id) ?? 0);
      const mid = offs.reduce((acc, v) => acc + v, 0) / offs.length;
      const remaining = skel[skel.length - 1].c - p.c;
      const share = take.length / ids.length;
      const len = remaining * (take.length > 1 ? 0.75 + r() * 0.3 : 0.35 + r() * 0.5) * (0.7 + 0.3 * Math.sqrt(share)) + 6 * k.scale;
      const spread = (take.length > 1 ? 0.22 : 0.3) + r() * 0.3;
      const loose = 1 / (1 + 0.18 * (take.length - 1));
      bundle(k, p.x + nx * mid, p.y + ny * mid, p.a - s.side * spread, take, offs.map((v) => v - mid), len, s.side, 0.5 + 0.35 * loose, p.c, Math.min(1, Math.max(0, depth + (r() - 0.5) * 0.25)));
    }
  }
}

export function growRoots(field: RootField): RootSystem {
  const r = prng(field.seed);
  const scale = field.scale ?? 1;
  const k: Ctx = {
    r,
    scale,
    step: 2.5 * Math.max(0.6, Math.min(1.6, scale)),
    gap: (field.gap ?? 1.7) * scale,
    ground: field.ground ?? 0,
    walls: field.walls,
    out: new Map(),
    lane: new Map(),
  };
  let id = 0;
  for (const s of field.seeds) {
    const ids: number[] = [];
    const depth = s.depth ?? 0;
    for (let i = 0; i < s.strands; i++) {
      k.out.set(id, { pts: [], depth, light: 0.55 + r() * 0.45, width: 0.6 + r() * 0.35, c0: 0, c1: 0 });
      k.lane.set(id, { at: (r() - 0.5) * 0.8, wave: (22 + r() * 40) * scale, phase: r() * TAU });
      ids.push(id++);
    }
    const a = ((s.angle ?? 90) * Math.PI) / 180;
    const open = s.open ?? 0;
    const start = ids.map((_, j) => (j - (ids.length - 1) / 2) * k.gap * open);
    const side = s.lean ?? (Math.abs(Math.cos(a)) > 0.08 ? Math.sign(Math.cos(a)) : 0);
    bundle(k, s.at[0], s.at[1], a, ids, start, s.length, side, ((s.flare ?? 35) * Math.PI) / 180, s.offset ?? 0, depth, s.to);
    // La hebra que llega a la punta obligada es la que queda en el eje.
    const to = s.to;
    if (to) {
      for (const i of ids) {
        const st = k.out.get(i);
        const e = st?.pts[st.pts.length - 1];
        if (st && e && Math.hypot(e.x - to[0], e.y - to[1]) < 0.5) st.tip = to;
      }
    }
  }
  let reach = 0;
  const strands: Strand[] = [];
  for (const st of k.out.values()) {
    if (st.pts.length < 2) continue;
    st.c0 = st.pts[0].c;
    st.c1 = st.pts[st.pts.length - 1].c;
    reach = Math.max(reach, st.c1);
    strands.push(st);
  }
  return { strands, reach };
}

/* Pintura ------------------------------------------------------------------ */

export type RootInk = {
  /** Profundidad (px bajo el suelo) a la que la raíz ya se ha apagado. */
  fade: number;
  ground?: number;
  /** Colores de marca (por defecto, los de tokens.css). */
  orchid?: string;
  violet?: string;
  indigo?: string;
  lavender?: string;
  /** Multiplica el brillo de todo (0–1). */
  strength?: number;
  /** Multiplica el grosor de las fibras (más en pantallas de baja densidad). */
  weight?: number;
};

function gradient(ctx: CanvasRenderingContext2D, ink: RootInk, floor = 0) {
  const g = ink.ground ?? 0;
  const orchid = ink.orchid ?? "#d77cf5";
  const violet = ink.violet ?? "#9a5cf0";
  const indigo = ink.indigo ?? "#4b55d6";
  const lavender = ink.lavender ?? "#9aa3ff";
  const at = (a: number) => Math.max(floor, a);
  const body = ctx.createLinearGradient(0, g, 0, g + ink.fade);
  body.addColorStop(0, mix(orchid, lavender, 0.15, 0.85));
  body.addColorStop(0.16, mix(violet, lavender, 0.45, 0.9));
  body.addColorStop(0.45, mix(lavender, indigo, 0.4, at(0.7)));
  body.addColorStop(0.75, mix(indigo, lavender, 0.15, at(0.32)));
  body.addColorStop(1, mix(indigo, lavender, floor ? 0.3 : 0, at(0)));
  return body;
}

/** Mezcla dos colores #rrggbb y devuelve rgba(). */
function mix(a: string, b: string, t: number, alpha: number) {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function parse(hex: string) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Vis = { x: number; y: number; w: number };

/** Lo que se ve de una fibra cuando el crecimiento va por `grown`. */
function visible(st: Strand, grown: number, weight: number): Vis[] {
  const keep = st.tip ? 0.7 : 0.2;
  const out: Vis[] = [];
  const pts = st.pts;
  const tail = Math.min(18, (st.c1 - st.c0) * 0.35);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.c > grown) {
      if (i > 0) {
        const q = pts[i - 1];
        const f = (grown - q.c) / Math.max(1e-6, p.c - q.c);
        out.push({ x: q.x + (p.x - q.x) * f, y: q.y + (p.y - q.y) * f, w: 0.15 });
      }
      break;
    }
    // Se afina hacia su punta y hacia el frente que crece.
    const end = Math.min(1, (st.c1 - p.c) / tail, (grown - p.c) / 10);
    out.push({ x: p.x, y: p.y, w: st.width * weight * (keep + (1 - keep) * Math.pow(Math.max(0, end), 0.6)) });
  }
  return out;
}

/** Contorno relleno con grosor variable (sin juntas ni solapes). */
function ribbon(ctx: CanvasPath, v: Vis[]) {
  const n = v.length;
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = v[Math.max(0, i - 1)];
    const b = v[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const h = v[i].w / 2;
    L.push([v[i].x - ty * h, v[i].y + tx * h]);
    R.push([v[i].x + ty * h, v[i].y - tx * h]);
  }
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n - 1; i++) {
    ctx.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
  }
  ctx.lineTo(L[n - 1][0], L[n - 1][1]);
  ctx.lineTo(R[n - 1][0], R[n - 1][1]);
  for (let i = n - 2; i > 0; i--) {
    ctx.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2);
  }
  ctx.lineTo(R[0][0], R[0][1]);
  ctx.closePath();
}

/** Contornos ya calculados: el de cada fibra en el último crecimiento pedido. */
const shapes = new WeakMap<Strand, { grown: number; weight: number; path: Path2D | null }>();

/**
 * El contorno de una fibra con el crecimiento en `grown`. Se guarda: el de
 * una fibra ya crecida ya no cambia, y en cada fotograma el halo pide el
 * mismo que acaba de pintarse delante.
 */
function shape(st: Strand, grown: number, weight: number) {
  // A 10 px de su punta, una fibra ya está entera (ver visible).
  const at = grown >= st.c1 + 10 ? Infinity : grown;
  const hit = shapes.get(st);
  if (hit && hit.grown === at && hit.weight === weight) return hit.path;
  const v = visible(st, grown, weight);
  let path: Path2D | null = null;
  if (v.length >= 2) {
    path = new Path2D();
    ribbon(path, v);
  }
  shapes.set(st, { grown: at, weight, path });
  return path;
}

/** Más allá de esta profundidad, una fibra va al lienzo del fondo. */
const FAR = 0.55;

/** Pinta en `ctx` las fibras que elige `pick`, cada una con su brillo. */
function paintStrands(ctx: CanvasRenderingContext2D, sys: RootSystem, grown: number, ink: RootInk, pick: (st: Strand) => boolean, fill: CanvasGradient, tipFill: CanvasGradient) {
  const strength = ink.strength ?? 1;
  ctx.globalCompositeOperation = "lighter";
  for (const st of sys.strands) {
    if (st.c0 >= grown || !pick(st)) continue;
    const path = shape(st, grown, ink.weight ?? 1);
    if (!path) continue;
    ctx.globalAlpha = (st.tip ? 1 : st.light) * (1 - 0.65 * st.depth) * strength;
    ctx.fillStyle = st.tip ? tipFill : fill;
    ctx.fill(path);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Pinta el sistema con el crecimiento en `grown` (px; Infinity = entero).
 * `back`, si lo hay, recibe las raíces del fondo (ese lienzo va a media
 * resolución y, al ampliarlo, el navegador lo suaviza: se ven desenfocadas);
 * si no, van al mismo, más tenues.
 */
export function paintRoots(front: CanvasRenderingContext2D, back: CanvasRenderingContext2D | null, sys: RootSystem, grown: number, ink: RootInk) {
  // Las hebras que acaban en una etiqueta no se apagan antes de llegar.
  const tipFill = gradient(front, ink, 0.75);
  paintStrands(front, sys, grown, ink, (st) => !back || st.depth <= FAR, gradient(front, ink), tipFill);
  if (back) paintStrands(back, sys, grown, ink, (st) => st.depth > FAR, gradient(back, ink), tipFill);
}

/**
 * El halo de las fibras de delante, en un lienzo propio que va detrás de
 * ellas y a baja resolución (1/2 px por px CSS): al ampliarlo, el navegador
 * lo suaviza. Se pintan las fibras, se reducen dos veces a la mitad (cada
 * paso promedia 2 × 2 píxeles: otro desenfoque barato) y las dos copias,
 * teñidas, quedan una sobre otra: un halo ceñido y otro ancho y tenue. Es lo
 * que hacía filter: drop-shadow() en CSS, pero el navegador ya no lo
 * recalcula en cada fotograma en que algo se mueve por encima.
 *
 * `chain`: lienzos de trabajo, cada uno a la mitad de resolución que el
 * anterior (el primero, a la mitad de `ctx`).
 */
export function paintGlow(ctx: CanvasRenderingContext2D, chain: CanvasRenderingContext2D[], sys: RootSystem, grown: number, ink: RootInk, color: string) {
  paintStrands(ctx, sys, grown, ink, (st) => st.depth <= FAR, gradient(ctx, ink), gradient(ctx, ink, 0.75));
  let src = ctx.canvas;
  for (const c of chain) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.drawImage(src, 0, 0, c.canvas.width, c.canvas.height);
    src = c.canvas;
  }
  tint(ctx, color, 0.6);
  const wide = chain[chain.length - 1];
  if (!wide) return;
  tint(wide, color, 1);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-over";
  ctx.globalAlpha = 0.3;
  ctx.drawImage(wide.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/** Tiñe lo pintado de un color, con su misma transparencia (por `alpha`). */
function tint(ctx: CanvasRenderingContext2D, color: string, alpha: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/** Curva del crecimiento en el tiempo: arranca rápido y se frena, como una raíz. */
export const growEase = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 1.7);

/** Inversa de growEase: en qué fracción del tiempo se llega a la fracción `g`. */
export const growEaseInverse = (g: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, g)), 1 / 1.7);
