"use client";

// Piezas globales de la experiencia: cortina de entrada, cursor, scroll
// suave, transición entre páginas, enlace para saltar al contenido y botón de
// WhatsApp. Las animaciones se desactivan con prefers-reduced-motion.

import Lenis from "lenis";
import { usePathname } from "next/navigation";
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
import { site } from "@/lib/site";

const CURTAIN_KEY = "aterna:curtain";

/** Cortina de marca: solo la primera vez por sesión. */
export function Curtain() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(CURTAIN_KEY)) return;
      sessionStorage.setItem(CURTAIN_KEY, "1");
    } catch {}
    setShow(true);
  }, []);

  useEffect(() => {
    if (!show || !ref.current) return;
    registerGsap();
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.2, onComplete: () => setShow(false) })
        .to(el, { yPercent: -100, duration: 0.9, ease: ATERNA_EASE })
        .to(el.querySelector(".curtain__rule"), { scaleX: 0, duration: 0.5, ease: "none" }, "<0.2");
    }, el);
    return () => ctx.revert();
  }, [show]);

  if (!show) return null;
  return (
    <div ref={ref} className="curtain" aria-hidden="true">
      <span className="curtain__rule brand-rule" />
    </div>
  );
}

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCoarsePointer() || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    document.body.classList.add("has-cursor");
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let visible = false;
    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
      target.x = e.clientX;
      target.y = e.clientY;
      const hit = (e.target as Element | null)?.closest('a, button, [role="button"], input, textarea');
      el.dataset.big = hit ? "true" : "false";
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    const hide = () => (el.style.opacity = "0");
    const showC = () => {
      if (visible) el.style.opacity = "1";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", showC);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerenter", showC);
      document.body.classList.remove("has-cursor");
    };
  }, []);

  return <div ref={ref} className="cursor" data-big="false" aria-hidden="true" />;
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

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
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
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
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
