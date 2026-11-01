"use client";

// El fondo 3D de la portada (Modo Premium). Este componente solo decide si se
// intenta y lo monta: la escena (src/world/scene.ts, con Three.js) se
// descarga aparte y después de que se pinte la página, así que el titular
// sigue siendo lo primero que se ve y el JavaScript inicial no crece.
//
// Si no hay 3D (ver lib/world.ts) no pinta nada y el hero es el de siempre,
// con su vídeo. Si algo falla por el camino (sin WebGL, render por software,
// demasiado lento, tarda en cargar), vuelve a ese hero sin recargar.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { onIntro } from "@/lib/intro";
import { gpuUsable, setWorldState, worldForced, worldState } from "@/lib/world";

/** Si a los 8 s de empezar a cargar la escena aún no pinta, se queda el vídeo. */
const DEADLINE = 8000;

export function World() {
  const [mounted, setMounted] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (worldState() === "try") setMounted(true);
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!mounted || !el) return;
    let cancelled = false;
    let handle: { intro: () => void; dispose: () => void } | null = null;
    let offIntro = () => {};
    let timer = 0;

    const fail = () => {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(timer);
      offIntro();
      handle?.dispose();
      handle = null;
      setWorldState("off");
      setMounted(false);
    };

    const start = async () => {
      if (cancelled) return;
      if (!gpuUsable(worldForced())) return fail();
      timer = window.setTimeout(fail, DEADLINE);
      try {
        const { createWorld } = await import("@/world/scene");
        if (cancelled) return;
        handle = createWorld({
          canvas: el,
          forced: worldForced(),
          onReady: () => {
            if (cancelled) return;
            window.clearTimeout(timer);
            setWorldState("on");
            offIntro = onIntro(() => handle?.intro());
          },
          onFail: fail,
        });
      } catch {
        fail();
      }
    };

    // Después del primer pintado y con el hilo libre: el 3D nunca retrasa el texto.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => void start(), { timeout: 1200 })
      : window.setTimeout(() => void start(), 300);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      window.clearTimeout(timer);
      offIntro();
      handle?.dispose();
      if (!cancelled && worldState() === "on") setWorldState("try");
      cancelled = true;
    };
  }, [mounted]);

  if (!mounted) return null;
  return createPortal(<canvas ref={canvas} className="world" aria-hidden="true" />, document.body);
}
