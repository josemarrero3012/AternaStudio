# Web de Aterna Studio

Aquí está el código de la web de Aterna Studio, un estudio digital que hace webs a medida, SEO, mantenimiento y asistentes con IA. Me estoy encargando de mejorarla.

Se puede ver aquí: https://josemarrero3012.github.io/AternaStudio/

## Qué he hecho hasta ahora

- Saqué la paleta de colores del vídeo de la portada y después la aclaré, de casi negro a un azul índigo.
- Añadí iconos animados en SVG a lo largo de la web y una pequeña animación para cada servicio.
- Reorganicé el contenido para que cada idea salga una sola vez y las secciones no repitan lo mismo.
- Preparé la publicación automática en GitHub Pages, para tener una demo que se actualiza con cada cambio.

## Cómo está organizada

Quería que cambiar algo fuera fácil sin tener que buscar por todo el código, así que cada cosa tiene su sitio:

- Todos los textos, en español y en inglés, están en un solo archivo: `src/lib/dict.ts`.
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

Y se abre en http://localhost:3000. Cómo se publica y dónde está cada cosa lo tengo explicado en [docs/DESARROLLO.md](docs/DESARROLLO.md).
