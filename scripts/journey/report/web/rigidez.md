# Rigidez de las capas (v2)

Desplazamiento medido (el que mejor explica la captura, con ajuste subpíxel) frente al que dice el manifiesto, y PSNR (con un
suavizado de 1 px en las dos imágenes, para no medir el remuestreo subpíxel) tras trasladar la
captura del centro esa cantidad y sin trasladarla.

| fotograma | capa | puntero | esperado (px) | medido (px) | PSNR trasladada | PSNR sin trasladar |
|---|---|---|---|---|---|---|
| 0 | mark | izquierda | -10.56, -0.00 | -10.57, +0.00 | 49.1 dB | 24.0 dB |
| 0 | mark | derecha | +10.54, -0.00 | +10.53, +0.00 | 49.5 dB | 23.9 dB |
| 0 | mark | arriba | -0.00, -4.45 | -0.00, -4.44 | 50.0 dB | 27.2 dB |
| 0 | mark | abajo | -0.00, +4.44 | +0.00, +4.44 | 49.9 dB | 26.9 dB |
| 0 | back | izquierda | -10.85, -0.00 | -10.80, +0.01 | 49.0 dB | 21.6 dB |
| 0 | back | derecha | +10.83, -0.00 | +10.84, -0.02 | 50.0 dB | 21.6 dB |
| 0 | back | arriba | -0.00, -4.58 | +0.02, -4.60 | 47.9 dB | 26.2 dB |
| 0 | back | abajo | -0.00, +4.56 | -0.03, +4.58 | 48.4 dB | 26.1 dB |
| 60 | mark | izquierda | -7.97, -0.00 | -7.97, +0.00 | 50.4 dB | 22.7 dB |
| 60 | mark | derecha | +7.95, -0.00 | +7.96, -0.00 | 50.5 dB | 22.7 dB |
| 60 | mark | arriba | -0.00, -3.36 | -0.00, -3.36 | 49.8 dB | 25.4 dB |
| 60 | mark | abajo | -0.00, +3.35 | +0.00, +3.33 | 48.8 dB | 25.4 dB |
| 60 | back | izquierda | -8.46, -0.00 | -8.48, -0.08 | 47.8 dB | 25.5 dB |
| 60 | back | derecha | +8.45, -0.00 | +8.44, -0.00 | 47.5 dB | 25.7 dB |
| 60 | back | arriba | -0.00, -3.57 | -0.02, -3.49 | 47.6 dB | 30.3 dB |
| 60 | back | abajo | -0.00, +3.56 | -0.01, +3.61 | 48.6 dB | 29.6 dB |
| 119 | mark | izquierda | +0.10, +0.00 | +0.10, +0.00 | 53.4 dB | 48.5 dB |
| 119 | mark | derecha | -0.10, +0.00 | -0.10, -0.00 | 61.4 dB | 48.8 dB |
| 119 | mark | arriba | +0.00, +0.04 | +0.00, +0.04 | 67.3 dB | 57.1 dB |
| 119 | mark | abajo | +0.00, -0.04 | -0.00, -0.04 | 61.6 dB | 57.1 dB |
| 119 | back | izquierda | -2.78, -0.00 | -2.78, +0.02 | 46.0 dB | 27.0 dB |
| 119 | back | derecha | +2.77, -0.00 | +2.78, -0.03 | 46.4 dB | 27.1 dB |
| 119 | back | arriba | -0.00, -1.17 | -0.01, -1.18 | 47.1 dB | 34.5 dB |
| 119 | back | abajo | -0.00, +1.17 | +0.01, +1.15 | 50.1 dB | 34.7 dB |

Peor PSNR trasladada: **46.0 dB** (≥ 40 dB: la capa se mueve entera, sin deformarse). Mayor diferencia entre el desplazamiento medido y el esperado: **0.08 px**.

## La v1, con la misma medida

Con el puntero en un extremo, dentro de la caja del símbolo cada píxel se desplazaba entre -23.0 y +15.5 px (a 1600 de ancho) según su profundidad: **38.5 px de deformación** entre el símbolo y lo que se ve por sus huecos.
