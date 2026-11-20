import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { TAU, ease, type CastleAction } from './pose';

export function drawCastleWarlock(ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) {
  const cycle = phase * TAU;
  const charge = action === 'attack' ? ease(0, .28, phase) - ease(.32, .58, phase) : 0;
  const release = action === 'attack' ? ease(.3, .43, phase) - ease(.52, .9, phase) : 0;
  const sway = Math.sin(cycle) * 3;
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.translate(release * 3, Math.cos(cycle) * 1.7);
  shape(ctx, wash(ctx, -68, 0, [[0, '#40394f'], [.5, '#51415b'], [1, '#292b3c']]), 2.9, p => {
    p.moveTo(-16, -70); p.quadraticCurveTo(-29, -55, -27, -30);
    p.quadraticCurveTo(-28, -12, -39 + sway, -2); p.lineTo(-24, -4); p.lineTo(-16, 1);
    p.lineTo(-7, -3); p.lineTo(1, 1); p.lineTo(15, -2); p.lineTo(25, 0);
    p.quadraticCurveTo(23, -24, 20, -39); p.quadraticCurveTo(14, -66, 6, -72);
  });
  shape(ctx, '#786073', 0, p => {
    p.moveTo(-16, -62); p.quadraticCurveTo(-21, -38, -18, -11); p.lineTo(-28 + sway, -5);
    p.lineTo(-17, -3); p.lineTo(-9, -7); p.quadraticCurveTo(-13, -32, -8, -54);
  });
  line(ctx, '#a48c73', 2.1, p => {
    p.moveTo(-33 + sway, -4); p.lineTo(-25, -8); p.lineTo(-17, -5); p.lineTo(-8, -9);
    p.lineTo(1, -5); p.lineTo(13, -7); p.lineTo(19, -5);
  });
  for (const [x, y] of [[-17, -15], [-5, -25], [8, -13]]) {
    line(ctx, '#b49476', 1.4, p => { p.moveTo(x - 2, y - 3); p.lineTo(x + 2, y); p.lineTo(x - 2, y + 3); });
  }
  shape(ctx, '#8e735f', 2, p => { p.moveTo(-22, -47); p.lineTo(17, -47); p.lineTo(19, -41); p.lineTo(-23, -40); });
  oval(ctx, -3, -44, 5, 5, '#c6a675');
  oval(ctx, -3, -44, 2.4, 2.8, '#6dd3ba');
  // The long sleeve follows the casting hand so the gesture reads at game scale.
  shape(ctx, wash(ctx, -67, -28, [[0, '#8a7184'], [1, '#44394e']]), 2.8, p => {
    p.moveTo(7, -69); p.quadraticCurveTo(23, -73, 31, -57 - charge * 12);
    p.lineTo(39 + release * 8, -52 - charge * 15); p.lineTo(33, -31 - charge * 12);
    p.lineTo(22, -36); p.quadraticCurveTo(17, -49, 7, -54);
  });
  ctx.save();
  ctx.translate(34 + release * 8, -47 - charge * 14);
  ctx.rotate(-charge * .3 + release * .6);
  line(ctx, ink, 7.5, p => { p.moveTo(0, 34); p.lineTo(0, -48); p.lineTo(5, -56); });
  line(ctx, '#9a785b', 4.5, p => { p.moveTo(0, 34); p.lineTo(0, -48); p.lineTo(5, -56); });
  line(ctx, '#d1ad78', 1.4, p => { p.moveTo(-1, 27); p.lineTo(-1, -42); });
  for (const y of [-30, -23, 17]) line(ctx, '#c6a276', 3, p => { p.moveTo(-3, y); p.lineTo(3, y - 1); });
  oval(ctx, 1, -45, 9 + charge * 4 + release * 7, 10 + charge * 5, '#79d2b025');
  shape(ctx, '#ae956c', 1.8, p => { p.moveTo(-8, -46); p.lineTo(-12, -57); p.lineTo(-5, -54); p.lineTo(4, -59); p.lineTo(10, -55); p.lineTo(9, -45); });
  shape(ctx, wash(ctx, -60, -43, [[0, '#e0f3c0'], [.4, '#89cbb1'], [1, '#4e7f84']]), 2, p => {
    p.moveTo(-3, -65 - charge * 3); p.lineTo(6, -57); p.lineTo(3, -44); p.lineTo(-7, -49); p.lineTo(-8, -58);
  });
  line(ctx, '#eaffc7', 1.5, p => { p.moveTo(-3, -61); p.lineTo(-3, -50); });
  oval(ctx, -2, -8, 5, 4, '#b7a08b');
  ctx.restore();
  shape(ctx, wash(ctx, -105, -61, [[0, '#918293'], [.3, '#756079'], [1, '#403647']]), 3, p => {
    p.moveTo(-25, -66); p.quadraticCurveTo(-30, -88, -16, -98);
    p.lineTo(-2, -108); p.quadraticCurveTo(1, -100, 10, -94);
    p.quadraticCurveTo(23, -82, 15, -62); p.lineTo(1, -56); p.lineTo(-14, -59);
  });
  shape(ctx, '#242534', 2, p => {
    p.moveTo(-17, -78); p.quadraticCurveTo(-9, -94, 3, -86); p.quadraticCurveTo(14, -79, 7, -64);
    p.quadraticCurveTo(-9, -60, -17, -78);
  });
  line(ctx, '#b2a08a', 1.6, p => { p.moveTo(-18, -72); p.quadraticCurveTo(-14, -86, -3, -91); p.quadraticCurveTo(9, -86, 12, -71); });
  oval(ctx, -6, -77, 2.1, 1.5, '#dddda3');
  oval(ctx, 3, -77, 2.1, 1.5, '#dddda3');
  shape(ctx, '#9a918e', 1.2, p => { p.moveTo(-7, -68); p.lineTo(6, -69); p.lineTo(1, -53); p.lineTo(-3, -58); });
  if (release > .05) {
    ctx.save(); ctx.globalAlpha = release;
    line(ctx, '#c8edbd', 2, p => { p.arc(46, -86, 16, -.8, 1.2); p.moveTo(49, -104); p.lineTo(54, -109); });
    ctx.restore();
  }
  ctx.restore();
}
