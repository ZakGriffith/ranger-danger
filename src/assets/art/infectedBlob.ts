import { line, oval, shape, wash } from './forestEnemies/paint';

type Motion = 'move' | 'attack';

const TAU = Math.PI * 2;
const FRAME_SCALE = .59;

export const BLOB_MOVE_FRAMES = Array.from({ length: 32 }, (_, frame) => `move${frame}`);
export const BLOB_ATTACK_FRAMES = Array.from({ length: 24 }, (_, frame) => `atk${frame}`);
export const BLOB_FRAMES = [...BLOB_MOVE_FRAMES, ...BLOB_ATTACK_FRAMES, 'hit'];
export const BLOB_ATTACK_FRAME_MS = 40;
export const BLOB_ATTACK_DURATION_MS = BLOB_ATTACK_FRAMES.length * BLOB_ATTACK_FRAME_MS;
export const BLOB_WINDUP_MS = 200;
export const BLOB_FLIGHT_MS = 320;
export const BLOB_IMPACT_MS = BLOB_WINDUP_MS + BLOB_FLIGHT_MS;
export const BLOB_FRAME_WIDTH = 96;
export const BLOB_FRAME_HEIGHT = 112;
export const BLOB_FOOT_Y = 104;
export const BLOB_ORIGIN_Y = 88 / BLOB_FRAME_HEIGHT;
export const BLOB_AIR_HEIGHT = 32;

function ease(a: number, b: number, t: number) {
  const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
}

function glint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, paint: string, angle = -.28) {
  oval(ctx, x, y, r, r * .31, paint, angle);
}

type JellyModel = {
  name: string;
  description: string;
  gel: readonly [string, string, string, string, string];
  shade: string;
  glaze: string;
  sparkle: string;
  bubbleColors: readonly [string, string, string];
  bubbles: readonly (readonly [number, number, number])[];
  bubbleCenter: number;
  bounce: number;
  trace: (path: CanvasRenderingContext2D, bulge: number) => void;
};

const JELLY_MODELS: readonly JellyModel[] = [
  {
    name: 'Jade Jelly',
    description: 'A bubbly jade gel with a small bounce in its roll and a bigger jump strike.',
    gel: ['#cce69b', '#8bbf76', '#4f9a65', '#327c62', '#285e53'],
    shade: '#306e61ab', glaze: '#d7ecaa66', sparkle: '#edf3bd',
    bubbleColors: ['#367763b0', '#9bca848a', '#f0f4bbd9'],
    bubbles: [[-27, -7, 5.1], [-17, -20, 6.6], [-5, -19, 3.1], [-7, -3, 4.3],
      [18, -16, 5.3], [24, 4, 7.6], [4, 17, 8.2], [-20, 16, 4.2], [12, 26, 3.6]],
    bubbleCenter: -35, bounce: 6.4,
    trace(p, bulge) {
      p.moveTo(-21, -1);
      p.bezierCurveTo(-39, -2, -48, -15, -47, -32);
      p.bezierCurveTo(-47, -52, -29 + bulge, -66, -5 + bulge, -67);
      p.bezierCurveTo(19 + bulge, -70, 43, -55, 45, -38);
      p.bezierCurveTo(51, -21, 38, -4, 21, -1);
      p.quadraticCurveTo(2, 1, -21, -1);
    },
  },
  {
    name: 'Seafoam Jelly',
    description: 'A tall mint drop with a few large, clear bubbles and a springier bounce.',
    gel: ['#caf0cc', '#8bd4b6', '#52a99c', '#397f82', '#305a69'],
    shade: '#327781aa', glaze: '#d6f6de72', sparkle: '#f0ffda',
    bubbleColors: ['#316e75b3', '#a9e1c56e', '#edffe5d9'],
    bubbles: [[-19, -17, 9.2], [8, -7, 5.8], [23, -15, 3.2], [16, 13, 10.8], [-13, 22, 5.6], [-8, 5, 3.1]],
    bubbleCenter: -36, bounce: 8.1,
    trace(p, bulge) {
      p.moveTo(-14, -.8);
      p.bezierCurveTo(-34, -2, -44, -16, -43, -33);
      p.bezierCurveTo(-42, -50, -28, -61, -12 + bulge, -68);
      p.bezierCurveTo(9 + bulge, -76, 27, -64, 34, -47);
      p.bezierCurveTo(46, -34, 48, -14, 27, -4);
      p.quadraticCurveTo(13, 1, -14, -.8);
    },
  },
  {
    name: 'Honey Jelly',
    description: 'A squat amber puddle with a wavy edge and clusters of tiny bubbles.',
    gel: ['#f1d88a', '#dab25d', '#b7804c', '#995f47', '#734e42'],
    shade: '#805844a6', glaze: '#fff0ab69', sparkle: '#fff3bf',
    bubbleColors: ['#885944ad', '#f3ca7599', '#fff4c6db'],
    bubbles: [[-31, -8, 4.8], [-20, -18, 3.7], [-13, -9, 3.1], [-19, 3, 5.3],
      [3, -24, 4.1], [16, -20, 2.7], [27, -13, 5.8], [15, -3, 3.6],
      [27, 8, 4.2], [17, 18, 5.2], [3, 15, 2.6], [-9, 24, 4.6]],
    bubbleCenter: -29, bounce: 4.6,
    trace(p, bulge) {
      p.moveTo(-28, -1);
      p.bezierCurveTo(-50, -1, -55, -12, -50, -25);
      p.bezierCurveTo(-48, -42, -33, -53, -17, -52);
      p.bezierCurveTo(-9, -59, 11 + bulge, -62, 24, -51);
      p.bezierCurveTo(39, -53, 52, -37, 53, -22);
      p.bezierCurveTo(56, -10, 42, -1, 25, -1);
      p.quadraticCurveTo(-1, 1, -28, -1);
    },
  },
  {
    name: 'Plum Jelly',
    description: 'A lopsided lavender mound with pearls of air tucked into one shoulder.',
    gel: ['#e7b7d3', '#c592b6', '#9c6b99', '#795683', '#564060'],
    shade: '#644364b3', glaze: '#f7cde578', sparkle: '#fbe4f0',
    bubbleColors: ['#6a4b77bb', '#dca7d598', '#fff0f4cf'],
    bubbles: [[-28, -13, 7.6], [-12, -21, 5.1], [-18, -3, 6.3], [-6, -8, 3.1],
      [6, 4, 4.8], [20, 13, 8.2], [27, 0, 4.2], [-13, 25, 3.6]],
    bubbleCenter: -34, bounce: 6,
    trace(p, bulge) {
      p.moveTo(-20, -1);
      p.bezierCurveTo(-38, -1, -50, -11, -48, -31);
      p.bezierCurveTo(-46, -57, -29 + bulge, -69, -11 + bulge, -66);
      p.bezierCurveTo(4 + bulge, -65, 11, -52, 21, -53);
      p.bezierCurveTo(35, -56, 51, -38, 51, -23);
      p.bezierCurveTo(51, -8, 33, -2, 19, -1);
      p.quadraticCurveTo(1, 1, -20, -1);
    },
  },
];

function jellyBubbles(ctx: CanvasRenderingContext2D, turn: number, model: JellyModel) {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const [rim, fill, light] = model.bubbleColors;
  for (const [localX, localY, r] of model.bubbles) {
    const x = localX * cos - localY * sin;
    const y = model.bubbleCenter + (localX * sin + localY * cos) * .78;
    oval(ctx, x, y, r + .75, r * .88 + .75, rim, -.24);
    oval(ctx, x, y - .35, r - .2, r * .86, fill, -.24);
    glint(ctx, x - r * .27, y - r * .47, r * .49, light, -.43);
  }
}

function jellyShell(ctx: CanvasRenderingContext2D, turn: number, model: JellyModel) {
  const bulge = Math.sin(turn) * 3.6;
  const [top, upper, middle, base, bottom] = model.gel;
  const body = wash(ctx, -68, 1, [[0, top], [.24, upper], [.59, middle], [.83, base], [1, bottom]]);
  shape(ctx, body, 3, p => model.trace(p, bulge));

  ctx.save();
  ctx.clip();
  shape(ctx, model.shade, 0, p => {
    p.moveTo(-44, -15); p.quadraticCurveTo(-34, -18, -19, -12);
    p.bezierCurveTo(4, -4, 31, -12, 47, -26);
    p.lineTo(60, 4); p.lineTo(-57, 4);
  });
  jellyBubbles(ctx, turn, model);
  ctx.translate(0, model.bubbleCenter + 35);
  shape(ctx, model.glaze, 0, p => {
    p.moveTo(-39, -40);
    p.bezierCurveTo(-35, -53, -19, -61, -3, -61);
    p.quadraticCurveTo(1, -60, 4, -57); p.quadraticCurveTo(-17, -57, -27, -44);
    p.quadraticCurveTo(-33, -36, -39, -40);
  });
  line(ctx, model.sparkle, 2.6, p => {
    p.moveTo(-25, -50); p.quadraticCurveTo(-18, -56, -10, -57);
    p.moveTo(-3, -58); p.quadraticCurveTo(1, -59, 4, -58);
  });
  ctx.restore();
}

function jellyRollPose(phase: number, bounceHeight: number) {
  const flight = Math.max(0, Math.min(1, (phase - .22) / .55));
  const bounce = 4 * flight * (1 - flight);
  const compress = ease(.05, .16, phase) * (1 - ease(.16, .22, phase));
  const land = ease(.77, .84, phase) * (1 - ease(.84, 1, phase));
  const squash = .085 * compress + .12 * land - .045 * bounce;
  return { x: Math.sin(phase * TAU) * 2.4, lift: bounceHeight * bounce, xScale: 1 + squash, yScale: 1 - squash, roll: phase * TAU };
}

function jellyAttackPose(elapsed: number, airHeight: number) {
  if (elapsed < BLOB_WINDUP_MS) {
    const compress = ease(0, BLOB_WINDUP_MS, elapsed);
    return { x: -6 * compress, lift: 0, xScale: 1 + .17 * compress, yScale: 1 - .26 * compress, roll: 0 };
  }
  if (elapsed < BLOB_IMPACT_MS) {
    const progress = (elapsed - BLOB_WINDUP_MS) / BLOB_FLIGHT_MS;
    const launch = ease(0, .22, progress);
    const fall = ease(.76, 1, progress);
    const arc = Math.sin(Math.PI * progress);
    return {
      x: -6 + progress * 24,
      lift: airHeight * arc,
      xScale: 1 + .17 * (1 - launch) - .15 * arc + .24 * fall,
      yScale: 1 - .26 * (1 - launch) + .0475 * arc - .29 * fall,
      roll: 1.8 * progress,
    };
  }
  const remain = 1 - ease(BLOB_IMPACT_MS, BLOB_ATTACK_DURATION_MS - BLOB_ATTACK_FRAME_MS, elapsed);
  return { x: 18 * remain, lift: 0, xScale: 1 + .24 * remain, yScale: 1 - .29 * remain, roll: 1.8 * remain };
}

function paintJelly(
  ctx: CanvasRenderingContext2D,
  pose: ReturnType<typeof jellyRollPose>,
  model: JellyModel,
  x: number,
) {
  ctx.save();
  ctx.translate(x, -pose.lift);
  ctx.scale(pose.xScale, pose.yScale);
  ctx.transform(1, 0, -.071, 1, 0, 0);
  ctx.lineJoin = ctx.lineCap = 'round';
  jellyShell(ctx, pose.roll, model);
  ctx.restore();
}

export const BLOB_VARIANTS = JELLY_MODELS.length;

export const rollingJellyOptions = JELLY_MODELS.map(model => ({
  name: model.name,
  description: model.description,
  draw(ctx: CanvasRenderingContext2D, motion: Motion, phase: number) {
    const pose = motion === 'move' ? jellyRollPose(phase, model.bounce)
      : jellyAttackPose(phase * (BLOB_ATTACK_DURATION_MS - BLOB_ATTACK_FRAME_MS), 27);
    paintJelly(ctx, pose, model, pose.x);
  },
}));

export function makeInfectedBlobFrame(frame: string, variant: number): HTMLCanvasElement {
  const model = JELLY_MODELS[variant];
  const canvas = document.createElement('canvas');
  canvas.width = BLOB_FRAME_WIDTH;
  canvas.height = BLOB_FRAME_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(BLOB_FRAME_WIDTH / 2, BLOB_FOOT_Y);
  ctx.scale(FRAME_SCALE, FRAME_SCALE);
  if (frame === 'hit') {
    paintJelly(ctx, { x: 0, lift: 0, xScale: 1.12, yScale: .86, roll: 0 }, model, 0);
  } else if (frame.startsWith('move')) {
    const pose = jellyRollPose(Number(frame.slice(4)) / BLOB_MOVE_FRAMES.length, model.bounce);
    paintJelly(ctx, pose, model, pose.x);
  } else {
    const pose = jellyAttackPose(Number(frame.slice(3)) * BLOB_ATTACK_FRAME_MS, BLOB_AIR_HEIGHT / FRAME_SCALE);
    // InfectedBlobSystem moves the enemy during the jump.
    paintJelly(ctx, pose, model, 0);
  }
  return canvas;
}
