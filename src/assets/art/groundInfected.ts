// Infected ground, drawn at HD density: 64 texture px per 32-px world tile,
// the same pixel density as the HD sprites (hd.ts). ChunkSystem displays the
// chunk texture at half size so world geometry is unchanged.
//
// Fungal Marsh alternates purple moss and muted, uneven patches of grass.
// Blade strokes and tufts grow in drifts around fungi and spore puffballs.
//
// Everything is a pure function of world position, so chunks tile seamlessly
// and a revisited chunk regenerates identically. The base pass is budgeted
// the same way as the Forest: coarse noise grids expanded row by row, a
// quantised lit palette, Uint32 writes, and per-pixel noise only in a band
// around the grass edges.

export const INFECTED_TILE_PX = 64;

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
 * Signed distance in px from the grass edge, positive inside the grass,
 * built from the warped field value and its gradient on a step-4 grid.
 */
function grassDistance(x0: number, y0: number, w: number, h: number, warpX: Grid, warpY: Grid): Grid {
  // the props pass samples the distance up to PROP_MARGIN px outside the chunk
  const step = 4, pad = PROP_MARGIN / step + 1;
  const n = new Grid(x0, y0, w, h, step, pad, (x, y) => fbm(warpX.sample(x, y), warpY.sample(x, y), 520, 11, 2));
  const g = n.data, gw = n.gw;
  const dist = new Grid(x0, y0, w, h, step, pad - 1, () => 0);
  for (let gy = 0; gy < dist.gh; gy++)
    for (let gx = 0; gx < dist.gw; gx++) {
      const i = (gy + 1) * gw + gx + 1;
      const grad = Math.hypot((g[i + 1] - g[i - 1]) / (2 * step), (g[i + gw] - g[i - gw]) / (2 * step));
      const v = (g[i] - GRASS_THRESHOLD) / Math.max(grad, 1e-4);
      dist.data[gy * dist.gw + gx] = v < -80 ? -80 : v > 80 ? 80 : v;
    }
  return dist;
}

// -------------------------------------------------------------- palette ----

const GRASS_THRESHOLD = 0.62;
const MOSS_TONE_SCALE = 900;
const PROP_MARGIN = 48;

const MOSS: readonly Rgb[] = [hex('#2b2340'), hex('#33294b'), hex('#3b3057')];
const FRINGE: readonly Rgb[] = [hex('#3e3c3d'), hex('#41443a')];
const GRASS: readonly Rgb[] = [hex('#414a36'), hex('#49563b'), hex('#505d3e'), hex('#586646')];
const MOSS_BLADE = hex('#5a4a86'), MOSS_BLADE_DARK = hex('#211a35');
const GRASS_BLADE = hex('#8b9965'), GRASS_BLADE_DARK = hex('#333e2f');
const CRACK = hex('#566e4b');

const MOSS_TUFT = { dark: hex('#241c38'), mid: hex('#4a3a70'), light: hex('#7a62a8') };
const GRASS_TUFT = { dark: hex('#363f2f'), mid: hex('#697a50'), light: hex('#8e9b6a') };
const MUSH_SHADE = hex('#1e1420');
const MUSH_GREEN = { cap: hex('#58c468'), capLight: hex('#b6ffb0'), stalk: hex('#d6cce0'), glow: hex('#a8ff9a') };
const MUSH_PURPLE = { cap: hex('#7a46a8'), capLight: hex('#c494e8'), stalk: hex('#d6cce0'), glow: hex('#a8ff9a') };
const PUFF = { body: hex('#9a8aa8'), light: hex('#cbbfd6'), dark: hex('#584a68'), spore: hex('#cfffc0') };
const BLACK = hex('#0b0f1a');

// Base-pass colours, indexed by BASE_*, each pre-lit at LIGHT_LEVELS dapple
// intensities and packed as little-endian ABGR for a Uint32 write per pixel.
const BASE_COLORS: readonly Rgb[] = [...MOSS, ...FRINGE, ...GRASS];
const BASE_FRINGE = MOSS.length, BASE_GRASS = BASE_FRINGE + FRINGE.length;
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

function disc(put: Put, cx: number, cy: number, r: number, c: Rgb): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) put(x, y, c);
}

function ellipse(put: Put, cx: number, cy: number, rx: number, ry: number, c: Rgb): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, c);
}

function tuft(put: Put, x: number, y: number, size: number, seed: number, { dark, mid, light } = MOSS_TUFT): void {
  const blades = 3 + Math.floor(hash2(x, y, seed) * 3);
  const spread = size * 0.55;
  for (let i = 0; i < blades; i++) {
    const t = i / (blades - 1);
    const bx = x + (t - 0.5) * spread * 2;
    const lean = (t - 0.5) * size * 0.9 + (hash2(i, x, seed) - 0.5) * 2;
    const hgt = size * (0.65 + 0.35 * hash2(x + i, y, seed)) * (1 - Math.abs(t - 0.5) * 0.4);
    const tipX = bx + lean, tipY = y - hgt;
    line(put, bx, y, tipX, tipY, t < 0.4 ? light : t > 0.7 ? dark : mid);
    const mx = bx + (tipX - bx) * 0.66, my = y + (tipY - y) * 0.66;
    line(put, bx + 1, y, Math.round(mx) + 1, Math.round(my), t < 0.4 ? mid : dark);
  }
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y + 1, dark, 0.6);
}

/** Cracks: 3 short random walks out from a point. */
function veins(put: Put, x: number, y: number, seed: number): void {
  for (let v = 0; v < 3; v++) {
    let px = x, py = y, a = hash2(v, x, seed) * Math.PI * 2;
    for (let s = 0; s < 5; s++) {
      a += (hash2(s, v + y, seed) - 0.5) * 1.2;
      const nx = px + Math.cos(a) * 3, ny = py + Math.sin(a) * 3;
      line(put, px, py, nx, ny, CRACK, 0.7);
      px = nx; py = ny;
    }
  }
}

/** A puffball: a pale sphere with a dark underside and a few spores above it. */
function puffball(put: Put, x: number, y: number, r: number, seed: number): void {
  for (let dx = -r; dx <= r; dx++) put(x + dx, y + r, BLACK, 0.3);
  disc(put, x, y, r, PUFF.dark);
  disc(put, x - 1, y - 1, r - 1, PUFF.body);
  put(Math.round(x - r * 0.4), Math.round(y - r * 0.5), PUFF.light);
  put(Math.round(x - r * 0.4) + 1, Math.round(y - r * 0.5), PUFF.light, 0.5);
  const n = 2 + Math.floor(hash2(x, y, seed) * 3);
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + (hash2(i, x, seed) - 0.5) * r * 3), sy = Math.round(y - r - 1 - hash2(i, y, seed) * r * 2);
    put(sx, sy, PUFF.spore, 0.9);
    put(sx + 1, sy, PUFF.spore, 0.3); put(sx, sy + 1, PUFF.spore, 0.3);
  }
}

/** Mushrooms with a glowing light on each cap. */
function glowMushrooms(put: Put, x: number, y: number, p: { cap: Rgb; capLight: Rgb; stalk: Rgb; glow: Rgb }, seed: number): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2);
    const r = 2 + Math.floor(hash2(i, y, seed) * 2);
    line(put, px, py, px, py + 3, p.stalk);
    line(put, px + 1, py + 1, px + 1, py + 3, MUSH_SHADE, 0.6);
    ellipse(put, px, py, r, Math.max(1.5, r * 0.6), p.cap);
    put(px - 1, py - 1, p.capLight);
  }
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2) - 1;
    put(px + 1, py, p.glow);
    put(px + 2, py, p.glow, 0.35); put(px, py, p.glow, 0.35); put(px + 1, py - 1, p.glow, 0.35); put(px + 1, py + 1, p.glow, 0.35);
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
export function drawInfectedChunk(buf: Uint8ClampedArray, size: number, x0: number, y0: number): void {
  const w = size, h = size;
  const warpX = new Grid(x0, y0, w, h, 16, 5, (x, y) => x + (fbm(x, y, 340, 81, 1) - 0.5) * 220);
  const warpY = new Grid(x0, y0, w, h, 16, 5, (x, y) => y + (fbm(x, y, 340, 82, 1) - 0.5) * 220);
  const dist = grassDistance(x0, y0, w, h, warpX, warpY);
  const toneBase = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(warpX.sample(x, y), warpY.sample(x, y), MOSS_TONE_SCALE, 23, 1));
  const toneWobble = new Grid(x0, y0, w, h, 8, 1, (x, y) => (fbm(x, y, 34, 25, 2) - 0.5) * 0.04);
  const grassTone = new Grid(x0, y0, w, h, 8, 1, (x, y) => fbm(x, y, 80, 48, 2));
  const dapple = new Grid(x0, y0, w, h, 16, 1, (x, y) => fbm(x, y, 650, 52, 1));

  const px32 = new Uint32Array(buf.buffer, buf.byteOffset, w * h);
  const dRow = new Float32Array(w), tRow = new Float32Array(w), wRow = new Float32Array(w), gRow = new Float32Array(w), lRow = new Float32Array(w);
  const lightScale = LIGHT_LEVELS - 1;
  let i = 0;
  for (let ly = 0; ly < h; ly++) {
    const y = y0 + ly;
    dist.fillRow(y, dRow, w); toneBase.fillRow(y, tRow, w); toneWobble.fillRow(y, wRow, w);
    grassTone.fillRow(y, gRow, w); dapple.fillRow(y, lRow, w);
    for (let lx = 0; lx < w; lx++, i++) {
      const x = x0 + lx;
      let d = dRow[lx];
      if (d > -12 && d < 12) d += (fbm(x, y, 16, 61, 2) - 0.5) * 13;
      let ci: number;
      if (d < -4) {
        const t = tRow[lx] + wRow[lx];
        ci = t < 0.45 ? 0 : t < 0.6 ? 1 : 2;
      } else if (d < 2) {
        ci = BASE_FRINGE + (d < -1 ? 0 : 1);
      } else {
        const t = gRow[lx];
        ci = BASE_GRASS + (t < .34 ? 0 : t < .50 ? 1 : t < .68 ? 2 : 3);
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

  const tuftDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 73, 1));
  const fungusDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 300, 74, 1));
  const sporeDrift = new Grid(x0, y0, w, h, 16, 4, (x, y) => fbm(x, y, 260, 75, 1));

  propGrid(x0, y0, w, h, 9, 201, 9, (x, y, roll) => {
    if (roll > 0.3 + tuftDrift.sample(x, y) * 0.6) return;
    if (distAt(x, y) > -1) {
      const height = 4 + Math.floor(hash2(x, y, 204) * 4);
      line(put, x, y, x + 2, y - height, roll < 0.42 ? GRASS_BLADE : GRASS_BLADE_DARK, 0.62);
      if (roll < 0.23) line(put, x - 1, y, x - 3, y - height + 2, GRASS_BLADE_DARK, 0.55);
    } else {
      line(put, x, y, x + 2, y - 4, roll < 0.25 ? MOSS_BLADE : MOSS_BLADE_DARK, 0.5);
    }
  });

  propGrid(x0, y0, w, h, 40, 102, PROP_MARGIN, (x, y, roll, id) => {
    const d = distAt(x, y);
    if (d > 0) {
      if (roll < 0.57) tuft(put, x, y, 8 + roll * 10, id, GRASS_TUFT);
      else if (roll < 0.64 && fungusDrift.sample(x, y) > 0.53) glowMushrooms(put, x, y, MUSH_PURPLE, id);
      return;
    }
    if (d > -16) {
      if (roll < 0.4) tuft(put, x, y, 9 + roll * 9, id, d > -7 ? GRASS_TUFT : MOSS_TUFT);
      else if (roll < 0.52 && d > -10) veins(put, x, y, id);
      else if (roll < 0.74) tuft(put, x, y - 1, 11 + roll * 7, id);
      else if (roll < 0.76 && fungusDrift.sample(x, y) > 0.5) glowMushrooms(put, x, y, MUSH_GREEN, id);
      return;
    }
    // open moss
    if (roll < 0.28) { if (tuftDrift.sample(x, y) > 0.42) tuft(put, x, y, 9 + roll * 14, id); }
    else if (roll < 0.34) { if (fungusDrift.sample(x, y) > 0.58) glowMushrooms(put, x, y, MUSH_PURPLE, id); }
    else if (roll < 0.38) { if (sporeDrift.sample(x, y) > 0.58) puffball(put, x, y, 3 + Math.floor((roll - 0.34) * 60), id); }
    else if (roll < 0.48) { if (d > -36 && fungusDrift.sample(x, y) > 0.45) veins(put, x, y, id); }
  });
}
