// Capturas de los prototipos para la sección «Trabajo» (public/work/).
// Abre Edge (o Chrome) sin ventana y le habla por el protocolo de
// depuración (DevTools): sin Playwright ni Puppeteer. Con «reducir
// movimiento», así las webs se ven ya montadas, sin animaciones a medias.
//
// Uso: node scripts/work-shots.js [ruta del navegador]
//   Por defecto, Edge en su ruta habitual de Windows (es Chromium).

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const sharp = require("sharp");

const CHROME = process.argv[2] || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = path.join(__dirname, "..", "public", "work");
const PORT = 9333;

// full: página entera (hasta maxH px de alto); si no, solo la primera pantalla.
const SHOTS = [
  { name: "calma-cafe-desktop", url: "https://josemarrero3012.github.io/CalmaCafe/", w: 1440, h: 900, dpr: 1, full: true, maxH: 5200 },
  { name: "calma-cafe-mobile", url: "https://josemarrero3012.github.io/CalmaCafe/", w: 390, h: 844, dpr: 2 },
  { name: "calma-cafe-carta", url: "https://josemarrero3012.github.io/CalmaCafe/carta/", w: 1440, h: 900, dpr: 1 },
  { name: "the-fragrance-bar-desktop", url: "https://josemarrero3012.github.io/TheFragrancerBar/", w: 1440, h: 900, dpr: 1, full: true, maxH: 5200 },
  { name: "the-fragrance-bar-mobile", url: "https://josemarrero3012.github.io/TheFragrancerBar/", w: 390, h: 844, dpr: 2 },
  { name: "the-fragrance-bar-ficha", url: "https://josemarrero3012.github.io/TheFragrancerBar/fragancias/creed-aventus/", w: 1440, h: 900, dpr: 1 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) listeners.forEach((l) => l(msg));
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const once = (method) => new Promise((res) => listeners.push((m) => m.method === method && res(m.params)));
  return { send, once, close: () => ws.close() };
}

async function shoot(page, s) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: s.w,
    height: s.h,
    deviceScaleFactor: s.dpr,
    mobile: s.w < 768,
  });
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const loaded = page.once("Page.loadEventFired");
  await page.send("Page.navigate", { url: s.url });
  await loaded;
  await sleep(1500);
  // Recorre la página para que carguen las imágenes diferidas y vuelve arriba.
  const { result } = await page.send("Runtime.evaluate", {
    expression: `(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      scrollTo(0, 0); await document.fonts.ready; await new Promise(r => setTimeout(r, 800));
      return document.documentElement.scrollHeight;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  const height = s.full ? Math.min(result.value, s.maxH) : s.h;
  const shot = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: !!s.full,
    clip: { x: 0, y: 0, width: s.w, height, scale: 1 },
  });
  const file = path.join(OUT, `${s.name}.webp`);
  await sharp(Buffer.from(shot.data, "base64")).webp({ quality: 82 }).toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`${s.name}.webp  ${meta.width}×${meta.height}  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "work-shots-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--no-first-run",
    "about:blank",
  ]);
  try {
    let targets;
    for (let i = 0; i < 40 && !targets; i++) {
      await sleep(250);
      targets = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).catch(() => null);
    }
    const target = targets.find((t) => t.type === "page");
    const page = await cdp(target.webSocketDebuggerUrl);
    await page.send("Page.enable");
    for (const s of SHOTS) await shoot(page, s);
    page.close();
  } finally {
    chrome.kill();
  }
})();
