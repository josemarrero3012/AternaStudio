"use client";

// «No empezamos por el código», como una raíz de luz: el titular queda
// encima de la tierra y debajo crece lo que no se ve. Un nodo enciende la
// línea del suelo y, de ella, cuelgan raíces que se apagan en la oscuridad;
// en tres de sus puntas, lo que se decide antes del código. En el rail, la
// línea del suelo cruza el hueco y se convierte en el eje de las fases: la
// raíz y el método son la misma línea. Mismo vocabulario que Trace.tsx
// (filamento, puntos, nodo), pero a la medida de la sección.
//
// Sin movimiento (o sin JavaScript) se ve ya dibujada.

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

/** Lienzo de 460 × 250: y = 0 es la línea del suelo. */
const ROOTS: { d: string; delay: number; faint?: boolean }[] = [
  { d: "M0 0 C2 52 30 84 24 140 C20 178 36 206 30 240", delay: 0.2 },
  { d: "M118 0 C116 46 88 80 94 128 C98 166 80 192 84 226", delay: 0.45 },
  { d: "M100 64 C124 84 146 104 144 152", delay: 0.8, faint: true },
  { d: "M252 0 C254 38 282 66 276 114 C272 150 292 170 288 200", delay: 0.6 },
  { d: "M268 52 C246 70 232 92 236 124", delay: 0.95, faint: true },
  { d: "M372 0 C370 30 352 50 358 92", delay: 0.75 },
];

/** Puntas con etiqueta (x, y en el lienzo) y puntas sin ella. */
const TIPS = [
  { x: 84, y: 226 },
  { x: 288, y: 200 },
  { x: 358, y: 92 },
];
const DOTS = [
  { x: 30, y: 240 },
  { x: 144, y: 152 },
  { x: 236, y: 124 },
];

export function MethodRoot({ variant }: { variant: "rail" | "static" }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const id = `root${useId().replace(/[^\w-]/g, "")}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.anim = "";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.in = "";
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
      <svg className="root__svg" viewBox="0 0 460 250" focusable="false">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--orchid)" />
            <stop offset="0.45" stopColor="var(--violet)" stopOpacity="0.7" />
            <stop offset="1" stopColor="var(--indigo)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ROOTS.map((r, i) => (
          <path
            key={i}
            className={`root__line${r.faint ? " root__line--faint" : ""}`}
            d={r.d}
            pathLength={1}
            stroke={`url(#${id})`}
            style={{ "--d": `${r.delay}s` } as CSSProperties}
          />
        ))}
        {DOTS.map((p, i) => (
          <circle key={i} className="root__dot" cx={p.x} cy={p.y} r={1.6} style={{ "--d": `${1.4 + i * 0.1}s` } as CSSProperties} />
        ))}
        {TIPS.map((p, i) => (
          <circle key={i} className="root__tip" cx={p.x} cy={p.y} r={2.4} style={{ "--d": `${1.5 + i * 0.15}s` } as CSSProperties} />
        ))}
      </svg>
      {/* Las etiquetas, en HTML para que el texto se lea nítido a cualquier tamaño. */}
      {t.approach.root.map((label, i) => (
        <span
          key={i}
          className="t-label root__label"
          style={{ left: `${(TIPS[i].x / 460) * 100}%`, top: `${(TIPS[i].y / 250) * 100}%`, "--d": `${1.7 + i * 0.15}s` } as CSSProperties}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
