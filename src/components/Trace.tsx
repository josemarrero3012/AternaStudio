"use client";

// Dibujos de luz de la web: el de cada ficha de servicio (ServiceTrace) y los
// iconos del resto de páginas (glyphs.ts). Un solo vocabulario, el de las
// raíces del vídeo: filamentos que nacen en la nada, puntos y un nodo
// encendido. Coordenadas fijas (mismo SVG en el servidor y en el navegador);
// los degradados llevan id propio (useId) porque hay varios dibujos por
// página. Con movimiento se dibujan una vez al entrar en pantalla (ver
// globals.css), cada trazo con su retardo; después, si el dibujo tiene
// `flow`, empieza su movimiento continuo: pulsos de luz que recorren los
// trazos y latidos en el nodo y los puntos. Se pausa fuera de pantalla y no
// existe con movimiento reducido.

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Point = { x: number; y: number; delay: number };

/** Movimiento continuo. Los tiempos son fracciones de un ciclo de `dur` segundos. */
export type Flow = {
  dur: number;
  /**
   * Pulsos de luz: la cabeza entra en el trazo `d` en `from` y llega al final
   * en `to`; luego sale la cola. `len`: largo del pulso (fracción del trazo).
   */
  pulses?: { d: string; from: number; to: number; len?: number }[];
  /** Latidos: el nodo o un punto (su índice en `dots`) se encienden en `at`. */
  beats?: { target: "node" | number; at: number }[];
  /** El trazo `line` vibra en vertical alrededor de `y` entre `from` y `to` (la voz del asistente). */
  voice?: { line: number; y: number; from: number; to: number };
};

export type Drawing = {
  /** Ancho y alto del viewBox. */
  w: number;
  h: number;
  /** `faint`: trazo secundario (marcas, tiradores), más fino y sin halo. */
  lines: { d: string; delay?: number; dur?: number; faint?: boolean }[];
  dots?: Point[];
  node?: Point;
  flow?: Flow;
};

/** `glyph`: icono a 96 px; `md` y `lg`, el mismo lienzo a 144 y 192 px; `wide`: el dibujo de la ficha. */
export type TraceSize = "wide" | "glyph" | "md" | "lg";

/** Lienzo de los iconos: 96 × 40, el nodo final suele caer en x = 88. */
export const glyph = (lines: Drawing["lines"], dots: Drawing["dots"], node: Drawing["node"], flow?: Flow): Drawing => ({
  w: 96,
  h: 40,
  lines,
  dots,
  node,
  flow,
});

/** Circunferencia como trazo: empieza en su punto izquierdo y gira en el sentido del reloj. */
export const ring = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy}`;

/** Retardo y duración de cada trazo, en segundos (los lee el CSS). */
const timing = (delay = 0, dur?: number) =>
  ({ "--t-delay": `${delay}s`, ...(dur ? { "--t-dur": `${dur}s` } : {}) }) as CSSProperties;

/**
 * Radios del halo del nodo, del nodo y de los puntos, en unidades del lienzo.
 * Al ampliar un icono se reducen para que en pantalla no engorden al doble.
 */
const RADII: Record<TraceSize, { glow: number; node: number; dot: number }> = {
  wide: { glow: 14, node: 3, dot: 2 },
  glyph: { glow: 10, node: 3, dot: 1.75 },
  md: { glow: 8, node: 2.4, dot: 1.4 },
  lg: { glow: 7, node: 2, dot: 1.2 },
};

/** Largo por defecto de un pulso y margen para que su punta redonda no asome (fracciones del trazo). */
const PULSE = 0.2;
const PAD = 0.12;

/** Cuándo acaba el dibujo de entrada, en segundos (con los 0,4 s de espera del CSS). */
const drawEnd = ({ lines, dots, node }: Drawing) =>
  0.4 +
  Math.max(
    ...lines.map((l) => (l.delay ?? 0) + (l.dur ?? 2.4)),
    ...(dots ?? []).map((d) => d.delay + 0.9),
    node ? node.delay + 0.9 : 0,
  );

/**
 * Fotogramas de un pulso que recorre un trazo de largo `length` a velocidad
 * constante: la cabeza entra en `from` y llega al final en `to` (fracciones
 * del ciclo); la cola sale después. `dash` (largo del pulso) y `pad` (margen),
 * en las mismas unidades que `length`.
 */
export function travel(dash: number, length: number, pad: number, from: number, to: number): Keyframe[] {
  const start = dash + pad;
  const end = -(length + pad);
  const out = Math.min(1, to + ((dash + pad) * (to - from)) / (length + pad));
  const kf: Keyframe[] = [{ offset: 0, strokeDashoffset: start }];
  if (from > 0) kf.push({ offset: from, strokeDashoffset: start });
  kf.push({ offset: out, strokeDashoffset: end });
  if (out < 1) kf.push({ offset: 1, strokeDashoffset: end });
  return kf;
}

/** Fotogramas de un latido en `at`: sube deprisa hasta `peak` y vuelve despacio a `rest`. */
export function beatAt(at: number, rest: Keyframe, peak: Keyframe): Keyframe[] {
  const a = Math.max(0, at - 0.02);
  const b = Math.min(1, at + 0.05);
  const c = Math.min(1, at + 0.32);
  return [
    { ...rest, offset: 0 },
    ...(a > 0 ? [{ ...rest, offset: a, easing: "ease-out" }] : []),
    { ...peak, offset: b, easing: "ease-in-out" },
    { ...rest, offset: c },
    ...(c < 1 ? [{ ...rest, offset: 1 }] : []),
  ];
}

const SCALE_1: Keyframe = { transform: "scale(1)" };

/** Arranca el movimiento continuo de un dibujo ya dibujado. */
function runFlow(svg: SVGSVGElement, flow: Flow): Animation[] {
  // Cada dibujo empieza con un desfase propio: así no laten todos a la vez.
  const opts: KeyframeAnimationOptions = { duration: flow.dur * 1000, iterations: Infinity, delay: Math.random() * 800 };
  const anims: Animation[] = [];
  const pulses = svg.querySelectorAll(".trace__pulse");
  flow.pulses?.forEach((p, i) => {
    const kf = travel(p.len ?? PULSE, 1, PAD, p.from, p.to);
    pulses[i]?.querySelectorAll("path").forEach((path) => anims.push(path.animate(kf, opts)));
  });
  const dots = svg.querySelectorAll(".trace__dot");
  flow.beats?.forEach(({ target, at }) => {
    if (target === "node") {
      const glow = svg.querySelector(".trace__glow");
      const core = svg.querySelector(".trace__node");
      if (glow) anims.push(glow.animate(beatAt(at, SCALE_1, { transform: "scale(1.8)" }), opts));
      if (core) anims.push(core.animate(beatAt(at, SCALE_1, { transform: "scale(1.35)" }), opts));
    } else {
      const dot = dots[target];
      if (dot) anims.push(dot.animate(beatAt(at, SCALE_1, { transform: "scale(2)" }), opts));
    }
  });
  if (flow.voice) {
    const { line, y, from, to } = flow.voice;
    const g = svg.querySelector<SVGGElement>(`[data-line="${line}"]`);
    if (g) {
      // Vibra alrededor de su línea central: los tramos rectos no se mueven.
      g.style.transformBox = "view-box";
      g.style.transformOrigin = `0 ${y}px`;
      const w = to - from;
      const at = (k: number, s: number): Keyframe => ({ offset: from + w * k, transform: `scaleY(${s})` });
      anims.push(
        g.animate(
          [
            { offset: 0, transform: "scaleY(1)" },
            ...(from > 0 ? [at(0, 1)] : []),
            at(0.2, 1.35),
            at(0.4, 0.6),
            at(0.6, 1.2),
            at(0.8, 0.85),
            at(1, 1),
            ...(to < 1 ? [{ offset: 1, transform: "scaleY(1)" }] : []),
          ],
          { ...opts, easing: "ease-in-out" },
        ),
      );
    }
  }
  return anims;
}

export function Trace({ drawing, size, className }: { drawing: Drawing; size: TraceSize; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  // Solo caracteres seguros dentro de url(#…).
  const id = `tr${useId().replace(/[^\w-]/g, "")}`;
  const { w, h, lines, dots, node, flow } = drawing;
  const r = RADII[size];

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let anims: Animation[] = [];
    let visible = false;
    let timer: number | undefined;
    const draw = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        draw.disconnect();
        el.dataset.draw = "on";
        if (!flow) return;
        timer = window.setTimeout(() => {
          anims = runFlow(el, flow);
          if (!visible) anims.forEach((a) => a.pause());
        }, drawEnd(drawing) * 1000);
      },
      { threshold: 0.6, rootMargin: "0px 0px -8% 0px" },
    );
    // Fuera de pantalla el movimiento continuo se pausa: no gasta batería.
    const view = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      anims.forEach((a) => (visible ? a.play() : a.pause()));
    });
    draw.observe(el);
    view.observe(el);
    return () => {
      draw.disconnect();
      view.disconnect();
      window.clearTimeout(timer);
      anims.forEach((a) => a.cancel());
    };
  }, [drawing, flow]);

  return (
    <svg
      ref={ref}
      className={`trace trace--${size}${size === "wide" ? "" : " trace--icon"}${className ? ` ${className}` : ""}`}
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
        <g
          key={`l${i}`}
          data-line={i}
          className={l.faint ? "trace__faint" : undefined}
          stroke={`url(#${id}-line)`}
          style={timing(l.delay, l.dur)}
        >
          {l.faint ? null : <path className="trace__halo" d={l.d} pathLength={1} />}
          <path className="trace__line" d={l.d} pathLength={1} />
        </g>
      ))}
      {flow?.pulses?.map((p, i) => (
        <g key={`p${i}`} className="trace__pulse" style={{ "--len": p.len ?? PULSE, "--off": (p.len ?? PULSE) + PAD } as CSSProperties}>
          <path className="trace__pulse-halo" d={p.d} pathLength={1} />
          <path className="trace__pulse-core" d={p.d} pathLength={1} />
        </g>
      ))}
      {dots?.map((d, i) => (
        <circle key={i} className="trace__dot" cx={d.x} cy={d.y} r={r.dot} style={timing(d.delay)} />
      ))}
      {node ? (
        <g style={timing(node.delay)}>
          <circle className="trace__glow" fill={`url(#${id}-glow)`} cx={node.x} cy={node.y} r={r.glow} />
          <circle className="trace__node" cx={node.x} cy={node.y} r={r.node} />
        </g>
      ) : null}
    </svg>
  );
}
