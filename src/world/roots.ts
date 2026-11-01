// La red de raíces: nace bajo el Sello, cruza el suelo y se abre en la
// oscuridad. Se genera aquí (sin modelos que descargar) con una semilla fija,
// así que siempre sale la misma. Las raíces gruesas son tubos que se afinan;
// las raicillas, líneas. Un solo material para las dos: color de base índigo,
// pulsos de luz que bajan desde el árbol y nudos que se encienden con las
// fases del método.

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineSegments,
  Mesh,
  ShaderMaterial,
  Vector3,
  Vector4,
  type Group,
} from "three";

type Curve = { pts: Vector3[]; radius: number[]; dist: number[]; seed: number; gen: number };

/** Generador pseudoaleatorio con semilla (mulberry32): la red es siempre la misma. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hasta dónde llega la raíz más larga (para la animación de crecer). */
export const ROOT_REACH = 19;

/** Altura de la línea del suelo (el Sello flota encima, radio 1). */
export const GROUND_Y = -1.6;

/**
 * Las raíces principales salen del pie del Sello (y ≈ −0,95) hacia sus
 * destinos, repartidos a lo ancho y en profundidad; por el camino echan
 * raíces secundarias y estas, raicillas.
 */
function growAll(seed: number) {
  const rnd = rng(seed);
  const out: Curve[] = [];
  const v = () => new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5);

  const grow = (start: Vector3, dir: Vector3, target: Vector3 | null, length: number, r0: number, gen: number, d0: number) => {
    const step = gen === 0 ? 0.14 : gen === 1 ? 0.1 : 0.075;
    const n = Math.max(5, Math.round(length / step));
    const p = start.clone();
    const d = dir.clone().normalize();
    const curve: Curve = { pts: [p.clone()], radius: [r0], dist: [d0], seed: rnd(), gen };
    for (let i = 1; i <= n; i++) {
      // Al principio se abren en abanico, como en el símbolo; luego buscan su destino.
      if (target) d.lerp(target.clone().sub(p).normalize(), i < 12 ? 0.025 : 0.07).normalize();
      d.y -= 0.018 * (gen + 1);
      d.addScaledVector(v(), gen === 0 ? 0.16 : 0.26).normalize();
      p.addScaledVector(d, step);
      const t = i / n;
      curve.pts.push(p.clone());
      curve.radius.push(r0 * (0.12 + 0.88 * Math.pow(1 - t, 1.1)));
      curve.dist.push(d0 + i * step);
      const chance = gen === 0 ? 0.14 : gen === 1 ? 0.09 : 0;
      if (i > 4 && i < n - 3 && rnd() < chance) {
        const side = new Vector3((rnd() - 0.5) * 1.8, -0.25 - rnd() * 0.5, (rnd() - 0.5) * 1.4);
        const bd = d.clone().add(side).normalize();
        grow(p.clone(), bd, null, length * (1 - t) * (0.4 + rnd() * 0.35) + 0.6, curve.radius[i] * 0.6, gen + 1, d0 + i * step);
      }
    }
    out.push(curve);
  };

  // [x en el pie del Sello, destino x, y, z]: hacia abajo y hacia el fondo,
  // donde la cámara las recorre en el acto 2.
  const primaries: [number, number, number, number][] = [
    [-0.46, -7.2, -6.0, -8.0],
    [-0.32, -4.6, -7.8, -12.5],
    [-0.16, -2.0, -6.4, -10.0],
    [0.0, 0.3, -8.6, -15.0],
    [0.15, 2.2, -6.6, -10.5],
    [0.31, 4.8, -7.6, -12.8],
    [0.45, 7.4, -6.2, -8.4],
    [-0.08, -3.0, -4.8, -5.0],
    [0.1, 3.2, -5.0, -5.4],
  ];
  for (const [x, tx, ty, tz] of primaries) {
    const start = new Vector3(x, -0.93 + Math.abs(x) * 0.12, 0);
    const target = new Vector3(tx, ty, tz);
    const len = start.distanceTo(target) * 1.08;
    const spread = Math.sign(tx) * Math.min(1, Math.abs(tx) / 3);
    grow(start, new Vector3(x * 1.6 + spread * 0.9, -1, -0.12), target, len, 0.019 - Math.abs(x) * 0.007, 0, 0);
  }
  // Raíces que cuelgan de la línea del suelo, a lo ancho y en el fondo: lo
  // que se ve debajo del eje del método.
  for (let i = 0; i < 12; i++) {
    const x = -6.5 + (13 * (i + 0.5)) / 12 + (rnd() - 0.5) * 0.8;
    const z = -1.5 - rnd() * 9;
    const start = new Vector3(x, GROUND_Y, z);
    grow(start, new Vector3((rnd() - 0.5) * 0.6, -1, (rnd() - 0.5) * 0.4), null, 2.5 + rnd() * 3.5, 0.011, 1, 1.5 + Math.abs(x) * 0.5);
  }
  return out;
}

/** Marcos que no giran a lo largo de la curva (transporte paralelo). */
function frames(pts: Vector3[]) {
  const T: Vector3[] = [];
  const N: Vector3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    T.push(b.clone().sub(a).normalize());
  }
  const first = Math.abs(T[0].y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  let n = first.sub(T[0].clone().multiplyScalar(first.dot(T[0]))).normalize();
  for (let i = 0; i < pts.length; i++) {
    n = n.clone().sub(T[i].clone().multiplyScalar(n.dot(T[i]))).normalize();
    N.push(n);
  }
  return { T, N };
}

const VERT = /* glsl */ `
  attribute float aDist;
  attribute float aSeed;
  varying float vDist;
  varying float vSeed;
  varying float vDepth;
  varying float vFacing;
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * w;
    vWorld = w.xyz;
    vDist = aDist;
    vSeed = aSeed;
    vDepth = -mv.z;
    #ifdef TUBE
      vec3 n = normalize(mat3(modelMatrix) * normal);
      vFacing = abs(dot(n, normalize(cameraPosition - w.xyz)));
    #else
      vFacing = 0.7;
    #endif
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uGrow;
  uniform float uIntensity;
  uniform float uPulse;
  uniform float uFog;
  uniform vec3 uBase;
  uniform vec3 uHot;
  uniform vec4 uKnot[4];
  uniform float uUnder;
  varying float vDist;
  varying float vSeed;
  varying float vDepth;
  varying float vFacing;
  varying vec3 vWorld;
  void main() {
    float reach = uGrow * ${ROOT_REACH.toFixed(1)};
    if (vDist > reach) discard;
    // Redondez: el centro del tubo, más claro que los bordes.
    vec3 col = uBase * (0.22 + 0.78 * vFacing);
    // Pulsos que bajan desde el árbol, cada raíz con su desfase.
    float ph = fract(vDist * 0.17 - uTime * 0.12 + vSeed);
    float pulse = smoothstep(0.0, 0.03, ph) * (1.0 - smoothstep(0.03, 0.1, ph));
    col += uHot * pulse * uPulse * (0.5 + 0.5 * vFacing);
    // Nudos de las fases del método.
    float k = 0.0;
    for (int i = 0; i < 4; i++) {
      k += uKnot[i].w * (1.0 - smoothstep(0.0, 1.7, distance(vWorld, uKnot[i].xyz)));
    }
    col += uHot * k * (0.55 + 0.45 * vFacing);
    // Mientras crece, la punta va encendida.
    float tip = (1.0 - smoothstep(0.0, 0.7, reach - vDist)) * (1.0 - step(0.999, uGrow));
    col += uHot * tip * 1.4;
    float fog = exp(-uFog * uFog * vDepth * vDepth);
    // Muy cerca de la cámara se apagan: nada de manchas al pasar junto a una.
    float near = smoothstep(0.35, 1.8, vDepth);
    // Bajo tierra no se ve lo que hay encima del suelo.
    float above = smoothstep(${GROUND_Y.toFixed(2)} - 0.05, ${GROUND_Y.toFixed(2)} + 0.35, vWorld.y) * uUnder;
    gl_FragColor = vec4(col * uIntensity * fog * near * (1.0 - above), 1.0);
  }
`;

export type Roots = {
  group: Group;
  material: ShaderMaterial;
  lineMaterial: ShaderMaterial;
  /** Puntos de la red más cercanos a cada destino (para colocar los nudos). */
  nearest(targets: Vector3[]): Vector3[];
  dispose(): void;
};

export function buildRoots(group: Group, seed = 11): Roots {
  const curves = growAll(seed);
  const RADIAL = 6;

  // Tubos para las raíces gruesas.
  const pos: number[] = [];
  const nrm: number[] = [];
  const dist: number[] = [];
  const seeds: number[] = [];
  const idx: number[] = [];
  // Líneas para las raicillas.
  const lpos: number[] = [];
  const ldist: number[] = [];
  const lseed: number[] = [];

  for (const c of curves) {
    if (c.gen >= 2) {
      for (let i = 1; i < c.pts.length; i++) {
        const a = c.pts[i - 1];
        const b = c.pts[i];
        lpos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        ldist.push(c.dist[i - 1], c.dist[i]);
        lseed.push(c.seed, c.seed);
      }
      continue;
    }
    const { T, N } = frames(c.pts);
    const base = pos.length / 3;
    for (let i = 0; i < c.pts.length; i++) {
      const p = c.pts[i];
      const b = new Vector3().crossVectors(T[i], N[i]);
      for (let j = 0; j < RADIAL; j++) {
        const a = (j / RADIAL) * Math.PI * 2;
        const nx = Math.cos(a) * N[i].x + Math.sin(a) * b.x;
        const ny = Math.cos(a) * N[i].y + Math.sin(a) * b.y;
        const nz = Math.cos(a) * N[i].z + Math.sin(a) * b.z;
        const r = c.radius[i];
        pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r);
        nrm.push(nx, ny, nz);
        dist.push(c.dist[i]);
        seeds.push(c.seed);
      }
    }
    for (let i = 0; i < c.pts.length - 1; i++) {
      for (let j = 0; j < RADIAL; j++) {
        const a = base + i * RADIAL + j;
        const b = base + i * RADIAL + ((j + 1) % RADIAL);
        const c2 = a + RADIAL;
        const d = b + RADIAL;
        idx.push(a, c2, b, b, c2, d);
      }
    }
  }

  const uniforms = {
    uTime: { value: 0 },
    uGrow: { value: 0 },
    uIntensity: { value: 1 },
    uPulse: { value: 1 },
    uFog: { value: 0.05 },
    uUnder: { value: 0 },
    uBase: { value: new Color("#4b55d6").multiplyScalar(0.4) },
    uHot: { value: new Color("#d77cf5") },
    uKnot: { value: [0, 1, 2, 3].map(() => new Vector4(0, -100, 0, 0)) },
  };
  const common = {
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  };
  const material = new ShaderMaterial({ ...common, defines: { TUBE: 1 } });
  const lineMaterial = new ShaderMaterial(common);

  const tubes = new BufferGeometry();
  tubes.setAttribute("position", new Float32BufferAttribute(pos, 3));
  tubes.setAttribute("normal", new Float32BufferAttribute(nrm, 3));
  tubes.setAttribute("aDist", new Float32BufferAttribute(dist, 1));
  tubes.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  tubes.setIndex(idx);
  const tubeMesh = new Mesh(tubes, material);
  tubeMesh.frustumCulled = false;

  const lines = new BufferGeometry();
  lines.setAttribute("position", new Float32BufferAttribute(lpos, 3));
  lines.setAttribute("aDist", new Float32BufferAttribute(ldist, 1));
  lines.setAttribute("aSeed", new Float32BufferAttribute(lseed, 1));
  const lineMesh = new LineSegments(lines, lineMaterial);
  lineMesh.frustumCulled = false;

  group.add(tubeMesh, lineMesh);

  return {
    group,
    material,
    lineMaterial,
    nearest(targets) {
      return targets.map((t) => {
        let best = curves[0].pts[0];
        let bd = Infinity;
        for (const c of curves) {
          if (c.gen > 1) continue;
          for (const p of c.pts) {
            const d = p.distanceToSquared(t);
            if (d < bd) {
              bd = d;
              best = p;
            }
          }
        }
        return best.clone();
      });
    },
    dispose() {
      tubes.dispose();
      lines.dispose();
      material.dispose();
      lineMaterial.dispose();
    },
  };
}
