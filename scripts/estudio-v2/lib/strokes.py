"""Formas de trazo para las escenas de «Estudio» (tarjetas 2 y 3).

La tarjeta 1 la modeló Blender (pillar-1/build.py); estas dos se dibujan con
trazos (líneas, arcos, rectángulos redondeados) y se muestrean por longitud
de arco, así que salen con el mismo contrato binario (ver pillar-1/README.md)
sin necesidad de Blender:

    state-{a,b,c}.bin  N × (x, y, z) int16 LE, coord = q / 32767 × [1, .42, .35]
    attr.bin           N × (tono, tamaño, tipo, grupo) uint8

Cada grupo tiene una forma por estado y el mismo número de puntos en las
tres. El punto k de un grupo cae en la misma fracción de longitud de su forma
en A, B y C: así los trazos viajan ordenados y no se revuelven.
"""

import json
import math
import os

import numpy as np

SCALES = (1.0, 0.42, 0.35)


def line(p0, p1):
    return [np.array(p0, float), np.array(p1, float)]


def arc(cx, cy, r, a0, a1, ry=None, steps=96):
    ry = r if ry is None else ry
    t = np.linspace(math.radians(a0), math.radians(a1), steps)
    return [np.array([cx + r * math.cos(v), cy + ry * math.sin(v)]) for v in t]


def circle(cx, cy, r, start=90, ry=None):
    return arc(cx, cy, r, start, start + 360, ry=ry, steps=160)


def rrect(x0, y0, x1, y1, r):
    pts = []
    pts += arc(x1 - r, y1 - r, r, 0, 90, steps=16)
    pts += arc(x0 + r, y1 - r, r, 90, 180, steps=16)
    pts += arc(x0 + r, y0 + r, r, 180, 270, steps=16)
    pts += arc(x1 - r, y0 + r, r, 270, 360, steps=16)
    pts.append(pts[0])
    return pts


def sample(strokes, n, rng, spread=0.0035):
    """n puntos repartidos por la longitud total de los trazos, en orden."""
    segs = []
    for s in strokes:
        for p, q in zip(s[:-1], s[1:]):
            segs.append((p, q, float(np.linalg.norm(q - p))))
    lengths = np.array([s[2] for s in segs])
    cum = np.concatenate([[0], np.cumsum(lengths)])
    total = cum[-1]
    u = (np.arange(n) + rng.uniform(0.15, 0.85, n)) / n * total
    out = np.zeros((n, 3))
    idx = np.clip(np.searchsorted(cum, u, side="right") - 1, 0, len(segs) - 1)
    for k, (i, v) in enumerate(zip(idx, u)):
        p, q, ln = segs[i]
        t = (v - cum[i]) / ln if ln > 0 else 0
        out[k, :2] = p + (q - p) * t
    out[:, :2] += np.clip(rng.normal(size=(n, 2)), -2.2, 2.2) * spread
    out[:, 2] = np.clip(rng.normal(size=n), -2, 2) * 0.012
    return out


def cluster(cx, cy, r, n, rng):
    """Nodo: disco de puntos con más densidad en el centro."""
    a = rng.uniform(0, 2 * math.pi, n)
    d = r * np.sqrt(rng.uniform(0, 1, n)) ** 1.6
    return np.column_stack([cx + d * np.cos(a), cy + d * np.sin(a), rng.normal(size=n) * 0.006])


def dust(n, rng):
    return np.column_stack([rng.uniform(-0.95, 0.95, n), rng.uniform(-0.38, 0.38, n), rng.uniform(-0.2, 0.2, n)])


def tone_of(xy):
    """Degradado de la marca: índigo abajo a la izquierda, orquídea arriba a la derecha."""
    return np.clip(((xy[:, 0] + 0.85) / 1.7) * 0.75 + ((xy[:, 1] + 0.35) / 0.7) * 0.25, 0, 1) * 255


def write(out_dir, groups, notes):
    """groups: lista de dicts {name, a, b, c, size, kind, tone?}."""
    os.makedirs(out_dir, exist_ok=True)
    A = np.concatenate([g["a"] for g in groups])
    B = np.concatenate([g["b"] for g in groups])
    C = np.concatenate([g["c"] for g in groups])
    n = len(A)
    tone = np.concatenate([g["tone"] if "tone" in g else tone_of(g["c"]) for g in groups])
    size = np.concatenate([np.broadcast_to(np.asarray(g["size"], float), len(g["a"])) for g in groups])
    kind = np.concatenate([np.full(len(g["a"]), g["kind"]) for g in groups])
    group = np.concatenate([np.full(len(g["a"]), i) for i, g in enumerate(groups)])
    sc = np.array(SCALES)
    for name, arr in (("a", A), ("b", B), ("c", C)):
        q = np.clip(np.rint(arr / sc * 32767), -32767, 32767).astype("<i2")
        q.tofile(os.path.join(out_dir, f"state-{name}.bin"))
    attr = np.column_stack([np.rint(tone), np.clip(np.rint(size), 0, 255), kind, group]).astype(np.uint8)
    attr.tofile(os.path.join(out_dir, "attr.bin"))
    manifest = {
        "version": 1,
        "count": int(n),
        "scales": list(SCALES),
        "states": ["a", "b", "c"],
        "groups": {str(i): g["name"] for i, g in enumerate(groups)},
        "notes": notes,
    }
    with open(os.path.join(out_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(out_dir, n, "puntos")
