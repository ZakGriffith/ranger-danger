import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

import type { ToadArtClip } from './paintedToad';
type Point = readonly [number, number];
const TAU = Math.PI * 2;
const skinLight = '#8b9caa';
const skin = '#616e82';
const skinDark = '#394453';
const gold = '#f4b964';

function unit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ease(from: number, to: number, phase: number) {
  const t = unit((phase - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function limb(ctx: CanvasRenderingContext2D, root: Point, joint: Point, toes: Point, width: number, far: boolean) {
  const [sx, sy] = root;
  const [jx, jy] = joint;
  const [tx, ty] = toes;
  const paint = far ? '#454654' : wash(ctx, sy - 10, ty + 3, [[0, skinLight], [.55, skin], [1, skinDark]]);
  shape(ctx, paint, far ? 2.2 : 2.9, p => {
    p.moveTo(sx - width * .56, sy + 3);
    p.bezierCurveTo(sx - width, sy - 10, sx + width * .49, sy - 10, sx + width * .65, sy - 2);
    p.quadraticCurveTo(jx + width, jy - 5, jx + width * .46, jy + 4);
    p.quadraticCurveTo(tx - 4, ty - 6, tx + 4, ty - 5);
    p.quadraticCurveTo(tx + 12, ty - 7, tx + 13, ty - 2);
    p.quadraticCurveTo(tx + 11, ty - .3, tx + 5, ty - .2);
    p.quadraticCurveTo(tx + 3, ty + 1, tx - 6, ty -.1);
    p.quadraticCurveTo(jx - width * .4, jy + 10, jx - width * .58, jy + 4);
    p.quadraticCurveTo(jx - width, jy - 4, sx - width * .56, sy + 3);
  });
  if (!far) {
    line(ctx, skinLight, 1.4, p => {
      p.moveTo(sx - 2, sy - 5);
      p.quadraticCurveTo(jx + 2, jy - 7, jx + 3, jy - 3);
    });
    line(ctx, '#333b48', 1.2, p => {
      p.moveTo(tx + 3, ty - 3); p.lineTo(tx + 4, ty - 1);
      p.moveTo(tx + 8, ty - 4); p.lineTo(tx + 9, ty - 1.4);
    });
  }
}

function gland(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, charge: number, far: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * (1 + charge * .35), size * (1 + charge * .42));
  const fill = wash(ctx, -20, 17, far
    ? [[0, '#b67b72'], [.5, '#7d505b'], [1, '#543d52']]
    : [[0, '#f1af96'], [.44, '#c17979'], [.8, '#9b5c6b'], [1, '#6b485f']]);
  shape(ctx, fill, far ? 2.35 : 2.85, p => {
    p.moveTo(-15, -10);
    p.bezierCurveTo(-12, -21, 5, -22, 14, -14);
    p.bezierCurveTo(26, -5, 21, 8, 11, 13);
    p.bezierCurveTo(0, 20, -19, 10, -16, -3);
    p.quadraticCurveTo(-17, -7, -15, -10);
  });
  line(ctx, far ? '#cf9989' : '#f6c2a0', 1.8, p => {
    p.moveTo(-10, -8);
    p.bezierCurveTo(-6, -17, 5, -16, 10, -12);
  });
  line(ctx, far ? '#6d4857' : '#8e5867', 1.15, p => {
    p.moveTo(-8, -1); p.quadraticCurveTo(-7, 5, 1, 9);
    p.moveTo(4, -3); p.quadraticCurveTo(10, 1, 8, 7);
    p.moveTo(-3, 4); p.lineTo(-.3, 2.5);
  });
  oval(ctx, 8, -9, 2.7, 1.3, '#efb694', .42);
  ctx.restore();
}

function face(ctx: CanvasRenderingContext2D, charge: number, release: number) {
  const jaw = release * 11;
  shape(ctx, '#586372', 2.2, p => p.ellipse(45, -44, 9, 10, .1, 0, TAU));
  oval(ctx, 48, -45, 4.7, 5.1, '#e9ad6b');
  oval(ctx, 50.5, -45, 1.7, 4, '#312b36');
  shape(ctx, wash(ctx, -57, -9, [[0, '#a1a9ae'], [.35, '#7b8b9b'], [.74, skin], [1, skinDark]]), 3.15, p => {
    p.moveTo(8, -24);
    p.bezierCurveTo(5, -39, 9, -56, 24, -57);
    p.bezierCurveTo(36, -58, 41, -49, 42, -43);
    p.quadraticCurveTo(55, -40, 59, -33);
    p.bezierCurveTo(65, -30, 62, -21, 58, -19);
    p.quadraticCurveTo(58, -12 + jaw * .32, 44, -12 + jaw * .52);
    p.bezierCurveTo(29, -8, 13, -12, 8, -24);
  });
  shape(ctx, '#a98172', 0, p => {
    p.moveTo(14, -23);
    p.quadraticCurveTo(28, -17, 44, -22);
    p.quadraticCurveTo(58, -25, 58, -20);
    p.quadraticCurveTo(54, -11 + jaw * .32, 45, -13 + jaw * .52);
    p.quadraticCurveTo(26, -11, 14, -23);
  });
  shape(ctx, '#3b2939', 1.8, p => {
    p.moveTo(16, -24);
    p.quadraticCurveTo(34, -19 - charge * 2, 59, -29);
    p.quadraticCurveTo(55, -23 + jaw, 44, -22 + jaw * .71);
    p.quadraticCurveTo(27, -19 + jaw * .46, 16, -24);
  });
  if (release > .14) oval(ctx, 51, -25 + jaw * .35, 5.3, 2.8, gold, -.12);
  shape(ctx, '#3e4858', 1.9, p => p.ellipse(26, -44, 10.5, 8, .25, 0, TAU));
  oval(ctx, 27.4, -43.6, 7.4, 5.9, gold, .17);
  oval(ctx, 30, -43.3, 2.2, 4.7, '#302934', .13);
  oval(ctx, 25.3, -45.7, 2, 1.25, '#fff0b4', -.15);
  line(ctx, '#abb5b7', 1.9, p => {
    p.moveTo(15, -47); p.quadraticCurveTo(21, -55, 30, -51);
    p.moveTo(42, -38); p.quadraticCurveTo(49, -38, 53, -34);
  });
  oval(ctx, 55.6, -32, 1.8, 1.35, ink, -.38);
}

export function drawVenomBellows(ctx: CanvasRenderingContext2D, motion: ToadArtClip, phase: number, demoTravel = false) {
  const attacking = motion === 'attack';
  const breath = motion === 'idle' ? .5 - .5 * Math.cos(TAU * phase) : 0;
  const moving = motion === 'move';
  const travel = unit((phase - .19) / .59);
  const hop = moving ? Math.sin(Math.PI * travel) : 0;
  const crouch = moving ? ease(.04, .16, phase) * (1 - ease(.16, .27, phase)) : 0;
  const land = moving ? ease(.73, .81, phase) * (1 - ease(.82, .97, phase)) : 0;
  const charge = attacking ? ease(.05, .45, phase) * (1 - ease(.45, .58, phase)) : .1 * breath;
  const release = attacking ? ease(.43, .53, phase) * (1 - ease(.53, .73, phase)) : 0;
  const footSweep = Math.sin(TAU * travel) * 10 * hop;

  ctx.save();
  ctx.translate((demoTravel ? hop * 7 : 0) + (attacking ? release * 6 - charge * 3 : 0), -18 * hop);
  ctx.scale(1 + crouch * .08 + land * .08, 1 - crouch * .12 - land * .12 + hop * .04 + breath * .022);
  ctx.rotate(hop * (travel - .44) * .21 - release * .085);
  ctx.lineCap = ctx.lineJoin = 'round';

  limb(ctx, [-22, -22], [-42, -13], [-34 + footSweep, -1], 13, true);
  limb(ctx, [24, -24], [29, -13], [40 - footSweep, -1], 8, true);
  gland(ctx, -37, -40, .81, charge, true);
  shape(ctx, wash(ctx, -51, 0, [[0, '#8f9ca8'], [.52, skin], [.82, '#4d566d'], [1, '#414455']]), 3.2, p => {
    p.moveTo(-51, -22);
    p.bezierCurveTo(-53, -37, -37, -51, -19, -47);
    p.quadraticCurveTo(-2, -50, 13, -43);
    p.bezierCurveTo(41, -50, 47, -28, 40, -17);
    p.quadraticCurveTo(36, -5, 13, -5);
    p.bezierCurveTo(-9, 0, -49, -4, -51, -22);
  });
  shape(ctx, '#b39281', 0, p => {
    p.moveTo(-30, -13); p.bezierCurveTo(-13, -20, -3, -9, 21, -21);
    p.quadraticCurveTo(35, -20, 35, -15);
    p.bezierCurveTo(27, -5, 10, -6, -4, -7); p.quadraticCurveTo(-24, -7, -30, -13);
  });
  limb(ctx, [-28, -22], [-43, -12], [-37 + footSweep, -1], 15, false);
  gland(ctx, -16, -40, 1, charge, false);
  for (const [x, y, r] of [[-47, -22, 2.8], [-33, -24, 3.2], [-21, -18, 2.4], [-5, -17, 1.9], [5, -27, 2.15]] as const) {
    oval(ctx, x, y, r + .55, r * .70 + .5, '#4d4b58');
    oval(ctx, x - .2, y - .5, r, r * .71, '#c7ab86');
  }
  limb(ctx, [18, -22], [23, -13], [29 - footSweep, -1], 8.4, false);
  face(ctx, charge, release);
  ctx.restore();
}
