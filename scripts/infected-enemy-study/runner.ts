import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { drawLanternback } from '../../src/assets/art/infectedEnemies/lanternback';
import { colors, drawRunner, eye, fang, type Leg, type RunnerForm, type RunnerPalette } from '../../src/assets/art/infectedEnemies/runnerRig';
import type { MeadowEnemyPose } from '../../src/assets/art/meadowEnemies/pose';

const bone: RunnerPalette = {
  dark: '#283443', shade: '#435368', middle: '#687e89', light: '#a1b0aa', edge: '#cbd4bd',
  eye: '#94edcb', spark: '#d8ffe1', fang: '#eee4c1', fangShade: '#9fa993',
};
const briar: RunnerPalette = {
  dark: '#362c31', shade: '#56423e', middle: '#806449', light: '#a38d5e', edge: '#d3b983',
  eye: '#d1e36a', spark: '#f7ffd4', fang: '#dcc49c', fangShade: '#a38368',
};

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

const boneForm: RunnerForm = { palette: bone, legs: boneLegs, thickness: .92, attackReach: 21, attackPitch: .17, back: boneBack, head: boneHead };
const briarForm: RunnerForm = { palette: briar, legs: briarLegs, thickness: 1.12, attackReach: 14, attackPitch: .08, back: briarBack, head: briarHead };

export const runnerOptions = [
  {
    name: 'Lanternback', description: 'A swollen amber and plum spider with glowing blisters and a close fang snap.',
    draw: drawLanternback,
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
