import type Phaser from 'phaser';
import { add } from '../canvas';
import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

export const GALECLAW_CANVAS_SIZE = 160;

const TAU = Math.PI * 2;
const ART_SCALE = .76;

type GriffinPose = {
  windup: number;
  dash: number;
  buffet: number;
  cycle: number;
  flap: number;
  x: number;
  y: number;
};

type PreviewAction = 'move' | 'attack';

function ease(phase: number, start: number, end: number) {
  const time = Math.min(1, Math.max(0, (phase - start) / (end - start)));
  return time * time * (3 - 2 * time);
}

function flightPose(phase: number): GriffinPose {
  const cycle = phase * TAU;
  return {
    windup: 0, dash: 0, buffet: 0,
    cycle, flap: Math.sin(cycle * 2),
    x: 0, y: -64 - Math.cos(cycle * 2) * 3.5,
  };
}

function previewPose(action: PreviewAction, phase: number): GriffinPose {
  const flight = flightPose(phase);
  if (action === 'move') return flight;
  const windup = ease(phase, .06, .36) - ease(phase, .37, .54);
  const dash = ease(phase, .38, .58) - ease(phase, .64, .96);
  return {
    ...flight,
    windup, dash,
    flap: flight.flap * (1 - dash * .94),
    x: -13 * windup + 16 * dash,
    y: flight.y - windup * 4 + dash * 3,
  };
}

function wing(ctx: CanvasRenderingContext2D, angle: number, distant: boolean) {
  ctx.save();
  ctx.translate(distant ? 13 : -3, distant ? -7 : -3);
  ctx.rotate(angle);
  ctx.scale(distant ? .76 : .94, distant ? .75 : .73);
  shape(ctx, wash(ctx, -40, 18, [
    [0, distant ? '#6b625f' : '#8e7e71'], [.54, distant ? '#534e52' : '#675953'],
    [1, distant ? '#383540' : '#4a4146'],
  ]), 3.1, p => {
    p.moveTo(9, 5); p.bezierCurveTo(5, -15, -16, -32, -33, -35);
    p.bezierCurveTo(-46, -36, -59, -38, -66, -48);
    p.bezierCurveTo(-70, -48, -70, -41, -64, -33);
    p.quadraticCurveTo(-60, -29, -56, -27);
    p.lineTo(-69, -34); p.bezierCurveTo(-74, -34, -71, -23, -58, -19);
    p.lineTo(-68, -20); p.bezierCurveTo(-73, -17, -66, -10, -52, -9);
    p.lineTo(-62, -7); p.quadraticCurveTo(-65, -2, -50, 0);
    p.lineTo(-55, 3); p.quadraticCurveTo(-55, 8, -42, 8);
    p.bezierCurveTo(-29, 18, -9, 18, 1, 13); p.quadraticCurveTo(8, 11, 9, 5);
  });
  shape(ctx, wash(ctx, -37, 12, [
    [0, distant ? '#8b7968' : '#ac9380'], [.53, distant ? '#6f6059' : '#8c7060'],
    [1, distant ? '#51464c' : '#604e50'],
  ]), 0, p => {
    p.moveTo(5, 5); p.bezierCurveTo(0, -15, -18, -28, -37, -31);
    p.quadraticCurveTo(-50, -33, -57, -37);
    p.quadraticCurveTo(-52, -30, -43, -25); p.lineTo(-51, -26);
    p.quadraticCurveTo(-46, -19, -36, -16); p.lineTo(-45, -16);
    p.quadraticCurveTo(-39, -9, -31, -7); p.lineTo(-38, -6);
    p.quadraticCurveTo(-29, 1, -19, 1); p.lineTo(-26, 5);
    p.quadraticCurveTo(-8, 15, 5, 5);
  });
  line(ctx, distant ? '#423b44' : '#53454a', 1.55, p => {
    p.moveTo(-29, -22); p.quadraticCurveTo(-48, -24, -61, -36);
    p.moveTo(-24, -14); p.quadraticCurveTo(-45, -16, -62, -25);
    p.moveTo(-23, -8); p.quadraticCurveTo(-40, -9, -60, -14);
    p.moveTo(-20, -2); p.quadraticCurveTo(-37, -1, -54, -3);
    p.moveTo(-16, 5); p.quadraticCurveTo(-25, 7, -41, 5);
  });
  if (!distant) line(ctx, '#c6a994', 1.5, p => {
    p.moveTo(-4, -9); p.quadraticCurveTo(-15, -21, -28, -24);
    p.moveTo(-40, -28); p.lineTo(-47, -30);
    p.moveTo(-18, -8); p.quadraticCurveTo(-22, -13, -32, -15);
    p.moveTo(-37, -9); p.lineTo(-42, -12);
  });
  ctx.restore();
}

function lionTail(ctx: CanvasRenderingContext2D, cycle: number, dash: number) {
  const tipX = -77 + 4 * Math.sin(cycle) - dash;
  const tipY = 2 + 7 * Math.sin(cycle + .5) - dash * 14;
  const trace = (path: CanvasRenderingContext2D) => {
    path.moveTo(-38, 2); path.bezierCurveTo(-58, 7, -66, 31 - 27 * dash, tipX, tipY);
  };
  line(ctx, ink, 6.9, trace);
  line(ctx, '#ae7952', 3.9, trace);
  ctx.save();
  ctx.translate(tipX + 1, tipY + 1);
  ctx.rotate(-.1 - .9 * dash + .22 * Math.sin(cycle));
  shape(ctx, wash(ctx, -15, 10, [[0, '#847064'], [.5, '#635049'], [1, '#42383e']]), 2.4, p => {
    p.moveTo(6, 3); p.quadraticCurveTo(3, -6, -5, -8);
    p.lineTo(-12, -12); p.quadraticCurveTo(-13, -6, -10, -4);
    p.lineTo(-15, -7); p.quadraticCurveTo(-14, 1, -8, 4);
    p.quadraticCurveTo(0, 11, 6, 3);
  });
  line(ctx, '#b38e76', 1.3, p => {
    p.moveTo(-9, -5); p.quadraticCurveTo(-6, -3, -4, -2);
  });
  ctx.restore();
}

function lionLeg(ctx: CanvasRenderingContext2D, distant: boolean, dash: number, flap: number) {
  ctx.save();
  ctx.translate(distant ? -30 : -40, distant ? 4 : 7);
  ctx.rotate(dash * .28 + flap * .075 - (distant ? .1 : 0));
  shape(ctx, wash(ctx, -8, 27, [
    [0, distant ? '#a37454' : '#d8a06b'], [.53, distant ? '#875941' : '#b47a51'],
    [1, distant ? '#684d49' : '#8b5f47'],
  ]), 2.9, p => {
    p.moveTo(-13, -4); p.quadraticCurveTo(-7, -12, 5, -7);
    p.bezierCurveTo(15, -2, 12, 9, 4, 14);
    p.quadraticCurveTo(0, 17, 1, 21); p.quadraticCurveTo(9, 23, 7, 28);
    p.quadraticCurveTo(4, 30, -2, 28); p.quadraticCurveTo(-9, 29, -10, 25);
    p.quadraticCurveTo(-12, 19, -7, 14); p.quadraticCurveTo(-14, 8, -13, -4);
  });
  if (!distant) line(ctx, '#e2ae78', 1.7, p => {
    p.moveTo(-9, -1); p.quadraticCurveTo(-9, 7, -4, 10);
    p.moveTo(-6, 17); p.lineTo(-7, 21);
  });
  line(ctx, '#583e3f', 1.45, p => {
    p.moveTo(2, 25); p.quadraticCurveTo(4, 26, 4, 28);
    p.moveTo(-2, 25); p.quadraticCurveTo(0, 26, 0, 28);
  });
  ctx.restore();
}

function talon(ctx: CanvasRenderingContext2D, distant: boolean, windup: number, dash: number, flap: number) {
  const handX = (distant ? 29 : 36) - 13 * windup + (distant ? 16 : 23) * dash;
  const handY = (distant ? 18 : 21) - 14 * dash + (distant ? 2.5 : -1.5) * flap;
  shape(ctx, wash(ctx, -6, handY + 6, [
    [0, distant ? '#aaa498' : '#fff0d1'], [.58, distant ? '#948678' : '#dcc4a4'],
    [1, distant ? '#725d56' : '#ac9077'],
  ]), 2.8, p => {
    p.moveTo(distant ? 16 : 9, 2);
    p.quadraticCurveTo(21, 4 - dash * 6, handX, handY - 5);
    p.lineTo(handX + 2, handY + 4);
    p.quadraticCurveTo(handX - 7, handY + 6, handX - 12, handY + 2);
    p.lineTo(handX - 11, handY + 5); p.lineTo(handX - 18, handY - 1);
    p.quadraticCurveTo(distant ? 13 : 10, 14, distant ? 16 : 9, 2);
  });
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(.64 - dash * .82 - windup * .25);
  ctx.scale(distant ? .8 : 1, distant ? .82 : 1);
  shape(ctx, wash(ctx, -8, 12, [
    [0, distant ? '#b3875a' : '#e0b57a'], [.65, distant ? '#8a654e' : '#ab7750'],
    [1, distant ? '#77514a' : '#835b42'],
  ]), 2.6, p => {
    p.moveTo(-6, -4); p.quadraticCurveTo(-1, -8, 4, -4);
    p.quadraticCurveTo(9, -6, 16 + dash * 4, -4);
    p.quadraticCurveTo(19 + dash * 4, -2, 17 + dash * 4, 2);
    p.lineTo(12 + dash * 2, 0); p.lineTo(9, 1);
    p.quadraticCurveTo(16 + dash * 4, 2, 16 + dash * 4, 5);
    p.lineTo(14 + dash * 4, 8); p.lineTo(9 + dash * 2, 4);
    p.lineTo(6, 4); p.quadraticCurveTo(12, 7, 10, 10);
    p.lineTo(7, 9); p.lineTo(3, 6);
    p.quadraticCurveTo(-4, 7, -7, 1);
  });
  shape(ctx, distant ? '#bbb2ac' : '#ead6b9', 1.85, p => {
    p.moveTo(15 + dash * 4, -4); p.quadraticCurveTo(22 + dash * 4, -2, 19 + dash * 4, 3);
    p.quadraticCurveTo(17 + dash * 4, 0, 15 + dash * 4, -1);
  });
  shape(ctx, distant ? '#aaa09e' : '#dfc7aa', 1.7, p => {
    p.moveTo(14 + dash * 4, 5); p.quadraticCurveTo(21 + dash * 4, 6, 17 + dash * 4, 11);
    p.quadraticCurveTo(16 + dash * 4, 8, 13 + dash * 4, 8);
  });
  if (!distant) line(ctx, '#f2c597', 1.45, p => {
    p.moveTo(-2, -3); p.quadraticCurveTo(1, -4, 3, -2);
    p.moveTo(6, -2); p.lineTo(10, -3);
  });
  ctx.restore();
}

function lionBody(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -21, 22, [[0, '#d5a270'], [.51, '#b97e50'], [1, '#84533e']]), 3.35, p => {
    p.moveTo(-49, 1);
    p.bezierCurveTo(-47, -16, -28, -19, -16, -16);
    p.bezierCurveTo(3, -10, 18, -21, 29, -13);
    p.bezierCurveTo(43, -6, 33, 18, 18, 19);
    p.bezierCurveTo(9, 22, -5, 16, -20, 13);
    p.bezierCurveTo(-31, 12, -49, 21, -49, 1);
  });
  shape(ctx, '#edb980', 0, p => {
    p.moveTo(-45, 0); p.quadraticCurveTo(-42, -11, -27, -12);
    p.quadraticCurveTo(-19, -12, -9, -6); p.lineTo(-20, -7);
    p.lineTo(-16, -3); p.quadraticCurveTo(-32, -11, -45, 0);
  });
  line(ctx, '#82533f', 1.8, p => {
    p.moveTo(-13, 11); p.quadraticCurveTo(-3, 10, 4, 13);
    p.moveTo(-40, 5); p.lineTo(-39, 8);
  });
}

function eagleHead(ctx: CanvasRenderingContext2D, windup: number, dash: number) {
  ctx.save();
  ctx.translate(29 - windup * 6 + dash * 4, -19 - windup * 3 + dash * 2);
  ctx.rotate(-.06 - .21 * windup + .17 * dash);
  shape(ctx, wash(ctx, -29, 36, [[0, '#fff2ce'], [.37, '#efe1c8'], [.66, '#c5ad98'], [1, '#967b6c']]), 3.45, p => {
    p.moveTo(25, -6); p.quadraticCurveTo(25, -21, 11, -27);
    p.quadraticCurveTo(0, -31, -9, -26); p.quadraticCurveTo(-19, -26, -26, -30);
    p.quadraticCurveTo(-25, -22, -16, -19); p.lineTo(-26, -18);
    p.quadraticCurveTo(-23, -13, -16, -12);
    p.quadraticCurveTo(-22, -7, -21, 0); p.lineTo(-28, 2);
    p.quadraticCurveTo(-24, 6, -21, 7); p.lineTo(-27, 11);
    p.quadraticCurveTo(-22, 18, -17, 18); p.lineTo(-20, 24);
    p.quadraticCurveTo(-14, 29, -8, 26); p.lineTo(-7, 32);
    p.quadraticCurveTo(1, 34, 6, 27); p.lineTo(6, 30);
    p.quadraticCurveTo(19, 22, 18, 11); p.quadraticCurveTo(24, 4, 25, -6);
  });
  shape(ctx, '#fff4da', 0, p => {
    p.moveTo(-20, -24); p.quadraticCurveTo(-11, -21, -4, -24);
    p.quadraticCurveTo(6, -29, 17, -18); p.lineTo(9, -20);
    p.quadraticCurveTo(1, -24, -7, -19); p.lineTo(-14, -16);
    p.lineTo(-9, -21); p.quadraticCurveTo(-17, -21, -20, -24);
  });
  shape(ctx, '#a58571', 0, p => {
    p.moveTo(18, -4); p.quadraticCurveTo(24, 2, 16, 12);
    p.quadraticCurveTo(12, 28, 4, 29); p.lineTo(6, 21);
    p.quadraticCurveTo(-4, 30, -7, 26); p.lineTo(-3, 17);
    p.quadraticCurveTo(-12, 24, -15, 20); p.lineTo(-7, 9);
    p.quadraticCurveTo(-1, 17, 5, 11); p.quadraticCurveTo(13, 10, 18, -4);
  });
  shape(ctx, wash(ctx, -10, 16, [[0, '#efd18e'], [.43, '#d69a54'], [1, '#946544']]), 2.9, p => {
    p.moveTo(18, -9); p.quadraticCurveTo(30, -10, 37, -1);
    p.quadraticCurveTo(42, 5, 37, 13); p.quadraticCurveTo(36, 15, 33, 15);
    p.quadraticCurveTo(36, 9, 30, 7); p.quadraticCurveTo(24, 12, 18, 7);
    p.quadraticCurveTo(16, 1, 18, -9);
  });
  line(ctx, '#754b42', 1.8, p => {
    p.moveTo(20, 5); p.quadraticCurveTo(28, 5, 32, 4);
  });
  oval(ctx, 27, -3.2, 2.4, 1.3, '#845945', .42);
  line(ctx, '#fae0a5', 1.55, p => {
    p.moveTo(22, -6); p.quadraticCurveTo(28, -7, 33, -3);
  });
  shape(ctx, '#f6ba5d', 2.15, p => {
    p.moveTo(1, -13); p.quadraticCurveTo(9, -15, 17, -10);
    p.quadraticCurveTo(16, -5, 10, -4); p.quadraticCurveTo(4, -4, 1, -13);
  });
  oval(ctx, 12, -9.2, 2.6, 3.15, ink, .1);
  oval(ctx, 12.6, -10.4, 1.05, 1.1, '#fff1be');
  line(ctx, '#7d6257', 2.15, p => {
    p.moveTo(-2, -16); p.quadraticCurveTo(6, -16, 17.5, -11.5);
    p.moveTo(-8, -11); p.quadraticCurveTo(-11, -7, -10, -5);
    p.moveTo(-16, -3); p.quadraticCurveTo(-16, 1, -18, 4);
  });
  line(ctx, '#f6e1c6', 1.55, p => {
    p.moveTo(-10, 5); p.lineTo(-14, 9);
    p.moveTo(-5, 7); p.quadraticCurveTo(-7, 11, -9, 12);
  });
  ctx.restore();
}

function drawGriffin(ctx: CanvasRenderingContext2D, pose: GriffinPose, showSpeedLines = false) {
  const { windup, dash, buffet, cycle, flap, x, y } = pose;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (showSpeedLines && dash > .05) {
    ctx.save();
    ctx.globalAlpha *= .65 * dash;
    line(ctx, '#f1edcc', 1.85, p => {
      p.moveTo(-94, y + 8); p.quadraticCurveTo(-67, y + 9, -41, y + 3);
      p.moveTo(-84, y - 9); p.quadraticCurveTo(-64, y - 8, -54, y - 11);
      p.moveTo(-72, y + 20); p.lineTo(-57, y + 17);
    });
    ctx.restore();
  }
  ctx.translate(x, y);
  ctx.rotate(-.095 * windup + .025 * dash - .09 * buffet);
  wing(ctx, .20 + flap * .21 + windup * .19 - dash * .44 + buffet * .5, true);
  lionTail(ctx, cycle, dash);
  lionLeg(ctx, true, dash, flap);
  talon(ctx, true, windup, dash, flap);
  lionBody(ctx);
  lionLeg(ctx, false, dash, -flap);
  wing(ctx, -.13 + flap * .38 + windup * .42 - dash * .4 + buffet * .59, false);
  talon(ctx, false, windup, dash, flap);
  eagleHead(ctx, windup, dash);
  ctx.restore();
}

export function drawGaleclawPreview(ctx: CanvasRenderingContext2D, action: PreviewAction, phase: number): void {
  drawGriffin(ctx, previewPose(action, phase), true);
}

export function galeclawPreviewShadowX(action: PreviewAction, phase: number): number {
  return previewPose(action, phase).x;
}

type GriffinClip = {
  key: string;
  frames: number;
  duration: number;
  repeat?: -1;
  pose: (phase: number) => GriffinPose;
};

const CLIPS: readonly GriffinClip[] = [
  { key: 'idle', frames: 12, duration: 1200, repeat: -1, pose: flightPose },
  { key: 'move', frames: 14, duration: 820, repeat: -1, pose: flightPose },
  {
    key: 'windup', frames: 18, duration: 1050,
    pose: phase => {
      const flight = flightPose(phase);
      const windup = ease(phase, .06, .87);
      return {
        ...flight, windup,
        flap: flight.flap * (1 - .76 * windup),
        x: -3 * windup, y: flight.y - 4 * windup,
      };
    },
  },
  {
    key: 'dash', frames: 12, duration: 780,
    pose: phase => {
      const flight = flightPose(phase);
      return {
        ...flight,
        dash: .76 + .24 * ease(phase, 0, .19),
        flap: flight.flap * .08,
        y: -61 + 3 * ease(phase, .22, .64),
      };
    },
  },
  {
    key: 'buffet-windup', frames: 13, duration: 750,
    pose: phase => {
      const flight = flightPose(phase);
      const spread = ease(phase, .04, .84);
      return {
        ...flight, windup: .32 * spread, buffet: spread,
        flap: flight.flap * (1 - .85 * spread),
        x: -3 * spread, y: flight.y - 5 * spread,
      };
    },
  },
  {
    key: 'buffet', frames: 6, duration: 250,
    pose: phase => {
      const flight = flightPose(phase);
      const thrust = 1 - ease(phase, .21, .82);
      return {
        ...flight, buffet: -thrust,
        flap: flight.flap * (1 - .86 * thrust),
        x: -4 * thrust, y: flight.y + 5 * thrust,
      };
    },
  },
  {
    key: 'recover', frames: 9, duration: 500,
    pose: phase => {
      const flight = flightPose(phase);
      const glide = 1 - ease(phase, .05, .8);
      return {
        ...flight, dash: .56 * glide,
        flap: flight.flap * (1 - .85 * glide),
        y: flight.y + 6 * glide,
      };
    },
  },
  { key: 'hit', frames: 1, duration: 100, pose: flightPose },
  {
    key: 'birth', frames: 10, duration: 1000,
    pose: phase => {
      const flight = flightPose(phase);
      return { ...flight, y: flight.y - 18 * (1 - ease(phase, 0, .85)) };
    },
  },
  {
    key: 'die', frames: 7, duration: 700,
    pose: phase => ({
      ...flightPose(phase), flap: -.4, dash: .18, y: -64 + phase * 27,
    }),
  },
];

function frameKey(clip: GriffinClip, index: number): string {
  return `rboss_${clip.key}${clip.key === 'hit' ? '' : index}`;
}

export function registerGaleclawTextures(scene: Phaser.Scene): void {
  const center = GALECLAW_CANVAS_SIZE / 2;
  for (const clip of CLIPS) {
    for (let index = 0; index < clip.frames; index++) {
      const phase = index / clip.frames;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = GALECLAW_CANVAS_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(center, center + 64 * ART_SCALE);
      ctx.scale(ART_SCALE, ART_SCALE);
      if (clip.key === 'die') ctx.globalAlpha = 1 - phase;
      drawGriffin(ctx, clip.pose(phase));
      if (clip.key === 'hit') {
        ctx.resetTransform();
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      add(scene, frameKey(clip, index), canvas);
    }
  }
}

export function registerGaleclawAnimations(scene: Phaser.Scene): void {
  for (const clip of CLIPS) {
    const key = `rboss-${clip.key}`;
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({
      key,
      frames: Array.from({ length: clip.frames }, (_, index) => ({ key: frameKey(clip, index) })),
      duration: clip.duration,
      repeat: clip.repeat ?? 0,
    });
  }
}
