import type { MeadowEnemyPose } from './pose';

const INK = '#29242a';
const SHADOW = '#34523c';
const SAGE = '#8da951';
const LIME = '#c0cc68';
const BELLY = '#d9ad62';
const TAU = Math.PI * 2;

function fill(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, trace: (path: CanvasRenderingContext2D) => void, outline = 0) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = outline;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, width: number, trace: (path: CanvasRenderingContext2D) => void) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function oval(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, x: number, y: number, width: number, height: number, rotation = 0) {
  fill(ctx, color, path => path.ellipse(x, y, width, height, rotation, 0, TAU));
}

function wash(ctx: CanvasRenderingContext2D, top: number, bottom: number, stops: readonly (readonly [number, string])[]) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  return gradient;
}

function bodyPoint(t: number, phase: number, headX: number, headY: number, anticipation: number) {
  const envelope = Math.sin(Math.PI * t);
  const tailX = -62 + 16 * anticipation;
  const neckX = headX - 10;
  const x = tailX + (neckX - tailX) * t;
  const baseline = -13 + (headY + 14) * t ** 4;
  const y = baseline + (8 + 3 * anticipation) * envelope * Math.sin(TAU * (1.35 * t - phase));
  return { x, y, radius: .65 + 7.4 * Math.sin(t * Math.PI * .53) ** 1.1 };
}

function drawBody(ctx: CanvasRenderingContext2D, phase: number, headX: number, headY: number, anticipation: number) {
  const sample = t => bodyPoint(t, phase, headX, headY, anticipation);
  const points = Array.from({ length: 41 }, (_, i) => sample(i / 40));
  const ribbon = (p, top, bottom) => {
    for (const [i, { x, y, radius }] of points.entries()) {
      if (i === 0) p.moveTo(x, y + radius * top);
      else p.lineTo(x, y + radius * top);
    }
    for (let i = points.length - 1; i >= 0; i--) {
      const { x, y, radius } = points[i];
      p.lineTo(x, y + radius * bottom);
    }
  };
  fill(ctx, BELLY, p => ribbon(p, -1, 1), 2.7);
  fill(ctx, wash(ctx, -35, 0, [[0, LIME], [.45, SAGE], [1, SHADOW]]),
    p => ribbon(p, -1, .43));
  fill(ctx, '#aabc5c', p => ribbon(p, -.83, -.56));

  for (let i = 2; i < 11; i++) {
    const t = i / 12;
    const { x, y, radius } = sample(t);
    const next = sample(t + .018);
    const angle = Math.atan2(next.y - y, next.x - x);
    oval(ctx, '#527343', x, y - radius * .19, 1.45 + 1.1 * t, 1.1, angle);
    line(ctx, '#966d43', 1.05, p => {
      p.moveTo(x + 1.5, y + radius * .51);
      p.quadraticCurveTo(x + 1.4, y + radius * .76, x + 2.6, y + radius * .92);
    });
  }
}

function drawJaw(ctx: CanvasRenderingContext2D, gape: number) {
  ctx.save();
  ctx.translate(-2, 5);
  ctx.rotate(gape * .58);
  fill(ctx, '#e8bd73', p => {
    p.moveTo(-12, -2);
    p.quadraticCurveTo(-6, -4.5, 4, -2.8);
    p.quadraticCurveTo(15, -1.5, 19, .5);
    p.quadraticCurveTo(20, 3, 16, 5);
    p.bezierCurveTo(11, 8, -6, 8, -12, 2);
    p.quadraticCurveTo(-14, 0, -12, -2);
  }, 2.6);
  fill(ctx, '#a56e4c', p => {
    p.moveTo(-9, 2);
    p.quadraticCurveTo(5, 6, 17.5, 2.8);
    p.quadraticCurveTo(12, 8, -.2, 6);
    p.quadraticCurveTo(-6, 5.5, -9, 2);
  });
  if (gape > .25) {
    line(ctx, '#d77769', 2, p => {
      p.moveTo(2, .8);
      p.quadraticCurveTo(8, 1.7, 13, .3);
    });
  }
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, gape: number, flick: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  if (gape > .1) {
    fill(ctx, '#4d2636', p => {
      p.moveTo(-12, 2);
      p.quadraticCurveTo(5, -1, 17, 4);
      p.quadraticCurveTo(11, 8 + 13 * gape, 3, 8 + 10 * gape);
      p.quadraticCurveTo(-12, 10, -12, 2);
    }, 2.2);
  }
  if (flick > .05) {
    line(ctx, '#743443', 2.8, p => {
      p.moveTo(14, 5);
      p.quadraticCurveTo(22, 7, 22 + 7 * flick, 6);
      p.lineTo(24 + 8 * flick, 3.5);
      p.moveTo(22 + 7 * flick, 6);
      p.lineTo(24 + 8 * flick, 8);
    });
    line(ctx, '#e27568', 1.25, p => {
      p.moveTo(16, 5.2);
      p.quadraticCurveTo(23, 7, 22 + 7 * flick, 6);
      p.lineTo(24 + 8 * flick, 3.5);
      p.moveTo(22 + 7 * flick, 6);
      p.lineTo(24 + 8 * flick, 8);
    });
  }
  drawJaw(ctx, gape);

  const face = wash(ctx, -18, 10, [[0, LIME], [.26, '#acc15b'], [.57, '#83a54c'], [1, '#4d7740']]);
  fill(ctx, face, p => {
    p.moveTo(-16, -.5);
    p.bezierCurveTo(-21, -6, -16, -13, -9, -16);
    p.quadraticCurveTo(-4, -20, 4, -15);
    p.quadraticCurveTo(8, -17.5, 13, -13);
    p.bezierCurveTo(18, -11, 17, -8, 20, -5);
    p.quadraticCurveTo(25, -1, 21, 3.6);
    p.quadraticCurveTo(17, 7, 8, 5.5);
    p.bezierCurveTo(2, 8, -9, 7, -16, -.5);
  }, 3);
  fill(ctx, '#628c45', p => {
    p.moveTo(-15, -3);
    p.bezierCurveTo(-7, 2, -3, -2, 2, 0);
    p.quadraticCurveTo(9, 4.5, 17, 2);
    p.quadraticCurveTo(21, 1, 22, -.4);
    p.quadraticCurveTo(22, 4.5, 16, 4.5);
    p.quadraticCurveTo(10, 4.4, 8, 4.5);
    p.quadraticCurveTo(-2, 8, -15, -3);
  });
  fill(ctx, '#d3d87d', p => {
    p.moveTo(-13.5, -10);
    p.bezierCurveTo(-7, -17, -2, -18, 3, -14);
    p.quadraticCurveTo(-3, -14, -6.5, -10);
    p.quadraticCurveTo(-11, -11, -13.5, -10);
  });
  fill(ctx, '#d4dc78', p => {
    p.moveTo(10.5, -10.5);
    p.quadraticCurveTo(15, -11.5, 17, -7.5);
    p.quadraticCurveTo(16, -6, 13, -7);
  });
  oval(ctx, '#4b6e41', 16, -3, 2.2, 1.18, .3);
  oval(ctx, INK, 17.6, -3.2, 1.25, .75, .25);
  oval(ctx, '#587c42', -10, -3, 2, 1.1, .27);
  oval(ctx, '#6b9347', -7.5, -.8, 1, .9);
  fill(ctx, '#f7bf58', p => {
    p.moveTo(8.9, -6.8);
    p.quadraticCurveTo(4, -11.3, -1.2, -9.2);
    p.quadraticCurveTo(-2.4, -4.5, 1.6, -3.5);
    p.quadraticCurveTo(6.5, -2.5, 8.9, -6.8);
  }, 1.6);
  oval(ctx, INK, 4.6, -6.7, 1.1, 2.2, .15);
  oval(ctx, '#fff1b2', 5.2, -7.8, .52, .58);
  line(ctx, '#3a552e', 1.9, p => {
    p.moveTo(-2.7, -10.7);
    p.quadraticCurveTo(3.9, -11.8, 9.8, -7);
  });
  line(ctx, '#45683a', 1, p => {
    p.moveTo(13, 2);
    p.quadraticCurveTo(15.7, 2.1, 18.8, 1.2);
  });
  const fang = 3.6 + 5.1 * gape;
  fill(ctx, '#fff0c2', p => {
    p.moveTo(11.5, 4.7);
    p.quadraticCurveTo(11.1, 6.5, 10.4, 4.8 + fang);
    p.quadraticCurveTo(14.4, 7.3, 15, 4.7);
  }, 1.15);
  if (gape > .22) {
    fill(ctx, '#f4ddb0', p => {
      p.moveTo(18, 4.4);
      p.quadraticCurveTo(17.7, 7, 17, 4.5 + fang * .65);
      p.quadraticCurveTo(19.4, 6.7, 20.2, 3.7);
    }, 1);
  }

  ctx.restore();
}

export function drawSnake(ctx: CanvasRenderingContext2D, { mode, phase, anticipation, lunge, strike, recovery, tongueFlick }: MeadowEnemyPose) {
  const moving = mode === 'move';
  const wave = moving ? Math.sin(phase * TAU) : 0;
  const ripple = moving ? Math.sin(phase * TAU - 1.1) : 0;
  const reach = Math.max(lunge, strike);
  const x = 30 + 2 * wave - 15 * anticipation + 17 * reach - 4 * recovery;
  const y = -21 + 2.5 * ripple - 20 * anticipation + 2 * reach + 2 * recovery;
  const gape = Math.max(.54 * anticipation, .98 * strike, .81 * lunge, .31 * recovery);
  const flick = moving ? tongueFlick ?? Math.max(0, Math.sin((phase - .18) * TAU)) ** 7 : 0;
  const tilt = .065 * ripple - .25 * anticipation + .13 * reach + .09 * recovery;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const bodyPhase = moving ? phase : .22 + .31 * lunge;
  drawBody(ctx, bodyPhase, x, y, anticipation);
  drawHead(ctx, x, y, tilt, gape, flick);
  ctx.restore();
}
