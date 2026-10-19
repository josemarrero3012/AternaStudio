"use client";

// El hilo de «Qué pasa después»: une los tres iconos (sobre, bocadillo y
// documento) en una sola línea y hace correr por ella un pulso de luz, sin
// parar. Cuando el pulso llega a un icono se encienden su nodo y su número.
// En fila (pantallas anchas) el hilo sale de cada icono y entra en el
// siguiente; en columna (móvil o columnas estrechas) baja por la izquierda y
// entra en cada icono, como la línea de «Cómo trabajamos». La geometría se
// mide en el navegador y se rehace si cambia el tamaño. Con movimiento
// reducido solo se dibuja el hilo, sin pulso.

import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { STEP_PORTS } from "./glyphs";
import { beatAt, travel } from "./Trace";

const NS = "http://www.w3.org/2000/svg";
/** Velocidad del pulso (px/s) y pausa al acabar cada vuelta (s). */
const SPEED = 240;
const REST = 1.6;
/** Largo del pulso y margen para que su punta redonda no asome (px). */
const DASH = 56;
const PAD = 6;

type Segment = { x1: number; y1: number; x2: number; y2: number };
type Run = Segment & { t: number };

function add<K extends keyof SVGElementTagNameMap>(parent: Element, tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent.appendChild(node);
  return node;
}

const pathOf = ({ x1, y1, x2, y2 }: Segment) => `M${x1} ${y1} L${x2} ${y2}`;

/** Dibuja el hilo y, si `moving`, crea las animaciones del pulso y los latidos. */
function build(root: HTMLElement, wire: SVGSVGElement, id: string, moving: boolean): Animation[] {
  wire.replaceChildren();
  const box = root.getBoundingClientRect();
  if (!box.width) return [];
  wire.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

  const pts = Array.from(root.querySelectorAll<HTMLElement>(".next-step")).flatMap((li, i) => {
    const icon = li.querySelector("svg.trace");
    const port = STEP_PORTS[i];
    if (!icon || !port) return [];
    const g = icon.getBoundingClientRect();
    const s = g.width / 96;
    return [{ li, port, s, x: g.left - box.left, y: g.top - box.top + 20 * s }];
  });
  if (pts.length < 2) return [];

  const row = pts.every((p) => Math.abs(p.y - pts[0].y) < 2);
  const wires: Segment[] = [];
  const runs: Run[] = [];
  const beats: { li: HTMLElement; t: number }[] = [];

  if (row) {
    // Del inicio del primer icono al último: el pulso recorre cada tramo y
    // «atraviesa» cada icono (ahí no se ve) al mismo ritmo.
    let x = pts[0].x;
    let t = 0;
    pts.forEach((p, i) => {
      const enter = p.x + p.port.in * p.s;
      if (i > 0) wires.push({ x1: x, y1: p.y, x2: p.x, y2: p.y });
      runs.push({ x1: x, y1: p.y, x2: enter, y2: p.y, t });
      t += (enter - x) / SPEED;
      beats.push({ li: p.li, t: t + ((p.port.node - p.port.in) * p.s) / SPEED });
      x = p.x + p.port.out * p.s;
      t += (x - enter) / SPEED;
    });
  } else {
    // Columna: el hilo baja por la izquierda y cada icono sale de él.
    const x = pts[0].x;
    const top = pts[0].y;
    const spine = { x1: x, y1: top, x2: x, y2: pts[pts.length - 1].y };
    wires.push(spine);
    runs.push({ ...spine, t: 0 });
    for (const p of pts) {
      const t = (p.y - top) / SPEED;
      const enter = p.x + p.port.in * p.s;
      runs.push({ x1: x, y1: p.y, x2: enter, y2: p.y, t });
      beats.push({ li: p.li, t: t + (enter - x + (p.port.node - p.port.in) * p.s) / SPEED });
    }
  }

  // El hilo: en fila, cada tramo sale encendido del icono anterior y se
  // apaga al llegar al siguiente, como los propios iconos.
  const defs = add(wire, "defs", {});
  wires.forEach((w, i) => {
    let stroke = "currentColor";
    if (row) {
      const grad = add(defs, "linearGradient", { id: `${id}-${i}`, gradientUnits: "userSpaceOnUse", ...w });
      add(grad, "stop", { offset: 0, class: "next-steps__wire-from" });
      add(grad, "stop", { offset: 1, class: "next-steps__wire-to" });
      stroke = `url(#${id}-${i})`;
    }
    add(wire, "path", { d: pathOf(w), class: "next-steps__wire-halo", stroke });
    add(wire, "path", { d: pathOf(w), class: "next-steps__wire-line", stroke });
  });
  if (!moving || !beats.length) return [];

  const cycle = Math.max(...beats.map((b) => b.t)) + REST;
  const opts: KeyframeAnimationOptions = { duration: cycle * 1000, iterations: Infinity };
  const anims: Animation[] = [];

  for (const r of runs) {
    const length = Math.hypot(r.x2 - r.x1, r.y2 - r.y1);
    if (length < 1) continue;
    const from = Math.max(0, r.t - PAD / SPEED) / cycle;
    const to = (r.t + length / SPEED) / cycle;
    const kf = travel(DASH, length, PAD, from, to);
    for (const cls of ["next-steps__pulse-halo", "next-steps__pulse-core"]) {
      const path = add(wire, "path", { d: pathOf(r), class: cls });
      path.style.strokeDasharray = `${DASH} ${length + DASH + 2 * PAD}`;
      path.style.strokeDashoffset = String(DASH + PAD);
      anims.push(path.animate(kf, opts));
    }
  }

  const css = getComputedStyle(root);
  const lit = css.getPropertyValue("--orchid").trim() || "#d77cf5";
  const dim = css.getPropertyValue("--text-low").trim() || "#a3a7c6";
  const one: Keyframe = { transform: "scale(1)" };
  for (const { li, t } of beats) {
    const at = t / cycle;
    const glow = li.querySelector(".trace__glow");
    const core = li.querySelector(".trace__node");
    const index = li.querySelector(".next-step__index");
    if (glow) anims.push(glow.animate(beatAt(at, one, { transform: "scale(1.9)" }), opts));
    if (core) anims.push(core.animate(beatAt(at, one, { transform: "scale(1.4)" }), opts));
    if (index) {
      anims.push(
        index.animate(
          beatAt(at, { color: dim, textShadow: "0 0 0 transparent" }, { color: lit, textShadow: `0 0 14px ${lit}` }),
          opts,
        ),
      );
    }
  }
  return anims;
}

/** Tiende el hilo dentro de `ref` (que contiene la lista y el SVG `.next-steps__wire`). */
export function useStepWire(ref: RefObject<HTMLElement | null>, id: string) {
  useEffect(() => {
    const root = ref.current;
    const wire = root?.querySelector<SVGSVGElement>(".next-steps__wire");
    if (!root || !wire) return;
    const still = prefersReducedMotion();
    let anims: Animation[] = [];
    let on = false;
    let visible = false;
    let timer: number | undefined;
    let frame = 0;

    const render = () => {
      anims.forEach((a) => a.cancel());
      anims = build(root, wire, id, !still);
      if (!visible) anims.forEach((a) => a.pause());
    };
    // El hilo se tiende cuando los iconos ya están dibujados (Trace.tsx).
    const start = () => {
      if (!still && root.querySelector('svg.trace:not([data-draw="on"])')) {
        timer = window.setTimeout(start, 500);
        return;
      }
      root.dataset.wire = "on";
      if (!still) root.dataset.flow = "on";
      render();
    };
    const view = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        visible = e.isIntersecting;
        if (visible && !on && e.intersectionRatio >= 0.25) {
          on = true;
          timer = window.setTimeout(start, still ? 0 : 2600);
        }
        anims.forEach((a) => (visible ? a.play() : a.pause()));
      },
      { threshold: [0, 0.25] },
    );
    const resize = new ResizeObserver(() => {
      if (!root.dataset.wire) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    });
    view.observe(root);
    resize.observe(root);
    return () => {
      view.disconnect();
      resize.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      anims.forEach((a) => a.cancel());
    };
  }, [ref, id]);
}
