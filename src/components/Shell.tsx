import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Assistant } from "@/components/Assistant";
import { CURTAIN_SCRIPT, Curtain, Cursor, PageTransition, SkipLink, SmoothScroll, Spotlight, WhatsAppWidget } from "@/components/Chrome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { withBase } from "@/lib/base";
import type { Locale } from "@/lib/dict";
import { LanguageProvider } from "@/lib/i18n";
import { routeMeta } from "@/lib/meta";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";
import "@/app/globals.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
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
    // data-curtain lo pone CURTAIN_SCRIPT antes de hidratar: no es un desajuste.
    <html lang={locale} className={`${fraunces.variable} ${archivo.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        {/* Antes que nada: decide si la cortina de entrada sale (ver Chrome.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: CURTAIN_SCRIPT }} />
        <noscript>
          <style>{".curtain{display:none}.hero__still{opacity:1}"}</style>
        </noscript>
        <JsonLd data={organization(locale)} />
        <LanguageProvider locale={locale} lost={lost}>
          <SkipLink />
          <Curtain />
          <Cursor />
          <Spotlight />
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
