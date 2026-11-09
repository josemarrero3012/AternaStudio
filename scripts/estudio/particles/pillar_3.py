"""Tarjeta 3 · «Pocos proyectos a la vez».

    A  uno más en la cola: doce proyectos (círculos pequeños) en fila sobre
       una línea; el tuyo, el cuarto, apenas se distingue.
    B  solo unos pocos: nueve se funden en una órbita y quedan tres, más
       grandes, sobre ella.
    C  toda la atención: el tuyo pasa al centro de la órbita, crece y se
       enciende, con un halo alrededor; los otros dos siguen en la órbita.

    python3 scripts/estudio/particles/pillar_3.py   (desde la raíz del repo)
"""

import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from strokes import circle, dust, line, node, out_dir, sample, write  # noqa: E402

rng = np.random.default_rng(20261123)

# Cola: 12 círculos iguales sobre una línea.
QX = np.linspace(-0.74, 0.74, 12)
QR = 0.038
QY = 0.02
YOURS, OTHERS = 3, (6, 9)
LEAVING = [i for i in range(12) if i != YOURS and i not in OTHERS]

# Órbita: elipse centrada.
RX, RY = 0.6, 0.22


def on_orbit(deg):
    a = math.radians(deg)
    return RX * math.cos(a), RY * math.sin(a)


YB = on_orbit(235)
OB = [on_orbit(20), on_orbit(145)]
OC = [on_orbit(25), on_orbit(155)]

groups = [
    {
        "name": "Tu proyecto: en la cola (A), en la órbita (B), en el centro (C).",
        "a": sample([circle(QX[YOURS], QY, QR)], 500, rng),
        "b": sample([circle(*YB, 0.06)], 500, rng),
        "c": sample([circle(0.0, 0.0, 0.1)], 500, rng),
        "size": 80,
        "kind": 0,
        "glint": 0.8,
    },
    {
        "name": "Los otros dos que se quedan.",
        "a": sample([circle(QX[i], QY, QR) for i in OTHERS], 700, rng),
        "b": sample([circle(*p, 0.06) for p in OB], 700, rng),
        "c": sample([circle(*p, 0.042) for p in OC], 700, rng),
        "size": 65,
        "kind": 0,
        "glint": 0.5,
    },
    {
        "name": "Los que se van: nueve círculos (A) que se funden en la órbita (B y C).",
        "a": sample([circle(QX[i], QY, QR) for i in LEAVING], 2200, rng),
        "b": sample([circle(0, 0, RX, start=180, ry=RY)], 2200, rng),
        "c": sample([circle(0, 0, RX, start=180, ry=RY)], 2200, rng),
        "size": 50,
        "kind": 0,
        "glint": 1.0,
    },
    {
        "name": "Núcleo de tu proyecto: un punto (A y B), el nodo encendido (C).",
        "a": node(QX[YOURS], QY, 140, rng, r=0.006, ring=0.012),
        "b": node(*YB, 140, rng, r=0.012, ring=0.024),
        "c": node(0.0, 0.0, 140, rng, r=0.026, ring=0.045),
        "size": 230,
        "kind": 2,
        "tone": np.full(140, 255.0),
    },
    {
        "name": "Halo: la línea de la cola (A), un anillo junto a tu proyecto (B), el halo del centro (C).",
        "a": sample([line((-0.86, QY - 0.07), (0.86, QY - 0.07))], 700, rng),
        "b": sample([circle(*YB, 0.09)], 700, rng),
        "c": sample([circle(0.0, 0.0, 0.16)], 700, rng),
        "size": 40,
        "kind": 0,
        "glint": 0.7,
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

write(out_dir(3), groups, "scripts/estudio/particles/pillar_3.py, semilla 20261123.")
