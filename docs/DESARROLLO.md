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
| Textos ES/EN/NL/DE (todos) | `src/lib/dict.ts` |
| Precios | `src/lib/pricing.ts` |
| Datos de contacto, URL | `src/lib/site.ts` |
| Títulos y descripciones SEO (4 idiomas) | `src/lib/meta.ts` |
| Páginas en español (raíz) | `src/app/(es)/` |
| Páginas en inglés, neerlandés y alemán (`/en`, `/nl`, `/de`) | `src/app/[lang]/` |
| Tokens de diseño (color, tipo, espacio, forma, movimiento) | `src/styles/tokens.css` |
| Estilos de componentes y páginas | `src/app/globals.css` |
| Páginas legales (HTML literal) | `src/content/legal/` |
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

## Imágenes

La web no usa ilustraciones ni fotos: la única imagen es el vídeo del hero
(`public/brand/hero-tree-*`), que marca la estética de todo lo demás. La
profundidad de las secciones se construye con CSS (color, luz, líneas y
tipografía), no con imágenes.
