# Calidad: cifras de partida y cómo se miden

Este documento guarda las cifras de la web **antes de la mejora** (12 de
noviembre de 2026, `main` en `babf3b1`). Cada fase se compara con ellas,
midiendo de la misma forma.

## Cómo se mide

Todo se mide sobre la web exportada (`out/`), servida en local con
`npm start` o `node scripts/serve-out.mjs`, que aplica las mismas reglas que
el `.htaccess`. Así no influyen la red ni el servidor.

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

- **El LCP en móvil (7–8 s) lo causan las entradas animadas, no la red.** La
  primera pintura llega a 1,4 s, pero el texto principal de cada página
  empieza oculto y espera a que el JavaScript lo haga aparecer. En la portada,
  el elemento que Lighthouse toma como LCP es la etiqueta «Menú», porque el
  titular aún no se ve.
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
| Los idiomas de la cabecera miden menos de 24 px (WCAG 2.2, criterio 2.5.8) | Portada, escritorio | Dirección de arte (rediseño de la cabecera) |
| El texto principal aparece tarde en móvil (LCP de 7–8 s). Causa: la cortina de entrada (`Curtain`, `components/Chrome.tsx`) tapa cada página interior en la primera visita hasta que el JavaScript la retira; con el móvil lento de Lighthouse, a los ~7 s | Todas las páginas interiores | Movimiento |
| 8 avisos de ESLint de las reglas del compilador de React (refs escritas al pintar, `setState` dentro de efectos) | `Assistant`, `Chrome`, `WordReveal`, formulario | Arquitectura |
| `npm audit`: 7 avisos moderados (`minimatch`) | Solo herramientas de desarrollo (ESLint); no llega a `out/` | Al actualizar ESLint |

## Fuera del código

- **La web publicada es antigua.** `aternastudio.com` es la versión del 21 de
  octubre (sin el árbol de partículas). Lo de `main` solo está en la demo de
  GitHub Pages. Hay que avisar al responsable del despliegue.

## Cambios medidos

### Fichas de servicio con la dirección «Raíz» (12 de noviembre de 2026)

| Página (móvil) | Rendimiento | LCP | TBT | Accesib. |
|---|---|---|---|---|
| /servicios/web, antes | 75 | 8,0 s | 25 ms | 100 |
| /servicios/web, después | 73 | 7,1 s | 130 ms | 100 |
| /servicios/asistente-ia, después | 73 | 7,1 s | 156 ms | 100 |

El rendimiento queda igual: el texto ya no espera a su animación de entrada,
pero la cortina de entrada sigue tapando la página (ver «Problemas
conocidos»). El TBT sube algo, por debajo de los 200 ms que Google considera
bueno.
