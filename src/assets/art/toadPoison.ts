import { drawPoisonSmoke, type PoisonSmokePalette } from './poisonSmoke';
import { poly, type HdDraw, type HdPut, type Paint } from './hd';
import { oval as paintOval, shape, wash } from './forestEnemies/paint';

export const TOAD_BOMB_FRAMES = Array.from({ length: 8 }, (_, frame) => frame);
export const TOAD_SMOKE_FRAMES = Array.from({ length: 80 }, (_, frame) => frame);
export const TOAD_BOMB_FRAME_MS = 75;

const VENOM_COLORS = [
  { light: '#e7f3a0', body: '#b8cc59', base: '#708741' },
  { light: '#f0f5b4', body: '#aebf67', base: '#527653' },
] as const;

export const TOAD_VENOM_TRAIL = [
  [0xb8cc59, 0x879c48, 0xd6e581],
  [0xa8bd6b, 0x83a163, 0xbdd485],
] as const;

export function toadBombTextureKey(variant: number, frame: number): string {
  return `toad_bomb_${variant}_${frame}`;
}

export function makeToadVenomFrame(frame: number, variant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const { light, body, base } = VENOM_COLORS[variant];
  const turn = frame * Math.PI * 2 / TOAD_BOMB_FRAMES.length;
  const wobble = Math.sin(turn * 2);
  ctx.translate(16, 16);
  ctx.lineCap = ctx.lineJoin = 'round';
  shape(ctx, wash(ctx, -8, 8, [[0, light], [.45, body], [1, base]]), 2.5, p => {
    p.moveTo(-9, 1);
    p.quadraticCurveTo(-8, -7, -1, -7 + wobble);
    p.bezierCurveTo(6, -9, 11 - wobble, -4, 10, 2);
    p.bezierCurveTo(9, 8 + wobble, 2, 9, -3, 7);
    p.quadraticCurveTo(-9, 6, -9, 1);
  });
  paintOval(ctx, -2 + Math.cos(turn) * 2.4, -3 + Math.sin(turn) * 1.1, 3.4, 1.45, light, -.27);
  paintOval(ctx, 4 - Math.cos(turn) * 1.6, 2, 1.7, 1.35, body, .25);
  return canvas;
}

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

const SMOKE_PALETTES: readonly PoisonSmokePalette[] = [
  { ground: '#61753c', deep: '#3b4433', shade: '#586a3c', mist: '#81964e', light: '#abc364', spark: '#d0dc8a' },
  { ground: '#607844', deep: '#394638', shade: '#566e45', mist: '#7f9b59', light: '#a8c670', spark: '#cddd96' },
  { ground: '#68763d', deep: '#414634', shade: '#606d3e', mist: '#8b9950', light: '#b7c666', spark: '#dce08e' },
  { ground: '#5b713d', deep: '#374234', shade: '#52663e', mist: '#799152', light: '#a1bd69', spark: '#c7d58e' },
  { ground: '#687e43', deep: '#3f4837', shade: '#5e7243', mist: '#8a9f57', light: '#b4ca6e', spark: '#d8e294' },
  { ground: '#617445', deep: '#3b4439', shade: '#586948', mist: '#81955d', light: '#acc174', spark: '#d0da9c' },
];

export function drawToadSmoke(ageMs: number, lifetimeMs: number, variant = 0): HdDraw {
  return drawPoisonSmoke(ageMs, lifetimeMs, SMOKE_PALETTES[variant], 'fog', variant);
}
