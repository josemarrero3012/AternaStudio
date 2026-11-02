// Dibuja un fotograma del recorrido con paralaje de profundidad (WebGL 1):
// el mapa de profundidad (blanco = cerca) desplaza la imagen según el
// puntero. Si no hay WebGL, CanvasFrameRenderer dibuja el fotograma sin
// paralaje.

import { DEPTH_STRENGTH, FRAME_ASPECT } from "./config";
import type { Frame } from "./sequence";

const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uPointer;
uniform vec2 uStrength;
uniform vec2 uCoverScale;
varying vec2 vUv;
void main() {
  vec2 uv = (vUv - 0.5) * uCoverScale + 0.5;
  float depth = texture2D(uDepth, uv).r;
  vec2 displaced = uv + uPointer * uStrength * (depth - 0.5) * 2.0;
  displaced = clamp(displaced, vec2(0.008), vec2(0.992));
  gl_FragColor = texture2D(uColor, displaced);
}
`;

export interface FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  /** Ajusta el búfer al tamaño CSS × min(dpr, 2). Devuelve false si no tiene tamaño. */
  resize(): boolean;
  draw(frame: Frame, index: number, pointer: { x: number; y: number }): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("WebGL: no se pudo crear el shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`WebGL: ${log}`);
  }
  return sh;
}

export function createProgram(gl: WebGLRenderingContext, vert: string, frag: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!prog) throw new Error("WebGL: no se pudo crear el programa");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`WebGL: ${log}`);
  }
  return prog;
}

/** Dos triángulos que cubren la pantalla. */
export function fullscreenQuad(gl: WebGLRenderingContext, prog: WebGLProgram) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPosition");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return buf;
}

export function sizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (!w || !h) return false;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return true;
}

function coverScale(w: number, h: number): [number, number] {
  const view = w / h;
  return view > FRAME_ASPECT ? [1, FRAME_ASPECT / view] : [view / FRAME_ASPECT, 1];
}

export class DepthRenderer implements FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram | null = null;
  private buf: WebGLBuffer | null = null;
  private tex: (WebGLTexture | null)[] = [null, null];
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private uploaded = -1;
  private lost = false;
  private onLost: (e: Event) => void;
  private onRestored: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // preserveDrawingBuffer: el vidrio copia este lienzo en cada fotograma.
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
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
    this.prog = createProgram(gl, VERT, FRAG);
    gl.useProgram(this.prog);
    this.buf = fullscreenQuad(gl, this.prog);
    for (const name of ["uColor", "uDepth", "uPointer", "uStrength", "uCoverScale"]) this.loc[name] = gl.getUniformLocation(this.prog, name);
    gl.uniform1i(this.loc.uColor, 0);
    gl.uniform1i(this.loc.uDepth, 1);
    gl.uniform2f(this.loc.uStrength, DEPTH_STRENGTH.x, DEPTH_STRENGTH.y);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.tex = [0, 1].map((unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    });
    this.uploaded = -1;
  }

  resize() {
    return sizeCanvas(this.canvas);
  }

  draw(frame: Frame, index: number, pointer: { x: number; y: number }) {
    const gl = this.gl;
    if (this.lost || gl.isContextLost()) return;
    if (this.uploaded !== index) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, frame.color);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, frame.depth);
      this.uploaded = index;
    }
    const { width: w, height: h } = this.canvas;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(this.loc.uCoverScale, ...coverScale(w, h));
    gl.uniform2f(this.loc.uPointer, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    if (!gl.isContextLost()) {
      this.tex.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(this.buf);
      gl.deleteProgram(this.prog);
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** Sin WebGL: el fotograma, a pantalla completa y sin paralaje. */
export class CanvasFrameRenderer implements FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Sin canvas 2D");
    this.ctx = ctx;
  }

  resize() {
    return sizeCanvas(this.canvas);
  }

  draw(frame: Frame) {
    const { width: w, height: h } = this.canvas;
    const [sx, sy] = coverScale(w, h);
    const iw = frame.color.naturalWidth;
    const ih = frame.color.naturalHeight;
    const cw = iw * sx;
    const ch = ih * sy;
    this.ctx.drawImage(frame.color, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, w, h);
  }

  dispose() {}
}
