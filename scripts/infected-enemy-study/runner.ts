import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { drawBoneLoper } from '../../src/assets/art/infectedEnemies/boneLoper';
import { drawLanternback } from '../../src/assets/art/infectedEnemies/lanternback';
import { colors, drawRunner, eye, fang, type Leg, type RunnerForm, type RunnerPalette } from '../../src/assets/art/infectedEnemies/runnerRig';
import type { MeadowEnemyPose } from '../../src/assets/art/meadowEnemies/pose';

const briar: RunnerPalette = {
  dark: '#362c31', shade: '#56423e', middle: '#806449', light: '#a38d5e', edge: '#d3b983',
  eye: '#d1e36a', spark: '#f7ffd4', fang: '#dcc49c', fangShade: '#a38368',
};

const briarLegs: readonly Leg[] = [
  [[-17, -18], [-40, -19], [-54, -1]],
  [[-10, -23], [-26, -12], [-35, 0]],
  [[1, -21], [14, -9], [24, 0]],
  [[14, -21], [39, -15], [48, -1]],
];

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

const briarForm: RunnerForm = { palette: briar, legs: briarLegs, thickness: 1.12, attackReach: 14, attackPitch: .08, back: briarBack, head: briarHead };

export const runnerOptions = [
  {
    name: 'Lanternback', description: 'A swollen amber and plum spider with glowing blisters and a close fang snap.',
    draw: drawLanternback,
  },
  {
    name: 'Bone Loper', description: 'Pale armor over high, blue-gray legs. It pitches forward to drive its long fangs in.',
    draw: drawBoneLoper,
  },
  {
    name: 'Briar Skitter', description: 'A low, bark-plated spider with rust-colored shelf fungi and hooked jaws.',
    draw: (ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number) => drawRunner(ctx, mode, phase, briarForm),
  },
] as const;
