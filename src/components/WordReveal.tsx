"use client";

import { createElement, useEffect, useRef } from "react";
import {
  ATERNA_EASE,
  DURATION,
  STAGGER,
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/motion";
import { onIntro } from "@/lib/intro";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
  delay?: number;
  /**
   * true: anima al entrar en pantalla. false: al montar. "intro": cuando
   * empieza la entrada de la portada (lib/intro.ts), y `delay` cuenta desde ahí.
   */
  onScroll?: boolean | "intro";
  /** Cuántas palabras finales llevan el degradado de marca. */
  accent?: number;
};

/** Titular que aparece palabra a palabra. `\n` en el texto = salto de línea. */
export function WordReveal({ text, as = "h2", className, id, delay = 0, onScroll = true, accent = 0 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll("[data-word] > span");
    if (!words.length || prefersReducedMotion()) return;
    registerGsap();
    // y: 0 explícito: el hero viene ya oculto por CSS (ver globals.css) y
    // GSAP, al leer ese transform, lo guardaría como desplazamiento en px.
    gsap.set(words, { y: 0, yPercent: 110, opacity: 0 });
    let tween: gsap.core.Tween | null = null;
    const play = () => {
      tween = gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        duration: DURATION.cine,
        ease: ATERNA_EASE,
        stagger: STAGGER.word,
        delay,
        clearProps: "willChange",
      });
    };
    let io: IntersectionObserver | null = null;
    let off = () => {};
    if (onScroll === "intro") {
      off = onIntro(play);
    } else if (onScroll) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            play();
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      io.observe(el);
    } else {
      play();
    }
    return () => {
      off();
      io?.disconnect();
      tween?.kill();
      gsap.set(words, { clearProps: "transform,opacity,willChange" });
    };
  }, [text, delay, onScroll]);

  const lines = text.split("\n").map((line) => line.split(" "));
  const total = lines.reduce((n, l) => n + l.length, 0);
  let count = 0;
  return createElement(
    as,
    { ref, className, id },
    lines.map((words, li) => {
      return (
        <span key={li} className="reveal-line">
          {words.map((w, wi) => (
            <span key={wi}>
              <span className="reveal-word" data-word>
                <span className={++count > total - accent ? "reveal-word--accent" : undefined}>{w}</span>
              </span>
              {wi < words.length - 1 ? " " : null}
            </span>
          ))}
        </span>
      );
    }),
  );
}
