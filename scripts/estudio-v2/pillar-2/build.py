"""Tarjeta 2 · «El código es tuyo».

    A  encerrado: unas líneas de código dentro de una caja, con un candado
       en el borde derecho. Todo apagado.
    B  se abre y se lee: la caja se vuelve un par de llaves { } alrededor del
       código, más grande y legible; el candado, un cursor al final de una
       línea; y debajo, tres puntos que anuncian lo que viene.
    C  la llave es tuya: la caja es el ojo de una llave, el candado sus
       dientes, el código su vástago y un camino que sigue a la derecha con
       tres nodos encendidos: otros pueden continuar desde ahí.

    python3 scripts/estudio-v2/pillar-2/build.py   (desde la raíz del repo)
"""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))
from strokes import arc, circle, cluster, dust, line, rrect, sample, write  # noqa: E402

rng = np.random.default_rng(20261109 + 2)

# Código: (sangría, longitud) por línea.
CODE = [(0, 0.40), (1, 0.30), (1, 0.36), (2, 0.20), (1, 0.26), (0, 0.14)]


def code_lines(x0, y0, dy, indent, scale):
    return [line((x0 + i * indent, y0 - k * dy), (x0 + i * indent + l * scale, y0 - k * dy)) for k, (i, l) in enumerate(CODE)]


def brace(x, y, h, w, left=True):
    """Llave { o } de trazo recto: brazos, columna y la punta en el centro."""
    s = -1 if left else 1
    corners = [(s * w, h), (0, h - w), (0, w * 0.9), (-s * w * 0.9, 0), (0, -w * 0.9), (0, -h + w), (s * w, -h)]
    return [np.array([x + dx, y + dy]) for dx, dy in corners]


# A ---------------------------------------------------------------------------
box_a = [rrect(-0.46, -0.27, 0.28, 0.27, 0.05)]
code_a = code_lines(-0.38, 0.18, 0.072, 0.05, 0.85)
lock_a = [arc(0.28, 0.045, 0.045, 0, 180, steps=40), rrect(0.215, -0.075, 0.345, 0.045, 0.015)]
keyhole_a = (0.28, -0.015, 0.014)

# B ---------------------------------------------------------------------------
code_b = code_lines(-0.40, 0.21, 0.085, 0.065, 1.15)
box_b = [brace(-0.56, 0.0, 0.29, 0.05, True), brace(0.56, 0.0, 0.29, 0.05, False)]
# Cursor al final de la tercera línea.
cx = -0.40 + 0.065 + 0.36 * 1.15 + 0.03
lock_b = [line((cx, 0.21 - 2 * 0.085 + 0.035), (cx, 0.21 - 2 * 0.085 - 0.035))]

# C ---------------------------------------------------------------------------
ring_c = [circle(-0.62, 0.0, 0.13), circle(-0.62, 0.0, 0.055)]
shaft = line((-0.49, 0.0), (-0.12, 0.0))
teeth_c = [[np.array([-0.30, 0.0]), np.array([-0.30, -0.075]), np.array([-0.25, -0.075]), np.array([-0.25, 0.0])],
           [np.array([-0.20, 0.0]), np.array([-0.20, -0.055]), np.array([-0.155, -0.055]), np.array([-0.155, 0.0])]]
path = line((-0.06, 0.0), (0.82, 0.0))
NODES_C = [0.28, 0.52, 0.76]

groups = [
    {
        "name": "Código: líneas en la caja (A), legibles (B), vástago de la llave y camino (C).",
        "a": sample(code_a, 1700, rng),
        "b": sample(code_b, 1700, rng),
        "c": sample([shaft, path], 1700, rng),
        "size": 70,
        "kind": 0,
    },
    {
        "name": "Caja (A), llaves { } (B), ojo de la llave (C).",
        "a": sample(box_a, 900, rng),
        "b": sample(box_b, 900, rng),
        "c": sample(ring_c, 900, rng),
        "size": 80,
        "kind": 0,
    },
    {
        "name": "Candado (A), cursor (B), dientes de la llave (C).",
        "a": sample(lock_a, 420, rng),
        "b": sample(lock_b, 420, rng, spread=0.004),
        "c": sample(teeth_c, 420, rng),
        "size": 90,
        "kind": 0,
    },
    {
        "name": "Nodos: ojo de la cerradura (A), «· · ·» bajo el código (B), los tres nodos del camino (C).",
        "a": np.concatenate([cluster(*keyhole_a, 150, rng)]),
        "b": np.concatenate([cluster(-0.06 + 0.06 * k, -0.30, 0.012, 50, rng) for k in range(3)]),
        "c": np.concatenate([cluster(x, 0.0, 0.03, 50, rng) for x in NODES_C]),
        "size": 230,
        "kind": 2,
        "tone": np.full(150, 255.0),
    },
    {
        "name": "Polvo: fijo en los tres estados.",
        "a": (d := dust(180, rng)),
        "b": d,
        "c": d,
        "size": 24,
        "kind": 1,
    },
]

out = os.path.join(os.path.dirname(__file__), "..", "..", "..", "public", "estudio", "v2", "pillar-2")
write(os.path.normpath(out), groups, "Generado por scripts/estudio-v2/pillar-2/build.py (semilla 20261111), mismo contrato que pillar-1.")
