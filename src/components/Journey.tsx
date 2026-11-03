"use client";

// La portada: un recorrido de 120 fotogramas renderizados en Blender que el
// scroll recorre, desde la boca de un túnel de raíces de luz hasta el símbolo
// de Aterna en 3D. En ordenador con ratón cada fotograma va por capas (el
// suelo, los arcos, el símbolo) que se mueven enteras con el puntero: paralaje
// sin deformación. En el móvil, el fotograma plano. Abre con una pantalla de carga (contador
// y línea de progreso) que se funde desde el centro con un filo de luz; luego
// entran la cabecera y el titular, palabra a palabra. Al bajar cambian los
// textos y, al final, junto al símbolo, aparecen dos tarjetas de vidrio.
//
// Todo el movimiento sale de un solo efecto de montaje (su cierre lleva la
// carga, el fundido y el bucle del scroll) y se limpia al desmontar: con
// StrictMode el efecto se monta dos veces en desarrollo. Los lienzos WebGL se
// crean dentro del efecto (un <canvas> de JSX se reutilizaría con el
// contexto ya perdido del primer montaje).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { CURTAIN_KEY } from "./Chrome";
import { ArrowRight } from "./icons";
import { Link, useI18n } from "@/lib/i18n";
import { startIntro } from "@/lib/intro";
import { prefersReducedMotion } from "@/lib/motion";
import { BurnRenderer } from "@/lib/journey/burnRenderer";
import {
  BURN_MS,
  CARD_BLUR,
  FRAME_COUNT,
  INTRO_AT_MS,
  LOADER_TIMEOUT_MS,
  MIN_LOADER_MS,
  POINTER_SMOOTHING,
  POSTER,
  SCROLL_SMOOTHING,
  TIMING,
  type Timing,
} from "@/lib/journey/config";
import { mountDebug } from "@/lib/journey/debug";
import { FlatRenderer } from "@/lib/journey/flatRenderer";
import { drawGlass } from "@/lib/journey/glass";
import { LayeredRenderer, type FrameRenderer } from "@/lib/journey/layeredRenderer";
import { clamp, damp, invLerp, lerp, stateStyle } from "@/lib/journey/motion";
import { chooseFamily, choosePlan, getSequence, loadManifest, supportsAvif, type Manifest, type Sequence } from "@/lib/journey/sequence";

type Phase = "loading" | "burning" | "ready" | "done";

/** La pantalla de carga ya salió en esta vida de la página (al volver a la portada sin recargar no se repite). */
let played = false;

/** Espera a las fuentes con las que se pintan estos elementos (no a todas: document.fonts.ready). */
function loadFonts(els: (HTMLElement | null)[]) {
  if (!document.fonts?.load) return Promise.resolve();
  const specs = new Set<string>();
  for (const el of els) {
    if (!el) continue;
    const cs = getComputedStyle(el);
    const family = cs.fontFamily.split(",")[0]?.trim();
    if (family) specs.add(`${cs.fontStyle} ${cs.fontWeight} 1em ${family}`);
  }
  return Promise.all([...specs].map((spec) => document.fonts.load(spec))).then(() => undefined);
}

/** Cada palabra, su propio span (numeradas a lo largo de las dos líneas). */
function Words({ text, start }: { text: string; start: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="journey__word" data-word style={{ "--i": start + i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

function CopyState({
  ref,
  kind,
  heading = "h2",
  id,
  headline,
  body,
  intro,
  children,
}: {
  ref: Ref<HTMLElement>;
  kind: "hero" | "mid" | "final";
  heading?: "h1" | "h2";
  id?: string;
  headline: string;
  body: string;
  intro?: boolean;
  children?: ReactNode;
}) {
  const [a = "", b = ""] = headline.split("\n");
  const H = heading;
  const firstCount = a.split(" ").length;
  return (
    <section ref={ref} className={`journey__copy journey__copy--${kind}${intro ? " is-intro" : ""}`} aria-labelledby={id}>
      <H className="journey__headline" id={id}>
        <span className="journey__line journey__line--sans trim">
          <Words text={a} start={0} />
        </span>{" "}
        {/* El espacio de arriba no se ve (líneas en bloque), pero separa las
            dos líneas en el texto: «mejor es», no «mejores». */}
        <span className="journey__line journey__line--serif trim">
          <Words text={b} start={firstCount} />
        </span>
      </H>
      <div className="journey__detail" data-detail>
        <p className="journey__body">{body}</p>
        {children}
      </div>
    </section>
  );
}

export function Journey() {
  const { t } = useI18n();
  const j = t.journey;
  // Al volver a la portada sin recargar, sin pantalla de carga: ya salió.
  const [phase, setPhase] = useState<Phase>(() => (played ? "done" : "loading"));
  const intro = phase === "ready" || phase === "done";

  const mainRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const caveRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const midRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const burnRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRef = useRef(j.label);

  useEffect(() => {
    const main = mainRef.current;
    const stage = stageRef.current;
    const probe = probeRef.current;
    const caveHost = caveRef.current;
    const hero = heroRef.current;
    const mid = midRef.current;
    const final = finalRef.current;
    const cards = cardsRef.current;
    const loader = loaderRef.current;
    const burnHost = burnRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;
    if (!main || !stage || !probe || !caveHost || !hero || !mid || !final || !cards || !loader || !burnHost || !counter || !bar) return;

    let alive = true;
    const reduced = prefersReducedMotion();
    const root = document.documentElement;
    const skip = played;
    const go = (next: Phase) => {
      if (alive) setPhase(next);
    };

    // El lienzo, el renderer y la secuencia -------------------------------------
    // Llegan con el manifiesto: la familia (por capas, plana o vertical) y la
    // resolución dependen de la pantalla y del navegador. Un lienzo con WebGL
    // no puede pasar a 2D: si cambia el tipo de renderer, lienzo nuevo.
    let canvas = document.createElement("canvas");
    let renderer: FrameRenderer | null = null;
    let seq: Sequence | null = null;
    let offLoad: () => void = () => {};
    let amp = 0; // amplitud del paralaje: 0 sin capas o con movimiento reducido
    const mountCanvas = () => {
      canvas.className = "journey__canvas";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", labelRef.current);
      caveHost.appendChild(canvas);
      canvasRef.current = canvas;
    };
    mountCanvas();
    const makeRenderer = (kind: "layers" | "flat", manifest: Manifest) => {
      if (renderer?.kind === kind) return renderer;
      renderer?.dispose();
      renderer = null;
      if (canvas.dataset.used) {
        canvas.remove();
        canvas = document.createElement("canvas");
        mountCanvas();
      }
      canvas.dataset.used = "1";
      try {
        renderer = kind === "layers" ? new LayeredRenderer(canvas, manifest) : new FlatRenderer(canvas);
      } catch (err) {
        console.warn(`[recorrido] sin ${kind === "layers" ? "WebGL2, sin paralaje" : "canvas"}:`, err);
      }
      return renderer;
    };
    const setup = async () => {
      const [manifest, avif] = await Promise.all([loadManifest(), supportsAvif()]);
      if (!alive) return false;
      const { width, height } = stage.getBoundingClientRect();
      const fine = !reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      let family = chooseFamily(width, height, avif, fine);
      let r = makeRenderer(family === "layers" ? "layers" : "flat", manifest);
      if (!r && family === "layers") {
        family = "flat";
        r = makeRenderer("flat", manifest);
      }
      if (!r) return false;
      const plan = choosePlan(manifest, family, width, height, r instanceof LayeredRenderer ? r.maxTexture : Infinity);
      if (debug && r instanceof LayeredRenderer) r.solo = new URLSearchParams(window.location.search).get("capa") ?? "";
      r.setPlan(plan);
      amp = family === "layers" ? 1 : 0;
      const next = getSequence(manifest, plan);
      if (next !== seq) {
        offLoad();
        seq = next;
        offLoad = seq.onLoad(() => {
          needsDraw = true;
        });
      }
      needsDraw = true;
      drawnIndex = -1;
      return seq.start();
    };
    let replanTimer = 0;
    const replan = () => {
      window.clearTimeout(replanTimer);
      replanTimer = window.setTimeout(() => {
        if (seq) setup().catch((err) => console.warn("[recorrido]", err));
      }, 400);
    };

    // Estado del bucle ------------------------------------------------------
    let target = 0;
    let progress = 0;
    let unit = 1;
    let onScreen = true;
    let needsDraw = true;
    let drawnIndex = -1;
    let drawnLevel = -1;
    let animating = false;
    let lastProgress = Number.NaN;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    const drawnPointer = { x: Number.NaN, y: Number.NaN };

    const header = document.querySelector<HTMLElement>(".header");
    const measure = () => {
      const r = main.getBoundingClientRect();
      target = clamp(-r.top / Math.max(1, main.offsetHeight - window.innerHeight));
      onScreen = r.bottom > 0 && r.top < window.innerHeight;
      // Mientras el recorrido está bajo la cabecera, esta va sin velo.
      const over = r.bottom > (header?.offsetHeight ?? 84) ? "over" : "past";
      if (root.dataset.journey !== over) root.dataset.journey = over;
    };
    const measureUnit = () => {
      unit = probe.getBoundingClientRect().width / 100 || 1;
    };
    // El degradado de la segunda línea, continuo de la primera palabra a la
    // última (cada palabra lleva su trozo). offsetLeft no cuenta las
    // transformaciones de la entrada.
    const paintGradients = () => {
      for (const line of stage.querySelectorAll<HTMLElement>(".journey__line--serif")) {
        const width = line.offsetWidth;
        for (const w of line.querySelectorAll<HTMLElement>("[data-word]")) {
          w.style.backgroundSize = `${width}px 100%`;
          w.style.backgroundPosition = `${line.offsetLeft - w.offsetLeft}px 0`;
        }
      }
    };

    type Block = {
      el: HTMLElement;
      timing: Timing;
      words?: HTMLElement[];
      detail?: HTMLElement | null;
      last: { o: number; y: number; v: string; reveal: number[]; detail: number };
    };
    const block = (el: HTMLElement, timing: Timing, reveal = false): Block => ({
      el,
      timing,
      words: reveal ? Array.from(el.querySelectorAll<HTMLElement>("[data-word]")) : undefined,
      detail: reveal ? el.querySelector<HTMLElement>("[data-detail]") : undefined,
      last: { o: Number.NaN, y: Number.NaN, v: "", reveal: [], detail: Number.NaN },
    });
    const blocks = [block(hero, TIMING.hero), block(mid, TIMING.mid, true), block(cards, TIMING.cards), block(final, TIMING.final, true)];
    const cardsBlock = blocks[2];

    const applyBlocks = () => {
      for (const b of blocks) {
        const s = stateStyle(progress, b.timing);
        const L = b.last;
        const o = Math.round(s.opacity * 1000) / 1000;
        const y = Math.round(s.y * unit * 100) / 100;
        const v = s.visible ? "visible" : "hidden";
        if (o !== L.o) b.el.style.opacity = String((L.o = o));
        if (y !== L.y) b.el.style.transform = `translate3d(0, ${(L.y = y)}px, 0)`;
        if (v !== L.v) b.el.style.visibility = L.v = v;
        const enter = b.timing.enter;
        if (!b.words || !enter) continue;
        // Palabra a palabra: la transición lineal de 0,58 s de cada palabra lo suaviza.
        const local = invLerp(enter[0], enter[1], progress);
        const n = b.words.length;
        b.words.forEach((w, i) => {
          const r = Math.round(clamp((local - (i / n) * 0.58) / 0.34) * 1000) / 1000;
          if (r !== L.reveal[i]) w.style.setProperty("--reveal", String((L.reveal[i] = r)));
        });
        const d = Math.round(clamp((local - 0.62) / 0.38) * 1000) / 1000;
        if (b.detail && d !== L.detail) b.detail.style.setProperty("--detail", String((L.detail = d)));
      }
    };

    measureUnit();
    measure();
    paintGradients();

    // Bucle del scroll --------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = clamp(now - last, 0, 100);
      last = now;
      progress = lerp(progress, target, damp(SCROLL_SMOOTHING, dt));
      if (Math.abs(target - progress) < 0.00005) progress = target;
      if (!reduced) {
        const k = damp(POINTER_SMOOTHING, dt);
        pointer.x = lerp(pointer.x, pointerTarget.x, k);
        pointer.y = lerp(pointer.y, pointerTarget.y, k);
        if (Math.abs(pointer.x - pointerTarget.x) < 0.0005) pointer.x = pointerTarget.x;
        if (Math.abs(pointer.y - pointerTarget.y) < 0.0005) pointer.y = pointerTarget.y;
      }
      const moved = progress !== lastProgress;
      if (moved) {
        applyBlocks();
        lastProgress = progress;
      }
      const want = Math.round(progress * (FRAME_COUNT - 1));
      debug?.frame(now);
      if (!seq || !renderer) return;
      seq.update(want, now);
      if (!onScreen) return;
      const shown = seq.best(want);
      if (!shown) return;
      const glass = cardsBlock.last.v === "visible";
      const pointerMoved = amp > 0 && (pointer.x !== drawnPointer.x || pointer.y !== drawnPointer.y);
      const changed = shown.index !== drawnIndex || shown.level !== drawnLevel;
      if (!needsDraw && !changed && !pointerMoved && !animating && !(moved && glass)) return;
      if (!renderer.resize()) return;
      const t0 = debug ? performance.now() : 0;
      animating = renderer.draw(shown, pointer, amp, now);
      debug?.drew(performance.now() - t0);
      drawnIndex = shown.index;
      drawnLevel = shown.level;
      drawnPointer.x = pointer.x;
      drawnPointer.y = pointer.y;
      needsDraw = false;
      debug?.shown(shown.index, shown.level);
      if (glass) drawGlass(stage, canvas);
    };
    raf = requestAnimationFrame(loop);

    const onScroll = () => measure();
    const onPointer = (e: PointerEvent) => {
      // Solo ratón y lápiz: con el dedo, el gesto de scroll movería la escena.
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (0.5 - e.clientY / window.innerHeight) * 2;
    };
    const onLeave = () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    let burn: BurnRenderer | null = null;
    let burnCanvas: HTMLCanvasElement | null = null;
    let loading = !skip;
    const ro = new ResizeObserver(() => {
      measureUnit();
      measure();
      paintGradients();
      needsDraw = true;
      lastProgress = Number.NaN; // los desplazamientos van en px de diseño
      if (loading) burn?.draw(0);
      replan();
    });
    ro.observe(stage);
    // ?recorrido=debug: fps, familia, resolución, MB descargados, decodificados y en texturas.
    const debug = new URLSearchParams(window.location.search).get("recorrido") === "debug" ? mountDebug(() => ({ seq, renderer })) : null;

    // Carga, fundido y entrada ---------------------------------------------
    let loaderRaf = 0;
    let burnRaf = 0;
    let readyTimer = 0;
    let introTimer = 0;
    let doneTimer = 0;
    let fontTimer = 0;
    const disposeBurn = () => {
      burn?.dispose();
      burn = null;
      burnCanvas?.remove();
      burnCanvas = null;
    };
    const startEntrance = () => {
      root.dataset.journeyIntro = "on";
      startIntro();
    };
    const finish = () => {
      if (!alive) return;
      played = true;
      go("done");
      disposeBurn();
    };

    if (skip) {
      setup().catch((err) => console.warn("[recorrido]", err));
      startIntro();
      document.fonts?.ready.then(() => alive && paintGradients());
    } else {
      root.dataset.journeyIntro = "pending";
      // La pantalla de carga hace de cortina de esta sesión (ver Curtain).
      try {
        sessionStorage.setItem(CURTAIN_KEY, "1");
      } catch {}
      if (!reduced) {
        burnCanvas = document.createElement("canvas");
        burnCanvas.className = "journey__burn";
        burnHost.appendChild(burnCanvas);
        try {
          burn = new BurnRenderer(burnCanvas);
          burn.draw(0);
          loader.dataset.burn = "on";
        } catch (err) {
          console.warn("[recorrido] sin WebGL para el fundido:", err);
          disposeBurn();
        }
      }

      let ready = false;
      const fontsIn = () => {
        if (!alive) return;
        loader.dataset.fonts = "ready";
        paintGradients();
      };
      // Si la fuente se atasca, el contador sale igual (con la de respaldo).
      fontTimer = window.setTimeout(fontsIn, 2500);
      const fonts = loadFonts([counter, hero.querySelector(".journey__line--sans"), hero.querySelector(".journey__body")])
        .catch((err) => console.warn("[recorrido] fuentes:", err))
        .finally(fontsIn);
      const first = setup().then(
        (ok) => {
          if (!ok && alive) console.warn("[recorrido] el primer fotograma no cargó: se abre igual.");
        },
        (err) => console.warn("[recorrido] no se pudo preparar:", err),
      );
      void Promise.all([first, fonts]).then(() => {
        ready = true;
      });
      // Una petición atascada no deja la pantalla en 99.
      readyTimer = window.setTimeout(() => {
        ready = true;
      }, LOADER_TIMEOUT_MS);

      const burnOut = () => {
        loading = false;
        counter.textContent = "100";
        bar.style.transform = "scaleX(1)";
        if (!burn) {
          // Sin fundido (movimiento reducido o sin WebGL): la pantalla se desvanece.
          go("ready");
          startEntrance();
          doneTimer = window.setTimeout(finish, reduced ? 200 : 600);
          return;
        }
        go("burning");
        const t0 = performance.now();
        introTimer = window.setTimeout(() => {
          go("ready");
          startEntrance();
        }, INTRO_AT_MS);
        const step = (now: number) => {
          if (!alive || !burn) return;
          const t = Math.min(Math.max(0, now - t0) / BURN_MS, 1);
          burn.draw(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
          if (t < 1) burnRaf = requestAnimationFrame(step);
          else finish();
        };
        burnRaf = requestAnimationFrame(step);
      };

      const start = performance.now();
      let shown = -1;
      const tick = (now: number) => {
        if (!alive) return;
        const elapsed = Math.max(0, now - start);
        const value = Math.floor(Math.min(elapsed / MIN_LOADER_MS, 1, ready ? 1 : 0.99) * 100);
        if (value !== shown) {
          shown = value;
          counter.textContent = String(value);
          bar.style.transform = `scaleX(${value / 100})`;
        }
        if (elapsed >= MIN_LOADER_MS && ready) burnOut();
        else loaderRaf = requestAnimationFrame(tick);
      };
      loaderRaf = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(loaderRaf);
      cancelAnimationFrame(burnRaf);
      window.clearTimeout(readyTimer);
      window.clearTimeout(introTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(fontTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      root.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      window.clearTimeout(replanTimer);
      debug?.dispose();
      offLoad();
      seq?.stop();
      renderer?.dispose();
      canvas.remove();
      canvasRef.current = null;
      disposeBurn();
      delete loader.dataset.burn;
      delete loader.dataset.fonts;
      delete root.dataset.journey;
      delete root.dataset.journeyIntro;
    };
  }, []);

  // El texto alternativo sigue al idioma (entre /en, /nl y /de no se desmonta).
  useEffect(() => {
    labelRef.current = j.label;
    canvasRef.current?.setAttribute("aria-label", j.label);
  }, [j.label]);

  return (
    <div ref={mainRef} className="journey">
      <div ref={stageRef} className="journey__stage">
        <div ref={probeRef} className="journey__probe" aria-hidden="true" />
        <div ref={caveRef} className="journey__cave">
          <noscript>
            <picture>
              <source type="image/avif" srcSet={POSTER.avif} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="journey__poster" src={POSTER.webp} alt={j.label} />
            </picture>
          </noscript>
        </div>
        <div className="journey__shade" aria-hidden="true" />
        <div className="journey__content">
          <div ref={cardsRef} className="journey__cards">
            {j.cards.map((card, i) => (
              <Link key={card.slug} href={`/servicios/${card.slug}`} className={`journey-card journey-card--${i ? "right" : "left"}`} data-cursor-label={j.cardCursor}>
                <canvas className="journey-card__glass" data-blur={CARD_BLUR} aria-hidden="true" />
                <span className="journey-card__text">
                  <span className="t-label journey-card__label">{card.label}</span>{" "}
                  <span className="journey-card__title">{card.title}</span>{" "}
                  <span className="journey-card__body">{card.body}</span>
                </span>
              </Link>
            ))}
          </div>
          <CopyState ref={heroRef} kind="hero" heading="h1" id="journey-title" headline={t.hero.headline} body={j.heroBody} intro={intro}>
            <Link href="/contacto" className="btn-primary journey__cta" data-cursor-label={j.heroCursor}>
              {t.cta}
              <ArrowRight />
            </Link>
          </CopyState>
          <CopyState ref={midRef} kind="mid" id="journey-mid" headline={j.mid.headline} body={j.mid.body} />
          <CopyState ref={finalRef} kind="final" id="journey-final" headline={j.final.headline} body={j.final.body} />
        </div>
      </div>
      <div ref={loaderRef} className="journey__loader" data-phase={phase} aria-hidden={phase === "done" ? true : undefined}>
        <div ref={burnRef} className="journey__veil" />
        <div className="journey__loader-ui">
          {/* El número no se anuncia en cada paso: solo «Cargando». */}
          <p className="journey__counter trim" role="status" aria-label={j.loading}>
            <span aria-hidden="true">
              <span ref={counterRef}>0</span>%
            </span>
          </p>
          <span className="journey__track" aria-hidden="true">
            <span ref={barRef} className="journey__bar" />
          </span>
        </div>
      </div>
    </div>
  );
}
