import { meadowEnemyPose, type MeadowEnemyPose } from '../meadowEnemies/pose';
import { ink, line, oval, shape, wash } from './paint';

type Point = readonly [number, number];
type Action = 'charge';
const bark = '#604649';
const wood = '#b18a66';
const bone = '#e1c396';
const boneLight = '#f7dfaa';

export const FOREST_WENDIGO_ART = { scale: 1.15, feetY: 116 } as const;

function pyre(ctx: CanvasRenderingContext2D, phase: number, flare: number, lean: number) {
  const wave = Math.sin(phase * Math.PI * 4);
  const curl = Math.cos(phase * Math.PI * 4);
  const rise = flare * 20;
  const leftTip = -49 + wave * 3 - lean;
  const rightTip = 49 + curl * 3 - lean * .3;
  const leftHeight = -55 + curl * 3 - rise * .55;
  const rightHeight = -59 - wave * 3 - rise * .6;
  const rim = wash(ctx, -64, 0, [[0, '#377856'], [.45, '#317751'], [1, '#234f41']]);
  shape(ctx, rim, 2.7, p => {
    p.moveTo(-27, -5);
    p.bezierCurveTo(-50, -14, leftTip + 5, leftHeight + 23, leftTip, leftHeight);
    p.bezierCurveTo(leftTip + 15, leftHeight + 3, -31, -29, -22, -27);
    p.bezierCurveTo(-30, -40, -12, -45, -22 - curl * 5 - lean, -61 - rise);
    p.bezierCurveTo(-6, -57 - rise, -5, -37, -4, -40);
    p.bezierCurveTo(2, -48, 12, -51, 6 + wave * 4 - lean, -65 - rise * .82);
    p.bezierCurveTo(21, -62, 18, -41, 21, -34);
    p.bezierCurveTo(29, -36, rightTip - 16, rightHeight + 10, rightTip, rightHeight);
    p.bezierCurveTo(rightTip - 6, rightHeight + 15, rightTip + 7, -31, 37, -22);
    p.bezierCurveTo(43, -17, 34, -10, 28, -6);
    p.bezierCurveTo(13, 3, -16, 4, -27, -5);
  });
  const glow = wash(ctx, -41, 1, [[0, '#8cca65'], [.53, '#6dcc70'], [1, '#3aa368']]);
  shape(ctx, glow, 0, p => {
    p.moveTo(-26, -7);
    p.bezierCurveTo(-44, -15, leftTip + 10, leftHeight + 22, leftTip + 5, leftHeight + 8);
    p.bezierCurveTo(leftTip + 13, leftHeight + 11, -25, -20, -15, -19);
    p.bezierCurveTo(-13, -24, -20, -29, -14 - curl * 4, -38 - rise * .72);
    p.bezierCurveTo(-5, -35, -10, -23, -2, -24);
    p.bezierCurveTo(4, -28, 1, -37, 12 + wave * 2, -44 - rise * .44);
    p.bezierCurveTo(9, -32, 21, -20, 19, -18);
    p.bezierCurveTo(30, -22, rightTip - 15, rightHeight + 17, rightTip - 5, rightHeight + 9);
    p.bezierCurveTo(rightTip - 7, rightHeight + 20, 44, -17, 24, -8);
    p.bezierCurveTo(12, -2, -12, 1, -26, -7);
  });
  shape(ctx, '#c7ef83', 0, p => {
    p.moveTo(-18, -7);
    p.bezierCurveTo(-24, -11, -19, -14, -20 + curl * 2, -18);
    p.quadraticCurveTo(-14, -17, -13, -11);
    p.bezierCurveTo(-8, -8, -8, -20, 0, -23 - rise * .25);
    p.bezierCurveTo(-2, -16, 6, -17, 7, -12);
    p.quadraticCurveTo(10, -9, 16, -15);
    p.bezierCurveTo(16, -7, 6, -5, 3, -4);
    p.quadraticCurveTo(-8, -3, -18, -7);
  });
  oval(ctx, -35 - lean * .4, -31 - wave * 3 - rise, 1.7, 3, '#90d477', -.4);
  oval(ctx, 26 - lean * .4, -46 - curl * 5 - rise * .6, 1.25, 2.4, '#a9df7d', .38);
  oval(ctx, -11, -65 - wave * 3 - rise * .8, 1.2, 2.7, '#89c775', .23);
}

function trunk(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  const shell = wash(ctx, -32, 28, [[0, '#ac8765'], [.36, '#795d56'], [1, '#493a42']]);
  shape(ctx, shell, 3.2, p => {
    p.moveTo(-31, -15);
    p.quadraticCurveTo(-37, -22, -37, -29);
    p.lineTo(-29, -24);
    p.quadraticCurveTo(-27, -30, -21, -31);
    p.lineTo(-15, -29);
    p.quadraticCurveTo(-4, -34, 6, -28);
    p.lineTo(15, -31);
    p.lineTo(19, -28);
    p.quadraticCurveTo(27, -32, 29, -37);
    p.quadraticCurveTo(32, -28, 28, -22);
    p.quadraticCurveTo(34, -24, 36, -26);
    p.bezierCurveTo(34, -17, 30, -12, 26, -10);
    p.bezierCurveTo(22, 1, 19, 5, 14, 7);
    p.quadraticCurveTo(9, 13, 14, 22);
    p.quadraticCurveTo(19, 29, 21, 34);
    p.quadraticCurveTo(10, 33, 5, 27);
    p.lineTo(5, 36);
    p.quadraticCurveTo(-2, 35, -6, 28);
    p.quadraticCurveTo(-14, 36, -26, 35);
    p.bezierCurveTo(-21, 30, -14, 23, -14, 13);
    p.quadraticCurveTo(-13, 7, -17, 5);
    p.bezierCurveTo(-26, 2, -31, -7, -31, -15);
  });

  shape(ctx, '#35323a', 0, p => {
    p.moveTo(-16, -19);
    p.bezierCurveTo(-10, -23, 6, -21, 14, -15);
    p.bezierCurveTo(21, -9, 14, 3, 5, 7);
    p.bezierCurveTo(-2, 9, -9, 5, -14, 0);
    p.bezierCurveTo(-19, -5, -21, -13, -16, -19);
  });
  const heart = wash(ctx, -16, 7, [[0, '#d5f590'], [.48, '#8ed978'], [1, '#3da368']]);
  shape(ctx, heart, 0, p => {
    p.moveTo(-5, 4);
    p.bezierCurveTo(-12, -1, -9, -9, -12, -14);
    p.quadraticCurveTo(-5, -12, -2, -7);
    p.quadraticCurveTo(4, -12, 1, -20);
    p.bezierCurveTo(12, -15, 11, -3, 5, 3);
    p.quadraticCurveTo(2, 6, -5, 4);
  });
  oval(ctx, 2, -5, 3, 6, '#effbb4', .45);

  for (const [dy, span, width] of [[-14, 1, 4.2], [-6, .85, 3.6], [1, .69, 3]]) {
    const ribs = (p: CanvasRenderingContext2D) => {
      p.moveTo(-21 * span, dy - 4);
      p.bezierCurveTo(-17 * span, dy + 1, -13 * span, dy + 5, -5, dy + 4);
      p.moveTo(22 * span, dy - 5);
      p.bezierCurveTo(20 * span, dy, 14 * span, dy + 5, 7, dy + 5);
    };
    line(ctx, ink, width + 2, ribs);
    line(ctx, dy === -14 ? bone : wood, width, ribs);
  }
  line(ctx, '#c9a274', 1.4, p => {
    p.moveTo(-32, -21); p.quadraticCurveTo(-25, -14, -24, -8);
    p.moveTo(16, -24); p.quadraticCurveTo(22, -23, 26, -27);
    p.moveTo(23, -14); p.quadraticCurveTo(24, -17, 29, -19);
    p.moveTo(-7, 12); p.quadraticCurveTo(-6, 20, -11, 27);
    p.moveTo(3, 13); p.quadraticCurveTo(0, 23, 3, 29);
  });
  line(ctx, '#7dbe68', 1.65, p => {
    p.moveTo(-18, 27); p.quadraticCurveTo(-11, 23, -10, 16);
    p.moveTo(9, 17); p.quadraticCurveTo(9, 24, 15, 29);
  });
  ctx.restore();
}

function branchSegment(ctx: CanvasRenderingContext2D, from: Point, to: Point, shoulder: number, wrist: number, color: string, grain: string, spur: number) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  ctx.save();
  ctx.translate(...from);
  ctx.rotate(Math.atan2(dy, dx));
  shape(ctx, wash(ctx, -shoulder, shoulder, [[0, grain], [.38, color], [1, '#42333d']]), 2.75, p => {
    p.moveTo(-3, -shoulder * .68);
    p.quadraticCurveTo(1, -shoulder, 6, -shoulder);
    p.quadraticCurveTo(length * .44, -shoulder * .88, length * .61, -wrist * .86);
    p.lineTo(length * .83, -wrist - spur);
    p.lineTo(length * .83 - 1, -wrist);
    p.quadraticCurveTo(length + 4, -wrist, length + 2, wrist * .7);
    p.quadraticCurveTo(length * .85, wrist * 1.16, length * .74, wrist * .83);
    p.quadraticCurveTo(length * .4, shoulder * .78, 3, shoulder * .86);
    p.quadraticCurveTo(-5, shoulder * .6, -3, -shoulder * .68);
  });
  line(ctx, grain, 1.55, p => {
    p.moveTo(3, -shoulder * .53);
    p.quadraticCurveTo(length * .45, -shoulder * .33, length * .66, -wrist * .48);
    p.moveTo(length * .77, wrist * .13);
    p.lineTo(length - 1, -wrist * .26);
  });
  line(ctx, '#493842', 1.5, p => {
    p.moveTo(length * .24, shoulder * .36);
    p.lineTo(length * .42, shoulder * .3);
    p.lineTo(length * .48, shoulder * .12);
    p.lineTo(length * .67, wrist * .2);
  });
  ctx.restore();
}

function claw(ctx: CanvasRenderingContext2D, wrist: Point, angle: number, far: boolean, splay: number) {
  ctx.save();
  ctx.translate(...wrist);
  ctx.rotate(angle);
  const fingers: readonly Point[] = [[3, -5.1], [7, -.5], [4.2, 4.4]];
  for (const [index, [x, y]] of fingers.entries()) {
    const spread = (index - 1) * (3 + splay * 3);
    const reach = (index === 1 ? 13 : 11) + splay * 2;
    shape(ctx, far ? '#a18672' : bone, 1.85, p => {
      p.moveTo(x, y - 2.5);
      p.bezierCurveTo(x + 5, y - 3 + spread * .5, x + 8, y - 2 + spread, x + reach, y + 3.2 + spread);
      p.quadraticCurveTo(x + reach - 3, y + 2.6 + spread, x + 8, y + 1 + spread * .7);
      p.lineTo(x + 2, y + 2.35);
      p.quadraticCurveTo(x - 2, y + .8, x, y - 2.5);
    });
  }
  shape(ctx, far ? '#65505a' : '#916b57', 2.4, p => {
    p.moveTo(-4, -5.7);
    p.quadraticCurveTo(0, -7, 4, -6);
    p.quadraticCurveTo(9, -4, 9, -.3);
    p.quadraticCurveTo(9, 4, 4, 5.8);
    p.quadraticCurveTo(1, 7.5, -4, 4.8);
    p.quadraticCurveTo(-7, 1, -4, -5.7);
  });
  shape(ctx, far ? '#a98a6d' : boneLight, 1.55, p => {
    p.moveTo(-.4, 3.8);
    p.quadraticCurveTo(0, 8, 6, 9 + splay * 3);
    p.quadraticCurveTo(9, 9 + splay * 4, 12, 6 + splay * 3);
    p.quadraticCurveTo(7, 7.1 + splay * 2, 5, 3.4);
    p.quadraticCurveTo(2.4, 1.2, -.4, 3.8);
  });
  line(ctx, far ? '#957760' : '#cfab7b', 1.4, p => {
    p.moveTo(-2, -3.6); p.quadraticCurveTo(2, -4.7, 4.5, -2.8);
  });
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, shoulder: Point, elbow: Point, wrist: Point, angle: number, far: boolean, splay: number) {
  const color = far ? '#68535a' : '#90705e';
  const grain = far ? '#95765f' : '#c49b74';
  branchSegment(ctx, shoulder, elbow, far ? 7 : 9.5, 5.4, color, grain, 5);
  branchSegment(ctx, elbow, wrist, far ? 5.5 : 6.8, 3.6, far ? bark : '#7d5c54', grain, 4);
  claw(ctx, wrist, angle, far, splay);
}

function antler(ctx: CanvasRenderingContext2D, far: boolean) {
  ctx.save();
  if (far) {
    ctx.translate(14, 0);
    ctx.scale(-.77, .91);
  }
  const branches = (p: CanvasRenderingContext2D) => {
    p.moveTo(-5, -7);
    p.bezierCurveTo(-8, -15, -23, -15, -29, -24);
    p.quadraticCurveTo(-32, -28, -31, -35);
    p.moveTo(-27, -22);
    p.quadraticCurveTo(-36, -19, -42, -26);
    p.moveTo(-20, -17);
    p.quadraticCurveTo(-19, -22, -23, -30);
    p.moveTo(-11, -12);
    p.quadraticCurveTo(-9, -17, -9, -23);
  };
  line(ctx, ink, far ? 6.6 : 7.4, branches);
  line(ctx, far ? '#a7836e' : bone, far ? 3.7 : 4.5, branches);
  line(ctx, far ? '#c9a982' : boneLight, 1.35, p => {
    p.moveTo(-8, -11); p.quadraticCurveTo(-20, -15, -27, -23);
    p.moveTo(-28, -25); p.quadraticCurveTo(-30, -29, -30, -33);
    p.moveTo(-33, -22); p.quadraticCurveTo(-37, -22, -40, -25);
    p.moveTo(-20, -22); p.lineTo(-22, -28);
    p.moveTo(-10, -18); p.lineTo(-9.5, -21);
  });
  ctx.restore();
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, energy: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  antler(ctx, true);
  antler(ctx, false);

  const teeth = wash(ctx, 6, 20, [[0, '#a48575'], [1, '#ddba90']]);
  shape(ctx, teeth, 2.5, p => {
    p.moveTo(1, 5);
    p.quadraticCurveTo(9, 11, 16, 10);
    p.lineTo(21, 12);
    p.quadraticCurveTo(23, 17, 17, 19 + energy * 2);
    p.quadraticCurveTo(11, 20, 4, 16);
    p.quadraticCurveTo(0, 13, 1, 5);
  });
  const crown = wash(ctx, -17, 17, [[0, '#f4dcb1'], [.4, '#e2c49b'], [.77, '#bd987e'], [1, '#a57e6d']]);
  shape(ctx, crown, 2.85, p => {
    p.moveTo(-16, -9);
    p.bezierCurveTo(-13, -17, -3, -18, 6, -16);
    p.quadraticCurveTo(13, -16, 17, -10);
    p.quadraticCurveTo(20, -8, 19, -4);
    p.bezierCurveTo(21, -1, 26, 3, 26, 9);
    p.quadraticCurveTo(25, 14, 21, 15);
    p.lineTo(17, 13);
    p.lineTo(14, 14.4);
    p.lineTo(11, 11);
    p.quadraticCurveTo(4, 14, 1, 9);
    p.lineTo(-2, 7);
    p.quadraticCurveTo(-9, 11, -12, 5);
    p.quadraticCurveTo(-19, 0, -16, -9);
  });
  shape(ctx, '#f8e0b2', 0, p => {
    p.moveTo(-14, -9);
    p.quadraticCurveTo(-4, -18, 7, -14);
    p.quadraticCurveTo(14, -14, 17, -9);
    p.quadraticCurveTo(9, -11, 5, -8);
    p.quadraticCurveTo(-1, -12, -7, -8);
    p.quadraticCurveTo(-10, -6, -13, -5);
  });
  shape(ctx, '#57404b', 0, p => {
    p.moveTo(4, -5);
    p.quadraticCurveTo(10, -3, 14, -6);
    p.quadraticCurveTo(17, -5, 18, -2);
    p.quadraticCurveTo(14, 6, 8, 4);
    p.quadraticCurveTo(3, 3, 4, -5);
  });
  shape(ctx, '#44383f', 0, p => {
    p.moveTo(-13, -6);
    p.quadraticCurveTo(-6, -8, 1, -3);
    p.quadraticCurveTo(3, 4, -4, 5);
    p.bezierCurveTo(-11, 5, -14, 0, -13, -6);
  });
  const eye = energy > .5 ? '#ebffae' : '#a9ec75';
  shape(ctx, eye, 0, p => {
    p.moveTo(-9, -3);
    p.quadraticCurveTo(-3, -2, -.7, .7);
    p.quadraticCurveTo(-5, 3, -8.2, .8);
  });
  shape(ctx, eye, 0, p => {
    p.moveTo(8, -.7);
    p.quadraticCurveTo(12, -1, 14.9, -3.2);
    p.quadraticCurveTo(14.1, 2.3, 10, 2.2);
    p.quadraticCurveTo(8.3, 2, 8, -.7);
  });
  shape(ctx, '#694c55', 0, p => {
    p.moveTo(19, 4.8); p.quadraticCurveTo(23, 4.5, 24, 8.1);
    p.quadraticCurveTo(23, 11.2, 20, 10);
    p.quadraticCurveTo(17, 8.2, 19, 4.8);
  });
  line(ctx, '#997362', 1.35, p => {
    p.moveTo(-4, -13.8); p.lineTo(-3, -10.6); p.lineTo(1, -10); p.lineTo(2.1, -6.3);
    p.moveTo(5, 7.2); p.quadraticCurveTo(8, 8.6, 11, 7.7);
    p.moveTo(12.5, 11.3); p.lineTo(13.6, 9.6);
  });
  ctx.restore();
}

export function drawForestWendigo(ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose, action?: Action) {
  const { anticipation, lunge, strike, recovery, phase, mode } = pose;
  const charging = action === 'charge';
  const step = mode === 'move' ? Math.sin(phase * Math.PI * 2) : 0;
  const sway = charging ? 0 : step;
  const raised = charging ? Math.max(anticipation, lunge * .5) : anticipation;
  const hit = charging ? 0 : strike;
  const rush = charging ? lunge : 0;
  const x = sway * 2 - raised * 3 + hit * 8 + rush * 13;
  const y = -47 - Math.abs(sway) * 2 - raised * 3 + hit * 8 + recovery * 2;
  const lean = sway * .035 - raised * .16 + hit * .24 + rush * .29;
  const energy = Math.max(raised, hit, rush);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.translate(rush * 9, -rush * 2);
  pyre(ctx, phase, charging ? energy : energy * .25, rush * 9);

  const farElbow: Point = [x + 26 + sway * 5 + raised * 4, y + 4 - raised * 19];
  const farWrist: Point = [x + 33 + sway * 6 + hit * 15 + rush * 4, y + 22 - raised * (charging ? 56 : 41) + hit * 4];
  arm(ctx, [x + 16, y - 18], farElbow, farWrist, .95 - raised * 2.15 - hit * .38, true, energy);
  trunk(ctx, x, y, lean);

  const nearElbow: Point = [x - 32 - sway * 4 + hit * 19 - raised * 5, y + 2 - raised * 22];
  const nearWrist: Point = [x - 24 - sway * 6 + hit * 49 - raised * 16 + rush * 7, y + 27 - raised * (charging ? 59 : 48)];
  arm(ctx, [x - 23, y - 17], nearElbow, nearWrist, 1.36 - raised * 3.28 - hit * .52, false, energy);
  skull(ctx, x + 7 + hit * 5, y - 27 + hit * 6, lean * .65 + hit * .15, energy);
  ctx.restore();
}

const LOOP_PHASES = [0, .125, .25, .375, .5, .625, .75, .875];
const SLAM_PHASES = [.12, .26, .35, .42, .49, .57];
const WINDUP_STRENGTHS = [.52, .88, 1, 1, 1, 1];

const WENDIGO_CLIPS = [
  { key: 'idle', prefix: 'idle', fps: 12, repeat: -1, frames: LOOP_PHASES },
  { key: 'move', prefix: 'move', fps: 16, repeat: -1, frames: LOOP_PHASES },
  { key: 'atk', prefix: 'atk', fps: 10, repeat: 0, frames: SLAM_PHASES },
  { key: 'chargewind', prefix: 'chargeWind', fps: 8, repeat: 0, frames: WINDUP_STRENGTHS, order: [0, 1, 2, 3, 4, 5, 2, 3, 4, 5] },
  { key: 'dash', prefix: 'dash', fps: 16, repeat: -1, frames: [0, .125, .25, .375] },
  { key: 'hit', prefix: 'hit', fps: 10, repeat: 0, frames: [0] },
  { key: 'birth', prefix: 'birth', fps: 4, repeat: 0, frames: [0, .12, .27, .43, .58] },
  { key: 'die', prefix: 'die', fps: 6, repeat: 0, frames: [0, 1, 2, 3, 4] },
] as const;

export const forestWendigoClips = WENDIGO_CLIPS.map(clip => {
  const frameKeys = clip.frames.map((_, index) => `fboss_${clip.prefix}${clip.key === 'hit' ? '' : index}`);
  return {
    key: `fboss-${clip.key}`,
    fps: clip.fps,
    repeat: clip.repeat,
    animationFrames: 'order' in clip ? clip.order.map(index => frameKeys[index]) : frameKeys,
    textures: clip.frames.map((phase, index) => ({ key: frameKeys[index], draw: () => createWendigoFrame(clip.key, phase, index) })),
  };
});

function createWendigoFrame(clip: typeof WENDIGO_CLIPS[number]['key'], phase: number, index: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, FOREST_WENDIGO_ART.feetY);
  ctx.scale(.85, .85);

  const idle = meadowEnemyPose('attack', 0);
  switch (clip) {
    case 'atk': {
      const pose = meadowEnemyPose('attack', phase);
      ctx.translate(-pose.strike * 4, 0);
      drawForestWendigo(ctx, pose);
      break;
    }
    case 'chargewind':
      drawForestWendigo(ctx, { ...idle, phase: index / 8, anticipation: phase }, 'charge');
      break;
    case 'dash':
      // The physics body already travels across the map during this clip.
      ctx.translate(-9, 0);
      drawForestWendigo(ctx, { ...idle, phase, lunge: .96 }, 'charge');
      break;
    case 'hit':
      drawForestWendigo(ctx, idle);
      ctx.resetTransform();
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
    case 'birth':
      drawForestWendigo(ctx, { ...idle, phase, anticipation: Math.sin(index * Math.PI / 4) * .45 }, 'charge');
      break;
    case 'die':
      ctx.globalAlpha = 1 - index * .21;
      ctx.scale(1 + index * .03, 1 - index * .15);
      drawForestWendigo(ctx, meadowEnemyPose('attack', .78));
      break;
    case 'move':
      drawForestWendigo(ctx, meadowEnemyPose('move', phase));
      break;
    case 'idle':
      drawForestWendigo(ctx, { ...idle, phase });
      break;
  }
  return canvas;
}
