import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
type Point = readonly [number, number];
export type LanternMawPose = { time: number; x: number; y: number; wind: number; rush: number };
export const LANTERN_MAW_DASH_FRAMES = ['dash0', 'dash1', 'dash2', 'dash3'] as const;
export const LANTERN_MAW_FRAMES = [
  'idle0', 'idle1', 'idle2', 'idle3', 'move0', 'move1', 'move2', 'move3', 'atk0', 'atk1',
  'chargeWind0', 'chargeWind1', 'chargeWind2', 'chargeWind3', 'chargeWind4', 'chargeWind5',
  ...LANTERN_MAW_DASH_FRAMES,
  'hit', 'birth0', 'birth1', 'birth2', 'birth3', 'birth4', 'die0', 'die1', 'die2', 'die3', 'die4',
] as const;
type LanternMawFrame = typeof LANTERN_MAW_FRAMES[number];

const TAU = Math.PI * 2;

export function thread(ctx: CanvasRenderingContext2D, start: Point, tip: Point, width: number, seed: number, hue = '#835176') {
  const [x, y] = start;
  const [endX, endY] = tip;
  const bendX = (x + endX) / 2;
  const bendY = Math.max(y + 7, endY + seed * 7);
  const path = (p: CanvasRenderingContext2D) => {
    p.moveTo(x, y);
    p.bezierCurveTo(bendX + seed * 12, y + 17, bendX - seed * 6, bendY, endX, endY);
  };
  line(ctx, ink, width + 3, path);
  line(ctx, hue, width, path);
  line(ctx, hue === '#835176' ? '#b77b95' : '#b29b71', 1.7, p => {
    p.moveTo(x - 1, y - 2);
    p.bezierCurveTo(bendX + seed * 12 - 1, y + 10, bendX - seed * 6 - 1, bendY - 2, endX - 1, endY - 1);
  });
}

export function eye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, focus: number) {
  shape(ctx, '#382531', 1.8, p => p.ellipse(x, y, rx + 4, ry + 3, -.14, 0, TAU));
  shape(ctx, wash(ctx, y - ry, y + ry, [[0, '#fff6b3'], [.33, color], [1, '#b05e3f']]), 1.85,
    p => p.ellipse(x, y, rx, ry, -.14, 0, TAU));
  oval(ctx, x + focus * rx * .37, y - .3, rx * .26, ry * .81, '#432933', .13);
  oval(ctx, x - rx * .22, y - ry * .36, Math.max(1.2, rx * .19), Math.max(.9, ry * .17), '#fff7ce', -.18);
}

export function boils(ctx: CanvasRenderingContext2D, spots: readonly (readonly [number, number, number])[], color: string, glow: number) {
  for (const [x, y, r] of spots) {
    oval(ctx, x, y, r + 1.2, r * .76 + 1.1, '#593b50', -.15);
    oval(ctx, x - .25, y - .7, r, r * .76, color, -.15);
    oval(ctx, x - r * .32, y - r * .34, r * (.24 + glow * .2), r * .16, '#ffcf9b', -.3);
  }
}

export function drawLanternMaw(ctx: CanvasRenderingContext2D, p: LanternMawPose) {
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  const curl = p.wind * 25;
  for (let i = 0; i < 7; i++) {
    const startX = -44 + i * 13;
    const wave = Math.sin(p.time * 2 + i * 1.37) * .72 + Math.sin(p.time + i * 1.23) * .28;
    const drag = p.rush * 25 * (1 - Math.abs(startX) / 55);
    const endX = startX * 1.42 + wave * 8 - drag;
    const endY = -4 - Math.abs(wave) * 6 - curl * (.32 + Math.abs(i - 3) * .27);
    thread(ctx, [p.x + startX, -37 + p.y + Math.abs(i - 3) * 3], [endX, endY], i % 2 ? 10 : 13, wave, i % 2 ? '#6d476f' : '#835176');
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1 + p.rush * .13 - p.wind * .10, 1 - p.rush * .12 + p.wind * .09);
  shape(ctx, wash(ctx, -105, -14, [[0, '#c18bab'], [.38, '#965c89'], [.72, '#77476e'], [1, '#52334d']]), 3.7, q => {
    q.moveTo(-58, -35);
    q.bezierCurveTo(-66, -42, -56, -79, -37, -91);
    q.bezierCurveTo(-24, -103, -5, -102, 0, -97);
    q.bezierCurveTo(17, -109, 47, -92, 52, -68);
    q.bezierCurveTo(66, -66, 67, -50, 58, -41);
    q.bezierCurveTo(63, -24, 45, -18, 38, -25);
    q.bezierCurveTo(24, -15, 17, -21, 10, -23);
    q.bezierCurveTo(-4, -14, -13, -19, -23, -23);
    q.bezierCurveTo(-38, -17, -52, -24, -58, -35);
  });
  shape(ctx, '#d69fb277', 0, q => {
    q.moveTo(-51, -61);
    q.bezierCurveTo(-43, -87, -23, -96, -7, -91);
    q.quadraticCurveTo(3, -83, -12, -81);
    q.bezierCurveTo(-28, -81, -30, -64, -42, -60);
    q.quadraticCurveTo(-51, -56, -51, -61);
  });
  boils(ctx, [[-40, -52, 5.5], [-46, -43, 3.6], [-29, -66, 3.4], [23, -88, 6.3], [34, -84, 3.4], [48, -37, 5]], '#dd865d', p.wind);
  const gape = 6.8 + p.rush * 7 + p.wind * 2;
  shape(ctx, '#392637', 2.8, q => {
    q.moveTo(-18, -34);
    q.quadraticCurveTo(7, -26 - gape, 42, -37);
    q.quadraticCurveTo(48, -23 + gape, 20, -22);
    q.quadraticCurveTo(-5, -19, -18, -34);
  });
  for (const [x, y, d] of [[-6, -34, 4], [4, -35, 5], [15, -36, 6], [26, -36, 5], [36, -36, 4]]) {
    shape(ctx, '#f5cd9d', 1, q => {
      q.moveTo(x - 3, y);
      q.lineTo(x + 3, y - .1);
      q.lineTo(x + 1, y + d);
    });
  }
  eye(ctx, 15, -61, 20 + p.wind * 2, 11.7 + p.wind * 1.6, p.wind > .67 ? '#ffd181' : '#ffb05a', .85);
  line(ctx, '#50324d', 3.2, q => {
    q.moveTo(-13, -76); q.quadraticCurveTo(10, -89, 37, -74);
    q.moveTo(-25, -63); q.quadraticCurveTo(-15, -59, -10, -55);
  });
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const x = -24 + i * 25;
    const wave = Math.sin(p.time * 2 + i * 2.1) * .72 + Math.sin(p.time + i * 1.84) * .28;
    thread(ctx, [p.x + x, p.y - 24], [x * 1.37 + wave * 14 - p.rush * 13, -2 - curl * (.37 + i * .2) - Math.max(0, wave) * 8], 9.4, -wave);
  }
  ctx.restore();
}

function birthPockets(ctx: CanvasRenderingContext2D, index: number) {
  const swell = [0, .43, .8, 1, .38][index];
  if (!swell) return;
  for (const [x, y, size] of [[-41, -45, 12], [-22, -29, 9], [42, -32, 11]] as const) {
    const radius = size * swell;
    shape(ctx, wash(ctx, y - radius, y + radius, [[0, '#f6a67f'], [.46, '#c8798b'], [1, '#663750']]),
      1.7, p => p.ellipse(x, y, radius, radius * .73, -.3, 0, TAU));
    oval(ctx, x - radius * .25, y - radius * .27, radius * .39, radius * .15, '#ffd1a9', -.5);
  }
}

function deathBurst(ctx: CanvasRenderingContext2D, index: number) {
  ctx.save();
  ctx.scale(1 + .02 * index, 1 - .18 * index);
  ctx.globalAlpha *= 1 - .2 * index;
  drawLanternMaw(ctx, { time: index * .64, x: 0, y: 1.2 * index, wind: 0, rush: .4 });
  ctx.restore();
  for (let i = 0; i < 9; i++) {
    const angle = i / 9 * TAU + index * .15;
    const distance = 17 + 8 * index;
    const radius = Math.max(.9, 4 - .6 * index);
    const x = Math.cos(angle) * distance;
    const y = -22 - 4 * index + Math.sin(angle) * distance * .59;
    oval(ctx, x, y, radius, radius * .66, i % 3 === 0 ? '#ffc988' : '#ae658d', -.35);
  }
}

export function makeLanternMawFrame(frame: LanternMawFrame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(64, 96);
  ctx.scale(.77, .77);

  const index = Number(frame.slice(-1));
  const drawBody = (time: number, y = 0, wind = 0, rush = 0) => {
    drawLanternMaw(ctx, { time, x: 0, y, wind, rush });
  };

  if (frame.startsWith('die')) {
    deathBurst(ctx, index);
  } else if (frame.startsWith('birth')) {
    drawBody(index * TAU / 5, -.5, Math.sin(index * Math.PI / 4) * .28);
    birthPockets(ctx, index);
  } else if (frame.startsWith('chargeWind')) {
    const anticipation = [.28, .72, 1, .91, 1, .94][index];
    drawBody(index * TAU / 6, -2.3 - anticipation * 1.4, anticipation);
  } else if (frame.startsWith('dash')) {
    // Physics moves the boss and places the poison trail during the dash.
    drawBody(index * TAU / 4, 1 + Math.sin(index * TAU / 4) * 1.65, .14, .78);
  } else if (frame === 'atk0') {
    drawBody(.45, -3, .68);
  } else if (frame === 'atk1') {
    drawBody(Math.PI, 2.8, .03, .63);
  } else if (frame === 'hit') {
    drawBody(0);
    ctx.resetTransform();
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const time = index * TAU / 4;
    drawBody(time, -Math.abs(Math.sin(time)) * (frame.startsWith('move') ? 3 : 1.4));
  }
  return canvas;
}
