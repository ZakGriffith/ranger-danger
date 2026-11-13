// Meadow (grasslands) ground, drawn at HD density: 64 texture px per 32-px
// world tile, the same pixel density as the HD sprites (hd.ts). ChunkSystem
// displays the chunk texture at half size so world geometry is unchanged.
//
// The look (the "Bounty of One" pass from scripts/meadow-studies):
//   grass   two flat greens in large regions from one smooth noise octave,
//           with a faint wobble so the thin band between them stays
//           irregular; no texture on the open field
//   dirt    domain-warped patches of light tan in two flat tones, with a
//           cel edge: a thin grass-shadow on the grass side, then a dark
//           outline and a pale lip on the dirt side
//   props   outlined grass tufts, flower drifts, clover, mushrooms — placed
//           on a jittered cell grid and gated by slow drift fields so they
//           group instead of sprinkling evenly
//
// Everything is a pure function of world position, so chunks tile seamlessly
// and a revisited chunk regenerates identically. A 1024² chunk is a million
// pixels, so the base pass is budgeted: every noise field is evaluated on a
// coarse grid per chunk and expanded row by row with incremental
// interpolation, pixels are written as packed 32-bit words, and the only
// per-pixel noise (the contour wobble) runs in a narrow band around the
// dirt edge.

export const MEADOW_TILE_PX = 64;

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
 * chunk's. `sample` is bilinear; `fillRow` expands one pixel row with
 * incremental interpolation, which is what the base pass uses.
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
    const ix = fx | 0, iy = fy | 0;
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
 * Signed distance in px from the dirt contour, positive inside dirt, built
 * from the warped field value and its gradient on a step-4 grid.
 */
function dirtDistance(x0: number, y0: number, w: number, h: number, warpX: Grid, warpY: Grid): Grid {
  // the props pass samples the distance up to PROP_MARGIN px outside the chunk
  const step = 4, pad = PROP_MARGIN / step + 1;
  const n = new Grid(x0, y0, w, h, step, pad, (x, y) => fbm(warpX.sample(x, y), warpY.sample(x, y), 520, 11, 2));
  const g = n.data, gw = n.gw;
  const dist = new Grid(x0, y0, w, h, step, pad - 1, () => 0);
  for (let gy = 0; gy < dist.gh; gy++)
    for (let gx = 0; gx < dist.gw; gx++) {
      const i = (gy + 1) * gw + gx + 1;
      const grad = Math.hypot((g[i + 1] - g[i - 1]) / (2 * step), (g[i + gw] - g[i - gw]) / (2 * step));
      const v = (g[i] - DIRT_THRESHOLD) / Math.max(grad, 1e-4);
      dist.data[gy * dist.gw + gx] = v < -80 ? -80 : v > 80 ? 80 : v;
    }
  return dist;
}

// -------------------------------------------------------------- palette ----

const DIRT_THRESHOLD = 0.60;
const GRASS_TONE_SCALE = 900;
const PROP_MARGIN = 48;

const GRASS: readonly Rgb[] = [hex('#5aa548'), hex('#68b454')];
const GRASS_SHADOW = hex('#3f8438');
const EDGE = hex('#533823');
const LIP = hex('#e7cc9c');
const DIRT: readonly Rgb[] = [hex('#c9a775'), hex('#d4b483')];

const OUTLINE = hex('#1f3a22');
const TUFT_DARK = hex('#3b8236'), TUFT_MID = hex('#63b650'), TUFT_LIGHT = hex('#a9e472');
const STEM = hex('#3b8236');
const MUSH_CAP = hex('#d2563a'), MUSH_CAP_LIGHT = hex('#f3b48e'), MUSH_STALK = hex('#f4e8d0');

const FLOWERS: ReadonlyArray<readonly [Rgb, Rgb]> = [
  [hex('#e2463b'), hex('#f7c84a')],
  [hex('#f2cf3a'), hex('#c46a1c')],
  [hex('#f5f1e8'), hex('#f2cf3a')],
  [hex('#b56fd6'), hex('#f5f1e8')],
  [hex('#6f9cea'), hex('#f5f1e8')],
];

// Base-pass colours packed as little-endian ABGR for a Uint32 write per pixel.
const pack = ([r, g, b]: Rgb) => (0xff << 24 | b << 16 | g << 8 | r) >>> 0;
const BASE = new Uint32Array([...GRASS, GRASS_SHADOW, EDGE, LIP, ...DIRT].map(pack));
const BASE_GRASS = 0, BASE_SHADOW = 2, BASE_EDGE = 3, BASE_LIP = 4, BASE_DIRT = 5;

// ---------------------------------------------------------------- props ----

type Put = (x: number, y: number, c: Rgb, alpha?: number) => void;

function line(put: Put, x0: number, y0: number, x1: number, y1: number, c: Rgb, alpha = 1): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c, alpha);
}

function ellipse(put: Put, cx: number, cy: number, rx: number, ry: number, c: Rgb): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, c);
}

/** A clump of 3–5 grass blades lit from the top-left, 2 px wide for their lower two thirds, grounded by a short outline. */
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
  for (let dx = -2; dx <= 2; dx++) put(x + dx, y + 2, OUTLINE, 0.35);
}

/** 3–6 outlined flower heads of one colour on short stems with a leaf. */
function flowers(put: Put, x: number, y: number, petal: Rgb, center: Rgb, seed: number): void {
  const count = 3 + Math.floor(hash2(x, y, seed) * 4);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + hash2(i, y, seed) * 1.2;
    const r = 3 + hash2(x, i, seed) * 12;
    const fx = Math.round(x + Math.cos(a) * r), fy = Math.round(y + Math.sin(a) * r * 0.6);
    line(put, fx, fy + 1, fx, fy + 5, STEM);
    put(fx + (i % 2 ? 1 : -1), fy + 4, TUFT_DARK);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(fx + dx, fy + dy, petal);
    put(fx, fy, center);
    put(fx, fy - 2, OUTLINE, 0.5); put(fx - 2, fy, OUTLINE, 0.5); put(fx + 2, fy, OUTLINE, 0.5); put(fx, fy + 2, OUTLINE, 0.5);
  }
}

/** Darker-green clover patch — breaks up open grass without any props. */
function clover(put: Put, x: number, y: number, seed: number): void {
  const n = 6 + Math.floor(hash2(x, y, seed) * 6);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 22), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 14);
    put(px + 1, py, TUFT_DARK); put(px, py + 1, TUFT_DARK); put(px + 1, py + 1, TUFT_DARK);
    put(px, py, TUFT_MID);
  }
}

function mushrooms(put: Put, x: number, y: number, seed: number): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2);
    const r = 2 + Math.floor(hash2(i, y, seed) * 2), ry = Math.max(1.5, r * 0.6);
    line(put, px, py, px, py + 3, MUSH_STALK);
    line(put, px + 1, py + 1, px + 1, py + 3, OUTLINE, 0.6);
    ellipse(put, px, py, r + 1, ry + 1, OUTLINE);
    ellipse(put, px, py, r, ry, MUSH_CAP);
    put(px - 1, py - 1, MUSH_CAP_LIGHT);
  }
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

// ---------------------------------------------------------------- chunk ----

/**
 * Fills an RGBA buffer of `size`×`size` HD px whose top-left corner sits at
 * world HD px (x0, y0).
 */
export function drawMeadowChunk(buf: Uint8ClampedArray, size: number, x0: number, y0: number): void {
  const w = size, h = size;
  // the warp is smooth enough for a 16-px grid; its margin covers the distance grid's own margin
  const warpX = new Grid(x0, y0, w, h, 16, 5, (x, y) => x + (fbm(x, y, 340, 81, 1) - 0.5) * 220);
  const warpY = new Grid(x0, y0, w, h, 16, 5, (x, y) => y + (fbm(x, y, 340, 82, 1) - 0.5) * 220);
  const dist = dirtDistance(x0, y0, w, h, warpX, warpY);
  const toneBase = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(warpX.sample(x, y), warpY.sample(x, y), GRASS_TONE_SCALE, 23, 1));
  const toneWobble = new Grid(x0, y0, w, h, 8, 1, (x, y) => (fbm(x, y, 34, 25, 2) - 0.5) * 0.04);
  const dirtTone = new Grid(x0, y0, w, h, 8, 1, (x, y) => fbm(x, y, 140, 34, 1));

  const px32 = new Uint32Array(buf.buffer, buf.byteOffset, w * h);
  const dRow = new Float32Array(w), tRow = new Float32Array(w), wRow = new Float32Array(w), kRow = new Float32Array(w);
  let i = 0;
  for (let ly = 0; ly < h; ly++) {
    const y = y0 + ly;
    dist.fillRow(y, dRow, w); toneBase.fillRow(y, tRow, w); toneWobble.fillRow(y, wRow, w); dirtTone.fillRow(y, kRow, w);
    for (let lx = 0; lx < w; lx++, i++) {
      let d = dRow[lx];
      // a gentle contour wobble, only where it can change the band
      if (d > -3.5 && d < 6) d += (fbm(x0 + lx, y, 20, 61, 2) - 0.5) * 2;
      let ci: number;
      if (d < -2.5) ci = BASE_GRASS + (tRow[lx] + wRow[lx] < 0.52 ? 0 : 1);
      else if (d < 0) ci = BASE_SHADOW;
      else if (d < 3) ci = BASE_EDGE;
      else if (d < 5) ci = BASE_LIP;
      else ci = BASE_DIRT + (kRow[lx] < 0.5 ? 0 : 1);
      px32[i] = BASE[ci];
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

  const tuftDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 73, 1));
  const flowerDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 340, 71, 1));

  propGrid(x0, y0, w, h, 40, 102, PROP_MARGIN, (x, y, roll, id) => {
    const d = dist.sample(x, y);
    if (d > 6) return;
    if (d > -16) { if (roll < 0.7) tuft(put, x, y - 1, (11 + roll * 7) * 1.25, id); return; }
    if (roll < 0.4) { if (tuftDrift.sample(x, y) > 0.42) tuft(put, x, y, (9 + roll * 14) * 1.25, id); }
    else if (roll < 0.46) clover(put, x, y, id);
    else if (roll < 0.62) { if (flowerDrift.sample(x, y) > 0.6) { const f = FLOWERS[(id + 2) % FLOWERS.length]; flowers(put, x, y, f[0], f[1], id); } }
    else if (roll >= 0.725 && roll < 0.74) mushrooms(put, x, y, id);
  });
}
