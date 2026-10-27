import type { HdDraw } from '../../src/assets/art/hd';

export const CANNON_SIZE = 128;
export const CANNON_OPTIONS = [
  { id: 'A', name: 'Brassbound culverin', description: 'A tapered dark-iron barrel, warm reinforcement rings, and a rounded breech.' },
  { id: 'B', name: 'Broadmouth bombard', description: 'A squat, broad iron cannon with a heavy flared muzzle and compact trunnions.' },
  { id: 'C', name: 'Riveted long gun', description: 'A longer steel barrel in an angular riveted yoke, finished with aged brass.' },
] as const;

type Vec = [number, number, number];
type Paint = `#${string}`;
type Material = { colors: readonly Paint[]; edge: Paint };
type Vertex = { p: Vec; n: Vec };
type Profile = readonly [number, number][];

const IRON: Material = {
  edge: '#141b25',
  colors: ['#1c232e', '#28323f', '#343f4f', '#3e495a', '#566275', '#788699'],
};
const BLACK_IRON: Material = {
  edge: '#151923',
  colors: ['#20232f', '#2b303e', '#363d4d', '#424a5c', '#5c687d', '#818ea3'],
};
const STEEL: Material = {
  edge: '#131c29',
  colors: ['#1c2734', '#2a3849', '#36475a', '#46576b', '#64788f', '#90a2b8'],
};
const BRASS: Material = {
  edge: '#453426',
  colors: ['#51402c', '#6b5134', '#89683d', '#a78750', '#c1a36a', '#d8bf87'],
};
const DARK_BRASS: Material = {
  edge: '#383124',
  colors: ['#443b2b', '#5e5135', '#7c6c43', '#9b895a', '#b5a575', '#cbbb90'],
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

const GROUND_Y = 0.68;
const HEIGHT_Y = Math.sqrt(1 - GROUND_Y * GROUND_Y);
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
      return { x: 64 + p[0], y: 64 + p[1] * GROUND_Y - p[2] * HEIGHT_Y,
        depth: p[1] * HEIGHT_Y + p[2] * GROUND_Y, n: this.rotate(v.n) };
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

function trunnions(r: CannonRaster, z: number, width: number, cap: Material, cheek: Material, angular = false) {
  const profile: readonly [number, number][] = angular
    ? [[-15, 1], [10, 1], [8, 6], [4, z + 2], [-4, z + 5], [-10, z + 2]]
    : [[-12, 1], [8, 1], [6, z], [2, z + 4], [-5, z + 5], [-10, z]];
  for (const side of [-1, 1]) {
    const y0 = side < 0 ? -width - 4 : width, y1 = side < 0 ? -width : width + 4;
    r.cheek(profile, y0, y1, cheek);
    const axle: [number, number][] = [[width - 2, 0], [width - 2, 4.5], [width + 4.5, 4.5],
      [width + 5.5, 3.5], [width + 5.5, 0]].map(([y, radius]) => [side * y, radius]);
    r.lathe(side < 0 ? axle.reverse() : axle, [-2, 0, z], cap, 'y');
    if (angular) {
      for (const x of [-10, 5]) {
        const boltY = side * (width + 4.2);
        r.lathe([[-0.7, 0], [-0.7, 1.5], [0.7, 1.5], [1.3, 0]], [x, boltY, 4.3], BRASS, 'y', 8);
      }
    }
  }
}

function culverin(r: CannonRaster) {
  const height = 12;
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

function bombard(r: CannonRaster) {
  const height = 16;
  trunnions(r, 11, 16, DARK_BRASS, BLACK_IRON);
  r.lathe([[-27, 0], [-27, 4], [-23, 5]], [0, 0, height], BLACK_IRON);
  r.lathe([[-25, 0], [-24, 7], [-21, 12], [-15, 15.8], [-7, 15.8],
    [7, 13.5], [17, 13.5], [25, 17.5], [32, 17.5]], [0, 0, height], BLACK_IRON);
  band(r, -13, 17, 5, height, DARK_BRASS);
  band(r, 8, 14.8, 4.5, height, BLACK_IRON);
  band(r, 27, 18.2, 6, height, BLACK_IRON);
  mouth(r, 32, 17.5, 11.5, height, DARK_BRASS, 16);
  for (const phi of [Math.PI * 0.2, Math.PI * 0.5, Math.PI * 0.8]) {
    const y = Math.cos(phi) * 16.4, z = height + Math.sin(phi) * 16.4;
    r.lathe([[-1.1, 0], [-1.1, 1.3], [1.1, 1.3], [1.7, 0]], [-13, y, z], BRASS, 'x', 8);
  }
}

function longGun(r: CannonRaster) {
  const height = 12;
  trunnions(r, height - 1, 11, DARK_BRASS, IRON, true);
  r.lathe([[-27, 0], [-27, 3.5], [-23, 4], [-21, 3.5]], [0, 0, height], STEEL, 'x', 12);
  r.lathe([[-23, 0], [-23, 7], [-20, 10.5], [-9, 10.5], [-3, 9.5],
    [11, 8.1], [38, 7.1], [45, 7.1], [48, 8.3], [51, 8.3]], [0, 0, height], STEEL, 'x', 16);
  band(r, -19, 11.5, 4, height, IRON);
  band(r, -5, 10.8, 3.4, height, DARK_BRASS);
  band(r, 45.5, 8.8, 3, height, IRON);
  mouth(r, 51, 8.3, 5.5, height, STEEL, 12);
  r.cheek([[-16, height + 10], [-8, height + 10], [-8, height + 12], [-16, height + 12]], -1.5, 1.5, IRON);
  r.cheek([[39, height + 7], [42, height + 7], [42, height + 10], [39, height + 10]], -1, 1, DARK_BRASS);
}

// The angle is ground-plane yaw; foreshortening changes its screen-space bearing.
export function drawCannonOption(id: string, angle: number): HdDraw {
  return put => {
    const raster = new CannonRaster(angle);
    if (id === 'A') culverin(raster);
    else if (id === 'B') bombard(raster);
    else if (id === 'C') longGun(raster);
    else throw new Error(`Unknown cannon option: ${id}`);
    raster.finish(put);
  };
}
