// River ground studies at HD density (64 px per tile), drawn from the seeded
// river network in src/assets/art/riverGeometry.ts so the picked look ports
// 1:1. Wild Field grass (the Meadow pick) runs to a grass lip, then a shore
// of sand or earth with riverstones, a wet strip, and flowing water: depth
// shading, flow streaks along the current, foam at the banks, rocks with
// wakes, white-water rapids where the river narrows, wooden plank bridges.
//
//   R1  Pebble Shore  — wide brown sand strip crowded with riverstones
//   R2  Cut Bank      — narrow dark earth bank under a shadowed grass lip,
//                       stones only at the waterline
//   R3  Gravel Bar    — pale tan gravel, bars that widen and vanish, grey
//                       stones; the water a touch greener
//   R4  Deep Blue     — R1's shore under a saturated blue river like today's

import { Raster, Rgb, hex, fbm, hash2, valueNoise, line, disc, ellipse, mix, Put } from '../meadow-studies/raster';
import { PropPalette, tuft, flowers, clover } from '../meadow-studies/stamps';
import { RiverNet, Bridge, BRIDGE_HALF_W } from '../../src/assets/art/riverGeometry';

/** Paint worn dirt along the trails between clearings. Off: the trails are grass like the rooms. */
export const DIRT_TRAILS = false;

export type RiverId = 'R1' | 'R2' | 'R3' | 'R4';

const BLACK = hex('#0b0f1a');
const HD = 2; // HD px per world px

// ---- palettes -----------------------------------------------------------

const GRASS = {
  tones: [hex('#365f2d'), hex('#3e6d33'), hex('#477a3a')],
  lip: hex('#26481f'),
  blade: hex('#578f44'), bladeDark: hex('#2f5527'),
};
const PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#2a4f24'), tuftMid: hex('#4a8239'), tuftLight: hex('#7fb757'),
  leaf: hex('#2a4f24'), stem: hex('#315b2a'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#7a4f27'), woodDark: hex('#4d2f14'), woodLight: hex('#a87a46'),
  shadowAlpha: 0.35,
};
const FLOWERS: ReadonlyArray<readonly [Rgb, Rgb]> = [
  [hex('#f2f0e6'), hex('#e8c84a')], [hex('#e8c84a'), hex('#b8822a')], [hex('#c86fb0'), hex('#f2e6f0')],
];

type ShorePal = {
  title: string; lean: string;
  widthMin: number; widthMax: number;       // shore strip width range, HD px
  sand: readonly [Rgb, Rgb, Rgb]; sandLight: Rgb; sandDark: Rgb; wet: Rgb; wetEdge: Rgb;
  cut: Rgb | null;                          // a shadowed drop under the grass lip
  stoneDensity: number; stoneWaterline: boolean;
  stones: ReadonlyArray<readonly [Rgb, Rgb, Rgb]>; // light, mid, dark
};
type WaterPal = {
  shallow: Rgb; mid: Rgb; deep: Rgb; streak: Rgb; streakDark: Rgb; foam: Rgb; foamSoft: Rgb; rapids: Rgb;
  rock: readonly [Rgb, Rgb, Rgb, Rgb]; // light, mid, dark, outline
};

const STONES_MIXED: ShorePal['stones'] = [
  [hex('#cfc7b8'), hex('#9c9486'), hex('#5f5950')],
  [hex('#b7a68c'), hex('#8c7a5e'), hex('#564838')],
  [hex('#a9adb5'), hex('#767a84'), hex('#484b55')],
];
const STONES_GREY: ShorePal['stones'] = [
  [hex('#c4c6c9'), hex('#8e9196'), hex('#55585e')],
  [hex('#b9b3a6'), hex('#857f74'), hex('#4f4a42')],
  [hex('#a9adb5'), hex('#767a84'), hex('#484b55')],
];

const SHORE_R1: ShorePal = {
  title: 'Pebble Shore', lean: 'a wide brown sand strip crowded with riverstones',
  widthMin: 40, widthMax: 80,
  sand: [hex('#9c7f55'), hex('#a98a5e'), hex('#b5986b')], sandLight: hex('#c7ab7c'), sandDark: hex('#7e6342'),
  wet: hex('#6b5235'), wetEdge: hex('#56412a'), cut: null,
  stoneDensity: 0.55, stoneWaterline: false, stones: STONES_MIXED,
};
const SHORE_R2: ShorePal = {
  title: 'Cut Bank', lean: 'a narrow dark earth bank under a shadowed grass lip, stones only at the waterline',
  widthMin: 22, widthMax: 40,
  sand: [hex('#6e5134'), hex('#7a5a3a'), hex('#866544')], sandLight: hex('#9a7a55'), sandDark: hex('#553d26'),
  wet: hex('#4e3822'), wetEdge: hex('#3e2c1a'), cut: hex('#3b2a1b'),
  stoneDensity: 0.5, stoneWaterline: true, stones: STONES_MIXED,
};
const SHORE_R3: ShorePal = {
  title: 'Gravel Bar', lean: 'pale tan gravel in bars that widen and vanish, grey stones, greener water',
  widthMin: 24, widthMax: 100,
  sand: [hex('#a89a7c'), hex('#b8aa8c'), hex('#c6b89a')], sandLight: hex('#d8ccaf'), sandDark: hex('#8a7c60'),
  wet: hex('#7a6e55'), wetEdge: hex('#625743'), cut: null,
  stoneDensity: 0.5, stoneWaterline: false, stones: STONES_GREY,
};

const WATER_CLEAR: WaterPal = {
  shallow: hex('#5f9fa0'), mid: hex('#3b7fa3'), deep: hex('#2a5f8f'),
  streak: hex('#8fcfd6'), streakDark: hex('#2b5a80'), foam: hex('#eef7f5'), foamSoft: hex('#b9dde0'), rapids: hex('#7fb7c4'),
  rock: [hex('#b3b7bd'), hex('#8d9199'), hex('#5a5e68'), hex('#3a3d47')],
};
const WATER_GREEN: WaterPal = {
  ...WATER_CLEAR, shallow: hex('#6aa38f'), mid: hex('#3f8690'), deep: hex('#2c6478'), streak: hex('#9fd8cf'), rapids: hex('#8cc3b8'),
};
const WATER_BLUE: WaterPal = {
  shallow: hex('#5f9fcf'), mid: hex('#3a78bd'), deep: hex('#27559a'),
  streak: hex('#9bcbef'), streakDark: hex('#2a4f8a'), foam: hex('#f2f8ff'), foamSoft: hex('#bfd9f2'), rapids: hex('#86b8e0'),
  rock: [hex('#b3b7bd'), hex('#8d9199'), hex('#5a5e68'), hex('#3a3d47')],
};

export const RIVER_STYLES: Record<RiverId, { title: string; lean: string; shore: ShorePal; water: WaterPal }> = {
  R1: { title: 'Pebble Shore', lean: SHORE_R1.lean, shore: SHORE_R1, water: WATER_CLEAR },
  R2: { title: 'Cut Bank', lean: SHORE_R2.lean, shore: SHORE_R2, water: WATER_CLEAR },
  R3: { title: 'Gravel Bar', lean: SHORE_R3.lean, shore: SHORE_R3, water: WATER_GREEN },
  R4: { title: 'Deep Blue', lean: 'the Pebble Shore under a saturated blue river, closer to today\'s colour', shore: SHORE_R1, water: WATER_BLUE },
};

// ---- the river field on a coarse grid ------------------------------------

/** The network sampled every 4 HD px over the raster plus a margin; d is bilinear, the rest nearest. */
class Field {
  readonly step = 4; readonly pad = 16;
  readonly gw: number; readonly gh: number; readonly gx0: number; readonly gy0: number;
  readonly d: Float32Array; readonly tx: Float32Array; readonly ty: Float32Array; readonly along: Float32Array; readonly hw: Float32Array;
  readonly rapids: Uint8Array; readonly bridge: Int16Array;
  constructor(readonly net: RiverNet, x0: number, y0: number, w: number, h: number) {
    this.gx0 = Math.floor(x0 / this.step) - this.pad; this.gy0 = Math.floor(y0 / this.step) - this.pad;
    this.gw = Math.ceil(w / this.step) + 2 * this.pad + 1; this.gh = Math.ceil(h / this.step) + 2 * this.pad + 1;
    const n = this.gw * this.gh;
    this.d = new Float32Array(n); this.tx = new Float32Array(n); this.ty = new Float32Array(n); this.along = new Float32Array(n); this.hw = new Float32Array(n);
    this.rapids = new Uint8Array(n); this.bridge = new Int16Array(n).fill(-1);
    for (let gy = 0; gy < this.gh; gy++)
      for (let gx = 0; gx < this.gw; gx++) {
        const i = gy * this.gw + gx;
        const wx = (this.gx0 + gx) * this.step / HD, wy = (this.gy0 + gy) * this.step / HD;
        if (net.farFromWater(wx, wy)) { this.d[i] = -999; this.tx[i] = 1; continue; }
        const q = net.query(wx, wy);
        this.d[i] = q.d * HD; this.tx[i] = q.tx; this.ty[i] = q.ty; this.along[i] = q.along * HD; this.hw[i] = q.hw * HD; this.rapids[i] = q.rapids ? 1 : 0;
        const b = net.bridgeAt(wx, wy);
        if (b && b.d > -24) this.bridge[i] = net.bridges.indexOf(b.bridge);
      }
  }
  idx(x: number, y: number): number {
    const gx = Math.max(0, Math.min(this.gw - 1, Math.round(x / this.step) - this.gx0));
    const gy = Math.max(0, Math.min(this.gh - 1, Math.round(y / this.step) - this.gy0));
    return gy * this.gw + gx;
  }
  dist(x: number, y: number): number {
    const fx = x / this.step - this.gx0, fy = y / this.step - this.gy0;
    const ix = Math.max(0, Math.min(this.gw - 2, Math.floor(fx))), iy = Math.max(0, Math.min(this.gh - 2, Math.floor(fy)));
    const tx = fx - ix, ty = fy - iy, i = iy * this.gw + ix;
    const a = this.d[i], b = this.d[i + 1], c = this.d[i + this.gw], e = this.d[i + this.gw + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
  }
}

function propGrid(x0: number, y0: number, w: number, h: number, cell: number, seed: number, fn: (x: number, y: number, r: number, i: number) => void) {
  const cx0 = Math.floor((x0 - 48) / cell), cy0 = Math.floor((y0 - 48) / cell);
  const cx1 = Math.ceil((x0 + w + 48) / cell), cy1 = Math.ceil((y0 + h + 48) / cell);
  const pad = Math.min(6, cell / 4);
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      const px = Math.floor(cx * cell + pad + hash2(cx, cy, seed + 1) * (cell - 2 * pad));
      const py = Math.floor(cy * cell + pad + hash2(cx, cy, seed + 2) * (cell - 2 * pad));
      fn(px, py, hash2(cx, cy, seed), Math.abs(cx * 7919 + cy));
    }
}
const tuftDrift = (x: number, y: number) => fbm(x, y, 260, 73, 1);
const flowerDrift = (x: number, y: number) => fbm(x, y, 340, 71, 1);

/** Shore strip width at a point, HD px: slow noise so bars swell and narrow along the bank. */
function shoreWidth(p: ShorePal, x: number, y: number): number {
  const t = fbm(x, y, 150, 88, 1);
  return p.widthMin + (p.widthMax - p.widthMin) * Math.max(0, Math.min(1, (t - 0.3) / 0.4));
}

// ---- stamps -----------------------------------------------------------------

/** A riverstone: a small rounded pebble lit from the top-left with a faint ground shadow. */
function stone(put: Put, x: number, y: number, r: number, c: readonly [Rgb, Rgb, Rgb], seed: number): void {
  const rx = r * (0.9 + hash2(x, y, seed) * 0.5), ry = r * (0.65 + hash2(y, x, seed) * 0.3);
  ellipse(put, x + 1, y + 1, rx, ry, BLACK, 0.25);
  ellipse(put, x, y, rx, ry, c[2]);
  ellipse(put, x - rx * 0.15, y - ry * 0.2, rx * 0.8, ry * 0.75, c[1]);
  ellipse(put, x - rx * 0.35, y - ry * 0.4, rx * 0.4, ry * 0.35, c[0]);
}

/** A rock standing in the current: wet grey boulder, foam piling on its upstream side, a wake behind. */
function riverRock(put: Put, x: number, y: number, r: number, tx: number, ty: number, w: WaterPal, seed: number): void {
  const rx = r * (0.9 + hash2(x, y, seed) * 0.4), ry = r * (0.7 + hash2(y, x, seed) * 0.25);
  // wake: a filled V of foam behind the rock, fading downstream
  const nx = -ty, ny = tx;
  const len = r * 2.2 + hash2(x, seed, 3) * r * 1.5;
  for (let s = 0; s < len; s += 1) {
    const a = 0.85 * (1 - s / len);
    const spread = ry * 0.9 + s * 0.25;
    const fx = x + tx * (rx * 0.5 + s), fy = y + ty * (rx * 0.5 + s);
    for (let q = -spread; q <= spread; q += 1) {
      const edge = Math.abs(Math.abs(q) - spread) < 1.5;
      const inner = hash2(Math.round(fx + nx * q), Math.round(fy + ny * q), 8) < 0.3 - s / len * 0.25;
      if (edge) put(Math.round(fx + nx * q), Math.round(fy + ny * q), w.foam, a);
      else if (inner) put(Math.round(fx + nx * q), Math.round(fy + ny * q), w.foamSoft, a * 0.7);
    }
  }
  // upstream foam cap
  for (let i = -1; i <= 1; i++) {
    const cx = x - tx * (rx + 1) + nx * i * 2, cy = y - ty * (rx + 1) + ny * i * 2;
    put(Math.round(cx), Math.round(cy), w.foam, 0.9);
    put(Math.round(cx - tx), Math.round(cy - ty), w.foamSoft, 0.6);
  }
  ellipse(put, x + 1, y + 2, rx + 1, ry + 1, BLACK, 0.25);
  ellipse(put, x, y, rx + 1, ry + 1, w.rock[3]);
  ellipse(put, x, y, rx, ry, w.rock[1]);
  ellipse(put, x + rx * 0.2, y + ry * 0.3, rx * 0.8, ry * 0.65, w.rock[2]);
  ellipse(put, x - rx * 0.25, y - ry * 0.3, rx * 0.5, ry * 0.4, w.rock[0]);
  put(x + Math.round(rx * 0.3), y - 1, w.rock[2]);
}

/** Sites of rocks standing in the water, shared by the base pass and the animated wakes. */
export function rockSites(field: Field, x0: number, y0: number, w: number, h: number): { x: number; y: number; r: number; tx: number; ty: number; i: number }[] {
  const out: { x: number; y: number; r: number; tx: number; ty: number; i: number }[] = [];
  propGrid(x0, y0, w, h, 44, 301, (x, y, rr, i) => {
    const d = field.dist(x, y);
    if (d < 16) return;
    const k = field.idx(x, y);
    if (field.bridge[k] >= 0) return;
    const chance = field.rapids[k] ? 0.2 : 0.055;
    if (rr > chance) return;
    out.push({ x, y, r: 7 + hash2(x, y, 7) * 6, tx: field.tx[k], ty: field.ty[k], i });
  });
  return out;
}

/** A plank bridge across the river, baked into the ground: deck, stringers, rails, a shadow on the water. */
function drawBridge(r: Raster, put: Put, b: Bridge, x0: number, y0: number, w: number, h: number): void {
  const bx = b.x * HD, by = b.y * HD, halfLen = b.halfLen * HD, halfW = BRIDGE_HALF_W * HD;
  const nx = b.nx, ny = b.ny, px = -ny, py = nx; // n: along the deck (across the river), p: across the deck
  const reach = halfLen + halfW + 16;
  const xa = Math.max(x0, Math.floor(bx - reach)), xb = Math.min(x0 + w, Math.ceil(bx + reach));
  const ya = Math.max(y0, Math.floor(by - reach)), yb = Math.min(y0 + h, Math.ceil(by + reach + 12));
  const local = (x: number, y: number) => { const dx = x - bx, dy = y - by; return [dx * nx + dy * ny, dx * px + dy * py] as const; };
  // shadow: the deck's outline dropped 10 px down the screen
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const [u, v] = local(x, y - 10);
      if (Math.abs(u) <= halfLen && Math.abs(v) <= halfW) r.mul(x, y, 0.72);
    }
  const WOOD: Rgb[] = [hex('#8a5a2e'), hex('#9a6a3a'), hex('#7a4e26')];
  const SEAM = hex('#3e2612'), LIGHT = hex('#b88550'), BEAM = hex('#5a3a1c'), BEAM_LIGHT = hex('#7a5230');
  const PLANK = 7;
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const [u, v] = local(x, y);
      if (Math.abs(u) > halfLen || Math.abs(v) > halfW) continue;
      const au = Math.abs(v) > halfW - 5;       // stringer beams along both edges
      if (au) { put(x, y, Math.abs(v) > halfW - 2 ? SEAM : v < 0 ? BEAM_LIGHT : BEAM); continue; }
      const k = u + halfLen, p = Math.floor(k / PLANK);
      if (k - p * PLANK < 1) { put(x, y, SEAM); continue; }
      const tone = WOOD[Math.floor(hash2(p, b.river, 5) * 3)];
      put(x, y, tone);
      if (k - p * PLANK < 2) put(x, y, LIGHT, 0.5);
      // a nail head near each end of every other plank
      const nv = Math.abs(Math.abs(v) - (halfW - 11));
      if (p % 2 === 0 && nv <= 1 && k - p * PLANK >= 3 && k - p * PLANK < 5) put(x, y, SEAM, 0.85);
    }
  // end sills where the deck meets the bank
  for (const side of [-1, 1])
    for (let v = -halfW; v <= halfW; v++) {
      const u = side * halfLen;
      put(Math.round(bx + nx * u + px * v), Math.round(by + ny * u + py * v), SEAM, 0.8);
    }
  // rails: posts every 28 px along the deck on both edges, a bar between post tops
  const POST = 12;
  for (const side of [-1, 1]) {
    const v = side * (halfW - 2);
    let prev: [number, number] | null = null;
    for (let u = -halfLen + 6; u <= halfLen - 4; u += 28) {
      const x = Math.round(bx + nx * u + px * v), y = Math.round(by + ny * u + py * v);
      if (prev) { line(put, prev[0], prev[1] - POST + 2, x, y - POST + 2, LIGHT); line(put, prev[0], prev[1] - POST + 3, x, y - POST + 3, BEAM); }
      prev = [x, y];
    }
    for (let u = -halfLen + 6; u <= halfLen - 4; u += 28) {
      const x = Math.round(bx + nx * u + px * v), y = Math.round(by + ny * u + py * v);
      for (let k = 0; k < POST; k++) { put(x, y - k, BEAM); put(x + 1, y - k, SEAM); put(x - 1, y - k, BEAM_LIGHT); }
      put(x, y - POST, LIGHT); put(x - 1, y - POST, LIGHT);
    }
  }
}

/** A stone walkway: fitted flagstones between kerbs of larger rounded stones, foam piling against its upstream face. */
function drawStoneBridge(r: Raster, put: Put, b: Bridge, x0: number, y0: number, w: number, h: number, field: Field): void {
  const bx = b.x * HD, by = b.y * HD, halfLen = b.halfLen * HD, halfW = BRIDGE_HALF_W * HD;
  const nx = b.nx, ny = b.ny, px = -ny, py = nx;
  const reach = halfLen + halfW + 16;
  const xa = Math.max(x0, Math.floor(bx - reach)), xb = Math.min(x0 + w, Math.ceil(bx + reach));
  const ya = Math.max(y0, Math.floor(by - reach)), yb = Math.min(y0 + h, Math.ceil(by + reach + 12));
  const local = (x: number, y: number) => { const dx = x - bx, dy = y - by; return [dx * nx + dy * ny, dx * px + dy * py] as const; };
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const [u, v] = local(x, y - 8);
      if (Math.abs(u) <= halfLen + 2 && Math.abs(v) <= halfW + 2) r.mul(x, y, 0.72);
    }
  const STONE: Rgb[] = [hex('#8e9199'), hex('#9a9ca2'), hex('#858a94'), hex('#9b968c'), hex('#8a8f9c')];
  const MORTAR = hex('#4a4d55'), LIGHT = hex('#bcbfc5'), DARK = hex('#62656d'), KERB = hex('#777a84'), KERB_LIGHT = hex('#b4b7be'), OUT = hex('#34373f');
  const CU = 22, CV = 13, KERB_W = 10, KERB_LEN = 16;
  const W = RIVER_STYLES.R2.water;
  // flagstones of uneven length: each stone's right seam shifts by its own hash
  const seam = (c: number, row: number) => (c + 1) * CU + (hash2(c, row, b.river + 41) - 0.5) * 9;
  for (let y = ya; y < yb; y++)
    for (let x = xa; x < xb; x++) {
      const [u, v] = local(x, y);
      if (Math.abs(u) > halfLen + 2 || Math.abs(v) > halfW + 2) continue;
      if (Math.abs(v) > halfW - KERB_W) {
        // kerb: a run of larger rounded blocks along each edge, lit on their inner top
        const k = Math.floor((u + halfLen) / KERB_LEN), fu = (u + halfLen) - k * KERB_LEN;
        const inner = halfW - KERB_W, fv = Math.abs(v) - inner;
        const rounded = fu < 1.5 || fu > KERB_LEN - 1.2 || fv < 0.8 || fv > KERB_W - 0.8 || Math.abs(v) > halfW + 1;
        if (rounded) { put(x, y, OUT); continue; }
        put(x, y, KERB);
        if (fv < 3) put(x, y, KERB_LIGHT, v < 0 ? 0.85 : 0.35);
        if (fv > KERB_W - 3) put(x, y, OUT, v > 0 ? 0.5 : 0.2);
        if (fu < 3) put(x, y, KERB_LIGHT, 0.3);
        if (hash2(x, y, 79) > 0.95) put(x, y, OUT, 0.3);
        continue;
      }
      const row = Math.floor((v + halfW - KERB_W) / CV), fv = (v + halfW - KERB_W) - row * CV;
      const up = u + halfLen + hash2(row, b.river, 42) * CU;
      let c = Math.floor(up / CU);
      if (up < seam(c - 1, row)) c--; else if (up >= seam(c, row)) c++;
      const left = seam(c - 1, row), fu = up - left, wdt = seam(c, row) - left;
      if (fu < 1.6 || fv < 1.6) { put(x, y, MORTAR); continue; }
      const t = hash2(c, row, b.river + 40);
      put(x, y, STONE[Math.floor(t * STONE.length)]);
      if (fv < 3) put(x, y, LIGHT, 0.5);
      else if (fv > CV - 2 || fu > wdt - 2) put(x, y, DARK, 0.45);
      if (hash2(x, y, 77) > 0.94) put(x, y, hash2(y, x, 78) > 0.5 ? LIGHT : DARK, 0.3);
    }
  // foam where the current piles against the upstream face
  const k0 = field.idx(Math.round(bx), Math.round(by));
  const tx = field.tx[k0], ty = field.ty[k0];
  const upstream = (tx * px + ty * py) > 0 ? -1 : 1; // which deck edge faces the current
  for (let u = -halfLen; u <= halfLen; u += 1) {
    const v = upstream * (halfW + 3);
    const x = bx + nx * u + px * v, y = by + ny * u + py * v;
    if (field.dist(x, y) < 4) continue;
    const n = fbm(u + bx, 0, 10, 93, 2);
    if (n > 0.45) for (let k = 0; k < 3; k++) put(Math.round(x + px * upstream * k), Math.round(y + py * upstream * k), k === 0 ? W.foam : W.foamSoft, 0.9 - k * 0.25);
    if (n > 0.58) for (let k = 3; k < 6; k++) put(Math.round(x + px * upstream * k), Math.round(y + py * upstream * k), W.foam, 0.7 - (k - 3) * 0.2);
  }
}

// ---- base render --------------------------------------------------------------

export type BridgeStyle = 'wood' | 'stone';

export function renderRiver(id: RiverId, net: RiverNet, x0: number, y0: number, w: number, h: number, bridgeStyle: BridgeStyle = 'wood'): Raster {
  const { shore: S, water: W } = RIVER_STYLES[id];
  const field = new Field(net, x0, y0, w, h);
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);

  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      let d = field.dist(x, y);
      if (d > -140) d += (fbm(x, y, 14, 61, 2) - 0.5) * 7;   // ragged edges where it matters
      const sw = d > -140 ? shoreWidth(S, x, y) : 0;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -sw - 4) {
        put(x, y, tone < 0.45 ? GRASS.tones[0] : tone < 0.6 ? GRASS.tones[1] : GRASS.tones[2]);
      } else if (d < -sw) {
        put(x, y, GRASS.lip);
      } else if (d < -10) {
        const t = fbm(x, y, 110, 33, 1);
        put(x, y, t < 0.42 ? S.sand[0] : t < 0.6 ? S.sand[1] : S.sand[2]);
        if (S.cut && d < -sw + 6) put(x, y, S.cut, d < -sw + 3 ? 0.8 : 0.45);
        const c = valueNoise(x, y, 10, 43);
        if (c > 0.9) put(x, y, S.sandLight);
        else if (c < 0.07) put(x, y, S.sandDark);
      } else if (d < -1) {
        put(x, y, d < -5 ? S.wet : S.wetEdge);
      } else {
        const k = field.idx(x, y);
        const hw = Math.max(field.hw[k], 24), along = field.along[k];
        const across = hw - d;                              // 0 on the centreline
        const depth = Math.max(0, Math.min(1, d / (hw * 0.85)));
        let c: Rgb = depth < 0.5 ? mix(W.shallow, W.mid, depth * 2) : mix(W.mid, W.deep, (depth - 0.5) * 2);
        const rapids = field.rapids[k] === 1;
        if (rapids) c = mix(c, W.rapids, 0.45);
        put(x, y, c);
        // flow streaks: noise stretched along the current in river-local coordinates
        if (d > 5) {
          const v = fbm(along * 0.8, across * 4.5, 36, 90, 2);
          if (v > 0.63) put(x, y, W.streak, rapids ? 0.45 : 0.28);
          else if (v < 0.36) put(x, y, W.streakDark, 0.18);
          if (rapids) {
            const f = fbm(along * 1.4 + across * 0.8, across * 2.2, 9, 94, 2);
            if (f > 0.72) put(x, y, W.foam, 0.7);
            else if (f > 0.66) put(x, y, W.foamSoft, 0.4);
          }
        }
        // bank foam and the pale wet line along the water's edge
        if (d < 2.5) put(x, y, W.foamSoft, 0.45);
        if (d < 5 && fbm(along, 0, 22, 91, 2) > 0.58) put(x, y, W.foam, d < 3 ? 0.8 : 0.4);
      }
      r.mul(x, y, 0.94 + fbm(x, y, 650, 52, 1) * 0.12);
    }

  // worn dirt trails along the corridors between clearings (off: trails are plain grass)
  const TRAIL = { dirt: [hex('#6a5038'), hex('#775b41'), hex('#846749')], light: hex('#95785a'), dark: hex('#574029'), edge: hex('#26481f') };
  for (const c of DIRT_TRAILS ? net.corridors : []) {
    const xs = c.pts.map(p => p.x * HD), ys = c.pts.map(p => p.y * HD);
    const ax = Math.min(...xs) - 80, bx = Math.max(...xs) + 80, ay = Math.min(...ys) - 80, by = Math.max(...ys) + 80;
    if (bx < x0 || ax > x0 + w || by < y0 || ay > y0 + h) continue;
    for (let y = Math.max(y0, ay); y < Math.min(y0 + h, by); y++)
      for (let x = Math.max(x0, ax); x < Math.min(x0 + w, bx); x++) {
        const cd = RiverNet.corridorDistance(c, x / HD, y / HD) * HD;
        if (cd < -20) continue;
        // narrower than the carved corridor, ragged, fading out once well inside a clearing
        const taper = Math.max(0, Math.min(1, (net.clearingAt(x / HD, y / HD) * HD - 64) / 200));
        const d = cd - (c.halfW * HD - 40) - taper * 140 + (fbm(x, y, 16, 63, 2) - 0.5) * 12;
        if (d < -3 || field.dist(x, y) > -20) continue;
        if (d < 0) { put(x, y, TRAIL.edge, 0.7); continue; }
        const t = fbm(x, y, 110, 33, 1);
        put(x, y, t < 0.42 ? TRAIL.dirt[0] : t < 0.6 ? TRAIL.dirt[1] : TRAIL.dirt[2]);
        const cc = valueNoise(x, y, 10, 43);
        if (cc > 0.9) put(x, y, TRAIL.light); else if (cc < 0.07) put(x, y, TRAIL.dark);
      }
  }
  // blades on open grass
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    const d = field.dist(x, y);
    if (d > -shoreWidth(S, x, y) - 10 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    line(put, x, y, x + 2, y - 4, rr < 0.25 ? GRASS.blade : GRASS.bladeDark, 0.5);
  });
  // riverstones on the shore
  propGrid(x0, y0, w, h, 13, 302, (x, y, rr, i) => {
    const d = field.dist(x, y), sw = shoreWidth(S, x, y);
    if (d > -8 || d < -sw + 4) return;
    const nearWater = d > -sw * 0.45;
    const density = S.stoneWaterline ? (nearWater ? S.stoneDensity : 0.08) : S.stoneDensity * (nearWater ? 1 : 0.7);
    if (rr > density) return;
    const pal = S.stones[Math.floor(hash2(x, y, 4) * S.stones.length)];
    stone(put, x, y, 2 + hash2(i, x, 5) * 3.5, pal, i);
  });
  // rocks in the current
  for (const s of rockSites(field, x0, y0, w, h)) riverRock(put, s.x, s.y, s.r, s.tx, s.ty, W, s.i);
  // tufts crowd the lip, open grass gets the Meadow's props
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = field.dist(x, y), sw = shoreWidth(S, x, y);
    if (d > -sw - 2) return;
    if (d > -sw - 24) { if (rr < 0.7) tuft(put, x, y - 1, 11 + rr * 7, PROPS, i); return; }
    const flowery = flowerDrift(x, y) > 0.6, tufty = tuftDrift(x, y) > 0.42;
    if (rr < 0.4) { if (tufty) tuft(put, x, y, 9 + rr * 14, PROPS, i); }
    else if (rr < 0.46) clover(put, x, y, PROPS, i);
    else if (rr < 0.62) { if (flowery) { const f = FLOWERS[(i + 2) % FLOWERS.length]; flowers(put, x, y, f[0], f[1], PROPS, i, true); } }
  });
  // bridges
  for (const b of net.bridges) {
    const bx = b.x * HD, by = b.y * HD, reach = (b.halfLen + BRIDGE_HALF_W) * HD + 24;
    if (bx + reach < x0 || bx - reach > x0 + w || by + reach < y0 || by - reach > y0 + h) continue;
    if (bridgeStyle === 'stone') drawStoneBridge(r, put, b, x0, y0, w, h, field); else drawBridge(r, put, b, x0, y0, w, h);
  }
  return r;
}

// ---- animated flow effects ------------------------------------------------------

/** RGBA raster with straight alpha over transparent, for overlays. */
export class AlphaRaster {
  readonly data: Uint8ClampedArray;
  constructor(readonly x0: number, readonly y0: number, readonly w: number, readonly h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  put(wx: number, wy: number, c: Rgb, alpha = 1): void {
    const x = (wx - this.x0) | 0, y = (wy - this.y0) | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.data;
    const a0 = d[i + 3] / 255, a = Math.min(1, alpha), out = a + a0 * (1 - a);
    if (out <= 0) return;
    d[i] = (c[0] * a + d[i] * a0 * (1 - a)) / out;
    d[i + 1] = (c[1] * a + d[i + 1] * a0 * (1 - a)) / out;
    d[i + 2] = (c[2] * a + d[i + 2] * a0 * (1 - a)) / out;
    d[i + 3] = out * 255;
  }
}

/**
 * One frame of the flow effects at time t (seconds): streaks sliding
 * downstream, foam pulsing in the rapids, flecks spinning off rock wakes,
 * ripples lapping the banks. Everything is a function of t, so it loops.
 */
export function renderRiverFx(id: RiverId, net: RiverNet, x0: number, y0: number, w: number, h: number, t: number): AlphaRaster {
  const W = RIVER_STYLES[id].water;
  const field = new Field(net, x0, y0, w, h);
  const r = new AlphaRaster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const inside = (x: number, y: number) => x >= x0 - 20 && x < x0 + w + 20 && y >= y0 - 20 && y < y0 + h + 20;

  for (const river of net.rivers) {
    const total = river[river.length - 1].along * HD;
    const at = (along: number) => river[Math.max(0, Math.min(river.length - 1, Math.round(along / (8 * HD))))];
    // streaks: particles spaced along the river, each on its own lane, sliding at 70 HD px/s
    const count = Math.floor(total / 22);
    for (let j = 0; j < count; j++) {
      const h1 = hash2(j, river[0].river, 11), h2 = hash2(j, river[0].river, 12), h3 = hash2(j, river[0].river, 13);
      const life = 2.4 + h3 * 1.2, phase = ((t / life) + h2) % 1;
      const along = (j * 22 + h1 * 22 + t * 80) % total;
      const s = at(along);
      const hw = s.hw * HD, lane = (h2 - 0.5) * 1.5 * hw;
      const x = s.x * HD - s.ty * lane, y = s.y * HD + s.tx * lane;
      if (!inside(x, y)) continue;
      const fade = Math.sin(Math.PI * phase) * (s.rapids ? 0.95 : 0.7);
      const len = 7 + h3 * 7;
      const col = s.rapids && h1 > 0.5 ? W.foam : W.streak;
      line(put, Math.round(x - s.tx * len), Math.round(y - s.ty * len), Math.round(x + s.tx * len), Math.round(y + s.ty * len), col, fade);
      line(put, Math.round(x - s.tx * len * 0.7) + 1, Math.round(y - s.ty * len * 0.7) + 1, Math.round(x + s.tx * len * 0.7) + 1, Math.round(y + s.ty * len * 0.7) + 1, col, fade * 0.6);
    }
    // rapids foam: puffs that swell and fade on a quick cycle, drifting a little downstream
    for (let i = 0; i < river.length; i += 2) {
      const s = river[i];
      if (!s.rapids) continue;
      const x = s.x * HD, y = s.y * HD;
      if (!inside(x, y)) continue;
      for (let k = 0; k < 3; k++) {
        const h1 = hash2(i, k, 21), h2 = hash2(i, k, 22);
        const lane = (h1 - 0.5) * 1.6 * s.hw * HD;
        const drift = ((t * 50 + h2 * 24) % 24);
        const px = x - s.ty * lane + s.tx * drift, py = y + s.tx * lane + s.ty * drift;
        const pulse = 0.5 + 0.5 * Math.sin(t * 6 + h2 * 6.28);
        disc(put, px, py, 2 + pulse * 3, W.foam, 0.35 + pulse * 0.5);
        disc(put, px + s.tx * 4, py + s.ty * 4, 1.5 + pulse * 1.5, W.foamSoft, 0.4 * pulse);
      }
    }
    // bank ripples: short pale arcs lapping onto the wet edge
    for (let i = 0; i < river.length; i += 6) {
      const s = river[i];
      for (const side of [-1, 1]) {
        const h1 = hash2(i, side, 31);
        const phase = (t / 1.9 + h1) % 1;
        const off = 1 + phase * 5;
        const lane = side * (s.hw * HD - off);
        const x = s.x * HD - s.ty * lane, y = s.y * HD + s.tx * lane;
        if (!inside(x, y)) continue;
        const a = Math.sin(Math.PI * phase) * 0.75;
        line(put, Math.round(x - s.tx * 8), Math.round(y - s.ty * 8), Math.round(x + s.tx * 8), Math.round(y + s.ty * 8), W.foam, a);
        line(put, Math.round(x - s.tx * 5) + 1, Math.round(y - s.ty * 5) + 1, Math.round(x + s.tx * 5) + 1, Math.round(y + s.ty * 5) + 1, W.foamSoft, a * 0.6);
      }
    }
  }
  // rock wakes: flecks peeling off downstream
  for (const s of rockSites(field, x0, y0, w, h)) {
    const nx = -s.ty, ny = s.tx;
    for (let k = 0; k < 4; k++) {
      const h1 = hash2(s.i, k, 41);
      const off = (t * 60 + h1 * 34) % 34;
      const side = k % 2 === 0 ? 1 : -1;
      const spread = s.r * 0.7 + off * 0.3;
      const x = s.x + s.tx * (s.r + 2 + off) + nx * spread * side, y = s.y + s.ty * (s.r + 2 + off) + ny * spread * side;
      disc(put, x, y, 1.8, W.foam, 0.9 * (1 - off / 34));
    }
  }
  return r;
}
