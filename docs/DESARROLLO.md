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
| Tokens de diseño (color, tipo, espacio, forma, movimiento) | `src/styles/tokens.css` |
| Estilos de componentes y páginas | `src/app/globals.css` |
| Páginas legales (HTML literal) | `src/content/legal/` |
| Imagen para redes (OG) | `public/brand/og.jpg` (se regenera con `scripts/og-image.js`) |

## Imágenes

La web no usa ilustraciones ni fotos: la única imagen es el vídeo del hero
(`public/brand/hero-tree-*`), que marca la estética de todo lo demás. La
profundidad de las secciones se construye con CSS (color, luz, líneas y
tipografía), no con imágenes.
