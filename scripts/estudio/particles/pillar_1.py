"""Tarjeta 1 · «Quien diseña, programa».

La composición es la que modeló Blender (scripts/estudio-v2/pillar-1/), aquí
redibujada con trazos para que las líneas salgan nítidas:

    A  dos caminos: arriba, el boceto de una web (ventana, imagen y texto);
       abajo, «</>» y unas líneas de código. Cada uno por su lado.
    B  se trenzan: dos hebras que cruzan la tarjeta y se cruzan entre sí
       hasta juntarse en un nodo a la derecha.
    C  una sola pieza: la web terminada, con el nodo de quien te atiende en
       la esquina.

    python3 scripts/estudio/particles/pillar_1.py   (desde la raíz del repo)
"""

import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from strokes import circle, curve, dust, line, node, out_dir, poly, rrect, sample, write  # noqa: E402

rng = np.random.default_rng(20261121)

# A ---------------------------------------------------------------------------
# Boceto (arriba): ventana, imagen con montañas y unas líneas de texto.
WIN_A = (-0.52, 0.06, 0.40, 0.34)
frame_a = [rrect(*WIN_A, 0.018), line((-0.52, 0.30), (0.40, 0.30))]
design_a = [
    rrect(-0.46, 0.10, -0.16, 0.26, 0.01),
    poly((-0.46, 0.12), (-0.37, 0.21), (-0.31, 0.16), (-0.25, 0.22), (-0.16, 0.12)),
    circle(-0.21, 0.225, 0.014),
    line((-0.10, 0.24), (0.30, 0.24)),
    line((-0.10, 0.20), (0.22, 0.20)),
    line((-0.10, 0.16), (0.26, 0.16)),
    rrect(-0.10, 0.095, 0.04, 0.125, 0.012),
]
# Código (abajo): «</>» y líneas sangradas.
code_a = [
    poly((-0.40, -0.12), (-0.48, -0.19), (-0.40, -0.26)),
    line((-0.31, -0.09), (-0.37, -0.29)),
    poly((-0.28, -0.12), (-0.20, -0.19), (-0.28, -0.26)),
]
for k, (ind, ln) in enumerate([(0, 0.34), (1, 0.26), (1, 0.30), (2, 0.18), (1, 0.22), (0, 0.12)]):
    y = -0.08 - k * 0.042
    code_a.append(line((-0.08 + ind * 0.05, y), (-0.08 + ind * 0.05 + ln, y)))
CURSOR_A = (0.10, -0.08 - 5 * 0.042)

# B ---------------------------------------------------------------------------
X0, X1, AMP = -0.80, 0.70, 0.17
K = 3.5 * math.pi / (X1 - X0)


def envelope(x):
    # Abiertas a la izquierda, se cierran al llegar al nodo de la derecha.
    t = min(1.0, max(0.0, (x - 0.35) / (X1 - 0.35)))
    return AMP * (1 - t * t * (3 - 2 * t))


strand_1 = [curve(lambda x: envelope(x) * math.cos(K * (x - X0)), X0, X1)]
strand_2 = [curve(lambda x: -envelope(x) * math.cos(K * (x - X0)), X0, X1)]
NODE_B = (X1 + 0.05, 0.0)

# C ---------------------------------------------------------------------------
WIN_C = (-0.62, -0.30, 0.62, 0.30)
frame_c = [
    rrect(*WIN_C, 0.022),
    line((-0.62, 0.235), (0.62, 0.235)),
    circle(-0.57, 0.268, 0.009),
    circle(-0.54, 0.268, 0.009),
    circle(-0.51, 0.268, 0.009),
]
design_c = [
    rrect(-0.54, -0.12, -0.06, 0.18, 0.012),
    poly((-0.54, -0.09), (-0.40, 0.06), (-0.30, -0.02), (-0.20, 0.08), (-0.06, -0.09)),
    circle(-0.14, 0.12, 0.022),
    rrect(-0.54, -0.25, -0.32, -0.18, 0.01),
    rrect(-0.28, -0.25, -0.06, -0.18, 0.01),
]
code_c = [
    line((0.02, 0.17), (0.46, 0.17)),
    line((0.02, 0.125), (0.34, 0.125)),
    line((0.02, 0.06), (0.52, 0.06)),
    line((0.02, 0.025), (0.48, 0.025)),
    line((0.02, -0.01), (0.50, -0.01)),
    line((0.02, -0.045), (0.36, -0.045)),
    rrect(0.02, -0.17, 0.22, -0.11, 0.03),
    line((0.02, -0.225), (0.30, -0.225)),
]
NODE_C = (0.62, 0.30)

groups = [
    {
        "name": "Diseño: boceto (A), primera hebra (B), imagen y bloques de la web (C).",
        "a": sample(design_a, 1500, rng),
        "b": sample(strand_1, 1500, rng),
        "c": sample(design_c, 1500, rng),
        "size": 70,
        "kind": 0,
        "glint": 1.0,
    },
    {
        "name": "Código: «</>» y líneas (A), segunda hebra (B), textos y botón de la web (C).",
        "a": sample(code_a, 2300, rng),
        "b": sample(strand_2, 2300, rng),
        "c": sample(code_c, 2300, rng),
        "size": 70,
        "kind": 0,
        "glint": 1.0,
    },
    {
        "name": "Ventana: marco del boceto (A), también la primera hebra (B), marco de la web (C).",
        "a": sample(frame_a, 900, rng),
        "b": sample(strand_1, 900, rng),
        "c": sample(frame_c, 900, rng),
        "size": 60,
        "kind": 0,
        "glint": 0.7,
    },
    {
        "name": "Nodo: cursor del código (A), donde se juntan las hebras (B), quien te atiende (C).",
        "a": node(*CURSOR_A, 160, rng, r=0.008, ring=0.016),
        "b": node(*NODE_B, 160, rng),
        "c": node(*NODE_C, 160, rng),
        "size": 230,
        "kind": 2,
        "tone": np.full(160, 255.0),
    },
    {
        "name": "Polvo: fijo en los tres estados.",
        "a": (d := dust(80, rng)),
        "b": d,
        "c": d,
        "size": 20,
        "kind": 1,
    },
]

write(out_dir(1), groups, "scripts/estudio/particles/pillar_1.py, semilla 20261121.")
