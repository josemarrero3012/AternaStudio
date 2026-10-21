// Modelo del asistente (lib/semantic.ts), en un hilo aparte para que la
// página no se trabe. Convierte cada ficha de la web y cada pregunta en un
// vector y devuelve lo parecida que es la pregunta a cada ficha (coseno).
// Todo se sirve desde esta misma carpeta (scripts/fetch-semantic.mjs).

import { env, pipeline } from "./vendor/transformers.min.js";

const here = (p) => new URL(p, import.meta.url).href;

env.allowRemoteModels = false;
env.allowLocalModels = true;
// Ruta sin dominio: con dominio, transformers.js la trata como remota y no
// comprueba qué archivos hay (y se salta el tokenizador).
env.localModelPath = new URL("./models/", import.meta.url).pathname;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = { mjs: here("./ort/ort-wasm-simd-threaded.mjs"), wasm: here("./ort/ort-wasm-simd-threaded.wasm") };
env.backends.onnx.wasm.numThreads = 1;

let extractor;
/** Vectores de las fichas de cada idioma: un grupo de textos por ficha. */
const indexes = new Map();

async function embed(texts) {
  const out = await extractor(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "init") {
      extractor ??= await pipeline("feature-extraction", data.model, { device: "wasm", dtype: "q8" });
      self.postMessage({ type: "loaded" });
    } else if (data.type === "index") {
      const groups = data.groups;
      const flat = await embed(groups.flat());
      let k = 0;
      indexes.set(
        data.key,
        groups.map((g) => g.map(() => flat[k++])),
      );
      self.postMessage({ type: "indexed", key: data.key });
    } else if (data.type === "query") {
      const index = indexes.get(data.key);
      if (!index) throw new Error("sin índice");
      const [q] = await embed([data.text]);
      const sims = index.map((vs) => Math.max(...vs.map((v) => dot(q, v))));
      self.postMessage({ type: "result", id: data.id, sims });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: data.id, message: String(err?.message ?? err) });
  }
};
