// Genera los PDF de imprenta de la tarjeta a partir de tarjeta.html.
//   node print/tarjeta-contacto/exportar.mjs
// Necesita Playwright con Chromium (npx playwright install chromium).
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.join(dir, "tarjeta.html")).href;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [query, out] of [
  ["", "aterna-tarjeta-sangrado.pdf"],          // 91 × 61 mm, para la imprenta
  ["?marcas", "aterna-tarjeta-marcas.pdf"],     // 101 × 71 mm, con marcas de corte
]) {
  await page.goto(html + query);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: path.join(dir, out), preferCSSPageSize: true, printBackground: true });
  console.log("✓", out);
}
await browser.close();
