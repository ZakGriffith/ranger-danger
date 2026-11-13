import type { RamFrame } from './bosses';
import { meadowEnemyPose, type MeadowEnemyPose } from './meadowEnemies/pose';

type Path = (ctx: CanvasRenderingContext2D) => void;
type RamDetails = {
  idleBob?: number;
  chargeGlow?: boolean;
  pockets?: number;
  snort?: boolean;
};

const ink = '#2b2330';
const cream = '#f5dbad';
const brass = '#c88c4e';

function shape(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, path: Path, width = 2.9) {
  ctx.beginPath();
  path(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (width) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, color: string, width: number, path: Path) {
  ctx.beginPath();
  path(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx: CanvasRenderingContext2D, y1: number, y2: number, light: string, dark: string) {
  const wash = ctx.createLinearGradient(0, y1, 0, y2);
  wash.addColorStop(0, light);
  wash.addColorStop(1, dark);
  return wash;
}

function leg(ctx: CanvasRenderingContext2D, x: number, shoulderY: number, hoofX: number, hoofY: number, near: boolean) {
  const knee = x + (hoofX - x) * .43 - 3;
  shape(ctx, near ? '#756067' : '#59434b', p => {
    p.moveTo(x - 7, shoulderY);
    p.quadraticCurveTo(x + 5, shoulderY - 4, x + 8, shoulderY + 4);
    p.quadraticCurveTo(knee + 7, hoofY - 13, hoofX + 3, hoofY - 5);
    p.quadraticCurveTo(hoofX + 9, hoofY - 3, hoofX + 7, hoofY);
    p.lineTo(hoofX - 7, hoofY);
    p.quadraticCurveTo(hoofX - 10, hoofY - 3, hoofX - 7, hoofY - 7);
    p.quadraticCurveTo(knee - 5, hoofY - 15, x - 7, shoulderY);
  });
  line(ctx, near ? '#332833' : '#3f2e39', 2.5, p => {
    p.moveTo(hoofX - 6, hoofY - 3);
    p.lineTo(hoofX + 6, hoofY - 3);
  });
  if (near) line(ctx, '#b39187', 1.7, p => {
    p.moveTo(x + 4, shoulderY + 5);
    p.quadraticCurveTo(knee + 3, hoofY - 14, hoofX - 2, hoofY - 7);
  });
}

function drawFleece(ctx: CanvasRenderingContext2D) {
  shape(ctx, gradient(ctx, -64, -15, cream, '#a16e57'), p => {
    p.moveTo(-51, -32);
    p.quadraticCurveTo(-58, -34, -57, -40);
    p.quadraticCurveTo(-53, -45, -49, -43);
    p.quadraticCurveTo(-47, -54, -37, -53);
    p.quadraticCurveTo(-31, -62, -21, -58);
    p.quadraticCurveTo(-13, -65, -4, -59);
    p.quadraticCurveTo(3, -65, 13, -60);
    p.quadraticCurveTo(22, -62, 29, -53);
    p.quadraticCurveTo(37, -52, 42, -42);
    p.quadraticCurveTo(48, -33, 39, -24);
    p.quadraticCurveTo(41, -17, 31, -14);
    p.quadraticCurveTo(28, -6, 18, -13);
    p.quadraticCurveTo(8, -8, 2, -14);
    p.quadraticCurveTo(-7, -10, -14, -15);
    p.quadraticCurveTo(-23, -9, -29, -17);
    p.quadraticCurveTo(-40, -12, -43, -23);
    p.quadraticCurveTo(-53, -22, -51, -32);
  });
  shape(ctx, '#fbe6bc', p => {
    p.moveTo(-47, -38);
    p.quadraticCurveTo(-44, -48, -35, -48);
    p.quadraticCurveTo(-27, -56, -19, -53);
    p.quadraticCurveTo(-13, -59, -4, -54);
    p.quadraticCurveTo(6, -60, 15, -54);
    p.quadraticCurveTo(24, -58, 30, -49);
    p.quadraticCurveTo(12, -52, 4, -44);
    p.quadraticCurveTo(-4, -47, -14, -44);
    p.quadraticCurveTo(-23, -49, -31, -41);
    p.quadraticCurveTo(-39, -43, -47, -38);
  }, 0);
  for (const [x, y, scale] of [[-39, -31, .75], [-24, -40, .95], [-14, -26, .85], [1, -40, 1], [12, -28, 1.1]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    line(ctx, '#966756', 1.65, p => {
      p.moveTo(-4, 2);
      p.bezierCurveTo(-7, -5, 3, -9, 6, -3);
      p.quadraticCurveTo(8, 2, 3, 2);
      p.quadraticCurveTo(0, 2, 1, -1);
    });
    ctx.restore();
  }
  shape(ctx, '#d4ae78', p => {
    p.moveTo(22, -46);
    p.quadraticCurveTo(30, -48, 35, -38);
    p.quadraticCurveTo(39, -25, 30, -15);
    p.lineTo(26, -24);
    p.lineTo(21, -17);
    p.lineTo(17, -28);
    p.quadraticCurveTo(21, -33, 22, -46);
  }, 0);
}

function horn(ctx: CanvasRenderingContext2D, far: boolean, glow = false) {
  shape(ctx, gradient(ctx, -31, 13, far ? '#b58a60' : cream, far ? '#69505a' : brass), p => {
    p.moveTo(7, -18);
    p.bezierCurveTo(-6, -30, -25, -27, -30, -13);
    p.bezierCurveTo(-37, 2, -25, 15, -11, 15);
    p.bezierCurveTo(4, 14, 10, 4, 5, -4);
    p.bezierCurveTo(3, -7, -2, -9, -7, -7);
    p.bezierCurveTo(-12, -5, -11, 1, -7, 2);
    p.bezierCurveTo(-3, 3, -1, 1, -2, -1);
    p.bezierCurveTo(1, 1, -2, 7, -11, 7);
    p.bezierCurveTo(-21, 7, -25, -4, -21, -11);
    p.bezierCurveTo(-17, -19, -7, -17, -1, -10);
    p.lineTo(7, -18);
  }, 3.1);
  if (far) return;
  line(ctx, glow ? '#ffac55' : '#fff0ca', 1.8, p => {
    p.moveTo(-2, -21);
    p.bezierCurveTo(-12, -27, -25, -21, -28, -12);
    p.quadraticCurveTo(-34, 0, -24, 8);
  });
  line(ctx, glow ? '#c7473c' : '#a86e51', 1.55, p => {
    p.moveTo(-10, -24); p.lineTo(-9, -16);
    p.moveTo(-19, -22); p.lineTo(-16, -15);
    p.moveTo(-26, -17); p.lineTo(-21, -12);
    p.moveTo(-30, -8); p.lineTo(-23, -6);
    p.moveTo(-29, 1); p.lineTo(-23, -1);
    p.moveTo(-24, 8); p.lineTo(-19, 4);
    p.moveTo(-16, 12); p.lineTo(-14, 7);
    p.moveTo(-7, 12); p.lineTo(-8, 7);
  });
  if (glow) {
    for (const [x, y, size] of [[-20, -29, 1.4], [-34, -15, 1.15], [-35, 2, 1.55], [-23, 14, 1.2]]) {
      shape(ctx, '#ffb456', p => p.ellipse(x, y, size, size * .8, 0, 0, Math.PI * 2), 0);
    }
  }
}

function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, glow: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.save();
  ctx.translate(13, -5);
  ctx.scale(.76, .74);
  horn(ctx, true);
  ctx.restore();
  shape(ctx, '#8f6b69', p => {
    p.moveTo(8, -12);
    p.quadraticCurveTo(15, -26, 25, -22);
    p.quadraticCurveTo(24, -14, 15, -8);
  });
  shape(ctx, gradient(ctx, -21, 25, '#a37c73', '#54404d'), p => {
    p.moveTo(-12, -9);
    p.quadraticCurveTo(-6, -23, 8, -19);
    p.quadraticCurveTo(17, -16, 18, -8);
    p.quadraticCurveTo(20, -3, 26, 1);
    p.quadraticCurveTo(31, 9, 24, 15);
    p.quadraticCurveTo(18, 19, 10, 17);
    p.lineTo(7, 23);
    p.lineTo(1, 17);
    p.lineTo(-5, 20);
    p.quadraticCurveTo(-13, 11, -12, -9);
  });
  shape(ctx, '#c39983', p => {
    p.moveTo(9, -14);
    p.quadraticCurveTo(17, -9, 17, -1);
    p.quadraticCurveTo(19, 4, 25, 5);
    p.quadraticCurveTo(28, 8, 24, 12);
    p.quadraticCurveTo(19, 14, 15, 9);
    p.quadraticCurveTo(10, 1, 9, -14);
  }, 0);
  shape(ctx, ink, p => {
    p.moveTo(21, 5);
    p.quadraticCurveTo(26, 3, 28, 7);
    p.quadraticCurveTo(26, 11, 23, 10);
  }, 0);
  line(ctx, ink, 1.9, p => {
    p.moveTo(25, 13);
    p.quadraticCurveTo(19, 15, 15, 12);
  });
  ctx.save();
  ctx.translate(-4, -5);
  horn(ctx, false, glow);
  ctx.restore();
  shape(ctx, glow ? '#fff4b3' : '#ffd783', p => {
    p.moveTo(7, -7);
    p.quadraticCurveTo(11, -7, 16, -4);
    p.quadraticCurveTo(11, 2, 7, -2);
  }, 1.45);
  line(ctx, '#552c31', 1.65, p => {
    p.moveTo(12, -5);
    p.lineTo(12, -1);
  });
  line(ctx, ink, 2.35, p => {
    p.moveTo(6, -8);
    p.quadraticCurveTo(10, -8, 16, -5);
  });
  ctx.restore();
}

export function drawRam(ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose, details: RamDetails = {}) {
  const { mode, phase, anticipation, lunge, strike, recovery } = pose;
  const gait = mode === 'move' ? Math.sin(phase * Math.PI * 2) : 0;
  const bob = Math.abs(gait) * -1.8 + recovery * 1.7 + (details.idleBob ?? 0);
  const lift = anticipation * 15;
  const tilt = -.24 * anticipation + .17 * strike;
  const drive = -4 * anticipation + 11 * lunge;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  leg(ctx, -30, -29 + bob, -32 - 7 * gait, -5 - Math.max(gait, 0) * 5, false);
  leg(ctx, 23 + drive, -32 + bob - lift, 25 + 7 * gait + 14 * lunge,
    -6 - lift - Math.max(-gait, 0) * 5, false);
  ctx.save();
  ctx.translate(drive * .48, bob - lift * .36);
  ctx.rotate(tilt);
  drawFleece(ctx);
  if (details.pockets !== undefined) drawPockets(ctx, details.pockets);
  ctx.restore();
  leg(ctx, -35, -22 + bob, -37 + 9 * gait - 4 * anticipation, -Math.max(-gait, 0) * 6, true);
  leg(ctx, 25 + drive, -23 + bob - lift, 26 - 9 * gait + 15 * lunge - 5 * anticipation,
    -lift - Math.max(gait, 0) * 6, true);
  const headX = 28 + drive;
  const headY = -44 + bob - lift + 15 * strike;
  drawHead(ctx, headX, headY, -.23 * anticipation + .31 * strike, details.chargeGlow ?? false);
  if (details.snort) drawSnort(ctx, headX, headY, strike);
  ctx.restore();
}

function drawPockets(ctx: CanvasRenderingContext2D, stage: number) {
  const colors = ['#e5bb8a', '#885148', '#e7834c', '#ffd988', '#725253'];
  for (const [x, y] of [[-35, -50], [-20, -57], [-4, -58]]) {
    const radius = stage === 3 ? 5.3 : 3.9;
    shape(ctx, colors[stage], p => p.ellipse(x, y, radius, radius * .83, -.2, 0, Math.PI * 2), 1.7);
    if (stage === 2 || stage === 3) {
      line(ctx, cream, 1.5, p => {
        p.moveTo(x - 1.7, y - .8);
        p.lineTo(x + 1.3, y - 1.1);
      });
    }
  }
}

function drawSnort(ctx: CanvasRenderingContext2D, x: number, y: number, strike: number) {
  const puffX = Math.min(x + 33, 65);
  const puffY = y + 5 + 7 * strike;
  for (const [dx, dy, size] of [[0, -2, 3.4], [5, -3, 2.2], [8, -6, 1.15]]) {
    shape(ctx, '#c1ac969c', p => p.ellipse(puffX + dx, puffY + dy, size, size * .67, -.5, 0, Math.PI * 2), 0);
  }
  shape(ctx, '#ffbd67', p => p.ellipse(puffX + 3, puffY + .5, 1.3, .9, -.5, 0, Math.PI * 2), 0);
}

function drawDeath(ctx: CanvasRenderingContext2D, step: number) {
  if (step < 2) {
    ctx.save();
    ctx.globalAlpha = step === 0 ? .92 : .64;
    ctx.scale(1 + step * .035, 1 - step * .2);
    drawRam(ctx, meadowEnemyPose('attack', .79));
    ctx.restore();
  }
  const colors = ['#f5dbad', '#b68464', '#684954', '#ffad62'];
  for (let i = 0; i < 13; i++) {
    const angle = i * (Math.PI * 2 / 13) + step * .17;
    const distance = (i % 3) * 4 + step * 9 + 9;
    const x = Math.cos(angle) * distance;
    const y = -33 + Math.sin(angle) * distance * .56;
    const size = 5.4 - step * .9 + i % 2;
    ctx.globalAlpha = 1 - step * .15;
    shape(ctx, colors[i % colors.length], p => {
      p.moveTo(x - size, y);
      p.lineTo(x + size * .25, y - size);
      p.lineTo(x + size, y + size * .2);
      p.lineTo(x, y + size * .64);
    }, 1);
  }
  ctx.globalAlpha = 1;
}

const SLAM_PHASES = [.38, .47, .56, .78];
const IDLE_BOB = [0, -1.15, -2.1, -.85];

export function createMeadowRamFrame(frame: RamFrame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  // Match the original frame's world scale and place the hooves above its shadow plane.
  ctx.translate(61, 112);
  ctx.scale(.86, .86);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const index = Number(frame[frame.length - 1]);
  if (frame.startsWith('die')) {
    drawDeath(ctx, index);
  } else if (frame === 'chargeWind') {
    drawRam(ctx, meadowEnemyPose('attack', .52), { chargeGlow: true, snort: true });
  } else if (frame.startsWith('atk')) {
    drawRam(ctx, meadowEnemyPose('attack', SLAM_PHASES[index]), { snort: index === 2 });
  } else if (frame.startsWith('move')) {
    drawRam(ctx, meadowEnemyPose('move', (index + .65) / 6));
  } else {
    drawRam(ctx, meadowEnemyPose('attack', 0), {
      idleBob: frame.startsWith('idle') ? IDLE_BOB[index] : 0,
      pockets: frame.startsWith('birth') ? index : undefined,
    });
    if (frame === 'hit') {
      ctx.resetTransform();
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  return canvas;
}
