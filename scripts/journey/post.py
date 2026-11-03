# Revelado del recorrido, versión 2: de los EXR por capas de scene.py a lo que
# sirve la web (public/journey/v2) y a lo que se revisa (scripts/journey/report).
#
#   python post.py EXR_DIR OUT_DIR [--report DIR] [--only 0,60] [--jobs N]
#   python post.py EXR_DIR --check        # valida los EXR y borra los rotos
#
# Por capa y en lineal, como en la v1 pero capa a capa: halo (bloom) dentro de
# la propia capa, AgX (la curva de Blender) y niebla con la profundidad de esa
# capa hacia la noche de la web (#13163b). El halo que sale del objeto se
# guarda como velo con alfa: se mueve con su capa, sin fantasmas. La base
# (suelo, raíces del suelo y peana) se compone sobre el cielo de niebla y es
# opaca. La viñeta y el tramado de pantalla los pone el shader de la web; en
# las versiones planas (móvil, sin paralaje) van horneados.
#
# Paralaje: cada capa lleva un modelo de su profundidad inversa 1/Z = a·u +
# b·v + c en coordenadas del fotograma visible (u a la derecha, v hacia abajo,
# de 0 a 1). El suelo es un plano: el modelo exacto sale de la cámara. El resto
# es rígido (a = b = 0, c = la mediana ponderada por el alfa). La web desplaza
# cada capa entera: d = puntero · K · (máx(1/Z, 0) − 1/Z_ref) · ganancia, con
# Z_ref la distancia de enfoque (lo enfocado no se mueve) y una ganancia que
# hace de tope suave para las capas muy cercanas.
#
# Sale, por fotograma:
#   layers/<ancho>/fNNN-base.avif   base opaca (con el margen alrededor)
#   layers/<ancho>/fNNN-atlas.avif  las capas con alfa empaquetadas (RGBA)
#   flat/<ancho>/fNNN.avif          todo compuesto, sin margen, con viñeta
#   portrait/<alto>/fNNN.avif       el centro 3:4 de la plana, para el móvil
#   fallback/fNNN.webp              la plana para navegadores sin AVIF
# y journey.json (el manifiesto) con las cajas, los modelos y los pesos.

import argparse
import glob
import json
import math
import os
import sys
import time
from multiprocessing import Pool

import cv2
import numpy as np
import OpenEXR
from PIL import Image

cv2.setNumThreads(1)  # el paralelismo va por fotogramas

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst", nargs="?", default="")
ap.add_argument("--report", default="")
ap.add_argument("--check", action="store_true")
ap.add_argument("--only", default="")
ap.add_argument("--jobs", type=int, default=0)
ap.add_argument("--tiers", default="1280,1920,2560,3840", help="anchos visibles de la versión con capas")
ap.add_argument("--flat-tiers", default="1280,1920,2560")
ap.add_argument("--portrait-tiers", default="720,1440,2160", help="altos del recorte vertical 3:4")
ap.add_argument("--fallback", type=int, default=1920)
ap.add_argument("--quality", type=int, default=80)
ap.add_argument("--base-quality", type=int, default=0, help="la base (niebla y suelo); 0 = la misma")
ap.add_argument("--speed", type=int, default=4)
ap.add_argument("--bloom", type=float, default=0.45, help="v1: 0.6")
ap.add_argument("--halo-outer", type=float, default=0.6, help="cuánto halo queda fuera del objeto")
ap.add_argument("--upscale", action="store_true", help="solo para pruebas: también las resoluciones mayores que el render")
args = ap.parse_args()

K = (0.0864, 0.0648)  # anchos·m y altos·m: a 4 m con enfoque a 9 m, un 1,2 % del ancho (como la v1)
TOPE = (0.02, 0.015)  # desplazamiento máximo de una capa (fracción del ancho y del alto)
MAX_BOXES = 40  # cajas por fotograma (uniforms del shader de la web)
MERGE_PX = 1.0  # arcos contiguos cuyo paralaje difiere menos de esto (px a 2560) van juntos
ORDER = ["base", "back", "mark", "a6", "a5", "a4", "a3", "a2", "a1", "a0"]  # de atrás adelante
NIGHT = np.array([0x13, 0x16, 0x3B], np.float32) / 255  # --night-0 de la web
HAZE = np.array([0x22, 0x26, 0x5C], np.float32) / 255  # luz de la niebla, algo más clara
SKY = np.array([6, 7, 26], np.float32) / 255  # el mundo de scene.py (#06071a, fuerza 0,25)
SKY = np.where(SKY <= 0.04045, SKY / 12.92, ((SKY + 0.055) / 1.055) ** 2.4) * 0.25

AGX = np.array(
    [
        [0.842479062253094, 0.0423282422610123, 0.0423756549057051],
        [0.0784335999999992, 0.878468636469772, 0.0784336],
        [0.0792237451477643, 0.0791661274605434, 0.879142973793104],
    ],
    np.float32,
)
AGX_INV = np.array(
    [
        [1.19687900512017, -0.0528968517574562, -0.0529716355144438],
        [-0.0980208811401368, 1.15190312990417, -0.0980434501171241],
        [-0.0990297440797205, -0.0989611768448433, 1.15107367264116],
    ],
    np.float32,
)
MIN_EV, MAX_EV = -12.47393, 4.026069


def agx(lin_rgb, punch=1.12, sat=1.12):
    """AgX como en la v1 (la curva de Blender, algo más de contraste y color)."""
    v = lin_rgb @ AGX
    v = np.clip(np.log2(np.maximum(v, 1e-10)), MIN_EV, MAX_EV)
    v = (v - MIN_EV) / (MAX_EV - MIN_EV)
    x2 = v * v
    x4 = x2 * x2
    v = 15.5 * x4 * x2 - 40.14 * x4 * v + 31.96 * x4 - 6.868 * x2 * v + 0.4298 * x2 + 0.1191 * v - 0.00232
    luma = (v * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    v = luma + sat * (v - luma)
    v = np.maximum(v, 0) ** punch
    v = v @ AGX_INV
    return np.clip(v, 0, 1) ** 2.2  # lineal de pantalla


def srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


def bloom(lin_rgb, vis_w):
    """El halo de la v1, que se pensó a 1600 px de ancho: se calcula a esa escala."""
    h, w = lin_rgb.shape[:2]
    bright = np.maximum(lin_rgb - 0.8, 0)
    s = min(1.0, 1600 / vis_w)
    sw, sh = max(8, round(w * s)), max(8, round(h * s))
    cur = cv2.resize(bright, (sw, sh), interpolation=cv2.INTER_AREA) if s < 1 else bright
    out = np.zeros_like(cur)
    for wt in (0.32, 0.26, 0.2, 0.14, 0.08):
        if min(cur.shape[:2]) < 4:
            break
        cur = cv2.pyrDown(cur)
        out += wt * cv2.resize(cv2.GaussianBlur(cur, (0, 0), 1.6), (sw, sh), interpolation=cv2.INTER_LINEAR)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR) if s < 1 else out


def fog_amount(z):
    zz = np.minimum(z, 400.0)
    return np.clip(1 - np.exp(-np.maximum(zz - 6.0, 0) * 0.024), 0, 0.94)


def lin(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def develop(P, A, Z, fog_enc, vis_w, zrep):
    """Una capa: P lineal premultiplicado (H,W,3), A alfa, Z profundidad.
    Devuelve el color de pantalla (lineal) premultiplicado, con el halo como
    luz añadida, y el alfa de ocultación. La niebla se mezcla en sRGB, como en
    la v1: un píxel opaco sale idéntico al de la imagen entera."""
    B = bloom(P, vis_w) * args.bloom
    covered = A > 1e-4
    C = np.where(covered[..., None], P / np.maximum(A, 1e-4)[..., None], 0)
    f = fog_amount(np.where(A > 0.01, Z, zrep))[..., None]
    obj = lin(srgb(agx(C + B)) * (1 - f) + fog_enc * f)  # la superficie y el halo encima
    halo = lin(srgb(agx(B * args.halo_outer)) * (1 - f))  # el halo sobre lo que haya detrás
    a = A[..., None]
    return a * obj + (1 - a) * halo, A


def veil(Qd, A):
    """Color recto y alfa para guardar: donde solo hay halo, un velo con alfa."""
    Ap = np.maximum(A, np.clip(Qd.max(-1), 0, 1))
    S = np.where(Ap[..., None] > 1e-5, Qd / np.maximum(Ap, 1e-5)[..., None], 0)
    return np.clip(S, 0, 1), Ap


def read_exr(path):
    f = OpenEXR.File(path)
    ch = {}
    for p in f.parts:
        for k, c in p.channels.items():
            ch[k] = c.pixels
    return ch


def get_layer(ch, name):
    rgba = ch.get(f"{name}.Combined")
    if rgba is None:
        rgba = np.dstack([ch[f"{name}.Combined.{c}"] for c in "RGBA"])
    z = ch.get(f"{name}.Depth.Z")
    if z is None:
        z = ch[f"{name}.Depth"]
    rgba = np.nan_to_num(rgba.astype(np.float32), nan=0.0, posinf=0.0)
    z = np.nan_to_num(z.astype(np.float32), nan=1e10, posinf=1e10)
    return rgba[..., :3], np.clip(rgba[..., 3], 0, 1), z


def inv_depth(A, Z):
    """Mediana de 1/Z ponderada por el alfa (None si la capa está vacía)."""
    w = A.ravel()
    z = Z.ravel()
    m = (w > 0.05) & (z > 0) & (z < 1e6)
    if m.sum() < 4:
        return None
    iz = 1 / z[m]
    ww = w[m]
    o = np.argsort(iz)
    cw = np.cumsum(ww[o])
    return float(iz[o][min(len(o) - 1, np.searchsorted(cw, cw[-1] / 2))])


def floor_plane(meta):
    """1/Z del suelo (z = 0) en el fotograma visible: a·u + b·v + c, exacto."""
    cam = meta["camera"]
    vw, vh = meta["visible"]
    R = np.array(cam["rot"], float)
    pz = cam["pos"][2]
    sx = 36.0 / cam["lens"]  # ancho visible del sensor entre la focal
    sy = sx * vh / vw

    def inv(u, v):
        d = R @ np.array([(u - 0.5) * sx, -(v - 0.5) * sy, -1.0])
        return -d[2] / pz

    c0 = inv(0, 0)
    return [inv(1, 0) - c0, inv(0, 1) - c0, c0]


def gain_of(z, uv, zr):
    """Tope suave: escala la capa entera (sigue siendo afín o rígida)."""
    a, b, c = z
    u0, v0, u1, v1 = uv
    dmax = max(abs(max(a * u + b * v + c, 0.0) - zr) for u in (u0, u1) for v in (v0, v1))
    r = max(K[0] * dmax / TOPE[0], K[1] * dmax / TOPE[1])
    return 1.0 if r <= 0.75 else (0.75 + 0.25 * math.tanh((r - 0.75) / 0.25)) / r


def coc_px(meta, iz, tier):
    """Círculo de confusión (px a ese ancho) de lo que está a 1/Z = iz."""
    cam = meta["camera"]
    f, n, zf = cam["lens"], cam["fstop"], cam["focus"] * 1000
    z = 1e9 if iz <= 0 else 1000 / iz
    return (f * f / n) * abs(z - zf) / (z * (zf - f)) / 36.0 * tier


def store_scale(coc):
    return 0.5 if coc >= 4 else 0.75 if coc >= 2.67 else 1.0


def to8(enc, seed):
    """De sRGB (0–1) a 8 bits con un tramado que evita bandas en los oscuros."""
    noise = np.random.default_rng(seed).random(enc.shape, dtype=np.float32) - 0.5
    return np.clip(enc * 255 + noise, 0, 255).astype(np.uint8)


def resize(img, w, h):
    return cv2.resize(img, (max(1, w), max(1, h)), interpolation=cv2.INTER_AREA)


def save(img, path, quality=None, sub="4:4:4"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.fromarray(img)
    if path.endswith(".webp"):
        im.save(path, quality=quality or 85, method=6)
    else:
        im.save(path, format="AVIF", quality=quality or args.quality, subsampling=sub, speed=args.speed, range="full")
    return os.path.getsize(path)


def vignette(h, w):
    """La viñeta de la v1 (en sRGB, sobre el fotograma visible)."""
    xx = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
    yy = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    return (1 - 0.22 * np.clip((xx**2 * 0.6 + yy**2) - 0.25, 0, 1))[..., None]


def pack_at(sizes, width, gutter):
    """Estantes (primer hueco, de la más alta a la más baja). Devuelve (x, y) y el alto."""
    pos = [None] * len(sizes)
    shelves = []  # [y, alto, x libre]
    top = 0
    for i in sorted(range(len(sizes)), key=lambda i: -sizes[i][1]):
        w, h = sizes[i][0] + gutter, sizes[i][1] + gutter
        for s in shelves:
            if s[2] + w <= width and h <= s[1]:
                break
        else:
            s = [top, h, 0]
            shelves.append(s)
            top += h
        pos[i] = (s[2] + gutter // 2, s[0] + gutter // 2)
        s[2] += w
    return pos, top


def pack(sizes, base_width, gutter=4, limit=8192):
    """Prueba varios anchos y se queda con el atlas de menor área que quepa en `limit`."""
    widest = max([w for w, _ in sizes] + [1]) + gutter
    best = None
    for k in (1.0, 1.25, 1.5, 2.0):
        width = max(widest, round(base_width * k))
        pos, height = pack_at(sizes, width, gutter)
        ok = max(width, height) <= limit
        key = (not ok, width * height)
        if best is None or key < best[0]:
            best = (key, pos, width, height)
    return best[1], best[2], best[3]


def split_boxes(occ, depth=0):
    """Cajas (en celdas) que cubren lo ocupado: guillotina recursiva mientras
    ahorre área (un arco cercano es un anillo con el centro vacío). Máx. 8."""
    rows, cols = np.nonzero(occ.any(1))[0], np.nonzero(occ.any(0))[0]
    if not len(rows):
        return []
    r0, r1, c0, c1 = rows[0], rows[-1] + 1, cols[0], cols[-1] + 1
    sub = occ[r0:r1, c0:c1]
    area = sub.size
    if depth >= 3 or area < 12:
        return [(r0, c0, r1, c1)]

    def tight(a):
        rr, cc = np.nonzero(a.any(1))[0], np.nonzero(a.any(0))[0]
        return 0 if not len(rr) else (rr[-1] - rr[0] + 1) * (cc[-1] - cc[0] + 1)

    best = None
    for axis in (0, 1):
        for cut in range(1, sub.shape[axis]):
            a, b = (sub[:cut], sub[cut:]) if axis == 0 else (sub[:, :cut], sub[:, cut:])
            cost = tight(a) + tight(b)
            if best is None or cost < best[0]:
                best = (cost, axis, cut)
    if best is None or best[0] > 0.85 * area:
        return [(r0, c0, r1, c1)]
    _, axis, cut = best
    if axis == 0:
        parts = [(sub[:cut], r0, c0), (sub[cut:], r0 + cut, c0)]
    else:
        parts = [(sub[:, :cut], r0, c0), (sub[:, cut:], r0, c0 + cut)]
    out = []
    for a, dr, dc in parts:
        out += [(q0 + dr, p0 + dc, q1 + dr, p1 + dc) for q0, p0, q1, p1 in split_boxes(a, depth + 1)]
    return out


def tiers_of(text, limit):
    out = [int(t) for t in text.split(",") if t]
    return out if args.upscale else [t for t in out if t <= limit]


def process(f):
    t0 = time.time()
    meta = json.load(open(os.path.join(args.src, f"f{f:03d}.json")))
    ch = read_exr(os.path.join(args.src, f"f{f:03d}.exr"))
    vw, vh = meta["visible"]
    W, H = meta["res"]
    mx, my = meta["margin"]
    zr = 1.0 / meta["camera"]["focus"]
    rows = (np.arange(H, dtype=np.float32) + 0.5 - my) / vh
    fog_enc = (NIGHT + (HAZE - NIGHT) * np.clip(1 - np.abs(rows - 0.55) * 2.2, 0, 1)[:, None])[:, None, :]
    sky = lin(srgb(agx(SKY[None, None, :])) * 0.06 + fog_enc * 0.94)  # el mundo tras la niebla del infinito
    uv_of = lambda x0, y0, x1, y1: [(x0 - mx) / vw, (y0 - my) / vh, (x1 - mx) / vw, (y1 - my) / vh]
    samples = {}
    for name in meta["layers"]:
        sc = ch.pop(f"{name}.Debug Sample Count.X", None)
        if sc is not None:
            samples[name] = round(float(np.mean(sc)) * meta["samples"], 1)
        ch.pop(f"{name}.Noisy Image", None)

    # La base (suelo, raíces del suelo, peana), sobre el cielo: opaca.
    P, A, Z = get_layer(ch, "base")
    zb = inv_depth(A, Z) or zr
    Qd, A = develop(P, A, Z, fog_enc, vw, 1 / zb)
    comp = Qd + (1 - A[..., None]) * sky
    base = comp.copy()
    layers = [{"g": "base", "uv": [uv_of(0, 0, W, H)], "z": floor_plane(meta)}]  # la base: una caja (todo)
    alpha = []  # (registro, S, Ap) de las capas con alfa, de atrás adelante

    # Arcos del túnel: los contiguos casi a la misma profundidad van juntos.
    present = [g for g in ORDER[1:] if g in meta["layers"]]
    loaded = {}
    for g in present:
        P, A, Z = get_layer(ch, g)
        iz = inv_depth(A, Z)
        if iz is not None:
            loaded[g] = (P, A, Z, iz)
    groups = []
    for g in [g for g in present if g in loaded]:
        P, A, Z, iz = loaded[g]
        sparse = float((A > 0.5).mean()) < 0.002  # unas motas sueltas: con la capa vecina
        near = groups and g.startswith("a") and groups[-1][0].startswith("a") and abs(iz - loaded[groups[-1][0]][3]) * K[0] * 2560 < MERGE_PX
        if groups and g.startswith("a") and groups[-1][-1].startswith("a") and (sparse or near):
            groups[-1].append(g)
        else:
            groups.append([g])
    del ch
    pad = max(2, round(12 * W / 4032))  # ≥ 2 px de datos alrededor en cualquier resolución
    cell = max(8, round(32 * W / 4032))
    for members in groups:
        Qg = Ag = None
        wsum = isum = 0.0
        for g in members:  # de atrás adelante
            P, A, Z, iz = loaded.pop(g)
            Qd, A = develop(P, A, Z, fog_enc, vw, 1 / max(iz, 1e-4))
            w = float(A.sum())
            wsum, isum = wsum + w, isum + w * iz
            if Qg is None:
                Qg, Ag = Qd, A
            else:
                Qg = Qd + (1 - A[..., None]) * Qg
                Ag = A + (1 - A) * Ag
        comp = Qg + (1 - Ag[..., None]) * comp
        S, Ap = veil(Qg, Ag)
        occ = Ap > 1 / 255
        gh, gw = -(-H // cell), -(-W // cell)
        grid = np.zeros((gh * cell, gw * cell), bool)
        grid[:H, :W] = occ
        grid = grid.reshape(gh, cell, gw, cell).any(axis=(1, 3))
        boxes = []
        for r0, c0, r1, c1 in split_boxes(grid):
            ys, xs = np.nonzero(occ[r0 * cell : r1 * cell, c0 * cell : c1 * cell])
            if not len(xs):
                continue
            x0, x1 = max(0, c0 * cell + xs.min() - pad), min(W, c0 * cell + xs.max() + 1 + pad)
            y0, y1 = max(0, r0 * cell + ys.min() - pad), min(H, r0 * cell + ys.max() + 1 + pad)
            boxes.append((x0, y0, x1, y1))
        if not boxes:
            continue
        iz = isum / max(wsum, 1e-6)
        ux0, uy0 = min(bx[0] for bx in boxes), min(bx[1] for bx in boxes)
        ux1, uy1 = max(bx[2] for bx in boxes), max(bx[3] for bx in boxes)
        rec = {"g": "+".join(members), "uv": [uv_of(*bx) for bx in boxes], "z": [0.0, 0.0, iz], "bound": uv_of(ux0, uy0, ux1, uy1)}
        alpha.append((rec, S, Ap, boxes))
    # La web pinta cada caja con un uniform: como mucho MAX_BOXES por fotograma.
    while sum(len(a[3]) for a in alpha) > MAX_BOXES:
        rec, S, Ap, boxes = max(alpha, key=lambda a: len(a[3]))
        bx = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        boxes[:] = [bx]
        rec["uv"] = [uv_of(*bx)]
    layers[0]["gain"] = gain_of(layers[0]["z"], layers[0]["uv"][0], zr)
    for rec, *_ in alpha:
        rec["gain"] = gain_of(rec["z"], rec.pop("bound"), zr)

    sizes = {}

    def put(key, nbytes):
        sizes[key] = sizes.get(key, 0) + nbytes

    # Versión con capas: base opaca + atlas (cada capa, en sus cajas), por resolución.
    atlases = {}
    for t in tiers_of(args.tiers, vw):
        st = t / vw
        Wt, Ht = round(W * st), round(H * st)
        put(f"layers/{t}", save(to8(srgb(resize(base, Wt, Ht)), f), os.path.join(args.dst, "layers", str(t), f"f{f:03d}-base.avif"), args.base_quality or args.quality, "4:2:0"))
        tiles = []
        for rec, S, Ap, boxes in alpha:
            s = st * store_scale(coc_px(meta, rec["z"][2], t))
            for x0, y0, x1, y1 in boxes:
                w, h = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
                a0 = Ap[y0:y1, x0:x1]
                pm = resize(np.dstack([S[y0:y1, x0:x1] * a0[..., None], a0]), w, h)  # en premultiplicado: sin halos oscuros
                a = np.clip(pm[..., 3:], 0, 1)
                col = np.where(a > 1e-5, pm[..., :3] / np.maximum(a, 1e-5), 0)
                tiles.append(np.dstack([to8(srgb(col), f + t), np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)]))
        pos, width, height = pack([(tl.shape[1], tl.shape[0]) for tl in tiles], Wt)
        atlas = np.zeros((max(4, height), max(4, width), 4), np.uint8)
        rects = []
        for (x, y), tl in zip(pos, tiles):
            atlas[y - 2 : y + tl.shape[0] + 2, x - 2 : x + tl.shape[1] + 2] = cv2.copyMakeBorder(tl, 2, 2, 2, 2, cv2.BORDER_REPLICATE)
            rects.append([x, y, tl.shape[1], tl.shape[0]])
        put(f"layers/{t}", save(atlas, os.path.join(args.dst, "layers", str(t), f"f{f:03d}-atlas.avif")))
        atlases[str(t)] = {"size": [atlas.shape[1], atlas.shape[0]], "rects": rects}

    # Versiones planas: todo compuesto, sin margen y con la viñeta de la v1.
    flat = srgb(comp[my : my + vh, mx : mx + vw]) * vignette(vh, vw)
    for t in tiers_of(args.flat_tiers, vw):
        put(f"flat/{t}", save(to8(resize(flat, t, round(t * vh / vw)), f), os.path.join(args.dst, "flat", str(t), f"f{f:03d}.avif")))
    cw = round(vh * 0.75)
    cx = (vw - cw) // 2
    for t in tiers_of(args.portrait_tiers, vh):
        put(f"portrait/{t}", save(to8(resize(flat[:, cx : cx + cw], round(t * 0.75), t), f), os.path.join(args.dst, "portrait", str(t), f"f{f:03d}.avif")))
    if args.fallback <= vw or args.upscale:
        fb = args.fallback
        put("fallback", save(to8(resize(flat, fb, round(fb * vh / vw)), f), os.path.join(args.dst, "fallback", f"f{f:03d}.webp")))

    thumb = to8(resize(flat, 320, 180), f)
    sheet = layer_sheet(f, meta, base, alpha, zr) if f in SHEET_FRAMES else None
    record = {
        "frame": f,
        "zr": zr,
        "layers": layers + [a[0] for a in alpha],
        "atlas": atlases,
        "sizes": sizes,
        "render_s": meta.get("seconds"),
        "peak_mb": meta.get("peak_mb"),
        "samples": samples,
        "post_s": round(time.time() - t0, 1),
        "res": meta["res"],
        "visible": meta["visible"],
        "margin": meta["margin"],
        "preset": meta.get("preset"),
        "max_samples": meta.get("samples"),
        "device": meta.get("device"),
        "blender": meta.get("blender"),
        "fstop": meta["camera"]["fstop"],
        "pad": pad,
    }
    return record, thumb, sheet


FRAMES = 120
SHEET_FRAMES = {0, 24, 60, 84, 105, 119}  # los de la prueba corta: capas despiezadas y puntero


def label(img, text, xy=(8, 22), scale=0.55):
    cv2.putText(img, text, xy, cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 3, cv2.LINE_AA)
    cv2.putText(img, text, xy, cv2.FONT_HERSHEY_SIMPLEX, scale, (255, 255, 255), 1, cv2.LINE_AA)
    return img


def layer_sheet(f, meta, base, alpha, zr):
    """Capas despiezadas sobre damero y el resultado con el puntero en la izquierda,
    el centro y la derecha, simulando la web con los modelos del manifiesto."""
    if not args.report:
        return None
    vw, vh = meta["visible"]
    W, H = meta["res"]
    mx, my = meta["margin"]
    sp = 640 / vw
    Wp, Hp = round(W * sp), round(H * sp)
    canv = [(np.dstack([resize(base, Wp, Hp), np.ones((Hp, Wp), np.float32)]), "base", floor_plane(meta), base_gain(meta, zr))]
    for rec, S, Ap, _ in alpha:
        canv.append((resize(np.dstack([S * Ap[..., None], Ap]), Wp, Hp), rec["g"], rec["z"], rec["gain"]))
    u = (np.arange(640, dtype=np.float32) + 0.5) / 640
    v = (np.arange(360, dtype=np.float32) + 0.5) / 360
    U, V = np.meshgrid(u, v)
    shots = []
    for px, name in ((-1, "puntero a la izquierda"), (0, "centro"), (1, "puntero a la derecha")):
        acc = np.zeros((360, 640, 3), np.float32)
        for c, _, (a, b, cz), g in canv:
            dz = np.maximum(a * U + b * V + cz, 0) - zr
            us = U + px * K[0] * g * dz  # inversa de d = −px·K·g·dz (primer orden)
            mapx = ((us * vw + mx) * sp - 0.5).astype(np.float32)
            mapy = ((V * vh + my) * sp - 0.5).astype(np.float32)
            s = cv2.remap(c, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            acc = s[..., :3] + (1 - s[..., 3:]) * acc
        shots.append(label(to8(srgb(acc) * vignette(360, 640), f), name))
    tiles = []
    yy, xx = np.mgrid[0:216, 0:384]
    checker = np.where(((yy // 12 + xx // 12) % 2)[..., None] == 0, 0.16, 0.24).astype(np.float32)
    for c, g, z, gain in canv:
        vis = c[round(my * sp) : round(my * sp) + 360, round(mx * sp) : round(mx * sp) + 640]
        t = resize(vis, 384, 216)
        img = srgb(t[..., :3]) + (1 - t[..., 3:]) * checker
        tiles.append(label(to8(img, f), f"{g}  1/Z {z[2]:.3f}  g {gain:.2f}", scale=0.45))
    while len(tiles) % 5:
        tiles.append(np.zeros((216, 384, 3), np.uint8))
    rows = [np.hstack(tiles[i : i + 5]) for i in range(0, len(tiles), 5)]
    sheet = np.vstack(rows + [np.hstack(shots)])
    path = os.path.join(args.report, f"capas-{f:03d}.jpg")
    os.makedirs(args.report, exist_ok=True)
    Image.fromarray(sheet).save(path, quality=88)
    return path


def base_gain(meta, zr):
    vw, vh = meta["visible"]
    mx, my = meta["margin"]
    return gain_of(floor_plane(meta), [-mx / vw, -my / vh, 1 + mx / vw, 1 + my / vh], zr)


def check_one(js):
    f = int(os.path.basename(js)[1:4])
    exr = os.path.join(args.src, f"f{f:03d}.exr")
    try:
        meta = json.load(open(js))
        if not os.path.exists(exr):
            raise ValueError("falta el EXR")
        ch = read_exr(exr)
        for name in meta["layers"]:
            P, A, Z = get_layer(ch, name)
            if P.shape[:2] != (meta["res"][1], meta["res"][0]):
                raise ValueError(f"{name}: tamaño {P.shape[:2]}")
        return f, None
    except Exception as err:  # noqa: BLE001 — cualquier fallo: se repite el fotograma
        return f, str(err)


def check(jobs):
    for tmp in glob.glob(os.path.join(args.src, "*.tmp*")):
        os.remove(tmp)
    for exr in glob.glob(os.path.join(args.src, "f???.exr")):
        if not os.path.exists(exr[:-4] + ".json"):  # cortado entre el EXR y el JSON
            os.remove(exr)
    files = sorted(glob.glob(os.path.join(args.src, "f???.json")))
    with Pool(jobs) as pool:
        results = pool.map(check_one, files)
    bad = [(f, e) for f, e in results if e]
    for f, err in bad:
        print(f"[check] fotograma {f} roto ({err}): se borra para repetirlo", flush=True)
        for ext in (".exr", ".json"):
            p = os.path.join(args.src, f"f{f:03d}{ext}")
            if os.path.exists(p):
                os.remove(p)
    print(f"[check] {len(files) - len(bad)} fotogramas bien, {len(bad)} rotos", flush=True)


def auto_jobs(sample_json):
    cpu = os.cpu_count() or 2
    ram = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2**30
    W, H = json.load(open(sample_json))["res"] if sample_json else (4032, 2268)
    per = 0.4 + 3.6 * (W * H) / (4032 * 2268)  # GB por fotograma en vuelo (EXR entero + revelado)
    return max(1, min(max(1, cpu // 2), int(ram * 0.7 / per)))


def r5(v):
    return [round(float(x), 5) for x in v]


def build_outputs():
    """journey.json con todos los fotogramas revelados y, si hay --report, el informe."""
    rdir = os.path.join(args.src, "post")
    recs = {}
    for p in sorted(glob.glob(os.path.join(rdir, "f???.json"))):
        rec = json.load(open(p))
        recs[rec["frame"]] = rec
    if not recs:
        sys.exit("[post] no hay fotogramas revelados")
    any_rec = next(iter(recs.values()))
    vw, vh = any_rec["visible"]
    mx, my = any_rec["margin"]
    tiers = sorted({int(t) for r in recs.values() for t in r["atlas"]})
    sets = sorted({k for r in recs.values() for k in r["sizes"]})
    frames = []
    for i in range(FRAMES):
        r = recs.get(i)
        if not r:
            frames.append(None)
            continue
        frames.append(
            {
                "zr": round(r["zr"], 6),
                "l": [{"g": L["g"], "uv": [r5(b) for b in L["uv"]], "z": [round(float(x), 6) for x in L["z"]], "gain": round(L["gain"], 4)} for L in r["layers"]],
                "atlas": {t: a["rects"] for t, a in r["atlas"].items()},
            }
        )
    manifest = {
        "version": 2,
        "frames": FRAMES,
        "ready": len(recs),
        "visible": [vw, vh],
        "margin": [round(mx / vw, 6), round(my / vh, 6)],
        "pad": [round(any_rec.get("pad", 0) / vw, 6), round(any_rec.get("pad", 0) / vh, 6)],  # datos de más alrededor de cada caja
        "k": list(K),
        "tope": list(TOPE),
        "tiers": {
            "layers": tiers,
            "flat": sorted({int(k.split("/")[1]) for k in sets if k.startswith("flat/")}),
            "portrait": sorted({int(k.split("/")[1]) for k in sets if k.startswith("portrait/")}),
            "fallback": args.fallback if "fallback" in sets else None,
        },
        "atlasMax": {str(t): [max(r["atlas"][str(t)]["size"][0] for r in recs.values()), max(r["atlas"][str(t)]["size"][1] for r in recs.values())] for t in tiers},
        "bytes": {k: sum(r["sizes"].get(k, 0) for r in recs.values()) for k in sets},
        "f": frames,
    }
    os.makedirs(args.dst, exist_ok=True)
    with open(os.path.join(args.dst, "journey.json"), "w") as fh:
        json.dump(manifest, fh, separators=(",", ":"))
    print(f"[post] journey.json: {len(recs)} de {FRAMES} fotogramas", flush=True)
    if args.report:
        report(recs, manifest, rdir)


def report(recs, manifest, rdir):
    os.makedirs(args.report, exist_ok=True)
    # Hoja de contactos de todo el recorrido (plano, con viñeta).
    cols, tw, th = 8, 320, 180
    sheet = np.full(((FRAMES + cols - 1) // cols * th, cols * tw, 3), 12, np.uint8)
    thumbs = {}
    for i in range(FRAMES):
        p = os.path.join(rdir, "thumbs", f"f{i:03d}.png")
        if os.path.exists(p):
            thumbs[i] = np.asarray(Image.open(p).convert("RGB"))
            sheet[i // cols * th : (i // cols + 1) * th, i % cols * tw : (i % cols + 1) * tw] = label(thumbs[i].copy(), str(i))
    Image.fromarray(sheet).save(os.path.join(args.report, "hoja.jpg"), quality=86)
    # Continuidad: diferencia media entre fotogramas consecutivos (0–255).
    diffs = {i: float(np.abs(thumbs[i].astype(np.float32) - thumbs[i - 1]).mean()) for i in thumbs if i - 1 in thumbs}
    med = float(np.median(list(diffs.values()))) if diffs else 0.0
    jumps = [(i, d) for i, d in sorted(diffs.items()) if med and d > 2.5 * med]
    rs = [r["render_s"] for r in recs.values() if r.get("render_s")]
    ps = [r["post_s"] for r in recs.values()]
    worst = max(recs.values(), key=lambda r: r.get("render_s") or 0)
    n = len(recs)
    missing = [i for i in range(FRAMES) if i not in recs]
    any_rec = next(iter(recs.values()))
    lines = [
        "# Recorrido v2 · informe del render",
        "",
        f"- Generado: {time.strftime('%Y-%m-%d %H:%M')} · Blender {any_rec.get('blender')} · {any_rec.get('device')}",
        f"- Preajuste: {any_rec.get('preset')} ({any_rec.get('max_samples')} muestras máx.) · f/{any_rec.get('fstop')} · render {any_rec['res'][0]}×{any_rec['res'][1]} (visible {any_rec['visible'][0]}×{any_rec['visible'][1]})",
        f"- Halo {args.bloom} (fuera del objeto ×{args.halo_outer}) · AVIF q{args.quality} velocidad {args.speed}",
        f"- Fotogramas revelados: **{n} de {FRAMES}**" + (f" (faltan {len(missing)}: {', '.join(map(str, missing[:20]))}{'…' if len(missing) > 20 else ''})" if missing else ""),
        "",
        "## Tiempos",
        "",
    ]
    if rs:
        lines += [
            f"- Render por fotograma: media **{np.mean(rs):.0f} s**, mediana {np.median(rs):.0f} s, máximo {worst['render_s']:.0f} s (fotograma {worst['frame']})",
            f"- Estimado para los {FRAMES}: **{np.mean(rs) * FRAMES / 3600:.1f} h**",
        ]
    peaks = [r.get("peak_mb") or 0 for r in recs.values()]
    lines += [f"- Memoria de render (pico informado): {max(peaks):.0f} MB", f"- Revelado por fotograma: media {np.mean(ps):.0f} s", ""]
    samp = {}
    for r in recs.values():
        for g, s in (r.get("samples") or {}).items():
            samp.setdefault(g, []).append(s)
    if samp:
        lines += ["## Muestras medias por capa", "", "| capa | muestras |", "|---|---|"] + [f"| {g} | {np.mean(v):.0f} |" for g, v in sorted(samp.items())] + [""]
    lines += ["## Pesos", "", "| conjunto | total | por fotograma |", "|---|---|---|"]
    for k, b in sorted(manifest["bytes"].items(), key=lambda kv: (kv[0].split("/")[0], int(kv[0].split("/")[1]) if "/" in kv[0] else 0)):
        lines.append(f"| {k} | {b / 2**20:.1f} MB | {b / n / 1024:.0f} KB |")
    lines += ["", "Atlas más grande por resolución: " + ", ".join(f"{t}: {w}×{h}" for t, (w, h) in manifest["atlasMax"].items()), ""]
    nl = [len(r["layers"]) for r in recs.values()]
    topped = sum(1 for r in recs.values() for L in r["layers"] if L["gain"] < 0.999)
    lines += [
        "## Capas",
        "",
        f"- Por fotograma: media {np.mean(nl):.1f}, máximo {max(nl)} (incluida la base)",
        f"- Capas con tope suave de paralaje (muy cercanas): {topped}",
        "",
        "## Continuidad",
        "",
        f"- Diferencia media entre fotogramas consecutivos (0–255): mediana {med:.2f}" if diffs else "- No hay fotogramas consecutivos todavía",
        ("- Saltos (más de 2,5 veces la mediana): " + ", ".join(f"{i - 1}→{i} ({d:.1f})" for i, d in jumps)) if jumps else "- Sin saltos",
        "",
        "Hojas: `hoja.jpg` (todo el recorrido) y `capas-NNN.jpg` (capas despiezadas y el puntero en los extremos).",
    ]
    with open(os.path.join(args.report, "report.md"), "w") as fh:
        fh.write("\n".join(lines) + "\n")
    summary = {"frames": n, "missing": missing, "render_s": rs and float(np.mean(rs)), "estimate_h": rs and float(np.mean(rs) * FRAMES / 3600), "bytes": manifest["bytes"], "atlasMax": manifest["atlasMax"], "continuity_median": med, "jumps": jumps}
    with open(os.path.join(args.report, "report.json"), "w") as fh:
        json.dump(summary, fh, indent=1)
    print(f"[post] informe en {args.report}", flush=True)


def main():
    metas = sorted(glob.glob(os.path.join(args.src, "f???.json")))
    jobs = args.jobs or auto_jobs(metas[0] if metas else None)
    if args.check:
        check(jobs)
        return
    if not args.dst:
        sys.exit("Falta OUT_DIR")
    frames = [int(os.path.basename(p)[1:4]) for p in metas if os.path.exists(p[:-5] + ".exr")]
    if args.only:
        only = {int(v) for v in args.only.split(",")}
        frames = [f for f in frames if f in only]
    rdir = os.path.join(args.src, "post")
    os.makedirs(os.path.join(rdir, "thumbs"), exist_ok=True)
    print(f"[post] {len(frames)} fotogramas con {jobs} procesos", flush=True)
    t0 = time.time()
    with Pool(jobs) as pool:
        for k, (record, thumb, sheet) in enumerate(pool.imap_unordered(process, frames)):
            f = record["frame"]
            with open(os.path.join(rdir, f"f{f:03d}.json"), "w") as fh:
                json.dump(record, fh)
            Image.fromarray(thumb).save(os.path.join(rdir, "thumbs", f"f{f:03d}.png"))
            print(f"[post] fotograma {f} ({k + 1}/{len(frames)}) {record['post_s']:.0f}s · {len(record['layers'])} capas", flush=True)
    print(f"[post] revelado en {time.time() - t0:.0f} s", flush=True)
    build_outputs()


if __name__ == "__main__":
    main()
