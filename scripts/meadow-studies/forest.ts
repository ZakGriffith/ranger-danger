// Forest floor studies in the Wild Field vocabulary (the meadow direction
// Zak picked): deep tones in large regions, distance-field borders with an
// ambient-occlusion band and ragged fingers, soft unoutlined props grouped
// by drift fields. Same HD density (64 px per tile) as groundMeadow.ts.
//
//   F1  Pine Floor   — cool dark greens, bare earth patches carpeted with
//                      rust needle litter at their edges, ferns, mushrooms,
//                      twigs
//   F2  Mossy Glade  — warmer greens with soft moss clumps and stronger sun
//                      shafts, leaf-litter patches instead of bare earth,
//                      ferns, clover, mushrooms, fallen leaves
//   F3  Dark Woods   — the darkest: blue-green undergrowth, peat-black
//                      earth with exposed roots along the edge, sparse props,
//                      heavy dapple contrast

import { Raster, Rgb, hex, fbm, hash2, distanceField, valueNoise, line, ellipse, Put } from './raster';
import { PropPalette, tuft, flowers, clover, mushrooms } from './stamps';

export type ForestId = 'F1' | 'F2' | 'F3';

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
const fernDrift = (x: number, y: number) => fbm(x, y, 300, 74, 1);
const litterDrift = (x: number, y: number) => fbm(x, y, 260, 75, 1);
const tuftDrift = (x: number, y: number) => fbm(x, y, 260, 73, 1);

// ---- forest-only stamps ------------------------------------------------

/** A fern: 2–3 arching fronds with paired leaflets, lit toward the tip. */
function fern(put: Put, x: number, y: number, size: number, dark: Rgb, mid: Rgb, light: Rgb, seed: number): void {
  const fronds = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI / 2 + (f - (fronds - 1) / 2) * 0.9 + (hash2(f, x, seed) - 0.5) * 0.4;
    const len = size * (0.8 + hash2(f, y, seed) * 0.4);
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 0.7;
    line(put, x, y, ex, ey, dark);
    const steps = Math.max(3, Math.floor(len / 3));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = x + (ex - x) * t, py = y + (ey - y) * t;
      const l = (1 - t) * size * 0.35 + 1;
      const nx = -Math.sin(a) * l, ny = Math.cos(a) * l * 0.7;
      const c = t > 0.6 ? light : mid;
      line(put, px, py, px + nx, py + ny, c);
      line(put, px, py, px - nx, py - ny, c);
    }
  }
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y + 1, BLACK, 0.25);
}

/** A few fallen leaves in warm tones. */
function leaves(put: Put, x: number, y: number, pal: readonly Rgb[], seed: number, n = 5): void {
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 26), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 16);
    const c = pal[Math.floor(hash2(px, py, seed) * pal.length)];
    put(px, py, c); put(px + 1, py, c); put(px + (i % 2 ? 1 : 0), py + 1, c);
    put(px + 2, py + 1, BLACK, 0.25);
  }
}

/** A fallen twig, 8–16 px, with a fork. */
function twig(put: Put, x: number, y: number, wood: Rgb, woodDark: Rgb, seed: number): void {
  const len = 8 + hash2(x, y, seed) * 8, a = (hash2(y, x, seed) - 0.5) * 1.2;
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  line(put, x, y, ex, ey, wood);
  line(put, x, y + 1, ex, ey + 1, woodDark);
  const fx = x + (ex - x) * 0.6, fy = y + (ey - y) * 0.6;
  line(put, fx, fy, fx + Math.cos(a - 0.8) * 4, fy + Math.sin(a - 0.8) * 4, wood);
}

/** Exposed roots snaking out from the dirt edge into the earth. */
function root(put: Put, x: number, y: number, dirtDist: (x: number, y: number) => number, wood: Rgb, woodDark: Rgb, seed: number): void {
  let px = x, py = y;
  let a = Math.atan2(dirtDist(x, y + 2) - dirtDist(x, y - 2), dirtDist(x + 2, y) - dirtDist(x - 2, y)); // toward dirt interior
  for (let s = 0; s < 14; s++) {
    a += (hash2(s, x, seed) - 0.5) * 0.9;
    const nx = px + Math.cos(a) * 3, ny = py + Math.sin(a) * 3;
    line(put, px, py, nx, ny, s < 9 ? wood : woodDark);
    line(put, px, py + 1, nx, ny + 1, woodDark);
    px = nx; py = ny;
  }
}

// ---- palettes ------------------------------------------------------------

const F1 = {
  grass: [hex('#2b4a28'), hex('#32552e'), hex('#3a6134')],
  grassShadow: hex('#1e361c'),
  blade: hex('#487a3d'), bladeDark: hex('#243f21'),
  ao: [hex('#2c1e13'), hex('#3f2c1c')],
  dirt: [hex('#4e3a27'), hex('#5a4530'), hex('#664f38')],
  dirtLight: hex('#7a6246'), dirtDark: hex('#3b2a1a'),
  needle: [hex('#8a5a2e'), hex('#9c6a36'), hex('#74482a')],
  fern: [hex('#2a5a2a'), hex('#3f8a3c'), hex('#6fbf5a')],
  leaf: [hex('#a8622a'), hex('#8a4a22'), hex('#c07a30')],
};
const F1_PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#1f3d1d'), tuftMid: hex('#376b30'), tuftLight: hex('#5e9a4c'),
  leaf: hex('#1f3d1d'), stem: hex('#2a4d27'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#6a4424'), woodDark: hex('#412812'), woodLight: hex('#95673d'),
  shadowAlpha: 0.35,
};

const F2 = {
  grass: [hex('#34582b'), hex('#3d6631'), hex('#477538')],
  grassShadow: hex('#243f1f'),
  moss: hex('#5c8f3e'), mossLight: hex('#78aa4e'),
  ao: [hex('#3a2715'), hex('#55391f')],
  litter: [hex('#6e4a2a'), hex('#7d5731'), hex('#8c6538')],
  litterLeaf: [hex('#a56a2e'), hex('#b8803a'), hex('#8e4f24'), hex('#c89a4a')],
  fern: [hex('#2f6a2e'), hex('#4a9646'), hex('#80cf66')],
};
const F2_PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#274a22'), tuftMid: hex('#44803a'), tuftLight: hex('#78b65a')
  , leaf: hex('#274a22'), stem: hex('#2f5a2a'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#7a5030'), woodDark: hex('#4a2e16'), woodLight: hex('#a87a48'),
  shadowAlpha: 0.3,
};

const F3 = {
  grass: [hex('#1f3a2a'), hex('#25452f'), hex('#2c5035')],
  grassShadow: hex('#142a1d'),
  blade: hex('#3c6a48'), bladeDark: hex('#1a3323'),
  ao: [hex('#17110c'), hex('#241a12')],
  dirt: [hex('#2f241a'), hex('#382c20'), hex('#413426')],
  dirtLight: hex('#52412f'), dirtDark: hex('#1f1710'),
  fern: [hex('#214a2e'), hex('#347a44'), hex('#59a866')],
  root: hex('#6b4a2c'), rootDark: hex('#3a2616'),
};
const F3_PROPS: PropPalette = {
  outline: null,
  tuftDark: hex('#183223'), tuftMid: hex('#2b5a3a'), tuftLight: hex('#4a8a58'),
  leaf: hex('#183223'), stem: hex('#214530'),
  rockDark: hex('#4f5058'), rockMid: hex('#777a84'), rockLight: hex('#a9acb5'), rockOutline: hex('#3a3b42'),
  bushDark: hex('#22492a'), bushMid: hex('#346b35'), bushLight: hex('#5f9c4d'),
  wood: hex('#4a3320'), woodDark: hex('#2b1c10'), woodLight: hex('#6b4b30'),
  shadowAlpha: 0.4,
};

const MUSH = { cap: hex('#b8522f'), capLight: hex('#e6a07a'), stalk: hex('#e8d8bc') };
const MUSH_PALE = { cap: hex('#c9b48a'), capLight: hex('#efe3c4'), stalk: hex('#e8dcc2') };

// ---- renderers -------------------------------------------------------------

function renderF1(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.62, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) put(x, y, tone < 0.45 ? F1.grass[0] : tone < 0.6 ? F1.grass[1] : F1.grass[2]);
      else if (d < 0) put(x, y, F1.grassShadow);
      else if (d < 3) put(x, y, F1.ao[0]);
      else if (d < 6) put(x, y, F1.ao[1]);
      else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? F1.dirt[0] : t < 0.6 ? F1.dirt[1] : F1.dirt[2]);
        // needle litter carpets the outer band of each patch
        const n = valueNoise(x, y, 5, 44);
        if (d < 26 && n > 0.72 - (26 - d) * 0.006) put(x, y, F1.needle[Math.floor(valueNoise(x, y, 3, 45) * 3)]);
        else if (valueNoise(x, y, 12, 43) > 0.9) put(x, y, F1.dirtLight);
      }
      r.mul(x, y, 0.92 + fbm(x, y, 650, 52, 1) * 0.16);
    }
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.3 + tuftDrift(x, y) * 0.6) return;
    line(put, x, y, x + 2, y - 4, rr < 0.25 ? F1.blade : F1.bladeDark, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 6) { if (rr < 0.08) twig(put, x, y, F1_PROPS.wood, F1_PROPS.woodDark, i); else if (rr < 0.13) mushrooms(put, x, y, MUSH_PALE.cap, MUSH_PALE.capLight, MUSH_PALE.stalk, F1_PROPS, i); return; }
    if (d > -16) { if (rr < 0.6) tuft(put, x, y - 1, 11 + rr * 7, F1_PROPS, i); else if (rr < 0.75 && fernDrift(x, y) > 0.5) fern(put, x, y, 16 + rr * 8, F1.fern[0], F1.fern[1], F1.fern[2], i); return; }
    if (rr < 0.3) { if (tuftDrift(x, y) > 0.42) tuft(put, x, y, 9 + rr * 14, F1_PROPS, i); }
    else if (rr < 0.5) { if (fernDrift(x, y) > 0.55) fern(put, x, y, 18 + rr * 12, F1.fern[0], F1.fern[1], F1.fern[2], i); }
    else if (rr < 0.6) { if (litterDrift(x, y) > 0.55) leaves(put, x, y, F1.leaf, i); }
    else if (rr < 0.64) twig(put, x, y, F1_PROPS.wood, F1_PROPS.woodDark, i);
    else if (rr < 0.66) mushrooms(put, x, y, MUSH.cap, MUSH.capLight, MUSH.stalk, F1_PROPS, i);
  });
  return r;
}

function renderF2(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.62, 2);
  const moss = (x: number, y: number) => fbm(x, y, 110, 46, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 7;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) {
        const m = moss(x, y);
        if (m > 0.7) put(x, y, m > 0.78 ? F2.mossLight : F2.moss);
        else put(x, y, tone < 0.45 ? F2.grass[0] : tone < 0.6 ? F2.grass[1] : F2.grass[2]);
      } else if (d < 0) put(x, y, F2.grassShadow);
      else if (d < 3) put(x, y, F2.ao[0]);
      else if (d < 6) put(x, y, F2.ao[1]);
      else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? F2.litter[0] : t < 0.6 ? F2.litter[1] : F2.litter[2]);
      }
      // stronger sun shafts, in bigger pools
      r.mul(x, y, 0.88 + fbm(x, y, 520, 52, 1) * 0.24);
    }
  // the patch is a leaf bed: individual leaves on a 9-px cell, denser toward the middle
  propGrid(x0, y0, w, h, 9, 203, (x, y, rr) => {
    const d = dist(x, y);
    if (d < 5 || rr > 0.25 + Math.min(d, 30) * 0.012) return;
    const c = F2.litterLeaf[Math.floor(hash2(x, y, 9) * 4)];
    put(x, y, c); put(x + 1, y, c); put(x + (rr < 0.5 ? 1 : 0), y + 1, c);
    put(x + 2, y + 1, BLACK, 0.2);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 6) { if (rr < 0.1) mushrooms(put, x, y, MUSH.cap, MUSH.capLight, MUSH.stalk, F2_PROPS, i); return; }
    if (d > -16) { if (rr < 0.55) tuft(put, x, y - 1, 11 + rr * 7, F2_PROPS, i); else if (rr < 0.8 && fernDrift(x, y) > 0.45) fern(put, x, y, 16 + rr * 8, F2.fern[0], F2.fern[1], F2.fern[2], i); return; }
    if (rr < 0.28) { if (tuftDrift(x, y) > 0.42) tuft(put, x, y, 9 + rr * 14, F2_PROPS, i); }
    else if (rr < 0.46) { if (fernDrift(x, y) > 0.55) fern(put, x, y, 18 + rr * 12, F2.fern[0], F2.fern[1], F2.fern[2], i); }
    else if (rr < 0.54) clover(put, x, y, F2_PROPS, i);
    else if (rr < 0.66) { if (litterDrift(x, y) > 0.5) leaves(put, x, y, F2.litterLeaf, i, 7); }
    else if (rr < 0.72) { if (fernDrift(x, y) < 0.4) { const f = [hex('#f5f1e8'), hex('#f2cf3a')] as const; flowers(put, x, y, f[0], f[1], F2_PROPS, i, true); } }
    else if (rr < 0.76) mushrooms(put, x, y, MUSH.cap, MUSH.capLight, MUSH.stalk, F2_PROPS, i);
  });
  return r;
}

function renderF3(x0: number, y0: number, w: number, h: number): Raster {
  const r = new Raster(x0, y0, w, h);
  const put: Put = (x, y, c, a) => r.put(x, y, c, a);
  const dist = distanceField(x0, y0, w, h, 520, 11, 0.62, 2);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const d = dist(x, y) + (fbm(x, y, 14, 61, 2) - 0.5) * 9;
      const tone = fbm(x, y, 900, 23, 1) + (fbm(x, y, 34, 25, 2) - 0.5) * 0.04;
      if (d < -4) put(x, y, tone < 0.45 ? F3.grass[0] : tone < 0.6 ? F3.grass[1] : F3.grass[2]);
      else if (d < 0) put(x, y, F3.grassShadow);
      else if (d < 3) put(x, y, F3.ao[0]);
      else if (d < 7) put(x, y, F3.ao[1]);
      else {
        const t = fbm(x, y, 130, 33, 1);
        put(x, y, t < 0.42 ? F3.dirt[0] : t < 0.6 ? F3.dirt[1] : F3.dirt[2]);
        const c = valueNoise(x, y, 12, 43);
        if (c > 0.9) put(x, y, F3.dirtLight); else if (c < 0.07 && d > 10) put(x, y, F3.dirtDark);
      }
      r.mul(x, y, 0.84 + fbm(x, y, 600, 52, 1) * 0.3);
    }
  propGrid(x0, y0, w, h, 9, 201, (x, y, rr) => {
    if (dist(x, y) > -8 || rr > 0.25 + tuftDrift(x, y) * 0.5) return;
    line(put, x, y, x + 2, y - 4, rr < 0.2 ? F3.blade : F3.bladeDark, 0.5);
  });
  propGrid(x0, y0, w, h, 40, 102, (x, y, rr, i) => {
    const d = dist(x, y);
    if (d > 6) { if (rr < 0.06) mushrooms(put, x, y, MUSH_PALE.cap, MUSH_PALE.capLight, MUSH_PALE.stalk, F3_PROPS, i); return; }
    if (d > -16) {
      if (rr < 0.45) tuft(put, x, y - 1, 11 + rr * 7, F3_PROPS, i);
      else if (rr < 0.62 && d > -8) root(put, x, y, dist, F3.root, F3.rootDark, i);
      else if (rr < 0.75 && fernDrift(x, y) > 0.5) fern(put, x, y, 16 + rr * 8, F3.fern[0], F3.fern[1], F3.fern[2], i);
      return;
    }
    if (rr < 0.26) { if (tuftDrift(x, y) > 0.45) tuft(put, x, y, 9 + rr * 14, F3_PROPS, i); }
    else if (rr < 0.42) { if (fernDrift(x, y) > 0.58) fern(put, x, y, 18 + rr * 12, F3.fern[0], F3.fern[1], F3.fern[2], i); }
    else if (rr < 0.46) twig(put, x, y, F3_PROPS.wood, F3_PROPS.woodDark, i);
    else if (rr < 0.49) mushrooms(put, x, y, MUSH.cap, MUSH.capLight, MUSH.stalk, F3_PROPS, i);
  });
  return r;
}

export const FOREST_STYLES: Record<ForestId, { title: string; lean: string; render: (x0: number, y0: number, w: number, h: number) => Raster }> = {
  F1: { title: 'Pine Floor', lean: 'bare earth, needle litter, ferns', render: renderF1 },
  F2: { title: 'Mossy Glade', lean: 'moss clumps, leaf beds, sun shafts', render: renderF2 },
  F3: { title: 'Dark Woods', lean: 'peat earth, roots, deepest shade', render: renderF3 },
};
