"""Tarjeta 2 · «El código es tuyo».

    A  encerrado: unas líneas de código dentro de una caja, con un candado
       en el borde derecho. Todo apagado.
    B  se abre y se lee: la caja se vuelve un par de llaves { } alrededor del
       código, más grande y legible; el candado, un cursor al final de una
       línea; y debajo, tres puntos que anuncian lo que viene.
    C  la llave es tuya: la caja es el ojo de una llave, el candado sus
       dientes, el código su vástago y un camino que sigue a la derecha con
       tres nodos: otros pueden continuar desde ahí.

    python3 scripts/estudio/particles/pillar_2.py   (desde la raíz del repo)
"""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from strokes import arc, circle, dust, line, node, out_dir, poly, rrect, sample, write  # noqa: E402

rng = np.random.default_rng(20261122)

# Código: (sangría, longitud) por línea.
CODE = [(0, 0.40), (1, 0.30), (1, 0.36), (2, 0.20), (1, 0.26), (0, 0.14)]


def code_lines(x0, y0, dy, indent, scale):
    return [line((x0 + i * indent, y0 - k * dy), (x0 + i * indent + l * scale, y0 - k * dy)) for k, (i, l) in enumerate(CODE)]


def quad(p0, c, p1, steps=16):
    t = np.linspace(0, 1, steps)[:, None]
    p0, c, p1 = (np.array(v, float) for v in (p0, c, p1))
    return list((1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t * t * p1)


def brace(x, h, w, left=True):
    """Llave { (o } si left es False) centrada en (x, 0), alto 2h."""
    s = 1 if left else -1
    pts = []
    pts += quad((x + s * w, h), (x, h), (x, h - w))
    pts += quad((x, w), (x, 0), (x - s * w, 0))
    pts += quad((x - s * w, 0), (x, 0), (x, -w))
    pts += quad((x, -h + w), (x, -h), (x + s * w, -h))
    return pts


# A ---------------------------------------------------------------------------
box_a = [rrect(-0.46, -0.27, 0.26, 0.27, 0.04)]
code_a = code_lines(-0.38, 0.18, 0.072, 0.05, 0.85)
LOCK_X = 0.26
lock_a = [arc(LOCK_X, 0.045, 0.042, 0, 180, steps=40), rrect(LOCK_X - 0.065, -0.075, LOCK_X + 0.065, 0.045, 0.014)]

# B ---------------------------------------------------------------------------
code_b = code_lines(-0.40, 0.21, 0.085, 0.065, 1.15)
box_b = [brace(-0.56, 0.29, 0.04, True), brace(0.56, 0.29, 0.04, False)]
CUR_X = -0.40 + 0.065 + 0.36 * 1.15 + 0.03
lock_b = [line((CUR_X, 0.21 - 2 * 0.085 + 0.032), (CUR_X, 0.21 - 2 * 0.085 - 0.032))]

# C ---------------------------------------------------------------------------
ring_c = [circle(-0.62, 0.0, 0.13, start=0), circle(-0.62, 0.0, 0.05, start=0)]
teeth_c = [poly((-0.30, 0.0), (-0.30, -0.075), (-0.25, -0.075), (-0.25, 0.0)),
           poly((-0.20, 0.0), (-0.20, -0.055), (-0.155, -0.055), (-0.155, 0.0))]
# El vástago y el camino, seguidos: el destello sale de la llave y recorre el
# camino hasta el último nodo.
NODES_C = [0.30, 0.54, 0.78]
key_path = [line((-0.49, 0.0), (-0.12, 0.0)), line((-0.06, 0.0), (NODES_C[-1] - 0.035, 0.0))]

groups = [
    {
        "name": "Código: líneas en la caja (A), legibles (B), vástago de la llave y camino (C).",
        "a": sample(code_a, 2000, rng),
        "b": sample(code_b, 2000, rng),
        "c": sample(key_path, 2000, rng),
        "size": 70,
        "kind": 0,
        "glint": 1.0,
    },
    {
        "name": "Caja (A), llaves { } (B), ojo de la llave (C).",
        "a": sample(box_a, 1100, rng),
        "b": sample(box_b, 1100, rng),
        "c": sample(ring_c, 1100, rng),
        "size": 70,
        "kind": 0,
        "glint": 0.6,
    },
    {
        "name": "Candado (A), cursor (B), dientes de la llave (C).",
        "a": sample(lock_a, 500, rng),
        "b": sample(lock_b, 500, rng),
        "c": sample(teeth_c, 500, rng),
        "size": 80,
        "kind": 0,
    },
    {
        "name": "Nodos: ojo de la cerradura (A), «· · ·» bajo el código (B), los tres nodos del camino (C).",
        "a": np.concatenate([node(LOCK_X, -0.015, 60, rng, r=0.008, ring=0.016) for _ in range(3)]),
        "b": np.concatenate([node(-0.06 + 0.06 * k, -0.30, 60, rng, r=0.007, ring=0.014) for k in range(3)]),
        "c": np.concatenate([node(x, 0.0, 60, rng) for x in NODES_C]),
        "size": 230,
        "kind": 2,
        "tone": np.full(180, 255.0),
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

write(out_dir(2), groups, "scripts/estudio/particles/pillar_2.py, semilla 20261122.")
