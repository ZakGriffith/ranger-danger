import { line, oval, shape, wash } from '../forestEnemies/paint';

export type HeavyMotion = 'move' | 'attack';
export type Point = readonly [number, number];

export interface HeavyPalette {
  light: string;
  upper: string;
  middle: string;
  deep: string;
  armor: string;
  shade: string;
  accent: string;
  glow: string;
  toe: string;
}

export interface HeavyArt {
  palette: HeavyPalette;
  height: number;
  headRise: number;
  stride: number;
  kneeBend: number;
  forearmWidth: number;
  upperArmWidth: number;
  handRestY: number;
  windupElbow: Point;
  windupHand: Point;
  torso(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number): void;
  head(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, strain: number): void;
  fist(ctx: CanvasRenderingContext2D, at: Point, angle: number, far: boolean): void;
  armDetail(ctx: CanvasRenderingContext2D, shoulder: Point, elbow: Point, hand: Point, turn: number): void;
}

const TAU = Math.PI * 2;

function ease(a: number, b: number, t: number) {
  const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
}

export function mix(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function foot(phase: number, center: number, y: number, stride: number): Point {
  const t = phase % 1;
  if (t < .64) return [center + stride * (1 - 2 * t / .64), y];
  const step = (t - .64) / .36;
  return [center - stride * Math.cos(Math.PI * step), y - 8.5 * Math.sin(Math.PI * step)];
}

export function polygon(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, width: number, points: readonly Point[]) {
  shape(ctx, fill, width, p => {
    for (const [i, [x, y]] of points.entries()) i ? p.lineTo(x, y) : p.moveTo(x, y);
  });
}

function limb(ctx: CanvasRenderingContext2D, start: Point, end: Point, wide: number, thin: number, c: HeavyPalette, dark: boolean) {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  ctx.save();
  ctx.translate(...start);
  ctx.rotate(Math.atan2(start[0] - end[0], end[1] - start[1]));
  const fill = dark ? c.deep : wash(ctx, -7, length + 4, [[0, c.light], [.32, c.upper], [.66, c.middle], [1, c.deep]]);
  shape(ctx, fill, dark ? 2.5 : 3, p => {
    p.moveTo(-wide, 0);
    p.bezierCurveTo(-wide - 1, -wide * .82, wide + 1, -wide * .89, wide, .8);
    p.quadraticCurveTo(wide + 1, length * .38, thin, length - 1);
    p.quadraticCurveTo(thin + 1, length + 7, .2, length + 7);
    p.quadraticCurveTo(-thin - 2, length + 7, -thin - 1, length);
    p.quadraticCurveTo(-wide - 3, length * .55, -wide, 0);
  });
  if (!dark) {
    shape(ctx, c.light, 0, p => {
      p.moveTo(-wide + 2.8, -.3); p.quadraticCurveTo(-wide + 4.5, -5.3, 0, -4);
      p.quadraticCurveTo(-wide * .33, 2, -thin + 1.5, length * .64);
      p.quadraticCurveTo(-wide + 3, length * .39, -wide + 2.8, -.3);
    });
    line(ctx, c.shade, 1.35, p => { p.moveTo(2, length * .33); p.quadraticCurveTo(2.9, length * .44, 1.7, length * .62); });
  }
  ctx.restore();
}

function boot(ctx: CanvasRenderingContext2D, point: Point, c: HeavyPalette, dark: boolean) {
  ctx.save(); ctx.translate(...point);
  shape(ctx, dark ? c.deep : wash(ctx, -13, 0, [[0, c.upper], [1, c.deep]]), 2.75, p => {
    p.moveTo(-9, -2); p.quadraticCurveTo(-12, -8, -5, -13);
    p.quadraticCurveTo(1, -15, 7, -8); p.quadraticCurveTo(15, -9, 16, -4);
    p.quadraticCurveTo(17, .5, 9, .1); p.quadraticCurveTo(-3, .8, -9, -2);
  });
  if (!dark) {
    line(ctx, c.toe, 1.65, p => {
      p.moveTo(9, -5); p.lineTo(11, -3);
      p.moveTo(13, -5.1); p.lineTo(14.5, -3.1);
      p.moveTo(-4, -4); p.quadraticCurveTo(0, -3.2, 4, -4);
    });
  }
  ctx.restore();
}

function leg(ctx: CanvasRenderingContext2D, hip: Point, paw: Point, c: HeavyPalette, dark: boolean, kneeBend: number) {
  const knee: Point = [(hip[0] + paw[0]) * .5 + kneeBend, (hip[1] + paw[1]) * .5 - 2];
  limb(ctx, knee, [paw[0], paw[1] - 7], dark ? 7.2 : 9, 5.8, c, dark);
  limb(ctx, hip, knee, dark ? 11 : 13, dark ? 8 : 10, c, dark);
  boot(ctx, paw, c, dark);
}

export function paintHeavyTorso(ctx: CanvasRenderingContext2D, c: HeavyPalette, upper: (path: CanvasRenderingContext2D) => void) {
  const fill = wash(ctx, -32, 43, [[0, c.light], [.26, c.upper], [.56, c.middle], [1, c.deep]]);
  shape(ctx, fill, 3.4, p => {
    p.moveTo(-39, 16);
    upper(p);
    p.quadraticCurveTo(37, 16, 25, 23); p.quadraticCurveTo(26, 35, 12, 43);
    p.quadraticCurveTo(-8, 49, -25, 39); p.quadraticCurveTo(-35, 32, -39, 16);
  });
  shape(ctx, c.deep, 0, p => {
    p.moveTo(27, -14); p.quadraticCurveTo(39, -2, 33, 10);
    p.quadraticCurveTo(32, 18, 21, 23); p.quadraticCurveTo(24, 35, 8, 40);
    p.quadraticCurveTo(-7, 46, -22, 38); p.quadraticCurveTo(-9, 35, 1, 29);
    p.quadraticCurveTo(3, 15, 15, 10); p.quadraticCurveTo(25, 1, 27, -14);
  });
  shape(ctx, c.light, 0, p => {
    p.moveTo(-35, -13); p.quadraticCurveTo(-31, -24, -19, -25);
    p.quadraticCurveTo(-9, -27, -2, -21); p.quadraticCurveTo(-17, -21, -21, -12);
    p.quadraticCurveTo(-27, -5, -35, -13);
  });
}

export function paintHeavyFace(ctx: CanvasRenderingContext2D, c: HeavyPalette, strain: number) {
  shape(ctx, c.deep, 1.6, p => {
    p.moveTo(4, -7); p.quadraticCurveTo(13, -11, 21, -7);
    p.quadraticCurveTo(19, -.5, 12, -2); p.quadraticCurveTo(5, -2, 4, -7);
  });
  shape(ctx, c.glow, 0, p => {
    p.moveTo(7,-7); p.quadraticCurveTo(13,-7.6, 20,-6.4);
    p.quadraticCurveTo(16,-3.4, 11,-4); p.quadraticCurveTo(9,-4.6, 7,-7);
  });
  oval(ctx, 16.1, -5.6, 1.3, 1.4, '#513945');
  shape(ctx, '#3b2a37', 1.4, p => {
    p.moveTo(7, 7); p.quadraticCurveTo(13, 4, 22, 5);
    p.quadraticCurveTo(20, 11 + 4 * strain, 11, 11 + 2 * strain);
    p.quadraticCurveTo(8, 10, 7, 7);
  });
}

function arm(ctx: CanvasRenderingContext2D, art: HeavyArt, shoulder: Point, elbow: Point, hand: Point, far: boolean, turn: number) {
  const c = art.palette;
  limb(ctx, elbow, hand, far ? 10 : art.forearmWidth, far ? 9 : 12.5, c, far);
  limb(ctx, shoulder, elbow, far ? 10 : art.upperArmWidth, far ? 9 : 11.5, c, far);
  if (!far) art.armDetail(ctx, shoulder, elbow, hand, turn);
  art.fist(ctx, hand, turn, far);
}

export function drawHeavy(ctx: CanvasRenderingContext2D, art: HeavyArt, motion: HeavyMotion, phase: number) {
  const attacking = motion === 'attack';
  const beat = phase * TAU;
  const pickup = attacking ? ease(.025, .31, phase) * (1 - ease(.36, .55, phase)) : 0;
  const hit = attacking ? ease(.37, .56, phase) * (1 - ease(.60, .96, phase)) : 0;
  const brace = attacking ? ease(.025, .20, phase) * (1 - ease(.67, 1, phase)) : 0;
  const bob = attacking ? -3 * pickup + 4 * hit : Math.cos(2 * beat) * 1.8;
  const shift = attacking ? -3 * pickup + 9 * hit : Math.sin(beat) * 2;
  const lean = attacking ? -.083 * pickup + .10 * hit : Math.sin(beat) * .035;
  const { stride, height } = art;
  const farFoot: Point = attacking ? [19 + 6 * brace, -5] : foot(phase + .5, 19, -5, stride);
  const nearFoot: Point = attacking ? [-15 - 6 * brace, -1] : foot(phase, -15, -1, stride);
  const c = art.palette;
  const shoulder: Point = [-31 + shift, height - 10 + bob];
  const restElbow: Point = [-38 - (nearFoot[0] + 15) * .39, -44 + bob * .62];
  const restHand: Point = [-33 - (nearFoot[0] + 15) * .85, art.handRestY];
  const highElbow = art.windupElbow;
  const highHand = art.windupHand;
  const lowElbow: Point = [15,-51];
  const lowHand: Point = [52,-25];
  const elbow = mix(mix(restElbow, highElbow, pickup), lowElbow, hit);
  const hand = mix(mix(restHand, highHand, pickup), lowHand, hit);
  const turn = -.12 + .21 * Math.sin(beat) * Number(!attacking) - .47 * pickup - .36 * hit;
  const farShoulder: Point = [29 + shift, height - 9 + bob];
  const farElbow: Point = [41 + shift - (farFoot[0] - 19) * .35, -51 + bob];
  const farHand: Point = [42 + shift - (farFoot[0] - 19) * .64, -36 - 4 * brace];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  leg(ctx, [13 + shift, -36 + bob], farFoot, c, true, art.kneeBend);
  arm(ctx, art, farShoulder, farElbow, farHand, true, -.22);
  art.torso(ctx, shift, height + bob, lean);
  leg(ctx, [-12 + shift, -35 + bob], nearFoot, c, false, art.kneeBend);
  arm(ctx, art, shoulder, elbow, hand, false, turn);
  art.head(ctx, 25 + shift + 2.5 * hit, height - art.headRise + bob, lean + .12 * hit, Math.max(hit, pickup));
  if (hit > .55) {
    const flare = (hit - .55) / .45;
    line(ctx, `rgba(229, 200, 145, ${(flare * .7).toFixed(3)})`, 1.8, p => {
      p.moveTo(47 + flare * 8, -8); p.quadraticCurveTo(58 + flare * 10, -6, 69 + flare * 12, -11);
      p.moveTo(60 + flare * 9, -4); p.lineTo(66 + flare * 12, -5.5);
    });
  }
  ctx.restore();
}
