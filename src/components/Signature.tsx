"use client";

// La firma del estudio (/estudio): donde otras webs ponen un nombre y una
// cara, el manifiesto termina con el trazo del símbolo, que se dibuja solo al
// llegar. Son los mismos contornos que el Sello 3D (src/world/mark-data.ts),
// en línea fina y con el degradado de la marca.

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { MARK } from "@/world/mark-data";

// Milésimas del radio, con la y hacia arriba: en SVG, hacia abajo.
const PATHS = MARK.flatMap((shape) =>
  shape.map((flat) => {
    let d = "";
    for (let i = 0; i < flat.length; i += 2) d += `${i ? "L" : "M"}${flat[i]} ${-flat[i + 1]}`;
    return `${d}Z`;
  }),
);

export function Signature({ label }: { label: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      el.dataset.drawn = "true";
      return;
    }
    el.dataset.drawn = "false";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.drawn = "true";
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="signature" ref={ref}>
      <svg className="signature__mark" viewBox="-1220 -1220 2440 2440" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="signature-ink" gradientUnits="userSpaceOnUse" x1="-900" y1="900" x2="900" y2="-900">
            <stop offset="0" style={{ stopColor: "var(--lavender)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--violet)" }} />
            <stop offset="1" style={{ stopColor: "var(--orchid)" }} />
          </linearGradient>
        </defs>
        <circle className="signature__ring" r="1135" pathLength={1} />
        {PATHS.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ ["--i" as string]: i }} />
        ))}
      </svg>
      <figcaption className="t-label dim signature__label">{label}</figcaption>
    </figure>
  );
}
