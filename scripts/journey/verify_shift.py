# Rigidez de las capas del recorrido v2, con las capturas de verify-web.mjs.
#
#   python scripts/journey/verify_shift.py CARPETA [MANIFIESTO]
#
# Para cada capa sola con el puntero en un extremo: la captura debe ser la del
# centro trasladada exactamente lo que dice el manifiesto (d = puntero · K ·
# ganancia · (1/Z − 1/Z_ref)). Se mide la PSNR dentro de la capa: alta (≥ 40
# dB) = la capa se ha movido entera, sin deformarse. Como comparación, la
# misma medida con la técnica de la v1 (cada píxel según su profundidad) sobre
# el fotograma 119 de public/journey/v1: cuánto se deformaba el símbolo.

import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

out = sys.argv[1]
manifest_path = sys.argv[2] if len(sys.argv) > 2 else "public/journey/v2/journey.json"
rep = json.load(open(os.path.join(out, "verify.json")))
m = json.load(open(manifest_path))
K = m["k"]


def load(name):
    return np.asarray(Image.open(os.path.join(out, name)).convert("RGB")).astype(np.float32)


def psnr(a, b, mask):
    mse = float(((a - b) ** 2)[mask].mean()) if mask.any() else 0.0
    return 99.0 if mse < 1e-6 else 10 * np.log10(255**2 / mse)


def best_shift(a, b, content, rx=16, ry=8):
    """El desplazamiento entero que mejor lleva a sobre b (mínimo error en la capa), afinado con una parábola."""
    err = np.full((2 * ry + 1, 2 * rx + 1), np.inf)
    for j, dy in enumerate(range(-ry, ry + 1)):
        for i, dx in enumerate(range(-rx, rx + 1)):
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            sa = cv2.warpAffine(a, M, (a.shape[1], a.shape[0]))
            mk = cv2.warpAffine(content.astype(np.uint8), M, (a.shape[1], a.shape[0]), flags=cv2.INTER_NEAREST) > 0
            if mk.any():
                err[j, i] = float(((sa - b) ** 2)[mk].mean())
    j, i = np.unravel_index(np.argmin(err), err.shape)

    def refine(e0, e1, e2):
        den = e0 - 2 * e1 + e2
        return 0.0 if not np.isfinite(den) or den <= 0 else 0.5 * (e0 - e2) / den

    fx = refine(err[j, i - 1], err[j, i], err[j, i + 1]) if 0 < i < 2 * rx else 0.0
    fy = refine(err[j - 1, i], err[j, i], err[j + 1, i]) if 0 < j < 2 * ry else 0.0
    return i - rx + fx, j - ry + fy


lines = [
    "# Rigidez de las capas (v2)",
    "",
    "Desplazamiento medido (el que mejor explica la captura, con ajuste subpíxel) frente al que dice el manifiesto, y PSNR (con un",
    "suavizado de 1 px en las dos imágenes, para no medir el remuestreo subpíxel) tras trasladar la",
    "captura del centro esa cantidad y sin trasladarla.",
    "",
    "| fotograma | capa | puntero | esperado (px) | medido (px) | PSNR trasladada | PSNR sin trasladar |",
    "|---|---|---|---|---|---|---|",
]
worst = 99.0
worst_err = 0.0
for test in rep["rigid"]:
    f, layer = test["frame"], test["layer"]
    W, H = test["viewport"]
    fr = m["f"][f]
    L = next(x for x in fr["l"] if x["g"] == layer)
    view = W / H
    aspect = m["visible"][0] / m["visible"][1]
    cover = (1.0, aspect / view) if view > aspect else (view / aspect, 1.0)
    dz = L["z"][2] - fr["zr"]
    center = cv2.GaussianBlur(load(test["shots"][0]["file"]), (0, 0), 1.0)
    content = cv2.erode((center.max(-1) > 6).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    for shot in test["shots"][1:]:
        px, py = shot["pointer"]
        du = -px * K[0] * L["gain"] * dz
        dv = py * K[1] * L["gain"] * dz
        dx, dy = du / cover[0] * W, dv / cover[1] * H
        moved = cv2.GaussianBlur(load(shot["file"]), (0, 0), 1.0)
        mx_, my_ = best_shift(center, moved, content)
        M = np.float32([[1, 0, dx], [0, 1, dy]])
        shifted = cv2.warpAffine(center, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        mask = cv2.warpAffine(content.astype(np.uint8), M, (W, H), flags=cv2.INTER_NEAREST) > 0
        mask[:8], mask[-8:], mask[:, :8], mask[:, -8:] = False, False, False, False
        p_shift = psnr(shifted, moved, mask)
        p_raw = psnr(center, moved, mask)
        worst = min(worst, p_shift)
        worst_err = max(worst_err, abs(mx_ - dx), abs(my_ - dy))
        lines.append(f"| {f} | {layer} | {shot['name']} | {dx:+.2f}, {dy:+.2f} | {mx_:+.2f}, {my_:+.2f} | {p_shift:.1f} dB | {p_raw:.1f} dB |")

lines += [
    "",
    f"Peor PSNR trasladada: **{worst:.1f} dB** (≥ 40 dB: la capa se mueve entera, sin deformarse). "
    f"Mayor diferencia entre el desplazamiento medido y el esperado: **{worst_err:.2f} px**.",
]

# La v1, como comparación: desplazamiento de cada píxel según su mapa de profundidad.
v1 = "public/journey/v1/depth-119.webp"
if os.path.exists(v1):
    d = np.asarray(Image.open(v1).convert("L")).astype(np.float32) / 255
    h, w = d.shape
    box = d[int(0.16 * h) : int(0.74 * h), int(0.34 * w) : int(0.66 * w)]  # donde está el símbolo
    disp = 0.0144 * (box - 0.5) * 2 * 1600  # px a 1600 de ancho con el puntero en el extremo
    lo, hi = np.percentile(disp, 2), np.percentile(disp, 98)
    lines += [
        "",
        "## La v1, con la misma medida",
        "",
        f"Con el puntero en un extremo, dentro de la caja del símbolo cada píxel se desplazaba entre {lo:+.1f} y {hi:+.1f} px "
        f"(a 1600 de ancho) según su profundidad: **{hi - lo:.1f} px de deformación** entre el símbolo y lo que se ve por sus huecos.",
    ]

text = "\n".join(lines) + "\n"
open(os.path.join(out, "rigidez.md"), "w").write(text)
print(text)
