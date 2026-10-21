const duration = 0.86;
const clamp = value => Math.max(0, Math.min(1, value));

function draw(ctx, subject, t) {
  if (t < 0 || t >= duration) return;
  const { image, bounds, width, height, scale, kind } = subject;
  const settle = 1 - (1 - clamp(t / 0.24)) ** 3;
  const fade = clamp((t - 0.43) / (duration - 0.43));
  const hip = kind === 'spider' ? 0.53 : 0.65;
  const drop = height * (kind === 'spider' ? 0.16 : 0.22) * settle;
  const sourceWidth = bounds.right - bounds.left + 1;
  const sourceHeight = bounds.bottom - bounds.top + 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1 - fade * fade * (3 - 2 * fade);

  // Use broad sections so subpixel rows cannot vanish at native game size.
  const torsoRows = Math.round(sourceHeight * hip);
  const torsoHeight = torsoRows * scale;
  const legHeight = height - torsoHeight;
  const foldedWidth = width * (1 - settle * 0.07);
  ctx.drawImage(image, bounds.left, bounds.top + torsoRows, sourceWidth, sourceHeight - torsoRows,
    -foldedWidth / 2, -legHeight + drop, foldedWidth, legHeight - drop);
  ctx.drawImage(image, bounds.left, bounds.top, sourceWidth, torsoRows,
    -width / 2, -height + drop, width, torsoHeight);
  ctx.restore();
}

module.exports = {
  title: 'Drop & settle',
  description: 'The legs give way, the body rests briefly, then fades. A grounded finish with no burst.',
  duration,
  draw,
};
