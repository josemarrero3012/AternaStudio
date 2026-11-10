# Tarjeta de contacto de Aterna Studio

Tarjeta de visita con la identidad de la web: anverso con el marco degradado y el
panel negro de las tarjetas (`.aurora-card` + `.aurora-panel`), símbolo y logotipo;
reverso en noche con la etiqueta de la web, el titular en Fraunces, los datos en
Geist / Geist Mono y un QR a aternastudio.com.

| Archivo | Para qué |
| --- | --- |
| `aterna-tarjeta-sangrado.pdf` | El que se manda a la imprenta. 2 páginas (anverso, reverso), 91 × 61 mm = 85 × 55 mm + 3 mm de sangrado. |
| `aterna-tarjeta-marcas.pdf` | Igual, con marcas de corte (101 × 71 mm), para imprentas que las pidan o para imprimir en casa y recortar. |
| `tarjeta.html` | La fuente editable. Textos, colores y medidas en mm. |
| `assets/` | Símbolo y logotipo en vector (trazados desde `public/brand`) y el QR. |
| `fonts/` | Fraunces, Geist y Geist Mono (licencia SIL OFL, de Google Fonts). |

## Datos de imprenta

- Formato final 85 × 55 mm (estándar europeo). Sangrado 3 mm. Todo el texto queda
  a 5 mm o más del corte.
- Color en RGB: las imprentas online lo convierten a CMYK. Los violetas saturados
  salen un poco más apagados en papel; pide prueba si el tono importa.
- Fuentes incrustadas y logotipo en vector.
- Papel recomendado: 350–400 g mate o soft-touch; el negro del reverso luce más
  con laminado mate.

## Cambiar un dato y regenerar

1. Edita el texto en `tarjeta.html` (el `<dl class="contact">` del reverso).
2. Si cambias la web del QR, regenera `assets/qr-web.svg`.
3. `node print/tarjeta-contacto/exportar.mjs` (necesita Playwright con Chromium).
   Sin Playwright: abre `tarjeta.html` en Chrome → Imprimir → Guardar como PDF,
   márgenes «Ninguno» y «Gráficos de fondo» activado.

Abre `tarjeta.html?guias` para ver el corte (línea continua) y el margen de seguridad (discontinua).
