"""Quien diseña, programa — deterministic Blender point-cloud source.

Blender 5.2.3 LTS; bundled NumPy only. FFmpeg is used for WebP/MP4.
Run from the repository root. See README.md for commands and binary contract.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

N = 7200
SEED = 20261109
SCALES = np.array([1.0, 0.42, 0.35])
PALETTE = ("4b55d6", "9aa3ff", "9a5cf0", "d77cf5")
COUNTS = (2400, 3000, 1320, 120, 360)
GROUPS = {
    "0": "Diseño: imagen, estructura y bloques; hebra superior al entrar en B.",
    "1": "Código: símbolo </> y líneas sangradas; hebra inferior; contenido final.",
    "2": "Marco y cabecera: ventana A y C, viajan con la hebra de diseño en B.",
    "3": "Atención: acento del código A, extremo de la hebra B, nodo de esquina C.",
    "4": "Polvo ambiental: 360 puntos (5 %), mismos lugares en los tres estados.",
}
ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / "public/estudio/v2/pillar-1"
SOURCE = Path(__file__).resolve().parent
TAU = math.tau


def smooth(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * t * (t * (6 * t - 15) + 10)


def path(points, n, rng, width=0.0022, depth=0.009):
    """Stratified arc-length sampling: no invisible render-only line geometry."""
    points = np.array([(*p, 0) if len(p) == 2 else p for p in points], float)
    lengths = np.linalg.norm(np.diff(points, axis=0), axis=1)
    acc = np.r_[0, np.cumsum(lengths)]
    u = (np.arange(n) + rng.random(n)) / n * acc[-1]
    j = np.clip(np.searchsorted(acc, u, side="right") - 1, 0, len(lengths) - 1)
    f = (u - acc[j]) / lengths[j]
    p = points[j] + f[:, None] * (points[j + 1] - points[j])
    noise = np.clip(rng.normal(size=(n, 3)), -2.4, 2.4)
    p += noise * [width, width, depth]
    return p


def rect(x0, y0, x1, y1, radius=0.012):
    pts = []
    for cx, cy, angle in [(x1-radius, y1-radius, 0), (x0+radius, y1-radius, 90),
                          (x0+radius, y0+radius, 180), (x1-radius, y0+radius, 270)]:
        for a in np.linspace(angle, angle+90, 12):
            a = math.radians(a)
            pts.append((cx+radius*math.cos(a), cy+radius*math.sin(a)))
    return pts + pts[:1]


def circle(cx, cy, radius, n=80):
    return [(cx+radius*math.cos(a), cy+radius*math.sin(a)) for a in np.linspace(0, TAU, n)]


def patch(x0, y0, x1, y1, n, rng):
    # A loose interior, never a solid surface. The edges get a separate denser pass.
    return np.column_stack((rng.uniform(x0, x1, n), rng.uniform(y0, y1, n), rng.normal(0, .018, n)))


def window_depth(p):
    p = p.copy()
    p[:, 2] += .058 * np.cos((p[:, 0]-.1)*2.2) + .095*p[:, 0] + .09*p[:, 1]
    return p


def design_to_a(p):
    p = p.copy()
    p[:, 0] = -.84 + (p[:, 0]+.56)/1.38*1.27
    p[:, 1] = .085 + (p[:, 1]+.31)/.62*.28
    p[:, 2] = p[:, 2]*.65 - .035
    return p


def spatial_pair(source, target):
    """Balanced spatial partition, then local nearest-neighbor assignment.

    Keeps left/right zones and indentation neighbors together; never random shuffles.
    Returns target reordered into the source identity order.
    """
    out = np.empty_like(target)
    def visit(si, ti, depth=0):
        if len(si) <= 12:
            available = list(ti)
            for i in si:
                a = source[i] * [1, 1.4, .3]
                q = target[available] * [1, 1.4, .3]
                j = int(np.argmin(np.sum((q-a)**2, axis=1)))
                out[i] = target[available.pop(j)]
            return
        axis = (0, 1, 0, 2)[depth % 4]
        si = si[np.argsort(source[si, axis], kind="stable")]
        ti = ti[np.argsort(target[ti, axis], kind="stable")]
        m = len(si)//2
        visit(si[:m], ti[:m], depth+1)
        visit(si[m:], ti[m:], depth+1)
    # Normalize both layouts before pairing; the code and final text differ in size.
    sn = (source-source.min(0))/np.maximum(np.ptp(source, axis=0), 1e-9)
    tn = (target-target.min(0))/np.maximum(np.ptp(target, axis=0), 1e-9)
    original_target = target
    source, target = sn, tn
    visit(np.arange(len(source)), np.arange(len(target)))
    # Recover original coordinates without a floating point lookup.
    return out*np.maximum(np.ptp(original_target, axis=0), 1e-9)+original_target.min(0)


def make_clouds():
    rng = np.random.Generator(np.random.PCG64(SEED))
    # C: one completed browser. Every visible detail is a collection of particles.
    design = np.vstack([
        path(rect(-.46,-.155,.055,.155), 590, rng),
        path([(-.445,-.11),(-.29,.078),(-.17,-.05),(-.085,.035),(.04,-.11)], 320, rng, .0035),
        path(circle(-.065,.09,.025), 120, rng, .002),
        patch(-.445,-.14,.04,.14, 110, rng),
        *[path([(.16,y),(end,y)],100,rng,.002) for y,end in [(.177,.65),(.132,.52),(.064,.68),(.027,.625)]],
        path(rect(-.46,-.257,-.245,-.205,.007), 210, rng),
        path(rect(-.205,-.257,.055,-.205,.007), 210, rng),
        path([(-.44,.195),(-.13,.195)], 260, rng, .003),
        path([(-.09,.195),(.04,.195)], 180, rng, .002),
    ])
    assert len(design) == COUNTS[0]
    content = [path([(.16,.177),(.65,.177)], 430,rng,.0045),
               path([(.16,.132),(.52,.132)], 320,rng,.0038)]
    for y, end, count in [(.064,.68,250),(.027,.625,240),(-.01,.66,240),(-.047,.55,220)]:
        content.append(path([(.16,y),(end,y)],count,rng,.0024))
    content += [path(rect(.16,-.168,.46,-.102,.013),480,rng,.0025),
                patch(.175,-.155,.445,-.115,160,rng),
                path([(.22,-.135),(.38,-.135)],180,rng,.002),
                path([(.16,-.233),(.41,-.233)],180,rng),
                path([(.47,-.233),(.68,-.233)],150,rng),
                path([(.55,-.15),(.59,-.11),(.63,-.15)],150,rng)]
    content = np.vstack(content)
    assert len(content) == COUNTS[1]
    frame = np.vstack([
        path(rect(-.56,-.31,.82,.31,.025), 920, rng,.0021),
        path([(-.55,.242),(.81,.242)], 230,rng,.0018),
        *[path(circle(x,.276,.007), 30,rng,.0014,.006) for x in [-.505,-.47,-.435]],
        path([(-.32,.276),(.21,.276)],80,rng,.0014,.006),
    ])
    assert len(frame) == COUNTS[2]
    # A: code is explicitly legible as </>, plus indented rows to its right.
    code = [path([(-.64,-.125),(-.77,-.205),(-.64,-.285)],400,rng,.0028),
            path([(-.48,-.105),(-.57,-.305)],380,rng,.003),
            path([(-.405,-.125),(-.275,-.205),(-.405,-.285)],400,rng,.0028)]
    for y, start, lengths, count in [(-.09,-.15,[.13,.10],290),
                                    (-.135,-.105,[.18,.12],340),
                                    (-.18,-.06,[.13,.15],340),
                                    (-.225,-.06,[.19,.07],320),
                                    (-.27,-.105,[.16,.10],290),
                                    (-.315,-.15,[.12,.08],240)]:
        n0 = int(count*.57)
        code.append(path([(start,y),(start+lengths[0],y)],n0,rng,.0025))
        x = start+lengths[0]+.025
        code.append(path([(x,y),(x+lengths[1],y)],count-n0,rng,.0025))
    code = np.vstack(code)
    code[:,2] += -.06 + .065*np.sin(code[:,0]*5)
    assert len(code) == COUNTS[1]
    design, content, frame = map(window_depth, (design, content, frame))
    # The code gains the final page's text and action. Spatial matching keeps zones.
    content = spatial_pair(code, content)
    # The person is a luminous constellation, with a near-white core, not a solid orb.
    theta = np.arange(90)*math.pi*(3-math.sqrt(5))
    rad = .023*np.sqrt((np.arange(90)+.5)/90)
    node = np.column_stack((.82+rad*np.cos(theta), .31+rad*np.sin(theta),
                            .15+np.sqrt(np.maximum(0,.023**2-rad**2))))
    node = np.vstack([node, path(circle(.82,.31,.043),30,rng,.0015,.008)+[0,0,.15]])
    node_a = path([(.18,-.315),(.225,-.315),(.235,-.30)],120,rng,.0025,.01)
    dust = np.column_stack((rng.uniform(-.96,.96,360),rng.uniform(-.39,.39,360),rng.uniform(-.31,.31,360)))
    a = np.vstack([design_to_a(design),code,design_to_a(frame),node_a,dust])
    c = np.vstack([design,content,frame,node,dust])
    group = np.repeat(np.arange(5,dtype=np.uint8),COUNTS)
    b = np.empty_like(a)
    # Pool frame + design before ranking so they make ONE continuous first strand.
    # Rank x is stable. Locally y/z-ranked points remain neighbors along the tube.
    for strand, mask in [(0,(group==0)|(group==2)),(1,group==1)]:
        ids = np.flatnonzero(mask)
        order = np.argsort(a[ids,0]*.78+c[ids,0]*.22,kind="stable")
        ids = ids[order]
        t = (np.arange(len(ids))+.5)/len(ids)
        angle = TAU*1.65*smooth(t)+strand*math.pi
        envelope = .225*(.90+.10*np.sin(math.pi*t))
        offsets = np.clip(rng.normal(size=(len(ids),3)),-2.6,2.6)
        b[ids,0] = -.86+1.72*t+offsets[:,0]*.003
        b[ids,1] = envelope*np.cos(angle)+offsets[:,1]*.013
        b[ids,2] = .245*np.sin(angle)+offsets[:,2]*.014
    node_ids = np.flatnonzero(group==3)
    t = np.linspace(.94,.998,len(node_ids))
    angle = TAU*1.65*smooth(t)+math.pi
    b[node_ids] = np.column_stack((-.86+1.72*t,.225*(.90+.10*np.sin(math.pi*t))*np.cos(angle),.245*np.sin(angle)))
    b[node_ids] += rng.normal(size=(len(node_ids),3))*[.003,.007,.007]
    b[group==4] = dust
    # Canonical C gradient. State A tint is derived from the same byte + group (README).
    tone = np.clip(((c[:,0]+.56)/1.38*.68+(c[:,1]+.31)/.62*.32)*255,0,255)
    size = 42+np.power(rng.random(N),2.6)*128
    size[group==4] = rng.uniform(12,54,360)
    size[group==3] = np.r_[np.linspace(255,202,90),np.full(30,205)]
    kind = np.where(group==4,1,np.where(group==3,2,0))
    tone[group==3] = 255
    attr = np.column_stack((np.rint(tone),np.rint(size),kind,group)).astype(np.uint8)
    states = {"a":a,"b":b,"c":c}
    for name, p in states.items():
        assert p.shape == (N,3) and np.isfinite(p).all(), name
        assert (np.abs(p)<=SCALES).all(), (name,np.abs(p).max(0))
    return states, attr


def export(states, attr, directory):
    directory.mkdir(parents=True,exist_ok=True)
    # Explicit little-endian; symmetric nearest rounding, halves away from zero.
    for name,p in states.items():
        v = p/SCALES*32767
        q = (np.sign(v)*np.floor(np.abs(v)+.5)).astype("<i2")
        assert np.all(np.abs(q.astype(float)/32767*SCALES-p) <= SCALES/65534+1e-12)
        (directory/f"state-{name}.bin").write_bytes(q.tobytes(order="C"))
    (directory/"attr.bin").write_bytes(attr.tobytes(order="C"))
    manifest = {
        "version":1,"count":N,"scales":SCALES.tolist(),"states":["a","b","c"],"groups":GROUPS,
        "notes":"Semilla 20261109, PCG64. XYZ int16 LE intercalado; coord=q/32767*escala. "
                "A/B/C comparten identidad y orden. Diseño/marco conservan UV; código se empareja por "
                "particiones espaciales; hebras ordenadas por X. 5 % polvo fijo. "
                "attr RGBA uint8 = tono, tamaño, tipo, grupo. Tono canónico del estado C: "
                "0 índigo, 85 lavanda, 170 violeta, 255 orquídea. El README especifica el matiz "
                "semántico A, el radio y la energía de referencia. Y arriba; cámara desde +Z. "
                "No barajar ni volver a ordenar ningún archivo. Preview de referencia, no para carga web.",
        "seed":SEED,"palette":["#"+c for c in PALETTE],
        "layout":{"aspect":[12,5],"camera":"orthographic +Z, width 2.18, look at origin"},
        "groupCounts":{str(i):n for i,n in enumerate(COUNTS)},
        "sha256":{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(directory.glob("*.bin"))},
    }
    (directory/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")


def linear_hex(h):
    c = np.array([int(h[i:i+2],16)/255 for i in [0,2,4]])
    return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)


def point_appearance(attr, phase, pulse=0):
    tone = attr[:,0].astype(float)/255
    group, size = attr[:,3],attr[:,1].astype(float)/255
    # During A, design is blue/lavender and code is violet. Blend to canonical tone.
    semantic = np.where((group==0)|(group==2), .08+tone*.28, .58+tone*.12)
    semantic[group==4] = tone[group==4]
    tone = semantic*(1-phase)+tone*phase
    palette = np.array([linear_hex(c) for c in PALETTE])
    at = np.clip(tone*3,0,3)
    index = np.minimum(at.astype(int),2)
    frac = at-index
    rgb = palette[index]*(1-frac[:,None])+palette[index+1]*frac[:,None]
    radius = .00065+size**1.6*.0014
    energy = 1.3+2.0*size
    dust = group==4
    radius[dust] *= .7
    energy[dust] *= .27
    node = group==3
    # Node is assembled from light points. High-size central points become near white.
    core = np.clip((size[node]-.84)/.16,0,1)**1.6
    rgb[node] = rgb[node]*(1-core[:,None]*.82*phase)+linear_hex("fff5ff")*core[:,None]*.82*phase
    radius[node] = (.00085+size[node]*.0009)*(1+.2*pulse)
    energy[node] = (1.4+phase*2.6)*(1+.55*pulse)
    return radius, np.column_stack((rgb*energy[:,None],np.ones(N)))


def choose_device(scene, requested):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    if requested != "cpu":
        try:
            prefs.compute_device_type="OPTIX"
            prefs.get_devices()
            optix = [d for d in prefs.devices if d.type=="OPTIX"]
            if optix:
                for d in prefs.devices: d.use = d.type=="OPTIX"
                scene.cycles.device="GPU"
                return "OPTIX: "+", ".join(d.name for d in optix)
        except (TypeError,RuntimeError):
            pass
        if requested=="optix":
            raise RuntimeError("OptiX solicitado pero no hay dispositivo NVIDIA disponible")
    scene.cycles.device="CPU"
    return "CPU"


def setup(states,attr,samples,device):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.name="Aterna / 01 Quien diseña, programa"
    scene.render.engine="CYCLES"
    device_name=choose_device(scene,device)
    scene.cycles.samples=samples
    scene.cycles.seed=SEED
    scene.cycles.use_animated_seed=False
    scene.cycles.use_adaptive_sampling=False
    scene.cycles.use_denoising=False
    scene.cycles.max_bounces=0
    scene.render.resolution_x,scene.render.resolution_y=1920,800
    scene.render.resolution_percentage=100
    scene.render.fps=30
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGB"
    scene.render.image_settings.color_depth="8"
    scene.render.image_settings.compression=30
    scene.render.film_transparent=False
    scene.render.dither_intensity=0
    scene.render.use_persistent_data=True
    scene.view_settings.view_transform="Standard"
    scene.view_settings.look="None"
    world=bpy.data.worlds.new("Black / only emitted points")
    world.use_nodes=True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value=0
    scene.world=world
    camera_data=bpy.data.cameras.new("12:5 / slight mouse orbit possible")
    camera=bpy.data.objects.new("Camera",camera_data)
    scene.collection.objects.link(camera)
    camera.location=(0,0,4)
    camera.data.type="ORTHO"
    camera.data.ortho_scale=2.18
    scene.camera=camera
    mesh=bpy.data.meshes.new("7200 stable particle identities")
    mesh.from_pydata(states["a"].tolist(),[],[])
    obj=bpy.data.objects.new("Light points / A → B → C",mesh)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    for name in ("a","b","c"):
        key=obj.shape_key_add(name={"a":"A / dos caminos","b":"B / se trenzan","c":"C / una sola pieza"}[name])
        key.data.foreach_set("co",states[name].astype(np.float32).ravel())
    radius=mesh.attributes.new("point_radius","FLOAT","POINT")
    color=mesh.color_attributes.new(name="emission",type="FLOAT_COLOR",domain="POINT")
    for label,col in [("tone",0),("size",1),("kind",2),("group",3)]:
        field=mesh.attributes.new(label,"INT","POINT")
        field.data.foreach_set("value",attr[:,col].astype(np.int32))
    mat=bpy.data.materials.new("Brand light / no solid surfaces")
    mat.use_nodes=True
    nt=mat.node_tree
    nt.nodes.clear()
    inp=nt.nodes.new("ShaderNodeAttribute")
    inp.attribute_name="emission"
    emit=nt.nodes.new("ShaderNodeEmission")
    nt.links.new(inp.outputs["Color"],emit.inputs["Color"])
    emit.inputs["Strength"].default_value=1
    out=nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs[0],out.inputs["Surface"])
    geo=bpy.data.node_groups.new("Vertices → true Cycles point cloud","GeometryNodeTree")
    geo.interface.new_socket(name="Geometry",in_out="INPUT",socket_type="NodeSocketGeometry")
    geo.interface.new_socket(name="Geometry",in_out="OUTPUT",socket_type="NodeSocketGeometry")
    gi=geo.nodes.new("NodeGroupInput")
    go=geo.nodes.new("NodeGroupOutput")
    points=geo.nodes.new("GeometryNodeMeshToPoints")
    points.mode="VERTICES"
    field=geo.nodes.new("GeometryNodeInputNamedAttribute")
    field.data_type="FLOAT"
    field.inputs["Name"].default_value="point_radius"
    geo.links.new(gi.outputs["Geometry"],points.inputs["Mesh"])
    geo.links.new(field.outputs["Attribute"],points.inputs["Radius"])
    material=geo.nodes.new("GeometryNodeSetMaterial")
    material.inputs["Material"].default_value=mat
    geo.links.new(points.outputs["Points"],material.inputs["Geometry"])
    geo.links.new(material.outputs["Geometry"],go.inputs["Geometry"])
    obj.modifiers.new("Only points / no connecting edges","NODES").node_group=geo
    comp=bpy.data.node_groups.new("Optical bloom / black retained","CompositorNodeTree")
    scene.compositing_node_group=comp
    comp.interface.new_socket(name="Image",in_out="OUTPUT",socket_type="NodeSocketColor")
    layers=comp.nodes.new("CompositorNodeRLayers")
    glare=comp.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value="Fog Glow"
    glare.inputs["Quality"].default_value="High"
    glare.inputs["Threshold"].default_value=.5
    glare.inputs["Smoothness"].default_value=.2
    glare.inputs["Strength"].default_value=.9
    glare.inputs["Size"].default_value=.18
    comp.links.new(layers.outputs["Image"],glare.inputs["Image"])
    output=comp.nodes.new("NodeGroupOutput")
    comp.links.new(glare.outputs["Image"],output.inputs["Image"])
    scene.frame_start,scene.frame_end=0,179
    scene["seed"],scene["count"],scene["render_device"]=SEED,N,device_name
    for frame,name in [(0,"A / dos caminos"),(75,"B / se trenzan"),(156,"C / una sola pieza")]:
        scene.timeline_markers.new(name,frame=frame)
    return scene,obj,radius,color,device_name


def weights(frame):
    ab=float(smooth((frame-24)/51))
    bc=float(smooth((frame-99)/57))
    return ab*(1-bc),bc


def update(scene,obj,radius,color,attr,frame):
    wb,wc=weights(frame)
    obj.data.shape_keys.key_blocks[1].value=wb
    obj.data.shape_keys.key_blocks[2].value=wc
    phase=wb*.5+wc
    pulse=wc*math.sin(math.pi*max(0,frame-156)/23)**2
    rad,col=point_appearance(attr,phase,pulse)
    radius.data.foreach_set("value",rad.astype(np.float32))
    color.data.foreach_set("color",col.astype(np.float32).ravel())
    # A gentle hover demonstration ONLY while B is held; all endpoints face front.
    orbit=math.sin(math.pi*np.clip((frame-75)/24,0,1))*.12 if 75<=frame<=99 else 0
    scene.camera.location=(orbit*4,orbit*.8,4)
    # Explicit world-up frame: no roll ambiguity when looking almost along Z.
    back=scene.camera.location.normalized()
    right=Vector((0,1,0)).cross(back).normalized()
    up=back.cross(right).normalized()
    scene.camera.rotation_euler=Matrix((right,up,back)).transposed().to_euler()
    obj.data.update()
    scene.frame_set(frame)


def encode(opts):
    if opts.mode=="poster":
        subprocess.run(["ffmpeg","-v","error","-y","-i",str(opts.frames_dir/"0156.png"),
                        "-c:v","libwebp","-lossless","1","-compression_level","6",
                        str(opts.output/"poster.webp")],check=True)
    elif opts.mode=="preview":
        temporary=opts.frames_dir/"preview.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-framerate","30","-start_number","0",
                        "-i",str(opts.frames_dir/"%04d.png"),"-frames:v","180","-an","-c:v","libx264",
                        "-preset","slow","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",
                        str(temporary)],check=True)
        target=opts.output/"preview.mp4" if temporary.stat().st_size<=3_000_000 else SOURCE/"preview.mp4"
        target.write_bytes(temporary.read_bytes())
        print("PREVIEW",str(target),target.stat().st_size,flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode",choices=("export","stills","poster","preview"),default="export")
    parser.add_argument("--output",type=Path,default=PUBLIC)
    parser.add_argument("--frames-dir",type=Path,default=Path("/tmp/aterna-pillar-1"))
    parser.add_argument("--samples",type=int,default=32)
    parser.add_argument("--device",choices=("auto","cpu","optix"),default="auto")
    parser.add_argument("--frames",help="Comma-separated frame indices for QA or resume; disables encoding")
    parser.add_argument("--save-blend",type=Path)
    opts=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    states,attr=make_clouds()
    export(states,attr,opts.output)
    # Exact repeatability check, including ordering, before any render.
    repeated,attrs2=make_clouds()
    assert np.array_equal(attr,attrs2)
    assert all(np.array_equal(states[s],repeated[s]) for s in states)
    if opts.mode=="export" and not opts.save_blend:
        print("EXPORTED",N,"particles; deterministic repeat verified",flush=True)
        return
    scene,obj,radius,color,device=setup(states,attr,opts.samples,opts.device)
    if opts.save_blend:
        update(scene,obj,radius,color,attr,156)
        opts.save_blend.parent.mkdir(parents=True,exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(opts.save_blend.resolve()))
    if opts.mode=="export": return
    opts.frames_dir.mkdir(parents=True,exist_ok=True)
    frames=[int(f) for f in opts.frames.split(",")] if opts.frames else {
        "stills":[0,75,156],"poster":[156],"preview":range(180)}[opts.mode]
    for frame in frames:
        update(scene,obj,radius,color,attr,frame)
        scene.render.filepath=str((opts.frames_dir/f"{frame:04d}.png").resolve())
        print(f"ATERNA frame={frame:03d}/179 device={device} samples={opts.samples}",flush=True)
        bpy.ops.render.render(write_still=True)
    (opts.frames_dir/"render-info.json").write_text(json.dumps({
        "blender":bpy.app.version_string,"engine":"Cycles","device":device,"samples":opts.samples,
        "resolution":[1920,800],"fps":30,"count":N,"seed":SEED,"frames":list(frames)},indent=2)+"\n")
    if not opts.frames: encode(opts)


if __name__=="__main__":
    main()
