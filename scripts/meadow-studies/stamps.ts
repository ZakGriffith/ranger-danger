// Hand-drawn props for the meadow studies: grass tufts, flower clumps, rocks,
// pebbles, bushes, logs, clover, mushrooms. Each is drawn in HD px (64 per
// tile) around a world-space anchor; `outline` toggles the dark edge used by
// the HD sprites so props can match them or stay soft/painterly.

import { Put, Rgb, hex, disc, ellipse, line, hash2 } from './raster';

export type PropPalette = {
  outline: Rgb | null;
  tuftDark: Rgb; tuftMid: Rgb; tuftLight: Rgb;
  leaf: Rgb; stem: Rgb;
  rockDark: Rgb; rockMid: Rgb; rockLight: Rgb; rockOutline: Rgb;
  bushDark: Rgb; bushMid: Rgb; bushLight: Rgb;
  wood: Rgb; woodDark: Rgb; woodLight: Rgb;
  shadowAlpha: number;
};

const BLACK = hex('#0b0f1a');

/** A clump of 3–6 grass blades, lit from the top-left. */
export function tuft(put: Put, x: number, y: number, size: number, pal: PropPalette, seed: number): void {
  const blades = 3 + Math.floor(hash2(x, y, seed) * 3);
  const spread = size * 0.55;
  for (let i = 0; i < blades; i++) {
    const t = blades === 1 ? 0.5 : i / (blades - 1);
    const bx = x + (t - 0.5) * spread * 2;
    const lean = (t - 0.5) * size * 0.9 + (hash2(i, x, seed) - 0.5) * 2;
    const hgt = size * (0.65 + 0.35 * hash2(x + i, y, seed)) * (1 - Math.abs(t - 0.5) * 0.4);
    const tipX = bx + lean, tipY = y - hgt;
    const col = t < 0.4 ? pal.tuftLight : t > 0.7 ? pal.tuftDark : pal.tuftMid;
    line(put, bx, y, tipX, tipY, col);
    // blades are 2 px wide for their lower two thirds so they still read at 0.5 scale
    const mx = bx + (tipX - bx) * 0.66, my = y + (tipY - y) * 0.66;
    line(put, bx + 1, y, Math.round(mx) + 1, Math.round(my), t < 0.4 ? pal.tuftMid : pal.tuftDark);
  }
  // root shadow
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y + 1, pal.tuftDark, 0.6);
  if (pal.outline) {
    // only ground the clump: a short dark base line, not a full stroke (grass stays airy)
    for (let dx = -2; dx <= 2; dx++) put(x + dx, y + 2, pal.outline, 0.35);
  }
}

/** Flower clump: 3–6 heads of one colour on short stems with leaves. */
export function flowers(put: Put, x: number, y: number, petal: Rgb, center: Rgb, pal: PropPalette, seed: number, big = false): void {
  const count = 3 + Math.floor(hash2(x, y, seed) * 4);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + hash2(i, y, seed) * 1.2;
    const r = 3 + hash2(x, i, seed) * (big ? 12 : 6);
    const fx = Math.round(x + Math.cos(a) * r), fy = Math.round(y + Math.sin(a) * r * 0.6);
    const stemH = big ? 5 : 3;
    line(put, fx, fy + 1, fx, fy + stemH, pal.stem);
    put(fx + (i % 2 ? 1 : -1), fy + stemH - 1, pal.leaf);
    if (big) {
      put(fx - 1, fy, petal); put(fx + 1, fy, petal); put(fx, fy - 1, petal); put(fx, fy + 1, petal);
      put(fx - 1, fy - 1, petal); put(fx + 1, fy - 1, petal); put(fx - 1, fy + 1, petal); put(fx + 1, fy + 1, petal);
      put(fx, fy, center);
      if (pal.outline) { put(fx, fy - 2, pal.outline, 0.5); put(fx - 2, fy, pal.outline, 0.5); put(fx + 2, fy, pal.outline, 0.5); put(fx, fy + 2, pal.outline, 0.5); }
    } else {
      put(fx - 1, fy, petal); put(fx + 1, fy, petal); put(fx, fy - 1, petal); put(fx, fy + 1, petal);
      put(fx, fy, center);
    }
  }
}

/** Rounded rock with top-left light, bottom-right shade, ground shadow. */
export function rock(put: Put, x: number, y: number, r: number, pal: PropPalette, seed: number): void {
  const rx = r * (0.85 + hash2(x, y, seed) * 0.5), ry = r * (0.6 + hash2(y, x, seed) * 0.25);
  ellipse(put, x + 1, y + 2, rx, ry, BLACK, pal.shadowAlpha);
  ellipse(put, x, y, rx + 1, ry + 1, pal.rockOutline);
  ellipse(put, x, y, rx, ry, pal.rockMid);
  ellipse(put, x + rx * 0.2, y + ry * 0.3, rx * 0.8, ry * 0.65, pal.rockDark);
  ellipse(put, x - rx * 0.25, y - ry * 0.3, rx * 0.5, ry * 0.4, pal.rockLight);
  // a crack and a chip so rocks don't look like beans
  put(x + Math.round(rx * 0.3), y - 1, pal.rockDark);
  put(x + Math.round(rx * 0.3) + 1, y, pal.rockDark);
  if (!pal.outline) ellipse(put, x, y, rx + 1, ry + 1, pal.rockDark, 0.0);
}

export function pebbles(put: Put, x: number, y: number, pal: PropPalette, seed: number, light: Rgb, dark: Rgb): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 3);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 14), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 8);
    put(px, py, light); put(px + 1, py, light); put(px, py + 1, dark); put(px + 1, py + 1, dark);
    if (pal.outline) put(px + 2, py + 1, pal.outline, 0.35);
  }
}

/** Round leafy bush, three tones, optional outline. */
export function bush(put: Put, x: number, y: number, r: number, pal: PropPalette, seed: number): void {
  ellipse(put, x + 1, y + r * 0.6, r + 2, r * 0.6, BLACK, pal.shadowAlpha);
  const lobes = [[0, 0, 1], [-0.55, 0.15, 0.75], [0.55, 0.15, 0.75], [0, -0.35, 0.7]];
  if (pal.outline) for (const [dx, dy, s] of lobes) ellipse(put, x + dx * r, y + dy * r, r * s + 1, r * s * 0.85 + 1, pal.outline);
  for (const [dx, dy, s] of lobes) ellipse(put, x + dx * r, y + dy * r, r * s, r * s * 0.85, pal.bushMid);
  for (const [dx, dy, s] of lobes) ellipse(put, x + dx * r + r * s * 0.15, y + dy * r + r * s * 0.35, r * s * 0.8, r * s * 0.5, pal.bushDark);
  for (const [dx, dy, s] of lobes) ellipse(put, x + dx * r - r * s * 0.3, y + dy * r - r * s * 0.35, r * s * 0.45, r * s * 0.35, pal.bushLight);
  // leaf sparkle
  for (let i = 0; i < 4; i++) {
    const a = hash2(i, x, seed) * 6.28, d = hash2(i, y, seed) * r * 0.7;
    put(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.8 - r * 0.2), pal.bushLight);
  }
}

/** Fallen log lying roughly horizontal. */
export function log(put: Put, x: number, y: number, len: number, pal: PropPalette, seed: number): void {
  const r = 4;
  const tilt = (hash2(x, y, seed) - 0.5) * 0.3;
  ellipse(put, x + 2, y + 3, len / 2 + 2, r * 0.8, BLACK, pal.shadowAlpha);
  const stroke = (ry: number, c: Rgb, off: number) => {
    for (let i = -len / 2; i <= len / 2; i++) {
      const cy = y + i * tilt + off;
      for (let dy = -ry; dy <= ry; dy++) put(Math.round(x + i), Math.round(cy + dy), c);
    }
  };
  if (pal.outline) stroke(r + 1, pal.outline, 0);
  stroke(r, pal.wood, 0);
  stroke(r * 0.45, pal.woodDark, r * 0.5);
  stroke(1, pal.woodLight, -r * 0.55);
  // bark lines
  for (let i = -len / 2 + 3; i < len / 2 - 2; i += 5) {
    const cy = y + i * tilt;
    put(Math.round(x + i), Math.round(cy - 1), pal.woodDark); put(Math.round(x + i), Math.round(cy), pal.woodDark);
  }
  // cut end on the right
  const ex = x + len / 2, ey = y + (len / 2) * tilt;
  if (pal.outline) ellipse(put, ex, ey, 3, r + 1, pal.outline);
  ellipse(put, ex, ey, 2, r, pal.woodLight);
  ellipse(put, ex, ey, 1, r * 0.5, pal.woodDark);
}

/** Darker-green clover patch — breaks up open grass without any props. */
export function clover(put: Put, x: number, y: number, pal: PropPalette, seed: number): void {
  const n = 6 + Math.floor(hash2(x, y, seed) * 6);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (hash2(i, x, seed) - 0.5) * 22), py = Math.round(y + (hash2(i, y, seed) - 0.5) * 14);
    put(px, py, pal.tuftDark); put(px + 1, py, pal.tuftDark); put(px, py + 1, pal.tuftDark); put(px + 1, py + 1, pal.tuftDark);
    put(px, py, pal.tuftMid);
  }
}

export function mushrooms(put: Put, x: number, y: number, cap: Rgb, capLight: Rgb, stalk: Rgb, pal: PropPalette, seed: number): void {
  const n = 2 + Math.floor(hash2(x, y, seed) * 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(x + (i - (n - 1) / 2) * 6 + (hash2(i, x, seed) - 0.5) * 2), py = y + (i % 2);
    const r = 2 + Math.floor(hash2(i, y, seed) * 2);
    line(put, px, py, px, py + 3, stalk);
    line(put, px + 1, py + 1, px + 1, py + 3, pal.outline ?? pal.woodDark, 0.6);
    ellipse(put, px, py, r + (pal.outline ? 1 : 0), Math.max(1.5, r * 0.6) + (pal.outline ? 1 : 0), pal.outline ?? cap);
    ellipse(put, px, py, r, Math.max(1.5, r * 0.6), cap);
    put(px - 1, py - 1, capLight);
  }
}
