// La escena del Modo Premium: un solo canvas fijo detrás de la portada, con
// una sola cámara. Se descarga aparte (import dinámico desde World.tsx) y
// solo en equipos que pueden con ella; todo lo demás de la web sigue igual.
//
// Piezas (todas generadas aquí, sin modelos que descargar):
//   El Sello   El símbolo extruido en titanio anodizado dentro de un anillo
//              de vidrio, con un halo detrás. Sigue al cursor unos grados.
//   El suelo   Un plano de luz casi invisible: de canto es la línea que sube
//              por la pantalla al bajar bajo tierra.
//   Raíces     Ver roots.ts.
//   Polvo      Motas de luz que dan escala; bajo tierra suben despacio.
//   Nudos      Cuatro, uno por fase del método.
//
// El texto nunca está dentro del canvas: es decorativo (aria-hidden) y toda
// la lectura sigue en el HTML.

import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Plane,
  PointLight,
  Points,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type Texture,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ScrollTrigger } from "@/lib/motion";
import { CAMERA_FOV, blankKey, buildKeys, journeyAt, measureStations, sample, type Key } from "./journey";
import { MARK } from "./mark-data";
import { GROUND_Y, buildRoots } from "./roots";

export type WorldOptions = {
  canvas: HTMLCanvasElement;
  /** ?3d=1: no se rinde aunque vaya lento. (El render por software ya se
   *  descarta antes de descargar la escena: lib/world.ts, gpuUsable.) */
  forced: boolean;
  /** Primer fotograma pintado: ya se puede enseñar. */
  onReady: () => void;
  /** No hay 3D (sin WebGL, render por software, demasiado lento o contexto perdido). */
  onFail: (reason: string) => void;
};

export type WorldHandle = {
  /** Empieza la entrada del Sello (con la de la página). */
  intro: () => void;
  dispose: () => void;
};

// Paleta (tokens.css y la propuesta).
const C = {
  indigo: new Color("#4b55d6"),
  lavender: new Color("#9aa3ff"),
  violet: new Color("#9a5cf0"),
  orchid: new Color("#d77cf5"),
  platinum: new Color("#d9dcef"),
};

/** Entorno de estudio para los reflejos: paneles de luz con los colores de la marca. */
function environment(renderer: WebGLRenderer): Texture {
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(12, 12, 12), new MeshBasicMaterial({ color: new Color("#0b0d26"), side: BackSide })));
  const panel = (w: number, h: number, color: Color, power: number, at: [number, number, number], look: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: color.clone().multiplyScalar(power), side: DoubleSide }));
    m.position.set(...at);
    m.lookAt(...look);
    env.add(m);
  };
  panel(7, 1.6, C.lavender, 2.4, [0, 5, 0.5], [0, 0, 0]); // caja de luz arriba
  panel(1, 8, C.indigo, 5, [-5, 0.5, 1.2], [0, 0, 0]); // tira índigo a la izquierda
  panel(1, 7, C.orchid, 3.4, [5, 0.8, 0.4], [0, 0, 0]); // tira orquídea a la derecha
  panel(6, 0.8, C.violet, 1.4, [0, -4.5, 2], [0, 0, 0]); // relleno bajo
  panel(1.6, 1.6, C.platinum, 2.2, [4.2, 3.4, 3.2], [0, 0, 0]); // brillo que barre al inclinarse
  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.035);
  pmrem.dispose();
  env.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  return rt.texture;
}

/** El símbolo en volumen: el contorno trazado del logo, extruido y biselado. */
function markGeometry() {
  const pts = (flat: number[]) => {
    const out: Vector2[] = [];
    for (let i = 0; i < flat.length; i += 2) out.push(new Vector2(flat[i] / 1000, flat[i + 1] / 1000));
    return out;
  };
  const shapes = MARK.map(([outer, ...holes]) => {
    const shape = new Shape(pts(outer));
    shape.holes = holes.map((h) => new Path(pts(h)));
    return shape;
  });
  const depth = 0.07;
  const geo = new ExtrudeGeometry(shapes, {
    depth,
    curveSegments: 1,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.011,
    bevelOffset: -0.011,
    bevelSegments: 3,
  });
  geo.translate(0, 0, -depth / 2);
  // Color del metal: el degradado del logo (índigo abajo a la izquierda,
  // orquídea arriba a la derecha), en tonos claros para que el titanio refleje.
  const from = new Color("#8f99ff");
  const mid = new Color("#b996ff");
  const to = new Color("#f2a6f2");
  const p = geo.getAttribute("position");
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getX(i) * 0.6 + p.getY(i) * 0.8) / 2.2 + 0.5));
    if (t < 0.5) c.lerpColors(from, mid, t * 2);
    else c.lerpColors(mid, to, (t - 0.5) * 2);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Plano que solo brilla de canto (el suelo) o un resplandor radial (halo, nudos). */
const GROUND_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vWorld;
  void main() {
    vec3 v = normalize(vWorld - cameraPosition);
    // De canto, una línea fina y brillante; un poco de niebla alrededor.
    float gz = 1.0 - abs(v.y);
    float grazing = pow(gz, 140.0) * 1.6 + pow(gz, 14.0) * 0.18;
    float d = length(vWorld.xz - cameraPosition.xz);
    float fade = exp(-d * 0.055) * smoothstep(60.0, 20.0, d);
    gl_FragColor = vec4(uColor * grazing * fade * uIntensity, 1.0);
  }
`;
const WORLD_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const GLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float g = pow(max(0.0, 1.0 - d), 2.2);
    gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
  }
`;

const DUST_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uRise;
  uniform float uSize;
  uniform float uFog;
  uniform vec3 uBox;
  uniform vec3 uOrigin;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.05 + aSeed * 0.05);
    p.x += sin(t * 2.0 + aSeed * 31.0) * 0.22;
    p.z += cos(t * 1.7 + aSeed * 17.0) * 0.22;
    p.y += uRise * (0.55 + aSeed * 0.9) + sin(t * 2.3 + aSeed * 9.0) * 0.12;
    p.y = uOrigin.y + mod(p.y - uOrigin.y, uBox.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    gl_PointSize = uSize * (0.5 + aSeed) / max(depth, 0.1);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aSeed) + aSeed * 40.0);
    vAlpha = twinkle * exp(-uFog * uFog * depth * depth) * smoothstep(0.2, 1.2, depth);
    gl_Position = projectionMatrix * mv;
  }
`;
const DUST_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float g = pow(max(0.0, 1.0 - d), 2.0);
    gl_FragColor = vec4(uColor * g * vAlpha * uIntensity, 1.0);
  }
`;

export function createWorld({ canvas, forced, onReady, onFail }: WorldOptions): WorldHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" });
  } catch {
    onFail("webgl");
    return null;
  }
  const gl = renderer.getContext();
  if (!(gl instanceof WebGL2RenderingContext)) {
    renderer.dispose();
    onFail("webgl2");
    return null;
  }

  // Calidad: alta de entrada; si va lento, se baja (y si aun así no llega, se rinde).
  let quality: "high" | "medium" = "high";
  const pixelRatio = () => (quality === "high" ? Math.min(window.devicePixelRatio, 1.5) : 1);

  renderer.outputColorSpace = SRGBColorSpace;
  // Sin mapeo de tonos: el fondo tiene que ser exactamente el de la página
  // (#13163b) para fundirse con el HTML de alrededor.
  renderer.toneMapping = NoToneMapping;
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new Scene();
  const fog = new FogExp2(new Color("#13163b"), 0.02);
  scene.fog = fog;
  const bg = new Color("#13163b");
  scene.background = bg;
  const envMap = environment(renderer);
  scene.environment = envMap;

  const camera = new PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.04, 80);

  // El Sello ----------------------------------------------------------------
  const seal = new Group();
  scene.add(seal);
  const reveal = new Plane(new Vector3(0, -1, 0), -1.2);
  const metal = new MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 1,
    roughness: 0.24,
    envMapIntensity: 1.1,
    clearcoat: 0.12,
    clearcoatRoughness: 0.3,
    iridescence: 0.3,
    iridescenceIOR: 1.7,
    iridescenceThicknessMinimum: 180,
    iridescenceThicknessMaximum: 520,
    clippingPlanes: [reveal],
  });
  const markGeo = markGeometry();
  const mark = new Mesh(markGeo, metal);
  seal.add(mark);

  const glass = new MeshPhysicalMaterial({
    color: new Color("#d6d9ff"),
    metalness: 0,
    roughness: 0.32,
    transmission: 1,
    thickness: 0.5,
    ior: 1.45,
    iridescence: 0.7,
    iridescenceIOR: 1.3,
    iridescenceThicknessMinimum: 200,
    iridescenceThicknessMaximum: 480,
    envMapIntensity: 1.6,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    attenuationColor: new Color("#b9b4ff"),
    attenuationDistance: 1.4,
    transparent: true,
    opacity: 0,
  });
  const ringGeo = new TorusGeometry(1.135, 0.05, 28, 220);
  const ring = new Mesh(ringGeo, glass);
  seal.add(ring);

  // Halo detrás del Sello: separa el metal oscuro del fondo oscuro.
  const glowGeo = new PlaneGeometry(1, 1);
  const haloMat = new ShaderMaterial({
    uniforms: { uColor: { value: C.indigo.clone().lerp(C.violet, 0.35) }, uIntensity: { value: 0 } },
    vertexShader: WORLD_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const halo = new Mesh(glowGeo, haloMat);
  halo.scale.setScalar(5.2);
  halo.position.set(0, -0.1, -0.9);
  seal.add(halo);

  // Luces: la del cursor (lavanda) y una de recorte desde arriba.
  const cursorLight = new PointLight(C.lavender, 2.6, 6, 1.8);
  cursorLight.position.set(1.5, 1, 2.2);
  scene.add(cursorLight);
  const key = new DirectionalLight(C.platinum, 1.1);
  key.position.set(-2, 3, 4);
  scene.add(key);

  // Raíces, suelo, polvo y nudos ------------------------------------------
  const rootsGroup = new Group();
  scene.add(rootsGroup);
  const roots = buildRoots(rootsGroup);

  const groundMat = new ShaderMaterial({
    uniforms: { uColor: { value: C.indigo.clone().lerp(C.lavender, 0.3).multiplyScalar(1.6) }, uIntensity: { value: 0.4 } },
    vertexShader: WORLD_VERT,
    fragmentShader: GROUND_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const groundGeo = new PlaneGeometry(120, 120, 1, 1);
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  scene.add(ground);

  const DUST = 1700;
  const box = new Vector3(16, 13, 18);
  const origin = new Vector3(-8, -9.5, -12.5);
  const dustPos: number[] = [];
  const dustSeed: number[] = [];
  let s = 1;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < DUST; i++) {
    dustPos.push(origin.x + rand() * box.x, origin.y + rand() * box.y, origin.z + rand() * box.z);
    dustSeed.push(rand());
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new Float32BufferAttribute(dustPos, 3));
  dustGeo.setAttribute("aSeed", new Float32BufferAttribute(dustSeed, 1));
  const dustMat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRise: { value: 0 },
      uSize: { value: 26 },
      uFog: { value: 0.03 },
      uBox: { value: box },
      uOrigin: { value: origin },
      uColor: { value: C.lavender.clone() },
      uIntensity: { value: 0.8 },
    },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  // Un nudo por fase del método, sobre la raíz más cercana a su sitio.
  const knotSpots = roots.nearest([
    new Vector3(-2.8, -3.0, -4.5),
    new Vector3(-0.9, -3.4, -5.5),
    new Vector3(0.9, -3.2, -5.2),
    new Vector3(2.8, -3.1, -4.6),
  ]);
  const knotMats = knotSpots.map(() => {
    const m = haloMat.clone();
    m.uniforms = { uColor: { value: C.orchid.clone() }, uIntensity: { value: 0 } };
    return m;
  });
  const knots = knotSpots.map((p, i) => {
    const m = new Mesh(glowGeo, knotMats[i]);
    m.position.copy(p);
    m.scale.setScalar(0.5);
    scene.add(m);
    return m;
  });
  const knotLit = [0, 0, 0, 0];

  // Postproceso: un bloom suave para que la luz de las raíces respire.
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.55, 0.5, 0.22);
  composer.addPass(bloom);
  const output = new OutputPass();
  composer.addPass(output);

  // Recorrido ---------------------------------------------------------------
  let w = window.innerWidth;
  let h = window.innerHeight;
  let keys: Key[] = buildKeys(w, h);
  let stations = measureStations();
  const want = blankKey();
  const cur = blankKey();
  let first = true;

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio());
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    keys = buildKeys(w, h);
  };
  resize();
  const onRefresh = () => {
    stations = measureStations();
  };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  window.addEventListener("resize", resize);

  // Cursor: posición normalizada (−1…1) y su versión suavizada.
  const pointer = { x: 0.45, y: 0.12, sx: 0.45, sy: 0.12 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / w) * 2 - 1;
    pointer.y = -((e.clientY / h) * 2 - 1);
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  // Fases del método: la escena las lee del HTML (ApproachRail las enciende).
  const phases = Array.from(document.querySelectorAll<HTMLElement>(".rail-phase"));

  // Entrada ------------------------------------------------------------------
  let introAt = -1;
  let introDone = false;

  // Bucle ---------------------------------------------------------------------
  let time = 0;
  let last = performance.now();
  let frames = 0;
  const samples: number[] = [];
  let probeFrom = 30;
  let failed = false;
  let opacityShown = -1;
  let ready = false;
  /** El fotograma anterior se pintó (solo esos cuentan para medir). */
  let painted = false;

  const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

  const fail = (reason: string) => {
    if (failed) return;
    failed = true;
    onFail(reason);
  };

  const applyShift = (sx: number, sy: number) => {
    camera.updateProjectionMatrix();
    const e = camera.projectionMatrix.elements;
    e[8] = -sx;
    e[9] = -sy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };

  const frame = (now: number) => {
    const dtMs = now - last;
    last = now;
    const dt = Math.min(0.05, dtMs / 1000);
    time += dt;
    frames++;

    // ¿Puede con ello este equipo? Se mide en marcha, con la escena real.
    if (!forced && !failed && painted && frames > probeFrom && document.visibilityState === "visible") {
      samples.push(dtMs);
      if (samples.length >= 90) {
        const m = median(samples);
        samples.length = 0;
        if (m > 28 && quality === "high") {
          quality = "medium";
          bloom.enabled = false;
          glass.transmission = 0;
          glass.roughness = 0.12;
          resize();
          probeFrom = frames + 30;
        } else if (m > 40) {
          fail("slow");
          return;
        } else {
          probeFrom = Number.POSITIVE_INFINITY;
        }
      }
    }

    // Scroll → estado deseado; la cámara lo sigue con un suavizado corto.
    const y = window.scrollY;
    const u = stations ? journeyAt(y, stations) : 0;
    sample(keys, u, want);
    const k = first ? 1 : 1 - Math.exp(-dt * 9);
    first = false;
    cur.pos.lerp(want.pos, k);
    cur.tgt.lerp(want.tgt, k);
    cur.shift[0] += (want.shift[0] - cur.shift[0]) * k;
    cur.shift[1] += (want.shift[1] - cur.shift[1]) * k;
    cur.bg.lerp(want.bg, k);
    for (const f of ["fog", "roots", "pulse", "ground", "rise", "dust", "halo", "opacity"] as const) cur[f] += (want[f] - cur[f]) * k;

    // Opacidad del canvas: la entrada y la salida antes de los servicios.
    // La entrada va con el reloj real (no con el tiempo suavizado de la escena).
    const clock = now / 1000;
    const intro = introAt < 0 ? 0 : Math.min(1, (clock - introAt) / 2.6);
    const shown = Math.min(1, intro * 2.5) * cur.opacity;
    if (Math.abs(shown - opacityShown) > 0.003) {
      opacityShown = shown;
      canvas.style.opacity = shown.toFixed(3);
      canvas.style.visibility = shown < 0.004 ? "hidden" : "visible";
    }
    // Fuera de la vista (más allá del método) no se pinta: no gasta nada.
    if (ready && shown < 0.004 && introDone) {
      painted = false;
      return;
    }
    painted = true;

    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 5));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 5));
    // Cerca del hueco del árbol el cursor no mueve nada: se cruza recto.
    const calm = Math.min(1, Math.abs(u - 2) / 0.6);
    const tilt = Math.max(0, 1 - u / 1.2);

    camera.position.copy(cur.pos);
    camera.position.x += pointer.sx * 0.12 * calm;
    camera.position.y += pointer.sy * 0.08 * calm;
    camera.lookAt(cur.tgt);
    applyShift(cur.shift[0], cur.shift[1]);

    // El Sello: mira un poco al cursor (hasta 8°) y entra creciendo desde las raíces.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    seal.rotation.y = pointer.sx * 0.14 * tilt;
    seal.rotation.x = -pointer.sy * 0.09 * tilt;
    // Detrás del árbol o bajo tierra el Sello no se ve: no se pinta.
    seal.visible = camera.position.z > -0.35 && camera.position.y > GROUND_Y + 0.2;
    reveal.constant = -1.15 + 2.4 * ease(Math.min(1, intro * 1.25));
    glass.opacity = ease(Math.min(1, Math.max(0, intro * 1.6 - 0.25)));
    ring.scale.setScalar(0.94 + 0.06 * ease(intro));
    haloMat.uniforms.uIntensity.value = 0.06 * cur.halo * ease(intro);
    cursorLight.position.set(pointer.sx * 2.6 + 0.4, pointer.sy * 1.8 + 0.4, 2.2);

    bg.copy(cur.bg);
    fog.color.copy(cur.bg);
    fog.density = cur.fog;

    const ru = roots.material.uniforms;
    ru.uTime.value = time;
    ru.uGrow.value = introAt < 0 ? 0 : Math.min(1, Math.max(0, (clock - introAt - 0.5) / 2.8));
    ru.uIntensity.value = cur.roots;
    ru.uPulse.value = cur.pulse;
    ru.uFog.value = cur.fog * 0.9;
    // Cuánto está la cámara bajo tierra (0 encima, 1 debajo).
    ru.uUnder.value = Math.min(1, Math.max(0, (GROUND_Y + 0.05 - camera.position.y) / 0.12));

    groundMat.uniforms.uIntensity.value = cur.ground * ease(intro);
    dustMat.uniforms.uTime.value = time;
    dustMat.uniforms.uRise.value += dt * cur.rise * 0.22;
    dustMat.uniforms.uFog.value = cur.fog;
    dustMat.uniforms.uIntensity.value = cur.dust * ease(intro);
    dustMat.uniforms.uColor.value.copy(C.lavender).lerp(C.orchid, cur.rise * 0.45);
    dustMat.uniforms.uSize.value = 26 * renderer.getPixelRatio();

    // Nudos: cada fase encendida en el HTML enciende el suyo, con suavidad.
    for (let i = 0; i < 4; i++) {
      const on = phases[i]?.dataset.lit === "true" ? 1 : 0;
      knotLit[i] += (on - knotLit[i]) * (1 - Math.exp(-dt * 4));
      const kv = ru.uKnot.value[i];
      kv.set(knotSpots[i].x, knotSpots[i].y, knotSpots[i].z, knotLit[i]);
      knotMats[i].uniforms.uIntensity.value = knotLit[i] * 0.75;
      knots[i].lookAt(camera.position);
    }
    halo.lookAt(camera.position);

    composer.render(dt);

    if (!ready) {
      ready = true;
      onReady();
    }
    if (intro >= 1 && ru.uGrow.value >= 1) introDone = true;
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    fail("context-lost");
  };
  canvas.addEventListener("webglcontextlost", onLost);

  renderer.setAnimationLoop(frame);

  let disposed = false;
  return {
    intro() {
      if (introAt < 0) introAt = performance.now() / 1000;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      markGeo.dispose();
      ringGeo.dispose();
      glowGeo.dispose();
      groundGeo.dispose();
      dustGeo.dispose();
      metal.dispose();
      glass.dispose();
      haloMat.dispose();
      groundMat.dispose();
      dustMat.dispose();
      knotMats.forEach((m) => m.dispose());
      roots.dispose();
      envMap.dispose();
      composer.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}

