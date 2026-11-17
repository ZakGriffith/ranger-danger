import { line, oval, shape, wash } from '../forestEnemies/paint';

type Action = 'move' | 'attack';
type Point = readonly [number, number];
type GreenPaint = (hex: string) => string;

const FRAME_SIZE = 96;
const FOOT_Y = 76;
const FRAME_SCALE = .48;
const STRIKE_PHASE = .59;
const PALETTES = [
  { name: 'Moss', shift: [0, 0, 0] },
  { name: 'Olive', shift: [9, 4, -9] },
  { name: 'Forest', shift: [-11, -9, -5] },
  { name: 'Sage', shift: [-5, 6, 12] },
] as const;

export const MIRE_SNAPPER_ORIGIN_Y = 60 / FRAME_SIZE;
export const MIRE_SNAPPER_PALETTES = PALETTES.map(palette => palette.name);
export const MIRE_SNAPPER_MOVE_FRAMES = Array.from({ length: 24 }, (_, index) => `move${index}`);
export const MIRE_SNAPPER_ATTACK_FRAMES = Array.from({ length: 24 }, (_, index) => `atk${index}`);
export const MIRE_SNAPPER_MOVE_FPS = 24;
export const MIRE_SNAPPER_ATTACK_FPS = 24;
export const MIRE_SNAPPER_IMPACT_FRAME = 12;
export const MIRE_SNAPPER_FRAMES = ['idle', ...MIRE_SNAPPER_MOVE_FRAMES, ...MIRE_SNAPPER_ATTACK_FRAMES, 'hit'];

export function mireSnapperTexturePrefix(variant: number): string {
  return `eih${variant}`;
}

function greenPaint(variant: number): GreenPaint {
  const [red, green, blue] = PALETTES[variant].shift;
  return hex => {
    const rgb = Number.parseInt(hex.slice(1), 16);
    return `rgb(${(rgb >> 16) + red}, ${((rgb >> 8) & 255) + green}, ${(rgb & 255) + blue})`;
  };
}

const smooth = (start: number, end: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
};

function stompLeg(ctx: CanvasRenderingContext2D, x: number, y: number, reach: number, lift: number, far: boolean, front: boolean, green: GreenPaint) {
  const footX = x + (front ? 10 : -4) + reach;
  const footY = (far ? -5 : 0) - lift;
  const skin = far ? '#49534f' : '#71826d';
  shape(ctx, wash(ctx, y - 7, footY, [[0, green(skin)], [.65, green(far ? '#3f494a' : '#56685e')], [1, '#323c43']]), 2.8, p => {
    p.moveTo(x - 12, y);
    p.bezierCurveTo(x - 6, y - 13, x + 9, y - 13, x + 14, y - 2);
    p.quadraticCurveTo(x + 16, y + 9, footX + 4, footY - 9);
    p.quadraticCurveTo(footX + 18, footY - 6, footX + 15, footY);
    p.quadraticCurveTo(footX + 9, footY + 4, footX + 3, footY + 1);
    p.quadraticCurveTo(footX - 7, footY + 3, footX - 11, footY - 1);
    p.quadraticCurveTo(footX - 12, footY - 7, footX - 9, footY - 10);
    p.quadraticCurveTo(x - 15, y + 10, x - 12, y);
  });
  if (far) return;
  line(ctx, green('#9aa187'), 1.55, p => {
    p.moveTo(x - 7, y + 8); p.quadraticCurveTo(x - 2, y + 2, x + 4, y + 5);
    p.moveTo(x - 4, y + 13); p.quadraticCurveTo(x + 2, y + 9, x + 6, y + 11);
  });
  for (const [i, offset] of [-4, 4, 11].entries()) {
    shape(ctx, '#c9c49d', 1.1, p => {
      const q = footX + offset;
      p.moveTo(q - 2, footY - 2);
      p.quadraticCurveTo(q + 4, footY - 4, q + 5 + i * .2, footY + .6);
      p.quadraticCurveTo(q + 1, footY + .7, q - 2, footY - 2);
    });
  }
}

function carapaceFlake(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, turn: number, high: string, low: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.scale(scale, scale);
  shape(ctx, wash(ctx, -18, 15, [[0, high], [.54, low], [1, '#3d4d47']]), 1.7, p => {
    p.moveTo(-20, 5);
    p.quadraticCurveTo(-19, -5, -12, -12);
    p.lineTo(-3, -15); p.lineTo(5, -21); p.lineTo(8, -15);
    p.quadraticCurveTo(22, -11, 23, 1);
    p.quadraticCurveTo(20, 10, 8, 14);
    p.quadraticCurveTo(-8, 16, -20, 5);
  });
  line(ctx, high, 1.25, p => {
    p.moveTo(-15, 0); p.quadraticCurveTo(-9, -9, -3, -10);
    p.lineTo(4, -15);
    p.moveTo(5, 8); p.quadraticCurveTo(14, 8, 19, 2);
  });
  line(ctx, '#465746', 1.15, p => {
    p.moveTo(-8, 5); p.quadraticCurveTo(-2, 3, 1, 6);
    p.moveTo(7, -5); p.quadraticCurveTo(12, -4, 15, -1);
  });
  ctx.restore();
}

function tail(ctx: CanvasRenderingContext2D, bob: number, wag: number, green: GreenPaint) {
  shape(ctx, green('#526157'), 2.9, p => {
    p.moveTo(-50, -25 + bob);
    p.quadraticCurveTo(-69, -23 + bob, -76, -13 + wag);
    p.quadraticCurveTo(-83, -8 + wag, -87, -14 + wag);
    p.quadraticCurveTo(-87, -2 + wag, -76, -3 + wag);
    p.quadraticCurveTo(-58, -5 + bob, -43, -13 + bob);
  });
  line(ctx, green('#89916b'), 1.55, p => {
    p.moveTo(-75, -9 + wag); p.quadraticCurveTo(-64, -18 + bob, -54, -18 + bob);
  });
}

function shell(ctx: CanvasRenderingContext2D, y: number, tilt: number, green: GreenPaint) {
  ctx.save();
  ctx.translate(-11, y);
  ctx.rotate(tilt);
  const contour = (p: CanvasRenderingContext2D) => {
    p.moveTo(-49, -19);
    p.bezierCurveTo(-51, -31, -40, -41, -35, -54);
    p.lineTo(-21, -59); p.lineTo(-13, -68); p.lineTo(-2, -64);
    p.lineTo(9, -73); p.lineTo(16, -64);
    p.quadraticCurveTo(36, -63, 44, -44);
    p.quadraticCurveTo(57, -36, 60, -20);
    p.bezierCurveTo(45, -11, 27, -12, 9, -13);
    p.bezierCurveTo(-6, -8, -41, -8, -49, -19);
  };
  shape(ctx, wash(ctx, -70, -13, [[0, green('#9ba878')], [.38, green('#6e8059')], [.72, green('#4e6255')], [1, '#354348']]), 3.8, contour);
  ctx.save();
  ctx.beginPath();
  contour(ctx);
  ctx.clip();
  carapaceFlake(ctx, -27, -38, .92, -.52, green('#a2a57c'), green('#697451'));
  carapaceFlake(ctx, -10, -55, .86, -.22, green('#afb58a'), green('#768860'));
  carapaceFlake(ctx, 13, -54, 1.04, .06, green('#b6b98c'), green('#809362'));
  carapaceFlake(ctx, 35, -43, .84, .44, green('#a6b47a'), green('#6a8254'));
  carapaceFlake(ctx, -34, -23, .75, -.28, green('#8e9b71'), green('#5b7655'));
  carapaceFlake(ctx, -13, -31, 1.01, -.2, green('#97ac77'), green('#657e56'));
  carapaceFlake(ctx, 15, -28, .98, .13, green('#8f9e75'), green('#637654'));
  carapaceFlake(ctx, 42, -25, .85, .3, green('#93a375'), green('#657951'));
  ctx.restore();
  shape(ctx, wash(ctx, -29, -10, [[0, green('#889468')], [.45, green('#64724f')], [1, '#3e4c46']]), 2.75, p => {
    p.moveTo(-50, -22);
    p.quadraticCurveTo(-41, -21, -31, -21);
    p.quadraticCurveTo(-20, -18, -8, -22);
    p.quadraticCurveTo(2, -18, 12, -21);
    p.quadraticCurveTo(28, -19, 43, -25);
    p.quadraticCurveTo(56, -29, 60, -21);
    p.quadraticCurveTo(56, -13, 40, -12);
    p.quadraticCurveTo(29, -8, 17, -11);
    p.quadraticCurveTo(2, -8, -8, -10);
    p.quadraticCurveTo(-40, -6, -50, -16);
    p.quadraticCurveTo(-52, -19, -50, -22);
  });
  line(ctx, green('#b3bd82'), 1.55, p => {
    p.moveTo(-43, -20); p.quadraticCurveTo(-33, -16, -24, -19);
    p.moveTo(25, -19); p.quadraticCurveTo(35, -19, 43, -23);
  });
  for (const [x, yy, w, h] of [[-39, -48, 5, 2], [-25, -56, 7, 2.3], [-21, -53, 4, 2], [10, -58, 6.2, 1.7], [35, -22, 6.8, 2.5], [42, -23, 3.3, 2.75]]) {
    oval(ctx, x, yy, w, h, green('#657f4e'), -.12);
    oval(ctx, x - .8, yy - 1.2, w * .72, h * .52, green('#a5b872'), -.12);
  }
  for (const [x, yy, r] of [[-24, -45, 2.5], [-21, -42, 1.6], [9, -39, 3.5], [17, -41, 2.2], [19, -36, 1.35]]) {
    oval(ctx, x, yy, r + .5, r, '#473d43');
    oval(ctx, x - .2, yy - .45, r, r * .65, '#ba8168', -.45);
    oval(ctx, x - .9, yy - .8, r * .4, r * .2, '#e0a580', -.32);
  }
  ctx.restore();
}

function jawHead(ctx: CanvasRenderingContext2D, x: number, y: number, jaw: number, twist: number, green: GreenPaint) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(twist);
  shape(ctx, wash(ctx, -11, 20, [[0, green('#758475')], [.43, green('#596d66')], [1, '#414953']]), 3.1, p => {
    p.moveTo(-19, -3);
    p.quadraticCurveTo(-11, -14, 6, -8);
    p.quadraticCurveTo(12, -3, 15, 8);
    p.quadraticCurveTo(9, 17, -5, 19);
    p.quadraticCurveTo(-17, 19, -23, 11);
    p.quadraticCurveTo(-25, 6, -19, -3);
  });
  line(ctx, green('#859888'), 1.5, p => {
    p.moveTo(-18, 3); p.quadraticCurveTo(-22, 9, -14, 15);
    p.moveTo(-12, 2); p.quadraticCurveTo(-14, 9, -8, 13);
  });
  ctx.save();
  ctx.translate(6, 0);
  ctx.rotate(jaw * .50);
  shape(ctx, wash(ctx, 1, 15, [[0, '#777967'], [.46, '#5d6458'], [1, '#38414a']]), 2.55, p => {
    p.moveTo(-8, 1);
    p.quadraticCurveTo(3, 9, 17, 6);
    p.lineTo(20, 5);
    p.quadraticCurveTo(17, 13, 7, 15);
    p.quadraticCurveTo(-4, 16, -9, 9);
    p.quadraticCurveTo(-11, 5, -8, 1);
  });
  line(ctx, '#aca887', 1.45, p => { p.moveTo(4, 8); p.quadraticCurveTo(11, 10, 16, 7); });
  ctx.restore();
  shape(ctx, wash(ctx, -22, 9, [[0, green('#8da28b')], [.39, green('#728c7b')], [.76, green('#526a65')], [1, '#40535b']]), 3, p => {
    p.moveTo(-15, -1);
    p.bezierCurveTo(-20, -8, -16, -18, -7, -20);
    p.quadraticCurveTo(3, -22, 8, -18);
    p.quadraticCurveTo(20, -17, 24, -11);
    p.quadraticCurveTo(31, -9, 29, 0);
    p.quadraticCurveTo(26, 5, 24, 7);
    p.quadraticCurveTo(25, 0, 16, 0);
    p.quadraticCurveTo(12, 6, 2, 7);
    p.quadraticCurveTo(-9, 9, -15, -1);
  });
  shape(ctx, wash(ctx, -13, 5, [[0, '#818979'], [.56, '#606c65'], [1, '#46504e']]), 1.8, p => {
    p.moveTo(16, -13); p.quadraticCurveTo(26, -13, 29, -7);
    p.quadraticCurveTo(32, 1, 24, 8); p.quadraticCurveTo(25, 1, 18, 0);
    p.quadraticCurveTo(14, -7, 16, -13);
  });
  oval(ctx, 22, -8.5, 2.25, 1.17, '#3a4744', .24);
  oval(ctx, 3, -7.4, 6.35, 4.8, '#344449', -.19);
  oval(ctx, 4.1, -7.75, 4.8, 3.1, '#e2b457', -.22);
  oval(ctx, 5.7, -8, 1.34, 2.63, '#302a2e', .21);
  oval(ctx, 3.3, -8.7, 1, .75, '#f8d289');
  line(ctx, green('#a7b497'), 1.45, p => {
    p.moveTo(-11, -10); p.quadraticCurveTo(-3, -18, 7, -14);
    p.moveTo(-4, 1); p.quadraticCurveTo(-.5, 3, 4, 1);
  });
  for (const [xx, yy, r] of [[-8, -7, 2.1], [-7, -2, 1.65], [-2, -4, 1.1], [10, -2, 1.55], [13, -3, 1.1]]) {
    oval(ctx, xx, yy, r, r * .62, green('#a1af93'), -.19);
  }
  ctx.restore();
}

function impactSilt(ctx: CanvasRenderingContext2D, x: number, phase: number) {
  if (phase < .56 || phase > .79) return;
  const t = (phase - .56) / .23;
  ctx.save();
  ctx.globalAlpha = Math.sin(Math.PI * t) * .66;
  for (const [dx, height] of [[-19, 7], [-12, 12], [0, 16], [8, 10], [19, 7]]) {
    const spread = dx * (.75 + t * .5);
    const y = -4 - Math.sin(t * Math.PI) * height;
    line(ctx, '#b5bf85', 1.7, p => {
      p.moveTo(x + spread - 1.5, y + 3); p.lineTo(x + spread + dx * .15, y);
    });
  }
  ctx.restore();
}

export function drawMireSnapper(ctx: CanvasRenderingContext2D, action: Action, phase: number, variant = 0) {
  const green = greenPaint(variant);
  const attack = action === 'attack';
  const windup = attack ? smooth(.02, .46, phase) * (1 - smooth(.46, STRIKE_PHASE, phase)) : 0;
  const hit = attack ? smooth(.49, STRIKE_PHASE, phase) * (1 - smooth(.62, .9, phase)) : 0;
  const jaw = attack ? smooth(.17, .48, phase) * (1 - smooth(.51, .58, phase)) : 0;
  const time = phase * 2 * Math.PI;
  const sway = attack ? -windup * 2 + hit * 3 : Math.sin(time) * 1.5;
  const bob = attack ? -windup * 8 + hit * 2.7 : -(Math.sin(time * 2) ** 2) * 2;
  const step = (offset: number): Point => {
    if (attack) return [hit * 2 - windup * .7, 0];
    const p = (phase + offset) % 1;
    if (p <= .65) return [4 - p / .65 * 8, 0];
    const loft = (p - .65) / .35;
    return [-4 + loft * 8, Math.sin(loft * Math.PI) * 5.5];
  };
  ctx.save();
  ctx.translate(sway, 0);
  ctx.lineCap = ctx.lineJoin = 'round';
  tail(ctx, bob, attack ? -windup * 2 : Math.sin(time) * 2.1, green);
  stompLeg(ctx, -26, -23 + bob, ...step(.56), true, false, green);
  stompLeg(ctx, 26, -22 + bob, ...step(.05), true, true, green);
  stompLeg(ctx, -33, -17 + bob, ...step(.03), false, false, green);
  stompLeg(ctx, 25, -18 + bob, ...step(.54), false, true, green);
  const stretch = hit * 15 - windup * 9;
  jawHead(ctx, 44 + stretch, -26 + bob * .38 + hit * 6, jaw, -.09 - windup * .22 + hit * .16, green);
  shell(ctx, bob, hit * .075 - windup * .07, green);
  if (attack) impactSilt(ctx, 65, phase);
  ctx.restore();
}

function attackPhase(frame: number): number {
  if (frame <= MIRE_SNAPPER_IMPACT_FRAME) return STRIKE_PHASE * frame / MIRE_SNAPPER_IMPACT_FRAME;
  const recoveryFrames = MIRE_SNAPPER_ATTACK_FRAMES.length - 1 - MIRE_SNAPPER_IMPACT_FRAME;
  return STRIKE_PHASE + (1 - STRIKE_PHASE) * (frame - MIRE_SNAPPER_IMPACT_FRAME) / recoveryFrames;
}

export function makeMireSnapperFrame(frame: string, variant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(FRAME_SIZE / 2, FOOT_Y);
  ctx.scale(FRAME_SCALE, FRAME_SCALE);
  if (frame.startsWith('move')) {
    drawMireSnapper(ctx, 'move', Number(frame.slice(4)) / MIRE_SNAPPER_MOVE_FRAMES.length, variant);
  } else {
    drawMireSnapper(ctx, 'attack', frame.startsWith('atk') ? attackPhase(Number(frame.slice(3))) : 0, variant);
  }
  ctx.restore();
  if (frame === 'hit') {
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
    ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}
