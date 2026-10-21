"use client";

// Raicillas de luz: el mismo vocabulario que la raíz del método (MethodRoot)
// —filamento que se dibuja, raicillas más tenues, un nodo en la punta—, en
// piezas pequeñas que cuelgan de las líneas que ya hay en la web: el eje del
// método (rail y línea vertical de móvil) y el horizonte del pie. Pocas y
// finas, para que acompañen sin llenar.
//
// Cómo se encienden: con movimiento, la pieza lleva data-anim y espera
// apagada. Las del método se dibujan cuando su fase se enciende (data-lit
// en el padre, lo pone la luz del eje); las demás, al entrar en pantalla
// (data-in). Sin movimiento o sin JavaScript se ven ya dibujadas.

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Strand = { d: string; delay: number; faint?: boolean };
type Shape = {
  /** viewBox; el origen (0, 0) es el punto de la línea del que cuelga. */
  box: [number, number, number, number];
  strands: Strand[];
  tips?: { x: number; y: number; delay: number }[];
  /**
   * true: cubre todo el ancho de su caja sin deformarse (el pie): se escala
   * hasta llenarla y se recorta lo que sobra por los lados o por abajo. El
   * trazo mantiene su grosor a cualquier escala.
   */
  cover?: boolean;
};

const SHAPES = {
  // Cuelga del eje, bajo el nodo de una fase (rail, escritorio).
  hang: {
    box: [-34, 0, 104, 170],
    strands: [
      { d: "M0 0 C2 34 22 54 18 96 C15 124 26 144 22 164", delay: 0.05 },
      { d: "M11 54 C30 64 46 84 44 116", delay: 0.4, faint: true },
      { d: "M18 98 C6 110 2 126 6 142", delay: 0.65, faint: true },
      { d: "M0 0 C-2 20 -16 34 -14 60", delay: 0.25, faint: true },
    ],
    tips: [
      { x: 22, y: 164, delay: 1 },
      { x: 44, y: 116, delay: 1.1 },
    ],
  },
  // Sale de la línea vertical hacia el hueco entre fases (móvil).
  side: {
    box: [-4, 0, 52, 78],
    strands: [
      { d: "M0 0 C10 6 22 16 26 32 C29 46 36 56 40 70", delay: 0.05 },
      { d: "M15 12 C15 26 8 36 10 52", delay: 0.35, faint: true },
    ],
    tips: [{ x: 40, y: 70, delay: 0.9 }],
  },
  // Donde acaba un eje: la línea echa raíces en abanico.
  fan: {
    box: [-64, 0, 128, 100],
    strands: [
      { d: "M0 0 C0 30 -4 54 0 92", delay: 0.05 },
      { d: "M0 6 C-10 26 -30 42 -40 74", delay: 0.2 },
      { d: "M0 6 C12 24 30 38 44 66", delay: 0.3 },
      { d: "M-21 36 C-32 46 -46 52 -56 64", delay: 0.6, faint: true },
      { d: "M24 32 C27 46 23 58 27 74", delay: 0.7, faint: true },
    ],
    tips: [
      { x: 0, y: 92, delay: 1 },
      { x: -40, y: 74, delay: 1.1 },
      { x: 44, y: 66, delay: 1.2 },
    ],
  },
  // Como el abanico, pero abierto hacia dentro: para una línea pegada al
  // borde de la pantalla (final de la línea vertical, móvil).
  tail: {
    box: [-20, 0, 84, 100],
    strands: [
      { d: "M0 0 C0 30 -2 54 2 92", delay: 0.05 },
      { d: "M0 6 C12 24 30 38 44 66", delay: 0.2 },
      { d: "M0 4 C-6 20 -13 32 -14 52", delay: 0.35, faint: true },
      { d: "M24 32 C27 46 23 58 27 74", delay: 0.6, faint: true },
      { d: "M2 60 C10 68 16 76 16 88", delay: 0.75, faint: true },
    ],
    tips: [
      { x: 2, y: 92, delay: 1 },
      { x: 44, y: 66, delay: 1.1 },
    ],
  },
  // Del filamento del horizonte del pie, sobre todo bajo la luz de la derecha.
  horizon: {
    box: [0, 0, 1000, 120],
    cover: true,
    strands: [
      { d: "M556 0 C558 30 546 52 552 84 C556 104 548 114 550 120", delay: 0.1 },
      { d: "M642 0 C642 22 662 40 658 70 C656 88 666 100 664 112", delay: 0.3 },
      { d: "M724 0 C726 26 712 46 716 70", delay: 0.5 },
      { d: "M806 0 C804 18 818 34 814 56 C812 70 820 82 818 96", delay: 0.4 },
      { d: "M884 0 C886 14 876 26 880 44", delay: 0.7, faint: true },
      { d: "M552 44 C570 56 580 70 576 90", delay: 0.8, faint: true },
      { d: "M660 46 C676 58 684 70 682 86", delay: 0.9, faint: true },
      { d: "M714 34 C702 46 696 58 700 74", delay: 0.95, faint: true },
      { d: "M420 0 C421 18 412 30 416 50", delay: 0.6, faint: true },
      { d: "M292 0 C292 12 298 22 296 36", delay: 0.85, faint: true },
      { d: "M944 0 C944 12 952 20 950 34", delay: 1, faint: true },
    ],
    // Sin puntas: el pie las apaga con la máscara antes de llegar.
  },
} satisfies Record<string, Shape>;

export type RootletShape = keyof typeof SHAPES;

export function Rootlets({
  shape,
  className,
  trigger = "view",
}: {
  shape: RootletShape;
  className?: string;
  /** "view": se dibuja al entrar en pantalla. "lit": cuando el padre lleva data-lit="true". */
  trigger?: "view" | "lit";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = `rl${useId().replace(/[^\w-]/g, "")}`;
  const s: Shape = SHAPES[shape];
  const [x, y, w, h] = s.box;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.anim = "";
    if (trigger !== "view") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.in = "";
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  return (
    <span ref={ref} className={`rootlets${className ? ` ${className}` : ""}`} data-shape={shape} aria-hidden="true">
      <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio={s.cover ? "xMidYMin slice" : undefined} focusable="false">
        <defs>
          <linearGradient id={id} x1="0" y1={y} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--orchid)" />
            <stop offset="0.5" stopColor="var(--violet)" stopOpacity="0.65" />
            <stop offset="1" stopColor="var(--indigo)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {s.strands.map((r, i) => (
          <path
            key={i}
            className={`rootlets__line${r.faint ? " rootlets__line--faint" : ""}`}
            d={r.d}
            pathLength={1}
            stroke={`url(#${id})`}
            vectorEffect={s.cover ? "non-scaling-stroke" : undefined}
            style={{ "--d": `${r.delay}s` } as CSSProperties}
          />
        ))}
        {s.tips?.map((p, i) => (
          <circle key={i} className="rootlets__tip" cx={p.x} cy={p.y} r={2.2} style={{ "--d": `${p.delay}s` } as CSSProperties} />
        ))}
      </svg>
    </span>
  );
}
