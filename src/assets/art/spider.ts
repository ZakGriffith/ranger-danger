import type { HdDraw, HdPut } from './hd';

export const SPIDER_MOVE_FRAMES = ['move0', 'move1', 'move2', 'move3', 'move4', 'move5', 'move6', 'move7', 'move8', 'move9', 'move10', 'move11'] as const;
export const SPIDER_ATK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'atk6', 'atk7'] as const;
export const SPIDER_FRAMES = [...SPIDER_MOVE_FRAMES, ...SPIDER_ATK_FRAMES, 'hit', 'die0', 'die1', 'die2', 'die3'] as const;
export type SpiderFrame = typeof SPIDER_FRAMES[number];

type Point = readonly [number, number];
type Color = `#${string}`;
type Leg = readonly [root: Point, knee: Point, toe: Point];

const C = {
  deepest: '#251c20', dark: '#422b29', shade: '#644032', base: '#8c5538',
  warm: '#ab7046', light: '#d09861', cream: '#e7ba7c',
  far: '#594139', farLight: '#85624a', fang: '#e6d5a6',
  fangShade: '#a78d69', eye: '#21191d', glint: '#fff1ca',
} as const;

const FAR_LEGS: readonly Leg[] = [
  [[34, 31], [20, 22], [8, 44]],
  [[38, 30], [31, 20], [26, 44]],
  [[41, 31], [45, 22], [48, 44]],
  [[44, 32], [54, 26], [59, 46]],
];
const NEAR_LEGS: readonly Leg[] = [
  [[33, 36], [21, 33], [7, 52]],
  [[37, 38], [31, 35], [24, 55]],
  [[41, 38], [45, 35], [44, 56]],
  [[45, 36], [53, 35], [59, 53]],
];

type StrikePose = readonly [shift: number, rise: number, lift: number, reach: number, gape: number];
const STRIKE: readonly StrikePose[] = [
  [0, -1, 2, -1, 0], [-1, -2, 5, -2, 1], [-2, -3, 8, -2, 2],
  [0, -2, 6, 0, 2], [3, 0, 2, 2, 0], [2, 1, 0, 1, 0],
  [1, 1, 0, 0, 0], [0, 0, 0, 0, 0],
];

function oval(put: HdPut, cx: number, cy: number, rx: number, ry: number, color: Color) {
  for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.ceil(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, color);
    }
  }
}

function polygon(put: HdPut, points: readonly Point[], color: Color) {
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));
  for (let y = minY; y <= maxY; y++) {
    const crossings: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) crossings.push(ax + (y - ay) * (bx - ax) / (by - ay));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i < crossings.length; i += 2) {
      for (let x = Math.ceil(crossings[i]); x <= Math.floor(crossings[i + 1]); x++) put(x, y, color);
    }
  }
}

function stroke(put: HdPut, a: Point, b: Point, startWidth: number, endWidth: number, color: Color) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const radius = (startWidth + (endWidth - startWidth) * t) / 2;
    oval(put, Math.round(a[0] + dx * t), Math.round(a[1] + dy * t), radius, radius, color);
  }
}

function translate(put: HdPut, dx: number, dy: number): HdPut {
  // Translate finished pixel clusters together so their shading cannot crawl between poses.
  return (x, y, color) => put(x + dx, y + dy, color);
}

function drawLeg(put: HdPut, root: Point, knee: Point, toe: Point, far: boolean) {
  const shade = far ? C.deepest : C.dark;
  const base = far ? C.far : C.base;
  const light = far ? C.farLight : C.light;
  stroke(put, root, knee, 4, 4, shade);
  stroke(put, knee, toe, 4, 1, shade);
  stroke(put, [root[0], root[1] - 1], [knee[0], knee[1] - 1], 2, 2, base);
  stroke(put, [knee[0], knee[1]], [toe[0], toe[1] - 2], 2, 1, base);
  oval(put, knee[0] - 1, knee[1] - 1, 2, 1, light);
  const t = 0.68;
  oval(put, Math.round(knee[0] + (toe[0] - knee[0]) * t), Math.round(knee[1] + (toe[1] - knee[1]) * t), 1, 1, far ? C.farLight : C.warm);
}

function drawAbdomen(put: HdPut) {
  oval(put, 22, 30, 16, 13, C.dark);
  oval(put, 21, 28, 15, 12, C.base);
  polygon(put, [[8, 24], [10, 20], [16, 17], [23, 17], [29, 19], [32, 23], [25, 22], [20, 20], [15, 21], [11, 25]], C.warm);
  polygon(put, [[10, 22], [13, 19], [19, 17], [25, 18], [24, 19], [18, 19], [15, 21]], C.light);
  polygon(put, [[8, 29], [11, 33], [15, 35], [22, 35], [27, 32], [31, 27], [34, 29], [32, 36], [27, 40], [18, 41], [12, 37]], C.shade);
  polygon(put, [[14, 26], [16, 24], [20, 25], [22, 28], [18, 29], [14, 28]], C.shade);
  polygon(put, [[25, 25], [28, 25], [30, 28], [28, 30], [25, 29]], C.shade);
  stroke(put, [12, 23], [15, 22], 1, 1, C.cream);
  stroke(put, [17, 20], [20, 20], 1, 1, C.light);
  put(8, 23, C.light); put(10, 20, C.light); put(14, 17, C.warm);
  put(22, 16, C.warm); put(28, 18, C.warm);
}

function drawCarapace(put: HdPut) {
  oval(put, 39, 34, 12, 9, C.dark);
  oval(put, 40, 32, 11, 7, C.base);
  polygon(put, [[31, 29], [35, 26], [42, 26], [47, 28], [49, 30], [41, 29], [37, 31], [31, 32]], C.warm);
  stroke(put, [35, 27], [42, 27], 1, 1, C.light);
  polygon(put, [[31, 34], [34, 33], [37, 35], [41, 34], [45, 36], [47, 39], [40, 41], [33, 40]], C.shade);
}

function drawFace(put: HdPut, gape: number) {
  oval(put, 49, 33, 4, 4, C.warm);
  oval(put, 49, 34, 3, 3, C.base);
  oval(put, 49, 31, 1.6, 1.6, C.eye);
  oval(put, 52, 32, 1, 1, C.eye);
  put(46, 30, C.eye); put(49, 30, C.glint); put(52, 31, C.cream);
  polygon(translate(put, -gape, 0), [[50, 36], [52, 36], [52, 39], [50, 42], [50, 39]], C.fangShade);
  polygon(translate(put, -gape, 0), [[49, 36], [51, 36], [51, 39], [49, 41]], C.fang);
  polygon(translate(put, gape, -Math.min(1, gape)), [[53, 35], [54, 36], [54, 39], [52, 41], [53, 38]], C.fang);
}

export function drawSpider(frame: SpiderFrame): HdDraw {
  return (pixel) => {
    const move = frame.startsWith('move') ? Number(frame.slice(4)) : -1;
    const attack = frame.startsWith('atk') ? Number(frame.slice(3)) : -1;
    const death = frame.startsWith('die') ? Number(frame.slice(3)) : -1;
    const put: HdPut = frame === 'hit' ? (x, y, color) => pixel(x, y, color === null ? null : '#ffffff') : pixel;
    if (death === 3) {
      for (const [x, y] of [[15, 48], [25, 53], [35, 49], [46, 52]] as const) oval(put, x, y, 1, 1, C.shade);
      return;
    }

    const [dx, attackRise, attackLift, reach, gape] = attack >= 0 ? STRIKE[attack] : [0, 0, 0, 0, 0];
    const phase = move >= 0 ? move / SPIDER_MOVE_FRAMES.length : 0;
    const bob = move >= 0 ? Math.round(Math.sin(phase * Math.PI * 4) * 0.65) : 0;
    const collapse = death >= 0 ? (death + 1) * 3 : 0;
    const bodyY = attackRise + bob + collapse;
    const abdomenY = (attack >= 0 ? Math.round(attackRise / 3) : bob) + collapse;
    const poseLeg = (leg: Leg, index: number, far: boolean) => {
      const [root, knee, toe] = leg;
      let swing = 0, lift = 0;
      if (move >= 0) {
        const step = (phase + (index % 2) / 2 + (far ? 0.5 : 0)) % 1;
        // Feet travel backward while planted, then lift only on the return stroke.
        if (step < 0.6) swing = 2 - 4 * step / 0.6;
        else {
          const recovery = (step - 0.6) / 0.4;
          swing = -2 + recovery * 4;
          lift = Math.sin(recovery * Math.PI) * 3.5;
        }
      }
      if (attack >= 0 && index >= 2) {
        swing = reach;
        lift = attackLift * (far ? 0.5 : 1);
      }
      const curl = death >= 0 ? (death + 1) / 3 : 0;
      const posedRoot: Point = [root[0] + dx, root[1] + bodyY];
      const posedKnee: Point = [
        Math.round(knee[0] + dx * 0.6 + swing * 0.4 + (root[0] - knee[0]) * curl * 0.6),
        Math.round(knee[1] + bodyY * 0.5 - lift * 0.4 + curl * 5),
      ];
      const posedToe: Point = [
        Math.round(toe[0] + swing + (root[0] - toe[0]) * curl * 0.7),
        Math.round(toe[1] - lift - curl * 2),
      ];
      drawLeg(put, posedRoot, posedKnee, posedToe, far);
    };

    FAR_LEGS.forEach((leg, index) => poseLeg(leg, index, true));
    drawAbdomen(translate(put, Math.round(dx * 0.6), abdomenY));
    drawCarapace(translate(put, dx, bodyY));
    NEAR_LEGS.forEach((leg, index) => poseLeg(leg, index, false));
    drawFace(translate(put, dx, bodyY), gape);
  };
}
