"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; text: string };

/**
 * Índice de las páginas legales: fijo a la derecha en escritorio, marca el
 * apartado que se está leyendo (el último titular que ha pasado del primer
 * tercio de la pantalla). Los saltos los suaviza SmoothScroll.
 */
export function LegalToc({ items, title }: { items: TocItem[]; title: string }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => !!h);
    if (!heads.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.33;
      let active = heads[0].id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) active = h.id;
        else break;
      }
      // Al final de la página, el último apartado aunque sea corto.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = heads[heads.length - 1].id;
      setCurrent(active);
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
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav className="legal-toc" aria-label={title}>
      <p className="t-label dim legal-toc__title">{title}</p>
      <ol className="legal-toc__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="legal-toc__link" aria-current={current === item.id ? "location" : undefined}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
