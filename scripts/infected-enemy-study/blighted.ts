import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Action = 'move' | 'attack';
type Point = readonly [number, number];
type Pose = { time: number; x: number; y: number; wind: number; rush: number; pace: number };

const TAU = Math.PI * 2;
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

function pose(action: Action, phase: number): Pose {
  const time = phase * TAU;
  if (action === 'move') return {
    time, x: Math.sin(time) * 4, y: -(Math.sin(time) ** 2) * 4,
    wind: 0, rush: 0, pace: Math.sin(time),
  };
  const wind = smooth(phase / .37) * (1 - smooth((phase - .39) / .09));
  const rush = smooth((phase - .39) / .13) * (1 - smooth((phase - .62) / .35));
  return {
    time, x: rush * 27 - wind * 9, y: -wind * 8 + rush * 4,
    wind, rush, pace: Math.sin(time * 3) * rush,
  };
}

function thread(ctx: CanvasRenderingContext2D, start: Point, tip: Point, width: number, seed: number, hue = '#835176') {
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

function trail(ctx: CanvasRenderingContext2D, p: Pose, tint: string) {
  const power = .23 + p.rush * .64 + p.wind * .27;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const t = (p.time / TAU + i / 6) % 1;
    const x = -31 - t * (26 + p.rush * 67) + p.x * .4;
    const y = -4 - t * (14 + p.wind * 18) + Math.sin(i * 4) * 5;
    ctx.globalAlpha = power * Math.sin(Math.PI * t);
    oval(ctx, x, y, 8 + 15 * t, 5 + 9 * t, tint, -.13);
    oval(ctx, x - 3, y - 3, 4 + 7 * t, 2 + 4 * t, '#dc9dca66');
  }
  ctx.restore();
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, focus: number) {
  shape(ctx, '#382531', 1.8, p => p.ellipse(x, y, rx + 4, ry + 3, -.14, 0, TAU));
  shape(ctx, wash(ctx, y - ry, y + ry, [[0, '#fff6b3'], [.33, color], [1, '#b05e3f']]), 1.85,
    p => p.ellipse(x, y, rx, ry, -.14, 0, TAU));
  oval(ctx, x + focus * rx * .37, y - .3, rx * .26, ry * .81, '#432933', .13);
  oval(ctx, x - rx * .22, y - ry * .36, Math.max(1.2, rx * .19), Math.max(.9, ry * .17), '#fff7ce', -.18);
}

function boils(ctx: CanvasRenderingContext2D, spots: readonly (readonly [number, number, number])[], color: string, glow: number) {
  for (const [x, y, r] of spots) {
    oval(ctx, x, y, r + 1.2, r * .76 + 1.1, '#593b50', -.15);
    oval(ctx, x - .25, y - .7, r, r * .76, color, -.15);
    oval(ctx, x - r * .32, y - r * .34, r * (.24 + glow * .2), r * .16, '#ffcf9b', -.3);
  }
}

function lantern(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const p = pose(action, phase);
  trail(ctx, p, '#b45b9e');
  const curl = p.wind * 25;
  for (let i = 0; i < 7; i++) {
    const startX = -44 + i * 13;
    const wave = Math.sin(p.time * 2 + i * 1.37);
    const endX = startX * 1.42 + wave * 8 - p.rush * 28;
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
  eye(ctx, 15, -61, 20 + p.wind * 2, 11.7 + p.wind * 1.6, '#ffb05a', .85);
  line(ctx, '#50324d', 3.2, q => {
    q.moveTo(-13, -76); q.quadraticCurveTo(10, -89, 37, -74);
    q.moveTo(-25, -63); q.quadraticCurveTo(-15, -59, -10, -55);
  });
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const x = -24 + i * 25;
    const wave = Math.sin(p.time * 2 + i * 2.1);
    thread(ctx, [p.x + x, p.y - 24], [x * 1.37 + wave * 14 - p.rush * 13, -2 - curl * (.37 + i * .2) - Math.max(0, wave) * 8], 9.4, -wave);
  }
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, tilt: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shape(ctx, '#625069', 2.4, p => {
    p.moveTo(-width, -1);
    p.quadraticCurveTo(0, 17, width, 0);
    p.quadraticCurveTo(width * .5, -12, 0, -10);
    p.quadraticCurveTo(-width * .52, -10, -width, -1);
  });
  shape(ctx, wash(ctx, -16, 5, [[0, '#d8af99'], [.55, color], [1, '#866477']]), 2.6, p => {
    p.moveTo(-width, 0);
    p.bezierCurveTo(-width * .94, -19, width * .39, -21, width, -2);
    p.quadraticCurveTo(width * .45, 5, -width, 0);
  });
  line(ctx, '#eac4a2', 1.6, p => {
    p.moveTo(-width * .64, -5); p.quadraticCurveTo(-width * .28, -13, width * .29, -11);
  });
  ctx.restore();
}

function crown(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const p = pose(action, phase);
  trail(ctx, p, '#b36dba');
  const shoulder = p.y - 60;
  for (const dir of [-1, 1]) {
    const swing = dir * p.pace * 11;
    const endpoint = dir * 33 + swing + p.rush * dir * 19;
    thread(ctx, [p.x + dir * 20, -42 + p.y], [endpoint, -2 - Math.max(0, swing) * .45], 17, dir, '#847659');
    thread(ctx, [p.x + dir * 30, shoulder], [p.x + dir * 56 + p.rush * 20, -21 - p.wind * 29 + swing], 19, dir, '#847659');
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(.09 * p.pace + p.rush * .15 - p.wind * .10);
  shape(ctx, wash(ctx, -111, -15, [[0, '#bba27c'], [.40, '#8c765d'], [1, '#55464e']]), 3.8, q => {
    q.moveTo(-39, -67);
    q.lineTo(-45, -83);
    q.quadraticCurveTo(-42, -96, -28, -97);
    q.lineTo(-15, -115);
    q.lineTo(-9, -103);
    q.quadraticCurveTo(10, -112, 19, -98);
    q.lineTo(34, -114);
    q.lineTo(35, -94);
    q.quadraticCurveTo(52, -87, 42, -73);
    q.bezierCurveTo(51, -51, 36, -31, 21, -22);
    q.quadraticCurveTo(9, -12, -4, -19);
    q.quadraticCurveTo(-14, -20, -20, -24);
    q.bezierCurveTo(-39, -28, -48, -53, -39, -67);
  });
  shelf(ctx, -41, -76, 22, -.42, '#b88584');
  shelf(ctx, -22, -97, 22, -.23, '#b48281');
  shelf(ctx, 26, -104, 24, .25, '#c48a83');
  shelf(ctx, 42, -82, 18, .45, '#956b7d');
  shape(ctx, '#543d53', 2.6, q => {
    q.moveTo(-26, -76);
    q.quadraticCurveTo(-4, -92, 21, -80);
    q.bezierCurveTo(35, -72, 40, -56, 30, -49);
    q.quadraticCurveTo(38, -30, 17, -30);
    q.quadraticCurveTo(-12, -23, -23, -42);
    q.bezierCurveTo(-33, -54, -26, -66, -26, -76);
  });
  shape(ctx, wash(ctx, -80, -39, [[0, '#e6c292'], [.52, '#bb946d'], [1, '#81615b']]), 2.4, q => {
    q.moveTo(-16, -76); q.quadraticCurveTo(3, -83, 21, -73);
    q.quadraticCurveTo(32, -66, 29, -54); q.lineTo(20, -48);
    q.lineTo(15, -38); q.lineTo(9, -45); q.lineTo(0, -39);
    q.lineTo(-3, -49); q.lineTo(-13, -48); q.quadraticCurveTo(-21, -60, -16, -76);
  });
  eye(ctx, 10, -62, 10.4, 6.2 + p.wind * 2, '#deeb8c', .65);
  line(ctx, '#d5b28c', 2, q => {
    q.moveTo(-37, -63); q.quadraticCurveTo(-33, -54, -32, -45);
    q.moveTo(-19, -35); q.quadraticCurveTo(-12, -28, -8, -27);
    q.moveTo(34, -39); q.quadraticCurveTo(31, -31, 25, -27);
  });
  boils(ctx, [[-31, -46, 3.4], [-23, -34, 2.8], [33, -45, 3.5], [26, -29, 3.2]], '#c976b0', p.wind);
  ctx.restore();
}

function shellPlate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tint: string, lean: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  shape(ctx, wash(ctx, -h, 10, [[0, '#b6a882'], [.4, tint], [1, '#524758']]), 2.9, q => {
    q.moveTo(-w, 1); q.quadraticCurveTo(-w * .77, -h * .8, -w * .10, -h);
    q.lineTo(w * .1, -h * .77);
    q.lineTo(w * .58, -h * .66); q.quadraticCurveTo(w * 1.17, -h * .35, w, 5);
    q.lineTo(w * .29, 13); q.lineTo(-w * .14, 10); q.quadraticCurveTo(-w * .79, 10, -w, 1);
  });
  line(ctx, '#b7a587', 1.6, q => {
    q.moveTo(-w * .7, -3); q.quadraticCurveTo(-w * .52, -h * .63, -w * .14, -h * .7);
    q.moveTo(w * .26, -h * .4); q.lineTo(w * .58, -h * .3);
  });
  ctx.restore();
}

function mire(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const p = pose(action, phase);
  trail(ctx, p, '#a16b9b');
  for (const [i, x] of [-52, -25, 21, 50].entries()) {
    const swing = Math.sin(p.time + i * 2.7) * (7 + p.rush * 9);
    thread(ctx, [p.x + x * .72, p.y - 27], [x + swing - p.rush * 12, -3 - Math.max(0, swing) * .45], 15, swing / 8, '#847659');
  }
  ctx.save();
  ctx.translate(p.x - 3, p.y);
  ctx.scale(1 + p.rush * .13, 1 + p.wind * .12 - p.rush * .14);
  shape(ctx, wash(ctx, -84, -4, [[0, '#949276'], [.38, '#776a6a'], [.77, '#66495d'], [1, '#493747']]), 3.8, q => {
    q.moveTo(-70, -21);
    q.bezierCurveTo(-85, -33, -68, -62, -52, -68);
    q.quadraticCurveTo(-41, -82, -19, -75);
    q.bezierCurveTo(-3, -90, 29, -85, 35, -63);
    q.bezierCurveTo(50, -67, 66, -57, 66, -46);
    q.quadraticCurveTo(80, -43, 77, -27);
    q.quadraticCurveTo(78, -12, 58, -10);
    q.bezierCurveTo(44, -3, 23, -6, 14, -11);
    q.quadraticCurveTo(-14, 2, -40, -9);
    q.quadraticCurveTo(-63, -9, -70, -21);
  });
  shellPlate(ctx, 17, -53, 24, 32, '#8a8376', .18);
  shellPlate(ctx, -10, -57, 26, 37, '#888d71', -.02);
  shellPlate(ctx, -39, -48, 26, 33, '#787c6c', -.2);
  shellPlate(ctx, -57, -33, 17, 22, '#7f8071', -.48);
  shape(ctx, '#b2ad6666', 0, q => {
    q.moveTo(-64, -34); q.quadraticCurveTo(-53, -56, -39, -54);
    q.quadraticCurveTo(-43, -44, -36, -42); q.lineTo(-47, -34); q.quadraticCurveTo(-58, -42, -64, -34);
  });
  shape(ctx, '#392837', 2.4, q => {
    q.moveTo(25, -23);
    q.quadraticCurveTo(38, -18 - p.rush * 13, 67, -25); q.lineTo(72, -19);
    q.quadraticCurveTo(52, -10 + p.rush * 3, 36, -15); q.lineTo(25, -23);
  });
  for (const [x, y] of [[39, -23], [49, -24], [59, -24], [66, -24]]) {
    shape(ctx, '#e9d3a3', 1, q => { q.moveTo(x - 2, y); q.lineTo(x + 3, y); q.lineTo(x + 1, y + 4); });
  }
  eye(ctx, 52, -40, 10.8 + p.wind, 6.3, '#e5dc69', .9);
  eye(ctx, 34, -42, 5.1, 3.7, '#e5dc69', .85);
  boils(ctx, [[-31, -25, 4.4], [-15, -28, 5.4], [-6, -17, 3.4], [6, -27, 3.7]], '#b4c465', p.wind);
  ctx.restore();
}

export const blightedOptions = [
  { name: 'Lantern Maw', description: 'A bright cyclops eye, curling tentacles, and a slick plum mantle.', draw: lantern },
  { name: 'Carrion Crown', description: 'An upright fungus husk with a bone mask and a crown of shelf mushrooms.', draw: crown },
  { name: 'Mire Colossus', description: 'A low, armored crawler with uneven stone plates and a cluster of sickly eyes.', draw: mire },
] as const;
