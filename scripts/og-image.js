// Imagen para redes (1200×630): un fotograma del vídeo del hero bajo el velo
// azul noche, el logotipo, el titular y la línea de marca. Usa el CSS y las
// fuentes de la propia web, así que sigue los tokens.
//
// Uso: con `out/` servido (p. ej. `npx serve out -l 8770`),
//   node scripts/og-image.js public/brand/og.jpg [http://127.0.0.1:8770]
// JPEG: con el fotograma del vídeo, un PNG pasaba de 1 MB.
const { chromium } = require('playwright');
const E='/home/josem/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const base=process.argv[3]||'http://127.0.0.1:8770';
(async()=>{const b=await chromium.launch({executablePath:E});
const pg=await (await b.newContext({viewport:{width:1200,height:630},reducedMotion:'reduce'})).newPage();
await pg.goto(base+'/',{waitUntil:'load'}); await pg.waitForTimeout(800);
const {css,cls}=await pg.evaluate(()=>({css:[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.outerHTML).join(''),cls:document.documentElement.className}));
await pg.setContent(`<!doctype html><html class="${cls}"><head><base href="${base}/">${css}
<style>body{margin:0;width:1200px;height:630px;overflow:hidden;background:var(--ink)}
.og{position:relative;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box}
.og__bg{position:absolute;inset:0;background:url(brand/hero-tree-poster-1920.webp) 78% 45%/auto 120% no-repeat;filter:saturate(1.1) brightness(1.1)}
.og__veil{position:absolute;inset:0;background:linear-gradient(100deg,var(--ink) 0%,rgb(5 6 15/.86) 38%,rgb(5 6 15/.25) 70%,rgb(5 6 15/0) 100%)}
.og__in{position:relative}.og img{height:44px;width:auto}.og h1{font-size:80px;margin:32px 0 28px}
.og .rule{position:absolute;left:0;right:0;bottom:0;height:6px;background-image:var(--brand-gradient-h)}</style></head><body>
<div class="og"><div class="og__bg"></div><div class="og__veil"></div><div class="og__in"><img src="brand/aterna-lockup.webp" alt="">
<h1 class="t-hero">Una web mejor<br>es solo el <span class="reveal-word--accent" style="background-image:var(--brand-gradient-light);-webkit-background-clip:text;background-clip:text;color:transparent">principio.</span></h1>
<p class="t-label" style="color:var(--text-mid)">Diseño · Desarrollo · SEO · Asistente IA</p></div><div class="rule"></div></div></body></html>`,{waitUntil:'load'});
await pg.evaluate(()=>document.fonts.ready); await pg.waitForTimeout(500);
await pg.screenshot({path:process.argv[2],quality:/\.jpe?g$/.test(process.argv[2])?88:undefined}); await b.close();})();
