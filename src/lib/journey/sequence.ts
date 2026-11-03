// Carga de los fotogramas (versión 2). El manifiesto (journey.json, de
// post.py) dice qué fotogramas hay, qué capas tiene cada uno y en qué
// resoluciones. Hay dos niveles: la versión ligera de todo el recorrido y la
// HD alrededor de donde se está.
//
// Orden: el fotograma que pide el scroll (ligero y HD), sus vecinos, una
// pasada gruesa (uno de cada 8), la HD cercana si el scroll va despacio, el
// resto ligero por cercanía y, parado, algo más de HD. Se guardan los bytes
// comprimidos (la ligera entera; la HD en una caché con tope) y solo se
// decodifica una ventana alrededor del fotograma actual: createImageBitmap
// decodifica fuera del hilo principal y lo que sale de la ventana se libera
// con close(). Un fotograma que falla se avisa una vez y lo sustituye el
// vecino más cercano.

import { FRAME_COUNT, HD_CACHE_MB, HD_MAX_SPEED, LIGHT_TIER, MANIFEST_URL, PORTRAIT_ASPECT, WINDOW, frameUrls, type Family } from "./config";

export type LayerRec = { g: string; uv: number[][]; z: [number, number, number]; gain: number };
export type FrameRec = { zr: number; l: LayerRec[]; atlas: Record<string, number[][]> };
export type Manifest = {
  version: 2;
  frames: number;
  ready: number;
  visible: [number, number];
  margin: [number, number];
  pad: [number, number];
  /** Atlas apilado: el color (premultiplicado) arriba, atlasGap px y el alfa debajo. */
  atlasGap?: number;
  k: [number, number];
  tope: [number, number];
  tiers: { layers: number[]; flat: number[]; portrait: number[]; fallback: number | null };
  atlasMax: Record<string, [number, number]>;
  bytes: Record<string, number>;
  f: (FrameRec | null)[];
};

let manifestPromise: Promise<Manifest> | null = null;
export function loadManifest() {
  manifestPromise ??= fetch(MANIFEST_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`manifiesto: HTTP ${r.status}`);
      return r.json() as Promise<Manifest>;
    })
    .catch((err) => {
      manifestPromise = null;
      throw err;
    });
  return manifestPromise;
}

const AVIF_1PX =
  "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAJwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAL21kYXQSAAoIGAAGiAhoNCAyGRlHh4Yhh5555oJAAJBBEdVElcakd6U9akA=";

let avifPromise: Promise<boolean> | null = null;
/** ¿Decodifica AVIF este navegador? (un AVIF de 1 px incrustado) */
export function supportsAvif() {
  avifPromise ??= fetch(AVIF_1PX)
    .then((r) => r.blob())
    .then((b) => createImageBitmap(b))
    .then(
      (bm) => {
        bm.close();
        return true;
      },
      () => false,
    );
  return avifPromise;
}

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };

/** Familia según la pantalla y el navegador (la de capas, si además hay WebGL2: lo decide el renderer). */
export function chooseFamily(cssW: number, cssH: number, avif: boolean, parallax: boolean): Family {
  if (!avif) return "fallback";
  if (cssW / Math.max(1, cssH) <= PORTRAIT_ASPECT) return "portrait";
  return parallax ? "layers" : "flat";
}

export type Plan = { family: Family; light: number; hd: number | null; mips: boolean; mobile: boolean };

/**
 * Resoluciones: la ligera es la menor; la HD, la menor con al menos el 90 %
 * de lo que pide el lienzo («cover» × min(dpr, 2)). La 3840 solo con memoria
 * y buena red; con red lenta o ahorro de datos, una menos.
 */
export function choosePlan(m: Manifest, family: Family, cssW: number, cssH: number, maxTexture = Infinity): Plan {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nav = navigator as Nav;
  const conn = nav.connection;
  const slow = !!conn && (!!conn.saveData || /2g|3g/.test(conn.effectiveType ?? ""));
  const memory = nav.deviceMemory ?? ((navigator.hardwareConcurrency || 4) >= 8 ? 8 : 4);
  const mobile = family === "portrait" || matchMedia("(pointer: coarse)").matches;
  const tiers = family === "layers" ? m.tiers.layers : family === "flat" ? m.tiers.flat : family === "portrait" ? m.tiers.portrait : m.tiers.fallback ? [m.tiers.fallback] : [];
  const need = family === "portrait" ? cssH * dpr : Math.max(cssW * dpr, cssH * dpr * (m.visible[0] / m.visible[1]));
  const fits = (t: number) => family !== "layers" || Math.max(...(m.atlasMax[String(t)] ?? [0, 0])) <= maxTexture;
  const allowed = tiers.filter((t) => (t <= 2560 || (memory >= 8 && !slow)) && fits(t));
  if (!allowed.length) return { family, light: LIGHT_TIER[family], hd: null, mips: true, mobile };
  let i = allowed.findIndex((t) => t >= 0.9 * need);
  if (i < 0) i = allowed.length - 1;
  if (slow) i = Math.max(0, i - 1);
  const light = allowed[0];
  const hd = allowed[i] > light ? allowed[i] : null;
  return { family, light, hd, mips: need < 0.83 * (hd ?? light), mobile };
}

type Slot = { state: "idle" | "loading" | "ok" | "failed"; blobs: Blob[] | null; bitmaps: ImageBitmap[] | null; decoding: boolean; bytes: number };
export type Shown = { index: number; level: 0 | 1; bitmaps: ImageBitmap[]; rec: FrameRec | null };

const MAX_FETCHES = 6;
const MAX_DECODES = 2;

export class Sequence {
  readonly manifest: Manifest;
  readonly plan: Plan;
  /** Bytes descargados (para la capa de depuración). */
  bytesLoaded = 0;
  private slots: Slot[][];
  private target = 0;
  private dir = 1;
  private speed = 0;
  private lastT = 0;
  private lastTarget = 0;
  private tick = 0;
  private fetches = 0;
  private decodes = 0;
  private hdBytes = 0;
  private running = false;
  private pinned: [number, number] = [-1, -1];
  private warned = new Set<string>();
  private listeners = new Set<() => void>();
  private first: Promise<boolean> | null = null;
  private firstDone: ((ok: boolean) => void) | null = null;
  private disposed = false;

  constructor(manifest: Manifest, plan: Plan) {
    this.manifest = manifest;
    this.plan = plan;
    const empty = (): Slot => ({ state: "idle", blobs: null, bitmaps: null, decoding: false, bytes: 0 });
    this.slots = [Array.from({ length: FRAME_COUNT }, empty), Array.from({ length: FRAME_COUNT }, empty)];
  }

  get hasHd() {
    return this.plan.hd !== null;
  }

  tier(level: number) {
    return level ? (this.plan.hd ?? this.plan.light) : this.plan.light;
  }

  available(i: number) {
    return i >= 0 && i < FRAME_COUNT && !!this.manifest.f[i];
  }

  /** El fotograma presente en el manifiesto más cercano a i. */
  nearestAvailable(i: number) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (this.available(i - d)) return i - d;
      if (this.available(i + d)) return i + d;
    }
    return -1;
  }

  /** Resuelve true cuando hay un primer fotograma decodificado (false si falla). */
  start() {
    this.running = true;
    this.first ??= new Promise<boolean>((resolve) => {
      this.firstDone = resolve;
    });
    this.pump();
    this.checkFirst();
    return this.first;
  }

  /** Deja de lanzar descargas nuevas (las que están en vuelo terminan). */
  stop() {
    this.running = false;
  }

  /** Libera todo lo decodificado (al cambiar de plan). */
  dispose() {
    this.stop();
    this.disposed = true;
    for (const level of this.slots) for (const s of level) this.release(s);
    this.listeners.clear();
  }

  onLoad(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** En cada fotograma del bucle: dónde está el scroll y a qué velocidad. */
  update(target: number, now: number) {
    const dt = Math.max(1, now - this.lastT);
    const moved = target !== this.lastTarget;
    if (moved) this.dir = target > this.lastTarget ? 1 : -1;
    const inst = (Math.abs(target - this.lastTarget) * 1000) / dt;
    this.speed = this.speed * 0.85 + inst * 0.15;
    this.lastT = now;
    this.lastTarget = target;
    this.target = target;
    // Las descargas y decodificaciones que terminan ya relanzan la cola; aquí,
    // al moverse el scroll y de vez en cuando (al pararse entra la HD).
    if (moved || ++this.tick % 8 === 0) {
      this.pump();
      this.decodeWindow();
    }
  }

  /** Lo mejor que hay decodificado para i: la HD, la ligera o el vecino más cercano. */
  best(i: number): Shown | null {
    const pick = (level: 0 | 1, index: number): Shown | null => {
      const s = this.slots[level][index];
      if (!s?.bitmaps) return null;
      this.pinned = [level, index];
      return { index, level, bitmaps: s.bitmaps, rec: this.manifest.f[index] };
    };
    const exact = (this.hasHd && pick(1, i)) || pick(0, i);
    if (exact) return exact;
    for (let d = 1; d < FRAME_COUNT; d++) {
      for (const j of [i - d * this.dir, i + d * this.dir]) {
        if (j < 0 || j >= FRAME_COUNT) continue;
        const found = pick(0, j) || (this.hasHd && pick(1, j));
        if (found) return found;
      }
    }
    return null;
  }

  stats() {
    let decoded = 0;
    let hd = 0;
    let light = 0;
    for (let level = 0; level < 2; level++) {
      for (const s of this.slots[level]) {
        if (s.bitmaps) decoded += s.bitmaps.reduce((a, b) => a + b.width * b.height * 4, 0);
        if (s.state === "ok") level ? hd++ : light++;
      }
    }
    return { bytesLoaded: this.bytesLoaded, decodedBytes: decoded, light, hd, speed: this.speed };
  }

  private checkFirst() {
    if (!this.firstDone) return;
    const i = this.nearestAvailable(this.target);
    if (i < 0) {
      this.firstDone(false);
      this.firstDone = null;
      return;
    }
    const s = this.slots[0][i];
    if (s.bitmaps || s.state === "failed") {
      this.firstDone(!!s.bitmaps);
      this.firstDone = null;
    }
  }

  private emit() {
    this.checkFirst();
    this.listeners.forEach((cb) => cb());
  }

  /** El siguiente que descargar, por prioridad. */
  private next(): [number, number] | null {
    const t = this.nearestAvailable(this.target);
    if (t < 0) return null;
    const slow = this.speed < HD_MAX_SPEED;
    const idle = this.speed < 0.5;
    const free = (level: number, i: number) => this.available(i) && this.slots[level][i].state === "idle";
    const around = (radius: number) => {
      const out: number[] = [];
      for (let d = 1; d <= radius; d++) out.push(t + d * this.dir, t - d * this.dir);
      return out;
    };
    if (free(0, t)) return [0, t];
    if (this.hasHd && slow && free(1, t)) return [1, t];
    for (const i of around(3)) if (free(0, i)) return [0, i];
    const byDistance = (a: number, b: number) => Math.abs(a - t) - Math.abs(b - t);
    const coarse = Array.from({ length: Math.ceil(FRAME_COUNT / 8) }, (_, k) => k * 8).sort(byDistance);
    for (const i of coarse) if (free(0, i)) return [0, i];
    if (this.hasHd && slow) for (const i of around(WINDOW.hdFetch)) if (free(1, i)) return [1, i];
    for (const i of Array.from({ length: FRAME_COUNT }, (_, k) => k).sort(byDistance)) if (free(0, i)) return [0, i];
    if (this.hasHd && idle) for (const i of around(WINDOW.hdIdleFetch)) if (free(1, i)) return [1, i];
    return null;
  }

  private pump() {
    while (this.running && this.fetches < MAX_FETCHES) {
      const job = this.next();
      if (!job) return;
      void this.load(job[0], job[1]);
    }
  }

  private async load(level: number, i: number) {
    const s = this.slots[level][i];
    s.state = "loading";
    this.fetches++;
    try {
      const urls = frameUrls(this.plan.family, this.tier(level), i);
      const near = Math.abs(i - this.target) <= 1;
      const blobs = await Promise.all(
        urls.map(async (url) => {
          const r = await fetch(url, { priority: near ? "high" : "low" } as RequestInit);
          if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
          return r.blob();
        }),
      );
      if (this.disposed) return;
      s.blobs = blobs;
      s.bytes = blobs.reduce((a, b) => a + b.size, 0);
      s.state = "ok";
      this.bytesLoaded += s.bytes;
      if (level) {
        this.hdBytes += s.bytes;
        this.trimHd();
      }
    } catch (err) {
      s.state = "failed";
      this.warn(`${level}:${i}`, `[recorrido] fotograma ${i}${level ? " (HD)" : ""}:`, err);
    } finally {
      this.fetches--;
    }
    this.decodeWindow();
    this.emit();
    this.pump();
  }

  /** La caché de la HD: fuera lo más lejano que no se está viendo. */
  private trimHd() {
    const cap = (this.plan.mobile ? HD_CACHE_MB.mobile : HD_CACHE_MB.desktop) * 2 ** 20;
    while (this.hdBytes > cap) {
      let far = -1;
      for (let i = 0; i < FRAME_COUNT; i++) {
        const s = this.slots[1][i];
        if (s.blobs && !s.bitmaps && !s.decoding && (far < 0 || Math.abs(i - this.target) > Math.abs(far - this.target))) far = i;
      }
      if (far < 0) return;
      const s = this.slots[1][far];
      this.hdBytes -= s.bytes;
      s.blobs = null;
      s.state = "idle";
    }
  }

  private wanted(level: number, i: number) {
    const d = (i - this.target) * this.dir; // > 0: hacia donde va el scroll
    if (level === 0) return d >= -WINDOW.lightDecode && d <= WINDOW.lightDecode + 1;
    return this.speed < HD_MAX_SPEED && Math.abs(d) <= WINDOW.hdDecode;
  }

  private decodeWindow() {
    const t = this.nearestAvailable(this.target);
    for (let level = 0; level < 2; level++) {
      for (let i = 0; i < FRAME_COUNT; i++) {
        const s = this.slots[level][i];
        const keep = (this.pinned[0] === level && this.pinned[1] === i) || i === t || this.wanted(level, i);
        if (s.bitmaps && !keep) this.release(s);
      }
    }
    if (this.decodes >= MAX_DECODES) return;
    const order: [number, number][] = [[0, t]];
    if (this.hasHd) order.push([1, t]);
    for (let d = 1; d <= WINDOW.lightDecode + 1; d++) order.push([0, t + d * this.dir], [0, t - d * this.dir]);
    if (this.hasHd) for (let d = 1; d <= WINDOW.hdDecode; d++) order.push([1, t + d * this.dir], [1, t - d * this.dir]);
    for (const [level, i] of order) {
      if (this.decodes >= MAX_DECODES) return;
      // El más cercano al scroll, siempre (con pocos fotogramas puede quedar lejos).
      if (!this.available(i) || (!(level === 0 && i === t) && !this.wanted(level, i))) continue;
      const s = this.slots[level][i];
      if (s.blobs && !s.bitmaps && !s.decoding) void this.decode(level, i);
    }
  }

  private async decode(level: number, i: number) {
    const s = this.slots[level][i];
    if (!s.blobs) return;
    s.decoding = true;
    this.decodes++;
    try {
      const opts: ImageBitmapOptions = { premultiplyAlpha: "premultiply", colorSpaceConversion: "none" };
      let bitmaps = await Promise.all(s.blobs.map((b) => createImageBitmap(b, opts)));
      const gap = this.manifest.atlasGap;
      if (this.plan.family === "layers" && gap !== undefined && bitmaps[1]) {
        // El atlas apilado, en dos: el color y el alfa (recortar un ImageBitmap no lo vuelve a decodificar).
        const [base, atlas] = bitmaps;
        const h = (atlas.height - gap) / 2;
        const parts = await Promise.all([createImageBitmap(atlas, 0, 0, atlas.width, h), createImageBitmap(atlas, 0, h + gap, atlas.width, h)]);
        atlas.close();
        bitmaps = [base, ...parts];
      }
      if (this.disposed) {
        bitmaps.forEach((b) => b.close());
        return;
      }
      s.bitmaps = bitmaps;
    } catch (err) {
      s.state = "failed";
      s.blobs = null;
      this.warn(`d${level}:${i}`, `[recorrido] no se pudo decodificar el fotograma ${i}:`, err);
    } finally {
      s.decoding = false;
      this.decodes--;
    }
    this.emit();
    this.decodeWindow();
  }

  private release(s: Slot) {
    s.bitmaps?.forEach((b) => b.close());
    s.bitmaps = null;
  }

  private warn(key: string, msg: string, err: unknown) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(msg, err);
  }
}

let shared: { key: string; seq: Sequence } | null = null;
/**
 * Una secuencia por página y plan: guarda lo cargado mientras viva la página
 * (al volver a la portada sin recargar ya está). Si cambia el plan (girar la
 * pantalla, agrandar mucho la ventana), se libera la anterior.
 */
export function getSequence(manifest: Manifest, plan: Plan) {
  const key = `${plan.family}:${plan.light}:${plan.hd}`;
  if (shared?.key === key) return shared.seq;
  shared?.seq.dispose();
  shared = { key, seq: new Sequence(manifest, plan) };
  return shared.seq;
}
