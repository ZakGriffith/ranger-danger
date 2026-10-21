export const DEATH_DUST_DURATION = 780;

export interface DustGraphics {
  fillStyle(color: number, alpha: number): unknown;
  beginPath(): unknown;
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  closePath(): unknown;
  fillPath(): unknown;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - value) ** 3;

const wisps = [
  { x: -0.31, direction: -1, delay: 0, width: 0.34, rise: 0.075, color: 0x655b48 },
  { x: 0.24, direction: 1, delay: 35, width: 0.39, rise: 0.09, color: 0x766c55 },
  { x: -0.07, direction: -1, delay: 65, width: 0.43, rise: 0.12, color: 0x8d8063 },
  { x: 0.12, direction: 1, delay: 90, width: 0.32, rise: 0.07, color: 0xa49370 },
];

const wispShape = [
  [-0.50, 0], [-0.50, -0.24], [-0.36, -0.24], [-0.36, -0.59],
  [-0.19, -0.59], [-0.19, -0.79], [0.03, -0.79], [0.03, -1],
  [0.24, -1], [0.24, -0.67], [0.40, -0.67], [0.40, -0.39],
  [0.50, -0.39], [0.50, -0.13], [0.28, -0.13], [0.28, 0],
];

export function sampleDustDeath(elapsedMs: number) {
  return {
    settle: easeOut(clamp(elapsedMs / 180)),
    bodyAlpha: 1 - clamp((elapsedMs - 120) / 270),
  };
}

export function drawDeathDust(
  graphics: DustGraphics,
  width: number,
  height: number,
  pixelSize: number,
  elapsedMs: number,
): void {
  if (elapsedMs < 0 || elapsedMs >= DEATH_DUST_DURATION) return;

  const snap = (value: number) => Math.round(value / pixelSize) * pixelSize;

  for (const wisp of wisps) {
    const local = elapsedMs - 105 - wisp.delay;
    if (local <= 0) continue;

    const progress = clamp(local / (DEATH_DUST_DURATION - 105 - wisp.delay));
    const spread = easeOut(progress);
    const appearing = clamp(local / 90);
    const disappearing = 1 - clamp((progress - 0.28) / 0.72);
    const w = width * wisp.width * (0.72 + spread * 0.36);
    const h = height * wisp.rise * (0.76 + Math.sin(progress * Math.PI) * 0.4);
    const x = width * (wisp.x + wisp.direction * spread * 0.085);
    const y = -height * spread * 0.022;

    graphics.fillStyle(wisp.color, appearing * disappearing * 0.72);
    graphics.beginPath();
    wispShape.forEach(([px, py], index) => {
      const dx = snap(x + px * w);
      const dy = snap(y + py * h);
      if (index === 0) graphics.moveTo(dx, dy);
      else graphics.lineTo(dx, dy);
    });
    graphics.closePath();
    graphics.fillPath();
  }
}
