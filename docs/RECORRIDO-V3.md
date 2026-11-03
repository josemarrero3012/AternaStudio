# Recorrido de la portada, versión 3: escena 3D en tiempo real

Este documento es el traspaso entre sesiones de la versión 3 del recorrido de la portada. Contiene:

1. El estado y la siguiente sesión.
2. Las reglas de trabajo.
3. El plan que aprobó José el 3 de noviembre.
4. Las notas técnicas que ya se averiguaron, para no volver a buscarlas.

Cada sesión empieza leyéndolo y termina actualizando «Estado» y «Siguiente sesión».

## Estado

**3 de noviembre: plan aprobado.**

- Aún no hay nada implementado.
- La rama `claude/recorrido-3d-tiempo-real-m7dqxy` es `main` (c074011) más este documento.
- Siguiente: la fase a.

## Siguiente sesión: fase a

Mensaje para abrirla, con el razonamiento en alto:

> Fase a del recorrido v3, en la rama `claude/recorrido-3d-tiempo-real-m7dqxy`. Lee `docs/RECORRIDO-V3.md` (el plan aprobado y las notas técnicas) y haz la fase a tal como está ahí. Haz solo las comprobaciones de la nube que dice el documento. Al terminar, actualiza el documento con el estado, los comandos exactos y qué tengo que mirar.

Trabajo de la fase a, en este orden:

1. Traer de la v2 `scene.py`, `requirements.txt` y las líneas de `.gitignore` (`.render/` y `__pycache__/`), sin los fotogramas: ver «De dónde sale cada cosa».
2. Escribir `scripts/journey/bake.py`. Construye la escena con `scene.py` y:
   - exporta las raíces (remuestreo, clases, máscaras de los tramos encendidos y atributos);
   - hornea la irradiancia por vértice, el ruido por anillo, el mapa de luz del suelo y la sonda del túnel (la del símbolo puede ser provisional hasta la fase b);
   - renderiza 3 referencias de Cycles en t = 0, 0,2 y 0,4;
   - codifica y deja un informe con tiempos, pesos y errores.
3. Escribir `scripts/journey/bake-gpu.sh` (modos `proto`, `full`, `stills` y `export`) a partir de `render-gpu.sh` de la v2.
4. Escribir `scripts/journey/verify-assets.mjs`.
5. La web:
   - `three` con versión exacta en `package.json`;
   - `src/lib/journey/camera.ts`;
   - `src/lib/journey/engine/` (`world`, `strands`, `materials`, `reflection`, `post`, `tiers` y `debug`);
   - la página `src/app/(es)/lab/recorrido/page.tsx`, con `noindex` y fuera del sitemap.
6. Comprobar en la nube, sin subir lo generado:
   - un horneado de humo con bpy de pip en CPU (16 muestras, baja resolución);
   - `npm run typecheck` y `npm run build`;
   - `verify-assets.mjs` sobre lo del humo;
   - un arranque de la página en Chromium, solo para ver que la consola está limpia.
7. Actualizar este documento y subir.

## Cómo se trabaja

Lo pidió José:

- **Por fases** (a, b, c, d), una sesión cada una. Cada fase la valida José en sus pantallas, en Chrome y Firefox, en el PC y en el portátil, antes de pasar a la siguiente.
- **Nada está «hecho»** hasta que José lo vea bien en sus equipos. Las pruebas en la nube nunca son «verificado».
- **La nube no tiene GPU**: allí solo se compila, se validan datos y se hace un arranque de humo. Nada de bucles lentos con WebGL por software. Esperar a que José pruebe no cuesta nada.
- **El PC de José no ejecuta Claude.** El trabajo pesado (Blender en la RTX) lo hace un solo comando, `scripts/journey/bake-gpu.sh`, que sube solo lo final.
- **Créditos limitados**: sesiones cortas y este documento como traspaso.
- **Preguntar** solo lo que de verdad decide José. Las decisiones técnicas y de arte son de Claude, justificadas.
- **Nada pasa a `main`** sin que José lo pida.

## Equipo de José

- **PC**:
  - CachyOS, RTX 3060 de 12 GB, driver NVIDIA 615 y Node 24;
  - carpeta `~/Escritorio/AternaStudio`, terminal Konsole;
  - Chrome/Chromium y Firefox.

  Probablemente aún tiene Blender 5.2.3 oficial en `.render/` (de la v2): se reutiliza.
- **Portátil**: Firefox (y Chrome si hace falta). La gráfica está por confirmar; la dirá la capa `?debug`.
- **Prueba en la red local**: `npm run build && npx serve out -l 3000`. Ojo con el cortafuegos del PC (`sudo ufw allow 3000/tcp`, o con firewalld `sudo firewall-cmd --add-port=3000/tcp`).

---

# Plan aprobado (3 de noviembre)

## Contexto

- **v1** (en `main`): 120 fotogramas con paralaje 2,5D. Se deforma y se ve en baja calidad.
- **v2** (rama `claude/hopeful-babbage-yt1ln3`, solo como referencia, sin sus 282 MB de fotogramas):
  - el mundo está congelado en cada foto;
  - durante el scroll se ve la versión ligera;
  - da saltos entre fotogramas;
  - «pintar» llegaba a 92 ms;
  - falló en Firefox: `texSubImage2D` con «Offset+size must be <= the size of the existing specified image» y pérdida del contexto WebGL. Solo se había verificado en la nube, con WebGL por software.
- **El three.js anterior**: se retiró por verse peor que Cycles.
- **Objetivo**: la misma escena de Cycles como 3D en tiempo real:
  - 60 fps o más en el PC y en el portátil;
  - viva: pulsos, fibras que se mecen, motas y destellos;
  - paralaje de cámara real;
  - acabado cercano a Cycles: luz horneada en la RTX, materiales, halo, antialias y grano;
  - todo lo demás igual que en la v1: textos, tiempos, pantalla de carga, vidrio, cuatro idiomas, accesibilidad, movimiento reducido y versión sin JavaScript.

## 1. Decisiones técnicas

### Motor: three.js (WebGLRenderer, WebGL2), versión fija

- **Peso**: va en un trozo aparte (~150 KB gzip, más ~40 KB del motor propio), que se descarga mientras sale la pantalla de carga.
- **Lo que aporta**:
  - el material físico del símbolo: metal anisótropo, capa transparente y película fina con entorno HDR;
  - glTF con meshopt;
  - MSAA en objetivos de render en coma flotante;
  - `compileAsync`: todos los shaders compilados antes de abrir.
- **Por qué no WebGPU**: Firefox estable lo activó en Windows (141) y en macOS con Apple Silicon (147); en Linux no consta que esté activado en la versión estable. Los equipos de José son justo el caso dudoso, y en esta escena no se notaría nada. Con WebGL2 hay una sola ruta, que se prueba igual en Chrome, Firefox y Safari.
- **Postprocesado a medida** (3 o 4 shaders) en lugar de una librería: menos pases, menos peso, y el halo, la curva y la niebla exactamente iguales que en la v1.

### Escena: la de Cycles, exportada (no regenerada en JS)

Medido el 3 de noviembre con la semilla 3012:

| Qué | Cantidad |
|---|---|
| Curvas | 1.202 (546 raíces, 94 raíces de fondo, 329 fibras y 233 tramos encendidos) |
| Puntos | 120.100 |
| Longitud total de raíz | 12,8 km |
| Motas | 1.167 |

- **Ejes**: cada hebra se exporta como un eje remuestreado (≤ 6° y ≤ 25 cm por tramo): 54.445 anillos en total.
- **Tubos**:
  - 12 lados para las raíces de 4 cm o más (209 hebras, 21.458 anillos);
  - 8 lados para las de 1,5 a 4 cm (248 hebras, 16.138 anillos).
- **Cintas**: las hebras de menos de 1,5 cm (512 hebras, 16.849 anillos) son cintas orientadas a la cámara. Nunca miden menos de 1 px y su brillo se compensa («phone-wire AA»), así que no parpadean ni se rompen al moverse.
- **Tramos encendidos**: son una máscara de emisión sobre su raíz, no geometría aparte. Comparten shader con los pulsos.
- **Formato**: las raíces van en un archivo propio (`strands.bin.gz`, ~0,7 MB) y el navegador construye los tubos y las cintas. El símbolo, la peana y los anillos van en glTF con meshopt (≈ 0,13 M triángulos).
- **Total**: ≈ 420.000 vértices y 0,8 M triángulos (0,7 M con 8 lados en los arcos lejanos). A la vez se ven entre 0,3 y 0,6 M.

Triángulos por grupo, con 12 lados en todos los tubos gruesos:

| Grupo | Triángulos |
|---|---|
| a0 | 91.000 |
| a1–a6 | 41.000–52.000 cada uno |
| back | 282.000 |
| base | 154.000 |

### Luz horneada en la RTX (Cycles con OptiX, la misma escena y las mismas luces)

| Qué | Para qué | Cómo se guarda |
|---|---|---|
| Irradiancia difusa por vértice de raíces y fibras (directa e indirecta) | La luz de los tramos encendidos sobre las raíces vecinas y la oclusión | Un armónico esférico L1 por anillo (12 bytes); en las cintas, la media por anillo |
| Ruido de bandas del material de Cycles | Las bandas lentas de luz a lo largo de cada raíz | 1 byte por anillo |
| Mapa de luz del suelo | 1024 × 2048 (≈ 2,7 × 4,5 cm por texel en el centro), 2048 muestras + OIDN | — |
| Sonda HDR del símbolo | Los reflejos del metal | 1024 × 512 |
| Sonda HDR del túnel | Los reflejos de la capa de las raíces | 512 × 256 |
| Imágenes de Cycles desde la misma cámara | 3 de referencia (A/B) en la fase a; 9 por formato en la c (sin WebGL y sin JavaScript) | — |

- **Formato del HDR**: 8 bits por canal, en escala logarítmica y sin canal alfa (así el navegador no lo premultiplica), en AVIF o WebP. El shader lo decodifica.
- **Comprobación**: el informe del horneado mide el error de la codificación.

### Render en tiempo real (cada fotograma)

1. **Pase principal**: en HDR (RGBA16F) con MSAA 4×, u 8× si la gráfica va sobrada.
2. **Raíces**:
   - el albedo por la irradiancia horneada;
   - la emisión del canto de Cycles (facing^2,2 por el ruido);
   - el reflejo de la capa (sonda del túnel);
   - los pulsos;
   - la niebla.
3. **Suelo**:
   - reflejo plano (la escena reflejada a ½ resolución), desenfocado según su rugosidad (0,14–0,5 con ruido);
   - la estela vertical de suelo mojado que se ve en los fotogramas de Cycles;
   - las luces de área aparecen en el reflejo, como en Cycles;
   - el mapa de luz debajo.

   La peana lleva su propio plano de reflejo (fase b).
4. **Niebla de la v1**:
   - 0,024 por metro a partir de 6 m, con un tope de 0,94;
   - hacia `#13163b`, con la franja del horizonte;
   - el cielo cae exactamente en `--night-0`.
5. **Halo**: cadena de mips (Jimenez 2014), con media de Karis para que lo fino no parpadee. Lleva el umbral y los pesos del halo de la v1.
6. **Composición**:
   - AgX con la curva de la v1 (1,12 de contraste y 1,12 de saturación);
   - el velo (`--journey-shade`), que pasa al shader para que el vidrio quede encima;
   - el vidrio de las tarjetas, pintado ahí mismo sin leer nada de la GPU;
   - la viñeta de la v1;
   - grano animado y tramado (sin bandas en los azules).
7. **Profundidad de campo**: se prueba en la fase b. Con f/4 solo afecta a lo muy cercano, así que entra solo si mejora sin quitar fluidez.

### Vida

- **Pulsos de luz** que viajan hacia el símbolo, como la savia («lo que no se ve sostiene lo que crece»):
  - por el suelo, hacia la peana;
  - por los arcos, de abajo arriba;
  - por los hilos, hacia el fondo.

  Van a 1,5–3 m/s con los colores de cada arco. Al final encienden los anillos de la peana y recorren los filamentos del símbolo (fase b).
- **Vaivén**: fibras, zarcillos e hilos se mecen con un ruido lento y coherente (0,08–0,2 Hz):
  - 2–4 cm en los arcos;
  - hasta 10 cm en las puntas de los zarcillos;
  - las raíces del suelo, quietas.
- **Motas** que suben y derivan; algunas centellean (los destellos de la cueva). Los tramos encendidos respiran ±8 %.
- Todo se anima con el tiempo, no con el scroll. Con movimiento reducido, todo queda quieto.

### Paralaje

- El puntero mueve la cámara de verdad, que sigue mirando al mismo punto. Propuesta: ±25 cm en horizontal y ±15 cm en vertical, unas 2,5 veces lo que permitía la v1 (≈ 10 cm equivalentes).
- Lo cercano se mueve más que lo lejano y nada se deforma.
- Lo enfocado hace de pivote: al final, el símbolo.
- Suavizado: el de la v1 (`POINTER_SMOOTHING` 0,055). Con el dedo no hay paralaje, como en la v1.

### Fluidez (lo que falló en la v2 queda resuelto por diseño)

- **Subidas a la GPU**: ninguna durante el recorrido. Geometría y texturas se suben una sola vez al cargar, con su tamaño exacto (texturas inmutables).
- **Lecturas de la GPU**: ninguna. Se acaban `preserveDrawingBuffer` y el canvas 2D con desenfoque.
- **Shaders**: compilados durante la pantalla de carga.
- **Memoria**: cero objetos nuevos por fotograma, así que no hay pausas del recolector.
- **Calidad fija al moverse**:
  - el nivel se elige al cargar, midiendo unos 40 fotogramas que quedan tapados por la pantalla de carga;
  - si el equipo se calienta, baja un escalón, y solo con la escena quieta.
- **Nitidez**: el lienzo va al tamaño real en píxeles (`devicePixelContentBox`), sin reescalado borroso.
- **Ritmo**: a la frecuencia de la pantalla si llega. Si no, a un divisor estable (72 fps en 144 Hz), nunca a saltos.
- **Pérdida de contexto**: pasa a las imágenes de Cycles y se recupera sola.

### Móvil: la misma escena en 3D, nivel ligero

- **Por qué no un vídeo ni la secuencia de la v2**:
  - un vídeo que sigue al scroll da tirones al buscar fotogramas en el móvil;
  - para no darlos, todos los fotogramas tendrían que ser clave, y pesaría más que la v2;
  - además, igual que la secuencia, deja el mundo congelado.
- **Por qué el 3D sí cabe**: la escena es casi toda emisión con la luz horneada, barata de pintar, y un móvil tiene entre 3 y 5 veces menos píxeles que el ordenador.
- **Nivel ligero**:
  - hasta 1,5 veces los píxeles CSS (≈ 1–1,3 MP);
  - sin MSAA, porque lo fino ya son cintas con su propio antialias;
  - reflejo a ¼ y halo de 5 niveles;
  - objetivo: 60 fps en móviles de 2021 en adelante.
- **Encuadre propio en vertical**: campo de visión vertical de ~55–60°, con el símbolo por encima de los textos. Sustituye al recorte de la v1, que solo dejaba ver la franja central (del 0,32 al 0,56 del ancho).
- **Si la calibración no llega a 50 fps**: las imágenes de Cycles con fundido, nunca un 3D a tirones.
- **Lienzo de 100svh**: la barra del navegador no lo redimensiona, porque redimensionar obliga a reasignar memoria y da un tirón.

### Sin WebGL, sin JavaScript, movimiento reducido

- **Sin WebGL2, con render por software (SwiftShader, llvmpipe) o en un equipo lento**: 9 imágenes de Cycles tomadas con la misma cámara, con fundido según el scroll, vidrio en 2D y los mismos textos.
- **Sin JavaScript**: la primera imagen y el titular, como en la v1.
- **Con movimiento reducido**: la escena 3D quieta, sin paralaje, sin fundido y sin entrada animada. El scroll sigue moviendo la cámara, como en la v1.

### Qué la hace distinta del three.js retirado

Lo retirado está en el commit `1c89a9f`, `src/world/`.

| | Retirado | v3 |
|---|---|---|
| Luz | Luces genéricas y un entorno sintético de cajas, sin luz indirecta | Horneada en Cycles con la escena y las luces reales |
| Escena | Generada en JS, distinta de la de Cycles | La misma de `scene.py` (semilla 3012), exportada |
| Tono | Sin mapeo de tono (`NoToneMapping`) | AgX con la curva de la v1 |
| Halo | `UnrealBloomPass` (manchado) | Cadena de mips ajustada al halo de la v1 |
| Antialias | MSAA y raicillas de 1 px que parpadean (`LineSegments`) | MSAA y cintas con ancho mínimo y brillo compensado |
| Suelo | Plano casi invisible | Reflejo real con rugosidad y estela |
| Niebla | `FogExp2` genérica | La de la v1, hacia `--night-0` |
| Resolución | Píxel ≤ 1,5 | Píxeles reales del dispositivo |
| Comparación con Cycles | A ojo | A/B en pantalla con un render de Cycles desde la misma cámara (tecla C) |

### Referencias de acabado

1. **Igloo Inc** (igloo.inc): Site of the Year 2024 y Developer Site of the Year 2024 en Awwwards. Hecha con three.js; el scroll lleva la cámara por los espacios.
   - Se toma: la cámara con inercia continua, los textos del DOM sincronizados con el 3D y el paso limpio de la carga al primer fotograma.
2. **Lusion v3** (lusion.co): Site of the Year 2023 en Awwwards.
   - Se toma: el acabado del postprocesado (halo, grano y color), un puntero con inercia física y la disciplina de no enseñar nada sin precompilar.
3. **Oryzo** (Lusion): Developer Award y Site of the Month en abril de 2026. Un objeto en tiempo real que parece fotografía renderizada.
   - Se toma: cómo se ilumina el objeto protagonista (el símbolo del final), con el entorno de la propia escena y brillos controlados.

## 2. Presupuestos

**Rendimiento**

El portátil está por confirmar con `?debug`.

| | PC (RTX 3060) | Portátil | Móvil (2021 en adelante) |
|---|---|---|---|
| Objetivo | ≥ 60 fps, a la frecuencia de la pantalla | 60 fps | 60 fps |
| Resolución | Píxeles reales (dpr ≤ 2) | Píxeles reales (dpr ≤ 1,5) | ≤ 1,5× CSS (≈ 1–1,3 MP) |
| Antialias | MSAA 4× (u 8×) y cintas | MSAA 4× o 2× y cintas | Cintas con antialias propio |
| Reflejo del suelo | A ½ | A ½ o ¼ | A ¼ |
| GPU por fotograma | ≤ 5 ms a 1440p (≤ 8 ms en 4K) | ≤ 11 ms | ≤ 11 ms |
| JavaScript por fotograma | ≤ 1,5 ms | ≤ 3 ms | ≤ 3 ms |
| Triángulos visibles | 0,3–0,6 M, más 0,2–0,4 M en el reflejo | Igual | Igual (tubos de 6–8 lados) |
| Draw calls | ≤ 75 | ≤ 75 | ≤ 60 |
| Memoria de GPU | ≈ 280 MB a 1440p (≈ 180 MB a 1080p) | ≈ 130 MB | ≈ 55 MB |

- Reparto de la memoria a 1440p: ≈ 230 MB de objetivos de render (el MSAA en coma flotante es lo que más ocupa), 22 MB de geometría y 30 MB de texturas.
- Reparto estimado de la GPU en el PC a 1440p:
  - pase principal, 1,5 ms;
  - reflejo, 0,7 ms;
  - resolver el MSAA, 0,2 ms;
  - halo, 0,4 ms;
  - composición, 0,3 ms.

**Descarga**

| | v1 | v2 | v3 |
|---|---|---|---|
| Primera vista (ordenador) | 0,11 MB (y ~1 MB en el primer segundo) | 0,64 MB | ≈ 2,2 MB |
| Recorrido entero | 14 MB | 15,3 MB | ≈ 2,2 MB, sin nada más que bajar |
| Móvil | — | 0,33 MB / 5,0 MB | ≈ 1,6 MB |

Reparto de la v3:

| Pieza | Tamaño |
|---|---|
| JavaScript (three.js y motor) | 0,19 MB |
| Raíces | 0,7 MB |
| Símbolo | 0,35 MB |
| Mapa de luz | ≤ 0,4 MB |
| Sondas | ≤ 0,4 MB |
| Texturas pequeñas | 0,1 MB |

- Las imágenes de respaldo (9 × ~150 KB) solo se bajan si hacen falta.
- La caché es de un año, en `public/journey/v3`.
- Con 20 Mbps o más se descarga en menos de 1 s, y la pantalla de carga dura prácticamente lo mismo que ahora (mínimo 1,5 s y máximo 8 s). Si a los 8 s no está, abre con las imágenes y el 3D entra con un fundido en cuanto está listo.

**Horneado en la 3060**

Son estimaciones; el informe del script da los tiempos reales.

| Paso | Tiempo |
|---|---|
| Primera vez: Blender oficial en `.render/` (se reutiliza el de la v2) y núcleos de OptiX | +3–5 min |
| Construir la escena y las mallas | ~1 min |
| Irradiancia por vértice (~0,5 M de puntos, 2048 muestras) | 3–6 min |
| Mapa de luz del suelo (2048 muestras + OIDN) | 2–3 min |
| Sondas (1024 muestras + OIDN) | 1–2 min |
| Referencias de la fase a (3 a 1920 × 1080) | 1–2 min |
| Exportar y comprimir | ~1 min |
| **Total `proto` (fase a)** | **≈ 10–15 min** |
| **Total `full` (fase b)** | **≈ 15–25 min** |
| `stills` (fase c: 9 en apaisado y 9 en vertical) | +10–15 min |

Sube unos 2–3 MB por horneado. Los EXR intermedios se quedan en el PC.

Referencia de la v2 en la misma tarjeta: 228 s de media por fotograma a 4032 × 2268 con ~6,4 capas, hasta 1024 muestras y 1.236 MB de pico.

## 3. Archivos

**El horneado** (`scripts/journey/`)

| Archivo | Qué es |
|---|---|
| `scene.py` | Se trae de la v2 tal cual (geometría idéntica, grupos por arco), más una opción para que `bake.py` siga después de construir |
| `bake.py` (nuevo, Blender) | Construye la escena, exporta raíces, símbolo y peana, hornea (vértices, suelo, sondas), renderiza las imágenes de Cycles, escribe `public/journey/v3/` y deja un informe con tiempos, pesos y errores |
| `bake-gpu.sh` (nuevo) | Basado en `render-gpu.sh`. Modos: `proto`, `full`, `stills` y `export`. Hace git pull, comprueba OptiX, se puede reanudar y sube solo lo final |
| `requirements.txt` | Del venv: numpy y pillow con AVIF. El meshopt se hace con `npx gltfpack` |
| `verify-assets.mjs` (nuevo) | Valida el formato, los conteos y los pesos. Corre en la nube y en el PC |

**La web** (`src/lib/journey/`)

| Archivo | Qué es |
|---|---|
| `config.ts` | Se conservan `TIMING` y los tiempos de carga. Se añaden las rutas de la v3, los niveles y los números del aspecto |
| `camera.ts` | El `camera_at()` de `scene.py` portado tal cual (los tiempos de los textos no cambian), más el campo de visión por proporción y el paralaje |
| `engine/` (trozo aparte, con three.js) | `world.ts`, `strands.ts`, `materials.ts`, `reflection.ts`, `post.ts`, `tiers.ts` y `debug.ts` |
| `fallback.ts` | Las imágenes con fundido y el vidrio en 2D (de `glass.ts`) |
| `burnRenderer.ts` y `motion.ts` | Se quedan como están |

**El resto**

- `src/components/Journey.tsx`: en la fase c cambia el renderer, pero la estructura se conserva. El motor es único por página y sobrevive al cambio de idioma.
- `src/app/(es)/lab/recorrido/page.tsx`: página de pruebas de las fases a y b, con `noindex`. Se quita en la c.
- `package.json`: se añade `three`. En `public/.htaccess`, la caché de la v3. En `.gitignore`, `.render/`.

## 4. Fases

Cada fase va en una sesión que termina actualizando este documento. Los comandos de b, c y d son los de la a cambiando el modo del horneado; cada sesión los deja aquí exactos, también los del móvil (la misma dirección «Network» de `serve`, con el móvil en la misma wifi).

### Fase a: prototipo de un tramo

**Alcance**

- Un tramo: de la boca al segundo arco (progreso 0–0,45). Se ve el resto al fondo; el símbolo aún es provisional.
- Geometría exportada y luz horneada.
- Pulsos, vaivén y motas.
- Reflejo, niebla, halo, AgX, grano y MSAA con cintas.
- Paralaje.
- `?debug` con banco de pruebas.
- A/B con 3 imágenes de Cycles.

**Comandos** (en el PC):

```bash
cd ~/Escritorio/AternaStudio
git fetch origin && git switch claude/recorrido-3d-tiempo-real-m7dqxy && git pull
scripts/journey/bake-gpu.sh proto
npm ci && npm run build && npx serve out -l 3000
```

**Dónde mirar**

- PC: `http://localhost:3000/lab/recorrido?debug` en Chrome y en Firefox.
- Portátil: la dirección «Network» que imprime `serve`, con `/lab/recorrido?debug`.
- Banco de pruebas: `?debug&bench`. Al terminar, se pulsa «Copiar informe» y se pega en la sesión siguiente (uno por navegador y equipo).

**Qué mirar**

1. **Fluidez**: 60 fps o la frecuencia de la pantalla; el percentil 95 por debajo de 16,7 ms; ningún fotograma largo en un scroll lento.
2. **Calidad en movimiento**: las fibras no parpadean ni se rompen, y no aparece ninguna «versión ligera» al moverse.
3. **Paralaje**: con el ratón en las esquinas, lo cercano se mueve más que lo lejano y nada se dobla.
4. **Vida**: con la escena quieta, que haya pulsos, vaivén, motas y destellos.
5. **Aspecto frente a Cycles**: tecla C en las 3 posiciones marcadas.
6. **Gráfica real**: que la capa diga el nombre de la gráfica y no SwiftShader ni llvmpipe. Si sale eso, comprobar `chrome://gpu` o `about:support`.

**Paso a la fase b**: solo si a José le convencen la calidad y la fluidez. Si no, se hace una sesión corta de ajustes.

### Fase b: el recorrido entero

**Alcance**

- Todos los arcos y los arcos del fondo, con el recorrido completo (progreso 0–1).
- El símbolo con su material físico: metal anodizado con el degradado, incrustación esmaltada, filamentos con la luz que los recorre, aura y sonda de Cycles.
- La peana: su reflejo, los anillos y los pulsos que llegan a ella.
- Pruebas de la profundidad de campo.
- 9 referencias A/B a lo largo del recorrido.

**Comando del horneado**: `scripts/journey/bake-gpu.sh full`.

**Qué mirar**: lo mismo que en la a, y además el símbolo frente a Cycles y la fluidez en el final, que es la vista con más carga.

### Fase c: integración

- **`Journey.tsx` con el motor**:
  - la pantalla de carga espera a la escena (descarga, subida, shaders y calibración) y a las fuentes, con el mismo fundido;
  - los textos y `TIMING`, iguales;
  - el vidrio y el velo, pintados en el shader;
  - la cabecera y el cursor, iguales;
  - los cuatro idiomas, con el motor sobreviviendo al cambio.
- Accesibilidad (`aria-label` y estado de carga), movimiento reducido, versión sin JavaScript (póster y titular), respaldo sin WebGL (`fallback.ts`) y pérdida de contexto.
- Móvil: nivel ligero y encuadre vertical.
- `bake-gpu.sh stills` para los pósteres y el respaldo.
- Se quita la página de pruebas y se actualizan `docs/DESARROLLO.md` y `.htaccess`.

**Qué mirar**: la portada completa en el PC, en el portátil y en el móvil (por la red local), en los cuatro idiomas, con movimiento reducido, y sin JavaScript (desactivado en el navegador).

### Fase d: ajuste fino de rendimiento

- Con los informes de `?debug&bench`: los umbrales de los niveles, el coste de cada shader, la memoria y lo particular de Firefox.
- Los números finales quedan documentados.
- José decide si pasa a `main`.

## 5. Verificación

- **En la nube** (rápido, sin bucles):
  - `npm run typecheck` y `npm run build`;
  - `verify-assets.mjs`;
  - un horneado de humo en CPU con muestras mínimas (bpy de pip, unos minutos, sin subir nada);
  - un arranque de la página en Chromium por software, solo para ver que no hay errores en la consola.

  Allí no se mide rendimiento ni calidad.
- **La capa `?debug`**:
  - fps y ms por fotograma (media, percentil 95 y máximo en 2 s);
  - ms de JavaScript, y ms de GPU si el navegador da `EXT_disjoint_timer_query_webgl2` (Firefox no suele darlo);
  - fotogramas largos;
  - nivel, resolución interna y MSAA;
  - triángulos y draw calls (principal y reflejo);
  - memoria de GPU estimada;
  - nombre de la gráfica, navegador y frecuencia de la pantalla.
- **Teclas de la capa**:
  - C: A/B con Cycles;
  - P: pausa el tiempo;
  - R: reflejo;
  - B: halo;
  - G: grano;
  - 1 a 4: fuerzan el nivel.
- **`?debug&bench`**: recorre el tramo a velocidad fija, ida y vuelta, y saca un informe para copiar (JSON, también en la consola).

## 6. Riesgos y cómo se cubren

| Riesgo | Cómo se cubre |
|---|---|
| El paso del horneado a la web (armónico por anillo) | Error de reconstrucción en el informe, A/B con Cycles y horneado de humo en la nube |
| La gráfica del portátil (por ahora desconocida) | Niveles y calibración. En el peor caso, nivel medio, pero nunca a tirones |
| El símbolo frente a Cycles (fase b) | Material físico con la sonda de Cycles y A/B. Si hace falta, también se hornea su oclusión |
| Firefox | El diseño evita el fallo de la v2, y se prueba en Firefox desde la fase a |
| Tirones al compilar (en Windows, ANGLE) | Todo se compila en la pantalla de carga |
| El peso de three.js | Va en un trozo aparte que se baja durante la carga |

## 7. Lo que decide José

1. Dar el visto bueno en cada fase, en sus pantallas, con Chrome y Firefox.
2. Al pasar a `main`: si se borra `public/journey/v1` (14 MB) y qué se hace con la rama de la v2.
3. Si libera espacio en el PC: los EXR de la v2 en `.render/exr*` (decenas de GB) no se usan en la v3. El Blender de `.render/` sí se reutiliza.
4. Cuestiones de gusto que se proponen con valores y se juzgan en la fase a: la amplitud del paralaje, la densidad y velocidad de los pulsos, y la cantidad de grano.

---

# Notas técnicas para implementar

Lo que ya se averiguó al preparar el plan, para no volver a buscarlo.

## De dónde sale cada cosa

### El aspecto de la v1 (en `main`)

Está en `scripts/journey/post.py`:

| Pieza | Valores |
|---|---|
| `agx()` | Matrices de Blender, rango −12,47 a 4,03 EV, polinomio de 6.º grado, saturación 1,12 y contraste (potencia) 1,12 |
| `bloom()` | Umbral 0,8 en lineal; 5 niveles de `pyrDown` con σ 1,6 y pesos 0,32 / 0,26 / 0,20 / 0,14 / 0,08. Intensidad 0,6 en la v1 y 0,45 en la v2; se pensó a 1600 px de ancho |
| Niebla | `f = clamp(1 − exp(−max(z − 6, 0) · 0,024), 0, 0,94)`, mezclada en sRGB después de AgX, hacia `NIGHT` (#13163b) → `HAZE` (#22265c) con una franja en la fila 0,55 (`1 − |y − 0,55| · 2,2`) |
| Viñeta | `1 − 0,22 · clamp(0,6x² + y² − 0,25, 0, 1)` en sRGB |

### `scene.py` de la v2

Está en la rama `claude/hopeful-babbage-yt1ln3`, sin cambios de geometría respecto a la v1: comprobado spline a spline, con el mismo orden de números aleatorios. Tiene un grupo por arco (`a0`…`a6`, `back`, `mark`, `base`).

Para traerlo sin bajar los 282 MB de fotogramas, con un clon parcial en el directorio temporal:

```bash
git clone --filter=blob:none --no-checkout --single-branch --branch claude/hopeful-babbage-yt1ln3 https://github.com/josemarrero3012/AternaStudio hb
cd hb && git show HEAD:scripts/journey/scene.py > /ruta/scene.py
```

`git show` baja solo ese archivo. No hay que usar `git diff` con detección de renombrados: pide todos los blobs.

Del mismo sitio salen `render-gpu.sh` (la base de `bake-gpu.sh`: git pull con relanzado si cambia el script, Blender oficial con su suma SHA-256, venv, OptiX con `--list-devices`, reintentos y subida con reintentos) y `requirements.txt`.

### Lo retirado

- three.js anterior: commit `1c89a9f`, `src/world/`.
- La detección de render por software de `src/lib/world.ts` (commit `4b28465`) sirve tal cual: `/swiftshader|llvmpipe|softpipe|software|basic render/i`, con `WEBGL_debug_renderer_info` en Chrome.

## La escena (`scene.py`)

**Dimensiones**

- Semilla 3012, `FRAMES` 120.
- El símbolo: `Y_MARK` 58, `R_MARK` 2,2 y centro en z = 2,75.
- Los arcos: `a0` (el portal) en y = 4 con 46 hebras; `a1`…`a6` en y ≈ 10, 15,6, 21,3, 26,9, 32,4 y 37,8; los dos arcos de `back` en y = 64,5 y 72.

**Cámara**

- `camera_at(t)` con t = progreso del scroll (0–1).
- Focal 32 mm y sensor de 36 mm horizontal: 58,7° de campo horizontal y 35,1° de vertical en 16:9.
- Regla de «cover» de la v1: si la proporción es 16/9 o más estrecha, el campo vertical se fija en 35,1°; si es más ancha, el horizontal en 58,7°.
- El CSS de las tarjetas cuenta con que el símbolo mida ~0,33 del ancho del fotograma 16:9: en ordenador hay que conservar esa regla.

| Progreso | y de la cámara | Qué pasa |
|---|---|---|
| 0 | −6 | Inicio |
| 0,2 | ≈ 0,5 | |
| ≈ 0,27 | 4 | Cruza el portal (`a0`) |
| ≈ 0,36 | ≈ 10 | Cruza `a1` |
| ≈ 0,45 | ≈ 15,6 | Cruza `a2` |
| 0,5 | ≈ 19,5 | |
| 1 | 45 | El final, ante el símbolo |

**Tramos encendidos**

- Cada spline de `glow_splines` es un trozo exacto de su raíz (`pts[a:a+L]`) o la punta de un zarcillo (`P[-7:]`): se emparejan por coordenadas para hacer las máscaras.
- Radio respecto a la raíz:
  - ×1,18 en las raíces;
  - ×1,6 en las fibras;
  - ×1,8 en los hilos;
  - en las puntas, ×2,2 + 4 mm.

**Materiales** (en `scene.py`)

| Material | Valores |
|---|---|
| `root`, `root-deep` y `fiber` | Principled oscuro con emisión de canto: facing^2,2 con un blend de 0,35, por la rampa 0,35→0,7 de un ruido de escala 0,55 y detalle 3 en coordenadas de objeto |
| Brillos de los tramos | Lavanda #98a2ff ×4,5, violeta #9a5cf0 ×6, orquídea #d77cf5 ×5,5, rosa #ff4d8f ×5 e índigo #5d68f0 ×5 |
| Motas | #c9ceff y #ee9cff ×9 |
| Suelo | #090b20, rugosidad 0,14–0,5 por ruido de escala 0,35, relieve de escala 6 y fuerza 0,12 |
| Peana | #07081a, rugosidad 0,06, capa 1,0 con rugosidad 0,02 |
| Anillos | #b07cff, #7f88ff y #e08cff ×2,4 |
| Aura | Degradado esférico #140f45→#6a46c0 ×0,5 |

**Luces**

- Del símbolo: `key` 1100 W, `fill` 380 W, `rim` 1400 W y `under` 220 W.
- Del túnel: 7 discos de 1,2 m a 4,8 m de altura, de 40 W + 8 W por arco.
- Mundo: #06071a ×0,25.
- `emission_sampling` en NONE en las raíces, fibras, motas y aura: se mantiene al hornear.
- Las luces de área tienen `visible_camera = False`, pero se ven en los reflejos. En tiempo real se pintan como formas emisivas solo en el pase del reflejo. Son las que hacen la estela del suelo en los fotogramas de Cycles.

**Recuento**

Se midió ejecutando `scene.py` con `bpy` simulado (unittest.mock) y grabando lo que llega a `add_curves` y `motes`. No gasta números aleatorios.

## Formato de las raíces (propuesta para la fase a)

Por hebra:

- **Cabecera**: clase (tubo de 12 lados, tubo de 8 o cinta), grupo, paleta, tipo de vaivén, sentido de los pulsos y número de anillos.

Por anillo:

| Dato | Formato |
|---|---|
| Posición | u16 × 3 cuantizada a la caja del grupo, con deltas a lo largo de la hebra |
| Radio | u16 |
| Normal del marco | Octaédrica, 2 × i8 |
| Irradiancia | SH L1 en 12 bytes (tubos) o media en 3 bytes (cintas) |
| Ruido | u8 |
| Máscara de brillo | u8 |

- La longitud de arco se calcula al cargar.
- El archivo va comprimido con gzip. En el navegador se usa `DecompressionStream('gzip')`, mirando antes los bytes mágicos `1f 8b`: si el servidor ya lo descomprimió (Content-Encoding), se usa tal cual.

## HDR en 8 bits

- `log2` por canal en un rango fijo que elige el horneado (por ejemplo 2^−14…2^4), en RGB sin alfa.
- Al cargar: `createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" })` y `UNPACK_COLORSPACE_CONVERSION_WEBGL = NONE`.
- Se decodifica en el shader.
- Si en las sondas no basta la precisión, se usa EXR en half float (EXRLoader).

## Render

- **Objetivos de render**:
  - el principal, RGBA16F con MSAA (`WebGLRenderTarget` con `samples`), limitado por `MAX_SAMPLES`;
  - el reflejo, a ½ o ¼ sin MSAA, con su cadena de desenfoque.
- **Niebla en cada material**, con un color de niebla igual a la inversa de AgX aplicada a #13163b: así el fondo sale exactamente en `--night-0` y el halo de lo lejano se apaga con la niebla.
- **Cintas**: se expanden en el vertex shader con un ancho de al menos 1 px y una opacidad que compensa el ancho. Las motas igual (al menos 1,5 px).
- **Orden de la composición**: AgX, velo, vidrio, viñeta y, por último, grano y tramado.

## Integración (fase c)

**Vidrio**

- Los rectángulos de las tarjetas se cachean al medir el layout, y cada fotograma se les suma la y y la opacidad que ya calcula `applyBlocks`.
- Esquinas de 20u en el SDF.
- El borde, el tinte (`::after`), los textos y la sombra siguen en el DOM.
- `.journey__shade` en CSS solo queda para el respaldo sin WebGL.

**Motor**

- Es único por página: `pages.tsx` monta `<Journey key={locale} />` y el cambio de idioma no debe recrear el contexto.
- Al salir de la portada se liberan los objetos de render (lo grande) y se conservan la geometría y las texturas.

**Scroll**

- Lenis tiene su propio rAF. El bucle del recorrido se registra antes, así que lee el scroll del paso anterior de Lenis: un fotograma de retraso constante, sin saltos.
- Se mantiene el suavizado de la v1, o un muelle críticamente amortiguado si se nota mejor.

**Pantalla de carga**

- Está lista cuando están las fuentes y la escena: descargada, subida, compilada, calibrada y con un primer fotograma pintado.
- Mínimo 1,5 s y máximo 8 s; si pasa de 8 s, se abre con las imágenes y el 3D entra con un fundido.

## Firefox y GPU reales

- **Causa del fallo de la v2**: subir con `texSubImage2D` imágenes de otro tamaño a una textura ya creada, más la pérdida del contexto.
- **Cómo se evita en la v3**:
  - texturas inmutables subidas una vez;
  - sin `preserveDrawingBuffer`;
  - sin `drawImage` del lienzo WebGL a un canvas 2D;
  - `compileAsync`;
  - con `KHR_parallel_shader_compile` si está;
  - la pérdida de contexto pasa al respaldo.
- **Comprobar al arrancar**: `MAX_SAMPLES`, `EXT_color_buffer_float` y `devicePixelContentBoxSize` (Firefox 93 y posteriores).

---

## Fuentes

- [Awwwards 2024: Site of the Year](https://www.awwwards.com/annual-awards-2024/site-of-the-year)
- [Awwwards 2024: Developer Site of the Year](https://awwwards.com/annual-awards-2024/developer-site-of-the-year)
- [Caso de estudio de Igloo Inc](https://awwwards.com/igloo-inc-case-study.html)
- [Awwwards 2023: Site of the Year (Lusion v3)](https://awwwards.com/annual-awards-2023/site-of-the-year)
- [Perfil de Lusion en Awwwards (Oryzo)](https://www.awwwards.com/lusion/)
- [Firefox 147 y WebGPU](https://www.webpronews.com/firefox-147-released-webgpu-support-enhanced-security-and-more)
- [Firefox 147 en OMG! Ubuntu](https://www.omgubuntu.co.uk/2026/01/firefox-147-released/amp)
