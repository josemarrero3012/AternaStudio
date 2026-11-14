// Imágenes para redes (1200 × 630), una por idioma: el árbol de la portada
// bajo el velo noche, el logotipo, el titular de la portada en ese idioma y
// las disciplinas. Usa el CSS y las fuentes de la propia web.
//
//   npm run build && node scripts/serve-out.mjs 4173   (en otra terminal)
//   npx tsx scripts/og-images.ts [http://localhost:4173]
//
// Deja public/brand/og-<idioma>.jpg. Comprueba que el titular cabe; si no,
// se detiene sin escribir nada.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { LOCALES, dict } from "../src/lib/dict";

const base = process.argv[2] ?? "http://localhost:4173";
const out = join(__dirname, "..", "public", "brand");

const page = (locale: string, cls: string, css: string) => {
  const t = dict[locale as keyof typeof dict];
  const [a, b] = t.hero.headline.split("\n");
  const words = b.split(" ");
  const last = words.pop();
  return `<!doctype html><html lang="${locale}" class="${cls}"><head><base href="${base}/">${css}
<style>body{margin:0;width:1200px;height:630px;overflow:hidden;background:var(--ink)}
.og{position:relative;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box}
.og__bg{position:absolute;inset:0;background:url(brand/hero-tree-poster-1920.webp) 78% 45%/auto 120% no-repeat;filter:saturate(1.1) brightness(1.1)}
.og__veil{position:absolute;inset:0;background:linear-gradient(100deg,var(--ink) 0%,rgb(5 6 15/.86) 38%,rgb(5 6 15/.25) 70%,rgb(5 6 15/0) 100%)}
.og__in{position:relative;max-width:900px}.og img{height:44px;width:auto}.og h1{font-size:80px;margin:32px 0 28px}
.og__accent{background-image:var(--brand-gradient-light);-webkit-background-clip:text;background-clip:text;color:transparent}
.og .rule{position:absolute;left:0;right:0;bottom:0;height:6px;background-image:var(--brand-gradient-h)}</style></head><body>
<div class="og"><div class="og__bg"></div><div class="og__veil"></div><div class="og__in"><img src="brand/aterna-lockup.webp" alt="">
<h1 class="t-hero">${a}<br>${words.join(" ")} <span class="og__accent">${last}</span></h1>
<p class="t-label" style="color:var(--text-mid)">${t.common.disciplines.join(" · ")}</p></div><div class="rule"></div></div></body></html>`;
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  const { css, cls } = await p.evaluate(() => ({
    css: [...document.querySelectorAll("link[rel=stylesheet]")].map((l) => l.outerHTML).join(""),
    cls: document.documentElement.className,
  }));
  const shots: [string, Buffer][] = [];
  for (const locale of LOCALES) {
    await p.setContent(page(locale, cls, css), { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    // El titular cabe: ninguna línea se sale y todo queda dentro de la imagen.
    const fit = await p.evaluate(() => {
      const box = document.querySelector(".og__in")!.getBoundingClientRect();
      const h1 = document.querySelector("h1")!;
      return { overflow: h1.scrollWidth > h1.clientWidth + 1, bottom: box.bottom, top: box.top, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) };
    });
    if (fit.overflow || fit.top < 24 || fit.bottom > 606 || fit.lines > 2) throw new Error(`${locale}: el titular no cabe (${JSON.stringify(fit)})`);
    shots.push([locale, await p.screenshot({ type: "jpeg", quality: 88 })]);
    console.log(`${locale}: cabe (${fit.lines} líneas, de ${Math.round(fit.top)} a ${Math.round(fit.bottom)} px)`);
  }
  for (const [locale, buf] of shots) writeFileSync(join(out, `og-${locale}.jpg`), buf);
  console.log(`Escritas: ${shots.map(([l]) => `og-${l}.jpg`).join(", ")}`);
  await browser.close();
})();
