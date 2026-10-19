"use client";

// Dibujos de luz de la web: el de cada ficha de servicio (ServiceTrace) y los
// iconos pequeños del resto de páginas (glyphs.ts). Un solo vocabulario, el de
// las raíces del vídeo: filamentos que nacen en la nada, puntos y un nodo
// encendido. Coordenadas fijas (mismo SVG en el servidor y en el navegador);
// los degradados llevan id propio (useId) porque hay varios dibujos por
// página. Con movimiento se dibujan una vez al entrar en pantalla (ver
// globals.css); cada trazo lleva su retardo.

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export type Drawing = {
  /** Ancho y alto del viewBox. */
  w: number;
  h: number;
  /** `faint`: trazo secundario (marcas, tiradores), más fino y sin halo. */
  lines: { d: string; delay?: number; dur?: number; faint?: boolean }[];
  dots?: { x: number; y: number; delay: number }[];
  node?: { x: number; y: number; delay: number };
};

/** Lienzo de los iconos: 96 × 40, el nodo final suele caer en x = 88. */
export const glyph = (lines: Drawing["lines"], dots: Drawing["dots"], node: Drawing["node"]): Drawing => ({
  w: 96,
  h: 40,
  lines,
  dots,
  node,
});

/** Circunferencia como trazo: empieza en su punto izquierdo y gira en el sentido del reloj. */
export const ring = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy}`;

/** Retardo y duración de cada trazo, en segundos (los lee el CSS). */
const timing = (delay = 0, dur?: number) =>
  ({ "--t-delay": `${delay}s`, ...(dur ? { "--t-dur": `${dur}s` } : {}) }) as CSSProperties;

/** Radios del halo del nodo y de los puntos: en un icono, algo menores. */
const RADII = { wide: { glow: 14, dot: 2 }, glyph: { glow: 10, dot: 1.75 } };

export function Trace({ drawing, size, className }: { drawing: Drawing; size: "wide" | "glyph"; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  // Solo caracteres seguros dentro de url(#…).
  const id = `tr${useId().replace(/[^\w-]/g, "")}`;
  const { w, h, lines, dots, node } = drawing;
  const r = RADII[size];

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        el.dataset.draw = "on";
      },
      { threshold: 0.6, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className={`trace trace--${size}${className ? ` ${className}` : ""}`}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* De la nada (izquierda) al nodo (8 unidades antes del borde). */}
        <linearGradient id={`${id}-line`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w - 8} y2="0">
          <stop offset="0" className="trace__from" />
          <stop offset="0.4" className="trace__mid" />
          <stop offset="1" className="trace__to" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" className="trace__glow-from" />
          <stop offset="1" className="trace__glow-to" />
        </radialGradient>
      </defs>
      {lines.map((l, i) => (
        <g key={i} className={l.faint ? "trace__faint" : undefined} stroke={`url(#${id}-line)`} style={timing(l.delay, l.dur)}>
          {l.faint ? null : <path className="trace__halo" d={l.d} pathLength={1} />}
          <path className="trace__line" d={l.d} pathLength={1} />
        </g>
      ))}
      {dots?.map((d, i) => (
        <circle key={i} className="trace__dot" cx={d.x} cy={d.y} r={r.dot} style={timing(d.delay)} />
      ))}
      {node ? (
        <g style={timing(node.delay)}>
          <circle className="trace__glow" fill={`url(#${id}-glow)`} cx={node.x} cy={node.y} r={r.glow} />
          <circle className="trace__node" cx={node.x} cy={node.y} r="3" />
        </g>
      ) : null}
    </svg>
  );
}
