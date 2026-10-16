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

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
  delay?: number;
  /** false: anima al montar (hero). true: anima al entrar en pantalla. */
  onScroll?: boolean;
};

/** Titular que aparece palabra a palabra. `\n` en el texto = salto de línea. */
export function WordReveal({ text, as = "h2", className, id, delay = 0, onScroll = true }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll("[data-word] > span");
    if (!words.length || prefersReducedMotion()) return;
    registerGsap();
    gsap.set(words, { yPercent: 110, opacity: 0 });
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
    if (onScroll) {
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
      io?.disconnect();
      tween?.kill();
      gsap.set(words, { clearProps: "transform,opacity,willChange" });
    };
  }, [text, delay, onScroll]);

  return createElement(
    as,
    { ref, className, id },
    text.split("\n").map((line, li) => {
      const words = line.split(" ");
      return (
        <span key={li} className="reveal-line">
          {words.map((w, wi) => (
            <span key={wi}>
              <span className="reveal-word" data-word>
                <span>{w}</span>
              </span>
              {wi < words.length - 1 ? " " : null}
            </span>
          ))}
        </span>
      );
    }),
  );
}
