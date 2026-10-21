// Descarga lo que necesita el modelo del asistente (lib/semantic.ts) en
// public/semantic/, para que la web lo sirva ella misma y el visitante no
// tenga que pedir nada a terceros:
//
//   vendor/transformers.min.js  la librería (transformers.js), del paquete npm
//   ort/                        el motor (onnxruntime-web, WebAssembly)
//   models/<modelo>/            el modelo, de Hugging Face
//   manifest.json               se escribe al final: si falta, el asistente
//                               funciona sin modelo
//
// Se ejecuta solo antes de cada `npm run build` (prebuild). Si ya está todo,
// no descarga nada; si falla (sin conexión, por ejemplo), avisa y la web se
// compila igual. Los paquetes npm se comprueban con su hash.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUT = path.join(ROOT, "public", "semantic");

/** Modelo: 12 capas, 50 idiomas, entrenado para reconocer preguntas parecidas. */
const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MODEL_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "onnx/model_quantized.onnx"];

const PACKAGES = [
  {
    name: "@huggingface/transformers",
    version: "4.3.1",
    integrity: "sha512-5+voSeUCFK6PCKlY15dPhNOKq3/zOTxDN7oC+Wy9dFb1QZ0TSQomZRRy7URRK8YRuUoE9fGMQTTPC5d/pWBJhA==",
    files: { "package/dist/transformers.min.js": "vendor/transformers.min.js" },
  },
  {
    // La versión que trae transformers.js: la del motor tiene que coincidir.
    name: "onnxruntime-web",
    version: "1.31.0-dev.20260914-8d85527a0",
    integrity: "sha512-Iy7rtadoBgxS/LLvDr3QW38DB1PNXRnr0GJMcL0TAt7c9qjgVQl83UlGCVyeAnK2InpmW8Uc3PL8XIuqtDeF6g==",
    files: {
      "package/dist/ort-wasm-simd-threaded.mjs": "ort/ort-wasm-simd-threaded.mjs",
      "package/dist/ort-wasm-simd-threaded.wasm": "ort/ort-wasm-simd-threaded.wasm",
    },
  },
];

const manifest = { model: MODEL, transformers: PACKAGES[0].version, ort: PACKAGES[1].version };

async function get(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Lee un .tgz (formato ustar) y devuelve los archivos pedidos. */
function untar(tgz, wanted) {
  const tar = gunzipSync(tgz);
  const out = {};
  for (let off = 0; off + 512 <= tar.length; ) {
    const name = tar.toString("utf8", off, off + 100).replace(/\0.*$/s, "");
    if (!name) break;
    const prefix = tar.toString("utf8", off + 345, off + 500).replace(/\0.*$/s, "");
    const size = parseInt(tar.toString("utf8", off + 124, off + 136).replace(/\0.*$/s, "").trim() || "0", 8);
    const full = prefix ? `${prefix}/${name}` : name;
    if (wanted.includes(full)) out[full] = tar.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

async function save(rel, data) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

async function main() {
  const manifestFile = path.join(OUT, "manifest.json");
  if (existsSync(manifestFile)) {
    const current = JSON.parse(await readFile(manifestFile, "utf8"));
    if (JSON.stringify(current) === JSON.stringify(manifest)) {
      console.log("Modelo del asistente: ya está en public/semantic.");
      return;
    }
  }
  // Algo cambió o está a medias: se empieza de cero.
  await rm(path.join(OUT, "manifest.json"), { force: true });
  await rm(path.join(OUT, "vendor"), { recursive: true, force: true });
  await rm(path.join(OUT, "ort"), { recursive: true, force: true });
  await rm(path.join(OUT, "models"), { recursive: true, force: true });

  for (const pkg of PACKAGES) {
    const file = `${pkg.name.split("/").pop()}-${pkg.version}.tgz`;
    const tgz = await get(`https://registry.npmjs.org/${pkg.name}/-/${file}`);
    const hash = `sha512-${createHash("sha512").update(tgz).digest("base64")}`;
    if (hash !== pkg.integrity) throw new Error(`El hash de ${pkg.name}@${pkg.version} no coincide.`);
    const files = untar(tgz, Object.keys(pkg.files));
    for (const [from, to] of Object.entries(pkg.files)) {
      if (!files[from]) throw new Error(`Falta ${from} en ${pkg.name}.`);
      await save(to, files[from]);
    }
  }

  for (const f of MODEL_FILES) {
    console.log(`Modelo del asistente: descargando ${f}…`);
    await save(path.join("models", MODEL, f), await get(`https://huggingface.co/${MODEL}/resolve/main/${f}`));
  }

  await writeFile(manifestFile, JSON.stringify(manifest));
  console.log("Modelo del asistente: listo en public/semantic.");
}

main().catch((err) => {
  console.warn(`Modelo del asistente: no se ha podido descargar (${err.message}). La web se compila igual y el asistente funciona sin modelo.`);
});
