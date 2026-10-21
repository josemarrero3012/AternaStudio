# Aterna Studio · notas de desarrollo

Código fuente de aternastudio.com. Es Next.js con exportación estática:
`npm run build` genera la carpeta `out/` y esa carpeta es la web que se
sube a Hostinger. No hace falta Node.js en el servidor.

**Demo en vivo:** https://josemarrero3012.github.io/AternaStudio/

## Uso

```bash
npm install
npm run dev     # desarrollo en http://localhost:3000
npm run build   # genera out/ (lo que se publica)
```

Para publicar, sube el **contenido** de `out/` a `public_html/`. Los pasos
completos, con lo que no está en git (la contraseña del correo) y cómo
comprobar que todo funciona, están en [DESPLIEGUE.md](DESPLIEGUE.md).

### Demo en GitHub Pages

Cada push a `main` ejecuta `.github/workflows/pages.yml`, que compila con
`NEXT_PUBLIC_BASE_PATH=/AternaStudio` y publica `out/`. En la demo el
formulario de contacto no envía (no hay PHP en Pages). Para compilar así en
local: `NEXT_PUBLIC_BASE_PATH=/AternaStudio npm run build`.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Textos ES/EN/NL/DE (todos) | `src/lib/dict.ts` |
| Precios | `src/lib/pricing.ts` |
| Proyectos de «Trabajo» (enlaces, capturas, stack) | `src/lib/work.ts` (textos en `dict.ts` → `work`) |
| Datos de contacto, URL | `src/lib/site.ts` |
| Títulos y descripciones SEO (4 idiomas) | `src/lib/meta.ts` |
| Páginas en español (raíz) | `src/app/(es)/` |
| Páginas en inglés, neerlandés y alemán (`/en`, `/nl`, `/de`) | `src/app/[lang]/` |
| Tokens de diseño (color, tipo, espacio, forma, movimiento) | `src/styles/tokens.css` |
| Estilos de componentes y páginas | `src/app/globals.css` |
| Páginas legales (HTML literal) | `src/content/legal/` |
| Asistente (respuestas, flujo guiado) | `src/lib/assistant.ts`, `src/components/Assistant.tsx` |
| Modelo del asistente en el navegador | `src/lib/semantic.ts`, `public/semantic/worker.js` |
| Imagen para redes (OG) | `public/brand/og.jpg` (se regenera con `scripts/og-image.js`) |

## Idiomas

Cada idioma tiene sus propias URLs y se exporta ya traducido: el español en
la raíz (`/servicios`) y los demás con prefijo (`/en/servicios`,
`/nl/servicios`, `/de/servicios`). Cada página lleva su canónica y las
etiquetas `hreflang` de las cuatro versiones, y el sitemap las lista todas.

- Los enlaces internos usan el `Link` de `src/lib/i18n.tsx`, que añade el
  prefijo del idioma actual. Escribe siempre la ruta sin idioma
  (`href="/contacto"`).
- Una página nueva va en `src/app/(es)/` y en `src/app/[lang]/`, con su
  entrada en `src/lib/meta.ts` y, si se indexa, en `src/app/sitemap.ts`.
- El `.htaccess` ya sirve `/en/...` como `en/....html`: no hay que tocarlo.
- Cada idioma tiene su 404 (`src/app/[lang]/404/`, que se exporta como
  `en/404.html`, etc.). La elige el `.htaccess` de cada carpeta
  (`public/en/.htaccess`…); sin prefijo, la española de la raíz. En la demo de
  GitHub Pages solo hay una 404, la española.

## Imágenes

La web no usa ilustraciones ni fotos: la única imagen es el vídeo del hero
(`public/brand/hero-tree-*`), que marca la estética de todo lo demás. La
profundidad de las secciones se construye con CSS (color, luz, líneas y
tipografía), no con imágenes.

Excepción: las capturas de los proyectos de «Trabajo» (`public/work/`). Se
regeneran con `node scripts/work-shots.js`, que abre Edge sin ventana y
fotografía cada web con «reducir movimiento». Esa sección es una vista
previa para el equipo: sus páginas van con noindex y fuera del sitemap.

## Asistente

El orbe de la esquina responde con los textos de la web (`dict.ts` y
`pricing.ts`): si cambias un texto o un precio, el asistente lo sabe sin
tocar nada más. No usa ninguna API.

- **Búsqueda por palabras** (`src/lib/assistant.ts`): sinónimos en los
  cuatro idiomas, erratas, raíces y peso por rareza. Funciona en todos los
  dispositivos.
- **Modelo en el navegador** (`src/lib/semantic.ts`): en ordenador con buena
  conexión, al acercarse al asistente se carga un modelo pequeño
  (paraphrase-multilingual-MiniLM-L12-v2, unos 118 MB, más 14 MB del motor)
  que entiende preguntas dichas con otras palabras. Lo descarga
  `scripts/fetch-semantic.mjs` en `public/semantic/` antes de cada
  `npm run build` (no está en git) y lo sirve la propia web. Si no se pudo
  descargar, la web se compila igual y el asistente usa solo las palabras.
  Al publicar, la carpeta `out/semantic/` se sube con el resto.
- **Ayúdame a elegir**: tres preguntas con botones que dejan el mensaje
  escrito para WhatsApp o para el formulario (`/contacto?mensaje=…`).
- **Comprobación**: `npx tsx scripts/assistant-check.ts` pregunta una lista
  de preguntas reales en los cuatro idiomas. En cada PR que toque el
  asistente o los textos lo lanza `.github/workflows/assistant.yml`, también
  con el modelo.

