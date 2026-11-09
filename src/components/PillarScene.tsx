"use client";

// Escena de partículas de una tarjeta de «01 — Estudio»: la frase de la
// tarjeta contada en tres formas (src/lib/pillars/renderer.ts), en un bucle
// lento A → B → C → A (LOOP). Todas las tarjetas comparten el reloj, que
// arranca al ver la primera, así que cambian a la vez. No reacciona al puntero ni al scroll:
// fuera de pantalla solo deja de pintarse. Debajo, tres filetes y una frase
// dicen qué se está viendo en cada paso.
//
// Mientras cargan los puntos (y sin JavaScript) se ve el icono SVG; si no hay
// WebGL o fallan los puntos, el icono de luz en vídeo (PillarArt). Con
// movimiento reducido, la forma final quieta.

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { loadPillar, loopMorph, PillarRenderer } from "@/lib/pillars/renderer";
import { PILLAR_GLYPHS } from "./glyphs";
import { PillarArt } from "./PillarArt";
import { Trace } from "./Trace";

/** Arranque del bucle: la primera vez que se ve una escena, A. Compartido. */
let loopStart: number | null = null;

export function PillarScene({ index, steps }: { index: number; steps: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(2);
  const n = index + 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let renderer: PillarRenderer | null = null;
    let raf = 0;
    let visible = false;
    const still = prefersReducedMotion();
    let shown = -1;

    const fit = () => {
      if (!renderer) return;
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(Math.round(box.width * dpr), Math.round(box.height * dpr), dpr * (box.width / 440));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || disposed) return;
      // Un solo reloj para todas las tarjetas, que empieza en A cuando se ve
      // la primera.
      loopStart ??= now;
      const time = (now - loopStart) / 1000;
      const morph = still ? 2 : loopMorph(time);
      renderer.render({ morph, time: still ? 0 : time });

      const s = morph < 0.5 || morph >= 2.5 ? 0 : morph < 1.5 ? 1 : 2;
      if (s !== shown) {
        shown = s;
        setStep(s);
      }
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
      <p className="pillar-scene__step" aria-hidden="true">
        <span className="pillar-scene__dots">
          {steps.map((_, i) => (
            <span key={i} className="pillar-scene__dot" data-on={i === step ? "" : undefined} />
          ))}
        </span>
        <span className="pillar-scene__label" key={step}>
          {steps[step]}
        </span>
      </p>
    </div>
  );
}
