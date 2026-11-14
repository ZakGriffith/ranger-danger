import type { MeadowEnemyPose } from '../meadowEnemies/pose';
import { line, oval, shape, wash } from './paint';

const ink = '#29252e';
const midnight = '#3c3a4c';
const shadow = '#505162';
const slate = '#6c7584';
const silver = '#a4acb0';
const frost = '#c2c6be';
const ivory = '#f4dfb9';

interface Paw {
  x: number;
  y: number;
}

function runningPaw(phase: number, center: number, reach: number, lift: number, ground: number): Paw {
  const cycle = phase % 1;
  const stance = .34;
  if (cycle < stance) return { x: center + reach * (1 - 2 * cycle / stance), y: ground };
  const swing = (cycle - stance) / (1 - stance);
  return { x: center - reach * Math.cos(Math.PI * swing), y: ground - lift * Math.sin(Math.PI * swing) };
}

function tail(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  shape(ctx, wash(ctx, -6, 22, [[0, slate], [.47, shadow], [1, midnight]]), 2.8, p => {
    p.moveTo(4, -2);
    p.bezierCurveTo(-3, -8, -11, -5, -18, 2);
    p.quadraticCurveTo(-23, 7, -32, 6);
    p.quadraticCurveTo(-30, 10, -26, 11);
    p.lineTo(-29, 13);
    p.quadraticCurveTo(-23, 16, -17, 14);
    p.lineTo(-18, 17);
    p.quadraticCurveTo(-11, 16, -7, 11);
    p.quadraticCurveTo(-1, 6, 4, 7);
  });
  shape(ctx, '#89939e', 0, p => {
    p.moveTo(0, -.8);
    p.quadraticCurveTo(-9, -4.9, -17, 4.4);
    p.quadraticCurveTo(-21, 7.2, -26, 7.8);
    p.quadraticCurveTo(-19, 10, -13, 5.2);
    p.lineTo(-14, 8);
    p.quadraticCurveTo(-8, 2.7, 0, -.8);
  });
  ctx.restore();
}

function leg(ctx: CanvasRenderingContext2D, x: number, y: number, paw: Paw, hind: boolean, far: boolean) {
  const jointX = x + (hind ? 5.5 : -.5) + (paw.x - x) * .29;
  const jointY = y + (paw.y - y) * .48;
  const hockX = x - 5 + (paw.x - x) * .52;
  const hockY = paw.y - 8;
  const upper = hind ? 8.5 : 6.5;
  const pawX = paw.x;
  const pawY = paw.y;
  const fur = far ? '#4b4b5d' : wash(ctx, y - 7, pawY, [[0, '#929da7'], [.42, slate], [.8, shadow], [1, midnight]]);
  shape(ctx, fur, far ? 2.05 : 2.5, p => {
    p.moveTo(x - upper, y);
    p.bezierCurveTo(x - upper - 1, y - 7, x + upper - 2, y - 11, x + upper, y - 2);
    p.quadraticCurveTo(x + upper + 2, y + 3, jointX + 4, jointY + 1);
    if (hind) {
      p.quadraticCurveTo(jointX + 3, jointY + 4, hockX + 3, hockY);
      p.quadraticCurveTo(hockX + 5, hockY + 2, pawX + 1, pawY - 5.2);
    } else {
      p.quadraticCurveTo(jointX + 3, jointY + 6, pawX + 1, pawY - 5.2);
    }
    p.quadraticCurveTo(pawX + 6, pawY - 5.3, pawX + 7, pawY - 2.4);
    p.quadraticCurveTo(pawX + 7.5, pawY + .1, pawX + 3, pawY);
    p.lineTo(pawX - 2, pawY);
    p.quadraticCurveTo(pawX - 5, pawY - .4, pawX - 4, pawY - 4.1);
    if (hind) {
      p.quadraticCurveTo(hockX - 3, hockY + 2, hockX - 3.5, hockY);
      p.quadraticCurveTo(hockX - 4, hockY - 4, jointX - 4, jointY + .9);
    } else {
      p.quadraticCurveTo(jointX - 6, jointY + 5, jointX - 5, jointY);
    }
    p.quadraticCurveTo(x - upper - 2, y + 4, x - upper, y);
  });
  if (!far) {
    shape(ctx, '#9fa9b1', 0, p => {
      p.moveTo(x - upper + 1.3, y - .6);
      p.quadraticCurveTo(x - upper + 2, y - 5.7, x + 3.4, y - 4.2);
      p.quadraticCurveTo(x + 1.4, y - 2, jointX - 1.5, jointY - 2.7);
      p.lineTo(jointX - 3.2, jointY - 4.8);
      p.quadraticCurveTo(x - upper + 3.4, y + 2.6, x - upper + 1.3, y - .6);
    });
    line(ctx, '#adaab3', 1, p => {
      p.moveTo(pawX + 1.9, pawY - 2.3);
      p.lineTo(pawX + 2.8, pawY - 1);
      p.moveTo(pawX + 4.6, pawY - 2.4);
      p.lineTo(pawX + 5.3, pawY - 1.1);
    });
  }
}

function torso(ctx: CanvasRenderingContext2D, hind: number, chest: number, bob: number, stretch: number) {
  ctx.save();
  ctx.translate(0, bob);
  shape(ctx, wash(ctx, -49, -12, [[0, silver], [.28, '#83919d'], [.57, slate], [1, '#484655']]), 3, p => {
    p.moveTo(hind - 10, -25);
    p.bezierCurveTo(hind - 16, -35, hind - 6, -42, hind + 4, -40);
    p.bezierCurveTo(-14, -41, -6, -36 + stretch, 2, -38);
    p.quadraticCurveTo(chest - 6, -40, chest + 1, -47);
    p.lineTo(chest + 1, -44);
    p.quadraticCurveTo(chest + 9, -49, chest + 13, -44);
    p.bezierCurveTo(chest + 19, -40, chest + 19, -26, chest + 11, -21);
    p.lineTo(chest + 10, -17);
    p.lineTo(chest + 6, -19);
    p.quadraticCurveTo(chest - 2, -13, 4, -18);
    p.bezierCurveTo(-7, -23 + stretch, -15, -16, hind - 2, -17);
    p.quadraticCurveTo(hind - 8, -19, hind - 10, -25);
  });
  shape(ctx, '#b5bbc0', 0, p => {
    p.moveTo(hind - 9, -31);
    p.bezierCurveTo(hind - 3, -41, -18, -38, -12, -37);
    p.quadraticCurveTo(-6, -35 + stretch, 1, -35);
    p.quadraticCurveTo(-6, -31 + stretch, -16, -33);
    p.lineTo(-14, -30);
    p.quadraticCurveTo(hind - 3, -34, hind - 9, -31);
  });
  shape(ctx, '#7c8795', 0, p => {
    p.moveTo(-10, -25);
    p.bezierCurveTo(-5, -27, 5, -24, chest - 2, -27);
    p.lineTo(chest + 3, -33);
    p.quadraticCurveTo(chest + 6, -29, chest + 4, -26);
    p.quadraticCurveTo(chest - 1, -19, 5, -20);
    p.quadraticCurveTo(-1, -23, -10, -25);
  });
  line(ctx, '#595b70', 1.3, p => {
    p.moveTo(-13, -30); p.quadraticCurveTo(-8, -29, -5, -29);
    p.moveTo(0, -30); p.quadraticCurveTo(5, -31, 8, -34);
  });
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, open: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shape(ctx, '#6b6d80', 2.3, p => {
    p.moveTo(-4, -9);
    p.quadraticCurveTo(-8, -16, -6, -22);
    p.quadraticCurveTo(-2, -24, 4, -14);
    p.lineTo(4, -8);
  });
  ctx.save();
  ctx.translate(0, 2.5);
  ctx.rotate(open * .67);
  shape(ctx, '#a4a3a0', 2.05, p => {
    p.moveTo(-5, -.5);
    p.quadraticCurveTo(4, -.4, 18, 1);
    p.quadraticCurveTo(17, 5, 12, 6);
    p.quadraticCurveTo(4, 8, -2, 4.7);
  });
  if (open > .19) {
    shape(ctx, '#643b4b', 0, p => {
      p.moveTo(-1, .7);
      p.quadraticCurveTo(6, -.2, 17, 1.6);
      p.quadraticCurveTo(11, 4.6, 3, 4.1);
      p.quadraticCurveTo(.2, 3.1, -1, .7);
    });
  }
  ctx.restore();
  shape(ctx, wash(ctx, -21, 12, [[0, silver], [.4, '#87929f'], [.66, slate], [1, '#55556b']]), 2.85, p => {
    p.moveTo(-19, 4);
    p.lineTo(-15, -1);
    p.lineTo(-20, -1);
    p.quadraticCurveTo(-13, -5, -12, -12);
    p.quadraticCurveTo(-17, -17, -17, -24);
    p.quadraticCurveTo(-17, -27, -14, -25);
    p.quadraticCurveTo(-8, -22, -5, -15);
    p.quadraticCurveTo(2, -17, 7, -12);
    p.quadraticCurveTo(10, -9, 11, -7);
    p.quadraticCurveTo(15, -6, 21, -4);
    p.quadraticCurveTo(25, -2, 22, 1.1);
    p.quadraticCurveTo(17, 4.2, 11, 3.5);
    p.quadraticCurveTo(5, 4.4, 2, 6.3);
    p.quadraticCurveTo(-5, 12, -11, 9);
    p.lineTo(-10, 6);
    p.lineTo(-16, 8);
    p.lineTo(-15, 4.9);
  });
  shape(ctx, '#777080', 1.1, p => {
    p.moveTo(-15, -22.7);
    p.quadraticCurveTo(-10.3, -21.1, -7.9, -15.2);
    p.quadraticCurveTo(-10.6, -15.8, -11.3, -12.6);
    p.quadraticCurveTo(-14.5, -17.5, -15, -22.7);
  });
  shape(ctx, wash(ctx, -8, 10, [[0, '#d6d4bc'], [.52, '#c0bfb3'], [1, '#9694a0']]), 0, p => {
    p.moveTo(3, -1);
    p.quadraticCurveTo(10, -7, 18, -4);
    p.quadraticCurveTo(23, -3, 21, .3);
    p.quadraticCurveTo(17, 3, 10, 2.5);
    p.quadraticCurveTo(2, 3.6, 0, 6.6);
    p.lineTo(-2, 6.1);
    p.quadraticCurveTo(-5, 10, -10, 8.1);
    p.lineTo(-7, 4);
    p.lineTo(-12, 5.6);
    p.quadraticCurveTo(-5.6, 2, -6.8, -.5);
    p.quadraticCurveTo(-3.2, 1.6, 3, -1);
  });
  if (open > .19) {
    shape(ctx, ivory, 1.05, p => {
      p.moveTo(13, 2.5);
      p.lineTo(17, 2.5);
      p.quadraticCurveTo(16.3, 5.7, 14.4, 7.1);
      p.quadraticCurveTo(13.6, 6.9, 13, 2.5);
    });
  }
  shape(ctx, ink, 0, p => {
    p.moveTo(18.2, -4.6);
    p.quadraticCurveTo(21, -5, 23.8, -2.8);
    p.quadraticCurveTo(25.1, -1.2, 22.2, 1.1);
    p.quadraticCurveTo(17.4, 1.6, 18.2, -4.6);
  });
  line(ctx, '#827d8e', 1.05, p => {
    p.moveTo(20, -3.25); p.quadraticCurveTo(21.4, -3.45, 22.1, -2.5);
    p.moveTo(10.5, -1.7); p.lineTo(11, -1.5);
    p.moveTo(13.8, -2.3); p.lineTo(14.3, -2.15);
  });
  shape(ctx, ink, 0, p => {
    p.moveTo(-3.7, -8.8);
    p.quadraticCurveTo(1.5, -8.3, 7.1, -10.3);
    p.quadraticCurveTo(7.7, -4.2, 3.2, -3.8);
    p.quadraticCurveTo(-1.3, -3.1, -3.7, -8.8);
  });
  shape(ctx, '#f5b64e', 0, p => {
    p.moveTo(-.5, -7.5);
    p.quadraticCurveTo(3.4, -7.4, 5.6, -8.6);
    p.quadraticCurveTo(6, -5, 3.1, -5);
    p.quadraticCurveTo(.7, -4.9, -.5, -7.5);
  });
  oval(ctx, 3.8, -6.7, 1.05, 1.3, ink, .17);
  oval(ctx, 3.1, -7.3, .53, .5, ivory);
  line(ctx, frost, 1.3, p => {
    p.moveTo(-9, -10.1); p.quadraticCurveTo(-4.2, -13.5, 1.3, -12.7);
    p.moveTo(-11.7, -6.6); p.quadraticCurveTo(-10.8, -9.2, -8.6, -9.6);
  });
  ctx.restore();
}

export function drawForestWolf(ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose) {
  const running = pose.mode === 'move';
  const { phase, anticipation, lunge, strike, recovery } = pose;
  const cycle = phase * Math.PI * 2;
  const stretch = running ? Math.cos(cycle) : lunge * 1.8 - anticipation;
  const bob = running ? Math.sin(cycle) * 2.7 : anticipation * 4 - lunge * 2 + recovery;
  const hind = -24 - stretch * 2 - anticipation * 2;
  const chest = 13 + stretch * 2 + lunge * 2 - anticipation * 2.5;

  const nearHind = running ? runningPaw(phase + .63, -25, 13, 12, 0)
    : { x: -26 - lunge * 12 + anticipation * 3, y: 0 };
  const farHind = running ? runningPaw(phase + .53, -22, 12, 10, -3.5)
    : { x: -19 - lunge * 5, y: -3.5 };
  const nearFront = running ? runningPaw(phase + .13, 17, 15, 13, 0)
    : { x: 17 + lunge * 16 - anticipation * 6, y: -lunge * 4 };
  const farFront = running ? runningPaw(phase, 20, 14, 12, -3.5)
    : { x: 24 + lunge * 8, y: -3.5 - anticipation * 2 };

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  tail(ctx, hind - 5, -33 + bob, running ? Math.sin(cycle - 1) * .14 : anticipation * -.19 + lunge * .17);
  leg(ctx, hind + 4, -26 + bob, farHind, true, true);
  leg(ctx, chest + 5, -29 + bob, farFront, false, true);
  torso(ctx, hind, chest, bob, stretch);
  leg(ctx, hind, -25 + bob, nearHind, true, false);
  leg(ctx, chest, -26 + bob, nearFront, false, false);
  head(ctx, chest + 12 + lunge * 4, -36 + bob - anticipation * 1.5,
    running ? -.065 + Math.sin(cycle + .7) * .075 : anticipation * -.14 + strike * .14,
    running ? 0 : anticipation * .78 + lunge * (1 - .8 * strike) + recovery * .12);
  ctx.restore();
}
