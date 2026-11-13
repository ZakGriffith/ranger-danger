// Forest tree clusters at HD density: 64 texture px per 32-px world tile,
// displayed at half scale by ChunkSystem so the cluster covers the same
// world tiles as before. The look ("Layered Pine", picked from the
// scripts/meadow-studies/trees.ts renders): tall conifers with five
// scalloped tiers, a dark underside band on every bough, a light top-left
// face, the HD sprites' 1-px outline, and one faint merged ground shadow per
// cluster. Trees are packed the same way as the old 32-px clusters (2–3 per
// tile, jittered, back-to-front), so nothing changes for pathing or collision.

export const TREE_CLUSTER_TILE_PX = 64;
/** Padding around the pattern's tiles, in HD px, so tall trees and the shadow fit. */
export const TREE_CLUSTER_PAD_PX = 80;

type Rgb = readonly [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}

const OUTLINE = hex('#0b0f1a');
const SHADOW = hex('#0b0f1a');
const SHADOW_ALPHA = 0.18;

type TreePal = { dark: Rgb; mid: Rgb; light: Rgb; bright: Rgb; trunk: Rgb; trunkDark: Rgb };
// Six hue families, all green: blue spruce, cool pine, deep pine, mid pine,
// warm pine, yellow pine. A per-tree brightness jitter and highlight density
// are layered on top so no two neighbours shade the same way.
const PINE: TreePal[] = [
  { dark: hex('#0f2a22'), mid: hex('#1b4a3a'), light: hex('#2b6a4c'), bright: hex('#4a9a68'), trunk: hex('#45301c'), trunkDark: hex('#261a0c') },
  { dark: hex('#10261a'), mid: hex('#1b442a'), light: hex('#2a6438'), bright: hex('#43874a'), trunk: hex('#45301c'), trunkDark: hex('#261a0c') },
  { dark: hex('#0e2412'), mid: hex('#193e1e'), light: hex('#255a2a'), bright: hex('#3c7e3c'), trunk: hex('#3e2814'), trunkDark: hex('#22140a') },
  { dark: hex('#122a16'), mid: hex('#1f4a26'), light: hex('#2f6a34'), bright: hex('#4a8f45'), trunk: hex('#4a2e16'), trunkDark: hex('#2a1808') },
  { dark: hex('#1a2e12'), mid: hex('#2c5222'), light: hex('#3f7430'), bright: hex('#5f9a42'), trunk: hex('#4e3218'), trunkDark: hex('#2c1a0a') },
  { dark: hex('#223214'), mid: hex('#3a5a22'), light: hex('#527c2e'), bright: hex('#78a842'), trunk: hex('#54381a'), trunkDark: hex('#30200c') },
];

const scaleRgb = (c: Rgb, f: number): Rgb => [Math.min(255, Math.round(c[0] * f)), Math.min(255, Math.round(c[1] * f)), Math.min(255, Math.round(c[2] * f))];

/** A tree's own palette: one of the hue families, brightened or dimmed a little. */
function treePalette(seed: number): TreePal {
  const base = PINE[Math.floor(hash2(seed, 1, 5) * PINE.length)];
  const f = 0.9 + hash2(seed, 2, 5) * 0.2;
  return { dark: scaleRgb(base.dark, f), mid: scaleRgb(base.mid, f), light: scaleRgb(base.light, f), bright: scaleRgb(base.bright, f), trunk: base.trunk, trunkDark: base.trunkDark };
}

/** An RGBA pixel buffer with straight alpha; empty pixels stay transparent. */
class Raster {
  readonly data: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  put(x: number, y: number, c: Rgb): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.data;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
}

/** Paints a silhouette mask along with the body, then strokes a 1-px outline around the mask. */
class Body {
  readonly mask: Uint8Array;
  constructor(readonly r: Raster) { this.mask = new Uint8Array(r.w * r.h); }
  put = (x: number, y: number, c: Rgb): void => {
    if (x < 0 || y < 0 || x >= this.r.w || y >= this.r.h) return;
    this.mask[y * this.r.w + x] = 1;
    this.r.put(x, y, c);
  };
  outline(): void {
    const { w, h } = this.r, m = this.mask;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (m[y * w + x]) continue;
        if ((x > 0 && m[y * w + x - 1]) || (x < w - 1 && m[y * w + x + 1]) || (y > 0 && m[(y - 1) * w + x]) || (y < h - 1 && m[(y + 1) * w + x]))
          this.r.put(x, y, OUTLINE);
      }
  }
}

/** One scalloped conifer tier: a triangular bough with a wavy bottom, lit top-left, dark underside. */
function tier(put: (x: number, y: number, c: Rgb) => void, cx: number, top: number, bot: number, halfW: number, p: TreePal, seed: number, dabs: number): void {
  const h = bot - top;
  for (let y = Math.floor(top); y <= Math.ceil(bot) + 3; y++) {
    const t = Math.max(0, Math.min(1, (y - top) / h));
    const w = halfW * t;
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
      // scallop: the lower edge hangs down in lobes
      const lobe = Math.abs(Math.sin((x - cx) / halfW * Math.PI * 2.2 + seed)) * 3;
      if (y > bot + lobe) continue;
      const u = (x - cx) / Math.max(w, 1); // -1 left .. 1 right
      const underside = y > bot - 2.5 + lobe * 0.5;
      let c: Rgb;
      if (underside) c = p.dark;
      else if (u < -0.15 && t > 0.15 && t < 0.9) c = p.light;
      else if (u > 0.45) c = p.dark;
      else c = p.mid;
      if (!underside && u < -0.25 && t > 0.35 && t < 0.75 && hash2(x, y, seed) > dabs) c = p.bright;
      put(x, y, c);
    }
  }
}

function drawPine(r: Raster, cx: number, cy: number, h: number, baseHalf: number, seed: number): void {
  const p = treePalette(seed);
  const dabs = 0.64 + hash2(seed, 3, 5) * 0.22; // highlight dab density: sparse to generous
  const b = new Body(r);
  // trunk and root flare
  for (let y = cy - 14; y <= cy; y++) {
    const flare = y > cy - 4 ? (y - (cy - 4)) : 0;
    for (let x = cx - 3 - flare; x <= cx + 3 + flare; x++) b.put(x, y, x < cx - 1 ? p.trunk : p.trunkDark);
  }
  const tiers = 5;
  const top = cy - h;
  for (let i = tiers - 1; i >= 0; i--) {
    const f0 = i / tiers, f1 = (i + 1) / tiers;
    const tTop = top + h * f0 * 0.92 - 4;
    const tBot = top + h * f1 * 0.92 + (i === tiers - 1 ? -6 : 2);
    const half = baseHalf * (0.3 + 0.7 * f1);
    tier(b.put, cx, tTop, tBot, half, p, seed * 7 + i, dabs);
  }
  // tip
  for (let y = top - 3; y <= top + 2; y++) b.put(cx, y, p.bright);
  b.put(cx - 1, top + 1, p.bright);
  b.outline();
}

/** Shadows accumulate into one coverage mask per cluster so overlapping trees don't stack darker. */
class ShadowMask {
  readonly cov: Float32Array;
  constructor(readonly r: Raster) { this.cov = new Float32Array(r.w * r.h); }
  add(cx: number, cy: number, rx: number): void {
    const ry = rx * 0.32;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d > 1 || x < 0 || y < 0 || x >= this.r.w || y >= this.r.h) continue;
        const i = y * this.r.w + x;
        this.cov[i] = Math.max(this.cov[i], 1 - d * 0.5);
      }
  }
  /** Writes the shadow as translucent pixels; it runs before the trees, which paint over it. */
  apply(): void {
    const d = this.r.data;
    for (let i = 0; i < this.cov.length; i++) {
      if (this.cov[i] <= 0) continue;
      const j = i * 4;
      d[j] = SHADOW[0]; d[j + 1] = SHADOW[1]; d[j + 2] = SHADOW[2]; d[j + 3] = Math.round(SHADOW_ALPHA * this.cov[i] * 255);
    }
  }
}

/**
 * Renders one cluster pattern into a canvas of
 * (w·64 + 2·pad) × (h·64 + 2·pad) HD px, trees packed the way the old
 * clusters were (same seeded RNG sequence) and sorted back to front.
 */
export function drawTreeClusterCanvasHD(pattern: { tiles: { dx: number; dy: number }[]; w: number; h: number }, patternIdx: number): HTMLCanvasElement {
  const T = TREE_CLUSTER_TILE_PX, pad = TREE_CLUSTER_PAD_PX;
  const r = new Raster(pattern.w * T + pad * 2, pattern.h * T + pad * 2);
  let seed = (patternIdx * 73856093 + 54321) >>> 0;
  const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
  type Def = { cx: number; cy: number; h: number; half: number; s: number };
  const trees: Def[] = [];
  for (const t of pattern.tiles) {
    const tileCx = t.dx * T + T / 2 + pad, tileCy = t.dy * T + T * 0.85 + pad;
    const n = 2 + (rnd() > 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const cx = Math.round(tileCx + (rnd() - 0.5) * T * 0.7), cy = Math.round(tileCy + (rnd() - 0.5) * T * 0.4);
      const h = 96 + Math.floor(rnd() * 28);
      trees.push({ cx, cy, h, half: 26 + Math.floor(rnd() * 8), s: Math.floor(rnd() * 1000) });
    }
  }
  trees.sort((a, b) => a.cy - b.cy);
  const shadow = new ShadowMask(r);
  for (const t of trees) shadow.add(t.cx + 3, t.cy + 1, t.half * 0.9);
  shadow.apply();
  for (const t of trees) drawPine(r, t.cx, t.cy, t.h, t.half, t.s);

  const canvas = document.createElement('canvas');
  canvas.width = r.w; canvas.height = r.h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(r.w, r.h);
  img.data.set(r.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}
