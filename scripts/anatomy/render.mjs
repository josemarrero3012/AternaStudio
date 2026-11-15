// Renderiza la película «Anatomía de una web a medida» (scene.mjs) y la deja
// lista para la web en public/film/web/v1/. Ver README.md.
//
//   node scripts/anatomy/render.mjs                    película completa (vídeos y carteles)
//   node scripts/anatomy/render.mjs --stills 0,5,17.2  solo esos fotogramas, en --out
//   node scripts/anatomy/render.mjs --preview          sirve la vista previa y espera
//
// Opciones: --out <carpeta>  (por defecto public/film/web/v1; con --stills, .anatomy-stills)
//           --size <px>      lado del fotograma maestro (1080)
//           --ss <n>         sobremuestreo al dibujar (2)
//           --frames <carpeta>  guarda ahí los fotogramas y no los borra; si ya
//                            están, no vuelve a dibujarlos (solo codifica)
//
// Chromium (el de Playwright, ya en el proyecto) dibuja cada fotograma con
// Three.js a partir de su tiempo exacto, sin reloj: da igual lo que tarde.
// ffmpeg (en el PATH o en FFMPEG) los codifica.

import { spawn, spawnSync } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SIZE = Number(option("size", 1080));
const SS = Number(option("ss", 2));
const STILLS = option("stills", null);
const OUT = resolve(ROOT, option("out", STILLS ? ".anatomy-stills" : "public/film/web/v1"));
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const timeline = JSON.parse(readFileSync(join(ROOT, "src/lib/anatomy/timeline.json"), "utf8"));

// Servidor: la raíz del repositorio (escena, three, fuente) y los fotogramas que llegan.
const TYPES = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2" };
let framesDir = "";
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "POST" && url.pathname === "/frame") {
    const file = createWriteStream(join(framesDir, `${url.searchParams.get("name")}.png`));
    req.pipe(file);
    file.on("finish", () => res.writeHead(204).end());
    return;
  }
  const file = join(ROOT, normalize(decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("404");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const pageUrl = `${base}/scripts/anatomy/index.html`;

if (flag("preview")) {
  console.log(`Vista previa: ${pageUrl}\nCtrl+C para salir.`);
  await new Promise(() => {});
}

const run = (cmd, argv) =>
  new Promise((done, fail) => {
    const child = spawn(cmd, argv, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? done() : fail(new Error(`${cmd} salió con ${code}\n${err}`))));
  });

if (!STILLS && spawnSync(FFMPEG, ["-version"]).status !== 0) {
  console.error("No encuentro ffmpeg: ponlo en el PATH o en la variable FFMPEG.");
  process.exit(1);
}

const FRAMES = option("frames", null);
framesDir = STILLS ? OUT : FRAMES ? resolve(ROOT, FRAMES) : join(tmpdir(), `anatomy-frames-${process.pid}`);
mkdirSync(framesDir, { recursive: true });
mkdirSync(OUT, { recursive: true });

// La GPU, si hay: el dibujo es el mismo sin ella, solo más lento.
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("[página]", e));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.error("[consola]", m.text()));
await page.goto(`${pageUrl}?capture&size=${SIZE}&ss=${SS}`);
await page.waitForFunction("window.filmReady === true", null, { timeout: 60_000 });

const shoot = (t, name) =>
  page.evaluate(
    async ([at, n]) => {
      const blob = await window.film.frame(at);
      await fetch(`/frame?name=${n}`, { method: "POST", body: blob });
    },
    [t, name],
  );

if (STILLS) {
  for (const raw of STILLS.split(",")) {
    const t = Number(raw);
    await shoot(t, `t${t.toFixed(2).padStart(5, "0")}`);
  }
  console.log(`Fotogramas en ${OUT}`);
} else {
  const { fps, duration } = timeline;
  const total = Math.round(duration * fps);
  const frame = (i) => join(framesDir, `f${String(i).padStart(5, "0")}.png`);
  if (FRAMES && existsSync(frame(total - 1))) {
    console.log(`Fotogramas ya dibujados en ${framesDir}: solo se codifica.`);
  } else {
    const started = Date.now();
    // El último fotograma es el del final exacto (la web terminada, quieta).
    for (let i = 0; i < total; i++) {
      await shoot(i === total - 1 ? duration : i / fps, `f${String(i).padStart(5, "0")}`);
      if (i % 30 === 0) process.stdout.write(`fotograma ${i + 1}/${total}`);
    }
    console.log(`${total} fotogramas en ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }

  const input = ["-y", "-framerate", String(fps), "-i", join(framesDir, "f%05d.png")];
  const color = ["-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"];
  const scale = (px) => `scale=${px}:${px}:flags=lanczos:out_color_matrix=bt709:out_range=tv`;
  // Fotogramas clave solo donde empieza cada paso: saltar a un paso es
  // inmediato y el resto de la película se apoya en los fotogramas vecinos.
  const keys = ["-force_key_frames", [0, ...timeline.chapters].join(","), "-g", String(total)];
  for (const [px, crfVp9, crfH264] of [
    [SIZE, Number(option("crf-vp9", 42)), Number(option("crf-h264", 28))],
    [720, Number(option("crf-vp9", 42)) + 1, Number(option("crf-h264", 28)) + 1],
  ]) {
    const log = join(framesDir, `vp9-${px}`);
    const vp9 = [...input, "-vf", scale(px), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crfVp9), ...keys, "-row-mt", "1", "-tile-columns", "1", "-auto-alt-ref", "1", "-lag-in-frames", "25", ...color, "-an", "-passlogfile", log];
    await run(FFMPEG, [...vp9, "-pass", "1", "-deadline", "good", "-cpu-used", "4", "-f", "null", process.platform === "win32" ? "NUL" : "/dev/null"]);
    await run(FFMPEG, [...vp9, "-pass", "2", "-deadline", "good", "-cpu-used", "1", join(OUT, `anatomy-${px}.webm`)]);
    await run(FFMPEG, [...input, "-vf", scale(px), "-c:v", "libx264", "-preset", "veryslow", "-crf", String(crfH264), "-profile:v", "high", ...keys, "-forced-idr", "1", "-sc_threshold", "0", ...color, "-movflags", "+faststart", "-an", join(OUT, `anatomy-${px}.mp4`)]);
    // El cartel: el último fotograma, la web terminada.
    await run(FFMPEG, ["-y", "-i", frame(total - 1), "-vf", `scale=${px}:${px}:flags=lanczos`, "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", join(OUT, `poster-${px}.webp`)]);
    console.log(`listo ${px}px`);
  }
  for (const f of ["anatomy-1080.webm", "anatomy-1080.mp4", "anatomy-720.webm", "anatomy-720.mp4", "poster-1080.webp", "poster-720.webp"]) {
    const file = join(OUT, f);
    if (existsSync(file)) console.log(`${f.padEnd(20)} ${(statSync(file).size / 1024).toFixed(0)} KB`);
  }
  if (!FRAMES) rmSync(framesDir, { recursive: true, force: true });
}

await browser.close();
server.close();
