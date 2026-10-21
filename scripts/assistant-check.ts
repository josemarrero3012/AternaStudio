// Comprueba que el asistente (src/lib/assistant.ts) responde bien a preguntas
// reales en los cuatro idiomas. Cada pregunta dice qué fichas valen como
// respuesta (por su `ref`, igual en todos los idiomas).
//
//   npx tsx scripts/assistant-check.ts
//
// Si el modelo está descargado (node scripts/fetch-semantic.mjs) y la librería
// instalada (npm i --no-save @huggingface/transformers), repite la prueba con
// el modelo, como en el navegador de un ordenador. Lo lanza el workflow
// .github/workflows/assistant.yml en cada PR que toque el asistente o los textos.

import path from "node:path";
import { answer, entries, semanticGroups } from "../src/lib/assistant";
import { dict, type Locale } from "../src/lib/dict";

type Case = [Locale, string, string[]];

/** Preguntas que la búsqueda por palabras tiene que acertar sí o sí. */
const CORE: Case[] = [
  ["es", "¿Cuánto cuesta una web?", ["web:planes"]],
  ["es", "cuanto vale una pagina web", ["web:planes"]],
  ["es", "precio de una web", ["web:planes"]],
  ["es", "presio de la web", ["web:planes"]],
  ["es", "presupuesto para una tienda online", ["web:planes", "web"]],
  ["es", "hacéis tiendas online?", ["web", "web:planes"]],
  ["es", "¿Qué incluye el SEO?", ["seo"]],
  ["es", "quiero salir en google", ["seo", "seo:planes"]],
  ["es", "cuando se ven resultados del seo", ["seo:faq:0"]],
  ["es", "me garantizais el primer puesto en google", ["seo:faq:1"]],
  ["es", "cuanto tardais en hacer una web", ["web:faq:0"]],
  ["es", "cuánto se tarda", ["web:faq:0"]],
  ["es", "el codigo es mio?", ["web:faq:1", "pilar:1"]],
  ["es", "precio del mantenimiento", ["mantenimiento:planes"]],
  ["es", "tengo que contratar mantenimiento obligatoriamente", ["mantenimiento:faq:0"]],
  ["es", "hay permanencia", ["mantenimiento:faq:1"]],
  ["es", "que pasa si quiero cancelar", ["mantenimiento:faq:1"]],
  ["es", "un robot que coja el telefono", ["asistente-ia"]],
  ["es", "cuanto cuesta el asistente de llamadas", ["asistente-ia:planes", "asistente-ia:faq:0"]],
  ["es", "tengo que cambiar de numero de telefono", ["asistente-ia:faq:1"]],
  ["es", "que pasa con la proteccion de datos de las llamadas", ["asistente-ia:faq:4"]],
  ["es", "de donde viene el nombre aterna", ["estudio"]],
  ["es", "quien diseña la web", ["pilar:0", "web"]],
  ["es", "¿Cómo trabajáis?", ["metodo"]],
  ["es", "¿Cómo os contacto?", ["contacto"]],
  ["es", "hola", ["hola"]],
  ["es", "receta de paella valenciana", ["fallback"]],
  ["es", "tiempo en madrid mañana", ["fallback"]],
  ["en", "How much does a website cost?", ["web:planes"]],
  ["en", "webiste price", ["web:planes"]],
  ["en", "how long does a website take", ["web:faq:0"]],
  ["en", "do I own the code", ["web:faq:1", "pilar:1", "web"]],
  ["en", "can you get me to the top of google", ["seo:faq:1", "seo"]],
  ["en", "maintenance prices", ["mantenimiento:planes"]],
  ["en", "can I cancel anytime", ["mantenimiento:faq:1"]],
  ["en", "AI that answers my phone calls", ["asistente-ia"]],
  ["en", "do I need to change my phone number", ["asistente-ia:faq:1"]],
  ["en", "how do you work", ["metodo"]],
  ["en", "how can I reach you", ["contacto"]],
  ["nl", "Wat kost een website?", ["web:planes"]],
  ["nl", "hoe lang duurt een website", ["web:faq:0"]],
  ["nl", "kosten onderhoud", ["mantenimiento:planes"]],
  ["nl", "hoe kan ik jullie bereiken", ["contacto"]],
  ["nl", "beter gevonden worden in google", ["seo", "seo:planes"]],
  ["nl", "moet ik mijn telefoonnummer veranderen", ["asistente-ia:faq:1"]],
  ["de", "Was kostet eine Webseite?", ["web:planes"]],
  ["de", "wie lange dauert eine website", ["web:faq:0"]],
  ["de", "Wartung Preise", ["mantenimiento:planes"]],
  ["de", "wie erreiche ich euch", ["contacto"]],
  ["de", "besser bei google gefunden werden", ["seo", "seo:planes"]],
  ["de", "kann ich jederzeit kündigen", ["mantenimiento:faq:1"]],
  ["de", "muss ich meine Telefonnummer ändern", ["asistente-ia:faq:1"]],
];

/** Preguntas dichas con otras palabras: para el modelo (sin él, solo se informa). */
const PARAPHRASE: Case[] = [
  ["es", "¿me ayudáis a salir en Google Maps?", ["seo", "seo:planes"]],
  ["es", "necesito que me lleguen más clientes desde internet", ["seo", "seo:planes"]],
  ["es", "mi web va lenta y nadie la actualiza", ["mantenimiento", "mantenimiento:planes"]],
  ["es", "no puedo coger el teléfono cuando estoy atendiendo", ["asistente-ia"]],
  ["es", "¿la persona que llama sabe que es una máquina?", ["asistente-ia:faq:2"]],
  ["es", "¿qué pasa cuando os escribo?", ["contacto"]],
  ["es", "¿sois una agencia grande?", ["pilar:2", "pilar:0", "estudio"]],
  ["es", "qué tiempo hace hoy", ["fallback"]],
  ["en", "I want more customers to find me online", ["seo", "seo:planes"]],
  ["en", "nobody answers the phone when we're busy", ["asistente-ia"]],
  ["en", "who keeps my site updated and backed up?", ["mantenimiento", "mantenimiento:planes", "web:faq:2"]],
  ["en", "what's the weather like", ["fallback"]],
  ["nl", "ik wil meer klanten via internet", ["seo", "seo:planes"]],
  ["nl", "wie neemt de telefoon op als ik bezig ben", ["asistente-ia"]],
  ["de", "ich möchte mehr Kunden über das Internet", ["seo", "seo:planes"]],
  ["de", "wer geht ans Telefon, wenn ich beschäftigt bin", ["asistente-ia"]],
];

type Sims = (locale: Locale, q: string) => Promise<number[] | undefined>;

async function run(name: string, cases: Case[], sims: Sims) {
  let ok = 0;
  const fails: string[] = [];
  for (const [locale, q, want] of cases) {
    const t = dict[locale];
    const id = answer(q, t, locale, await sims(locale, q));
    const got = typeof id === "number" ? entries(t, locale)[id].ref : id === "hello" ? "hola" : id;
    if (want.includes(got)) ok++;
    else fails.push(`  ✗ [${locale}] ${q} → ${got} (vale: ${want.join(", ")})`);
  }
  console.log(`${name}: ${ok}/${cases.length}`);
  if (fails.length) console.log(fails.join("\n"));
  return fails.length;
}

/** El modelo, si está: como en el navegador, pero en Node. */
async function loadModel(): Promise<Sims | null> {
  try {
    const { env, pipeline } = await import("@huggingface/transformers");
    const { readFile } = await import("node:fs/promises");
    const root = path.join(process.cwd(), "public", "semantic");
    const { model } = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
    env.allowRemoteModels = false;
    env.localModelPath = path.join(root, "models") + path.sep;
    const extractor = await pipeline("feature-extraction", model, { dtype: "q8" });
    const embed = async (texts: string[]) => (await extractor(texts, { pooling: "mean", normalize: true })).tolist() as number[][];
    const indexes = new Map<Locale, number[][][]>();
    const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
    return async (locale, q) => {
      if (!indexes.has(locale)) {
        const groups = semanticGroups(dict[locale], locale);
        const flat = await embed(groups.flat());
        let k = 0;
        indexes.set(locale, groups.map((g) => g.map(() => flat[k++])));
      }
      const [v] = await embed([q]);
      return indexes.get(locale)!.map((vs) => Math.max(...vs.map((x) => dot(v, x))));
    };
  } catch (err) {
    console.log(`(Sin modelo: ${(err as Error).message.split("\n")[0]})`);
    return null;
  }
}

async function main() {
  const none: Sims = async () => undefined;
  let failed = await run("Palabras, preguntas básicas", CORE, none);
  await run("Palabras, preguntas con otras palabras (informativo)", PARAPHRASE, none);
  const model = await loadModel();
  if (model) {
    // AJUSTE TEMPORAL: cuántas acierta con cada suelo y peso del modelo.
    const cache = new Map<string, number[]>();
    const all = [...CORE, ...PARAPHRASE];
    for (const [l, q] of all) cache.set(l + q, (await model(l, q))!);
    for (const floor of [0.3, 0.4, 0.5, 0.6]) {
      const row: string[] = [];
      for (const w of [0, 3, 6, 10, 15, 25]) {
        const tweak: Sims = async (l, q) => cache.get(l + q)!.map((x) => 0.35 + (Math.max(0, x - floor) * w) / 6);
        let c = 0;
        let p = 0;
        for (const [l, q, want] of CORE) {
          const id = answer(q, dict[l], l, await tweak(l, q));
          if (want.includes(typeof id === "number" ? entries(dict[l], l)[id].ref : id === "hello" ? "hola" : id)) c++;
        }
        for (const [l, q, want] of PARAPHRASE) {
          const id = answer(q, dict[l], l, await tweak(l, q));
          if (want.includes(typeof id === "number" ? entries(dict[l], l)[id].ref : id === "hello" ? "hola" : id)) p++;
        }
        row.push(`w${w}: ${c}+${p}`);
      }
      console.log(`suelo ${floor}: ${row.join("  ")}`);
    }
    for (const [l, q] of all) {
      const sims = cache.get(l + q)!;
      const top = sims.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
      console.log(`  [${l}] ${q} :: ${top.map(([x, i]) => `${entries(dict[l], l)[i].ref}=${x.toFixed(2)}`).join(" ")}`);
    }
    failed += await run("Modelo, preguntas básicas", CORE, model);
    failed += await run("Modelo, preguntas con otras palabras", PARAPHRASE, model);
  }
  process.exit(failed ? 1 : 0);
}

main();
