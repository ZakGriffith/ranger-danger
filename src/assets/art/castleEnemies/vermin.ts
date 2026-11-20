import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, strikePhase, type CastleAction } from './pose';

function wing(ctx: CanvasRenderingContext2D, side: number, flap: number, far: boolean) {
  ctx.save(); ctx.scale(side, 1);
  const tip = -36 - flap * 17;
  shape(ctx, wash(ctx, -75, -18, [[0, far ? '#5a5267' : '#92788b'], [.6, far ? '#443e55' : '#6c526d'], [1, '#393548']]), 2.7, p => {
    p.moveTo(5, -46); p.lineTo(19, -67 - flap * 3); p.quadraticCurveTo(30, -65, 55, tip);
    p.quadraticCurveTo(39, tip + 1, 40, tip + 17); p.quadraticCurveTo(27, tip + 5, 24, -27);
    p.quadraticCurveTo(15, -41, 6, -30);
  });
  line(ctx, far ? '#95818b' : '#c1a08e', 2, p => {
    p.moveTo(7, -46); p.lineTo(20, -65 - flap * 3); p.lineTo(52, tip);
    p.moveTo(20, -65 - flap * 3); p.lineTo(38, tip + 12);
    p.moveTo(20, -65 - flap * 3); p.lineTo(24, -30);
  });
  oval(ctx, 19, -65 - flap * 3, 3, 3, '#c0a38b');
  ctx.restore();
}

export function drawCastleBat(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const flap = Math.sin(TAU * phase);
  const bite = action === 'attack' ? strikePhase(phase) : 0;
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(bite * 4, -5 + Math.cos(TAU * phase) * 3);
  wing(ctx, -1, flap, true);
  wing(ctx, 1, flap, false);
  line(ctx, ink, 5, p => { p.moveTo(-4, -22); p.lineTo(-9, -12); p.moveTo(5, -22); p.lineTo(10, -12); });
  line(ctx, '#baa18c', 2.2, p => { p.moveTo(-4, -22); p.lineTo(-9, -12); p.moveTo(5, -22); p.lineTo(10, -12); });
  shape(ctx, wash(ctx, -58, -18, [[0, '#9a8b91'], [.5, '#746779'], [1, '#423b52']]), 2.7, p => {
    p.moveTo(-11, -51); p.quadraticCurveTo(-19, -30, -5, -19); p.lineTo(6, -17);
    p.quadraticCurveTo(19, -29, 12, -48); p.quadraticCurveTo(4, -60, -11, -51);
  });
  oval(ctx, 0, -34, 7, 12, '#b5a3a0');
  for (const side of [-1, 1]) {
    shape(ctx, '#7b667d', 2.3, p => { p.moveTo(side * 5, -57); p.lineTo(side * 13, -84); p.quadraticCurveTo(side * 27, -61, side * 13, -47); });
    line(ctx, '#c29996', 2.5, p => { p.moveTo(side * 12, -60); p.lineTo(side * 14, -75); });
  }
  shape(ctx, wash(ctx, -63, -37, [[0, '#b7a39f'], [1, '#69586d']]), 2.7, p => {
    p.moveTo(-16, -56); p.quadraticCurveTo(-1, -68, 15, -57); p.lineTo(16, -43);
    p.lineTo(5, -34 - bite * 2); p.lineTo(-8, -36); p.lineTo(-17, -45);
  });
  for (const side of [-1, 1]) {
    oval(ctx, side * 8, -51, 4, 3, ink);
    oval(ctx, side * 8 + 1, -51, 2, 1.7, '#e5ac6c');
  }
  oval(ctx, 0, -44, 4.7, 2.8, '#ad7e83');
  shape(ctx, '#332c3f', 1.3, p => { p.moveTo(-8, -41); p.lineTo(8, -41); p.lineTo(6, -36 + bite * 7); p.lineTo(-5, -36 + bite * 7); });
  for (const x of [-5, 5]) shape(ctx, '#ead6ad', 1, p => { p.moveTo(x - 1.8, -41); p.lineTo(x + 1.8, -41); p.lineTo(x, -33 + bite * 2); });
  ctx.restore();
}
