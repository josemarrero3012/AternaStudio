"use client";

// «No empezamos por el código», contado con tres piezas: lo que se pone por
// escrito (fase 01), la dirección de arte (fase 02, con la tipografía y los
// colores reales de Aterna) y el código, que espera apagado hasta que la
// fase 03 se enciende. El encendido lo decide el CSS (`.approach:has(…)`),
// con el `data-on` que ya llevan las fases; aquí solo se dibujan los filetes
// y los checks al entrar en pantalla. Va en el rail y en la línea estática.

import { useEffect, useRef, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

export function MethodDesk() {
  const { t } = useI18n();
  const d = t.approach.desk;
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Sin JavaScript o con movimiento reducido se ve ya dibujada.
    el.dataset.anim = "";
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
  }, []);

  return (
    <ul className="desk" ref={ref} aria-label={d.label}>
      <li className="desk__tile desk__tile--brief">
        <span className="t-label desk__label">
          <span className="desk__n">01</span> {d.brief.label}
        </span>
        <ul className="desk__lines">
          {d.brief.lines.map((line, i) => (
            <li key={i} style={{ "--i": i } as CSSProperties}>
              <span className="desk__rule" aria-hidden="true" />
              <span className="t-small desk__line">{line}</span>
              <svg className="desk__check" viewBox="0 0 12 10" aria-hidden="true" focusable="false">
                <path d="M1 5.5 4.2 8.5 11 1.5" pathLength={1} />
              </svg>
            </li>
          ))}
        </ul>
      </li>
      <li className="desk__tile desk__tile--direction">
        <span className="t-label desk__label">
          <span className="desk__n">02</span> {d.direction.label}
        </span>
        <span className="desk__specimen" aria-hidden="true">
          Aa
        </span>
        <span className="desk__swatches" aria-hidden="true">
          <i style={{ background: "var(--night-0)" }} />
          <i style={{ background: "var(--indigo)" }} />
          <i style={{ background: "var(--violet)" }} />
          <i style={{ background: "var(--orchid)" }} />
        </span>
        <span className="t-label dim desk__fonts">{d.direction.fonts}</span>
      </li>
      <li className="desk__tile desk__tile--code">
        <span className="t-label desk__label">
          <span className="desk__n">03</span> {d.code.label}
        </span>
        <span className="desk__code" aria-hidden="true">
          &lt;/&gt;
        </span>
        <span className="t-label desk__state">
          <span className="desk__state-off">{d.code.off}</span>
          <span className="desk__state-on">{d.code.on}</span>
        </span>
      </li>
    </ul>
  );
}
