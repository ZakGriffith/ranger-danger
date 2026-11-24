import { shape, line, wash } from '../forestEnemies/paint';
import { mix, type HeavyArt, type HeavyMotion as Action, type Point } from './heavyMotion';

function ease(a: number, b: number, phase: number) {
  const t = Math.max(0, Math.min(1, (phase - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function limb(ctx: CanvasRenderingContext2D, start: Point, end: Point, width: number, art: HeavyArt, far: boolean) {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const c = art.palette;
  ctx.save(); ctx.translate(...start); ctx.rotate(Math.atan2(end[1] - start[1], end[0] - start[0]));
  shape(ctx, wash(ctx, -width, width, [[0, far ? c.upper : c.light], [.35, c.upper], [.75, c.middle], [1, c.deep]]), 3, p => {
    p.moveTo(-4, -width * .8); p.quadraticCurveTo(length * .45, -width * 1.2, length + 3, -width * .58);
    p.quadraticCurveTo(length + width * .65, 0, length + 3, width * .6);
    p.quadraticCurveTo(length * .45, width, -4, width * .8); p.quadraticCurveTo(-width, 0, -4, -width * .8);
  });
  shape(ctx, far ? c.upper : c.light, 0, p => {
    p.moveTo(-2, -width * .6); p.quadraticCurveTo(length * .4, -width * .92, length - 3, -width * .5);
    p.lineTo(length * .55, -width * .25); p.quadraticCurveTo(length * .2, -width * .52, -2, -width * .25);
  });
  line(ctx, c.shade, 1.3, p => { p.moveTo(length * .45, width * .3); p.lineTo(length * .65, width * .42); });
  ctx.restore();
}

function footPose(phase: number, x: number, far: boolean): Point {
  const step = ((phase % 1) + 1) % 1;
  const planted = step < .65;
  const progress = planted ? step / .65 : (step - .65) / .35;
  return [x + (planted ? 6 * (1 - 2 * progress) : -6 * Math.cos(Math.PI * progress)),
    (far ? -6 : -1) - (planted ? 0 : Math.sin(Math.PI * progress) * 5)];
}

function leg(ctx: CanvasRenderingContext2D, hip: Point, foot: Point, art: HeavyArt, far: boolean) {
  const knee: Point = [(hip[0] + foot[0]) / 2 + 4, -20];
  limb(ctx, hip, knee, far ? 10 : 12, art, far);
  limb(ctx, knee, [foot[0], foot[1] - 7], 7, art, far);
  ctx.save(); ctx.translate(...foot);
  shape(ctx, far ? art.palette.deep : wash(ctx, -13, 1, [[0, art.palette.upper], [1, art.palette.deep]]), 2.6, p => {
    p.moveTo(-10, -2); p.quadraticCurveTo(-11, -14, 0, -12); p.lineTo(8, -8);
    p.quadraticCurveTo(18, -8, 16, -1); p.lineTo(8, 1); p.lineTo(-7, 0);
  });
  if (!far) line(ctx, art.palette.toe, 1.4, p => { p.moveTo(6, -5); p.lineTo(8, -2); p.moveTo(12, -5); p.lineTo(13, -2); });
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, art: HeavyArt, shoulder: Point, elbow: Point, hand: Point, far: boolean, turn: number) {
  limb(ctx, shoulder, elbow, far ? 13 : 16, art, far);
  limb(ctx, elbow, hand, far ? 12 : 15, art, far);
  art.armDetail(ctx, shoulder, elbow, hand, turn);
  art.fist(ctx, hand, turn, far);
}

export function drawFungalMotion(ctx: CanvasRenderingContext2D, art: HeavyArt, action: Action, phase: number) {
  const attacking = action === 'attack';
  const wind = attacking ? ease(.03, .30, phase) * (1 - ease(.365, .43, phase)) : 0;
  const strike = attacking ? ease(.365, .43, phase) * (1 - ease(.54, 1, phase)) : 0;
  const brace = attacking ? ease(.03, .22, phase) - ease(.75, 1, phase) : 0;
  const gait = phase * Math.PI * 2;
  const bob = attacking ? -3 * wind + 5 * strike : Math.cos(gait * 2) * 1.7;
  const shift = attacking ? -3 * wind + 6 * strike : Math.sin(gait) * 1.5;
  const lean = attacking ? -.07 * wind + .11 * strike : Math.sin(gait) * .03;
  const nearFoot: Point = attacking ? [-20 - brace * 4, -1] : footPose(phase, -18, false);
  const farFoot: Point = attacking ? [18 + brace * 4, -6] : footPose(phase + .5, 18, true);
  const nearShoulder: Point = [-31 + shift, -70 + bob];
  const farShoulder: Point = [30 + shift, -69 + bob];
  const walk = attacking ? 0 : Math.sin(gait) * 4;
  let nearElbow: Point = [-40, -43 + bob];
  let nearHand: Point = [-37 - walk, -22];
  const farElbow: Point = [43, -46 + bob];
  const farHand: Point = [45 + walk, -30];
  if (attacking) {
    nearElbow = mix(mix(nearElbow, [-48, -79], wind), [19, -51], strike);
    nearHand = mix(mix(nearHand, [-39, -105], wind), [64, -36], strike);
  }
  const nearTurn = -.12 - wind * .35 - strike * .3;
  ctx.save(); ctx.lineJoin = ctx.lineCap = 'round';
  leg(ctx, [13 + shift, -36 + bob], farFoot, art, true);
  arm(ctx, art, farShoulder, farElbow, farHand, true, -.2);
  art.torso(ctx, shift, -60 + bob, lean);
  leg(ctx, [-12 + shift, -35 + bob], nearFoot, art, false);
  art.head(ctx, 25 + shift + strike * 2, -68 + bob, lean + .1 * strike, Math.max(wind, strike));
  // The punching arm crosses the face; drawing it last preserves that foreground overlap.
  arm(ctx, art, nearShoulder, nearElbow, nearHand, false, nearTurn);
  ctx.restore();
}
