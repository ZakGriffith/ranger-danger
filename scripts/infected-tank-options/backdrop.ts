import { oval, shape } from './paint';
export function paintBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#484153'); sky.addColorStop(.6, '#393340'); sky.addColorStop(1, '#2d2935');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  shape(ctx, '#454547', 0, p => { p.moveTo(0, height * .7); p.bezierCurveTo(width * .25, height * .6, width * .5, height * .85, width, height * .65); p.lineTo(width, height); p.lineTo(0, height); });
  shape(ctx, '#535950', 0, p => { p.moveTo(0, height * .83); p.quadraticCurveTo(width * .2, height * .78, width * .4, height); p.lineTo(0, height); });
  shape(ctx, '#5d6251', 0, p => { p.moveTo(0, height * .86); p.quadraticCurveTo(width * .17, height * .83, width * .32, height); p.lineTo(0, height); });
  for (let i = 0; i < 60; i++) {
    const x = (i * 71 % 433) / 433 * width, y = height * .68 + (i * 41 % 127) / 127 * height * .32;
    oval(ctx, x, y, .5 + i % 3 * .6, .5, i % 3 ? '#b7a5b026' : '#bec49c33', -.3);
  }
}
