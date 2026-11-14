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
import { rootBranch, rootPath, type RootCurve } from "@/lib/root-curves";

type Strand = { d: string; delay: number; faint?: boolean; tip?: boolean };
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

// Los tramos consecutivos comparten punto y tangente; las ramas se calculan
// sobre ellos para que nunca queden separadas ni atraviesen la raíz madre.
const HANG: RootCurve[] = [
  [[0, 0], [2, 34], [22, 54], [18, 96]],
  [[18, 96], [14, 138], [26, 144], [22, 164]],
];
const SIDE: RootCurve[] = [
  [[0, 0], [0, 12], [22, 16], [26, 32]],
  [[26, 32], [30, 48], [36, 56], [40, 70]],
];
const FAN: RootCurve = [[0, 0], [10, 24], [-10, 58], [0, 92]];
const FAN_LEFT = rootBranch(FAN, 0.22, 12, [-32, 44], [-40, 74]);
const FAN_RIGHT = rootBranch(FAN, 0.42, 12, [36, 48], [44, 66]);
const TAIL: RootCurve = [[0, 0], [0, 30], [-2, 54], [2, 92]];
const TAIL_RIGHT = rootBranch(TAIL, 0.08, 18, [30, 38], [44, 66]);
const HORIZON: RootCurve[][] = [
  [[[556, 0], [558, 30], [546, 52], [552, 84]], [[552, 84], [555, 100], [548, 114], [550, 120]]],
  [[[642, 0], [642, 22], [662, 40], [658, 70]], [[658, 70], [656, 85], [666, 100], [664, 112]]],
  [[[724, 0], [726, 26], [712, 46], [716, 70]]],
  [[[806, 0], [804, 18], [818, 34], [814, 56]], [[814, 56], [812, 67], [820, 82], [818, 96]]],
];

const SHAPES = {
  // Cuelga del eje, bajo el nodo de una fase (rail, escritorio).
  hang: {
    box: [-34, 0, 104, 170],
    strands: [
      { d: rootPath(...HANG), delay: 0.05, tip: true },
      { d: rootPath(rootBranch(HANG[0], 0.6, 18, [46, 84], [44, 116])), delay: 0.4, faint: true, tip: true },
      { d: rootPath(rootBranch(HANG[1], 0, 14, [2, 126], [6, 142])), delay: 0.65, faint: true },
      { d: rootPath(rootBranch(HANG[0], 0, 18, [-16, 34], [-14, 60])), delay: 0.25, faint: true },
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
      { d: rootPath(...SIDE), delay: 0.05, tip: true },
      { d: rootPath(rootBranch(SIDE[0], 0.55, 10, [8, 36], [10, 52])), delay: 0.35, faint: true },
    ],
    tips: [{ x: 40, y: 70, delay: 0.9 }],
  },
  // Donde acaba un eje: la línea echa raíces en abanico.
  fan: {
    box: [-64, 0, 128, 100],
    strands: [
      { d: rootPath(FAN), delay: 0.05, tip: true },
      { d: rootPath(FAN_LEFT), delay: 0.2, tip: true },
      { d: rootPath(FAN_RIGHT), delay: 0.3, tip: true },
      { d: rootPath(rootBranch(FAN_LEFT, 0.58, 9, [-44, 60], [-56, 72])), delay: 0.6, faint: true },
      { d: rootPath(rootBranch(FAN_RIGHT, 0.58, 8, [36, 68], [38, 80])), delay: 0.7, faint: true },
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
      { d: rootPath(TAIL), delay: 0.05, tip: true },
      { d: rootPath(TAIL_RIGHT), delay: 0.2, tip: true },
      { d: rootPath(rootBranch(TAIL, 0.05, 14, [-13, 32], [-14, 52])), delay: 0.35, faint: true },
      { d: rootPath(rootBranch(TAIL_RIGHT, 0.58, 12, [23, 58], [27, 74])), delay: 0.6, faint: true },
      { d: rootPath(rootBranch(TAIL, 0.68, 10, [16, 76], [16, 88])), delay: 0.75, faint: true },
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
      { d: rootPath(...HORIZON[0]), delay: 0.1 },
      { d: rootPath(...HORIZON[1]), delay: 0.3 },
      { d: rootPath(...HORIZON[2]), delay: 0.5 },
      { d: rootPath(...HORIZON[3]), delay: 0.4 },
      { d: "M884 0 C886 14 876 26 880 44", delay: 0.7, faint: true },
      { d: rootPath(rootBranch(HORIZON[0][0], 0.55, 12, [580, 70], [576, 90])), delay: 0.8, faint: true },
      { d: rootPath(rootBranch(HORIZON[1][0], 0.65, 12, [684, 70], [682, 86])), delay: 0.9, faint: true },
      { d: rootPath(rootBranch(HORIZON[2][0], 0.5, 12, [696, 58], [700, 74])), delay: 0.95, faint: true },
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
          <linearGradient id={`${id}-tip`} href={`#${id}`}>
            <stop offset="0" stopColor="var(--orchid)" />
            <stop offset="0.5" stopColor="var(--violet)" stopOpacity="0.65" />
            <stop offset="1" stopColor="var(--violet)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {s.strands.map((r, i) => (
          <path
            key={i}
            className={`rootlets__line${r.faint ? " rootlets__line--faint" : ""}`}
            d={r.d}
            pathLength={1}
            stroke={`url(#${id}${r.tip ? "-tip" : ""})`}
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
