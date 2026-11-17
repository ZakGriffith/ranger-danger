import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

type Point = readonly [number, number];
type GooGrip = { center: Point; width: number; height: number };
export type LanternMawThrowArm = { shoulder: Point; elbow: Point; tip: Point; goo?: GooGrip; snap?: boolean };
type ThrowPose = { x: number; y: number; wind: number; rush: number; arm?: LanternMawThrowArm };

export const LANTERN_MAW_THROW_FRAMES = [
  'throw0', 'throw1', 'throw2', 'throw3', 'throw4', 'throw5', 'throw6', 'throw7', 'throw8',
] as const;
export type LanternMawThrowFrame = typeof LANTERN_MAW_THROW_FRAMES[number];
export const LANTERN_MAW_THROW_FRAME_MS = 110;
export const LANTERN_MAW_THROW_RELEASE_INDEX = 5;
export const LANTERN_MAW_THROW_RELEASE_MS = LANTERN_MAW_THROW_RELEASE_INDEX * LANTERN_MAW_THROW_FRAME_MS;
export const LANTERN_MAW_THROW_TIP = [74, -53] as const;

export const LANTERN_MAW_THROW_POSES: Record<LanternMawThrowFrame, ThrowPose> = {
  throw0: { x: 1, y: 3.6, wind: .05, rush: 0, arm: {
    shoulder: [44, -4], elbow: [60, -2], tip: [65, -8], goo: { center: [59, -4], width: .71, height: .39 },
  } },
  throw1: { x: -2, y: 3.2, wind: .12, rush: 0, arm: {
    shoulder: [47, -6], elbow: [78, 1], tip: [72, -13], goo: { center: [66, -12], width: .9, height: .68 },
  } },
  throw2: { x: -5, y: .3, wind: .3, rush: 0, arm: {
    shoulder: [46, -3], elbow: [77, -2], tip: [73, -25], goo: { center: [68, -27], width: .99, height: .91 },
  } },
  throw3: { x: -8, y: -1.8, wind: .48, rush: 0, arm: {
    shoulder: [53, -9], elbow: [78, -15], tip: [73, -43], goo: { center: [67, -46], width: 1, height: 1 },
  } },
  throw4: { x: -10, y: -3.6, wind: .6, rush: 0, arm: {
    shoulder: [51, -7], elbow: [77, -30], tip: [72, -55], goo: { center: [66, -59], width: .96, height: 1.07 },
  } },
  throw5: { x: 1.2, y: -.9, wind: .08, rush: .34, arm: {
    shoulder: [57, -8], elbow: [71, -30], tip: LANTERN_MAW_THROW_TIP, snap: true,
  } },
  throw6: { x: 2.2, y: 1.8, wind: 0, rush: .24, arm: {
    shoulder: [61, -10], elbow: [78, -39], tip: [66, -30],
  } },
  throw7: { x: .7, y: 1.3, wind: 0, rush: .07, arm: {
    shoulder: [58, -8], elbow: [63, 3], tip: [49, -10],
  } },
  throw8: { x: 0, y: -.5, wind: 0, rush: 0 },
};

export const LANTERN_MAW_GOO_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function drawLanternMawGoo(ctx: CanvasRenderingContext2D, phase = 0) {
  const turn = phase * Math.PI * 2;
  const twist = Math.sin(turn);
  ctx.save();
  ctx.lineJoin = 'round';
  shape(ctx, wash(ctx, -9, 8, [[0, '#d5d889'], [.27, '#aebf65'], [.71, '#82944e'], [1, '#516443']]), 2.15, p => {
    p.moveTo(-9, -1);
    p.bezierCurveTo(-10, -5, -5 + twist, -10, -1, -8);
    p.bezierCurveTo(3, -8 - twist, 9, -5, 9, -1);
    p.bezierCurveTo(12, 2, 8, 7, 5, 7);
    p.bezierCurveTo(2, 10, -4, 9, -7, 6);
    p.quadraticCurveTo(-11, 4, -9, -1);
  });
  oval(ctx, -3 + twist * 1.15, -4.1 + Math.cos(turn) * .65, 3.45, 1.65, '#e7e7a5', -.35);
  oval(ctx, 4.5 + twist * 1.45, .2, 2.2, 1.75, '#6c8450', -.13);
  oval(ctx, 4.1 + twist * 1.45, -.25, .95, .6, '#c3ce79', -.28);
  oval(ctx, -2.2, 3.3 + twist, 1.65, 1.22, '#66824e', .16);
  ctx.restore();
}

export function makeLanternMawGooFrame(frame: typeof LANTERN_MAW_GOO_FRAMES[number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(16, 16);
  ctx.rotate(Math.sin(frame / LANTERN_MAW_GOO_FRAMES.length * Math.PI * 2) * .19);
  drawLanternMawGoo(ctx, frame / LANTERN_MAW_GOO_FRAMES.length);
  return canvas;
}

export function drawLanternMawThrowArm(ctx: CanvasRenderingContext2D, root: Point, arm: LanternMawThrowArm, phase: number) {
  const [shoulderX, shoulderY] = arm.shoulder;
  const [elbowX, elbowY] = arm.elbow;
  const [tipX, tipY] = arm.tip;
  const curve = (p: CanvasRenderingContext2D) => {
    p.moveTo(...root);
    p.bezierCurveTo(shoulderX, shoulderY, elbowX, elbowY, tipX, tipY);
  };
  line(ctx, ink, 15.4, curve);
  line(ctx, '#935f83', 11.3, curve);
  line(ctx, '#c28ca2', 2.3, p => {
    p.moveTo(root[0] - 1, root[1] - 2);
    p.bezierCurveTo(shoulderX - 2, shoulderY - 3, elbowX - 3, elbowY - 2, tipX - 2, tipY + 1);
  });
  if (arm.goo) {
    ctx.save();
    ctx.translate(...arm.goo.center);
    ctx.scale(arm.goo.width, arm.goo.height);
    drawLanternMawGoo(ctx, phase);
    ctx.restore();

    const cup = (p: CanvasRenderingContext2D) => {
      p.moveTo(tipX + 1.2, tipY + 1);
      p.quadraticCurveTo(tipX + 1.6, tipY + 8, tipX - 8, tipY + 7);
    };
    line(ctx, ink, 7.1, cup);
    line(ctx, '#a46d8d', 4.6, cup);
    oval(ctx, tipX - 4.3, tipY + 6, 1.55, .7, '#e1a7b3', -.16);
  }
  if (arm.snap) {
    oval(ctx, tipX + 4.4, tipY - 5.1, 1.6, 2.2, '#bac778', .46);
    oval(ctx, tipX + 2.1, tipY - 9.2, 1.25, 1.15, '#d3d991', -.28);
  }
}
