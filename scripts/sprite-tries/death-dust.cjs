const duration = 0.78;

const clamp = value => Math.max(0, Math.min(1, value));
const easeOut = value => 1 - (1 - value) ** 3;

const wisps = [
  { x: -0.31, direction: -1, delay: 0.00, width: 0.34, rise: 0.075, color: '#655b48' },
  { x: 0.24, direction: 1, delay: 0.035, width: 0.39, rise: 0.09, color: '#766c55' },
  { x: -0.07, direction: -1, delay: 0.065, width: 0.43, rise: 0.12, color: '#8d8063' },
  { x: 0.12, direction: 1, delay: 0.09, width: 0.32, rise: 0.07, color: '#a49370' },
];

const wispShape = [
  [-0.50, 0], [-0.50, -0.24], [-0.36, -0.24], [-0.36, -0.59],
  [-0.19, -0.59], [-0.19, -0.79], [0.03, -0.79], [0.03, -1],
  [0.24, -1], [0.24, -0.67], [0.40, -0.67], [0.40, -0.39],
  [0.50, -0.39], [0.50, -0.13], [0.28, -0.13], [0.28, 0],
];

function draw(ctx, subject, t) {
  if (t < 0 || t >= duration) return;

  const { image, bounds, width, height, scale } = subject;
  const snap = value => Math.round(value / scale) * scale;
  const sourceWidth = bounds.right - bounds.left + 1;
  const sourceHeight = bounds.bottom - bounds.top + 1;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const settle = easeOut(clamp(t / 0.18));
  const fade = clamp((t - 0.12) / 0.27);
  const bodyWidth = width * (1 + settle * 0.035);
  const bodyHeight = height * (1 - settle * 0.11);

  if (fade < 1) {
    ctx.globalAlpha = 1 - fade;
    ctx.drawImage(
      image, bounds.left, bounds.top, sourceWidth, sourceHeight,
      snap(-bodyWidth / 2), snap(-bodyHeight + height * 0.025 * settle),
      snap(bodyWidth), snap(bodyHeight),
    );
  }

  // Broad, low stepped shapes keep the dust grounded instead of reading as sparks.
  for (const wisp of wisps) {
    const local = t - 0.105 - wisp.delay;
    if (local <= 0) continue;
    const p = clamp(local / (duration - 0.105 - wisp.delay));
    const spread = easeOut(p);
    const appearing = clamp(local / 0.09);
    const disappearing = 1 - clamp((p - 0.28) / 0.72);
    const w = width * wisp.width * (0.72 + spread * 0.36);
    const h = height * wisp.rise * (0.76 + Math.sin(p * Math.PI) * 0.4);
    const x = width * (wisp.x + wisp.direction * spread * 0.085);
    const y = -height * spread * 0.022;

    ctx.globalAlpha = appearing * disappearing * 0.72;
    ctx.fillStyle = wisp.color;
    ctx.beginPath();
    wispShape.forEach(([px, py], index) => {
      const dx = snap(x + px * w);
      const dy = snap(y + py * h);
      if (index === 0) ctx.moveTo(dx, dy);
      else ctx.lineTo(dx, dy);
    });
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

module.exports = {
  title: 'Dust fade',
  description: 'A slight slump, then a quiet fade into low, earth-toned dust. The dust follows each creature’s size.',
  duration,
  draw,
};
