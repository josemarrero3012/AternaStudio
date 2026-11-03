// Verificación del recorrido v2 en un navegador (Playwright + Chromium; en la
// nube, WebGL2 por SwiftShader). Con la web servida (next dev o la
// exportación):
//
//   node scripts/journey/verify-web.mjs [URL] [CARPETA]
//   python scripts/journey/verify_shift.py CARPETA   # rigidez de las capas (PSNR)
//
// 1. Rigidez: cada capa sola (?recorrido=debug&capa=…) con el puntero en el
//    centro y en los cuatro extremos; verify_shift.py comprueba que cada
//    captura es la del centro trasladada lo que dice el manifiesto.
// 2. Tamaños: 375×667, 768×1024, 1280×720, 1440×900, 1920×1080 y 2560×1080,
//    sin scroll horizontal, con la familia y la resolución elegidas.
// 3. Movimiento reducido: familia plana y el puntero no mueve nada.
// 4. Consola: errores y avisos de todas las cargas.
// 5. Pesos y memoria: lo descargado hasta la primera vista y tras recorrerlo.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3100";
const OUT = process.argv[3] || "scripts/journey/report/web";
mkdirSync(OUT, { recursive: true });
const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const IGNORE = /React DevTools|\[HMR\]|\[Fast Refresh\]/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { base: BASE, date: new Date().toISOString(), console: [], sizes: [], rigid: [], reduced: null, weights: [] };

async function open(browser, { width, height, mobile = false, reduced = false, query = "" }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const bytes = { n: 0, first: 0 };
  page.on("console", (m) => {
    if ((m.type() === "error" || m.type() === "warning") && !IGNORE.test(m.text())) report.console.push(`${width}×${height}${reduced ? " reducido" : ""}: ${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => report.console.push(`${width}×${height}: pageerror: ${e.message}`));
  page.on("response", async (r) => {
    if (!r.url().includes("/journey/")) return;
    const len = Number(r.headers()["content-length"]);
    const n = Number.isFinite(len) ? len : (await r.body().catch(() => Buffer.alloc(0))).length;
    bytes.n += n;
    // Lo imprescindible para la primera vista: el manifiesto y el fotograma 0 (ligero y HD).
    if (/journey\.json|\/f000[-.]/.test(r.url())) bytes.first += n;
  });
  await page.goto(`${BASE}/${query}`, { waitUntil: "load" });
  // Por intervalos, no por requestAnimationFrame: con WebGL por software (SwiftShader) cada
  // subida de textura grande para la página unos segundos.
  await page.waitForFunction(() => document.querySelector(".journey__loader")?.getAttribute("data-phase") === "done", null, { timeout: 90000, polling: 500 });
  return { ctx, page, bytes };
}

const debugText = (page) => page.evaluate(() => document.querySelector("pre")?.textContent ?? "");

async function scrollToFrame(page, frame) {
  await page.evaluate((f) => {
    const main = document.querySelector(".journey");
    window.scrollTo(0, (f / 119) * (main.offsetHeight - window.innerHeight));
  }, frame);
}

/** Espera a que la imagen deje de cambiar (el scroll y el puntero van suavizados). */
async function settle(page, file, max = 16000) {
  let prev = null;
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    await sleep(700);
    const buf = await page.screenshot();
    if (prev && buf.equals(prev)) break;
    prev = buf;
  }
  if (file) await page.screenshot({ path: file });
}

const browser = await chromium.launch({ args: ARGS });

// VERIFY_ONLY=pesos (o rigidez, tamaños, reducido) para pasar solo una parte.
const ONLY = process.env.VERIFY_ONLY ?? "";
const run = (name) => !ONLY || ONLY.split(",").includes(name);

// 1. Rigidez ---------------------------------------------------------------------
if (run("rigidez")) {
  const manifest = await (await fetch(`${BASE}/journey/v2/journey.json`)).json();
  const frames = manifest.f.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);
  const pick = [frames[0], frames[Math.floor(frames.length / 2)], frames[frames.length - 1]];
  const W = 1280;
  const H = 720;
  for (const frame of pick) {
    for (const layer of ["mark", "back"]) {
      if (!manifest.f[frame].l.some((L) => L.g === layer)) continue;
      const { ctx, page } = await open(browser, { width: W, height: H, query: `?recorrido=debug&capa=${layer}` });
      // Solo el lienzo: nada más que se anime ni que entre en la comparación.
      await page.addStyleTag({ content: "body *{visibility:hidden!important;animation:none!important}.journey__canvas{visibility:visible!important}" });
      await scrollToFrame(page, frame);
      const shots = [];
      for (const [name, x, y] of [
        ["centro", W / 2, H / 2],
        ["izquierda", 0, H / 2],
        ["derecha", W - 1, H / 2],
        ["arriba", W / 2, 0],
        ["abajo", W / 2, H - 1],
      ]) {
        await page.mouse.move(x, y, { steps: 3 });
        const file = path.join(OUT, `rigidez-${layer}-${frame}-${name}.png`);
        await settle(page, file);
        shots.push({ name, file: path.basename(file), pointer: [(x / W - 0.5) * 2, (0.5 - y / H) * 2] });
      }
      const shown = await debugText(page);
      report.rigid.push({ frame, layer, viewport: [W, H], shots, debug: shown });
      await ctx.close();
    }
  }
}

// 2. Tamaños y 4. consola ----------------------------------------------------------
for (const [width, height, mobile] of !run("tamaños") ? [] : [
  [375, 667, true],
  [768, 1024, true],
  [1280, 720, false],
  [1440, 900, false],
  [1920, 1080, false],
  [2560, 1080, false],
]) {
  const { ctx, page, bytes } = await open(browser, { width, height, mobile, query: "?recorrido=debug" });
  await settle(page, path.join(OUT, `tam-${width}x${height}.png`), 12000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  report.sizes.push({ width, height, mobile, overflowX: overflow, debug: await debugText(page), firstViewMB: +(bytes.n / 2 ** 20).toFixed(2) });
  await ctx.close();
}

// 3. Movimiento reducido ------------------------------------------------------------
if (run("reducido")) {
  const { ctx, page } = await open(browser, { width: 1440, height: 900, reduced: true, query: "?recorrido=debug" });
  await page.mouse.move(720, 450);
  await settle(page, path.join(OUT, "reducido-centro.png"), 10000);
  await page.mouse.move(1, 450, { steps: 3 });
  await settle(page, path.join(OUT, "reducido-izquierda.png"), 10000);
  report.reduced = { debug: await debugText(page) };
  await ctx.close();
}

// 5. Pesos y memoria: primera vista y el recorrido entero, despacio -------------------
for (const [width, height, mobile] of !run("pesos") ? [] : [
  [1920, 1080, false],
  [2560, 1440, false],
  [375, 667, true],
]) {
  const { ctx, page, bytes } = await open(browser, { width, height, mobile, query: "?recorrido=debug" });
  await sleep(1500);
  const first = bytes.n;
  for (let k = 1; k <= 24; k++) {
    await page.evaluate((t) => {
      const main = document.querySelector(".journey");
      window.scrollTo(0, t * (main.offsetHeight - window.innerHeight));
    }, k / 24);
    await sleep(900);
  }
  await sleep(3000);
  report.weights.push({ width, height, mobile, frame0MB: +(bytes.first / 2 ** 20).toFixed(2), firstViewMB: +(first / 2 ** 20).toFixed(2), afterScrollMB: +(bytes.n / 2 ** 20).toFixed(2), debug: await debugText(page) });
  await ctx.close();
}

await browser.close();
writeFileSync(path.join(OUT, "verify.json"), JSON.stringify(report, null, 1));
console.log(`Consola: ${report.console.length ? report.console.join("\n") : "limpia"}`);
for (const s of report.sizes) console.log(`${s.width}×${s.height}: scroll horizontal ${s.overflowX > 0 ? `SÍ (${s.overflowX}px)` : "no"} · ${s.debug.split("\n")[0]} · ${s.firstViewMB} MB primera vista`);
if (report.reduced) console.log(`Reducido: ${report.reduced.debug.split("\n")[0]}`);
for (const w of report.weights) console.log(`Pesos ${w.width}×${w.height}: fotograma 0 + manifiesto ${w.frame0MB} MB · a los 1,5 s ${w.firstViewMB} MB · recorrido entero ${w.afterScrollMB} MB · ${w.debug.split("\n").slice(2, 4).join(" · ")}`);
console.log(`Capturas y verify.json en ${OUT}`);
