# Aterna Studio — web

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

Para publicar, sube el **contenido** de `out/` a `public_html/`. Incluye
`.htaccess`, `contacto.php`, `php/` (PHPMailer) y los ejemplos de `ejemplos/`.

> `public/php/mail-config.php` (credenciales SMTP) **no está en git**. Si
> clonas el repo, cópialo desde el servidor antes de compilar.

### Demo en GitHub Pages

Cada push a `main` ejecuta `.github/workflows/pages.yml`, que compila con
`NEXT_PUBLIC_BASE_PATH=/AternaStudio` y publica `out/`. En la demo el
formulario de contacto no envía (no hay PHP en Pages). Para compilar así en
local: `NEXT_PUBLIC_BASE_PATH=/AternaStudio npm run build`.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Textos ES/EN (todos) | `src/lib/dict.ts` |
| Precios | `src/lib/pricing.ts` |
| Datos de contacto, URL | `src/lib/site.ts` |
| Títulos y descripciones SEO | `metadata` de cada `src/app/**/page.tsx` |
| Sistema de diseño (tokens y estilos) | `src/app/globals.css` |
| Ilustraciones | `src/components/illustrations/` |
| Páginas legales (HTML literal) | `src/content/legal/` |
| Imagen para redes (OG) | `public/brand/og.png` (se regenera con `scripts/og-image.js`) |

## Ilustraciones

El arte original está en `design/illustrations/` (PNG). `node
scripts/prepare-illustrations.js` lo recorta, le quita el fondo y lo deja
en WebP en `public/illustrations/`. Para cambiar una ilustración, sustituye
el PNG con el mismo nombre y vuelve a ejecutar el script.

| Archivo | Dónde aparece | Fondo |
| --- | --- | --- |
| `estudio-portada` | Portada, bloque «Estudio» | papel |
| `estudio-pagina` | `/estudio` | papel |
| `servicio-web`, `-seo`, `-mantenimiento`, `-asistente-ia` | Portada, lista de servicios | tinta |
| `contacto` | `/contacto` | tinta |
| `cierre-avion` | Cierre de página (contacto), al final de casi todas | papel |

Reglas:

- **Cada imagen en un solo sitio.** Los iconos de servicio viven en la lista
  de la portada; ni las tarjetas de `/servicios` ni las fichas los repiten.
- Las escenas (fondo crema que el script vuelve transparente) van solo
  sobre papel. Las imágenes neón (el script las deja como luz sobre fondo
  transparente) van solo sobre tinta.
- Exporta los originales a ≥1200 px de ancho para que se vean nítidos en
  pantallas retina.

La 404 conserva su dibujo SVG hecho en código (`IllLost`, motor en
`Ill.tsx`).
