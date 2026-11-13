// Forest ground, drawn at HD density: 64 texture px per 32-px world tile,
// the same pixel density as the HD sprites (hd.ts). ChunkSystem displays the
// chunk texture at half size so world geometry is unchanged.
//
// The look ("Pine Floor", picked from the scripts/meadow-studies/forest.ts
// renders) shares its bones with the Meadow (groundMeadow.ts):
//   grass   three cool dark greens in large regions from one smooth noise
//           octave, with a faint wobble; short diagonal blade strokes in drifts
//   dirt    domain-warped bare-earth patches; a dark overhang on the grass
//           side, two ambient-occlusion bands on the dirt side, ragged grass
//           fingers along the contour, and a carpet of rust needle litter
//           that thins from the rim inward; a sparse crust of flecks inside
//   props   grass tufts and ferns along the edges, tufts / ferns / fallen
//           leaves / twigs / mushrooms in the open, pale mushrooms and twigs
//           on the bare earth — on a jittered cell grid, gated by slow drift
//           fields so they group
//
// Everything is a pure function of world position, so chunks tile seamlessly
// and a revisited chunk regenerates identically. The base pass is budgeted
// the same way as the Meadow: coarse noise grids expanded row by row, a
// quantised lit palette, Uint32 writes, and per-pixel noise only in a band
// around the dirt contour.

export const FOREST_TILE_PX = 64;

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

const DIRT_THRESHOLD = 0.62;
const GRASS_TONE_SCALE = 900;
const PROP_MARGIN = 48;
/** How far in from the dirt rim the needle litter reaches, in px. */
const LITTER_DEPTH = 26;

const GRASS: readonly Rgb[] = [hex('#2b4a28'), hex('#32552e'), hex('#3a6134')];
const GRASS_SHADOW = hex('#1e361c');
const BLADE = hex('#487a3d'), BLADE_DARK = hex('#243f21');
const AO: readonly Rgb[] = [hex('#2c1e13'), hex('#3f2c1c')];
const DIRT: readonly Rgb[] = [hex('#4e3a27'), hex('#5a4530'), hex('#664f38')];
const NEEDLE: readonly Rgb[] = [hex('#8a5a2e'), hex('#9c6a36'), hex('#74482a')];
const DIRT_LIGHT = hex('#7a6246'), DIRT_DARK = hex('#3b2a1a');

const TUFT_DARK = hex('#1f3d1d'), TUFT_MID = hex('#376b30'), TUFT_LIGHT = hex('#5e9a4c');
const FERN_DARK = hex('#2a5a2a'), FERN_MID = hex('#3f8a3c'), FERN_LIGHT = hex('#6fbf5a');
const LEAF: readonly Rgb[] = [hex('#a8622a'), hex('#8a4a22'), hex('#c07a30')];
const WOOD = hex('#6a4424'), WOOD_DARK = hex('#412812');
const MUSH_CAP = hex('#b8522f'), MUSH_CAP_LIGHT = hex('#e6a07a'), MUSH_STALK = hex('#e8d8bc'), MUSH_SHADE = hex('#4d2f14');
const MUSH_PALE_CAP = hex('#c9b48a'), MUSH_PALE_CAP_LIGHT = hex('#efe3c4'), MUSH_PALE_STALK = hex('#e8dcc2');
const BLACK = hex('#0b0f1a');

// Base-pass colours, indexed by BASE_*, each pre-lit at LIGHT_LEVELS dapple
// intensities and packed as little-endian ABGR for a Uint32 write per pixel.
const BASE_COLORS: readonly Rgb[] = [...GRASS, GRASS_SHADOW, ...AO, ...DIRT, ...NEEDLE];
const BASE_GRASS = 0, BASE_SHADOW = 3, BASE_AO = 4, BASE_DIRT = 6, BASE_NEEDLE = 9;
const LIGHT_MIN = 0.92, LIGHT_MAX = 1.08, LIGHT_LEVELS = 16;
const LIT = new Uint32Array(BASE_COLORS.length * LIGHT_LEVELS);
for (let ci = 0; ci < BASE_COLORS.length; ci++)
  for (let li = 0; li < LIGHT_LEVELS; li++) {
    const l = LIGHT_MIN + (LIGHT_MAX - LIGHT_MIN) * (li / (LIGHT_LEVELS - 1));
    const [r, g, b] = BASE_COLORS[ci].map(c => Math.min(255, Math.round(c * l)));
    LIT[ci * LIGHT_LEVELS + li] = (0xff << 24 | b << 16 | g << 8 | r) >>> 0;
  }

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

/** A fern: 2–3 arching fronds with paired leaflets, lit toward the tip. */
function fern(put: Put, x: number, y: number, size: number, seed: number): void {
  const fronds = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI / 2 + (f - (fronds - 1) / 2) * 0.9 + (hash2(f, x, seed) - 0.5) * 0.4;
    const len = size * (0.8 + hash2(f, y, seed) * 0.4);
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 0.7;
    line(put, x, y, ex, ey, FERN_DARK);
    const steps = Math.max(3, Math.floor(len / 3));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = x + (ex - x) * t, py = y + (ey - y) * t;
      const l = (1 - t) * size * 0.35 + 1;
      const nx = -Math.sin(a) * l, ny = Math.cos(a) * l * 0.7;
      const c = t > 0.6 ? FERN_LIGHT : FERN_MID;
      line(put, px, py, px + nx, py + ny, c);
      line(put, px, py, px - nx, py - ny, c);
    }
  }
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y + 1, BLACK, 0.25);
}

/** A few fallen leaves in warm tones. */
function leaves(put: Put, x: number, y: number, seed: number): void {
  for (let i = 0; i < 5; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 26), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 16);
    const c = LEAF[Math.floor(hash2(px, py, seed) * LEAF.length)];
    put(px, py, c); put(px + 1, py, c); put(px + (i % 2 ? 1 : 0), py + 1, c);
    put(px + 2, py + 1, BLACK, 0.25);
  }
}

/** A fallen twig, 8–16 px, with a fork. */
function twig(put: Put, x: number, y: number, seed: number): void {
  const len = 8 + hash2(x, y, seed) * 8, a = (hash2(y, x, seed) - 0.5) * 1.2;
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  line(put, x, y, ex, ey, WOOD);
  line(put, x, y + 1, ex, ey + 1, WOOD_DARK);
  const fx = x + (ex - x) * 0.6, fy = y + (ey - y) * 0.6;
  line(put, fx, fy, fx + Math.cos(a - 0.8) * 4, fy + Math.sin(a - 0.8) * 4, WOOD);
}

function mushrooms(put: Put, x: number, y: number, cap: Rgb, capLight: Rgb, stalk: Rgb, seed: number): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2);
    const r = 2 + Math.floor(hash2(i, y, seed) * 2);
    line(put, px, py, px, py + 3, stalk);
    line(put, px + 1, py + 1, px + 1, py + 3, MUSH_SHADE, 0.6);
    ellipse(put, px, py, r, Math.max(1.5, r * 0.6), cap);
    put(px - 1, py - 1, capLight);
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
export function drawForestChunk(buf: Uint8ClampedArray, size: number, x0: number, y0: number): void {
  const w = size, h = size;
  const warpX = new Grid(x0, y0, w, h, 16, 5, (x, y) => x + (fbm(x, y, 340, 81, 1) - 0.5) * 220);
  const warpY = new Grid(x0, y0, w, h, 16, 5, (x, y) => y + (fbm(x, y, 340, 82, 1) - 0.5) * 220);
  const dist = dirtDistance(x0, y0, w, h, warpX, warpY);
  const toneBase = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(warpX.sample(x, y), warpY.sample(x, y), GRASS_TONE_SCALE, 23, 1));
  const toneWobble = new Grid(x0, y0, w, h, 8, 1, (x, y) => (fbm(x, y, 34, 25, 2) - 0.5) * 0.04);
  const dirtTone = new Grid(x0, y0, w, h, 8, 1, (x, y) => fbm(x, y, 130, 33, 1));
  const dapple = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(x, y, 650, 52, 1));

  const px32 = new Uint32Array(buf.buffer, buf.byteOffset, w * h);
  const dRow = new Float32Array(w), tRow = new Float32Array(w), wRow = new Float32Array(w), kRow = new Float32Array(w), lRow = new Float32Array(w);
  const lightScale = LIGHT_LEVELS - 1;
  let i = 0;
  for (let ly = 0; ly < h; ly++) {
    const y = y0 + ly;
    dist.fillRow(y, dRow, w); toneBase.fillRow(y, tRow, w); toneWobble.fillRow(y, wRow, w);
    dirtTone.fillRow(y, kRow, w); dapple.fillRow(y, lRow, w);
    for (let lx = 0; lx < w; lx++, i++) {
      const x = x0 + lx;
      let d = dRow[lx];
      // ragged grass fingers: wobble the contour only where it can change the band
      if (d > -9 && d < 11) d += (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      let ci: number;
      if (d < -4) {
        const t = tRow[lx] + wRow[lx];
        ci = BASE_GRASS + (t < 0.45 ? 0 : t < 0.6 ? 1 : 2);
      } else if (d < 0) ci = BASE_SHADOW;
      else if (d < 3) ci = BASE_AO;
      else if (d < 6) ci = BASE_AO + 1;
      else {
        const t = kRow[lx];
        ci = BASE_DIRT + (t < 0.42 ? 0 : t < 0.6 ? 1 : 2);
        // needle litter carpets the rim of each patch and thins inward
        if (d < LITTER_DEPTH + 6 && valueNoise(x, y, 5, 44) > 0.72 - (LITTER_DEPTH + 6 - d) * 0.006)
          ci = BASE_NEEDLE + (valueNoise(x, y, 3, 45) * 3 | 0);
      }
      const l = lRow[lx];
      const li = l <= 0 ? 0 : l >= 1 ? lightScale : (l * lightScale + 0.5) | 0;
      px32[i] = LIT[ci * LIGHT_LEVELS + li];
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
  const distAt = (x: number, y: number) => dist.sample(x, y);

  // crust: a few 2-px light flecks and dark pits per 12-px cell, deep inside the dirt
  propGrid(x0, y0, w, h, 12, 43, 4, (x, y, roll) => {
    if (roll > 0.14) return;
    const d = distAt(x, y);
    if (d < 8 || (roll > 0.08 && d < 12)) return;
    const c = roll <= 0.08 ? DIRT_LIGHT : DIRT_DARK;
    put(x, y, c); put(x + 1, y, c); put(x, y + 1, c); put(x + 1, y + 1, c);
  });

  const tuftDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 73, 1));
  const fernDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 300, 74, 1));
  const litterDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 75, 1));

  // directional blade strokes over open grass, denser in drifts
  propGrid(x0, y0, w, h, 9, 201, 8, (x, y, roll) => {
    if (roll > 0.3 + tuftDrift.sample(x, y) * 0.6 || distAt(x, y) > -8) return;
    line(put, x, y, x + 2, y - 4, roll < 0.25 ? BLADE : BLADE_DARK, 0.5);
  });

  propGrid(x0, y0, w, h, 40, 102, PROP_MARGIN, (x, y, roll, id) => {
    const d = distAt(x, y);
    if (d > 6) {
      if (roll < 0.08) twig(put, x, y, id);
      else if (roll < 0.13) mushrooms(put, x, y, MUSH_PALE_CAP, MUSH_PALE_CAP_LIGHT, MUSH_PALE_STALK, id);
      return;
    }
    if (d > -16) {
      if (roll < 0.6) tuft(put, x, y - 1, 11 + roll * 7, id);
      else if (roll < 0.75 && fernDrift.sample(x, y) > 0.5) fern(put, x, y, 16 + roll * 8, id);
      return;
    }
    if (roll < 0.3) { if (tuftDrift.sample(x, y) > 0.42) tuft(put, x, y, 9 + roll * 14, id); }
    else if (roll < 0.5) { if (fernDrift.sample(x, y) > 0.55) fern(put, x, y, 18 + roll * 12, id); }
    else if (roll < 0.6) { if (litterDrift.sample(x, y) > 0.55) leaves(put, x, y, id); }
    else if (roll < 0.64) twig(put, x, y, id);
    else if (roll < 0.66) mushrooms(put, x, y, MUSH_CAP, MUSH_CAP_LIGHT, MUSH_STALK, id);
  });
}
