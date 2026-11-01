// Materiales y colores compartidos por las piezas de la escena: el Sello, los
// objetos de servicio (objects.ts) y la Semilla. Todo sale de la paleta de la
// web (tokens.css) y de la propuesta: el oro pálido solo es para la Semilla.

import { AdditiveBlending, Color, Float32BufferAttribute, MeshPhysicalMaterial, ShaderMaterial, type BufferGeometry } from "three";

export const C = {
  indigo: new Color("#4b55d6"),
  lavender: new Color("#9aa3ff"),
  violet: new Color("#9a5cf0"),
  orchid: new Color("#d77cf5"),
  platinum: new Color("#d9dcef"),
  /** Oro pálido: el único color cálido del recorrido (la Semilla). */
  gold: new Color("#e9d3a2"),
};

/**
 * El degradado del logo como color de vértice: índigo abajo a la izquierda,
 * orquídea arriba a la derecha, en tonos claros para que el metal refleje.
 * `span` es el tamaño de la pieza (el Sello mide 2,2 de diagonal).
 */
export function paintGradient(geo: BufferGeometry, span = 2.2) {
  const from = new Color("#8f99ff");
  const mid = new Color("#b996ff");
  const to = new Color("#f2a6f2");
  const p = geo.getAttribute("position");
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getX(i) * 0.6 + p.getY(i) * 0.8) / span + 0.5));
    if (t < 0.5) c.lerpColors(from, mid, t * 2);
    else c.lerpColors(mid, to, (t - 0.5) * 2);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

/** Titanio anodizado, el del Sello. */
export function anodized(extra: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) {
  return new MeshPhysicalMaterial({
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
    ...extra,
  });
}

/** Vidrio lavanda, el del anillo. */
export function glassy(extra: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) {
  return new MeshPhysicalMaterial({
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
    ...extra,
  });
}

export const WORLD_VERT = /* glsl */ `
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

/** Un resplandor radial aditivo (halo, nudos, Semilla) para un plano de 1 × 1. */
export function glowMaterial(color: Color, intensity = 0) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uIntensity: { value: intensity } },
    vertexShader: WORLD_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}
