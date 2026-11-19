// Riverside woods for the River biome: the dense trees that close the arena
// off beyond its wobbling edge, drawn per woods tile from the seeded network
// (src/assets/art/riverGeometry.ts) at HD density with the Forest's packing
// (2–3 trees per tile, jittered, back-to-front, one merged ground shadow).
//
//   W1  Willow Banks  — weeping willows: pale yellow-green domes trailing
//                       strands, leaning trunks
//   W2  Alder Wood    — round broadleaf crowns in layered lobes, straight
//                       trunks, deep summer greens
//   W3  Mixed Stand   — alders with willows near the water and the Forest's
//                       layered pines further back

import { Rgb, hex, hash2, ellipse, line, Put } from '../meadow-studies/raster';
import { drawPine } from '../meadow-studies/trees';
import { AlphaRaster } from './river';
import { RiverNet, RIVER_TILE_WOODS } from '../../src/assets/art/riverGeometry';

export type WoodsId = 'W1' | 'W2' | 'W3' | 'W4';

const T = 64;
const OUTLINE = hex('#0b0f1a');
const SHADOW_ALPHA = 0.2;

type TreePal = { dark: Rgb; mid: Rgb; light: Rgb; bright: Rgb; trunk: Rgb; trunkDark: Rgb };
const WILLOW: TreePal[] = [
  { dark: hex('#2f4d1e'), mid: hex('#4e7a2c'), light: hex('#6e9c3c'), bright: hex('#a3cc5e'), trunk: hex('#5c4229'), trunkDark: hex('#352314') },
  { dark: hex('#334f22'), mid: hex('#557f34'), light: hex('#78a244'), bright: hex('#b0d26a'), trunk: hex('#5c4229'), trunkDark: hex('#352314') },
  { dark: hex('#2a4a24'), mid: hex('#47762e'), light: hex('#669840'), bright: hex('#98c45c'), trunk: hex('#54401f'), trunkDark: hex('#2f2210') },
];
const ALDER: TreePal[] = [
  { dark: hex('#1c3a1a'), mid: hex('#2f5e28'), light: hex('#44823a'), bright: hex('#6aae52'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
  { dark: hex('#223c18'), mid: hex('#386224'), light: hex('#4f8734'), bright: hex('#78b04a'), trunk: hex('#5a3a1e'), trunkDark: hex('#32200c') },
  { dark: hex('#183a22'), mid: hex('#2a5e34'), light: hex('#3f8248'), bright: hex('#66ac62'), trunk: hex('#4e3620'), trunkDark: hex('#2c1c0c') },
];

/** Paints a silhouette mask and the body, then strokes a 1-px outline around the mask. */
class Body {
  readonly mask: Uint8Array;
  private bx0 = Infinity; private by0 = Infinity; private bx1 = -Infinity; private by1 = -Infinity;
  constructor(readonly r: AlphaRaster) { this.mask = new Uint8Array(r.w * r.h); }
  put: Put = (x, y, c) => {
    const lx = (x - this.r.x0) | 0, ly = (y - this.r.y0) | 0;
    if (lx < 0 || ly < 0 || lx >= this.r.w || ly >= this.r.h) return;
    this.mask[ly * this.r.w + lx] = 1;
    if (lx < this.bx0) this.bx0 = lx; if (lx > this.bx1) this.bx1 = lx; if (ly < this.by0) this.by0 = ly; if (ly > this.by1) this.by1 = ly;
    this.r.put(x, y, c, 1);
  };
  outline(): void {
    const { w, h } = this.r, m = this.mask;
    if (this.bx0 > this.bx1) return;
    for (let y = Math.max(0, this.by0 - 1); y <= Math.min(h - 1, this.by1 + 1); y++)
      for (let x = Math.max(0, this.bx0 - 1); x <= Math.min(w - 1, this.bx1 + 1); x++) {
        if (m[y * w + x]) continue;
        if ((x > 0 && m[y * w + x - 1]) || (x < w - 1 && m[y * w + x + 1]) || (y > 0 && m[(y - 1) * w + x]) || (y < h - 1 && m[(y + 1) * w + x]))
          this.r.put(this.r.x0 + x, this.r.y0 + y, OUTLINE, 1);
      }
  }
}

/** Merged ground shadow: union of ellipses, painted once so overlaps don't darken twice. */
class ShadowMask {
  readonly mask: Uint8Array;
  constructor(readonly r: AlphaRaster) { this.mask = new Uint8Array(r.w * r.h); }
  add(cx: number, cy: number, rx: number): void {
    const ry = rx * 0.4;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 > 1) continue;
        const lx = x - this.r.x0, ly = y - this.r.y0;
        if (lx >= 0 && ly >= 0 && lx < this.r.w && ly < this.r.h) this.mask[ly * this.r.w + lx] = 1;
      }
  }
  apply(): void {
    for (let y = 0; y < this.r.h; y++)
      for (let x = 0; x < this.r.w; x++)
        if (this.mask[y * this.r.w + x]) this.r.put(this.r.x0 + x, this.r.y0 + y, OUTLINE, SHADOW_ALPHA);
  }
}

function trunk(b: Body, cx: number, cy: number, top: number, lean: number, w: number, p: TreePal): void {
  for (let y = top; y <= cy; y++) {
    const t = (cy - y) / Math.max(1, cy - top);
    const x0 = cx + lean * t;
    const flare = y > cy - 4 ? (y - (cy - 4)) : 0;
    for (let x = Math.round(x0 - w - flare); x <= Math.round(x0 + w + flare); x++) b.put(x, y, x < x0 - 1 ? p.trunk : p.trunkDark);
  }
}

/** A weeping willow: a pale dome on a leaning trunk, strands trailing from its rim. */
export function drawWillow(r: AlphaRaster, cx: number, cy: number, h: number, seed: number): void {
  const p = WILLOW[seed % WILLOW.length];
  const b = new Body(r);
  const lean = (hash2(seed, 3, 1) - 0.5) * 14;
  const domeCy = cy - h * 0.6, rx = h * 0.46, ry = h * 0.3;
  trunk(b, cx, cy, Math.round(domeCy), lean, 3, p);
  const dx = cx + lean;
  // strands first (behind the dome's lower half), then the dome, then front strands
  const strands = 11 + Math.floor(hash2(seed, 4, 1) * 5);
  const strand = (i: number, front: boolean) => {
    const a = (i / strands) * Math.PI;           // around the lower rim
    const sx = dx - Math.cos(a) * rx * 0.95, sy = domeCy + Math.sin(a) * ry * 0.7;
    const len = h * (0.22 + hash2(i, seed, 2) * 0.26);
    const sway = (hash2(i, seed, 5) - 0.5) * 10 + (Math.cos(a)) * -6;
    const col = hash2(i, seed, 6) > 0.5 ? p.light : p.mid;
    let px = sx, py = sy;
    for (let k = 0; k < len; k++) {
      const t = k / len;
      const x = Math.round(sx + sway * t * t), y = Math.round(sy + k);
      if (k % 3 === 0 || front) b.put(x, y, t > 0.75 ? p.bright : col);
      b.put(x + 1, y, t > 0.8 ? col : p.dark);
      px = x; py = y;
    }
    void px; void py;
  };
  for (let i = 0; i < strands; i++) if (i % 2 === 0) strand(i, false);
  ellipse(b.put, dx, domeCy, rx, ry, p.mid);
  ellipse(b.put, dx + rx * 0.15, domeCy + ry * 0.35, rx * 0.85, ry * 0.6, p.dark);
  ellipse(b.put, dx - rx * 0.3, domeCy - ry * 0.3, rx * 0.5, ry * 0.42, p.light);
  for (let i = 0; i < 16; i++) {
    const a = hash2(i, seed, 7) * Math.PI * 2, d = hash2(seed, i, 8) * 0.85;
    const x = Math.round(dx + Math.cos(a) * rx * d - rx * 0.2), y = Math.round(domeCy + Math.sin(a) * ry * d - ry * 0.25);
    b.put(x, y, p.bright); b.put(x + 1, y, p.bright);
  }
  for (let i = 0; i < strands; i++) if (i % 2 === 1) strand(i, true);
  b.outline();
}

/** An alder: a tall straight trunk under a crown of layered round lobes. */
export function drawAlder(r: AlphaRaster, cx: number, cy: number, h: number, seed: number): void {
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

export const WOODS_STYLES: Record<WoodsId, { title: string; lean: string }> = {
  W1: { title: 'Willow Banks', lean: 'weeping willows, pale yellow-green domes trailing strands from leaning trunks' },
  W2: { title: 'Alder Wood', lean: 'round broadleaf crowns in layered lobes on straight trunks, deep summer greens' },
  W3: { title: 'Mixed Stand', lean: 'alders, willows at the water, the Forest\'s layered pines further back' },
  W4: { title: 'Alder & Pine', lean: 'the Alder Wood with the Forest\'s layered pines mixed through, no willows' },
};

/**
 * Trees for every woods tile touching the region, as an alpha overlay to
 * composite over the river ground. HD px in, same packing as the Forest.
 */
export function renderWoods(id: WoodsId, net: RiverNet, x0: number, y0: number, w: number, h: number): AlphaRaster {
  const r = new AlphaRaster(x0, y0, w, h);
  type Def = { cx: number; cy: number; h: number; s: number; kind: 'willow' | 'alder' | 'pine' };
  const trees: Def[] = [];
  const tx0 = Math.floor(x0 / T) - 2, tx1 = Math.ceil((x0 + w) / T) + 2;
  const ty0 = Math.floor(y0 / T) - 1, ty1 = Math.ceil((y0 + h) / T) + 3;
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) {
      if (net.tileKind(tx, ty) !== RIVER_TILE_WOODS) continue;
      let seed = ((tx * 73856093) ^ (ty * 19349669) ^ (net.seed * 83492791)) >>> 0 || 1;
      const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
      const n = 2 + (rnd() > 0.5 ? 1 : 0);
      const nearWater = net.query(tx * 32 + 16, ty * 32 + 16).d > -2.5 * 32;
      const edge = net.openAt(tx * 32 + 16, ty * 32 + 16) > -2.5 * 32;
      for (let i = 0; i < n; i++) {
        const cx = Math.round(tx * T + T / 2 + (rnd() - 0.5) * T * 0.7), cy = Math.round(ty * T + T * 0.85 + (rnd() - 0.5) * T * 0.4);
        const s = Math.floor(rnd() * 1000);
        let kind: Def['kind'] = id === 'W1' ? 'willow' : 'alder';
        if (id === 'W3') kind = nearWater && rnd() < 0.55 ? 'willow' : !edge && rnd() < 0.45 ? 'pine' : 'alder';
        if (id === 'W4') kind = rnd() < (edge ? 0.3 : 0.5) ? 'pine' : 'alder';
        const hh = kind === 'willow' ? 72 + Math.floor(rnd() * 20) : kind === 'pine' ? 96 + Math.floor(rnd() * 28) : 84 + Math.floor(rnd() * 24);
        trees.push({ cx, cy, h: hh, s, kind });
      }
    }
  trees.sort((a, b) => a.cy - b.cy);
  const shadow = new ShadowMask(r);
  for (const t of trees) shadow.add(t.cx + 3, t.cy + 1, t.kind === 'pine' ? 26 : t.h * 0.34);
  shadow.apply();
  // each tree draws into a small scratch raster (so its silhouette mask stays small), then blits
  for (const t of trees) {
    const sx0 = t.cx - 80, sy0 = t.cy - t.h - 24, sw = 160, sh = t.h + 32;
    if (sx0 + sw < x0 || sx0 > x0 + w || sy0 + sh < y0 || sy0 > y0 + h) continue;
    const scratch = new AlphaRaster(sx0, sy0, sw, sh);
    if (t.kind === 'willow') drawWillow(scratch, t.cx, t.cy, t.h, t.s);
    else if (t.kind === 'alder') drawAlder(scratch, t.cx, t.cy, t.h, t.s);
    else drawPine(scratch as any, t.cx, t.cy, t.h, 26 + (t.s % 8), t.s);
    const d = scratch.data;
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        if (d[i + 3]) r.put(sx0 + x, sy0 + y, [d[i], d[i + 1], d[i + 2]], d[i + 3] / 255);
      }
  }
  return r;
}
