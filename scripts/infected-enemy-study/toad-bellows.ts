import { oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { drawVenomBellows } from '../../src/assets/art/infectedEnemies/venomBellows';

type Motion = 'move' | 'attack';
const gold = '#f4b964';

function unit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ease(from: number, to: number, phase: number) {
  const t = unit((phase - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function venom(ctx: CanvasRenderingContext2D, phase: number) {
  if (phase < .51 || phase > .93) return;
  const flight = unit((phase - .51) / .34);
  const x = 62 + flight * 47;
  const y = -27 + flight * 26 - Math.sin(flight * Math.PI) * 26;
  ctx.save();
  if (flight < 1) {
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(26 - 26 * Math.PI * Math.cos(flight * Math.PI), 47));
    oval(ctx, -11, .3, 6.8, 2, '#d3946388');
    shape(ctx, wash(ctx, -5, 5, [[0, '#fff1a1'], [.48, '#e4af54'], [1, '#a05a55']]), 1.8, p => {
      p.moveTo(-7, 1); p.quadraticCurveTo(-2, -6, 5, -4);
      p.bezierCurveTo(12, 0, 6, 7, -.5, 5);
      p.quadraticCurveTo(-4, 2.8, -7, 1);
    });
    oval(ctx, 2, -2, 3, 1.15, '#fff0a5', -.12);
  } else {
    const fade = 1 - ease(.85, .93, phase);
    ctx.globalAlpha = fade;
    oval(ctx, x, .1, 6.5 + 2 * (1 - fade), 1.7, '#d29051');
    oval(ctx, x + 3, -2 - 5 * (1 - fade), 1.3, 2.4, gold, .43);
  }
  ctx.restore();
}

export const bellowsOption = {
  name: 'Venom Bellows',
  description: 'Slate hide and twin coral poison glands that swell before an amber lob.',
  draw(ctx: CanvasRenderingContext2D, motion: Motion, phase: number) {
    drawVenomBellows(ctx, motion, phase, true);
    if (motion === 'attack') venom(ctx, phase);
  },
};
