"use client";

// Entrada al hacer scroll para los bloques que no tienen la suya (las
// tarjetas de servicios, el formulario, las columnas del pie…): antes
// aparecían de golpe, como bloques pegados. Suben y se encienden
// escalonados al entrar en pantalla, y el filamento de cada antetítulo se
// dibuja. Solo se preparan los que están por debajo de la pantalla al
// llegar: lo que ya se ve no parpadea.
// Con movimiento reducido no hace nada.

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Lo que entra así. Lo que ya anima por su cuenta (WordReveal, useReveal) no está. */
const TARGETS = [
  "main .eyebrow",
  "main .services__all",
  "main .svc-cards > *",
  "main .estudio__grid > *",
  "main .section-foot",
  "main .final-cta__copy",
  "main .contact-grid__copy > *",
  "main .contact-frame",
  "main .legal__body > h2",
  "main .not-found__actions",
  ".footer__brand",
  ".footer__col",
].join(",");

const MAX_STAGGER = 6;

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let io: IntersectionObserver | null = null;
    // Un fotograma: la página nueva ya está en el DOM.
    const raf = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(TARGETS)).filter(
        (el) => !el.closest(".journey") && !el.dataset.reveal && el.getBoundingClientRect().top > window.innerHeight,
      );
      if (!els.length) return;
      io = new IntersectionObserver(
        (entries) => {
          let i = 0;
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            io?.unobserve(el);
            el.style.setProperty("--ri", String(Math.min(i++, MAX_STAGGER)));
            el.dataset.reveal = "in";
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      for (const el of els) {
        el.dataset.reveal = "wait";
        io.observe(el);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
