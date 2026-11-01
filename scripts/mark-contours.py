# Vectoriza el símbolo de Aterna (canal alfa de public/brand/aterna-mark.png)
# en contornos para el Sello 3D: escribe src/world/mark-data.ts.
#
#   python3 -m venv /tmp/venv && /tmp/venv/bin/pip install opencv-python-headless numpy
#   /tmp/venv/bin/python scripts/mark-contours.py
#
# Solo hace falta volver a lanzarlo si cambia el símbolo. Coordenadas en
# milésimas del radio del símbolo, con el centro en (0, 0) y la y hacia arriba.

import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "brand", "aterna-mark.png")
OUT = os.path.join(ROOT, "src", "world", "mark-data.ts")

SCALE = 3  # se traza a 3× para que las curvas salgan suaves
EPS = 0.9  # tolerancia de simplificación, en píxeles del PNG original

alpha = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)[:, :, 3].astype(np.float32)
alpha = cv2.resize(alpha, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2 * SCALE)
mask = (alpha > 127).astype(np.uint8) * 255

ys, xs = np.nonzero(mask)
cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
radius = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2

contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
hierarchy = hierarchy[0]


def normalize(contour):
    pts = cv2.approxPolyDP(contour, EPS * SCALE, True).reshape(-1, 2).astype(np.float64)
    flat = []
    for x, y in pts:
        flat += [round((x - cx) / radius * 1000), round(-(y - cy) / radius * 1000)]
    return flat


shapes = []
for i, contour in enumerate(contours):
    if hierarchy[i][3] != -1:  # agujero: lo añade su contorno exterior
        continue
    if cv2.contourArea(contour) < (6 * SCALE) ** 2:
        continue
    shape = [normalize(contour)]
    child = hierarchy[i][2]
    while child != -1:
        if cv2.contourArea(contours[child]) > (3 * SCALE) ** 2:
            shape.append(normalize(contours[child]))
        child = hierarchy[child][0]
    shapes.append(shape)

with open(OUT, "w", encoding="utf-8") as f:
    f.write("// Generado por scripts/mark-contours.py a partir de public/brand/aterna-mark.png.\n")
    f.write("// No editar a mano. Cada forma: [contorno exterior, ...agujeros], en pares x, y\n")
    f.write("// (milésimas del radio del símbolo, centro en 0, y hacia arriba).\n\n")
    f.write("export const MARK: number[][][] = ")
    f.write(json.dumps(shapes, separators=(",", ":")))
    f.write(";\n")

print(f"{len(shapes)} formas, {sum(len(c) // 2 for s in shapes for c in s)} puntos → {os.path.relpath(OUT, ROOT)}")
