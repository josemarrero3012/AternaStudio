"use client";

// Dibujo de luz de una tarjeta de «01 — Estudio» (src/lib/pillars/renderer.ts):
// la hélice, las llaves con el código y la órbita, quietos y hechos de
// partículas finas, con un destello violeta que recorre cada trazo y enciende
// el nodo al llegar. Todas las tarjetas comparten el reloj, así que los
// destellos van a la vez. Fuera de pantalla deja de pintarse.
//
// Mientras cargan los puntos (y sin JavaScript) se ve el icono SVG; si no hay
// WebGL o fallan los puntos, el icono de luz en vídeo (PillarArt). Con
// movimiento reducido, el dibujo sin destellos.

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { loadPillar, PillarRenderer, SHOWN } from "@/lib/pillars/renderer";
import { PILLAR_GLYPHS } from "./glyphs";
import { PillarArt } from "./PillarArt";
import { Trace } from "./Trace";

/** Reloj de los destellos, compartido: empieza al ver la primera tarjeta. */
let clockStart: number | null = null;

export function PillarScene({ index }: { index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const n = index + 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let renderer: PillarRenderer | null = null;
    let raf = 0;
    let visible = false;
    const still = prefersReducedMotion();

    const fit = () => {
      if (!renderer) return;
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(Math.round(box.width * dpr), Math.round(box.height * dpr), dpr * (box.width / 440));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || disposed) return;
      clockStart ??= now;
      const time = (now - clockStart) / 1000;
      renderer.render({ morph: SHOWN, time: still ? 0 : time, glint: still ? 0 : 1 });
      if (!still && visible) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && renderer) raf = requestAnimationFrame(frame);
    };

    // Los puntos se piden al acercarse a la pantalla.
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        loadPillar(n)
          .then((data) => {
            if (disposed) return;
            renderer = PillarRenderer.create(canvas, data);
            if (!renderer) throw new Error("Sin WebGL");
            fit();
            setReady(true);
            if (still) requestAnimationFrame(frame);
            else kick();
          })
          .catch(() => !disposed && setFailed(true));
      },
      { rootMargin: "60% 0px" },
    );
    const view = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !still) kick();
    });
    const ro = new ResizeObserver(() => {
      fit();
      if (still) requestAnimationFrame(frame);
    });
    near.observe(canvas);
    view.observe(canvas);
    ro.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      near.disconnect();
      view.disconnect();
      ro.disconnect();
      renderer?.dispose();
    };
  }, [n]);

  if (failed) return <PillarArt index={index} />;

  return (
    <div className="pillar-scene" data-ready={ready ? "" : undefined}>
      <div className="pillar-scene__view">
        <canvas ref={canvasRef} className="pillar-scene__canvas" aria-hidden="true" />
        {ready || !PILLAR_GLYPHS[index] ? null : (
          <div className="pillar-scene__wait">
            <Trace drawing={PILLAR_GLYPHS[index]} size="lg" />
          </div>
        )}
      </div>
    </div>
  );
}
