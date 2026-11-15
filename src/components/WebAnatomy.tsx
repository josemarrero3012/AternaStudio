"use client";

// «Qué incluye» de /servicios/web: los seis pasos, con una película que los
// cuenta («anatomía de una web a medida», de la raíz a la copa). La película
// es un vídeo sin texto, producido con Three.js (scripts/anatomy/); los pasos
// son la lista de siempre, en HTML, y hacen de subtítulos: mientras el vídeo
// avanza se enciende el paso que se está viendo, y cada paso lleva a su tramo.
//
// - Sin JavaScript, sin conexión para el vídeo o si el vídeo falla: la imagen
//   fija (la web terminada, que es también el primer y el último fotograma)
//   y la lista.
// - El vídeo no se pide hasta que la sección se acerca; se reproduce una vez
//   al entrar en pantalla, en silencio, y se queda en el último fotograma. Se
//   para al salir de pantalla o al cambiar de pestaña, y con el botón.
// - Con movimiento reducido (o ahorro de datos) no arranca solo: cada paso
//   enseña su fotograma, quieto, y el botón permite verla si se quiere.

import { useEffect, useRef, useState } from "react";
import timeline from "@/lib/anatomy/timeline.json";
import { withBase } from "@/lib/base";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

/** Si cambia la película, nueva carpeta (el .htaccess la cachea un año). */
const DIR = "/film/web/v1";
const { chapters, duration } = timeline;

/** still: la imagen fija, antes de reproducir nada. */
type Phase = "still" | "playing" | "paused" | "ended";

function Glyph({ phase }: { phase: Phase }) {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      {phase === "playing" ? (
        <path d="M2.5 1.5h2.4v9H2.5zM7.1 1.5h2.4v9H7.1z" />
      ) : phase === "ended" ? (
        <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.2 6a4.2 4.2 0 1 1-1.3-3" />
          <path d="M10.4 1v2.6H7.8" />
        </g>
      ) : (
        <path d="M3 1.4v9.2L10.4 6z" />
      )}
    </svg>
  );
}

export function WebAnatomy({ items }: { items: string[] }) {
  const { t } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const api = useRef<{ toggle: () => void; go: (i: number) => void } | null>(null);
  const [phase, setPhase] = useState<Phase>("still");
  /** El paso que se está viendo (−1: la entrada, antes del primero). */
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    const list = listRef.current;
    if (!stage || !video || !list) return;

    const reduced = prefersReducedMotion();
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const auto = !reduced && !saver;
    let loaded = false;
    let started = false;
    /** Lo paró quien mira (no se reanuda solo). */
    let userPaused = false;
    /** Lo paró la página al salir de pantalla o de la pestaña. */
    let autoPaused = false;
    let inView = false;
    let raf = 0;
    let current = -2;
    let failed = false;

    const load = () => {
      if (loaded) return;
      loaded = true;
      const px = window.matchMedia("(max-width: 767px)").matches ? 720 : 1080;
      const webm = video.canPlayType('video/webm; codecs="vp9"') !== "";
      video.preload = "auto";
      video.src = withBase(`${DIR}/anatomy-${px}.${webm ? "webm" : "mp4"}`);
      video.load();
    };
    const seek = (time: number) => {
      const set = () => {
        video.currentTime = time;
      };
      if (video.readyState >= 1) set();
      else video.addEventListener("loadedmetadata", set, { once: true });
    };
    const play = () => {
      load();
      started = true;
      autoPaused = false;
      // Si el navegador no deja reproducir solo, quedan la imagen y el botón.
      video.play().catch(() => {});
    };

    const sync = () => {
      const time = video.currentTime;
      let i = -1;
      for (let k = 0; k < chapters.length; k++) if (time >= chapters[k]) i = k;
      if (i !== current) {
        current = i;
        setStep(i);
      }
      const from = i < 0 ? 0 : chapters[i];
      const to = chapters[i + 1] ?? duration;
      list.style.setProperty("--p", Math.min(1, Math.max(0, (time - from) / (to - from))).toFixed(3));
    };
    const loop = () => {
      sync();
      raf = requestAnimationFrame(loop);
    };
    const onPlaying = () => {
      setPhase("playing");
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      cancelAnimationFrame(raf);
      if (video.ended) return;
      sync();
      setPhase("paused");
    };
    const onEnded = () => {
      cancelAnimationFrame(raf);
      current = -2;
      setPhase("ended");
    };
    const onSeeked = () => {
      if (video.paused && !video.ended) sync();
    };
    // Sin vídeo (no llega o no se puede leer): la imagen fija y la lista.
    const onError = () => {
      failed = true;
      cancelAnimationFrame(raf);
      delete stage.dataset.ready;
      setPhase("still");
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    // Se pide cuando el escenario asoma en pantalla (nunca antes de que la
    // página haya terminado de cargar: quien no baja no la descarga) y
    // arranca con media escena a la vista. Mientras llega se ve la imagen
    // fija, que es su primer fotograma.
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      if (auto) load();
    });
    const watch = () => near.observe(stage);
    if (document.readyState === "complete") watch();
    else window.addEventListener("load", watch, { once: true });
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (!entry.isIntersecting && !video.paused) {
          autoPaused = true;
          video.pause();
        } else if (inView && auto && !userPaused && video.paused && !video.ended && (!started || autoPaused)) {
          play();
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(stage);
    const onVisibility = () => {
      if (document.hidden) {
        if (!video.paused) {
          autoPaused = true;
          video.pause();
        }
      } else if (autoPaused && inView && !userPaused) {
        play();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    api.current = {
      toggle() {
        if (failed) return;
        if (video.paused || video.ended) {
          userPaused = false;
          play();
        } else {
          userPaused = true;
          video.pause();
        }
      },
      go(i) {
        if (failed) return;
        load();
        if (reduced) {
          // Sin movimiento: el fotograma con el que acaba el paso.
          userPaused = true;
          started = true;
          video.pause();
          seek(Math.min(chapters[i + 1] ?? duration, duration) - 0.05);
          setPhase("paused");
        } else {
          userPaused = false;
          seek(chapters[i]);
          play();
        }
      },
    };
    stage.dataset.ready = "";

    return () => {
      api.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", watch);
      near.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      delete stage.dataset.ready;
    };
  }, []);

  const running = phase === "playing" || phase === "paused";
  const label = phase === "playing" ? t.anatomy.pause : phase === "ended" ? t.anatomy.replay : t.anatomy.play;

  return (
    <div className="anatomy">
      <div ref={stageRef} className="anatomy__stage aurora-panel">
        <img
          className="anatomy__media"
          src={withBase(`${DIR}/poster-1080.webp`)}
          srcSet={`${withBase(`${DIR}/poster-720.webp`)} 720w, ${withBase(`${DIR}/poster-1080.webp`)} 1080w`}
          sizes="(min-width: 1024px) 42vw, (min-width: 640px) 560px, 92vw"
          width={1080}
          height={1080}
          alt={t.anatomy.label}
          loading="lazy"
          decoding="async"
        />
        {/* Decorativo para lectores de pantalla: lo que cuenta está en la
            imagen (su texto alternativo) y en la lista. */}
        <video ref={videoRef} className="anatomy__media" width={1080} height={1080} muted playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1} />
        <button type="button" className="t-label anatomy__toggle" onClick={() => api.current?.toggle()}>
          <Glyph phase={phase} />
          {label}
        </button>
      </div>
      <ol ref={listRef} className="anatomy__steps" data-run={running ? "" : undefined}>
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              className="anatomy__step"
              data-s={i < step ? "done" : i === step ? "now" : "next"}
              aria-current={running && i === step ? "step" : undefined}
              onClick={() => api.current?.go(i)}
            >
              <span className="t-index anatomy__index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
