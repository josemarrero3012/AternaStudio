// Prepara la entrega para Hostinger: compila la web, comprueba que no falta
// ni sobra nada y deja en entregas/ el zip y su nota para quien lo sube.
//
//   npm run package                      compila y empaqueta
//   npm run package -- --desde <ref>     cambios desde ese commit, etiqueta
//                                        o fecha (AAAA-MM-DD) en la nota
//   npm run package -- --sin-compilar    usa el out/ que ya hay
//   npm run package -- --con-cambios     permite cambios sin confirmar
//
// Sin dependencias: funciona igual en Linux, macOS y Windows.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, writeFileSync, writeSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const DEST = join(ROOT, "entregas");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

// 1. El zip tiene que corresponder a un commit concreto ---------------------
const dirty = git("status", "--porcelain");
if (dirty && !flag("--con-cambios")) {
  fail(`Hay cambios sin confirmar:\n${dirty}\nConfírmalos (o usa --con-cambios para una prueba que no se entrega).`);
}
const sha = git("rev-parse", "--short=7", "HEAD");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const date = new Date().toISOString().slice(0, 10);
const name = `aterna-web-${date}-${sha}${dirty ? "-con-cambios" : ""}`;

// 2. Compilar para el dominio real (sin la ruta de la demo) ----------------
if (!flag("--sin-compilar")) {
  console.log("Compilando…");
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_BASE_PATH;
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const r = spawnSync(npm, ["run", "build"], { cwd: ROOT, env, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) fail("La compilación falló.");
}
if (!existsSync(OUT)) fail("No existe out/. Compila primero (npm run build).");

// 3. Comprobar lo que se va a entregar --------------------------------------
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(OUT).sort();
const rel = (p) => relative(OUT, p).split(sep).join("/");
const has = (p) => existsSync(join(OUT, p));

const required = [
  ".htaccess",
  "en/.htaccess",
  "nl/.htaccess",
  "de/.htaccess",
  "index.html",
  "404.html",
  "en/404.html",
  "robots.txt",
  "sitemap.xml",
  "contacto.php",
  "php/.htaccess",
  "php/contact-rate.php",
  "php/PHPMailer/PHPMailer.php",
  "php/PHPMailer/SMTP.php",
  "php/PHPMailer/Exception.php",
];
const missing = required.filter((p) => !has(p));
if (missing.length) fail(`Faltan archivos en out/:\n  ${missing.join("\n  ")}`);

const forbidden = ["php/mail-config.php", "php/.contact-rate.json"].filter(has);
if (forbidden.length) fail(`out/ contiene archivos privados del servidor:\n  ${forbidden.join("\n  ")}`);

const index = readFileSync(join(OUT, "index.html"), "utf8");
if (index.includes("/AternaStudio/_next/")) fail("out/ es la versión de la demo de GitHub Pages (NEXT_PUBLIC_BASE_PATH). Compila sin esa variable.");

const withModel = has("semantic/manifest.json");
if (!withModel && !flag("--sin-modelo")) {
  fail("Falta el modelo del asistente (out/semantic/manifest.json): compila con conexión, o usa --sin-modelo para entregar el asistente solo con búsqueda por palabras.");
}

// 4. El zip ------------------------------------------------------------------
// Formato ZIP clásico (sin ZIP64: menos de 4 GB y 65.535 archivos), con los
// nombres en UTF-8. Lo que ya va comprimido se guarda tal cual.
const STORE = /\.(png|jpe?g|webp|gif|ico|woff2?|zip|gz|br|mp4|webm)$/i;

function dosTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const day = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, day };
}

mkdirSync(DEST, { recursive: true });
const zipPath = join(DEST, `${name}.zip`);
const fd = openSync(zipPath, "w");
let offset = 0;
const central = [];
const write = (buf) => {
  writeSync(fd, buf);
  offset += buf.length;
};

for (const file of files) {
  const nameBuf = Buffer.from(rel(file), "utf8");
  const data = readFileSync(file);
  const crc = crc32(data);
  let method = 0;
  let body = data;
  if (!STORE.test(file)) {
    const deflated = deflateRawSync(data, { level: 9 });
    if (deflated.length < data.length) {
      method = 8;
      body = deflated;
    }
  }
  const { time, day } = dosTime(statSync(file).mtime);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // versión necesaria: 2.0
  local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(day, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  central.push({ nameBuf, crc, method, time, day, size: data.length, packed: body.length, offset });
  write(local);
  write(nameBuf);
  write(body);
}

const cdStart = offset;
for (const e of central) {
  const h = Buffer.alloc(46);
  h.writeUInt32LE(0x02014b50, 0);
  h.writeUInt16LE(0x0314, 4); // hecho en Unix, versión 2.0
  h.writeUInt16LE(20, 6);
  h.writeUInt16LE(0x0800, 8);
  h.writeUInt16LE(e.method, 10);
  h.writeUInt16LE(e.time, 12);
  h.writeUInt16LE(e.day, 14);
  h.writeUInt32LE(e.crc, 16);
  h.writeUInt32LE(e.packed, 20);
  h.writeUInt32LE(e.size, 24);
  h.writeUInt16LE(e.nameBuf.length, 28);
  h.writeUInt32LE((0o100644 << 16) >>> 0, 38); // permisos: rw-r--r--
  h.writeUInt32LE(e.offset, 42);
  write(h);
  write(e.nameBuf);
}
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(central.length, 8);
end.writeUInt16LE(central.length, 10);
end.writeUInt32LE(offset - cdStart, 12);
end.writeUInt32LE(cdStart, 16);
write(end);
closeSync(fd);

// 5. Releer el zip: que esté entero y lleve lo importante --------------------
const zip = readFileSync(zipPath);
const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
const count = zip.readUInt16LE(eocd + 10);
let p = zip.readUInt32LE(eocd + 16);
const names = new Set();
for (let i = 0; i < count; i++) {
  if (zip.readUInt32LE(p) !== 0x02014b50) fail("El zip está dañado (directorio central).");
  const n = zip.readUInt16LE(p + 28);
  const extra = zip.readUInt16LE(p + 30);
  const comment = zip.readUInt16LE(p + 32);
  names.add(zip.toString("utf8", p + 46, p + 46 + n));
  p += 46 + n + extra + comment;
}
if (count !== files.length) fail(`El zip tiene ${count} archivos y out/ ${files.length}.`);
for (const r of required) if (!names.has(r)) fail(`El zip no lleva ${r}.`);
const sha256 = createHash("sha256").update(zip).digest("hex");
const mb = (zip.length / 1024 / 1024).toFixed(1);

// 6. La nota para quien lo sube ----------------------------------------------
function changesSince(ref) {
  if (!ref) {
    try {
      ref = git("describe", "--tags", "--abbrev=0", "--match", "entrega-*");
    } catch {
      return { ref: null, lines: [] };
    }
  }
  const range = /^\d{4}-\d{2}-\d{2}$/.test(ref) ? ["--since", ref, "HEAD"] : [`${ref}..HEAD`];
  // Una línea por PR fusionado (o por commit, si no vino de un PR).
  const log = git("log", "--first-parent", "--format=%s%x1f%b%x1e", ...range);
  const lines = log
    .split("\x1e")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [subject, body = ""] = entry.split("\x1f");
      const pr = subject.match(/^Merge pull request #(\d+)/);
      return pr ? `${body.trim().split("\n")[0] || subject} (PR ${pr[1]})` : subject;
    });
  return { ref, lines };
}
const { ref: since, lines: changes } = changesSince(option("--desde"));

const note = `# Entrega de la web de Aterna Studio

| | |
|---|---|
| Archivo | \`${name}.zip\` (${mb} MB, ${count} archivos) |
| Fecha | ${date} |
| Versión | commit \`${sha}\` (rama \`${branch}\`) |
| SHA-256 | \`${sha256}\` |
| Asistente con modelo | ${withModel ? "sí (carpeta semantic/, unos 130 MB)" : "no: solo búsqueda por palabras"} |

## Cómo subirla

1. **Guarda una copia de \`public_html/php/mail-config.php\`** (la
   configuración del correo; no va en el zip) y de
   \`public_html/php/.contact-rate.json\` si existe.
2. Sube el zip a \`public_html/\` con el Administrador de archivos de hPanel y
   descomprímelo **ahí mismo**, sustituyendo lo que haya. El zip lleva el
   contenido de la web en su raíz, sin carpeta intermedia.
3. Comprueba que \`php/mail-config.php\` sigue en su sitio. Si se perdió,
   vuelve a ponerlo.
4. Borra el zip de \`public_html/\`.

Los archivos que empiezan por punto (\`.htaccess\` en la raíz y en \`en/\`,
\`nl/\` y \`de/\`) van dentro del zip y son imprescindibles: sin ellos las
direcciones como /servicios dan error.

## Qué comprobar después (en una ventana privada)

- [ ] https://aternastudio.com/ y https://aternastudio.com/servicios cargan.
- [ ] https://aternastudio.com/en, /nl y /de salen traducidas.
- [ ] https://aternastudio.com/de/no-existe muestra la página de error en alemán.
- [ ] https://www.aternastudio.com/servicios lleva a https://aternastudio.com/servicios.
- [ ] El formulario de https://aternastudio.com/contacto envía y el correo llega
      a contacto@aternastudio.com.
- [ ] https://aternastudio.com/php/mail-config.php da error 403 (prohibido).
${withModel ? "- [ ] https://aternastudio.com/semantic/manifest.json existe.\n" : ""}
## Qué cambia en esta entrega

${since ? `Desde \`${since}\`:\n\n${changes.length ? changes.map((l) => `- ${l}`).join("\n") : "- (sin cambios)"}` : "No hay ninguna entrega anterior registrada. La web publicada hasta ahora es una versión de octubre de 2026: esta entrega trae la portada con el árbol de partículas, las páginas legales, los cuatro idiomas revisados y el resto del trabajo hecho desde entonces."}

## Cómo está configurada (lo pone el \`.htaccess\` del zip)

- Política de seguridad de contenido: el navegador solo carga lo que sale de
  la propia web. Si alguna vez se añade un servicio externo (analítica, un
  chat, un vídeo), hay que darle permiso en el \`.htaccess\` o no funcionará.
- www.aternastudio.com redirige a aternastudio.com.
- El formulario solo acepta envíos desde la propia web.
- Ninguna página pide nada a otros dominios (tampoco fuentes de Google).

## Para decidir en el servidor (no va en el zip)

Son decisiones de quien administra el dominio:

- **HSTS** (obligar a HTTPS durante un año): mejora la seguridad, pero si el
  certificado caduca la web deja de abrirse hasta renovarlo. Se activa en
  hPanel o con una línea en el \`.htaccess\`.
- **Límite de envíos del formulario**: limita a 5 por visitante cada 10
  minutos usando su IP. Si la CDN de Hostinger hace que todas las visitas
  lleguen con la misma IP, el límite sería común para todos. Para saberlo:
  revisar en el registro de PHP o de acceso si \`REMOTE_ADDR\` es la IP real
  del visitante.
- **Search Console**: dar de alta la web y enviar
  https://aternastudio.com/sitemap.xml.
- **Analítica**: hoy no hay ninguna. Si se añade, que sea sin cookies y hay que
  actualizar la Datenschutzerklärung y la política de contenido.

## Cuando esté subida

Avisa a quien ha preparado la entrega para que la registre. Así la nota de la
próxima entrega listará solo lo nuevo:

    git tag entrega-${date} ${sha} && git push origin entrega-${date}
`;
const notePath = join(DEST, `${name}-NOTA.md`);
writeFileSync(notePath, note);

console.log(`
✓ Entrega lista
  ${relative(ROOT, zipPath)}  (${mb} MB, ${count} archivos)
  ${relative(ROOT, notePath)}
${dirty ? "\n  ⚠ Con cambios sin confirmar: no la entregues.\n" : ""}`);
