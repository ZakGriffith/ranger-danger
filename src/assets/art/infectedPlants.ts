// Infected plant clusters at HD density: 64 texture px per 32-px world tile,
// displayed at half scale by ChunkSystem so the cluster covers the same
// world tiles as before. The look ("Faithful", picked from the
// scripts/infected-studies/stacks.ts renders) is the old 32-px plant kept as
// it was and redrawn sharp: a short dark stem carrying two or three stacked
// pods that narrow going up, lit top-left with a soft dark underside, spore
// lights above drawn as glow dots with a halo, a few dripping tendrils below,
// in two purples and a dark teal, plus the HD sprites' 1-px outline and one
// faint merged ground shadow per cluster. Plants are packed with the old
// clusters' RNG sequence and ranges (2–3 per tile, jittered, back-to-front),
// so nothing changes for pathing or collision.

export const PLANT_CLUSTER_TILE_PX = 64;
/** Padding around the pattern's tiles, in HD px, so tall plants and the shadow fit. */
export const PLANT_CLUSTER_PAD_PX = 80;

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

type Pal = { stem: Rgb; dark: Rgb; mid: Rgb; light: Rgb; glow: Rgb; glowCore: Rgb; drip: Rgb; dripAlt: Rgb };
// the old plant's three palettes, plus a lit core for the glow dots
const PALS: Pal[] = [
  { stem: hex('#2a1040'), dark: hex('#4a2070'), mid: hex('#6a30a0'), light: hex('#8a48c0'), glow: hex('#50e070'), glowCore: hex('#c8ffc8'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
  { stem: hex('#1a2030'), dark: hex('#2a4038'), mid: hex('#3a6050'), light: hex('#4a8068'), glow: hex('#80ff90'), glowCore: hex('#dcffe0'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
  { stem: hex('#2a1838'), dark: hex('#5a2880'), mid: hex('#7a38b0'), light: hex('#9a50d0'), glow: hex('#60e880'), glowCore: hex('#d0ffd0'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
];

/** An RGBA pixel buffer with straight alpha; empty pixels stay transparent. */
class Raster {
  readonly data: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  put(x: number, y: number, c: Rgb, alpha = 1): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.data;
    if (alpha >= 1 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = alpha >= 1 ? 255 : Math.round(alpha * 255); return; }
    d[i] += (c[0] - d[i]) * alpha; d[i + 1] += (c[1] - d[i + 1]) * alpha; d[i + 2] += (c[2] - d[i + 2]) * alpha;
    d[i + 3] = Math.max(d[i + 3], Math.round(alpha * 255));
  }
}

type Put = (x: number, y: number, c: Rgb, alpha?: number) => void;

function disc(put: Put, cx: number, cy: number, r: number, c: Rgb, alpha = 1): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) put(x, y, c, alpha);
}

/** Paints a silhouette mask along with the body, then strokes a 1-px outline around the mask. */
class Body {
  readonly mask: Uint8Array;
  constructor(readonly r: Raster) { this.mask = new Uint8Array(r.w * r.h); }
  put: Put = (x, y, c, a = 1) => {
    if (x < 0 || y < 0 || x >= this.r.w || y >= this.r.h) return;
    this.mask[y * this.r.w + x] = 1;
    this.r.put(x, y, c, a);
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

/** A spore light: a soft halo painted straight onto the raster (over outlines) with a lit core. */
function glowDot(r: Raster, cx: number, cy: number, core: Rgb, halo: Rgb): void {
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  disc(put, cx, cy, 4.5, halo, 0.2);
  disc(put, cx, cy, 3, halo, 0.45);
  disc(put, cx, cy, 2, core);
}

/** One of the old pods at HD: its 2-px dark outline ring, body, top-left highlight, and a soft underside. */
function pod(put: Put, cx: number, cy: number, rx: number, ry: number, p: Pal): void {
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++)
    for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      const d = u * u + v * v;
      if (((x + 0.5 - cx) / (rx + 2)) ** 2 + ((y + 0.5 - cy) / (ry + 2)) ** 2 > 1) continue;
      if (d > 1) { put(x, y, p.dark); continue; }
      let c: Rgb = p.mid;
      if (((u + 0.2) / 0.5) ** 2 + ((v + 0.15) / 0.3) ** 2 <= 1) c = p.light;
      if (v > 0.55 && d > 0.45) c = p.dark;
      put(x, y, c);
    }
}

function drawPlant(r: Raster, cx: number, cy: number, h: number, w: number, variant: number, seed: number): void {
  const p = PALS[variant];
  const b = new Body(r);
  // the old stem (3–4 px wide, h·0.4 tall) doubled, with a small root flare
  const stemW = 6 + Math.floor(hash2(seed, 1, 19) * 4);
  for (let y = Math.floor(cy - h * 0.4); y <= cy; y++) {
    const flare = y > cy - 4 ? (y - (cy - 4)) * 0.6 : 0;
    for (let x = Math.floor(cx - stemW / 2 - flare); x <= Math.ceil(cx + stemW / 2 + flare); x++) b.put(x, y, x < cx - 1 ? p.dark : p.stem);
  }
  // the old layers: 2–3 ovals at cy − h·0.3 − l·h·0.2, half-width w·(1 − l·0.2)/2, height h·0.25
  const layers = 2 + (hash2(seed, 2, 19) > 0.5 ? 1 : 0);
  const pods: { y: number; rx: number; ry: number }[] = [];
  for (let l = 0; l < layers; l++) pods.push({ y: cy - h * 0.3 - l * h * 0.2, rx: w * (1 - l * 0.2) / 2, ry: h * 0.125 });
  for (const q of pods) pod(b.put, cx, q.y, q.rx, q.ry, p);
  // the old spore tips: 3–6 within x ± 0.4w, y from cy − 0.5h to cy − 0.9h
  const n = 3 + Math.floor(hash2(seed, 3, 19) * 4);
  const glows: [number, number][] = [];
  for (let i = 0; i < n; i++) glows.push([Math.round(cx + (hash2(seed, 30 + i, 19) - 0.5) * w * 0.8), Math.round(cy - h * 0.5 - hash2(seed, 40 + i, 19) * h * 0.4)]);
  // the old tendrils: 2–4 drips from the bottom pod, 8–24 px, green or purple
  const drips = 2 + Math.floor(hash2(seed, 4, 19) * 3);
  for (let i = 0; i < drips; i++) {
    let x = Math.round(cx + (hash2(seed, 50 + i, 19) - 0.5) * w * 0.5);
    const len = 8 + Math.floor(hash2(seed, 60 + i, 19) * 16);
    const c = hash2(seed, 70 + i, 19) > 0.5 ? p.drip : p.dripAlt;
    const y0 = Math.round(pods[0].y + pods[0].ry);
    for (let j = 0; j < len; j++) {
      if (j % 5 === 4) x += hash2(seed, 80 + i, j) > 0.5 ? 1 : -1;
      b.put(x, y0 + j, c); b.put(x + 1, y0 + j, c);
    }
    b.put(x, y0 + len, c); b.put(x + 1, y0 + len, c); b.put(x, y0 + len + 1, c);
  }
  b.outline();
  for (const [x, y] of glows) glowDot(r, x, y, p.glowCore, p.glow);
}

/** Shadows accumulate into one coverage mask per cluster so overlapping plants don't stack darker. */
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
  /** Writes the shadow as translucent pixels; it runs before the plants, which paint over it. */
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
 * (w·64 + 2·pad) × (h·64 + 2·pad) HD px, plants packed the way the old
 * clusters were (same seeded RNG sequence, ranges doubled) and sorted back to front.
 */
export function drawInfectedPlantCanvasHD(pattern: { tiles: { dx: number; dy: number }[]; w: number; h: number }, patternIdx: number): HTMLCanvasElement {
  const T = PLANT_CLUSTER_TILE_PX, pad = PLANT_CLUSTER_PAD_PX;
  const r = new Raster(pattern.w * T + pad * 2, pattern.h * T + pad * 2);
  let seed = (patternIdx * 48271 + 99991) >>> 0;
  const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
  type Def = { cx: number; cy: number; h: number; w: number; variant: number; s: number };
  const plants: Def[] = [];
  for (const t of pattern.tiles) {
    const tileCx = t.dx * T + T / 2 + pad, tileCy = t.dy * T + T * 0.85 + pad;
    const n = 2 + (rnd() > 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      plants.push({
        cx: Math.round(tileCx + (rnd() - 0.5) * T * 0.6), cy: Math.round(tileCy + (rnd() - 0.5) * T * 0.3),
        h: 60 + Math.floor(rnd() * 40), w: 36 + Math.floor(rnd() * 20), variant: Math.floor(rnd() * 3), s: Math.floor(rnd() * 1000),
      });
    }
  }
  plants.sort((a, b) => a.cy - b.cy);
  const shadow = new ShadowMask(r);
  for (const q of plants) shadow.add(q.cx + 3, q.cy + 1, q.w * 0.6);
  shadow.apply();
  for (const q of plants) drawPlant(r, q.cx, q.cy, q.h, q.w, q.variant, q.s);

  const canvas = document.createElement('canvas');
  canvas.width = r.w; canvas.height = r.h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(r.w, r.h);
  img.data.set(r.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}
