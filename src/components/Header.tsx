"use client";

import { withBase } from "@/lib/base";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LOCALES } from "@/lib/dict";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";
import { ArrowRight } from "./icons";

function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={`lang-toggle ${className}`.trim()} role="group" aria-label="Idioma / Language">
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            className="lang-toggle__btn t-label"
            data-active={active}
            aria-pressed={active}
            aria-label={t.langName[l]}
            onClick={() => setLocale(l)}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function MobileMenu() {
  const pathname = usePathname();
  const { t } = useI18n();
  // Guardamos la ruta en la que se abrió: al navegar, el menú se cierra solo.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenAt(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        toggle.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>("a, button");
      if (!items.length) return;
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.menu = "open";
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.menu;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle t-label"
        aria-expanded={open}
        aria-controls="menu-panel"
        onClick={() => setOpenAt((p) => (p === pathname ? null : pathname))}
      >
        {open ? t.mobile.close : t.mobile.open}
      </button>
      <div
        id="menu-panel"
        ref={panel}
        className="menu-panel"
        data-open={open}
        role="dialog"
        aria-modal={open}
        aria-label="Navegación"
        inert={!open}
      >
        <nav className="menu-panel__nav" aria-label="Principal, móvil">
          <ul>
            {t.nav.map((item, i) => (
              <li key={item.href} style={{ transitionDelay: `${90 * i + 120}ms` }}>
                <Link
                  href={item.href}
                  className="t-display"
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <LangToggle />
        </nav>
        <div className="menu-panel__foot">
          <Link href="/contacto" className="btn-primary">
            {t.cta}
            <ArrowRight />
          </Link>
          <a href={`mailto:${site.email}`} className="t-small link-underline muted">
            {site.email}
          </a>
        </div>
      </div>
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // Superficie que pasa por debajo: sobre papel la cabecera se vuelve clara
  // (el velo de tinta sobre papel quedaba gris y el logo desaparecía).
  const [surface, setSurface] = useState<"ink" | "paper">("ink");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
      const el = header.current;
      if (!el) return;
      const y = el.getBoundingClientRect().height / 2;
      const below = document.elementsFromPoint(window.innerWidth / 2, y).find((n) => !el.contains(n));
      setSurface(below?.closest(".on-paper") ? "paper" : "ink");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <header ref={header} className="header" data-scrolled={scrolled} data-surface={surface}>
      <div className="container header__inner">
        <Link href="/" className="header__brand" aria-label={`${site.name} — inicio`}>
          <Image src={withBase("/brand/aterna-symbol.webp")} alt="" width={319} height={320} priority className="header__symbol" />
          <Image src={withBase("/brand/aterna-wordmark.webp")} alt={site.name} width={917} height={256} priority className="header__wordmark" />
        </Link>
        <nav className="header__nav" aria-label="Principal">
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
