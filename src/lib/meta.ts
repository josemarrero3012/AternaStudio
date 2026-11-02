// Títulos y descripciones SEO de cada página en los cuatro idiomas. Solo se
// usan en build (metadatos del HTML): no viajan en el JS del navegador.

import type { Locale } from "./dict";
import type { ServiceSlug } from "./pricing";

export type RouteKey = "home" | "servicios" | "estudio" | "contacto" | ServiceSlug | "legal" | "impressum" | "datenschutz";

type Entry = { title?: string; description: string };

/** Ruta (sin idioma) de cada página. */
const paths: Record<RouteKey, string> = {
  home: "/",
  servicios: "/servicios",
  estudio: "/estudio",
  contacto: "/contacto",
  web: "/servicios/web",
  seo: "/servicios/seo",
  mantenimiento: "/servicios/mantenimiento",
  "asistente-ia": "/servicios/asistente-ia",
  legal: "/legal",
  impressum: "/impressum",
  datenschutz: "/datenschutz",
};

// Las legales se publican tal cual en su idioma: no se indexan.
const noindex = new Set<RouteKey>(["legal", "impressum", "datenschutz"]);

const legal = {
  legal: { title: "Aviso legal y privacidad", description: "Aviso legal, política de privacidad (RGPD) y política de cookies de Aterna Studio." },
  impressum: { title: "Impressum", description: "Impressum von Aterna Studio." },
  datenschutz: { title: "Datenschutzerklärung", description: "Datenschutzerklärung von Aterna Studio." },
} satisfies Partial<Record<RouteKey, Entry>>;

const meta: Record<Locale, { tagline: string } & Record<RouteKey, Entry>> = {
  es: {
    tagline: "Estudio digital independiente",
    home: {
      description:
        "Aterna es un estudio digital independiente de diseño web a medida y SEO. Diseñamos y programamos webs premium, sin plantillas, y trabajamos su crecimiento orgánico para que te encuentren.",
    },
    servicios: {
      title: "Servicios",
      description:
        "Cuatro formas de trabajar juntos: diseño y desarrollo web (pago único), SEO y crecimiento orgánico, mantenimiento y asistente telefónico con IA 24/7. Precios claros.",
    },
    estudio: {
      title: "Estudio",
      description:
        "Aterna es un estudio digital independiente para negocios que aún no tienen web o necesitan una mejor. Aceptamos pocos proyectos y los hacemos de principio a fin.",
    },
    contacto: {
      title: "Contacto",
      description: "Escribe a contacto@aternastudio.com. Respondemos a todo, aunque sea para decir que no somos el estudio adecuado.",
    },
    web: {
      title: "Diseño y desarrollo web",
      description:
        "Diseño, dirección de arte y desarrollo web a medida. Sin plantillas ni plugins. Código propio, rápido y accesible. Desde 1.490 €.",
    },
    seo: {
      title: "SEO y crecimiento orgánico",
      description:
        "SEO y crecimiento orgánico con foco local, para hoteles, bodegas y restaurantes. Trabajo mensual con un informe claro de lo que cambia. Desde 390 €/mes.",
    },
    mantenimiento: {
      title: "Mantenimiento y soporte",
      description:
        "Mantenimiento web: hosting, copias, actualizaciones, seguridad y soporte. Nos ocupamos de que tu web siga rápida y segura. Desde 59 €/mes.",
    },
    "asistente-ia": {
      title: "Asistente telefónico con IA 24/7",
      description:
        "Un asistente de voz con IA que contesta las llamadas de tu negocio 24 horas al día: resuelve dudas, toma reservas y te pasa los recados. Precio personalizado según tus minutos.",
    },
    ...legal,
  },
  en: {
    tagline: "Independent digital studio",
    home: {
      description:
        "Aterna is an independent digital studio for bespoke web design and SEO. We design and build premium websites without templates, and work on their organic growth so people find you.",
    },
    servicios: {
      title: "Services",
      description:
        "Four ways to work together: web design and development (one-off payment), SEO and organic growth, maintenance, and a 24/7 AI phone assistant. Clear prices.",
    },
    estudio: {
      title: "Studio",
      description:
        "Aterna is an independent digital studio for businesses that don’t have a website yet or need a better one. We take on few projects and see each one through from start to finish.",
    },
    contacto: {
      title: "Contact",
      description: "Write to contacto@aternastudio.com. We answer everything, even if it's to say we're not the right studio.",
    },
    web: {
      title: "Web design & development",
      description:
        "Bespoke web design, art direction and development. No templates or plugins. Our own code, fast and accessible. From €1,490.",
    },
    seo: {
      title: "SEO & organic growth",
      description:
        "SEO and organic growth with a local focus, for hotels, wineries and restaurants. Monthly work with a clear report on what changes. From €390/month.",
    },
    mantenimiento: {
      title: "Maintenance & support",
      description:
        "Website maintenance: hosting, backups, updates, security and support. We keep your site fast and secure. From €59/month.",
    },
    "asistente-ia": {
      title: "24/7 AI phone assistant",
      description:
        "An AI voice assistant that answers your business's calls 24 hours a day: it answers questions, takes bookings and passes on messages. Custom pricing based on your minutes.",
    },
    ...legal,
  },
  nl: {
    tagline: "Onafhankelijke digitale studio",
    home: {
      description:
        "Aterna is een onafhankelijke digitale studio voor webdesign op maat en SEO. We ontwerpen en bouwen premium websites zonder templates en werken aan hun organische groei, zodat mensen je vinden.",
    },
    servicios: {
      title: "Diensten",
      description:
        "Vier manieren om samen te werken: webdesign en -ontwikkeling (eenmalige betaling), SEO en organische groei, onderhoud en een AI-telefoonassistent 24/7. Heldere prijzen.",
    },
    estudio: {
      title: "Studio",
      description:
        "Aterna is een onafhankelijke digitale studio voor bedrijven die nog geen website hebben of een betere nodig hebben. We nemen weinig projecten aan en doen ze van begin tot eind.",
    },
    contacto: {
      title: "Contact",
      description: "Schrijf naar contacto@aternastudio.com. We beantwoorden alles, ook als het is om te zeggen dat we niet de juiste studio zijn.",
    },
    web: {
      title: "Webdesign en -ontwikkeling",
      description:
        "Webdesign, art direction en ontwikkeling op maat. Geen templates of plug-ins. Eigen code, snel en toegankelijk. Vanaf € 1.490.",
    },
    seo: {
      title: "SEO en organische groei",
      description:
        "SEO en organische groei met lokale focus, voor hotels, wijnhuizen en restaurants. Maandelijks werk met een helder verslag van wat er verandert. Vanaf € 390 per maand.",
    },
    mantenimiento: {
      title: "Onderhoud en support",
      description:
        "Website-onderhoud: hosting, back-ups, updates, beveiliging en support. Wij zorgen dat je website snel en veilig blijft. Vanaf € 59 per maand.",
    },
    "asistente-ia": {
      title: "AI-telefoonassistent 24/7",
      description:
        "Een AI-spraakassistent die de telefoon van je bedrijf 24 uur per dag opneemt: beantwoordt vragen, neemt reserveringen aan en geeft berichten door. Prijs op maat, op basis van je minuten.",
    },
    ...legal,
  },
  de: {
    tagline: "Unabhängiges Digitalstudio",
    home: {
      description:
        "Aterna ist ein unabhängiges Digitalstudio für Webdesign nach Maß und SEO. Wir gestalten und entwickeln Premium-Websites ohne Templates und arbeiten an ihrem organischen Wachstum, damit man Sie findet.",
    },
    servicios: {
      title: "Leistungen",
      description:
        "Vier Wege der Zusammenarbeit: Webdesign und -entwicklung (Einmalzahlung), SEO und organisches Wachstum, Wartung sowie ein KI-Telefonassistent rund um die Uhr. Klare Preise.",
    },
    estudio: {
      title: "Studio",
      description:
        "Aterna ist ein unabhängiges Digitalstudio für Unternehmen, die noch keine Website haben oder eine bessere brauchen. Wir nehmen wenige Projekte an und betreuen sie von Anfang bis Ende.",
    },
    contacto: {
      title: "Kontakt",
      description: "Schreiben Sie an contacto@aternastudio.com. Wir antworten auf alles, auch wenn es nur ist, um zu sagen, dass wir nicht das richtige Studio sind.",
    },
    web: {
      title: "Webdesign und -entwicklung",
      description:
        "Maßgeschneidertes Webdesign, Art Direction und Entwicklung. Ohne Templates oder Plugins. Eigener Code, schnell und barrierearm. Ab 1.490 €.",
    },
    seo: {
      title: "SEO und organisches Wachstum",
      description:
        "SEO und organisches Wachstum mit lokalem Fokus, für Hotels, Weingüter und Restaurants. Monatliche Arbeit mit einem klaren Bericht, was sich ändert. Ab 390 €/Monat.",
    },
    mantenimiento: {
      title: "Wartung und Support",
      description:
        "Website-Wartung: Hosting, Backups, Updates, Sicherheit und Support. Wir sorgen dafür, dass Ihre Website schnell und sicher bleibt. Ab 59 €/Monat.",
    },
    "asistente-ia": {
      title: "KI-Telefonassistent 24/7",
      description:
        "Ein KI-Sprachassistent, der die Anrufe Ihres Unternehmens rund um die Uhr annimmt: beantwortet Fragen, nimmt Reservierungen an und leitet Nachrichten weiter. Individueller Preis nach Ihren Minuten.",
    },
    ...legal,
  },
};

export function routeMeta(key: RouteKey, locale: Locale) {
  return { ...meta[locale][key], tagline: meta[locale].tagline, path: paths[key], noindex: noindex.has(key) };
}
