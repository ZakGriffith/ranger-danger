import { ink, shape, line, oval, wash, pose, type Action } from './paint';

function hoof(ctx: CanvasRenderingContext2D, x: number, phase: number, far: boolean, front: boolean, bob: number) {
  const swing = Math.sin(phase) * 7, lift = Math.max(0, Math.cos(phase)) * 4;
  const y = (far ? -7 : 0) - lift;
  shape(ctx, far ? '#493544' : wash(ctx, -35, y, [[0, '#9f6c64'], [.4, '#75505a'], [1, '#493343']]), 2.7, p => {
    p.moveTo(x - 10, -37 + bob); p.quadraticCurveTo(x + 7, -43 + bob, x + 13, -30 + bob);
    p.lineTo(x + 6 + swing * .3, -14); p.lineTo(x + 7 + swing, y - 6);
    p.lineTo(x - 7 + swing, y - 3); p.lineTo(x - 5 + swing * .4, -19); p.lineTo(x - 12, -29);
  });
  if (!far) shape(ctx, '#ac7e6d', 0, p => { p.moveTo(x - 7, -34 + bob); p.quadraticCurveTo(x + 5, -38, x + 7, -30); p.lineTo(x, -20); p.lineTo(x - 4, -23); });
  shape(ctx, far ? '#352b38' : '#4a3947', 2.2, p => {
    p.moveTo(x - 7 + swing, y - 8); p.lineTo(x + 6 + swing, y - 10);
    p.lineTo(x + 13 + swing, y - 3); p.lineTo(x + 12 + swing, y + 1); p.lineTo(x - 9 + swing, y + 1);
  });
  line(ctx, far ? '#75616a' : '#b49b8e', 1.4, p => { p.moveTo(x - 4 + swing, y - 6); p.lineTo(x + 7 + swing, y - 6); p.moveTo(x + 3 + swing, y - 6); p.lineTo(x + 3 + swing, y); });
  if (front && !far) line(ctx, '#523848', 1.5, p => { p.moveTo(x, -19); p.lineTo(x + 5, -21); });
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, turn: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(turn); ctx.scale(size, size);
  shape(ctx, wash(ctx, -15, 8, [[0, '#c0cb82'], [.35, '#899d60'], [1, '#4c6251']]), 2.4, p => {
    p.moveTo(-19, 2); p.quadraticCurveTo(-20, -8, -6, -14); p.quadraticCurveTo(8, -21, 20, -8);
    p.lineTo(24, -1); p.quadraticCurveTo(15, 11, -3, 8); p.lineTo(-17, 6);
  });
  shape(ctx, '#cbd995', 0, p => { p.moveTo(-16, -1); p.quadraticCurveTo(-9, -12, 5, -13); p.lineTo(14, -9); p.quadraticCurveTo(-4, -10, -12, 0); });
  line(ctx, '#3d4b45', 1.8, p => { p.moveTo(-15, 4); p.quadraticCurveTo(4, 9, 19, 0); });
  for (const [x, y] of [[-5, -7], [7, -9], [11, -3]]) oval(ctx, x, y, 2.3, 1.5, '#d8dca1');
  ctx.restore();
}

export function drawRotback(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const { gait, wind, hit } = pose(action, phase), bob = Math.cos(gait * 2) * 1.3 + wind * 3;
  ctx.save(); ctx.translate(-9 - wind * 5 + hit * 9, 0);
  hoof(ctx, -36, gait + Math.PI, true, false, bob); hoof(ctx, 22, gait + .5, true, true, bob);
  line(ctx, ink, 5.8, p => { p.moveTo(-56, -43 + bob); p.bezierCurveTo(-77, -37, -76, -55, -68, -53); p.bezierCurveTo(-60, -50, -69, -43, -72, -49); });
  line(ctx, '#a87971', 2.7, p => { p.moveTo(-56, -43 + bob); p.bezierCurveTo(-77, -37, -76, -55, -68, -53); p.bezierCurveTo(-60, -50, -69, -43, -72, -49); });
  shape(ctx, wash(ctx, -78, -14, [[0, '#b5826d'], [.36, '#93615f'], [.75, '#704453'], [1, '#483044']]), 3.1, p => {
    p.moveTo(-60, -34 + bob); p.bezierCurveTo(-69, -58 + bob, -44, -79 + bob, -16, -72 + bob);
    p.bezierCurveTo(4, -87 + bob, 32, -76 + bob, 38, -51 + bob);
    p.lineTo(33, -24 + bob); p.quadraticCurveTo(11, -10 + bob, -20, -17 + bob);
    p.quadraticCurveTo(-50, -11 + bob, -60, -34 + bob);
  });
  shape(ctx, '#c29578', 0, p => {
    p.moveTo(-56, -48 + bob); p.quadraticCurveTo(-45, -70, -19, -66 + bob);
    p.quadraticCurveTo(-5, -77, 14, -72 + bob); p.lineTo(24, -62 + bob);
    p.quadraticCurveTo(1, -69, -12, -53 + bob); p.lineTo(-16, -59 + bob); p.quadraticCurveTo(-37, -54, -49, -39 + bob);
  });
  shape(ctx, '#573748', 0, p => { p.moveTo(-52, -30 + bob); p.quadraticCurveTo(-18, -18, 15, -32 + bob); p.lineTo(30, -39 + bob); p.lineTo(29, -24 + bob); p.quadraticCurveTo(-20, -9, -48, -23 + bob); });
  for (const [x, y, size, turn] of [[-38, -67, .86, -.15], [-16, -74, 1, -.1], [8, -76, .87, .15], [-31, -50, .7, -.2], [-3, -56, .85, .15]]) shelf(ctx, x, y + bob, size, turn);
  shape(ctx, '#60435b', 1.8, p => { p.moveTo(-9, -45 + bob); p.quadraticCurveTo(4, -54, 16, -45 + bob); p.lineTo(10, -34 + bob); p.lineTo(-1, -33 + bob); });
  for (const [x, y, r] of [[-4, -42, 4], [5, -44, 3.7], [9, -37, 2.5]]) {
    oval(ctx, x, y + bob, r, r * .8, '#a17aaf'); oval(ctx, x - 1, y - 1 + bob, r * .4, r * .25, '#d3b0d0');
  }
  hoof(ctx, -43, gait, false, false, bob); hoof(ctx, 19, gait + Math.PI + .5, false, true, bob);
  ctx.save(); ctx.translate(29 + hit * 7, -45 + bob - wind * 7); ctx.rotate(-.08 - wind * .18 + hit * .24);
  shape(ctx, wash(ctx, -31, 28, [[0, '#c09276'], [.4, '#a16c66'], [1, '#5c354b']]), 3, p => {
    p.moveTo(-16, -18); p.quadraticCurveTo(-17, -36, 3, -32); p.quadraticCurveTo(22, -32, 28, -15);
    p.lineTo(42, -8); p.quadraticCurveTo(55, -7, 51, 9); p.lineTo(45, 17); p.lineTo(23, 21);
    p.quadraticCurveTo(5, 33, -10, 17); p.lineTo(-18, 4);
  });
  shape(ctx, '#e0ad88', 0, p => { p.moveTo(-9, -22); p.quadraticCurveTo(7, -36, 18, -21); p.lineTo(23, -10); p.lineTo(12, -14); p.lineTo(3, -9); p.lineTo(-4, -14); });
  shape(ctx, '#69445a', 2.3, p => { p.moveTo(-5, -22); p.lineTo(-14, -42); p.quadraticCurveTo(0, -44, 10, -29); p.lineTo(6, -17); });
  shape(ctx, '#b87885', 0, p => { p.moveTo(-8, -37); p.lineTo(5, -25); p.lineTo(0, -25); });
  shape(ctx, '#cb9290', 2.3, p => { p.moveTo(34, -4); p.quadraticCurveTo(51, -9, 52, 3); p.quadraticCurveTo(51, 17, 37, 15); p.lineTo(31, 8); });
  for (const x of [39, 47]) oval(ctx, x, 4, 2.3, 3.1, '#643c50', -.2);
  line(ctx, '#3e2e3c', 2.1, p => { p.moveTo(17, 15); p.quadraticCurveTo(32, 21, 45, 13); });
  shape(ctx, wash(ctx, -3, 24, [[0, '#fff0c2'], [.5, '#d6c193'], [1, '#8e7c7e']]), 2.1, p => { p.moveTo(18, 21); p.quadraticCurveTo(14, 8, 21, 0); p.quadraticCurveTo(20, 16, 28, 18); p.lineTo(27, 23); });
  shape(ctx, '#302735', 1.4, p => { p.moveTo(8, -10); p.lineTo(20, -13); p.lineTo(22, -6); p.lineTo(13, -3); });
  oval(ctx, 16, -7, 3.4, 2.7, '#efcb73'); oval(ctx, 17, -6.8, 1.6, 2.1, '#292633'); oval(ctx, 15, -8.3, 1, .8, '#fff1bb');
  line(ctx, '#edbc86', 3, p => { p.moveTo(6, -13); p.lineTo(20, -15); p.lineTo(24, -11); });
  for (const [x, y] of [[-9, 2], [-3, 12], [6, 18]]) line(ctx, '#ba8580', 1.3, p => { p.moveTo(x, y); p.lineTo(x + 4, y - 2); });
  ctx.restore(); ctx.restore();
}
