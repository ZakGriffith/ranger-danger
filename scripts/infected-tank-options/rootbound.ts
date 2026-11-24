import { ink, shape, line, oval, wash, pose, type Action } from './paint';

function rootFoot(ctx: CanvasRenderingContext2D, x: number, phase: number, far: boolean) {
  const step = Math.sin(phase) * 8, lift = Math.max(0, Math.cos(phase)) * 5;
  const y = far ? -6 : 0;
  shape(ctx, far ? '#4c3b4a' : wash(ctx, -34, 2, [[0, '#ad885d'], [.4, '#8b634e'], [1, '#513c48']]), 2.8, p => {
    p.moveTo(x - 11, -38); p.quadraticCurveTo(x + 11, -40, x + 12, -24);
    p.lineTo(x + 7 + step, y - 10 - lift); p.lineTo(x + 23 + step, y - 3 - lift);
    p.lineTo(x + 26 + step, y + 1 - lift); p.lineTo(x + 10 + step, y - 2 - lift);
    p.lineTo(x + 2 + step, y + 3 - lift); p.lineTo(x - 4 + step, y - 1 - lift);
    p.lineTo(x - 17 + step, y + 1 - lift); p.lineTo(x - 14 + step, y - 7 - lift);
    p.lineTo(x - 7, -21);
  });
  line(ctx, far ? '#80654f' : '#d1ae74', 1.7, p => { p.moveTo(x - 2, -32); p.quadraticCurveTo(x + 5, -16, x - 2 + step, y - 6 - lift); p.lineTo(x - 10 + step, y - 2 - lift); p.moveTo(x + 3 + step, y - 8 - lift); p.lineTo(x + 17 + step, y - 3 - lift); });
}

function rootArm(ctx: CanvasRenderingContext2D, side: number, wind: number, hit: number, gait: number, far: boolean) {
  const shoulderX = side * 32, shoulderY = -75;
  const elbowX = side * (43 - wind * 7) + hit * 24, elbowY = -43 - wind * 32 + hit * 7;
  const handX = side * (45 - wind * 6) + hit * 34, handY = -22 - wind * 76 + hit * 11 + Math.sin(gait + side) * 2;
  shape(ctx, far ? '#4b3c4b' : wash(ctx, -100, -10, [[0, '#c1a474'], [.4, '#99704f'], [.75, '#79534b'], [1, '#493747']]), 3, p => {
    p.moveTo(shoulderX - 11, shoulderY - 2); p.quadraticCurveTo(shoulderX + 8, shoulderY - 17, shoulderX + 14, shoulderY);
    p.lineTo(elbowX + 12, elbowY - 4); p.lineTo(handX + 12, handY - 9);
    p.lineTo(handX + 8, handY + 12); p.lineTo(handX - 10, handY + 9);
    p.lineTo(elbowX - 9, elbowY + 7); p.lineTo(shoulderX - 11, shoulderY + 10);
  });
  if (!far) {
    line(ctx, '#d6b880', 3.2, p => { p.moveTo(shoulderX - 4, shoulderY + 1); p.quadraticCurveTo(elbowX + 1, elbowY - 6, handX - 3, handY - 4); });
    line(ctx, '#66464b', 1.8, p => { p.moveTo(shoulderX + 4, shoulderY + 5); p.lineTo(elbowX + 5, elbowY); p.lineTo(handX + 5, handY - 7); });
  }
  ctx.save(); ctx.translate(handX, handY); ctx.rotate(-side * .15 - wind * .4 + hit * .3);
  shape(ctx, far ? '#655046' : wash(ctx, -16, 16, [[0, '#b49668'], [.5, '#8c6c52'], [1, '#58414b']]), 2.8, p => {
    p.moveTo(-13, -9); p.lineTo(-7, -18); p.lineTo(7, -16); p.lineTo(16, -4);
    p.lineTo(21, 12); p.lineTo(12, 9); p.lineTo(9, 21); p.lineTo(4, 14);
    p.lineTo(-3, 20); p.lineTo(-5, 11); p.lineTo(-13, 14); p.lineTo(-18, 1);
  });
  line(ctx, '#d4b77c', 1.7, p => { p.moveTo(-9, -7); p.lineTo(-5, -11); p.lineTo(1, -7); p.moveTo(5, -10); p.lineTo(10, 4); });
  ctx.restore();
}

function splitBark(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, wide: number) {
  shape(ctx, wash(ctx, y, y + height, [[0, '#d0aa6d'], [.3, '#aa7a50'], [1, '#684751']]), 2.1, p => {
    p.moveTo(x - wide, y + 4); p.lineTo(x - 3, y - 4); p.lineTo(x + wide, y + 1);
    p.lineTo(x + wide - 3, y + height * .6); p.lineTo(x + 3, y + height);
    p.lineTo(x - wide + 2, y + height - 5); p.lineTo(x - wide + 5, y + height * .4);
  });
  line(ctx, '#e4c88a', 1.5, p => { p.moveTo(x - wide + 4, y + 5); p.lineTo(x - wide + 7, y + height * .4); p.lineTo(x - 3, y + height - 9); });
}

export function drawRootbound(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const { gait, wind, hit } = pose(action, phase);
  ctx.save(); ctx.translate(-5 - wind * 3 + hit * 7, Math.cos(gait * 2) * 1.5 - wind * 2 + hit * 3);
  rootFoot(ctx, 18, gait + Math.PI, true); rootArm(ctx, 1, wind * .35, hit * .4, gait, true);
  ctx.save(); ctx.rotate(-.035 - wind * .07 + hit * .09);
  shape(ctx, wash(ctx, -124, -18, [[0, '#b29b69'], [.25, '#9d7a52'], [.6, '#80584c'], [1, '#4d3747']]), 3.4, p => {
    p.moveTo(-37, -27); p.lineTo(-30, -69); p.lineTo(-39, -106); p.lineTo(-29, -115);
    p.lineTo(-31, -136); p.lineTo(-20, -125); p.lineTo(-12, -137); p.lineTo(-6, -119);
    p.lineTo(14, -122); p.lineTo(25, -137); p.lineTo(28, -116); p.lineTo(39, -105);
    p.lineTo(31, -70); p.lineTo(40, -28); p.lineTo(22, -17); p.lineTo(11, -24);
    p.lineTo(-3, -17); p.lineTo(-16, -22); p.lineTo(-27, -18);
  });
  shape(ctx, '#433343', 2, p => { p.moveTo(-28, -111); p.lineTo(-14, -122); p.lineTo(-5, -112); p.lineTo(12, -116); p.lineTo(25, -111); p.lineTo(23, -101); p.lineTo(5, -96); p.lineTo(-16, -100); });
  line(ctx, '#d4b77a', 2.1, p => { p.moveTo(-27, -110); p.lineTo(-13, -115); p.lineTo(-6, -108); p.lineTo(12, -112); p.lineTo(24, -109); });
  splitBark(ctx, -25, -100, 69, 9); splitBark(ctx, 23, -99, 75, 10); splitBark(ctx, -6, -48, 27, 10);
  shape(ctx, '#b58a59', 0, p => { p.moveTo(-13, -96); p.quadraticCurveTo(-3, -107, 15, -98); p.lineTo(19, -85); p.lineTo(5, -88); p.lineTo(-10, -82); });
  for (const [x, y, tilt] of [[-9, -81, .13], [12, -83, -.16]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    shape(ctx, '#392e3e', 1.5, p => { p.moveTo(-7, -3); p.lineTo(7, -5); p.lineTo(6, 4); p.lineTo(-4, 6); });
    oval(ctx, 1, 0, 3.4, 3.8, '#d4d780'); oval(ctx, 2, 1, 1.5, 2.8, '#424239'); oval(ctx, 0, -1.5, 1, 1, '#f5efb6'); ctx.restore();
  }
  line(ctx, '#dfbd7c', 3.3, p => { p.moveTo(-18, -88); p.lineTo(-4, -86); p.moveTo(4, -86); p.lineTo(19, -91); });
  shape(ctx, '#3e2e3c', 2.2, p => { p.moveTo(-10, -64); p.lineTo(0, -68); p.lineTo(8, -63); p.lineTo(20, -66); p.lineTo(17, -52 - hit * 6); p.lineTo(8, -55); p.lineTo(1, -50 - hit * 5); p.lineTo(-7, -54); });
  for (const x of [-3, 7, 14]) shape(ctx, '#c1a675', 0, p => { p.moveTo(x, -64); p.lineTo(x + 4, -63); p.lineTo(x + 2, -57); });
  for (const [x, y, r] of [[-27, -72, 6], [-33, -61, 5], [26, -43, 5]]) { oval(ctx, x, y, r, r * .8, '#8e619e'); oval(ctx, x - 1.5, y - 2, r * .5, r * .3, '#c695bc'); }
  shape(ctx, '#6f8b58', 1.7, p => { p.moveTo(-27, -114); p.quadraticCurveTo(-44, -128, -49, -115); p.quadraticCurveTo(-41, -104, -27, -114); });
  line(ctx, '#b4cb83', 1.4, p => { p.moveTo(-44, -115); p.lineTo(-29, -114); });
  shape(ctx, '#768750', 1.6, p => { p.moveTo(25, -110); p.quadraticCurveTo(36, -127, 42, -116); p.quadraticCurveTo(40, -105, 25, -110); });
  ctx.restore(); rootFoot(ctx, -18, gait, false); rootArm(ctx, -1, wind, hit, gait, false);
  ctx.restore();
}
