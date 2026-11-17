// Infected floor studies in the Wild Field vocabulary (large tone regions,
// distance-field borders with shadow and ambient-occlusion bands, props
// grouped by drift fields), at the HD density (64 px per tile) the Meadow
// and Forest shipped with. Three treatments of the open patches:
//
//   I1  Blighted Moor  — dead olive-and-mauve turf, patches of tainted violet
//                        soil veined with black-green cracks, ooze pools
//                        glowing in the deepest ground, puffballs, purple
//                        mushrooms with spore lights
//   I2  Fungal Carpet  — deep purple moss, patches of rotted earth rimmed
//                        with pale mycelium threads, clusters of luminous
//                        green mushrooms, drifting spore motes
//   I3  Toxic Marsh    — sick olive marsh grass, the patches are acid pools
//                        with a dark wet-mud rim, depth shading, ripples and
//                        bubbles, dead reeds on the banks, purple cracks
//                        creeping out from the water
//   I4  Fungal Marsh   — I3's pools and banks on I2's purple moss instead of
//                        the olive grass (Zak's pick, 2026-11-16)

import { Raster, Rgb, hex, fbm, hash2, distanceField, valueNoise, line, disc, mix, Put } from '../meadow-studies/raster';
import { PropPalette, tuft, mushrooms } from '../meadow-studies/stamps';

export type InfectedId = 'I1' | 'I2' | 'I3' | 'I4';

const BLACK = hex('#0b0f1a');

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
const fungusDrift = (x: number, y: number) => fbm(x, y, 300, 74, 1);
const sporeDrift = (x: number, y: number) => fbm(x, y, 260, 75, 1);

// ---- infected-only stamps ----------------------------------------------

/** A ring of pixels: ripples and bubbles. */
function ring(put: Put, cx: number, cy: number, rx: number, ry: number, c: Rgb, alpha = 1): void {
  const n = Math.max(8, Math.round((rx + ry) * 2.5));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    put(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), c, alpha);
  }
}

type PuffPal = { body: Rgb; light: Rgb; dark: Rgb; spore: Rgb };
/** A puffball: a pale sphere with a dark underside and a few spores above it. */
function puffball(put: Put, x: number, y: number, r: number, pal: PuffPal, seed: number): void {
  for (let dx = -r; dx <= r; dx++) put(x + dx, y + r, BLACK, 0.3);
  disc(put, x, y, r, pal.dark);
  disc(put, x - 1, y - 1, r - 1, pal.body);
  put(Math.round(x - r * 0.4), Math.round(y - r * 0.5), pal.light);
  put(Math.round(x - r * 0.4) + 1, Math.round(y - r * 0.5), pal.light, 0.5);
  const n = 2 + Math.floor(hash2(x, y, seed) * 3);
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + (hash2(i, x, seed) - 0.5) * r * 3), sy = Math.round(y - r - 1 - hash2(i, y, seed) * r * 2);
    put(sx, sy, pal.spore, 0.9);
    put(sx + 1, sy, pal.spore, 0.3); put(sx, sy + 1, pal.spore, 0.3);
  }
}

/** Mushrooms with a glowing light on each cap. */
function glowMushrooms(put: Put, x: number, y: number, cap: Rgb, capLight: Rgb, stalk: Rgb, glow: Rgb, pal: PropPalette, seed: number): void {
  mushrooms(put, x, y, cap, capLight, stalk, pal, seed);
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2) - 1;
    put(px + 1, py, glow);
    put(px + 2, py, glow, 0.35); put(px, py, glow, 0.35); put(px + 1, py - 1, glow, 0.35); put(px + 1, py + 1, glow, 0.35);
  }
}

/** Cracks: 2–4 short random walks out from a point. */
function veins(put: Put, x: number, y: number, c: Rgb, seed: number, n = 3, len = 4, alpha = 1): void {
  for (let v = 0; v < n; v++) {
    let px = x, py = y, a = hash2(v, x, seed) * Math.PI * 2;
    for (let s = 0; s < len; s++) {
      a += (hash2(s, v + y, seed) - 0.5) * 1.2;
      const nx = px + Math.cos(a) * 3, ny = py + Math.sin(a) * 3;
      line(put, px, py, nx, ny, c, alpha);
      px = nx; py = ny;
    }
  }
}

/** Dead reeds: 2–3 tall thin stalks with a dark seed head. */
function reeds(put: Put, x: number, y: number, h: number, stalk: Rgb, stalkDark: Rgb, head: Rgb, seed: number): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const bx = x + (i - (n - 1) / 2) * 4, lean = (hash2(i, x, seed) - 0.5) * 8;
    const hh = h * (0.7 + hash2(i, y, seed) * 0.5);
    line(put, bx, y, bx + lean, y - hh, i === 1 ? stalk : stalkDark);
    line(put, bx + lean, y - hh, bx + lean, y - hh + 4, head);
    line(put, bx + lean + 1, y - hh + 1, bx + lean + 1, y - hh + 4, head, 0.6);
  }
  for (let dx = -2; dx <= 2; dx++) put(x + dx, y + 1, BLACK, 0.3);
}

// ---- palettes ------------------------------------------------------------

const I1 = {
  grass: [hex('#353a2c'), hex('#3e4334'), hex('#443f4a')],
  grassShadow: hex('#242a1f'),
  blade: hex('#5c6a3c'), bladeDark: hex('#283022'),
  ao: [hex('#18121f'), hex('#261e2c')],
  soil: [hex('#3b2e40'), hex('#45374b'), hex('#4f4156')],
  soilLight: hex('#645470'),
  vein: hex('#1c2e18'),
  pool: hex('#2f7a33'), poolLight: hex('#8ee07c'), poolRim: hex('#163518'),
  crack: hex('#2d4a22'),
};
const I1_PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#2a2e22'), tuftMid: hex('#4e5438'), tuftLight: hex('#767a54'),
  leaf: hex('#2a2e22'), stem: hex('#3a3e2c'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#4a3a50'), woodDark: hex('#2a1f30'), woodLight: hex('#6a5a74'),
  shadowAlpha: 0.35,
};
const I1_MUSH = { cap: hex('#6b3c8f'), capLight: hex('#b07ad6'), stalk: hex('#cbb9d8'), glow: hex('#7cf07a') };
const I1_PUFF: PuffPal = { body: hex('#8a8296'), light: hex('#b9b2c4'), dark: hex('#4d4658'), spore: hex('#a8d88a') };

const I2 = {
  moss: [hex('#2b2340'), hex('#33294b'), hex('#3b3057')],
  mossShadow: hex('#1c1630'),
  blade: hex('#5a4a86'), bladeDark: hex('#211a35'),
  ao: [hex('#0f0a14'), hex('#1a1220')],
  earth: [hex('#2b1e1e'), hex('#352624'), hex('#3f2e2b')],
  earthLight: hex('#4f3c38'),
  mycelium: [hex('#b2a8c4'), hex('#8c829e'), hex('#7a7090')],
  mote: hex('#cfffc0'),
};
const I2_PROPS: PropPalette = {
  ...I1_PROPS,
  tuftDark: hex('#241c38'), tuftMid: hex('#4a3a70'), tuftLight: hex('#7a62a8'),
  leaf: hex('#241c38'), stem: hex('#30264a'),
  wood: hex('#3a2a34'), woodDark: hex('#1e1420'), woodLight: hex('#5a4a54'),
};
const I2_MUSH = { cap: hex('#58c468'), capLight: hex('#b6ffb0'), stalk: hex('#d6cce0'), glow: hex('#a8ff9a') };
const I2_MUSH_PURPLE = { cap: hex('#7a46a8'), capLight: hex('#c494e8'), stalk: hex('#d6cce0'), glow: hex('#a8ff9a') };
const I2_PUFF: PuffPal = { body: hex('#9a8aa8'), light: hex('#cbbfd6'), dark: hex('#584a68'), spore: hex('#cfffc0') };

const I3 = {
  grass: [hex('#3b4a2c'), hex('#445535'), hex('#4a5244')],
  grassShadow: hex('#28341e'),
  blade: hex('#6e8a46'), bladeDark: hex('#263220'),
  mud: [hex('#1c2214'), hex('#2a301c')],
  poolShallow: hex('#4e9a42'), poolDeep: hex('#245f2b'),
  poolLight: hex('#a0e884'), scum: hex('#7bbf55'), bubble: hex('#c8f7b0'),
  reed: hex('#8a8a58'), reedDark: hex('#4c4e2e'), reedHead: hex('#5e4a3a'),
  crack: hex('#5a3e7c'),
};
const I3_PROPS: PropPalette = {
  ...I1_PROPS,
  tuftDark: hex('#2e3822'), tuftMid: hex('#5a6240'), tuftLight: hex('#8a8c60'),
  leaf: hex('#2e3822'), stem: hex('#3e4a2c'),
};
const I3_MUSH = { cap: hex('#8a5a3a'), capLight: hex('#d0a070'), stalk: hex('#d8d0b8'), glow: hex('#a0ff80') };
const I3_PUFF: PuffPal = { body: hex('#9a9478'), light: hex('#c8c4a4'), dark: hex('#5a5640'), spore: hex('#b8f090') };

/** The marsh's ground pieces that change between I3 (olive grass) and I4 (purple moss). */
type MarshPal = { grass: readonly Rgb[]; grassShadow: Rgb; blade: Rgb; bladeDark: Rgb; mud: readonly Rgb[]; crack: Rgb; crackAlpha: number; props: PropPalette; mushBank: typeof I3_MUSH; mushMoss: typeof I3_MUSH; puff: PuffPal };
const I3_MARSH: MarshPal = { grass: I3.grass, grassShadow: I3.grassShadow, blade: I3.blade, bladeDark: I3.bladeDark, mud: I3.mud, crack: I3.crack, crackAlpha: 0.9, props: I3_PROPS, mushBank: I3_MUSH, mushMoss: I3_MUSH, puff: I3_PUFF };
const I4_MARSH: MarshPal = {
  grass: I2.moss, grassShadow: I2.mossShadow, blade: I2.blade, bladeDark: I2.bladeDark,
  mud: [hex('#120e1a'), hex('#1e1828')],
  crack: hex('#4e9a42'), crackAlpha: 0.7,
  props: I2_PROPS, mushBank: I2_MUSH, mushMoss: I2_MUSH_PURPLE, puff: I2_PUFF,
};

// ---- renderers -------------------------------------------------------------

function renderI1(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.60, 2);
  const pool = (x: number, y: number) => fbm(x, y, 150, 31, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) put(x, y, tone < 0.45 ? I1.grass[0] : tone < 0.6 ? I1.grass[1] : I1.grass[2]);
      else if (d < 0) put(x, y, I1.grassShadow);
      else if (d < 3) put(x, y, I1.ao[0]);
      else if (d < 6) put(x, y, I1.ao[1]);
      else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? I1.soil[0] : t < 0.6 ? I1.soil[1] : I1.soil[2]);
        if (valueNoise(x, y, 12, 43) > 0.9) put(x, y, I1.soilLight);
        // ooze pools sit in the deepest ground, lit in one soft region
        const p = pool(x, y);
        if (d > 14 && p > 0.67) {
          if (p < 0.69) put(x, y, I1.poolRim);
          else put(x, y, p > 0.72 && fbm(x, y, 60, 46, 1) > 0.56 ? I1.poolLight : I1.pool);
        }
      }
      r.mul(x, y, 0.9 + fbm(x, y, 650, 52, 1) * 0.16);
    }
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    line(put, x, y, x + 2, y - 4, rr < 0.25 ? I1.blade : I1.bladeDark, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 6) {
      if (d > 14 && pool(x, y) > 0.67) return;
      if (rr < 0.07) puffball(put, x, y, 3 + Math.floor(rr * 30), I1_PUFF, i);
      else if (rr < 0.13) glowMushrooms(put, x, y, I1_MUSH.cap, I1_MUSH.capLight, I1_MUSH.stalk, I1_MUSH.glow, I1_PROPS, i);
      else if (rr < 0.4) { veins(put, x, y, I1.vein, i, 3, 5); veins(put, x + 1, y + 1, I1.crack, i + 1, 2, 4, 0.7); }
      return;
    }
    if (d > -16) {
      if (rr < 0.5) tuft(put, x, y - 1, 11 + rr * 7, I1_PROPS, i);
      else if (rr < 0.62 && fungusDrift(x, y) > 0.5) glowMushrooms(put, x, y, I1_MUSH.cap, I1_MUSH.capLight, I1_MUSH.stalk, I1_MUSH.glow, I1_PROPS, i);
      return;
    }
    if (rr < 0.28) { if (tuftDrift(x, y) > 0.42) tuft(put, x, y, 9 + rr * 14, I1_PROPS, i); }
    else if (rr < 0.38) { if (fungusDrift(x, y) > 0.58) glowMushrooms(put, x, y, I1_MUSH.cap, I1_MUSH.capLight, I1_MUSH.stalk, I1_MUSH.glow, I1_PROPS, i); }
    else if (rr < 0.44) { if (sporeDrift(x, y) > 0.55) puffball(put, x, y, 3 + Math.floor((rr - 0.38) * 40), I1_PUFF, i); }
    else if (rr < 0.5) { if (fungusDrift(x, y) > 0.5) veins(put, x, y, I1.ao[0], i, 3, 4, 0.7); }
  });
  return r;
}

function renderI2(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.60, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) put(x, y, tone < 0.45 ? I2.moss[0] : tone < 0.6 ? I2.moss[1] : I2.moss[2]);
      else if (d < 0) put(x, y, I2.mossShadow);
      else if (d < 3) put(x, y, I2.ao[0]);
      else if (d < 6) put(x, y, I2.ao[1]);
      else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? I2.earth[0] : t < 0.6 ? I2.earth[1] : I2.earth[2]);
        // mycelium threads carpet the outer band of each patch
        const n = valueNoise(x, y, 5, 44);
        if (d < 18 && n > 0.8 - (18 - d) * 0.006) put(x, y, I2.mycelium[Math.floor(valueNoise(x, y, 3, 45) * 3)]);
        else if (valueNoise(x, y, 12, 43) > 0.9) put(x, y, I2.earthLight);
      }
      r.mul(x, y, 0.9 + fbm(x, y, 650, 52, 1) * 0.16);
    }
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    line(put, x, y, x + 2, y - 4, rr < 0.25 ? I2.blade : I2.bladeDark, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 6) {
      if (rr < 0.12) glowMushrooms(put, x, y, I2_MUSH.cap, I2_MUSH.capLight, I2_MUSH.stalk, I2_MUSH.glow, I2_PROPS, i);
      else if (rr < 0.17) puffball(put, x, y, 3 + Math.floor((rr - 0.12) * 60), I2_PUFF, i);
      return;
    }
    if (d > -16) {
      if (rr < 0.45) tuft(put, x, y - 1, 11 + rr * 7, I2_PROPS, i);
      else if (rr < 0.62 && fungusDrift(x, y) > 0.45) glowMushrooms(put, x, y, I2_MUSH.cap, I2_MUSH.capLight, I2_MUSH.stalk, I2_MUSH.glow, I2_PROPS, i);
      return;
    }
    if (rr < 0.26) { if (tuftDrift(x, y) > 0.42) tuft(put, x, y, 9 + rr * 14, I2_PROPS, i); }
    else if (rr < 0.36) { if (fungusDrift(x, y) > 0.56) glowMushrooms(put, x, y, I2_MUSH_PURPLE.cap, I2_MUSH_PURPLE.capLight, I2_MUSH_PURPLE.stalk, I2_MUSH_PURPLE.glow, I2_PROPS, i); }
    else if (rr < 0.4) { if (sporeDrift(x, y) > 0.55) puffball(put, x, y, 3 + Math.floor((rr - 0.36) * 60), I2_PUFF, i); }
  });
  // spore motes drift over the moss in loose clouds
  propGrid(x0, y0, w, h, 14, 303, (x, y, rr) => {
    if (dist(x, y) > -6 || sporeDrift(x, y) < 0.6 || rr > 0.35) return;
    put(x, y, I2.mote, 0.9);
    put(x + 1, y, I2.mote, 0.3); put(x - 1, y, I2.mote, 0.3); put(x, y + 1, I2.mote, 0.3); put(x, y - 1, I2.mote, 0.3);
  });
  return r;
}

function renderMarsh(P: MarshPal, x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.62, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 7;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) {
        put(x, y, tone < 0.45 ? P.grass[0] : tone < 0.6 ? P.grass[1] : P.grass[2]);
      }
      else if (d < 0) put(x, y, P.grassShadow);
      else if (d < 3) put(x, y, P.mud[0]);
      else if (d < 7) put(x, y, P.mud[1]);
      else {
        const depth = Math.min(1, (d - 7) / 20);
        const c = mix(I3.poolShallow, I3.poolDeep, depth * (0.7 + fbm(x, y, 90, 33, 1) * 0.5));
        put(x, y, c);
        if (fbm(x, y, 40, 48, 2) > 0.67) put(x, y, I3.scum, 0.45);
        if (d > 10 && valueNoise(x, y, 9, 47) > 0.9) put(x, y, I3.poolLight, 0.8);
      }
      r.mul(x, y, 0.9 + fbm(x, y, 650, 52, 1) * 0.16);
    }
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    line(put, x, y, x + 2, y - 4, rr < 0.25 ? P.blade : P.bladeDark, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 12) {
      // bubbles and rings on the water
      if (rr < 0.18) ring(put, x, y, 2 + Math.floor(rr * 10), 1 + Math.floor(rr * 6), I3.bubble, 0.85);
      else if (rr < 0.26) ring(put, x, y, 7 + rr * 10, 3 + rr * 5, I3.poolLight, 0.7);
      return;
    }
    if (d > 2) return;
    if (d > -16) {
      if (rr < 0.4) reeds(put, x, y, 16 + rr * 14, I3.reed, I3.reedDark, I3.reedHead, i);
      else if (rr < 0.52 && d > -10) veins(put, x, y, P.crack, i, 3, 5, P.crackAlpha);
      else if (rr < 0.74) tuft(put, x, y - 1, 11 + rr * 7, P.props, i);
      else if (rr < 0.76 && fungusDrift(x, y) > 0.5) glowMushrooms(put, x, y, P.mushBank.cap, P.mushBank.capLight, P.mushBank.stalk, P.mushBank.glow, P.props, i);
      return;
    }
    if (rr < 0.28) { if (tuftDrift(x, y) > 0.42) tuft(put, x, y, 9 + rr * 14, P.props, i); }
    else if (rr < 0.34) { if (fungusDrift(x, y) > 0.58) glowMushrooms(put, x, y, P.mushMoss.cap, P.mushMoss.capLight, P.mushMoss.stalk, P.mushMoss.glow, P.props, i); }
    else if (rr < 0.38) { if (sporeDrift(x, y) > 0.58) puffball(put, x, y, 3 + Math.floor((rr - 0.34) * 60), P.puff, i); }
    else if (rr < 0.48) { if (d > -36 && fungusDrift(x, y) > 0.45) veins(put, x, y, P.crack, i, 3, 5, P.crackAlpha); }
  });
  return r;
}

const renderI3 = (x0: number, y0: number, w: number, h: number) => renderMarsh(I3_MARSH, x0, y0, w, h);
const renderI4 = (x0: number, y0: number, w: number, h: number) => renderMarsh(I4_MARSH, x0, y0, w, h);

export const INFECTED_STYLES: Record<InfectedId, { title: string; lean: string; patch: (r: number, g: number, b: number) => boolean; render: (x0: number, y0: number, w: number, h: number) => Raster }> = {
  I1: { title: 'Blighted Moor', lean: 'tainted soil, cracks, ooze pools', patch: (r, g, b) => b > g + 14, render: renderI1 },
  I2: { title: 'Fungal Carpet', lean: 'rotted earth, mycelium rim, glowing mushrooms', patch: (r, g, b) => r > b, render: renderI2 },
  I3: { title: 'Toxic Marsh', lean: 'acid pools, wet mud rim, reeds', patch: (r, g, b) => g > r + 30, render: renderI3 },
  I4: { title: 'Fungal Marsh', lean: 'the Toxic Marsh pools on the Fungal Carpet moss', patch: (r, g, b) => g > r + 30, render: renderI4 },
};
