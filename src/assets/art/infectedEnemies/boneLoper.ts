import { line, oval, shape, wash } from '../forestEnemies/paint';
import { colors, drawRunner, eye, fang, type Leg, type RunnerForm, type RunnerPalette } from './runnerRig';

const bone: RunnerPalette = {
  dark: '#283443', shade: '#435368', middle: '#687e89', light: '#a1b0aa', edge: '#cbd4bd',
  eye: '#94edcb', spark: '#d8ffe1', fang: '#eee4c1', fangShade: '#9fa993',
};

const boneLegs: readonly Leg[] = [
  [[-17, -31], [-42, -35], [-56, -1]],
  [[-8, -34], [-23, -39], [-32, 0]],
  [[5, -32], [20, -40], [24, 0]],
  [[13, -28], [42, -33], [52, -1]],
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

const boneForm: RunnerForm = { palette: bone, legs: boneLegs, thickness: .92, attackReach: 21, attackPitch: .17, back: boneBack, head: boneHead };

export function drawBoneLoper(ctx: CanvasRenderingContext2D, mode: 'move' | 'attack', phase: number) {
  drawRunner(ctx, mode, phase, boneForm);
}
