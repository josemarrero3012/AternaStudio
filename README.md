# Web de Aterna Studio

Aquí está el código de la web de Aterna Studio, un estudio digital que hace webs a medida, SEO, mantenimiento y asistentes con IA.

**De momento la web está terminada.** Lo que hay en `main` es la versión final.

**Web oficial:** https://aternastudio.com
(La misma versión, en la demo de GitHub Pages: https://josemarrero3012.github.io/AternaStudio/)

**Vista previa con casos de éxito:** https://josemarrero3012.github.io/AternaStudio/casos/
Es la web oficial más la sección «Casos de éxito», con [Calma Café](https://josemarrero3012.github.io/AternaStudio/casos/trabajo/calma-cafe) y [The Fragrance Bar](https://josemarrero3012.github.io/AternaStudio/casos/trabajo/the-fragrance-bar). Vive en la rama `casos-de-exito` y es para cuando formalicemos esos dos proyectos; hasta entonces esas páginas no se indexan.

## Para subirla

Los pasos para compilarla y subirla a Hostinger, lo que no está en el repositorio (la contraseña del correo del formulario) y cómo comprobar que todo funciona están en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md). En resumen:

```bash
npm ci
npm run build   # deja la web en out/
```

y se sube el contenido de `out/` a `public_html/`, archivos con punto incluidos.

Las dos demos de GitHub Pages se vuelven a publicar solas cada vez que se sube algo a `main` o a `casos-de-exito`.

## Qué he hecho hasta ahora

- Saqué la paleta de colores del vídeo de la portada y después la aclaré, de casi negro a un azul índigo.
- Añadí iconos animados en SVG a lo largo de la web y una pequeña animación para cada servicio.
- Reorganicé el contenido para que cada idea salga una sola vez y las secciones no repitan lo mismo.
- Preparé la publicación automática en GitHub Pages, para tener una demo que se actualiza con cada cambio.
- En «Cómo trabajamos» cambié la imagen por una raíz de luz: el titular queda sobre una línea de la que cuelgan raíces con lo que se decide antes del código, y esa línea se convierte en el eje de las fases. Al bajar, la luz avanza por el eje y enciende cada fase cuando llega a ella.
- Añadí el neerlandés y el alemán, y arreglé que al cambiar de idioma algunas frases se quedaran en el anterior.
- Rehíce el menú del móvil para que se abra igual de suave esté donde esté la página.
- Di a cada idioma sus propias direcciones (`/en`, `/nl` y `/de`, con el español en la raíz) para que Google indexe las cuatro versiones, cada una con su título, su descripción y los enlaces `hreflang` que las relacionan.
- Llevé las raíces a más sitios sin llenar la web: cuelgan del eje del método, crecen donde acaba y sostienen la palabra «Aterna» del pie.
- Añadí las páginas legales que pide una empresa registrada en Alemania (Impressum, Datenschutzerklärung y el aviso legal en español).
- Usé una versión clara del logo para que se lea bien sobre el fondo oscuro, también en el pie.
- Cada idioma tiene su propia página 404.
- Reescribí los textos de los cuatro idiomas para que suenen más naturales.
- El asistente de la esquina responde con los textos de la web sin ninguna API: busca por palabras en cualquier dispositivo y, en ordenador, carga un modelo pequeño que se sirve desde la propia web. También tiene «Ayúdame a elegir», que deja el mensaje escrito para WhatsApp o para el formulario.

## Cómo está organizada

Quería que cambiar algo fuera fácil sin tener que buscar por todo el código, así que cada cosa tiene su sitio:

- Todos los textos, en español, inglés, neerlandés y alemán, están en un solo archivo: `src/lib/dict.ts`.
- Los precios de los servicios, en `src/lib/pricing.ts`.
- Los colores, las tipografías y los espacios, en `src/styles/tokens.css`.

La web no usa fotos ni ilustraciones. La única imagen es el vídeo del árbol de la portada, y la profundidad del resto de secciones está hecha con CSS: color, luz, líneas y tipografía.

## Con qué está hecha

Next.js y React con TypeScript, y GSAP para algunas animaciones. Se exporta como web estática, así que el servidor no necesita Node: basta con subir la carpeta que se genera. El formulario de contacto envía el correo con un pequeño script en PHP (en la demo de GitHub Pages no envía, porque ahí no hay PHP).

## Probarla en local

```bash
npm install
npm run dev
```

Y se abre en http://localhost:3000. Dónde está cada cosa lo explico en [docs/DESARROLLO.md](docs/DESARROLLO.md), y cómo se sube a Hostinger, en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).
