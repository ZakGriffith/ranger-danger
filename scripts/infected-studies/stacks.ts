// Infected plant studies, round two: variations on today's plants, which Zak
// likes. Today's plant is a short dark stem carrying two or three stacked
// ovals that narrow going up, lit top-left, with glowing spore pixels
// scattered above and a few dripping tendrils below, in two purples and one
// dark teal. These keep that silhouette and those three palettes exactly and
// redraw it at HD density (64 px per 32-px world tile, twice today's).
//
//   Q1  Faithful     — today's plant 1:1 at HD: same proportions, same
//                      palettes, cleaned edges (1-px outline), a soft dark
//                      underside on each pod, spore lights as glow dots
//   Q2  Spore Sacs   — the pods are translucent sacs: a brighter inner body
//                      with spore motes glowing inside, pale rim top-left
//   Q3  Burst Tops   — the top pod has split open and glows green inside,
//                      spores rise out of it, the drips glow too

import { Raster, Rgb, hex, hash2, ellipse, disc, line, Put } from '../meadow-studies/raster';

export type StackId = 'Q1' | 'Q2' | 'Q3';

const OUTLINE = hex('#0b0f1a');
const BLACK = hex('#0b0f1a');

type Pal = { stem: Rgb; dark: Rgb; mid: Rgb; light: Rgb; glow: Rgb; glowCore: Rgb; drip: Rgb; dripAlt: Rgb };
// today's three palettes (terrain.ts drawInfectedPlantCanvas), plus a lit core for the glow dots
const PALS: Pal[] = [
  { stem: hex('#2a1040'), dark: hex('#4a2070'), mid: hex('#6a30a0'), light: hex('#8a48c0'), glow: hex('#50e070'), glowCore: hex('#c8ffc8'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
  { stem: hex('#1a2030'), dark: hex('#2a4038'), mid: hex('#3a6050'), light: hex('#4a8068'), glow: hex('#80ff90'), glowCore: hex('#dcffe0'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
  { stem: hex('#2a1838'), dark: hex('#5a2880'), mid: hex('#7a38b0'), light: hex('#9a50d0'), glow: hex('#60e880'), glowCore: hex('#d0ffd0'), drip: hex('#40c060'), dripAlt: hex('#6030a0') },
];

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

function glowDot(r: Raster, cx: number, cy: number, core: Rgb, halo: Rgb, rad = 2): void {
  const put = r.put.bind(r);
  disc(put, cx, cy, rad + 2.5, halo, 0.2);
  disc(put, cx, cy, rad + 1, halo, 0.45);
  disc(put, cx, cy, rad, core);
}

/** One of today's pods at HD: dark outline ring, body, top-left highlight; Q1 adds a soft underside, Q2 an inner glow. */
function stackPod(put: Put, cx: number, cy: number, rx: number, ry: number, p: Pal, id: StackId, seed: number): void {
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++)
    for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      const d = u * u + v * v;
      const ring = ((x + 0.5 - cx) / (rx + 2)) ** 2 + ((y + 0.5 - cy) / (ry + 2)) ** 2;
      if (ring > 1) continue;
      if (d > 1) { put(x, y, p.dark); continue; } // today's +1 outline ring, 2 px at HD
      let c: Rgb = p.mid;
      if (id === 'Q2') {
        // translucent sac: a lighter inner body, darker only at the very rim
        if (d < 0.55) c = p.light;
        if (d > 0.82 && u > -0.2 && v > -0.2) c = p.dark;
        if (u * 0.8 + v < -0.7) c = p.light;
      } else {
        // today's highlight ellipse: centre (-0.2rx, -0.15ry), half-axes (0.5rx, 0.3ry)
        if (((u + 0.2) / 0.5) ** 2 + ((v + 0.15) / 0.3) ** 2 <= 1) c = p.light;
        if (v > 0.55 && d > 0.45) c = p.dark; // soft underside
      }
      put(x, y, c);
    }
  if (id === 'Q2') {
    // spore motes inside the sac
    const n = 2 + Math.floor(hash2(seed, 1, 17) * 3);
    for (let i = 0; i < n; i++) {
      const a = hash2(seed, 10 + i, 17) * Math.PI * 2, dd = 0.2 + hash2(seed, 20 + i, 17) * 0.5;
      const x = Math.round(cx + Math.cos(a) * rx * dd), y = Math.round(cy + Math.sin(a) * ry * dd);
      put(x, y, p.glow, 0.85); put(x + 1, y, p.glow, 0.5); put(x, y + 1, p.glow, 0.5);
    }
  }
}

export function drawStack(r: Raster, cx: number, cy: number, h: number, w: number, variant: number, seed: number, id: StackId): [number, number][] {
  const p = PALS[variant];
  const b = new Body(r);
  // today's stem: 3-4 px wide at 32, h*0.4 tall; doubled here, with a small root flare
  const stemW = 6 + Math.floor(hash2(seed, 1, 19) * 4);
  for (let y = Math.floor(cy - h * 0.4); y <= cy; y++) {
    const flare = y > cy - 4 ? (y - (cy - 4)) * 0.6 : 0;
    for (let x = Math.floor(cx - stemW / 2 - flare); x <= Math.ceil(cx + stemW / 2 + flare); x++) b.put(x, y, x < cx - 1 ? p.dark : p.stem);
  }
  // today's layers: 2-3 ovals at cy - h*0.3 - l*h*0.2, half-width w*(1-l*0.2)/2, height h*0.25
  const layers = 2 + (hash2(seed, 2, 19) > 0.5 ? 1 : 0);
  const pods: { x: number; y: number; rx: number; ry: number }[] = [];
  for (let l = 0; l < layers; l++) pods.push({ x: cx, y: cy - h * 0.3 - l * h * 0.2, rx: w * (1 - l * 0.2) / 2, ry: h * 0.125 });
  for (let l = 0; l < layers; l++) stackPod(b.put, pods[l].x, pods[l].y, pods[l].rx, pods[l].ry, p, id, seed * 3 + l);
  const top = pods[layers - 1];
  const glows: [number, number][] = [];
  if (id === 'Q3') {
    // the top pod has split: a jagged dark opening with a glowing interior
    const ox = top.x + top.rx * 0.05, oy = top.y - top.ry * 0.35, orx = top.rx * 0.55, ory = top.ry * 0.5;
    for (let y = Math.floor(oy - ory - 1); y <= Math.ceil(oy + ory + 1); y++)
      for (let x = Math.floor(ox - orx - 1); x <= Math.ceil(ox + orx + 1); x++) {
        const jag = 1 + hash2(x, 0, seed) * 2.2;
        const u = (x + 0.5 - ox) / orx, v = (y + 0.5 - oy) / ory;
        const d = u * u + v * v;
        if (d > 1 + (v < 0 ? jag * 0.3 : 0)) continue;
        b.put(x, y, d > 0.7 ? p.stem : d > 0.45 ? p.dark : (u + 0.3) ** 2 + (v + 0.3) ** 2 < 0.08 ? p.glowCore : p.glow);
      }
    for (let i = 0; i < 2 + Math.floor(hash2(seed, 3, 19) * 3); i++) {
      glows.push([Math.round(ox + (hash2(seed, 30 + i, 19) - 0.5) * orx * 1.6), Math.round(oy - ory - 3 - hash2(seed, 40 + i, 19) * h * 0.3)]);
    }
  } else {
    // today's spore tips: 3-6 dots within x±0.4w, y from cy-0.5h to cy-0.9h
    const n = (id === 'Q2' ? 2 : 3) + Math.floor(hash2(seed, 3, 19) * (id === 'Q2' ? 2 : 4));
    for (let i = 0; i < n; i++) glows.push([Math.round(cx + (hash2(seed, 30 + i, 19) - 0.5) * w * 0.8), Math.round(cy - h * 0.5 - hash2(seed, 40 + i, 19) * h * 0.4)]);
  }
  // today's tendrils: 2-4 drips from the bottom pod, 4-12 px (doubled), green or purple
  const drips = (id === 'Q3' ? 3 : 2) + Math.floor(hash2(seed, 4, 19) * 3);
  for (let i = 0; i < drips; i++) {
    const dx = Math.round(cx + (hash2(seed, 50 + i, 19) - 0.5) * w * 0.5);
    const len = 8 + Math.floor(hash2(seed, 60 + i, 19) * 16);
    const c = id === 'Q3' || hash2(seed, 70 + i, 19) > 0.5 ? p.drip : p.dripAlt;
    const y0 = Math.round(pods[0].y + pods[0].ry);
    let x = dx;
    for (let j = 0; j < len; j++) {
      if (j % 5 === 4) x += hash2(seed, 80 + i, j) > 0.5 ? 1 : -1;
      b.put(x, y0 + j, c); b.put(x + 1, y0 + j, c);
    }
    b.put(x, y0 + len, c); b.put(x + 1, y0 + len, c); b.put(x, y0 + len + 1, c);
  }
  b.outline();
  return glows.map(([x, y]) => { glowDot(r, x, y, p.glowCore, p.glow, id === 'Q3' ? 1.5 : 2); return [x, y]; });
}

/** Renders a cluster pattern at HD density with today's packing (2–3 plants per tile, jittered, back-to-front). */
export function drawStackCluster(id: StackId, pattern: { tiles: { dx: number; dy: number }[]; w: number; h: number }, patternIdx: number, pad = 80): Raster {
  const T = 64;
  const r = new Raster(0, 0, pattern.w * T + pad * 2, pattern.h * T + pad * 2);
  // today's RNG sequence and ranges, doubled for HD
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
  for (const q of plants) drawStack(r, q.cx, q.cy, q.h, q.w, q.variant, q.s, id);
  return r;
}

export const STACK_STYLES: Record<StackId, { title: string; lean: string }> = {
  Q1: { title: 'Faithful', lean: 'today\'s plant at HD: same proportions and palettes, clean outline, soft underside' },
  Q2: { title: 'Spore Sacs', lean: 'the pods as translucent sacs with spore motes glowing inside' },
  Q3: { title: 'Burst Tops', lean: 'the top pod split open and glowing, spores rising, glowing drips' },
};
