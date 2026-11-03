// La pantalla de carga y su salida: un velo noche que se funde desde el
// centro hacia fuera por un borde de ruido, con un filo de luz lavanda y
// orquídea (los colores del vídeo del árbol), WebGL 1.

import { createProgram, fullscreenQuad, sizeCanvas } from "./gl";

const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// La forma del borde y el alcance son los del encargo; cambian los colores:
// el velo es la noche de la web (--night-1, algo más clara en el centro) y
// el filo pasa de lavanda a orquídea con un núcleo casi blanco.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(13.7, 8.4); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / uResolution.y;
  float n = fbm(uv * 3.1 + vec2(uTime * 0.035, -uTime * 0.025));
  float detail = fbm(uv * 8.4 - vec2(uTime * 0.02));
  float field = length(p) + (n - 0.5) * 0.24 + (detail - 0.5) * 0.065;
  // 1.02 a 16:10 y más estrecho; las pantallas más anchas, según la distancia
  // a su esquina (0.9434 es la de 16:10), + 0.06 para que las esquinas más
  // ruidosas también se limpien: con uProgress 1 no queda nada en ninguna.
  float reach = max(1.02, 1.02 * length(vec2(0.5 * uResolution.x / uResolution.y, 0.5)) / 0.9434) + 0.06;
  float threshold = mix(-0.22, reach, uProgress);
  float edge = 0.045;
  float alpha = smoothstep(threshold - edge, threshold + edge, field);
  float rim = 1.0 - smoothstep(0.006, 0.052, abs(field - threshold));
  float coverage = max(alpha, rim * 0.22);
  vec3 night = vec3(24.0, 28.0, 70.0) / 255.0;
  vec3 lift = vec3(38.0, 44.0, 98.0) / 255.0;
  vec3 base = mix(lift, night, smoothstep(0.0, 0.75, length(p)));
  vec3 lavender = vec3(154.0, 163.0, 255.0) / 255.0;
  vec3 orchid = vec3(215.0, 124.0, 245.0) / 255.0;
  vec3 rimColor = mix(lavender, orchid, smoothstep(0.35, 0.65, n));
  rimColor = mix(rimColor, vec3(1.0), rim * rim * 0.55);
  vec3 color = mix(base, rimColor, rim * 0.85);
  gl_FragColor = vec4(color * coverage, coverage);
}
`;

export class BurnRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer | null;
  private uRes: WebGLUniformLocation | null;
  private uProgress: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) throw new Error("Sin WebGL");
    this.gl = gl;
    this.prog = createProgram(gl, VERT, FRAG);
    gl.useProgram(this.prog);
    this.buf = fullscreenQuad(gl, this.prog);
    this.uRes = gl.getUniformLocation(this.prog, "uResolution");
    this.uProgress = gl.getUniformLocation(this.prog, "uProgress");
    this.uTime = gl.getUniformLocation(this.prog, "uTime");
  }

  draw(progress: number) {
    const gl = this.gl;
    if (gl.isContextLost() || !sizeCanvas(this.canvas)) return;
    const { width: w, height: h } = this.canvas;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.uRes, w, h);
    gl.uniform1f(this.uProgress, progress);
    gl.uniform1f(this.uTime, performance.now() / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    if (!gl.isContextLost()) {
      gl.deleteBuffer(this.buf);
      gl.deleteProgram(this.prog);
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
