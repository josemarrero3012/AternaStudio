// El árbol de partículas (WebGL 1). Una sola llamada de dibujo con todas las
// partículas como puntos: cada una lleva su sitio en las cuatro formas
// (shapes.ts) y el shader de vértices la mueve entre ellas según el scroll,
// con un retardo propio (no llegan todas a la vez) y un remolino de ruido a
// mitad de camino. Se suman con mezcla aditiva sobre un fondo noche con un
// halo detrás del árbol: donde se juntan muchas, brillan.
//
// Sin WebGL, PosterRenderer pinta la imagen fija (poster.webp).

import { createProgram, sizeCanvas } from "@/lib/journey/depthRenderer";
import { CAMERA_Z, FOV, POINT_SIZE, REPEL, SWAY, TILT } from "./config";
import type { Shapes } from "./shapes";

// Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT).
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const POINTS_VERT = `
precision highp float;
attribute vec3 aStart;
attribute vec3 aTree;
attribute vec3 aRoots;
attribute vec3 aFinal;
attribute vec4 aRand;
attribute vec3 aTone;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform float uMotion;
uniform float uAssemble;
uniform float uMorph1;
uniform float uMorph2;
uniform vec4 uTreeX;
uniform vec4 uRootsX;
uniform vec4 uFinalX;
uniform vec3 uPointer;
uniform vec2 uRepel;
uniform float uPoint;
uniform float uCamZ;
uniform float uSizeMul;
varying vec3 vColor;
varying float vAlpha;
${NOISE}
float ease(float t) { return t * t * (3.0 - 2.0 * t); }
// Cada partícula sale con su retardo d (0 a 1): con spread 0,5 la última
// empieza a mitad de la transición.
float stagger(float m, float d, float spread) { return ease(clamp((m - d * spread) / (1.0 - spread), 0.0, 1.0)); }
// El degradado del logo, más luminoso (se suma sobre la noche).
vec3 brand(float g) {
  vec3 blue = vec3(0.16, 0.32, 1.0);
  vec3 violet = vec3(0.6, 0.3, 1.0);
  vec3 rose = vec3(1.0, 0.24, 0.56);
  return g < 0.5 ? mix(blue, violet, g * 2.0) : mix(violet, rose, (g - 0.5) * 2.0);
}
void main() {
  float kind = aRand.w;
  float dust = 1.0 - step(0.5, abs(kind - 1.0));
  float ring = step(1.5, kind);

  vec3 tree = aTree * uTreeX.w + uTreeX.xyz;
  vec3 roots = aRoots * uRootsX.w + uRootsX.xyz;
  vec3 fin = aFinal * uFinalX.w + uFinalX.xyz;
  // Al bajar a las raíces caen antes las de abajo; al subir, las raíces cercanas al tronco.
  float t1 = stagger(uMorph1, mix(aRand.x, 0.5 - aTree.y * 0.5, 0.6), 0.5);
  float t2 = stagger(uMorph2, mix(aRand.x, aTone.y, 0.6), 0.5);
  vec3 pos = mix(mix(tree, roots, t1), fin, t2);
  pos = mix(pos, aTree, dust);
  float ta = stagger(uAssemble, aRand.x, 0.55);
  pos = mix(aStart, pos, ta);

  // Remolino a mitad de cada viaje y respiración en reposo.
  float swirl = (sin(3.14159 * t1) + sin(3.14159 * t2)) * (1.0 - dust) + 1.4 * sin(3.14159 * ta);
  vec3 q = pos * 0.75 + vec3(0.0, uTime * 0.045, uTime * 0.02);
  vec3 n = vec3(snoise(q), snoise(q + 19.1), snoise(q + 37.7));
  pos += n * ((0.011 + dust * 0.16) * uMotion + swirl * 0.3);

  // El puntero aparta las partículas (en el plano de la escena).
  vec2 dp = pos.xy - uPointer.xy;
  float d2 = dot(dp, dp);
  float push = uPointer.z * exp(-d2 / (uRepel.x * uRepel.x)) * (1.0 - dust * 0.6);
  pos.xy += dp * inversesqrt(d2 + 1e-4) * push * uRepel.y;
  pos.z += push * 0.2;

  vec4 mv = uView * vec4(pos, 1.0);
  gl_Position = uProj * mv;
  float persp = uCamZ / max(0.4, -mv.z);
  gl_PointSize = clamp(uPoint * aRand.z * persp * (1.0 + push * 1.2) * uSizeMul, 1.0, 64.0);

  // Color: el degradado del logo en el árbol; en las raíces, índigo y
  // lavanda con pulsos de orquídea que bajan; el anillo, lavanda a orquídea.
  vec3 cTree = brand(aTone.x);
  float wave = fract(aTone.y * 2.4 - uTime * 0.14 * uMotion);
  float pulse = exp(-pow((wave - 0.5) * 9.0, 2.0));
  vec3 cRoot = mix(vec3(0.3, 0.34, 0.86), vec3(0.62, 0.66, 1.0), aTone.y * 0.7);
  cRoot = mix(cRoot, vec3(1.15, 0.65, 1.3), pulse * 0.8);
  vec3 cRing = mix(vec3(0.62, 0.66, 1.0), vec3(0.9, 0.52, 1.0), aTone.x);
  vec3 cFinal = mix(cTree, cRing, ring);
  vec3 color = mix(mix(cTree, cRoot, t1), cFinal, t2);
  color = mix(color, vec3(0.62, 0.66, 1.0), dust);

  float twinkle = 0.7 + 0.3 * sin(uTime * (0.7 + aRand.y * 2.3) * uMotion + aRand.y * 40.0);
  float alpha = twinkle * mix(0.5, 0.95, aTone.z * (1.0 - t1 * (1.0 - t2)));
  alpha *= mix(1.0, 0.32, dust);
  // En las raíces están más repartidas: algo más de brillo y tamaño.
  float spreadOut = t1 * (1.0 - t2) * (1.0 - dust);
  alpha *= 1.0 + spreadOut * 0.9;
  gl_PointSize *= 1.0 + spreadOut * 0.35;
  alpha *= mix(0.45, 1.0, ta);
  alpha *= 1.0 + push * 1.5;
  alpha *= smoothstep(13.0, 3.2, -mv.z) * smoothstep(0.4, 1.4, -mv.z);
  vColor = color;
  vAlpha = alpha;
}
`;

const POINTS_FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
uniform float uGain;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c) * 4.0;
  if (d2 > 1.0) discard;
  float core = exp(-d2 * 5.5);
  float halo = 1.0 - d2;
  gl_FragColor = vec4(vColor * (core * 0.8 + halo * halo * 0.22) * vAlpha * uGain, 1.0);
}
`;

const BG_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// La noche del escenario, con un halo violeta detrás de la forma.
const BG_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec3 uGlow; // centro (uv) y radio (en alturas de pantalla)
uniform float uGlowAmount;
void main() {
  vec2 p = vUv - uGlow.xy;
  p.x *= uResolution.x / uResolution.y;
  float r = length(p) / uGlow.z;
  vec3 base = vec3(11.0, 13.0, 38.0) / 255.0;
  vec3 haze = vec3(44.0, 34.0, 112.0) / 255.0;
  vec3 color = base + haze * exp(-r * r * 1.6) * uGlowAmount;
  // Viñeta suave.
  vec2 v = vUv - 0.5;
  color *= 1.0 - dot(v, v) * 0.55;
  gl_FragColor = vec4(color, 1.0);
}
`;

// Matrices 4 × 4 (columnas, como WebGL) ----------------------------------------

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

/** Vista: la escena gira (guiñada y cabeceo) alrededor de `pivot` y la cámara mira desde z = dist. */
function view(yaw: number, pitch: number, dist: number, pivot: number) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  // R = Rx(pitch) · Ry(yaw); M = T(0, pivot, -dist) · R · T(0, -pivot, 0)
  const r00 = cy, r01 = 0, r02 = sy;
  const r10 = sp * sy, r11 = cp, r12 = -sp * cy;
  const r20 = -cp * sy, r21 = sp, r22 = cp * cy;
  const tx = -r01 * pivot;
  const ty = -r11 * pivot + pivot;
  const tz = -r21 * pivot - dist;
  // prettier-ignore
  return new Float32Array([
    r00, r10, r20, 0,
    r01, r11, r21, 0,
    r02, r12, r22, 0,
    tx, ty, tz, 1,
  ]);
}

// Dónde va cada forma según la pantalla ----------------------------------------

export type Layout = { tree: [number, number, number, number]; roots: [number, number, number, number]; final: [number, number, number, number] };

/** Semialtura visible en el plano del árbol. */
export const HALF_H = Math.tan(FOV / 2) * CAMERA_Z;

/**
 * Posición (x, y, z) y escala de cada forma. En ordenador el árbol queda
 * arriba y al centro, sobre el titular (abajo); en móvil, más pequeño y algo
 * más alto, porque el texto ocupa casi media pantalla.
 */
export function layoutFor(aspect: number): Layout {
  const H = HALF_H;
  const W = H * aspect;
  if (aspect >= 1) {
    return {
      tree: [0, 0.2 * H, 0, Math.min(0.6 * H, 0.42 * W)],
      roots: [0, 0, 0, 0.8 * H],
      final: [0, 0.14 * H, 0, Math.min(0.5 * H, 0.3 * W)],
    };
  }
  return {
    tree: [0, 0.36 * H, 0, Math.min(0.44 * H, 0.82 * W)],
    roots: [0, 0.1 * H, 0, 0.72 * H],
    final: [0, 0.3 * H, 0, Math.min(0.4 * H, 0.74 * W)],
  };
}

// Renderizador ------------------------------------------------------------------

export type TreeState = {
  time: number; // s
  assemble: number; // 0 a 1
  morph1: number; // árbol → raíces, 0 a 1
  morph2: number; // raíces → árbol crecido, 0 a 1
  pointer: { x: number; y: number }; // -1 a 1 (y hacia arriba)
  energy: number; // fuerza del empuje del puntero, 0 a 1
  motion: boolean; // false con movimiento reducido
};

export interface TreeRenderer {
  readonly canvas: HTMLCanvasElement;
  resize(): boolean;
  draw(state: TreeState): void;
  dispose(): void;
}

const ATTRS = [
  ["aStart", 3, "start"],
  ["aTree", 3, "tree"],
  ["aRoots", 3, "roots"],
  ["aFinal", 3, "final"],
  ["aRand", 4, "rand"],
  ["aTone", 3, "tone"],
] as const;

export class ParticleRenderer implements TreeRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private shapes: Shapes;
  private points: WebGLProgram | null = null;
  private bg: WebGLProgram | null = null;
  private buffers: WebGLBuffer[] = [];
  private quad: WebGLBuffer | null = null;
  private locs: Record<string, WebGLUniformLocation | null> = {};
  private attrLocs: number[] = [];
  private bgPos = -1;
  private lost = false;
  private onLost: (e: Event) => void;
  private onRestored: () => void;

  constructor(canvas: HTMLCanvasElement, shapes: Shapes) {
    this.canvas = canvas;
    this.shapes = shapes;
    // preserveDrawingBuffer: el vidrio de las tarjetas copia este lienzo.
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    if (!gl) throw new Error("Sin WebGL");
    this.gl = gl;
    this.init();
    this.onLost = (e) => {
      e.preventDefault();
      this.lost = true;
    };
    this.onRestored = () => {
      this.lost = false;
      this.init();
    };
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
  }

  private init() {
    const gl = this.gl;
    this.points = createProgram(gl, POINTS_VERT, POINTS_FRAG);
    this.bg = createProgram(gl, BG_VERT, BG_FRAG);
    this.buffers = ATTRS.map(([, , key]) => {
      const buf = gl.createBuffer();
      if (!buf) throw new Error("WebGL: sin búfer");
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.shapes[key], gl.STATIC_DRAW);
      return buf;
    });
    this.attrLocs = ATTRS.map(([name]) => gl.getAttribLocation(this.points!, name));
    for (const name of ["uProj", "uView", "uTime", "uMotion", "uAssemble", "uMorph1", "uMorph2", "uTreeX", "uRootsX", "uFinalX", "uPointer", "uRepel", "uPoint", "uCamZ", "uGain", "uSizeMul"]) {
      this.locs[name] = gl.getUniformLocation(this.points, name);
    }
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.bgPos = gl.getAttribLocation(this.bg, "aPosition");
    for (const name of ["uResolution", "uGlow", "uGlowAmount"]) this.locs[name] = gl.getUniformLocation(this.bg, name);
  }

  resize() {
    return sizeCanvas(this.canvas);
  }

  draw(s: TreeState) {
    const gl = this.gl;
    if (this.lost || gl.isContextLost() || !this.points || !this.bg) return;
    const { width: w, height: h } = this.canvas;
    const aspect = w / h;
    const L = layoutFor(aspect);
    const dpr = w / Math.max(1, this.canvas.clientWidth);
    gl.viewport(0, 0, w, h);

    // Dónde está la forma ahora (para el halo y el giro).
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const e1 = s.morph1 * s.morph1 * (3 - 2 * s.morph1);
    const e2 = s.morph2 * s.morph2 * (3 - 2 * s.morph2);
    const cy = lerp(lerp(L.tree[1], L.roots[1], e1), L.final[1], e2);
    const glowY = 0.5 + (cy / HALF_H) * 0.5;
    const glowR = lerp(lerp(L.tree[3], L.roots[3] * 1.6, e1), L.final[3], e2) / HALF_H;

    // Fondo.
    gl.disable(gl.BLEND);
    gl.useProgram(this.bg);
    for (const loc of this.attrLocs) if (loc >= 0) gl.disableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(this.bgPos);
    gl.vertexAttribPointer(this.bgPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.locs.uResolution, w, h);
    gl.uniform3f(this.locs.uGlow, 0.5, glowY, Math.max(0.25, glowR));
    gl.uniform1f(this.locs.uGlowAmount, (0.75 + 0.25 * Math.sin(s.time * 0.6)) * (s.motion ? 1 : 0.9) * lerp(1, 0.55, e1 * (1 - e2)) * (0.35 + 0.65 * s.assemble));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(this.bgPos);

    // Partículas.
    gl.useProgram(this.points);
    ATTRS.forEach(([, size], i) => {
      const loc = this.attrLocs[i];
      if (loc < 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[i]);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    });
    const sway = s.motion ? Math.sin(s.time * 0.21) * SWAY : 0;
    gl.uniformMatrix4fv(this.locs.uProj, false, perspective(FOV, aspect, 0.1, 40));
    gl.uniformMatrix4fv(this.locs.uView, false, view(s.pointer.x * TILT.yaw + sway, -s.pointer.y * TILT.pitch, CAMERA_Z, cy));
    gl.uniform1f(this.locs.uTime, s.time);
    gl.uniform1f(this.locs.uMotion, s.motion ? 1 : 0);
    gl.uniform1f(this.locs.uAssemble, s.assemble);
    gl.uniform1f(this.locs.uMorph1, s.morph1);
    gl.uniform1f(this.locs.uMorph2, s.morph2);
    gl.uniform4f(this.locs.uTreeX, ...L.tree);
    gl.uniform4f(this.locs.uRootsX, ...L.roots);
    gl.uniform4f(this.locs.uFinalX, ...L.final);
    gl.uniform3f(this.locs.uPointer, s.pointer.x * HALF_H * aspect, s.pointer.y * HALF_H, s.energy);
    gl.uniform2f(this.locs.uRepel, REPEL.radius, REPEL.strength);
    // Puntos algo más gruesos en pantallas pequeñas (hay menos partículas).
    const small = this.canvas.clientWidth < 640;
    gl.uniform1f(this.locs.uPoint, POINT_SIZE * dpr * (small ? 1.25 : 1));
    gl.uniform1f(this.locs.uCamZ, CAMERA_Z);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // Primero un resplandor: un tercio de los puntos, grandes y muy tenues
    // (hace de «bloom» sin pasadas de desenfoque). En pantallas pequeñas no
    // compensa.
    if (!small) {
      gl.uniform1f(this.locs.uSizeMul, 3.6);
      gl.uniform1f(this.locs.uGain, 0.17);
      gl.drawArrays(gl.POINTS, this.shapes.glow.first, this.shapes.glow.count);
    }
    gl.uniform1f(this.locs.uSizeMul, 1);
    gl.uniform1f(this.locs.uGain, 1.45);
    gl.drawArrays(gl.POINTS, 0, this.shapes.count);
  }

  dispose() {
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    if (!gl.isContextLost()) {
      this.buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteBuffer(this.quad);
      gl.deleteProgram(this.points);
      gl.deleteProgram(this.bg);
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** Sin WebGL: la imagen fija del árbol, cubriendo el lienzo. */
export class PosterRenderer implements TreeRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement, src: string, onLoad: () => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Sin canvas 2D");
    this.ctx = ctx;
    this.img = new Image();
    this.img.decoding = "async";
    this.img.onload = onLoad;
    this.img.src = src;
  }

  resize() {
    return sizeCanvas(this.canvas);
  }

  draw() {
    const { width: w, height: h } = this.canvas;
    const ctx = this.ctx;
    ctx.fillStyle = "#0b0d26";
    ctx.fillRect(0, 0, w, h);
    const img = this.img;
    if (!img.complete || !img.naturalWidth) return;
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * k;
    const ih = img.naturalHeight * k;
    ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  }

  dispose() {}
}
