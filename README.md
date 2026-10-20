# Web de Aterna Studio

Aquí está el código de la web de Aterna Studio, un estudio digital que hace webs a medida, SEO, mantenimiento y asistentes con IA. Me estoy encargando de mejorarla.

## Las dos versiones

La web tiene dos versiones, cada una en su rama y con su propia demo:

- **La web que se publica**, en la rama `main`: https://josemarrero3012.github.io/AternaStudio/
  Es la que se sube primero. Todavía no tenemos casos de éxito publicados, así que no los enseña.
- **La web con casos de éxito**, en la rama `casos-de-exito`: https://josemarrero3012.github.io/AternaStudio/casos/
  La misma web con la sección «Casos de éxito», con [Calma Café](https://josemarrero3012.github.io/AternaStudio/casos/trabajo/calma-cafe) y [The Fragrance Bar](https://josemarrero3012.github.io/AternaStudio/casos/trabajo/the-fragrance-bar). Es para cuando formalicemos esos dos proyectos; hasta entonces es una vista previa, así que esas páginas no se indexan.

Cada vez que subo una de las dos ramas, su demo se vuelve a publicar sola.

## Qué he hecho hasta ahora

- Saqué la paleta de colores del vídeo de la portada y después la aclaré, de casi negro a un azul índigo.
- Añadí iconos animados en SVG a lo largo de la web y una pequeña animación para cada servicio.
- Reorganicé el contenido para que cada idea salga una sola vez y las secciones no repitan lo mismo.
- Preparé la publicación automática en GitHub Pages, para tener una demo que se actualiza con cada cambio.
- En «Cómo trabajamos» cambié la imagen por una raíz de luz: el titular queda sobre una línea de la que cuelgan raíces con lo que se decide antes del código, y esa línea se convierte en el eje de las fases. Al bajar, la luz avanza por el eje y enciende cada fase cuando llega a ella.
- Añadí el neerlandés y el alemán, y arreglé que al cambiar de idioma algunas frases se quedaran en el anterior.
- Rehíce el menú del móvil para que se abra igual de suave esté donde esté la página.
- Llevé las raíces a más sitios sin llenar la web: cuelgan del eje del método, crecen donde acaba y sostienen la palabra «Aterna» del pie.

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

Y se abre en http://localhost:3000. Cómo se publica y dónde está cada cosa lo tengo explicado en [docs/DESARROLLO.md](docs/DESARROLLO.md).
