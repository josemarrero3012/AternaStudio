"use client";

// Ilustraciones de «En qué creemos» (/estudio), en el mismo orden que
// pages.estudio.beliefs en dict.ts. Mismo vocabulario que Trace.tsx (trazo
// fino lavanda, nodo orquídea), pero cada una cuenta su idea con un
// movimiento propio en bucle, hecho con animaciones CSS (ver globals.css):
//   1. Primero la auditoría: una lupa recorre la línea y se para en la rotura.
//   2. Ninguna cifra inventada: las barras crecen hasta su valor real y la
//      cifra inflada (discontinua) aparece y se desvanece.
//   3. El movimiento con motivo: un punto recorre la curva de la marca,
//      cubic-bezier(0.16, 1, 0.3, 1), y abajo un cuadrado avanza con ella.
// El rosa (--rose) marca lo roto y lo falso, como en los errores de la web.
// Las animaciones solo corren en pantalla (data-live) y no existen con
// movimiento reducido.

import { useEffect, useRef } from "react";

const CURVE = "M15 50 C35.8 8 54 8 145 8";

function Audit() {
  return (
    <>
      <path className="belief-art__line" d="M8 32 H62 M78 32 H152" />
      <circle className="belief-art__dot" cx="30" cy="32" r="2" />
      <circle className="belief-art__dot" cx="110" cy="32" r="2" />
      <circle className="belief-art__dot" cx="136" cy="32" r="2" />
      <circle className="belief-art__flaw belief-art__flaw--gap" cx="70" cy="32" r="3" />
      <g className="belief-art__lens">
        <circle className="belief-art__line" cx="20" cy="32" r="12" />
        <path className="belief-art__line" d="M28.5 40.5 L36 48" />
      </g>
    </>
  );
}

function Figures() {
  return (
    <>
      <path className="belief-art__line belief-art__line--faint" d="M20 54 H140" />
      <rect className="belief-art__bar" x="40" y="36" width="14" height="18" rx="1" />
      <rect className="belief-art__bar belief-art__bar--lit" x="73" y="24" width="14" height="30" rx="1" />
      <rect className="belief-art__bar" x="106" y="30" width="14" height="24" rx="1" style={{ animationDelay: "0.15s" }} />
      <rect className="belief-art__flaw belief-art__flaw--ghost" x="73" y="6" width="14" height="48" rx="1" />
    </>
  );
}

function Motion() {
  return (
    <>
      <path className="belief-art__line belief-art__line--faint" d="M15 50 L35.8 8 M145 8 L54 8" />
      <path className="belief-art__line" d={CURVE} />
      <circle className="belief-art__dot" cx="35.8" cy="8" r="2" />
      <circle className="belief-art__dot" cx="54" cy="8" r="2" />
      <circle className="belief-art__rider" r="4" style={{ offsetPath: `path("${CURVE}")` }} />
      <path className="belief-art__line belief-art__line--faint" d="M15 60 H145" />
      <rect className="belief-art__slider" x="12" y="57" width="6" height="6" rx="1" />
    </>
  );
}

const ART = [Audit, Figures, Motion];

export function BeliefArt({ index }: { index: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const Art = ART[index];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // En pausa fuera de pantalla: no gasta batería.
    const io = new IntersectionObserver((entries) => {
      el.dataset.live = entries[entries.length - 1].isIntersecting ? "on" : "off";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!Art) return null;
  return (
    <svg ref={ref} className="belief-art" viewBox="0 0 160 66" aria-hidden="true" focusable="false">
      <Art />
    </svg>
  );
}
