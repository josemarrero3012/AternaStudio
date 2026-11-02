# Recorrido de la portada, versión 2: encargo y contexto

Este documento pasa el contexto a la sesión que va a hacer la versión 2 del
recorrido de la portada. **No es el plan**: el plan lo prepara esa sesión, en
modo plan y con razonamiento máximo, y se lo enseña a José antes de tocar
nada.

**Reparto del trabajo**: Claude trabaja en una sesión en la nube (sin GPU).
El ordenador de José con la RTX solo renderiza y **no ejecuta Claude**: José
lanza un script con un solo comando y el resultado vuelve por git. Así no
gasta el límite semanal de su plan, que lo consumen las sesiones locales y
está casi agotado. Las sesiones en la nube gastan créditos aparte (74 $ el
2 de noviembre, que caducan el 5 de noviembre a las 7:59 WET): conviene
cerrar el trabajo antes y no gastar turnos de más (esperar a que termine un
render no cuesta nada).

## Qué hay ahora (versión 1, en `main`)

La portada es un recorrido con scroll: 120 fotogramas renderizados en Blender
(Cycles) que van de un portal de raíces de luz, por un túnel de arcos de
raíces, hasta el símbolo de Aterna en 3D sobre una peana con anillos.

- **Web**: `src/components/Journey.tsx` (escenario fijado de 380vh, pantalla de
  carga con fundido WebGL, bloques de texto, tarjetas de vidrio),
  `src/lib/journey/` (`config.ts` con todos los números y las URL,
  `sequence.ts` carga de fotogramas, `depthRenderer.ts` WebGL,
  `burnRenderer.ts` el fundido, `glass.ts` las copias desenfocadas, `motion.ts`)
  y `src/styles/journey.css`. Textos en `src/lib/dict.ts` (`journey`), en
  español, inglés, neerlandés y alemán. Cursor nuevo en `src/components/Chrome.tsx`.
  Todo está explicado en `docs/DESARROLLO.md` («El recorrido de la portada»).
- **Fotogramas**: `public/journey/v1/`, 1600 × 900 en WebP (q82) y un mapa de
  profundidad por fotograma a 800 × 450 (blanco = cerca). 14 MB en total.
- **Escena**: `scripts/journey/scene.py` (bpy 5.2, procedural, semilla fija
  3012: la misma escena siempre), `post.py` (revelado: halo, AgX, niebla hacia
  `#13163b`, mapas de profundidad), `mark_contours.py` + `mark.json` (el
  símbolo vectorizado desde `public/brand/aterna-mark.png`),
  `aterna-mark.blend` (solo el símbolo).
- Se renderizó en una máquina en la nube **sin GPU**: Cycles en 4 núcleos,
  64 muestras con umbral adaptativo 0,035, OIDN, 1600 × 900, ~90 s por
  fotograma.

## Qué ha visto José (los problemas)

1. **Descuadres al mover el ratón**, sobre todo a los lados y en el símbolo del
   fondo del túnel: con el puntero en un lateral, las fibras se ondulan o se
   rompen y el símbolo sale doblado o fantasma.
2. **Todo se ve en baja calidad.**

José se pregunta si es porque el escenario no es 3D de verdad: sí, es eso.

## Diagnóstico (ya hecho)

- **Descuadre**: el paralaje es 2,5D. Cada fotograma es una imagen plana y el
  shader desplaza cada píxel según su mapa de profundidad
  (`uv + pointer * strength * (depth − 0,5) * 2`, fuerza 0,0144 × 0,0108).
  Donde lo cercano toca lo lejano, la imagen se estira o se desgarra. El
  símbolo es el peor caso: sus huecos dejan ver el fondo, que está a otra
  distancia, y el mapa está dilatado y desenfocado (`post.py`), así que el
  símbolo y lo que hay detrás se desplazan distinto. Es un límite de la
  técnica, no un error puntual.
- **Calidad**: se suman cuatro cosas. Resolución (1600 × 900 ampliado a
  pantallas de 1920 o 2560 y, en retina, ×2: el lienzo usa
  `min(devicePixelRatio, 2)`). Pocas muestras y OIDN sin pases de albedo y
  normales: las fibras finas quedan borrosas. Profundidad de campo (f/2,4),
  halo y niebla que ablandan. Compresión WebP q82.

## Lo que quiere José

- **Máxima calidad posible y el mejor rendimiento posible**, a la vez.
- Que el paralaje no deforme nada, sobre todo el símbolo.
- Que siga cohesionado con la estética de la web, sin fallos: lo demás de la
  versión 1 (textos, tiempos, cabecera, cursor, cuatro idiomas, accesibilidad,
  movimiento reducido, sin WebGL, sin JavaScript) se mantiene salvo que el plan
  justifique cambiarlo.

## Direcciones que se hablaron (a validar en el plan, no decididas)

- **Paralaje por capas (multiplano)** en lugar de desplazar píxeles: Blender
  renderiza cada fotograma en capas con transparencia (por ejemplo fondo,
  túnel, símbolo con su peana) con holdouts, y en la web cada capa se mueve
  entera según el puntero. Lo que queda al descubierto es imagen real, no
  píxeles estirados. Necesita algo de margen (overscan) para no ver bordes.
  Alternativa descartada de entrada: 3D en tiempo real con three.js (paralaje
  perfecto, peor calidad que Cycles; fue lo que se intentó antes y se retiró).
- **Calidad**: master a 2560 × 1440 o más, muchas más muestras, OIDN con
  albedo y normales, menos desenfoque, revisar el grosor de las fibras finas.
- **Rendimiento**:
  - Varias resoluciones según `viewport × dpr`.
  - Una versión ligera de todo el recorrido primero y la alta definición
    alrededor del punto donde se está.
  - Solo una ventana de fotogramas decodificados en memoria: 120 × 3 capas a
    2560 no caben.
  - AVIF con WebP de respaldo.
  - El fondo, que es niebla, a menor resolución, y la capa del símbolo
    recortada a su zona.
  - Mipmaps o un tamaño servido cercano al del lienzo, para no ampliar ni
    producir aliasing.

## El ordenador que renderiza (el de José, sin Claude)

- Se maneja con un script del repositorio (por ejemplo
  `scripts/journey/render-gpu.sh`) que José lanza en Konsole desde
  `~/Escritorio/AternaStudio`. El script tiene que:
  - hacer `git pull` de la rama;
  - preparar Blender y el venv si faltan;
  - renderizar (reanudable);
  - hacer el revelado;
  - subir solo lo final, ni EXR ni archivos intermedios.

  Lo que sube son los WebP/AVIF de cada resolución y capa, hojas de contactos
  y un informe corto (tiempos por fotograma, muestras, errores) que la sesión
  en la nube lee.
- Los EXR se quedan en el PC (son decenas de GB). Si hay que retocar el
  revelado, otro comando que solo rehace `post.py`.
- CachyOS (Arch), RTX 3060 de 12 GB, driver NVIDIA 615.
- **Blender**: `pacman -S blender` falló por un espejo roto. Usar el Blender
  5.2.3 oficial de blender.org (tar.xz, sin `sudo`, trae los núcleos de
  CUDA/OptiX) dentro de una carpeta ignorada por git. Ojo: `scene.py` está
  escrito para el módulo `bpy` de pip. Con `blender -b --python scene.py -- …`
  los argumentos van después de `--`, y el Python de Blender no trae `scipy`
  (solo se usa `CubicSpline`). Ajustar una de las dos cosas.
- Para `post.py`: un venv con `numpy scipy opencv-python-headless pillow OpenEXR`.
- Activar OptiX en Cycles (`compute_device_type = "OPTIX"`) y comprobar que la
  GPU aparece antes de lanzar 120 fotogramas.
- `git push` desde ese ordenador (`gh auth login` si hace falta), para que
  el script suba los resultados.

## Lo aprendido en la versión 1

- El render debe poder reanudarse (salta los EXR que ya existen) y validar los
  EXR al terminar: en la nube se cortó dos veces a mitad.
- Para no tener que esperar al final: renderizar en orden de grueso a fino
  (0, 119, 32, 64, … y después los intermedios) y probar la web con fotogramas
  parciales.
- Comprobar la continuidad: diferencia media entre fotogramas consecutivos y
  una hoja de contactos de toda la secuencia.
- Composición: el símbolo va centrado y por encima del texto. En móvil, el
  recorte vertical solo deja ver el centro (~0,32–0,56 del ancho).
- La escena es determinista: mismo `numpy` y misma semilla dan la misma
  geometría. Si se cambia el orden de los números aleatorios, cambia la escena.
- En la nube no había GPU y las pruebas de WebGL iban por software
  (swiftshader). Aquí se puede probar con la tarjeta de verdad, también en
  Firefox.

## Cómo trabajar

1. **Modo plan y razonamiento máximo**: leer el código y este documento,
   reproducir el problema (capturas con el puntero en el centro y en los
   extremos) y proponer el plan con números: resoluciones, capas, muestras,
   tiempo de render estimado en la 3060, pesos por dispositivo y memoria.
   José lo aprueba antes de empezar. Después basta con esfuerzo alto.
   - La prueba corta del render la hace José con el script en su PC.
   - La nube no tiene GPU: las pruebas de WebGL allí van por software
     (swiftshader), así que la revisión visual final es de José en sus
     pantallas.
2. Ejecución por fases, cada una comprobada antes de la siguiente: una prueba
   corta de pocos fotogramas, después el render completo y por último la web.
3. Verificación:
   - Capturas automáticas con el puntero en el centro y en los extremos,
     comparadas para demostrar que no hay deformación.
   - 375 × 667, 768 × 1024, 1280 × 720, 1440 × 900, 1920 × 1080 y
     2560 × 1080, sin scroll horizontal.
   - Movimiento reducido.
   - Consola limpia también con StrictMode.
   - Pesos y memoria medidos.
   - `tsc` y `next build`.
   - Revisión de José en sus pantallas.
4. Rama: `claude/hopeful-babbage-yt1ln3` (salida de `main`). Los fotogramas
   nuevos van en una carpeta con versión nueva (`public/journey/v2`) y se
   actualiza `DIR` en `config.ts`. Nada pasa a `main` sin que José lo pida.
