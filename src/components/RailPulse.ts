// La estrella del método (ApproachRail, en horizontal): nace en el nodo de
// la raíz, recorre el suelo y el eje entero, y al pasar por cada fase su
// nodo se enciende (un anillo que se abre y un halo) y su número brilla.
// Velocidad constante: cada fase se ilumina justo cuando la estrella llega
// a ella. Animaciones web en bucle, en pausa fuera de pantalla; se vuelven a
// medir si cambia el tamaño. Solo con movimiento (lo decide ApproachRail).

import { beatAt } from "./Trace";

/** Píxeles por segundo, pausa entre vueltas y largo de la estela. */
const SPEED = 440;
const REST = 2.2;
const TAIL = 150;

/** Anillo que se abre desde el nodo cuando llega la estrella (en fracciones del ciclo). */
function ping(at: number, fade: number): Keyframe[] {
  const off: Keyframe = { opacity: 0, transform: "scale(0.35)" };
  const end = Math.min(1, at + fade);
  const kf: Keyframe[] = [{ ...off, offset: 0 }];
  if (at > 0.002) kf.push({ ...off, offset: at - 0.002 });
  kf.push({ opacity: 1, transform: "scale(0.6)", offset: at, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  kf.push({ opacity: 0, transform: "scale(1.9)", offset: end });
  if (end < 1) kf.push({ opacity: 0, transform: "scale(1.9)", offset: 1 });
  return kf;
}

export function startRailPulse(rail: HTMLElement): () => void {
  const pulse = rail.querySelector<HTMLElement>(".rail__pulse");
  const seed = rail.querySelector<HTMLElement>(".root__seed");
  const axis = rail.querySelector<HTMLElement>(".rail__axis");
  const phases = Array.from(rail.querySelectorAll<HTMLElement>(".rail-phase"));
  if (!pulse || !seed || !axis || !phases.length) return () => {};

  let anims: Animation[] = [];
  let visible = true;
  let stopped = false;

  const build = () => {
    if (stopped) return;
    anims.forEach((a) => a.cancel());
    anims = [];
    // Todo relativo a la pista: su desplazamiento con el scroll no cuenta.
    const base = rail.getBoundingClientRect();
    const cx = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2 - base.left;
    };
    const start = cx(seed);
    const dots = phases.map((p) => cx(p.querySelector(".rail-phase__dot") ?? p));
    const end = dots[dots.length - 1] + 220;
    const run = (end - start) / SPEED;
    const cycle = run + REST;
    const opts: KeyframeAnimationOptions = { duration: cycle * 1000, iterations: Infinity };
    const x = (head: number) => `translateX(${head - TAIL}px)`;
    const fadeIn = 0.35;

    pulse.style.top = `${axis.getBoundingClientRect().top - base.top}px`;
    anims.push(
      pulse.animate(
        [
          { transform: x(start), opacity: 0, offset: 0 },
          { transform: x(start + SPEED * fadeIn), opacity: 1, offset: fadeIn / cycle },
          { transform: x(end - SPEED * 0.4), opacity: 1, offset: (run - 0.4) / cycle },
          { transform: x(end), opacity: 0, offset: run / cycle },
          { transform: x(end), opacity: 0, offset: 1 },
        ],
        opts,
      ),
    );

    phases.forEach((phase, i) => {
      const at = (dots[i] - start) / SPEED / cycle;
      const ring = phase.querySelector(".rail-phase__ring");
      const glow = phase.querySelector(".rail-phase__glow");
      const index = phase.querySelector(".rail-phase__index");
      if (ring) anims.push(ring.animate(ping(at, 1 / cycle), opts));
      if (glow) anims.push(glow.animate(beatAt(at, { opacity: 0 }, { opacity: 1 }), opts));
      if (index)
        anims.push(
          index.animate(
            beatAt(
              at,
              { filter: "brightness(1) drop-shadow(0 0 0 rgb(215 124 245 / 0))" },
              { filter: "brightness(1.6) drop-shadow(0 0 14px rgb(215 124 245 / 0.9))" },
            ),
            opts,
          ),
        );
    });
    if (!visible) anims.forEach((a) => a.pause());
  };

  let frame = 0;
  const rebuild = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(build);
  };
  rebuild();
  document.fonts?.ready.then(rebuild);
  const ro = new ResizeObserver(rebuild);
  ro.observe(rail);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    anims.forEach((a) => (visible ? a.play() : a.pause()));
  });
  io.observe(rail);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    anims.forEach((a) => a.cancel());
  };
}
