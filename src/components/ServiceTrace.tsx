"use client";

// Dibujo de cada ficha de servicio, bajo «El servicio»: la frase clave del
// texto contada con un filamento que nace en la nada y acaba en un nodo, como
// las raíces del vídeo. Coordenadas fijas (mismo SVG en el servidor y en el
// navegador) e ids fijos: hay uno por página. Con movimiento se dibuja una vez
// al entrar en pantalla (ver globals.css); cada trazo lleva su retardo.

import { useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import type { ServiceSlug } from "@/lib/pricing";

type Trace = {
  /** Alto del viewBox; el ancho es siempre 300. */
  h: number;
  lines: { d: string; delay?: number; dur?: number }[];
  dots?: { x: number; y: number; delay: number }[];
  node: { x: number; y: number; delay: number };
};

const TRACES: Record<ServiceSlug, Trace> = {
  // «Partimos de qué tiene que conseguir y a partir de ahí decidimos
  // estructura, dirección de arte y código»: un nodo que se abre en tres.
  web: {
    h: 120,
    lines: [
      { d: "M0 60 H120", dur: 1 },
      { d: "M120 60 C180 60 204 22 292 22", delay: 1, dur: 1.4 },
      { d: "M120 60 H292", delay: 1, dur: 1.4 },
      { d: "M120 60 C180 60 204 98 292 98", delay: 1, dur: 1.4 },
    ],
    dots: [
      { x: 292, y: 22, delay: 2.4 },
      { x: 292, y: 60, delay: 2.4 },
      { x: 292, y: 98, delay: 2.4 },
    ],
    node: { x: 120, y: 60, delay: 0.8 },
  },
  // «Sube en escalones, no en línea recta». Mesetas de distinta longitud y
  // saltos desiguales: con escalones regulares se leía como una escalera.
  seo: {
    h: 120,
    lines: [{ d: "M0 112 H74 V102 H122 V84 H146 V78 H196 V52 H226 V44 H270 V18 H292" }],
    node: { x: 292, y: 18, delay: 2.4 },
  },
  // «Una web necesita mantenimiento para seguir rindiendo»: una línea que se
  // sostiene, con revisiones regulares. Contrasta con la que sube en SEO.
  mantenimiento: {
    h: 60,
    lines: [{ d: "M0 30 H292", dur: 2 }],
    dots: [
      { x: 70, y: 30, delay: 2 },
      { x: 126, y: 30, delay: 2.15 },
      { x: 182, y: 30, delay: 2.3 },
      { x: 238, y: 30, delay: 2.45 },
    ],
    node: { x: 292, y: 30, delay: 2.6 },
  },
  // «El teléfono sigue sonando… un asistente que habla con la voz de tu
  // negocio»: una voz que entra, se resuelve y queda atendida.
  "asistente-ia": {
    h: 120,
    lines: [
      {
        d: "M0 60 H92 Q100 46 108 60 Q116 80 124 60 Q132 30 140 60 Q148 88 156 60 Q164 38 172 60 Q180 74 188 60 Q196 52 204 60 H292",
      },
    ],
    node: { x: 292, y: 60, delay: 2.4 },
  },
};

/** Retardo y duración de cada trazo, en segundos (los lee el CSS). */
const timing = (delay = 0, dur?: number) =>
  ({ "--t-delay": `${delay}s`, ...(dur ? { "--t-dur": `${dur}s` } : {}) }) as CSSProperties;

export function ServiceTrace({ slug }: { slug: ServiceSlug }) {
  const ref = useRef<SVGSVGElement>(null);
  const trace = TRACES[slug];

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
    <svg ref={ref} className="svc-trace" viewBox={`0 0 300 ${trace.h}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="svc-trace-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="292" y2="0">
          <stop offset="0" className="svc-trace__from" />
          <stop offset="0.4" className="svc-trace__mid" />
          <stop offset="1" className="svc-trace__to" />
        </linearGradient>
        <radialGradient id="svc-trace-glow">
          <stop offset="0" className="svc-trace__glow-from" />
          <stop offset="1" className="svc-trace__glow-to" />
        </radialGradient>
      </defs>
      {trace.lines.map((l, i) => (
        <g key={i} style={timing(l.delay, l.dur)}>
          <path className="svc-trace__halo" d={l.d} pathLength={1} />
          <path className="svc-trace__line" d={l.d} pathLength={1} />
        </g>
      ))}
      {trace.dots?.map((d, i) => (
        <circle key={i} className="svc-trace__dot" cx={d.x} cy={d.y} r="2" style={timing(d.delay)} />
      ))}
      <g style={timing(trace.node.delay)}>
        <circle className="svc-trace__glow" cx={trace.node.x} cy={trace.node.y} r="14" />
        <circle className="svc-trace__node" cx={trace.node.x} cy={trace.node.y} r="3" />
      </g>
    </svg>
  );
}
