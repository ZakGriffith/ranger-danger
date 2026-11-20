import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, ease, type CastleAction } from './pose';

function crown(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -148, -117, [[0, '#f2d39a'], [.5, '#b49a73'], [1, '#786075']]), 2.6, p => {
    p.moveTo(-24, -119); p.lineTo(-31, -142); p.lineTo(-15, -133); p.lineTo(-10, -150);
    p.lineTo(1, -137); p.lineTo(12, -151); p.lineTo(17, -133); p.lineTo(31, -143);
    p.lineTo(25, -120); p.quadraticCurveTo(0, -113, -24, -119);
  });
  line(ctx, '#f1d8a7', 1.6, p => { p.moveTo(-23, -123); p.quadraticCurveTo(1, -117, 24, -124); });
  for (const [x, y, size] of [[-17, -124, 2.5], [1, -125, 4], [18, -125, 2.5]]) {
    oval(ctx, x, y, size, size * 1.4, '#6ac6ba');
    oval(ctx, x - .6, y - 1, size * .33, size * .5, '#e8f1b7');
  }
}

function hand(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(turn);
  shape(ctx, '#c8c3b6', 2, p => {
    p.moveTo(-5, 6); p.lineTo(-7, -3); p.lineTo(-4, -9); p.lineTo(-3, -17); p.lineTo(0, -17);
    p.lineTo(1, -7); p.lineTo(4, -19); p.lineTo(7, -17); p.lineTo(6, -6);
    p.lineTo(11, -13); p.lineTo(13, -10); p.lineTo(10, 2); p.lineTo(4, 7);
  });
  line(ctx, '#7e7d89', 1.2, p => { p.moveTo(-3, 3); p.lineTo(-1, -4); p.moveTo(3, 3); p.lineTo(5, -4); });
  ctx.restore();
}

export function drawPhantomQueen(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const cycle = phase * TAU;
  const cast = action === 'attack' ? ease(.03, .38, phase) - ease(.55, .95, phase) : 0;
  const release = action === 'attack' ? ease(.36, .48, phase) - ease(.55, .85, phase) : 0;
  const sway = Math.sin(cycle) * 7;
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(0, Math.cos(cycle) * 3 - cast * 3);
  ctx.save(); ctx.globalAlpha = .24;
  oval(ctx, 0, -38, 48 + cast * 12, 54, '#7cbdbb');
  ctx.restore();
  shape(ctx, wash(ctx, -103, 4, [[0, '#51475c'], [.5, '#62556e'], [1, '#a6adb294']]), 3.3, p => {
    p.moveTo(-22, -103); p.quadraticCurveTo(-45, -81, -39, -53);
    p.bezierCurveTo(-41, -24, -56, -20, -59 + sway, -8); p.lineTo(-35, -12);
    p.quadraticCurveTo(-41, -3, -28 + sway, 3); p.lineTo(-9, -8);
    p.quadraticCurveTo(-11, 5, 7 + sway, 3); p.lineTo(20, -10); p.lineTo(34, -3);
    p.lineTo(32, -16); p.lineTo(55 + sway, -12); p.quadraticCurveTo(39, -34, 39, -61);
    p.quadraticCurveTo(42, -88, 20, -104);
  });
  shape(ctx, wash(ctx, -91, -3, [[0, '#b2a3ae'], [.7, '#837b98'], [1, '#b8cbba55']]), 1.4, p => {
    p.moveTo(-13, -94); p.lineTo(12, -96); p.quadraticCurveTo(8, -48, 27 + sway * .4, -13);
    p.lineTo(12, -17); p.lineTo(4, -5); p.lineTo(-6, -15); p.lineTo(-22, -10);
    p.quadraticCurveTo(-5, -56, -13, -94);
  });
  for (const side of [-1, 1]) {
    line(ctx, '#c7b693', 2, p => {
      p.moveTo(side * 20, -90); p.quadraticCurveTo(side * 19, -49, side * 39 + sway * .4, -16);
    });
    line(ctx, '#4b425b', 1.8, p => { p.moveTo(side * 24, -54); p.quadraticCurveTo(side * 20, -32, side * 28, -24); });
  }
  shape(ctx, '#a38a75', 2.1, p => { p.moveTo(-22, -73); p.quadraticCurveTo(0, -62, 23, -73); p.lineTo(21, -65); p.quadraticCurveTo(0, -55, -22, -65); });
  oval(ctx, 0, -65, 6, 7, '#d1b58a');
  shape(ctx, '#74c6b5', 1.4, p => { p.moveTo(0, -71); p.lineTo(5, -65); p.lineTo(0, -58); p.lineTo(-4, -65); });
  for (const side of [-1, 1]) {
    const handX = side * (48 + cast * 9);
    const handY = -58 - cast * 30;
    shape(ctx, wash(ctx, -97, -39, [[0, '#86718b'], [1, '#403c52']]), 2.9, p => {
      p.moveTo(side * 20, -100); p.quadraticCurveTo(side * 35, -104, handX, handY - 8);
      p.lineTo(handX + side * 10, handY + 8); p.lineTo(side * 38, -38 - cast * 20);
      p.lineTo(side * 24, -59); p.lineTo(side * 14, -80);
    });
    line(ctx, '#baa58a', 1.6, p => { p.moveTo(handX - side * 5, handY - 5); p.lineTo(handX + side * 6, handY + 9); });
    hand(ctx, handX, handY, side * (.45 - cast * 1.4));
    if (cast > .05) {
      ctx.save(); ctx.globalAlpha = cast;
      oval(ctx, handX, handY - 17, 11 + release * 7, 13 + release * 4, '#8bdec43b');
      oval(ctx, handX, handY - 17, 5 + release * 3, 7 + release * 3, '#b2e0bf');
      oval(ctx, handX - 1, handY - 19, 2.6, 3.4, '#fff0c6');
      line(ctx, '#a2ddc4', 1.5, p => { p.arc(handX, handY - 17, 17, cycle, cycle + 3.7); });
      ctx.restore();
    }
  }
  shape(ctx, '#62586e', 2, p => { p.moveTo(-27, -106); p.quadraticCurveTo(-33, -119, -22, -132); p.quadraticCurveTo(2, -147, 25, -130); p.quadraticCurveTo(39, -113, 27, -87); p.lineTo(18, -91); p.lineTo(13, -111); });
  shape(ctx, wash(ctx, -128, -94, [[0, '#e0d6bf'], [.5, '#b9bdba'], [1, '#7e8695']]), 2.5, p => {
    p.moveTo(-17, -126); p.quadraticCurveTo(0, -135, 17, -124); p.lineTo(17, -109);
    p.lineTo(9, -94); p.lineTo(-1, -90); p.lineTo(-13, -103); p.closePath();
  });
  for (const side of [-1, 1]) {
    line(ctx, '#63576e', 3.5, p => { p.moveTo(side * 4, -115); p.lineTo(side * 13, -117); });
    oval(ctx, side * 8, -114, 2.6, 1.7, '#d9eac0');
    line(ctx, '#8baaa9', 1.2, p => { p.moveTo(side * 8, -111); p.lineTo(side * 10, -103); });
  }
  line(ctx, '#8a727d', 1.5, p => { p.moveTo(-3, -100); p.lineTo(5, -100); });
  shape(ctx, '#c6b38d', 1.8, p => { p.moveTo(-22, -99); p.lineTo(-7, -88); p.lineTo(0, -95); p.lineTo(10, -87); p.lineTo(24, -101); p.lineTo(19, -86); p.lineTo(-17, -86); });
  crown(ctx);
  for (let i = 0; i < 4; i++) {
    const angle = cycle + i * TAU / 4;
    ctx.save(); ctx.globalAlpha = .3 + .35 * Math.sin(angle) ** 2;
    oval(ctx, Math.cos(angle) * 56, -12 - i * 12 + Math.sin(angle) * 6, 1.8, 3, '#c2e6cd');
    ctx.restore();
  }
  ctx.restore();
}
