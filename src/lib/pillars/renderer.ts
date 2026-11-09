// Escenas de partículas de las tarjetas de «01 — Estudio» (PillarScene.tsx).
// La misma técnica que el árbol de la portada (src/lib/tree), en pequeño:
// unas 7.000 partículas con un sitio en cada una de tres formas (A, B y C) y
// el shader las lleva de una a otra. Las formas de la primera las modeló
// Blender y las de las otras dos se dibujan con trazos; todas salen de
// scripts/estudio-v2/pillar-N/build.py como nubes de puntos:
//
//   state-{a,b,c}.bin  N × (x, y, z) int16 LE; coord = q / 32767 × escala
//   attr.bin           N × (tono, tamaño, tipo, grupo) uint8
//
// La cámara de Blender es ortográfica, 2,18 unidades de ancho en 12:5, y aquí
// también: la escena se ve de frente y no reacciona al puntero. Solo se mueve
// el bucle A → B → C → A (ver LOOP).

import { withBase } from "@/lib/base";

/** Tarjetas con escena (índice en studioHome.pillars). Las demás, vídeo. */
export const PILLAR_SCENES = new Set([0, 1, 2]);

/**
 * Cómo se pinta cada tarjeta. hueA: en A los grupos 0/2 van en azul y 1/3 en
 * violeta (los dos oficios de la tarjeta 1; README de Blender). dimA: brillo
 * en A, que sube hasta 1 en C (lo encerrado y la cola, apagados).
 */
const LOOKS: Record<number, { hueA: number; dimA: number }> = {
  1: { hueA: 1, dimA: 0.85 },
  2: { hueA: 0, dimA: 0.5 },
  3: { hueA: 0, dimA: 0.55 },
};

const dir = (n: number) => withBase(`/estudio/v2/pillar-${n}`);
/** Semiancho y semialto de la cámara de Blender. */
const HALF_W = 1.09;
const HALF_H = (HALF_W * 5) / 12;

export type PillarData = {
  count: number;
  scales: [number, number, number];
  a: Int16Array;
  b: Int16Array;
  c: Int16Array;
  attr: Uint8Array;
  look: { hueA: number; dimA: number };
  /** Centro horizontal de cada forma (sin el polvo), para centrarla en la tarjeta. */
  centers: [number, number, number];
};

/** Centro horizontal de la caja de una forma, sin contar el polvo (tipo 1). */
function centerX(xyz: Int16Array, attr: Uint8Array, scale: number) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < attr.length / 4; i++) {
    if (attr[i * 4 + 2] === 1) continue;
    const x = xyz[i * 3];
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  return lo <= hi ? (((lo + hi) / 2) * scale) / 32767 : 0;
}

export async function loadPillar(n: number): Promise<PillarData> {
  const base = dir(n);
  const get = (f: string) =>
    fetch(`${base}/${f}`).then((r) => {
      if (!r.ok) throw new Error(`${f}: ${r.status}`);
      return r.arrayBuffer();
    });
  const [manifest, a, b, c, attr] = await Promise.all([
    fetch(`${base}/manifest.json`).then((r) => r.json() as Promise<{ count: number; scales: [number, number, number] }>),
    get("state-a.bin"),
    get("state-b.bin"),
    get("state-c.bin"),
    get("attr.bin"),
  ]);
  const [A, B, C, at] = [new Int16Array(a), new Int16Array(b), new Int16Array(c), new Uint8Array(attr)];
  const n3 = manifest.count * 3;
  if (A.length !== n3 || B.length !== n3 || C.length !== n3 || at.length !== manifest.count * 4) {
    throw new Error("Nube de puntos incompleta");
  }
  const sx = manifest.scales[0];
  const centers: [number, number, number] = [centerX(A, at, sx), centerX(B, at, sx), centerX(C, at, sx)];
  return { count: manifest.count, scales: manifest.scales, a: A, b: B, c: C, attr: at, centers, look: LOOKS[n] ?? { hueA: 0, dimA: 1 } };
}

const VERT = `
precision highp float;
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aC;
attribute vec4 aAttr; // tono, tamaño, tipo, grupo (0 a 1)
uniform vec3 uScale;
uniform vec3 uCenter;  // centro horizontal de A, B y C: se centran en la tarjeta
uniform float uMorph;  // 0 = A, 1 = B, 2 = C, 3 = de vuelta en A
uniform float uTime;
uniform float uPx;
uniform vec2 uLook;    // hueA, dimA (LOOKS)     // píxeles de dispositivo por punto de tamaño 1
varying vec3 vColor;
varying float vGain;

const vec3 C0 = vec3(0.294, 0.333, 0.839); // #4b55d6
const vec3 C1 = vec3(0.604, 0.639, 1.0);   // #9aa3ff
const vec3 C2 = vec3(0.604, 0.361, 0.941); // #9a5cf0
const vec3 C3 = vec3(0.843, 0.486, 0.961); // #d77cf5

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  if (t < 1.0) return mix(C0, C1, t);
  if (t < 2.0) return mix(C1, C2, t - 1.0);
  return mix(C2, C3, t - 2.0);
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }

void main() {
  vec3 A = aA * uScale - vec3(uCenter.x, 0.0, 0.0);
  vec3 B = aB * uScale - vec3(uCenter.y, 0.0, 0.0);
  vec3 C = aC * uScale - vec3(uCenter.z, 0.0, 0.0);
  float tone = aAttr.x;
  float size = aAttr.y;
  float kind = floor(aAttr.z * 255.0 + 0.5);
  float group = floor(aAttr.w * 255.0 + 0.5);
  float seed = hash(A + C * 1.7);

  // Cada tramo avanza como una ola de izquierda a derecha.
  // La ola es suave: cada partícula sale un poco después que la de su
  // izquierda, y el tramo entero dura lo que marque LOOP.
  float m = clamp(uMorph, 0.0, 3.0);
  float t1 = smoother(m * 1.25 - (A.x * 0.5 + 0.5) * 0.25);
  float t2 = smoother((m - 1.0) * 1.25 - (B.x * 0.5 + 0.5) * 0.25);
  float t3 = smoother((m - 2.0) * 1.25 - (C.x * 0.5 + 0.5) * 0.25);

  vec3 p = mix(mix(mix(A, B, t1), C, t2), A, t3);
  // En pleno vuelo se separan apenas, para que se lea que viajan.
  float flight = sin(3.14159 * t1) + sin(3.14159 * t2) + sin(3.14159 * t3);
  p.xy += (vec2(seed, fract(seed * 7.13)) - 0.5) * vec2(0.014, 0.012) * flight;
  // Vida en reposo, casi imperceptible.
  p.xy += vec2(sin(uTime * 0.7 + seed * 40.0), cos(uTime * 0.5 + seed * 25.0)) * 0.0015;

  gl_Position = vec4(p.x / ${HALF_W.toFixed(4)}, p.y / ${HALF_H.toFixed(4)}, 0.0, 1.0);

  // Color: en A cada oficio tiene su tono (diseño azul, código violeta) y
  // hacia C se funden en el degradado de la marca (README de Blender).
  float hueA = tone;
  if (group == 0.0 || group == 2.0) hueA = 0.08 + 0.28 * tone;
  else if (group == 1.0 || group == 3.0) hueA = 0.58 + 0.12 * tone;
  hueA = mix(tone, hueA, uLook.x);
  float k = smoother(m <= 2.0 ? m * 0.5 : 3.0 - m);
  vec3 col = palette(mix(hueA, tone, k));

  // Puntos finos y nítidos: la forma se lee por la densidad, no por el
  // brillo de cada partícula.
  float px = 0.9 + 2.6 * pow(size, 1.6);
  float gain = (0.5 + 0.6 * size) * mix(uLook.y, 1.0, k);
  if (kind == 1.0) { px *= 0.7; gain *= 0.18; }
  if (kind == 2.0) {
    // El nodo (la persona que te atiende) respira mientras se ve C.
    float beat = 1.0 + 0.2 * (0.5 + 0.5 * sin(uTime * 1.6));
    px *= mix(1.0, beat, t2 * (1.0 - t3));
    col = mix(col, vec3(1.0, 0.96, 1.0), 0.45 * size);
    gain *= 1.2;
  }
  gl_PointSize = clamp(px * uPx, 1.0, 40.0);
  vColor = col;
  vGain = gain;
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vGain;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d) * 4.0;
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 4.5) * vGain;
  vec3 c = vColor * a;
  // Premultiplicado, con la opacidad del canal más brillante: la luz se suma
  // al vidrio de la tarjeta y el resto queda transparente.
  gl_FragColor = vec4(c, max(max(c.r, c.g), c.b));
}
`;

/**
 * El bucle, en segundos: pausa en A, viaje a B, pausa en B, viaje a C, pausa
 * en C y vuelta a A. Lo comparten todas las tarjetas y sale del reloj de la
 * página, así que van coordinadas: cambian a la vez.
 */
export const LOOP = { holdA: 2.5, toB: 3.5, holdB: 2.5, toC: 3.5, holdC: 3.5, toA: 3.5 };
const LOOP_LEN = Object.values(LOOP).reduce((a, b) => a + b, 0);

const ease = (x: number) => x * x * (3 - 2 * x);

/** Estado (0 = A, 1 = B, 2 = C, 3 = A otra vez) en el segundo t del reloj. */
export function loopMorph(t: number) {
  let r = ((t % LOOP_LEN) + LOOP_LEN) % LOOP_LEN;
  const steps: [number, number, number][] = [
    [LOOP.holdA, 0, 0],
    [LOOP.toB, 0, 1],
    [LOOP.holdB, 1, 1],
    [LOOP.toC, 1, 2],
    [LOOP.holdC, 2, 2],
    [LOOP.toA, 2, 3],
  ];
  for (const [d, from, to] of steps) {
    if (r < d) return from + (to - from) * ease(r / d);
    r -= d;
  }
  return 0;
}

export type FrameState = { morph: number; time: number };

export class PillarRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffers: WebGLBuffer[] = [];
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private count: number;

  static create(canvas: HTMLCanvasElement, data: PillarData) {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!gl) return null;
    try {
      return new PillarRenderer(gl, data);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext, data: PillarData) {
    this.gl = gl;
    this.count = data.count;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "program");
    gl.useProgram(program);
    this.program = program;

    const attrib = (name: string, array: ArrayBufferView, size: number, type: number) => {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
      const l = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, type, true, 0, 0);
      this.buffers.push(buf);
    };
    attrib("aA", data.a, 3, gl.SHORT);
    attrib("aB", data.b, 3, gl.SHORT);
    attrib("aC", data.c, 3, gl.SHORT);
    attrib("aAttr", data.attr, 4, gl.UNSIGNED_BYTE);

    for (const u of ["uScale", "uCenter", "uMorph", "uTime", "uPx", "uLook"]) this.loc[u] = gl.getUniformLocation(program, u);
    gl.uniform3f(this.loc.uScale, ...data.scales);
    gl.uniform3f(this.loc.uCenter, ...data.centers);
    gl.uniform2f(this.loc.uLook, data.look.hueA, data.look.dimA);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // la luz se suma
    gl.clearColor(0, 0, 0, 0);
  }

  /** Tamaño del lienzo en píxeles de dispositivo; px = escala del tamaño de punto. */
  resize(width: number, height: number, px: number) {
    const { gl } = this;
    gl.canvas.width = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform1f(this.loc.uPx, px);
  }

  render(s: FrameState) {
    const { gl, loc } = this;
    gl.uniform1f(loc.uMorph, s.morph);
    gl.uniform1f(loc.uTime, s.time);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  dispose() {
    const { gl } = this;
    this.buffers.forEach((b) => gl.deleteBuffer(b));
    gl.deleteProgram(this.program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
