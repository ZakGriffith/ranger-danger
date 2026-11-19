// Riverside woods for the River biome: the dense trees that fill every
// woods tile of the seeded network (riverGeometry.ts), drawn at HD density
// as one overlay texture per ground chunk. The look ("Alder & Pine", picked
// from the scripts/river-studies/woods.ts renders): round broadleaf alders
// in layered lobes on straight trunks, with the Forest's layered pines mixed
// through, fewer pines along the edges of the open ground.
//
// Trees are packed like the Forest's clusters (2–3 per tile, jittered,
// back-to-front, one merged ground shadow). Each tree is one of a small set
// of pre-rendered variants stamped with drawImage, so a chunk of solid
// woods (600+ trees) costs milliseconds. The overlay is clipped to its own
// chunk; trees whose crowns cross a chunk edge are drawn by both chunks in
// the same order, so the halves meet exactly.

import { RiverNet, RIVER_TILE_WOODS } from './riverGeometry';
import { drawPine, Raster as TreeRaster } from './forestTrees';

const T = 64;                       // HD px per tile
const PAD_X = 80, PAD_TOP = 24;     // variant canvas: the tree base sits at (PAD_X, h + PAD_TOP)
const SHADOW_ALPHA = 0.2;

type Rgb = readonly [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const OUTLINE = hex('#0b0f1a');

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}

type TreePal = { dark: Rgb; mid: Rgb; light: Rgb; bright: Rgb; trunk: Rgb; trunkDark: Rgb };
const ALDER: TreePal[] = [
  { dark: hex('#1c3a1a'), mid: hex('#2f5e28'), light: hex('#44823a'), bright: hex('#6aae52'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
  { dark: hex('#223c18'), mid: hex('#386224'), light: hex('#4f8734'), bright: hex('#78b04a'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
  { dark: hex('#183a22'), mid: hex('#2a5e34'), light: hex('#3f8248'), bright: hex('#66ac62'), trunk: hex('#4e3620'), trunkDark: hex('#2c1c0c') },
];

/** Paints a silhouette mask along with the body, then strokes a 1-px outline around the mask. */
class Body {
  readonly mask: Uint8Array;
  private bx0 = Infinity; private by0 = Infinity; private bx1 = -Infinity; private by1 = -Infinity;
  constructor(readonly r: TreeRaster) { this.mask = new Uint8Array(r.w * r.h); }
  put = (x: number, y: number, c: Rgb): void => {
    if (x < 0 || y < 0 || x >= this.r.w || y >= this.r.h) return;
    this.mask[y * this.r.w + x] = 1;
    if (x < this.bx0) this.bx0 = x; if (x > this.bx1) this.bx1 = x; if (y < this.by0) this.by0 = y; if (y > this.by1) this.by1 = y;
    this.r.put(x, y, c);
  };
  outline(): void {
    const { w, h } = this.r, m = this.mask;
    if (this.bx0 > this.bx1) return;
    for (let y = Math.max(0, this.by0 - 1); y <= Math.min(h - 1, this.by1 + 1); y++)
      for (let x = Math.max(0, this.bx0 - 1); x <= Math.min(w - 1, this.bx1 + 1); x++) {
        if (m[y * w + x]) continue;
        if ((x > 0 && m[y * w + x - 1]) || (x < w - 1 && m[y * w + x + 1]) || (y > 0 && m[(y - 1) * w + x]) || (y < h - 1 && m[(y + 1) * w + x]))
          this.r.put(x, y, OUTLINE);
      }
  }
}

function ellipse(put: (x: number, y: number, c: Rgb) => void, cx: number, cy: number, rx: number, ry: number, c: Rgb): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, c);
}

function line(put: (x: number, y: number, c: Rgb) => void, x0: number, y0: number, x1: number, y1: number, c: Rgb): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
}

function trunk(b: Body, cx: number, cy: number, top: number, lean: number, w: number, p: TreePal): void {
  for (let y = top; y <= cy; y++) {
    const t = (cy - y) / Math.max(1, cy - top);
    const x0 = cx + lean * t;
    const flare = y > cy - 4 ? (y - (cy - 4)) : 0;
    for (let x = Math.round(x0 - w - flare); x <= Math.round(x0 + w + flare); x++) b.put(x, y, x < x0 - 1 ? p.trunk : p.trunkDark);
  }
}

/** An alder: a tall straight trunk under a crown of layered round lobes. */
function drawAlder(r: TreeRaster, cx: number, cy: number, h: number, seed: number): void {
  const p = ALDER[seed % ALDER.length];
  const b = new Body(r);
  const crownCy = cy - h * 0.64, rx = h * (0.34 + hash2(seed, 11, 1) * 0.14), ry = h * (0.3 + hash2(seed, 12, 1) * 0.1);
  trunk(b, cx, cy, Math.round(crownCy + ry * 0.3), (hash2(seed, 3, 1) - 0.5) * 4, 3, p);
  const j = (i: number) => (hash2(seed, 20 + i, 1) - 0.5) * 0.22;
  const lobes: [number, number, number][] = [[0, 0.05, 1], [-0.6 + j(1), 0.25 + j(2), 0.68], [0.6 + j(3), 0.25 + j(4), 0.68], [-0.35 + j(5), -0.45, 0.62], [0.35 + j(6), -0.45, 0.62], [j(7), -0.7, 0.5], [j(8), 0.5, 0.55]];
  for (const [ox, oy, s] of lobes) ellipse(b.put, cx + ox * rx, crownCy + oy * ry, rx * s, ry * s, p.mid);
  for (const [ox, oy, s] of lobes) ellipse(b.put, cx + ox * rx + rx * s * 0.22, crownCy + oy * ry + ry * s * 0.38, rx * s * 0.8, ry * s * 0.58, p.dark);
  for (const [ox, oy, s] of lobes) ellipse(b.put, cx + ox * rx - rx * s * 0.3, crownCy + oy * ry - ry * s * 0.32, rx * s * 0.5, ry * s * 0.4, p.light);
  // leaf clumps: short bright dashes on the lit side
  for (let i = 0; i < 18; i++) {
    const a = hash2(i, seed, 3) * Math.PI * 2, d = hash2(seed, i, 4) * 0.85;
    const x = Math.round(cx + Math.cos(a) * rx * d - rx * 0.15), y = Math.round(crownCy + Math.sin(a) * ry * d - ry * 0.2);
    b.put(x, y, p.bright); b.put(x + 1, y, p.bright); b.put(x + 2, y, p.light);
  }
  // a gap of sky between lobes now and then reads as leaves, not a blob
  for (let i = 0; i < 4; i++) {
    const a = hash2(i, seed, 9) * Math.PI * 2, d = 0.55 + hash2(seed, i, 10) * 0.3;
    const x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(crownCy + Math.sin(a) * ry * d);
    line(b.put, x, y, x + 3, y + 1, p.dark);
  }
  b.outline();
}

type Variant = { canvas: HTMLCanvasElement; h: number; shadowR: number };
const ALDER_VARIANTS = 20, PINE_VARIANTS = 14;
let alders: Variant[] | null = null;
let pines: Variant[] | null = null;

function toCanvas(r: TreeRaster): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = r.w; canvas.height = r.h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(r.w, r.h);
  img.data.set(r.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Pre-renders the tree variants once; a few milliseconds each. */
function variants(): { alders: Variant[]; pines: Variant[] } {
  if (alders && pines) return { alders, pines };
  alders = []; pines = [];
  for (let i = 0; i < ALDER_VARIANTS; i++) {
    const h = 84 + Math.floor(hash2(i, 1, 9) * 24), seed = 1000 + i * 37;
    const r = new TreeRaster(PAD_X * 2, h + PAD_TOP + 8);
    drawAlder(r, PAD_X, h + PAD_TOP, h, seed);
    alders.push({ canvas: toCanvas(r), h, shadowR: h * 0.34 });
  }
  for (let i = 0; i < PINE_VARIANTS; i++) {
    const h = 96 + Math.floor(hash2(i, 2, 9) * 28), seed = 2000 + i * 53;
    const r = new TreeRaster(PAD_X * 2, h + PAD_TOP + 8);
    drawPine(r, PAD_X, h + PAD_TOP, h, 26 + (i % 8), seed);
    pines.push({ canvas: toCanvas(r), h, shadowR: 26 });
  }
  return { alders, pines };
}

/**
 * The woods overlay for one ground chunk of `chunkTiles` tiles a side, as a
 * transparent canvas of (chunkTiles·64)² HD px, or null when no tree touches
 * the chunk. Deterministic in the chunk coordinates and the network's seed.
 */
export function drawRiverWoodsChunk(net: RiverNet, cx: number, cy: number, chunkTiles: number): HTMLCanvasElement | null {
  const size = chunkTiles * T, X0 = cx * size, Y0 = cy * size;
  const v = variants();
  type Def = { cx: number; cy: number; v: Variant };
  const trees: Def[] = [];
  const tx0 = cx * chunkTiles - 3, tx1 = (cx + 1) * chunkTiles + 3;
  const ty0 = cy * chunkTiles - 1, ty1 = (cy + 1) * chunkTiles + 3;
  for (let ty = ty0; ty < ty1; ty++)
    for (let tx = tx0; tx < tx1; tx++) {
      if (net.tileKind(tx, ty) !== RIVER_TILE_WOODS) continue;
      let seed = ((tx * 73856093) ^ (ty * 19349669) ^ (net.seed * 83492791)) >>> 0 || 1;
      const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
      const n = 2 + (rnd() > 0.5 ? 1 : 0);
      // fewer pines where the woods meet open ground
      const edge = net.openAt(tx * 32 + 16, ty * 32 + 16) > -2.5 * 32;
      for (let i = 0; i < n; i++) {
        const px = Math.round(tx * T + T / 2 + (rnd() - 0.5) * T * 0.7), py = Math.round(ty * T + T * 0.85 + (rnd() - 0.5) * T * 0.4);
        const s = Math.floor(rnd() * 1000);
        const list = rnd() < (edge ? 0.3 : 0.5) ? v.pines : v.alders;
        const variant = list[s % list.length];
        if (px + PAD_X < X0 || px - PAD_X > X0 + size || py + 8 < Y0 || py - variant.h - PAD_TOP > Y0 + size) continue;
        trees.push({ cx: px, cy: py, v: variant });
      }
    }
  if (trees.length === 0) return null;
  trees.sort((a, b) => a.cy - b.cy);

  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // one merged ground shadow: the union of every tree's ellipse, painted once
  const shadow = document.createElement('canvas');
  shadow.width = size; shadow.height = size;
  const sctx = shadow.getContext('2d')!;
  sctx.fillStyle = `rgb(${OUTLINE[0]},${OUTLINE[1]},${OUTLINE[2]})`;
  sctx.beginPath();
  for (const t of trees) {
    const rx = t.v.shadowR, ry = rx * 0.4;
    sctx.moveTo(t.cx + 3 + rx - X0, t.cy + 1 - Y0);
    sctx.ellipse(t.cx + 3 - X0, t.cy + 1 - Y0, rx, ry, 0, 0, Math.PI * 2);
  }
  sctx.fill();
  ctx.globalAlpha = SHADOW_ALPHA;
  ctx.drawImage(shadow, 0, 0);
  ctx.globalAlpha = 1;
  for (const t of trees) ctx.drawImage(t.v.canvas, t.cx - PAD_X - X0, t.cy - t.v.h - PAD_TOP - Y0);
  return canvas;
}
