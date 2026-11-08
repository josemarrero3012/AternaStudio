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
| Recorrido: tiempos de los textos, carga, vidrio | `src/lib/journey/` (`config.ts`) |
| Árbol de partículas: formas, shader, números | `src/lib/tree/` (todos los números en `config.ts`) |
| Silueta del árbol para las partículas | `scripts/tree/make-mask.py` |
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

La web no usa ilustraciones ni fotos: la portada es el árbol de partículas
(ver abajo), que marca la estética de todo lo demás. La profundidad
de las secciones se construye con CSS (color, luz, líneas y tipografía), no
con imágenes.

## El recorrido de la portada

La portada abre con una pantalla fijada de 600vh con el árbol de Aterna hecho
de partículas (WebGL, sin librerías). Es la técnica de las portadas de
partículas como la del tigre de TIGRIS: miles de puntos que dibujan una forma
sacada de una imagen y que, con el scroll, se deshacen y se rehacen en otra.

- **Formas** (`src/lib/tree/shapes.ts`): el árbol se lee de la silueta del
  símbolo (`public/tree/v1/mark-mask.webp`, un tercio de las partículas en el
  contorno para que tenga filo); las raíces se generan con una semilla fija
  (siempre las mismas); el árbol final es un árbol de verdad, también
  generado, con el concepto del símbolo: cabe en un círculo (`CIRCLE`), casi
  simétrico (se genera la mitad y se refleja), con un tronco corto de tres
  hebras trenzadas, ramas que suben como un jarrón y siguen el borde del
  círculo curvándose hacia fuera, racimos de hojas y raíces naturales
  (retorcidas, ramificadas, con su propio azar para no cambiar la copa). Cada partícula tiene su
  sitio en las tres formas y en una nube de salida.
- **Movimiento** (`src/lib/tree/renderer.ts`): el shader lleva cada partícula
  de una forma a otra con su propio retardo y un remolino de ruido a mitad de
  camino. Al abrir, llegan desde la profundidad y forman el árbol mientras se
  abre la pantalla de carga. El ratón no mueve nada: enciende las partículas
  que tiene cerca (y deja una estela corta que se apaga), en el árbol, en las
  raíces y en el árbol final. El árbol lleva textura fija (manchas de luz,
  vetas de rosa y algún destello casi blanco) y el borde algo suelto. Se
  dibujan con mezcla aditiva más una pasada de resplandor (puntos grandes y
  tenues) en pantallas medianas y grandes.
- **Números**: cuántas partículas según la pantalla, cuándo cambia cada forma
  (`MORPH`, en progreso del scroll), el brillo del puntero (`GLOW`) y el
  tamaño de los puntos, en `src/lib/tree/config.ts`. Dónde se coloca cada
  forma según la proporción de la pantalla, en `HERO` y `layoutFor`
  (`renderer.ts`); si cambia el árbol de la entrada, se mueven también el
  nombre y el lema en `journey.css` («Entrada»).
- **Composición de la entrada** (como la de TIGRIS, sin antetítulo):
  «ATERNA» enorme sobre el árbol, el lema (el `h1`) debajo, «Desliza para
  descubrir» abajo (sin botón: «Empezar un proyecto» ya está arriba). El nombre
  se va en cuanto empieza el scroll y entonces aparece el logo de la cabecera
  (mientras se ve el nombre, la cabecera va sin logo).
- **Entrada**: una pantalla de carga (contador y línea de progreso) que espera
  a la silueta y a las fuentes, como mínimo 1,5 s y como mucho 8 s, y se
  funde desde el centro con un filo de luz (shader WebGL). Después entran la
  cabecera y el titular, palabra a palabra. Sale una vez por carga de página:
  al volver a la portada sin recargar ya no se repite (las partículas vuelven
  a formarse, más deprisa). Hace de cortina de la sesión (las demás páginas
  ya no la muestran).
- **Scroll**: la entrada se va y el árbol baja a sus raíces
  («Lo que no se ve…»); luego las raíces suben y crece un árbol de verdad,
  del tronco a la copa, grande y solo. Con el árbol formado, al seguir
  bajando se escribe encima un texto grande y centrado, letra a letra según
  el scroll (como el de TIGRIS; `journey.write`, con las palabras de acento
  entre asteriscos), mientras sube despacio y el árbol baja algo de luz para
  que se lea. Los tiempos de los textos están en `TIMING` y `WRITE`
  (`src/lib/journey/config.ts`).
- **Vida en reposo**: aunque no se haga scroll, las partículas nunca están
  quietas: cada forma respira con un ruido que fluye despacio (poco en el
  símbolo, para que se lea nítido), la copa del árbol se mece con el viento
  y sus hojas tiemblan, y todas titilan (en el shader de `renderer.ts`).
- **Paso a «01 — Estudio»**: en el último tramo (la última pantalla de
  scroll) la sección siguiente sube por encima del escenario, que sigue
  fijado. Su borde de arriba es transparente y se funde en la noche de la
  página (`--handoff-fade`, en `journey.css`); a la vez, la copa se suelta en
  luz que sube, la madera se apaga y el fondo de la escena pasa a ser esa
  misma noche (`--night-0`), sin halo ni viñeta. Al acabar, escenario y
  sección suben juntos y no hay costura. El paso lo mide `Journey.tsx` con el
  borde de la sección (no con el progreso), así va pegado a ella. Si se
  cambia `--journey-scene-h`, hay que revisar `TIMING` y `MORPH`: todo lo
  del recorrido tiene que acabar antes de que llegue la sección (en 0,8 con
  600vh: (600 − 200) / (600 − 100)).
- **Textos**: en `dict.ts` (`journey`), en los cuatro idiomas. El titular de
  entrada es el de siempre (`hero.headline`).
- **Sin WebGL** y **sin JavaScript** se ve una imagen fija del árbol
  (`public/tree/v1/poster.webp`, una captura del propio lienzo); **con
  movimiento reducido**, sin fundido, sin entrada, sin giro ni empuje (el
  scroll sigue cambiando las formas).
- Mientras el recorrido está en pantalla, la cabecera va sin velo y el menú
  va como el de TIGRIS: arriba a la derecha, «Servicios», «Estudio»,
  «Contacto» y «Empezar un proyecto →» en una fila de texto en mayúsculas
  espaciadas (sin píldora ni botón relleno), y los idiomas al final, más
  pequeños y tenues, tras un filete; en móvil y tableta, el asistente y
  WhatsApp esperan a que termine (los textos ocupan todo el ancho).

Si cambia el símbolo, se regenera la silueta y, con la web en marcha, se
vuelve a capturar la imagen fija (por ejemplo con `canvas.toDataURL()` sobre
`.journey__canvas`). Si cambia alguno de los dos archivos, nueva carpeta
(`v2`) y se actualiza `DIR` en `src/lib/tree/config.ts`:

```bash
python3 scripts/tree/make-mask.py public/brand/aterna-mark.png public/tree/v2/mark-mask.webp
```

### El recorrido anterior (Blender)

Antes de las partículas, la portada era una secuencia de 120 fotogramas
renderizados en Blender (un túnel de raíces de luz hasta el símbolo en 3D,
con paralaje por mapas de profundidad). Los fotogramas siguen en
`public/journey/v1/` y la escena en `scripts/journey/`, aunque la portada ya
no los usa. Para volver a renderizarlos:

```bash
python -m venv .venv && .venv/bin/pip install bpy==5.2.3 numpy scipy opencv-python-headless pillow OpenEXR
.venv/bin/python scripts/journey/mark_contours.py public/brand/aterna-mark.png scripts/journey/mark.json   # solo si cambia el símbolo
.venv/bin/python scripts/journey/scene.py --out exr/          # Cycles en CPU: ~1,5 min por fotograma
.venv/bin/python scripts/journey/post.py exr/ public/journey/v2 --size 1600x900
```

El símbolo en 3D también está aparte, listo para abrir en Blender:
`scripts/journey/aterna-mark.blend`. Se regenera con
`scene.py --mark-blend scripts/journey/aterna-mark.blend`.

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

