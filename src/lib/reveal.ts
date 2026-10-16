"use client";

import { useEffect, useRef } from "react";
import {
  ATERNA_EASE,
  DURATION,
  STAGGER,
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "./motion";

type Options = {
  selector?: string;
  threshold?: number;
  y?: number;
  stagger?: number;
  delay?: number;
};

/** Aparición escalonada de los hijos (`selector`) al entrar en pantalla. */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  selector,
  threshold = 0.15,
  y = 32,
  stagger = STAGGER.item,
  delay = 0,
}: Options = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    registerGsap();
    const targets = selector ? Array.from(root.querySelectorAll(selector)) : [root];
    if (!targets.length) return;
    gsap.set(targets, { y, opacity: 0 });
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        tween = gsap.to(targets, {
          y: 0,
          opacity: 1,
          duration: 0.67 * DURATION.cine,
          ease: ATERNA_EASE,
          stagger,
          delay,
          clearProps: "willChange",
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      tween?.kill();
      gsap.set(targets, { clearProps: "transform,opacity,willChange" });
    };
  }, [selector, threshold, y, stagger, delay]);

  return ref;
}
