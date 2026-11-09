"""Tarjeta 3 · «Pocos proyectos a la vez».

    A  uno más en la cola: doce proyectos (círculos pequeños) en fila sobre
       una línea; el tuyo, el cuarto, apenas se distingue.
    B  solo unos pocos: nueve se funden en una órbita y quedan tres, más
       grandes, sobre ella.
    C  toda la atención: el tuyo pasa al centro de la órbita, crece y se
       enciende, con un halo alrededor; los otros dos siguen en la órbita.

    python3 scripts/estudio-v2/pillar-3/build.py   (desde la raíz del repo)
"""

import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))
from strokes import circle, cluster, dust, line, sample, write  # noqa: E402

rng = np.random.default_rng(20261109 + 3)

# Cola: 12 círculos, el de la izquierda más pequeño (se aleja).
QX = np.linspace(-0.78, 0.78, 12)
QR = np.linspace(0.032, 0.046, 12)
QY = 0.02
YOURS, OTHERS = 3, (6, 9)
LEAVING = [i for i in range(12) if i != YOURS and i not in OTHERS]

# Órbita: elipse centrada, ligeramente inclinada en la lectura (ry pequeño).
RX, RY = 0.6, 0.22


def on_orbit(deg):
    a = math.radians(deg)
    return RX * math.cos(a), RY * math.sin(a)


ORBIT_B = {"yours": 235, "o1": 20, "o2": 145}
ORBIT_C = {"o1": 25, "o2": 155}

yb = on_orbit(ORBIT_B["yours"])
groups = [
    {
        "name": "Tu proyecto: en la cola (A), en la órbita (B), en el centro (C).",
        "a": sample([circle(QX[YOURS], QY, QR[YOURS])], 420, rng),
        "b": sample([circle(*yb, 0.06)], 420, rng),
        "c": sample([circle(0.0, 0.0, 0.1)], 420, rng),
        "size": 85,
        "kind": 0,
    },
    {
        "name": "Los otros dos que se quedan.",
        "a": sample([circle(QX[i], QY, QR[i]) for i in OTHERS], 560, rng),
        "b": sample([circle(*on_orbit(ORBIT_B[k]), 0.06) for k in ("o1", "o2")], 560, rng),
        "c": sample([circle(*on_orbit(ORBIT_C[k]), 0.042) for k in ("o1", "o2")], 560, rng),
        "size": 75,
        "kind": 0,
    },
    {
        "name": "Los que se van: nueve círculos (A) que se funden en la órbita (B y C).",
        "a": sample([circle(QX[i], QY, QR[i]) for i in LEAVING], 1500, rng),
        "b": sample([circle(0, 0, RX, start=180, ry=RY)], 1500, rng),
        "c": sample([circle(0, 0, RX, start=180, ry=RY)], 1500, rng),
        "size": 45,
        "kind": 0,
    },
    {
        "name": "Núcleo de tu proyecto: un punto (A y B), el nodo encendido (C).",
        "a": cluster(QX[YOURS], QY, 0.007, 110, rng),
        "b": cluster(*yb, 0.016, 110, rng),
        "c": cluster(0.0, 0.0, 0.035, 110, rng),
        "size": 230,
        "kind": 2,
        "tone": np.full(110, 255.0),
    },
    {
        "name": "Halo: la línea de la cola (A), un anillo junto a tu proyecto (B), el halo del centro (C).",
        "a": sample([line((-0.86, QY - 0.075), (0.86, QY - 0.075))], 520, rng),
        "b": sample([circle(*yb, 0.09)], 520, rng),
        "c": sample([circle(0.0, 0.0, 0.16)], 520, rng),
        "size": 30,
        "kind": 0,
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

out = os.path.join(os.path.dirname(__file__), "..", "..", "..", "public", "estudio", "v2", "pillar-3")
write(os.path.normpath(out), groups, "Generado por scripts/estudio-v2/pillar-3/build.py (semilla 20261112), mismo contrato que pillar-1.")
