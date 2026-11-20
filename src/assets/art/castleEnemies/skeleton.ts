import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, ease, strikePhase, type CastleAction } from './pose';

const bone = '#d7c9a6';
const boneShade = '#928785';
const iron = '#656473';
const rust = '#a2755c';

function limb(ctx: CanvasRenderingContext2D, points: readonly [number, number, number, number, number, number], far: boolean) {
  const [x, y, kneeX, kneeY, footX, footY] = points;
  line(ctx, ink, 8, p => { p.moveTo(x, y); p.lineTo(kneeX, kneeY); p.lineTo(footX, footY); });
  line(ctx, far ? boneShade : bone, 4.4, p => {
    p.moveTo(x, y); p.lineTo(kneeX, kneeY); p.moveTo(kneeX, kneeY + 3); p.lineTo(footX, footY);
  });
  oval(ctx, kneeX, kneeY, 4.4, 4, far ? '#746c75' : '#b9a991');
  line(ctx, ink, 6, p => { p.moveTo(footX - 3, footY); p.lineTo(footX + 8, footY); });
  line(ctx, boneShade, 2.7, p => { p.moveTo(footX - 2, footY - 1); p.lineTo(footX + 7, footY - 1); });
}

function skull(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -98, -67, [[0, '#f1dfb7'], [.55, bone], [1, boneShade]]), 2.7, p => {
    p.moveTo(-12, -86); p.bezierCurveTo(-16, -104, 17, -106, 20, -90);
    p.lineTo(22, -80); p.lineTo(14, -77); p.lineTo(12, -68); p.lineTo(-2, -67);
    p.lineTo(-6, -77); p.quadraticCurveTo(-15, -78, -12, -86);
  });
  oval(ctx, -3, -84, 5.2, 6.4, ink, -.2);
  oval(ctx, 13, -84, 4.9, 5.8, ink, .18);
  oval(ctx, -1.5, -84, 1.8, 2.2, '#e4b56f');
  oval(ctx, 14, -84, 1.6, 2, '#e4b56f');
  shape(ctx, '#625967', 0, p => { p.moveTo(5, -79); p.lineTo(2, -73); p.lineTo(9, -73); });
  line(ctx, '#71646a', 1.4, p => {
    p.moveTo(1, -70); p.lineTo(13, -71); p.moveTo(4, -73); p.lineTo(4, -68);
    p.moveTo(8, -74); p.lineTo(8, -69); p.moveTo(-4, -98); p.lineTo(-1, -94); p.lineTo(-4, -90);
  });
  shape(ctx, wash(ctx, -105, -91, [[0, '#a3a39a'], [1, '#555663']]), 2.2, p => {
    p.moveTo(-17, -92); p.lineTo(-11, -103); p.lineTo(3, -107); p.lineTo(18, -100);
    p.lineTo(22, -91); p.lineTo(10, -94); p.lineTo(-5, -95);
  });
  line(ctx, rust, 2, p => { p.moveTo(-10, -100); p.lineTo(-4, -102); p.moveTo(13, -98); p.lineTo(17, -94); });
}

export function drawCastleSkeleton(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const attack = action === 'attack';
  const cycle = TAU * phase;
  const stride = attack ? 0 : Math.sin(cycle) * 10;
  const wind = attack ? ease(.02, .28, phase) - ease(.3, .48, phase) : 0;
  const strike = attack ? strikePhase(phase) : 0;
  const bob = attack ? 2 * strike : Math.cos(cycle * 2) * 1.3;
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(strike * 5 - wind * 3, bob);
  limb(ctx, [3, -35, 9 - stride * .45, -18, 6 - stride, -2], true);
  limb(ctx, [-8, -35, -11 + stride * .45, -19, -11 + stride, 0], false);
  line(ctx, ink, 8, p => { p.moveTo(-3, -69); p.lineTo(-3, -36); });
  line(ctx, boneShade, 4, p => { p.moveTo(-3, -69); p.lineTo(-3, -36); });
  for (let i = 0; i < 4; i++) {
    line(ctx, i % 2 ? boneShade : bone, 3.3, p => {
      p.moveTo(-3, -64 + i * 6); p.bezierCurveTo(-23, -71 + i * 7, -24, -52 + i * 4, -6, -51 + i * 4);
      p.moveTo(0, -64 + i * 6); p.quadraticCurveTo(16, -64 + i * 6, 11, -54 + i * 5);
    });
  }
  shape(ctx, '#b4a58e', 2.1, p => { p.moveTo(-16, -37); p.lineTo(1, -40); p.lineTo(11, -34); p.lineTo(5, -28); p.lineTo(-9, -29); });
  shape(ctx, '#674956', 2, p => { p.moveTo(-15, -34); p.lineTo(9, -32); p.lineTo(13, -19); p.lineTo(4, -23); p.lineTo(-2, -18); p.lineTo(-15, -23); });
  ctx.save();
  ctx.translate(-17, -63);
  ctx.rotate(-.1 + Math.sin(cycle) * .08);
  line(ctx, boneShade, 5, p => { p.moveTo(0, 0); p.lineTo(-9, 15); p.lineTo(-4, 28); });
  shape(ctx, wash(ctx, 12, 46, [[0, '#8d8981'], [.45, iron], [1, '#424351']]), 2.6, p => {
    p.moveTo(-23, 11); p.lineTo(3, 11); p.lineTo(6, 30); p.quadraticCurveTo(0, 44, -9, 48);
    p.quadraticCurveTo(-23, 38, -24, 25);
  });
  line(ctx, '#b2a18a', 1.7, p => { p.moveTo(-20, 15); p.lineTo(0, 15); p.lineTo(2, 30); p.lineTo(-9, 43); p.lineTo(-19, 32); p.closePath(); });
  oval(ctx, -9, 27, 4.7, 5.8, '#b39b78');
  line(ctx, rust, 2, p => { p.moveTo(-18, 20); p.lineTo(-17, 24); p.moveTo(-4, 36); p.lineTo(-8, 40); });
  ctx.restore();
  skull(ctx);
  ctx.save();
  ctx.translate(14, -64);
  ctx.rotate(-.24 - wind * 1.4 + strike * 1.5);
  limb(ctx, [0, 0, 10, 10, 18, -1], false);
  ctx.translate(18, -1);
  shape(ctx, wash(ctx, -61, -7, [[0, '#f0e4c3'], [.4, '#bcbcae'], [1, '#7d7e83']]), 2.2, p => {
    p.moveTo(-4, -8); p.lineTo(-4, -49); p.lineTo(0, -62); p.lineTo(5, -48); p.lineTo(4, -8);
  });
  line(ctx, '#e9daba', 1.2, p => { p.moveTo(0, -53); p.lineTo(0, -12); });
  line(ctx, '#b8986c', 4, p => { p.moveTo(-11, -7); p.lineTo(11, -7); });
  line(ctx, '#654840', 4.2, p => { p.moveTo(0, -5); p.lineTo(0, 4); });
  oval(ctx, 0, 6, 3, 3, '#b09870');
  ctx.restore();
  ctx.restore();
}
