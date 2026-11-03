# Recorrido v2 · informe del render

- Generado: 2026-11-03 08:23 · Blender 5.2.3 LTS · NVIDIA GeForce RTX 3060
- Preajuste: final (1024 muestras máx.) · f/4.0 · render 4032×2268 (visible 3840×2160)
- Halo 0.45 (fuera del objeto ×0.6) · AVIF q80 velocidad 4
- Fotogramas revelados: **6 de 120** (faltan 114: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20…)

## Tiempos

- Render por fotograma: media **225 s**, mediana 225 s, máximo 292 s (fotograma 24)
- Estimado para los 120: **7.5 h**
- Memoria de render (pico informado): 1236 MB
- Revelado por fotograma: media 76 s

## Muestras medias por capa

| capa | muestras |
|---|---|
| a0 | 90 |
| a1 | 107 |
| a2 | 98 |
| a3 | 88 |
| a4 | 106 |
| a5 | 93 |
| a6 | 89 |
| back | 98 |
| base | 243 |
| mark | 101 |

## Pesos

| conjunto | total | por fotograma |
|---|---|---|
| fallback | 1.0 MB | 164 KB |
| flat/1280 | 0.6 MB | 102 KB |
| flat/1920 | 1.1 MB | 183 KB |
| flat/2560 | 1.5 MB | 258 KB |
| layers/1280 | 1.9 MB | 317 KB |
| layers/1920 | 3.1 MB | 524 KB |
| layers/2560 | 4.3 MB | 731 KB |
| layers/3840 | 7.1 MB | 1217 KB |
| portrait/720 | 0.3 MB | 55 KB |
| portrait/1440 | 0.8 MB | 142 KB |
| portrait/2160 | 1.5 MB | 261 KB |

Atlas más grande por resolución: 1280: 1348×1840, 1920: 2020×2752, 2560: 2692×3663, 3840: 6048×5487

## Capas

- Por fotograma: media 5.8, máximo 9 (incluida la base)
- Capas con tope suave de paralaje (muy cercanas): 2

## Continuidad

- No hay fotogramas consecutivos todavía
- Sin saltos

Hojas: `hoja.jpg` (todo el recorrido) y `capas-NNN.jpg` (capas despiezadas y el puntero en los extremos).
