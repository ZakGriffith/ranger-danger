import { ellipse, poly, rect, type HdDraw, type HdPut, type Paint, type RawPut } from './hd';

export const POISON_SMOKE_VARIANTS = 6;
export const POISON_SMOKE_FRAME_MS = 50;
export const POISON_SMOKE_GROUND_Y = 74;
export const POISON_SMOKE_RADIUS = 52;
export const POISON_SMOKE_DEPTH = 0.6;

type Point = readonly [number, number];

export type PoisonSmokePalette = Record<'ground' | 'deep' | 'shade' | 'mist' | 'light' | 'spark', `#${string}`>;


const PUFF: readonly Point[] = [
  [-15, 6], [-18, 2], [-18, -3], [-15, -6], [-11, -6], [-11, -11],
  [-6, -15], [0, -15], [4, -12], [8, -12], [11, -8], [11, -4],
  [15, -4], [18, 0], [18, 5], [14, 9], [9, 9], [6, 13],
  [-1, 13], [-5, 11], [-10, 12], [-14, 10],
];
const RAGGED_PUFF: readonly Point[] = [
  [-14, 10], [-12, 3], [-16, 0], [-10, -3], [-11, -10], [-6, -8],
  [-5, -18], [0, -13], [4, -20], [7, -10], [13, -13], [10, -5],
  [15, -2], [11, 3], [15, 8], [7, 10], [3, 15], [-3, 12], [-8, 15],
];
const TENDRIL: readonly Point[] = [
  [-8, 9], [-4, 4], [-6, -2], [-2, -8], [0, -15], [3, -18],
  [2, -9], [-1, -3], [2, 2], [0, 7], [-4, 11],
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

const GROUND_WISPS = [
  { x: 35, y: 87, sx: 1.15, sy: 0.85, phase: 0.4 },
  { x: 88, y: 88, sx: 1.3, sy: 0.88, phase: 2.1 },
  { x: 42, y: 105, sx: 1.2, sy: 0.8, phase: 3.7 },
  { x: 87, y: 105, sx: 1.15, sy: 0.8, phase: 5.3 },
  { x: 62, y: 102, sx: 1.3, sy: 0.85, phase: 1.6 },
  { x: 63, y: 117, sx: 1.0, sy: 0.62, phase: 4.4 },
];

function pen(raw: RawPut, alpha: number): HdPut {
  return (x, y, color) => {
    if (color !== null) raw(Math.round(x), Math.round(y), color, alpha);
  };
}

function cloudShape(put: HdPut, points: readonly Point[], x: number, y: number, sx: number, sy: number, color: Paint) {
  poly(put, points.map(([px, py]) => [Math.round(x + px * sx), Math.round(y + py * sy)]), color);
}

function groundHaze(raw: RawPut, alpha: number, spread: number, time: number, palette: PoisonSmokePalette, variant: number, plume: boolean) {
  const radius = POISON_SMOKE_RADIUS * spread;
  const groundPen = (opacity: number): HdPut => (x, y, color) => {
    const distance = Math.hypot(x - 64, (y - POISON_SMOKE_GROUND_Y) / POISON_SMOKE_DEPTH) / radius;
    if (color === null || distance >= 1) return;
    const edge = distance > 0.96 ? 0.55 : distance > 0.87 ? 0.8 : 1;
    raw(x, y, color, alpha * opacity * edge);
  };
  const contour: Point[] = Array.from({ length: 48 }, (_, i) => {
    const angle = i * Math.PI / 24;
    const scallop = 0.965 + 0.035 * Math.cos(angle * (plume ? 7 + variant % 3 : 9) + time * 0.5 + variant * (plume ? 1 : 0.2));
    return [Math.round(64 + Math.cos(angle) * radius * scallop),
      Math.round(POISON_SMOKE_GROUND_Y + Math.sin(angle) * radius * scallop * POISON_SMOKE_DEPTH)];
  });
  poly(groundPen(0.18), contour, palette.ground);
  for (const wisp of GROUND_WISPS) {
    const sway = Math.sin(time * 1.8 + wisp.phase + variant * (plume ? 1.3 : 0.15));
    const x = Math.round(64 + (wisp.x - 64 + sway * (plume ? 2 : 1) + Math.sin(wisp.phase + variant * 2) * (plume ? 5 : variant * 0.4)) * spread);
    const y = Math.round(POISON_SMOKE_GROUND_Y + (wisp.y - POISON_SMOKE_GROUND_Y + Math.cos(wisp.phase * 2 + variant) * (plume ? 6 : variant * 0.4)) * spread * POISON_SMOKE_DEPTH);
    const sx = wisp.sx * spread * (1 + sway * 0.04);
    const sy = wisp.sy * spread * POISON_SMOKE_DEPTH;
    cloudShape(groundPen(0.25), PUFF, x, y, sx, sy, palette.shade);
    cloudShape(groundPen(0.23), INNER, x, y, sx, sy, palette.mist);
    cloudShape(groundPen(0.26), CURL, x, y, sx * 0.9, sy * 0.9, palette.light);
  }
}

export function drawPoisonSmoke(ageMs: number, lifetimeMs: number, palette: PoisonSmokePalette, source: 'fog' | 'plume', variant: number): HdDraw {
  return (_put, raw) => {
    if (ageMs <= 0 || ageMs >= lifetimeMs) return;
    const bloom = Math.min(1, ageMs / 250);
    const spread = 1 - Math.pow(1 - bloom, 3);
    const dissolve = Math.max(0, (ageMs - lifetimeMs + 600) / 600);
    const alpha = Math.min(1, ageMs / 100) * (1 - dissolve);
    const plume = source === 'plume';
    const time = ageMs / 1000 * (plume ? 0.8 + variant * 0.08 : 1 + variant * 0.025);
    const lift = dissolve * 8;

    groundHaze(raw, alpha, spread, time, palette, variant, plume);
    ellipse(pen(raw, alpha * 0.26), 64, 75, 51 * spread, 11 * spread, palette.ground);
    cloudShape(pen(raw, alpha * 0.32), [
      [-45, 0], [-37, -7], [-20, -9], [-10, -6], [9, -9], [31, -7],
      [44, -2], [48, 2], [36, 7], [17, 9], [-3, 8], [-18, 10], [-39, 6],
    ], 64, 75, spread, spread, palette.shade);

    for (let i = 0; i < LOBES.length; i++) {
      const lobe = LOBES[i];
      if (plume && (i + variant) % 7 === 0) continue;
      const phase = lobe.phase + variant * (plume ? 1.7 : 0.2);
      const billow = Math.sin(time * 2.6 + phase);
      const drift = Math.sin(time * 1.7 + phase);
      const scatterX = Math.sin(i * 3.7 + variant * 2.1) * (plume ? 9 : variant * 0.6);
      const scatterY = Math.cos(i * 2.3 + variant * 1.9) * (plume ? 7 : variant * 0.6);
      const rise = plume ? ((time * 0.32 + i * 0.173 + variant * 0.11) % 1) : 0;
      const x = Math.round(64 + ((lobe.x - 64) * (plume ? 0.72 : 1) + scatterX) * spread + drift * (plume ? 4 : 1.5) * spread);
      const y = Math.round((plume ? POISON_SMOKE_GROUND_Y : 76) + ((lobe.y - 76) * (plume ? 0.25 : 1) + scatterY * (plume ? 0.6 : 1)) * spread - rise * 24 * spread - billow * (plume ? 1 : 1.5) - lift);
      const scale = lobe.scale * (plume ? 0.78 + 0.15 * Math.sin(i + variant * 2) : 1 + Math.sin(i + variant) * variant * 0.008) * (0.25 + 0.75 * spread);
      const sx = scale * (plume ? 0.8 - rise * 0.24 : 1) * (1 + billow * (plume ? 0.05 : 0.045));
      const sy = plume ? scale * (1.05 + rise * 0.18) : sx * (lobe.y > 65 ? 0.65 : 0.94);
      const opacity = alpha * (plume ? Math.sin(Math.PI * rise) : 1);
      const shape = plume ? RAGGED_PUFF : PUFF;
      cloudShape(pen(raw, opacity * 0.34), shape, x + 1, y + 2, sx, sy, palette.deep);
      cloudShape(pen(raw, opacity * 0.44), shape, x, y, sx, sy, palette.shade);
      cloudShape(pen(raw, opacity * 0.46), INNER, x, y, sx, sy, palette.mist);
      cloudShape(pen(raw, opacity * 0.52), plume ? TENDRIL : CURL, x - lobe.sway, y, sx * 0.9, sy * 0.9, palette.light);
      if (!plume) cloudShape(pen(raw, alpha * 0.27), [
        [2, 4], [6, 1], [11, 2], [13, 5], [11, 8], [7, 9], [4, 7],
        [7, 7], [9, 5], [7, 4], [4, 5],
      ], x, y, sx, sy, palette.deep);
    }

    for (let i = 0; i < 5; i++) {
      const progress = (time * (plume ? 0.48 : 0.34) + i * 0.197 + variant * 0.13) % 1;
      const x = Math.round(64 + (i - 2) * 11 * spread + Math.sin(progress * 5 + i) * 3);
      const y = Math.round(64 - progress * (plume ? 48 : 40) * spread - lift);
      const moteAlpha = Math.sin(progress * Math.PI) * alpha;
      const put = pen(raw, moteAlpha * 0.46);
      rect(put, x, y, i % 2 === 0 ? 2 : 3, 2, palette.spark);
      rect(pen(raw, moteAlpha * 0.2), x - 2, y + 3, 3, 2, palette.light);
    }
  };
}
