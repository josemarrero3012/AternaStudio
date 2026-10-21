"use client";

import { withBase } from "@/lib/base";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { LOCALES, LOCALE_NAMES } from "@/lib/dict";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";
import { ArrowRight } from "./icons";

function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={`lang-toggle ${className}`.trim()} role="group" aria-label={t.a11y.language}>
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            className="lang-toggle__btn t-label"
            data-active={active}
            aria-pressed={active}
            aria-label={LOCALE_NAMES[l]}
            lang={l}
            onClick={() => setLocale(l)}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Menú móvil. El panel se monta en <body> (portal), fuera de la cabecera:
 * cuando la cabecera lleva el desenfoque de fondo (al hacer scroll),
 * backdrop-filter la convierte en el bloque contenedor de sus hijos fijos y
 * el panel nacía encerrado en su franja; al quitarse el filtro saltaba a
 * pantalla completa a mitad de la animación. Por eso se entrecortaba según
 * la sección. Ahora solo se anima opacidad y transform de una capa propia,
 * la cabecera (marca y botón) queda por encima y el fondo no se mueve.
 */
function MobileMenu() {
  const pathname = usePathname();
  const { t } = useI18n();
  // Guardamos la ruta en la que se abrió: al navegar, el menú se cierra solo.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenAt(null), []);

  // En el mismo fotograma que el panel: la cabecera sube por encima de él y
  // pierde el desenfoque antes de que empiece la transición.
  useLayoutEffect(() => {
    if (!open) return;
    document.body.dataset.menu = "open";
    return () => {
      delete document.body.dataset.menu;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        toggle.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      // El botón de cerrar está en la cabecera: entra en el ciclo del foco.
      const items = [toggle.current, ...panel.current.querySelectorAll<HTMLElement>("a, button")].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // La página de detrás no se mueve. Sin overflow: hidden en <body>, que
    // obligaba a recalcular toda la página justo al empezar la animación:
    // se cortan el gesto y la rueda salvo dentro del panel, si tiene scroll.
    const el = panel.current;
    const block = (e: Event) => {
      if (el && el.scrollHeight > el.clientHeight && el.contains(e.target as Node)) return;
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", block, { passive: false });
    document.addEventListener("wheel", block, { passive: false });
    const focus = window.setTimeout(() => el?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true }), 60);
    return () => {
      window.clearTimeout(focus);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", block);
      document.removeEventListener("wheel", block);
    };
  }, [open, close]);

  const menu = (
    <div
      id="menu-panel"
      ref={panel}
      className="menu-panel"
      data-open={open}
      data-lenis-prevent
      role="dialog"
      aria-modal={open}
      aria-label={t.a11y.menu}
      inert={!open}
    >
      <nav className="menu-panel__nav" aria-label={t.a11y.nav}>
        <ul>
          {t.nav.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as CSSProperties}>
              <Link
                href={item.href}
                className="t-display"
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                onClick={close}
              >
                <span className="menu-panel__index t-index">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <LangToggle />
      </nav>
      <div className="menu-panel__foot">
        <Link href="/contacto" className="btn-primary" onClick={close}>
          {t.cta}
          <ArrowRight />
        </Link>
        <a href={`mailto:${site.email}`} className="t-small link-underline muted">
          {site.email}
        </a>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle t-label"
        aria-expanded={open}
        aria-controls="menu-panel"
        data-open={open}
        onClick={() => setOpenAt((p) => (p === pathname ? null : pathname))}
      >
        <span className="menu-toggle__label">{open ? t.mobile.close : t.mobile.open}</span>
        <span className="menu-toggle__icon" aria-hidden="true" />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </>
  );
}

const noopSubscribe = () => () => {};

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <header className="header" data-scrolled={scrolled}>
      <div className="container header__inner">
        <Link href="/" className="header__brand" aria-label={`${site.name} — ${t.a11y.home}`}>
          <Image src={withBase("/brand/aterna-symbol-light.webp")} alt="" width={319} height={320} priority className="header__symbol" />
          <Image src={withBase("/brand/aterna-wordmark-light.webp")} alt={site.name} width={917} height={256} priority className="header__wordmark" />
        </Link>
        <nav className="header__nav" aria-label={t.a11y.nav}>
          <ul>
            {t.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="t-small link-underline"
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header__end">
          <LangToggle className="header__lang" />
          <Link href="/contacto" className="btn-primary header__cta">
            {t.cta}
            <ArrowRight />
          </Link>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
