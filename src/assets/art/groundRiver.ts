// River ground, drawn at HD density: 64 texture px per 32-px world tile,
// displayed at half size by ChunkSystem so world geometry is unchanged.
//
// The look ("Cut Bank", picked from the scripts/river-studies/river.ts
// renders) is drawn from the seeded river network in riverGeometry.ts:
//   grass   the Meadow's Wild Field tones from one smooth noise octave, with
//           blade strokes, tufts, clover and flowers in drifts
//   shore   a shadowed grass lip over a narrow dark earth bank, riverstones
//           crowding the waterline, a wet strip at the water's edge
//   water   depth shading from the bank to the centreline, flow streaks
//           stretched along the current, foam at the banks, rocks standing
//           in the current with wakes, white water where the river narrows
//   bridges plank decks with stringers, rails and a shadow on the water,
//           baked into the ground where the network planned them
//
// Everything is a pure function of world position and the network, so
// chunks tile seamlessly and a revisited chunk regenerates identically.
// The base pass expands coarse noise grids row by row like the Forest and
// pays for per-pixel noise only in a band around the water.

import { RiverNet, Bridge, BRIDGE_HALF_W } from './riverGeometry';

export const RIVER_TILE_PX = 64;
/** HD px per world px. */
const HD = RIVER_TILE_PX / 32;

type Rgb = readonly [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------------------------------------------------------------- noise ----

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}

function valueNoise(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const fx = x / scale - gx, fy = y / scale - gy;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = hash2(gx, gy, seed), b = hash2(gx + 1, gy, seed);
  const c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Few octaves on purpose: large readable shapes, no speckle. */
function fbm(x: number, y: number, scale: number, seed: number, octaves: number): number {
  let sum = 0, amp = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x + i * 1013, y - i * 719, scale, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    scale *= 0.5;
  }
  return sum / norm;
}

/**
 * A field evaluated every `step` px over a region plus a margin of `pad`
 * cells on every side, so values at a chunk edge match the neighbouring
 * chunk's. `sample` is bilinear; `fillRow` expands one pixel row.
 */
class Grid {
  readonly gw: number;
  readonly gh: number;
  readonly data: Float32Array;
  constructor(readonly x0: number, readonly y0: number, w: number, h: number, readonly step: number, readonly pad: number, fn: (x: number, y: number) => number) {
    this.gw = Math.ceil(w / step) + 2 * pad + 1;
    this.gh = Math.ceil(h / step) + 2 * pad + 1;
    this.data = new Float32Array(this.gw * this.gh);
    for (let gy = 0; gy < this.gh; gy++)
      for (let gx = 0; gx < this.gw; gx++)
        this.data[gy * this.gw + gx] = fn(x0 + (gx - pad) * step, y0 + (gy - pad) * step);
  }
  sample(x: number, y: number): number {
    const fx = (x - this.x0) / this.step + this.pad, fy = (y - this.y0) / this.step + this.pad;
    const ix = Math.max(0, Math.min(this.gw - 2, fx | 0)), iy = Math.max(0, Math.min(this.gh - 2, fy | 0));
    const tx = fx - ix, ty = fy - iy;
    const i = iy * this.gw + ix, g = this.data;
    const top = g[i] + (g[i + 1] - g[i]) * tx, bot = g[i + this.gw] + (g[i + this.gw + 1] - g[i + this.gw]) * tx;
    return top + (bot - top) * ty;
  }
  /** Writes the field along the pixel row at world y, for x0..x0+w-1 of the region, into `out`. */
  fillRow(y: number, out: Float32Array, w: number): void {
    const fy = (y - this.y0) / this.step + this.pad;
    const iy = fy | 0, ty = fy - iy;
    const g = this.data, gw = this.gw, step = this.step;
    let row = iy * gw + this.pad;
    let v0 = g[row] + (g[row + gw] - g[row]) * ty;
    for (let x = 0; x < w; row++) {
      const v1 = g[row + 1] + (g[row + 1 + gw] - g[row + 1]) * ty;
      const dv = (v1 - v0) / step;
      let v = v0;
      for (let k = 0; k < step && x < w; k++, x++, v += dv) out[x] = v;
      v0 = v1;
    }
  }
}

/**
 * The river network sampled every 4 HD px over the chunk plus a margin:
 * signed distance into the water (bilinear through `dist`), and the nearest
 * sample's tangent, arc length, half width, rapids flag and bridge (nearest
 * cell through `idx`).
 */
class Field {
  readonly step = 4;
  readonly pad = 16;
  readonly gw: number; readonly gh: number; readonly gx0: number; readonly gy0: number;
  readonly d: Float32Array; readonly tx: Float32Array; readonly ty: Float32Array; readonly along: Float32Array; readonly hw: Float32Array;
  readonly rapids: Uint8Array; readonly bridge: Int16Array;
  /** Flow-streak and bank-foam noise in river-local coordinates, evaluated per cell in and near the water. */
  readonly streak: Float32Array; readonly bank: Float32Array;
  constructor(readonly net: RiverNet, x0: number, y0: number, w: number, h: number) {
    this.gx0 = Math.floor(x0 / this.step) - this.pad; this.gy0 = Math.floor(y0 / this.step) - this.pad;
    this.gw = Math.ceil(w / this.step) + 2 * this.pad + 1; this.gh = Math.ceil(h / this.step) + 2 * this.pad + 1;
    const n = this.gw * this.gh;
    this.d = new Float32Array(n); this.tx = new Float32Array(n); this.ty = new Float32Array(n); this.along = new Float32Array(n); this.hw = new Float32Array(n);
    this.rapids = new Uint8Array(n); this.bridge = new Int16Array(n).fill(-1);
    this.streak = new Float32Array(n); this.bank = new Float32Array(n);
    this.tx.fill(1);
    // Two passes: an exact query on a lattice every L cells, then the cells
    // between, queried only where the lattice says the shore or water is
    // near. The distance field is close to linear, so the grass further out
    // takes the lattice's interpolation (a few px off at most, where the
    // only thing it decides is which blades and tufts grow).
    const L = 4, NEAR = -60, gw = this.gw, gh = this.gh;
    const fill = (gx: number, gy: number) => {
      const i = gy * gw + gx;
      const wx = (this.gx0 + gx) * this.step / HD, wy = (this.gy0 + gy) * this.step / HD;
      if (net.farFromWater(wx, wy)) { this.d[i] = -999; return; }
      const q = net.query(wx, wy);
      if (q.river < 0) { this.d[i] = -999; return; }
      const d = q.d * HD, hw = q.hw * HD, along = q.along * HD;
      this.d[i] = d; this.tx[i] = q.tx; this.ty[i] = q.ty; this.along[i] = along; this.hw[i] = hw; this.rapids[i] = q.rapids ? 1 : 0;
      if (d > -40) {
        this.streak[i] = fbm(along * 0.8, (Math.max(hw, 24) - d) * 4.5, 36, 90, 2);
        this.bank[i] = fbm(along, 0, 22, 91, 2);
      }
      const b = net.bridgeAt(wx, wy);
      if (b && b.d > -24) this.bridge[i] = net.bridges.indexOf(b.bridge);
    };
    for (let gy = 0; gy < gh; gy += L)
      for (let gx = 0; gx < gw; gx += L) fill(gx, gy);
    const d = this.d;
    for (let gy = 0; gy < gh; gy++)
      for (let gx = 0; gx < gw; gx++) {
        if (gx % L === 0 && gy % L === 0) continue;
        const lx = gx - gx % L, ly = gy - gy % L;
        const lx1 = Math.min(gw - 1, lx + L), ly1 = Math.min(gh - 1, ly + L);
        const fx = (gx - lx) / L, fy = (gy - ly) / L;
        const est = (d[ly * gw + lx] * (1 - fx) + d[ly * gw + lx1] * fx) * (1 - fy) + (d[ly1 * gw + lx] * (1 - fx) + d[ly1 * gw + lx1] * fx) * fy;
        if (est > NEAR) fill(gx, gy); else d[gy * gw + gx] = est;
      }
  }
  idx(x: number, y: number): number {
    const gx = Math.max(0, Math.min(this.gw - 1, Math.round(x / this.step) - this.gx0));
    const gy = Math.max(0, Math.min(this.gh - 1, Math.round(y / this.step) - this.gy0));
    return gy * this.gw + gx;
  }
  dist(x: number, y: number): number { return this.sample(this.d, x, y); }
  /** Bilinear sample of one of the per-cell arrays at HD px (x, y). */
  sample(arr: Float32Array, x: number, y: number): number {
    const fx = x / this.step - this.gx0, fy = y / this.step - this.gy0;
    const ix = Math.max(0, Math.min(this.gw - 2, Math.floor(fx))), iy = Math.max(0, Math.min(this.gh - 2, Math.floor(fy)));
    const tx = fx - ix, ty = fy - iy, i = iy * this.gw + ix;
    const a = arr[i], b = arr[i + 1], c = arr[i + this.gw], e = arr[i + this.gw + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
  }
  /** Writes the signed distance along the pixel row at HD y, for x0..x0+w-1, into `out`. */
  fillRow(y: number, x0: number, out: Float32Array, w: number): void {
    const fy = y / this.step - this.gy0;
    const iy = Math.max(0, Math.min(this.gh - 2, Math.floor(fy))), ty = fy - iy;
    const g = this.d, gw = this.gw, step = this.step, gx0 = this.gx0, gwMax = this.gw - 2;
    for (let lx = 0; lx < w; lx++) {
      const fx = (x0 + lx) / step - gx0;
      const ix = Math.max(0, Math.min(gwMax, Math.floor(fx))), tx = fx - ix;
      const i = iy * gw + ix;
      const a = g[i], b = g[i + 1], c = g[i + gw], e = g[i + gw + 1];
      out[lx] = (a + (b - a) * tx) * (1 - ty) + (c + (e - c) * tx) * ty;
    }
  }
}

// -------------------------------------------------------------- palette ----

const BLACK = hex('#0b0f1a');
const GRASS = {
  tones: [hex('#365f2d'), hex('#3e6d33'), hex('#477a3a')] as const,
  lip: hex('#26481f'),
  blade: hex('#578f44'), bladeDark: hex('#2f5527'),
};
const TUFT_DARK = hex('#2a4f24'), TUFT_MID = hex('#4a8239'), TUFT_LIGHT = hex('#7fb757');
const LEAF = hex('#2a4f24'), STEM = hex('#315b2a');
const FLOWERS: ReadonlyArray<readonly [Rgb, Rgb]> = [
  [hex('#f2f0e6'), hex('#e8c84a')], [hex('#e8c84a'), hex('#b8822a')], [hex('#c86fb0'), hex('#f2e6f0')],
];
/** Cut Bank: a narrow dark earth bank under a shadowed grass lip, stones only at the waterline. */
const SHORE = {
  widthMin: 22, widthMax: 40,
  sand: [hex('#6e5134'), hex('#7a5a3a'), hex('#866544')] as const, sandLight: hex('#9a7a55'), sandDark: hex('#553d26'),
  wet: hex('#4e3822'), wetEdge: hex('#3e2c1a'), cut: hex('#3b2a1b'),
  stoneDensity: 0.5,
  stones: [
    [hex('#cfc7b8'), hex('#9c9486'), hex('#5f5950')],
    [hex('#b7a68c'), hex('#8c7a5e'), hex('#564838')],
    [hex('#a9adb5'), hex('#767a84'), hex('#484b55')],
  ] as ReadonlyArray<readonly [Rgb, Rgb, Rgb]>,
};
const WATER = {
  shallow: hex('#5f9fa0'), mid: hex('#3b7fa3'), deep: hex('#2a5f8f'),
  streak: hex('#8fcfd6'), streakDark: hex('#2b5a80'), foam: hex('#eef7f5'), foamSoft: hex('#b9dde0'), rapids: hex('#7fb7c4'),
  rock: [hex('#b3b7bd'), hex('#8d9199'), hex('#5a5e68'), hex('#3a3d47')] as const,
};
export const RIVER_WATER_STREAK = WATER.streak;
export const RIVER_WATER_FOAM = WATER.foam;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- stamps ----

type Put = (x: number, y: number, c: Rgb, alpha?: number) => void;

function line(put: Put, x0: number, y0: number, x1: number, y1: number, c: Rgb, alpha = 1): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c, alpha);
}

function ellipse(put: Put, cx: number, cy: number, rx: number, ry: number, c: Rgb, alpha = 1): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, c, alpha);
}

/** A clump of 3–5 grass blades lit from the top-left, 2 px wide for their lower two thirds. */
function tuft(put: Put, x: number, y: number, size: number, seed: number): void {
  const blades = 3 + Math.floor(hash2(x, y, seed) * 3);
  const spread = size * 0.55;
  for (let i = 0; i < blades; i++) {
    const t = i / (blades - 1);
    const bx = x + (t - 0.5) * spread * 2;
    const lean = (t - 0.5) * size * 0.9 + (hash2(i, x, seed) - 0.5) * 2;
    const hgt = size * (0.65 + 0.35 * hash2(x + i, y, seed)) * (1 - Math.abs(t - 0.5) * 0.4);
    const tipX = bx + lean, tipY = y - hgt;
    line(put, bx, y, tipX, tipY, t < 0.4 ? TUFT_LIGHT : t > 0.7 ? TUFT_DARK : TUFT_MID);
    const mx = bx + (tipX - bx) * 0.66, my = y + (tipY - y) * 0.66;
    line(put, bx + 1, y, Math.round(mx) + 1, Math.round(my), t < 0.4 ? TUFT_MID : TUFT_DARK);
  }
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y + 1, TUFT_DARK, 0.6);
}

/** A ring of big five-petal flowers on short stems. */
function flowers(put: Put, x: number, y: number, petal: Rgb, center: Rgb, seed: number): void {
  const count = 3 + Math.floor(hash2(x, y, seed) * 4);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + hash2(i, y, seed) * 1.2;
    const r = 3 + hash2(x, i, seed) * 12;
    const fx = Math.round(x + Math.cos(a) * r), fy = Math.round(y + Math.sin(a) * r * 0.6);
    line(put, fx, fy + 1, fx, fy + 5, STEM);
    put(fx + (i % 2 ? 1 : -1), fy + 4, LEAF);
    put(fx - 1, fy, petal); put(fx + 1, fy, petal); put(fx, fy - 1, petal); put(fx, fy + 1, petal);
    put(fx - 1, fy - 1, petal); put(fx + 1, fy - 1, petal); put(fx - 1, fy + 1, petal); put(fx + 1, fy + 1, petal);
    put(fx, fy, center);
  }
}

/** A scatter of 2-px clover leaves. */
function clover(put: Put, x: number, y: number, seed: number): void {
  const n = 6 + Math.floor(hash2(x, y, seed) * 6);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 22), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 14);
    put(px, py, TUFT_DARK); put(px + 1, py, TUFT_DARK); put(px, py + 1, TUFT_DARK); put(px + 1, py + 1, TUFT_DARK);
    put(px, py, TUFT_MID);
  }
}

/** A riverstone: a small rounded pebble lit from the top-left with a faint ground shadow. */
function stone(put: Put, x: number, y: number, r: number, c: readonly [Rgb, Rgb, Rgb], seed: number): void {
  const rx = r * (0.9 + hash2(x, y, seed) * 0.5), ry = r * (0.65 + hash2(y, x, seed) * 0.3);
  ellipse(put, x + 1, y + 1, rx, ry, BLACK, 0.25);
  ellipse(put, x, y, rx, ry, c[2]);
  ellipse(put, x - rx * 0.15, y - ry * 0.2, rx * 0.8, ry * 0.75, c[1]);
  ellipse(put, x - rx * 0.35, y - ry * 0.4, rx * 0.4, ry * 0.35, c[0]);
}

/** A rock standing in the current: wet grey boulder, foam piling on its upstream side, a wake behind. */
function riverRock(put: Put, x: number, y: number, r: number, tx: number, ty: number, seed: number): void {
  const W = WATER;
  const rx = r * (0.9 + hash2(x, y, seed) * 0.4), ry = r * (0.7 + hash2(y, x, seed) * 0.25);
  const nx = -ty, ny = tx;
  const len = r * 2.2 + hash2(x, seed, 3) * r * 1.5;
  for (let s = 0; s < len; s += 1) {
    const a = 0.85 * (1 - s / len);
    const spread = ry * 0.9 + s * 0.25;
    const fx = x + tx * (rx * 0.5 + s), fy = y + ty * (rx * 0.5 + s);
    for (let q = -spread; q <= spread; q += 1) {
      const px = Math.round(fx + nx * q), py = Math.round(fy + ny * q);
      const edge = Math.abs(Math.abs(q) - spread) < 1.5;
      if (edge) put(px, py, W.foam, a);
      else if (hash2(px, py, 8) < 0.3 - s / len * 0.25) put(px, py, W.foamSoft, a * 0.7);
    }
  }
  for (let i = -1; i <= 1; i++) {
    const cx = x - tx * (rx + 1) + nx * i * 2, cy = y - ty * (rx + 1) + ny * i * 2;
    put(Math.round(cx), Math.round(cy), W.foam, 0.9);
    put(Math.round(cx - tx), Math.round(cy - ty), W.foamSoft, 0.6);
  }
  ellipse(put, x + 1, y + 2, rx + 1, ry + 1, BLACK, 0.25);
  ellipse(put, x, y, rx + 1, ry + 1, W.rock[3]);
  ellipse(put, x, y, rx, ry, W.rock[1]);
  ellipse(put, x + rx * 0.2, y + ry * 0.3, rx * 0.8, ry * 0.65, W.rock[2]);
  ellipse(put, x - rx * 0.25, y - ry * 0.3, rx * 0.5, ry * 0.4, W.rock[0]);
  put(x + Math.round(rx * 0.3), y - 1, W.rock[2]);
}

/** Visits one jittered point per `cell`-px cell over the region plus a margin, so props straddling chunk edges are drawn by both chunks and clip to each. */
function propGrid(x0: number, y0: number, w: number, h: number, cell: number, seed: number, margin: number, fn: (x: number, y: number, roll: number, id: number) => void): void {
  const cx0 = Math.floor((x0 - margin) / cell), cy0 = Math.floor((y0 - margin) / cell);
  const cx1 = Math.ceil((x0 + w + margin) / cell), cy1 = Math.ceil((y0 + h + margin) / cell);
  const pad = Math.min(6, cell / 4);
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      const px = Math.floor(cx * cell + pad + hash2(cx, cy, seed + 1) * (cell - 2 * pad));
      const py = Math.floor(cy * cell + pad + hash2(cx, cy, seed + 2) * (cell - 2 * pad));
      fn(px, py, hash2(cx, cy, seed), Math.abs(cx * 7919 + cy));
    }
}

/** Rocks standing in the water near a region, HD px. Shared with the flow effects so wake flecks match. */
export function riverRockSites(net: RiverNet, x0: number, y0: number, w: number, h: number): { x: number; y: number; r: number; tx: number; ty: number; i: number }[] {
  return rockSites(new Field(net, x0, y0, w, h), x0, y0, w, h);
}

function rockSites(field: Field, x0: number, y0: number, w: number, h: number): { x: number; y: number; r: number; tx: number; ty: number; i: number }[] {
  const out: { x: number; y: number; r: number; tx: number; ty: number; i: number }[] = [];
  propGrid(x0, y0, w, h, 44, 301, 64, (x, y, rr, i) => {
    const d = field.dist(x, y);
    if (d < 16) return;
    const k = field.idx(x, y);
    if (field.bridge[k] >= 0) return;
    const chance = field.rapids[k] ? 0.2 : 0.055;
    if (rr > chance) return;
    out.push({ x, y, r: 7 + hash2(x, y, 7) * 6, tx: field.tx[k], ty: field.ty[k], i });
  });
  return out;
}

/** A plank bridge across the river, baked into the ground: deck, stringers, rails, a shadow on the water. */
function drawBridge(put: Put, mul: (x: number, y: number, f: number) => void, b: Bridge, x0: number, y0: number, w: number, h: number): void {
  const bx = b.x * HD, by = b.y * HD, halfLen = b.halfLen * HD, halfW = BRIDGE_HALF_W * HD;
  const nx = b.nx, ny = b.ny, px = -ny, py = nx; // n: along the deck (across the river), p: across the deck
  const reach = halfLen + halfW + 16;
  const xa = Math.max(x0, Math.floor(bx - reach)), xb = Math.min(x0 + w, Math.ceil(bx + reach));
  const ya = Math.max(y0, Math.floor(by - reach)), yb = Math.min(y0 + h, Math.ceil(by + reach + 12));
  // shadow: the deck's outline dropped 10 px down the screen
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const dx = x - bx, dy = y - 10 - by;
      const u = dx * nx + dy * ny, v = dx * px + dy * py;
      if (Math.abs(u) <= halfLen && Math.abs(v) <= halfW) mul(x, y, 0.72);
    }
  const WOOD: Rgb[] = [hex('#8a5a2e'), hex('#9a6a3a'), hex('#7a4e26')];
  const SEAM = hex('#3e2612'), LIGHT = hex('#b88550'), BEAM = hex('#5a3a1c'), BEAM_LIGHT = hex('#7a5230');
  const PLANK = 7;
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const dx = x - bx, dy = y - by;
      const u = dx * nx + dy * ny, v = dx * px + dy * py;
      if (Math.abs(u) > halfLen || Math.abs(v) > halfW) continue;
      if (Math.abs(v) > halfW - 5) { put(x, y, Math.abs(v) > halfW - 2 ? SEAM : v < 0 ? BEAM_LIGHT : BEAM); continue; }
      const k = u + halfLen, p = Math.floor(k / PLANK);
      if (k - p * PLANK < 1) { put(x, y, SEAM); continue; }
      put(x, y, WOOD[Math.floor(hash2(p, b.river, 5) * 3)]);
      if (k - p * PLANK < 2) put(x, y, LIGHT, 0.5);
      const nv = Math.abs(Math.abs(v) - (halfW - 11));
      if (p % 2 === 0 && nv <= 1 && k - p * PLANK >= 3 && k - p * PLANK < 5) put(x, y, SEAM, 0.85);
    }
  // end sills where the deck meets the bank
  for (const side of [-1, 1])
    for (let v = -halfW; v <= halfW; v++) {
      const u = side * halfLen;
      put(Math.round(bx + nx * u + px * v), Math.round(by + ny * u + py * v), SEAM, 0.8);
    }
  // rails: posts every 28 px along the deck on both edges, a bar between post tops
  const POST = 12;
  for (const side of [-1, 1]) {
    const v = side * (halfW - 2);
    let prev: [number, number] | null = null;
    for (let u = -halfLen + 6; u <= halfLen - 4; u += 28) {
      const x = Math.round(bx + nx * u + px * v), y = Math.round(by + ny * u + py * v);
      if (prev) { line(put, prev[0], prev[1] - POST + 2, x, y - POST + 2, LIGHT); line(put, prev[0], prev[1] - POST + 3, x, y - POST + 3, BEAM); }
      prev = [x, y];
    }
    for (let u = -halfLen + 6; u <= halfLen - 4; u += 28) {
      const x = Math.round(bx + nx * u + px * v), y = Math.round(by + ny * u + py * v);
      for (let k = 0; k < POST; k++) { put(x, y - k, BEAM); put(x + 1, y - k, SEAM); put(x - 1, y - k, BEAM_LIGHT); }
      put(x, y - POST, LIGHT); put(x - 1, y - POST, LIGHT);
    }
  }
}

// ---------------------------------------------------------------- chunk ----

/**
 * Fills an RGBA buffer of `size`×`size` HD px whose top-left corner sits at
 * HD px (x0, y0), from the river network.
 */
export function drawRiverChunk(buf: Uint8ClampedArray, size: number, x0: number, y0: number, net: RiverNet): void {
  const w = size, h = size;
  const field = new Field(net, x0, y0, w, h);
  const toneBase = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(x, y, 900, 23, 1));
  const toneWobble = new Grid(x0, y0, w, h, 8, 1, (x, y) => (fbm(x, y, 34, 25, 2) - 0.5) * 0.04);
  const sandTone = new Grid(x0, y0, w, h, 8, 1, (x, y) => fbm(x, y, 110, 33, 1));
  const shoreW = new Grid(x0, y0, w, h, 8, 8, (x, y) => {
    const t = fbm(x, y, 150, 88, 1);
    return SHORE.widthMin + (SHORE.widthMax - SHORE.widthMin) * Math.max(0, Math.min(1, (t - 0.3) / 0.4));
  });
  const dapple = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(x, y, 650, 52, 1));

  const dRow = new Float32Array(w), tRow = new Float32Array(w), wRow = new Float32Array(w), kRow = new Float32Array(w), sRow = new Float32Array(w), lRow = new Float32Array(w);
  let i = 0;
  for (let ly = 0; ly < h; ly++) {
    const y = y0 + ly;
    field.fillRow(y, x0, dRow, w); toneBase.fillRow(y, tRow, w); toneWobble.fillRow(y, wRow, w);
    sandTone.fillRow(y, kRow, w); shoreW.fillRow(y, sRow, w); dapple.fillRow(y, lRow, w);
    for (let lx = 0; lx < w; lx++, i += 4) {
      const x = x0 + lx;
      let d = dRow[lx];
      let r: number, g: number, b: number;
      const sw = sRow[lx];
      // ragged edges: wobble the distance only where it can change the band
      if (d > -sw - 8 && d < 12) d += (fbm(x, y, 14, 61, 2) - 0.5) * 7;
      {
        if (d < -sw - 4) {
          const t = tRow[lx] + wRow[lx];
          const c = GRASS.tones[t < 0.45 ? 0 : t < 0.6 ? 1 : 2];
          r = c[0]; g = c[1]; b = c[2];
        } else if (d < -sw) {
          r = GRASS.lip[0]; g = GRASS.lip[1]; b = GRASS.lip[2];
        } else if (d < -10) {
          const t = kRow[lx];
          let c: Rgb = SHORE.sand[t < 0.42 ? 0 : t < 0.6 ? 1 : 2];
          if (d < -sw + 6) c = mix(c, SHORE.cut, d < -sw + 3 ? 0.8 : 0.45);
          const cr = valueNoise(x, y, 10, 43);
          if (cr > 0.9) c = SHORE.sandLight; else if (cr < 0.07) c = SHORE.sandDark;
          r = c[0]; g = c[1]; b = c[2];
        } else if (d < -1) {
          const c = d < -5 ? SHORE.wet : SHORE.wetEdge;
          r = c[0]; g = c[1]; b = c[2];
        } else {
          const k = field.idx(x, y);
          const hw = Math.max(field.hw[k], 24), along = field.along[k];
          const across = hw - d;                              // 0 on the centreline
          const depth = Math.max(0, Math.min(1, d / (hw * 0.85)));
          const ca = depth < 0.5 ? WATER.shallow : WATER.mid, cb = depth < 0.5 ? WATER.mid : WATER.deep, ct = depth < 0.5 ? depth * 2 : (depth - 0.5) * 2;
          r = ca[0] + (cb[0] - ca[0]) * ct; g = ca[1] + (cb[1] - ca[1]) * ct; b = ca[2] + (cb[2] - ca[2]) * ct;
          const blend = (c: Rgb, t: number) => { r += (c[0] - r) * t; g += (c[1] - g) * t; b += (c[2] - b) * t; };
          const rapids = field.rapids[k] === 1;
          if (rapids) blend(WATER.rapids, 0.45);
          // flow streaks: noise stretched along the current in river-local coordinates
          if (d > 5) {
            const v = field.sample(field.streak, x, y);
            if (v > 0.63) blend(WATER.streak, rapids ? 0.45 : 0.28);
            else if (v < 0.36) blend(WATER.streakDark, 0.18);
            if (rapids) {
              const f = fbm(along * 1.4 + across * 0.8, across * 2.2, 9, 94, 2);
              if (f > 0.72) blend(WATER.foam, 0.7);
              else if (f > 0.66) blend(WATER.foamSoft, 0.4);
            }
          }
          // bank foam and the pale wet line along the water's edge
          if (d < 2.5) blend(WATER.foamSoft, 0.45);
          if (d < 5 && field.sample(field.bank, x, y) > 0.58) blend(WATER.foam, d < 3 ? 0.8 : 0.4);
        }
      }
      const l = 0.94 + lRow[lx] * 0.12;
      buf[i] = r * l; buf[i + 1] = g * l; buf[i + 2] = b * l; buf[i + 3] = 255;
    }
  }

  const put: Put = (x, y, c, alpha = 1) => {
    const lx = x - x0, ly = y - y0;
    if (lx < 0 || ly < 0 || lx >= w || ly >= h) return;
    const j = (ly * w + lx) * 4;
    if (alpha >= 1) { buf[j] = c[0]; buf[j + 1] = c[1]; buf[j + 2] = c[2]; return; }
    buf[j] += (c[0] - buf[j]) * alpha;
    buf[j + 1] += (c[1] - buf[j + 1]) * alpha;
    buf[j + 2] += (c[2] - buf[j + 2]) * alpha;
  };
  const mul = (x: number, y: number, f: number) => {
    const lx = x - x0, ly = y - y0;
    if (lx < 0 || ly < 0 || lx >= w || ly >= h) return;
    const j = (ly * w + lx) * 4;
    buf[j] *= f; buf[j + 1] *= f; buf[j + 2] *= f;
  };
  const distAt = (x: number, y: number) => field.dist(x, y);
  const tuftDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 73, 1));
  const flowerDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 340, 71, 1));

  // blade strokes over open grass, denser in drifts
  propGrid(x0, y0, w, h, 9, 201, 8, (x, y, roll) => {
    if (roll > 0.3 + tuftDrift.sample(x, y) * 0.6 || distAt(x, y) > -shoreW.sample(x, y) - 10) return;
    line(put, x, y, x + 2, y - 4, roll < 0.25 ? GRASS.blade : GRASS.bladeDark, 0.5);
  });
  // riverstones crowd the waterline, a few higher up the bank
  propGrid(x0, y0, w, h, 13, 302, 24, (x, y, roll, id) => {
    const d = distAt(x, y), sw = shoreW.sample(x, y);
    if (d > -8 || d < -sw + 4) return;
    const density = d > -sw * 0.45 ? SHORE.stoneDensity : 0.08;
    if (roll > density) return;
    const pal = SHORE.stones[Math.floor(hash2(x, y, 4) * SHORE.stones.length)];
    stone(put, x, y, 2 + hash2(id, x, 5) * 3.5, pal, id);
  });
  // rocks in the current
  for (const s of rockSites(field, x0, y0, w, h)) riverRock(put, s.x, s.y, s.r, s.tx, s.ty, s.i);
  // tufts crowd the lip; open grass gets the Meadow's props
  propGrid(x0, y0, w, h, 40, 102, 48, (x, y, roll, id) => {
    const d = distAt(x, y), sw = shoreW.sample(x, y);
    if (d > -sw - 2) return;
    if (d > -sw - 24) { if (roll < 0.7) tuft(put, x, y - 1, 11 + roll * 7, id); return; }
    const flowery = flowerDrift.sample(x, y) > 0.6, tufty = tuftDrift.sample(x, y) > 0.42;
    if (roll < 0.4) { if (tufty) tuft(put, x, y, 9 + roll * 14, id); }
    else if (roll < 0.46) clover(put, x, y, id);
    else if (roll < 0.62) { if (flowery) { const f = FLOWERS[(id + 2) % FLOWERS.length]; flowers(put, x, y, f[0], f[1], id); } }
  });
  // bridges
  for (const b of net.bridges) {
    const bx = b.x * HD, by = b.y * HD, reach = (b.halfLen + BRIDGE_HALF_W) * HD + 24;
    if (bx + reach < x0 || bx - reach > x0 + w || by + reach < y0 || by - reach > y0 + h) continue;
    drawBridge(put, mul, b, x0, y0, w, h);
  }
}
