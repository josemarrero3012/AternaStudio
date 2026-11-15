// «Anatomía de una web a medida»: la escena de la película de /servicios/web.
//
// Una web contada como el árbol de Aterna, de la raíz a la copa, en los seis
// pasos de «Qué incluye» (src/lib/dict.ts, servicePages.web.includes):
//
//   1  Auditoría y estrategia      las raíces exploran el suelo; tres hallazgos
//   2  Dirección de arte           del tronco brotan tipografía, color e imagen
//   3  Diseño, de escritorio a móvil  la página se levanta y sale su versión móvil
//   4  Código propio y rápido      la página se abre en capas: estructura y datos
//   5  SEO y datos estructurados   la luz baja a las raíces y llega a un buscador
//   6  Publicación y entrega       las capas se cierran, la web se enciende y un
//                                  círculo la rodea: el símbolo de Aterna
//
// Sin texto (la película vale para los cuatro idiomas: los pasos los pone la
// lista de la página). El primer fotograma es igual al último (la web
// terminada), así que la imagen fija, el arranque y la repetición casan.
//
// Es un módulo de navegador: lo carga index.html (vista previa) y lo usa
// render.mjs para sacar los fotogramas. Todo depende solo del tiempo: el
// mismo `t` da siempre el mismo fotograma.

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// Paleta: src/styles/tokens.css ------------------------------------------------

const C = {
  panel: "#07081a", // fondo de .aurora-panel
  night0: "#13163b",
  night2: "#1e2352",
  night3: "#262c62",
  indigo: "#4b55d6",
  lavender: "#9aa3ff",
  violet: "#9a5cf0",
  orchid: "#d77cf5",
  hi: "#eef0fa",
  mid: "#a9adc8",
};
const col = (hex) => new THREE.Color(hex);

// Utilidades ---------------------------------------------------------------------

const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** 0 antes de a, 1 después de b, lineal entre medias. */
const range = (a, b, x) => clamp01((x - a) / (b - a));
/** Como range, con entrada y salida suaves. */
const smooth = (a, b, x) => {
  const k = range(a, b, x);
  return k * k * (3 - 2 * k);
};
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;
const easeInOut = (k) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
/** Llega pasándose un poco y vuelve: para lo que «brota». */
const easeBack = (k) => {
  const x = clamp01(k) - 1;
  return 1 + 2.2 * x * x * x + 1.2 * x * x;
};

/** Aleatorio con semilla: la misma escena en cada render. */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Interpolación cúbica monótona (sin rebotes) por una lista de [t, valor]. */
function track(keys) {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Materiales ---------------------------------------------------------------------
// Todos escriben color premultiplicado (ONE, ONE_MINUS_SRC_ALPHA): con alfa 0
// suman luz y con alfa 1 tapan. Sin prueba de profundidad: el orden lo da
// renderOrder (la cámara siempre mira desde delante).

const BLEND = {
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

/** Filamento de luz: un tubo que se dibuja de 0 a uGrow, con pulsos. */
function strandMaterial(a, b) {
  return new THREE.ShaderMaterial({
    ...BLEND,
    uniforms: {
      uA: { value: col(a) },
      uB: { value: col(b) },
      uGrow: { value: 1 },
      uOpacity: { value: 1 },
      uPulse: { value: 0 },
      uPulseAmp: { value: 0 },
      uPulseN: { value: 2 },
      uShot: { value: -1 },
      uShotAmp: { value: 0 },
      uHead: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vRim;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vRim = abs(dot(n, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uA;
      uniform vec3 uB;
      uniform float uGrow, uOpacity, uPulse, uPulseAmp, uPulseN, uShot, uShotAmp, uHead;
      varying vec2 vUv;
      varying float vRim;
      void main() {
        float u = vUv.x;
        float g = uGrow * 1.02;
        float body = 1.0 - smoothstep(g - 0.02, g, u);
        float growing = step(uGrow, 0.999);
        float head = smoothstep(g - 0.16, g, u) * body * growing * uHead;
        float pulse = uPulseAmp * exp(-pow((fract(u * uPulseN - uPulse) - 0.5) * 7.0, 2.0));
        float shot = uShotAmp * exp(-pow((u - uShot) * 9.0, 2.0));
        float core = mix(0.3, 1.0, pow(vRim, 1.6));
        vec3 c = mix(uA, uB, u) * core * (1.0 + 2.2 * head + pulse + shot);
        c += vec3(1.0) * (0.5 * head + 0.35 * shot) * core;
        gl_FragColor = vec4(c * body * uOpacity, 0.0);
      }
    `,
  });
}

const PAD = 0.03;
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);

/** Rectángulo redondeado (distancia con signo): relleno, borde y barrido. */
function panelMaterial() {
  return new THREE.ShaderMaterial({
    ...BLEND,
    uniforms: {
      uSize: { value: new THREE.Vector2(1, 1) },
      uPad: { value: PAD },
      uRadius: { value: 0.04 },
      uFillA: { value: col(C.night2) },
      uFillB: { value: col(C.night2) },
      uFill: { value: 1 },
      uBorder: { value: col(C.lavender) },
      uBorderW: { value: 0.012 },
      uBorderOp: { value: 0 },
      uOpacity: { value: 1 },
      uWipe: { value: 1 },
      uSheen: { value: -1 },
      uSheenAmp: { value: 0 },
      uImage: { value: 0 },
      uLight: { value: col(C.hi) },
      uDark: { value: col(C.night0) },
      uGain: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uSize;
      uniform float uPad, uRadius, uFill, uBorderW, uBorderOp, uOpacity, uWipe, uSheen, uSheenAmp, uImage, uGain;
      uniform vec3 uFillA, uFillB, uBorder, uLight, uDark;
      varying vec2 vUv;
      float box(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      void main() {
        vec2 p = (vUv - 0.5) * (uSize + 2.0 * uPad);
        float r = min(uRadius, min(uSize.x, uSize.y) * 0.5);
        float d = box(p, uSize * 0.5, r);
        float aa = max(fwidth(d), 1e-5);
        float inside = 1.0 - smoothstep(-aa, 0.0, d);
        float band = inside * smoothstep(-uBorderW - aa, -uBorderW, d);
        vec2 q = p / uSize + 0.5;
        vec3 fill = mix(uFillA, uFillB, clamp((q.x + (1.0 - q.y)) * 0.5, 0.0, 1.0));
        // La «imagen» de la página: un sol y dos lomas.
        if (uImage > 0.5) {
          float asp = uSize.x / uSize.y;
          vec2 s = vec2((q.x - 0.7) * asp, q.y - 0.7);
          float sun = 1.0 - smoothstep(0.12, 0.12 + aa * 4.0, length(s));
          fill = mix(fill, uLight, sun * 0.92);
          float h1 = 0.3 + 0.16 * sin(q.x * 3.4 + 0.6);
          float h2 = 0.2 + 0.12 * sin(q.x * 4.6 + 3.4);
          fill = mix(fill, uDark, 0.42 * (1.0 - smoothstep(h1, h1 + 0.012, q.y)));
          fill = mix(fill, uDark, 0.5 * (1.0 - smoothstep(h2, h2 + 0.012, q.y)));
        }
        fill *= uGain;
        fill += uBorder * uSheenAmp * exp(-pow((q.x + q.y * 0.45 - uSheen) * 4.5, 2.0));
        float w = uWipe * 1.1;
        float wipe = 1.0 - smoothstep(w - 0.1, w, q.y);
        float front = smoothstep(w - 0.22, w - 0.06, q.y) * wipe * step(uWipe, 0.999);
        float aB = band * uBorderOp;
        float aF = inside * uFill;
        vec3 c = fill * aF * (1.0 - aB) + uBorder * aB;
        float a = aF * (1.0 - aB) + aB;
        c += uBorder * front * inside * 0.7;
        gl_FragColor = vec4(c, a) * uOpacity * wipe;
      }
    `,
  });
}

/** Punto de luz que mira siempre a la cámara. */
function glowMaterial(color) {
  return new THREE.ShaderMaterial({
    ...BLEND,
    uniforms: { uColor: { value: col(color) }, uAmp: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAmp;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float halo = pow(max(0.0, 1.0 - r), 2.4);
        float core = 1.0 - smoothstep(0.1, 0.2, r);
        gl_FragColor = vec4((uColor * halo * 1.1 + mix(uColor, vec3(1.0), 0.6) * core * 0.9) * uAmp, 0.0);
      }
    `,
  });
}

// Piezas -------------------------------------------------------------------------

class Panel {
  constructor(parent, { w, h, r = 0.03, fill = C.night2, fillB, fillOp = 1, border = C.lavender, borderW = 0.012, borderOp = 0, order = 0, x = 0, y = 0, z = 0, image = false }) {
    this.mat = panelMaterial();
    const u = this.mat.uniforms;
    u.uRadius.value = r;
    u.uFillA.value = col(fill);
    u.uFillB.value = col(fillB ?? fill);
    u.uFill.value = fillOp;
    u.uBorder.value = col(border);
    u.uBorderW.value = borderW;
    u.uBorderOp.value = borderOp;
    u.uImage.value = image ? 1 : 0;
    this.u = u;
    this.mesh = new THREE.Mesh(UNIT_PLANE, this.mat);
    this.mesh.renderOrder = order;
    this.mesh.position.set(x, y, z);
    this.size(w, h);
    parent.add(this.mesh);
  }
  size(w, h) {
    this.u.uSize.value.set(w, h);
    this.mesh.scale.set(w + 2 * PAD, h + 2 * PAD, 1);
  }
  set opacity(v) {
    this.u.uOpacity.value = v;
    this.mesh.visible = v > 0.001;
  }
}

class Strand {
  constructor(parent, curve, { r0 = 0.01, r1 = r0, a = C.lavender, b = C.indigo, order = 1, seg = 64, radial = 8 }) {
    const geo = new THREE.TubeGeometry(curve, seg, r0, radial, false);
    if (r1 !== r0) {
      // El tubo es de radio constante: se afina hacia la punta.
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      const c = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i);
        curve.getPointAt(clamp01(u), c);
        v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(lerp(1, r1 / r0, u)).add(c);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    this.curve = curve;
    this.mat = strandMaterial(a, b);
    this.u = this.mat.uniforms;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.renderOrder = order;
    parent.add(this.mesh);
  }
  set grow(v) {
    this.u.uGrow.value = v;
    this.mesh.visible = v > 0.001 && this.u.uOpacity.value > 0.001;
  }
  set opacity(v) {
    this.u.uOpacity.value = v;
    this.mesh.visible = v > 0.001 && this.u.uGrow.value > 0.001;
  }
}

class Glow {
  constructor(parent, { size = 0.2, color = C.lavender, order = 13, x = 0, y = 0, z = 0 }) {
    this.mat = glowMaterial(color);
    this.mesh = new THREE.Mesh(UNIT_PLANE, this.mat);
    this.mesh.scale.setScalar(size);
    this.mesh.position.set(x, y, z);
    this.mesh.renderOrder = order;
    parent.add(this.mesh);
  }
  set amp(v) {
    this.mat.uniforms.uAmp.value = v;
    this.mesh.visible = v > 0.001;
  }
}

/** Arco de circunferencia en el plano XY, empezando arriba y en el sentido del reloj. */
class Arc extends THREE.Curve {
  constructor(r, turns = 1, start = Math.PI / 2) {
    super();
    this.r = r;
    this.turns = turns;
    this.start = start;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const a = this.start - t * this.turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.r, Math.sin(a) * this.r, 0);
  }
}

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const spline = (pts) => new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
const poly = (pts) => new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.02);

// La escena ----------------------------------------------------------------------

/** Cámara: campo de visión y encuadre final (ve 4,7 unidades de alto). */
const FOV = 28;
const FINAL = { az: -14, el: 8, d: 9.43, tx: 0, ty: 0.45 };

/** Centro de la página y de las piezas que la acompañan. */
const PAGE = { x: -0.1, y: 1.46, w: 2.2, h: 1.38 };
const PHONE = { x: 1.2, y: 0.74, z: 0.6, w: 0.6, h: 1.18 };
const SEARCH = { x: -1.5, y: 0.46, z: 0.85 };
const TRUNK_TOP = 0.62;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ size?: number, ss?: number, timeline: { duration: number, chapters: number[] } }} options
 */
export function createFilm(canvas, { size = 1080, ss = 2, timeline }) {
  const END = timeline.duration;
  const [c1, c2, c3, c4, c5, c6] = timeline.chapters;
  /** Hasta aquí se ve la web terminada, desvaneciéndose; después empieza a construirse. */
  const CUT = c1 - 0.1;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(ss);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  const rng = mulberry(20261115);

  // Suelo: un disco de luz y su semilla ------------------------------------------
  const ground = new THREE.Group();
  scene.add(ground);
  const groundRing = new Strand(ground, new Arc(1.9), { r0: 0.006, a: C.lavender, b: C.indigo, order: 1, seg: 200, radial: 6 });
  groundRing.mesh.rotation.x = -Math.PI / 2;
  groundRing.opacity = 0.55;
  const groundInner = new Strand(ground, new Arc(1.05), { r0: 0.003, a: C.indigo, b: C.violet, order: 1, seg: 160, radial: 6 });
  groundInner.mesh.rotation.x = -Math.PI / 2;
  groundInner.opacity = 0.35;
  const seed = new Glow(scene, { size: 0.36, color: C.orchid, order: 13 });

  // Raíces -------------------------------------------------------------------------
  const roots = [];
  const tips = [];
  const mains = [
    { end: V(-1.5, -0.74, 0.25), w: 0.2 },
    { end: V(-0.8, -1.3, -0.35), w: 0.2 },
    { end: V(0.08, -1.5, 0.2), w: 0.16 },
    { end: V(0.88, -1.26, -0.3), w: 0.2 },
    { end: V(1.52, -0.7, 0.3), w: 0.2 },
  ];
  const rootCurve = (start, end, wiggle, drop = 1.7) => {
    const pts = [];
    const n = 4;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = start.clone().lerp(end, k);
      p.y = lerp(start.y, end.y, 1 - (1 - k) ** drop);
      if (i > 0 && i < n) {
        p.x += (rng() - 0.5) * wiggle;
        p.y += (rng() - 0.5) * wiggle * 0.5;
        p.z += (rng() - 0.5) * wiggle;
      }
      pts.push(p);
    }
    return spline(pts);
  };
  /** Sale del punto de la raíz madre siguiendo su tangente y después se abre. */
  const branchCurve = (from, tan, to, wiggle) => {
    const len = from.distanceTo(to);
    const out = to.clone().sub(from).normalize();
    const first = from.clone().addScaledVector(tan.clone().multiplyScalar(0.6).add(out.clone().multiplyScalar(0.4)).normalize(), len * 0.28);
    const second = from.clone().lerp(to, 0.64).add(V((rng() - 0.5) * wiggle, (rng() - 0.5) * wiggle, (rng() - 0.5) * wiggle));
    return spline([from.clone(), first, second, to.clone()]);
  };
  mains.forEach((m, i) => {
    const curve = rootCurve(V(0, 0, 0), m.end, m.w);
    const t0 = c1 - 0.05 + i * 0.1;
    const main = (new Strand(scene, curve, { r0: 0.015, r1: 0.005, a: C.lavender, b: i % 2 ? C.orchid : C.violet, seg: 90 }));
    roots.push({ s: main, t0, t1: t0 + 1.45 });
    // Ramificaciones: nacen sobre la raíz madre y siguen bajando hacia fuera.
    const subs = 2 + (i % 2);
    for (let j = 0; j < subs; j++) {
      const u0 = 0.3 + (j / subs) * 0.45 + rng() * 0.08;
      const from = curve.getPointAt(u0);
      const tan = curve.getTangentAt(u0);
      const side = j % 2 ? 1 : -1;
      const dir = V(tan.x * 0.7 + (rng() - 0.5) * 0.7, tan.y * 0.7 - 0.45 - rng() * 0.3, tan.z * 0.7 + side * (0.35 + rng() * 0.45)).normalize();
      const len = 0.42 + rng() * 0.3;
      const to = from.clone().addScaledVector(dir, len);
      to.y = Math.max(to.y, -1.72);
      const sub = branchCurve(from, tan, to, 0.07);
      const st0 = t0 + u0 * 1.45;
      roots.push({ s: (new Strand(scene, sub, { r0: 0.008, r1: 0.003, a: C.lavender, b: C.indigo, seg: 40, radial: 6 })), t0: st0, t1: st0 + 0.8 });
      // Raicillas en la punta.
      for (let k = 0; k < 2; k++) {
        const u1 = 0.45 + rng() * 0.4;
        const f2 = sub.getPointAt(u1);
        const d2 = V((rng() - 0.5) * 1.2, -0.4 - rng() * 0.6, (rng() - 0.5) * 1.2).normalize();
        const t2 = f2.clone().addScaledVector(d2, 0.16 + rng() * 0.16);
        const rt0 = st0 + 0.35 + rng() * 0.3;
        roots.push({ s: (new Strand(scene, branchCurve(f2, sub.getTangentAt(u1), t2, 0.03), { r0: 0.0045, r1: 0.0015, a: C.indigo, b: C.violet, seg: 18, radial: 5 })), t0: rt0, t1: rt0 + 0.55 });
      }
    }
  });
  // Tres hallazgos de la auditoría (qué hay, qué falta, el tono).
  [0, 2, 4].forEach((i, j) => {
    const e = mains[i].end;
    tips.push({ g: (new Glow(scene, { size: 0.2, color: j === 1 ? C.orchid : C.lavender, x: e.x, y: e.y, z: e.z })), t0: c1 + 1.75 + j * 0.22 });
  });

  // Tronco y ramas -----------------------------------------------------------------
  const trunk = (new Strand(scene, spline([V(0, 0, 0), V(0.03, 0.2, 0.01), V(-0.02, 0.42, -0.01), V(0, TRUNK_TOP, 0)]), { r0: 0.026, r1: 0.02, a: C.orchid, b: C.lavender, seg: 40 }));
  // Hacia tres nodos de la capa de datos, detrás de la página.
  const BACK_Z = -0.05;
  const anchors = [V(-0.35, -0.3), V(0, 0.02), V(0.4, -0.34)];
  const branches = anchors.map((a, i) => {
    const end = V(PAGE.x + a.x, PAGE.y + a.y, BACK_Z);
    const mid = V(lerp(0, end.x, 0.55) + (i - 1) * 0.08, lerp(TRUNK_TOP, end.y, 0.45), BACK_Z * 0.6);
    return (new Strand(scene, spline([V(0, TRUNK_TOP, 0), mid, end]), { r0: 0.016, r1: 0.007, a: C.lavender, b: C.violet, seg: 36 }));
  });

  // La raíz que llega al buscador (paso 5).
  const seoRoot = new Strand(scene, spline([V(0, 0, 0), V(-0.42, -0.34, 0.3), V(-1.02, -0.36, 0.66), V(-1.42, -0.12, 0.83), V(SEARCH.x, 0.1, SEARCH.z)]), {
    r0: 0.014,
    r1: 0.008,
    a: C.orchid,
    b: C.lavender,
    seg: 70,
  });

  // La página, en tres capas -------------------------------------------------------
  const page = new THREE.Group();
  page.position.set(PAGE.x, PAGE.y, 0);
  scene.add(page);
  const back = new THREE.Group();
  back.position.z = BACK_Z;
  const mid = new THREE.Group();
  const front = new THREE.Group();
  page.add(back, mid, front);

  // Capa de datos: un grafo de nodos enlazados.
  const backGlass = (new Panel(back, { w: PAGE.w, h: PAGE.h, r: 0.06, fill: C.night0, fillOp: 0.62, border: C.lavender, borderW: 0.009, borderOp: 0.8, order: 2 }));
  const nodesAt = [V(-0.62, 0.3), V(0.12, 0.42), V(0.72, 0.18), V(-0.35, -0.3), V(0.4, -0.34), V(0, 0.02)];
  const hub = nodesAt[5];
  const graph = nodesAt.slice(0, 5).map((n, i) => (new Strand(back, spline([hub.clone(), hub.clone().lerp(n, 0.5).add(V(0, i % 2 ? 0.05 : -0.05, 0)), n.clone()]), { r0: 0.006, a: C.orchid, b: C.lavender, order: 2, seg: 24, radial: 6 })));
  const nodes = nodesAt.map((n, i) => (new Glow(back, { size: i === 5 ? 0.26 : 0.17, color: i === 5 ? C.orchid : C.lavender, order: 2, x: n.x, y: n.y, z: 0.001 })));

  // Capa de estructura: las cajas de cada bloque y el árbol que las ordena.
  const boxesAt = [
    { x: 0, y: 0.625, w: 2.06, h: 0.09 },
    { x: -0.53, y: 0.262, w: 0.94, h: 0.3 },
    { x: -0.53, y: -0.05, w: 0.94, h: 0.25 },
    { x: -0.76, y: -0.36, w: 0.48, h: 0.2 },
    { x: 0.55, y: -0.065, w: 0.98, h: 1.06 },
  ];
  const boxes = boxesAt.map((b, i) => (new Panel(mid, { ...b, r: 0.025, fillOp: 0.1, fill: C.lavender, border: i === 4 ? C.orchid : C.lavender, borderW: 0.01, borderOp: 1, order: 3 })));
  const spine = (new Strand(mid, poly([V(-1.045, 0.625), V(-1.045, 0.262), V(-1.045, -0.05), V(-1.045, -0.36)]), { r0: 0.006, a: C.orchid, b: C.lavender, order: 3, seg: 60, radial: 6 }));
  const link = (new Strand(mid, poly([V(-0.06, 0.262), V(0.0, 0.262), V(0.06, 0.262)]), { r0: 0.006, a: C.lavender, b: C.orchid, order: 3, seg: 8, radial: 6 }));
  const joints = [0.625, 0.262, -0.05, -0.36].map((y) => (new Glow(mid, { size: 0.085, color: C.orchid, order: 3, x: -1.045, y, z: 0.001 })));

  // Capa de diseño: lo que se ve.
  const glass = (new Panel(front, { w: PAGE.w, h: PAGE.h, r: 0.06, fill: C.night2, fillB: C.night3, fillOp: 0.97, border: C.lavender, borderW: 0.011, borderOp: 1, order: 4 }));
  const bar = (new Panel(front, { w: PAGE.w - 0.03, h: 0.006, r: 0.003, fill: C.lavender, fillOp: 0.45, order: 5, y: 0.56, z: 0.002 }));
  const dots = [-0.98, -0.905, -0.83].map((x, i) => (new Panel(front, { w: 0.044, h: 0.044, r: 0.022, fill: [C.orchid, C.violet, C.lavender][i], order: 5, x, y: 0.625, z: 0.002 })));
  const headline = [
    { x: -0.53, y: 0.33, w: 0.86, h: 0.105 },
    { x: -0.65, y: 0.185, w: 0.62, h: 0.105 },
  ].map((b) => ({ ...b, p: (new Panel(front, { ...b, r: 0.022, fill: C.hi, fillOp: 0.9, order: 5, z: 0.002 })) }));
  const lines = [
    { x: -0.56, y: 0.02, w: 0.8 },
    { x: -0.59, y: -0.05, w: 0.74 },
    { x: -0.71, y: -0.12, w: 0.5 },
  ].map((b) => ({ ...b, p: (new Panel(front, { ...b, h: 0.03, r: 0.015, fill: C.mid, fillOp: 0.75, order: 5, z: 0.002 })) }));

  // Tipografía, color e imagen: brotan del tronco y después ocupan su sitio.
  const typeCanvas = document.createElement("canvas");
  typeCanvas.width = typeCanvas.height = 512;
  const typeTexture = new THREE.CanvasTexture(typeCanvas);
  typeTexture.colorSpace = THREE.SRGBColorSpace;
  typeTexture.anisotropy = 8;
  const drawType = () => {
    const g = typeCanvas.getContext("2d");
    g.clearRect(0, 0, 512, 512);
    g.fillStyle = C.hi;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.font = '400 300px "Fraunces", "Times New Roman", serif';
    g.fillText("Aa", 256, 356);
    typeTexture.needsUpdate = true;
  };
  drawType();
  const typeTile = new THREE.Group();
  front.add(typeTile);
  const typeGlass = (new Panel(typeTile, { w: 0.5, h: 0.5, r: 0.05, fill: C.night3, fillOp: 0.92, border: C.lavender, borderW: 0.01, borderOp: 1, order: 11 }));
  const typeGlyph = new THREE.Mesh(UNIT_PLANE, new THREE.MeshBasicMaterial({ map: typeTexture, transparent: true, depthTest: false, depthWrite: false }));
  typeGlyph.scale.setScalar(0.46);
  typeGlyph.position.z = 0.002;
  typeGlyph.renderOrder = 11.5;
  typeTile.add(typeGlyph);

  const chipColors = [C.orchid, C.violet, C.lavender, C.indigo];
  const chips = chipColors.map((c, i) => (new Panel(front, { w: 0.17, h: 0.17, r: 0.085, fill: c, fillB: i === 0 ? C.violet : c, order: 11 })));
  const pill = chips[0];
  const image = (new Panel(front, { w: 0.6, h: 0.44, r: 0.04, fill: C.indigo, fillB: C.orchid, order: 11, image: true }));

  /** Dónde flotan (coordenadas de la página) y dónde acaban. */
  const SPROUT = V(-PAGE.x, TRUNK_TOP - PAGE.y, 0);
  const FLOAT = { type: V(-0.7, -0.2, 0.25), color: V(0.1, 0.2, 0.3), image: V(0.88, -0.26, 0.2) };
  const SLOT = { type: V(-0.56, 0.26, 0.004), pill: V(-0.76, -0.36, 0.004), image: V(0.55, -0.065, 0.004) };
  const twigs = [FLOAT.type, FLOAT.color, FLOAT.image].map((f, i) => {
    const end = V(PAGE.x + f.x, PAGE.y + f.y - (i === 1 ? 0.12 : 0.26), f.z);
    return (new Strand(scene, spline([V(0, TRUNK_TOP, 0), V(end.x * 0.45, lerp(TRUNK_TOP, end.y, 0.5), end.z * 0.5), end]), { r0: 0.009, r1: 0.004, a: C.lavender, b: C.orchid, seg: 30, radial: 6 }));
  });

  // Medidor de rendimiento y, al final, la marca de «hecho».
  const badge = new THREE.Group();
  badge.position.set(PAGE.w / 2 - 0.02, PAGE.h / 2 - 0.02, 0.006);
  front.add(badge);
  const badgeDisc = (new Panel(badge, { w: 0.34, h: 0.34, r: 0.17, fill: C.panel, fillOp: 0.96, order: 6 }));
  const gauge = (new Strand(badge, new Arc(0.15), { r0: 0.011, a: C.lavender, b: C.orchid, order: 6.5, seg: 96, radial: 6 }));
  const check = (new Strand(badge, poly([V(-0.07, 0.0), V(-0.022, -0.05), V(0.075, 0.055)]), { r0: 0.013, a: C.hi, b: C.hi, order: 6.6, seg: 24, radial: 6 }));

  // El móvil ------------------------------------------------------------------------
  const phone = new THREE.Group();
  phone.rotation.y = THREE.MathUtils.degToRad(-10);
  scene.add(phone);
  const phoneParts = [
    new Panel(phone, { w: PHONE.w, h: PHONE.h, r: 0.085, fill: C.night2, fillB: C.night3, fillOp: 0.95, border: C.lavender, borderW: 0.011, borderOp: 1, order: 9 }),
    new Panel(phone, { w: 0.14, h: 0.022, r: 0.011, fill: C.lavender, fillOp: 0.6, order: 10, y: 0.535, z: 0.002 }),
    new Panel(phone, { w: 0.4, h: 0.062, r: 0.016, fill: C.hi, order: 10, x: -0.04, y: 0.4, z: 0.002 }),
    new Panel(phone, { w: 0.28, h: 0.062, r: 0.016, fill: C.hi, order: 10, x: -0.1, y: 0.315, z: 0.002 }),
    new Panel(phone, { w: 0.48, h: 0.42, r: 0.035, fill: C.indigo, fillB: C.orchid, order: 10, y: 0.03, z: 0.002, image: true }),
    new Panel(phone, { w: 0.46, h: 0.02, r: 0.01, fill: C.mid, fillOp: 0.75, order: 10, x: -0.01, y: -0.25, z: 0.002 }),
    new Panel(phone, { w: 0.34, h: 0.02, r: 0.01, fill: C.mid, fillOp: 0.75, order: 10, x: -0.07, y: -0.3, z: 0.002 }),
    new Panel(phone, { w: 0.28, h: 0.085, r: 0.0425, fill: C.orchid, fillB: C.violet, order: 10, x: -0.1, y: -0.43, z: 0.002 }),
  ];
  const phoneGlass = phoneParts[0];

  // El buscador ---------------------------------------------------------------------
  const search = new THREE.Group();
  search.rotation.y = THREE.MathUtils.degToRad(14);
  scene.add(search);
  const searchGlass = new Panel(search, { w: 0.84, h: 0.7, r: 0.06, fill: C.night0, fillB: C.night2, fillOp: 0.92, border: C.indigo, borderW: 0.009, borderOp: 1, order: 7 });
  const searchPill = new Panel(search, { w: 0.7, h: 0.13, r: 0.065, fill: C.night3, fillOp: 0.9, border: C.lavender, borderW: 0.008, borderOp: 1, order: 8, y: 0.215, z: 0.002 });
  const lens = new Strand(search, new Arc(0.03), { r0: 0.006, a: C.hi, b: C.hi, order: 8, seg: 40, radial: 6 });
  lens.mesh.position.set(-0.265, 0.222, 0.004);
  const handle = new Strand(search, poly([V(-0.243, 0.2), V(-0.232, 0.189), V(-0.221, 0.178)]), { r0: 0.007, a: C.hi, b: C.hi, order: 8, seg: 6, radial: 6 });
  handle.mesh.position.z = 0.004;
  const query = new Panel(search, { w: 0.3, h: 0.022, r: 0.011, fill: C.mid, fillOp: 0.8, order: 8, x: -0.05, y: 0.215, z: 0.004 });
  const rows = [0.045, -0.085, -0.215].map((y, i) => ({
    row: new Panel(search, { w: 0.7, h: 0.1, r: 0.03, fill: i ? C.night2 : C.night3, fillOp: 0.9, border: i ? C.indigo : C.orchid, borderW: 0.008, borderOp: i ? 0.5 : 1, order: 8, y, z: 0.002 }),
    text: new Panel(search, { w: i ? 0.3 - i * 0.05 : 0.36, h: 0.022, r: 0.011, fill: i ? C.mid : C.hi, fillOp: i ? 0.55 : 1, order: 8, x: i ? -0.13 - i * 0.025 + 0.05 : -0.08, y, z: 0.004 }),
  }));
  const found = new Glow(search, { size: 0.16, color: C.orchid, order: 8, x: -0.285, y: 0.045, z: 0.006 });
  const searchStem = (new Glow(scene, { size: 0.16, color: C.lavender, x: SEARCH.x, y: 0.1, z: SEARCH.z }));

  // El círculo final: el árbol dentro de su círculo cerrado, como el símbolo.
  const ringGroup = new THREE.Group();
  ringGroup.position.set(FINAL.tx, FINAL.ty, 0);
  scene.add(ringGroup);
  const ring = (new Strand(ringGroup, new Arc(2.14), { r0: 0.009, a: C.lavender, b: C.orchid, order: 12, seg: 320, radial: 6 }));

  // Polvo de luz -------------------------------------------------------------------
  const DUST = 220;
  const dustGeo = new THREE.BufferGeometry();
  const dustBase = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustBase[i * 3] = (rng() - 0.5) * 6.4;
    dustBase[i * 3 + 1] = -2.2 + rng() * 5.6;
    dustBase[i * 3 + 2] = -2.4 + rng() * 4;
    dustSeed[i] = rng();
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustBase, 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));
  const dustMat = new THREE.ShaderMaterial({
    ...BLEND,
    uniforms: { uTime: { value: 0 }, uScale: { value: size * ss }, uColor: { value: col(C.lavender) } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale;
      varying float vA;
      void main() {
        vec3 p = position;
        // uTime va de 0 a 2π a lo largo de la película.
        p.y += sin(uTime + aSeed * 40.0) * 0.09 + sin(uTime * 2.0 + aSeed * 11.0) * 0.03;
        p.x += sin(uTime + aSeed * 17.0) * 0.06;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * (0.006 + 0.008 * aSeed) / -mv.z;
        vA = 0.12 + 0.3 * fract(aSeed * 7.3) * (0.6 + 0.4 * sin(uTime * 5.0 + aSeed * 30.0));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(uColor * vA * pow(max(0.0, 1.0 - r), 1.8), 0.0);
      }
    `,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.renderOrder = 0;
  dust.frustumCulled = false;
  scene.add(dust);

  // Cámara --------------------------------------------------------------------------
  const K = (i) => (rows) => track(rows.map((r) => [r[0], r[i]]));
  //            t      az   el    d     tx    ty
  const keys = [
    [0, FINAL.az, FINAL.el, FINAL.d, FINAL.tx, FINAL.ty],
    [c1 + 0.7, -28, 2, 7.3, 0, -0.66],
    [c2, -22, 4, 7.1, 0, -0.5],
    [c2 + 1.2, -17, 6, 6.4, 0, 0.72],
    [c3, -11, 6, 6.6, 0, 1.0],
    [c3 + 1.4, 1, 6, 7.0, 0.05, 1.28],
    [c4, 9, 7, 7.2, 0.15, 1.32],
    [c4 + 1.2, 42, 11, 6.6, 0.1, 1.42],
    [c5, 38, 10, 6.9, 0.05, 1.3],
    [c5 + 1.4, 14, 9, 7.7, -0.42, 0.56],
    [c6, 7, 8, 8.3, -0.2, 0.52],
    [c6 + 1.4, -11, 8, 9.3, 0, 0.46],
    [c6 + 2.2, FINAL.az, FINAL.el, FINAL.d, FINAL.tx, FINAL.ty],
    [END, FINAL.az, FINAL.el, FINAL.d, FINAL.tx, FINAL.ty],
  ];
  const cam = { az: K(1)(keys), el: K(2)(keys), d: K(3)(keys), tx: K(4)(keys), ty: K(5)(keys) };
  const place = (t) => {
    const az = THREE.MathUtils.degToRad(cam.az(t));
    const el = THREE.MathUtils.degToRad(cam.el(t));
    const d = cam.d(t);
    const tx = cam.tx(t);
    const ty = cam.ty(t);
    camera.position.set(tx + d * Math.sin(az) * Math.cos(el), ty + d * Math.sin(el), d * Math.cos(az) * Math.cos(el));
    camera.lookAt(tx, ty, 0);
    camera.updateMatrixWorld();
  };
  // El círculo mira a la cámara del encuadre final: ahí es un círculo perfecto.
  place(END);
  ringGroup.lookAt(camera.position);

  // Postproceso ---------------------------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(ss);
  composer.setSize(size, size);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size * ss, size * ss), 0.34, 0.5, 0.62);
  composer.addPass(bloom);
  // Fondo del panel (.aurora-panel: #07081a con un halo violeta), la luz de la
  // escena encima, paso a sRGB y un tramado fijo contra las bandas.
  const out = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uBg: { value: new THREE.Vector3(7 / 255, 8 / 255, 26 / 255) }, uHalo: { value: new THREE.Vector3(154 / 255, 92 / 255, 240 / 255) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform vec3 uBg, uHalo;
      varying vec2 vUv;
      vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
      vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec3 light = texture2D(tDiffuse, vUv).rgb;
        float r = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
        vec3 bg = mix(uBg, uHalo, 0.12 * (1.0 - r));
        vec3 c = toLinear(bg) + light;
        c = c / (1.0 + max(c - 0.92, 0.0) * 0.6);
        c = toSrgb(c);
        c += (hash(floor(gl_FragCoord.xy)) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  composer.addPass(out);

  const glowsAll = [seed, ...tips.map((x) => x.g), ...nodes, ...joints, found, searchStem];
  const tmp = new THREE.Vector3();

  // Un fotograma --------------------------------------------------------------------
  function render(time) {
    const t = Math.min(Math.max(time, 0), END);
    // Antes del corte se ve la web terminada (estado final) desvaneciéndose.
    const intro = t < CUT;
    const s = intro ? END : t;
    const k = intro ? 1 - smooth(0.06, CUT - 0.12, t) : 1;

    place(t);
    const turn = (t / END) * Math.PI * 2;
    dustMat.uniforms.uTime.value = turn;

    // Suelo y semilla: siempre.
    seed.amp = 0.75 + 0.12 * Math.sin(turn * 6);
    groundRing.u.uPulse.value = t / END;
    groundRing.u.uPulseAmp.value = 0.5;

    // 1 · Raíces
    const alive = smooth(c5 + 0.1, c5 + 0.7, s);
    for (const r of roots) {
      r.s.grow = smooth(r.t0, r.t1, s);
      r.s.opacity = 0.95;
      r.s.u.uPulse.value = s * 0.32 + r.t0;
      r.s.u.uPulseAmp.value = 0.25 + 0.9 * alive * (1 - 0.45 * smooth(c6, c6 + 1, s));
    }
    tips.forEach((x) => {
      const on = range(x.t0, x.t0 + 0.45, s);
      x.g.amp = easeOut(on) * (0.75 + 0.9 * (1 - smooth(x.t0 + 0.2, x.t0 + 1.1, s)));
    });

    // 2 · Tronco; brotan tipografía, color e imagen
    trunk.grow = easeInOut(range(c2 + 0.1, c2 + 0.9, s));
    trunk.u.uPulse.value = s * 0.5;
    trunk.u.uPulseAmp.value = 0.35;
    const fly = {
      type: easeInOut(range(c3 + 0.7, c3 + 1.5, s)),
      image: easeInOut(range(c3 + 0.9, c3 + 1.7, s)),
      color: easeInOut(range(c3 + 1.1, c3 + 1.9, s)),
    };
    const born = {
      type: easeBack(range(c2 + 0.8, c2 + 1.5, s)),
      color: easeBack(range(c2 + 1.15, c2 + 1.85, s)),
      image: easeBack(range(c2 + 1.5, c2 + 2.2, s)),
    };
    const bob = (ph) => Math.sin(s * 1.5 + ph) * 0.022;
    const placeTile = (obj, key, floatAt, slot, ph) => {
      const b = born[key];
      tmp.copy(SPROUT).lerp(floatAt, clamp01(b));
      tmp.y += bob(ph) * (1 - fly[key]);
      tmp.lerp(slot, fly[key]);
      obj.position.copy(tmp);
      return b;
    };
    // Tipografía: llega al sitio del titular y se convierte en él.
    const tb = placeTile(typeTile, "type", FLOAT.type, SLOT.type, 0);
    const typeOp = clamp01(tb * 1.4) * (1 - smooth(0.55, 1, fly.type));
    typeTile.scale.setScalar(Math.max(0.001, tb) * lerp(1, 0.7, fly.type));
    typeGlass.opacity = typeOp * k;
    typeGlyph.material.opacity = typeOp * k;
    typeGlyph.visible = typeOp > 0.001;
    // Imagen: la misma pieza crece hasta ser el bloque de imagen de la página.
    const ib = placeTile(image.mesh, "image", FLOAT.image, SLOT.image, 2.1);
    const iw = lerp(0.6, 0.9, fly.image) * Math.max(0.001, ib);
    const ih = lerp(0.44, 0.98, fly.image) * Math.max(0.001, ib);
    image.size(iw, ih);
    image.u.uRadius.value = 0.04;
    image.opacity = clamp01(ib * 1.4) * k;
    // Color: una muestra pasa a ser el botón; las demás tiñen la página y se van.
    const cb = born.color;
    chips.forEach((chip, i) => {
      const at = V(FLOAT.color.x + (i - 1.5) * 0.23, FLOAT.color.y, FLOAT.color.z);
      tmp.copy(SPROUT).lerp(at, clamp01(cb));
      tmp.y += bob(1 + i * 0.6) * (1 - fly.color);
      if (i === 0) {
        tmp.lerp(SLOT.pill, fly.color);
        chip.size(lerp(0.17, 0.4, fly.color) * Math.max(0.001, cb), lerp(0.17, 0.125, fly.color) * Math.max(0.001, cb));
        chip.u.uRadius.value = 0.085;
        chip.opacity = clamp01(cb * 1.4) * k;
      } else {
        tmp.lerp(V(SLOT.image.x - 0.3 + i * 0.2, SLOT.image.y, 0.004), fly.color);
        chip.size(0.17 * Math.max(0.001, cb), 0.17 * Math.max(0.001, cb));
        chip.opacity = clamp01(cb * 1.4) * (1 - smooth(0.25, 0.85, fly.color)) * k;
      }
      chip.mesh.position.copy(tmp);
    });
    twigs.forEach((tw, i) => {
      const key = ["type", "color", "image"][i];
      tw.grow = clamp01(born[key]);
      tw.opacity = 0.9 * (1 - smooth(c3 + 0.3, c3 + 0.9, s));
    });
    // Tras colocarse, las piezas pasan al orden de la capa de diseño.
    const landed = s > c3 + 2;
    image.mesh.renderOrder = landed ? 5 : 11;
    pill.mesh.renderOrder = landed ? 5 : 11;

    // 3 · La página y su versión móvil
    branches.forEach((b, i) => {
      b.grow = easeInOut(range(c3 + 0.05 + i * 0.08, c3 + 0.85 + i * 0.08, s));
      b.u.uPulse.value = s * 0.5 + i;
      b.u.uPulseAmp.value = 0.3;
    });
    const explode = smooth(c4 + 0.1, c4 + 1.1, s) * (1 - 0.5 * smooth(c5 + 0.1, c5 + 1.1, s)) * (1 - smooth(c6, c6 + 0.8, s));
    front.position.z = 0.64 * explode;
    mid.position.z = -0.025 + 0.32 * explode;
    // Abierta en capas, la de diseño baja de luz para que se lean las de detrás.
    const lit = 1 - 0.5 * clamp01(explode * 1.2);
    const live = smooth(c6 + 0.7, c6 + 1.5, s);
    glass.u.uWipe.value = easeOut(range(c3 + 0.2, c3 + 1.1, s));
    glass.u.uFill.value = lerp(0.97, 0.3, clamp01(explode * 1.2));
    glass.u.uBorderOp.value = 0.85 + 0.15 * live;
    glass.u.uGain.value = 1 + 0.25 * live;
    glass.u.uSheen.value = lerp(-0.4, 1.9, range(c6 + 0.75, c6 + 1.7, s));
    glass.u.uSheenAmp.value = 0.2 * smooth(c6 + 0.75, c6 + 0.95, s) * (1 - smooth(c6 + 1.5, c6 + 1.7, s));
    glass.opacity = k;
    image.opacity = image.u.uOpacity.value * lit;
    pill.opacity = pill.u.uOpacity.value * lit;
    const chrome = smooth(c3 + 0.9, c3 + 1.3, s);
    bar.opacity = chrome * lit * k;
    dots.forEach((dot, i) => (dot.opacity = smooth(c3 + 1.0 + i * 0.08, c3 + 1.25 + i * 0.08, s) * k));
    headline.forEach((h, i) => {
      const g = easeOut(range(c3 + 1.3 + i * 0.14, c3 + 1.8 + i * 0.14, s));
      h.p.size(Math.max(0.001, h.w * g), h.h);
      h.p.mesh.position.x = h.x - (h.w * (1 - g)) / 2;
      h.p.opacity = clamp01(g * 3) * lit * k;
    });
    lines.forEach((l, i) => {
      const g = easeOut(range(c3 + 1.65 + i * 0.1, c3 + 2.1 + i * 0.1, s));
      l.p.size(Math.max(0.001, l.w * g), 0.03);
      l.p.mesh.position.x = l.x - (l.w * (1 - g)) / 2;
      l.p.opacity = clamp01(g * 3) * lit * k;
    });
    const out3 = easeInOut(range(c3 + 1.7, c3 + 2.6, s));
    phone.position.set(lerp(0.45, PHONE.x, out3), lerp(1.25, PHONE.y, out3), lerp(0.1, PHONE.z, out3));
    phone.scale.setScalar(lerp(0.55, 1, out3));
    const phoneOp = clamp01(out3 * 2) * (1 - 0.62 * smooth(c4 + 0.1, c4 + 0.7, s) * (1 - smooth(c6 + 0.2, c6 + 0.9, s))) * k;
    phoneParts.forEach((p) => (p.opacity = phoneOp));
    phoneGlass.u.uSheen.value = lerp(-0.4, 1.9, range(c6 + 0.95, c6 + 1.9, s));
    phoneGlass.u.uSheenAmp.value = 0.18 * smooth(c6 + 0.95, c6 + 1.15, s) * (1 - smooth(c6 + 1.7, c6 + 1.9, s));

    // 4 · Las capas: estructura (código) y datos; el medidor se llena
    const layers = smooth(c4 + 0.2, c4 + 0.8, s) * (1 - smooth(c6 + 0.35, c6 + 0.85, s));
    backGlass.opacity = layers * k;
    graph.forEach((g, i) => {
      g.grow = easeInOut(range(c4 + 0.8 + i * 0.08, c4 + 1.5 + i * 0.08, s));
      g.opacity = layers * k;
      g.u.uPulse.value = s * 0.9 + i * 0.2;
      g.u.uPulseAmp.value = 0.5 + alive;
    });
    const flash = smooth(c5 + 0.1, c5 + 0.4, s) * (1 - smooth(c5 + 0.5, c5 + 1.3, s));
    nodes.forEach((n, i) => (n.amp = layers * smooth(c4 + 0.7 + i * 0.06, c4 + 1.1 + i * 0.06, s) * (0.7 + 1.3 * flash) * k));
    boxes.forEach((b, i) => (b.opacity = smooth(c4 + 0.75 + i * 0.13, c4 + 1.15 + i * 0.13, s) * layers * k));
    spine.grow = easeInOut(range(c4 + 0.55, c4 + 1.35, s));
    spine.opacity = layers * k;
    spine.u.uPulse.value = (s - c4) * 1.7;
    spine.u.uPulseAmp.value = 1.6 * smooth(c4 + 1.3, c4 + 1.6, s);
    spine.u.uPulseN.value = 1.5;
    link.grow = easeInOut(range(c4 + 1.2, c4 + 1.5, s));
    link.opacity = layers * k;
    joints.forEach((j, i) => (j.amp = smooth(c4 + 0.65 + i * 0.2, c4 + 0.9 + i * 0.2, s) * layers * 0.9 * k));
    const gaugeGrow = easeOut(range(c4 + 1.3, c4 + 2.3, s));
    badgeDisc.opacity = smooth(c4 + 1.2, c4 + 1.5, s) * k;
    gauge.grow = gaugeGrow;
    gauge.opacity = k;
    gauge.u.uHead.value = 1;
    check.grow = easeOut(range(c6 + 1.05, c6 + 1.6, s));
    check.opacity = k;

    // 5 · La luz baja por las ramas y las raíces hasta el buscador
    branches.forEach((b) => {
      b.u.uShot.value = lerp(1.1, -0.1, range(c5 + 0.35, c5 + 0.85, s));
      b.u.uShotAmp.value = 2.4;
    });
    trunk.u.uShot.value = lerp(1.1, -0.1, range(c5 + 0.7, c5 + 1.1, s));
    trunk.u.uShotAmp.value = 2.4;
    seoRoot.grow = easeInOut(range(c5 + 0.3, c5 + 1.25, s));
    seoRoot.u.uShot.value = lerp(-0.1, 1.1, range(c5 + 1.05, c5 + 1.6, s));
    seoRoot.u.uShotAmp.value = 2.4;
    seoRoot.u.uPulse.value = s * 0.6;
    seoRoot.u.uPulseAmp.value = 0.5;
    seoRoot.opacity = k;
    searchStem.amp = smooth(c5 + 1.2, c5 + 1.5, s) * 0.8 * k;
    const rise = easeBack(range(c5 + 1.25, c5 + 1.95, s));
    search.position.set(SEARCH.x, lerp(0.16, SEARCH.y, clamp01(rise)), SEARCH.z);
    search.scale.setScalar(Math.max(0.001, lerp(0.5, 1, rise)));
    const searchOp = clamp01(rise * 1.6) * k;
    searchGlass.opacity = searchOp;
    searchPill.opacity = smooth(c5 + 1.5, c5 + 1.8, s) * searchOp;
    query.opacity = smooth(c5 + 1.7, c5 + 2.0, s) * searchOp;
    lens.grow = easeInOut(range(c5 + 1.55, c5 + 1.95, s));
    lens.opacity = searchOp;
    handle.grow = easeInOut(range(c5 + 1.9, c5 + 2.05, s));
    handle.opacity = searchOp;
    const hit = smooth(c5 + 2.15, c5 + 2.5, s);
    rows.forEach((r, i) => {
      const on = smooth(c5 + 1.75 + i * 0.13, c5 + 2.05 + i * 0.13, s);
      r.row.opacity = on * searchOp;
      r.text.opacity = on * searchOp;
      if (i === 0) {
        r.row.u.uBorderOp.value = hit;
        r.row.u.uGain.value = 1 + 0.7 * hit;
      }
    });
    found.amp = hit * (0.9 + 0.8 * (1 - smooth(c5 + 2.3, c5 + 3, s))) * searchOp;

    // 6 · El círculo se cierra
    ring.grow = easeInOut(range(c6 + 1.15, c6 + 2.45, s));
    ring.opacity = 0.95 * k;

    // Lo que se desvanece al arrancar.
    for (const x of [trunk, ...branches, ...roots.map((r) => r.s)]) x.opacity = 0.95 * k;
    twigs.forEach((tw) => (tw.opacity = tw.u.uOpacity.value * k));
    tips.forEach((x) => (x.g.amp = x.g.mat.uniforms.uAmp.value * k));

    for (const g of glowsAll) g.mesh.quaternion.copy(camera.quaternion);
    // Los puntos de luz de la página y del buscador viven en grupos girados.
    for (const g of [...nodes, ...joints]) g.mesh.quaternion.copy(camera.quaternion);
    found.mesh.quaternion.copy(search.quaternion).invert().multiply(camera.quaternion);

    composer.render();
  }

  return {
    render,
    /** Cuando Fraunces ya está cargada: vuelve a dibujar «Aa». */
    refreshType: drawType,
    timeline,
    dispose() {
      composer.dispose();
      renderer.dispose();
    },
  };
}
