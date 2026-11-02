# Vectoriza el símbolo de Aterna (canal alfa de public/brand/aterna-mark.png)
# para el símbolo 3D del recorrido: contornos exteriores con sus agujeros (el
# cuerpo), los mismos erosionados un 40 % (la incrustación) y un 22 % (los
# filamentos de luz), en metros (radio R). Escribe mark.json.
#
#   python mark_contours.py ../../public/brand/aterna-mark.png mark.json
import json, sys
import cv2, numpy as np
SRC, OUT = sys.argv[1], sys.argv[2]
R = 2.2
img = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3].astype(np.float32)
SCALE = 4
a = cv2.resize(alpha, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
a = cv2.GaussianBlur(a, (0, 0), 1.0 * SCALE)
mask = (a > 127).astype(np.uint8) * 255
ys, xs = np.nonzero(mask)
cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
radius = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
def norm(c, eps):
    pts = cv2.approxPolyDP(c, eps, True).reshape(-1, 2).astype(np.float64)
    return [[round((x - cx) / radius * R, 5), round(-(y - cy) / radius * R, 5)] for x, y in pts]
def shapes_of(m, eps, min_area):
    cs, h = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    h = h[0]
    out = []
    for i, c in enumerate(cs):
        if h[i][3] != -1 or cv2.contourArea(c) < min_area:
            continue
        s = [norm(c, eps)]
        ch = h[i][2]
        while ch != -1:
            if cv2.contourArea(cs[ch]) > (3 * SCALE) ** 2:
                s.append(norm(cs[ch], eps))
            ch = h[ch][0]
        out.append(s)
    return out
shapes = shapes_of(mask, 0.35 * SCALE, (6 * SCALE) ** 2)
# Anchura de los trazos: distancia al borde.
dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
ridge = dist[dist > 0]
half = np.percentile(dist[(dist > 2) & (cv2.dilate(dist, np.ones((3, 3))) == dist)], 50)
def erode(frac):
    k = max(1, int(round(half * frac)))
    return cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1)))
# Incrustación: el símbolo erosionado ~40 % del medio ancho.
inlay = shapes_of(erode(0.40), 0.4 * SCALE, (4 * SCALE) ** 2)
# Filamentos: el contorno erosionado ~22 %, entre el canto y la incrustación.
cs, _ = cv2.findContours(erode(0.22), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
fil = [norm(c, 0.5 * SCALE) for c in cs if cv2.arcLength(c, True) > 30 * SCALE]
json.dump({"R": R, "half": float(half / radius * R), "shapes": shapes, "inlay": inlay, "filaments": fil}, open(OUT, "w"))
print(len(shapes), "formas", sum(len(c) for s in shapes for c in s), "puntos;", len(fil), "filamentos", sum(len(f) for f in fil), "puntos; medio ancho", half / radius * R, "m")
# Colores del degradado: abajo-izquierda y arriba-derecha.
rgb = img[:, :, :3][:, :, ::-1]
al = img[:, :, 3]
H, W = al.shape
for name, (x0, y0) in {"bl": (0.2, 0.8), "c": (0.5, 0.5), "tr": (0.8, 0.2), "tl": (0.2, 0.2), "br": (0.8, 0.8)}.items():
    win = (slice(int(y0 * H) - 60, int(y0 * H) + 60), slice(int(x0 * W) - 60, int(x0 * W) + 60))
    m = al[win] > 200
    print(name, rgb[win][m].mean(0).astype(int) if m.any() else None)
