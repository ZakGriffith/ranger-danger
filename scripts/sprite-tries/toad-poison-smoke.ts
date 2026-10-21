import { ellipse, poly, rect, type HdDraw, type HdPut, type Paint, type RawPut } from '../../src/assets/art/hd';

export type PoisonSmokeStyle = 'a' | 'b' | 'c';

type Palette = {
  ground: Paint;
  deep: Paint;
  shade: Paint;
  mist: Paint;
  light: Paint;
  spark: Paint;
};

const PALETTES: Record<PoisonSmokeStyle, Palette> = {
  a: { ground: '#61753c', deep: '#3b4433', shade: '#586a3c', mist: '#81964e', light: '#abc364', spark: '#d0dc8a' },
  b: { ground: '#798461', deep: '#4d3d57', shade: '#746573', mist: '#959c7c', light: '#bdc798', spark: '#d5a77a' },
  c: { ground: '#81af73', deep: '#51435f', shade: '#648b79', mist: '#96c497', light: '#c0dfa5', spark: '#e5edbb' },
};

type Point = readonly [number, number];

const PUFF: readonly Point[] = [
  [-15, 6], [-18, 2], [-18, -3], [-15, -6], [-11, -6], [-11, -11],
  [-6, -15], [0, -15], [4, -12], [8, -12], [11, -8], [11, -4],
  [15, -4], [18, 0], [18, 5], [14, 9], [9, 9], [6, 13],
  [-1, 13], [-5, 11], [-10, 12], [-14, 10],
];
const INNER: readonly Point[] = [
  [-15, 1], [-12, -4], [-7, -4], [-7, -10], [-3, -12], [1, -11],
  [4, -7], [8, -7], [9, -1], [14, 1], [15, 5], [10, 8],
  [5, 7], [2, 10], [-4, 8], [-9, 9], [-13, 6],
];
const CURL: readonly Point[] = [
  [-11, -2], [-8, -7], [-3, -9], [2, -9], [5, -6], [5, -2],
  [3, 1], [-1, 1], [-2, -1], [1, -2], [1, -5], [-2, -6],
  [-6, -5], [-8, -1], [-7, 3], [-4, 6], [-7, 6], [-11, 2],
];

const LOBES = [
  { x: 40, y: 59, scale: 1.02, phase: 0.3, sway: -1 },
  { x: 84, y: 60, scale: 1.12, phase: 2.5, sway: 1 },
  { x: 53, y: 43, scale: 0.98, phase: 1.1, sway: -1 },
  { x: 76, y: 40, scale: 0.91, phase: 3.9, sway: 1 },
  { x: 65, y: 57, scale: 1.18, phase: 4.6, sway: 1 },
  { x: 34, y: 72, scale: 0.86, phase: 3.3, sway: -1 },
  { x: 93, y: 73, scale: 0.86, phase: 0.9, sway: 1 },
  { x: 63, y: 76, scale: 1.08, phase: 1.9, sway: -1 },
];

function pen(raw: RawPut, alpha: number): HdPut {
  return (x, y, color) => {
    if (color !== null) raw(Math.round(x), Math.round(y), color, alpha);
  };
}

function cloudShape(put: HdPut, points: readonly Point[], x: number, y: number, sx: number, sy: number, color: Paint) {
  poly(put, points.map(([px, py]) => [Math.round(x + px * sx), Math.round(y + py * sy)]), color);
}

export function drawPoisonSmoke(style: PoisonSmokeStyle, ageMs: number): HdDraw {
  return (_put, raw) => {
    if (ageMs <= 0 || ageMs >= 4000) return;
    const palette = PALETTES[style];
    const bloom = Math.min(1, ageMs / 250);
    const spread = 1 - Math.pow(1 - bloom, 3);
    const dissolve = Math.max(0, (ageMs - 3400) / 600);
    const alpha = Math.min(1, ageMs / 100) * (1 - dissolve);
    const time = ageMs / 1000;
    const lift = dissolve * 8;

    ellipse(pen(raw, alpha * 0.26), 64, 75, 51 * spread, 11 * spread, palette.ground);
    cloudShape(pen(raw, alpha * 0.32), [
      [-45, 0], [-37, -7], [-20, -9], [-10, -6], [9, -9], [31, -7],
      [44, -2], [48, 2], [36, 7], [17, 9], [-3, 8], [-18, 10], [-39, 6],
    ], 64, 75, spread, spread, palette.shade);

    for (const lobe of LOBES) {
      const billow = Math.sin(time * 2.6 + lobe.phase);
      const drift = Math.sin(time * 1.7 + lobe.phase);
      const x = Math.round(64 + (lobe.x - 64) * spread + drift * 1.5 * spread);
      const y = Math.round(76 + (lobe.y - 76) * spread - billow * 1.5 - lift);
      const sx = lobe.scale * (0.25 + 0.75 * spread) * (1 + billow * 0.045);
      const sy = sx * (lobe.y > 65 ? 0.65 : 0.94);
      cloudShape(pen(raw, alpha * 0.34), PUFF, x + 1, y + 2, sx, sy, palette.deep);
      cloudShape(pen(raw, alpha * 0.44), PUFF, x, y, sx, sy, palette.shade);
      cloudShape(pen(raw, alpha * 0.46), INNER, x, y, sx, sy, palette.mist);
      cloudShape(pen(raw, alpha * 0.52), CURL, x - lobe.sway, y, sx * 0.9, sy * 0.9, palette.light);
      cloudShape(pen(raw, alpha * 0.27), [
        [2, 4], [6, 1], [11, 2], [13, 5], [11, 8], [7, 9], [4, 7],
        [7, 7], [9, 5], [7, 4], [4, 5],
      ], x, y, sx, sy, palette.deep);
    }

    for (let i = 0; i < 5; i++) {
      const progress = (time * 0.34 + i * 0.197) % 1;
      const x = Math.round(64 + (i - 2) * 11 * spread + Math.sin(progress * 5 + i) * 3);
      const y = Math.round(64 - progress * 40 * spread - lift);
      const moteAlpha = Math.sin(progress * Math.PI) * alpha;
      const put = pen(raw, moteAlpha * (style === 'b' ? 0.75 : 0.46));
      rect(put, x, y, i % 2 === 0 ? 2 : 3, 2, palette.spark);
      rect(pen(raw, moteAlpha * 0.2), x - 2, y + 3, 3, 2, palette.light);
    }
  };
}
