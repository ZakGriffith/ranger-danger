import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { CANNON_TOWER_DECK_Y } from './base';

type Tier = 0 | 1 | 2;
type Point = readonly [number, number];
type Fill = string | CanvasGradient;

const PALETTES = [
  {
    stoneLight: '#ceba9a', stone: '#aa917a', shadow: '#7b6b69', deep: '#524752', stoneEdge: '#edd2aa',
    ironLight: '#8b9290', iron: '#616970', ironDark: '#373d48',
    trimLight: '#e3b380', trim: '#a66e54', trimDark: '#6a4746', lamp: '#f5ac66',
  },
  {
    stoneLight: '#839295', stone: '#646f78', shadow: '#46505c', deep: '#373c4d', stoneEdge: '#a6b5ac',
    ironLight: '#aabbb8', iron: '#72888e', ironDark: '#465461',
    trimLight: '#c1ddd6', trim: '#7da3ac', trimDark: '#4e6575', lamp: '#f2c087',
  },
  {
    stoneLight: '#8b7a77', stone: '#625965', shadow: '#504557', deep: '#3b3445', stoneEdge: '#ad9485',
    ironLight: '#a4a39d', iron: '#73737a', ironDark: '#434353',
    trimLight: '#ffdf97', trim: '#c69755', trimDark: '#775341', lamp: '#ffd882',
  },
] as const;

type Palette = typeof PALETTES[Tier];

const FOOTPRINT = [
  [-.46, -.43], [.46, -.43], [1, -.2], [1, .2],
  [.46, .43], [-.46, .43], [-1, .2], [-1, -.2],
] as const;
const FRONT = [6, 5, 4, 3] as const;

function ring(halfWidth: number, centerY: number): Point[] {
  return FOOTPRINT.map(([x, y]) => [x * halfWidth, centerY + y * halfWidth]);
}

function between([ax, ay]: Point, [bx, by]: Point, fraction: number): Point {
  return [ax + (bx - ax) * fraction, ay + (by - ay) * fraction];
}

function frontFaces(ctx: CanvasRenderingContext2D, top: readonly Point[], bottom: readonly Point[], fills: readonly Fill[]) {
  for (const [face, fill] of fills.entries()) {
    const a = FRONT[face], b = FRONT[face + 1];
    polygon(ctx, fill, 1.65, [top[a], top[b], bottom[b], bottom[a]]);
  }
}

function polygon(ctx: CanvasRenderingContext2D, fill: Fill, outline: number, points: readonly Point[]) {
  shape(ctx, fill, outline, p => {
    p.moveTo(...points[0]);
    for (const point of points.slice(1)) p.lineTo(...point);
  });
}

function seam(ctx: CanvasRenderingContext2D, color: string, width: number, ...points: Point[]) {
  line(ctx, color, width, p => {
    p.moveTo(...points[0]);
    for (const point of points.slice(1)) p.lineTo(...point);
  });
}

function rivet(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number, r = 1.8) {
  oval(ctx, x, y, r, r * .88, ink);
  oval(ctx, x - .35, y - .4, r * .62, r * .52, palette.trimLight);
}

function ground(ctx: CanvasRenderingContext2D) {
  const dirt = wash(ctx, -26, 14, [[0, '#745841'], [.58, '#896649'], [1, '#9a7654']]);
  shape(ctx, dirt, 0, p => {
    p.moveTo(-51, -31);
    p.quadraticCurveTo(-59, -31, -60, -24);
    p.quadraticCurveTo(-60, -20, -62, -16);
    p.quadraticCurveTo(-64, -11, -61, -6);
    p.quadraticCurveTo(-60, 0, -53, 1.5);
    p.quadraticCurveTo(-49, 5, -43, 5.5);
    p.quadraticCurveTo(-40, 9, -34, 8.5);
    p.quadraticCurveTo(-30, 12.5, -23, 12);
    p.quadraticCurveTo(-18, 15, -11, 13.5);
    p.quadraticCurveTo(-4, 12, 1, 14);
    p.quadraticCurveTo(8, 15.2, 14, 12.8);
    p.quadraticCurveTo(23, 14.5, 29, 11.5);
    p.quadraticCurveTo(36, 10.8, 40, 7.2);
    p.quadraticCurveTo(47, 6.3, 51, 2.6);
    p.quadraticCurveTo(58, 1.4, 60, -3.2);
    p.quadraticCurveTo(64, -8, 62, -14);
    p.quadraticCurveTo(64, -21, 59, -25);
    p.quadraticCurveTo(56, -32, 49, -30);
    p.quadraticCurveTo(0, -39, -51, -31);
  });
  for (const [x, y, width, color] of [
    [-58, -20, 1.65, '#b08a61'], [-59, -8, 1.4, '#6a5040'], [-49, 1.5, 1.85, '#b48e61'],
    [-36, 6.2, 1.4, '#b08a61'], [-23, 10.5, 1.65, '#b48e61'], [-8, 10.2, 1.6, '#77543e'],
    [6, 12, 1.45, '#b48e61'], [19, 10.5, 1.9, '#b08a61'], [34, 7.6, 1.4, '#77543e'],
    [46, 3.5, 1.8, '#b48e61'], [58, -4.4, 1.45, '#b08a61'], [59, -18, 1.5, '#6a5040'],
  ] as const) {
    oval(ctx, x, y, width, .72, color);
  }
}

function masonry(ctx: CanvasRenderingContext2D, palette: Palette) {
  const footing = ring(55, -27);
  const foot = ring(55, -16);
  polygon(ctx, palette.stone, 2.35, footing);
  frontFaces(ctx, footing, foot, [palette.stone, palette.shadow, palette.deep]);
  const footJoint = between(footing[5], footing[4], .78);
  seam(ctx, palette.deep, 1.5, footJoint, between(foot[5], foot[4], .77));
  const [lx, ly] = between(footing[6], footing[5], .22);
  const [rx, ry] = between(footing[6], footing[5], .84);
  seam(ctx, palette.stoneEdge, 1.1, [lx, ly + 2.2], [rx, ry + 2.2]);

  const course = (height: number) => ring(43 + 5 * height, -84 + 51 * height);
  const crown = course(0);
  const base = course(1);
  polygon(ctx, palette.deep, 3, [...FRONT.map(i => crown[i]), ...[...FRONT].reverse().map(i => base[i])]);
  frontFaces(ctx, crown, base, [
    wash(ctx, -72, -14, [[0, palette.stoneLight], [1, palette.stone]]),
    wash(ctx, -64, -12, [[0, palette.stoneLight], [.45, palette.stone], [1, palette.shadow]]),
    wash(ctx, -73, -16, [[0, palette.stone], [.57, palette.shadow], [1, palette.deep]]),
  ]);
  const rises = [.25, .45, .64, .82, 1];
  const joints = [[.56, .32, .72], [.37, .71, .48], [.68, .39, .62], [.44, .70, .37]];
  for (const [row, widths] of joints.entries()) {
    const upper = course(rises[row]);
    const lower = course(rises[row + 1]);
    seam(ctx, palette.deep, 1.65, ...FRONT.map(i => upper[i]));
    for (const [face, joint] of widths.entries()) {
      const a = FRONT[face], b = FRONT[face + 1];
      const [x, y] = between(upper[a], upper[b], joint);
      seam(ctx, palette.deep, 1.4, [x, y], between(lower[a], lower[b], joint + .025));
      if (face < 2) {
        const [ex, ey] = between(upper[a], upper[b], joint + .16);
        seam(ctx, palette.stoneEdge, 1.15, [x + 2.2, y + 2.4], [ex + 1.2, ey + 2.5]);
      }
    }
  }
}

function stoneDoor(ctx: CanvasRenderingContext2D, palette: Palette) {
  const surround = wash(ctx, -41, 3, [[0, palette.stoneLight], [.6, palette.stone], [1, palette.shadow]]);
  polygon(ctx, surround, 2.45, [[-17, 2], [-18, -29], [-10, -39], [9, -39], [17, -30], [17, 2]]);
  const wood = wash(ctx, -31, 1, [[0, '#b88150'], [.58, '#8f603e'], [1, '#63483b']]);
  polygon(ctx, wood, 1.7, [[-11, .5], [-12, -27], [-7, -33], [6, -33], [11, -27], [11, .5]]);
  for (const [x, top] of [[-6.2, -32], [-.5, -33], [5.4, -33]]) {
    seam(ctx, '#5c3e37', 1.1, [x, top], [x + .45, -.5]);
  }
  seam(ctx, palette.stoneEdge, 1.3, [-15, -13], [-15.6, -28], [-8.7, -36], [-2, -36]);
  seam(ctx, palette.deep, 1.3, [-17, -29], [-12, -27]);
  seam(ctx, palette.deep, 1.3, [13, -34], [8.2, -30.1]);
  for (const y of [-23, -8]) seam(ctx, '#4b3b39', 2.5, [-11, y], [-4.5, y + .2]);
  oval(ctx, 5.6, -13.1, 2, 2.15, '#4b3b39');
  oval(ctx, 5.3, -13.5, .83, .9, '#e0b881');
}

function faceHardware(ctx: CanvasRenderingContext2D, palette: Palette, tier: 1 | 2) {
  const sideFinish = wash(ctx, -67, -15, [[0, palette.ironLight], [1, palette.ironDark]]);
  polygon(ctx, sideFinish, 1.8, [[-32, -66], [-26, -63], [-27, -21], [-36, -24], [-33, -33]]);
  polygon(ctx, sideFinish, 1.8, [[27, -62], [34, -65], [35, -28], [39, -23], [29, -20]]);
  seam(ctx, palette.trim, tier === 2 ? 2.3 : 1.8, [-30, -61], [-31, -26]);
  seam(ctx, palette.trim, tier === 2 ? 2.3 : 1.8, [30, -59], [33, -25]);
  for (const [x, y] of [[-29, -58], [-31, -29], [30, -57], [33, -28]] as const) rivet(ctx, palette, x, y);

  const trim = wash(ctx, -45, 5, [[0, palette.trimLight], [.42, palette.trim], [1, palette.trimDark]]);
  polygon(ctx, trim, 2.7, [[-18, 4], [-19, -32], [-11, -41], [11, -41], [19, -32], [18, 4]]);
  const plate = wash(ctx, -36, 0, [[0, palette.ironLight], [.35, palette.iron], [1, palette.ironDark]]);
  polygon(ctx, plate, 2, [[-13, 0], [-14, -30], [-8, -36], [8, -36], [14, -30], [13, 0]]);
  seam(ctx, ink, 1.35, [0, -35], [0, -26]);
  seam(ctx, ink, 1.35, [0, -12], [0, -1]);
  for (const y of [-28, -8]) {
    seam(ctx, palette.trimDark, 3, [-16, y], [-9, y + .5]);
    rivet(ctx, palette, -10, y + .4, 1.35);
    rivet(ctx, palette, 15, y, 1.45);
  }
  oval(ctx, 0, -18.6, 7.2, 7.15, ink);
  oval(ctx, 0, -19.1, 5.65, 5.65, palette.trim);
  oval(ctx, 0, -18.9, 3.55, 3.55, palette.ironDark);
  seam(ctx, palette.trimLight, 1.45, [-3.6, -18.9], [3.65, -18.9]);
  seam(ctx, palette.trimLight, 1.45, [0, -22.4], [0, -15.35]);

  polygon(ctx, palette.ironDark, 1.7, [[-10, -49], [10, -49], [7, -44], [-7, -44]]);
  seam(ctx, palette.lamp, tier === 2 ? 2.05 : 1.65, [-5.2, -46.6], [5.2, -46.6]);
  if (tier === 2) {
    for (const x of [-42, 42]) {
      const y = x < 0 ? -37 : -35;
      polygon(ctx, palette.trimDark, 1.5, [[x - 4, y - 5], [x + 4, y - 4], [x + 3, y + 5], [x - 3, y + 4]]);
      seam(ctx, palette.lamp, 1.65, [x, y - 2], [x, y + 2.2]);
    }
  }
}

function deck(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  ctx.save();
  ctx.translate(0, CANNON_TOWER_DECK_Y);
  const stone = tier === 0;
  const highlight = stone ? palette.stoneEdge : palette.ironLight;
  const lit = stone ? palette.stoneLight : palette.ironLight;
  const mid = stone ? palette.stone : palette.iron;
  const dark = stone ? palette.shadow : palette.ironDark;
  const top = ring(51, 0);
  const lip = ring(51, 10);
  frontFaces(ctx, top, lip, [
    wash(ctx, 10, 33, [[0, lit], [1, mid]]),
    wash(ctx, 16, 33, [[0, mid], [1, dark]]),
    dark,
  ]);
  polygon(ctx, wash(ctx, -23, 23, [[0, lit], [.77, mid], [1, dark]]), 2.8, top);
  seam(ctx, highlight, 1.45, [-46, -10], [-23, -19.5], [-6, -19.5]);

  if (stone) {
    const joints = [[6, 5, .44], [5, 4, .36], [5, 4, .72], [4, 3, .56]] as const;
    for (const [a, b, fraction] of joints) {
      const [x, y] = between(top[a], top[b], fraction);
      seam(ctx, palette.deep, 1.4, [x * .79, y * .74], [x, y], between(lip[a], lip[b], fraction + .025));
    }
    seam(ctx, highlight, 1.3, [-47, 11], [-27, 20]);
    seam(ctx, highlight, 1.3, [-19, 24], [-9, 24]);
  } else {
    const trim = ring(49, 7);
    seam(ctx, palette.trim, tier === 2 ? 2.7 : 1.8, ...FRONT.map(i => trim[i]));
    seam(ctx, palette.trimLight, 1.3, trim[6], trim[5], [-8, trim[5][1]]);
    for (const [x, y] of [[-42, 17], [-25, 25], [0, 26], [25, 24], [42, 16]] as const) rivet(ctx, palette, x, y, 1.65);
  }

  shape(ctx, dark, 1.8, p => p.ellipse(0, -1, 38, 15, 0, 0, 2 * Math.PI));
  const bed = stone ? wash(ctx, -14, 15, [[0, '#a47c54'], [1, '#705345']])
    : wash(ctx, -14, 15, [[0, palette.iron], [1, palette.deep]]);
  shape(ctx, bed, 2.2,
    p => p.ellipse(0, -1, 32, 12, 0, 0, 2 * Math.PI));
  if (!stone) {
    line(ctx, palette.trim, 1.7, p => p.ellipse(0, -1, 36, 14, 0, .16 * Math.PI, .87 * Math.PI));
    for (const [x, y] of [[-36, 1], [-25, 10], [24, 10], [36, 1]] as const) rivet(ctx, palette, x, y, 1.55);
  }
  ctx.restore();
}

export function drawFoundryBase(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const palette = PALETTES[tier];
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  ground(ctx);
  masonry(ctx, palette);
  if (tier === 0) stoneDoor(ctx, palette);
  else faceHardware(ctx, palette, tier);
  deck(ctx, palette, tier);
  ctx.restore();
}
