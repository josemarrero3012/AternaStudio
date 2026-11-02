# Del EXR de Blender a lo que sirve la web:
#   journey-NNN.webp  (1600 × 900, color)
#   depth-NNN.webp    (800 × 450, gris, blanco = cerca)
#
#   python post.py EXR_DIR OUT_DIR [--size 1600x900] [--sheet sheet.jpg]
#
# WebP y no JPEG: a igual calidad pesa un 30 % menos (120 fotogramas).
#
# Todo el revelado va aquí, en lineal: halo (bloom), exposición, AgX (la
# misma curva que usa Blender), niebla con la profundidad hacia la noche de la
# web (#13163b), viñeta y un tramado que evita bandas en los degradados oscuros.

import argparse
import glob
import os

import cv2
import numpy as np
import OpenEXR
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--size", default="1600x900")
ap.add_argument("--quality", type=int, default=82)
ap.add_argument("--sheet", default="")
ap.add_argument("--only", default="")
args = ap.parse_args()
W, H = (int(v) for v in args.size.split("x"))
os.makedirs(args.dst, exist_ok=True)

files = sorted(glob.glob(os.path.join(args.src, "f*.exr")))
idx = [int(os.path.basename(f)[1:4]) for f in files]


def read(path):
    f = OpenEXR.File(path)
    rgb = z = None
    for p in f.parts:
        for k, c in p.channels.items():
            if k.endswith("Combined"):
                rgb = c.pixels[..., :3].astype(np.float32)
            elif k.endswith("Depth.Z"):
                z = c.pixels.astype(np.float32)
    return rgb, z


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
    v = lin_rgb @ AGX
    v = np.clip(np.log2(np.maximum(v, 1e-10)), MIN_EV, MAX_EV)
    v = (v - MIN_EV) / (MAX_EV - MIN_EV)
    x2 = v * v
    x4 = x2 * x2
    v = 15.5 * x4 * x2 - 40.14 * x4 * v + 31.96 * x4 - 6.868 * x2 * v + 0.4298 * x2 + 0.1191 * v - 0.00232
    # Look: algo más de contraste y color (como «Punchy», más suave).
    luma = (v * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    v = luma + sat * (v - luma)
    v = np.maximum(v, 0) ** punch
    v = v @ AGX_INV
    return np.clip(v, 0, 1) ** 2.2  # lineal de pantalla


def srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


def bloom(lin_rgb):
    h, w = lin_rgb.shape[:2]
    bright = np.maximum(lin_rgb - 0.8, 0)
    out = np.zeros_like(lin_rgb)
    cur = bright
    weights = [0.32, 0.26, 0.2, 0.14, 0.08]
    for i, wt in enumerate(weights):
        cur = cv2.pyrDown(cur)
        blur = cv2.GaussianBlur(cur, (0, 0), 1.6)
        out += wt * cv2.resize(blur, (w, h), interpolation=cv2.INTER_LINEAR)
    return out


NIGHT = np.array([0x13, 0x16, 0x3B], np.float32) / 255  # --night-0 de la web
HAZE = np.array([0x22, 0x26, 0x5c], np.float32) / 255  # luz de la niebla, algo más clara


def develop(rgb, z):
    h, w = rgb.shape[:2]
    lin_ = rgb * 1.0
    lin_ = lin_ + 0.6 * bloom(lin_)
    disp = srgb(agx(lin_))
    # Niebla: la distancia lleva al azul noche de la página.
    zz = np.minimum(z, 400.0)
    f = 1 - np.exp(-np.maximum(zz - 6.0, 0) * 0.024)
    f = np.clip(f, 0, 0.94)[..., None]
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    fog = NIGHT + (HAZE - NIGHT) * np.clip(1 - np.abs(yy - 0.55) * 2.2, 0, 1)
    disp = disp * (1 - f) + fog * f
    # Viñeta suave.
    xx = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
    yv = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    vig = 1 - 0.22 * np.clip((xx**2 * 0.6 + yv**2) - 0.25, 0, 1)
    disp = disp * vig[..., None]
    return disp


def to8(disp, seed):
    noise = np.random.default_rng(seed).random(disp.shape, dtype=np.float32) - 0.5
    return np.clip(disp * 255 + noise, 0, 255).astype(np.uint8)


# Profundidad: log de la distancia, con un rango por fotograma suavizado en el
# tiempo (sin saltos al pasar las páginas).
stats = {}
zs = {}
for f, i in zip(files, idx):
    rgb, z = read(f)
    zz = np.minimum(z, 250.0)
    lz = np.log(np.maximum(zz, 0.05))
    stats[i] = (np.percentile(lz, 1.5), np.percentile(lz, 97))
keys = sorted(stats)
near = np.array([stats[k][0] for k in keys])
far = np.array([stats[k][1] for k in keys])
if len(keys) > 3:
    from scipy.ndimage import gaussian_filter1d

    near = gaussian_filter1d(near, 2.5, mode="nearest")
    far = gaussian_filter1d(far, 2.5, mode="nearest")
rng_of = {k: (n, fa) for k, n, fa in zip(keys, near, far)}

only = {int(v) for v in args.only.split(",")} if args.only else None
thumbs = []
for f, i in zip(files, idx):
    if only and i not in only:
        continue
    rgb, z = read(f)
    disp = develop(rgb, z)
    img = to8(disp, i)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA) if img.shape[1] != W else img
    Image.fromarray(img).save(os.path.join(args.dst, f"journey-{i:03d}.webp"), quality=args.quality, method=6)
    n, fa = rng_of[i]
    lz = np.log(np.maximum(np.minimum(z, 250.0), 0.05))
    d = 1 - np.clip((lz - n) / max(fa - n, 1e-3), 0, 1)
    d = cv2.resize(d.astype(np.float32), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    # Lo cercano se ensancha un poco y se suaviza: el borde del primer plano
    # arrastra su fondo en vez de desgarrarlo.
    d = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    d = cv2.GaussianBlur(d, (0, 0), 2.0)
    Image.fromarray((d * 255 + 0.5).astype(np.uint8), "L").save(os.path.join(args.dst, f"depth-{i:03d}.webp"), quality=82, method=6)
    thumbs.append((i, img, (d * 255).astype(np.uint8)))
    print("ok", i, flush=True)

if args.sheet and thumbs:
    tw = 480
    th = tw * 9 // 16
    rows = []
    for i, img, d in thumbs:
        a = cv2.resize(img, (tw, th))
        b = cv2.cvtColor(cv2.resize(d, (tw, th)), cv2.COLOR_GRAY2RGB)
        cv2.putText(a, str(i), (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        rows.append(np.hstack([a, b]))
    Image.fromarray(np.vstack(rows)).save(args.sheet, quality=88)
