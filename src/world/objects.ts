// Acto 4, la copa: los cuatro objetos de servicio. Cada uno ocupa en la
// portada el sitio del icono de trazo de su fila («Cuatro servicios, un solo
// estudio»), que con el 3D se oculta:
//
//   Web            Un monolito de vidrio con el esqueleto de una página grabado.
//   SEO            Un corte de tierra en vidrio ahumado, con raíces encendidas.
//   Mantenimiento  Un disco de tronco en titanio: un anillo por año de cuidado.
//   Asistente IA   Una hoja que vibra como una onda de voz.
//
// Van en el espacio de la cámara y se colocan en cada fotograma donde está el
// icono en la página, así que acompañan al scroll sin desfase. Al pasar por
// una fila (o enfocarla con el teclado) su objeto gira 15° y el vidrio pasa
// de esmerilado a claro: lo borroso se vuelve nítido, que es lo que hace el
// servicio. Todo es geometría generada aquí: no hay modelos que descargar.

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C, anodized, glassy, glowMaterial, paintGradient } from "./look";

export const SERVICE_ORDER = ["web", "seo", "mantenimiento", "asistente-ia"] as const;
export type ServiceKey = (typeof SERVICE_ORDER)[number];

/** Dónde dibujar un objeto: centro y alto en píxeles de la ventana. */
export type Anchor = { x: number; y: number; size: number; alpha: number };

type Piece = {
  root: Group;
  /** clear: 0 esmerilado, 1 claro. */
  tick: (time: number, clear: number) => void;
  setAlpha: (a: number) => void;
  /** Calidad media: sin transmisión (el vidrio pasa a reflejos). */
  lite: () => void;
  dispose: () => void;
};

/** Distancia a la que viven los objetos delante de la cámara. */
const DEPTH = 3;

// Web ----------------------------------------------------------------------

function webPiece(): Piece {
  const root = new Group();
  const slabGeo = new RoundedBoxGeometry(0.68, 0.94, 0.12, 4, 0.035);
  const glass = glassy({ roughness: 0.3, thickness: 0.45, attenuationDistance: 0.9, opacity: 0 });
  root.add(new Mesh(slabGeo, glass));

  // Retícula: marco, cabecera con logo y menú, portada con titular y tres
  // columnas. Dentro del vidrio: se ve borrosa hasta que el vidrio se aclara.
  const segs: number[] = [];
  const line = (x0: number, y0: number, x1: number, y1: number) => segs.push(x0, y0, 0, x1, y1, 0);
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    line(x0, y0, x1, y0);
    line(x1, y0, x1, y1);
    line(x1, y1, x0, y1);
    line(x0, y1, x0, y0);
  };
  rect(-0.26, -0.39, 0.26, 0.39);
  line(-0.26, 0.29, 0.26, 0.29);
  line(-0.21, 0.34, -0.11, 0.34);
  line(0.05, 0.34, 0.09, 0.34);
  line(0.12, 0.34, 0.16, 0.34);
  line(0.19, 0.34, 0.21, 0.34);
  rect(-0.2, 0.03, 0.2, 0.22);
  line(-0.15, 0.16, 0.07, 0.16);
  line(-0.15, 0.1, 0.01, 0.1);
  for (const [a, b] of [
    [-0.2, -0.08],
    [-0.06, 0.06],
    [0.08, 0.2],
  ])
    rect(a, -0.31, b, -0.05);
  const gridGeo = new BufferGeometry();
  gridGeo.setAttribute("position", new Float32BufferAttribute(segs, 3));
  const base = C.lavender.clone().lerp(C.platinum, 0.25).multiplyScalar(2.4);
  const lines = new LineBasicMaterial({ color: base.clone() });
  root.add(new LineSegments(gridGeo, lines));

  return {
    root,
    tick(_time, clear) {
      glass.roughness = 0.3 - 0.26 * clear;
    },
    setAlpha(a) {
      glass.opacity = a;
      lines.color.copy(base).multiplyScalar(a);
    },
    lite() {
      glass.transmission = 0;
      glass.color.set("#8f97e8");
    },
    dispose() {
      slabGeo.dispose();
      glass.dispose();
      gridGeo.dispose();
      lines.dispose();
    },
  };
}

// SEO ----------------------------------------------------------------------

const PULSE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const PULSE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform float uSeed;
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying vec2 vUv;
  void main() {
    // Un pulso que baja por la raíz, como en el método.
    float p = fract(vUv.x * 1.1 - uTime * 0.32 + uSeed);
    float pulse = smoothstep(0.0, 0.1, p) * smoothstep(0.32, 0.1, p);
    gl_FragColor = vec4(mix(uBase, uHot, pulse) * uAlpha, 1.0);
  }
`;

function seoPiece(): Piece {
  const root = new Group();
  const blockGeo = new RoundedBoxGeometry(0.92, 0.64, 0.36, 4, 0.03);
  const glass = glassy({
    color: new Color("#cfc9ff"),
    roughness: 0.28,
    thickness: 0.36,
    iridescence: 0.4,
    attenuationColor: new Color("#2b2570"),
    attenuationDistance: 0.55,
    opacity: 0,
  });
  root.add(new Mesh(blockGeo, glass));

  // La superficie: la línea del suelo, arriba del corte.
  const topGeo = new BoxGeometry(0.88, 0.012, 0.32);
  const topBase = C.lavender.clone().multiplyScalar(1.5);
  const topMat = new MeshBasicMaterial({ color: topBase.clone() });
  const top = new Mesh(topGeo, topMat);
  top.position.y = 0.255;
  root.add(top);

  // Raíces dentro del corte (opacas: el vidrio las ve y las desenfoca).
  const paths: [number, number, number][][] = [
    [
      [0, 0.25, 0],
      [0.02, 0.1, 0.02],
      [-0.03, -0.02, 0],
      [0, -0.14, -0.03],
      [0.04, -0.25, 0],
    ],
    [
      [-0.2, 0.25, 0.05],
      [-0.21, 0.13, 0.04],
      [-0.28, 0.01, 0],
      [-0.31, -0.12, -0.04],
      [-0.35, -0.21, -0.02],
    ],
    [
      [0.21, 0.25, -0.04],
      [0.23, 0.1, -0.02],
      [0.3, -0.02, 0.03],
      [0.34, -0.17, 0],
    ],
    [
      [-0.03, -0.02, 0],
      [-0.12, -0.1, 0.05],
      [-0.16, -0.23, 0.06],
    ],
    [
      [0.23, 0.1, -0.02],
      [0.13, 0, -0.06],
      [0.1, -0.13, -0.08],
    ],
    [
      [0.09, 0.25, 0.1],
      [0.11, 0.17, 0.1],
      [0.17, 0.09, 0.11],
    ],
  ];
  const rootGeos = paths.map(
    (pts, i) => new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p))), 40, i === 0 ? 0.013 : i < 3 ? 0.011 : 0.007, 6, false),
  );
  const rootMats = rootGeos.map(
    (_, i) =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAlpha: { value: 0 },
          uSeed: { value: i * 0.37 },
          uBase: { value: C.indigo.clone().lerp(C.lavender, 0.35).multiplyScalar(0.9) },
          uHot: { value: C.orchid.clone().multiplyScalar(2.2) },
        },
        vertexShader: PULSE_VERT,
        fragmentShader: PULSE_FRAG,
      }),
  );
  rootGeos.forEach((g, i) => root.add(new Mesh(g, rootMats[i])));

  return {
    root,
    tick(time, clear) {
      glass.roughness = 0.28 - 0.24 * clear;
      rootMats.forEach((m) => (m.uniforms.uTime.value = time));
    },
    setAlpha(a) {
      glass.opacity = a;
      topMat.color.copy(topBase).multiplyScalar(a);
      rootMats.forEach((m) => (m.uniforms.uAlpha.value = a));
    },
    lite() {
      glass.transmission = 0;
      glass.color.set("#5b5aa8");
      glass.opacity = Math.min(glass.opacity, 0.55);
    },
    dispose() {
      blockGeo.dispose();
      glass.dispose();
      topGeo.dispose();
      topMat.dispose();
      rootGeos.forEach((g) => g.dispose());
      rootMats.forEach((m) => m.dispose());
    },
  };
}

// Mantenimiento ------------------------------------------------------------

function carePiece(): Piece {
  const root = new Group();
  const geos: BufferGeometry[] = [];
  // Menos metálico que el Sello: de frente, el titanio puro solo reflejaría
  // la noche que hay detrás de la cámara.
  const metal = anodized({ metalness: 0.55, roughness: 0.38, transparent: true, opacity: 0 });
  const add = (geo: BufferGeometry, z: number) => {
    paintGradient(geo, 0.95);
    geos.push(geo);
    const m = new Mesh(geo, metal);
    m.position.z = z;
    root.add(m);
    return m;
  };
  const disc = new CylinderGeometry(0.42, 0.42, 0.08, 96, 1);
  disc.rotateX(Math.PI / 2);
  add(disc, 0);
  // Los anillos de crecimiento, en relieve; el de este año, encendido.
  for (const r of [0.085, 0.145, 0.2, 0.255, 0.31]) add(new TorusGeometry(r, 0.0075, 8, 96), 0.041);
  add(new SphereGeometry(0.03, 16, 12), 0.03);
  const litGeo = new TorusGeometry(0.37, 0.007, 8, 128);
  geos.push(litGeo);
  const litBase = C.lavender.clone().lerp(C.orchid, 0.35).multiplyScalar(1.8);
  const litMat = new MeshBasicMaterial({ color: litBase.clone() });
  const lit = new Mesh(litGeo, litMat);
  lit.position.z = 0.041;
  root.add(lit);
  let alpha = 0;

  return {
    root,
    tick(time, clear) {
      metal.roughness = 0.38 - 0.28 * clear;
      // El anillo de este año respira despacio.
      litMat.color.copy(litBase).multiplyScalar(alpha * (0.75 + 0.25 * Math.sin(time * 1.3)));
    },
    setAlpha(a) {
      alpha = a;
      metal.opacity = a;
      metal.transparent = a < 0.999;
    },
    lite() {},
    dispose() {
      geos.forEach((g) => g.dispose());
      metal.dispose();
      litMat.dispose();
    },
  };
}

// Asistente IA -------------------------------------------------------------

function voicePiece(): Piece {
  const root = new Group();
  const U = 48;
  const V = 10;
  const L = 1.02;
  const W = 0.4;
  // La hoja: rejilla a lo largo del nervio (u) y a lo ancho (v).
  const width = (u: number) => (W / 2) * Math.pow(Math.sin(Math.PI * u), 0.85) * (1 - 0.28 * u);
  const bend = (u: number) => 0.07 * Math.sin(Math.PI * u);
  const leafGeo = new BufferGeometry();
  const pos = new Float32Array((U + 1) * (V + 1) * 3);
  const index: number[] = [];
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j;
      const b = a + V + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  leafGeo.setIndex(index);
  // BufferAttribute (no Float32BufferAttribute, que copia): se reescribe en cada fotograma.
  leafGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const flat = () => {
    for (let i = 0; i <= U; i++)
      for (let j = 0; j <= V; j++) {
        const u = i / U;
        const v = (j / V) * 2 - 1;
        const k = (i * (V + 1) + j) * 3;
        pos[k] = u * L - L / 2;
        pos[k + 1] = v * width(u) + bend(u);
        pos[k + 2] = 0;
      }
  };
  flat();
  paintGradient(leafGeo, 1.1);
  const metal = anodized({ metalness: 0.5, roughness: 0.32, iridescence: 0.9, iridescenceIOR: 1.5, side: DoubleSide, transparent: true, opacity: 0 });
  root.add(new Mesh(leafGeo, metal));

  // Nervio central y nervios laterales, que vibran con la hoja.
  const veins: [number, number][] = [];
  for (let i = 0; i < U; i++) veins.push([i, i + 1]);
  const veinGeo = new BufferGeometry();
  const vpos = new Float32Array((U + 6 * 2) * 2 * 3);
  veinGeo.setAttribute("position", new BufferAttribute(vpos, 3));
  const veinBase = C.lavender.clone().lerp(C.platinum, 0.3).multiplyScalar(2.2);
  const veinMat = new LineBasicMaterial({ color: veinBase.clone() });
  root.add(new LineSegments(veinGeo, veinMat));

  const at = (u: number, v: number, time: number, amp: number, out: Vector3) => {
    const z = amp * Math.sin(2 * Math.PI * (2 * u - 1.3 * time)) * Math.sin(Math.PI * u) * (1 - 0.3 * Math.abs(v));
    return out.set(u * L - L / 2, v * width(u) + bend(u), z);
  };
  const tmp = new Vector3();
  const tmp2 = new Vector3();
  const posAttr = leafGeo.getAttribute("position");
  const vAttr = veinGeo.getAttribute("position");
  root.rotation.z = 0.42;

  return {
    root,
    tick(time, clear) {
      metal.roughness = 0.32 - 0.24 * clear;
      // Habla: una amplitud que sube y baja como una voz; más al pasar.
      const voice = Math.abs(Math.sin(time * 1.9) * Math.sin(time * 0.73 + 1));
      const amp = 0.035 * (0.35 + 0.65 * voice) * (1 + 0.6 * clear);
      for (let i = 0; i <= U; i++)
        for (let j = 0; j <= V; j++) {
          at(i / U, (j / V) * 2 - 1, time, amp, tmp);
          const k = (i * (V + 1) + j) * 3;
          pos[k] = tmp.x;
          pos[k + 1] = tmp.y;
          pos[k + 2] = tmp.z;
        }
      posAttr.needsUpdate = true;
      leafGeo.computeVertexNormals();
      let n = 0;
      const seg = (a: Vector3, b: Vector3) => {
        vpos[n++] = a.x;
        vpos[n++] = a.y;
        vpos[n++] = a.z + 0.004;
        vpos[n++] = b.x;
        vpos[n++] = b.y;
        vpos[n++] = b.z + 0.004;
      };
      for (let i = 0; i < U; i++) seg(at(i / U, 0, time, amp, tmp), at((i + 1) / U, 0, time, amp, tmp2));
      for (let s = 1; s <= 6; s++) {
        const u = 0.12 + s * 0.12;
        for (const side of [-1, 1]) seg(at(u, 0, time, amp, tmp), at(Math.min(0.97, u + 0.1), side * 0.7, time, amp, tmp2));
      }
      vAttr.needsUpdate = true;
    },
    setAlpha(a) {
      metal.opacity = a;
      metal.transparent = a < 0.999;
      veinMat.color.copy(veinBase).multiplyScalar(a);
    },
    lite() {},
    dispose() {
      leafGeo.dispose();
      metal.dispose();
      veinGeo.dispose();
      veinMat.dispose();
    },
  };
}

// Conjunto -----------------------------------------------------------------

export function buildServiceObjects() {
  /** Va dentro del grupo que sigue a la cámara (scene.ts). */
  const group = new Group();
  const pieces: Record<ServiceKey, Piece> = {
    web: webPiece(),
    seo: seoPiece(),
    mantenimiento: carePiece(),
    "asistente-ia": voicePiece(),
  };
  const clear = SERVICE_ORDER.map(() => 0);
  // Cada pieza en un pivote: el giro del pivote no toca la inclinación propia
  // (la hoja). Detrás, un resplandor como el del Sello la separa del fondo.
  const glowGeo = new PlaneGeometry(1, 1);
  const glows = SERVICE_ORDER.map((_, i) => glowMaterial(C.indigo.clone().lerp(i % 2 ? C.orchid : C.violet, 0.4)));
  const pivots = SERVICE_ORDER.map((k, i) => {
    const p = new Group();
    pieces[k].root.visible = false;
    p.add(pieces[k].root);
    const glow = new Mesh(glowGeo, glows[i]);
    glow.scale.setScalar(2.4);
    glow.position.z = -0.45;
    glow.visible = false;
    p.add(glow);
    group.add(p);
    return p;
  });

  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  return {
    group,
    /**
     * Coloca y anima los objetos. `anchors[i]` es dónde está el icono de la
     * fila i en la ventana (null si no hay), `hovered[i]` si la fila tiene el
     * cursor o el foco y `presence` cuánto se ve el canvas en este tramo.
     */
    update(camera: PerspectiveCamera, w: number, h: number, time: number, dt: number, anchors: (Anchor | null)[], hovered: boolean[], presence: number) {
      const e = camera.projectionMatrix.elements;
      const perPx = (2 * DEPTH) / (e[5] * h);
      SERVICE_ORDER.forEach((k, i) => {
        const piece = pieces[k];
        const a = anchors[i];
        // Entra al acercarse por abajo y se va bajo la cabecera (fija) arriba.
        const alpha = a ? presence * a.alpha * smooth(h * 1.04, h * 0.84, a.y) * smooth(90, 210, a.y) : 0;
        piece.root.visible = alpha > 0.004;
        pivots[i].children[1].visible = piece.root.visible;
        if (!a || !piece.root.visible) return;
        clear[i] += ((hovered[i] ? 1 : 0) - clear[i]) * (1 - Math.exp(-dt * 7.5));
        const nx = (a.x / w) * 2 - 1;
        const ny = -((a.y / h) * 2 - 1);
        const pivot = pivots[i];
        pivot.position.set(((nx + e[8]) * DEPTH) / e[0], ((ny + e[9]) * DEPTH) / e[5] + Math.sin(time * 0.8 + i * 1.3) * perPx * 2, -DEPTH);
        pivot.scale.setScalar(a.size * perPx);
        // Un vaivén lento; al pasar, 15° más y de frente.
        pivot.rotation.y = 0.2 * Math.sin(time * 0.45 + i * 1.7) * (1 - clear[i]) + 0.26 * clear[i];
        pivot.rotation.x = 0.07 * Math.sin(time * 0.6 + i);
        piece.setAlpha(alpha);
        piece.tick(time, clear[i]);
        glows[i].uniforms.uIntensity.value = alpha * (0.09 + 0.09 * clear[i]);
      });
    },
    lite() {
      SERVICE_ORDER.forEach((k) => pieces[k].lite());
    },
    dispose() {
      SERVICE_ORDER.forEach((k) => pieces[k].dispose());
      glowGeo.dispose();
      glows.forEach((m) => m.dispose());
    },
  };
}

export type ServiceObjects = ReturnType<typeof buildServiceObjects>;
