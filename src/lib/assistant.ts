// Cerebro del asistente (Assistant.tsx): responde solo con lo que dice la web.
// La base de conocimiento se construye a partir de dict.ts y pricing.ts, así
// que cualquier cambio de texto o de precio llega al asistente sin tocar
// nada aquí. Para cada pregunta se puntúa cada ficha por las palabras que
// comparte con ella (con sinónimos, sin acentos, tolerando erratas y raíces
// distintas, y dando más peso a las palabras raras) y se devuelve la mejor;
// si ninguna se parece lo bastante, lo dice, propone las más cercanas y
// remite al contacto: «ninguna cifra inventada» también vale para el
// asistente.
//
// En ordenador, además, un modelo pequeño que corre en el navegador
// (lib/semantic.ts) compara el sentido de la pregunta con cada ficha; si está
// listo, `answer` recibe esas similitudes y las suma a la puntuación. No
// redacta nada: elige entre las mismas fichas.
//
// Funciona sin servidor (la web es estática).

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

export type Entry = Reply & {
  /** Nombre fijo de la ficha («web:planes», «seo:faq:1»…), igual en todos los idiomas. */
  ref: string;
  /** Palabras clave (se normalizan al construir). */
  keys: string;
  /** Cómo se pregunta por esta ficha: el texto de su botón de sugerencia. */
  label?: string;
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
  precios: ["precio"],
  cuesta: ["precio"],
  cuestan: ["precio"],
  vale: ["precio"],
  valen: ["precio"],
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
  prices: ["precio"],
  pricing: ["precio"],
  plans: ["precio"],
  quote: ["precio", "contacto"],
  web: ["web"],
  pagina: ["web"],
  website: ["web"],
  site: ["web"],
  tienda: ["web"],
  shop: ["web"],
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
  robot: ["asistente"],
  bot: ["asistente"],
  contacto: ["contacto"],
  contactar: ["contacto"],
  contact: ["contacto"],
  reach: ["contacto"],
  email: ["contacto"],
  correo: ["contacto"],
  whatsapp: ["contacto"],
  escribir: ["contacto"],
  hablar: ["contacto"],
  empezar: ["contacto"],
  start: ["contacto"],
  tardais: ["plazo"],
  tarda: ["plazo"],
  semanas: ["plazo"],
  long: ["plazo"],
  proceso: ["metodo"],
  trabajais: ["metodo"],
  work: ["metodo"],
  pasos: ["metodo"],
  cancelar: ["cancelar", "permanencia"],
  baja: ["cancelar"],
  permanencia: ["cancelar"],
  cancel: ["cancelar"],
  contract: ["cancelar"],
  mio: ["mio"],
  propiedad: ["mio"],
  own: ["mio"],
  mine: ["mio"],
  wordpress: ["plantilla", "plugins"],
  plantillas: ["plantilla"],
  templates: ["plantilla"],
  template: ["plantilla"],
  numero: ["numero"],
  number: ["numero"],
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
  telefoonnummer: ["asistente", "numero"],
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
  werken: ["metodo"],
  werkwijze: ["metodo"],
  stappen: ["metodo"],
  opzeggen: ["cancelar"],
  stoppen: ["cancelar"],
  nummer: ["numero"],
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
  telefonnummer: ["asistente", "numero"],
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
  arbeiten: ["metodo"],
  ablauf: ["metodo"],
  schritte: ["metodo"],
  kundigen: ["cancelar"],
  kundigung: ["cancelar"],
  vertrag: ["cancelar"],
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

/** Cada palabra de la pregunta con sus sinónimos: cuentan una sola vez. */
function words(s: string) {
  const out: { w: string; forms: string[] }[] = [];
  for (const w of new Set(norm(s).split(/\s+/))) {
    if (!w || STOP.has(w)) continue;
    out.push({ w, forms: [...new Set([stem(w), ...(SYN[w] ?? []).map(stem)])] });
  }
  return out;
}

/** Distancia de edición (con transposiciones), cortando en cuanto pasa de `max`. */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      low = Math.min(low, v);
    }
    if (low > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Letras iniciales que comparten dos palabras. */
function prefix(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * Palabras de la base que cuentan como `w`, con su peso: la misma (1), una
 * con la misma raíz larga («posicionarme» / «posicionamiento», 0,75) o la
 * misma con una errata («manteniemiento», 0,8).
 */
function variants(w: string, vocab: Set<string>): [string, number][] {
  if (vocab.has(w)) return [[w, 1]];
  if (w.length < 4 || /^\d+$/.test(w)) return [];
  const out: [string, number][] = [];
  const max = w.length >= 7 ? 2 : 1;
  let typo: string | undefined;
  let best = max + 1;
  for (const v of vocab) {
    if (v.length >= 5 && w.length >= 5 && prefix(v, w) >= Math.max(5, Math.min(v.length, w.length) - 3)) out.push([v, 0.75]);
    else {
      const d = distance(w, v, max);
      if (d < best) {
        best = d;
        typo = v;
      }
    }
  }
  if (typo && best <= max && !out.some(([v]) => v === typo)) out.push([typo, 0.8]);
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
  const out: Entry[] = [{ ref: "hola", topic: "hello", keys: "hola quien eres ayuda", text: a.hello }];

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
      ref: slug,
      service: slug,
      label: card.title,
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
      ref: `${slug}:planes`,
      topic: "price",
      service: slug,
      label: a.plansLabel.replace("{service}", card.title),
      keys: `${base} precio planes ${page.plans.map((p) => p.name).join(" ")}`,
      text: `${a.plansIntro.replace("{service}", card.title)} ${plans}. ${page.plansNote}`,
      href: `${href}#planes`,
      link: t.common.seePlans,
    });
    // Preguntas frecuentes de cada servicio.
    page.faq.forEach((f, k) => {
      out.push({ ref: `${slug}:faq:${k}`, service: slug, label: f.q, keys: `${base} ${f.q}`, text: f.a, href, link: card.cta });
    });
    if (page.report) {
      out.push({ ref: `${slug}:informe`, service: slug, label: page.reportTitle, keys: `${base} ${page.reportTitle} informe`, text: page.report, href, link: card.cta });
    }
  }

  // El estudio: qué nos diferencia y en qué creemos.
  t.studioHome.pillars.forEach((p, k) => {
    out.push({ ref: `pilar:${k}`, label: p.title, keys: `estudio ${p.title} ${p.body}`, text: `${p.title}. ${p.body}`, href: "/estudio", link: a.studioLink });
  });
  out.push({
    ref: "estudio",
    label: a.studioLink,
    keys: `estudio aterna quienes sois nombre simbolo arbol ${t.pages.estudio.prose.join(" ")}`,
    text: t.pages.estudio.prose.join(" "),
    href: "/estudio",
    link: a.studioLink,
  });
  t.pages.estudio.beliefs.forEach((b, k) => {
    out.push({ ref: `creencia:${k}`, label: b.title, keys: `creemos ${b.title} ${b.body}`, text: `${b.title}. ${b.body}`, href: "/estudio", link: a.studioLink });
  });

  // Casos de uso, solo los publicados (los pendientes son huecos sin datos).
  t.cases.items.forEach((c, k) => {
    if (c.pending) return;
    out.push({
      ref: `caso:${k}`,
      label: c.title,
      keys: `caso casos ejemplo cliente ${c.sector} ${c.title} ${c.problem} ${c.solution}`,
      text: `${c.title} (${c.sector}). ${c.problem} ${c.solution}`,
      href: "/#casos",
      link: t.cases.eyebrow,
    });
  });

  // Cómo trabajamos.
  out.push({
    ref: "metodo",
    topic: "method",
    label: t.approach.eyebrow,
    keys: `metodo como trabajamos trabajais proceso fases ${t.approach.title} ${t.approach.items.map((i) => `${i.title} ${i.body}`).join(" ")}`,
    text: `${t.approach.items.map((i) => `${i.title}: ${i.body}`).join(" ")}`,
    href: "/#metodo",
    link: a.methodLink,
  });

  // Contacto y qué pasa después.
  out.push({
    ref: "contacto",
    topic: "contact",
    label: a.contactLabel,
    keys: `contacto email whatsapp escribir hablar empezar proyecto disponibilidad ${t.finalCta.next.map((s) => s.title).join(" ")}`,
    text: `${site.email} · WhatsApp ${site.whatsapp}. ${t.finalCta.next.map((s) => `${s.title}: ${s.body}`).join(" ")} ${t.finalCta.availability}`,
    href: "/contacto",
    link: a.contactLink,
  });

  return out;
}

type Base = {
  entries: Entry[];
  /**
   * Palabras de cada ficha: las de su pregunta (pesan más), sus palabras
   * clave y las de su respuesta (pesan menos).
   */
  label: Set<string>[];
  keys: Set<string>[];
  body: Set<string>[];
  vocab: Set<string>;
  /** Rareza de cada palabra (0–1): «precio» sale en muchas fichas y pesa poco. */
  idf: Map<string, number>;
};

const cache = new WeakMap<Dict, Base>();

function base(t: Dict, locale: Locale): Base {
  let kb = cache.get(t);
  if (!kb) {
    const entries = knowledge(t, locale);
    const label = entries.map((e) => tokens(e.label ?? ""));
    const keys = entries.map((e) => tokens(`${e.keys} ${e.label ?? ""}`));
    const body = entries.map((e) => tokens(e.text));
    const vocab = new Set<string>();
    const df = new Map<string, number>();
    entries.forEach((_, i) => {
      for (const w of new Set([...keys[i], ...body[i]])) {
        vocab.add(w);
        df.set(w, (df.get(w) ?? 0) + 1);
      }
    });
    const n = entries.length;
    const idf = new Map([...df].map(([w, d]) => [w, Math.log(1 + n / d) / Math.log(1 + n)]));
    kb = { entries, label, keys, body, vocab, idf };
    cache.set(t, kb);
  }
  return kb;
}

/** Las fichas de la web en el idioma de `t` (para el modelo del navegador). */
export function entries(t: Dict, locale: Locale) {
  return base(t, locale).entries;
}

/** La respuesta `id` en el idioma de `t`. */
export function replyFor(id: ReplyId, t: Dict, locale: Locale): Reply {
  if (id === "hello") return { text: t.assistant.hello };
  const entry = typeof id === "number" ? base(t, locale).entries[id] : undefined;
  if (!entry) return { text: t.assistant.fallback, href: "/contacto", link: t.assistant.contactLink };
  const { text, href, link } = entry;
  return { text, href, link };
}

/** Texto del botón que lleva a la ficha `id`. */
export function labelFor(id: number, t: Dict, locale: Locale) {
  return base(t, locale).entries[id]?.label ?? "";
}

/** Por debajo de esto, la ficha no responde a la pregunta. */
const ENOUGH = 1.4;
/**
 * Similitud del modelo a partir de la cual cuenta, y cuánto. Ajustado con
 * scripts/assistant-check.ts: más peso empieza a estropear preguntas que las
 * palabras ya aciertan.
 */
const SEM_FLOOR = 0.3;
const SEM_WEIGHT = 3.5;

/**
 * Puntúa cada ficha para `question`, de mayor a menor. `semantic`, si llega,
 * es la similitud (coseno, −1 a 1) de la pregunta con cada ficha según el
 * modelo del navegador.
 */
export function rank(question: string, t: Dict, locale: Locale, semantic?: ArrayLike<number>) {
  const kb = base(t, locale);
  const q = words(question);
  // Cada palabra de la pregunta, con las de la base que cuentan como ella.
  const expanded = q.map(({ w, forms }) => ({ w, vs: forms.flatMap((f) => variants(f, kb.vocab)) }));
  const has = (w: string) => expanded.some((e) => e.vs.some(([v]) => v === w));
  const wantsPrice = has("precio");
  const wantsContact = has("contacto");
  const wantsMethod = has("metodo");
  // Servicios que la pregunta nombra por su nombre o sus palabras propias.
  const named = new Set(
    (Object.keys(SERVICE_KEYS) as ServiceSlug[]).filter((slug) => [...tokens(SERVICE_KEYS[slug])].some((w) => has(w))),
  );

  const scores = kb.entries.map((entry, i) => {
    let s = 0;
    for (const { w, vs } of expanded) {
      let best = 0;
      for (const [v, weight] of vs) {
        const field = kb.label[i].has(v) ? 1.3 : kb.keys[i].has(v) ? 1 : kb.body[i].has(v) ? 0.5 : 0;
        best = Math.max(best, field * weight * (0.4 + 1.2 * (kb.idf.get(v) ?? 0)));
      }
      s += w.length > 3 ? best : best * 0.6;
    }
    const topic = entry.topic;
    if (topic === "price") s += wantsPrice ? 1.5 : -0.5;
    if (topic === "contact" && wantsContact) s += 1.5;
    if (topic === "method" && wantsMethod) s += 1.5;
    if (entry.service && named.size) s += named.has(entry.service) ? 1.5 : -1;
    if (topic === "hello") s += q.length > 2 ? -1 : has("hola") ? 1 : 0;
    // El modelo suma lo que entiende por encima del ruido: a 0,3 nada, a
    // 0,8 más o menos lo que dos palabras clave acertadas.
    const sim = semantic?.[i];
    if (sim !== undefined) s += Math.max(0, sim - SEM_FLOOR) * SEM_WEIGHT;
    return { id: i, score: s };
  });
  return { empty: !q.length, scores: scores.sort((x, y) => y.score - x.score) };
}

/** Qué ficha de la web responde mejor a `question`. */
export function answer(question: string, t: Dict, locale: Locale, semantic?: ArrayLike<number>): ReplyId {
  const { empty, scores } = rank(question, t, locale, semantic);
  if (empty) return "hello";
  const [top] = scores;
  if (!top || top.score < ENOUGH) return "fallback";
  return top.id;
}

/**
 * Fichas parecidas a `question` para ofrecer cuando no hay respuesta clara
 * («¿Te refieres a…?»): las tres mejores que se acercan algo.
 */
export function nearest(question: string, t: Dict, locale: Locale, semantic?: ArrayLike<number>) {
  const kb = base(t, locale);
  return rank(question, t, locale, semantic)
    .scores.filter((s) => s.score >= 0.5 && kb.entries[s.id].label && kb.entries[s.id].topic !== "hello")
    .slice(0, 3)
    .map((s) => s.id);
}

/**
 * Preguntas que siguen bien a la ficha `id`: otras del mismo servicio (antes
 * las que aún no se han visto) o, si no es de un servicio, cómo trabajamos y
 * el contacto.
 */
export function followUps(id: ReplyId, seen: ReadonlySet<number>, t: Dict, locale: Locale, max = 2) {
  const kb = base(t, locale);
  const entry = typeof id === "number" ? kb.entries[id] : undefined;
  const pick = (ids: number[]) => ids.filter((i) => i !== id && !seen.has(i) && kb.entries[i].label).slice(0, max);
  const all = kb.entries.map((_, i) => i);
  if (entry?.service) return pick(all.filter((i) => kb.entries[i].service === entry.service));
  return pick(all.filter((i) => kb.entries[i].topic === "method" || kb.entries[i].topic === "contact"));
}

/** Qué compara el modelo del navegador con la pregunta: la pregunta de cada ficha y el principio de su respuesta. */
export function semanticGroups(t: Dict, locale: Locale) {
  return base(t, locale).entries.map((e) => [e.label ?? "", e.text.slice(0, 400)].filter(Boolean));
}
