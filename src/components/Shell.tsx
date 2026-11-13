import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Assistant } from "@/components/Assistant";
import { BOOT_SCRIPT, Cursor, IntroStart, PageTransition, SkipLink, SmoothScroll, Spotlight, WhatsAppWidget } from "@/components/Chrome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { LightDust } from "@/components/LightDust";
import { ScrollReveal } from "@/components/ScrollReveal";
import { withBase } from "@/lib/base";
import { dict, type Locale } from "@/lib/dict";
import { LanguageProvider } from "@/lib/i18n";
import { routeMeta } from "@/lib/meta";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";
import "@/app/globals.css";

const fraunces = Fraunces({ subsets: ["latin"], style: ["normal"], axes: ["opsz"], variable: "--font-fraunces", display: "swap" });
// La cursiva solo la usa la portada (los titulares del recorrido): sin
// precarga, el navegador la pide cuando hace falta y el resto de páginas no
// la descarga (81 KB).
const frauncesItalic = Fraunces({ subsets: ["latin"], style: ["italic"], axes: ["opsz"], variable: "--font-fraunces-italic", display: "swap", preload: false });
// Texto en Geist: de la misma familia que la mono de las etiquetas, más
// estrecha y fina que Archivo; contrasta mejor con Fraunces.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/** Lo común a los dos layouts raíz; cada página pone sus propios metadatos. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(site.url),
  icons: { icon: [{ url: withBase("/favicon.ico") }, { url: withBase("/brand/icon.png"), type: "image/png" }], apple: withBase("/brand/apple-icon.png") },
};

export const rootViewport: Viewport = { themeColor: "#13163b" };

function organization(locale: Locale) {
  const url = absoluteUrl("/", locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        email: site.email,
        description: routeMeta("home", locale).description,
        logo: `${site.url}/brand/aterna-mark.png`,
        contactPoint: { "@type": "ContactPoint", email: site.email, contactType: "customer support" },
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: site.name,
        inLanguage: locale,
        publisher: { "@id": `${site.url}/#organization` },
      },
    ],
  };
}

/**
 * Documento completo de cada idioma. Hay dos layouts raíz que lo usan: el
 * español, en la raíz del sitio (app/(es)), y el de /en, /nl y /de
 * (app/[lang]). Así el HTML exportado ya lleva su lang y sus textos.
 */
export function Shell({ locale, lost, children }: { locale: Locale; lost?: boolean; children: ReactNode }) {
  return (
    // data-motion y data-veil los pone BOOT_SCRIPT antes de hidratar: no es un desajuste.
    <html lang={locale} className={`${fraunces.variable} ${frauncesItalic.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        {/* Antes que nada: movimiento y velo entre idiomas (ver Chrome.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <JsonLd data={organization(locale)} />
        <LanguageProvider locale={locale} t={dict[locale]} lost={lost}>
          <SkipLink />
          <IntroStart />
          <Cursor />
          <Spotlight />
          <LightDust />
          <ScrollReveal />
          <SmoothScroll>
            <Header />
            <main id="contenido" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </SmoothScroll>
          <WhatsAppWidget />
          <Assistant />
        </LanguageProvider>
      </body>
    </html>
  );
}
