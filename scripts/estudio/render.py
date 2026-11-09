"""Aterna Studio: three Blender light glyphs, matching PILLAR_GLYPHS.

Blender 5.2.3 LTS / Cycles. No external Python packages or image assets.
Usage: blender -b -t 8 --python scripts/estudio/render.py -- --frames-dir /tmp/aterna-estudio
"""

import argparse
import bisect
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

FPS = 30
COUNTS = {1: 114, 2: 114, 3: 126}
POSTERS = {1: 74, 2: 52, 3: 105}
PALETTE = ("4b55d6", "9aa3ff", "9a5cf0", "d77cf5")
FILAMENT_RADIUS = 0.018
NODE_RADIUS = 0.17
SCALE = 0.085


def linear_color(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb) + (1,)


def point(x, y=20, z=0):
    return Vector(((x - 44) * SCALE, (20 - y) * SCALE, z))


def smooth(x):
    x = max(0, min(1, x))
    return x * x * x * (x * (x * 6 - 15) + 10)


def beat(t, at):
    # Trace.tsx beatAt: rise at at-.02, peak at at+.05, rest at at+.32.
    a, b, c = max(0, at - .02), at + .05, min(1, at + .32)
    if t <= a or t >= c:
        return 0.0
    if t <= b:
        return smooth((t - a) / (b - a))
    return 1 - smooth((t - b) / (c - b))


def math_node(tree, operation, a=None, b=None):
    n = tree.nodes.new("ShaderNodeMath")
    n.operation = operation
    for i, value in enumerate((a, b)):
        if value is not None:
            if isinstance(value, (int, float)):
                n.inputs[i].default_value = value
            else:
                tree.links.new(value, n.inputs[i])
    return n.outputs[0]


def color_ramp(tree, source, stops):
    n = tree.nodes.new("ShaderNodeValToRGB")
    ramp = n.color_ramp
    for i, (position, color) in enumerate(stops):
        e = ramp.elements[i] if i < 2 else ramp.elements.new(position)
        e.position, e.color = position, color
    ramp.interpolation = "EASE"
    tree.links.new(source, n.inputs[0])
    return n.outputs[0]


def view_facing(tree):
    geometry = tree.nodes.new("ShaderNodeNewGeometry")
    dot = tree.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    tree.links.new(geometry.outputs["Normal"], dot.inputs[0])
    tree.links.new(geometry.outputs["Incoming"], dot.inputs[1])
    return math_node(tree, "ABSOLUTE", dot.outputs["Value"])


def new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    return mat, tree, out


def strand_material(name, length):
    mat, tree, out = new_material(name)
    geo = tree.nodes.new("ShaderNodeNewGeometry")
    xyz = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(geo.outputs["Position"], xyz.inputs[0])
    normalized_x = math_node(tree, "DIVIDE", math_node(tree, "ADD", xyz.outputs["X"], 44 * SCALE), 88 * SCALE)
    color = color_ramp(tree, normalized_x, [(p, linear_color(c)) for p, c in zip((0, .35, .7, 1), PALETTE)])
    uv = tree.nodes.new("ShaderNodeUVMap")
    uv.uv_map = "Travel"
    uv_split = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(uv.outputs[0], uv_split.inputs[0])
    head = tree.nodes.new("ShaderNodeValue")
    head.name = "Pulse head"
    head.outputs[0].default_value = -1
    # A compact raised cosine trail. Both ends have zero slope; no hard dash edges.
    offset = math_node(tree, "SUBTRACT", head.outputs[0], uv_split.outputs["X"])
    ratio = math_node(tree, "DIVIDE", offset, length)
    lower = math_node(tree, "MAXIMUM", ratio, 0)
    upper = math_node(tree, "MINIMUM", lower, 1)
    sine = math_node(tree, "SINE", math_node(tree, "MULTIPLY", upper, math.pi))
    energy = math_node(tree, "ADD", .9, math_node(tree, "MULTIPLY", math_node(tree, "POWER", sine, 2), 8))
    roundness = math_node(tree, "ADD", .28, math_node(tree, "MULTIPLY", view_facing(tree), .72))
    energy = math_node(tree, "MULTIPLY", energy, roundness)
    emit = tree.nodes.new("ShaderNodeEmission")
    tree.links.new(color, emit.inputs["Color"])
    tree.links.new(energy, emit.inputs["Strength"])
    tree.links.new(emit.outputs[0], out.inputs["Surface"])
    return mat, head.outputs[0]


def resample(points, count=241):
    distances = [0]
    for a, b in zip(points, points[1:]):
        distances.append(distances[-1] + (b - a).length)
    result = []
    for i in range(count):
        target = distances[-1] * i / (count - 1)
        j = min(len(points) - 2, max(0, bisect.bisect_right(distances, target) - 1))
        u = (target - distances[j]) / (distances[j + 1] - distances[j])
        result.append(points[j].lerp(points[j + 1], u))
    return result


def tube(name, points, material, radius=FILAMENT_RADIUS):
    # Real round geometry, with arc-length UVs so the light travels at constant speed.
    points = resample(points)
    sides = 12
    verts, faces = [], []
    for i, p in enumerate(points):
        tangent = (points[min(i + 1, len(points) - 1)] - points[max(i - 1, 0)]).normalized()
        axis = tangent.cross(Vector((0, 0, 1))).normalized()
        normal = tangent.cross(axis).normalized()
        for j in range(sides):
            theta = 2 * math.pi * j / sides
            verts.append(p + radius * (axis * math.cos(theta) + normal * math.sin(theta)))
    for i in range(len(points) - 1):
        for j in range(sides):
            k = (j + 1) % sides
            faces.append((i * sides + j, i * sides + k, (i + 1) * sides + k, (i + 1) * sides + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="Travel")
    for face in mesh.polygons:
        face.use_smooth = True
        for loop_i in face.loop_indices:
            v = mesh.loops[loop_i].vertex_index
            uv.data[loop_i].uv = (v // sides / (len(points) - 1), (v % sides) / sides)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    return obj


def sphere(name, position, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=radius, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def orb(name, position, radius, at):
    mat, tree, out = new_material(name + " / luminous glass")
    rim = math_node(tree, "POWER", math_node(tree, "SUBTRACT", 1, view_facing(tree)), 2.5)
    level = tree.nodes.new("ShaderNodeValue")
    level.name = "Beat"
    strength = math_node(tree, "MULTIPLY", math_node(tree, "ADD", .25, math_node(tree, "MULTIPLY", level.outputs[0], .9)), math_node(tree, "ADD", .03, rim))
    emit = tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear_color(PALETTE[3])
    tree.links.new(strength, emit.inputs["Strength"])
    transparent = tree.nodes.new("ShaderNodeBsdfTransparent")
    add = tree.nodes.new("ShaderNodeAddShader")
    tree.links.new(transparent.outputs[0], add.inputs[0])
    tree.links.new(emit.outputs[0], add.inputs[1])
    tree.links.new(add.outputs[0], out.inputs[0])
    shell = sphere(name + " / shell", position, radius, mat)

    core_mat, ct, co = new_material(name + " / core")
    facing = view_facing(ct)
    color = color_ramp(ct, math_node(ct, "SUBTRACT", 1, facing), [(0, linear_color("fff3ff")), (.32, linear_color(PALETTE[3])), (1, linear_color(PALETTE[2]))])
    core_emit = ct.nodes.new("ShaderNodeEmission")
    ct.links.new(color, core_emit.inputs[0])
    core_level = ct.nodes.new("ShaderNodeValue")
    core_level.name = "Core energy"
    radial = math_node(ct, "POWER", facing, 4)
    ct.links.new(math_node(ct, "MULTIPLY", core_level.outputs[0], math_node(ct, "ADD", .015, radial)), core_emit.inputs[1])
    ct.links.new(core_emit.outputs[0], co.inputs[0])
    core = sphere(name + " / inner light", position + Vector((-.04, .04, .05)) * radius, radius * .84, core_mat)
    glint_mat, gt, go = new_material(name + " / glint")
    glint_emit = gt.nodes.new("ShaderNodeEmission")
    glint_emit.inputs[0].default_value = linear_color("fff3ff")
    gt.links.new(glint_emit.outputs[0], go.inputs[0])
    glint = sphere(name + " / reflection", position + Vector((-.32, .38, .82)) * radius, radius * .09, glint_mat)
    return {"objects": (shell, core, glint), "level": level.outputs[0], "core": core_level.outputs[0], "glint": glint_emit.inputs[1], "at": at}


def cubic(y):
    control = [point(0, y, .05 if y < 20 else -.05), point(26, y, .16 if y < 20 else -.16), point(26, 20, .09 if y < 20 else -.09), point(48)]
    return [sum((control[j] * [((1 - t) ** 3), 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3][j] for j in range(4)), Vector()) for t in [i / 300 for i in range(301)]]


def setup_scene(samples):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    scene.cycles.use_adaptive_sampling = False
    scene.cycles.seed = 17
    scene.cycles.use_animated_seed = False
    scene.cycles.max_bounces = 0
    scene.cycles.transparent_max_bounces = 8
    scene.render.resolution_x, scene.render.resolution_y = 960, 400
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 30
    scene.render.dither_intensity = 0
    scene.render.use_compositing = True
    scene.render.use_persistent_data = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    world = bpy.data.worlds.new("Pure black / no environment")
    world.use_nodes = True
    world.node_tree.nodes.get("Background").inputs["Color"].default_value = (0, 0, 0, 1)
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0
    scene.world = world
    bpy.ops.object.camera_add(location=(0, -.7, 14.7))
    camera = bpy.context.object
    camera.name = "Shared perspective camera / 50mm"
    camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "PERSP"
    camera.data.lens = 50
    camera.data.sensor_width = 36
    camera.data.dof.use_dof = False
    scene.camera = camera
    comp = bpy.data.node_groups.new("Light only / optical bloom", "CompositorNodeTree")
    scene.compositing_node_group = comp
    comp.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    layers = comp.nodes.new("CompositorNodeRLayers")
    glare = comp.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Fog Glow"
    glare.inputs["Quality"].default_value = "High"
    glare.inputs["Threshold"].default_value = .12
    glare.inputs["Smoothness"].default_value = .2
    glare.inputs["Strength"].default_value = 2.4
    glare.inputs["Size"].default_value = .38
    comp.links.new(layers.outputs["Image"], glare.inputs["Image"])
    output = comp.nodes.new("NodeGroupOutput")
    comp.links.new(glare.outputs["Image"], output.inputs["Image"])
    return scene


def build(pillar, samples):
    scene = setup_scene(samples)
    scene.name = f"Pillar {pillar}"
    scene.frame_start = 0
    scene.frame_end = COUNTS[pillar] - 1
    pulses, orbs = [], []

    def strand(name, points, start, end, length):
        material, head = strand_material(name, length)
        tube(name, points, material)
        pulses.append((head, start, end))

    if pillar == 1:
        strand("Design", cubic(6), 0, .34, .3)
        strand("Code", cubic(34), 0, .34, .3)
        strand("One continuous thread", [point(48), point(88)], .36, .6, .35)
        orbs.append(orb("Merge", point(48), NODE_RADIUS * .48, .35))
        orbs.append(orb("Result", point(88), NODE_RADIUS, .6))
    elif pillar == 2:
        strand("Your code", [point(0), point(52)], 0, .32, .3)
        orbs.append(orb("Handover", point(52), NODE_RADIUS, .32))
        for i, x in enumerate((64, 75, 86)):
            orbs.append(orb(f"Continuation {i + 1}", point(x), NODE_RADIUS * .48, (.44, .54, .64)[i]))
    else:
        strand("Attention", [point(0), point(61)], 0, .28, .3)
        # Trace.ring starts at the leftmost point and travels clockwise.
        # The depth tilt leaves that shared entry point fixed.
        points = []
        tilt = math.radians(24)
        for i in range(401):
            a = math.pi - 2 * math.pi * i / 400
            points.append(point(74 + 13 * math.cos(a), 20 - 13 * math.sin(a) * math.cos(tilt), 13 * SCALE * math.sin(a) * math.sin(tilt)))
        strand("Protected attention / clockwise", points, .3, .76, .2)
        orbs.append(orb("One project", point(74), NODE_RADIUS, .78))
    return scene, pulses, orbs


def update(t, pulses, orbs):
    t = t % 1.0
    for head, start, end in pulses:
        head.default_value = (t - start) * 1.12 / (end - start) - .12
    for orb_data in orbs:
        energy = beat(t, orb_data["at"])
        orb_data["level"].default_value = energy
        orb_data["core"].default_value = .65 + 3.2 * energy
        orb_data["glint"].default_value = .7 + 3 * energy
        for obj in orb_data["objects"]:
            obj.scale = (1 + .12 * energy,) * 3


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", type=Path, default=Path("/tmp/aterna-estudio"))
    parser.add_argument("--pillar", type=int, choices=(1, 2, 3))
    parser.add_argument("--frame", type=int, help="Render one frame, including N for seam verification")
    parser.add_argument("--samples", type=int, default=96)
    parser.add_argument("--save-blend-dir", type=Path, help="Optional snapshots of each scene at the poster frame")
    opts = parser.parse_args(args)
    opts.frames_dir.mkdir(parents=True, exist_ok=True)
    for pillar in (opts.pillar,) if opts.pillar else (1, 2, 3):
        scene, pulses, orbs = build(pillar, opts.samples)
        directory = opts.frames_dir / f"pillar-{pillar}"
        directory.mkdir(parents=True, exist_ok=True)
        if opts.save_blend_dir:
            opts.save_blend_dir.mkdir(parents=True, exist_ok=True)
            update(POSTERS[pillar] / COUNTS[pillar], pulses, orbs)
            bpy.ops.wm.save_as_mainfile(filepath=str((opts.save_blend_dir / f"pillar-{pillar}.blend").resolve()))
        for frame in [opts.frame] if opts.frame is not None else range(COUNTS[pillar]):
            scene.frame_set(frame)
            update(frame / COUNTS[pillar], pulses, orbs)
            scene.render.filepath = str((directory / f"{frame:04d}.png").resolve())
            print(f"ATERNA pillar={pillar} frame={frame}/{COUNTS[pillar]} phase={frame / COUNTS[pillar]:.6f}", flush=True)
            bpy.ops.render.render(write_still=True)
    (opts.frames_dir / "render-info.json").write_text(json.dumps({"blender": bpy.app.version_string, "engine": "Cycles", "samples": opts.samples, "fps": FPS, "frames": COUNTS, "posters": POSTERS, "size": [960, 400]}, indent=2) + "\n")


if __name__ == "__main__":
    main()
