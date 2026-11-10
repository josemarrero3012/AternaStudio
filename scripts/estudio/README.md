# Iconos de Estudio · v1

Generados con **Blender 5.2.3 LTS**, **Cycles CPU**, 96 muestras por píxel;
codificados con **FFmpeg 9.0.2**. Solo requieren Blender, FFmpeg/ffprobe y Python 3.
El script `render.py` genera y renderiza las tres escenas, sin recursos externos.

```sh
blender -b -t 8 --python scripts/estudio/render.py -- --frames-dir /tmp/aterna-estudio
python3 scripts/estudio/encode.py --frames-dir /tmp/aterna-estudio
```

Salida: `public/estudio/v1/pillar-{1,2,3}.{webm,mp4,webp}`. Los PNG intermedios
quedan en `/tmp/aterna-estudio`. `--pillar 1 --frame 74` permite renderizar una
prueba. `--save-blend-dir /tmp/aterna-blends` guarda también una escena editable
por icono en su pose de póster; el movimiento lo genera `update()` en Python.

## Imagen y movimiento

- 960 × 400, 30 fps; 114 / 114 / 126 fotogramas: 3,8 / 3,8 / 4,2 segundos.
- Cámara compartida de perspectiva, 50 mm; filamento de radio 0,018 y nodo de
  radio 0,17. Curvas con sección circular, profundidad leve y anillo inclinado 24°.
- Mundo negro, RGB opaco, sin suelo ni iluminación ambiental. Emisión con las
  cuatro tintas de marca; núcleos casi blancos, envoltura transparente y reflejo
  pequeño para los nodos. Bloom `Fog Glow` del compositor.
- Transformación de color Standard, exposición 0, gamma 1. Sin denoising,
  desenfoque de movimiento ni dithering; semilla fija para evitar parpadeo.
  Al codificar, se fija el punto negro en 2/255 para eliminar la cola imperceptible
  del bloom, conservar los blancos y dejar márgenes RGB (0, 0, 0).
- Geometría y fases de `PILLAR_GLYPHS` y `Trace.ring/beatAt` en el commit base
  `58ff0685c23668700b1a3ee096988392873afe0b`. Pulsos a velocidad constante sobre
  longitud de arco; anillo desde la izquierda, en sentido horario.
- La fase es `frame / N` módulo 1. Se exportan 0…N−1, sin duplicar el primer
  fotograma al final. Las envolventes entran y salen suavemente; fase 1 = fase 0.
- Pósteres: fotogramas 74, 52 y 105, con el nodo encendido. WebP lossless,
  fondo negro y sin transparencia, para conservar el halo.

## Codificación

`encode.py` contiene e imprime los comandos exactos utilizados. Para cada vídeo:

```sh
# N=114 para 1 y 2; N=126 para 3. I es el número del icono.
ffmpeg -y -framerate 30 -start_number 0 -i /tmp/aterna-estudio/pillar-$I/%04d.png \
  -map 0:v:0 -frames:v "$N" -an -map_metadata -1 \
  -vf 'colorlevels=rimin=0.0078431373:gimin=0.0078431373:bimin=0.0078431373,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p' \
  -r 30 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libvpx-vp9 -b:v 0 -crf 18 -qmin 18 -qmax 18 -deadline good -cpu-used 2 -row-mt 1 -threads 8 -g "$N" \
  -force_key_frames "expr:eq(n,$((N-1)))" \
  public/estudio/v1/pillar-$I.webm

ffmpeg -y -framerate 30 -start_number 0 -i /tmp/aterna-estudio/pillar-$I/%04d.png \
  -map 0:v:0 -frames:v "$N" -an -map_metadata -1 \
  -vf 'colorlevels=rimin=0.0078431373:gimin=0.0078431373:bimin=0.0078431373,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p' \
  -r 30 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -preset slow -qp 16 -pix_fmt yuv420p -threads 8 -g "$N" -movflags +faststart \
  -force_key_frames "expr:eq(n,$((N-1)))" \
  public/estudio/v1/pillar-$I.mp4
```

La codificación comprueba códec, duración, dimensiones, 30 fps, número de
fotogramas, ausencia de audio/alfa y `moov` antes de `mdat` en MP4. El límite es
**400.000 bytes por archivo**; si una variación de escena lo supera, sube el
cuantizador de forma acotada y falla si no logra cumplirlo. La cuantización fija y
el fotograma clave final evitan variaciones de compresión en el empalme del bucle.
Para registrar las comprobaciones,
añade `--report /tmp/aterna-estudio/verification.json` al comando de codificación.

Los vídeos están preparados para `mix-blend-mode: screen` a 480 × 200.
Este paquete solo incluye recursos y fuentes; la integración la realiza la web.
