import type { RangerPose } from './pose';

type Trace = (ctx: CanvasRenderingContext2D) => void;
type Point = { x: number; y: number };

const colors = {
  ink: '#2b2330',
  greenShadow: '#243b32',
  green: '#4d7149',
  greenLight: '#86a75e',
  skin: '#e3a371',
  skinShade: '#ae6659',
  leather: '#ad7046',
  leatherShade: '#694344',
  brass: '#e1a96a',
  wood: '#9b5039',
  honey: '#d48751',
  grain: '#f1b777',
  string: '#f3d3a2',
  steel: '#b9c8bd',
  fletching: '#a85152',
};

export const RANGER_AIM_HEIGHT = 41;

const ARROW_LENGTH = 38;
const WEAPON_SCALE = 1.15;

function stroke(ctx: CanvasRenderingContext2D, color: string, width: number, trace: Trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function paint(ctx: CanvasRenderingContext2D, color: string, outline: number, trace: Trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = outline;
    ctx.stroke();
  }
}

function mix(start: Point, end: Point, t: number): Point {
  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
}

function blendAt(start: Point, control: Point, end: Point, t: number): Point {
  return mix(mix(start, control, t), mix(control, end, t), t);
}

function add(point: Point, dx: number, dy: number): Point {
  return { x: point.x + dx, y: point.y + dy };
}

function bowPose({ angle, bob, draw, recoil }: RangerPose) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const towardNorth = Math.max(0, -sin);
  const pivotY = -RANGER_AIM_HEIGHT + bob;
  // The north-facing reach clears the hood while keeping the arrow on the aiming axis.
  const grip = 25 + 10 * towardNorth ** 2 + draw * 2 - recoil * 4;
  const end = grip - 9 - draw * 3;
  const nock = grip - 12 - draw * 16;
  const span = 23 - draw * 1.7 + recoil;
  return {
    cos, sin, pivotY, grip, end, nock, span,
    screen(forward: number, sideways = 0): Point {
      return {
        x: cos * forward - sin * sideways,
        y: pivotY + sin * forward + cos * sideways,
      };
    },
  };
}

export function getArrowOrigin(pose: RangerPose): Point {
  const bow = bowPose(pose);
  return bow.screen(bow.nock + ARROW_LENGTH * WEAPON_SCALE);
}

function drawSleeve(ctx: CanvasRenderingContext2D, start: Point, control: Point, end: Point, shadow: boolean) {
  const shaft: Trace = p => {
    p.moveTo(start.x, start.y);
    p.quadraticCurveTo(control.x, control.y, end.x, end.y);
  };
  stroke(ctx, colors.ink, 12, shaft);
  stroke(ctx, shadow ? colors.greenShadow : colors.green, 8.5, shaft);

  const edgeStart = mix(start, control, .12);
  const edgeEnd = blendAt(start, control, end, .86);
  stroke(ctx, shadow ? '#5c7e51' : colors.greenLight, 2.1, p => {
    p.moveTo(edgeStart.x, edgeStart.y - 2.5);
    p.quadraticCurveTo(control.x, control.y - 2.9, edgeEnd.x, edgeEnd.y - 1.8);
  });
}

function drawBracer(ctx: CanvasRenderingContext2D, start: Point, control: Point, end: Point, shadow: boolean) {
  const brace: Trace = p => {
    p.moveTo(start.x, start.y);
    p.quadraticCurveTo(control.x, control.y, end.x, end.y);
  };
  stroke(ctx, colors.ink, 8, brace);
  stroke(ctx, shadow ? colors.leatherShade : colors.leather, 5.2, brace);
  stroke(ctx, shadow ? '#af7a5a' : colors.brass, 1.35, p => {
    p.moveTo(start.x, start.y - 1.35);
    p.quadraticCurveTo(control.x, control.y - 1.75, end.x, end.y - 1.15);
  });
}

function drawArm(ctx: CanvasRenderingContext2D, shoulder: Point, elbow: Point, hand: Point, shadow: boolean) {
  const cuff = blendAt(shoulder, elbow, hand, .52);
  drawSleeve(ctx, shoulder, mix(shoulder, elbow, .52), cuff, shadow);
  drawBracer(ctx, cuff, mix(elbow, hand, .52), hand, shadow);
}

function drawFist(ctx: CanvasRenderingContext2D, at: Point, angle: number, shadow: boolean, pinch: boolean) {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(angle);
  paint(ctx, shadow ? colors.skinShade : colors.skin, 1.7, p => {
    p.moveTo(-4.1, -1.8);
    p.quadraticCurveTo(-3.1, -3.6, -.6, -3.5);
    p.quadraticCurveTo(1.2, -4.4, 3, -2.55);
    p.quadraticCurveTo(4.75, -.9, 3.8, 1.4);
    p.quadraticCurveTo(3.55, 3.45, .7, 3.45);
    p.quadraticCurveTo(-1.9, 4, -3.6, 1.8);
  });
  stroke(ctx, shadow ? '#f0af83' : '#ffd199', 1.2, p => {
    p.moveTo(-1.1, -2.1);
    p.quadraticCurveTo(.8, -2.7, 2.35, -1.5);
  });
  stroke(ctx, shadow ? '#834b4b' : colors.skinShade, 1.15, p => {
    p.moveTo(pinch ? 1.25 : .45, -.5);
    p.quadraticCurveTo(2.25, .05, pinch ? 1.85 : 1.25, 1.55);
  });
  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D) {
  const tip = ARROW_LENGTH;
  paint(ctx, colors.fletching, 1, p => {
    p.moveTo(1, -3);
    p.quadraticCurveTo(5, -3.4, 9, -.4);
    p.lineTo(7, 2);
    p.quadraticCurveTo(4, 1.9, .2, 2.7);
  });
  stroke(ctx, colors.ink, 3, p => {
    p.moveTo(.5, 0);
    p.lineTo(tip - 3, 0);
  });
  stroke(ctx, colors.string, 1.3, p => {
    p.moveTo(1, 0);
    p.lineTo(tip - 4, 0);
  });
  paint(ctx, colors.steel, 1.4, p => {
    p.moveTo(tip, 0);
    p.lineTo(tip - 7, -3.25);
    p.lineTo(tip - 5.9, 0);
    p.lineTo(tip - 7, 3.25);
  });
  stroke(ctx, '#eef0d2', 1, p => {
    p.moveTo(tip - 6.4, -2.1);
    p.lineTo(tip - 1, -.1);
  });
}

export function drawFlyingArrow(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(WEAPON_SCALE, WEAPON_SCALE);
  ctx.translate(-ARROW_LENGTH, 0);
  drawArrow(ctx);
  ctx.restore();
}

function drawRecurve(ctx: CanvasRenderingContext2D, { grip, end, nock, span }: ReturnType<typeof bowPose>) {
  const recurve: Trace = p => {
    p.moveTo(end, -span);
    p.bezierCurveTo(end - 6, -span + 5, grip - 2, -span + 6, grip + .7, -8);
    p.quadraticCurveTo(grip + 4, -1, grip + 2.4, 5);
    p.bezierCurveTo(grip + .5, 11, end - 6, span - 6, end, span);
  };
  const string: Trace = p => {
    p.moveTo(end - .8, -span + 1.3);
    p.lineTo(nock, 0);
    p.lineTo(end - .8, span - 1.3);
  };
  stroke(ctx, colors.ink, 3, string);
  stroke(ctx, colors.string, 1.15, string);
  stroke(ctx, colors.ink, 7.4, recurve);
  stroke(ctx, colors.wood, 4.8, recurve);
  stroke(ctx, colors.honey, 2.55, p => {
    p.moveTo(end + .45, -span + .3);
    p.bezierCurveTo(end - 4, -span + 5, grip, -span + 6, grip + 1.7, -8);
    p.quadraticCurveTo(grip + 4.3, -1, grip + 3, 5);
    p.bezierCurveTo(grip + 1.5, 11, end - 4.3, span - 6, end + .35, span - .3);
  });
  stroke(ctx, colors.grain, 1.3, p => {
    p.moveTo(end + 1.7, -span + 7);
    p.quadraticCurveTo(grip + .4, -14, grip + 1.4, -9);
    p.moveTo(grip + 2.2, 8.5);
    p.quadraticCurveTo(end + 2.9, 13.6, end + 1.4, span - 6.7);
  });
  stroke(ctx, colors.brass, 1.8, p => {
    p.moveTo(end - .4, -span + 2.7);
    p.lineTo(end + 2.1, -span + 2.1);
    p.moveTo(end - .6, span - 2.8);
    p.lineTo(end + 2, span - 1.9);
  });
  stroke(ctx, colors.ink, 6, p => {
    p.moveTo(grip + 2.5, -5);
    p.quadraticCurveTo(grip + 4, 0, grip + 2.4, 5);
  });
  stroke(ctx, colors.leatherShade, 3.2, p => {
    p.moveTo(grip + 2.5, -4.5);
    p.quadraticCurveTo(grip + 3.7, 0, grip + 2.4, 4.5);
  });
}

export function drawRangerBow(ctx: CanvasRenderingContext2D, pose: RangerPose) {
  const bow = bowPose(pose);
  const { cos, sin, pivotY, grip, nock, screen } = bow;
  const { angle, draw, recoil, loaded } = pose;
  const gripHand = screen(grip - .9, 1.65);
  const stringHand = loaded ? screen(nock + .7, 1.1) : screen(-5 - 8 * recoil, 3.2);
  const bowShoulder = { x: 10.7 * sin + 5.5 * cos, y: pivotY + 1.2 - 1.8 * cos };
  const drawShoulder = { x: -10.7 * sin - 5.5 * cos, y: pivotY + 1.2 + 1.8 * cos };
  const bowElbow = add(mix(bowShoulder, gripHand, .58), -sin * (4.3 - 1.5 * draw), cos * (4.3 - 1.5 * draw));
  const drawElbow = add(mix(drawShoulder, stringHand, .43),
    -cos * (9 + 5 * draw) + sin * 6.7, -sin * (9 + 5 * draw) - cos * 6.7);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawArm(ctx, drawShoulder, drawElbow, stringHand, true);
  drawArm(ctx, bowShoulder, bowElbow, gripHand, false);
  ctx.save();
  ctx.translate(0, pivotY);
  ctx.rotate(angle);
  ctx.save();
  ctx.scale(1, WEAPON_SCALE);
  drawRecurve(ctx, bow);
  ctx.restore();
  if (loaded) {
    ctx.translate(nock, 0);
    ctx.scale(WEAPON_SCALE, WEAPON_SCALE);
    drawArrow(ctx);
  }
  ctx.restore();
  drawFist(ctx, gripHand, angle, false, false);
  drawFist(ctx, stringHand, angle, true, true);
  ctx.restore();
}
