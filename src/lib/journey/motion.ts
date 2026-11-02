import { ENTER_RISE, EXIT_LIFT, type Timing } from "./config";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a || 1));

/** Factor de suavizado `f` (pensado por fotograma a 60 fps) para un paso de `dt` ms. */
export function damp(f: number, dt: number) {
  return 1 - Math.pow(1 - f, clamp(dt, 0, 100) / 16.67);
}

/** Opacidad y desplazamiento (px de diseño) de un bloque según el progreso. */
export function stateStyle(progress: number, { enter, exit }: Timing) {
  let opacity = 1;
  let y = 0;
  if (enter && progress < enter[1]) {
    const t = smoothstep(invLerp(enter[0], enter[1], progress));
    opacity = t;
    y = lerp(ENTER_RISE, 0, t);
  } else if (exit && progress > exit[0]) {
    const t = smoothstep(invLerp(exit[0], exit[1], progress));
    opacity = 1 - t;
    y = lerp(0, EXIT_LIFT, t);
  }
  return { opacity, y, visible: opacity > 0.002 };
}
