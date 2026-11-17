import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { meadowEnemyPose, type MeadowEnemyPose } from '../../src/assets/art/meadowEnemies/pose';

type Point = readonly [x: number, y: number];
type Leg = readonly [root: Point, knee: Point, foot: Point];
type RunnerPalette = {
  dark: string;
  shade: string;
  middle: string;
  light: string;
  edge: string;
  eye: string;
  spark: string;
  fang: string;
  fangShade: string;
};

const lantern: RunnerPalette = {
  dark: '#3c263c', shade: '#583750', middle: '#85526d', light: '#ae7492', edge: '#d28da4',
  eye: '#f5b95c', spark: '#fff0b5', fang: '#f5d6b2', fangShade: '#bd8581',
};
const bone: RunnerPalette = {
  dark: '#283443', shade: '#435368', middle: '#687e89', light: '#a1b0aa', edge: '#cbd4bd',
  eye: '#94edcb', spark: '#d8ffe1', fang: '#eee4c1', fangShade: '#9fa993',
};
const briar: RunnerPalette = {
  dark: '#362c31', shade: '#56423e', middle: '#806449', light: '#a38d5e', edge: '#d3b983',
  eye: '#d1e36a', spark: '#f7ffd4', fang: '#dcc49c', fangShade: '#a38368',
};

const lanternLegs: readonly Leg[] = [
  [[-14, -26], [-38, -23], [-53, -1]],
  [[-8, -27], [-22, -17], [-28, 0]],
  [[2, -26], [15, -14], [10, 0]],
  [[14, -24], [37, -18], [47, -1]],
];
const boneLegs: readonly Leg[] = [
  [[-17, -31], [-42, -35], [-56, -1]],
  [[-8, -34], [-23, -39], [-32, 0]],
  [[5, -32], [20, -40], [24, 0]],
  [[13, -28], [42, -33], [52, -1]],
];
const briarLegs: readonly Leg[] = [
  [[-17, -18], [-40, -19], [-54, -1]],
  [[-10, -23], [-26, -12], [-35, 0]],
  [[1, -21], [14, -9], [24, 0]],
  [[14, -21], [39, -15], [48, -1]],
];

function colors(ctx: CanvasRenderingContext2D, pal: RunnerPalette, y: number, end: number) {
  return wash(ctx, y, end, [[0, pal.light], [.32, pal.middle], [.72, pal.shade], [1, pal.dark]]);
}

function vector(a: Point, b: Point): Point {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[1] - a[1]) / len, (a[0] - b[0]) / len];
}

function legPose(leg: Leg, near: boolean, index: number, pose: MeadowEnemyPose, bodyX: number, bodyY: number): Leg {
  const [root, knee, foot] = leg;
  const far = near ? 0 : 1;
  const phase = (pose.phase + .5 * ((index + far) % 2) + index * .035) % 1;
  const stance = .57;
  const airborne = phase < stance ? 0 : (phase - stance) / (1 - stance);
  const walking = pose.mode === 'move';
  const stride = walking ? (phase < stance ? 8 - phase * 16 / stance : -8 + airborne * 16) : 0;
  const lift = walking ? Math.sin(airborne * Math.PI) * 8 : (index >= 2 ? 11 * pose.anticipation + 4 * pose.recovery : 0);
  const reach = index >= 2 ? 17 * pose.lunge - 5.5 * pose.anticipation : -3.5 * pose.lunge;
  const farKnee = index < 2 ? -4 : 3;
  return [
    [root[0] + bodyX, root[1] + bodyY - far * 3],
    [knee[0] + bodyX * .55 + stride * .33 + reach * .45 + far * farKnee, knee[1] + bodyY * .39 - lift * .44 - far * 8],
    [foot[0] + stride + reach + far * (index < 2 ? -2 : 3), foot[1] - lift - far * 6],
  ];
}

function paintLeg(ctx: CanvasRenderingContext2D, [root, knee, foot]: Leg, pal: RunnerPalette, near: boolean, thickness: number) {
  const [rx, ry] = root;
  const [kx, ky] = knee;
  const [fx, fy] = foot;
  const [ux, uy] = vector(root, knee);
  const [vx, vy] = vector(knee, foot);
  const width = thickness * (near ? 3.7 : 2.8);
  const bend = width * .47;
  const fill = near ? colors(ctx, pal, Math.min(ry, ky) - width, fy + 1) : pal.shade;
  shape(ctx, fill, near ? 2.1 : 1.8, p => {
    p.moveTo(rx + ux * width, ry + uy * width);
    p.quadraticCurveTo((rx + kx) * .54 + ux * width, (ry + ky) * .5 + uy * width, kx + (ux + vx) * bend, ky + (uy + vy) * bend);
    p.quadraticCurveTo(kx + vx * width, ky + vy * width, kx + (fx - kx) * .43 + vx * width * .62, ky + (fy - ky) * .43 + vy * width * .62);
    p.quadraticCurveTo(fx + vx * .9, fy + vy * .9, fx + 1.05, fy - .05);
    p.quadraticCurveTo(fx - vx * 1.8, fy - vy * 1.8, kx + (fx - kx) * .45 - vx * width * .6, ky + (fy - ky) * .45 - vy * width * .6);
    p.quadraticCurveTo(kx - vx * width, ky - vy * width, kx - (ux + vx) * bend, ky - (uy + vy) * bend);
    p.quadraticCurveTo((rx + kx) * .5 - ux * width, (ry + ky) * .5 - uy * width, rx - ux * width, ry - uy * width);
  });
  line(ctx, near ? pal.edge : pal.middle, near ? 1.12 : .85, p => {
    p.moveTo(rx + (kx - rx) * .34, ry + (ky - ry) * .34 - 1.05);
    p.quadraticCurveTo((rx + kx) * .5, (ry + ky) * .5 - 1.3, kx, ky - 1.65);
    p.moveTo(kx + (fx - kx) * .22, ky + (fy - ky) * .22 - .62);
    p.lineTo(kx + (fx - kx) * .51, ky + (fy - ky) * .51 - .66);
  });
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pal: RunnerPalette, tilt = -.17) {
  oval(ctx, x, y, r + .94, r * .8 + .85, '#28212d', tilt);
  oval(ctx, x, y, r, r * .8, pal.eye, tilt);
  oval(ctx, x + r * .3, y + .15, r * .29, r * .54, pal.dark, tilt);
  oval(ctx, x - r * .29, y - r * .23, r * .34, r * .22, pal.spark, tilt);
}

function fang(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number, length: number, pal: RunnerPalette, near: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  const tooth = near ? pal.fang : pal.fangShade;
  shape(ctx, wash(ctx, -3, 8, [[0, tooth], [1, pal.fangShade]]), 1.65, p => {
    p.moveTo(-2, -3.6);
    p.bezierCurveTo(length * .5, -5.2, length * .96, -2.5, length, 1.1);
    p.quadraticCurveTo(length * .92, 4.8, length * .6, 7.4);
    p.quadraticCurveTo(length * .76, 2.6, length * .48, 2.8);
    p.quadraticCurveTo(.4, 5.9, -2, 2.9);
  });
  line(ctx, near ? '#fbecd0' : pal.light, .92, p => {
    p.moveTo(1, -2); p.quadraticCurveTo(length * .59, -3, length * .8, .32);
  });
  ctx.restore();
}

function blister(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  oval(ctx, x, y + .65, r + 1.4, r * .82 + 1, '#592b40', -.38);
  oval(ctx, x, y, r, r * .8, wash(ctx, y - r, y + r, [[0, '#ffc791'], [.44, '#e87376'], [1, '#923952']]), -.38);
  oval(ctx, x - r * .29, y - r * .35, r * .4, r * .18, '#ffe0ad', -.46);
  oval(ctx, x + r * .39, y + r * .25, r * .23, r * .15, '#bc495f', -.39);
}

function lanternBack(ctx: CanvasRenderingContext2D, flutter: number) {
  ctx.save();
  ctx.translate(-10, -27);
  ctx.scale(1 - flutter * .018, 1 + flutter * .04);
  shape(ctx, colors(ctx, lantern, -36, 16), 2.7, p => {
    p.moveTo(-38, 1);
    p.bezierCurveTo(-44, -16, -34, -32, -15, -35);
    p.bezierCurveTo(-2, -38, 12, -31, 20, -18);
    p.bezierCurveTo(27, -5, 23, 8, 10, 13);
    p.bezierCurveTo(-11, 20, -34, 13, -38, 1);
  });
  shape(ctx, '#5b3855', 0, p => {
    p.moveTo(-37, -7); p.bezierCurveTo(-28, 4, -7, 11, 9, 2);
    p.quadraticCurveTo(20, -2, 23, -11); p.bezierCurveTo(29, 12, 3, 18, -13, 13);
    p.quadraticCurveTo(-35, 11, -37, -7);
  });
  shape(ctx, wash(ctx, -32, -3, [[0, '#e39d7e'], [.38, '#b75e70'], [1, '#693555']]), 1.1, p => {
    p.moveTo(-34, -12);
    p.bezierCurveTo(-32, -25, -19, -32, -12, -30);
    p.bezierCurveTo(-4, -33, 7, -24, 13, -17);
    p.quadraticCurveTo(6, -12, 4, -7);
    p.bezierCurveTo(-2, -11, -4, -2, -10, -5);
    p.quadraticCurveTo(-14, -10, -19, -7);
    p.quadraticCurveTo(-25, -9, -24, -13);
    p.quadraticCurveTo(-29, -11, -34, -12);
  });
  line(ctx, '#884157', 1.12, p => {
    p.moveTo(-29, -15); p.bezierCurveTo(-19, -21, -8, -17, 4, -13);
    p.moveTo(-22, -18); p.lineTo(-18, -25);
    p.moveTo(-13, -18); p.lineTo(-11, -11);
    p.moveTo(-5, -16); p.lineTo(1, -20);
  });
  for (const [x, y, r] of [[-25, -22, 6.3], [-10, -28, 7.4], [1, -18, 5.4], [-18, -12, 4.5], [-30, -4, 4]]) {
    blister(ctx, x, y, r);
  }
  line(ctx, '#bb7793', 1.15, p => {
    p.moveTo(-33, 1); p.quadraticCurveTo(-27, 6, -23, 5.2);
    p.moveTo(-20, 7.1); p.lineTo(-14, 8.4);
  });
  ctx.restore();
}

function lanternHead(ctx: CanvasRenderingContext2D, gape: number) {
  fang(ctx, 30, -17, -.55 - gape * .5, 16 + gape * 2.7, lantern, false);
  shape(ctx, colors(ctx, lantern, -39, -8), 2.6, p => {
    p.moveTo(-9, -23);
    p.bezierCurveTo(-9, -35, 8, -39, 18, -34);
    p.quadraticCurveTo(32, -36, 36, -26);
    p.bezierCurveTo(43, -20, 36, -10, 25, -10);
    p.quadraticCurveTo(16, -7, 11, -10);
    p.bezierCurveTo(-2, -9, -10, -14, -9, -23);
  });
  shape(ctx, '#b77a94', 0, p => {
    p.moveTo(-5, -26); p.quadraticCurveTo(2, -36, 16, -33);
    p.quadraticCurveTo(13, -31, 12, -28); p.quadraticCurveTo(4, -31, -5, -26);
  });
  shape(ctx, '#522c40', 1.52, p => {
    p.moveTo(21, -18); p.quadraticCurveTo(31, -23, 37, -19);
    p.quadraticCurveTo(36, -13 + gape * 3.5, 27, -12 + gape * 4.5); p.quadraticCurveTo(19, -13, 21, -18);
  });
  fang(ctx, 26 + gape * 2, -14 + gape * 2, .16 + gape * .24, 15 + gape * 4, lantern, true);
  for (const [x, y, r] of [[8, -26, 1.9], [14, -30, 2.05], [18, -23, 3.2], [25, -26, 4.75], [33.5, -27.5, 3.2]]) {
    eye(ctx, x, y, r, lantern);
  }
  line(ctx, '#6d425d', 1.15, p => {
    p.moveTo(19.5, -31.4); p.quadraticCurveTo(24, -34, 28.1, -30.7);
    p.moveTo(29.8, -31.7); p.quadraticCurveTo(33.3, -34.1, 36, -31.4);
  });
}

function boneBack(ctx: CanvasRenderingContext2D, flutter: number) {
  const rise = flutter * .85;
  shape(ctx, colors(ctx, bone, -62, -22), 2.6, p => {
    p.moveTo(-52, -31); p.quadraticCurveTo(-43, -39, -37, -47 - rise);
    p.bezierCurveTo(-24, -65 - rise, -8, -56 - rise, -1, -49);
    p.quadraticCurveTo(12, -39, 13, -31);
    p.quadraticCurveTo(5, -16, -15, -19); p.quadraticCurveTo(-39, -20, -52, -31);
  });
  shape(ctx, '#48586c', 0, p => {
    p.moveTo(-48, -31); p.quadraticCurveTo(-28, -24, -8, -35);
    p.quadraticCurveTo(1, -41, 8, -38); p.quadraticCurveTo(17, -26, -1, -21);
    p.quadraticCurveTo(-29, -17, -48, -31);
  });
  shape(ctx, wash(ctx, -61, -26, [[0, '#eadfbe'], [.49, '#c1bb9d'], [1, '#7d8d84']]), 1.85, p => {
    p.moveTo(-48, -34); p.bezierCurveTo(-39, -40, -36, -52 - rise, -26, -56 - rise);
    p.quadraticCurveTo(-13, -62 - rise, -4, -50); p.quadraticCurveTo(4, -42, 5, -38);
    p.lineTo(-7, -38); p.lineTo(-18, -29); p.lineTo(-26, -33); p.lineTo(-39, -28);
  });
  shape(ctx, '#e5d6ae', 0, p => {
    p.moveTo(-41, -36.3); p.quadraticCurveTo(-32, -54, -21, -55.6 - rise);
    p.quadraticCurveTo(-15, -55.9, -11, -53.1); p.quadraticCurveTo(-25, -53.4, -31, -40.2);
    p.quadraticCurveTo(-35, -41, -41, -36.3);
  });
  line(ctx, '#697775', 1.48, p => {
    p.moveTo(-28, -52); p.quadraticCurveTo(-19, -45, -26, -34);
    p.moveTo(-12, -52); p.quadraticCurveTo(-7, -45, -10, -37);
    p.moveTo(-37, -41); p.quadraticCurveTo(-33, -38, -35, -34);
  });
  for (const [x, y, r] of [[-31, -44, 2.2], [-21, -48, 2.45], [-17, -38, 3.2], [-9, -44, 1.55]]) {
    oval(ctx, x, y, r + .45, r * .63, '#536f66', -.7);
    oval(ctx, x - .25, y - .36, r * .59, r * .38, '#91d0a0', -.7);
  }
}

function boneHead(ctx: CanvasRenderingContext2D, gape: number) {
  fang(ctx, 28, -22, -.4 - gape * .48, 22 + gape * 2, bone, false);
  shape(ctx, colors(ctx, bone, -45, -11), 2.55, p => {
    p.moveTo(-9, -32); p.quadraticCurveTo(-9, -45, 7, -45);
    p.quadraticCurveTo(17, -44, 24, -38);
    p.lineTo(35, -34); p.quadraticCurveTo(43, -31, 37, -24);
    p.quadraticCurveTo(34, -14, 23, -14); p.lineTo(11, -16);
    p.quadraticCurveTo(-3, -16, -9, -32);
  });
  shape(ctx, wash(ctx, -45, -20, [[0, '#f3e7c6'], [.55, '#c9cbb2'], [1, '#899b91']]), 1.6, p => {
    p.moveTo(-6, -35); p.quadraticCurveTo(0, -44, 9, -42);
    p.quadraticCurveTo(15, -44, 25, -37); p.lineTo(34, -33); p.quadraticCurveTo(39, -30, 33, -28);
    p.lineTo(27, -30); p.lineTo(20, -27); p.lineTo(12, -26); p.lineTo(4, -31); p.lineTo(-2, -29);
  });
  line(ctx, '#8b9a8f', 1.1, p => {
    p.moveTo(6, -40); p.quadraticCurveTo(12, -38, 11, -33);
    p.moveTo(17, -39); p.lineTo(19, -35);
  });
  shape(ctx, '#344354', 1.5, p => {
    p.moveTo(17, -25); p.quadraticCurveTo(28, -27, 37, -25);
    p.quadraticCurveTo(36, -18 + gape * 4, 25, -16 + gape * 3); p.quadraticCurveTo(19, -17, 17, -25);
  });
  fang(ctx, 27 + gape * 3, -19 + gape * 2, .12 + gape * .37, 22 + gape * 2, bone, true);
  eye(ctx, 21, -30.8, 5, bone, -.42);
  eye(ctx, 30.3, -32.5, 3.3, bone, -.34);
  eye(ctx, 11.7, -31.3, 1.7, bone);
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, wide: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shape(ctx, '#dfbb84', 1.55, p => {
    p.moveTo(-wide, 0); p.quadraticCurveTo(-2, -4.1, wide, -.4);
    p.quadraticCurveTo(wide + 1.2, 3.4, wide - 3, 4.2); p.quadraticCurveTo(-3, 7, -wide, 0);
  });
  shape(ctx, wash(ctx, -10, 1, [[0, '#e59866'], [.64, '#ad5e58'], [1, '#754052']]), 1.5, p => {
    p.moveTo(-wide - 1, 0); p.quadraticCurveTo(-wide + 1, -6.2, -3, -7.8);
    p.quadraticCurveTo(6, -9.6, wide, -1.3); p.quadraticCurveTo(4.3, 4.1, -wide - 1, 0);
  });
  line(ctx, '#efa278', .95, p => { p.moveTo(-wide + 3, -2); p.quadraticCurveTo(-4, -6.1, 1.8, -6.9); });
  for (const dx of [-3, 1.3, 5.1]) {
    line(ctx, '#a47468', .58, p => { p.moveTo(dx, 1.3); p.lineTo(dx + .2, 3.4); });
  }
  ctx.restore();
}

function briarBack(ctx: CanvasRenderingContext2D, flutter: number) {
  shape(ctx, wash(ctx, -41, -11, [[0, '#b69c66'], [.48, '#80694d'], [1, '#4b413c']]), 2.55, p => {
    p.moveTo(-53, -21); p.lineTo(-62, -25); p.lineTo(-50, -28);
    p.lineTo(-47, -37); p.lineTo(-40, -33); p.quadraticCurveTo(-29, -43, -17, -40);
    p.lineTo(-10, -47); p.lineTo(-4, -39); p.quadraticCurveTo(15, -37, 20, -30);
    p.lineTo(18, -20); p.quadraticCurveTo(-2, -10, -28, -11); p.quadraticCurveTo(-45, -11, -53, -21);
  });
  shape(ctx, '#53483c', 0, p => {
    p.moveTo(-48, -22); p.quadraticCurveTo(-24, -15, -7, -25);
    p.quadraticCurveTo(8, -30, 14, -30); p.quadraticCurveTo(18, -22, 4, -16);
    p.quadraticCurveTo(-30, -6, -48, -22);
  });
  for (const [x, y, h] of [[-41, -27, 6], [-31, -26, 7.7], [-20, -26, 9.3], [-8, -27, 8.2], [4, -27, 6]]) {
    line(ctx, '#c4a171', 1.25, p => {
      p.moveTo(x + 2, y - h + 1); p.quadraticCurveTo(x - 3, y - h * .48, x, y + 7);
    });
  }
  shelf(ctx, -34, -33 - flutter * .5, 12.2, -.21);
  shelf(ctx, -16, -38 + flutter * .55, 15.4, -.12);
  shelf(ctx, 1.8, -32 - flutter * .72, 11, .19);
  for (const [x, y, r] of [[-38, -26, 2.1], [-24, -20, 2.7], [-7, -18, 2.1], [7, -24, 1.8]]) {
    oval(ctx, x, y, r + .55, r * .65 + .4, '#535848', -.5);
    oval(ctx, x - .23, y - .42, r * .82, r * .52, '#c0bd70', -.5);
  }
}

function briarHead(ctx: CanvasRenderingContext2D, gape: number) {
  fang(ctx, 33, -14, -.63 - gape * .38, 13.8 + gape * 2, briar, false);
  shape(ctx, colors(ctx, briar, -36, -9), 2.5, p => {
    p.moveTo(-8, -20); p.lineTo(-9, -28); p.lineTo(1, -28); p.lineTo(4, -34);
    p.lineTo(11, -29); p.quadraticCurveTo(19, -34, 24, -27); p.lineTo(31, -31);
    p.lineTo(33, -24); p.quadraticCurveTo(41, -25, 42, -17); p.quadraticCurveTo(41, -10, 32, -10);
    p.quadraticCurveTo(19, -7, 9, -11); p.quadraticCurveTo(-2, -10, -8, -20);
  });
  shape(ctx, '#c8ac76', 0, p => {
    p.moveTo(-3, -24); p.lineTo(3, -27); p.lineTo(7, -29);
    p.lineTo(11, -26); p.quadraticCurveTo(20, -29, 23, -24);
    p.quadraticCurveTo(15, -22.2, 6, -21); p.lineTo(3, -23);
  });
  shape(ctx, '#4a3132', 1.38, p => {
    p.moveTo(19, -16); p.quadraticCurveTo(36, -19, 40, -16);
    p.quadraticCurveTo(39, -11 + gape * 3, 28, -10 + gape * 5); p.quadraticCurveTo(21, -10, 19, -16);
  });
  fang(ctx, 29 + gape * 2, -11 + gape * 1.8, .13 + gape * .31, 14 + gape * 1.8, briar, true);
  for (const [x, y, r] of [[12, -22, 2.1], [18, -24, 2.4], [25, -21.4, 4.5], [35, -21.9, 3.35]]) {
    eye(ctx, x, y, r, briar, -.24);
  }
}

type RunnerForm = {
  palette: RunnerPalette;
  legs: readonly Leg[];
  thickness: number;
  attackReach: number;
  attackPitch: number;
  back: (ctx: CanvasRenderingContext2D, flutter: number) => void;
  head: (ctx: CanvasRenderingContext2D, gape: number) => void;
};

const lanternForm: RunnerForm = { palette: lantern, legs: lanternLegs, thickness: 1, attackReach: 15, attackPitch: .12, back: lanternBack, head: lanternHead };
const boneForm: RunnerForm = { palette: bone, legs: boneLegs, thickness: .92, attackReach: 21, attackPitch: .17, back: boneBack, head: boneHead };
const briarForm: RunnerForm = { palette: briar, legs: briarLegs, thickness: 1.12, attackReach: 14, attackPitch: .08, back: briarBack, head: briarHead };

function drawRunner(ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number, form: RunnerForm) {
  const pose = meadowEnemyPose(mode, phase);
  const moving = mode === 'move';
  const flutter = moving ? Math.sin(phase * Math.PI * 4) : pose.anticipation - pose.strike * .6;
  const x = pose.lunge * form.attackReach - pose.anticipation * 6.8;
  const y = moving ? flutter * 1.22 : -pose.anticipation * 4.3 + pose.strike * 3.2;
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  for (const [index, leg] of form.legs.entries()) {
    paintLeg(ctx, legPose(leg, false, index, pose, x, y), form.palette, false, form.thickness);
  }
  ctx.save();
  ctx.translate(x * .83, y);
  ctx.rotate(moving ? flutter * .018 : -pose.anticipation * .12 + pose.lunge * .1);
  form.back(ctx, flutter);
  ctx.restore();
  for (const [index, leg] of form.legs.entries()) {
    paintLeg(ctx, legPose(leg, true, index, pose, x, y), form.palette, true, form.thickness);
  }
  ctx.save();
  ctx.translate(x, y - pose.strike * 2.4);
  ctx.rotate(moving ? flutter * .017 : -pose.anticipation * .17 + pose.lunge * form.attackPitch);
  form.head(ctx, pose.anticipation * .48 + pose.strike * .9);
  ctx.restore();
  ctx.restore();
}

export const runnerOptions = [
  {
    name: 'Lanternback', description: 'A swollen amber and plum spider with glowing blisters and a close fang snap.',
    draw: (ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number) => drawRunner(ctx, mode, phase, lanternForm),
  },
  {
    name: 'Bone Loper', description: 'Pale armor over high, blue-gray legs. It pitches forward to drive its long fangs in.',
    draw: (ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number) => drawRunner(ctx, mode, phase, boneForm),
  },
  {
    name: 'Briar Skitter', description: 'A low, bark-plated spider with rust-colored shelf fungi and hooked jaws.',
    draw: (ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number) => drawRunner(ctx, mode, phase, briarForm),
  },
] as const;
