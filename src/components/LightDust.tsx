"use client";

// Polvo de luz: las partículas del árbol de la portada siguen flotando por
// toda la web. Una sola capa fija, por encima de las secciones (en modo
// «screen»: sobre el texto blanco no se nota, sobre la noche y el violeta
// de las tarjetas brilla), así que pasa de una sección a otra sin cortes y
// las cose entre sí. Suben despacio, como savia; con el scroll se desplazan
// a distinta velocidad según su profundidad (paralaje) y cerca del puntero
// brillan más, sin moverse, como el árbol. En la portada aparecen cuando
// termina el recorrido. Con movimiento reducido, un solo fotograma quieto.

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/motion";

// Paleta del vídeo: lavanda, orquídea, violeta y la luz casi blanca.
const COLORS = ["#b3bcff", "#d77cf5", "#9a5cf0", "#eef0fa"];
const WEIGHTS = [0.38, 0.22, 0.15, 0.25];
const SPRITE = 64; // px del halo pregenerado de cada color
const AREA_PER_DOT = 8000; // px² de ventana por partícula
const MIN_DOTS = 50;
const MAX_DOTS = 220;
const POINTER_R = 160; // px: radio del brillo del puntero

type Dot = {
  x: number;
  y: number;
  z: number; // profundidad 0,25 (lejos) … 1 (cerca)
  r: number; // radio del núcleo, px
  c: number; // índice de color
  a: number; // opacidad base
  vy: number; // px/s hacia arriba
  sway: number; // amplitud del vaivén lateral, px
  phase: number;
  tw: number; // velocidad del titileo
  glow: number; // brillo del puntero, suavizado
};

function pickColor() {
  let r = Math.random();
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

function makeSprites() {
  return COLORS.map((color) => {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE;
    const g = c.getContext("2d")!;
    const h = SPRITE / 2;
    const grad = g.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.12, color);
    grad.addColorStop(0.35, `${color}55`);
    grad.addColorStop(1, `${color}00`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    return c;
  });
}

function makeDot(w: number, h: number, anywhere: boolean): Dot {
  const z = 0.25 + Math.random() * 0.75;
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    z,
    r: (0.35 + Math.random() * 0.9) * (0.6 + z * 0.8),
    c: pickColor(),
    a: (0.22 + Math.random() * 0.45) * (0.5 + z * 0.5),
    vy: (3 + Math.random() * 9) * (0.5 + z * 0.7),
    sway: 4 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    tw: 0.4 + Math.random() * 1.2,
    glow: 0,
  };
}

export function LightDust() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  // La portada cambia de forma (el recorrido): se vuelve a medir al navegar.
  const journey = useRef<HTMLElement | null>(null);

  useEffect(() => {
    journey.current = document.querySelector<HTMLElement>(".journey");
  }, [pathname]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = prefersReducedMotion();
    const sprites = makeSprites();
    const pointer = { x: -9999, y: -9999, on: false };
    const dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let lastScroll = window.scrollY;
    let shown = 0; // fundido de la capa (0 durante el recorrido de la portada)

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const target = Math.max(MIN_DOTS, Math.min(MAX_DOTS, Math.round((w * h) / AREA_PER_DOT)));
      while (dots.length < target) dots.push(makeDot(w, h, true));
      dots.length = target;
    };

    // Durante el recorrido de la portada la capa no se ve: entra cuando el
    // escenario fijado empieza a irse por arriba.
    const visibility = () => {
      const j = journey.current;
      if (!j || !j.isConnected) return 1;
      const b = j.getBoundingClientRect().bottom;
      return Math.max(0, Math.min(1, 1 - (b - h * 0.35) / (h * 0.65)));
    };

    const draw = (t: number, dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (shown <= 0.002) return;
      ctx.globalCompositeOperation = "lighter";
      for (const d of dots) {
        if (pointer.on) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / POINTER_R);
          d.glow += (near - d.glow) * Math.min(1, dt * 6);
        } else {
          d.glow *= Math.max(0, 1 - dt * 3);
        }
        const twinkle = 0.65 + 0.35 * Math.sin(t * d.tw + d.phase);
        const alpha = Math.min(1, (d.a * twinkle + d.glow * 0.55 * d.z) * shown);
        if (alpha < 0.01) continue;
        const x = d.x + Math.sin(t * 0.25 + d.phase) * d.sway;
        // Núcleo pequeño con su halo: el sprite mide ~8 veces el núcleo.
        const size = d.r * (8 + d.glow * 6);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[d.c], x - size / 2, d.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const scroll = window.scrollY;
      const ds = scroll - lastScroll;
      lastScroll = scroll;
      shown += (visibility() - shown) * Math.min(1, dt * 4);
      for (const d of dots) {
        // Paralaje: las cercanas acompañan más al contenido que las lejanas.
        d.y -= d.vy * dt + ds * (0.12 + d.z * 0.38);
        if (d.y < -20) {
          Object.assign(d, makeDot(w, h, false), { y: h + 20 });
        } else if (d.y > h + 40) {
          Object.assign(d, makeDot(w, h, false), { y: -20 });
        }
      }
      draw(now / 1000, dt);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = e.pointerType === "mouse";
    };
    const onLeave = () => {
      pointer.on = false;
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        lastScroll = window.scrollY;
        raf = requestAnimationFrame(step);
      }
    };

    resize();
    if (reduced) {
      const redraw = () => {
        shown = visibility();
        draw(0, 0);
      };
      const onResize = () => {
        resize();
        redraw();
      };
      redraw();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", redraw, { passive: true });
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", redraw);
      };
    }

    window.addEventListener("resize", resize);
    if (!isCoarsePointer()) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="light-dust" aria-hidden="true" />;
}
