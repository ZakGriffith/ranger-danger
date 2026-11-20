import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, ease, type CastleAction } from './pose';

const palettes = [
  { back: '#776952', flank: '#51493f', belly: '#a39477', shadow: '#302e30', hair: '#a79574', skin: '#977868' },
  { back: '#67656a', flank: '#42434a', belly: '#9c9690', shadow: '#2c2e36', hair: '#a6a19b', skin: '#947b77' },
  { back: '#8b7560', flank: '#665345', belly: '#b5a183', shadow: '#3a3031', hair: '#c0a582', skin: '#a1816e' },
] as const;
export const CASTLE_RAT_COUNT = palettes.length;
type RatPalette = typeof palettes[number];

function ratFoot(ctx: CanvasRenderingContext2D, x: number, y: number, skin: string, far: boolean) {
  line(ctx, far ? '#3a3132' : ink, 3.1, p => { p.moveTo(x - 2, y - 3); p.lineTo(x + 3, y); p.lineTo(x + 9, y + .4); });
  line(ctx, skin, 1.7, p => { p.moveTo(x - 1, y - 3); p.lineTo(x + 3, y - .5); p.lineTo(x + 9, y); });
  for (let i = 0; i < 3; i++) {
    line(ctx, far ? '#776559' : '#bdac90', .65, p => {
      p.moveTo(x + 3 + i * 1.6, y - .3); p.lineTo(x + 6 + i * 1.8, y + 1.3);
    });
  }
}

function ratLeg(ctx: CanvasRenderingContext2D, x: number, cycle: number, front: boolean, far: boolean, c: RatPalette) {
  const swing = Math.sin(cycle) * (front ? 8 : 11);
  const lift = Math.max(0, Math.cos(cycle)) * 5;
  const kneeX = x + (front ? -4 : 7) + swing * .35;
  const ankleX = x + swing;
  const y = front ? -18 : -20;
  line(ctx, far ? '#2d2b2d' : '#39352f', front ? 5.4 : 7.3, p => {
    p.moveTo(x, y); p.quadraticCurveTo(kneeX, -12 - lift, ankleX, -4 - lift);
  });
  line(ctx, far ? c.shadow : c.flank, front ? 3 : 4.7, p => {
    p.moveTo(x, y); p.quadraticCurveTo(kneeX, -12 - lift, ankleX, -4 - lift);
  });
  ratFoot(ctx, ankleX, -lift, far ? '#65534c' : c.skin, far);
}

function ratTail(ctx: CanvasRenderingContext2D, cycle: number, recoil: number, c: RatPalette) {
  const sway = Math.sin(cycle - .7) * 4;
  line(ctx, '#302c2d', 4.2, p => {
    p.moveTo(-28, -21); p.bezierCurveTo(-43, -17, -44, -4, -56, -5);
    p.quadraticCurveTo(-64, -5 + sway, -64, -12 + sway - recoil * 2);
  });
  line(ctx, c.skin, 2.4, p => {
    p.moveTo(-29, -21); p.bezierCurveTo(-43, -17, -44, -4, -56, -5);
    p.quadraticCurveTo(-64, -5 + sway, -64, -12 + sway - recoil * 2);
  });
  line(ctx, '#baa18a', .7, p => {
    p.moveTo(-32, -18); p.quadraticCurveTo(-40, -13, -42, -9);
    p.moveTo(-47, -6); p.quadraticCurveTo(-53, -4, -57, -5);
  });
  for (const [x, y, angle] of [[-34, -18, -.7], [-38, -14.5, -.6], [-42, -10, -.4], [-47, -6.5, -.1], [-52, -5, .15]]) {
    line(ctx, '#63534d', .7, p => { p.moveTo(x - Math.sin(angle), y - Math.cos(angle)); p.lineTo(x + Math.sin(angle), y + Math.cos(angle)); });
  }
}

function ratHead(ctx: CanvasRenderingContext2D, bite: number, c: RatPalette) {
  ctx.save(); ctx.translate(17 + bite * 4, -25 + bite * 2); ctx.rotate(-.06 - bite * .12);
  shape(ctx, wash(ctx, -10, 15, [[0, c.back], [.6, c.flank], [1, c.shadow]]), 1.7, p => {
    p.moveTo(-9, -7); p.quadraticCurveTo(2, -12, 12, -5);
    p.lineTo(22, 2); p.lineTo(33, 9); p.lineTo(33, 12); p.lineTo(23, 15);
    p.lineTo(16, 16); p.lineTo(8, 14); p.lineTo(-2, 10); p.lineTo(-9, 7);
  });
  shape(ctx, c.belly, 0, p => {
    p.moveTo(9, 7); p.quadraticCurveTo(19, 8, 30, 11); p.lineTo(23, 14); p.lineTo(15, 14);
    p.lineTo(7, 11); p.lineTo(3, 10);
  });
  shape(ctx, '#65534d', 1, p => {
    p.moveTo(-6, -4); p.quadraticCurveTo(-7, -13, -1, -15);
    p.quadraticCurveTo(5, -14, 5, -8); p.lineTo(1, -2); p.lineTo(-2, 0);
  });
  shape(ctx, c.skin, 0, p => {
    p.moveTo(-3, -5); p.quadraticCurveTo(-5, -10, -1, -12);
    p.quadraticCurveTo(2, -10, 1, -6); p.lineTo(-1, -3);
  });
  line(ctx, '#413936', .8, p => { p.moveTo(0, -11); p.quadraticCurveTo(-3, -9, -1, -5); });
  shape(ctx, c.flank, 0, p => { p.moveTo(-8, -1); p.lineTo(-3, -5); p.lineTo(-1, -2); p.lineTo(2, -4); p.lineTo(1, 2); p.lineTo(-5, 4); });
  oval(ctx, 11, -.7, 2.8, 1.9, c.shadow, -.2);
  oval(ctx, 11.4, -.7, 1.9, 1.5, '#171a1c', -.2);
  oval(ctx, 12, -1.3, .6, .45, '#c1b8a2');
  line(ctx, c.hair, .8, p => { p.moveTo(8, -3.2); p.lineTo(11, -3.9); p.lineTo(14, -2.6); });
  shape(ctx, '#65524e', 1, p => { p.moveTo(31, 8); p.lineTo(35, 9); p.lineTo(35, 11); p.lineTo(32, 12); p.lineTo(30, 11); });
  oval(ctx, 32, 8.9, 1.2, .6, '#b29480');
  ctx.save(); ctx.translate(16, 13); ctx.rotate(bite * .24);
  shape(ctx, c.belly, 1, p => { p.moveTo(-3, 0); p.lineTo(15, -1); p.lineTo(13, 3); p.lineTo(4, 4); });
  shape(ctx, '#d2b889', .6, p => { p.moveTo(10, -2); p.lineTo(13, -2); p.lineTo(12.5, 1.8); p.lineTo(10.5, 1); });
  ctx.restore();
  for (const [x, y, endX, endY] of [[25, 9, 43, 5], [25, 10, 45, 11], [23, 11, 40, 17], [21, 9, 34, 2]]) {
    line(ctx, '#b3ab9580', .6, p => { p.moveTo(x, y); p.quadraticCurveTo((x + endX) / 2, y - 1, endX, endY); });
  }
  for (const [x, y] of [[-4, 5], [1, 7], [6, 9], [2, 3]]) {
    line(ctx, c.hair, .65, p => { p.moveTo(x, y); p.lineTo(x + 2.5, y + .8); });
  }
  ctx.restore();
}

export function drawCastleRat(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number, variant: number) {
  const c = palettes[variant];
  const moving = action === 'move';
  const cycle = phase * TAU;
  const recoil = moving ? 0 : ease(.02, .26, phase) - ease(.3, .45, phase);
  const bite = moving ? 0 : ease(.28, .48, phase) - ease(.56, .95, phase);
  const gait = moving ? cycle : .2;
  const bounce = moving ? Math.cos(cycle * 2) * 1.25 : recoil * 2 - bite;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(bite * 5 - recoil * 3, bounce);
  ratTail(ctx, gait, recoil, c);
  ratLeg(ctx, -20, gait + Math.PI, false, true, c);
  ratLeg(ctx, 16, gait + .4, true, true, c);
  shape(ctx, wash(ctx, -48, -10, [[0, c.back], [.55, c.flank], [1, c.shadow]]), 1.8, p => {
    p.moveTo(-34, -20); p.quadraticCurveTo(-37, -33, -26, -43);
    p.lineTo(-20, -47); p.lineTo(-16, -45); p.lineTo(-13, -48); p.lineTo(-9, -46);
    p.lineTo(-6, -47); p.quadraticCurveTo(3, -43, 8, -37); p.lineTo(12, -38);
    p.lineTo(15, -33); p.lineTo(18, -34); p.quadraticCurveTo(29, -27, 24, -18);
    p.lineTo(17, -11); p.lineTo(7, -10); p.lineTo(-1, -13); p.lineTo(-13, -12);
    p.quadraticCurveTo(-27, -10, -34, -20);
  });
  shape(ctx, '#93866d', 0, p => {
    p.moveTo(-29, -30); p.quadraticCurveTo(-28, -42, -18, -43);
    p.quadraticCurveTo(-4, -42, 3, -34); p.lineTo(-4, -36); p.lineTo(-12, -39);
    p.lineTo(-19, -37); p.lineTo(-21, -38);
  });
  shape(ctx, c.belly, 0, p => {
    p.moveTo(-25, -18); p.quadraticCurveTo(-13, -19, -5, -16);
    p.lineTo(11, -15); p.lineTo(17, -12); p.lineTo(7, -11); p.lineTo(-2, -14); p.lineTo(-17, -12);
  });
  shape(ctx, wash(ctx, -34, -9, [[0, c.back], [1, c.flank]]), 1, p => {
    p.moveTo(-27, -30); p.quadraticCurveTo(-15, -38, -9, -29);
    p.quadraticCurveTo(-7, -18, -19, -10); p.lineTo(-28, -14); p.quadraticCurveTo(-32, -21, -27, -30);
  });
  for (const [x, y, length] of [[-28, -31, 6], [-22, -36, 5], [-18, -41, 4], [-10, -39, 5], [-6, -34, 5], [1, -32, 4], [7, -30, 5], [-26, -24, 5], [-18, -28, 6], [-14, -22, 5], [-8, -18, 3], [5, -22, 4], [12, -25, 4]]) {
    line(ctx, c.hair, .75, p => { p.moveTo(x, y); p.quadraticCurveTo(x + length * .5, y + .3, x + length, y + 2); });
    line(ctx, c.shadow, .65, p => { p.moveTo(x + 1, y + 2); p.lineTo(x + length, y + 3.5); });
  }
  ratLeg(ctx, -19, gait, false, false, c);
  ratLeg(ctx, 16, gait + Math.PI + .4, true, false, c);
  ratHead(ctx, bite, c);
  ctx.restore();
}
