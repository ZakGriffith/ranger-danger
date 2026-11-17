import { line, oval, shape, wash } from '../forestEnemies/paint';
import { meadowEnemyPose, type MeadowEnemyPose } from '../meadowEnemies/pose';

type Point = readonly [x: number, y: number];
export type Leg = readonly [root: Point, knee: Point, foot: Point];
export type RunnerPalette = {
  dark: string;
  shade: string;
  middle: string;
  light: string;
  edge: string;
  eye: string;
  spark: string;
  fang: string;
  fangShade: string;
};

export type RunnerForm = {
  palette: RunnerPalette;
  legs: readonly Leg[];
  thickness: number;
  attackReach: number;
  attackPitch: number;
  back: (ctx: CanvasRenderingContext2D, flutter: number) => void;
  head: (ctx: CanvasRenderingContext2D, gape: number) => void;
};

export function colors(ctx: CanvasRenderingContext2D, pal: RunnerPalette, y: number, end: number) {
  return wash(ctx, y, end, [[0, pal.light], [.32, pal.middle], [.72, pal.shade], [1, pal.dark]]);
}

function vector(a: Point, b: Point): Point {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[1] - a[1]) / len, (a[0] - b[0]) / len];
}

function legPose(leg: Leg, near: boolean, index: number, pose: MeadowEnemyPose, bodyX: number, bodyY: number): Leg {
  const [root, knee, foot] = leg;
  const far = near ? 0 : 1;
  const phase = (pose.phase + .5 * ((index + far) % 2) + index * .035) % 1;
  const stance = .57;
  const airborne = phase < stance ? 0 : (phase - stance) / (1 - stance);
  const walking = pose.mode === 'move';
  const stride = walking ? (phase < stance ? 8 - phase * 16 / stance : -8 + airborne * 16) : 0;
  const lift = walking ? Math.sin(airborne * Math.PI) * 8 : (index >= 2 ? 11 * pose.anticipation + 4 * pose.recovery : 0);
  const reach = index >= 2 ? 17 * pose.lunge - 5.5 * pose.anticipation : -3.5 * pose.lunge;
  const farKnee = index < 2 ? -4 : 3;
  return [
    [root[0] + bodyX, root[1] + bodyY - far * 3],
    [knee[0] + bodyX * .55 + stride * .33 + reach * .45 + far * farKnee, knee[1] + bodyY * .39 - lift * .44 - far * 8],
    [foot[0] + stride + reach + far * (index < 2 ? -2 : 3), foot[1] - lift - far * 6],
  ];
}

function paintLeg(ctx: CanvasRenderingContext2D, [root, knee, foot]: Leg, pal: RunnerPalette, near: boolean, thickness: number) {
  const [rx, ry] = root;
  const [kx, ky] = knee;
  const [fx, fy] = foot;
  const [ux, uy] = vector(root, knee);
  const [vx, vy] = vector(knee, foot);
  const width = thickness * (near ? 3.7 : 2.8);
  const bend = width * .47;
  const fill = near ? colors(ctx, pal, Math.min(ry, ky) - width, fy + 1) : pal.shade;
  shape(ctx, fill, near ? 2.1 : 1.8, p => {
    p.moveTo(rx + ux * width, ry + uy * width);
    p.quadraticCurveTo((rx + kx) * .54 + ux * width, (ry + ky) * .5 + uy * width, kx + (ux + vx) * bend, ky + (uy + vy) * bend);
    p.quadraticCurveTo(kx + vx * width, ky + vy * width, kx + (fx - kx) * .43 + vx * width * .62, ky + (fy - ky) * .43 + vy * width * .62);
    p.quadraticCurveTo(fx + vx * .9, fy + vy * .9, fx + 1.05, fy - .05);
    p.quadraticCurveTo(fx - vx * 1.8, fy - vy * 1.8, kx + (fx - kx) * .45 - vx * width * .6, ky + (fy - ky) * .45 - vy * width * .6);
    p.quadraticCurveTo(kx - vx * width, ky - vy * width, kx - (ux + vx) * bend, ky - (uy + vy) * bend);
    p.quadraticCurveTo((rx + kx) * .5 - ux * width, (ry + ky) * .5 - uy * width, rx - ux * width, ry - uy * width);
  });
  line(ctx, near ? pal.edge : pal.middle, near ? 1.12 : .85, p => {
    p.moveTo(rx + (kx - rx) * .34, ry + (ky - ry) * .34 - 1.05);
    p.quadraticCurveTo((rx + kx) * .5, (ry + ky) * .5 - 1.3, kx, ky - 1.65);
    p.moveTo(kx + (fx - kx) * .22, ky + (fy - ky) * .22 - .62);
    p.lineTo(kx + (fx - kx) * .51, ky + (fy - ky) * .51 - .66);
  });
}

export function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pal: RunnerPalette, tilt = -.17) {
  oval(ctx, x, y, r + .94, r * .8 + .85, '#28212d', tilt);
  oval(ctx, x, y, r, r * .8, pal.eye, tilt);
  oval(ctx, x + r * .3, y + .15, r * .29, r * .54, pal.dark, tilt);
  oval(ctx, x - r * .29, y - r * .23, r * .34, r * .22, pal.spark, tilt);
}

export function fang(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number, length: number, pal: RunnerPalette, near: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  const tooth = near ? pal.fang : pal.fangShade;
  shape(ctx, wash(ctx, -3, 8, [[0, tooth], [1, pal.fangShade]]), 1.65, p => {
    p.moveTo(-2, -3.6);
    p.bezierCurveTo(length * .5, -5.2, length * .96, -2.5, length, 1.1);
    p.quadraticCurveTo(length * .92, 4.8, length * .6, 7.4);
    p.quadraticCurveTo(length * .76, 2.6, length * .48, 2.8);
    p.quadraticCurveTo(.4, 5.9, -2, 2.9);
  });
  line(ctx, near ? '#fbecd0' : pal.light, .92, p => {
    p.moveTo(1, -2); p.quadraticCurveTo(length * .59, -3, length * .8, .32);
  });
  ctx.restore();
}

export function drawRunner(ctx: CanvasRenderingContext2D, mode: MeadowEnemyPose['mode'], phase: number, form: RunnerForm) {
  const pose = meadowEnemyPose(mode, phase);
  const moving = mode === 'move';
  const flutter = moving ? Math.sin(phase * Math.PI * 4) : pose.anticipation - pose.strike * .6;
  const x = pose.lunge * form.attackReach - pose.anticipation * 6.8;
  const y = moving ? flutter * 1.22 : -pose.anticipation * 4.3 + pose.strike * 3.2;
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  for (const [index, leg] of form.legs.entries()) {
    paintLeg(ctx, legPose(leg, false, index, pose, x, y), form.palette, false, form.thickness);
  }
  ctx.save();
  ctx.translate(x * .83, y);
  ctx.rotate(moving ? flutter * .018 : -pose.anticipation * .12 + pose.lunge * .1);
  form.back(ctx, flutter);
  ctx.restore();
  for (const [index, leg] of form.legs.entries()) {
    paintLeg(ctx, legPose(leg, true, index, pose, x, y), form.palette, true, form.thickness);
  }
  ctx.save();
  ctx.translate(x, y - pose.strike * 2.4);
  ctx.rotate(moving ? flutter * .017 : -pose.anticipation * .17 + pose.lunge * form.attackPitch);
  form.head(ctx, pose.anticipation * .48 + pose.strike * .9);
  ctx.restore();
  ctx.restore();
}
