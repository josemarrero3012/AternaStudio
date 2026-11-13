# Calidad: cifras de partida y cómo se miden

Este documento guarda las cifras de la web **antes de la mejora** (12 de
noviembre de 2026, `main` en `babf3b1`). Cada fase se compara con ellas,
midiendo de la misma forma.

## Cómo se mide

Todo se mide sobre la web exportada (`out/`), servida en local con
`npm start` o `node scripts/serve-out.mjs`, que aplica las mismas reglas que
el `.htaccess` y **comprime el texto con brotli, como Hostinger**. Así no
influyen la red ni el servidor.

- **Lighthouse 12.8.2** (`npx lighthouse@12.8.2`), con Chrome 156. Móvil con
  la configuración por defecto (teléfono de gama media con red 4G lenta
  simulados) y escritorio con `--preset=desktop`. Tres pasadas por página; se
  apunta la mediana.
- **Peso**: lo que pide el HTML de cada página, comprimido con gzip. No
  cuenta lo que se carga después (el árbol de partículas, el modelo del
  asistente).
- **Pruebas**: `npm run test:e2e` y `npm run test:visual` (ver
  [DESARROLLO.md](DESARROLLO.md)).

Lighthouse en local mide siempre igual y sirve para comparar versiones. No
dice cómo carga para un visitante real: eso solo lo darían datos de campo
(analítica o Search Console), que hoy no hay.

## Lighthouse

> **Corrección (12 de noviembre, más tarde).** Esta primera tabla se midió con
> el servidor local sirviendo el JavaScript **sin comprimir** (unas tres veces
> más peso que en Hostinger). En móvil, Lighthouse simula una red lenta, así
> que el LCP y el rendimiento de móvil salieron mucho peores de lo real. Las
> cifras de escritorio y de accesibilidad valen. Las cifras válidas de móvil
> están en «Medición corregida», más abajo.

| Página | Dispositivo | Rendimiento | Accesib. | Buenas prác. | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| Portada | Móvil | **47** | 100 | 100 | 100 | 1,7 s | **7,2 s** | **1.441 ms** | 0 |
| Portada | Escritorio | 93 | 96 | 100 | 100 | 0,4 s | 1,5 s | 87 ms | 0,006 |
| /servicios | Móvil | 74 | 100 | 100 | 100 | 1,4 s | **8,0 s** | 42 ms | 0 |
| /servicios | Escritorio | 95 | 100 | 100 | 100 | 0,3 s | 1,5 s | 0 ms | 0 |
| /servicios/web | Móvil | 75 | 100 | 100 | 100 | 1,4 s | **8,0 s** | 25 ms | 0 |
| /servicios/web | Escritorio | 96 | 100 | 100 | 100 | 0,3 s | 1,4 s | 0 ms | 0 |
| /contacto | Móvil | 74 | 100 | 100 | 100 | 1,4 s | **8,1 s** | 33 ms | 0 |
| /contacto | Escritorio | 95 | 100 | 100 | 100 | 0,3 s | 1,4 s | 0 ms | 0 |

Objetivo de Google para un LCP «bueno»: menos de 2,5 s. Para el TBT, menos de
200 ms.

**Lo que explican estas cifras**

- **El LCP en móvil (7–8 s) estaba inflado** por la falta de compresión (ver
  la corrección de arriba). La conclusión que se sacó aquí, que lo causaban
  las entradas animadas, era errónea.
- **El TBT de la portada en móvil (1,4 s)** viene del recorrido de partículas
  y del JavaScript compartido. Lighthouse calcula unos 251 KB de JavaScript
  sin usar en la portada y 10,6 s de trabajo en el hilo principal.
- **La accesibilidad de la portada en escritorio (96)** baja por un único
  problema: los idiomas de la cabecera miden menos de 24 px (ver más abajo).

## Peso de cada página (gzip)

| Página | HTML | JavaScript | CSS |
|---|---|---|---|
| Portada | 18,1 KB | 305 KB | 18,1 KB |
| /servicios | 11,4 KB | 305 KB | 18,1 KB |
| /servicios/web | 13,8 KB | 305 KB | 18,1 KB |
| /estudio | 10,9 KB | 305 KB | 18,1 KB |
| /contacto | 9,1 KB | 305 KB | 18,1 KB |
| /legal | 14,6 KB | 276 KB | 18,1 KB |

Todas las páginas cargan casi el mismo JavaScript: el de la portada
(partículas, recorrido) y los textos de los cuatro idiomas (`dict.ts`, 110 KB
sin comprimir) van en los paquetes comunes. A eso se suman las fuentes:
unos 200 KB en cuatro archivos.

## Pruebas

86 pruebas, todas en verde:

- **Humo** (44 páginas: 11 rutas en cuatro idiomas): responden 200, llevan su
  idioma, un solo `h1`, título, descripción, canónica y `hreflang`, y no dan
  errores en la consola ni peticiones fallidas.
- **Enlaces**: todos los enlaces internos de las 44 páginas llevan a una
  página que existe. Cada idioma tiene su 404. El sitemap lista las páginas
  indexables y no las legales.
- **Accesibilidad** (axe, WCAG 2.2 AA): las cinco páginas principales, en
  español y en alemán.
- **Interacción**: menú del móvil (abre, retiene el foco, cierra con Escape),
  selector de idioma y formulario (vacío, enviado y con error del servidor;
  la respuesta del PHP se simula).
- **Capturas** (solo en local): cinco páginas en escritorio y móvil.

## Problemas conocidos

Cosas que ya se sabe que hay que corregir. Las pruebas las dejan pasar con
su motivo y fallan con cualquier problema nuevo.

| Problema | Dónde | Cuándo se corrige |
|---|---|---|
| LCP de unos 3,5 s en móvil (el objetivo es 2,5 s). Lighthouse cuenta todo lo que se pide antes de pintar el texto: unos 200 KB de JavaScript (112 de React y Next.js, 47 de GSAP), 119 KB de fuentes y 44 de CSS y HTML. En una visita real el texto se pinta antes, porque viene en el HTML | Todas las páginas, en móvil | Quitar GSAP de las páginas interiores |
| 7 avisos de ESLint de las reglas del compilador de React (refs escritas al pintar, `setState` dentro de efectos) | `Assistant`, `Chrome`, `WordReveal`, formulario | Arquitectura |
| `npm audit`: 7 avisos moderados (`minimatch`) | Solo herramientas de desarrollo (ESLint); no llega a `out/` | Al actualizar ESLint |

## Fuera del código

- **La web publicada es antigua.** `aternastudio.com` es la versión del 21 de
  octubre (sin el árbol de partículas). Lo de `main` solo está en la demo de
  GitHub Pages. Hay que avisar al responsable del despliegue.

## Medición corregida (con compresión)

Medida el 12 de noviembre por la noche, ya con el servidor local comprimiendo
como Hostinger y con las fichas de servicio rediseñadas («Raíz»). Es la base
válida para comparar en móvil.

| Página | Dispositivo | Rendimiento | FCP | LCP | Índice de velocidad | TBT |
|---|---|---|---|---|---|---|
| /servicios | Móvil | 77 | 0,9 s | 3,9 s | 2,6 s | 416 ms |
| /servicios/web | Móvil | 83 | 0,9 s | 4,0 s | 2,7 s | 211 ms |
| /contacto | Móvil | 88 | 0,9 s | 3,8 s | 2,5 s | 76 ms |
| Las tres | Escritorio | 99–100 | 0,2 s | 0,8–0,9 s | 0,7–0,9 s | 3–42 ms |

La portada no está en esta tabla: con el equipo cargado y el recorrido de
partículas en marcha en otra pestaña, su TBT salió de 8 a 17 s en todas las
pasadas, una cifra que no se puede comparar. Hay que medirla aparte, con el
equipo en reposo.

## Cambios medidos

> **13 de noviembre: se revierte «Raíz».** Las fichas de servicio,
> /servicios y /contacto vuelven al diseño anterior, con todas sus
> animaciones (titulares palabra a palabra, «Qué pasa después» con sus iconos
> y su filamento, la llamada final y las entradas al hacer scroll). Las
> mediciones de «Raíz» de esta sección quedan como histórico. Se mantienen
> los cambios que no son de diseño: sin cortina de entrada, textos por
> idioma, portada aparte, logos a su tamaño, cursiva bajo demanda e idiomas
> de la cabecera con 24 px de zona táctil.

### Menos JavaScript, logos a su tamaño y cursiva bajo demanda (13 de noviembre de 2026)

- Cada página recibe solo los textos de su idioma (antes, los de los cuatro).
- El recorrido de partículas y las secciones de la portada solo los descarga
  la portada.
- Los logos de la cabecera y del pie se sirven a su tamaño (a doble
  resolución): de 118 KB a 13 KB en la cabecera.
- La cursiva de Fraunces (81 KB), que solo usa la portada, ya no se precarga.

JavaScript real de cada página (sin el de navegadores antiguos, que los
modernos no descargan): de 231 a 190 KB en las interiores y de 231 a 206 KB
en la portada.

| Página (móvil) | Rendimiento | LCP | Índice de velocidad | TBT |
|---|---|---|---|---|
| /servicios, antes | 89 | 3,8 s | 1,8 s | 46 ms |
| /servicios, después | 91 | 3,5 s | 1,3 s | 41 ms |
| /servicios/web, antes | 87 | 4,1 s | 1,6 s | 46 ms |
| /servicios/web, después | 91 | 3,4 s | 1,4 s | 40 ms |
| /contacto, antes | 89 | 3,8 s | 1,5 s | 38 ms |
| /contacto, después | 91 | 3,5 s | 1,3 s | 33 ms |

### «Raíz» en /servicios y /contacto (13 de noviembre de 2026)

`/servicios` pasa de tarjetas de color a filas que cuelgan de la raíz;
`/contacto` lleva la raíz por la columna del texto y conserva el formulario
en su tarjeta. Los idiomas de la cabecera de la portada tienen ya 24 × 24 px
de zona táctil (era el único problema de accesibilidad pendiente).

| Página (móvil) | Rendimiento | Índice de velocidad | TBT | Accesib. |
|---|---|---|---|---|
| /servicios, antes | 85 | 1,8 s | 100 ms | 100 |
| /servicios, después | 89 | 1,8 s | 46 ms | 100 |
| /contacto, antes | 87 | 1,9 s | 141 ms | 100 |
| /contacto, después | 89 | 1,5 s | 38 ms | 100 |

### Sin cortina de entrada

La cortina de marca tapaba cada página interior en la primera visita hasta
que el JavaScript la levantaba. Se quitó. El LCP no cambia (Lighthouse no
tiene en cuenta lo que queda tapado), pero el **índice de velocidad**, que
mide cuándo se ve la página, mejora en las tres páginas:

| Página (móvil) | Índice de velocidad antes | Después | Rendimiento antes | Después |
|---|---|---|---|---|
| /servicios | 2,6 s | 1,8 s | 77 | 85 |
| /servicios/web | 2,7 s | 1,9 s | 83 | 87 |
| /contacto | 2,5 s | 1,9 s | 88 | 87 |

En escritorio, sin cambios (99–100).

### Fichas de servicio con la dirección «Raíz» (sin compresión)

Medido sin compresión: el LCP de móvil no es válido (ver la corrección de la
primera tabla). Sirve para ver que el rediseño no empeoró nada.

| Página (móvil) | Rendimiento | LCP | TBT | Accesib. |
|---|---|---|---|---|
| /servicios/web, antes | 75 | 8,0 s | 25 ms | 100 |
| /servicios/web, después | 73 | 7,1 s | 130 ms | 100 |
| /servicios/asistente-ia, después | 73 | 7,1 s | 156 ms | 100 |

El TBT sube algo, por debajo de los 200 ms que Google considera bueno.
