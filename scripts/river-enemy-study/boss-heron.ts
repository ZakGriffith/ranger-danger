import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Action = 'move' | 'attack';
const wind = '#cbdde7';
const quill = '#adbac0';
const brightQuill = '#e1ddd1';

function ease(phase: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function dashStreaks(ctx: CanvasRenderingContext2D, strike: number) {
  if (strike < .16) return;
  ctx.save();
  ctx.globalAlpha *= ease(strike, .16, .84) * .65;
  for (const [x, y, length, width] of [[-90, -74, 31, 1.5], [-98, -54, 48, 2.2], [-80, -39, 29, 1.5]]) {
    line(ctx, wind, width, p => {
      p.moveTo(x, y);
      p.quadraticCurveTo(x + length * .5, y + 1, x + length * strike, y - 2);
    });
  }
  ctx.restore();
}

function flightWing(ctx: CanvasRenderingContext2D, angle: number, far: boolean) {
  ctx.save();
  ctx.translate(far ? 9 : -11, far ? -6 : -3);
  ctx.rotate(angle);
  ctx.scale(far ? .76 : .93, far ? .76 : .83);
  const feathers = wash(ctx, -51, 17, [[0, far ? '#4a657c' : '#718ca0'], [.5, far ? '#354960' : '#476077'], [1, far ? '#243347' : '#263747']]);
  shape(ctx, feathers, far ? 3 : 3.35, p => {
    p.moveTo(12, 2);
    p.bezierCurveTo(6, -13, -13, -27, -33, -35);
    p.bezierCurveTo(-48, -40, -58, -43, -71, -50);
    p.quadraticCurveTo(-76, -49, -64, -37);
    p.lineTo(-53, -27);
    p.quadraticCurveTo(-65, -30, -73, -36);
    p.bezierCurveTo(-78, -34, -65, -20, -53, -17);
    p.quadraticCurveTo(-62, -17, -70, -22);
    p.bezierCurveTo(-74, -18, -63, -9, -51, -7);
    p.quadraticCurveTo(-56, -6, -63, -7);
    p.bezierCurveTo(-61, -1, -50, 2, -43, 1);
    p.quadraticCurveTo(-48, 6, -36, 7);
    p.quadraticCurveTo(-31, 7, -27, 9);
    p.bezierCurveTo(-18, 20, 6, 15, 12, 2);
  });
  const upper = wash(ctx, -37, 8, [[0, far ? '#536c81' : '#829cae'], [.55, far ? '#42596e' : '#5c7991'], [1, far ? '#314657' : '#3a5268']]);
  shape(ctx, upper, 0, p => {
    p.moveTo(8, 2);
    p.bezierCurveTo(0, -12, -16, -25, -35, -31);
    p.quadraticCurveTo(-49, -35, -59, -39);
    p.bezierCurveTo(-52, -29, -47, -23, -40, -18);
    p.quadraticCurveTo(-47, -19, -52, -23);
    p.quadraticCurveTo(-46, -12, -34, -9);
    p.quadraticCurveTo(-39, -10, -43, -11);
    p.quadraticCurveTo(-36, 0, -24, 0);
    p.quadraticCurveTo(-27, 4, -23, 7);
    p.quadraticCurveTo(-3, 14, 8, 2);
  });
  line(ctx, far ? '#6e8a99' : '#a3b6bf', far ? 1.3 : 1.85, p => {
    p.moveTo(-7, -12); p.quadraticCurveTo(-24, -23, -37, -25);
    p.moveTo(-14, -9); p.quadraticCurveTo(-25, -16, -32, -17);
    p.moveTo(-21, -6); p.quadraticCurveTo(-29, -8, -34, -10);
  });
  line(ctx, far ? '#233348' : '#334a5d', 1.7, p => {
    p.moveTo(-30, -21); p.quadraticCurveTo(-51, -26, -65, -37);
    p.moveTo(-31, -14); p.quadraticCurveTo(-49, -17, -63, -26);
    p.moveTo(-31, -7); p.quadraticCurveTo(-50, -9, -59, -13);
    p.moveTo(-26, -1); p.quadraticCurveTo(-41, -1, -50, -3);
  });
  if (!far) line(ctx, '#c3ced0', 1.2, p => {
    p.moveTo(-38, -29); p.quadraticCurveTo(-45, -30, -51, -33);
    p.moveTo(-53, -22); p.lineTo(-57, -24);
  });
  ctx.restore();
}

function hookedLeg(ctx: CanvasRenderingContext2D, x: number, far: boolean, wave: number, windup: number, strike: number) {
  const heel = x - 20 - 10 * strike + 8 * windup;
  const ankle = (far ? 20 : 24) - 4 * strike + windup * 2 + wave * 1.7;
  const trace = (p: CanvasRenderingContext2D) => {
    p.moveTo(x, 6);
    p.quadraticCurveTo(x + 1, 13, x - 5 - strike * 8, 15);
    p.quadraticCurveTo(heel + 6, ankle, heel, ankle);
    p.moveTo(heel, ankle); p.quadraticCurveTo(heel - 8, ankle + 3, heel - 13, ankle + 1);
    p.moveTo(heel, ankle); p.quadraticCurveTo(heel - 7, ankle - 1, heel - 9, ankle - 3);
    p.moveTo(heel, ankle); p.quadraticCurveTo(heel + 2, ankle - 4, heel + 2, ankle - 5);
  };
  line(ctx, ink, far ? 4.2 : 5, trace);
  line(ctx, far ? '#777579' : '#c0a887', far ? 2.1 : 2.65, trace);
  if (!far) line(ctx, '#e1c6a0', 1.2, p => {
    p.moveTo(heel + 8, ankle - 1.5); p.lineTo(heel + 4, ankle - .5);
    p.moveTo(heel - 3, ankle + .5); p.lineTo(heel - 7, ankle + 1.5);
  });
}

function foldedNeck(ctx: CanvasRenderingContext2D, x: number, y: number, windup: number, strike: number) {
  const dark = wash(ctx, y - 10, 16, [[0, '#a2b1b5'], [.44, '#718ea2'], [.68, '#516d85'], [1, '#30465c']]);
  shape(ctx, dark, 3.4, p => {
    p.moveTo(-13, -5);
    p.bezierCurveTo(-2, -20, 20 - windup * 8, -11, 16 + strike * 4, -19);
    p.bezierCurveTo(x - 31, y + 4, x - 25, y - 9, x - 9, y - 11);
    p.quadraticCurveTo(x + 4, y - 10, x + 11, y + 8);
    p.bezierCurveTo(x - 4, y + 10, x - 7, y + 14, x + 3, y + 22);
    p.bezierCurveTo(53 + strike * 5 - windup * 4, -1, 34, 24, 11, 17);
    p.quadraticCurveTo(-5, 15, -13, -5);
  });
  shape(ctx, wash(ctx, y + 1, 20, [[0, '#f3e8d2'], [.51, '#d7d5c3'], [1, '#8d9da4']]), 0, p => {
    p.moveTo(x + 9, y + 7);
    p.bezierCurveTo(x - 3, y + 9, x - 8, y + 14, x + 1, y + 22);
    p.bezierCurveTo(50 + strike * 5 - windup * 4, -2, 34, 21, 15, 15);
    p.lineTo(20, 10); p.lineTo(11, 11);
    p.quadraticCurveTo(34, 1, 28 + strike * 4 - windup * 8, -10);
    p.bezierCurveTo(x - 12, y + 12, x - 11, y + 6, x + 9, y + 7);
  });
  line(ctx, '#80939c', 1.8, p => {
    p.moveTo(30 - windup * 5, 5); p.quadraticCurveTo(39 - windup * 4 + strike * 3, -2, 37 - windup * 3 + strike * 3, -8);
    p.moveTo(24 - windup * 5, 9); p.lineTo(28 - windup * 5, 7);
  });
}

function heronHead(ctx: CanvasRenderingContext2D, x: number, y: number, strike: number, windup: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.09 * windup + .19 * strike);
  shape(ctx, '#283b50', 2.8, p => {
    p.moveTo(9, -9);
    p.bezierCurveTo(-5, -16, -21, -18, -38, -18 - strike * 4);
    p.quadraticCurveTo(-32, -12, -22, -9);
    p.lineTo(-34, -9 - strike * 2);
    p.quadraticCurveTo(-25, -4, -14, -3);
    p.lineTo(-21, 2);
    p.quadraticCurveTo(-8, 1, 2, 5);
  });
  line(ctx, '#698597', 1.4, p => {
    p.moveTo(-33, -17 - strike * 4); p.quadraticCurveTo(-20, -14, -11, -11);
    p.moveTo(-27, -9); p.lineTo(-18, -7);
  });
  shape(ctx, wash(ctx, -13, 12, [[0, '#b3bec0'], [.48, '#819bad'], [.78, '#637e93'], [1, '#48657a']]), 3, p => {
    p.moveTo(-15, -2); p.bezierCurveTo(-12, -13, 0, -17, 12, -11);
    p.quadraticCurveTo(20, -8, 19, 0);
    p.quadraticCurveTo(15, 9, 8, 10);
    p.bezierCurveTo(4, 14, -11, 11, -15, 5);
  });
  shape(ctx, '#263a50', 0, p => {
    p.moveTo(-12, -7); p.quadraticCurveTo(-2, -13, 7, -9);
    p.quadraticCurveTo(13, -9, 16, -4); p.lineTo(9, 1);
    p.quadraticCurveTo(0, 0, -3, -3); p.quadraticCurveTo(-8, -4, -12, -7);
  });
  shape(ctx, '#e0dac7', 0, p => {
    p.moveTo(-11, -1);
    p.quadraticCurveTo(-2, 1, 5, 4);
    p.quadraticCurveTo(14, 3, 14, 5);
    p.quadraticCurveTo(8, 11, 0, 9); p.quadraticCurveTo(-9, 9, -11, -1);
  });
  const beakTip = 52 - strike * 5;
  shape(ctx, wash(ctx, -8, 8, [[0, '#dabc82'], [.43, '#b98b52'], [.71, '#845c3d'], [1, '#58493b']]), 2.6, p => {
    p.moveTo(13, -5);
    p.quadraticCurveTo(22, -5, 30, -2);
    p.lineTo(beakTip, 2 + strike * .7);
    p.quadraticCurveTo(32, 5, 21, 6);
    p.lineTo(13, 5);
    p.quadraticCurveTo(17, 1, 13, -5);
  });
  line(ctx, '#f1cca0', 1.25, p => {
    p.moveTo(18, -3); p.quadraticCurveTo(25, -2, 35, 0);
  });
  line(ctx, ink, 1.45, p => {
    p.moveTo(15, 3); p.quadraticCurveTo(27, 3, beakTip - 4, 2.7);
  });
  oval(ctx, 21, -.1, 1.9, .84, '#684d3e', .17);
  shape(ctx, strike > .42 ? '#ffe6a0' : '#e8b460', 1.7, p => {
    p.moveTo(2, -4); p.quadraticCurveTo(8, -7 - windup * 1.4, 14, -3);
    p.quadraticCurveTo(13, 2, 9, 2); p.quadraticCurveTo(5, 3, 2, -4);
  });
  oval(ctx, 10.35, -2.65, 1.65, 2.55, '#201f25');
  oval(ctx, 10.8, -3.7, .64, .78, '#fff4d0');
  line(ctx, brightQuill, 1.4, p => {
    p.moveTo(-9, -8); p.quadraticCurveTo(-5, -11, 1, -11);
    p.moveTo(-7, 4); p.lineTo(-5, 6);
  });
  ctx.restore();
}

function flightPose(action: Action, phase: number) {
  const windup = action === 'attack' ? ease(phase, 0, .35) - ease(phase, .36, .56) : 0;
  const strike = action === 'attack' ? ease(phase, .36, .55) - ease(phase, .65, .98) : 0;
  return { windup, strike, x: -11 * windup + 13 * strike };
}

function drawHeron(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const frame = phase * Math.PI * 2;
  const { windup, strike, x } = flightPose(action, phase);
  const beat = Math.sin(frame) * (1 - strike * .9);
  const headX = 33 - windup * 15 + strike * 8;
  const headY = -41 - windup * 4 + strike * 23;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  dashStreaks(ctx, strike);
  ctx.translate(x, -51 - Math.cos(frame * 2) * 2.4 - windup * 3 + strike * 7);
  ctx.rotate(-windup * .075 + strike * .035);

  flightWing(ctx, .48 + beat * .30 + windup * .16 - strike * .20, true);
  hookedLeg(ctx, -10, true, -beat, windup, strike);
  hookedLeg(ctx, -22, false, beat, windup, strike);
  shape(ctx, '#415971', 3, p => {
    p.moveTo(-27, 0);
    p.quadraticCurveTo(-47, 3, -72, 1 - strike * 5);
    p.quadraticCurveTo(-67, 9, -53, 10 - strike * 3);
    p.lineTo(-64, 14 - strike * 5);
    p.quadraticCurveTo(-49, 19, -37, 14);
    p.lineTo(-52, 20);
    p.quadraticCurveTo(-31, 24, -19, 12);
  });
  shape(ctx, wash(ctx, -20, 24, [[0, '#8fa2af'], [.36, '#6f8ba1'], [.67, '#4f6d86'], [1, '#3f5366']]), 3.4, p => {
    p.moveTo(-44, 6);
    p.bezierCurveTo(-37, -13, -10, -24, 12, -15);
    p.bezierCurveTo(28, -11, 31, 5, 20, 13);
    p.bezierCurveTo(11, 27, -29, 24, -44, 6);
  });
  shape(ctx, '#99acb3', 0, p => {
    p.moveTo(-28, 14); p.quadraticCurveTo(-9, 21, 6, 13); p.lineTo(16, 9);
    p.bezierCurveTo(6, 23, -14, 23, -23, 20); p.lineTo(-19, 19);
  });
  flightWing(ctx, .10 + beat * .40 + windup * .22 - strike * .26, false);
  foldedNeck(ctx, headX, headY, windup, strike);
  line(ctx, quill, 1.55, p => {
    p.moveTo(-11, 11); p.quadraticCurveTo(-7, 14, 0, 14);
    p.moveTo(-16, 15); p.lineTo(-11, 17);
  });
  heronHead(ctx, headX, headY, strike, windup);
  ctx.restore();
}

export const heronOption = {
  name: 'Gloam Heron',
  description: 'A storm-blue heron draws its wings back and coils its neck before lunging beak-first through the air.',
  draw: drawHeron,
  shadowX: (action: Action, phase: number) => flightPose(action, phase).x,
};
