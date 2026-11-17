// Infected plant cluster studies at HD density (64 px per 32-px world tile)
// in the Wild Field vocabulary the forest pines shipped with: lit from the
// top-left, a dark underside on every form, the HD sprites' 1-px outline and
// one soft merged ground shadow per cluster. Each design draws one plant into
// a Raster; the cluster renderer packs plants per tile the way the game does.
//
//   P1  Spore Bulbs   — today's idea redrawn: a thick fleshy stalk carrying a
//                       stack of violet pods, green spore lights on thin
//                       stems above, a drip or two below
//   P2  Blight Caps   — giant toadstools: broad violet caps with pale spots,
//                       gills glowing acid green from beneath, pale stalks,
//                       small satellite caps at the foot
//   P3  Thorn Snags   — dead, twisted, thorny trees with no leaves, green
//                       egg sacs hanging from the branches and a few web
//                       strands between them
//   P4  Snags & Caps  — P3 snags with P2 toadstools growing at their feet

import { Raster, Rgb, hex, hash2, ellipse, disc, line, Put } from '../meadow-studies/raster';

export type PlantId = 'P1' | 'P2' | 'P3' | 'P4';

const OUTLINE = hex('#0b0f1a');
const BLACK = hex('#0b0f1a');

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

/** Shadows accumulate into one coverage mask per cluster so overlapping plants don't stack to black. */
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

/** A soft glow halo painted straight onto the raster (over outlines) with a lit core. */
function glowDot(r: Raster, cx: number, cy: number, core: Rgb, halo: Rgb, rad = 2): void {
  disc(r.put.bind(r), cx, cy, rad + 2.5, halo, 0.22);
  disc(r.put.bind(r), cx, cy, rad + 1, halo, 0.45);
  disc(r.put.bind(r), cx, cy, rad, core);
}

type ShadePal = { dark: Rgb; mid: Rgb; light: Rgb; bright: Rgb };

/** A sphere-shaded ellipse: lit top-left, dark lower band, one bright spot. */
function pod(put: Put, cx: number, cy: number, rx: number, ry: number, p: ShadePal, seam = false): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      const d = u * u + v * v;
      if (d > 1) continue;
      let c: Rgb = p.mid;
      if (v > 0.42 || u > 0.72) c = p.dark;
      else if (u * 0.8 + v < -0.45) c = p.light;
      if ((u + 0.42) ** 2 + (v + 0.5) ** 2 < 0.05) c = p.bright;
      if (seam && Math.abs(u + 0.12 + v * v * 0.1) < 0.04 && v > -0.6 && v < 0.5 && c !== p.dark) c = p.mid === c ? p.dark : p.mid;
      put(x, y, c);
    }
}

// ---- P1 Spore Bulbs ---------------------------------------------------------
type BulbPal = ShadePal & { stem: Rgb; stemDark: Rgb; glow: Rgb; glowCore: Rgb; drip: Rgb };
const BULB: BulbPal[] = [
  { dark: hex('#2a1240'), mid: hex('#4a2470'), light: hex('#6a3a98'), bright: hex('#8c58b8'), stem: hex('#2e1a44'), stemDark: hex('#1a0e28'), glow: hex('#7cf07a'), glowCore: hex('#d8ffc8'), drip: hex('#58d868') },
  { dark: hex('#241838'), mid: hex('#3e2c62'), light: hex('#5c4488'), bright: hex('#7e64ac'), stem: hex('#2a1e3c'), stemDark: hex('#160e24'), glow: hex('#8af088'), glowCore: hex('#e0ffd0'), drip: hex('#66d872') },
  { dark: hex('#321446'), mid: hex('#582478'), light: hex('#7a3aa0'), bright: hex('#a058c4'), stem: hex('#30183e'), stemDark: hex('#1c0c26'), glow: hex('#74e872'), glowCore: hex('#d0ffc0'), drip: hex('#50cc60') },
];

export function drawBulb(r: Raster, cx: number, cy: number, h: number, w: number, seed: number): void {
  const p = BULB[seed % 3];
  const b = new Body(r);
  const stemH = h * 0.42, stemW = 4 + Math.floor(hash2(seed, 1, 9) * 3);
  // fleshy stalk with a root flare, lit on the left
  for (let y = cy - stemH; y <= cy; y++) {
    const flare = y > cy - 5 ? (y - (cy - 5)) * 0.8 : 0;
    for (let x = Math.floor(cx - stemW / 2 - flare); x <= Math.ceil(cx + stemW / 2 + flare); x++) b.put(x, y, x < cx - 1 ? p.stem : p.stemDark);
  }
  // pods, biggest at the bottom, each overlapping the one below
  const layers = 2 + (hash2(seed, 2, 9) > 0.45 ? 1 : 0);
  const pods: { x: number; y: number; rx: number; ry: number }[] = [];
  for (let l = 0; l < layers; l++) {
    const ly = cy - stemH - l * h * 0.17 - h * 0.06;
    const rx = (w / 2) * (1 - l * 0.22), ry = h * 0.13 * (1 - l * 0.1);
    const lean = (hash2(seed, 10 + l, 9) - 0.5) * 6 * l;
    pods.push({ x: cx + lean, y: ly, rx, ry });
  }
  for (const q of pods) pod(b.put, q.x, q.y, q.rx, q.ry, p, true);
  // spore stems above the top pod
  const top = pods[pods.length - 1];
  const n = 2 + Math.floor(hash2(seed, 3, 9) * 3);
  const tips: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const sx = Math.round(top.x + (hash2(seed, 20 + i, 9) - 0.5) * top.rx * 1.6);
    const sy = Math.round(top.y - top.ry - 4 - hash2(seed, 30 + i, 9) * h * 0.22);
    line(b.put, sx, Math.round(top.y - top.ry * 0.3), sx + (sx > top.x ? 1 : -1), sy, p.stemDark);
    tips.push([sx + (sx > top.x ? 1 : -1), sy]);
  }
  // drips below the lowest pod
  const drips = 1 + Math.floor(hash2(seed, 4, 9) * 2);
  for (let i = 0; i < drips; i++) {
    const dx = Math.round(pods[0].x + (hash2(seed, 40 + i, 9) - 0.5) * pods[0].rx * 1.2);
    const len = 4 + Math.floor(hash2(seed, 50 + i, 9) * 8);
    const y0 = Math.round(pods[0].y + pods[0].ry * 0.6);
    line(b.put, dx, y0, dx, y0 + len, p.drip);
    b.put(dx, y0 + len + 1, p.drip);
  }
  b.outline();
  for (const [x, y] of tips) glowDot(r, x, y, p.glowCore, p.glow, 2);
}

// ---- P2 Blight Caps ---------------------------------------------------------
type CapPal = ShadePal & { spot: Rgb; stalk: Rgb; stalkDark: Rgb; stalkLight: Rgb; gill: Rgb; gillGlow: Rgb; gillCore: Rgb };
const CAP: CapPal[] = [
  { dark: hex('#2e1a48'), mid: hex('#512a80'), light: hex('#7040a8'), bright: hex('#9a62cc'), spot: hex('#c8b0dc'), stalk: hex('#8e8498'), stalkDark: hex('#564c62'), stalkLight: hex('#bcb4c4'), gill: hex('#1e3a22'), gillGlow: hex('#6ee070'), gillCore: hex('#c0ffb0') },
  { dark: hex('#26183c'), mid: hex('#442a68'), light: hex('#604290'), bright: hex('#8664b4'), spot: hex('#d0c0dc'), stalk: hex('#8a8290'), stalkDark: hex('#524a5c'), stalkLight: hex('#b8b2be'), gill: hex('#1c3620'), gillGlow: hex('#7ce87c'), gillCore: hex('#ccffc0') },
  { dark: hex('#36164a'), mid: hex('#5e2688'), light: hex('#8040b0'), bright: hex('#a860d0'), spot: hex('#dcc4e8'), stalk: hex('#948a9c'), stalkDark: hex('#5a5066'), stalkLight: hex('#c4bccc'), gill: hex('#203c24'), gillGlow: hex('#6adc6c'), gillCore: hex('#c4ffb4') },
];

function capDome(put: Put, cx: number, capY: number, rx: number, ry: number, p: CapPal, seed: number): void {
  // dome above capY; the underside is a flatter ellipse showing gills
  for (let y = Math.floor(capY - ry); y <= Math.ceil(capY + ry * 0.32); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx;
      if (y <= capY) {
        const v = (y + 0.5 - capY) / ry;
        if (u * u + v * v > 1) continue;
        let c: Rgb = p.mid;
        if (u > 0.7 || v > -0.18) c = p.dark;
        else if (u * 0.8 + v < -0.6) c = p.light;
        if ((u + 0.45) ** 2 + (v + 0.55) ** 2 < 0.035) c = p.bright;
        put(x, y, c);
      } else {
        const v = (y + 0.5 - capY) / (ry * 0.32);
        if (u * u + v * v > 1) continue;
        // gills: dark with glowing ridges toward the rim
        const rim = u * u + v * v > 0.55;
        put(x, y, rim && ((x + seed) % 3 !== 0) ? p.gillGlow : p.gill);
      }
    }
  // pale spots on the lit side
  const spots = 3 + Math.floor(hash2(seed, 5, 11) * 3);
  for (let i = 0; i < spots; i++) {
    const a = hash2(seed, 60 + i, 11) * Math.PI * 1.1 + Math.PI * 1.0, d = 0.25 + hash2(seed, 70 + i, 11) * 0.5;
    const sx = cx + Math.cos(a) * rx * d, sy = capY + Math.sin(a) * ry * d - ry * 0.1;
    const sr = 1.5 + hash2(seed, 80 + i, 11) * 2;
    if (sy < capY - 2) ellipse(put, sx, sy, sr, sr * 0.7, p.spot);
  }
}

export function drawCap(r: Raster, cx: number, cy: number, h: number, rx: number, seed: number): void {
  const p = CAP[seed % 3];
  const b = new Body(r);
  const stalkW = 7 + Math.floor(hash2(seed, 1, 11) * 5);
  const capY = cy - h * 0.62;
  // stalk: rounded shading, light left, dark right, root flare
  for (let y = capY; y <= cy; y++) {
    const flare = y > cy - 6 ? (y - (cy - 6)) * 0.7 : 0;
    const hw = stalkW / 2 + flare;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = (x + 0.5 - cx) / hw;
      b.put(x, y, u < -0.45 ? p.stalkLight : u > 0.4 ? p.stalkDark : p.stalk);
    }
  }
  capDome(b.put, cx, capY, rx, h * 0.3, p, seed);
  // satellite caps at the foot
  const sats = Math.floor(hash2(seed, 6, 11) * 3);
  for (let i = 0; i < sats; i++) {
    const sx = Math.round(cx + (hash2(seed, 90 + i, 11) > 0.5 ? 1 : -1) * (rx * 0.6 + hash2(seed, 100 + i, 11) * 8));
    const sy = cy - 2 + Math.floor(hash2(seed, 110 + i, 11) * 5);
    const sh = 10 + hash2(seed, 120 + i, 11) * 8, srx = 5 + hash2(seed, 130 + i, 11) * 4;
    for (let y = sy - sh * 0.55; y <= sy; y++) for (let x = sx - 2; x <= sx + 2; x++) b.put(x, y, x < sx ? p.stalkLight : p.stalk);
    capDome(b.put, sx, sy - sh * 0.55, srx, sh * 0.35, p, seed + 7 + i);
  }
  b.outline();
  // a faint glow under the rim where the gills light the stalk
  disc(r.put.bind(r), cx, capY + h * 0.3 * 0.32 + 2, rx * 0.55, p.gillGlow, 0.14);
  glowDot(r, cx - rx * 0.3, capY + h * 0.3 * 0.2, p.gillCore, p.gillGlow, 1);
}

// ---- P3 Thorn Snags ---------------------------------------------------------
type SnagPal = { dark: Rgb; mid: Rgb; light: Rgb; thorn: Rgb; sac: Rgb; sacLight: Rgb; sacDark: Rgb; glow: Rgb; glowCore: Rgb; web: Rgb };
const SNAG: SnagPal[] = [
  { dark: hex('#15101c'), mid: hex('#2a2034'), light: hex('#443650'), thorn: hex('#6a5878'), sac: hex('#3e7a34'), sacLight: hex('#78c860'), sacDark: hex('#244c1e'), glow: hex('#7cf07a'), glowCore: hex('#d8ffc8'), web: hex('#c8c0d8') },
  { dark: hex('#140e1a'), mid: hex('#261a30'), light: hex('#3e2e4a'), thorn: hex('#625070'), sac: hex('#467e36'), sacLight: hex('#84cc66'), sacDark: hex('#285220'), glow: hex('#88f084'), glowCore: hex('#dcffd0'), web: hex('#c4bcd4') },
  { dark: hex('#181220'), mid: hex('#30243a'), light: hex('#4a3a56'), thorn: hex('#705c80'), sac: hex('#3a7230'), sacLight: hex('#72c05a'), sacDark: hex('#22481c'), glow: hex('#74e872'), glowCore: hex('#d0ffc0'), web: hex('#ccc4dc') },
];

/** A tapering crooked limb: discs along a jittered polyline, left edge lit. */
function limb(put: Put, pts: [number, number][], w0: number, w1: number, p: SnagPal): [number, number][] {
  const out: [number, number][] = [];
  const segs = pts.length - 1;
  for (let s = 0; s < segs; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    for (let i = 0; i <= n; i++) {
      const t = (s + i / n) / segs;
      const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n;
      const w = w0 + (w1 - w0) * t;
      for (let dx = -Math.ceil(w / 2); dx <= Math.ceil(w / 2); dx++) {
        if (Math.abs(dx) > w / 2) continue;
        const u = dx / Math.max(w / 2, 0.5);
        put(Math.round(x + dx), Math.round(y), u < -0.35 ? p.light : u > 0.45 ? p.dark : p.mid);
      }
      out.push([Math.round(x), Math.round(y)]);
    }
  }
  return out;
}

export function drawSnag(r: Raster, cx: number, cy: number, h: number, seed: number): void {
  const p = SNAG[seed % 3];
  const b = new Body(r);
  const lean = (hash2(seed, 1, 13) - 0.5) * 0.5;
  // trunk: three crooked segments, tapering from a flared root
  const trunk: [number, number][] = [[cx, cy + 1]];
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    trunk.push([Math.round(cx + lean * h * t + (hash2(seed, 2 + i, 13) - 0.5) * 14 * t), Math.round(cy - h * t * 0.78)]);
  }
  for (let y = cy - 6; y <= cy + 1; y++) { const f = (y - (cy - 6)); for (let x = cx - 4 - f; x <= cx + 4 + f; x++) b.put(x, y, x < cx - 1 ? p.light : x > cx + 2 ? p.dark : p.mid); }
  const spine = limb(b.put, trunk, 9, 3, p);
  // branches off the upper half, each a crooked two-segment limb with a fork
  const branches = 2 + Math.floor(hash2(seed, 7, 13) * 2);
  const tips: [number, number][] = [];
  const sacs: [number, number, number][] = [];
  for (let i = 0; i < branches; i++) {
    const at = spine[Math.floor(spine.length * (0.45 + hash2(seed, 20 + i, 13) * 0.45))];
    const dir = i % 2 === 0 ? -1 : 1;
    const len = h * (0.25 + hash2(seed, 30 + i, 13) * 0.2);
    const mid: [number, number] = [Math.round(at[0] + dir * len * 0.55), Math.round(at[1] - len * (0.2 + hash2(seed, 40 + i, 13) * 0.4))];
    const end: [number, number] = [Math.round(mid[0] + dir * len * 0.45), Math.round(mid[1] - len * (0.1 + hash2(seed, 50 + i, 13) * 0.5))];
    limb(b.put, [at, mid, end], 4, 1, p);
    const fork: [number, number] = [Math.round(mid[0] + dir * len * 0.2), Math.round(mid[1] + len * 0.25)];
    limb(b.put, [mid, fork], 2, 1, p);
    tips.push(end);
    // thorns along the branch
    for (let k = 0; k < 3; k++) {
      const t = 0.3 + k * 0.25;
      const tx = Math.round(at[0] + (mid[0] - at[0]) * t), ty = Math.round(at[1] + (mid[1] - at[1]) * t);
      b.put(tx, ty - 2, p.thorn); b.put(tx, ty - 3, p.thorn);
    }
    if (hash2(seed, 60 + i, 13) > 0.35) sacs.push([fork[0], fork[1] + 4 + Math.floor(hash2(seed, 70 + i, 13) * 6), 3 + Math.floor(hash2(seed, 80 + i, 13) * 2)]);
  }
  // crown thorns at the top
  const top = spine[spine.length - 1];
  b.put(top[0], top[1] - 2, p.thorn); b.put(top[0] - 2, top[1] - 1, p.thorn); b.put(top[0] + 2, top[1] - 1, p.thorn);
  // egg sacs hang from the forks on a short thread
  for (const [sx, sy, sr] of sacs) {
    line(b.put, sx, sy - sr - 5, sx, sy - sr, p.dark);
    pod(b.put, sx, sy, sr, sr * 1.5, { dark: p.sacDark, mid: p.sac, light: p.sacLight, bright: p.glowCore });
  }
  b.outline();
  for (const [sx, sy, sr] of sacs) disc(r.put.bind(r), sx, sy, sr + 3, p.glow, 0.16);
  // a web strand between two branch tips, sagging
  if (tips.length >= 2 && hash2(seed, 9, 13) > 0.4) {
    const [a, c] = [tips[0], tips[1]];
    const n = Math.max(Math.abs(c[0] - a[0]), 8);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.round(a[0] + (c[0] - a[0]) * t), y = Math.round(a[1] + (c[1] - a[1]) * t + Math.sin(t * Math.PI) * 6);
      r.put(x, y, p.web, 0.5);
    }
  }
}

// ---- cluster packing --------------------------------------------------------

/**
 * Renders a cluster pattern at HD density with the game's packing (2–3
 * plants per tile for P1/P2, the same for the P3 snags), back-to-front.
 */
export function drawPlantCluster(id: PlantId, pattern: { tiles: { dx: number; dy: number }[]; w: number; h: number }, patternIdx: number, pad = 80): Raster {
  const T = 64;
  const r = new Raster(0, 0, pattern.w * T + pad * 2, pattern.h * T + pad * 2);
  let seed = (patternIdx * 73856093 + 54321) >>> 0;
  const rnd = () => { seed = (seed * 16807 + 1) % 2147483647; return seed / 2147483647; };
  type Def = { cx: number; cy: number; h: number; w: number; s: number; kind: 'bulb' | 'cap' | 'snag' };
  const plants: Def[] = [];
  for (const t of pattern.tiles) {
    const tileCx = t.dx * T + T / 2 + pad, tileCy = t.dy * T + T * 0.85 + pad;
    if (id === 'P4') {
      // one or two snags per tile, one or two smaller caps in front of them
      const snags = 1 + (rnd() > 0.5 ? 1 : 0);
      for (let i = 0; i < snags; i++) {
        const cx = Math.round(tileCx + (rnd() - 0.5) * T * 0.7), cy = Math.round(tileCy + (rnd() - 0.5) * T * 0.3 - 6);
        plants.push({ cx, cy, h: 84 + Math.floor(rnd() * 30), w: 0, s: Math.floor(rnd() * 1000), kind: 'snag' });
      }
      const caps = 1 + (rnd() > 0.4 ? 1 : 0);
      for (let i = 0; i < caps; i++) {
        const cx = Math.round(tileCx + (rnd() - 0.5) * T * 0.9), cy = Math.round(tileCy + (rnd() - 0.5) * T * 0.3 + 4);
        plants.push({ cx, cy, h: 38 + Math.floor(rnd() * 18), w: 13 + Math.floor(rnd() * 8), s: Math.floor(rnd() * 1000), kind: 'cap' });
      }
      continue;
    }
    const n = 2 + (rnd() > 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const cx = Math.round(tileCx + (rnd() - 0.5) * T * (id === 'P3' ? 0.8 : 0.7)), cy = Math.round(tileCy + (rnd() - 0.5) * T * 0.4);
      const h = id === 'P1' ? 60 + Math.floor(rnd() * 28) : id === 'P2' ? 54 + Math.floor(rnd() * 26) : 80 + Math.floor(rnd() * 30);
      const w = id === 'P1' ? 30 + Math.floor(rnd() * 14) : id === 'P2' ? 18 + Math.floor(rnd() * 12) : 0;
      plants.push({ cx, cy, h, w, s: Math.floor(rnd() * 1000), kind: id === 'P1' ? 'bulb' : id === 'P2' ? 'cap' : 'snag' });
    }
  }
  plants.sort((a, b) => a.cy - b.cy);
  const shadow = new ShadowMask(r);
  for (const q of plants) shadow.add(q.cx + 3, q.cy + 1, q.kind === 'bulb' ? q.w * 0.75 : q.kind === 'cap' ? q.w * 1.3 : q.h * 0.3);
  shadow.apply();
  for (const q of plants) {
    if (q.kind === 'bulb') drawBulb(r, q.cx, q.cy, q.h, q.w, q.s);
    else if (q.kind === 'cap') drawCap(r, q.cx, q.cy, q.h, q.w, q.s);
    else drawSnag(r, q.cx, q.cy, q.h, q.s);
  }
  return r;
}

export const PLANT_STYLES: Record<PlantId, { title: string; lean: string }> = {
  P1: { title: 'Spore Bulbs', lean: 'fleshy violet pod stacks with green spore lights, today\'s idea redrawn' },
  P2: { title: 'Blight Caps', lean: 'giant spotted toadstools, gills glowing acid green from beneath' },
  P3: { title: 'Thorn Snags', lean: 'dead twisted thorn trees with hanging egg sacs and web strands' },
  P4: { title: 'Snags & Caps', lean: 'thorn snags with toadstools at their feet' },
};
