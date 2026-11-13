// Three meadow ground directions, all at HD density (64 px per 32-px world
// tile, i.e. the same pixel density as the HD sprites). Each renders any
// world region deterministically.
//
//   A  Painted Meadow  — Kingdom Rush lean: saturated, posterised paint
//                        blotches, dirt with a dark edge line + sun-bleached
//                        lip, outlined props.
//   B  Wild Field      — Warcraft 3 lean: deeper greens, directional blade
//                        texture, ragged "grass fingers" over dirt with an
//                        ambient-occlusion shadow band, soft unoutlined props.
//   C  Clean Field     — Bounty of One lean: two flat grass tones, smooth
//                        rounded dirt patches with a single edge line and
//                        highlight, sparse chunky props, lots of air.

import { Raster, Rgb, hex, fbm, hash2, distanceField, valueNoise, line, ellipse, Put } from './raster';
import { PropPalette, tuft, flowers, rock, pebbles, bush, log, clover, mushrooms } from './stamps';

export const TILE = 64;
export type StyleId = 'A' | 'B' | 'B2' | 'C';

type Ground = { dist: (x: number, y: number) => number };

const FLOWERS: ReadonlyArray<readonly [Rgb, Rgb]> = [
  [hex('#e2463b'), hex('#f7c84a')],
  [hex('#f2cf3a'), hex('#c46a1c')],
  [hex('#f5f1e8'), hex('#f2cf3a')],
  [hex('#b56fd6'), hex('#f5f1e8')],
  [hex('#6f9cea'), hex('#f5f1e8')],
];

/** Low-frequency fields that gate prop kinds so flowers drift and rocks group instead of sprinkling evenly. */
const flowerDrift = (x: number, y: number) => fbm(x, y, 340, 71, 1);
const tuftDrift = (x: number, y: number) => fbm(x, y, 260, 73, 1);

function propGrid(x0: number, y0: number, w: number, h: number, cell: number, seed: number, fn: (x: number, y: number, r: number, i: number) => void) {
  const cx0 = Math.floor((x0 - 48) / cell), cy0 = Math.floor((y0 - 48) / cell);
  const cx1 = Math.ceil((x0 + w + 48) / cell), cy1 = Math.ceil((y0 + h + 48) / cell);
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      const r = hash2(cx, cy, seed);
      const pad = Math.min(6, cell / 4);
      const px = Math.floor(cx * cell + pad + hash2(cx, cy, seed + 1) * (cell - 2 * pad));
      const py = Math.floor(cy * cell + pad + hash2(cx, cy, seed + 2) * (cell - 2 * pad));
      fn(px, py, r, Math.abs(cx * 7919 + cy));
    }
}

// ---------------------------------------------------------------------------
//  A — Painted Meadow
// ---------------------------------------------------------------------------
const A = {
  grass: [hex('#3e7a33'), hex('#4a8c3a'), hex('#579d46')],
  grassShadow: hex('#2e5e28'),
  dirtEdge: hex('#5c4130'),
  dirtLip: hex('#cbab7d'),
  dirt: [hex('#9d7d57'), hex('#a98860'), hex('#b4946a')],
  dirtSpot: hex('#8f7050'),
  pebbleL: hex('#d2b78f'), pebbleD: hex('#7d6346'),
};
const A_PROPS: PropPalette = {
  outline: hex('#1f3320'),
  tuftDark: hex('#2d6129'), tuftMid: hex('#4f9a3f'), tuftLight: hex('#8fd05a'),
  leaf: hex('#2d6129'), stem: hex('#346d2c'),
  rockDark: hex('#5c606b'), rockMid: hex('#8c909a'), rockLight: hex('#c0c4cc'), rockOutline: hex('#2a2d36'),
  bushDark: hex('#2b6130'), bushMid: hex('#3f8a3c'), bushLight: hex('#71bd55'),
  wood: hex('#8b5a2b'), woodDark: hex('#5a3618'), woodLight: hex('#c08850'),
  shadowAlpha: 0.28,
};

function renderA(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.60, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y);
      // painted blotches: low-frequency tone + a small wobble so band edges look brushed, not noisy
      const tone = fbm(x, y, 170, 21, 2) + (valueNoise(x, y, 18, 22) - 0.5) * 0.08;
      if (d < -3.5) {
        const g = tone < 0.44 ? A.grass[0] : tone < 0.58 ? A.grass[1] : A.grass[2];
        put(x, y, g);
      } else if (d < 0) {
        put(x, y, A.grassShadow);
      } else if (d < 2) {
        put(x, y, A.dirtEdge);
      } else if (d < 4.5) {
        put(x, y, A.dirtLip);
      } else {
        const t = fbm(x, y, 150, 31, 1);
        put(x, y, t < 0.42 ? A.dirt[0] : t < 0.6 ? A.dirt[1] : A.dirt[2]);
        if (d > 8 && valueNoise(x, y, 13, 41) > 0.86) put(x, y, A.dirtSpot);
      }
      // sun dapple: wide, soft, never per-pixel
      r.mul(x, y, 0.96 + fbm(x, y, 700, 51, 1) * 0.09);
    }
  // props
  propGrid(x0, y0, w, h, 44, 101, (x, y, rr, i) => {
    const d = dist(x, y);
    const flowery = flowerDrift(x, y) > 0.58, tufty = tuftDrift(x, y) > 0.45;
    if (d > 6) return;
    if (d > -14) { // grass bank along the dirt edge: tufts lean over the lip
      if (rr < 0.65) tuft(put, x, y - 1, 11 + rr * 6, A_PROPS, i);
      return;
    }
    if (rr < 0.34) { if (tufty) tuft(put, x, y, 10 + rr * 14, A_PROPS, i); }
    else if (rr < 0.42) clover(put, x, y, A_PROPS, i);
    else if (rr < 0.62) { if (flowery) { const f = FLOWERS[i % FLOWERS.length]; flowers(put, x, y, f[0], f[1], A_PROPS, i, true); } }
  });
  return r;
}

// ---------------------------------------------------------------------------
//  B — Wild Field
// ---------------------------------------------------------------------------
const B = {
  grass: [hex('#365f2d'), hex('#3e6d33'), hex('#477a3a')],
  grassShadow: hex('#26481f'),
  blade: hex('#578f44'), bladeDark: hex('#2f5527'),
  ao: [hex('#3b2a1b'), hex('#55402b')],
  dirt: [hex('#6a5038'), hex('#775b41'), hex('#846749')],
  dirtLight: hex('#95785a'), dirtDark: hex('#574029'),
  pebbleL: hex('#a58c6c'), pebbleD: hex('#4f3b28'),
};
const B_PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#2a4f24'), tuftMid: hex('#4a8239'), tuftLight: hex('#7fb757'),
  leaf: hex('#2a4f24'), stem: hex('#315b2a'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#7a4f27'), woodDark: hex('#4d2f14'), woodLight: hex('#a87a46'),
  shadowAlpha: 0.35,
};

function renderB(x0: number, y0: number, w: number, h: number, toneScale = 220): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.60, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      // ragged fingers: the contour wobbles at a 14-px scale so grass reaches into the dirt
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      // one smooth octave plus a faint wobble: big tone regions with slightly irregular, still-thin edges
      const tone = fbm(x, y, toneScale, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) {
        put(x, y, tone < 0.45 ? B.grass[0] : tone < 0.6 ? B.grass[1] : B.grass[2]);
      } else if (d < 0) {
        put(x, y, B.grassShadow);
      } else if (d < 3) {
        put(x, y, B.ao[0]);
      } else if (d < 6) {
        put(x, y, B.ao[1]);
      } else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? B.dirt[0] : t < 0.6 ? B.dirt[1] : B.dirt[2]);
        // dry crust: a few light flecks and dark pits on a coarse cell so they stay deliberate
        const c = valueNoise(x, y, 12, 43);
        if (c > 0.9) put(x, y, B.dirtLight);
        else if (c < 0.07 && d > 10) put(x, y, B.dirtDark);
      }
      r.mul(x, y, 0.94 + fbm(x, y, 650, 52, 1) * 0.12);
    }
  // directional blade texture over open grass: short diagonal strokes on a jittered grid
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    const c = rr < 0.25 ? B.blade : B.bladeDark;
    line(put, x, y, x + 2, y - 4, c, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    const flowery = flowerDrift(x, y) > 0.6, tufty = tuftDrift(x, y) > 0.42;
    if (d > 6) return;
    if (d > -16) { if (rr < 0.75) tuft(put, x, y - 1, 11 + rr * 7, B_PROPS, i); return; }
    if (rr < 0.4) { if (tufty) tuft(put, x, y, 9 + rr * 14, B_PROPS, i); }
    else if (rr < 0.46) clover(put, x, y, B_PROPS, i);
    else if (rr < 0.62) { if (flowery) { const f = FLOWERS[(i + 2) % FLOWERS.length]; flowers(put, x, y, f[0], f[1], B_PROPS, i, true); } }
    else if (rr >= 0.725 && rr < 0.74) mushrooms(put, x, y, hex('#b8522f'), hex('#e6a07a'), hex('#e8d8bc'), B_PROPS, i);
  });
  return r;
}

// ---------------------------------------------------------------------------
//  C — Clean Field
// ---------------------------------------------------------------------------
const C = {
  grass: [hex('#5a9a49'), hex('#66a955')],
  grassShadow: hex('#4b8a3f'),
  dirtEdge: hex('#7c5d3e'),
  dirtHi: hex('#e3cb9d'),
  dirt: [hex('#c8a877'), hex('#d4b687')],
};
const C_PROPS: PropPalette = {
  outline: hex('#2f4a2e'),
  tuftDark: hex('#3f8035'), tuftMid: hex('#5fae4b'), tuftLight: hex('#9ddc6c'),
  leaf: hex('#3f8035'), stem: hex('#3f8035'),
  rockDark: hex('#6d7078'), rockMid: hex('#989ba4'), rockLight: hex('#cdd0d6'), rockOutline: hex('#3a3d47'),
  bushDark: hex('#3c7e3a'), bushMid: hex('#4e9c47'), bushLight: hex('#86cf63'),
  wood: hex('#a0693a'), woodDark: hex('#6a4120'), woodLight: hex('#d6a16a'),
  shadowAlpha: 0.22,
};

function renderC(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  // single smooth octave: rounded patches with no ragged detail at all
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.60, 1);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y);
      const tone = fbm(x, y, 260, 24, 1);
      if (d < -2) put(x, y, tone < 0.5 ? C.grass[0] : C.grass[1]);
      else if (d < 0) put(x, y, C.grassShadow);
      else if (d < 2) put(x, y, C.dirtEdge);
      else if (d < 3.5) put(x, y, C.dirtHi);
      else put(x, y, fbm(x, y, 120, 34, 1) < 0.5 ? C.dirt[0] : C.dirt[1]);
    }
  propGrid(x0, y0, w, h, 56, 103, (x, y, rr, i) => {
    const d = dist(x, y);
    const flowery = flowerDrift(x, y) > 0.6;
    if (d > 8) return;
    if (d > -12) { if (rr < 0.4) tuft(put, x, y - 1, 12 + rr * 6, C_PROPS, i); return; }
    if (rr < 0.2) tuft(put, x, y, 11 + rr * 16, C_PROPS, i);
    else if (rr < 0.45) { if (flowery) { const f = FLOWERS[(i + 1) % FLOWERS.length]; flowers(put, x, y, f[0], f[1], C_PROPS, i, true); } }
  });
  return r;
}

export const STYLES: Record<StyleId, { title: string; lean: string; render: (x0: number, y0: number, w: number, h: number) => Raster }> = {
  A: { title: 'Painted Meadow', lean: 'Kingdom Rush lean', render: renderA },
  B: { title: 'Wild Field', lean: 'Warcraft 3 lean', render: (x0, y0, w, h) => renderB(x0, y0, w, h, 520) },
  B2: { title: 'Wild Field, broader tones', lean: 'Warcraft 3 lean', render: (x0, y0, w, h) => renderB(x0, y0, w, h, 900) },
  C: { title: 'Clean Field', lean: 'Bounty of One lean', render: renderC },
};
