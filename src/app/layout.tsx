import { withBase } from "@/lib/base";
import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, Geist_Mono } from "next/font/google";
import { Curtain, Cursor, PageTransition, SmoothScroll, WhatsAppWidget } from "@/components/Chrome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { LanguageProvider } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...pageMeta({ path: "/" }),
  icons: { icon: [{ url: withBase("/favicon.ico") }, { url: withBase("/brand/icon.png"), type: "image/png" }], apple: withBase("/brand/apple-icon.png") },
};

export const viewport: Viewport = { themeColor: "#08080a" };

const organization = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      email: site.email,
      description: site.description,
      logo: `${site.url}/brand/aterna-mark.png`,
      contactPoint: { "@type": "ContactPoint", email: site.email, contactType: "customer support" },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: "es",
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${archivo.variable} ${geistMono.variable}`}>
      <body>
        <JsonLd data={organization} />
        <LanguageProvider>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <Curtain />
          <Cursor />
          <SmoothScroll>
            <Header />
            <main id="contenido">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </SmoothScroll>
          <WhatsAppWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
