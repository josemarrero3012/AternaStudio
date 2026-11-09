"use client";

// Escena de partículas de una tarjeta de «01 — Estudio»: la frase de la
// tarjeta contada en tres formas (src/lib/pillars/renderer.ts). Con el scroll
// pasa de A a C a medida que la tarjeta sube hacia el centro; al entrar con
// el puntero, la escena se inclina para enseñar el volumen, vuelve a contar
// la historia desde A y el nodo late. Debajo, una línea dice qué se está
// viendo en cada paso.
//
// Mientras cargan los puntos (y sin JavaScript) se ve el icono SVG; si no hay
// WebGL o fallan los puntos, el icono de luz en vídeo (PillarArt). Con
// movimiento reducido, la forma final quieta.

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { loadPillar, PillarRenderer } from "@/lib/pillars/renderer";
import { PILLAR_GLYPHS } from "./glyphs";
import { PillarArt } from "./PillarArt";
import { Trace } from "./Trace";

/** Tramo del scroll (centro de la escena, en altos de pantalla): de A a C. */
const FROM = 0.95;
const TO = 0.5;
/** Duración de la historia al entrar con el puntero (s). */
const REPLAY = 3.6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
/** Progreso 0–1 → estado 0–2, con pausas en A, B y C para poder leerlos. */
function holdSteps(p: number) {
  if (p < 0.12) return 0;
  if (p < 0.45) return smooth((p - 0.12) / 0.33);
  if (p < 0.58) return 1;
  if (p < 0.9) return 1 + smooth((p - 0.58) / 0.32);
  return 2;
}

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
    const card = canvas.closest<HTMLElement>(".pillar") ?? canvas;

    // Estado animado.
    let morph = still ? 2 : 0;
    let spin = 0;
    let pulse = 0;
    let tilt: [number, number] = [0, 0];
    let aim: [number, number] = [0, 0];
    let hover = false;
    let replayAt = -1;
    let shown = -1;
    let last = performance.now();
    const t0 = last;

    const fit = () => {
      if (!renderer) return;
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(Math.round(box.width * dpr), Math.round(box.height * dpr), dpr * (box.width / 440));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = (now - t0) / 1000;

      let target = 2;
      if (!still) {
        const box = canvas.getBoundingClientRect();
        const center = (box.top + box.height / 2) / window.innerHeight;
        target = holdSteps(clamp01((FROM - center) / (FROM - TO)));
        if (replayAt >= 0) {
          const r = (time - replayAt) / REPLAY;
          if (r >= 1) replayAt = -1;
          else target = Math.min(target, holdSteps(r));
        }
        morph += (target - morph) * (1 - Math.exp(-dt * 5));
        const k = 1 - Math.exp(-dt * 4);
        tilt = [tilt[0] + (aim[0] - tilt[0]) * k, tilt[1] + (aim[1] - tilt[1]) * k];
        pulse += ((hover ? 1 : 0.35) - pulse) * k;
        spin += dt * (hover ? 1.6 : 0.5);
      }
      renderer.render({ morph, time: still ? 0 : time, spin, pulse: still ? 0 : pulse, tilt });

      const s = morph < 0.5 ? 0 : morph < 1.5 ? 1 : 2;
      if (s !== shown) {
        shown = s;
        setStep(s);
      }
      if (!still && visible) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && renderer) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = card.getBoundingClientRect();
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      const y = ((e.clientY - box.top) / box.height) * 2 - 1;
      aim = [x * 0.35, y * 0.22];
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hover = true;
      replayAt = (performance.now() - t0) / 1000;
    };
    const onLeave = () => {
      hover = false;
      aim = [0, 0];
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
    if (!still) {
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointerleave", onLeave);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      near.disconnect();
      view.disconnect();
      ro.disconnect();
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
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
            <span key={i} className="pillar-scene__dot" data-on={i <= step ? "" : undefined} />
          ))}
        </span>
        <span className="pillar-scene__label" key={step}>
          {steps[step]}
        </span>
      </p>
    </div>
  );
}
