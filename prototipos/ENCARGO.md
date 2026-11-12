# Encargo: nueva dirección para las páginas interiores

Prototipo estático de **una página**, `/servicios/web`, que sirva de modelo
para el resto de páginas interiores de aternastudio.com (los otros servicios,
`/servicios`, `/estudio`, `/contacto`). No se toca la web (`src/`): se decide
sobre el prototipo y después se lleva al código.

## El punto de partida

La portada tiene una identidad fuerte: el árbol de Aterna hecho de partículas
de luz que baja a sus raíces, sobre una paleta «noche». Las páginas
interiores no están a esa altura. Míralas en la demo
(https://josemarrero3012.github.io/AternaStudio/servicios/web) o con
`npm run build && npm start`.

Lo que falla hoy en `/servicios/web`:

1. **Una sola receta para todo.** La misma tarjeta (marco con degradado
   índigo-orquídea y panel negro) sirve para planes, servicios, pilares y
   formulario. Nada destaca porque todo pesa igual.
2. **Jerarquía plana.** La página es una pila de filas «etiqueta a la
   izquierda, contenido a la derecha» separadas por filetes. La columna de
   etiquetas ocupa un tercio del ancho y está casi vacía.
3. **El contenido tiene una forma que el diseño no muestra.** «Qué incluye»
   son seis pasos en orden (de la auditoría a la entrega) presentados como
   una lista de comprobación. Los tres planes son acumulativos (cada uno
   contiene al anterior) y se presentan como tres tarjetas iguales.
4. **Rasgos de plantilla.** Etiquetas en mayúsculas espaciadas y
   monoespaciada sobre cada bloque, numeración «01 —» donde no hay
   secuencia, una palabra del titular en cursiva o degradado, botones
   píldora.
5. **El texto principal tarda en verse.** Empieza oculto y espera a la
   animación de entrada (LCP de 8 s en móvil). El contenido tiene que estar
   visible sin JavaScript y sin esperar a ninguna animación.

## Lo que se conserva

- **La identidad:** paleta «noche» y acentos (`base/tokens.css`, copia de
  `src/styles/tokens.css`), Fraunces para titulares, Geist para texto y Geist
  Mono. El árbol, las raíces y la luz como motivos. Se puede usar menos de
  algo, o de otra forma; no cambiar de identidad.
- **Los textos y los precios**, tal como están en `src/lib/dict.ts`
  (`servicePages.web`, en español) y `src/lib/pricing.ts`. Se pueden
  reordenar bloques y cambiar o quitar etiquetas de sección; no reescribir
  el contenido.
- **La cabecera y el pie**, que no se rediseñan en este encargo: vienen en
  `base/esqueleto.html` y `base/base.css`.

Criterio del cliente: evolucionar el sistema actual; replantear una pieza
solo si el cambio es una mejora en todos los sentidos (aspecto, claridad,
rendimiento, accesibilidad).

## Qué se entrega

En `prototipos/servicios-web/<nombre>/`:

- `index.html` (partiendo de `base/esqueleto.html`) y su hoja de estilos.
  HTML y CSS; JavaScript solo si la interacción lo necesita, en línea y sin
  dependencias. Ninguna petición a otros dominios.
- `NOTAS.md`, breve: la idea en cinco líneas, qué cambia respecto a la
  página actual y por qué, y cómo se aplicaría a las otras páginas
  interiores.

La página lleva todos los bloques de la actual: cabecera de página (título,
entradilla, precio de salida, llamada), el servicio, qué incluye, planes,
preguntas frecuentes, otros servicios y la llamada final a contacto.

## Requisitos

- Se ve bien a 375 px y a 1440 px de ancho, y en los anchos intermedios.
- Accesible: WCAG 2.2 AA (contraste, foco visible, orden de encabezados,
  zonas táctiles de 24 px o más, funciona con teclado).
- Respeta `prefers-reduced-motion`. El movimiento que no responde a una
  acción del usuario, poco y con intención.
- Todo el contenido visible sin JavaScript.
- Ligero: sin imágenes pesadas ni librerías. Los dibujos, en SVG o CSS.

## Cómo se valora

1. Comparada lado a lado con la página actual, ¿es claramente mejor?
2. ¿Tiene una identidad propia, que no se confundiría con otra web, y sigue
   siendo Aterna?
3. ¿Un posible cliente encuentra antes lo que busca (qué es, qué incluye,
   cuánto cuesta, qué plan le toca, cómo empezar)?
4. ¿Se puede aplicar a las demás páginas interiores sin forzarla?
5. ¿Cumple los requisitos (móvil, accesibilidad, peso)?

## Verlo

    node scripts/serve-out.mjs 4174 prototipos

y abrir http://localhost:4174/servicios-web/<nombre>/
