# Pilar 1 · Quien diseña, programa

Fuente: **Blender 5.2.3 LTS**, Python de Blender + NumPy 2.5.4 incluido, FFmpeg
para codificar. Generación PCG64 con semilla `20261109`: **7.200 puntos**, mismos
índices en A/B/C. No modifica componentes ni shaders de la web.

## Qué se ve

- **A — Dos caminos:** arriba a la izquierda, el boceto de una web azul/lavanda;
  debajo, `</>` y código violeta sangrado, separados por una franja vacía.
- **B — Se trenzan:** dos hebras de partículas recorren la tarjeta hacia la
  derecha y se cruzan alternando delante/detrás, con profundidad real en Z.
- **C — Una sola pieza:** el boceto se convierte en una web terminada, desplazada
  a la derecha y centrada verticalmente; un nodo orquídea señala la atención personal.

## Reproducir desde la raíz del repo

```sh
# Binarios + manifiesto, sin render. Comprueba dos generaciones idénticas.
ALSOFT_DRIVERS=null blender -b -t 8 --python scripts/estudio-v2/pillar-1/build.py -- --mode export

# Póster 1920 × 800, Cycles, 128 muestras, WebP sin pérdidas.
ALSOFT_DRIVERS=null blender -b -t 8 --python scripts/estudio-v2/pillar-1/build.py -- --mode poster --samples 128 --frames-dir /tmp/aterna-p1-poster

# 6 s exactos, 180 fotogramas, 30 fps, Cycles, 32 muestras, H.264 CRF 17.
ALSOFT_DRIVERS=null blender -b -t 8 --python scripts/estudio-v2/pillar-1/build.py -- --mode preview --samples 32 --frames-dir /tmp/aterna-p1-preview

# Opcional: abrir los tres modelos como shape keys en Blender.
ALSOFT_DRIVERS=null blender -b --python scripts/estudio-v2/pillar-1/build.py -- --mode export --save-blend /tmp/aterna-pillar-1.blend
```

`--device auto` selecciona **OptiX si existe una NVIDIA compatible**; si no,
CPU. `--device optix` exige NVIDIA y falla explícitamente si no está disponible.
Los renders entregados se hicieron por CPU (este equipo tiene gráfica Intel).
`ALSOFT_DRIVERS=null` evita que el audio bloquee la salida de Blender en headless.
`--mode stills` renderiza A/B/C; `--frames 48,120` permite inspeccionar transiciones.
`--output /tmp/repeticion` permite comprobar otra exportación sin tocar la entrega.

La preview entregada mide **5.813.952 B** y está en
`scripts/estudio-v2/pillar-1/preview.mp4`, excluida por `.gitignore` y facilitada
como archivo local junto a la entrega. No se sube a GitHub ni se carga en la web.
Al regenerarla, si mide ≤3.000.000 B se escribe en la carpeta pública; si supera
ese límite se guarda aquí. Es una referencia visual para integración.

## Contrato binario

Sin cabecera ni padding. `state-*.bin`: 43.200 B cada uno, 7.200 tripletas de
`int16` **little-endian**, XYZ intercalado. `coord = q / 32767 * [1, .42, .35]`;
exportación al entero más próximo, mitades alejadas de cero. Y hacia arriba,
cámara desde +Z. `attr.bin`: 28.800 B, cuatro `uint8` por punto:
**tono, tamaño, tipo, grupo**. Tipo 0 forma, 1 polvo, 2 nodo.
El manifiesto incluye SHA-256 de los cuatro binarios.

| Grupo | Índices (inclusive) | Puntos | Función |
| --- | --- | ---: | --- |
| 0 | 0–2399 | 2400 | Diseño: imagen, estructura, líneas y bloques; hebra 1 |
| 1 | 2400–5399 | 3000 | Código que completa texto, botón y detalles; hebra 2 |
| 2 | 5400–6719 | 1320 | Marco y barra del navegador; viaja con hebra 1 |
| 3 | 6720–6839 | 120 | Acento del código → extremo de hebra 2 → nodo de atención |
| 4 | 6840–7199 | 360 | Polvo tenue, fijo en A/B/C: exactamente 5 % |

Diseño y marco conservan sus coordenadas de página (UV) entre A y C. El código
se empareja con el contenido final mediante particiones espaciales balanceadas
y cercanía local. Las dos hebras se ordenan por X combinada de origen/destino;
el marco se ordena junto al diseño. **No barajar los arrays**, ni ordenar cada
estado por separado. Para B, grupo 2 pertenece a la primera hebra y grupo 3 a la segunda.

## Apariencia y movimiento de referencia

El byte de tono describe el degradado de **C**: paradas `0 #4b55d6`,
`85 #9aa3ff`, `170 #9a5cf0`, `255 #d77cf5`, interpoladas en RGB lineal.
Para que A distinga los dos oficios sin cambiar atributos, el render mezcla
un matiz semántico con el canónico. Con `t = tono/255`, en A usa
`0.08 + 0.28*t` para grupos 0/2, `0.58 + 0.12*t` para 1/3 y `t` para polvo.
La mezcla hacia el tono canónico es 0 en A, 0.5 en B, 1 en C.

Con `s = tamaño/255`, el radio base es `0.00065 + 0.0014*s^1.6` y la emisión
`1.3 + 2*s`. Polvo: radio ×0.7, emisión ×0.27. Los nodos tienen tamaño ≥200;
su centro mezcla orquídea con `#fff5ff`, según tamaño, y pulsa al llegar a C.
La función `point_appearance` es la referencia exacta. En WebGL conviene expresar
el tamaño visual en píxeles CSS para conservar legibilidad a escala de tarjeta.

La cámara ortográfica cubre 2.18 unidades de ancho, formato 12:5, origen centrado.
Los modelos se construyen como malla de vértices con tres shape keys y se
convierten a puntos nativos de Cycles mediante Geometry Nodes; **sin caras ni
aristas visibles**. Emisión, fondo negro y compositor Fog Glow; sin denoising,
para preservar cada punto. No hay iluminación externa ni objetos sólidos.

Preview: A hasta 0.8 s; A→B hasta 2.5 s; B hasta 3.3 s; B→C hasta 5.2 s;
C hasta 6 s. Interpolación `smootherstep`, sin dispersión aleatoria. Durante B
la cámara realiza una inclinación leve para mostrar Z; durante C late el nodo.
Para interacción, rotar Y/Z de B alrededor del eje X y modular el grupo 3,
ponderando ambos efectos por el estado activo. La geometría exportada es fija.

Referencias de Blender: [Mesh to Points](https://docs.blender.org/manual/en/5.0/modeling/geometry_nodes/mesh/operations/mesh_to_points.html)
y [dispositivos de Cycles](https://docs.staging.blender.org/manual/en/latest/editors/preferences/system.html).
