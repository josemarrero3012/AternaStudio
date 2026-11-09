// El árbol de partículas (WebGL 1). Una sola llamada de dibujo con todas las
// partículas como puntos: cada una lleva su sitio en las cuatro formas
// (shapes.ts) y el shader de vértices la mueve entre ellas según el scroll,
// con un retardo propio (no llegan todas a la vez) y un remolino de ruido a
// mitad de camino. Se suman con mezcla aditiva sobre un fondo noche con un
// halo detrás del árbol: donde se juntan muchas, brillan.
//
// Sin WebGL, PosterRenderer pinta la imagen fija (poster.webp).

import { createProgram, sizeCanvas } from "@/lib/journey/depthRenderer";
import { CAMERA_Z, FOV, GLOW, POINT_SIZE } from "./config";
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
attribute vec4 aTone;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform float uMotion;
uniform float uAssemble;
uniform float uMorph1;
uniform float uMorph2;
uniform float uHandoff;
uniform vec4 uTreeX;
uniform vec4 uRootsX;
uniform vec4 uFinalX;
// El brillo del puntero: su posición ahora y una estela que se apaga
// (x, y en el plano de la escena; z, intensidad).
#define TRAIL ${GLOW.trail}
uniform vec3 uTrail[TRAIL];
uniform float uGlowR;
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
  float leaf = step(1.5, kind);

  vec3 tree = aTree * uTreeX.w + uTreeX.xyz;
  vec3 roots = aRoots * uRootsX.w + uRootsX.xyz;
  vec3 fin = aFinal * uFinalX.w + uFinalX.xyz;
  // Al bajar a las raíces caen antes las de abajo; al subir, el árbol crece
  // de la base a la copa (aTone.w).
  float t1 = stagger(uMorph1, mix(aRand.x, 0.5 - aTree.y * 0.5, 0.6), 0.5);
  float t2 = stagger(uMorph2, mix(aRand.x, aTone.w, 0.78), 0.55);
  // El paso a la sección siguiente: la copa se suelta en luz que sube y se
  // abre, como semillas al viento; la madera, casi quieta, se apaga antes.
  float release = smoothstep(0.08 + aRand.x * 0.4, 0.5 + aRand.x * 0.4, uHandoff);
  float side = fract(aRand.y * 7.31) - 0.5;
  fin.y += release * mix(0.05, 0.1 + aTone.w * 0.32 + aRand.y * 0.24, leaf);
  fin.x += release * (aFinal.x * 0.24 + side * 0.4) * leaf;
  vec3 pos = mix(mix(tree, roots, t1), fin, t2);
  pos = mix(pos, aTree, dust);
  float ta = stagger(uAssemble, aRand.x, 0.55);
  pos = mix(aStart, pos, ta);

  // A mitad de cada viaje entre formas, las partículas no van en nube: giran
  // juntas en espiral alrededor del eje del árbol (unas más que otras, así
  // se abre en hélice) y suben un poco, y luego se posan. Encima, un poco de
  // remolino suelto.
  float travel = (sin(3.14159 * t1) + sin(3.14159 * t2)) * (1.0 - dust);
  float spin = travel * (0.55 + aRand.y * 0.7);
  float cs = cos(spin);
  float sn = sin(spin);
  pos.xz = vec2(pos.x * cs - pos.z * sn, pos.x * sn + pos.z * cs);
  pos.y += travel * (aRand.z - 0.55) * 0.18;
  float swirl = travel * 0.55 + 1.4 * sin(3.14159 * ta) + release * leaf * 0.6;
  vec3 q = pos * 0.75 + vec3(0.0, uTime * 0.07, uTime * 0.035);
  vec3 n = vec3(snoise(q), snoise(q + 19.1), snoise(q + 37.7));
  // Vida en reposo, aunque no se haga scroll: cada forma respira (un ruido
  // que fluye despacio; poco en el símbolo, que tiene que leerse nítido), la
  // copa del árbol final se mece con el viento (más cuanto más arriba) y sus
  // hojas tiemblan, cada una a su ritmo.
  float idle = mix(mix(0.016, 0.03, t1), mix(0.016, 0.032, leaf), t2);
  pos += n * ((idle + dust * 0.16) * uMotion + swirl * 0.3);
  float hgt = clamp(aFinal.y * 0.5 + 0.5, 0.0, 1.0);
  float wind = sin(uTime * 0.55 + aFinal.y * 1.1) * 0.6 + sin(uTime * 0.23 + 1.7) * 0.4;
  pos.x += wind * hgt * hgt * 0.04 * uFinalX.w * t2 * uMotion * (1.0 - dust);
  float flutter = uTime * (1.3 + aRand.y * 1.4) + aRand.x * 40.0;
  pos.xy += vec2(sin(flutter), cos(flutter * 0.8)) * 0.01 * uMotion * (leaf * t2 + (1.0 - t1) * (1.0 - t2) * 0.4 + t1 * (1.0 - t2) * 0.7) * (1.0 - dust);

  // El puntero no mueve nada: enciende las partículas que tiene cerca.
  float glow = 0.0;
  for (int i = 0; i < TRAIL; i++) {
    vec2 d = pos.xy - uTrail[i].xy;
    glow = max(glow, uTrail[i].z * exp(-dot(d, d) / (uGlowR * uGlowR)));
  }
  glow *= (1.0 - dust * 0.6) * (0.72 + 0.28 * sin(uTime * 9.0 + aRand.y * 60.0));

  vec4 mv = uView * vec4(pos, 1.0);
  gl_Position = uProj * mv;
  float persp = uCamZ / max(0.4, -mv.z);
  float size = uPoint * aRand.z * persp;

  // Textura de la forma (como el pelaje del tigre): manchas de luz fijas
  // sobre el árbol y vetas de rosa encendido.
  float fur = snoise(aTree * vec3(4.2, 4.2, 2.0) + 7.3) * 0.5 + 0.5;
  float streak = smoothstep(0.7, 0.9, fur);
  float spark = step(0.982, aRand.y) * (1.0 - dust);

  // Color: el degradado del logo en el símbolo; en las raíces, índigo y
  // lavanda con pulsos de orquídea que bajan; en el árbol final, la madera
  // de índigo a violeta y la copa de violeta a rosa (también con manchas).
  vec3 cTree = brand(clamp(aTone.x + (fur - 0.5) * 0.3, 0.0, 1.0));
  cTree = mix(cTree, vec3(1.0, 0.36, 0.78) * 1.25, streak * 0.55);
  float wave = fract(aTone.y * 2.4 - uTime * 0.14 * uMotion);
  float pulse = exp(-pow((wave - 0.5) * 9.0, 2.0));
  vec3 cRoot = mix(vec3(0.3, 0.34, 0.86), vec3(0.62, 0.66, 1.0), aTone.y * 0.7);
  cRoot = mix(cRoot, vec3(1.15, 0.65, 1.3), pulse * 0.8);
  float gF = clamp(aFinal.y * 0.42 + 0.5 + aFinal.x * 0.1, 0.0, 1.0);
  float furF = snoise(aFinal * 3.6 + 2.1) * 0.5 + 0.5;
  vec3 cWood = mix(vec3(0.2, 0.3, 0.95), vec3(0.56, 0.34, 1.0), gF);
  vec3 cLeaf = brand(clamp(0.38 + gF * 0.62 + (furF - 0.5) * 0.35, 0.0, 1.0));
  cLeaf = mix(cLeaf, vec3(1.0, 0.4, 0.8) * 1.2, smoothstep(0.72, 0.92, furF) * 0.5);
  vec3 cFinal = mix(cWood, cLeaf, leaf);
  vec3 color = mix(mix(cTree, cRoot, t1), cFinal, t2);
  color = mix(color, vec3(0.62, 0.66, 1.0), dust);
  // Destellos: una de cada treinta y tantas, casi blanca.
  color = mix(color, vec3(1.0, 0.94, 1.0), spark * 0.75);

  float twinkle = 0.7 + 0.3 * sin(uTime * (0.7 + aRand.y * 2.3) * uMotion + aRand.y * 40.0);
  float alpha = twinkle * mix(0.5, 0.95, aTone.z * (1.0 - t1 * (1.0 - t2)));
  // Las manchas solo en el árbol (en las raíces manda el pulso de luz).
  alpha *= mix(1.0, 0.7 + fur * 0.6, clamp(1.0 - t1, 0.0, 1.0) * (1.0 - dust));
  alpha *= mix(1.0, 0.65 + furF * 0.7, t2 * (1.0 - dust));
  // La madera del árbol final, algo más densa de luz (el tronco se lee), y
  // las raíces más aún: abajo la escena lleva velo.
  alpha *= 1.0 + t2 * (1.0 - leaf) * (1.0 - dust) * (0.25 + 0.8 * smoothstep(-0.2, -0.9, aFinal.y));
  // Al soltarse, las hojas se encienden un poco (luciérnagas) y la madera se
  // apaga; al final, todo, antes de que la sección llegue arriba.
  alpha *= 1.0 + release * leaf * 0.7 * (1.0 - uHandoff);
  alpha *= 1.0 - smoothstep(0.25, 0.85, uHandoff) * (1.0 - leaf) * 0.95;
  alpha *= 1.0 - smoothstep(0.6, 0.97, uHandoff);
  alpha *= mix(1.0, 0.32, dust);
  alpha *= 1.0 + spark * 0.6;
  size *= 1.0 + spark * 0.4;
  // En las raíces están más repartidas: algo más de brillo y tamaño.
  float spreadOut = t1 * (1.0 - t2) * (1.0 - dust);
  alpha *= 1.0 + spreadOut * 0.9;
  size *= 1.0 + spreadOut * 0.35;
  alpha *= mix(0.45, 1.0, ta);
  // Un barrido de luz lento, en diagonal, cruza el símbolo y el árbol final
  // cada nueve segundos (como el reflejo sobre una joya); en las raíces no.
  vec2 local = mix(aTree.xy, aFinal.xy, t2);
  float band = dot(local, vec2(0.83, 0.55)) - (fract(uTime / 9.0) * 5.2 - 2.6);
  float sheen = exp(-band * band * 30.0) * (1.0 - t1 * (1.0 - t2)) * (1.0 - dust) * uMotion * ta;
  alpha *= 1.0 + sheen * 0.9;
  color = mix(color, vec3(1.0, 0.96, 1.0), sheen * 0.28);
  // Profundidad en el árbol final: lo de detrás, más tenue.
  alpha *= mix(1.0, clamp(0.8 + aFinal.z * 0.5, 0.55, 1.12), t2 * (1.0 - dust));
  // El brillo: más luz, más tamaño y hacia el blanco.
  // (Algo menos donde las partículas van sueltas en remolino: se amontonan.)
  // En la copa del árbol final, mucho más densa, menos: si no, se quema en blanco.
  float dense = t2 * leaf;
  alpha *= 1.0 + glow * mix(4.0, 2.2, clamp(swirl, 0.0, 1.0)) * mix(1.0, 0.32, dense);
  size *= 1.0 + glow * mix(1.6, 0.6, dense);
  color = mix(color, mix(color * 1.5, vec3(1.0, 0.95, 1.0), 0.6), clamp(glow, 0.0, 1.0) * mix(0.85, 0.6, dense));
  alpha *= smoothstep(13.0, 3.2, -mv.z) * smoothstep(0.4, 1.4, -mv.z);
  gl_PointSize = clamp(size * uSizeMul, 1.0, 72.0);
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
uniform float uFade; // paso a la sección siguiente: la noche se aclara a la de la página
void main() {
  vec2 p = vUv - uGlow.xy;
  p.x *= uResolution.x / uResolution.y;
  float r = length(p) / uGlow.z;
  vec3 base = mix(vec3(11.0, 13.0, 38.0), vec3(19.0, 22.0, 59.0), uFade) / 255.0;
  vec3 haze = vec3(44.0, 34.0, 112.0) / 255.0;
  vec3 color = base + haze * exp(-r * r * 1.6) * uGlowAmount;
  // Viñeta suave. Con el paso a la sección siguiente se van viñeta y halo:
  // al acabar, el fondo es la noche de la página (--night-0) sin más.
  vec2 v = vUv - 0.5;
  color *= 1.0 - dot(v, v) * 0.55 * (1.0 - uFade);
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
 * Posición (x, y, z) y escala de cada forma. El árbol de la entrada va al
 * centro y grande, con el nombre encima (la silueta mide ±0,89): en
 * ordenador, el 64 % del alto con el centro al 49 %; en móvil, casi todo el
 * ancho y algo más arriba (el lema va debajo). Si se mueve, hay que mover
 * también el nombre y el lema (journey.css, «Entrada»).
 */
export const HERO = {
  desktop: { center: 0.49, diameter: 0.64 },
  mobile: { center: 0.41, width: 0.9 },
};

/**
 * El árbol final (de la punta de las raíces, y = -1, a la copa, y = 1;
 * unos ±1,1 de ancho, nunca más de ±1,2), grande y solo: en ordenador, el 84 % del
 * alto con el centro al 51 %; en móvil, casi todo el ancho.
 */
export const FINAL = {
  desktop: { center: 0.51, height: 0.84 },
  mobile: { center: 0.45, height: 0.62 },
};

export function layoutFor(aspect: number): Layout {
  const H = HALF_H;
  const W = H * aspect;
  if (aspect >= 1) {
    const { center, diameter } = HERO.desktop;
    return {
      tree: [0, (1 - 2 * center) * H, 0, Math.min((diameter * H) / 0.89, (0.5 * W) / 0.89)],
      roots: [0, 0, 0, 0.8 * H],
      final: [0, (1 - 2 * FINAL.desktop.center) * H, 0, Math.min(FINAL.desktop.height * H, 0.9 * W)],
    };
  }
  const { center, width } = HERO.mobile;
  return {
    tree: [0, (1 - 2 * center) * H, 0, Math.min(0.5 * H, (width * W) / 0.89)],
    roots: [0, 0.1 * H, 0, 0.72 * H],
    final: [0, (1 - 2 * FINAL.mobile.center) * H, 0, Math.min(FINAL.mobile.height * H, 0.86 * W)],
  };
}

// Renderizador ------------------------------------------------------------------

export type TreeState = {
  time: number; // s
  assemble: number; // 0 a 1
  morph1: number; // árbol → raíces, 0 a 1
  morph2: number; // raíces → árbol final, 0 a 1
  handoff: number; // paso a la sección siguiente, 0 a 1
  dim?: number; // menos luz mientras se lee el texto de encima, 0 a 1
  pointer: { x: number; y: number }; // -1 a 1 (y hacia arriba)
  energy: number; // intensidad del brillo del puntero, 0 a 1
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
  ["aTone", 4, "tone"],
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
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "high-performance" });
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
    for (const name of ["uProj", "uView", "uTime", "uMotion", "uAssemble", "uMorph1", "uMorph2", "uHandoff", "uTreeX", "uRootsX", "uFinalX", "uTrail", "uGlowR", "uPoint", "uCamZ", "uGain", "uSizeMul"]) {
      this.locs[name] = gl.getUniformLocation(this.points, name);
    }
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.bgPos = gl.getAttribLocation(this.bg, "aPosition");
    for (const name of ["uResolution", "uGlow", "uGlowAmount", "uFade"]) this.locs[name] = gl.getUniformLocation(this.bg, name);
  }

  /** La estela del brillo: la cabeza es el puntero; detrás, puntos que se apagan. */
  private trail: { x: number; y: number; s: number }[] = [];
  private trailTime = Number.NaN;
  private trailData = new Float32Array(GLOW.trail * 3);

  private updateTrail(x: number, y: number, energy: number, time: number) {
    const dt = Number.isNaN(this.trailTime) ? 0 : Math.max(0, time - this.trailTime);
    this.trailTime = time;
    const fade = Math.exp(-dt / GLOW.fade);
    for (const p of this.trail) p.s *= fade;
    const last = this.trail[0];
    if (energy > 0.05 && (!last || Math.hypot(x - last.x, y - last.y) > GLOW.radius * 0.35)) {
      this.trail.unshift({ x, y, s: energy });
      this.trail.length = Math.min(this.trail.length, GLOW.trail - 1);
    }
    const d = this.trailData;
    d.fill(0);
    d[0] = x;
    d[1] = y;
    d[2] = energy;
    this.trail.forEach((p, i) => {
      d[(i + 1) * 3] = p.x;
      d[(i + 1) * 3 + 1] = p.y;
      d[(i + 1) * 3 + 2] = p.s * 0.85;
    });
    return d;
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
    // Durante el paso a la sección siguiente, el árbol sube algo (paralaje
    // con la sección, que sube más deprisa) y se encoge un poco.
    const ho = s.handoff * s.handoff * (3 - 2 * s.handoff);
    L.final[1] += ho * 0.2 * HALF_H;
    L.final[3] *= 1 - ho * 0.12;
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
    gl.uniform1f(this.locs.uGlowAmount, (0.75 + 0.25 * Math.sin(s.time * 0.6)) * (s.motion ? 1 : 0.9) * lerp(1, 0.55, e1 * (1 - e2)) * (0.35 + 0.65 * s.assemble) * (1 - ho));
    gl.uniform1f(this.locs.uFade, ho);
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
    gl.uniformMatrix4fv(this.locs.uProj, false, perspective(FOV, aspect, 0.1, 40));
    // La escena no gira: ni con el puntero ni sola.
    gl.uniformMatrix4fv(this.locs.uView, false, view(0, 0, CAMERA_Z, cy));
    gl.uniform1f(this.locs.uTime, s.time);
    gl.uniform1f(this.locs.uMotion, s.motion ? 1 : 0);
    gl.uniform1f(this.locs.uAssemble, s.assemble);
    gl.uniform1f(this.locs.uMorph1, s.morph1);
    gl.uniform1f(this.locs.uMorph2, s.morph2);
    gl.uniform1f(this.locs.uHandoff, s.handoff);
    gl.uniform4f(this.locs.uTreeX, ...L.tree);
    gl.uniform4f(this.locs.uRootsX, ...L.roots);
    gl.uniform4f(this.locs.uFinalX, ...L.final);
    gl.uniform3fv(this.locs.uTrail, this.updateTrail(s.pointer.x * HALF_H * aspect, s.pointer.y * HALF_H, s.energy, s.time));
    gl.uniform1f(this.locs.uGlowR, GLOW.radius);
    // Puntos algo más gruesos en pantallas pequeñas (hay menos partículas).
    const small = this.canvas.clientWidth < 640;
    gl.uniform1f(this.locs.uPoint, POINT_SIZE * dpr * (small ? 1.25 : 1));
    gl.uniform1f(this.locs.uCamZ, CAMERA_Z);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // Primero un resplandor: un tercio de los puntos, grandes y muy tenues
    // (hace de «bloom» sin pasadas de desenfoque). En pantallas pequeñas no
    // compensa.
    const gain = 1 - 0.38 * (s.dim ?? 0);
    if (!small) {
      gl.uniform1f(this.locs.uSizeMul, 3.6);
      gl.uniform1f(this.locs.uGain, 0.17 * gain);
      gl.drawArrays(gl.POINTS, this.shapes.glow.first, this.shapes.glow.count);
    }
    gl.uniform1f(this.locs.uSizeMul, 1);
    gl.uniform1f(this.locs.uGain, 1.45 * gain);
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

  draw(s?: TreeState) {
    const { width: w, height: h } = this.canvas;
    const ctx = this.ctx;
    ctx.fillStyle = "#0b0d26";
    ctx.fillRect(0, 0, w, h);
    const img = this.img;
    if (img.complete && img.naturalWidth) {
      const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * k;
      const ih = img.naturalHeight * k;
      ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    }
    // Paso a la sección siguiente: se funde en la noche de la página.
    if (s && s.handoff > 0) {
      ctx.globalAlpha = Math.min(1, s.handoff * 1.25);
      ctx.fillStyle = "#13163b";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  dispose() {}
}
