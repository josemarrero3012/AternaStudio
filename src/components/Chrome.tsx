"use client";

// Piezas globales de la experiencia: cortina de entrada, cursor, scroll
// suave, transición entre páginas, enlace para saltar al contenido y botón de
// WhatsApp. Las animaciones se desactivan con prefers-reduced-motion.

import Lenis from "lenis";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import {
  ATERNA_EASE,
  ScrollTrigger,
  gsap,
  isCoarsePointer,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/motion";
import { startIntro } from "@/lib/intro";
import { CURSOR_SMOOTHING } from "@/lib/journey/config";
import { damp } from "@/lib/journey/motion";
import { basePath, withBase } from "@/lib/base";
import { site } from "@/lib/site";

export const CURTAIN_KEY = "aterna:curtain";

/**
 * Antes de pintar nada (va en línea al principio del <body>): si la cortina
 * ya salió en esta sesión o se prefiere menos movimiento, la marca para no
 * mostrarse. Así la cortina puede venir en el HTML tapando desde el primer
 * instante: antes aparecía al cargar el JavaScript y dejaba ver un momento
 * la página estática.
 */
export const CURTAIN_SCRIPT = `try{var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.motion="on";if(sessionStorage.getItem("${CURTAIN_KEY}")||d.dataset.motion!=="on")d.dataset.curtain="skip";if(d.dataset.motion==="on"&&sessionStorage.getItem("aterna:veil"))d.dataset.veil="cover";sessionStorage.removeItem("aterna:veil")}catch(e){document.documentElement.dataset.curtain="skip"}`;

/**
 * Cortina de marca: solo la primera vez por sesión. Al subir da la salida a
 * la entrada (startIntro). En la portada no sale (ni en el HTML, ver
 * globals.css): allí la entrada la da el recorrido (Journey.tsx), sin
 * pantalla de carga.
 */
export function Curtain() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.querySelector(".journey")) {
      setGone(true);
      return;
    }
    if (document.documentElement.dataset.curtain === "skip") {
      setGone(true);
      startIntro();
      return;
    }
    try {
      sessionStorage.setItem(CURTAIN_KEY, "1");
    } catch {}
    registerGsap();
    let tl: gsap.core.Timeline | null = null;
    const lift = () => {
      startIntro();
      tl = gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(el, { yPercent: -100, duration: 0.9, ease: ATERNA_EASE })
        .to(el.querySelector(".curtain__rule"), { scaleX: 0, duration: 0.5, ease: "none" }, "<0.2");
    };
    // Un respiro mínimo para que la marca se vea.
    const wait = window.setTimeout(lift, 200);
    return () => {
      window.clearTimeout(wait);
      tl?.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={ref} className="curtain" aria-hidden="true">
      <span className="curtain__rule brand-rule" />
    </div>
  );
}

/**
 * Cursor propio (solo con ratón y con movimiento): un anillo que sigue al
 * puntero con algo de retraso, crece sobre enlaces y botones y, sobre un
 * elemento con data-cursor-label, muestra ese texto debajo. Se ve cuando ha
 * empezado la entrada (html[data-intro], ver globals.css).
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const text = label.current;
    if (!el || !text || isCoarsePointer() || prefersReducedMotion()) return;
    document.body.classList.add("has-cursor");
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let last = performance.now();
    // Atributos y no className: React no los pisa al volver a pintar.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (el.dataset.visible !== "true") el.dataset.visible = "true";
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest<HTMLElement>('a, button, [role="button"], input, textarea, [data-cursor-label]');
      el.dataset.hover = hit ? "true" : "false";
      const words = hit?.dataset.cursorLabel;
      // La etiqueta conserva su texto mientras se desvanece.
      if (words) text.textContent = words;
      el.dataset.label = words ? "true" : "false";
    };
    const hide = () => {
      el.dataset.visible = "false";
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const k = damp(CURSOR_SMOOTHING, Math.max(0, now - last));
      last = now;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.body.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={ref} className="cursor" data-visible="false" data-hover="false" data-label="false" aria-hidden="true">
      <span className="cursor__ring" />
      <span className="cursor__dot" />
      <span ref={label} className="cursor__label" />
    </div>
  );
}

/**
 * Foco de luz en las tarjetas: un solo listener para toda la página que
 * pasa la posición del puntero (--mx, --my) al `[data-spot]` que hay debajo.
 * El brillo lo pinta el CSS.
 */
export function Spotlight() {
  useEffect(() => {
    if (isCoarsePointer()) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      const e = last;
      const card = (e?.target as Element | null)?.closest<HTMLElement>("[data-spot]");
      if (!e || !card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    registerGsap();
    let instance: Lenis;
    try {
      instance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        // Al ir a otra página se corta la inercia. Next.js pone el scroll
        // arriba, o lo restaura al volver atrás (antes se forzaba a 0 y el
        // botón atrás perdía la posición).
        stopInertiaOnNavigate: true,
      });
    } catch {
      return;
    }
    let raf = 0;
    const loop = (time: number) => {
      instance.raf(time);
      ScrollTrigger.update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Anclas de la misma página («Ver planes»): desplazamiento suave que
    // respeta el scroll-padding de la cabecera; el foco va al destino, como
    // en el salto nativo. «Saltar al contenido» conserva el salto nativo.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!link || link.classList.contains("skip-link")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      instance.scrollTo(target);
      history.pushState(null, "", url.hash);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    // Con el menú móvil abierto la página de detrás no se mueve.
    const menu = new MutationObserver(() => {
      if (document.body.dataset.menu === "open") instance.stop();
      else instance.start();
    });
    menu.observe(document.body, { attributes: true, attributeFilter: ["data-menu"] });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      menu.disconnect();
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return <>{children}</>;
}

/** Al navegar con recarga completa (otro layout raíz) la nueva página nace tapada. */
export const VEIL_KEY = "aterna:veil";

/**
 * Transición entre páginas. Al pulsar un enlace interno, un velo de noche
 * sube desde abajo con una raíz de luz en el borde y el símbolo en el
 * centro; cuando la nueva ruta ya está pintada, el velo sigue subiendo y la
 * página entra desde debajo. Atrás/adelante del navegador, los idiomas
 * (data-no-veil) y las anclas de la misma página no lo usan. Si la
 * navegación recarga el documento (español ↔ otro idioma: otro layout
 * raíz), CURTAIN_SCRIPT lo deja tapado desde el primer fotograma y aquí se
 * levanta. Con movimiento reducido no hay velo.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef(true);
  // El velo tapa la pantalla y espera a la nueva ruta.
  const covering = useRef(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  // Salida: interceptamos los enlaces antes que Next (fase de captura en
  // window); next/link respeta defaultPrevented y no navega por su cuenta.
  useEffect(() => {
    const el = veil.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (prefersReducedMotion() || covering.current) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.closest("[data-no-veil]")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      // Solo rutas de la web (no archivos como el PHP del formulario).
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
      e.preventDefault();
      covering.current = true;
      registerGsap();
      timeline.current?.kill();
      const to = url.pathname.slice(basePath.length) + url.search + url.hash;
      el.dataset.state = "cover";
      timeline.current = gsap
        .timeline({
          onComplete: () => {
            try {
              sessionStorage.setItem(VEIL_KEY, "1");
            } catch {}
            router.push(to || "/");
            // Si la ruta no llegara a cambiar, el velo no se queda puesto.
            window.setTimeout(() => {
              if (covering.current) reveal();
            }, 2500);
          },
        })
        .fromTo(el, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power3.inOut" })
        .fromTo(el.querySelector(".page-veil__mark"), { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0.2);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  // Entrada: el velo se va hacia arriba y la página sube a su sitio.
  const reveal = () => {
    const el = veil.current;
    const page = ref.current;
    covering.current = false;
    try {
      sessionStorage.removeItem(VEIL_KEY);
    } catch {}
    delete document.documentElement.dataset.veil;
    if (!el) return;
    registerGsap();
    timeline.current?.kill();
    el.dataset.state = "reveal";
    timeline.current = gsap
      .timeline({
        onComplete: () => {
          el.dataset.state = "idle";
          gsap.set(el, { clearProps: "transform" });
        },
      })
      .set(el, { y: 0, yPercent: 0 })
      .to(el.querySelector(".page-veil__mark"), { opacity: 0, scale: 1.06, duration: 0.3, ease: "power2.in" }, 0)
      .to(el, { yPercent: -100, duration: 0.8, ease: "power3.inOut" }, 0.1);
    if (page) {
      timeline.current.fromTo(
        page,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 1, ease: ATERNA_EASE, clearProps: "transform,opacity" },
        0.35,
      );
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      // Llegada con recarga desde otra página: el documento nació tapado.
      if (document.documentElement.dataset.veil === "cover") reveal();
      return;
    }
    if (prefersReducedMotion()) return;
    if (covering.current) {
      // Un fotograma para que la nueva página pinte debajo del velo.
      const raf = requestAnimationFrame(() => reveal());
      return () => cancelAnimationFrame(raf);
    }
    registerGsap();
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: ATERNA_EASE, clearProps: "transform,opacity" },
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "transform,opacity" });
    };
    // reveal solo usa refs: no hace falta en las dependencias.
  }, [pathname]);

  return (
    <>
      <div ref={ref}>{children}</div>
      <div ref={veil} className="page-veil" data-state="idle" aria-hidden="true">
        <span className="page-veil__edge page-veil__edge--top" />
        <img className="page-veil__mark" src={withBase("/brand/aterna-symbol-light.webp")} alt="" width={319} height={320} decoding="async" />
        <span className="page-veil__edge page-veil__edge--bottom" />
      </div>
    </>
  );
}

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#contenido" className="skip-link">
      {t.skip}
    </a>
  );
}

/** Enlace a WhatsApp con el mensaje inicial ya escrito. */
export function whatsappHref(message: string) {
  return `https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [overFooter, setOverFooter] = useState(false);

  // Se aparta cuando el pie entra en pantalla: allí ya están los contactos
  // y el botón tapaba los enlaces legales.
  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setOverFooter(e.isIntersecting), {
      rootMargin: "0px 0px -40px 0px",
    });
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  return (
    <aside aria-label="WhatsApp">
      <a
        href={whatsappHref(t.whatsapp.message)}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-widget"
        data-hidden={overFooter}
        tabIndex={overFooter ? -1 : undefined}
        aria-label={`${t.whatsapp.aria} ${site.whatsapp}`}
      >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12.004 2C6.486 2 2.01 6.477 2.01 11.996c0 1.98.579 3.876 1.674 5.516L2 22l4.607-1.657a9.94 9.94 0 0 0 5.397 1.573h.004c5.518 0 9.995-4.478 9.995-9.997C22.003 6.477 17.526 2 12.004 2zm5.86 15.85a8.28 8.28 0 0 1-5.86 2.428h-.003a8.28 8.28 0 0 1-4.583-1.376l-.328-.196-3.037 1.092 1.023-3.05-.216-.334A8.24 8.24 0 0 1 3.688 12c0-4.588 3.73-8.318 8.317-8.318 2.222 0 4.31.867 5.881 2.44a8.26 8.26 0 0 1 2.436 5.878c0 4.588-3.73 8.317-8.318 8.317z" />
        </svg>
      </a>
    </aside>
  );
}
