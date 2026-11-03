// ?recorrido=debug: una capa pequeña con lo que hace el recorrido (fps, familia,
// resoluciones, fotograma y nivel que se ven, MB descargados, decodificados y
// en texturas). Sirve para medir en pantallas de verdad.

import type { FrameRenderer } from "./layeredRenderer";
import type { Sequence } from "./sequence";

const MB = (b: number) => (b / 2 ** 20).toFixed(1);

export function mountDebug(get: () => { seq: Sequence | null; renderer: FrameRenderer | null }) {
  const el = document.createElement("pre");
  Object.assign(el.style, {
    position: "fixed",
    left: "8px",
    bottom: "8px",
    zIndex: "9999",
    margin: "0",
    padding: "8px 10px",
    font: "11px/1.4 ui-monospace, monospace",
    color: "#e8e9ff",
    background: "rgba(10, 12, 40, 0.82)",
    borderRadius: "6px",
    pointerEvents: "none",
    whiteSpace: "pre",
  });
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  let frames = 0;
  let fps = 0;
  let since = performance.now();
  let shown = "—";
  const timer = window.setInterval(() => {
    const { seq, renderer } = get();
    const s = seq?.stats();
    const p = seq?.plan;
    const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
    el.textContent = [
      `fps ${fps.toFixed(0)} · ${p ? `${p.family} ligera ${p.light} · HD ${p.hd ?? "—"}${p.mips ? " · mipmaps" : ""}` : "cargando"}`,
      `fotograma ${shown}`,
      s ? `descargado ${MB(s.bytesLoaded)} MB · listos ${s.light} ligeros, ${s.hd} HD` : "",
      s ? `decodificado ${MB(s.decodedBytes)} MB · texturas ${MB(renderer?.stats().textureBytes ?? 0)} MB` : "",
      heap ? `JS ${MB(heap)} MB · scroll ${s?.speed.toFixed(1) ?? 0} fot/s` : `scroll ${s?.speed.toFixed(1) ?? 0} fot/s`,
    ]
      .filter(Boolean)
      .join("\n");
  }, 500);
  return {
    frame(now: number) {
      frames++;
      if (now - since >= 1000) {
        fps = (frames * 1000) / (now - since);
        frames = 0;
        since = now;
      }
    },
    shown(index: number, level: number) {
      shown = `${index} (${level ? "HD" : "ligera"})`;
    },
    dispose() {
      window.clearInterval(timer);
      el.remove();
    },
  };
}
