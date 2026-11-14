import { BEAR_ATK_FRAMES, BEAR_BITE_FRAMES, BEAR_MOVE_FRAMES, type BearBiteFrame, type BearFrame } from '../bear';
import { line as mark, oval, wash } from './paint';

type BearMode = 'move' | 'attack' | 'bite';
type Point = readonly [number, number];
type Paint = (path: CanvasRenderingContext2D) => void;

export const FOREST_BEAR_ART = { frameScale: .59, spriteScale: .60, scale: 1, feetY: 54, bodyOffsetX: 16 } as const;

const ink = '#2b2029';
const deep = '#482b31';
const shade = '#70404a';
const sienna = '#a75d45';
const honey = '#d28b56';
const sun = '#efb877';
const cream = '#f7d59b';

function paint(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, edge: string | null, width: number, trace: Paint) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function drawTorso(ctx: CanvasRenderingContext2D, y: number, lean: number) {
  ctx.save();
  ctx.translate(0, y);
  ctx.rotate(lean);
  paint(ctx, shade, ink, 2.6, p => {
    p.moveTo(-37, -34);
    p.bezierCurveTo(-43, -40, -49, -39, -48, -34);
    p.bezierCurveTo(-47, -30, -43, -28, -39, -29);
  });
  const coat = wash(ctx, -57, -11, [[0, '#d3915c'], [0.28, '#bf7951'], [0.59, '#985040'], [1, '#673940']]);
  paint(ctx, coat, ink, 2.8, p => {
    p.moveTo(-43, -28);
    p.bezierCurveTo(-47, -42, -35, -49, -24, -49);
    p.bezierCurveTo(-15, -50, -9, -57, 3, -57);
    p.bezierCurveTo(14, -58, 24, -51, 26, -43);
    p.bezierCurveTo(31, -39, 34, -34, 31, -28);
    p.lineTo(32, -24);
    p.lineTo(28, -24);
    p.bezierCurveTo(28, -17, 17, -13, 12, -14);
    p.lineTo(9, -12);
    p.lineTo(5, -14);
    p.bezierCurveTo(-7, -12, -15, -16, -23, -15);
    p.bezierCurveTo(-32, -14, -41, -19, -43, -28);
  });
  paint(ctx, '#6f3c42', null, 0, p => {
    p.moveTo(-42, -28);
    p.bezierCurveTo(-38, -22, -31, -23, -29, -26);
    p.bezierCurveTo(-19, -19, -7, -21, -3, -28);
    p.lineTo(-2, -25);
    p.bezierCurveTo(7, -24, 9, -31, 13, -34);
    p.bezierCurveTo(19, -41, 24, -41, 29, -37);
    p.bezierCurveTo(37, -25, 24, -17, 12, -15);
    p.lineTo(9, -13.5);
    p.lineTo(5, -15.5);
    p.bezierCurveTo(-10, -13, -15, -18, -24, -16);
    p.bezierCurveTo(-34, -16, -39, -21, -42, -28);
  });
  paint(ctx, '#dea065', null, 0, p => {
    p.moveTo(-39, -38);
    p.bezierCurveTo(-34, -44, -24, -46, -17, -47);
    p.bezierCurveTo(-9, -49, -1, -57, 9, -54);
    p.bezierCurveTo(17, -53, 22, -50, 23, -45);
    p.bezierCurveTo(16, -48, 7, -46, 2, -40);
    p.lineTo(1, -43);
    p.bezierCurveTo(-2, -42, -6, -39, -9, -36);
    p.lineTo(-8, -40);
    p.bezierCurveTo(-17, -38, -22, -41, -29, -37);
    p.lineTo(-27, -40);
    p.bezierCurveTo(-33, -39, -37, -35, -39, -33);
  });
  paint(ctx, '#edb47a', null, 0, p => {
    p.moveTo(-21, -44);
    p.bezierCurveTo(-9, -45, -3, -54, 6, -53);
    p.bezierCurveTo(10, -53, 16, -51, 17, -49);
    p.bezierCurveTo(11, -51, 2, -49, -2, -46);
    p.lineTo(-2, -48);
    p.bezierCurveTo(-8, -44, -14, -43, -21, -44);
  });
  mark(ctx, '#a9664d', 1.25, p => {
    p.moveTo(-37, -36); p.quadraticCurveTo(-33, -39, -30, -39);
    p.moveTo(-22, -35); p.quadraticCurveTo(-18, -36, -14, -36);
    p.moveTo(-23, -31); p.quadraticCurveTo(-17, -31, -14, -33);
    p.moveTo(-1, -37); p.quadraticCurveTo(2, -42, 7, -43);
    p.moveTo(4, -36); p.quadraticCurveTo(7, -40, 11, -41);
    p.moveTo(-12, -25); p.quadraticCurveTo(-9, -26, -7, -28);
    p.moveTo(-6, -33); p.quadraticCurveTo(-4, -36, -2, -36);
  });
  mark(ctx, '#f2bc80', 0.85, p => {
    p.moveTo(-31, -43); p.quadraticCurveTo(-28, -44, -26, -44);
    p.moveTo(-7, -48); p.quadraticCurveTo(-4, -51, -1, -51.5);
    p.moveTo(3, -51); p.quadraticCurveTo(8, -52, 12, -50.5);
  });
  mark(ctx, '#ba7553', 1.05, p => {
    p.moveTo(-35, -32); p.quadraticCurveTo(-33, -33.5, -31, -34);
    p.moveTo(-29, -29.5); p.quadraticCurveTo(-27.5, -31.5, -26, -32);
    p.moveTo(-16, -29); p.lineTo(-12.5, -30);
    p.moveTo(0, -31); p.quadraticCurveTo(1.5, -33.5, 4, -34);
  });
  ctx.restore();
}

function drawHind(ctx: CanvasRenderingContext2D, x: number, bodyY: number, footX: number, footY: number, near: boolean) {
  ctx.save();
  ctx.translate(x, 0);
  const leg = near ? wash(ctx, -36 + bodyY, footY, [[0, '#c28055'], [0.4, '#a15c47'], [0.75, '#7d4144'], [1, '#59333b']]) : '#57353b';
  paint(ctx, leg, ink, near ? 2.35 : 2.05, p => {
    p.moveTo(-6, -31 + bodyY);
    p.bezierCurveTo(-13, -27 + bodyY, -14, -19 + bodyY, -9, -13 + bodyY);
    p.bezierCurveTo(-7, -10, footX - 7, footY - 7, footX - 9, footY - 3);
    p.quadraticCurveTo(footX - 11, footY + 0.5, footX - 6, footY + 1);
    p.lineTo(footX + 7, footY + 1);
    p.bezierCurveTo(footX + 12, footY, footX + 10, footY - 4, footX + 5, footY - 5);
    p.bezierCurveTo(footX + 2, footY - 9, 5, -12 + bodyY, 6, -16 + bodyY);
    p.lineTo(8, -16 + bodyY);
    p.bezierCurveTo(12, -25 + bodyY, 7, -33 + bodyY, -1, -32 + bodyY);
  });
  if (near) {
    paint(ctx, '#d08c5d', null, 0, p => {
      p.moveTo(-10, -23 + bodyY);
      p.bezierCurveTo(-9, -31 + bodyY, 1, -34 + bodyY, 5, -28 + bodyY);
      p.bezierCurveTo(0, -29 + bodyY, -2, -23 + bodyY, -5, -19 + bodyY);
      p.lineTo(-6, -21 + bodyY);
      p.quadraticCurveTo(-8, -18 + bodyY, -8, -15 + bodyY);
    });
    mark(ctx, '#c17952', 1.2, p => {
      p.moveTo(-5, -16 + bodyY); p.quadraticCurveTo(-3, -19 + bodyY, -1, -20 + bodyY);
      p.moveTo(footX - 5, footY - 4); p.quadraticCurveTo(footX - 2, footY - 6, footX + 1, footY - 5.5);
    });
  }
  mark(ctx, near ? '#d6ae84' : '#98776c', 1, p => {
    p.moveTo(footX + 4, footY - 1); p.lineTo(footX + 5.5, footY + 0.3);
    p.moveTo(footX + 7.2, footY - 2); p.lineTo(footX + 8.8, footY - 0.4);
  });
  ctx.restore();
}

function drawPaw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, claw: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  paint(ctx, '#784245', ink, 2.1, p => {
    p.moveTo(-7, -4);
    p.bezierCurveTo(-2, -7, 4, -7, 7, -4);
    p.quadraticCurveTo(12, -4, 12, -0.5);
    p.quadraticCurveTo(12, 2, 8, 2.5);
    p.quadraticCurveTo(5, 4, 2, 2.5);
    p.quadraticCurveTo(-2, 3.5, -5, 2.5);
    p.quadraticCurveTo(-9, 1.5, -7, -4);
  });
  paint(ctx, '#bd7956', null, 0, p => {
    p.moveTo(-4, -3);
    p.bezierCurveTo(0, -5, 5, -5, 7, -2);
    p.quadraticCurveTo(3, -2, 0, 0);
    p.lineTo(-1, -1);
    p.quadraticCurveTo(-3, 0, -5, -0.5);
  });
  for (const [x, y, length] of [[3.3, 1.5, 2.5], [7.6, 0.8, 3.5], [10, -0.9, 3.2]]) {
    paint(ctx, cream, deep, 0.7, p => {
      p.moveTo(x - 1.5, y - 0.6);
      p.quadraticCurveTo(x + length * claw * 0.65, y - 1.1, x + length * claw, y + 1.7);
      p.quadraticCurveTo(x + 0.1, y + 0.8, x - 1.5, y + 0.7);
    });
  }
  ctx.restore();
}

function drawForeleg(ctx: CanvasRenderingContext2D, shoulder: Point, elbow: Point, wrist: Point, near: boolean, angle: number, claw: number) {
  const [sx, sy] = shoulder;
  const [ex, ey] = elbow;
  const [wx, wy] = wrist;
  const elbowDx = ex - sx;
  const elbowDy = ey - sy;
  const shoulderLength = Math.hypot(elbowDx, elbowDy);
  const upperX = elbowDy / shoulderLength;
  const upperY = -elbowDx / shoulderLength;
  const wristDx = wx - ex;
  const wristDy = wy - ey;
  const forearmLength = Math.hypot(wristDx, wristDy);
  const lowerX = wristDy / forearmLength;
  const lowerY = -wristDx / forearmLength;
  const fur = near ? wash(ctx, Math.min(sy - 9, wy), Math.max(sy, ey, wy) + 1, [[0, '#c88258'], [0.4, '#a6604b'], [0.73, '#925146'], [1, '#713f44']]) : '#58353d';
  const width = near ? 7 : 5.2;
  paint(ctx, fur, ink, near ? 2.4 : 2.05, p => {
    p.moveTo(sx - upperX * width, sy - upperY * width);
    p.bezierCurveTo(sx - upperX * 13, sy - upperY * 13 + 8, ex - upperX * 9, ey - upperY * 9, ex - upperX * 7, ey - upperY * 7);
    p.lineTo(ex - lowerX * 8, ey - lowerY * 8);
    p.quadraticCurveTo(ex - lowerX * 6.2, ey - lowerY * 6.2, wx - lowerX * 4.2, wy - lowerY * 4.2);
    p.quadraticCurveTo(wx + wristDx * 0.24, wy + wristDy * 0.24 + 2, wx + lowerX * 4.8, wy + lowerY * 4.8);
    p.bezierCurveTo(wx + lowerX * 4.8 - wristDx * 0.32, wy + lowerY * 4.8 - wristDy * 0.32, ex + lowerX * 6.6, ey + lowerY * 6.6, ex + upperX * 6.4, ey + upperY * 6.4);
    p.bezierCurveTo(ex + upperX * 7, ey + upperY * 7, sx + upperX * 14, sy + upperY * 14 + 5, sx + upperX * width, sy + upperY * width);
    p.quadraticCurveTo(sx + upperY * 12, sy - upperX * 12, sx - upperX * width, sy - upperY * width);
  });
  if (near) {
    paint(ctx, '#d28b5c', null, 0, p => {
      p.moveTo(sx - upperX * 6, sy - upperY * 6);
      p.quadraticCurveTo(sx + upperY * 9, sy - upperX * 9, sx + upperX * 5, sy + upperY * 5);
      p.quadraticCurveTo(sx + upperX * 5 + elbowDx * 0.25, sy + upperY * 5 + elbowDy * 0.25, sx + elbowDx * 0.44, sy + elbowDy * 0.44);
      p.lineTo(sx - upperX * 2 + elbowDx * 0.32, sy - upperY * 2 + elbowDy * 0.32);
      p.lineTo(sx - upperX * 5 + elbowDx * 0.58, sy - upperY * 5 + elbowDy * 0.58);
    });
    mark(ctx, '#ca8056', 1.25, p => {
      p.moveTo(ex - lowerX * 3.6, ey - lowerY * 3.6);
      p.quadraticCurveTo(ex + wristDx * 0.13, ey + wristDy * 0.13, ex - lowerX * 2 + wristDx * 0.45, ey - lowerY * 2 + wristDy * 0.45);
      p.moveTo(ex + lowerX, ey + lowerY);
      p.lineTo(ex + lowerX * 2 + wristDx * 0.34, ey + lowerY * 2 + wristDy * 0.34);
    });
    drawPaw(ctx, wx, wy, angle, claw);
  } else {
    paint(ctx, '#56363e', ink, 1.65, p => {
      p.moveTo(wx - 5, wy - 4);
      p.quadraticCurveTo(wx + 2, wy - 7, wx + 8, wy - 3);
      p.quadraticCurveTo(wx + 11, wy + 1, wx + 5, wy + 1.5);
      p.lineTo(wx - 5, wy + 1.2);
      p.quadraticCurveTo(wx - 8, wy, wx - 5, wy - 4);
    });
  }
}

function drawEar(ctx: CanvasRenderingContext2D, x: number, y: number, near: boolean) {
  ctx.save();
  ctx.translate(x, y);
  paint(ctx, near ? honey : sienna, ink, near ? 2.25 : 2.1, p => {
    p.moveTo(-5, 6);
    p.bezierCurveTo(-10, 2, -8, -7, -2, -8);
    p.bezierCurveTo(3, -10, 8, -6, 7, -2);
    p.quadraticCurveTo(6, 3, 2, 7);
  });
  paint(ctx, near ? shade : deep, null, 0, p => {
    p.moveTo(-5, 2);
    p.bezierCurveTo(-7, -3, -3, -7, 1, -5);
    p.bezierCurveTo(4, -5, 5, -2, 2, 0);
    p.quadraticCurveTo(0, 2, 0, 5);
  });
  mark(ctx, near ? sun : honey, 1.1, p => {
    p.moveTo(-6, -2); p.quadraticCurveTo(-5, -6.5, -1, -6.5);
  });
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, gape: number, snarl: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  drawEar(ctx, 10, -15, false);
  const fur = wash(ctx, -21, 20, [[0, '#db9966'], [0.36, '#b9724d'], [0.77, '#995248'], [1, '#6e3b40']]);
  paint(ctx, fur, ink, 2.65, p => {
    p.moveTo(-13, -14);
    p.bezierCurveTo(-8, -20, 5, -20, 13, -15);
    p.quadraticCurveTo(20, -11, 21, -4);
    p.bezierCurveTo(26, -4, 28, 0, 27, 4);
    p.bezierCurveTo(27, 10, 21, 17, 14, 18);
    p.quadraticCurveTo(9, 21, 3, 18);
    p.lineTo(0, 20);
    p.lineTo(-2, 16.5);
    p.lineTo(-6, 18);
    p.lineTo(-7, 14);
    p.quadraticCurveTo(-14, 12, -16, 6);
    p.lineTo(-19, 7);
    p.lineTo(-17, 1);
    p.quadraticCurveTo(-20, -6, -13, -14);
  });
  drawEar(ctx, -10, -15, true);
  paint(ctx, '#6b3a40', null, 0, p => {
    p.moveTo(-12, 5);
    p.quadraticCurveTo(-2, 9, 2, 2);
    p.bezierCurveTo(7, -1, 14, -1, 21, 1);
    p.quadraticCurveTo(27, 11, 16, 17);
    p.quadraticCurveTo(9, 20, 3, 17);
    p.lineTo(0, 18);
    p.lineTo(-2, 15.5);
    p.lineTo(-5, 16.5);
    p.lineTo(-6, 13.3);
    p.quadraticCurveTo(-13, 10, -12, 5);
  });
  paint(ctx, '#e5a56c', null, 0, p => {
    p.moveTo(-8, -8);
    p.bezierCurveTo(-4, -17, 7, -16, 13, -12);
    p.lineTo(17, -7.5);
    p.quadraticCurveTo(9, -11.5, 1, -7);
    p.lineTo(3, -10);
    p.quadraticCurveTo(-3, -8, -6, -5);
  });
  paint(ctx, '#d38b59', null, 0, p => {
    p.moveTo(-15, -3);
    p.quadraticCurveTo(-8, -8, -3, -6);
    p.quadraticCurveTo(-5, -4, -3, -1);
    p.quadraticCurveTo(-6, 3, -11, 4);
    p.lineTo(-9.5, 1);
    p.quadraticCurveTo(-13, 2, -15, 4);
  });
  const jaw = gape * 7;
  paint(ctx, '#a76b52', deep, 1.85, p => {
    p.moveTo(7, 4);
    p.bezierCurveTo(13, 4, 23, 5, 24, 7 + jaw * 0.5);
    p.bezierCurveTo(25, 13 + jaw, 17, 17 + jaw, 11, 16 + jaw);
    p.quadraticCurveTo(4, 15 + jaw * 0.7, 2, 10);
  });
  paint(ctx, '#37252b', null, 0, p => {
    p.moveTo(7, 5);
    p.bezierCurveTo(14, 4, 23, 5, 24, 7 + jaw * 0.5);
    p.quadraticCurveTo(23, 12.5 + jaw, 14, 13 + jaw);
    p.quadraticCurveTo(7, 13 + jaw * 0.5, 6, 9);
  });
  paint(ctx, '#b96a64', null, 0, p => {
    p.moveTo(12, 12 + jaw * 0.8);
    p.quadraticCurveTo(15, 10 + jaw * 0.6, 21, 11 + jaw * 0.65);
    p.quadraticCurveTo(19, 13 + jaw * 0.9, 12, 12.8 + jaw * 0.9);
  });
  paint(ctx, '#f3d49a', deep, 0.65, p => {
    p.moveTo(18.5, 6.4);
    p.quadraticCurveTo(23, 5.7, 22.2, 8.3);
    p.quadraticCurveTo(21.3, 11.6 + 2 * snarl, 18.9, 11.8 + 2 * snarl);
    p.quadraticCurveTo(20, 8.9, 18.5, 6.4);
  });
  paint(ctx, '#efcf94', deep, 0.6, p => {
    p.moveTo(13.6, 13 + jaw);
    p.quadraticCurveTo(16.7, 12.5 + jaw, 16.4, 9.7 + jaw * 0.75);
    p.quadraticCurveTo(14, 10.4 + jaw * 0.8, 13.6, 13 + jaw);
  });
  const muzzle = wash(ctx, -3, 10, [[0, '#f0c38c'], [0.54, '#d99e6e'], [1, '#bd7f5e']]);
  paint(ctx, muzzle, '#673c3a', 1.3, p => {
    p.moveTo(4.5, 1 + snarl);
    p.bezierCurveTo(7.5, -1, 15, -3.5, 19.5, -2.5);
    p.quadraticCurveTo(27, -3, 28, 1);
    p.quadraticCurveTo(29, 5.5, 24, 7);
    p.quadraticCurveTo(17, 5 + snarl * 2, 13, 9 - snarl);
    p.bezierCurveTo(7, 11, 2.5, 7, 4.5, 1 + snarl);
  });
  paint(ctx, '#362730', ink, 1.45, p => {
    p.moveTo(20.5, -2);
    p.bezierCurveTo(22, -4.5, 29, -4, 29.4, -0.9);
    p.quadraticCurveTo(29.8, 2.4, 25.8, 4.5);
    p.quadraticCurveTo(21, 3.3, 20.5, -2);
  });
  mark(ctx, '#90645c', 1.2, p => {
    p.moveTo(23, -1.8); p.quadraticCurveTo(25.7, -2.8, 27.4, -1.7);
  });
  paint(ctx, '#503039', null, 0, p => {
    p.moveTo(-2, -5.4);
    p.quadraticCurveTo(1, -9, 9, -7.2 - snarl);
    p.quadraticCurveTo(12, -4.7, 7, -2.3);
    p.quadraticCurveTo(3, -0.6, -0.5, -2.7);
  });
  paint(ctx, '#fbdb86', null, 0, p => {
    p.moveTo(0.5, -4.7);
    p.quadraticCurveTo(3.9, -6, 8.8, -5.1 + snarl * 0.8);
    p.quadraticCurveTo(7.3, -2.6, 4.1, -2.6);
    p.quadraticCurveTo(2, -2.6, 0.5, -4.7);
  });
  oval(ctx, 6.4, -4.4, 1.35, 1.45, '#342331');
  oval(ctx, 5.9, -4.9, 0.49, 0.49, '#fff1be');
  mark(ctx, '#563239', 2, p => {
    p.moveTo(-2, -6.2 - snarl);
    p.quadraticCurveTo(2.7, -8.9 - snarl, 9.6, -5.6 + snarl * 0.4);
  });
  mark(ctx, '#db9663', 1.15, p => {
    p.moveTo(0, -10.5); p.quadraticCurveTo(3, -11.1, 5, -10.5);
    p.moveTo(-11, 6.4); p.quadraticCurveTo(-8, 7.6, -6.7, 10);
    p.moveTo(-8, 4.5); p.quadraticCurveTo(-5.5, 5, -4, 7);
  });
  mark(ctx, '#f5bc88', 1.05, p => {
    p.moveTo(11, -10.2); p.lineTo(12.4, -7.9);
    p.moveTo(12.7, -11.7); p.quadraticCurveTo(14.5, -10.5, 15.2, -8.3);
  });
  for (const [px, py] of [[13, 3.4], [16.4, 2.7], [15.1, 5.5]]) oval(ctx, px, py, 0.61, 0.54, '#9f6450');
  ctx.restore();
}

function step(phase: number, offset: number, amplitude: number): Point {
  const position = (phase + offset) % 1;
  const stance = 0.61;
  if (position <= stance) return [amplitude * (1 - 2 * position / stance), 0];
  const swing = (position - stance) / (1 - stance);
  return [amplitude * (-1 + 2 * swing), Math.sin(Math.PI * swing) * 4.4];
}

function ease(from: number, to: number, phase: number): number {
  const t = Math.min(1, Math.max(0, (phase - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

function envelope(phase: number, start: number, peak: number, hold: number, end: number): number {
  return ease(start, peak, phase) * (1 - ease(hold, end, phase));
}

export function forestBearPose(mode: BearMode, frame: number) {
  const move = mode === 'move';
  const frameSpan = move ? BEAR_MOVE_FRAMES.length : (mode === 'bite' ? BEAR_BITE_FRAMES.length : BEAR_ATK_FRAMES.length) - 1;
  const phase = frame / frameSpan;
  const stride = move ? Math.sin(2 * Math.PI * phase) : 0;
  return {
    mode,
    phase,
    stride,
    lift: stride ** 2,
    anticipation: move ? 0 : envelope(phase, 0, .36, .36, .52),
    lunge: move ? 0 : envelope(phase, .36, .53, .61, .91),
    swipe: move ? 0 : envelope(phase, .42, .56, .60, .78),
    recovery: move ? 0 : envelope(phase, .58, .72, .74, 1),
  };
}

export function forestBearOffset({ lunge, anticipation }: ReturnType<typeof forestBearPose>): number {
  return Math.round(10 * lunge - 3 * anticipation);
}

export function drawForestBear(ctx: CanvasRenderingContext2D, pose: ReturnType<typeof forestBearPose>) {
  const { phase, stride, lift, anticipation, lunge, swipe, recovery } = pose;
  const moving = pose.mode === 'move';
  const biting = pose.mode === 'bite';
  const reach = biting ? 0 : swipe;
  const farHind = moving ? step(phase, 0.53, 6.7) : [3 * lunge, 0];
  const farFore = moving ? step(phase, 0.74, 7.8) : [1 - 3 * anticipation + 6 * lunge, 0];
  const nearHind = moving ? step(phase, 0.03, 7.2) : [-2 * anticipation + 3 * lunge, 0];
  const nearFore = moving ? step(phase, 0.24, 9) : [0, 0];
  const bodyY = -1.35 * lift - 4.5 * anticipation + 1.4 * lunge + 2.8 * recovery;
  const lean = 0.024 * stride - 0.12 * anticipation + 0.08 * lunge + 0.065 * recovery;
  const foreShoulder: Point = [13 + 2.5 * lunge - 2 * anticipation, -29 + bodyY + lean * 14];
  const foreElbow: Point = [
    15 + nearFore[0] * 0.42 - 8 * anticipation + 22 * reach + 2.5 * recovery,
    -14 + bodyY * 0.5 - nearFore[1] * 0.65 - 4 * anticipation + 7 * reach + 0.8 * recovery,
  ];
  const foreWrist: Point = [
    17 + nearFore[0] - 9 * anticipation + 34 * reach + 4 * recovery + (biting ? 5 * lunge : 0),
    -2 - nearFore[1] - (biting ? 0 : 11 * anticipation) - 4 * reach,
  ];
  const gape = biting ? envelope(phase, .04, .34, .41, .6) * 1.8 : Math.max(anticipation * 0.76, swipe * 0.8, lunge * 0.4);
  const headReach = biting ? 12 : 4;
  const nod = biting ? -.13 * anticipation + .22 * lunge : 0;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawHind(ctx, -23, bodyY + 2, farHind[0], -7 - farHind[1], false);
  drawForeleg(ctx, [23, -30 + bodyY], [23 + farFore[0] * 0.5, -18 - farFore[1]], [27 + farFore[0], -8 - farFore[1]], false, 0, 1);
  drawTorso(ctx, bodyY, lean);
  drawHind(ctx, -30, bodyY, nearHind[0], -1 - nearHind[1], true);
  drawForeleg(ctx, foreShoulder, foreElbow, foreWrist, true, -0.08 + 0.1 * stride - (biting ? 0 : 0.39 * anticipation) + 0.34 * reach, 1 + 0.65 * Math.max(anticipation, reach));
  drawHead(ctx, 20 + headReach * lunge - 4 * anticipation, -33 + bodyY + lean * 17 - 0.45 * stride, 0.09 + lean * 1.6 + nod, gape, Math.max(anticipation, swipe));
  ctx.restore();
}

export function createForestBearFrame(frame: BearFrame | BearBiteFrame, facing: 'r' | 'l'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64 + 2 * FOREST_BEAR_ART.bodyOffsetX;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const moving = frame.startsWith('move');
  const swiping = frame.startsWith('atk');
  const biting = frame.startsWith('bite');
  const dying = frame.startsWith('die');
  const index = Number(frame.match(/\d+$/)?.[0] ?? 0);
  const pose = forestBearPose(moving ? 'move' : biting ? 'bite' : 'attack', moving || swiping || biting ? index : 0);
  const direction = facing === 'r' ? 1 : -1;
  const { feetY, frameScale } = FOREST_BEAR_ART;

  ctx.translate(canvas.width / 2, feetY);
  ctx.scale(frameScale * direction, frameScale);
  ctx.translate(forestBearOffset(pose), 0);
  if (dying) {
    ctx.scale(1, 1 - (index + 1) * .23);
    ctx.globalAlpha = 1 - index * .23;
  }
  drawForestBear(ctx, pose);
  if (frame === 'hit') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}
