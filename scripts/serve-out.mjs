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
// Los .php no se ejecutan (no hay PHP en local): responden 404.

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
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
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".onnx": "application/octet-stream",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

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
  }
  res.writeHead(status, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`out/ en http://localhost:${PORT}`);
});
