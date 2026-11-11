type Point = readonly [number, number];
export type RootCurve = readonly [Point, Point, Point, Point];

const point = ([x, y]: Point) => `${Number(x.toFixed(4))} ${Number(y.toFixed(4))}`;

/** Curvas encadenadas, con un único origen y sin cortes entre tramos. */
export function rootPath(...curves: RootCurve[]) {
  return `M${point(curves[0][0])} ${curves.map(([, a, b, end]) => `C${point(a)} ${point(b)} ${point(end)}`).join(" ")}`;
}

/** La ramificación nace sobre la curva madre y comparte su tangente. */
export function rootBranch(
  [p0, p1, p2, p3]: RootCurve,
  t: number,
  handle: number,
  control: Point,
  end: Point,
): RootCurve {
  const u = 1 - t;
  const start: Point = [
    u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
  ];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  const scale = handle / Math.hypot(dx, dy);
  return [start, [start[0] + dx * scale, start[1] + dy * scale], control, end];
}
