// Sirve out/ como lo hace Hostinger con public/.htaccess, para las pruebas
// (Playwright) y las mediciones (Lighthouse) en local. Sin dependencias.
//
//   node scripts/serve-out.mjs [puerto]      (por defecto 4173)
//
// Reglas copiadas del .htaccess:
//   - Si la ruta es un archivo, se sirve tal cual.
//   - Si no, y existe <ruta>.html, se sirve ese (/servicios -> servicios.html,
//     aunque exista la carpeta servicios/).
//   - Si es una carpeta con index.html (los ejemplos), se sirve su index.html.
//   - Si nada existe: 404 del idioma (/en/... -> en/404.html) o la de la raíz.
//   - Las cabeceras `Header always set` del .htaccess de la raíz (seguridad,
//     política de contenido) se envían igual, para que las pruebas las usen.
//   - Texto comprimido (brotli o gzip, según pida el navegador), como hace
//     Hostinger. Sin esto, Lighthouse mide en local tres veces más peso del
//     real y el LCP en móvil sale inflado.
// Los .php no se ejecutan (no hay PHP en local): responden 404.

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { constants, createBrotliCompress, createGzip } from "node:zlib";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.argv[3] ?? "out");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const LOCALES = ["en", "nl", "de"];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".onnx": "application/octet-stream",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

/** Las líneas `Header always set Nombre "valor"` del .htaccess de la raíz. */
function htaccessHeaders() {
  const file = join(ROOT, ".htaccess");
  if (!isFile(file)) return {};
  const headers = {};
  for (const m of readFileSync(file, "utf8").matchAll(/^\s*Header always set ([\w-]+) "([^"]*)"\s*$/gm)) {
    headers[m[1]] = m[2];
  }
  return headers;
}

function resolvePath(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const abs = join(ROOT, clean);
  if (!abs.startsWith(ROOT)) return null;
  if (abs.endsWith(".php")) return null;
  if (isFile(abs)) return abs;
  const trimmed = abs.replace(/[/\\]+$/, "");
  if (trimmed !== ROOT && isFile(`${trimmed}.html`)) return `${trimmed}.html`;
  if (isFile(join(abs, "index.html"))) return join(abs, "index.html");
  return null;
}

function notFoundPage(urlPath) {
  const first = urlPath.split("/")[1];
  const local = LOCALES.includes(first) ? join(ROOT, first, "404.html") : null;
  if (local && isFile(local)) return local;
  return join(ROOT, "404.html");
}

createServer((req, res) => {
  const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
  let file = resolvePath(urlPath);
  let status = 200;
  if (!file) {
    file = notFoundPage(urlPath);
    status = 404;
    // Una carpeta sin 404.html (los prototipos): un 404 a secas.
    if (!isFile(file)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404");
      return;
    }
  }
  const type = TYPES[extname(file)] ?? "application/octet-stream";
  const accept = String(req.headers["accept-encoding"] ?? "");
  const compressible = /^(text\/|application\/(json|xml|wasm)|image\/svg)/.test(type);
  const encoding = !compressible ? null : /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : null;
  res.writeHead(status, {
    // Se leen en cada petición: así valen tras recompilar sin reiniciar.
    ...htaccessHeaders(),
    "Content-Type": type,
    "Cache-Control": "no-cache",
    Vary: "Accept-Encoding",
    ...(encoding ? { "Content-Encoding": encoding } : {}),
  });
  const stream = createReadStream(file);
  if (encoding === "br") stream.pipe(createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })).pipe(res);
  else if (encoding === "gzip") stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
}).listen(PORT, () => {
  console.log(`${ROOT} en http://localhost:${PORT}`);
});
