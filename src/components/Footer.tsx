"use client";

import { withBase } from "@/lib/base";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <hr className="brand-rule" />
      <div className="container footer__inner">
        <div className="footer__brand">
          <Image src={withBase("/brand/aterna-lockup.webp")} alt={site.name} width={808} height={320} className="footer__lockup" />
          <p className="t-small muted">
            {t.hero.eyebrow}.
            <br />
            {t.common.positioning}.
          </p>
        </div>
        <nav className="footer__nav" aria-label="Pie de página">
          <ul>
            {t.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="t-small link-underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer__contact">
          <a href={`mailto:${site.email}`} className="t-small link-underline">
            {site.email}
          </a>
          <ul className="footer__legal">
            <li>
              <Link href="/impressum" className="t-label dim link-underline">Impressum</Link>
            </li>
            <li>
              <Link href="/datenschutz" className="t-label dim link-underline">Datenschutz</Link>
            </li>
            <li>
              <Link href="/legal" className="t-label dim link-underline">Aviso legal y privacidad</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container" aria-hidden="true">
        <p className="footer__giant">Aterna</p>
      </div>
      <div className="container footer__base">
        <p className="t-label dim">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
