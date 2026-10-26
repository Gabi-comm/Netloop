import { distance, quadratic, vec, type Vec } from "./geometry";

export class Cable {
  readonly points: Vec[];
  readonly length: number;
  private readonly cumulative: number[];

  constructor(points: Vec[]) {
    this.points = points;
    this.cumulative = [0];
    for (let i = 1; i < points.length; i++) this.cumulative.push(this.cumulative[i - 1] + distance(points[i - 1], points[i]));
    this.length = this.cumulative[this.cumulative.length - 1];
  }

  pointAt(t: number): Vec {
    const target = Math.max(0, Math.min(1, t)) * this.length;
    let i = 1;
    while (i < this.points.length - 1 && this.cumulative[i] < target) i++;
    const segment = this.cumulative[i] - this.cumulative[i - 1];
    const local = segment > 0 ? (target - this.cumulative[i - 1]) / segment : 0;
    const a = this.points[i - 1];
    const b = this.points[i];
    return vec(a.x + (b.x - a.x) * local, a.y + (b.y - a.y) * local);
  }
}

export type Route = { start: Vec; control: Vec };

export type NetworkLayout = {
  server: Vec;
  routes: Route[];
};

const r = (sx: number, sy: number, cx: number, cy: number): Route => ({ start: vec(sx, sy), control: vec(cx, cy) });

export const Layouts = {
  home: {
    server: vec(0.5, 0.86),
    routes: [r(-0.06, 0.36, 0.3, 0.48), r(1.06, 0.4, 0.7, 0.54), r(0.3, 0.33, 0.4, 0.6)],
  },
  cafe: {
    server: vec(0.5, 0.86),
    routes: [r(-0.06, 0.36, 0.3, 0.48), r(1.06, 0.4, 0.7, 0.54), r(0.3, 0.33, 0.4, 0.6), r(1.06, 0.7, 0.8, 0.74)],
  },
  school: {
    server: vec(0.5, 0.86),
    routes: [r(-0.06, 0.36, 0.2, 0.64), r(1.06, 0.36, 0.8, 0.64), r(0.5, 0.33, 0.5, 0.55), r(-0.06, 0.68, 0.2, 0.78)],
  },
  office: {
    server: vec(0.5, 0.86),
    routes: [
      r(-0.06, 0.36, 0.3, 0.48), r(1.06, 0.4, 0.7, 0.54), r(0.3, 0.33, 0.4, 0.6),
      r(1.06, 0.7, 0.8, 0.74), r(-0.06, 0.66, 0.2, 0.76),
    ],
  },
  datacenter: {
    server: vec(0.5, 0.86),
    routes: [
      r(-0.06, 0.36, 0.24, 0.56), r(1.06, 0.36, 0.76, 0.56), r(0.36, 0.33, 0.42, 0.6),
      r(0.66, 0.33, 0.58, 0.6), r(1.06, 0.68, 0.8, 0.74), r(-0.06, 0.68, 0.2, 0.74),
    ],
  },
} satisfies Record<string, NetworkLayout>;

export type LayoutId = keyof typeof Layouts;

export function buildCables(layout: NetworkLayout, width: number, height: number, samples = 40): Cable[] {
  const b = vec(layout.server.x * width, layout.server.y * height);
  return layout.routes.map(({ start, control }) => {
    const a = vec(start.x * width, start.y * height);
    const c = vec(control.x * width, control.y * height);
    return new Cable(Array.from({ length: samples + 1 }, (_, i) => quadratic(a, c, b, i / samples)));
  });
}
