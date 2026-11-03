// Dibuja un fotograma por capas con paralaje (WebGL2, un solo pase). Cada
// capa es una imagen entera que solo se traslada (los arcos, el símbolo) o se
// transforma como el plano del suelo: nada se estira ni se rompe, y lo que
// queda al descubierto está renderizado de verdad en la capa de detrás.
//
// Desplazamiento de una capa: d = (−px·Kx, py·Ky) · ganancia · (máx(1/Z, 0) −
// 1/Z_ref), con 1/Z = a·u + b·v + c (el suelo, afín; el resto, constante). El
// shader invierte esa transformación en forma cerrada para cada píxel. Las
// capas se componen de atrás adelante en lineal (alfa premultiplicado), con la
// viñeta de la v1 fija al fotograma y un tramado contra las bandas.
//
// Dos juegos de texturas: la versión ligera (L) y la HD (H), cada uno con su
// resolución fija; cuando llega la HD del fotograma que se ve, se funde con la
// ligera en HD_FADE_MS.

import { FRAME_ASPECT, HD_FADE_MS } from "./config";
import { createProgram, fullscreenQuad, sizeCanvas } from "./gl";
import type { Manifest, Plan, Shown } from "./sequence";

export interface FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly kind: "layers" | "flat";
  setPlan(plan: Plan): void;
  /** Ajusta el búfer al tamaño CSS × min(dpr, 2). Devuelve false si no tiene tamaño. */
  resize(): boolean;
  /** Pinta; devuelve true si hay una animación en curso (el fundido a HD). */
  draw(shown: Shown, pointer: { x: number; y: number }, amp: number, now: number): boolean;
  stats(): { textureBytes: number };
  dispose(): void;
}

export const MAX_LAYERS = 12;
export const MAX_BOXES = 40;

const VERT = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;
#define MAXL ${MAX_LAYERS}
#define MAXB ${MAX_BOXES}
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uBaseL;
uniform sampler2D uAtlasL;
uniform sampler2D uAlphaL;
uniform sampler2D uBaseH;
uniform sampler2D uAtlasH;
uniform sampler2D uAlphaH;
uniform bool uSplit;
uniform float uMix;
uniform vec2 uCover;
uniform vec2 uShift;
uniform vec2 uMargin;
uniform vec2 uInset;
uniform float uZr;
uniform int uLayers;
uniform int uSolo;
uniform vec4 uPlane[MAXL];
uniform int uStart[MAXL + 1];
uniform vec4 uBox[MAXB];
uniform vec4 uRectL[MAXB];
uniform vec4 uRectH[MAXB];

vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// De la pantalla a la capa: inversa de p = q + s·(máx(a·qx + b·qy + c, 0) − zr).
vec2 source(vec2 p, vec4 pl) {
  vec2 s = uShift * pl.w;
  float k = pl.x * s.x + pl.y * s.y;
  float w = (pl.x * p.x + pl.y * p.y + pl.z + k * uZr) / (1.0 + k);
  return w > 0.0 ? p - s * (w - uZr) : p + s * uZr;
}

vec3 composite(sampler2D base, sampler2D atlas, sampler2D alpha, bool high, vec2 p) {
  vec2 q = source(p, uPlane[0]);
  vec3 acc = uSolo < 0 || uSolo == 0 ? toLin(texture(base, (q + uMargin) / (1.0 + 2.0 * uMargin)).rgb) : vec3(0.0);
  for (int l = 1; l < MAXL; l++) {
    if (l >= uLayers) break;
    if (uSolo >= 0 && l != uSolo) continue;
    vec2 ql = source(p, uPlane[l]);
    for (int b = uStart[l]; b < uStart[l + 1]; b++) {
      vec4 r = uBox[b];
      if (any(lessThan(ql, r.xy + uInset)) || any(greaterThan(ql, r.zw - uInset))) continue;
      vec4 ar = high ? uRectH[b] : uRectL[b];
      vec2 t = ar.xy + (ql - r.xy) / (r.zw - r.xy) * ar.zw;
      vec4 c = texture(atlas, t);
      if (uSplit) c.a = texture(alpha, t).r; // atlas apilado: el alfa va aparte
      // Premultiplicado: el color nunca pasa del alfa (la compresión lo puede empujar
      // un poco por encima en los bordes, y al dividir saldrían puntos brillantes).
      c.rgb = min(c.rgb, vec3(c.a));
      if (c.a > 0.002) acc = toLin(c.rgb / c.a) * c.a + (1.0 - c.a) * acc;
      break;
    }
  }
  return acc;
}

void main() {
  vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uCover + 0.5;
  vec3 col = uMix < 1.0 ? composite(uBaseL, uAtlasL, uAlphaL, false, p) : vec3(0.0);
  if (uMix > 0.0) col = mix(col, composite(uBaseH, uAtlasH, uAlphaH, true, p), uMix);
  vec2 v = p * 2.0 - 1.0;
  float vig = uSolo >= 0 ? 1.0 : 1.0 - 0.22 * clamp(v.x * v.x * 0.6 + v.y * v.y - 0.25, 0.0, 1.0);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  outColor = vec4(toSrgb(col) * vig + (uSolo >= 0 ? 0.0 : n / 255.0), 1.0);
}
`;

type Slot = {
  tier: number;
  mips: boolean;
  base: WebGLTexture | null;
  atlas: WebGLTexture | null;
  alpha: WebGLTexture | null;
  baseSize: [number, number] | null;
  atlasSize: [number, number] | null;
  index: number;
};

const coverScale = (w: number, h: number): [number, number] => {
  const view = w / h;
  return view > FRAME_ASPECT ? [1, FRAME_ASPECT / view] : [view / FRAME_ASPECT, 1];
};

export class LayeredRenderer implements FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly kind = "layers" as const;
  readonly maxTexture: number;
  private gl: WebGL2RenderingContext;
  private manifest: Manifest;
  private prog: WebGLProgram | null = null;
  private buf: WebGLBuffer | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private slots: Slot[] = [];
  private plan: Plan | null = null;
  private lost = false;
  private shownIndex = -1;
  private shownLevel = -1;
  /** Depuración (?capa=mark): solo esa capa, sobre negro, sin viñeta ni tramado. */
  solo = "";
  private fadeStart = -Infinity;
  private onLost: (e: Event) => void;
  private onRestored: () => void;
  private planes = new Float32Array(MAX_LAYERS * 4);
  private starts = new Int32Array(MAX_LAYERS + 1);
  private boxes = new Float32Array(MAX_BOXES * 4);
  private rects = [new Float32Array(MAX_BOXES * 4), new Float32Array(MAX_BOXES * 4)];

  constructor(canvas: HTMLCanvasElement, manifest: Manifest) {
    this.canvas = canvas;
    this.manifest = manifest;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("Sin WebGL2");
    this.gl = gl;
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    this.init();
    this.onLost = (e) => {
      e.preventDefault();
      this.lost = true;
    };
    this.onRestored = () => {
      this.lost = false;
      this.init();
      if (this.plan) this.setPlan(this.plan);
    };
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
  }

  private init() {
    const gl = this.gl;
    this.prog = createProgram(gl, VERT, FRAG);
    gl.useProgram(this.prog);
    this.buf = fullscreenQuad(gl, this.prog);
    for (const name of ["uBaseL", "uAtlasL", "uAlphaL", "uBaseH", "uAtlasH", "uAlphaH", "uSplit", "uMix", "uCover", "uShift", "uMargin", "uInset", "uZr", "uLayers", "uSolo", "uPlane", "uStart", "uBox", "uRectL", "uRectH"]) {
      this.loc[name] = gl.getUniformLocation(this.prog, name);
    }
    ["uBaseL", "uAtlasL", "uAlphaL", "uBaseH", "uAtlasH", "uAlphaH"].forEach((name, unit) => gl.uniform1i(this.loc[name], unit));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    this.slots = [];
    this.shownIndex = -1;
  }

  setPlan(plan: Plan) {
    const same = this.plan && this.slots.length && this.plan.light === plan.light && this.plan.hd === plan.hd && this.plan.mips === plan.mips;
    this.plan = plan;
    if (same) return;
    this.slots.forEach((s) => this.freeSlot(s));
    const make = (tier: number, mips: boolean): Slot => ({ tier, mips, base: null, atlas: null, alpha: null, baseSize: null, atlasSize: null, index: -1 });
    this.slots = [make(plan.light, true), make(plan.hd ?? plan.light, plan.mips)];
    // Todas las unidades con algo dentro desde el principio (sin avisos de WebGL).
    this.slots.forEach((s) => this.ensure(s, 1, 1, 1, 1));
    this.shownIndex = -1;
  }

  private texture(w: number, h: number, mips: boolean, format: number = this.gl.RGBA8) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, format, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  private ensure(s: Slot, bw: number, bh: number, aw: number, ah: number) {
    const gl = this.gl;
    if (!s.baseSize || s.baseSize[0] !== bw || s.baseSize[1] !== bh) {
      if (s.base) gl.deleteTexture(s.base);
      s.base = this.texture(bw, bh, s.mips);
      s.baseSize = [bw, bh];
    }
    if (!s.atlasSize || s.atlasSize[0] < aw || s.atlasSize[1] < ah) {
      if (s.atlas) gl.deleteTexture(s.atlas);
      if (s.alpha) gl.deleteTexture(s.alpha);
      s.atlas = this.texture(aw, ah, s.mips);
      s.alpha = this.texture(aw, ah, s.mips, gl.R8);
      s.atlasSize = [aw, ah];
    }
  }

  private freeSlot(s: Slot) {
    if (this.gl.isContextLost()) return;
    if (s.base) this.gl.deleteTexture(s.base);
    if (s.atlas) this.gl.deleteTexture(s.atlas);
    if (s.alpha) this.gl.deleteTexture(s.alpha);
  }

  private upload(s: Slot, shown: Shown) {
    const gl = this.gl;
    const [base, atlas, alpha] = shown.bitmaps;
    if (!base?.width || !atlas?.width || (alpha && !alpha.width)) return false; // liberado (close) antes de subirlo
    const max = this.manifest.atlasMax[String(s.tier)] ?? [atlas.width, atlas.height];
    this.ensure(s, base.width, base.height, Math.max(max[0], atlas.width), Math.max(max[1], atlas.height));
    gl.activeTexture(gl.TEXTURE0);
    for (const [tex, bm] of [
      [s.base, base],
      [s.atlas, atlas],
    ] as const) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bm);
      if (s.mips) gl.generateMipmap(gl.TEXTURE_2D);
    }
    if (alpha) {
      gl.bindTexture(gl.TEXTURE_2D, s.alpha);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RED, gl.UNSIGNED_BYTE, alpha);
      if (s.mips) gl.generateMipmap(gl.TEXTURE_2D);
    }
    s.index = shown.index;
    return true;
  }

  resize() {
    return sizeCanvas(this.canvas);
  }

  draw(shown: Shown, pointer: { x: number; y: number }, amp: number, now: number) {
    const gl = this.gl;
    const rec = shown.rec;
    if (this.lost || gl.isContextLost() || !this.plan || !rec || !this.prog) return false;
    const slot = this.slots[shown.level];
    if (slot.index !== shown.index && !this.upload(slot, shown)) return false;
    // Fundido: la HD llega al fotograma que ya se ve en ligera.
    if (shown.index !== this.shownIndex) this.fadeStart = -Infinity;
    else if (shown.level === 1 && this.shownLevel === 0) this.fadeStart = now;
    this.shownIndex = shown.index;
    this.shownLevel = shown.level;
    const lightHere = this.slots[0].index === shown.index;
    const mix = shown.level === 0 ? 0 : lightHere ? Math.min(1, Math.max(0, (now - this.fadeStart) / HD_FADE_MS)) : 1;

    // Capas, cajas y rectángulos del atlas de este fotograma.
    const m = this.manifest;
    const layers = rec.l.slice(0, MAX_LAYERS);
    let nb = 0;
    layers.forEach((L, i) => {
      this.planes.set([L.z[0], L.z[1], L.z[2], L.gain], i * 4);
      this.starts[i] = nb;
      if (i === 0) return; // la base no va en el atlas
      for (const uv of L.uv) {
        if (nb >= MAX_BOXES) break;
        this.boxes.set(uv, nb * 4);
        nb++;
      }
    });
    this.starts[layers.length] = nb;
    for (let k = 0; k < 2; k++) {
      const s = this.slots[k];
      const list = rec.atlas[String(s.tier)];
      if (!list || !s.atlasSize) continue;
      const [W, H] = s.atlasSize;
      for (let b = 0; b < nb && b < list.length; b++) {
        const [x, y, w, h] = list[b];
        this.rects[k].set([x / W, y / H, w / W, h / H], b * 4);
      }
    }

    const { width: w, height: h } = this.canvas;
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.prog);
    const units: [Slot, number][] = [
      [this.slots[0], 0],
      [this.slots[1], 3],
    ];
    for (const [s, unit] of units) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, s.base);
      gl.activeTexture(gl.TEXTURE0 + unit + 1);
      gl.bindTexture(gl.TEXTURE_2D, s.atlas ?? s.base);
      gl.activeTexture(gl.TEXTURE0 + unit + 2);
      gl.bindTexture(gl.TEXTURE_2D, s.alpha ?? s.base);
    }
    gl.uniform1i(this.loc.uSplit, m.atlasGap !== undefined ? 1 : 0);
    gl.uniform1f(this.loc.uMix, mix);
    gl.uniform2f(this.loc.uCover, ...coverScale(w, h));
    gl.uniform2f(this.loc.uShift, -pointer.x * m.k[0] * amp, pointer.y * m.k[1] * amp);
    gl.uniform2f(this.loc.uMargin, m.margin[0], m.margin[1]);
    gl.uniform2f(this.loc.uInset, (m.pad?.[0] ?? 0) / 2, (m.pad?.[1] ?? 0) / 2);
    gl.uniform1f(this.loc.uZr, rec.zr);
    gl.uniform1i(this.loc.uLayers, layers.length);
    gl.uniform1i(this.loc.uSolo, this.solo ? layers.findIndex((L) => L.g === this.solo || L.g.split("+").includes(this.solo)) : -1);
    gl.uniform4fv(this.loc.uPlane, this.planes);
    gl.uniform1iv(this.loc.uStart, this.starts);
    gl.uniform4fv(this.loc.uBox, this.boxes);
    gl.uniform4fv(this.loc.uRectL, this.rects[0]);
    gl.uniform4fv(this.loc.uRectH, this.rects[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return mix > 0 && mix < 1;
  }

  stats() {
    let bytes = 0;
    for (const s of this.slots) {
      const k = s.mips ? 4 / 3 : 1;
      if (s.baseSize) bytes += s.baseSize[0] * s.baseSize[1] * 4 * k;
      if (s.atlasSize) bytes += s.atlasSize[0] * s.atlasSize[1] * (this.manifest.atlasGap !== undefined ? 5 : 4) * k;
    }
    return { textureBytes: Math.round(bytes) };
  }

  dispose() {
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    if (!gl.isContextLost()) {
      this.slots.forEach((s) => this.freeSlot(s));
      gl.deleteBuffer(this.buf);
      gl.deleteProgram(this.prog);
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
