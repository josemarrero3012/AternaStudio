// Anillos de crecimiento de los planes (ficha de cada servicio): un anillo
// por plan, cada uno alrededor del anterior, porque cada plan contiene al
// anterior. Son círculos deformados por la misma función, así encajan sin
// cruzarse; un ruido pequeño por anillo les da vida de madera. Deterministas:
// el HTML del servidor y el del navegador salen iguales.

const C = 200; // centro, en un viewBox de 400 × 400
const R = 168; // radio del anillo exterior

function wobble(t: number, k: number) {
  return (
    1 +
    0.036 * Math.sin(t + 0.9) +
    0.022 * Math.sin(2 * t + 2.1) +
    0.012 * Math.sin(3 * t + 4.0) +
    0.004 * Math.sin(5 * t + 1.3 + k * 0.9) +
    0.0025 * Math.sin(7 * t + k * 2.3)
  );
}

const fmt = (v: number) => v.toFixed(1).replace(/\.0$/, "");

/** Un anillo cerrado, con curvas suaves (Catmull-Rom a Bézier). */
function ring(r0: number, k: number) {
  const N = 40;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = r0 * wobble(t, k);
    pts.push([C + r * Math.cos(t), C + r * Math.sin(t)]);
  }
  const p = (i: number) => pts[(i + N) % N];
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += `C${fmt(p1[0] + (p2[0] - p0[0]) / 6)} ${fmt(p1[1] + (p2[1] - p0[1]) / 6)} ${fmt(p2[0] - (p3[0] - p1[0]) / 6)} ${fmt(p2[1] - (p3[1] - p1[1]) / 6)} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return `${d}Z`;
}

export type Tier = { level: number; rings: string[] };

/**
 * Los anillos de `plans` planes, del centro hacia fuera. Cada plan reparte su
 * franja en tres o cuatro anillos; el último de cada franja es su borde.
 */
export function growthRings(plans: number): Tier[] {
  const inner = 24;
  const band = (R - inner) / plans;
  let k = 0;
  return Array.from({ length: plans }, (_, i) => {
    const from = inner + band * i;
    const count = i === 0 ? 4 : 3;
    const step = band / (count - (i === 0 ? 1 : 0));
    const radii = Array.from({ length: count }, (_, j) => (i === 0 ? from + step * j : from + step * (j + 1)));
    return { level: i + 1, rings: radii.map((r) => ring(r, k++)) };
  });
}
