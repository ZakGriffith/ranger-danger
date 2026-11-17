import { line, oval, shape, wash } from '../forestEnemies/paint';
import { colors, drawRunner, eye, fang, type Leg, type RunnerForm, type RunnerPalette } from './runnerRig';

const lantern: RunnerPalette = {
  dark: '#3c263c', shade: '#583750', middle: '#85526d', light: '#ae7492', edge: '#d28da4',
  eye: '#f5b95c', spark: '#fff0b5', fang: '#f5d6b2', fangShade: '#bd8581',
};

const lanternLegs: readonly Leg[] = [
  [[-14, -26], [-38, -23], [-53, -1]],
  [[-8, -27], [-22, -17], [-28, 0]],
  [[2, -26], [15, -14], [10, 0]],
  [[14, -24], [37, -18], [47, -1]],
];

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

const lanternForm: RunnerForm = { palette: lantern, legs: lanternLegs, thickness: 1, attackReach: 15, attackPitch: .12, back: lanternBack, head: lanternHead };

export function drawLanternback(ctx: CanvasRenderingContext2D, mode: 'move' | 'attack', phase: number) {
  drawRunner(ctx, mode, phase, lanternForm);
}
