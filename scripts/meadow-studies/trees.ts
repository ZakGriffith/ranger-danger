// Tree studies at HD density (64 px per 32-px world tile) for the forest
// clusters, in the Wild Field vocabulary: deep greens, lit from the top-left,
// a dark underside on every tier, a 1-px outline like the HD sprites, and a
// soft ground shadow. Each design draws one tree into a Raster; the cluster
// renderer places trees with the same per-tile packing the game uses.
//
//   T1  Layered Pine  — tall conifer, five scalloped tiers with a dark
//                       underside band and a light top-left face
//   T2  Round Spruce  — shorter, rounder tiers that read as blobby boughs,
//                       warmer highlights, painted dabs
//   T3  Mixed Wood    — T1 pines with a third of the trees as round
//                       broadleaf canopies

import { Raster, Rgb, hex, hash2, fbm, valueNoise, ellipse, Put } from './raster';

export type TreeId = 'T1' | 'T2' | 'T3';

const OUTLINE = hex('#0b0f1a');
const BLACK = hex('#0b0f1a');

type TreePal = { dark: Rgb; mid: Rgb; light: Rgb; bright: Rgb; trunk: Rgb; trunkDark: Rgb };
const PINE: TreePal[] = [
  { dark: hex('#122a16'), mid: hex('#1f4a26'), light: hex('#2f6a34'), bright: hex('#4a8f45'), trunk: hex('#4a2e16'), trunkDark: hex('#2a1808') },
  { dark: hex('#10261a'), mid: hex('#1b442a'), light: hex('#2a6438'), bright: hex('#43874a'), trunk: hex('#45301c'), trunkDark: hex('#261a0c') },
  { dark: hex('#162c14'), mid: hex('#254c22'), light: hex('#376c30'), bright: hex('#55923f'), trunk: hex('#4e3218'), trunkDark: hex('#2c1a0a') },
];
const SPRUCE: TreePal[] = [
  { dark: hex('#163020'), mid: hex('#245232'), light: hex('#357544'), bright: hex('#5c9e58'), trunk: hex('#4a2e16'), trunkDark: hex('#2a1808') },
  { dark: hex('#142c1a'), mid: hex('#214b2a'), light: hex('#326d3a'), bright: hex('#55984e'), trunk: hex('#45301c'), trunkDark: hex('#261a0c') },
  { dark: hex('#1a321a'), mid: hex('#2b5527'), light: hex('#3f7a36'), bright: hex('#67a44f'), trunk: hex('#4e3218'), trunkDark: hex('#2c1a0a') },
];
const BROADLEAF: TreePal[] = [
  { dark: hex('#1c3a1a'), mid: hex('#2f5e28'), light: hex('#44823a'), bright: hex('#6aae52'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
  { dark: hex('#223c18'), mid: hex('#386224'), light: hex('#4f8734'), bright: hex('#78b04a'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
];

/** Paints a silhouette mask and the body, then strokes a 1-px outline around the mask. */
class Body {
  readonly mask: Uint8Array;
  constructor(readonly r: Raster) { this.mask = new Uint8Array(r.w * r.h); }
  put: Put = (x, y, c, a = 1) => {
    const lx = (x - this.r.x0) | 0, ly = (y - this.r.y0) | 0;
    if (lx < 0 || ly < 0 || lx >= this.r.w || ly >= this.r.h) return;
    this.mask[ly * this.r.w + lx] = 1;
    this.r.put(x, y, c, a);
  };
  outline(): void {
    const { w, h } = this.r, m = this.mask;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (m[y * w + x]) continue;
        if ((x > 0 && m[y * w + x - 1]) || (x < w - 1 && m[y * w + x + 1]) || (y > 0 && m[(y - 1) * w + x]) || (y < h - 1 && m[(y + 1) * w + x]))
          this.r.put(this.r.x0 + x, this.r.y0 + y, OUTLINE);
      }
  }
}

/** One scalloped conifer tier: a triangle-ish bough with a wavy bottom, lit top-left, dark underside. */
function tier(put: Put, cx: number, top: number, bot: number, halfW: number, p: TreePal, seed: number, round: boolean): void {
  const h = bot - top;
  for (let y = Math.floor(top); y <= Math.ceil(bot) + 3; y++) {
    const t = Math.max(0, Math.min(1, (y - top) / h));
    const w = round ? halfW * Math.sqrt(Math.sin(Math.min(1, t) * Math.PI / 2)) : halfW * t;
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
      // scallop: the lower edge hangs down in lobes
      const lobe = Math.abs(Math.sin((x - cx) / halfW * Math.PI * 2.2 + seed)) * 3;
      if (y > bot + lobe) continue;
      const u = (x - cx) / Math.max(w, 1); // -1 left .. 1 right
      const underside = y > bot - 2.5 + lobe * 0.5;
      let c: Rgb;
      if (underside) c = p.dark;
      else if (u < -0.15 && t > 0.15 && t < 0.9) c = u < -0.6 ? p.light : p.light;
      else if (u > 0.45) c = p.dark;
      else c = p.mid;
      if (!underside && u < -0.25 && t > 0.35 && t < 0.75 && hash2(x, y, seed) > 0.72) c = p.bright;
      put(x, y, c);
    }
  }
}

/** Shadows accumulate into one coverage mask per cluster so overlapping trees don't stack to black. */
class ShadowMask {
  readonly cov: Float32Array;
  constructor(readonly r: Raster) { this.cov = new Float32Array(r.w * r.h); }
  add(cx: number, cy: number, rx: number): void {
    for (let y = Math.floor(cy - rx * 0.32); y <= Math.ceil(cy + rx * 0.32); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / (rx * 0.32)) ** 2;
        if (d > 1) continue;
        const lx = x - this.r.x0, ly = y - this.r.y0;
        if (lx < 0 || ly < 0 || lx >= this.r.w || ly >= this.r.h) continue;
        const i = ly * this.r.w + lx;
        this.cov[i] = Math.max(this.cov[i], 1 - d * 0.5);
      }
  }
  /** Writes the shadow with real alpha: blended over painted pixels, as a translucent pixel over empty ones. */
  apply(alpha = 0.18): void {
    const d = this.r.data;
    for (let i = 0; i < this.cov.length; i++) {
      if (this.cov[i] <= 0) continue;
      const a = alpha * this.cov[i], j = i * 4;
      if (d[j + 3] === 0) { d[j] = BLACK[0]; d[j + 1] = BLACK[1]; d[j + 2] = BLACK[2]; d[j + 3] = Math.round(a * 255); }
      else this.r.put(this.r.x0 + (i % this.r.w), this.r.y0 + Math.floor(i / this.r.w), BLACK, a);
    }
  }
}

/** Bare earth under a cluster, in the forest floor's border vocabulary. */
export type EarthPal = { grassShadow: Rgb; ao: readonly Rgb[]; dirt: readonly Rgb[]; dirtLight: Rgb; needle: readonly Rgb[] };
export const F1_EARTH: EarthPal = {
  grassShadow: hex('#1e361c'),
  ao: [hex('#2c1e13'), hex('#3f2c1c')],
  dirt: [hex('#4e3a27'), hex('#5a4530'), hex('#664f38')],
  dirtLight: hex('#7a6246'),
  needle: [hex('#8a5a2e'), hex('#9c6a36'), hex('#74482a')],
};

export type EarthMode = 'ring' | 'clump' | null;

/**
 * Paints bare earth from a signed px distance (negative inside) with the
 * floor's own border bands: grass shadow, two ambient-occlusion rings, dirt
 * tones, needle litter near the rim. `rag` is the ragged-edge amplitude and
 * `litter` how far in from the edge the needle litter reaches.
 */
function paintEarth(r: Raster, dist: (x: number, y: number) => number, box: [number, number, number, number], seed: number, pal: EarthPal, rag: number, litter: number): void {
  const [minX, minY, maxX, maxY] = box;
  const ao0 = litter > 12 ? 3 : 2, ao1 = litter > 12 ? 6 : 4;
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++)
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
      const d = dist(x, y) + (fbm(x, y, rag > 6 ? 14 : 10, seed + 61, 2) - 0.5) * rag;
      if (d > (rag > 6 ? 4 : 2)) continue;
      let c: Rgb;
      if (d > 0) c = pal.grassShadow;
      else if (d > -ao0) c = pal.ao[0];
      else if (d > -ao1) c = pal.ao[1];
      else {
        const t = fbm(x, y, 130, seed + 33, 1);
        c = t < 0.42 ? pal.dirt[0] : t < 0.6 ? pal.dirt[1] : pal.dirt[2];
        const n = valueNoise(x, y, 5, seed + 44);
        if (d > -litter && n > 0.72 - (litter + d) * (0.12 / litter)) c = pal.needle[Math.floor(valueNoise(x, y, 3, seed + 45) * 3)];
        else if (valueNoise(x, y, 12, seed + 43) > 0.9) c = pal.dirtLight;
      }
      r.put(x, y, c);
    }
}

/** A small ring of bare earth at each trunk base. */
function earthRings(r: Raster, trees: { cx: number; cy: number; half: number }[], seed: number, pal: EarthPal): void {
  const ells = trees.map(t => ({ cx: t.cx, cy: t.cy + 1, rx: 9 + t.half * 0.3, ry: 5 + t.half * 0.12 }));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of ells) { minX = Math.min(minX, e.cx - e.rx - 8); maxX = Math.max(maxX, e.cx + e.rx + 8); minY = Math.min(minY, e.cy - e.ry - 8); maxY = Math.max(maxY, e.cy + e.ry + 8); }
  const dist = (x: number, y: number) => {
    let d = Infinity;
    for (const e of ells) {
      const q = Math.sqrt(((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2);
      d = Math.min(d, (q - 1) * e.ry);
    }
    return d;
  };
  paintEarth(r, dist, [minX, minY, maxX, maxY], seed, pal, 4, 10);
}

/** Bare earth under the whole clump: the union of the cluster's tiles, rounded, with a ragged edge. */
function earthClump(r: Raster, tiles: { dx: number; dy: number }[], T: number, pad: number, seed: number, pal: EarthPal): void {
  const grow = 6, round = 18;
  const rects = tiles.map(t => ({ x0: t.dx * T + pad - grow, y0: t.dy * T + pad + T * 0.3 - grow, x1: (t.dx + 1) * T + pad + grow, y1: (t.dy + 1) * T + pad + T * 0.15 + grow }));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const q of rects) { minX = Math.min(minX, q.x0 - 10); maxX = Math.max(maxX, q.x1 + 10); minY = Math.min(minY, q.y0 - 10); maxY = Math.max(maxY, q.y1 + 10); }
  const dist = (x: number, y: number) => {
    let d = Infinity;
    for (const q of rects) {
      const hw = (q.x1 - q.x0) / 2 - round, hh = (q.y1 - q.y0) / 2 - round;
      const px = Math.abs(x - (q.x0 + q.x1) / 2) - hw, py = Math.abs(y - (q.y0 + q.y1) / 2) - hh;
      const outside = Math.hypot(Math.max(px, 0), Math.max(py, 0)), inside = Math.min(Math.max(px, py), 0);
      d = Math.min(d, outside + inside - round);
    }
    return d;
  };
  paintEarth(r, dist, [minX, minY, maxX, maxY], seed, pal, 9, 22);
}

export function drawPine(r: Raster, cx: number, cy: number, h: number, baseHalf: number, seed: number, round = false): void {
  const p = (round ? SPRUCE : PINE)[seed % 3];
  const b = new Body(r);
  // trunk and root flare
  for (let y = cy - 14; y <= cy; y++) {
    const flare = y > cy - 4 ? (y - (cy - 4)) : 0;
    for (let x = cx - 3 - flare; x <= cx + 3 + flare; x++) b.put(x, y, x < cx - 1 ? p.trunk : p.trunkDark);
  }
  const tiers = round ? 4 : 5;
  const top = cy - h;
  for (let i = tiers - 1; i >= 0; i--) {
    const f0 = i / tiers, f1 = (i + 1) / tiers;
    const tTop = top + h * f0 * 0.92 - 4;
    const tBot = top + h * f1 * 0.92 + (i === tiers - 1 ? -6 : 2);
    const half = baseHalf * (0.3 + 0.7 * f1) * (round ? 1.1 : 1);
    tier(b.put, cx, tTop, tBot, half, p, seed * 7 + i, round);
  }
  // tip
  for (let y = top - 3; y <= top + 2; y++) b.put(cx, y, p.bright);
  b.put(cx - 1, top + 1, p.bright);
  b.outline();
}

export function drawBroadleaf(r: Raster, cx: number, cy: number, h: number, seed: number): void {
  const p = BROADLEAF[seed % 2];
  const b = new Body(r);
  for (let y = cy - 16; y <= cy; y++) {
    const flare = y > cy - 4 ? (y - (cy - 4)) : 0;
    for (let x = cx - 4 - flare; x <= cx + 4 + flare; x++) b.put(x, y, x < cx - 1 ? p.trunk : p.trunkDark);
  }
  const canopyCy = cy - h * 0.62, rx = h * 0.42, ry = h * 0.36;
  const lobes: [number, number, number][] = [[0, 0, 1], [-0.55, 0.2, 0.7], [0.55, 0.2, 0.7], [-0.3, -0.4, 0.65], [0.3, -0.4, 0.65], [0, 0.45, 0.6]];
  for (const [dx, dy, s] of lobes) ellipse(b.put, cx + dx * rx, canopyCy + dy * ry, rx * s, ry * s, p.mid);
  for (const [dx, dy, s] of lobes) ellipse(b.put, cx + dx * rx + rx * s * 0.2, canopyCy + dy * ry + ry * s * 0.35, rx * s * 0.8, ry * s * 0.6, p.dark);
  for (const [dx, dy, s] of lobes) ellipse(b.put, cx + dx * rx - rx * s * 0.3, canopyCy + dy * ry - ry * s * 0.3, rx * s * 0.5, ry * s * 0.4, p.light);
  for (let i = 0; i < 14; i++) {
    const a = hash2(i, seed, 3) * Math.PI * 2, d = hash2(seed, i, 4) * 0.8;
    const x = Math.round(cx + Math.cos(a) * rx * d - rx * 0.15), y = Math.round(canopyCy + Math.sin(a) * ry * d - ry * 0.2);
    b.put(x, y, p.bright); b.put(x + 1, y, p.bright);
  }
  b.outline();
}

/**
 * Renders a cluster pattern at HD density with the game's packing (2–3
 * trees per tile, jittered, back-to-front). Returns the raster; pad is in HD px.
 */
export function drawCluster(id: TreeId, pattern: { tiles: { dx: number; dy: number }[]; w: number; h: number }, patternIdx: number, pad = 80, earth: EarthMode = null, pal: EarthPal = F1_EARTH): Raster {
  const T = 64;
  const r = new Raster(0, 0, pattern.w * T + pad * 2, pattern.h * T + pad * 2);
  let seed = (patternIdx * 73856093 + 54321) >>> 0;
  const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
  type Def = { cx: number; cy: number; h: number; half: number; s: number; leaf: boolean };
  const trees: Def[] = [];
  for (const t of pattern.tiles) {
    const tileCx = t.dx * T + T / 2 + pad, tileCy = t.dy * T + T * 0.85 + pad;
    const n = 2 + (rnd() > 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const cx = Math.round(tileCx + (rnd() - 0.5) * T * 0.7), cy = Math.round(tileCy + (rnd() - 0.5) * T * 0.4);
      const h = id === 'T2' ? 84 + Math.floor(rnd() * 22) : 96 + Math.floor(rnd() * 28);
      trees.push({ cx, cy, h, half: 26 + Math.floor(rnd() * 8), s: Math.floor(rnd() * 1000), leaf: id === 'T3' && rnd() < 0.35 });
    }
  }
  trees.sort((a, b) => a.cy - b.cy);
  if (earth === 'ring') earthRings(r, trees, patternIdx * 17, pal);
  else if (earth === 'clump') earthClump(r, pattern.tiles, T, pad, patternIdx * 17, pal);
  const shadow = new ShadowMask(r);
  for (const t of trees) shadow.add(t.cx + 3, t.cy + 1, t.leaf ? t.h * 0.32 : t.half * 0.9);
  shadow.apply();
  for (const t of trees) {
    if (t.leaf) drawBroadleaf(r, t.cx, t.cy, t.h * 0.8, t.s);
    else drawPine(r, t.cx, t.cy, t.h, t.half, t.s, id === 'T2');
  }
  return r;
}

export const TREE_STYLES: Record<TreeId, { title: string; lean: string }> = {
  T1: { title: 'Layered Pine', lean: 'five scalloped tiers, dark undersides, lit top-left' },
  T2: { title: 'Round Spruce', lean: 'shorter, blobby boughs, warmer highlights' },
  T3: { title: 'Mixed Wood', lean: 'layered pines with a third broadleaf canopies' },
};
