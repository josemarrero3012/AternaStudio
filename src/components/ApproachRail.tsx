"use client";

// «Cómo trabajamos» en horizontal (adaptado del Timeline de Hyperiux Vault).
// Al llegar, la sección se fija y, mientras se baja, la pista se desliza a
// la izquierda: primero el titular y el árbol del vídeo, luego las cuatro
// fases, alternando arriba y abajo de un eje que se dibuja con el scroll.
// Cuando cada fase entra, crece su tallo, se enciende su nodo y su texto
// sube línea a línea (SplitText). Sin fechas: son las fases del método.
//
// Desde 768 px (en móvil, la línea vertical se lee mejor). Es el contenido real cuando está activa (la línea normal se oculta), así
// que no va con aria-hidden. Solo con movimiento: hasta que se activa
// (data-rail="on" en la sección)
// está oculta y se ve la línea normal de Approach, que es también la de
// movimiento reducido. Se usa una vez, en la portada.

import { useEffect, type RefObject } from "react";
import { SplitText } from "gsap/SplitText";
import { withBase } from "@/lib/base";
import { useI18n } from "@/lib/i18n";
import { ScrollTrigger, gsap, registerGsap } from "@/lib/motion";

export function ApproachRail({ section, eyebrow }: { section: RefObject<HTMLElement | null>; eyebrow: string }) {
  const { t, locale } = useI18n();

  useEffect(() => {
    const root = section.current;
    const pin = root?.querySelector<HTMLElement>(".rail-pin");
    const rail = root?.querySelector<HTMLElement>(".rail");
    if (!root || !pin || !rail) return;
    registerGsap();
    gsap.registerPlugin(SplitText);

    // Desde 768 px y con movimiento. En móvil cada fase ocupaba la pantalla y
    // el texto pasaba cortado por los dos bordes: allí manda la línea
    // vertical. matchMedia la monta y desmonta sola al cambiar de tamaño.
    const mm = gsap.matchMedia(root);
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      // Primero se muestra la pista (data-rail), luego se mide.
      root.dataset.rail = "on";
      // Con la fuente definitiva cambian anchos y cortes de línea.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      // Lo que falta por recorrer: el ancho de la pista menos la ventana.
      const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);
      const scroll = { trigger: pin, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, invalidateOnRefresh: true };

      const move = gsap.to(rail, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { ...scroll, pin: true, anticipatePin: 1 },
      });
      gsap.fromTo(".rail__axis-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: scroll });

      root.querySelectorAll<HTMLElement>(".rail-phase").forEach((phase) => {
        const lines = SplitText.create(phase.querySelectorAll(".rail-phase__title, .rail-phase__body"), {
          type: "lines",
          mask: "lines",
        }).lines;
        gsap
          .timeline({
            scrollTrigger: { trigger: phase, containerAnimation: move, start: "left 90%", end: "left 62%", scrub: 0.6 },
          })
          .from(phase.querySelector(".rail-phase__stem"), { scaleY: 0, ease: "none" })
          .from(phase.querySelector(".rail-phase__dot"), { scale: 0, ease: "back.out(2)" }, "<")
          .from(lines, { yPercent: 110, stagger: 0.08, ease: "power2.out" }, "<0.15");
      });

      return () => {
        delete root.dataset.rail;
      };
    });

    return () => {
      mm.revert();
      ScrollTrigger.refresh();
    };
    // El idioma cambia los textos: se vuelven a partir en líneas.
  }, [section, locale]);

  return (
    <div className="rail-pin">
      <div className="rail">
        <div className="rail__intro">
          <p className="t-label dim">{eyebrow}</p>
          <h2 className="t-display rail__title">{t.approach.title}</h2>
          <div className="rail__image">
            <img src={withBase("/brand/hero-tree-poster-1920.webp")} alt="" draggable={false} />
          </div>
        </div>
        <div className="rail__track">
          <span className="rail__axis">
            <span className="rail__axis-fill" />
          </span>
          {t.approach.items.map((item, i) => (
            <div className="rail-phase" data-side={i % 2 ? "bottom" : "top"} key={i}>
              <span className="rail-phase__stem" />
              <span className="rail-phase__dot" />
              <div className="rail-phase__copy">
                <span className="t-index rail-phase__index">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="rail-phase__title">{item.title}</h3>
                <p className="t-small rail-phase__body">{item.body}</p>
              </div>
            </div>
          ))}
          <span className="rail__end" />
        </div>
      </div>
    </div>
  );
}
