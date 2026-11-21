"use client";

// Raicillas de luz: las mismas raíces que la del método (MethodRoot), en
// piezas pequeñas que cuelgan de las líneas que ya hay en la web: el eje del
// método (rail y línea vertical de móvil) y el horizonte del pie, donde
// nacen de los pies de las letras de «Aterna». No están dibujadas a mano:
// las genera lib/roots.ts (haces de fibras que se abren y se ramifican) y
// las hace crecer useRoots.
//
// Cómo se encienden: las del método crecen cuando su fase se enciende
// (data-lit en el padre, lo pone la luz del eje, o en ellas mismas en la
// línea de móvil) y se recogen si se apaga; las del pie, al entrar en
// pantalla (data-in). Sin movimiento se ven ya crecidas.

import { useRef } from "react";
import type { RootSeed, Vec } from "@/lib/roots";
import { useRoots, type RootPlanner } from "./useRoots";

/** Azar fijo por índice: la misma pieza sale siempre igual. */
const noise = (seed: number) => (i: number) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Dónde tocan las letras la línea base: los pies (remates y curvas) de cada
 * letra, en px de pantalla. Cada letra se mide en su sitio real (Range) y se
 * pinta sola en un lienzo para ver qué tramos tienen tinta justo encima de
 * la base.
 */
function feet(el: HTMLElement) {
  const text = el.firstChild;
  if (!(text instanceof Text)) return [];
  const css = getComputedStyle(el);
  const size = parseFloat(css.fontSize);
  if (!size) return [];
  const W = Math.ceil(size * 1.4);
  const H = Math.ceil(size * 1.5);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.font = `${css.fontStyle} ${css.fontWeight} ${size}px ${css.fontFamily}`;
  const base = Math.round(size * 1.15);
  const pad = Math.round(size * 0.2);
  const range = document.createRange();
  const out: { x: number; w: number }[] = [];
  for (let i = 0; i < text.data.length; i++) {
    if (!text.data[i].trim()) continue;
    range.setStart(text, i);
    range.setEnd(text, i + 1);
    const left = range.getBoundingClientRect().left;
    ctx.clearRect(0, 0, W, H);
    ctx.fillText(text.data[i], pad, base);
    const row = ctx.getImageData(0, Math.round(base - size * 0.012), W, 1).data;
    let start = -1;
    for (let x = 0; x <= W; x++) {
      const ink = x < W && row[x * 4 + 3] > 96;
      if (ink && start < 0) start = x;
      else if (!ink && start >= 0) {
        out.push({ x: left + (start + x) / 2 - pad, w: x - start });
        start = -1;
      }
    }
  }
  return out;
}

const seedOf = (host: HTMLElement) => Number(host.dataset.seed) || 1;

const PLANS = {
  // Del horizonte del pie: de cada pie de las letras nace un haz (o dos,
  // uno a cada lado) que se abre bajo la palabra; se cruzan con los de las
  // letras vecinas y se apagan hacia abajo. Destellos que suben: la savia
  // que luego asciende por las letras.
  horizon: ({ h, host }) => {
    const giant = host.parentElement?.querySelector<HTMLElement>(".footer__giant");
    if (!giant) return null;
    const size = parseFloat(getComputedStyle(giant).fontSize) || 200;
    // Todo a la medida de la palabra: en móvil, menos fibras y más cortas.
    const k = size / 533;
    const deep = Math.max(56, size * 0.3);
    const thin = 0.45 + 0.55 * Math.min(1, k);
    const left = host.getBoundingClientRect().left;
    const R = noise(seedOf(host));
    const seeds: RootSeed[] = [];
    const steps = feet(giant);
    steps.forEach((f, n) => {
      const x = f.x - left;
      const total = Math.max(3, Math.min(11, Math.round((f.w / size) * 85 * thin)));
      const reach = () => deep * (0.95 + R(n + 2 + seeds.length) * 0.9);
      if (f.w < size * 0.06) {
        // Curvas que apenas tocan la base («e», panza de la «a»): poca raíz.
        seeds.push({ at: [x, 0], angle: 90 + (R(n + 7) - 0.5) * 34, strands: Math.max(2, Math.round(total * 0.5)), length: deep * (0.55 + R(n + 8) * 0.35), flare: 30, open: 0.4, offset: n * 5 });
      } else {
        // Un haz por pie, que se abre a un lado y se parte más abajo (en Y,
        // no en «∧»); a veces, otro más fino y más atrás hacia el otro lado.
        const lean = R(n + 11) < 0.5 ? -1 : 1;
        const tilt = 0.4 + 0.6 * Math.min(1, k * 1.6);
        const length = reach();
        seeds.push({ at: [x, 0], angle: 90 - lean * (4 + R(n + 1) * 28) * tilt, strands: total, length, flare: (30 + R(n + 3) * 35) * tilt, open: 0.45, offset: n * 5 });
        if (R(n + 21) < 0.45 && total > 4) {
          seeds.push({ at: [x - lean * f.w * 0.12, 0], angle: 90 + lean * (14 + R(n + 4) * 26) * tilt, strands: 2 + Math.round(R(n + 5)), length: length * (0.45 + R(n + 6) * 0.35), flare: 30 * tilt, open: 0.3, offset: n * 5 + 14, depth: 0.35 });
        }
      }
    });
    // Raicillas finas junto a algunos pies, como pelos de la raíz. Sueltas
    // entre letra y letra parecían trazos perdidos.
    steps.forEach((f, n) => {
      if (R(n + 31) < 0.4) return;
      const side = R(n + 32) < 0.5 ? -1 : 1;
      seeds.push({
        at: [f.x - left + side * (f.w * 0.5 + size * (0.01 + R(n + 33) * 0.03)), 0],
        angle: 90 + side * (6 + R(n + 34) * 22),
        strands: 1,
        length: deep * (0.22 + R(n + 35) * 0.25),
        offset: n * 5 + 20,
        depth: 0.45 + R(n + 36) * 0.25,
      });
    });
    // Se apagan antes del fondo de la caja (y del filete del pie).
    return { field: { seed: seedOf(host), seeds, scale: Math.max(0.6, k) }, ink: { fade: Math.min(h, deep) * 0.86 }, sparks: "up" };
  },
  // Cuelga del eje, bajo el nodo de una fase de arriba, y se abre hacia el
  // hueco de la derecha (a la izquierda está el texto de la fase anterior).
  hang: ({ w, h, host }) => {
    const R = noise(seedOf(host));
    const o: Vec = [40, 0];
    return {
      field: {
        seed: seedOf(host),
        walls: [6, w],
        seeds: [
          { at: o, angle: 70 + R(1) * 12, strands: 8, length: h * (0.85 + R(2) * 0.2), flare: 30 + R(3) * 14 },
          { at: o, angle: 112 + R(4) * 10, strands: 3, length: h * 0.42, flare: 22, offset: 8, depth: 0.25 },
        ],
      },
      ink: { fade: h * 0.95 },
    };
  },
  // Donde acaba el eje, la línea echa raíces: sobre todo hacia la derecha y
  // hacia abajo; a la izquierda, poco (ahí está el texto de la última fase).
  fan: ({ w, h, host }) => {
    const o: Vec = [60, 0];
    return {
      field: {
        seed: seedOf(host),
        walls: [20, w],
        seeds: [
          { at: o, angle: 58, strands: 7, length: h * 1.05, flare: 48 },
          { at: o, angle: 90, strands: 5, length: h * 0.85, flare: 18, offset: 6 },
          { at: o, angle: 128, strands: 2, length: h * 0.32, flare: 30, offset: 12, depth: 0.3 },
        ],
      },
      ink: { fade: h },
    };
  },
  // Sale de la línea vertical (móvil) hacia el hueco entre fases.
  side: ({ w, h, host }) => ({
    field: {
      seed: seedOf(host),
      walls: [2, w],
      seeds: [
        { at: [3, 0], angle: 66, strands: 4, length: h * 1.05, flare: 30, open: 0.3 },
        { at: [3, h * 0.18], angle: 76, strands: 1, length: h * 0.5, offset: 12, depth: 0.3 },
      ],
    },
    ink: { fade: h },
  }),
  // Donde acaba la línea vertical (móvil): echa raíces, más hacia dentro
  // porque la línea va pegada al borde de la pantalla.
  tail: ({ w, h, host }) => ({
    field: {
      seed: seedOf(host),
      walls: [4, w],
      seeds: [
        { at: [20, 0], angle: 84, strands: 5, length: h * 1.05, flare: 20 },
        { at: [20, 0], angle: 60, strands: 4, length: h * 0.9, flare: 40, offset: 5 },
        { at: [20, 0], angle: 118, strands: 2, length: h * 0.5, flare: 24, offset: 9, depth: 0.3 },
      ],
    },
    ink: { fade: h },
  }),
} satisfies Record<string, RootPlanner>;

export type RootletShape = keyof typeof PLANS;

export function Rootlets({
  shape,
  className,
  trigger = "view",
  seed = 1,
}: {
  shape: RootletShape;
  className?: string;
  /** "view": crece al entrar en pantalla. "lit": cuando él o su padre llevan data-lit="true". */
  trigger?: "view" | "lit";
  /** Cada pieza con su semilla, para que dos iguales no salgan idénticas. */
  seed?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useRoots(ref, { plan: PLANS[shape], trigger, duration: shape === "horizon" ? 3 : 2, text: shape === "horizon" });

  return (
    <span ref={ref} className={`rootlets${className ? ` ${className}` : ""}`} data-shape={shape} data-seed={seed} aria-hidden="true">
      <canvas className="rootlets__layer rootlets__layer--back" data-layer="back" />
      <canvas className="rootlets__layer rootlets__layer--glow" data-layer="glow" />
      <canvas className="rootlets__layer rootlets__layer--front" data-layer="front" />
      {shape === "horizon" ? <canvas className="rootlets__layer rootlets__layer--spark" data-layer="spark" /> : null}
    </span>
  );
}
