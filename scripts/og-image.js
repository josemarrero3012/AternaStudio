const { chromium } = require('playwright');
const E='/home/josem/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
(async()=>{const b=await chromium.launch({executablePath:E});
const pg=await (await b.newContext({viewport:{width:1200,height:630},reducedMotion:'reduce'})).newPage();
await pg.goto('http://127.0.0.1:8770/estudio',{waitUntil:'load'}); await pg.waitForTimeout(800);
const {ill,css,cls}=await pg.evaluate(()=>({ill:document.querySelector('.estudio__ill').outerHTML,css:[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.outerHTML).join(''),cls:document.documentElement.className}));
await pg.setContent(`<!doctype html><html class="${cls}"><head><base href="http://127.0.0.1:8770/">${css}
<style>body{margin:0;width:1200px;height:630px;overflow:hidden}
.og{position:relative;width:1200px;height:630px;display:grid;grid-template-columns:1fr 440px;align-items:center;gap:40px;padding:0 72px 0 80px;box-sizing:border-box}
.og svg.ill{width:440px!important;grid-column:auto!important;justify-self:end}.og h1{font-size:76px;margin:28px 0 24px}.og .rule{position:absolute;left:0;right:0;bottom:0;height:6px;background-image:var(--brand-gradient-h)}
.og img{height:44px;width:auto}</style></head><body class="on-paper">
<div class="og"><div><img src="/brand/aterna-lockup.webp" alt=""><h1 class="t-hero">Una web mejor<br>es solo el principio.</h1><p class="t-label" style="color:var(--text-ink-mid)">Diseño · Desarrollo · SEO · Asistente IA</p></div>${ill}<div class="rule"></div></div></body></html>`,{waitUntil:'load'});
await pg.evaluate(()=>document.fonts.ready); await pg.waitForTimeout(500);
await pg.screenshot({path:process.argv[2]}); await b.close();})();
