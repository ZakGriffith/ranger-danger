import { line, oval, wash } from './forestEnemies/paint';
import { drawHeavy, mix, paintHeavyFace, paintHeavyTorso, polygon, type HeavyArt, type HeavyMotion, type HeavyPalette, type Point } from './infectedEnemies/heavyMotion';

export const IRONCAP_SIZE = 96;
export const IRONCAP_FOOT_Y = 76;
export const IRONCAP_ANCHOR_X = 48;
export const IRONCAP_ORIGIN_Y = 60 / IRONCAP_SIZE;
export const IRONCAP_MOVE_FRAMES = Array.from({ length: 24 }, (_, i) => `move${i}`);
export const IRONCAP_ATTACK_FRAMES = Array.from({ length: 24 }, (_, i) => `atk${i}`);
export const IRONCAP_MOVE_FPS = 24;
export const IRONCAP_ATTACK_FPS = 24;
export const IRONCAP_IMPACT_FRAME = 12;
export const IRONCAP_FRAMES = ['idle', ...IRONCAP_MOVE_FRAMES, ...IRONCAP_ATTACK_FRAMES, 'hit'];

const FRAME_SCALE = .56;
const STRIKE_PHASE = .56;
const colors = { light: '#b8a493', upper: '#817478', middle: '#655562', deep: '#484052', armor: '#c3c2a8', shade: '#767775', accent: '#d29261', glow: '#f3cf80', toe: '#a79e91' };

function shingle(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, angle: number, c: HeavyPalette) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  polygon(ctx, wash(ctx, -12, 14, [[0, c.armor], [.42, c.upper], [1, c.shade]]), 2.4,
    [[-15, -5], [-11, -11], [4, -13], [11, -7], [15, -8], [12, 5], [5, 12], [-9, 10], [-14, 3]]);
  polygon(ctx, c.armor, 0, [[-13, -5], [-10, -9], [3, -11], [9, -6], [-2, -8], [-10, -5], [-13, 1]]);
  line(ctx, c.shade, 1.6, p => { p.moveTo(8, -4); p.lineTo(4, 0); p.lineTo(6, 4); });
  ctx.restore();
}

function torso(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number) {
  const c = colors;
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  shingle(ctx, -32, -20, .82, -.52, c);
  shingle(ctx, -14, -27, .86, -.22, c);
  paintHeavyTorso(ctx, c, p => {
    p.bezierCurveTo(-47, -8, -37, -29, -21, -27);
    p.bezierCurveTo(-6, -32, 10, -28, 22, -22);
    p.quadraticCurveTo(46, -18, 37, 4);
  });
  shingle(ctx, -1, 12, 1, -.14, c);
  shingle(ctx, 2, 31, .74, -.14, c);
  for (const [dx,dy] of [[-13,10], [8,8], [-6,29]] as const) {
    oval(ctx, dx, dy, 2.8, 2.6, c.deep);
    oval(ctx, dx - .4, dy - .4, 1.45, 1.25, c.accent);
  }
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, strain: number) {
  const c = colors;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  const fill = wash(ctx, -24, 19, [[0, c.armor], [.51, c.upper], [1, c.deep]]);
  polygon(ctx, fill, 3, [[-20,-8],[-16,-21],[-7,-23],[-5,-28],[4,-23],[15,-26],[22,-18],[25,-7],[21,1],[19,13],[7,17],[-10,13],[-16,6]]);
  polygon(ctx, c.armor, 0, [[-16,-15],[-13,-20],[-7,-20],[-4,-25],[4,-20],[14,-23],[19,-18],[11,-16],[4,-17],[-3,-12],[-10,-16]]);
  polygon(ctx, c.shade, 0, [[-14,-9],[-2,-11],[1,-5],[0,4],[-6,12],[-11,10],[-8,2]]);
  line(ctx, c.accent, 1.8, p => { p.moveTo(-12, -14); p.lineTo(-4, -16); p.moveTo(19,-13); p.lineTo(21,-8); });
  oval(ctx, -10, -6, 2.5, 2.2, c.deep);
  oval(ctx, -10.5, -6.4, 1.5, 1.25, c.accent);
  paintHeavyFace(ctx, c, strain);
  ctx.restore();
}

function fist(ctx: CanvasRenderingContext2D, at: Point, angle: number, far: boolean) {
  const c = colors;
  const size = far ? .69 : 1;
  ctx.save(); ctx.translate(...at); ctx.rotate(angle); ctx.scale(size, size);
  const fill = far ? c.deep : wash(ctx, -18, 16, [[0,c.armor],[.42,c.upper],[1,c.deep]]);
  polygon(ctx, fill, 3, [[-18,-8],[-12,-16],[1,-18],[7,-15],[15,-13],[20,-5],[17,6],[13,13],[4,15],[-3,12],[-12,14],[-17,7]]);
  if (!far) {
    shingle(ctx, -3, -5, .69, .15, c);
    for (const x of [4, 10, 15]) oval(ctx, x, 6 - (x - 4) * .18, 2.4, 2, c.accent, -.34);
  }
  ctx.restore();
}

const art: HeavyArt = {
  palette: colors,
  height: -62, headRise: 12, stride: 9.5, kneeBend: 2.5,
  forearmWidth: 12.5, upperArmWidth: 14.6, handRestY: -28,
  windupElbow: [-48, -76], windupHand: [-43, -94],
  torso, head, fist,
  armDetail(ctx, shoulder, elbow, hand, turn) {
    const c = colors;
    shingle(ctx, shoulder[0] - 1, shoulder[1] + 1, 1.19, -.23 * (1 + turn), c);
    const guard = mix(elbow, hand, .53);
    shingle(ctx, guard[0], guard[1], .68, -turn * .46, c);
  },
};

export function drawRustedIroncap(ctx: CanvasRenderingContext2D, motion: HeavyMotion, phase: number) {
  drawHeavy(ctx, art, motion, phase);
}

function attackPhase(frame: number) {
  if (frame <= IRONCAP_IMPACT_FRAME) return STRIKE_PHASE * frame / IRONCAP_IMPACT_FRAME;
  const recoveryFrames = IRONCAP_ATTACK_FRAMES.length - 1 - IRONCAP_IMPACT_FRAME;
  return STRIKE_PHASE + (1 - STRIKE_PHASE) * (frame - IRONCAP_IMPACT_FRAME) / recoveryFrames;
}

export function makeIllustratedIroncapFrame(frame: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = IRONCAP_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(IRONCAP_ANCHOR_X, IRONCAP_FOOT_Y);
  ctx.scale(FRAME_SCALE, FRAME_SCALE);
  if (frame.startsWith('move')) {
    drawRustedIroncap(ctx, 'move', Number(frame.slice(4)) / IRONCAP_MOVE_FRAMES.length);
  } else {
    drawRustedIroncap(ctx, 'attack', frame.startsWith('atk') ? attackPhase(Number(frame.slice(3))) : 0);
  }
  ctx.restore();
  if (frame === 'hit') {
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, IRONCAP_SIZE, IRONCAP_SIZE);
    ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}
