// Cerebro del asistente (Assistant.tsx): responde solo con lo que dice la web.
// La base de conocimiento se construye a partir de dict.ts y pricing.ts, así
// que cualquier cambio de texto o de precio llega al asistente sin tocar
// nada aquí. Para cada pregunta se puntúa cada ficha por las palabras que
// comparte con ella (con sinónimos y sin acentos) y se devuelve la mejor;
// si ninguna se parece lo bastante, lo dice y remite al contacto: «ninguna
// cifra inventada» también vale para el asistente.
//
// Funciona sin servidor (la web es estática). Para cambiarlo por un modelo de
// lenguaje bastaría con que `answer` llamase a un endpoint propio y le pasara
// `knowledge(t, locale)` como contexto.

import type { Dict, Locale } from "./dict";
import { formatPrice, pricing, slugToProduct, startingPrice, type ServiceSlug } from "./pricing";
import { site } from "./site";

export type Reply = { text: string; href?: string; link?: string };

/**
 * Qué ficha respondió: su posición en la base de conocimiento, o el saludo y
 * el «no lo sé». Las fichas salen en el mismo orden en todos los idiomas, así
 * que la misma respuesta se puede volver a leer en otro idioma.
 */
export type ReplyId = number | "hello" | "fallback";

type Entry = Reply & {
  /** Palabras clave (se normalizan al construir). */
  keys: string;
  /** Tema de la ficha: si la pregunta habla de precio, ganan las de precio. */
  topic?: "price" | "contact" | "hello" | "method";
  /** Servicio al que pertenece: si la pregunta lo nombra, gana. */
  service?: ServiceSlug;
};

/** Minúsculas, sin acentos ni signos. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9€\s]/g, " ");

const STOP = new Set(
  (
    "a al algo como con cual cuales de del el ella en es esta este esto hay la las lo los me mi mis no o os para pero por que se si sin su sus te tu un una uno unos y ya yo vosotros nosotros quiero puedo puedes podeis teneis tiene tienen hace haceis " +
    "a an and are be can do does for how i in is it me my of on or the to what which with you your we our us " +
    "de het een en of is zijn ik je jij jullie u we wij mijn jouw uw ons onze wat welke hoe met voor van in op aan te er dat die dit kan kunnen wil heb hebben doet doen " +
    "der die das den dem des ein eine einen einem und oder ist sind ich du sie wir ihr mein meine ihre unser was welche wie mit fur von in auf an zu es dass kann konnen mochte habe haben macht machen"
  ).split(" "),
);

/** Sinónimos: cada palabra de la izquierda cuenta también como las de la derecha. */
const SYN: Record<string, string[]> = {
  precio: ["precio", "price"],
  cuesta: ["precio"],
  cuestan: ["precio"],
  coste: ["precio"],
  costo: ["precio"],
  tarifa: ["precio"],
  tarifas: ["precio"],
  presupuesto: ["precio", "contacto"],
  plan: ["precio"],
  planes: ["precio"],
  pagar: ["precio"],
  cost: ["precio"],
  costs: ["precio"],
  much: ["precio"],
  pricing: ["precio"],
  plans: ["precio"],
  web: ["web"],
  pagina: ["web"],
  website: ["web"],
  site: ["web"],
  tienda: ["web"],
  diseno: ["web"],
  design: ["web"],
  google: ["seo"],
  posicionamiento: ["seo"],
  encuentren: ["seo"],
  found: ["seo"],
  ranking: ["seo"],
  hosting: ["mantenimiento"],
  dominio: ["mantenimiento"],
  copias: ["mantenimiento"],
  maintenance: ["mantenimiento"],
  soporte: ["mantenimiento"],
  support: ["mantenimiento"],
  telefono: ["asistente"],
  llamadas: ["asistente"],
  llamada: ["asistente"],
  phone: ["asistente"],
  calls: ["asistente"],
  voz: ["asistente"],
  voice: ["asistente"],
  ia: ["asistente"],
  ai: ["asistente"],
  contacto: ["contacto"],
  contactar: ["contacto"],
  contact: ["contacto"],
  email: ["contacto"],
  correo: ["contacto"],
  whatsapp: ["contacto"],
  escribir: ["contacto"],
  hablar: ["contacto"],
  empezar: ["contacto"],
  start: ["contacto"],
  tardais: ["plazo"],
  tarda: ["plazo"],
  tiempo: ["plazo"],
  semanas: ["plazo"],
  long: ["plazo"],
  proceso: ["metodo"],
  trabajais: ["metodo"],
  work: ["metodo"],
  pasos: ["metodo"],
  hola: ["hola"],
  hello: ["hola"],
  hi: ["hola"],
  buenas: ["hola"],
  // Neerlandés.
  kost: ["precio"],
  kosten: ["precio"],
  prijs: ["precio"],
  prijzen: ["precio"],
  pakket: ["precio"],
  pakketten: ["precio"],
  tarief: ["precio"],
  offerte: ["precio", "contacto"],
  betalen: ["precio"],
  gevonden: ["seo"],
  vindbaarheid: ["seo"],
  onderhoud: ["mantenimiento"],
  domein: ["mantenimiento"],
  telefoon: ["asistente"],
  gesprekken: ["asistente"],
  bellen: ["asistente"],
  stem: ["asistente"],
  mail: ["contacto"],
  bereiken: ["contacto"],
  bereik: ["contacto"],
  contacteren: ["contacto"],
  schrijven: ["contacto"],
  beginnen: ["contacto"],
  duurt: ["plazo"],
  weken: ["plazo"],
  tijd: ["plazo"],
  werken: ["metodo"],
  werkwijze: ["metodo"],
  stappen: ["metodo"],
  hallo: ["hola"],
  hoi: ["hola"],
  // Alemán (sin diéresis: norm() las quita).
  preis: ["precio"],
  preise: ["precio"],
  kostet: ["precio"],
  paket: ["precio"],
  pakete: ["precio"],
  angebot: ["precio", "contacto"],
  bezahlen: ["precio"],
  webseite: ["web"],
  seite: ["web"],
  gefunden: ["seo"],
  sichtbarkeit: ["seo"],
  wartung: ["mantenimiento"],
  domain: ["mantenimiento"],
  telefon: ["asistente"],
  anrufe: ["asistente"],
  anruf: ["asistente"],
  stimme: ["asistente"],
  ki: ["asistente"],
  kontakt: ["contacto"],
  erreichen: ["contacto"],
  erreiche: ["contacto"],
  kontaktieren: ["contacto"],
  melden: ["contacto"],
  schreiben: ["contacto"],
  anfangen: ["contacto"],
  dauert: ["plazo"],
  wochen: ["plazo"],
  zeit: ["plazo"],
  arbeiten: ["metodo"],
  ablauf: ["metodo"],
  schritte: ["metodo"],
  guten: ["hola"],
};

/** Raíz sencilla: «servicios» y «servicio» cuentan igual. */
const stem = (w: string) => (w.length > 4 ? w.replace(/(es|s)$/, "") : w);

function tokens(s: string) {
  const out = new Set<string>();
  for (const w of norm(s).split(/\s+/)) {
    if (!w || STOP.has(w)) continue;
    out.add(stem(w));
    for (const s2 of SYN[w] ?? []) out.add(stem(s2));
  }
  return out;
}

/** Palabras con las que se pregunta por cada servicio. */
const SERVICE_KEYS: Record<ServiceSlug, string> = {
  web: "web pagina diseno desarrollo crear rediseno tienda reservas codigo website webdesign webseite ontwerp",
  seo: "seo google posicionamiento crecimiento organico encontrar aparecer busqueda local vindbaarheid sichtbarkeit",
  mantenimiento: "mantenimiento soporte hosting dominio copias actualizaciones seguridad maintenance onderhoud wartung",
  "asistente-ia": "asistente telefono llamadas ia inteligencia artificial voz recepcion telefoon telefon ki",
};

/** Todo lo que el asistente sabe, en el idioma de la web. */
export function knowledge(t: Dict, locale: Locale): Entry[] {
  const a = t.assistant;
  const price = (amount: number, unit: "once" | "month", from?: boolean) =>
    `${from ? `${t.common.priceFrom} ` : ""}${formatPrice(amount, locale)}${unit === "month" ? t.common.perMonth : ` (${t.common.oncePayment})`}`;
  const out: Entry[] = [{ topic: "hello", keys: "hola quien eres ayuda", text: a.hello }];

  for (const card of t.servicePages.index.cards) {
    const slug = card.slug as ServiceSlug;
    const product = slugToProduct[slug];
    const page = t.servicePages[product];
    const href = `/servicios/${slug}`;
    const base = `${card.title} ${SERVICE_KEYS[slug]} ${slug}`;
    const start = startingPrice[product];
    const startText = start.custom ? t.common.customPrice : price(start.amount, start.unit, true);

    // Qué es y qué incluye.
    out.push({
      service: slug,
      keys: `${base} ${card.body} ${page.lead} ${page.includes.join(" ")} incluye servicio`,
      text: `${card.body} ${page.includesTitle}: ${page.includes.join(" · ")}. ${startText}.`,
      href,
      link: card.cta,
    });
    // Precios, plan por plan.
    const plans = page.plans
      .map((plan, i) => {
        const p = pricing[product][i];
        const amount = p.custom ? a.custom : price(p.amount, p.unit, p.from);
        return `${plan.name}: ${amount}`;
      })
      .join(" · ");
    out.push({
      topic: "price",
      service: slug,
      keys: `${base} precio planes ${page.plans.map((p) => p.name).join(" ")}`,
      text: `${a.plansIntro.replace("{service}", card.title)} ${plans}. ${page.plansNote}`,
      href: `${href}#planes`,
      link: t.common.seePlans,
    });
    // Preguntas frecuentes de cada servicio.
    for (const f of page.faq) {
      out.push({ service: slug, keys: `${base} ${f.q}`, text: f.a, href, link: card.cta });
    }
    if (page.report) out.push({ service: slug, keys: `${base} ${page.reportTitle} informe`, text: page.report, href, link: card.cta });
  }

  // El estudio: qué nos diferencia y en qué creemos.
  for (const p of t.studioHome.pillars) {
    out.push({ keys: `estudio ${p.title} ${p.body}`, text: `${p.title}. ${p.body}`, href: "/estudio", link: a.studioLink });
  }
  out.push({
    keys: `estudio aterna quienes sois nombre simbolo arbol ${t.pages.estudio.prose.join(" ")}`,
    text: t.pages.estudio.prose.join(" "),
    href: "/estudio",
    link: a.studioLink,
  });
  for (const b of t.pages.estudio.beliefs) {
    out.push({ keys: `creemos ${b.title} ${b.body}`, text: `${b.title}. ${b.body}`, href: "/estudio", link: a.studioLink });
  }

  // Casos de uso, solo los publicados (los pendientes son huecos sin datos).
  for (const c of t.cases.items) {
    if (c.pending) continue;
    out.push({
      keys: `caso casos ejemplo cliente ${c.sector} ${c.title} ${c.problem} ${c.solution}`,
      text: `${c.title} (${c.sector}). ${c.problem} ${c.solution}`,
      href: "/#casos",
      link: t.cases.eyebrow,
    });
  }

  // Cómo trabajamos.
  out.push({
    topic: "method",
    keys: `metodo como trabajamos trabajais proceso fases ${t.approach.title} ${t.approach.items.map((i) => `${i.title} ${i.body}`).join(" ")}`,
    text: `${t.approach.items.map((i) => `${i.title}: ${i.body}`).join(" ")}`,
    href: "/#metodo",
    link: a.methodLink,
  });

  // Contacto y qué pasa después.
  out.push({
    topic: "contact",
    keys: `contacto email whatsapp escribir hablar empezar proyecto disponibilidad ${t.finalCta.next.map((s) => s.title).join(" ")}`,
    text: `${site.email} · WhatsApp ${site.whatsapp}. ${t.finalCta.next.map((s) => `${s.title}: ${s.body}`).join(" ")} ${t.finalCta.availability}`,
    href: "/contacto",
    link: a.contactLink,
  });

  return out;
}

const cache = new WeakMap<Dict, { entries: Entry[]; sets: Set<string>[] }>();

function base(t: Dict, locale: Locale) {
  let kb = cache.get(t);
  if (!kb) {
    const entries = knowledge(t, locale);
    kb = { entries, sets: entries.map((e) => tokens(e.keys)) };
    cache.set(t, kb);
  }
  return kb;
}

/** La respuesta `id` en el idioma de `t`. */
export function replyFor(id: ReplyId, t: Dict, locale: Locale): Reply {
  if (id === "hello") return { text: t.assistant.hello };
  const entry = typeof id === "number" ? base(t, locale).entries[id] : undefined;
  if (!entry) return { text: t.assistant.fallback, href: "/contacto", link: t.assistant.contactLink };
  const { text, href, link } = entry;
  return { text, href, link };
}

/** Qué ficha de la web responde mejor a `question`. */
export function answer(question: string, t: Dict, locale: Locale): ReplyId {
  const kb = base(t, locale);
  const q = tokens(question);
  if (!q.size) return "hello";
  const wantsPrice = q.has("precio");
  const wantsContact = q.has("contacto");
  const wantsMethod = q.has("metodo");
  // Servicios que la pregunta nombra por su nombre o sus palabras propias.
  const named = new Set(
    (Object.keys(SERVICE_KEYS) as ServiceSlug[]).filter((slug) => [...tokens(SERVICE_KEYS[slug])].some((w) => q.has(w))),
  );

  let best = -1;
  let score = 0;
  kb.sets.forEach((set, i) => {
    let s = 0;
    for (const w of q) if (set.has(w)) s += w.length > 3 ? 1 : 0.6;
    const topic = kb.entries[i].topic;
    if (topic === "price") s += wantsPrice ? 1.5 : -0.5;
    if (topic === "contact" && wantsContact) s += 1.5;
    if (topic === "method" && wantsMethod) s += 1.5;
    const service = kb.entries[i].service;
    if (service && named.size) s += named.has(service) ? 2 : -1;
    if (topic === "hello") s += q.size > 2 ? -1 : q.has("hola") ? 1 : 0;
    if (s > score) {
      score = s;
      best = i;
    }
  });

  if (best < 0 || score < 1.5) return "fallback";
  return best;
}
