// Profundidad de los bloques «Estudio» (portada) y de /estudio: líneas
// finas detrás de las ilustraciones, sin tocarlas.
//
// - <StudioArcs>: ocupa exactamente la caja de la ilustración (mismo ancho y
//   proporción) y pinta el arco principal y unos pocos microdetalles, que
//   se salen de esa caja gracias a overflow: visible.
// - <StudioField>: capa de toda la sección con dos arcos secundarios muy
//   tenues que entran por los bordes y quedan en parte fuera de la vista.
//
// Todo es decorativo (aria-hidden, sin eventos) y estático. Trazo fijo de
// 1–1,5 px a cualquier tamaño (non-scaling-stroke).

import { useId } from "react";

function Gradient({ id, x1, y1, x2, y2 }: { id: string; x1: number; y1: number; x2: number; y2: number }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="var(--accent-violet)" />
      <stop offset="1" stopColor="var(--accent-magenta)" />
    </linearGradient>
  );
}

/** Arco principal y microdetalles, en la caja de la ilustración (viewBox = su proporción). */
export function StudioArcs({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 600 332" preserveAspectRatio="none" fill="none" focusable="false">
        <defs>
          <Gradient id={`main-${id}`} x1={-40} y1={300} x2={640} y2={60} />
        </defs>
        {/* Arco principal: nace tras el escritorio, sube por detrás de la
            cabeza y baja por la derecha sin cerrarse. */}
        <path
          className="studio-depth__main"
          d="M-26 300C-58 196 -6 70 116 12C226 -40 386 -46 494 0C588 40 640 128 626 236"
          stroke={`url(#main-${id})`}
        />
        <g className="studio-depth__micro">
          {/* tramo discontinuo que prolonga el arco hacia fuera */}
          <path className="studio-depth__dash" d="M612 -2C640 28 656 64 660 104" />
          <circle cx="652" cy="150" r="3" className="studio-depth__dot studio-depth__dot--magenta" />
          <circle cx="44" cy="-34" r="2.4" className="studio-depth__dot studio-depth__dot--violet" />
          <circle cx="548" cy="-40" r="2" className="studio-depth__dot" />
          {/* cruz fina en el espacio negativo entre texto e ilustración */}
          <path className="studio-depth__cross" d="M-92 176H-76M-84 168V184" />
        </g>
      </svg>
    </div>
  );
}

/** Dos arcos secundarios de toda la sección: uno abajo y otro desde arriba a la derecha. */
export function StudioField({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={className} aria-hidden="true">
      <svg className="studio-field__top" viewBox="0 0 600 600" fill="none" focusable="false">
        <defs>
          <Gradient id={`top-${id}`} x1={0} y1={0} x2={600} y2={600} />
        </defs>
        <path d="M600 20C420 20 230 110 170 300C130 430 190 540 300 600" stroke={`url(#top-${id})`} />
      </svg>
      <svg className="studio-field__bottom" viewBox="0 0 1200 400" fill="none" focusable="false">
        <defs>
          <Gradient id={`bottom-${id}`} x1={0} y1={400} x2={1200} y2={0} />
        </defs>
        <path d="M0 360C220 250 470 220 700 250C900 276 1060 210 1200 90" stroke={`url(#bottom-${id})`} />
      </svg>
    </div>
  );
}

/**
 * /estudio: arco que sube desde la planta y se abre hacia arriba a la
 * izquierda (crecimiento), raíces que nacen bajo el suelo de la escena
 * (base) y el suelo prolongado como filete editorial. Misma caja que la
 * ilustración (viewBox = su proporción 1200/608).
 */
export function EstudioArcs({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 600 304" preserveAspectRatio="none" fill="none" focusable="false">
        <defs>
          <Gradient id={`grow-${id}`} x1={600} y1={300} x2={120} y2={0} />
          <Gradient id={`roots-${id}`} x1={330} y1={300} x2={500} y2={390} />
        </defs>
        {/* arco principal: nace junto a la planta y sube abriéndose */}
        <path
          className="estudio-depth__main"
          d="M598 292C640 182 612 62 494 18C392 -20 256 -12 150 42"
          stroke={`url(#grow-${id})`}
        />
        {/* raíces bajo la planta, abstractas */}
        <g className="estudio-depth__roots" stroke={`url(#roots-${id})`}>
          <path d="M400 302C392 330 366 348 332 362" />
          <path d="M414 302C426 334 456 352 492 376" />
          <path d="M380 340C368 352 352 356 340 372" />
        </g>
        <g className="estudio-depth__micro">
          <path className="estudio-depth__rule" d="M604 302H980" />
          <path className="estudio-depth__dash" d="M470 -30C520 -26 560 -8 590 18" />
          <path className="estudio-depth__cross" d="M32 -50H46M39 -57V-43" />
          <circle cx="618" cy="132" r="3" className="studio-depth__dot studio-depth__dot--violet" />
          <circle cx="128" cy="14" r="2.4" className="studio-depth__dot studio-depth__dot--magenta" />
        </g>
      </svg>
    </div>
  );
}
