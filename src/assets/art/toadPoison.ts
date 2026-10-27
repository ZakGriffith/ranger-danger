import { ellipse, poly, rect, type HdDraw, type HdPut, type Paint, type RawPut } from './hd';

export const TOAD_BOMB_FRAMES = Array.from({ length: 8 }, (_, frame) => frame);
export const TOAD_SMOKE_FRAMES = Array.from({ length: 80 }, (_, frame) => frame);
export const TOAD_BOMB_FRAME_MS = 75;
export const TOAD_SMOKE_FRAME_MS = 50;
export const TOAD_SMOKE_GROUND_Y = 74;
export const TOAD_SMOKE_RADIUS = 52;
export const TOAD_SMOKE_DEPTH = 0.6;

type Point = readonly [number, number];
type Pen = { put: HdPut; angle: number };

const C = {
  edge: '#322c3b',
  huskDark: '#443f4d', husk: '#61586b', huskLight: '#82738a',
  plum: '#836c86', plumLight: '#a38ca1',
  venomDark: '#465743', venom: '#729257', venomLight: '#adc976', core: '#d9e994',
} as const;

function polygon(pen: Pen, points: readonly Point[], color: Paint) {
  const c = Math.cos(pen.angle), s = Math.sin(pen.angle);
  poly(pen.put, points.map(([x, y]) => {
    const dx = x - 16, dy = y - 16;
    return [16 + dx * c - dy * s, 16 + dx * s + dy * c] as Point;
  }), color);
}

function oval(pen: Pen, x: number, y: number, rx: number, ry: number, color: Paint) {
  polygon(pen, Array.from({ length: 16 }, (_, i) => {
    const a = i * Math.PI / 8;
    return [x + Math.cos(a) * rx, y + Math.sin(a) * ry] as Point;
  }), color);
}

function blightBomb(pen: Pen) {
  polygon(pen, [[12,9],[11,7],[14,8],[15,7],[16,10],[20,9],[23,12],[24,17],[22,21],[18,24],[13,23],[9,20],[8,16],[9,12]], C.edge);
  polygon(pen, [[12,10],[16,10],[19,10],[22,12],[23,16],[21,20],[17,23],[13,22],[10,19],[9,15],[10,12]], C.venomDark);
  polygon(pen, [[11,12],[16,11],[20,12],[22,15],[21,19],[17,22],[13,20],[10,17]], C.venom);
  polygon(pen, [[14,12],[17,12],[18,16],[21,17],[20,19],[16,18],[14,21],[12,20],[15,16]], C.venomLight);
  polygon(pen, [[15,13],[17,13],[17,16],[19,17],[18,18],[16,17],[15,19],[14,19],[15,16]], C.core);
  polygon(pen, [[10,12],[13,10],[16,10],[15,13],[13,15],[10,15]], C.husk);
  polygon(pen, [[10,12],[13,10],[15,10],[14,12],[12,13],[10,13]], C.huskLight);
  polygon(pen, [[18,10],[21,11],[23,14],[22,17],[19,15]], C.huskDark);
  polygon(pen, [[18,10],[21,11],[22,13],[20,14],[19,13]], C.husk);
  polygon(pen, [[9,16],[12,17],[14,19],[12,22],[10,20]], C.huskDark);
  polygon(pen, [[10,16],[12,17],[13,19],[11,19]], C.husk);
  polygon(pen, [[16,20],[19,20],[21,18],[22,19],[20,22],[17,23],[14,22]], C.huskDark);
  polygon(pen, [[17,20],[19,20],[20,21],[17,22],[15,21]], C.husk);
  oval(pen, 19.5, 12.5, 1.1, 1, C.plumLight);
  polygon(pen, [[12,8],[13,8],[15,11],[13,11]], C.plum);
}

export function drawToadBomb(frame: number): HdDraw {
  return put => blightBomb({ put, angle: frame * Math.PI / 4 });
}

const SMOKE = {
  ground: '#61753c', deep: '#3b4433', shade: '#586a3c',
  mist: '#81964e', light: '#abc364', spark: '#d0dc8a',
} as const;

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

function groundHaze(raw: RawPut, alpha: number, spread: number, time: number) {
  const radius = TOAD_SMOKE_RADIUS * spread;
  const groundPen = (opacity: number): HdPut => (x, y, color) => {
    const distance = Math.hypot(x - 64, (y - TOAD_SMOKE_GROUND_Y) / TOAD_SMOKE_DEPTH) / radius;
    if (color === null || distance >= 1) return;
    const edge = distance > 0.96 ? 0.55 : distance > 0.87 ? 0.8 : 1;
    raw(x, y, color, alpha * opacity * edge);
  };
  const contour: Point[] = Array.from({ length: 48 }, (_, i) => {
    const angle = i * Math.PI / 24;
    const scallop = 0.965 + 0.035 * Math.cos(angle * 9 + time * 0.5);
    return [Math.round(64 + Math.cos(angle) * radius * scallop),
      Math.round(TOAD_SMOKE_GROUND_Y + Math.sin(angle) * radius * scallop * TOAD_SMOKE_DEPTH)];
  });
  poly(groundPen(0.18), contour, SMOKE.ground);
  for (const wisp of GROUND_WISPS) {
    const sway = Math.sin(time * 1.8 + wisp.phase);
    const x = Math.round(64 + (wisp.x - 64 + sway) * spread);
    const y = Math.round(TOAD_SMOKE_GROUND_Y + (wisp.y - TOAD_SMOKE_GROUND_Y) * spread * TOAD_SMOKE_DEPTH);
    const sx = wisp.sx * spread * (1 + sway * 0.04);
    const sy = wisp.sy * spread * TOAD_SMOKE_DEPTH;
    cloudShape(groundPen(0.25), PUFF, x, y, sx, sy, SMOKE.shade);
    cloudShape(groundPen(0.23), INNER, x, y, sx, sy, SMOKE.mist);
    cloudShape(groundPen(0.26), CURL, x, y, sx * 0.9, sy * 0.9, SMOKE.light);
  }
}

export function drawToadSmoke(ageMs: number, lifetimeMs: number): HdDraw {
  return (_put, raw) => {
    if (ageMs <= 0 || ageMs >= lifetimeMs) return;
    const bloom = Math.min(1, ageMs / 250);
    const spread = 1 - Math.pow(1 - bloom, 3);
    const dissolve = Math.max(0, (ageMs - lifetimeMs + 600) / 600);
    const alpha = Math.min(1, ageMs / 100) * (1 - dissolve);
    const time = ageMs / 1000;
    const lift = dissolve * 8;

    groundHaze(raw, alpha, spread, time);
    ellipse(pen(raw, alpha * 0.26), 64, 75, 51 * spread, 11 * spread, SMOKE.ground);
    cloudShape(pen(raw, alpha * 0.32), [
      [-45, 0], [-37, -7], [-20, -9], [-10, -6], [9, -9], [31, -7],
      [44, -2], [48, 2], [36, 7], [17, 9], [-3, 8], [-18, 10], [-39, 6],
    ], 64, 75, spread, spread, SMOKE.shade);

    for (const lobe of LOBES) {
      const billow = Math.sin(time * 2.6 + lobe.phase);
      const drift = Math.sin(time * 1.7 + lobe.phase);
      const x = Math.round(64 + (lobe.x - 64) * spread + drift * 1.5 * spread);
      const y = Math.round(76 + (lobe.y - 76) * spread - billow * 1.5 - lift);
      const sx = lobe.scale * (0.25 + 0.75 * spread) * (1 + billow * 0.045);
      const sy = sx * (lobe.y > 65 ? 0.65 : 0.94);
      cloudShape(pen(raw, alpha * 0.34), PUFF, x + 1, y + 2, sx, sy, SMOKE.deep);
      cloudShape(pen(raw, alpha * 0.44), PUFF, x, y, sx, sy, SMOKE.shade);
      cloudShape(pen(raw, alpha * 0.46), INNER, x, y, sx, sy, SMOKE.mist);
      cloudShape(pen(raw, alpha * 0.52), CURL, x - lobe.sway, y, sx * 0.9, sy * 0.9, SMOKE.light);
      cloudShape(pen(raw, alpha * 0.27), [
        [2, 4], [6, 1], [11, 2], [13, 5], [11, 8], [7, 9], [4, 7],
        [7, 7], [9, 5], [7, 4], [4, 5],
      ], x, y, sx, sy, SMOKE.deep);
    }

    for (let i = 0; i < 5; i++) {
      const progress = (time * 0.34 + i * 0.197) % 1;
      const x = Math.round(64 + (i - 2) * 11 * spread + Math.sin(progress * 5 + i) * 3);
      const y = Math.round(64 - progress * 40 * spread - lift);
      const moteAlpha = Math.sin(progress * Math.PI) * alpha;
      const put = pen(raw, moteAlpha * 0.46);
      rect(put, x, y, i % 2 === 0 ? 2 : 3, 2, SMOKE.spark);
      rect(pen(raw, moteAlpha * 0.2), x - 2, y + 3, 3, 2, SMOKE.light);
    }
  };
}
