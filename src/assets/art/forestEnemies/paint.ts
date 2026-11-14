export const ink = '#25232b';

type Fill = string | CanvasGradient;
type Trace = (path: CanvasRenderingContext2D) => void;

export function shape(ctx: CanvasRenderingContext2D, fill: Fill, outlineWidth: number, trace: Trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outlineWidth > 0) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = outlineWidth;
    ctx.stroke();
  }
}

export function line(ctx: CanvasRenderingContext2D, color: Fill, width: number, trace: Trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function wash(ctx: CanvasRenderingContext2D, top: number, bottom: number, stops: readonly (readonly [number, string])[]) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

export function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: Fill, angle = 0) {
  shape(ctx, fill, 0, path => path.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2));
}
