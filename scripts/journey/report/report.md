# Recorrido v2 · informe del render

- Generado: 2026-11-03 17:19 · Blender 5.2.3 LTS · NVIDIA GeForce RTX 3060
- Preajuste: final (1024 muestras máx.) · f/4.0 · render 4032×2268 (visible 3840×2160)
- Halo 0.45 (fuera del objeto ×0.6) · AVIF HD q70 4:4:4, ligera q50 4:2:0, velocidad 4
- Fotogramas revelados: **120 de 120**

## Tiempos

- Render por fotograma: media **228 s**, mediana 260 s, máximo 302 s (fotograma 33)
- Estimado para los 120: **7.6 h**
- Memoria de render (pico informado): 1236 MB
- Revelado por fotograma: media 72 s

## Muestras medias por capa

| capa | muestras |
|---|---|
| a0 | 90 |
| a1 | 101 |
| a2 | 99 |
| a3 | 96 |
| a4 | 98 |
| a5 | 96 |
| a6 | 93 |
| back | 95 |
| base | 253 |
| mark | 95 |

## Pesos

| conjunto | total | por fotograma |
|---|---|---|
| fallback | 15.8 MB | 135 KB |
| flat/1280 | 4.7 MB | 41 KB |
| flat/1920 | 17.3 MB | 147 KB |
| flat/2560 | 24.2 MB | 207 KB |
| layers/1280 | 12.1 MB | 103 KB |
| layers/1920 | 34.5 MB | 295 KB |
| layers/2560 | 47.5 MB | 405 KB |
| layers/3840 | 80.0 MB | 682 KB |
| portrait/720 | 2.6 MB | 22 KB |
| portrait/1440 | 13.5 MB | 115 KB |
| portrait/2160 | 25.0 MB | 214 KB |

Atlas más grande por resolución: 1280: 1348×2255, 1920: 2020×3373, 2560: 2692×4490, 3840: 4036×6725

## Capas

- Por fotograma: media 6.4, máximo 9 (incluida la base)
- Capas con tope suave de paralaje (muy cercanas): 22

## Continuidad

- Diferencia media entre fotogramas consecutivos (0–255): mediana 10.17
- Sin saltos

Hojas: `hoja.jpg` (todo el recorrido) y `capas-NNN.jpg` (capas despiezadas y el puntero en los extremos).
