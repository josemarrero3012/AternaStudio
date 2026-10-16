# Aterna Studio — web

Código fuente de aternastudio.com. Es Next.js con exportación estática:
`npm run build` genera la carpeta `out/` y esa carpeta es la web que se
sube a Hostinger. No hace falta Node.js en el servidor.

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

Son SVG hechos en código con un lenguaje común (`Ill.tsx`): línea uniforme
con un ligero temblor de trazo, tres tintas planas de la marca (azul,
violeta y rosa) desplazadas respecto al contorno, como una risografía, y
el árbol del símbolo como hilo conductor. Se adaptan solos a fondo claro u
oscuro y se dibujan al entrar en pantalla, salvo con «reducir movimiento».

Para crear una nueva, compón formas con `<S d="…" f="a|b|c|s" />`
(contorno + relleno), `<Dot>`, `<Spark>` y `<Dash>`.
