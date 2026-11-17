import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Point = readonly [number, number];
const TAU = Math.PI * 2;

function ramp(ctx: CanvasRenderingContext2D, top: number, bottom: number) {
  return wash(ctx, top, bottom, [[0, '#cf8c5e'], [.31, '#a76152'], [.72, '#754655'], [1, '#4b334b']]);
}

function formedLeg(ctx: CanvasRenderingContext2D, root: Point, knee: Point, foot: Point, near: boolean) {
  const [x, y] = root;
  const [kx, ky] = knee;
  const [fx, fy] = foot;
  shape(ctx, near ? '#80505b' : '#504152', 2.4, p => {
    p.moveTo(x - 3, y);
    p.quadraticCurveTo(kx - 5, ky - 6, kx - 3, ky - 3);
    p.quadraticCurveTo(fx + 1, fy - 7, fx - 2, fy - 1);
    p.quadraticCurveTo(fx - 3, fy + 2.8, fx + 3, fy + 1.4);
    p.lineTo(fx + 9, fy - .6);
    p.quadraticCurveTo(fx + 11, fy - 3.6, fx + 6, fy - 5);
    p.quadraticCurveTo(kx + 7, ky - 2, kx + 6, ky - 5);
    p.quadraticCurveTo(x + 2, y - 8, x - 3, y);
  });
  line(ctx, near ? '#c1806a' : '#624e61', 1.35, p => {
    p.moveTo(x + 1, y - 3);
    p.quadraticCurveTo(kx + 3, ky - 5, kx + 1, ky - 1);
    p.lineTo(fx + 1.2, fy - 5);
  });
}

function legs(ctx: CanvasRenderingContext2D, gait: number, bob: number, stretch: number, near: boolean) {
  for (let i = 0; i < 4; i++) {
    const spread = [-20, -10, 2, 12][i];
    const base = [-42, -24, -1, 19][i];
    const cycle = gait + i * Math.PI + (near ? 0 : Math.PI);
    const stride = Math.sin(cycle) * 7.8 * stretch;
    const lift = Math.max(0, Math.cos(cycle)) * 5 * stretch;
    const nearY = near ? 1 : -5;
    const nearX = near ? 0 : 7;
    formedLeg(ctx, [-15 + i * 9, -22 + bob], [base + spread * .28 + stride * .4 + nearX, -13 + bob * .45 - lift * .2], [base + stride + nearX, nearY - lift], near);
  }
}

function algae(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  shape(ctx, '#536044', 1.4, p => {
    p.moveTo(-14, 1);
    p.quadraticCurveTo(-13, -7, -9, -8);
    p.quadraticCurveTo(-8, -14, -11, -16);
    p.quadraticCurveTo(-2, -16, -4, -7);
    p.quadraticCurveTo(1, -13, 7, -12);
    p.quadraticCurveTo(9, -7, 4, -6);
    p.quadraticCurveTo(4, -3, 10, -4);
    p.lineTo(13, 0);
    p.quadraticCurveTo(6, 5, 2, 3);
    p.quadraticCurveTo(-6, 7, -14, 1);
  });
  line(ctx, '#9aa45a', 1.35, p => {
    p.moveTo(-10, -.7); p.quadraticCurveTo(-4, -3, -6, -11);
    p.moveTo(0, -3); p.lineTo(5, -8);
    p.moveTo(6, 0); p.lineTo(10, -1);
  });
  ctx.restore();
}

function shell(ctx: CanvasRenderingContext2D, bob: number, lean: number, feeler: number) {
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(lean);
  shape(ctx, wash(ctx, -32, -13, [[0, '#a77564'], [.44, '#715166'], [1, '#3d3049']]), 2.6, p => {
    p.moveTo(-43, -18);
    p.quadraticCurveTo(-55, -13, -70, -19);
    p.quadraticCurveTo(-75, -25, -66, -27);
    p.quadraticCurveTo(-71, -34, -62, -36);
    p.quadraticCurveTo(-53, -38, -48, -33);
    p.quadraticCurveTo(-41, -38, -36, -31);
    p.lineTo(-35, -21);
  });
  line(ctx, '#bf8c76', 1.45, p => {
    p.moveTo(-61, -33); p.quadraticCurveTo(-56, -30, -54, -25);
    p.moveTo(-68, -24); p.quadraticCurveTo(-60, -22, -55, -23);
  });
  for (const [x, y, width] of [[-49, -27, 12], [-39, -31, 15], [-27, -32, 17]]) {
    shape(ctx, ramp(ctx, y - 14, y + 13), 2.5, p => {
      p.moveTo(x - width + 3, y - 5);
      p.quadraticCurveTo(x - width * .48, y - 16, x + 5, y - 14);
      p.quadraticCurveTo(x + width, y - 9, x + width - 1, y + 1);
      p.quadraticCurveTo(x + width - 4, y + 11, x + 1, y + 11);
      p.quadraticCurveTo(x - width + 3, y + 9, x - width + 3, y - 5);
    });
    line(ctx, '#d39c72', 1.35, p => {
      p.moveTo(x - width + 4, y - 2);
      p.quadraticCurveTo(x - width * .57, y - 10, x + 2, y - 11);
    });
  }
  shape(ctx, wash(ctx, -59, -15, [[0, '#bd835e'], [.37, '#9c5c54'], [.68, '#714952'], [1, '#503447']]), 3.2, p => {
    p.moveTo(-27, -26);
    p.bezierCurveTo(-28, -41, -20, -58, -9, -58);
    p.bezierCurveTo(2, -62, 22, -55, 28, -45);
    p.quadraticCurveTo(33, -43, 42, -41);
    p.quadraticCurveTo(40, -36, 31, -34);
    p.quadraticCurveTo(35, -19, 19, -16);
    p.bezierCurveTo(-7, -12, -22, -18, -27, -26);
  });
  shape(ctx, '#66445a', 0, p => {
    p.moveTo(-23, -29); p.bezierCurveTo(-5, -19, 12, -22, 31, -31);
    p.quadraticCurveTo(33, -21, 17, -17); p.quadraticCurveTo(-8, -13, -23, -29);
  });
  line(ctx, '#d7996e', 1.85, p => {
    p.moveTo(-22, -33); p.bezierCurveTo(-21, -42, -17, -50, -8, -53);
    p.quadraticCurveTo(-1, -55, 9, -52);
    p.moveTo(-22, -29); p.quadraticCurveTo(-16, -24, -12, -24);
  });
  line(ctx, '#5c3e52', 2.3, p => {
    p.moveTo(-11, -43); p.lineTo(-9, -35); p.lineTo(1, -33); p.lineTo(3, -26);
    p.moveTo(-9, -35); p.lineTo(-14, -30);
    p.moveTo(6, -50); p.quadraticCurveTo(16, -48, 19, -41);
  });
  line(ctx, '#adbc65', 1.5, p => {
    p.moveTo(-10.6, -42.8); p.lineTo(-8.7, -35.3); p.lineTo(.2, -33.1); p.lineTo(1.7, -28.5);
    p.moveTo(-8.9, -35.5); p.lineTo(-12.8, -31.5);
  });
  algae(ctx, -43, -39, -.29, .77);
  algae(ctx, -10, -54, .10, .65);
  for (const [x, y, radius] of [[-18, -47, 2.3], [-14, -43, 1.35], [-21, -44, 1.0], [9, -27, 1.5], [15, -24, 1.1]]) {
    oval(ctx, x, y, radius, radius * .63, '#b59478', -.38);
  }
  line(ctx, ink, 5, p => {
    p.moveTo(15, -38); p.quadraticCurveTo(16, -48, 23, -50);
    p.moveTo(23, -37); p.quadraticCurveTo(26, -44, 31, -45);
  });
  line(ctx, '#b78062', 2, p => {
    p.moveTo(15, -39); p.quadraticCurveTo(18, -47, 23, -49);
    p.moveTo(24, -39); p.quadraticCurveTo(28, -43, 31, -44);
  });
  shape(ctx, '#cfce73', 2.4, p => p.ellipse(24, -50, 6.5, 4.7, -.20, 0, TAU));
  shape(ctx, '#dbc582', 1.9, p => p.ellipse(32, -45, 4.3, 3.3, -.25, 0, TAU));
  oval(ctx, 26.2, -49.7, 1.7, 2.9, '#302d32', -.35);
  oval(ctx, 23.5, -51.7, 1.2, .7, '#fff0b9', -.26);
  oval(ctx, 33.4, -45.4, 1.0, 1.75, '#302d32', -.21);
  line(ctx, '#402d42', 3.5, p => {
    p.moveTo(24, -36); p.quadraticCurveTo(37, -51, 48, -55 + feeler);
    p.quadraticCurveTo(57, -60 + feeler, 63, -58 + feeler);
    p.moveTo(29, -32); p.quadraticCurveTo(41, -38, 57, -35 + feeler * .4);
  });
  line(ctx, '#c58b66', 1.25, p => {
    p.moveTo(25, -37); p.quadraticCurveTo(37, -51, 48, -55.6 + feeler);
    p.quadraticCurveTo(57, -61 + feeler, 63, -58.7 + feeler);
    p.moveTo(29, -33); p.quadraticCurveTo(41, -39, 57, -35.5 + feeler * .4);
  });
  ctx.restore();
}

function pincer(ctx: CanvasRenderingContext2D, base: Point, angle: number, size: number, gape: number, far: boolean) {
  ctx.save();
  ctx.translate(...base);
  ctx.rotate(angle);
  ctx.scale(size, size);
  const armor = far ? '#613f52' : ramp(ctx, -27, 17);
  shape(ctx, armor, 3.3, p => {
    p.moveTo(-14, -9);
    p.bezierCurveTo(-10, -16, -3, -22, 10, -22);
    p.bezierCurveTo(19, -25, 30, -19, 33, -13 - gape);
    p.quadraticCurveTo(44, -10 - gape, 46, -2 - gape);
    p.quadraticCurveTo(38, -5 - gape, 28, -6);
    p.lineTo(22, -2); p.lineTo(19, -4); p.lineTo(17, 1); p.lineTo(13, -.8);
    p.quadraticCurveTo(13, 6, 18, 8);
    p.quadraticCurveTo(7, 19, -3, 15);
    p.quadraticCurveTo(-13, 13, -14, 5);
    p.quadraticCurveTo(-19, -2, -14, -9);
  });
  shape(ctx, far ? '#694455' : wash(ctx, 2, 23, [[0, '#bd7a59'], [.65, '#80505b'], [1, '#4e374e']]), 2.8, p => {
    p.moveTo(8, 7);
    p.quadraticCurveTo(14, 3, 18, 6 + gape * .12);
    p.lineTo(24, 2 + gape * .3); p.lineTo(27, 5 + gape * .36);
    p.quadraticCurveTo(37, 7 + gape * .5, 44, 3 + gape * .67);
    p.quadraticCurveTo(43, 12 + gape * .7, 29, 16.5 + gape * .24);
    p.quadraticCurveTo(18, 20, 10, 14);
  });
  if (!far) {
    shape(ctx, '#de9a68', 0, p => {
      p.moveTo(-11, -9); p.bezierCurveTo(-6, -18, 5, -20, 13, -19);
      p.quadraticCurveTo(20, -19, 25, -13);
      p.quadraticCurveTo(15, -16, 9, -13); p.quadraticCurveTo(-1, -14, -11, -9);
    });
    line(ctx, '#e4a174', 1.7, p => {
      p.moveTo(15, 11.8); p.quadraticCurveTo(28, 15.3 + gape * .22, 38, 10.4 + gape * .45);
      p.moveTo(-10, -7); p.quadraticCurveTo(-13, -2, -9, 4);
    });
    line(ctx, '#603d4f', 3.3, p => {
      p.moveTo(4, -17); p.lineTo(2.5, -11); p.lineTo(8, -8); p.lineTo(6, -2);
      p.moveTo(2.5, -11); p.lineTo(-2, -9);
    });
    line(ctx, '#b7c86d', 1.6, p => {
      p.moveTo(4, -17); p.lineTo(2.5, -11); p.lineTo(8, -8); p.lineTo(6.7, -3);
    });
    for (const [x, y, r] of [[-7, -6, 2.2], [-5, -2, 1.2], [-9, .2, 1.45], [17, -15, 2.05], [22, -12.7, 1.25]]) {
      oval(ctx, x, y, r, r * .63, '#b88770', -.34);
    }
  }
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, root: Point, joint: Point, claw: Point, far: boolean) {
  const contour = (p: CanvasRenderingContext2D) => {
    p.moveTo(...root); p.quadraticCurveTo(joint[0], joint[1], ...claw);
  };
  line(ctx, ink, far ? 10 : 15, contour);
  line(ctx, far ? '#65475a' : '#9a635c', far ? 6 : 11, contour);
  line(ctx, far ? '#8e6467' : '#c68b68', far ? 1.4 : 2, p => {
    p.moveTo(root[0], root[1] - 2.7);
    p.quadraticCurveTo(joint[0], joint[1] - 4, claw[0], claw[1] - 2.9);
  });
}

function clampUnit(t: number) { return Math.max(0, Math.min(1, t)); }
function ease(t: number) { return t * t * (3 - 2 * t); }

function muddyImpact(ctx: CanvasRenderingContext2D, phase: number) {
  const progress = clampUnit((phase - .591) / .25);
  const opacity = (1 - progress) * clampUnit((phase - .591) / .023);
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  oval(ctx, 51, 2, 16 + 15 * progress, 3, '#342d43');
  line(ctx, '#838352', 1.4, p => p.ellipse(52, 1, 11 + progress * 20, 3.5, 0, 0, TAU));
  for (let i = 0; i < 5; i++) {
    const x = 48 + (i - 2) * (3 + progress * 14);
    const y = -Math.sin(progress * Math.PI) * (15 - Math.abs(i - 2) * 2.8);
    oval(ctx, x, y, 2.5 - progress, 1.8, i % 2 ? '#ad926b' : '#5c5260', i * .56);
  }
  ctx.restore();
}

export function drawBogclaw(ctx: CanvasRenderingContext2D, action: 'move' | 'attack', phase: number) {
  const moving = action === 'move';
  const gait = phase * TAU * 2;
  const lift = moving ? 0 : ease(clampUnit(phase / .46)) * (1 - clampUnit((phase - .48) / .12) ** 2);
  const hit = moving ? 0 : ease(clampUnit((phase - .49) / .115)) * (1 - ease(clampUnit((phase - .64) / .35)));
  const bob = moving ? -1.1 - Math.cos(gait * 2) * 1.1 : -lift * 2.2 + hit * 4.8;
  const claw: Point = [38 - lift * 9 + hit * 2 + (moving ? Math.sin(gait) * 3.5 : 0), -19 - lift * 44 + hit * 5 + bob * .31];
  const angle = -.22 - lift * .9 + hit * .28;
  const smallClaw: Point = [32 - lift * 3, -23 - lift * 10 + bob * .55];
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  if (!moving) muddyImpact(ctx, phase);
  legs(ctx, gait, bob, moving ? 1 : 0, false);
  arm(ctx, [8, -27 + bob], [26, -30 + bob], smallClaw, true);
  pincer(ctx, smallClaw, -.5 - lift * .4, .58, 2, true);
  legs(ctx, gait, bob, moving ? 1 : 0, true);
  shell(ctx, bob, -lift * .095 + hit * .088, moving ? Math.sin(gait) * 2.1 : lift * -2.6 + hit * 3.8);
  arm(ctx, [9, -26 + bob], [32 - lift * 12, -13 - lift * 28 + hit * 4], claw, false);
  oval(ctx, 11, -26 + bob, 6.6, 4.8, '#694851', -.55);
  line(ctx, '#bc8165', 1.35, p => {
    p.moveTo(8, -27 + bob); p.quadraticCurveTo(11, -31 + bob, 15, -28 + bob);
  });
  pincer(ctx, claw, angle, 1, 3.5 + lift * 3 - hit * 3.3, false);
  ctx.restore();
}
