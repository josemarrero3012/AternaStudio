"use client";

// «No empezamos por el código», como una raíz de luz: el titular queda
// encima de la tierra y debajo crece lo que no se ve. Un nodo enciende la
// línea del suelo y de ella cuelgan raíces que se apagan en la oscuridad;
// tres de ellas acaban en lo que se decide antes del código. En el rail, la
// línea del suelo cruza el hueco y se convierte en el eje de las fases: la
// raíz y el método son la misma línea. Las raíces no están dibujadas: las
// genera lib/roots.ts (haces de fibras, como las raíces del árbol del vídeo)
// y crecen de verdad cuando la sección entra; ya crecidas, de vez en cuando
// baja un destello por alguna fibra. Alrededor, un resplandor de tierra bajo
// el suelo y motas de luz que suben despacio desde las raíces.
//
// Sin movimiento se ve ya crecida y quieta.

import { useEffect, useRef, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";
import { growEaseInverse, type RootSeed, type RootSystem, type Vec } from "@/lib/roots";
import { useRoots, type RootPlanner } from "./useRoots";

/** Lienzo de diseño de 460 × 250: y = 0 es la línea del suelo. */
const W = 460;
const H = 250;

/** Puntas con etiqueta (x, y en el lienzo de diseño). */
const TIPS = [
  { x: 84, y: 226 },
  { x: 288, y: 200 },
  { x: 358, y: 92 },
];

/** Cuánto sobresale el lienzo de las raíces de la caja (fracción de su ancho). */
const OUT = { left: 0.14, right: 0.06, bottom: 0.12 };

/** Motas de luz: dónde nacen (% del lienzo), cuándo y cuánto tardan en subir. */
const MOTES = [
  { x: 6, y: 62, d: 0, dur: 7 },
  { x: 21, y: 78, d: 2.4, dur: 8.5 },
  { x: 33, y: 50, d: 4.1, dur: 6.5 },
  { x: 47, y: 30, d: 1.2, dur: 7.5 },
  { x: 60, y: 70, d: 3.3, dur: 9 },
  { x: 74, y: 44, d: 5.2, dur: 7 },
  { x: 86, y: 26, d: 0.8, dur: 8 },
];

const tip = (i: number): Vec => [TIPS[i].x, TIPS[i].y];

/**
 * La raíz en el lienzo de diseño. La principal nace del nodo y baja hasta
 * «Qué hay»; otras dos, de la línea del suelo, acaban en las otras dos
 * etiquetas. Cada una empieza cuando la línea del suelo llega a su sitio.
 */
const BASE: RootSeed[] = [
  { at: [0, 0], angle: 80, strands: 12, length: 250, to: tip(0) },
  { at: [0, 0], angle: 114, strands: 5, length: 120, depth: 0.7, offset: 10 },
  { at: [120, 0], angle: 96, strands: 5, length: 170, depth: 0.2, open: 0.4 },
  { at: [252, 0], angle: 84, strands: 8, length: 220, to: tip(1), open: 0.35 },
  { at: [372, 0], angle: 96, strands: 5, length: 100, to: tip(2), open: 0.35 },
  { at: [190, 0], angle: 92, strands: 3, length: 70, depth: 0.65, open: 0.4 },
  { at: [432, 0], angle: 80, strands: 3, length: 52, depth: 0.6, open: 0.4 },
  // Raicillas sueltas del suelo, cortas y tenues.
  ...[64, 168, 318, 410].map((x, i): RootSeed => ({ at: [x, 0], angle: 90 + ((i * 41) % 31) - 15, strands: 1, length: 14 + ((i * 13) % 20), depth: 0.55 })),
];
const SEEDS = BASE.map((s): RootSeed => ({ ...s, offset: (s.offset ?? 0) + s.at[0] * 0.45 }));

const plan: RootPlanner = ({ w }) => {
  const box = w / (1 + OUT.left + OUT.right);
  const s = box / W;
  const ox = OUT.left * box;
  const at = ([x, y]: Vec): Vec => [ox + x * s, y * s];
  return {
    field: {
      seed: 7,
      scale: Math.max(0.6, s),
      walls: [0, w],
      seeds: SEEDS.map((seed) => ({
        ...seed,
        at: at(seed.at),
        to: seed.to ? at(seed.to) : undefined,
        length: seed.length * s,
        offset: (seed.offset ?? 0) * s,
      })),
    },
    ink: { fade: H * s },
    sparks: "down",
  };
};

/** Las etiquetas aparecen cuando su raíz llega a la punta. */
const onGrow = (sys: RootSystem, host: HTMLElement, duration: number) => {
  const art = host.parentElement;
  if (!art) return;
  const box = host.offsetWidth / (1 + OUT.left + OUT.right);
  const s = box / W;
  sys.strands.forEach((st) => {
    const end = st.tip;
    if (!end) return;
    const i = TIPS.findIndex((p) => Math.hypot(OUT.left * box + p.x * s - end[0], p.y * s - end[1]) < 1);
    if (i >= 0) art.style.setProperty(`--tip-${i}`, `${(duration * growEaseInverse(st.c1 / sys.reach)).toFixed(2)}s`);
  });
};

export function MethodRoot({ variant }: { variant: "rail" | "static" }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const roots = useRef<HTMLSpanElement>(null);
  useRoots(roots, { plan, trigger: "lit", duration: 2.6, onGrow });

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.anim = "";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.in = "";
        // Las raíces (useRoots) crecen cuando su caja lleva data-lit.
        if (art.current) art.current.dataset.lit = "true";
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="root" data-variant={variant} ref={ref} aria-hidden="true">
      {/* El suelo: nace en el nodo y, en el rail, sigue hasta el eje. */}
      <span className="root__ground" />
      <span className="root__seed" />
      {/* La caja de 460 × 250: raíces, nodos de las puntas y etiquetas
          comparten medidas (antes las etiquetas iban por la altura de la
          sección y en el rail quedaban 40 px por debajo de su punta). */}
      <div className="root__art" ref={art}>
        <span className="root__roots" ref={roots}>
          <canvas className="root__layer root__layer--back" data-layer="back" />
          <canvas className="root__layer root__layer--glow" data-layer="glow" />
          <canvas className="root__layer root__layer--front" data-layer="front" />
          <canvas className="root__layer root__layer--spark" data-layer="spark" />
        </span>
        <svg className="root__svg" viewBox={`0 0 ${W} ${H}`} focusable="false">
          {TIPS.map((p, i) => (
            <circle key={i} className="root__tip" cx={p.x} cy={p.y} r={2.4} style={{ "--d": `var(--tip-${i}, ${1.6 + i * 0.15}s)` } as CSSProperties} />
          ))}
        </svg>
        {/* Las etiquetas, en HTML para que el texto se lea nítido a cualquier tamaño. */}
        {t.approach.root.map((label, i) => (
          <span
            key={i}
            className="t-label root__label"
            style={{ left: `${(TIPS[i].x / W) * 100}%`, top: `${(TIPS[i].y / H) * 100}%`, "--d": `calc(var(--tip-${i}, ${1.6 + i * 0.15}s) + 0.15s)` } as CSSProperties}
          >
            {label}
          </span>
        ))}
      </div>
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="root__mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, "--d": `${m.d}s`, "--dur": `${m.dur}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
