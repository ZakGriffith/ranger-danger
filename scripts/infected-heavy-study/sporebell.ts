import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Action = 'move' | 'attack';
const TAU = Math.PI * 2;

function ease(from: number, to: number, phase: number): number {
  const t = Math.max(0, Math.min(1, (phase - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

function rootFoot(ctx: CanvasRenderingContext2D, x: number, y: number, hipX: number, hipY: number, far: boolean) {
  ctx.save();
  ctx.translate(x, y);
  const tx = hipX - x;
  const ty = hipY - y;
  const fill = far
    ? wash(ctx, ty, 0, [[0, '#9f7473'], [1, '#534352']])
    : wash(ctx, ty, 0, [[0, '#dcc398'], [.48, '#b5927c'], [1, '#725465']]);
  shape(ctx, fill, far ? 2.7 : 3.2, p => {
    p.moveTo(tx - 11, ty);
    p.quadraticCurveTo(tx * .67 - 13, ty * .65, -8, -8);
    p.quadraticCurveTo(-17, -1, -10, 0);
    p.quadraticCurveTo(-5, 1, -1, -2);
    p.quadraticCurveTo(3, 2, 8, -1);
    p.quadraticCurveTo(14, 1, 21, -3);
    p.quadraticCurveTo(26, -7, 18, -10);
    p.quadraticCurveTo(11, -10, 10, -15);
    p.quadraticCurveTo(tx + 12, ty + 10, tx + 10, ty);
  });
  line(ctx, far ? '#a3817b' : '#dec39c', far ? 1.5 : 2, p => {
    p.moveTo(tx - 5, ty + 6);
    p.quadraticCurveTo(tx * .46, -12, 3, -9);
    p.quadraticCurveTo(6, -7, 12, -7);
  });
  line(ctx, '#604554', 1.45, p => {
    p.moveTo(0, -3);
    p.quadraticCurveTo(2, -6, 2, -8);
    p.moveTo(9, -3);
    p.quadraticCurveTo(11, -4, 12, -7);
  });
  ctx.restore();
}

function stalk(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -75, -10, [[0, '#895565'], [.22, '#b9847b'], [.51, '#dac1a0'], [.81, '#b18f83'], [1, '#745765']]), 3.5, p => {
    p.moveTo(-43, -62);
    p.bezierCurveTo(-42, -77, -7, -83, 19, -76);
    p.bezierCurveTo(33, -74, 40, -63, 35, -48);
    p.bezierCurveTo(35, -33, 44, -32, 41, -22);
    p.quadraticCurveTo(30, -10, 16, -13);
    p.quadraticCurveTo(4, -16, -7, -10);
    p.quadraticCurveTo(-16, -8, -21, -13);
    p.quadraticCurveTo(-31, -10, -38, -17);
    p.bezierCurveTo(-52, -29, -37, -45, -43, -62);
  });
  shape(ctx, '#e7cdb1a8', 0, p => {
    p.moveTo(-35, -50);
    p.bezierCurveTo(-23, -43, -29, -29, -33, -24);
    p.quadraticCurveTo(-38, -20, -40, -26);
    p.bezierCurveTo(-40, -36, -32, -40, -35, -50);
  });
  shape(ctx, '#634551', 2.2, p => {
    p.moveTo(-14, -61);
    p.bezierCurveTo(-5, -67, 21, -66, 30, -55);
    p.quadraticCurveTo(30, -47, 22, -44);
    p.quadraticCurveTo(15, -45, 10, -44);
    p.quadraticCurveTo(3, -37, -3, -43);
    p.quadraticCurveTo(-11, -43, -13, -50);
  });
  for (const [x, y, rx, rotation] of [[-1, -50, 4.25, .26], [19, -51, 3, -.16]] as const) {
    oval(ctx, x, y, rx + 1.65, 3.5, '#372d39', rotation);
    oval(ctx, x + .4, y - .2, rx, 2.05, '#e3d385', rotation);
    oval(ctx, x + 1.4, y, 1.2, 1.65, '#5e5344', rotation);
  }
  line(ctx, '#866370', 2.2, p => {
    p.moveTo(-25, -48);
    p.bezierCurveTo(-21, -39, -27, -31, -24, -22);
    p.moveTo(-14, -37);
    p.quadraticCurveTo(-10, -25, -15, -16);
    p.moveTo(0, -38);
    p.bezierCurveTo(5, -35, 0, -27, 5, -22);
    p.moveTo(16, -37);
    p.quadraticCurveTo(25, -27, 21, -21);
    p.moveTo(29, -41);
    p.quadraticCurveTo(27, -34, 32, -28);
  });
  line(ctx, '#e2c09c', 1.85, p => {
    p.moveTo(-20, -39);
    p.quadraticCurveTo(-17, -30, -21, -26);
    p.moveTo(-7, -33);
    p.quadraticCurveTo(-6, -25, -9, -19);
    p.moveTo(8, -34);
    p.quadraticCurveTo(4, -28, 9, -26);
  });
  for (const [x, y, rx, ry] of [[-33, -39, 3.9, 3], [-32, -31, 2.3, 1.9], [34, -33, 2.8, 2.2]] as const) {
    oval(ctx, x, y, rx, ry, '#ba7a79', -.27);
    oval(ctx, x - .7, y - .5, rx * .46, ry * .42, '#efb29d', -.3);
  }
}

function bell(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -83, -56, [[0, '#bd7f81'], [.5, '#a36776'], [1, '#674756']]), 3.6, p => {
    p.moveTo(-63, -67);
    p.bezierCurveTo(-66, -85, -29, -94, 12, -88);
    p.bezierCurveTo(41, -84, 68, -78, 64, -65);
    p.quadraticCurveTo(61, -59, 42, -57);
    p.lineTo(35, -60);
    p.lineTo(29, -57);
    p.quadraticCurveTo(4, -63, -17, -55);
    p.quadraticCurveTo(-48, -54, -57, -63);
    p.lineTo(-59, -68);
  });
  for (const [start, end] of [[-49, -48], [-39, -32], [-25, -17], [-12, -1], [4, 13], [19, 28], [35, 42], [50, 55]] as const) {
    line(ctx, '#dcae99b8', 1.9, p => {
      p.moveTo(start, -78 - Math.cos(start * .035) * 7);
      p.quadraticCurveTo(start - 8, -69, end, -61 - Math.abs(end) * .04);
    });
  }
  shape(ctx, wash(ctx, -108, -66, [[0, '#e8b49b'], [.27, '#cd8c87'], [.57, '#b2707a'], [.85, '#93596f'], [1, '#7c526b']]), 3.8, p => {
    p.moveTo(-67, -72);
    p.bezierCurveTo(-69, -78, -57, -89, -50, -92);
    p.bezierCurveTo(-40, -110, -14, -111, 2, -103);
    p.quadraticCurveTo(14, -105, 23, -99);
    p.bezierCurveTo(45, -99, 50, -85, 63, -80);
    p.quadraticCurveTo(73, -70, 63, -67);
    p.quadraticCurveTo(58, -64, 50, -68);
    p.lineTo(45, -76);
    p.lineTo(38, -69);
    p.quadraticCurveTo(25, -66, 7, -74);
    p.quadraticCurveTo(-13, -64, -28, -70);
    p.lineTo(-34, -77);
    p.lineTo(-36, -70);
    p.quadraticCurveTo(-55, -64, -67, -72);
  });
  shape(ctx, '#f1c5a5ba', 0, p => {
    p.moveTo(-56, -84);
    p.bezierCurveTo(-47, -99, -24, -106, -7, -102);
    p.quadraticCurveTo(-4, -99, -14, -96);
    p.bezierCurveTo(-30, -97, -48, -85, -55, -81);
    p.quadraticCurveTo(-61, -80, -56, -84);
  });
  line(ctx, '#f0bc9b92', 1.85, p => {
    p.moveTo(8, -100);
    p.quadraticCurveTo(22, -92, 28, -94);
    p.quadraticCurveTo(45, -92, 53, -83);
    p.moveTo(-52, -74);
    p.quadraticCurveTo(-41, -75, -39, -80);
  });
  line(ctx, '#73495f', 1.95, p => {
    p.moveTo(6, -100);
    p.quadraticCurveTo(15, -89, 15, -85);
    p.lineTo(21, -79);
    p.moveTo(15, -85);
    p.lineTo(24, -86);
    p.moveTo(-31, -96);
    p.lineTo(-28, -89);
    p.lineTo(-20, -85);
  });
  for (const [x, y, rx, ry] of [[-43, -80, 3.2, 2.1], [-34, -87, 4.9, 3], [-15, -89, 3.9, 2.1], [-10, -82, 2.25, 1.55], [31, -88, 4.8, 2.8], [41, -81, 3.2, 2.3], [53, -76, 4.7, 2.6]] as const) {
    oval(ctx, x, y, rx, ry, '#e5aa9a', -.28);
    oval(ctx, x - .9, y - .65, rx * .41, ry * .42, '#f7d4ae', -.24);
  }
}

function stompDust(ctx: CanvasRenderingContext2D, x: number, phase: number) {
  const life = (phase - .535) / .32;
  if (life <= 0 || life >= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, life * 6) * (1 - life);
  oval(ctx, x, 1, 9 + life * 23, 2.2 + life * 2.4, '#ac7a6990');
  for (const [i, direction] of [-1, 1, -1, 1, -1, 1].entries()) {
    const dx = (6 + i * 1.85 + life * (12 + i * 3.8)) * direction;
    const y = -1 - Math.sin(life * Math.PI) * (5.5 + (i % 3) * 4.2) - i;
    oval(ctx, x + dx, y, 2 + i * .15, 1.35 + i * .11, i % 2 ? '#d79b83' : '#d7c496', direction * .43);
  }
  ctx.restore();
}

export function drawSporebell(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const attacking = action === 'attack';
  const step = phase * TAU;
  const load = attacking ? ease(.04, .43, phase) * (1 - ease(.46, .54, phase)) : 0;
  const compression = attacking ? ease(.47, .56, phase) * (1 - ease(.62, .90, phase)) : 0;
  const reach = attacking ? 17 * ease(.22, .48, phase) * (1 - ease(.68, .98, phase)) : 0;
  const slide = attacking ? -6 * load + 8 * compression : 2.5 * Math.sin(step);
  const bodyY = attacking ? 3 * load + 7 * compression : -1.6 - 2 * Math.cos(step * 2);
  const backX = -26 + (attacking ? -4 * load : 8.4 * Math.cos(step));
  const frontX = 17 + (attacking ? reach : -9.4 * Math.cos(step));
  const backY = attacking ? 0 : -Math.max(0, -Math.sin(step)) * 6.2;
  const frontY = attacking ? -19 * load : -Math.max(0, Math.sin(step)) * 8.1;

  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  rootFoot(ctx, backX, backY, slide - 20, bodyY - 27, true);
  rootFoot(ctx, frontX, frontY, slide + 13, bodyY - 28, false);
  ctx.save();
  ctx.translate(slide, bodyY);
  ctx.scale(1 + .065 * compression - .035 * load, 1 - .045 * compression + .044 * load);
  ctx.rotate(attacking ? -.10 * load + .09 * compression : .035 * Math.sin(step));
  stalk(ctx);
  ctx.translate(-4 * load + 2 * compression, -2 * load + compression);
  ctx.rotate(attacking ? -.11 * load + .035 * compression : -.024 * Math.sin(step));
  bell(ctx);
  ctx.restore();
  if (attacking) stompDust(ctx, frontX + 8, phase);
  ctx.restore();
}
