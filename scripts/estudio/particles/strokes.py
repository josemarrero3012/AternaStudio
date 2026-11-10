"""Trazos para las escenas de partículas de «01 — Estudio».

Cada tarjeta cuenta su frase en tres formas (A, B y C). Cada forma se dibuja
con trazos (líneas, arcos, rectángulos redondeados) y se muestrea por
longitud de arco. Cada grupo de partículas tiene una forma por estado y el
mismo número de puntos en las tres: el punto k de un grupo cae en la misma
fracción de longitud de su forma en A, B y C, así que los trazos viajan
ordenados y no se revuelven. Esa misma fracción es el recorrido de los
destellos: la luz avanza por cada grupo de su principio a su final, sea cual
sea la forma que se vea.

Salida, en public/estudio/v3/pillar-N/ (la lee src/lib/pillars/renderer.ts):

    state-{a,b,c}.bin  N × (x, y, z) int16 LE, coord = q / 32767 × [1, .42, .35]
    attr.bin           N × (tono, tamaño, tipo, grupo) uint8
                       tipo: 0 trazo, 1 polvo, 2 nodo
    path.bin           N × (recorrido 0–255, peso del destello 0–255) uint8
    manifest.json      número de puntos, escalas y qué es cada grupo

La cámara es ortográfica: x de -1,09 a 1,09 y 12:5. Conviene que todo quepa
en x ±0,85 e y ±0,36.
"""

import json
import math
import os

import numpy as np

SCALES = (1.0, 0.42, 0.35)
# Dispersión de las partículas a cada lado del trazo: fina, para que la línea
# se lea nítida.
SPREAD = 0.0014


def P(x, y):
    return np.array([x, y], float)


def line(p0, p1):
    return [P(*p0), P(*p1)]


def poly(*pts):
    return [P(*p) for p in pts]


def arc(cx, cy, r, a0, a1, ry=None, steps=96):
    ry = r if ry is None else ry
    t = np.linspace(math.radians(a0), math.radians(a1), steps)
    return [P(cx + r * math.cos(v), cy + ry * math.sin(v)) for v in t]


def circle(cx, cy, r, start=90, ry=None):
    return arc(cx, cy, r, start, start + 360, ry=ry, steps=max(48, int(160 * r / 0.1)))


def rrect(x0, y0, x1, y1, r):
    pts = []
    pts += arc(x0 + r, y1 - r, r, 180, 90, steps=12)
    pts += arc(x1 - r, y1 - r, r, 90, 0, steps=12)
    pts += arc(x1 - r, y0 + r, r, 0, -90, steps=12)
    pts += arc(x0 + r, y0 + r, r, 270, 180, steps=12)
    pts.append(pts[0])
    return pts


def curve(f, x0, x1, steps=240):
    """Trazo y = f(x) entre x0 y x1."""
    xs = np.linspace(x0, x1, steps)
    return [P(x, f(x)) for x in xs]


def sample(strokes, n, rng, spread=SPREAD):
    """n puntos repartidos por la longitud total de los trazos, en orden."""
    segs = []
    for s in strokes:
        for p, q in zip(s[:-1], s[1:]):
            ln = float(np.linalg.norm(q - p))
            if ln > 1e-9:
                segs.append((p, q, ln))
    lengths = np.array([s[2] for s in segs])
    cum = np.concatenate([[0], np.cumsum(lengths)])
    u = (np.arange(n) + rng.uniform(0.2, 0.8, n)) / n * cum[-1]
    idx = np.clip(np.searchsorted(cum, u, side="right") - 1, 0, len(segs) - 1)
    out = np.zeros((n, 3))
    for k, (i, v) in enumerate(zip(idx, u)):
        p, q, ln = segs[i]
        out[k, :2] = p + (q - p) * ((v - cum[i]) / ln)
    out[:, :2] += np.clip(rng.normal(size=(n, 2)), -2, 2) * spread
    out[:, 2] = np.clip(rng.normal(size=n), -2, 2) * 0.003
    return out


def node(cx, cy, n, rng, r=0.016, ring=0.03):
    """Nodo: un disco lleno y un anillo fino alrededor (como los de la web)."""
    k = int(n * 0.55)
    a = rng.uniform(0, 2 * math.pi, k)
    d = r * np.sqrt(rng.uniform(0, 1, k))
    core = np.column_stack([cx + d * np.cos(a), cy + d * np.sin(a), np.zeros(k)])
    halo = sample([circle(cx, cy, ring)], n - k, rng, spread=0.0012)
    return np.concatenate([core, halo])


def dust(n, rng):
    return np.column_stack([rng.uniform(-0.95, 0.95, n), rng.uniform(-0.38, 0.38, n), np.zeros(n)])


def tone_of(xy):
    """Degradado de la marca: índigo abajo a la izquierda, orquídea arriba a la derecha."""
    return np.clip(((xy[:, 0] + 0.85) / 1.7) * 0.75 + ((xy[:, 1] + 0.35) / 0.7) * 0.25, 0, 1) * 255


def write(out_dir, groups, notes):
    """groups: lista de dicts {name, a, b, c, size, kind, glint, tone?}.

    glint (0 a 1): cuánto brilla el destello al pasar por ese grupo.
    """
    os.makedirs(out_dir, exist_ok=True)
    for g in groups:
        assert len(g["a"]) == len(g["b"]) == len(g["c"]), g["name"]
    A = np.concatenate([g["a"] for g in groups])
    B = np.concatenate([g["b"] for g in groups])
    C = np.concatenate([g["c"] for g in groups])
    n = len(A)
    tone = np.concatenate([g["tone"] if "tone" in g else tone_of(g["c"]) for g in groups])
    size = np.concatenate([np.broadcast_to(np.asarray(g["size"], float), len(g["a"])) for g in groups])
    kind = np.concatenate([np.full(len(g["a"]), g["kind"]) for g in groups])
    group = np.concatenate([np.full(len(g["a"]), i) for i, g in enumerate(groups)])
    run = np.concatenate([np.arange(len(g["a"])) / max(1, len(g["a"]) - 1) for g in groups]) * 255
    glint = np.concatenate([np.full(len(g["a"]), g.get("glint", 0.0)) for g in groups]) * 255
    sc = np.array(SCALES)
    for name, arr in (("a", A), ("b", B), ("c", C)):
        q = np.clip(np.rint(arr / sc * 32767), -32767, 32767).astype("<i2")
        q.tofile(os.path.join(out_dir, f"state-{name}.bin"))
    np.column_stack([np.rint(tone), np.clip(np.rint(size), 0, 255), kind, group]).astype(np.uint8).tofile(
        os.path.join(out_dir, "attr.bin")
    )
    np.column_stack([np.rint(run), np.rint(glint)]).astype(np.uint8).tofile(os.path.join(out_dir, "path.bin"))
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


def out_dir(n):
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "..", "public", "estudio", "v3", f"pillar-{n}"))
