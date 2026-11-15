# Anatomía de una web a medida

La película de «Qué incluye» en `/servicios/web`. Cuenta los seis pasos del
servicio como el árbol de Aterna, de la raíz a la copa: las raíces exploran
(auditoría), del tronco brotan tipografía, color e imagen (dirección de arte),
se levanta la página y sale su versión móvil (diseño), la página se abre en
capas (código y datos), la luz baja por las raíces hasta un buscador (SEO) y
la web se enciende dentro de un círculo cerrado, como el símbolo (entrega).

No lleva texto: vale para los cuatro idiomas. Los pasos los pone la lista de
la página, que hace de subtítulos (`src/components/WebAnatomy.tsx`).

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `scene.mjs` | La escena, en Three.js. Todo depende del tiempo: el mismo `t` da el mismo fotograma. |
| `index.html` | Vista previa con barra de tiempo. |
| `render.mjs` | Dibuja los fotogramas con Chromium (el de Playwright) y los codifica con ffmpeg. |
| `../../src/lib/anatomy/timeline.json` | Duración y segundo en que empieza cada paso. La usan la escena y la página: si se mueve un paso, se mueve en los dos sitios a la vez. |

Lo que se sirve está en `public/film/web/v1/`: `anatomy-1080.webm` y `.mp4`
(escritorio), `anatomy-720.webm` y `.mp4` (móvil) y los carteles
`poster-1080.webp` y `poster-720.webp`.

## Verla y cambiarla

```bash
node scripts/anatomy/render.mjs --preview          # sirve la vista previa en la dirección que imprime
node scripts/anatomy/render.mjs --stills 0,5,17.2  # fotogramas sueltos en .anatomy-stills/
```

Los colores son los de `src/styles/tokens.css` (copiados al principio de
`scene.mjs`) y el fondo es el del panel negro de las tarjetas
(`.aurora-panel`). La tipografía de la ficha «Aa» es Fraunces, la de los
titulares.

## Renderizarla

Hace falta ffmpeg en el `PATH` (o su ruta en la variable `FFMPEG`) y el
Chromium de Playwright (`npx playwright install chromium`).

```bash
npm run film        # unos 10 minutos: 516 fotogramas a 2160 px, y la codificación
```

- Se dibuja al doble de tamaño (2160 px) y se reduce a 1080 y 720: así las
  líneas finas salen limpias.
- WebM (VP9) para Chrome, Firefox y Edge, y MP4 (H.264) para Safari. La
  página elige con `canPlayType`.
- Los fotogramas clave caen donde empieza cada paso (`timeline.json`): saltar
  a un paso es inmediato.
- El primer fotograma es igual al último (la web terminada), que es también
  el cartel: la imagen fija, el arranque y «Ver de nuevo» casan sin salto.
- Para probar otra compresión sin volver a dibujar: `--frames <carpeta>`
  guarda los fotogramas y, si ya están, solo codifica (`--crf-vp9`,
  `--crf-h264`).

Si cambia la película, va a una carpeta nueva (`v2`) y se actualiza `DIR` en
`WebAnatomy.tsx` y la regla de caché de `public/.htaccess`: el servidor la
cachea un año.
