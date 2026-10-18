"use client";

import { withBase } from "@/lib/base";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";
import { whatsappHref } from "./Chrome";
import { ArrowExternal } from "./icons";

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
        <div className="footer__cols">
          <nav className="footer__col" aria-label={t.servicePages.index.eyebrow}>
            <p className="t-label dim">{t.servicePages.index.eyebrow}</p>
            <ul>
              {t.servicePages.index.cards.map((card) => (
                <li key={card.slug}>
                  <Link href={`/servicios/${card.slug}`} className="t-small link-underline">
                    {card.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="footer__col" aria-label="Aterna">
            <p className="t-label dim">Aterna</p>
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
          <div className="footer__col">
            <p className="t-label dim">{t.finalCta.eyebrow}</p>
            <ul>
              <li>
                <a href={`mailto:${site.email}`} className="t-small link-underline">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={whatsappHref(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="t-small link-underline">
                  WhatsApp
                  <ArrowExternal size={13} />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container footer__horizon" aria-hidden="true">
        <p className="footer__giant">Aterna</p>
      </div>
      <div className="container footer__base">
        <p className="t-label dim">
          © {new Date().getFullYear()} {site.name}
        </p>
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
    </footer>
  );
}
