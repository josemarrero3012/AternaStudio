"use client";

// Lienzos de una raíz de luz (lib/roots.ts): los dimensiona, pide la raíz
// para su tamaño, la hace crecer cuando toca y, ya crecida, le pasa de vez
// en cuando un destello por alguna fibra, como la savia del árbol del vídeo.
//
// - Crece al entrar en pantalla (trigger "view", deja data-in) o cuando él o
//   su padre llevan data-lit="true" (trigger "lit"); si se apaga, se recoge.
// - Sin movimiento: entera desde el principio y sin destellos.
// - No se genera al cargar la página, sino al acercarse a la pantalla (a una
//   pantalla de distancia): el pie, por ejemplo, queda lejos. Se vuelve a
//   generar si cambia su tamaño (y al cargar la fuente, si depende del texto,
//   como el pie, que mide las letras). Oculta (display: none), no hace nada.
// - Los destellos solo corren mientras se ve, y paran fuera de pantalla.

import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { growEase, growRoots, paintGlow, paintRoots, type RootField, type RootInk, type RootSystem, type Strand } from "@/lib/roots";

export type RootPlan = {
  field: RootField;
  ink: RootInk;
  /** Destellos por las fibras ya crecidas: bajando desde el suelo o subiendo hacia él. */
  sparks?: "down" | "up";
};

export type RootPlanner = (box: { w: number; h: number; host: HTMLElement }) => RootPlan | null;

type Options = {
  plan: RootPlanner;
  trigger: "view" | "lit";
  /** Segundos que tarda en crecer entera. */
  duration?: number;
  /** Se llama con cada raíz generada (para colocar etiquetas, retrasos…). */
  onGrow?: (sys: RootSystem, host: HTMLElement, duration: number) => void;
  /** La raíz depende de cómo cae el texto: se rehace al cargar la fuente. */
  text?: boolean;
};

type Spark = { st: Strand; start: number; time: number };

/** Lo que tarda en recogerse al apagarse (s). */
const RETRACT = 0.45;

export function useRoots(ref: RefObject<HTMLElement | null>, { plan, trigger, duration = 2.4, onGrow, text = false }: Options) {
  useEffect(() => {
    const host = ref.current;
    const front = host?.querySelector<HTMLCanvasElement>("canvas[data-layer='front']");
    const fctx = front?.getContext("2d");
    if (!host || !front || !fctx) return;
    const layer = (name: string) => host.querySelector<HTMLCanvasElement>(`canvas[data-layer='${name}']`)?.getContext("2d") ?? null;
    const bctx = layer("back");
    const gctx = layer("glow");
    const sctx = layer("spark");
    const still = prefersReducedMotion();
    if (!still) host.dataset.anim = "";

    let sys: RootSystem | null = null;
    let ink: RootInk = { fade: 1 };
    let sparkDir: RootPlan["sparks"];
    let size = { w: 0, h: 0, dpr: 1 };
    // Px de cada lienzo por px CSS. El del fondo y el del halo van a menos
    // resolución: al ampliarlos, el navegador los suaviza (desenfoque sin
    // filtros CSS, que se recalcularían en cada fotograma).
    const scale = new Map<CanvasRenderingContext2D, number>();
    // Lienzos de trabajo del halo (paintGlow), a 1/4 y 1/8 px por px CSS.
    const chain = [0.25, 0.125].flatMap((f) => {
      const ctx = document.createElement("canvas").getContext("2d");
      return ctx ? [{ f, ctx }] : [];
    });
    let progress = still ? 1 : 0;
    let target = progress;
    let raf = 0;
    let last = 0;
    let inView = false;
    let sparks: Spark[] = [];
    let nextSpark = 0;
    let sparkDirty = false;
    // Cerca de la pantalla (ver el observador `pre`) y pendiente de generar.
    let near = false;
    let stale = true;

    const colors = () => {
      const css = getComputedStyle(host);
      const get = (name: string) => css.getPropertyValue(name).trim() || undefined;
      return { orchid: get("--orchid"), violet: get("--violet"), indigo: get("--indigo"), lavender: get("--lavender") };
    };

    const clear = (ctx: CanvasRenderingContext2D | null) => {
      if (!ctx) return;
      const s = scale.get(ctx) ?? size.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
    };

    let frame = 0;
    const paint = (all = false) => {
      clear(fctx);
      clear(bctx);
      if (!sys || progress <= 0) {
        clear(gctx);
        return;
      }
      const grown = progress >= 1 ? Infinity : sys.reach * growEase(progress);
      paintRoots(fctx, bctx, sys, grown, ink);
      // El halo es difuso y aguanta un par de fotogramas de retraso: mientras
      // crece (o se recoge) se repinta uno de cada tres.
      if (!gctx || !(all || progress >= 1 || ++frame % 3 === 0)) return;
      clear(gctx);
      paintGlow(gctx, chain.map((c) => c.ctx), sys, grown, ink, ink.violet ?? "#9a5cf0");
    };

    const build = () => {
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (!w || !h) return;
      stale = false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (sys && w === size.w && h === size.h && dpr === size.dpr) return;
      size = { w, h, dpr };
      const layers: [CanvasRenderingContext2D | null, number][] = [
        [fctx, dpr],
        [bctx, dpr * 0.5],
        [gctx, 0.5],
        [sctx, dpr],
        ...chain.map((c): [CanvasRenderingContext2D, number] => [c.ctx, c.f]),
      ];
      for (const [ctx, s] of layers) {
        if (!ctx) continue;
        ctx.canvas.width = Math.max(1, Math.round(w * s));
        ctx.canvas.height = Math.max(1, Math.round(h * s));
        scale.set(ctx, s);
      }
      const p = plan({ w, h, host });
      sys = p ? growRoots(p.field) : null;
      // En pantallas de densidad 1 una fibra de 0,7 px se ve rota: un poco más gruesa.
      ink = p ? { ...colors(), weight: dpr < 1.5 ? 1.3 : 1, ...p.ink } : ink;
      sparkDir = p?.sparks;
      sparks = [];
      clear(sctx);
      if (sys) onGrow?.(sys, host, duration);
      paint(true);
      kick();
    };

    /* Destellos --------------------------------------------------------- */

    const sparking = () => !still && !!sparkDir && !!sctx && !!sys && inView && progress >= 1;

    const pickStrand = () => {
      const list = sys?.strands.filter((st) => st.c1 - st.c0 > 40 && st.depth < 0.5) ?? [];
      if (!list.length) return null;
      const total = list.reduce((acc, st) => acc + (st.c1 - st.c0), 0);
      let at = Math.random() * total;
      for (const st of list) {
        at -= st.c1 - st.c0;
        if (at <= 0) return st;
      }
      return list[list.length - 1];
    };

    const drawSparks = (now: number) => {
      if (!sctx) return;
      if (now >= nextSpark && sparks.length < 3) {
        const st = pickStrand();
        if (st) sparks.push({ st, start: now, time: 1300 + (st.c1 - st.c0) * 7 });
        nextSpark = now + 700 + Math.random() * 1500;
      }
      sparks = sparks.filter((s) => now - s.start < s.time);
      // Entre un destello y el siguiente no hay nada que borrar ni que pintar.
      if (!sparks.length && !sparkDirty) return;
      clear(sctx);
      sctx.globalCompositeOperation = "lighter";
      for (const s of sparks) comet(sctx, s.st, (now - s.start) / s.time, sparkDir === "up", ink);
      sctx.globalCompositeOperation = "source-over";
      sparkDirty = sparks.length > 0;
    };

    /* Bucle --------------------------------------------------------------- */

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      let busy = false;
      if (progress !== target) {
        progress = target > progress ? Math.min(target, progress + dt / duration) : Math.max(target, progress - dt / RETRACT);
        paint();
        busy = true;
      }
      if (sparking()) {
        drawSparks(now);
        busy = true;
      } else if (sparkDirty) {
        sparks = [];
        clear(sctx);
        sparkDirty = false;
      }
      raf = busy ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    };

    function kick() {
      if (!raf && (progress !== target || sparking())) raf = requestAnimationFrame(tick);
    }

    const setLit = () => {
      if (still) return;
      const lit = host.dataset.lit === "true" || host.parentElement?.dataset.lit === "true";
      target = lit ? 1 : 0;
      kick();
    };

    /* Observadores ---------------------------------------------------------- */

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inView = e.isIntersecting;
          if (trigger === "view" && e.intersectionRatio >= 0.3 && !("in" in host.dataset)) {
            host.dataset.in = "";
            target = 1;
          }
        }
        kick();
      },
      { threshold: [0, 0.3] },
    );
    io.observe(host);

    let mo: MutationObserver | null = null;
    if (trigger === "lit") {
      mo = new MutationObserver(setLit);
      mo.observe(host, { attributes: true, attributeFilter: ["data-lit"] });
      if (host.parentElement) mo.observe(host.parentElement, { attributes: true, attributeFilter: ["data-lit"] });
      setLit();
    }

    // Una pantalla por arriba y por abajo, media a los lados (el rail se
    // desliza en horizontal).
    const pre = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near && stale) build();
      },
      { rootMargin: "100% 50%" },
    );
    pre.observe(host);

    let pending = 0;
    const ro = new ResizeObserver(() => {
      stale = true;
      window.clearTimeout(pending);
      if (near) pending = window.setTimeout(build, sys ? 120 : 0);
    });
    ro.observe(host);
    let alive = true;
    if (text) {
      document.fonts?.ready.then(() => {
        if (!alive) return;
        size = { w: 0, h: 0, dpr: 0 };
        stale = true;
        if (near) build();
      });
    }

    return () => {
      alive = false;
      io.disconnect();
      pre.disconnect();
      ro.disconnect();
      mo?.disconnect();
      window.clearTimeout(pending);
      cancelAnimationFrame(raf);
    };
  }, [ref, plan, trigger, duration, onGrow, text]);
}

/** Un destello con estela que recorre una fibra (u de 0 a 1). */
function comet(ctx: CanvasRenderingContext2D, st: Strand, u: number, up: boolean, ink: RootInk) {
  const span = st.c1 - st.c0;
  const len = Math.min(42, span * 0.4);
  const along = u * (span + len);
  const head = up ? st.c1 - along : st.c0 + along;
  const tail = up ? head + len : head - len;
  const lo = Math.max(st.c0, Math.min(head, tail));
  const hi = Math.min(st.c1, Math.max(head, tail));
  if (hi - lo < 1) return;
  const pts: [number, number][] = [];
  const at = (c: number): [number, number] => {
    const p = st.pts;
    let i = 1;
    while (i < p.length - 1 && p[i].c < c) i++;
    const a = p[i - 1];
    const b = p[i];
    const f = Math.min(1, Math.max(0, (c - a.c) / Math.max(1e-6, b.c - a.c)));
    return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f];
  };
  pts.push(at(lo));
  for (const p of st.pts) if (p.c > lo && p.c < hi) pts.push([p.x, p.y]);
  pts.push(at(hi));
  const h = at(Math.max(lo, Math.min(hi, head)));
  const t = at(Math.max(lo, Math.min(hi, tail)));
  // Entra y sale suave; y se apaga con la profundidad, como la raíz.
  const env = Math.sin(Math.PI * Math.min(1, u * 1.1));
  const depthFade = Math.max(0.15, 1 - h[1] / Math.max(1, ink.fade));
  const orchid = ink.orchid ?? "#d77cf5";
  const g = ctx.createLinearGradient(t[0], t[1], h[0], h[1]);
  g.addColorStop(0, "rgba(215, 124, 245, 0)");
  g.addColorStop(0.7, orchid);
  g.addColorStop(1, "#fff6ff");
  ctx.globalAlpha = env * depthFade;
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  const glow = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 6);
  glow.addColorStop(0, "rgba(255, 240, 255, 0.9)");
  glow.addColorStop(1, "rgba(215, 124, 245, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(h[0], h[1], 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
