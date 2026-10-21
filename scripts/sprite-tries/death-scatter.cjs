'use strict';

const duration = 0.72;
const clamp = value => Math.max(0, Math.min(1, value));
const easeOut = value => 1 - (1 - value) ** 3;
const noise = index => ((index * 71 + 43) % 101) / 100;

function draw(ctx, subject, t) {
  if (t < 0 || t >= duration) return;

  const { image, bounds, width, height } = subject;
  const sourceWidth = bounds.right - bounds.left + 1;
  const sourceHeight = bounds.bottom - bounds.top + 1;
  const settle = easeOut(clamp(t / 0.14));
  const settledWidth = width * (1 + settle * 0.025);
  const settledHeight = height * (1 - settle * 0.16);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (t < 0.14) {
    ctx.drawImage(image, bounds.left, bounds.top, sourceWidth, sourceHeight,
      -settledWidth / 2, -settledHeight, settledWidth, settledHeight);
    ctx.restore();
    return;
  }

  const columns = 5;
  const rows = 3;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const x0 = Math.floor(column * sourceWidth / columns);
      const x1 = Math.floor((column + 1) * sourceWidth / columns);
      const y0 = Math.floor(row * sourceHeight / rows);
      const y1 = Math.floor((row + 1) * sourceHeight / rows);
      const delay = noise(index) * 0.09;
      const progress = clamp((t - 0.14 - delay) / (duration - 0.14 - delay));
      const drift = easeOut(progress);
      const size = 1 - easeOut(clamp(progress / 0.75)) * 0.48;
      const tileWidth = (x1 - x0) / sourceWidth * settledWidth;
      const tileHeight = (y1 - y0) / sourceHeight * settledHeight;
      const centerX = ((x0 + x1) / 2 / sourceWidth - 0.5) * settledWidth;
      const centerY = ((y0 + y1) / 2 / sourceHeight - 1) * settledHeight;
      const inward = -centerX * 0.04 * drift;
      const stagger = (noise(index + 29) - 0.5) * width * 0.1 * drift;
      const floor = -tileHeight * size / 2;
      const drop = height * (0.06 * drift + (0.14 + 0.32 * noise(index + 7)) * progress ** 1.5);
      const y = Math.min(floor, centerY + drop);

      ctx.globalAlpha = (1 - clamp((progress - 0.28) / 0.72)) ** 1.2;
      // Source crops keep the original alpha silhouette and fur colors inside each cluster.
      ctx.drawImage(image,
        bounds.left + x0, bounds.top + y0, x1 - x0, y1 - y0,
        centerX + inward + stagger - tileWidth * size / 2,
        y - tileHeight * size / 2, tileWidth * size, tileHeight * size);
    }
  }

  ctx.restore();
}

module.exports = {
  title: 'Soft breakup',
  description: 'A brief settle, then small pieces of the original fur drop and fade close to the ground.',
  duration,
  draw,
};
