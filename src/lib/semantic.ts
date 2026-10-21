// Modelo del asistente en el navegador: compara el sentido de la pregunta con
// cada ficha de la web (lib/assistant.ts), así que entiende «¿me ayudáis a
// salir en Google Maps?» aunque no diga «SEO». No redacta: solo puntúa.
//
// Pesa unos 130 MB (modelo y motor), así que solo se carga en ordenador, con
// buena conexión y sin ahorro de datos, y solo cuando alguien se acerca al
// asistente. Lo sirve la propia web (public/semantic, que descarga
// scripts/fetch-semantic.mjs al compilar): nada sale a terceros. Si falta o
// falla, el asistente sigue con la búsqueda por palabras.

import { withBase } from "./base";

type Status = "off" | "loading" | "ready" | "failed";

/** Textos de cada ficha: su pregunta y el principio de su respuesta. */
export type Groups = string[][];

let status: Status = "off";
let worker: Worker | null = null;
let model = "";
let seq = 0;
const pending = new Map<number, (sims: number[] | null) => void>();
/** Idiomas ya indexados (o en ello). */
const indexed = new Map<string, Promise<boolean>>();
let loaded: Promise<boolean> | null = null;

/** Ordenador con buena conexión: el único sitio donde merece la pena. */
function suitable() {
  if (typeof window === "undefined" || typeof WebAssembly === "undefined" || typeof Worker === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || (conn?.effectiveType && conn.effectiveType !== "4g")) return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory < 4) return false;
  return window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
}

function send<T>(msg: object, until: (data: { type: string; key?: string }) => T | undefined) {
  return new Promise<T>((resolve, reject) => {
    const onMessage = ({ data }: MessageEvent) => {
      if (data.type === "error" && data.id === undefined) {
        worker?.removeEventListener("message", onMessage);
        reject(new Error(data.message));
        return;
      }
      const v = until(data);
      if (v !== undefined) {
        worker?.removeEventListener("message", onMessage);
        resolve(v);
      }
    };
    worker!.addEventListener("message", onMessage);
    worker!.postMessage(msg);
  });
}

/**
 * Empieza a cargar el modelo si el dispositivo lo merece. Se puede llamar
 * tantas veces como se quiera: solo carga una.
 */
export function warmUp() {
  if (status !== "off" || !suitable()) return;
  status = "loading";
  loaded = (async () => {
    try {
      const res = await fetch(withBase("/semantic/manifest.json"));
      if (!res.ok) throw new Error("sin modelo");
      model = (await res.json()).model;
      worker = new Worker(withBase("/semantic/worker.js"), { type: "module" });
      worker.addEventListener("message", ({ data }) => {
        if (data.type === "result" || (data.type === "error" && data.id !== undefined)) {
          pending.get(data.id)?.(data.type === "result" ? data.sims : null);
          pending.delete(data.id);
        }
      });
      await send({ type: "init", model }, (d) => (d.type === "loaded" ? true : undefined));
      status = "ready";
      return true;
    } catch {
      status = "failed";
      worker?.terminate();
      worker = null;
      return false;
    }
  })();
}

/** Prepara las fichas de un idioma (una vez por idioma). */
export function index(key: string, groups: Groups) {
  if (!loaded) return;
  if (indexed.has(key)) return;
  indexed.set(
    key,
    loaded.then((ok) =>
      ok ? send({ type: "index", key, groups }, (d) => (d.type === "indexed" && d.key === key ? true : undefined)).catch(() => false) : false,
    ),
  );
}

/**
 * Similitud de `question` con cada ficha del idioma `key`, o null si el
 * modelo no está listo a tiempo: no se hace esperar a nadie más de `wait` ms.
 */
export async function similarities(key: string, question: string, wait = 1200): Promise<number[] | null> {
  const ready = indexed.get(key);
  if (status !== "ready" || !ready || !worker) return null;
  const timeout = new Promise<null>((r) => window.setTimeout(() => r(null), wait));
  const run = (async () => {
    if (!(await ready)) return null;
    const id = ++seq;
    return new Promise<number[] | null>((resolve) => {
      pending.set(id, resolve);
      worker!.postMessage({ type: "query", id, key, text: question });
    });
  })();
  return Promise.race([run, timeout]);
}
