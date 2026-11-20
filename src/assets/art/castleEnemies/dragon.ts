import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, ease, type CastleAction } from './pose';

function dragonWing(ctx: CanvasRenderingContext2D, far: boolean, lift: number) {
  ctx.save(); ctx.translate(far ? -18 : -4, -66); ctx.rotate(lift * .09);
  const tipX = far ? -27 : -64;
  shape(ctx, wash(ctx, -87, 24, [[0, '#a5807c'], [.42, far ? '#5f536a' : '#816079'], [1, '#433e54']]), 3.2, p => {
    p.moveTo(7, 5); p.lineTo(-15, -37); p.lineTo(tipX + 6, -86 - lift * 9);
    p.lineTo(tipX - 24, -56); p.lineTo(tipX - 45, -11 + lift * 4);
    p.quadraticCurveTo(tipX - 17, -29, tipX - 11, -3); p.quadraticCurveTo(tipX + 8, -20, -15, 18);
  });
  line(ctx, far ? '#a48b83' : '#ccb092', 3.2, p => {
    p.moveTo(7, 5); p.lineTo(-15, -37); p.lineTo(tipX + 6, -86 - lift * 9);
    p.lineTo(tipX - 24, -56); p.lineTo(tipX - 45, -11 + lift * 4);
    p.moveTo(tipX + 6, -82 - lift * 9); p.lineTo(tipX - 11, -5);
    p.moveTo(tipX + 6, -82 - lift * 9); p.lineTo(-15, 16);
  });
  line(ctx, '#d4b78e', 1.3, p => { p.moveTo(-14, -39); p.lineTo(tipX + 3, -77 - lift * 9); });
  shape(ctx, '#d5bc95', 1.4, p => { p.moveTo(tipX + 3, -82 - lift * 9); p.lineTo(tipX + 5, -99 - lift * 9); p.lineTo(tipX + 12, -88 - lift * 9); });
  ctx.restore();
}

function dragonLeg(ctx: CanvasRenderingContext2D, x: number, y: number, stride: number, far: boolean) {
  const dark = far ? '#4c485b' : '#6a6271';
  const light = far ? '#716977' : '#b0a08e';
  ctx.save(); ctx.translate(x, y);
  shape(ctx, wash(ctx, -7, 35, [[0, light], [1, dark]]), 3.2, p => {
    p.moveTo(-10, -8); p.quadraticCurveTo(13, -10, 15, 3); p.lineTo(5 + stride * .5, 18);
    p.lineTo(13 + stride, 30); p.lineTo(21 + stride, 32); p.lineTo(22 + stride, 37);
    p.lineTo(-3 + stride, 37); p.lineTo(-12 + stride * .5, 19); p.lineTo(-15, 2);
  });
  line(ctx, '#b5a08c', 1.5, p => { p.moveTo(0, 0); p.lineTo(-2 + stride * .5, 18); p.lineTo(6 + stride, 29); });
  for (const dx of [2, 10, 18]) {
    shape(ctx, '#dfc49a', 1.5, p => { p.moveTo(dx + stride - 2, 32); p.lineTo(dx + stride + 3, 32); p.lineTo(dx + stride + 7, 39); p.lineTo(dx + stride - 2, 37); });
  }
  ctx.restore();
}

function dragonHead(ctx: CanvasRenderingContext2D, gape: number) {
  ctx.save(); ctx.translate(47, -80);
  shape(ctx, '#4c3449', 2.5, p => { p.moveTo(7, -1); p.lineTo(47, -3); p.lineTo(43, 10 + gape * 15); p.lineTo(11, 11 + gape * 8); });
  ctx.save(); ctx.translate(12, 2); ctx.rotate(gape * .36);
  shape(ctx, '#8e7c7c', 2.5, p => { p.moveTo(-7, 1); p.lineTo(36, 3); p.lineTo(32, 12); p.quadraticCurveTo(8, 19, -4, 10); });
  for (const x of [8, 18, 28]) shape(ctx, '#e8cfa3', 1, p => { p.moveTo(x, 4); p.lineTo(x + 4, 4); p.lineTo(x + 1, -2); });
  ctx.restore();
  shape(ctx, wash(ctx, -41, 8, [[0, '#b3a18d'], [.4, '#8c7f89'], [1, '#595063']]), 3.1, p => {
    p.moveTo(-18, -23); p.lineTo(-8, -35); p.lineTo(9, -35); p.lineTo(22, -22);
    p.lineTo(42, -20); p.lineTo(53, -10); p.lineTo(50, -1); p.lineTo(15, 3);
    p.lineTo(5, 9); p.lineTo(-12, 3); p.lineTo(-20, -11);
  });
  for (const x of [21, 32, 44]) shape(ctx, '#ead1aa', 1.2, p => { p.moveTo(x - 2, 1); p.lineTo(x + 3, 0); p.lineTo(x, 9); });
  shape(ctx, '#bca88c', 2, p => { p.moveTo(-13, -27); p.quadraticCurveTo(-43, -40, -36, -61); p.quadraticCurveTo(-26, -43, -2, -39); });
  shape(ctx, '#a89888', 1.8, p => { p.moveTo(2, -34); p.quadraticCurveTo(-8, -51, 1, -59); p.quadraticCurveTo(2, -46, 14, -37); });
  shape(ctx, '#736371', 2, p => { p.moveTo(-14, -18); p.lineTo(-32, -26); p.lineTo(-24, -13); p.lineTo(-30, -7); p.lineTo(-14, 0); });
  shape(ctx, '#efbc6f', 2, p => { p.moveTo(3, -21); p.lineTo(20, -25); p.quadraticCurveTo(21, -13, 10, -12); p.lineTo(4, -15); });
  oval(ctx, 13, -19, 1.7, 4.6, ink, .15);
  oval(ctx, 12, -21, 1, 1, '#fff1bc');
  line(ctx, '#53465b', 2.4, p => { p.moveTo(-1, -25); p.lineTo(20, -28); });
  oval(ctx, 43, -12, 3.7, 2, '#3c3449', -.2);
  line(ctx, '#c2ac91', 1.4, p => { p.moveTo(24, -17); p.lineTo(37, -16); p.moveTo(-11, -12); p.lineTo(-5, -6); });
  ctx.restore();
}

export function drawCastleDragon(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const cycle = phase * TAU;
  const wind = action === 'attack' ? ease(0, .3, phase) - ease(.34, .56, phase) : 0;
  const flame = action === 'attack' ? ease(.34, .46, phase) - ease(.65, .96, phase) : 0;
  const stride = action === 'move' ? Math.sin(cycle) * 8 : 0;
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(flame * 3 - wind * 4, Math.cos(cycle * 2) * 1.6);
  const tailY = Math.sin(cycle) * 8;
  shape(ctx, wash(ctx, -49, -5, [[0, '#9d8d8d'], [1, '#51475b']]), 3.2, p => {
    p.moveTo(-28, -48); p.bezierCurveTo(-66, -50, -77, -17, -101, -18 + tailY);
    p.quadraticCurveTo(-114, -19 + tailY, -114, -32 + tailY);
    p.quadraticCurveTo(-124, -10 + tailY, -106, -7 + tailY); p.bezierCurveTo(-70, 0, -59, -30, -24, -21);
  });
  dragonWing(ctx, true, Math.sin(cycle));
  dragonLeg(ctx, -27, -36, -stride, true);
  dragonLeg(ctx, 30, -39, stride, true);
  shape(ctx, wash(ctx, -86, -14, [[0, '#b0a08f'], [.38, '#8d7d87'], [.75, '#685968'], [1, '#443d53']]), 3.8, p => {
    p.moveTo(-51, -45); p.quadraticCurveTo(-56, -80, -24, -84); p.quadraticCurveTo(2, -90, 27, -73);
    p.quadraticCurveTo(29, -96, 49, -106); p.lineTo(66, -88); p.lineTo(55, -56);
    p.quadraticCurveTo(42, -45, 37, -27); p.quadraticCurveTo(-6, -5, -39, -24); p.closePath();
  });
  shape(ctx, '#bcaa92', 1.5, p => {
    p.moveTo(49, -92); p.lineTo(53, -79); p.lineTo(43, -55); p.lineTo(28, -36);
    p.lineTo(4, -23); p.lineTo(-11, -25); p.quadraticCurveTo(18, -45, 26, -64); p.lineTo(35, -89);
  });
  for (let i = 0; i < 5; i++) {
    line(ctx, '#7f6d75', 1.7, p => { p.moveTo(31 - i * 6, -48 + i * 5); p.lineTo(42 - i * 8, -43 + i * 4); });
  }
  for (const [x, y, size] of [[-85, -24, 5], [-66, -35, 6], [-46, -62, 9], [-32, -76, 10], [-13, -82, 9], [7, -78, 7]]) {
    shape(ctx, '#c5b298', 1.8, p => { p.moveTo(x - size, y + 3); p.lineTo(x, y - size * 1.5); p.lineTo(x + size, y + 2); });
  }
  for (const [x, y] of [[-30, -43], [-18, -40], [-7, -48], [7, -43], [-19, -55]]) {
    line(ctx, '#b09a8e', 1.7, p => { p.moveTo(x - 4, y); p.lineTo(x, y - 3); p.lineTo(x + 4, y); });
  }
  dragonLeg(ctx, -31, -36, stride, false);
  dragonWing(ctx, false, Math.sin(cycle) - wind * 2);
  dragonLeg(ctx, 28, -39, -stride, false);
  dragonHead(ctx, wind * .45 + flame);
  if (flame > .04) {
    ctx.save(); ctx.globalAlpha = flame;
    shape(ctx, '#df9a6455', 0, p => {
      p.moveTo(97, -76); p.quadraticCurveTo(117, -91, 128, -77); p.lineTo(119, -73);
      p.lineTo(129, -63); p.lineTo(113, -66); p.lineTo(107, -58); p.lineTo(95, -67);
    });
    shape(ctx, '#f1c782', 0, p => { p.moveTo(97, -75); p.lineTo(114, -76); p.lineTo(109, -71); p.lineTo(119, -66); p.lineTo(99, -68); });
    ctx.restore();
  }
  ctx.restore();
}
