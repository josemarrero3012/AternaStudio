"use client";

// Iconos de los tres compromisos de la portada («01 — Estudio»), hechos en
// Blender (scripts/estudio/): las mismas hebras, nodos y bucles que
// PILLAR_GLYPHS, pero de luz, con volumen y halo.
//
// Los vídeos vienen con fondo negro y sin canal alfa (Safari no lee el alfa
// de un WebM). Para que solo se vea la luz sobre el vidrio de la tarjeta, un
// canvas WebGL pinta cada fotograma con opacidad = canal más brillante: el
// negro queda transparente y el halo se suma al fondo, como en el render. Un
// mix-blend-mode no sirve: la tarjeta de vidrio aísla la mezcla y el negro se
// vería como un recuadro.
//
// El póster (fotograma con el nodo encendido) se pinta igual mientras carga
// el vídeo y es lo único que se ve con movimiento reducido. El vídeo se
// descarga al acercarse a la pantalla y se pausa fuera de ella. Sin WebGL, o
// antes de que cargue el script, queda el icono SVG de siempre.

import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/base";
import { prefersReducedMotion } from "@/lib/motion";
import { PILLAR_GLYPHS } from "./glyphs";
import { Trace } from "./Trace";

/** Si se vuelven a renderizar, nueva carpeta (el .htaccess cachea un año). */
const DIR = "/estudio/v1";
/** Tamaño del render (960 × 400). */
const W = 960;
const H = 400;

const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Salida premultiplicada: el color es el del vídeo tal cual y la opacidad, su
// canal más brillante. Sobre el fondo queda color + fondo × (1 − opacidad):
// la luz se suma y solo tapa algo de fondo bajo las hebras más brillantes.
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uFrame;
void main() {
  vec3 c = texture2D(uFrame, vUv).rgb;
  gl_FragColor = vec4(c, max(max(c.r, c.g), c.b));
}
`;

type Painter = { draw: (src: TexImageSource) => void; dispose: () => void };

function createPainter(canvas: HTMLCanvasElement): Painter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);

  return {
    draw(src) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export function PillarArt({ index }: { index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Hasta comprobar que hay WebGL, el SVG (también sin JavaScript).
  const [gl, setGl] = useState(false);
  const n = index + 1;

  useEffect(() => {
    if (document.createElement("canvas").getContext("webgl")) setGl(true);
  }, []);

  useEffect(() => {
    if (!gl) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    // Resolución según la pantalla, sin pasar de la del render.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.min(W, Math.round(canvas.getBoundingClientRect().width * dpr)) || W;
    canvas.height = Math.round((canvas.width * H) / W);
    const painter = createPainter(canvas);
    if (!painter) {
      setGl(false);
      return;
    }

    let disposed = false;
    let playing = false;
    const poster = new Image();
    poster.onload = () => {
      if (!disposed && !playing) painter.draw(poster);
    };
    poster.src = withBase(`${DIR}/pillar-${n}.webp`);

    if (prefersReducedMotion()) {
      return () => {
        disposed = true;
        painter.dispose();
      };
    }

    // Cada fotograma nuevo del vídeo se pinta. requestVideoFrameCallback
    // avisa solo cuando lo hay; donde no existe, cada frame de pantalla.
    type RVFC = (cb: () => void) => number;
    const rvfc = (video as HTMLVideoElement & { requestVideoFrameCallback?: RVFC }).requestVideoFrameCallback?.bind(video);
    let raf = 0;
    const tick = () => {
      if (disposed || !playing) return;
      if (video.readyState >= 2) painter.draw(video);
      if (rvfc) rvfc(tick);
      else raf = requestAnimationFrame(tick);
    };
    const onPlaying = () => {
      if (playing) return;
      playing = true;
      tick();
    };
    const onPause = () => {
      playing = false;
      cancelAnimationFrame(raf);
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    // Cerca de la pantalla: empieza a cargar. En pantalla: corre; fuera, se
    // pausa. load() cancela un play() pendiente, así que el play va después.
    let loaded = false;
    let visible = false;
    const play = () => {
      if (loaded && visible) video.play().catch(() => {});
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        video.preload = "auto";
        video.load();
        loaded = true;
        play();
      },
      { rootMargin: "50% 0px" },
    );
    const view = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) play();
      else video.pause();
    });
    near.observe(canvas);
    view.observe(canvas);

    return () => {
      disposed = true;
      near.disconnect();
      view.disconnect();
      cancelAnimationFrame(raf);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.pause();
      painter.dispose();
    };
  }, [gl, n]);

  if (!gl) return PILLAR_GLYPHS[index] ? <Trace drawing={PILLAR_GLYPHS[index]} size="lg" /> : null;

  return (
    <div className="pillar__art" aria-hidden="true">
      <canvas ref={canvasRef} className="pillar__canvas" />
      <video ref={videoRef} className="pillar__video" muted loop playsInline preload="none" tabIndex={-1} disablePictureInPicture>
        <source src={withBase(`${DIR}/pillar-${n}.webm`)} type="video/webm" />
        <source src={withBase(`${DIR}/pillar-${n}.mp4`)} type="video/mp4" />
      </video>
    </div>
  );
}
