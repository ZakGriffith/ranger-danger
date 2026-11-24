import { shape, line, oval, wash } from '../forestEnemies/paint';
import type { HeavyArt, HeavyMotion as Action, Point } from './heavyMotion';

import { drawFungalMotion } from './fungalMotion';

const colors = { light: '#d4d59a', upper: '#a9b77c', middle: '#78855e', deep: '#44474b', armor: '#b9bf80', shade: '#646557', accent: '#b984b3', glow: '#ecd78b', toe: '#d2c697' };

function cap(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
  shape(ctx, wash(ctx, -30, 10, [[0, '#bd8ba5'], [.35, '#93647f'], [.7, '#69485f'], [1, '#44354b']]), 3, p => {
    p.moveTo(-47, -1); p.bezierCurveTo(-43, -17, -29, -31, -10, -32);
    p.bezierCurveTo(13, -43, 38, -25, 43, -10); p.lineTo(53, 0);
    p.quadraticCurveTo(40, 14, 16, 8); p.quadraticCurveTo(-1, 18, -16, 9); p.quadraticCurveTo(-35, 15, -47, -1);
  });
  shape(ctx, '#d9a2b1', 0, p => { p.moveTo(-38, -7); p.quadraticCurveTo(-26, -27, -8, -27); p.quadraticCurveTo(8, -35, 23, -24); p.lineTo(30, -15); p.quadraticCurveTo(12, -26, -5, -17); p.lineTo(-9, -21); p.quadraticCurveTo(-26, -17, -38, -7); });
  shape(ctx, '#ddd0a0', 2, p => { p.moveTo(-42, 1); p.quadraticCurveTo(-23, 5, -14, 0); p.quadraticCurveTo(3, 7, 18, 1); p.quadraticCurveTo(33, 6, 46, 0); p.lineTo(39, 9); p.quadraticCurveTo(13, 17, -15, 12); p.quadraticCurveTo(-34, 11, -42, 1); });
  for (let i = 0; i < 7; i++) {
    const x = -28 + i * 10;
    line(ctx, '#9a7b82', 1.2, p => { p.moveTo(x, 5); p.lineTo(x + 4, 11); });
  }
  for (const [x, y, r] of [[-23, -13, 4], [-4, -25, 5.5], [19, -19, 4.8], [35, -8, 3.2]]) {
    oval(ctx, x, y, r, r * .62, '#ead3ac', .1); oval(ctx, x - 1, y - 1, r * .5, r * .23, '#fff0c2');
  }
  ctx.restore();
}

function torso(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  shape(ctx, wash(ctx, -34, 42, [[0, '#d6d8a0'], [.32, '#aab87c'], [.68, '#7e8e61'], [1, '#48534b']]), 3.5, p => {
    p.moveTo(-35, -19); p.bezierCurveTo(-50, -42, -13, -43, 2, -30);
    p.bezierCurveTo(23, -41, 49, -27, 39, -5); p.quadraticCurveTo(50, 28, 25, 42);
    p.quadraticCurveTo(4, 49, -17, 40); p.quadraticCurveTo(-40, 34, -35, -19);
  });
  shape(ctx, '#e2e0ad', 0, p => { p.moveTo(-31, -20); p.quadraticCurveTo(-19, -34, -4, -24); p.lineTo(0, -16); p.lineTo(-8, -10); p.quadraticCurveTo(-23, -16, -29, -3); });
  shape(ctx, '#58684f', 0, p => { p.moveTo(-27, 12); p.quadraticCurveTo(-1, 26, 23, 9); p.lineTo(37, -1); p.quadraticCurveTo(42, 27, 21, 36); p.quadraticCurveTo(-6, 47, -25, 28); });
  shape(ctx, '#bcc58b', 0, p => { p.moveTo(-12, -2); p.quadraticCurveTo(6, -13, 24, -1); p.lineTo(31, 11); p.quadraticCurveTo(6, 9, -9, 18); p.lineTo(-17, 10); });
  line(ctx, '#6c795b', 2.2, p => { p.moveTo(-20, -1); p.quadraticCurveTo(-13, 3, -9, -2); p.moveTo(-14, 21); p.quadraticCurveTo(3, 28, 19, 20); p.moveTo(20, -12); p.quadraticCurveTo(25, -5, 22, 1); });
  for (const [px, py, r] of [[-23, 8, 6], [-18, 17, 4], [26, 23, 5]]) {
    oval(ctx, px, py, r, r * .72, '#8f6b95'); oval(ctx, px - 1, py - 1.5, r * .55, r * .3, '#cca4c0');
  }
  cap(ctx, -29, -23, .45, -.3); cap(ctx, 34, -20, .4, .4);
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, strain: number) {
  ctx.save(); ctx.translate(x - 14, y); ctx.rotate(tilt * .6);
  shape(ctx, wash(ctx, -18, 34, [[0, '#e0dda4'], [.4, '#bac68a'], [1, '#748361']]), 2.9, p => {
    p.moveTo(-15, -14); p.quadraticCurveTo(4, -26, 26, -14); p.lineTo(36, 1);
    p.quadraticCurveTo(45, 20, 28, 29); p.lineTo(6, 34); p.lineTo(-12, 25); p.lineTo(-19, 7);
  });
  shape(ctx, '#dfe3ac', 0, p => { p.moveTo(-10, -10); p.quadraticCurveTo(5, -20, 21, -10); p.lineTo(26, 0); p.lineTo(10, -4); p.lineTo(0, 0); p.lineTo(-8, -1); });
  for (const [ex, ey] of [[0, 0], [22, -2]]) {
    shape(ctx, '#48434c', 1.8, p => { p.moveTo(ex - 6, ey - 4); p.lineTo(ex + 7, ey - 5); p.lineTo(ex + 5, ey + 4); p.lineTo(ex - 4, ey + 5); });
    oval(ctx, ex + 2, ey, 3, 3.5, '#e6ce77'); oval(ctx, ex + 3, ey + .5, 1.4, 2.5, '#3c3b3c'); oval(ctx, ex + 1, ey - 1, .8, .8, '#fff0b6');
  }
  line(ctx, '#eef0bc', 3.2, p => { p.moveTo(-9, -8); p.lineTo(7, -5); p.moveTo(15, -6); p.lineTo(29, -11); });
  shape(ctx, '#49404a', 2, p => {
    p.moveTo(-1, 17); p.lineTo(7, 12); p.lineTo(17, 16); p.lineTo(31, 10); p.lineTo(30, 24 + strain * 3);
    p.lineTo(20, 27 + strain * 4); p.lineTo(12, 24); p.lineTo(5, 27); p.lineTo(1, 23);
  });
  shape(ctx, '#eee3b4', 0, p => { p.moveTo(4, 16); p.lineTo(10, 15); p.lineTo(8, 22); p.lineTo(5, 20); p.moveTo(14, 17); p.lineTo(19, 16); p.lineTo(18, 21); p.moveTo(24, 14); p.lineTo(29, 12); p.lineTo(27, 20); p.lineTo(25, 20); });
  line(ctx, '#9cab73', 2.4, p => { p.moveTo(-6, 17); p.quadraticCurveTo(-4, 27, 7, 30); });
  cap(ctx, -3, -19, 1, -.035);
  ctx.restore();
}

function fist(ctx: CanvasRenderingContext2D, at: Point, angle: number, far: boolean) {
  ctx.save(); ctx.translate(...at); ctx.rotate(angle); if (far) ctx.scale(.76, .76);
  shape(ctx, wash(ctx, -23, 17, [[0, '#d3d398'], [.4, '#a2b17a'], [1, '#5c6952']]), 3, p => {
    p.moveTo(-19, -7); p.quadraticCurveTo(-21, -25, -6, -24); p.lineTo(3, -20);
    p.quadraticCurveTo(15, -26, 18, -11); p.lineTo(23, -1); p.quadraticCurveTo(27, 14, 12, 18);
    p.lineTo(-9, 15); p.lineTo(-21, 4);
  });
  shape(ctx, '#e3dfac', 0, p => { p.moveTo(-15, -11); p.quadraticCurveTo(-12, -21, -5, -18); p.lineTo(6, -12); p.lineTo(5, -5); p.quadraticCurveTo(-6, -13, -15, -4); });
  for (const x of [-8, 1, 10]) line(ctx, '#667451', 1.6, p => { p.moveTo(x, 0); p.lineTo(x + 2, 10); });
  cap(ctx, -3, -14, .36, -.25);
  ctx.restore();
}

const art: HeavyArt = { palette: colors, height: -60, headRise: 8, stride: 6.5, kneeBend: 4,
  forearmWidth: 16, upperArmWidth: 17, handRestY: -20, windupElbow: [-48, -79], windupHand: [-39, -105], torso, head, fist,
  armDetail(ctx, _shoulder, elbow, _hand, turn) {
    cap(ctx, elbow[0] - 3, elbow[1] - 6, .31, turn);
  },
};
export function drawFungalBrute(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  drawFungalMotion(ctx, art, action, phase);
}

export const FUNGAL_BRUTE_PREFIX = 'eifb';
export const FUNGAL_BRUTE_ORIGIN_Y = 60 / 96;
export const FUNGAL_BRUTE_MOVE_FRAMES = Array.from({ length: 30 }, (_, i) => `move${i}`);
export const FUNGAL_BRUTE_ATTACK_FRAMES = Array.from({ length: 48 }, (_, i) => `atk${i}`);
export const FUNGAL_BRUTE_MOVE_FPS = 24;
export const FUNGAL_BRUTE_ATTACK_FPS = 30;
export const FUNGAL_BRUTE_IMPACT_FRAME = 21;
export const FUNGAL_BRUTE_FRAMES = ['idle', ...FUNGAL_BRUTE_MOVE_FRAMES, ...FUNGAL_BRUTE_ATTACK_FRAMES, 'hit'];

export function makeFungalBruteFrame(frame: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(48, 76); ctx.scale(.48, .48);
  const moving = frame.startsWith('move');
  const index = moving ? Number(frame.slice(4)) : frame.startsWith('atk') ? Number(frame.slice(3)) : 0;
  drawFungalBrute(ctx, moving ? 'move' : 'attack', index / (moving ? FUNGAL_BRUTE_MOVE_FRAMES.length : FUNGAL_BRUTE_ATTACK_FRAMES.length));
  if (frame === 'hit') {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 96, 96);
  }
  return canvas;
}
