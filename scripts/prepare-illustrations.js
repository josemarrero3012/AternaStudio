// Prepara las ilustraciones para la web: del arte original
// (design/illustrations/*.png) a WebP recortado y con fondo transparente en
// public/illustrations/.
//
//   node scripts/prepare-illustrations.js
//
// Dos tipos de arte:
// - "papel": escenas sobre fondo crema. El crema se vuelve transparente
//   (color a alfa), así la imagen se funde con el papel de la web sin
//   dejar un recuadro de otro tono.
// - "tinta": iconos neón sobre negro. Se aplanan sobre negro y el negro se
//   vuelve transparente conservando el brillo: cada píxel pasa a ser luz
//   sobre fondo transparente. Así da igual cómo llegue su canal alfa (alguno
//   trae una neblina negra semitransparente que oscurecía las tarjetas) y
//   quedan bien sobre cualquier fondo oscuro.
// Después se recorta el margen vacío y se reduce al ancho de uso a 2x.
//
// Usa sharp, que ya instala Next.js.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "design", "illustrations");
const OUT = path.join(__dirname, "..", "public", "illustrations");

// Ancho de salida ≈ 2 × el mayor ancho al que se muestra cada una.
const ART = {
  "estudio-portada": { surface: "paper", width: 1200 },
  "estudio-pagina": { surface: "paper", width: 1200 },
  "servicio-web": { surface: "ink", width: 640 },
  "servicio-seo": { surface: "ink", width: 640 },
  "servicio-mantenimiento": { surface: "ink", width: 640 },
  "servicio-asistente-ia": { surface: "ink", width: 640 },
  contacto: { surface: "ink", width: 840 },
  "cierre-avion": { surface: "paper", width: 800 },
};

const MIN_ALPHA = 0.03; // por debajo, ruido del fondo: transparente del todo

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, { surface, width }] of Object.entries(ART)) {
    const file = path.join(SRC, `${name}.png`);
    const input = surface === "ink" ? sharp(file).flatten({ background: "#000000" }) : sharp(file);
    const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    if (surface === "paper") colorToAlpha(data, borderColor(data, info));
    else unscreen(data);

    const box = contentBox(data, info);
    const out = path.join(OUT, `${name}.webp`);
    const res = await sharp(data, { raw: info })
      .extract(box)
      .resize({ width: Math.min(width, box.width) })
      .webp({ quality: 88, alphaQuality: 90, effort: 6 })
      .toFile(out);
    console.log(`${name}: ${res.width}×${res.height}, ${(res.size / 1024).toFixed(0)} KB`);
  }
}

/** Color medio del borde de la imagen: el fondo de la escena. */
function borderColor(data, { width, height }) {
  const sum = [0, 0, 0];
  let n = 0;
  const add = (x, y) => {
    const i = (y * width + x) * 4;
    sum[0] += data[i];
    sum[1] += data[i + 1];
    sum[2] += data[i + 2];
    n++;
  };
  for (let x = 0; x < width; x += 4) add(x, 1), add(x, height - 2);
  for (let y = 0; y < height; y += 4) add(1, y), add(width - 2, y);
  return sum.map((v) => v / n / 255);
}

/**
 * "Color a alfa": quita el fondo y deja cada píxel como el color que, sobre
 * ese fondo, daba el original. Solo cuenta lo que es más oscuro que el
 * fondo: con un crema casi blanco, el grano más claro que él (1–4 niveles)
 * se convertiría en una neblina opaca. Lo más claro que el fondo se funde
 * igual con el papel de la web.
 */
function colorToAlpha(data, bg) {
  for (let i = 0; i < data.length; i += 4) {
    const c = [0, 1, 2].map((k) => Math.min(data[i + k] / 255, bg[k]));
    const a = Math.max(...c.map((v, k) => (bg[k] - v) / bg[k]));
    write(data, i, a, (k) => (c[k] - bg[k]) / a + bg[k]);
  }
}

/** Negro a transparente: el píxel pasa a ser luz (su canal más alto es su opacidad). */
function unscreen(data) {
  for (let i = 0; i < data.length; i += 4) {
    const c = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
    const a = Math.max(...c);
    write(data, i, a, (k) => c[k] / a);
  }
}

function write(data, i, a, channel) {
  if (a < MIN_ALPHA) {
    data[i + 3] = 0;
    return;
  }
  for (let k = 0; k < 3; k++) data[i + k] = Math.round(Math.min(1, Math.max(0, channel(k))) * 255);
  data[i + 3] = Math.round(a * 255);
}

/** Caja del contenido visible, con un margen del 3 % para no cortar halos. */
function contentBox(data, { width, height }) {
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 24) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  return {
    left,
    top,
    width: Math.min(width, x1 + pad + 1) - left,
    height: Math.min(height, y1 + pad + 1) - top,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
