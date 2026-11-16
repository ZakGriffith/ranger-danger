import { oval } from '../forestEnemies/paint';

export const CANNON_TOWER_BALL_RADIUS = 10;

export function drawCannonTowerBall(ctx: CanvasRenderingContext2D, x: number, y: number, baseRadius: number): void {
  const radius = baseRadius * 1.3;
  oval(ctx, x, y, radius, radius, '#26252f');
  const metal = ctx.createRadialGradient(
    x - radius * .32, y - radius * .38, radius * .05,
    x, y, radius * .91,
  );
  metal.addColorStop(0, '#b0b9bc');
  metal.addColorStop(.42, '#727e8b');
  metal.addColorStop(1, '#3c414f');
  oval(ctx, x, y, radius * .86, radius * .86, metal);
  oval(ctx, x - radius * .30, y - radius * .37, radius * .22, radius * .12, '#cad0ce');
}
