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
| Datos de contacto, URL | `src/lib/site.ts` |
| Títulos y descripciones SEO (4 idiomas) | `src/lib/meta.ts` |
| Páginas en español (raíz) | `src/app/(es)/` |
| Páginas en inglés, neerlandés y alemán (`/en`, `/nl`, `/de`) | `src/app/[lang]/` |
| Tokens de diseño (color, tipo, espacio, forma, movimiento) | `src/styles/tokens.css` |
| Recorrido de la portada (componente, estilos) | `src/components/Journey.tsx`, `src/styles/journey.css` |
| Recorrido: tiempos, fotogramas, WebGL | `src/lib/journey/` (todos los números en `config.ts`) |
| Recorrido: escena de Blender y revelado | `scripts/journey/` |
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

La web no usa ilustraciones ni fotos: la única imagen es el recorrido de la
portada (ver abajo), que marca la estética de todo lo demás. La profundidad
de las secciones se construye con CSS (color, luz, líneas y tipografía), no
con imágenes.

## El recorrido de la portada

La portada abre con una pantalla fijada de 380vh: al hacer scroll se recorre
una secuencia de 120 fotogramas renderizados en Blender, desde la boca de un
túnel de raíces de luz hasta el símbolo de Aterna en 3D. En ordenador con
ratón, cada fotograma va por capas renderizadas aparte (el suelo, cada arco,
el símbolo con su aura, los arcos del fondo) que se mueven enteras con el
puntero: paralaje sin deformación (versión 2; el porqué, en
`docs/RECORRIDO-V2.md`).

- **Paralaje**: cada capa lleva un modelo de su profundidad en el manifiesto
  (`public/journey/v2/journey.json`). El suelo se mueve como el plano que es
  (afín) y el resto, como planos rígidos; lo enfocado no se mueve (al final,
  el símbolo es el pivote) y las capas muy cercanas tienen un tope suave. Lo
  pinta `layeredRenderer.ts` (WebGL2, un solo pase, composición en lineal).
- **Familias**: por capas (ordenador con ratón), plana (apaisado sin
  paralaje: tableta, movimiento reducido), vertical (el centro 3:4, para el
  móvil) y WebP plano para navegadores sin AVIF. Cada una en una versión
  ligera de todo el recorrido y HD alrededor de donde se está (1920, 2560 o
  3840 según el lienzo, la memoria y la red). Solo se decodifica una ventana
  de fotogramas (`sequence.ts`). Con `?recorrido=debug`, una capa con fps,
  resoluciones y megas descargados, decodificados y en texturas.

- **Entrada**: una pantalla de carga (contador y línea de progreso) que espera
  al primer fotograma y a las fuentes, como mínimo 1,5 s y como mucho 8 s, y
  se funde desde el centro con un filo de luz (shader WebGL). Después entran
  la cabecera y el titular, palabra a palabra. Sale una vez por carga de
  página: al volver a la portada sin recargar ya no se repite. Hace de
  cortina de la sesión (las demás páginas ya no la muestran).
- **Scroll**: el titular de entrada se va, entran «Lo que no se ve…» y, junto
  al símbolo, dos tarjetas de vidrio (enlazan a Diseño web y a SEO) y el
  cierre. Los tiempos están en `TIMING` (`src/lib/journey/config.ts`), en
  progreso del scroll de 0 a 1.
- **Vidrio**: las tarjetas no usan `backdrop-filter`: cada una lleva un lienzo
  con una copia desenfocada de la escena que tiene detrás.
- **Textos**: en `dict.ts` (`journey`), en los cuatro idiomas. El titular de
  entrada es el de siempre (`hero.headline`).
- **Sin WebGL** se ven los fotogramas sin paralaje; **con movimiento
  reducido**, sin fundido, sin animación de entrada y sin paralaje (el scroll
  sigue moviendo la escena); **sin JavaScript**, el primer fotograma y el
  titular.
- Mientras el recorrido está en pantalla, la cabecera va sin velo y con los
  enlaces en una píldora de vidrio; en móvil y tableta, el asistente y
  WhatsApp esperan a que termine (los textos ocupan todo el ancho).

### Volver a renderizar

Los fotogramas (`public/journey/v2/`) se renderizan en un PC con GPU NVIDIA
con un solo comando, desde la carpeta del repositorio:

```bash
scripts/journey/render-gpu.sh test     # prueba corta: 6 fotogramas a calidad final
scripts/journey/render-gpu.sh render   # los 120 (si se corta, el mismo comando sigue)
scripts/journey/render-gpu.sh post     # solo rehace el revelado desde los EXR
```

El script prepara lo que falte en `.render/` (Blender oficial y un venv para
el revelado; no va a git), comprueba la GPU (OptiX), renderiza de forma
reanudable, valida los EXR, revela y sube solo lo final (`public/journey/v2`
y el informe de `scripts/journey/report`). Los EXR se quedan en el PC.

- `scene.py` construye la escena con una semilla fija (los mismos números dan
  siempre la misma escena) y escribe por fotograma un EXR con una capa por
  grupo (arco, símbolo, suelo…), en 4K con un margen alrededor para el
  paralaje. `mark_contours.py` regenera `mark.json` si cambia el símbolo.
- `post.py` hace el revelado capa a capa (halo, AgX, niebla hacia la noche de
  la web), los modelos del paralaje, los atlas, todas las familias y
  resoluciones en AVIF, el manifiesto y un informe con hojas de contactos.
- `verify-web.mjs` y `verify_shift.py` comprueban la web: que cada capa se
  mueve entera (sin deformarse), los tamaños de pantalla, el movimiento
  reducido, la consola y los pesos.

Si cambian los fotogramas, nueva carpeta (`v3`) y se actualiza `DIR` en
`src/lib/journey/config.ts`: el `.htaccess` los cachea un año como inmutables.

El símbolo en 3D también está aparte, listo para abrir en Blender:
`scripts/journey/aterna-mark.blend` (cuerpo de titanio anodizado con el
degradado del logo, incrustación esmaltada, filamentos de luz, peana, luces y
cámara). Se regenera con `scene.py --mark-blend scripts/journey/aterna-mark.blend`.

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

