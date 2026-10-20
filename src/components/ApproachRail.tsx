"use client";

// «Cómo trabajamos» en horizontal (adaptado del Timeline de Hyperiux Vault).
// Al llegar, la sección se fija y, mientras se baja, la pista se desliza a
// la izquierda: primero el titular sobre su raíz de luz, luego las cuatro
// fases, alternando arriba y abajo de un eje que se dibuja con el scroll.
// Cuando cada fase entra, crece su tallo, se enciende su nodo y su texto
// sube línea a línea (SplitText). Sin fechas: son las fases del método.
// La línea del suelo de la raíz cruza el hueco y empalma con el eje: la raíz
// y el método son la misma línea (MethodRoot). La luz del eje avanza con el
// scroll y lleva una cabeza encendida: cuando llega al nodo de una fase, la
// fase se enciende (data-lit: número, halo y anillo) y se apaga si se vuelve
// atrás. Cada fase que ya ha entrado
// lleva data-on, como las de la línea estática.
//
// Desde 768 px (en móvil, la línea vertical se lee mejor). Es el contenido real cuando está activa (la línea normal se oculta), así
// que no va con aria-hidden. Solo con movimiento: hasta que se activa
// (data-rail="on" en la sección)
// está oculta y se ve la línea normal de Approach, que es también la de
// movimiento reducido. Se usa una vez, en la portada.

import Link from "next/link";
import { useEffect, type RefObject } from "react";
import { SplitText } from "gsap/SplitText";
import { useI18n } from "@/lib/i18n";
import { ScrollTrigger, gsap, registerGsap } from "@/lib/motion";
import { ArrowRight } from "./icons";
import { MethodRoot } from "./MethodRoot";
import { Rootlets } from "./Rootlets";

export function ApproachRail({ section, eyebrow }: { section: RefObject<HTMLElement | null>; eyebrow: string }) {
  const { t, locale } = useI18n();
  const ctas: Record<string, string> = Object.fromEntries(t.servicePages.index.cards.map((card) => [card.slug, card.cta]));

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
      // La luz del eje y su cabeza. Con el progreso real de la luz (ya
      // suavizado por el scrub) se decide qué fases ha alcanzado.
      const axis = rail.querySelector<HTMLElement>(".rail__axis");
      const head = rail.querySelector<HTMLElement>(".rail__axis-head");
      const railPhases = Array.from(root.querySelectorAll<HTMLElement>(".rail-phase"));
      const end = rail.querySelector<HTMLElement>(".rail__end");
      gsap.fromTo(
        ".rail__axis-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: scroll,
          onUpdate() {
            const width = axis?.offsetWidth ?? 0;
            const tip = this.progress() * width;
            if (head) {
              head.style.transform = `translateX(${tip}px)`;
              head.style.opacity = this.progress() > 0.001 && this.progress() < 0.999 ? "1" : "0";
            }
            // El nodo de cada fase está en su borde izquierdo (left: 0 en la pista).
            railPhases.forEach((phase) => {
              const lit = tip >= phase.offsetLeft - 1;
              if ((phase.dataset.lit === "true") !== lit) phase.dataset.lit = String(lit);
            });
            // Al final del eje, la línea echa raíces.
            if (end) {
              const lit = this.progress() > 0.985;
              if ((end.dataset.lit === "true") !== lit) end.dataset.lit = String(lit);
            }
          },
        },
      );

      root.querySelectorAll<HTMLElement>(".rail-phase").forEach((phase) => {
        const lines = SplitText.create(phase.querySelectorAll(".rail-phase__title, .rail-phase__body"), {
          type: "lines",
          mask: "lines",
        }).lines;
        const link = phase.querySelector(".rail-phase__link");
        const tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: phase,
              containerAnimation: move,
              start: "left 90%",
              end: "left 62%",
              scrub: 0.6,
              onEnter: () => phase.setAttribute("data-on", "true"),
              onLeaveBack: () => phase.setAttribute("data-on", "false"),
            },
          })
          .from(phase.querySelector(".rail-phase__stem"), { scaleY: 0, ease: "none" })
          .from(phase.querySelector(".rail-phase__dot"), { scale: 0, ease: "back.out(2)" }, "<")
          // El número sale con su fase: antes asomaba solo, sin tallo ni texto.
          .from(phase.querySelector(".rail-phase__index"), { autoAlpha: 0, yPercent: 30, ease: "power2.out" }, "<0.1")
          .from(lines, { yPercent: 110, stagger: 0.08, ease: "power2.out" }, "<0.15");
        if (link) tl.from(link, { autoAlpha: 0, y: 8, ease: "power2.out" }, ">-0.1");
      });

      return () => {
        delete root.dataset.rail;
        root.querySelectorAll(".rail-phase").forEach((phase) => {
          phase.setAttribute("data-on", "false");
          phase.setAttribute("data-lit", "false");
        });
        end?.setAttribute("data-lit", "false");
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
          <div className="rail__head">
            <p className="t-label dim">{eyebrow}</p>
            <h2 className="t-display rail__title">{t.approach.title}</h2>
          </div>
          <MethodRoot variant="rail" />
        </div>
        <div className="rail__track">
          <span className="rail__axis">
            <span className="rail__axis-fill" />
            <span className="rail__axis-head" />
          </span>
          {t.approach.items.map((item, i) => (
            <div className="rail-phase" data-side={i % 2 ? "bottom" : "top"} data-on="false" data-lit="false" key={i}>
              <span className="rail-phase__stem" />
              <span className="rail-phase__glow" aria-hidden="true" />
              <span className="rail-phase__dot" />
              <span className="rail-phase__ring" aria-hidden="true" />
              {/* Bajo el eje, donde la fase no tiene texto, cuelgan raíces. */}
              {i % 2 ? null : <Rootlets shape="hang" trigger="lit" className="rail-phase__roots" />}
              <div className="rail-phase__copy">
                <span className="rail-phase__index">{String(i + 1).padStart(2, "0")}</span>
                {/* SplitText reescribe el contenido de estos dos por debajo
                    de React: al cambiar de idioma React actualizaba nodos
                    que ya no estaban en la página y, al deshacer el corte,
                    volvía el texto anterior (idiomas mezclados). Con la
                    clave del idioma se montan de nuevo y se vuelven a partir. */}
                <h3 className="rail-phase__title" key={`t-${locale}`}>
                  {item.title}
                </h3>
                <p className="t-small rail-phase__body" key={`b-${locale}`}>
                  {item.body}
                </p>
                {item.service ? (
                  <Link href={`/servicios/${item.service}`} className="link-cta rail-phase__link">
                    {ctas[item.service]}
                    <ArrowRight />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
          <span className="rail__end" data-lit="false">
            <Rootlets shape="fan" trigger="lit" className="rail__end-roots" />
          </span>
        </div>
      </div>
    </div>
  );
}
