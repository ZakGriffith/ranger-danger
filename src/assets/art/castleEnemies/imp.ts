import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, strikePhase, type CastleAction } from './pose';

function claw(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  shape(ctx, wash(ctx, -4, 14, [[0, '#897783'], [1, '#4a3c54']]), 2.3, p => {
    p.moveTo(-7, -6); p.lineTo(3, -8); p.lineTo(9, -2); p.lineTo(10, 8); p.lineTo(1, 13); p.lineTo(-8, 7);
  });
  for (const x of [-5, 1, 7]) {
    shape(ctx, '#c5ab8b', 1.2, p => { p.moveTo(x - 2, 5); p.lineTo(x + 3, 8); p.lineTo(x + 3, 19); p.quadraticCurveTo(x - 1, 15, x - 2, 5); });
  }
  ctx.restore();
}

export function drawCastleImp(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const cycle = phase * TAU;
  const strike = action === 'attack' ? strikePhase(phase) : 0;
  const run = action === 'move' ? Math.sin(cycle) * 11 : 0;
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(strike * 8, Math.cos(cycle * 2) * 2);
  line(ctx, ink, 6.5, p => { p.moveTo(-13, -28); p.bezierCurveTo(-58, -12, -52, -60, -40, -66); });
  line(ctx, '#6c566c', 3.5, p => { p.moveTo(-13, -28); p.bezierCurveTo(-58, -12, -52, -60, -40, -66); });
  shape(ctx, '#b29376', 1.5, p => { p.moveTo(-46, -66); p.lineTo(-35, -76); p.lineTo(-36, -61); p.lineTo(-40, -65); });
  for (const side of [-1, 1]) {
    const footX = side * 13 + run * side;
    line(ctx, ink, 11, p => { p.moveTo(side * 8, -30); p.lineTo(side * 15 - run * .4, -16); p.lineTo(footX, -3); });
    line(ctx, side < 0 ? '#655364' : '#94808b', 6.5, p => { p.moveTo(side * 8, -30); p.lineTo(side * 15 - run * .4, -16); p.lineTo(footX, -3); });
    shape(ctx, '#b99b80', 1.8, p => { p.moveTo(footX - 6, -4); p.lineTo(footX + 8, -5); p.lineTo(footX + 13, 0); p.lineTo(footX - 6, 0); });
  }
  shape(ctx, wash(ctx, -63, -24, [[0, '#a18b94'], [.45, '#7a627b'], [1, '#494051']]), 3, p => {
    p.moveTo(-21, -57); p.quadraticCurveTo(-1, -75, 16, -55); p.lineTo(20, -38);
    p.quadraticCurveTo(4, -22, -15, -30); p.quadraticCurveTo(-24, -42, -21, -57);
  });
  shape(ctx, '#a08b8a', 0, p => { p.moveTo(-6, -58); p.quadraticCurveTo(9, -60, 11, -44); p.lineTo(3, -33); p.lineTo(-4, -40); });
  line(ctx, '#564657', 1.7, p => { p.moveTo(-1, -53); p.lineTo(-4, -46); p.moveTo(3, -49); p.lineTo(7, -46); });
  line(ctx, ink, 11, p => { p.moveTo(-19, -56); p.lineTo(-30, -36); p.lineTo(-25, -27); });
  line(ctx, '#705768', 6.7, p => { p.moveTo(-19, -56); p.lineTo(-30, -36); p.lineTo(-25, -27); });
  claw(ctx, -25, -27, -.3);
  ctx.save(); ctx.translate(2, -71); ctx.rotate(-.08 + strike * .15);
  for (const side of [-1, 1]) {
    shape(ctx, wash(ctx, -35, -8, [[0, '#e0c49d'], [1, '#8b6e69']]), 2, p => {
      p.moveTo(side * 13, -9); p.quadraticCurveTo(side * 31, -23, side * 20, -37);
      p.quadraticCurveTo(side * 21, -21, side * 7, -19);
    });
    shape(ctx, '#887281', 2, p => { p.moveTo(side * 12, -5); p.lineTo(side * 34, -11); p.lineTo(side * 25, 4); p.lineTo(side * 12, 7); });
  }
  shape(ctx, wash(ctx, -25, 19, [[0, '#ab9298'], [.5, '#80657d'], [1, '#514455']]), 2.7, p => {
    p.moveTo(-18, -16); p.quadraticCurveTo(0, -28, 17, -15); p.lineTo(21, 3); p.lineTo(13, 17);
    p.lineTo(2, 23); p.lineTo(-12, 14); p.lineTo(-20, 1);
  });
  for (const side of [-1, 1]) {
    shape(ctx, '#e6ba72', 1.8, p => { p.moveTo(side * 3, -3); p.lineTo(side * 17, -8); p.quadraticCurveTo(side * 17, 3, side * 8, 4); p.lineTo(side * 3, 1); });
    oval(ctx, side * 10, -.5, 1.5, 4, ink);
  }
  shape(ctx, '#292638', 1.5, p => { p.moveTo(-11, 9); p.lineTo(13, 7); p.lineTo(10, 15); p.lineTo(-4, 17); });
  shape(ctx, '#dfcba7', 0, p => { p.moveTo(-8, 10); p.lineTo(-4, 10); p.lineTo(-5, 15); p.moveTo(8, 9); p.lineTo(12, 9); p.lineTo(10, 14); });
  ctx.restore();
  line(ctx, ink, 11, p => { p.moveTo(16, -55); p.lineTo(28 + strike * 11, -47); p.lineTo(26 + strike * 20, -29 - strike * 15); });
  line(ctx, '#9b818e', 6.7, p => { p.moveTo(16, -55); p.lineTo(28 + strike * 11, -47); p.lineTo(26 + strike * 20, -29 - strike * 15); });
  claw(ctx, 26 + strike * 20, -29 - strike * 15, -.35 - strike * 1.4);
  ctx.restore();
}
