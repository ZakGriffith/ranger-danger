import type { MeadowEnemyPose } from './pose';

const ink = '#30252d';
const deepest = '#493441';
const shade = '#655166';
const fur = '#8b7585';
const highlight = '#bca294';
const light = '#d3baa0';
const palePink = '#efaf99';
const cream = '#f7e0ae';

function fill(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, trace: (path: CanvasRenderingContext2D) => void, outline = 0) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = outline;
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

function wash(ctx: CanvasRenderingContext2D, top: number, bottom: number, lightColor: string, darkColor: string) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, lightColor);
  gradient.addColorStop(1, darkColor);
  return gradient;
}

function oval(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, x: number, y: number, rx: number, ry: number, angle = 0, outline = 0) {
  fill(ctx, color, p => p.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2), outline);
}

function drawTail(ctx: CanvasRenderingContext2D, phase: number, anticipation: number, strike: number) {
  const curl = Math.sin(phase * Math.PI * 2);
  const pointY = -13 + curl * 4 - anticipation * 7 + strike * 3;
  fill(ctx, wash(ctx, -26, 5, '#d89687', '#986170'), p => {
    p.moveTo(-26, -24);
    p.bezierCurveTo(-38, -24, -45, -14, -51, pointY + 4);
    p.quadraticCurveTo(-57, pointY + 7, -55, pointY - 1);
    p.quadraticCurveTo(-54, pointY - 4, -56, pointY - 4);
    p.bezierCurveTo(-61, pointY - 1, -61, pointY + 9, -54, pointY + 10);
    p.bezierCurveTo(-44, pointY + 11, -37, -12, -27, -16);
  }, 2.3);
  line(ctx, '#f0ae93', 1.2, p => {
    p.moveTo(-30, -21);
    p.quadraticCurveTo(-41, -17, -48, pointY + 4);
  });
  line(ctx, '#925666', 1.1, p => {
    p.moveTo(-36, -20);
    p.quadraticCurveTo(-34, -18, -35, -15);
    p.moveTo(-41, -16);
    p.quadraticCurveTo(-39, -14, -41, -11);
  });
}

function drawLeg(ctx: CanvasRenderingContext2D, hipX: number, hipY: number, footX: number, footY: number, near: boolean, hind: boolean) {
  const dark = near ? '#765c71' : '#5a4459';
  const bright = near ? '#a1878a' : '#746070';
  fill(ctx, wash(ctx, hipY - 3, footY, bright, dark), p => {
    p.moveTo(hipX - (hind ? 9 : 5), hipY - 4);
    p.quadraticCurveTo(hipX + (hind ? 3 : 4), hipY - 10, hipX + 7, hipY - 1);
    p.quadraticCurveTo(hipX + 9, hipY + 4, footX + 2, footY - 6);
    p.quadraticCurveTo(footX + 8, footY - 8, footX + 10, footY - 4);
    p.quadraticCurveTo(footX + 13, footY - 1, footX + 7, footY);
    p.lineTo(footX - 4, footY);
    p.quadraticCurveTo(footX - 8, footY - 2, footX - 5, footY - 7);
    p.quadraticCurveTo(hipX - 11, hipY + 5, hipX - (hind ? 9 : 5), hipY - 4);
  }, 2.25);
  fill(ctx, near ? '#cd8d86' : '#a26e78', p => {
    p.moveTo(footX - 2, footY - 5.5);
    p.quadraticCurveTo(footX + 7, footY - 7, footX + 9, footY - 3);
    p.quadraticCurveTo(footX + 8, footY - 1.2, footX + 4, footY - 1.2);
    p.lineTo(footX - 3, footY - 1.2);
  });
  line(ctx, '#895661', 1, p => {
    p.moveTo(footX + 5, footY - 4.5);
    p.lineTo(footX + 6, footY - 2);
  });
}

function drawBody(ctx: CanvasRenderingContext2D, pitch: number) {
  ctx.save();
  ctx.rotate(pitch);
  fill(ctx, wash(ctx, -45, -4, fur, deepest), p => {
    p.moveTo(-37, -24);
    p.bezierCurveTo(-38, -36, -28, -43, -16, -44);
    p.quadraticCurveTo(-7, -45, 3, -40);
    p.lineTo(2, -44);
    p.quadraticCurveTo(12, -40, 16, -36);
    p.lineTo(17, -40);
    p.quadraticCurveTo(22, -33, 26, -27);
    p.bezierCurveTo(31, -20, 24, -12, 15, -10);
    p.lineTo(10, -10);
    p.lineTo(7, -7);
    p.quadraticCurveTo(3, -10, 0, -10);
    p.quadraticCurveTo(-20, -6, -30, -13);
    p.quadraticCurveTo(-36, -16, -37, -24);
  }, 2.9);
  fill(ctx, shade, p => {
    p.moveTo(-34, -24);
    p.quadraticCurveTo(-27, -15, -15, -21);
    p.quadraticCurveTo(-10, -14, -3, -16);
    p.quadraticCurveTo(9, -18, 20, -25);
    p.lineTo(24, -23);
    p.quadraticCurveTo(24, -16, 14, -12);
    p.lineTo(8, -12);
    p.lineTo(7, -9);
    p.lineTo(0, -12);
    p.quadraticCurveTo(-27, -8, -34, -24);
  });
  fill(ctx, highlight, p => {
    p.moveTo(-34, -30);
    p.bezierCurveTo(-29, -42, -12, -45, 0, -38);
    p.quadraticCurveTo(-9, -41, -17, -36);
    p.lineTo(-14, -33);
    p.quadraticCurveTo(-23, -35, -29, -28);
    p.lineTo(-28, -33);
  });
  line(ctx, light, 1.2, p => {
    p.moveTo(-29, -35);
    p.quadraticCurveTo(-23, -40, -15, -40);
    p.moveTo(-20, -32);
    p.quadraticCurveTo(-16, -34, -12, -34);
  });
  line(ctx, '#5c4558', 1.35, p => {
    p.moveTo(-9, -36);
    p.quadraticCurveTo(-4, -35, -2, -32);
    p.moveTo(-13, -26);
    p.quadraticCurveTo(-9, -27, -5, -25);
    p.moveTo(-24, -28);
    p.quadraticCurveTo(-22, -30, -18, -29);
  });
  ctx.restore();
}

function drawJaw(ctx: CanvasRenderingContext2D, open: number) {
  ctx.save();
  ctx.translate(13, -14);
  ctx.rotate(.44 * open);
  fill(ctx, '#a18a8a', p => {
    p.moveTo(-11, -4);
    p.quadraticCurveTo(0, -7, 16, -2);
    p.quadraticCurveTo(15, 1, 8, 2);
    p.quadraticCurveTo(-3, 6, -10, 2);
  }, 1.9);
  line(ctx, '#c9a797', 1.5, p => {
    p.moveTo(-5, 2);
    p.quadraticCurveTo(3, 4, 11, 1);
  });
  ctx.restore();
}

function drawEar(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, flick: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(flick);
  ctx.scale(scale, scale);
  fill(ctx, wash(ctx, -13, 10, '#b09898', '#826577'), p => {
    p.moveTo(-9, 7);
    p.bezierCurveTo(-17, 1, -13, -13, -2, -15);
    p.bezierCurveTo(8, -17, 16, -7, 11, 2);
    p.quadraticCurveTo(8, 7, 3, 10);
    p.quadraticCurveTo(-5, 12, -9, 7);
  }, 2.65);
  fill(ctx, wash(ctx, -12, 7, '#d7958b', '#915a70'), p => {
    p.moveTo(-7.5, 4);
    p.bezierCurveTo(-13, -1, -9, -11, -1, -12);
    p.bezierCurveTo(6, -14, 11, -6, 8, 0);
    p.quadraticCurveTo(4, 1, 2, 7);
    p.quadraticCurveTo(-2, 9, -7.5, 4);
  }, 1.2);
  line(ctx, palePink, 1.35, p => {
    p.moveTo(-8, -4);
    p.quadraticCurveTo(-5, -10, 0, -10);
  });
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, open: number, flick: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  drawEar(ctx, 5, -35, .7, .2);
  fill(ctx, '#422a37', p => {
    p.moveTo(-2, -21);
    p.quadraticCurveTo(14, -25, 31, -19);
    p.quadraticCurveTo(27, -13 + open * 10, 13, -9 + open * 7);
    p.quadraticCurveTo(3, -7 + open * 3, -2, -12);
  }, 1.6);
  drawJaw(ctx, open);
  if (open > .15) {
    fill(ctx, '#bc6a70', p => {
      p.moveTo(4, -12 + open * 3);
      p.quadraticCurveTo(11, -14 + open * 4, 17, -11 + open * 3);
      p.quadraticCurveTo(12, -10 + open * 4, 6, -10 + open * 4);
    });
  }
  fill(ctx, wash(ctx, -44, -8, '#b7a098', '#73596e'), p => {
    p.moveTo(-16, -23);
    p.quadraticCurveTo(-17, -34, -8, -40);
    p.quadraticCurveTo(2, -46, 13, -38);
    p.quadraticCurveTo(19, -33, 19, -30);
    p.quadraticCurveTo(26, -27, 33, -23);
    p.quadraticCurveTo(37, -20, 32, -18);
    p.quadraticCurveTo(24, -16, 18, -15);
    p.quadraticCurveTo(13, -14, 8, -12);
    p.quadraticCurveTo(-2, -8, -7, -13);
    p.lineTo(-12, -13);
    p.lineTo(-11, -16);
    p.lineTo(-17, -17);
    p.lineTo(-13, -20);
  }, 2.65);
  fill(ctx, '#d1ab95', p => {
    p.moveTo(11, -25);
    p.quadraticCurveTo(20, -29, 31, -23);
    p.quadraticCurveTo(34, -19, 28, -18.5);
    p.quadraticCurveTo(21, -18, 16, -16.5);
    p.quadraticCurveTo(9, -16, 8, -20);
    p.quadraticCurveTo(7, -23, 11, -25);
  });
  drawEar(ctx, -9, -36, 1, flick);
  fill(ctx, cream, p => {
    p.moveTo(23, -17.8);
    p.lineTo(30, -19);
    p.lineTo(29, -13 - open * 1.2);
    p.quadraticCurveTo(26, -11.5 - open * 1.2, 24, -13.5 - open * 1.2);
  }, 1.15);
  line(ctx, '#a67968', .8, p => {
    p.moveTo(27, -17.5);
    p.lineTo(27.5, -13.2 - open);
  });
  oval(ctx, '#604353', 32.6, -22, 3.85, 3.15, .18, 1.25);
  oval(ctx, '#e0a292', 33.35, -23.2, 1.65, .75, -.2);
  fill(ctx, ink, p => {
    p.moveTo(7, -34);
    p.quadraticCurveTo(12, -37, 16, -33);
    p.quadraticCurveTo(16.5, -29, 13, -28);
    p.quadraticCurveTo(9, -27, 7, -31);
  });
  fill(ctx, '#f3b556', p => {
    p.moveTo(8.8, -33.2);
    p.quadraticCurveTo(11.5, -34.9, 14.9, -32.8);
    p.quadraticCurveTo(14.4, -29.1, 11.7, -29.6);
    p.quadraticCurveTo(10.1, -29.9, 8.8, -33.2);
  });
  oval(ctx, ink, 13.15, -32, 1.15, 1.65, -.18);
  oval(ctx, '#ffedb7', 12.7, -32.8, .55, .55);
  line(ctx, '#513748', 1.8, p => {
    p.moveTo(6, -35.7);
    p.quadraticCurveTo(11.5, -38.5, 16.7, -34.1);
  });
  for (const [px, py] of [[20, -23], [24, -22], [22, -20]]) {
    oval(ctx, '#8c615d', px, py, .73, .68);
  }
  line(ctx, '#634757', 1, p => {
    p.moveTo(22, -23);
    p.quadraticCurveTo(25, -24.7, 30, -25.2);
    p.moveTo(24, -21.5);
    p.quadraticCurveTo(28, -21.8, 34, -20.7);
  });
  ctx.restore();
}

function stride(phase: number, offset: number, reach: number, height: number) {
  const angle = (phase + offset) * Math.PI * 2;
  return [Math.cos(angle) * reach, -Math.max(0, Math.sin(angle)) * height];
}

export function drawRat(ctx: CanvasRenderingContext2D, { mode, phase, anticipation, lunge, strike, recovery }: MeadowEnemyPose) {
  const moving = mode === 'move';
  const beat = moving ? phase : 0;
  const bob = moving ? -1.2 * Math.sin(phase * Math.PI * 4) : 2.1 * anticipation - 2.7 * lunge + recovery;
  const bodyX = -4.5 * anticipation + 7.5 * lunge;
  const pitch = -.10 * anticipation + .11 * strike;
  const [rearX, rearY] = stride(beat, .2, 7, 4.8);
  const [frontX, frontY] = stride(beat, .7, 8, 6.2);
  const [farRearX, farRearY] = stride(beat, .65, 5.5, 3.6);
  const [farFrontX, farFrontY] = stride(beat, .18, 6, 4.3);
  const headX = 14 + 2 * anticipation + 8 * strike;
  const headY = -.65 * bob - 2.8 * anticipation + 1.3 * strike;

  ctx.save();
  ctx.scale(.92, .92);
  ctx.translate(bodyX, bob);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawTail(ctx, beat, anticipation, strike);
  drawLeg(ctx, -16, -20, -19 + farRearX, -4 + farRearY - bob, false, true);
  drawLeg(ctx, 13, -18, 15 + farFrontX + 3 * lunge, -4 + farFrontY - bob, false, false);
  drawBody(ctx, pitch);
  drawLeg(ctx, -24, -19, -24 + rearX - 3 * anticipation, rearY - bob, true, true);
  drawLeg(ctx, 9, -18, 10 + frontX + 8 * strike, frontY - 3 * anticipation - bob, true, false);
  drawHead(ctx, headX, headY, -.16 * anticipation + .06 * strike, Math.max(.66 * anticipation, strike), -.14 * Math.sin(beat * Math.PI * 2) - .2 * lunge);
  ctx.restore();
}
