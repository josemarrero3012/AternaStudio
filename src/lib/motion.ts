import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const DURATION = { micro: 0.2, std: 0.45, cine: 0.9, page: 1.2 };
export const STAGGER = { word: 0.04, line: 0.09, item: 0.12 };

/** Equivalente en GSAP de la curva de marca cubic-bezier(0.16, 1, 0.3, 1). */
export const ATERNA_EASE = "expo.out";

let registered = false;
export function registerGsap() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out" });
  registered = true;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export { gsap, ScrollTrigger };
