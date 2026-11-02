# Aterna · el recorrido. Escena procedural para Blender 5.2 (módulo bpy).
#
# La cámara cruza un portal de raíces, recorre un túnel de arcos de raíces
# luminosas (la paleta del vídeo del árbol: índigo, lavanda, violeta y
# orquídea) y llega a un claro donde se alza el símbolo de Aterna en 3D:
# cuerpo de metal anodizado con el degradado del logo, incrustación pulida y
# un filamento de luz que recorre cada trazo.
#
#   python scene.py --out DIR [--preview] [--frames 0,30,60] [--res 1600x900] [--samples N]
#   python scene.py --mark-blend aterna-mark.blend
#
# Escribe por fotograma un EXR multicapa (Combined + Depth), que post.py
# convierte en el JPEG y el mapa de profundidad de la web. Con --mark-blend
# guarda un .blend con solo el símbolo (peana, aura, luces y cámara), para
# usarlo aparte. La escena sale siempre igual: la semilla es fija y el orden
# de los números aleatorios no debe cambiar (si se toca, hay que volver a
# renderizar los 120 fotogramas). mark.json lo genera mark_contours.py.

import argparse
import json
import math
import os
import sys
import time

import bpy
import numpy as np
from scipy.interpolate import CubicSpline

HERE = os.path.dirname(os.path.abspath(__file__))

ap = argparse.ArgumentParser()
ap.add_argument("--out", default="")
ap.add_argument("--frames", default="")
ap.add_argument("--preview", action="store_true")
ap.add_argument("--res", default="1600x900")
ap.add_argument("--samples", type=int, default=0)
ap.add_argument("--threads", type=int, default=0)
ap.add_argument("--save-blend", default="")
ap.add_argument("--mark-blend", default="")
args = ap.parse_args()

FRAMES = 120
Y_MARK = 58.0
R_MARK = 2.2
Z_MARK = 0.55 + R_MARK  # centro del símbolo

rng = np.random.default_rng(3012)


# Utilidades ------------------------------------------------------------------


def lin(hex_or_rgb):
    """sRGB (hex o 0-255) → lineal."""
    if isinstance(hex_or_rgb, str):
        h = hex_or_rgb.lstrip("#")
        c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    else:
        c = [v / 255 for v in hex_or_rgb]
    out = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*out, 1.0)


def smooth_path(ctrl, n):
    ctrl = np.asarray(ctrl, float)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(ctrl, axis=0), axis=1))]
    keep = np.r_[True, np.diff(d) > 1e-6]
    ctrl, d = ctrl[keep], d[keep]
    cs = CubicSpline(d, ctrl, bc_type="natural")
    return cs(np.linspace(0, d[-1], n))


def frames_of(P):
    T = np.gradient(P, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-12
    ref = np.array([0.0, 0.0, 1.0]) if abs(T[0][2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N = np.cross(T[0], ref)
    N /= np.linalg.norm(N)
    Ns = np.zeros_like(P)
    Ns[0] = N
    for i in range(1, len(P)):
        N = N - np.dot(N, T[i]) * T[i]
        N /= np.linalg.norm(N) + 1e-12
        Ns[i] = N
    B = np.cross(T, Ns)
    return T, Ns, B


def wobble(n, amp, freqs=(1.3, 2.9, 5.7)):
    """Ruido suave a lo largo de una curva (n muestras), por eje."""
    s = np.linspace(0, 1, n)[:, None]
    out = np.zeros((n, 3))
    for f in freqs:
        ph = rng.uniform(0, 2 * np.pi, 3)
        a = rng.uniform(0.4, 1.0, 3) * amp / f
        out += a * np.sin(2 * np.pi * f * s * rng.uniform(0.8, 1.2) + ph)
    return out


def helix(P, radius, turns):
    T, N, B = frames_of(P)
    s = np.linspace(0, 1, len(P))
    phi = rng.uniform(0, 2 * np.pi) + 2 * np.pi * turns * s
    r = radius[:, None] if np.ndim(radius) else radius
    return P + r * (np.cos(phi)[:, None] * N + np.sin(phi)[:, None] * B)


def taper(n, a=0.12, b=0.12, lo=0.08):
    s = np.linspace(0, 1, n)
    t = np.ones(n)
    if a > 0:
        t = np.minimum(t, lo + (1 - lo) * np.clip(s / a, 0, 1) ** 0.6)
    if b > 0:
        t = np.minimum(t, lo + (1 - lo) * np.clip((1 - s) / b, 0, 1) ** 0.6)
    return t


# Escena ----------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection


def link(ob):
    col.objects.link(ob)
    return ob


def new_mat(name):
    m = bpy.data.materials.new(name)
    if hasattr(m, "use_nodes"):
        try:
            m.use_nodes = True
        except Exception:
            pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(nt, **kw):
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    for k, v in kw.items():
        p.inputs[k].default_value = v
    return p


def emission_mat(name, color, strength):
    m, nt, out = new_mat(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = color
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], out.inputs["Surface"])
    return m


def add_curves(name, splines, mat, bevel_res=2, caps=True):
    """splines: lista de (puntos (n,3), radios (n,)). Radio absoluto en metros."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 1.0
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = caps
    for pts, radii in splines:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        sp.points.foreach_set("co", np.c_[pts, np.ones(len(pts))].ravel().astype(np.float32))
        sp.points.foreach_set("radius", np.asarray(radii, np.float32))
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    return link(ob)


# Materiales de las raíces ----------------------------------------------------


def root_material(name, base, glow, rim_color, rim=1.4, glow_base=0.10):
    m, nt, out = new_mat(name)
    p = principled(
        nt,
        **{
            "Base Color": lin(base),
            "Roughness": 0.38,
            "Coat Weight": 0.35,
            "Coat Roughness": 0.18,
            "Specular IOR Level": 0.55,
        },
    )
    # Luz propia: tenue en el cuerpo, más en el canto (fibra óptica), con
    # bandas lentas a lo largo de la raíz.
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.35
    pw = nt.nodes.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = 2.2
    nt.links.new(lw.outputs["Facing"], pw.inputs[0])
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.55
    nz.inputs["Detail"].default_value = 3.0
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.25, 0.25, 0.25, 1)
    ramp.color_ramp.elements[1].position = 0.7
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    rimc = nt.nodes.new("ShaderNodeMix")
    rimc.data_type = "RGBA"
    rimc.inputs["A"].default_value = lin(glow)
    rimc.inputs["B"].default_value = lin(rim_color)
    nt.links.new(pw.outputs[0], rimc.inputs["Factor"])
    st = nt.nodes.new("ShaderNodeMath")
    st.operation = "MULTIPLY_ADD"
    st.inputs[1].default_value = rim
    st.inputs[2].default_value = glow_base
    nt.links.new(pw.outputs[0], st.inputs[0])
    st2 = nt.nodes.new("ShaderNodeMath")
    st2.operation = "MULTIPLY"
    nt.links.new(st.outputs[0], st2.inputs[0])
    nt.links.new(ramp.outputs["Color"], st2.inputs[1])
    nt.links.new(rimc.outputs["Result"], p.inputs["Emission Color"])
    nt.links.new(st2.outputs[0], p.inputs["Emission Strength"])
    nt.links.new(p.outputs[0], out.inputs["Surface"])
    return m


MAT_ROOT = root_material("root", "#14163d", "#2c3392", "#8c95ff", rim=0.95, glow_base=0.035)
MAT_ROOT_DEEP = root_material("root-deep", "#101232", "#262c80", "#7a7ff0", rim=0.7, glow_base=0.03)
MAT_FIBER = root_material("fiber", "#22266a", "#5c64e6", "#c2c7ff", rim=2.0, glow_base=0.22)

GLOWS = {
    "lavender": emission_mat("glow-lavender", lin("#98a2ff"), 4.5),
    "violet": emission_mat("glow-violet", lin("#9a5cf0"), 6.0),
    "orchid": emission_mat("glow-orchid", lin("#d77cf5"), 5.5),
    "rose": emission_mat("glow-rose", lin("#ff4d8f"), 5.0),
    "indigo": emission_mat("glow-indigo", lin("#5d68f0"), 5.0),
}

glow_splines = {k: [] for k in GLOWS}
root_splines, deep_splines, fiber_splines = [], [], []


def glow_on(pts, radii, palette, chance, rmul=1.18):
    """Un tramo encendido sobre una raíz (como la luz que recorre el vídeo)."""
    if rng.random() > chance:
        return
    n = len(pts)
    L = int(n * rng.uniform(0.12, 0.38))
    if L < 6:
        return
    a = int(rng.integers(0, n - L))
    seg = pts[a : a + L]
    rr = np.minimum(radii[a : a + L] * rmul, 0.05) * taper(L, 0.3, 0.3, 0.05)
    glow_splines[palette[int(rng.integers(0, len(palette)))]].append((seg, rr))


# Arcos del túnel -------------------------------------------------------------


def arch(y, W, H, strands, thick=(0.02, 0.075), lean=0.0, palette=("lavender", "violet", "indigo"), glow_chance=0.18, tendrils=12, deep=False, dense=1.0):
    yaw = rng.uniform(-0.12, 0.12)
    cy, sy = math.cos(yaw), math.sin(yaw)

    def place(x, dy, z):
        return (x * cy - dy * sy, y + x * sy + dy * cy + lean * z, z)

    a = rng.uniform(-0.08, 0.08) * W  # asimetría
    base = [
        (W + 1.9, 0.0, -0.12),
        (W + 0.9, 0.0, 0.03),
        (W * 1.02 + a * 0.3, 0.0, 0.85),
        (W * 0.95 + a, 0.0, H * 0.42),
        (W * 0.7 + a, 0.0, H * 0.82),
        (a * 0.4, 0.0, H),
        (-W * 0.7 + a, 0.0, H * 0.82),
        (-W * 0.95 + a, 0.0, H * 0.42),
        (-W * 1.02 + a * 0.3, 0.0, 0.85),
        (-W - 0.9, 0.0, 0.03),
        (-W - 1.9, 0.0, -0.12),
    ]
    arch_paths = []
    for i in range(strands):
        ctrl = []
        for j, (x, dy, z) in enumerate(base):
            edge = j in (0, 1, len(base) - 1, len(base) - 2)
            foot = j in (2, len(base) - 3)
            if edge:
                # En el suelo las raíces se abren en abanico, hacia delante y atrás.
                spread = 1.6 if j in (0, len(base) - 1) else 0.7
                px = x + rng.normal(0, 0.25 * spread) * np.sign(x)
                pdy = dy + rng.normal(0, 0.9 * spread)
                pz = z + rng.normal(0, 0.04)
            elif foot:
                px = x + rng.normal(0, 0.28) * np.sign(x)
                pdy = dy + rng.normal(0, 0.35)
                pz = z + rng.normal(0, 0.2)
            else:
                k = 0.22 + 0.12 * (z / H)
                px = x + rng.normal(0, k)
                pdy = dy + rng.normal(0, k * 1.3)
                pz = z + rng.normal(0, k * 0.8)
            ctrl.append(place(px, pdy, pz))
        P = smooth_path(ctrl, int(180 * dense))
        P = P + wobble(len(P), 0.12)
        P = helix(P, rng.uniform(0.03, 0.14), rng.uniform(1.5, 4.5) * rng.choice([-1, 1]))
        P[:, 2] = np.maximum(P[:, 2], -0.2)
        thick_i = rng.uniform(*thick) * (1.0 if rng.random() < 0.75 else 0.45)
        prof = taper(len(P), 0.22, 0.22, 0.05) * (0.75 + 0.25 * np.cos(np.linspace(0, 2 * np.pi, len(P))) ** 2)
        radii = thick_i * prof
        (deep_splines if deep else root_splines).append((P, radii))
        glow_on(P, radii, palette, glow_chance)
        arch_paths.append(P)
    # Fibras finas que acompañan el arco.
    for i in range(int(strands * 0.8)):
        P0 = arch_paths[int(rng.integers(0, len(arch_paths)))]
        P = P0 + wobble(len(P0), 0.25) + rng.normal(0, 0.06, 3)
        P = helix(P, 0.05, rng.uniform(3, 7))
        P[:, 2] = np.maximum(P[:, 2], -0.2)
        a0, a1 = sorted(rng.integers(0, len(P), 2))
        if a1 - a0 < 30:
            continue
        P = P[a0:a1]
        r = rng.uniform(0.003, 0.009) * taper(len(P), 0.2, 0.2, 0.1)
        fiber_splines.append((P, r))
        glow_on(P, r, palette, 0.1, rmul=1.6)
    # Zarcillos que cuelgan de lo alto: nunca bajan al eje de la cámara.
    for i in range(tendrils):
        P0 = arch_paths[int(rng.integers(0, len(arch_paths)))]
        s = rng.uniform(0.3, 0.7)
        p0 = P0[int(s * (len(P0) - 1))]
        if p0[2] < H * 0.55:
            continue
        L = rng.uniform(0.6, 2.4)
        floor_z = 3.4 if abs(p0[0]) < 2.0 else 1.6
        L = min(L, max(0.3, p0[2] - floor_z))
        ctrl = [p0, p0 + (rng.normal(0, 0.15), rng.normal(0, 0.15), -L * 0.45), p0 + (rng.normal(0, 0.3), rng.normal(0, 0.3), -L)]
        P = smooth_path(ctrl, 40) + wobble(40, 0.05)
        r = rng.uniform(0.004, 0.012) * taper(40, 0.0, 0.5, 0.15)
        fiber_splines.append((P, r))
        if rng.random() < 0.55:
            tip = P[-7:]
            glow_splines[palette[int(rng.integers(0, len(palette)))]].append((tip, r[-7:] * 2.2 + 0.004))
    return arch_paths


arches = []
# El portal: más ancho, más alto, más raíces.
arches.append(arch(4.0, 3.9, 6.3, 46, thick=(0.03, 0.1), glow_chance=0.16, tendrils=18))
ys = [10.0, 15.6, 21.3, 26.9, 32.4, 37.8]
for k, y in enumerate(ys):
    t = k / (len(ys) - 1)
    pal = ("lavender", "indigo", "violet") if t < 0.5 else ("violet", "orchid", "lavender")
    arches.append(arch(y + rng.uniform(-0.4, 0.4), rng.uniform(2.9, 3.4), rng.uniform(4.6, 5.4), int(rng.integers(26, 34)), palette=pal, glow_chance=0.16 + 0.1 * t, tendrils=12))
# Más allá del símbolo: los arcos del claro, grandes, que lo enmarcan en la niebla.
arches.append(arch(Y_MARK + 6.5, 6.8, 8.6, 44, thick=(0.04, 0.13), palette=("violet", "orchid", "indigo"), glow_chance=0.07, tendrils=10, deep=True, dense=1.3))
arches.append(arch(Y_MARK + 14.0, 9.0, 11.5, 50, thick=(0.05, 0.16), palette=("violet", "indigo"), glow_chance=0.07, tendrils=6, deep=True, dense=1.4))

# Hilos que unen arcos consecutivos por arriba: la red.
for k in range(len(arches) - 3):
    A, B = arches[k], arches[k + 1]
    for i in range(14):
        pa = A[int(rng.integers(0, len(A)))]
        pb = B[int(rng.integers(0, len(B)))]
        a = pa[int(rng.uniform(0.25, 0.75) * (len(pa) - 1))]
        b = pb[int(rng.uniform(0.25, 0.75) * (len(pb) - 1))]
        if min(a[2], b[2]) < 3.2:
            continue
        mid = (a + b) / 2 + (rng.normal(0, 0.4), 0, -rng.uniform(0.2, 0.9))
        P = smooth_path([a, mid, b], 60) + wobble(60, 0.08)
        r = np.full(60, rng.uniform(0.0025, 0.006))
        fiber_splines.append((P, r))
        glow_on(P, r, ("lavender", "violet"), 0.3, rmul=1.8)

# Raíces del suelo: el sistema de raíces del símbolo. Nacen en la peana, se
# abren por el suelo y se ramifican; las que van hacia el túnel llegan lejos.


def grow(p, heading, length, radius, depth, palette):
    n = max(24, int(length * 14))
    pts = [np.array(p, float)]
    h = heading
    step = length / n
    turn = rng.normal(0, 0.03)
    for i in range(n):
        turn = 0.85 * turn + rng.normal(0, 0.035)
        h += turn
        q = pts[-1] + step * np.array([math.cos(h), math.sin(h), 0.0])
        pts.append(q)
    P = np.array(pts)
    P[:, 2] = -0.012 + 0.05 * np.sin(np.linspace(0, length * rng.uniform(0.25, 0.6), len(P)) + rng.uniform(0, 6)) * np.linspace(0.6, 1, len(P))
    r = radius * np.linspace(1, 0.12, len(P)) ** 0.8 * taper(len(P), 0.0, 0.08, 0.3)
    root_splines.append((P, r))
    glow_on(P, r, palette, 0.3)
    if depth <= 0:
        return
    for _ in range(int(rng.integers(1, 4))):
        a = int(rng.uniform(0.15, 0.75) * len(P))
        hh = math.atan2(*(P[min(a + 1, len(P) - 1)] - P[a])[[1, 0]]) + rng.choice([-1, 1]) * rng.uniform(0.35, 0.9)
        grow(P[a], hh, length * rng.uniform(0.3, 0.6), r[a] * 0.75, depth - 1, palette)


for i in range(30):
    # Más raíces hacia la cámara (−Y) que hacia atrás.
    th = -math.pi / 2 + rng.normal(0, 0.9) if rng.random() < 0.7 else rng.uniform(0, 2 * math.pi)
    p0 = (3.1 * math.cos(th), Y_MARK + 3.1 * math.sin(th), 0.0)
    toward_tunnel = math.sin(th) < -0.6
    L = rng.uniform(14, 30) if toward_tunnel else rng.uniform(5, 12)
    grow(p0, th, L, rng.uniform(0.03, 0.065), 2, ("violet", "orchid", "lavender", "rose"))
# Y algunas que vienen desde la boca del túnel.
for i in range(16):
    x0 = rng.choice([-1, 1]) * rng.uniform(1.0, 4.0)
    grow((x0, rng.uniform(-8, 30), 0.0), math.pi / 2 + rng.normal(0, 0.25) - 0.06 * np.sign(x0), rng.uniform(8, 20), rng.uniform(0.02, 0.045), 2, ("indigo", "lavender", "violet"))

add_curves("roots", root_splines, MAT_ROOT, bevel_res=3)
add_curves("roots-deep", deep_splines, MAT_ROOT_DEEP, bevel_res=3)
add_curves("fibers", fiber_splines, MAT_FIBER, bevel_res=1)
for k, spl in glow_splines.items():
    if spl:
        add_curves(f"glow-{k}", spl, GLOWS[k], bevel_res=2)

# Motas de luz ------------------------------------------------------------------


def icosphere_arrays():
    t = (1 + 5**0.5) / 2
    v = np.array([(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)], float)
    v /= np.linalg.norm(v, axis=1, keepdims=True)
    f = np.array([(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)])
    return v, f


def motes(name, n, box, rmin, rmax, mat):
    v0, f0 = icosphere_arrays()
    (x0, x1), (y0, y1), (z0, z1) = box
    c = np.c_[rng.uniform(x0, x1, n), rng.uniform(y0, y1, n), rng.uniform(z0, z1, n)]
    # Fuera del eje de la cámara.
    near_axis = (np.abs(c[:, 0]) < 0.5) & (c[:, 2] < 2.6) & (c[:, 2] > 1.0)
    c = c[~near_axis]
    r = rng.uniform(rmin, rmax, len(c)) ** 1.0
    verts = (v0[None] * r[:, None, None] + c[:, None]).reshape(-1, 3)
    faces = (f0[None] + (np.arange(len(c)) * len(v0))[:, None, None]).reshape(-1, 3)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces.tolist())
    ob = bpy.data.objects.new(name, me)
    me.materials.append(mat)
    return link(ob)


motes("motes-lav", 900, ((-4.5, 4.5), (-8, 70), (0.2, 6.0)), 0.006, 0.016, emission_mat("mote-lav", lin("#c9ceff"), 9.0))
motes("motes-orchid", 300, ((-4.0, 4.0), (30, 66), (0.3, 6.0)), 0.006, 0.014, emission_mat("mote-orchid", lin("#ee9cff"), 9.0))

# Suelo -------------------------------------------------------------------------

m, nt, out = new_mat("floor")
p = principled(nt, **{"Base Color": lin("#090b20"), "Specular IOR Level": 0.5, "Coat Weight": 0.0})
tc = nt.nodes.new("ShaderNodeTexCoord")
nz = nt.nodes.new("ShaderNodeTexNoise")
nz.inputs["Scale"].default_value = 0.35
nz.inputs["Detail"].default_value = 6
nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
rr = nt.nodes.new("ShaderNodeMapRange")
rr.inputs["To Min"].default_value = 0.14
rr.inputs["To Max"].default_value = 0.5
nt.links.new(nz.outputs["Fac"], rr.inputs["Value"])
nt.links.new(rr.outputs["Result"], p.inputs["Roughness"])
nz2 = nt.nodes.new("ShaderNodeTexNoise")
nz2.inputs["Scale"].default_value = 6.0
nz2.inputs["Detail"].default_value = 4
nt.links.new(tc.outputs["Object"], nz2.inputs["Vector"])
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.12
nt.links.new(nz2.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
nt.links.new(p.outputs[0], out.inputs["Surface"])
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 40, 0))
floor = bpy.context.active_object
floor.name = "floor"
floor.data.materials.append(m)

# El símbolo --------------------------------------------------------------------

mark = json.load(open(os.path.join(HERE, "mark.json")))  # mark_contours.py

frame_empty = bpy.data.objects.new("mark-frame", None)
frame_empty.location = (0, Y_MARK, Z_MARK)
frame_empty.rotation_euler = (math.pi / 2, 0, 0)
link(frame_empty)


def gradient_ramp(nt, stops, coord_object):
    """Degradado del logo: azul abajo a la izquierda, rosa arriba a la derecha."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    tc.object = coord_object
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    mx = nt.nodes.new("ShaderNodeMath")
    mx.operation = "MULTIPLY"
    mx.inputs[1].default_value = 0.6 / (2 * R_MARK)
    nt.links.new(sep.outputs["X"], mx.inputs[0])
    my = nt.nodes.new("ShaderNodeMath")
    my.operation = "MULTIPLY_ADD"
    my.inputs[1].default_value = 0.8 / (2 * R_MARK)
    nt.links.new(sep.outputs["Y"], my.inputs[0])
    nt.links.new(mx.outputs[0], my.inputs[2])
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    add.inputs[1].default_value = 0.5
    nt.links.new(my.outputs[0], add.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0]
    els[1].position, els[1].color = stops[-1]
    for pos, c in stops[1:-1]:
        e = els.new(pos)
        e.color = c
    nt.links.new(add.outputs[0], ramp.inputs["Fac"])
    return ramp


def micro_bump(nt, strength, scale):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = 0.002
    nt.links.new(nz.outputs["Fac"], b.inputs["Height"])
    return b


# Cuerpo: titanio anodizado oscuro con el degradado del logo.
m_body, nt, out = new_mat("mark-body")
ramp = gradient_ramp(nt, [(0.0, lin((22, 52, 150))), (0.5, lin((82, 38, 140))), (1.0, lin((200, 30, 100)))], frame_empty)
p = principled(nt, **{"Metallic": 1.0, "Roughness": 0.34, "Anisotropic": 0.35, "Coat Weight": 0.25, "Coat Roughness": 0.08, "Thin Film Thickness": 320.0, "Thin Film IOR": 1.6})
nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
b = micro_bump(nt, 0.08, 900)
nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
nt.links.new(p.outputs[0], out.inputs["Surface"])

# Incrustación: esmalte pulido con el degradado, un poco de luz propia.
m_inlay, nt, out = new_mat("mark-inlay")
ramp = gradient_ramp(nt, [(0.0, lin((30, 80, 220))), (0.5, lin((120, 50, 210))), (1.0, lin((255, 40, 130)))], frame_empty)
p = principled(nt, **{"Metallic": 0.6, "Roughness": 0.14, "Coat Weight": 1.0, "Coat Roughness": 0.03, "Emission Strength": 0.22})
nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
nt.links.new(ramp.outputs["Color"], p.inputs["Emission Color"])
nt.links.new(p.outputs[0], out.inputs["Surface"])

# Filamento: la luz que recorre cada trazo.
m_fil, nt, out = new_mat("mark-filament")
ramp = gradient_ramp(nt, [(0.0, lin((120, 160, 255))), (0.5, lin((190, 130, 255))), (1.0, lin((255, 120, 190)))], frame_empty)
e = nt.nodes.new("ShaderNodeEmission")
e.inputs["Strength"].default_value = 7.0
nt.links.new(ramp.outputs["Color"], e.inputs["Color"])
nt.links.new(e.outputs[0], out.inputs["Surface"])


def mark_curve(name, shapes, extrude, bevel, mat, z_off):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 5
    cu.offset = -bevel * 0.92
    for shape in shapes:
        for contour in shape:
            sp = cu.splines.new("POLY")
            sp.points.add(len(contour) - 1)
            arr = np.c_[np.asarray(contour), np.zeros(len(contour)), np.ones(len(contour))]
            sp.points.foreach_set("co", arr.ravel().astype(np.float32))
            sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    ob.parent = frame_empty
    ob.location = (0, 0, z_off)
    return link(ob)


BODY_EXT, BODY_BEV = 0.15, 0.028
mark_curve("mark-body", mark["shapes"], BODY_EXT, BODY_BEV, m_body, 0.0)
front = BODY_EXT + BODY_BEV
mark_curve("mark-inlay", mark["inlay"], 0.006, 0.011, m_inlay, front + 0.004)
mark_curve("mark-inlay-back", mark["inlay"], 0.006, 0.011, m_inlay, -front - 0.004)

fils = []
for c in mark["filaments"]:
    c = np.asarray(c)
    pts = np.c_[c[:, 0], c[:, 1], np.full(len(c), front - 0.001)]
    pts = np.vstack([pts, pts[:1]])
    fils.append((pts, np.full(len(pts), 0.0065)))
ob = add_curves("mark-filaments", fils, m_fil, bevel_res=2)
ob.parent = frame_empty

# Peana: obsidiana con anillos de luz.
m, nt, out = new_mat("plinth")
p = principled(nt, **{"Base Color": lin("#07081a"), "Roughness": 0.06, "Coat Weight": 1.0, "Coat Roughness": 0.02})
nt.links.new(p.outputs[0], out.inputs["Surface"])
bpy.ops.mesh.primitive_cylinder_add(vertices=160, radius=3.3, depth=0.16, location=(0, Y_MARK, 0.08))
pl = bpy.context.active_object
pl.name = "plinth"
pl.data.materials.append(m)
bpy.ops.object.shade_smooth()
for i, (rad, colr) in enumerate([(2.45, "#b07cff"), (2.95, "#7f88ff"), (3.3, "#e08cff")]):
    bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=0.011 if i != 2 else 0.016, major_segments=256, minor_segments=8, location=(0, Y_MARK, 0.165 if i != 2 else 0.16))
    tr = bpy.context.active_object
    tr.name = f"ring{i}"
    tr.data.materials.append(emission_mat(f"ring{i}", lin(colr), 2.4))

# Aura detrás del símbolo: un disco de luz que se ve por los huecos del árbol.
m, nt, out = new_mat("aura")
tc = nt.nodes.new("ShaderNodeTexCoord")
gr = nt.nodes.new("ShaderNodeTexGradient")
gr.gradient_type = "SPHERICAL"
mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Scale"].default_value = (1 / 4.6, 1 / 4.6, 1 / 4.6)
nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
nt.links.new(mp.outputs[0], gr.inputs["Vector"])
pwr = nt.nodes.new("ShaderNodeMath")
pwr.operation = "POWER"
pwr.inputs[1].default_value = 1.7
nt.links.new(gr.outputs["Fac"], pwr.inputs[0])
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = lin("#140f45")
ramp.color_ramp.elements[1].color = lin("#6a46c0")
nt.links.new(pwr.outputs[0], ramp.inputs["Fac"])
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 0.5
nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
tr_ = nt.nodes.new("ShaderNodeBsdfTransparent")
mix = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(pwr.outputs[0], mix.inputs["Fac"])
nt.links.new(tr_.outputs[0], mix.inputs[1])
nt.links.new(em.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], out.inputs["Surface"])
bpy.ops.mesh.primitive_plane_add(size=9.2, location=(0, Y_MARK + 1.7, Z_MARK + 0.1), rotation=(math.pi / 2, 0, 0))
aura = bpy.context.active_object
aura.name = "aura"
aura.data.materials.append(m)
aura.visible_shadow = False

# Luces -------------------------------------------------------------------------


def area(name, loc, target, size, energy, color, shape="DISK"):
    li = bpy.data.lights.new(name, "AREA")
    li.shape = shape
    li.size = size
    if shape == "RECTANGLE":
        li.size_y = size * 0.5
    li.energy = energy
    li.color = color[:3]
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    d = np.subtract(target, loc)
    ob.rotation_euler = vec_to_euler(d)
    return link(ob)


def vec_to_euler(d):
    from mathutils import Vector

    return Vector(d).to_track_quat("-Z", "Y").to_euler()


mark_c = (0, Y_MARK, Z_MARK)
area("key", (-6.5, Y_MARK - 7.5, 7.5), mark_c, 5.0, 1100, (0.86, 0.87, 1.0), "RECTANGLE")
area("fill", (7.0, Y_MARK - 6.0, 2.5), mark_c, 4.0, 380, (0.95, 0.75, 1.0), "RECTANGLE")
area("rim", (0, Y_MARK + 3.5, Z_MARK + 3.5), mark_c, 3.0, 1400, (0.75, 0.55, 1.0))
area("under", (0, Y_MARK - 0.6, 0.35), (0, Y_MARK - 0.6, 3.0), 1.5, 220, (0.8, 0.5, 1.0))
# Luces suaves en el túnel, desde arriba, para que el suelo refleje.
for k, y in enumerate([4.0] + ys):
    area(f"tun{k}", ((-1) ** k * 2.2, y + 1.0, 4.8), ((-1) ** k * 2.6, y + 1.0, 0), 1.2, 40 + 8 * k, (0.62, 0.62, 1.0) if k < 4 else (0.8, 0.6, 1.0))

world = bpy.data.worlds.new("night")
scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value = lin("#06071a")
bg.inputs["Strength"].default_value = 0.25

# Cámara ------------------------------------------------------------------------

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 32
cam_data.sensor_width = 36
cam_data.clip_start = 0.05
cam_data.clip_end = 400
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 2.4
cam = bpy.data.objects.new("cam", cam_data)
link(cam)
scene.camera = cam

Y0, Y1 = -6.0, Y_MARK - 13.0


def camera_at(f):
    t = f / (FRAMES - 1)
    u = 0.3 * t + 0.35 * (1 - math.cos(math.pi * t))
    y = Y0 + (Y1 - Y0) * u
    k = 1 - (1 - t) ** 3  # cuánto manda el símbolo
    x = 0.32 * math.sin(2 * math.pi * (t * 1.15 + 0.1)) * (1 - k)
    z = 1.5 + 0.25 * math.sin(math.pi * t) + 0.55 * t**2
    # Mira al fondo del túnel; al final, al símbolo (algo bajo su centro: el
    # símbolo queda por encima del texto).
    target_far = np.array([x * 0.4, y + 25.0, 1.95])
    target_mark = np.array([0.0, Y_MARK, Z_MARK - 0.42])
    w = min(1.0, max(0.0, (t - 0.45) / 0.45))
    w = w * w * (3 - 2 * w)
    target = target_far * (1 - w) + target_mark * w
    if t > 0.6:
        # En el claro, el objetivo es siempre el símbolo.
        target = target_mark * w + target_far * (1 - w)
    pos = np.array([x, y, z])
    roll = 0.012 * math.sin(2 * math.pi * t * 0.9) * (1 - k)
    focus = float(np.linalg.norm(target_mark - pos)) * w + 9.0 * (1 - w)
    return pos, target, roll, focus


def place_camera(f):
    from mathutils import Vector

    pos, target, roll, focus = camera_at(f)
    cam.location = pos.tolist()
    q = Vector((target - pos).tolist()).to_track_quat("-Z", "Y")
    e = q.to_euler()
    e.rotate_axis("Z", roll)
    cam.rotation_euler = e
    cam_data.dof.focus_distance = focus


# Render ------------------------------------------------------------------------

W, H = (int(v) for v in args.res.split("x"))
r = scene.render
r.engine = "CYCLES"
r.resolution_x, r.resolution_y = W, H
r.resolution_percentage = 100
r.film_transparent = False
r.use_persistent_data = True
cy = scene.cycles
cy.device = "CPU"
cy.samples = args.samples or (24 if args.preview else 64)
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.035 if not args.preview else 0.1
cy.use_denoising = True
try:
    cy.denoiser = "OPENIMAGEDENOISE"
except Exception:
    pass
cy.max_bounces = 4
cy.diffuse_bounces = 1
cy.glossy_bounces = 2
cy.transmission_bounces = 2
cy.transparent_max_bounces = 4
cy.volume_bounces = 0
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.sample_clamp_indirect = 6.0
cy.blur_glossy = 0.6
if args.threads:
    r.threads_mode = "FIXED"
    r.threads = args.threads
scene.view_settings.view_transform = "Standard"
vl = scene.view_layers[0]
vl.use_pass_z = True

fmt = r.image_settings
try:
    fmt.media_type = "MULTI_LAYER_IMAGE"
except Exception:
    pass
try:
    fmt.file_format = "OPEN_EXR_MULTILAYER"
except Exception:
    fmt.file_format = "OPEN_EXR"
fmt.color_depth = "16"
fmt.exr_codec = "ZIP"

for mname in ("root", "root-deep", "fiber", "mote-lav", "mote-orchid", "aura"):
    bpy.data.materials[mname].cycles.emission_sampling = "NONE"
vl.cycles.denoising_store_passes = False

if args.save_blend:
    bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)

if args.mark_blend:
    # Solo el símbolo: fuera el túnel (raíces, fibras, luces del túnel, motas).
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("roots", "fibers", "glow-", "motes-", "tun")):
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.orphans_purge(do_recursive=True)
    place_camera(FRAMES - 1)
    fmt.media_type = "IMAGE"
    fmt.file_format = "PNG"
    fmt.color_depth = "16"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.mark_blend), compress=True)
    sys.exit(0)

if not args.out:
    sys.exit("Falta --out")
os.makedirs(args.out, exist_ok=True)
frames = [int(v) for v in args.frames.split(",")] if args.frames else list(range(FRAMES))
for f in frames:
    dst = os.path.join(args.out, f"f{f:03d}.exr")
    if os.path.exists(dst):
        continue
    place_camera(f)
    r.filepath = dst
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"frame {f} {time.time() - t0:.1f}s", flush=True)
