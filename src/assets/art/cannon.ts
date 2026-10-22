import { makeHD, poly, type HdDraw } from './hd';

export const CANNON_SIZE = 128;
export const CANNON_DIRECTION_COUNT = 360;
export const CANNON_GROUND_Y = 0.68;
export const CANNON_HEIGHT_Y = Math.sqrt(1 - CANNON_GROUND_Y * CANNON_GROUND_Y);
export const CANNON_BARREL_HEIGHT = 12;
export const CANNON_MUZZLE_DISTANCE = 46;
export const CANNON_PIVOT_Y = -16;

type Vec = [number, number, number];
type Paint = `#${string}`;
type Material = { colors: readonly Paint[]; edge: Paint };
type Vertex = { p: Vec; n: Vec };
type Profile = readonly [number, number][];

const IRON: Material = {
  edge: '#141b25',
  colors: ['#1c232e', '#28323f', '#343f4f', '#3e495a', '#566275', '#788699'],
};
const BRASS: Material = {
  edge: '#453426',
  colors: ['#51402c', '#6b5134', '#89683d', '#a78750', '#c1a36a', '#d8bf87'],
};
const BORE: Material = {
  edge: '#171f23',
  colors: ['#131b20', '#192329', '#233036', '#2e3c41', '#3a494c', '#485757'],
};

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v: Vec): Vec => {
  const d = Math.hypot(...v);
  return [v[0] / d, v[1] / d, v[2] / d];
};

const LIGHT = unit([-0.55, -0.65, 1]);

class CannonRaster {
  private readonly depths = new Float64Array(CANNON_SIZE * CANNON_SIZE).fill(-Infinity);
  private readonly colors: (Paint | undefined)[] = new Array(CANNON_SIZE * CANNON_SIZE);
  private readonly edges: (Paint | undefined)[] = new Array(CANNON_SIZE * CANNON_SIZE);
  private readonly ca: number;
  private readonly sa: number;

  constructor(angle: number) {
    this.ca = Math.cos(angle);
    this.sa = Math.sin(angle);
  }

  private rotate(v: Vec): Vec {
    return [v[0] * this.ca - v[1] * this.sa, v[0] * this.sa + v[1] * this.ca, v[2]];
  }

  triangle(a: Vertex, b: Vertex, c: Vertex, mat: Material) {
    const vertices = [a, b, c].map(v => {
      const p = this.rotate(v.p);
      return { x: 64 + p[0], y: 64 + p[1] * CANNON_GROUND_Y - p[2] * CANNON_HEIGHT_Y,
        depth: p[1] * CANNON_HEIGHT_Y + p[2] * CANNON_GROUND_Y, n: this.rotate(v.n) };
    });
    const [v0, v1, v2] = vertices;
    const area = (v1.y - v2.y) * (v0.x - v2.x) + (v2.x - v1.x) * (v0.y - v2.y);
    if (Math.abs(area) < 0.00001) return;
    const minX = Math.max(1, Math.floor(Math.min(v0.x, v1.x, v2.x)));
    const maxX = Math.min(126, Math.ceil(Math.max(v0.x, v1.x, v2.x)));
    const minY = Math.max(1, Math.floor(Math.min(v0.y, v1.y, v2.y)));
    const maxY = Math.min(126, Math.ceil(Math.max(v0.y, v1.y, v2.y)));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const u = ((v1.y - v2.y) * (px - v2.x) + (v2.x - v1.x) * (py - v2.y)) / area;
        const v = ((v2.y - v0.y) * (px - v2.x) + (v0.x - v2.x) * (py - v2.y)) / area;
        const w = 1 - u - v;
        if (u < -0.00001 || v < -0.00001 || w < -0.00001) continue;
        const depth = u * v0.depth + v * v1.depth + w * v2.depth;
        const i = y * CANNON_SIZE + x;
        if (depth < this.depths[i]) continue;
        this.depths[i] = depth;
        const n: Vec = [u * v0.n[0] + v * v1.n[0] + w * v2.n[0],
          u * v0.n[1] + v * v1.n[1] + w * v2.n[1],
          u * v0.n[2] + v * v1.n[2] + w * v2.n[2]];
        const light = Math.max(0, dot(unit(n), LIGHT));
        const tone = Math.min(mat.colors.length - 1, Math.floor(0.6 + light * (mat.colors.length - 1)));
        this.colors[i] = mat.colors[tone];
        this.edges[i] = mat.edge;
      }
    }
  }

  quad(points: [Vec, Vec, Vec, Vec], mat: Material, normal?: Vec) {
    const n = normal ?? unit(cross(sub(points[1], points[0]), sub(points[2], points[0])));
    const vertices = points.map(p => ({ p, n }));
    this.triangle(vertices[0], vertices[1], vertices[2], mat);
    this.triangle(vertices[0], vertices[2], vertices[3], mat);
  }

  lathe(profile: Profile, center: Vec, mat: Material, axis: 'x' | 'y' | 'z' = 'x', sides = 24) {
    const map = (axisValue: number, radialA: number, radialB: number): Vec => axis === 'x'
      ? [axisValue, radialA, radialB]
      : axis === 'y' ? [radialA, axisValue, radialB] : [radialA, radialB, axisValue];
    for (let k = 0; k < profile.length - 1; k++) {
      const [start, r0] = profile[k], [end, r1] = profile[k + 1];
      const slope = unit([r0 - r1, end - start, 0]);
      for (let j = 0; j < sides; j++) {
        const vertex = (longitudinal: number, radius: number, theta: number): Vertex => {
          const cp = Math.cos(theta), sp = Math.sin(theta);
          const p = map(longitudinal, radius * cp, radius * sp);
          const n = map(slope[0], slope[1] * cp, slope[1] * sp);
          return { p: [p[0] + center[0], p[1] + center[1], p[2] + center[2]], n };
        };
        const a = j * Math.PI * 2 / sides, b = (j + 1) * Math.PI * 2 / sides;
        const v0 = vertex(start, r0, a), v1 = vertex(end, r1, a);
        const v2 = vertex(end, r1, b), v3 = vertex(start, r0, b);
        this.triangle(v0, v1, v2, mat);
        this.triangle(v0, v2, v3, mat);
      }
    }
  }

  cheek(profile: readonly [number, number][], y0: number, y1: number, mat: Material) {
    for (const y of [y0, y1]) {
      const n: Vec = [0, y === y0 ? -1 : 1, 0];
      const first: Vertex = { p: [profile[0][0], y, profile[0][1]], n };
      for (let j = 1; j < profile.length - 1; j++) {
        this.triangle(first, { p: [profile[j][0], y, profile[j][1]], n },
          { p: [profile[j + 1][0], y, profile[j + 1][1]], n }, mat);
      }
    }
    for (let j = 0; j < profile.length; j++) {
      const a = profile[j], b = profile[(j + 1) % profile.length];
      this.quad([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]],
        mat, unit([b[1] - a[1], 0, a[0] - b[0]]));
    }
  }

  finish(put: Parameters<HdDraw>[0]) {
    for (let y = 1; y < 127; y++) {
      for (let x = 1; x < 127; x++) {
        const i = y * CANNON_SIZE + x;
        const color = this.colors[i];
        if (!color) continue;
        const silhouette = !this.colors[i - 1] || !this.colors[i + 1]
          || !this.colors[i - CANNON_SIZE] || !this.colors[i + CANNON_SIZE];
        put(x, y, silhouette ? this.edges[i]! : color);
      }
    }
  }
}

function band(r: CannonRaster, x: number, radius: number, width: number, height: number, mat: Material) {
  r.lathe([[x - width / 2, radius - 1], [x - width / 2 + 1, radius],
    [x + width / 2 - 1, radius], [x + width / 2, radius - 1]], [0, 0, height], mat);
}

function mouth(r: CannonRaster, x: number, outer: number, inner: number, height: number, mat: Material, depth: number) {
  r.lathe([[x, outer], [x + 0.02, inner]], [0, 0, height], mat);
  r.lathe([[x, inner], [x - depth, inner * 0.82], [x - depth, 0]], [0, 0, height], BORE);
}

function trunnions(r: CannonRaster, z: number, width: number, cap: Material, cheek: Material) {
  const profile: readonly [number, number][] = [[-12, 1], [8, 1], [6, z], [2, z + 4], [-5, z + 5], [-10, z]];
  for (const side of [-1, 1]) {
    const y0 = side < 0 ? -width - 4 : width, y1 = side < 0 ? -width : width + 4;
    r.cheek(profile, y0, y1, cheek);
    const axle: [number, number][] = [[width - 2, 0], [width - 2, 4.5], [width + 4.5, 4.5],
      [width + 5.5, 3.5], [width + 5.5, 0]].map(([y, radius]) => [side * y, radius]);
    r.lathe(side < 0 ? axle.reverse() : axle, [-2, 0, z], cap, 'y');
  }
}

function culverin(r: CannonRaster) {
  const height = CANNON_BARREL_HEIGHT;
  trunnions(r, height - 1, 12, BRASS, IRON);
  r.lathe([[-29, 0], [-29, 3], [-26, 4], [-24, 3]], [0, 0, height], BRASS);
  r.lathe([[-25, 0], [-24, 5], [-21, 9], [-16, 12], [-7, 11.7],
    [9, 10], [31, 8.2], [39, 8.2], [42, 10.4], [46, 10.4]], [0, 0, height], IRON);
  band(r, -14, 12.7, 4.5, height, BRASS);
  band(r, 7, 11.3, 3, height, BRASS);
  band(r, 42.5, 11.2, 4, height, BRASS);
  mouth(r, 46, 10.4, 6.5, height, IRON, 11);
  r.lathe([[0, 0], [0, 2], [1, 2], [2.2, 0]], [-17, 0, height + 11.2], BRASS, 'z', 8);
}

// Ground-plane yaw keeps the barrel foreshortened while light stays fixed to the world.
export function drawCannon(yaw: number): HdDraw {
  return put => {
    const raster = new CannonRaster(yaw);
    culverin(raster);
    raster.finish(put);
  };
}

export function makeCannonSheet(): HTMLCanvasElement {
  const columns = 20;
  const canvas = document.createElement('canvas');
  canvas.width = columns * CANNON_SIZE;
  canvas.height = Math.ceil(CANNON_DIRECTION_COUNT / columns) * CANNON_SIZE;
  const context = canvas.getContext('2d')!;
  for (let direction = 0; direction < CANNON_DIRECTION_COUNT; direction++) {
    const yaw = direction * Math.PI * 2 / CANNON_DIRECTION_COUNT;
    context.drawImage(makeHD(CANNON_SIZE, drawCannon(yaw), { outline: false }),
      direction % columns * CANNON_SIZE, Math.floor(direction / columns) * CANNON_SIZE);
  }
  return canvas;
}

export const drawCannonFlash: HdDraw = put => {
  poly(put, [[5, 14], [11, 13], [13, 8], [18, 12], [25, 9], [23, 14], [30, 16],
    [23, 18], [25, 23], [18, 20], [13, 24], [11, 19], [5, 18]], '#b85623');
  poly(put, [[6, 15], [12, 14], [14, 11], [18, 14], [23, 12], [21, 15], [27, 16],
    [21, 17], [23, 20], [18, 18], [14, 21], [12, 18], [6, 17]], '#f5aa37');
  poly(put, [[7, 15], [13, 15], [16, 13], [18, 15], [23, 16], [18, 17],
    [16, 19], [13, 17], [7, 17]], '#ffe58b');
  poly(put, [[7, 15], [13, 15], [18, 16], [13, 17], [7, 17]], '#fff6d6');
};
