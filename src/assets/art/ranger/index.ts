import { drawRangerBody, drawRangerHead } from './body';
import { drawRangerBow } from './bow';
import type { RangerPose } from './pose';

export { getArrowOrigin, drawFlyingArrow, RANGER_AIM_HEIGHT } from './bow';
export type { RangerPose, RangerView } from './pose';

export function drawRanger(ctx: CanvasRenderingContext2D, pose: RangerPose): void {
  ctx.fillStyle = '#131d1488';
  ctx.beginPath();
  ctx.ellipse(0, -1, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (pose.view === 'north') drawRangerBow(ctx, pose);
  drawRangerBody(ctx, pose);
  if (pose.view !== 'north') drawRangerBow(ctx, pose);
  drawRangerHead(ctx, pose);
}
