import type { MeadowEnemyPose } from './pose';

const ink = '#30242a';
const shadow = '#684047';
const bone = '#ffe3ae';

function wash(ctx: CanvasRenderingContext2D, top: number, bottom: number, stops: readonly (readonly [number, string])[]) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function shape(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, trace: (path: CanvasRenderingContext2D) => void, outline = 0) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline > 0) {
    ctx.lineWidth = outline;
    ctx.strokeStyle = ink;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, width: number, trace: (path: CanvasRenderingContext2D) => void) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function spot(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string | CanvasGradient, angle = 0) {
  shape(ctx, color, p => p.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2));
}

function leg(ctx: CanvasRenderingContext2D, rootX: number, rootY: number, ankleX: number, ankleY: number, hind: boolean, far: boolean) {
  const jointX = hind ? rootX + 6 : rootX + 1;
  const jointY = hind ? rootY + 13 : rootY + 15;
  const hockX = hind ? rootX - 3 + (ankleX - rootX) * .34 : rootX + 1.5 + (ankleX - rootX) * .45;
  const hockY = ankleY - 9;
  const color = far ? '#78484a' : wash(ctx, rootY, ankleY, [[0, '#cf8e5e'], [.44, '#aa6248'], [1, '#62383d']]);
  shape(ctx, color, p => {
    p.moveTo(rootX - (hind ? 9 : 5), rootY - 2);
    p.quadraticCurveTo(rootX - 10, rootY + 6, jointX - 5, jointY + 2);
    p.quadraticCurveTo(hockX - 5, hockY - 3, hockX - 3, hockY);
    p.lineTo(ankleX - 3, ankleY - 3);
    p.quadraticCurveTo(ankleX - 4, ankleY, ankleX - 1, ankleY);
    p.lineTo(ankleX + 5, ankleY);
    p.quadraticCurveTo(ankleX + 7, ankleY - 3, ankleX + 2, ankleY - 4);
    p.quadraticCurveTo(hockX + 2.5, hockY - 1, hockX + 3, hockY - 2);
    p.quadraticCurveTo(jointX + 4, jointY + 1, jointX + 3, jointY - 5);
    p.quadraticCurveTo(rootX + 11, rootY + 4, rootX + 6, rootY - 3);
  }, far ? 2.15 : 2.55);
  shape(ctx, far ? '#46313c' : '#463038', p => {
    p.moveTo(ankleX - 2.5, ankleY - 4.2);
    p.quadraticCurveTo(ankleX + 1, ankleY - 5, ankleX + 3, ankleY - 3.7);
    p.quadraticCurveTo(ankleX + 5.4, ankleY - 2.8, ankleX + 5.1, ankleY - .55);
    p.lineTo(ankleX - 1.8, ankleY - .55);
    p.quadraticCurveTo(ankleX - 3, ankleY - 1.7, ankleX - 2.5, ankleY - 4.2);
  });
  if (!far) {
    line(ctx, '#e7a66d', 1.2, p => {
      p.moveTo(rootX - 5, rootY + 3);
      p.quadraticCurveTo(rootX - 3, rootY + 8, jointX - 2, jointY - 2);
    });
    line(ctx, '#9d7067', .9, p => {
      p.moveTo(ankleX + .8, ankleY - 2.8);
      p.lineTo(ankleX + 1.5, ankleY - 1.1);
    });
  }
}

function tail(ctx: CanvasRenderingContext2D, bob: number, wag: number) {
  ctx.save();
  ctx.translate(-39, -33 + bob);
  ctx.rotate(wag);
  shape(ctx, '#b06b53', p => {
    p.moveTo(4, 1);
    p.bezierCurveTo(-2, -5, -8, -8, -12, -9);
    p.bezierCurveTo(-13, -3, -10, 6, -4, 8);
    p.quadraticCurveTo(0, 9, 4, 5);
  }, 2.5);
  shape(ctx, '#edca9f', p => {
    p.moveTo(-12, -7);
    p.quadraticCurveTo(-7, -2, -3, 0);
    p.quadraticCurveTo(-6, 2, -8, 6);
    p.quadraticCurveTo(-12, 2, -12, -7);
  });
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D, bob: number) {
  ctx.save();
  ctx.translate(0, bob);
  const fur = wash(ctx, -43, -14, [[0, '#e0a36b'], [.32, '#c98052'], [.65, '#ad6248'], [1, '#71434a']]);
  shape(ctx, fur, p => {
    p.moveTo(-43, -29);
    p.bezierCurveTo(-46, -37, -39, -43, -28, -42);
    p.bezierCurveTo(-16, -39, -5, -36, 6, -39);
    p.bezierCurveTo(17, -44, 27, -41, 28, -33);
    p.bezierCurveTo(30, -26, 24, -18, 17, -16);
    p.quadraticCurveTo(10, -14, 3, -17);
    p.bezierCurveTo(-6, -20, -16, -13, -27, -16);
    p.bezierCurveTo(-36, -18, -41, -22, -43, -29);
  }, 3);
  shape(ctx, '#e9ac72', p => {
    p.moveTo(-40, -34);
    p.bezierCurveTo(-33, -42, -23, -39, -16, -36);
    p.bezierCurveTo(-7, -33, 1, -34, 8, -38);
    p.quadraticCurveTo(13, -40, 17, -39);
    p.bezierCurveTo(9, -32, 2, -29, -8, -30);
    p.quadraticCurveTo(-23, -35, -33, -32);
    p.quadraticCurveTo(-39, -30, -41, -28);
  });
  shape(ctx, '#e3b787', p => {
    p.moveTo(-27, -22);
    p.bezierCurveTo(-17, -19, -9, -21, -2, -21);
    p.quadraticCurveTo(4, -21, 8, -19);
    p.bezierCurveTo(-3, -15, -13, -18, -19, -16.5);
    p.quadraticCurveTo(-24, -17, -27, -22);
  });
  for (const [x, y, rx] of [[-30, -31, 2.5], [-23, -29, 2.2], [-16, -29, 2], [-26, -25, 1.7], [-19, -24, 1.4]]) {
    spot(ctx, x, y, rx, 1.05, '#ffd196', .16);
  }
  line(ctx, '#995849', 1.35, p => {
    p.moveTo(-8, -26); p.quadraticCurveTo(-3, -24, 2, -26);
    p.moveTo(7, -31); p.quadraticCurveTo(12, -35, 15, -34);
  });
  ctx.restore();
}

function neck(ctx: CanvasRenderingContext2D, headX: number, headY: number, bob: number) {
  const top = headY - 6;
  shape(ctx, wash(ctx, top, -15 + bob, [[0, '#e6a16d'], [.47, '#be744e'], [1, '#8b4b43']]), p => {
    p.moveTo(9, -38 + bob);
    p.bezierCurveTo(15, -43 + bob, headX - 15, headY - 5, headX - 7, top);
    p.quadraticCurveTo(headX + 3, headY - 9, headX + 7, headY + 4);
    p.bezierCurveTo(headX + 6, headY + 12, 31, -24 + bob, 25, -17 + bob);
    p.lineTo(24, -20 + bob);
    p.quadraticCurveTo(18, -12 + bob, 13, -18 + bob);
    p.bezierCurveTo(11, -22 + bob, 6, -24 + bob, 8, -30 + bob);
  }, 2.6);
  shape(ctx, wash(ctx, headY + 3, -15 + bob, [[0, '#fff0bd'], [.49, '#f1c793'], [1, '#c89068']]), p => {
    p.moveTo(headX - 2, headY + 4);
    p.quadraticCurveTo(headX + 4, headY + 3, headX + 6, headY + 5);
    p.bezierCurveTo(headX + 3, headY + 13, 30, -22 + bob, 25, -18 + bob);
    p.lineTo(24, -21 + bob);
    p.lineTo(20, -17 + bob);
    p.lineTo(19, -20 + bob);
    p.quadraticCurveTo(15, -19 + bob, 14, -23 + bob);
    p.bezierCurveTo(22, -28 + bob, headX - 1, headY + 9, headX - 2, headY + 4);
  });
  line(ctx, '#f5b77b', 1.2, p => {
    p.moveTo(12, -38 + bob);
    p.quadraticCurveTo(headX - 10, headY + 2, headX - 5, headY - 3);
  });
}

function antler(ctx: CanvasRenderingContext2D, far: boolean) {
  ctx.save();
  if (far) {
    ctx.translate(7, 1);
    ctx.scale(.87, .9);
  }
  const branch = p => {
    p.moveTo(-3, -7);
    p.bezierCurveTo(-7, -15, -11, -21, -7, -29);
    p.moveTo(-8, -20);
    p.quadraticCurveTo(-17, -22, -18, -30);
    p.moveTo(-9, -21);
    p.quadraticCurveTo(0, -22, 4, -31);
    p.moveTo(-6, -13);
    p.quadraticCurveTo(3, -14, 10, -23);
    p.moveTo(5, -18);
    p.quadraticCurveTo(10, -17, 13, -19);
  };
  line(ctx, ink, far ? 4.25 : 4.65, branch);
  line(ctx, far ? '#ad8263' : '#e4bd89', far ? 2.05 : 2.7, branch);
  line(ctx, far ? '#c29a71' : '#f8d59c', .95, p => {
    p.moveTo(-4, -11); p.quadraticCurveTo(-9, -18, -8, -24);
    p.moveTo(-13, -23); p.lineTo(-16, -26);
    p.moveTo(2, -16); p.quadraticCurveTo(5, -18, 8, -21);
  });
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, aggression: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  antler(ctx, true);
  shape(ctx, '#9a5951', p => {
    p.moveTo(4, -9);
    p.bezierCurveTo(5, -15, 12, -16, 15, -17);
    p.quadraticCurveTo(14, -10, 8, -6);
  }, 2.1);
  antler(ctx, false);
  shape(ctx, wash(ctx, -13, 12, [[0, '#e7a26b'], [.47, '#c57852'], [1, '#9a5147']]), p => {
    p.moveTo(-11, 2);
    p.bezierCurveTo(-15, -6, -9, -13, 1, -13);
    p.quadraticCurveTo(7, -12, 10, -8);
    p.bezierCurveTo(13, -5, 20, -3, 24, -1);
    p.quadraticCurveTo(27, 3, 22, 6);
    p.quadraticCurveTo(17, 6, 14, 9);
    p.bezierCurveTo(9, 12, 1, 11, -4, 9);
    p.quadraticCurveTo(-8, 8, -11, 2);
  }, 2.7);
  shape(ctx, '#f1d39f', p => {
    p.moveTo(-4, 3);
    p.bezierCurveTo(0, 7, 7, 5, 10, 3);
    p.quadraticCurveTo(16, 1, 23, 1.1);
    p.quadraticCurveTo(22, 5, 17, 6);
    p.quadraticCurveTo(13, 9, 9, 10);
    p.quadraticCurveTo(3, 11, -2, 8);
  });
  shape(ctx, '#ecab74', p => {
    p.moveTo(-5, -9);
    p.quadraticCurveTo(1, -14, 7, -8);
    p.quadraticCurveTo(2, -10, 0, -7);
    p.quadraticCurveTo(-3, -5, -4, -4);
  });
  shape(ctx, '#46303a', p => {
    p.moveTo(21, -1.6);
    p.quadraticCurveTo(26, -2.5, 25.5, 2);
    p.quadraticCurveTo(25, 4.8, 21.5, 3.4);
    p.quadraticCurveTo(19.5, 1.4, 21, -1.6);
  });
  spot(ctx, 22.7, -.65, 1.5, .7, '#bb887c');
  line(ctx, '#794b46', 1.15, p => {
    p.moveTo(15.7, 5.1); p.quadraticCurveTo(12.5, 7, 8.8, 6);
  });

  const brow = -5.4 + aggression * 1.9;
  shape(ctx, ink, p => {
    p.moveTo(3, -4.5);
    p.quadraticCurveTo(6, -8.9, 12.8, brow);
    p.quadraticCurveTo(12.4, -.1, 7.7, -.45);
    p.quadraticCurveTo(4.3, -.3, 3, -4.5);
  });
  spot(ctx, 8.55, -3.65, 2.5, 2.5 - aggression * .6, '#f7bd63', .12);
  spot(ctx, 9.25, -3.3, .99, 1.7, '#52303b', .18);
  spot(ctx, 8.1, -4.6, .7, .6, '#ffedb8');
  line(ctx, ink, 1.4, p => {
    p.moveTo(2.5, -7.2); p.quadraticCurveTo(5.5, -8.7, 9.9, brow - .75);
  });

  shape(ctx, '#b06954', p => {
    p.moveTo(-6, -6);
    p.bezierCurveTo(-14, -5, -19, -13, -21, -17);
    p.bezierCurveTo(-15, -18, -6, -16, -3, -10);
    p.quadraticCurveTo(-3, -7, -6, -6);
  }, 2.2);
  shape(ctx, '#e69f83', p => {
    p.moveTo(-17, -15);
    p.quadraticCurveTo(-11, -15, -7, -11);
    p.quadraticCurveTo(-6, -9, -8, -9);
    p.quadraticCurveTo(-14, -10, -17, -15);
  });
  spot(ctx, 16.5, 1.15, 1.05, .65, shadow);
  spot(ctx, 18.4, 2.4, .7, .65, shadow);
  ctx.restore();
}

function gait(phase: number, offset: number, stride: number) {
  const cycle = (phase + offset) % 1;
  if (cycle < .59) return [(1 - cycle / .59 * 2) * stride, 0];
  const swing = (cycle - .59) / .41;
  return [(swing * 2 - 1) * stride, Math.sin(Math.PI * swing) * 8];
}

export function drawDeer(ctx: CanvasRenderingContext2D, { mode, phase, anticipation, lunge, strike, recovery }: MeadowEnemyPose) {
  const moving = mode === 'move';
  const step = Math.PI * 2 * phase;
  const bob = moving ? -.5 - 2.1 * (1 - Math.cos(step * 2)) : 2.5 * anticipation - 1.5 * lunge + 2 * recovery;
  const headX = 27 - 7 * anticipation + 17 * lunge;
  const headY = -47 + bob + 6 * anticipation + 4 * lunge;
  const angle = moving ? Math.sin(step * 2 + .75) * .054 : .23 * anticipation + .67 * strike + .16 * recovery;
  const attackReach = 10 * lunge + 4 * strike;
  const [farHindX, farHindLift] = moving ? gait(phase, .54, 8) : [-4 * anticipation, 0];
  const [farFrontX, farFrontLift] = moving ? gait(phase, .10, 9) : [attackReach * .52, 2 * lunge];
  const [nearHindX, nearHindLift] = moving ? gait(phase, .04, 8) : [-4 * lunge, 0];
  const [nearFrontX, nearFrontLift] = moving ? gait(phase, .60, 9) : [attackReach, 8 * anticipation];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  tail(ctx, bob, moving ? Math.sin(step) * .12 : -.19 * anticipation);
  leg(ctx, -29, -33 + bob, -33 + farHindX, -4 - farHindLift, true, true);
  leg(ctx, 20, -33 + bob, 20 + farFrontX, -4 - farFrontLift, false, true);
  body(ctx, bob);
  leg(ctx, -32, -28 + bob, -34 + nearHindX, -nearHindLift, true, false);
  neck(ctx, headX, headY, bob);
  leg(ctx, 15, -25 + bob, 14 + nearFrontX, -nearFrontLift, false, false);
  head(ctx, headX, headY, angle, Math.max(anticipation, strike));
  ctx.restore();
}
