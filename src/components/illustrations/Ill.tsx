"use client";

// Motor de las ilustraciones de Aterna.
//
// Lenguaje visual: línea de grosor uniforme y trazo ligeramente irregular
// (filtro de desplazamiento), rellenos planos de la paleta de marca
// desplazados respecto al contorno, como una impresión risográfica.
// Cada forma se compone de tres capas:
//   1. fondo del color de la superficie (tapa lo que queda detrás),
//   2. relleno de color desplazado,
//   3. contorno.
// Al entrar en pantalla los contornos se dibujan y los rellenos "caen" a su
// sitio. Sin JS o con prefers-reduced-motion se muestra el estado final.
//
// Una sola plumilla: grosor, desplazamiento y temblor se fijan en píxeles de
// pantalla (ver `nib`), no en unidades del viewBox. Así un icono de 96 px y
// una escena de 430 px parecen dibujados por la misma mano.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { withBase } from "@/lib/base";

export type Tone = "a" | "b" | "c" | "s";

/** Forma con contorno; `f` añade relleno de color desplazado. */
export function S({
  d,
  f,
  bg = true,
  tone,
  line = true,
  className,
}: {
  d: string;
  f?: Tone;
  bg?: boolean;
  /** false: solo relleno, sin contorno (manchas de color). */
  line?: boolean;
  /** Color del contorno (por defecto, el color del texto). */
  tone?: Exclude<Tone, "s">;
  className?: string;
}) {
  return (
    <g className={className}>
      {f && bg ? <path className="ill-bg" d={d} /> : null}
      {f ? <path className={`ill-f f-${f}`} d={d} /> : null}
      {line ? <path className={`ill-l${tone ? ` l-${tone}` : ""}`} d={d} pathLength={1} /> : null}
    </g>
  );
}

/** Trazo discontinuo (no se anima como dibujo, solo aparece). */
export function Dash({ d, tone }: { d: string; tone?: Exclude<Tone, "s"> }) {
  return <path className={`ill-dash${tone ? ` l-${tone}` : ""}`} d={d} />;
}

/** Punto macizo del color de la línea. */
export function Dot({ cx, cy, r = 3, tone }: { cx: number; cy: number; r?: number; tone?: Exclude<Tone, "s"> }) {
  return <circle className={`ill-dot${tone ? ` d-${tone}` : ""}`} cx={cx} cy={cy} r={r} />;
}

/** Destello de cuatro puntas; parpadea suavemente. */
export function Spark({ x, y, s = 7, tone }: { x: number; y: number; s?: number; tone?: Exclude<Tone, "s"> }) {
  const d = `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
  return <path className={`ill-spark${tone ? ` d-${tone}` : ""}`} d={d} />;
}

// Geometría auxiliar ------------------------------------------------------

export const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// Contenedor ---------------------------------------------------------------

/**
 * Plumilla en px de pantalla según el ancho dibujado: crece muy poco con el
 * tamaño (1,75 px en un icono, 2,6 px en una escena) para que la línea no se
 * vuelva un hilo en lo pequeño ni un rotulador en lo grande.
 */
function nib(width: number) {
  const line = Math.min(2.6, Math.max(1.75, 1.5 + width / 400));
  return { line, offset: line * 1.6, rough: 1.1 };
}

type IllProps = {
  viewBox: string;
  children: ReactNode;
  className?: string;
  /** Texto alternativo. Sin él la ilustración es decorativa (aria-hidden). */
  label?: string;
};

export function Ill({ viewBox, children, className, label }: IllProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [anim, setAnim] = useState<"static" | "pending" | "in">("static");
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    // Lo que ya está a la vista al cargar se anima igualmente.
    setAnim("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          requestAnimationFrame(() => setAnim("in"));
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pasa la plumilla de px de pantalla a unidades del viewBox de este SVG.
  useEffect(() => {
    const el = ref.current;
    if (!el || !("ResizeObserver" in window)) return;
    const vbWidth = el.viewBox.baseVal.width;
    const displace = el.querySelector("feDisplacementMap");
    const apply = () => {
      const w = el.getBoundingClientRect().width;
      if (!w || !vbWidth) return;
      const u = vbWidth / w;
      const { line, offset, rough } = nib(w);
      el.style.setProperty("--ill-sw", String(line * u));
      el.style.setProperty("--ill-off", `${offset * u}px`);
      el.style.setProperty("--ill-dash", `${0.77 * line * u} ${3.46 * line * u}`);
      displace?.setAttribute("scale", String(rough * u));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={`ill${className ? ` ${className}` : ""}`}
      data-anim={anim}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <filter id={`rough-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g filter={`url(#rough-${uid})`}>{children}</g>
    </svg>
  );
}

// Ilustraciones en imagen ---------------------------------------------------

type IllImageProps = {
  src: string;
  width: number;
  height: number;
  className?: string;
  label?: string;
};

/**
 * Ilustración rasterizada (PNG/WebP sin fondo). Entra con un fundido y una
 * leve subida al aparecer en pantalla, igual que las vectoriales.
 */
export function IllImage({ src, width, height, className, label }: IllImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [anim, setAnim] = useState<"static" | "pending" | "in">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    setAnim("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          requestAnimationFrame(() => setAnim("in"));
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={withBase(src)}
      width={width}
      height={height}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
      className={`ill-img${className ? ` ${className}` : ""}`}
      data-anim={anim}
    />
  );
}
