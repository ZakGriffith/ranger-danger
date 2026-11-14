import type { MeadowEnemyPose } from '../meadowEnemies/pose';
import { line, oval, shape, wash } from './paint';

type Point = readonly [x: number, y: number];
type Leg = readonly [root: Point, knee: Point, toe: Point];

const farLegs: readonly Leg[] = [
  [[-4, -22], [-32, -29], [-45, -8]],
  [[3, -24], [-14, -34], [-24, -8]],
  [[11, -24], [25, -31], [23, -7]],
  [[20, -21], [39, -23], [40, -6]],
];

const nearLegs: readonly Leg[] = [
  [[-5, -19], [-32, -19], [-47, -2]],
  [[2, -18], [-15, -14], [-27, 1]],
  [[10, -18], [20, -13], [15, 1]],
  [[19, -19], [35, -16], [41, -1]],
];

const ink = '#291f29';
const shellLight = '#afa1a0';
const shellShade = '#453042';
const secondaryEyes = [
  [1, -18.6, 1.8], [4.7, -23.1, 2], [10, -26.3, 1.9],
  [16.5, -26.5, 2.1], [22.7, -26, 1.85], [9.2, -18.1, 2.5],
] as const;

function normal([ax, ay]: Point, [bx, by]: Point): Point {
  const length = Math.hypot(bx - ax, by - ay);
  return [(by - ay) / length, (ax - bx) / length];
}

function drawLeg(ctx: CanvasRenderingContext2D, [root, knee, toe]: Leg, near: boolean) {
  const [rx, ry] = root;
  const [kx, ky] = knee;
  const [tx, ty] = toe;
  const [ux, uy] = normal(root, knee);
  const [lx, ly] = normal(knee, toe);
  const width = near ? 3.55 : 2.7;
  const chitin = near ? wash(ctx, Math.min(ry, ky) - width, ty, [
    [0, '#9b7d83'], [.27, '#785667'], [.59, '#573b51'], [1, '#3f2b40'],
  ]) : '#564451';

  shape(ctx, chitin, near ? 2.2 : 1.9, p => {
    p.moveTo(rx + ux * width, ry + uy * width);
    p.bezierCurveTo(
      rx + (kx - rx) * .45 + ux * width, ry + (ky - ry) * .45 + uy * width - 1,
      kx + ux * width, ky + uy * width,
      kx + (ux + lx) * 2.05, ky + (uy + ly) * 2.05,
    );
    p.quadraticCurveTo(kx + lx * 3.8, ky + ly * 3.8, kx + lx * 2.8 + (tx - kx) * .22, ky + ly * 2.8 + (ty - ky) * .22);
    p.quadraticCurveTo(kx + (tx - kx) * .62 + lx * 1.6, ky + (ty - ky) * .62 + ly * 1.6, tx + lx * .9, ty + ly * .9);
    p.quadraticCurveTo(tx + .9, ty + 1.1, tx - lx, ty - ly);
    p.quadraticCurveTo(kx + (tx - kx) * .5 - lx * 2.1, ky + (ty - ky) * .5 - ly * 2.1, kx - (ux + lx) * 1.6, ky - (uy + ly) * 1.6);
    p.quadraticCurveTo(rx + (kx - rx) * .49 - ux * width, ry + (ky - ry) * .49 - uy * width, rx - ux * width, ry - uy * width);
    p.quadraticCurveTo(rx - 3, ry, rx + ux * width, ry + uy * width);
  });
  line(ctx, near ? '#b49296' : '#877180', near ? 1.15 : .85, p => {
    p.moveTo(rx + (kx - rx) * .27, ry + (ky - ry) * .27 - 1.6);
    p.quadraticCurveTo(kx + (rx - kx) * .35, ky - 1.7, kx, ky - 1.55);
    p.moveTo(kx + (tx - kx) * .31, ky + (ty - ky) * .31 - .7);
    p.lineTo(kx + (tx - kx) * .55, ky + (ty - ky) * .55 - .5);
  });
}

function drawAbdomen(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shape(ctx, wash(ctx, -42, -9, [[0, '#917480'], [.31, '#79565f'], [.68, '#5a3a4b'], [1, '#422b3e']]), 2.8, p => {
    p.moveTo(-38, -28);
    p.bezierCurveTo(-37, -36, -29, -41, -18, -41);
    p.bezierCurveTo(-6, -42, 4, -34, 6, -26);
    p.bezierCurveTo(7, -21, 3, -14, -2, -12);
    p.bezierCurveTo(-12, -8, -23, -9, -30, -13);
    p.bezierCurveTo(-37, -17, -41, -23, -38, -28);
  });

  shape(ctx, '#533347', 0, p => {
    p.moveTo(-38, -26);
    p.bezierCurveTo(-34, -20, -28, -18, -22, -19);
    p.bezierCurveTo(-13, -18, -5, -21, 2, -27);
    p.quadraticCurveTo(7, -22, 2, -15);
    p.bezierCurveTo(-7, -8, -23, -9, -31, -14);
    p.quadraticCurveTo(-38, -18, -38, -26);
  });

  shape(ctx, wash(ctx, -38, -19, [[0, '#d98b61'], [.43, '#b96a58'], [1, '#844554']]), 0, p => {
    p.moveTo(-35, -30);
    p.quadraticCurveTo(-30, -32, -29, -36);
    p.quadraticCurveTo(-22, -39, -17, -36);
    p.bezierCurveTo(-7, -37, -4, -31, 1, -25);
    p.quadraticCurveTo(-6, -23, -9, -21);
    p.quadraticCurveTo(-12, -25, -16, -22);
    p.quadraticCurveTo(-19, -24, -22, -24);
    p.quadraticCurveTo(-25, -28, -29, -26);
    p.quadraticCurveTo(-31, -29, -35, -30);
  });
  shape(ctx, '#edac77', 0, p => {
    p.moveTo(-32, -32);
    p.bezierCurveTo(-29, -37, -21, -39, -15, -36);
    p.quadraticCurveTo(-23, -36, -25, -33);
    p.quadraticCurveTo(-29, -34, -32, -32);
  });
  line(ctx, '#7a4650', 1.4, p => {
    p.moveTo(-30, -31); p.bezierCurveTo(-24, -32, -16, -31, -8, -26);
    p.moveTo(-23, -31); p.lineTo(-21, -34);
    p.moveTo(-17, -30); p.quadraticCurveTo(-14, -31, -12, -33);
    p.moveTo(-17, -29); p.lineTo(-16, -26);
    p.moveTo(-11, -28); p.lineTo(-8, -30);
  });
  line(ctx, '#bd8b85', 1.1, p => {
    p.moveTo(-34, -23); p.quadraticCurveTo(-32, -20, -30, -20);
    p.moveTo(-29, -18.5); p.lineTo(-27.5, -18);
  });
  oval(ctx, -34, -28, 1.05, .7, '#dc9f8c', -.45);
  oval(ctx, -26, -16.5, 1.35, .62, '#8b606d', .3);
  oval(ctx, -21, -15.4, .85, .5, '#9b6b75', -.16);
  ctx.restore();
}

function drawFang(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, near: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  shape(ctx, near ? '#f0d4a6' : '#c69b83', 1.65, p => {
    p.moveTo(-3, -1.5);
    p.quadraticCurveTo(1.5, -4, 4, -.7);
    p.bezierCurveTo(5.4, 2.7, 3.3, 7.5, -.6, 9.8);
    p.quadraticCurveTo(1.3, 6.1, -.5, 4.5);
    p.quadraticCurveTo(-3.4, 3, -3, -1.5);
  });
  line(ctx, near ? '#fff0c8' : '#e4bf98', 1, p => {
    p.moveTo(.8, -.1); p.quadraticCurveTo(3.7, 2.5, 1.8, 5.9);
  });
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, gape: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const shell = wash(ctx, -30, -6, [[0, '#9b8d99'], [.29, '#77637e'], [.58, '#624862'], [1, '#423043']]);

  drawFang(ctx, 30.5 + gape * 4, -11 - gape * 2, -.45 - gape * .44, false);
  shape(ctx, shell, 2.5, p => {
    p.moveTo(-8, -19);
    p.bezierCurveTo(-8, -26, 0, -30.7, 10, -30);
    p.bezierCurveTo(20, -30.6, 24, -26, 25, -23);
    p.bezierCurveTo(31, -23, 34, -20, 34, -15);
    p.bezierCurveTo(35, -10, 30, -7, 24, -7.5);
    p.quadraticCurveTo(20, -7.5, 17, -9.5);
    p.bezierCurveTo(8, -6, -5, -9, -8, -19);
  });
  shape(ctx, shellShade, 0, p => {
    p.moveTo(-6, -17.5);
    p.quadraticCurveTo(1, -14, 6, -16);
    p.lineTo(7.5, -14);
    p.quadraticCurveTo(13, -15, 16, -17);
    p.bezierCurveTo(21, -20, 24, -18, 27, -16);
    p.quadraticCurveTo(28, -13, 32, -13);
    p.quadraticCurveTo(28, -6, 17, -10.3);
    p.bezierCurveTo(7, -6.6, -2, -10.3, -6, -17.5);
  });
  shape(ctx, '#aa939d', 0, p => {
    p.moveTo(-4.5, -21);
    p.bezierCurveTo(-1, -27, 10, -30, 17.5, -27);
    p.quadraticCurveTo(11, -26, 8, -23.3);
    p.lineTo(7, -25);
    p.quadraticCurveTo(1, -24, -4.5, -21);
  });
  line(ctx, shellLight, 1.05, p => {
    p.moveTo(.5, -24); p.quadraticCurveTo(4, -26.2, 6.5, -26.3);
    p.moveTo(-3.5, -17); p.quadraticCurveTo(-1.5, -14.4, 2, -13.3);
  });

  shape(ctx, '#533143', 1.7, p => {
    p.moveTo(19, -13);
    p.quadraticCurveTo(25, -15, 32.8, -13.6 - gape);
    p.quadraticCurveTo(34, -8.2 - gape, 28.6, -8 + gape * 1.4);
    p.quadraticCurveTo(23, -7.7 + gape * 2.6, 19, -13);
  });
  drawFang(ctx, 23 + gape * 3, -9.5 + gape * 1.2, -.12 - gape * .77, true);

  for (const [ex, ey, r] of secondaryEyes) {
    oval(ctx, ex, ey, r + .83, r + .62, ink, .17);
    oval(ctx, ex, ey, r, r * .87, '#d78b4e', .17);
    oval(ctx, ex + r * .25, ey + .23, r * .28, r * .54, '#703748', .12);
    oval(ctx, ex - r * .32, ey - r * .25, r * .37, r * .23, '#ffd992', -.4);
  }
  for (const [ex, ey, r] of [[18.5, -18.5, 4.4], [28.7, -19.4, 3.25]]) {
    oval(ctx, ex, ey, r + 1.05, r + .85, ink, .17);
    oval(ctx, ex, ey, r, r * .88, '#f4ad58', .17);
    oval(ctx, ex + .85, ey + .3, r * .33, r * .67, '#6a3541', .12);
    oval(ctx, ex - r * .31, ey - r * .31, r * .3, r * .22, '#ffde9a', -.4);
  }
  line(ctx, '#503040', 1.45, p => {
    p.moveTo(14.3, -22.1 - gape * .4);
    p.quadraticCurveTo(18.9, -23.8 - gape * .4, 22.4, -21.2 + gape * .8);
    p.moveTo(26.2, -22.8 + gape * .55);
    p.quadraticCurveTo(29.1, -24.6 - gape * .4, 31.8, -21.8);
  });
  ctx.restore();
}

function step(phase: number, offset: number): Point {
  const cycle = (phase + offset) % 1;
  const stance = .63;
  if (cycle < stance) return [4.8 - 9.6 * cycle / stance, 0];
  const swing = (cycle - stance) / (1 - stance);
  return [-4.8 + 9.6 * swing, Math.sin(Math.PI * swing) * 4.7];
}

export function drawForestSpider(ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose) {
  const { mode, phase, anticipation, lunge, strike, recovery } = pose;
  const moving = mode === 'move';
  const bob = moving ? -1.15 * Math.sin(phase * 4 * Math.PI) : 0;
  const bodyX = -4.7 * anticipation + 8.2 * lunge + 1.5 * recovery;
  const bodyY = bob - 4.8 * anticipation + 2.3 * lunge + 1.7 * recovery;

  const poseLeg = ([root, knee, toe]: Leg, index: number, near: boolean): Leg => {
    const front = index >= 2;
    const [swing, lift] = moving
      ? step(phase, index * .43 + (near ? 0 : .5))
      : front
        ? [-4 * anticipation + (index === 3 ? 15 : 8) * strike + 2 * recovery, (near ? 9 : 5) * anticipation + 2.3 * lunge]
        : [2 * lunge - 1.4 * anticipation, 0];
    return [
      [root[0] + bodyX, root[1] + bodyY],
      [knee[0] + bodyX * .45 + swing * .4, knee[1] + bodyY * .48 - lift * .52],
      [toe[0] + swing, toe[1] - lift],
    ];
  };

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  farLegs.forEach((leg, index) => drawLeg(ctx, poseLeg(leg, index, false), false));
  drawAbdomen(ctx, bodyX * .62, bob + 1.8 * anticipation - 1.4 * lunge, -.08 * anticipation + .075 * lunge);
  nearLegs.forEach((leg, index) => drawLeg(ctx, poseLeg(leg, index, true), true));
  drawFace(ctx, bodyX, bodyY, -.17 * anticipation + .13 * lunge, Math.max(.7 * anticipation, lunge, strike));
  ctx.restore();
}
