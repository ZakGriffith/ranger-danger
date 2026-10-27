import { ellipse, poly, type HdDraw, type HdPut, type Paint } from './hd';

export const TOAD_IDLE_FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'idle4', 'idle5', 'idle6', 'idle7'] as const;
export const TOAD_HOP_FRAMES = ['hop0', 'hop1', 'hop2', 'hop3', 'hop4', 'hop5', 'hop6', 'hop7', 'hop8', 'hop9', 'hop10', 'hop11'] as const;
export const TOAD_ATTACK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'atk6', 'atk7', 'atk8', 'atk9'] as const;
export const TOAD_FRAMES = [...TOAD_IDLE_FRAMES, ...TOAD_HOP_FRAMES, ...TOAD_ATTACK_FRAMES, 'hit'] as const;
export const TOAD_IDLE_FPS = 8;
export const TOAD_ATTACK_FPS = 30;
export const TOAD_ATTACK_RELEASE_MS = 200;
export const TOAD_SPIT_ORIGIN = { x: 61, y: 38 } as const;
export type ToadFrame = typeof TOAD_FRAMES[number];

type Point = readonly [number, number];
type Transform = (x: number, y: number) => Point;
type Pen = { put: HdPut; pose: Transform };
type HopPose = { y: number; squash: number; hind: Point; front: Point };
type AttackPose = { x: number; y: number; headX: number; headY: number; throat: number; gape: number };

const HOP: readonly HopPose[] = [
  { y: 1, squash: 0.96, hind: [0, 0], front: [0, 0] },
  { y: 3, squash: 0.88, hind: [-1, 0], front: [-1, 0] },
  { y: 2, squash: 0.94, hind: [-2, 0], front: [0, -1] },
  { y: -2, squash: 1.03, hind: [-4, 0], front: [2, -5] },
  { y: -6, squash: 1.02, hind: [-3, -3], front: [2, -10] },
  { y: -9, squash: 1, hind: [1, -9], front: [-1, -13] },
  { y: -10, squash: 1, hind: [5, -12], front: [-3, -13] },
  { y: -8, squash: 1, hind: [6, -10], front: [1, -9] },
  { y: -4, squash: 1, hind: [4, -6], front: [4, -3] },
  { y: 1, squash: 0.94, hind: [2, -2], front: [3, 0] },
  { y: 2, squash: 0.92, hind: [1, 0], front: [1, 0] },
  { y: 0, squash: 1, hind: [0, 0], front: [0, 0] },
];
const ATTACK: readonly AttackPose[] = [
  { x: 0, y: 0, headX: 0, headY: 0, throat: 0, gape: 0 },
  { x: 0, y: 0, headX: 0, headY: -1, throat: 2, gape: 0 },
  { x: -1, y: 0, headX: 0, headY: -1, throat: 4, gape: 0 },
  { x: -1, y: 1, headX: 0, headY: -1, throat: 6, gape: 0 },
  { x: -1, y: 1, headX: 0, headY: -2, throat: 8, gape: 1 },
  { x: 0, y: 0, headX: 0, headY: -1, throat: 7, gape: 4 },
  { x: 1, y: 0, headX: 1, headY: -1, throat: 2, gape: 7 },
  { x: -1, y: 1, headX: 0, headY: 0, throat: 1, gape: 3 },
  { x: 0, y: 1, headX: 0, headY: 0, throat: 0, gape: 1 },
  { x: 0, y: 0, headX: 0, headY: 0, throat: 0, gape: 0 },
];

function polygon(pen: Pen, points: readonly Point[], color: Paint) {
  // Fill posed shapes rather than moving source pixels, so a stretched leg stays solid.
  poly(pen.put, points.map(([x, y]) => pen.pose(x, y)), color);
}

function rectangle(pen: Pen, x: number, y: number, w: number, h: number, color: Paint) {
  polygon(pen, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color);
}

function oval(pen: Pen, x: number, y: number, rx: number, ry: number, color: Paint) {
  const [cx, cy] = pen.pose(x, y);
  const [left, top] = pen.pose(x - rx, y - ry);
  const [right, bottom] = pen.pose(x + rx, y + ry);
  ellipse(pen.put, cx, cy, (right - left) / 2, (bottom - top) / 2, color);
}

function legPose(body: Transform, hipY: number, footY: number, foot: Point): Transform {
  return (x, y) => {
    const weight = Math.max(0, Math.min(1, (y - hipY) / (footY - hipY)));
    const [bx, by] = body(x, y);
    return [x + (bx - x) * (1 - weight) + foot[0] * weight, y + (by - y) * (1 - weight) + foot[1] * weight];
  };
}

const C = {
  edge: '#322c3b', deep: '#493b50', shade: '#665169', hide: '#836c86',
  light: '#a38ca1', ridge: '#b9a3b4', rustDark: '#734b40', rust: '#a46b4d',
  rustLight: '#c59061', rustRidge: '#d5ae79', gills: '#86554a',
  bellyDark: '#78674d', belly: '#a68d5f', bellyLight: '#c4ad7d',
  toe: '#9a8393', eye: '#e2b367', eyeLight: '#f2d18f',
} as const;

function drawFarHind(pen: Pen) {
  polygon(pen, [[30, 36], [37, 36], [41, 42], [40, 48], [44, 50], [46, 53], [34, 53], [32, 50], [34, 45]], C.edge);
  polygon(pen, [[32, 38], [36, 38], [39, 43], [38, 48], [42, 50], [43, 52], [35, 52], [34, 50], [36, 45]], C.shade);
}

function drawFarFront(pen: Pen) {
  polygon(pen, [[49, 36], [53, 37], [54, 43], [52, 48], [57, 50], [58, 52], [48, 52], [47, 49]], C.edge);
  polygon(pen, [[50, 38], [52, 39], [52, 43], [50, 48], [55, 50], [55, 51], [49, 51], [49, 47]], C.shade);
}

function drawBody(pen: Pen) {
  polygon(pen, [[6, 35], [8, 29], [13, 24], [17, 21], [23, 19], [31, 19], [39, 21], [45, 25], [49, 32], [49, 39], [45, 45], [39, 48], [26, 49], [16, 47], [9, 43]], C.edge);
  polygon(pen, [[7, 35], [9, 30], [14, 25], [18, 22], [24, 20], [31, 20], [38, 22], [44, 26], [48, 33], [47, 39], [44, 44], [38, 47], [26, 48], [17, 46], [10, 42]], C.hide);
  polygon(pen, [[8, 36], [16, 34], [23, 36], [28, 37], [36, 34], [43, 31], [48, 33], [47, 39], [44, 44], [38, 47], [27, 48], [17, 46], [10, 42]], C.shade);
  polygon(pen, [[10, 30], [14, 26], [19, 23], [25, 21], [31, 21], [37, 23], [40, 27], [35, 28], [31, 26], [26, 27], [22, 29], [16, 29], [13, 33]], C.light);
  polygon(pen, [[15, 26], [19, 23], [25, 21], [31, 21], [30, 23], [25, 23], [22, 25], [18, 26]], C.ridge);
  polygon(pen, [[26, 34], [32, 32], [38, 32], [43, 35], [44, 40], [40, 44], [34, 46], [28, 44]], C.bellyDark);
  polygon(pen, [[30, 34], [35, 33], [40, 35], [42, 39], [39, 42], [34, 44], [30, 43]], C.belly);
  polygon(pen, [[31, 35], [35, 34], [39, 36], [39, 38], [35, 40], [32, 39]], C.bellyLight);
}

function drawHind(pen: Pen) {
  polygon(pen, [[13, 37], [18, 33], [24, 33], [29, 37], [30, 42], [27, 46], [22, 49], [18, 51], [24, 52], [27, 54], [26, 56], [9, 56], [6, 54], [7, 51], [11, 47], [9, 42]], C.edge);
  polygon(pen, [[14, 38], [19, 34], [24, 34], [28, 38], [29, 42], [26, 45], [21, 48], [15, 51], [17, 53], [24, 53], [25, 55], [10, 55], [7, 54], [8, 51], [13, 46], [11, 42]], C.hide);
  polygon(pen, [[15, 37], [19, 35], [23, 35], [26, 37], [27, 41], [24, 44], [19, 44], [15, 42]], C.light);
  polygon(pen, [[17, 37], [20, 35], [23, 35], [25, 37], [23, 38], [19, 39], [16, 40]], C.ridge);
  polygon(pen, [[25, 41], [28, 41], [26, 45], [21, 48], [15, 51], [17, 53], [24, 53], [25, 55], [11, 55], [10, 53], [14, 49], [19, 47], [22, 44]], C.shade);
  polygon(pen, [[11, 50], [16, 47], [21, 45], [24, 42], [25, 43], [23, 46], [18, 48], [13, 51], [11, 53], [9, 53]], C.light);
  rectangle(pen, 17, 54, 3, 1, C.toe);
  rectangle(pen, 22, 54, 3, 1, C.toe);
  rectangle(pen, 20, 55, 1, 1, C.edge);
}

function drawFront(pen: Pen) {
  polygon(pen, [[40, 31], [46, 32], [49, 37], [47, 43], [46, 48], [49, 51], [52, 53], [52, 55], [40, 55], [37, 53], [38, 48], [40, 43], [38, 38]], C.edge);
  polygon(pen, [[41, 33], [45, 33], [47, 37], [45, 43], [44, 49], [47, 52], [50, 53], [50, 54], [41, 54], [38, 52], [40, 47], [42, 42], [40, 38]], C.hide);
  polygon(pen, [[41, 34], [44, 34], [45, 37], [43, 40], [41, 39]], C.light);
  polygon(pen, [[43, 41], [45, 40], [44, 45], [43, 49], [46, 52], [49, 53], [45, 53], [40, 51], [41, 47]], C.shade);
  polygon(pen, [[41, 43], [43, 42], [42, 47], [41, 50], [43, 52], [40, 52], [40, 49]], C.light);
  rectangle(pen, 43, 53, 2, 1, C.toe);
  rectangle(pen, 48, 53, 2, 1, C.toe);
  rectangle(pen, 46, 54, 1, 1, C.edge);
}

function drawHead(pen: Pen, mouth: Pen, gape: number, blink: boolean) {
  polygon(pen, [[39, 25], [42, 22], [47, 22], [50, 25], [54, 28], [58, 31], [60, 35], [59, 40], [55, 43], [48, 44], [42, 41], [38, 36], [37, 30]], C.edge);
  polygon(pen, [[40, 26], [43, 23], [47, 23], [49, 26], [53, 29], [57, 32], [59, 35], [58, 39], [54, 42], [48, 43], [43, 40], [39, 35], [38, 30]], C.hide);
  polygon(pen, [[40, 27], [43, 24], [47, 24], [49, 27], [52, 29], [55, 32], [51, 33], [46, 31], [42, 32], [39, 30]], C.light);
  polygon(pen, [[41, 26], [43, 24], [46, 24], [46, 25], [43, 27]], C.ridge);
  polygon(pen, [[40, 34], [44, 35], [50, 34], [58, 35], [58, 39], [54, 42], [48, 43], [43, 40]], C.bellyDark);
  polygon(pen, [[43, 37], [48, 38], [54, 37], [58, 36], [57, 39], [53, 41], [48, 42], [44, 40]], C.belly);
  polygon(pen, [[46, 39], [50, 39], [55, 38], [56, 39], [52, 41], [48, 41]], C.bellyLight);
  if (gape === 0) {
    polygon(pen, [[41, 34], [45, 35], [51, 35], [56, 34], [59, 34], [59, 36], [55, 36], [51, 37], [45, 37], [42, 36]], C.deep);
    rectangle(pen, 47, 35, 6, 1, C.ridge);
    rectangle(pen, 54, 34, 4, 1, C.ridge);
  } else {
    polygon(mouth, [[41, 34], [47, 35], [54, 34], [60, 34], [59, 36 + gape], [54, 38 + gape], [48, 38 + gape], [43, 36 + gape * 0.5]], C.edge);
    polygon(mouth, [[44, 36], [49, 37], [55, 36], [59, 35], [57, 36 + gape], [53, 37 + gape], [48, 37 + gape]], C.deep);
    polygon(mouth, [[48, 36 + gape], [53, 35 + gape], [56, 36 + gape], [53, 37 + gape], [49, 37 + gape]], C.gills);
    polygon(mouth, [[42, 34], [47, 35], [54, 34], [59, 33], [59, 34], [54, 35], [47, 36], [43, 35]], C.ridge);
  }
  rectangle(pen, 56, 31, 2, 1, C.deep);
  polygon(pen, [[44, 27], [47, 26], [50, 28], [50, 31], [45, 31], [43, 29]], C.deep);
  rectangle(pen, 45, 28, 4, 2, C.eye);
  rectangle(pen, 45, 28, 2, 1, C.eyeLight);
  rectangle(pen, 46, 29, 3, 1, C.edge);
  polygon(pen, [[42, 27], [45, 25], [48, 26], [50, 28], [46, 27], [43, 28]], C.hide);
  if (blink) {
    polygon(pen, [[44, 27], [48, 27], [50, 29], [49, 31], [45, 30]], C.hide);
    polygon(pen, [[44, 28], [47, 29], [50, 29], [49, 30], [46, 30]], C.deep);
  }
}

function drawSpores(pen: Pen) {
  polygon(pen, [[11, 27], [10, 23], [13, 20], [17, 20], [20, 22], [21, 26], [18, 29], [14, 29]], C.rustDark);
  polygon(pen, [[11, 23], [13, 21], [17, 21], [19, 23], [19, 25], [15, 27], [12, 26]], C.rust);
  polygon(pen, [[12, 23], [14, 21], [17, 21], [18, 23], [15, 24]], C.rustLight);
  rectangle(pen, 13, 25, 5, 1, C.rustRidge);

  polygon(pen, [[18, 22], [17, 17], [20, 14], [25, 13], [30, 15], [32, 19], [31, 23], [26, 26], [21, 25]], C.rustDark);
  polygon(pen, [[18, 18], [21, 15], [25, 14], [29, 16], [31, 19], [29, 22], [25, 24], [21, 23]], C.rust);
  polygon(pen, [[19, 18], [21, 16], [25, 15], [28, 16], [29, 18], [25, 19], [21, 20]], C.rustLight);
  polygon(pen, [[21, 16], [25, 15], [27, 16], [25, 17], [22, 17]], C.rustRidge);
  polygon(pen, [[19, 21], [24, 22], [29, 20], [30, 21], [26, 24], [22, 24]], C.gills);
  polygon(pen, [[19, 20], [23, 21], [27, 20], [30, 18], [31, 19], [28, 22], [23, 23], [20, 22]], C.rustLight);

  polygon(pen, [[29, 24], [29, 19], [32, 16], [36, 16], [40, 19], [41, 23], [38, 27], [33, 28]], C.rustDark);
  polygon(pen, [[30, 20], [33, 17], [36, 17], [39, 20], [39, 23], [36, 25], [32, 25]], C.rust);
  polygon(pen, [[31, 20], [33, 18], [36, 18], [38, 20], [35, 21], [32, 22]], C.rustLight);
  rectangle(pen, 33, 18, 3, 1, C.rustRidge);
  polygon(pen, [[31, 23], [35, 23], [39, 21], [39, 23], [36, 25], [33, 26]], C.rustLight);
  rectangle(pen, 33, 26, 3, 1, C.gills);

  oval(pen, 31, 30, 3, 2, C.deep);
  oval(pen, 30, 29, 3, 2, C.rust);
  rectangle(pen, 28, 28, 3, 1, C.rustLight);
  oval(pen, 35, 29, 2, 2, C.rustDark);
  rectangle(pen, 34, 27, 2, 1, C.rustLight);
  rectangle(pen, 13, 32, 3, 1, C.hide);
  rectangle(pen, 18, 30, 3, 1, C.ridge);
  rectangle(pen, 23, 29, 2, 1, C.light);
}

export function drawToad(frame: ToadFrame): HdDraw {
  return put => {
    const hop = frame.startsWith('hop') ? HOP[Number(frame.slice(3))] : undefined;
    const attack = frame.startsWith('atk') ? ATTACK[Number(frame.slice(3))] : undefined;
    const idle = frame.startsWith('idle') ? Number(frame.slice(4)) : 0;
    const breath = frame.startsWith('idle') ? [0, 0.5, 1, 1.5, 1, 0.5, 0, 0][idle] : 0;
    const hit = frame === 'hit';
    const bx = attack?.x ?? (hit ? -1 : 0);
    const by = hop?.y ?? attack?.y ?? (hit ? 1 : 0);
    const squash = hop?.squash ?? 1;
    const body: Transform = (x, y) => [x + bx, 40 + (y - 40) * squash + by];
    const head: Transform = (x, y) => {
      const [px, py] = body(x, y);
      return [px + (attack?.headX ?? 0), py + (attack?.headY ?? 0)];
    };
    const face: Transform = (x, y) => {
      const [px, py] = head(x, y);
      const throat = Math.max(0, Math.min(1, (y - 36) / 8));
      const jaw = Math.max(0, Math.min(1, (y - 34) / 6));
      const inflation = attack?.throat ?? breath;
      return [px - inflation * 0.14 * throat, py + inflation * 0.7 * throat + (attack?.gape ?? 0) * jaw];
    };
    const belly: Transform = (x, y) => {
      const [px, py] = body(x, y);
      return [px, py + breath * Math.max(0, Math.min(1, (y - 32) / 15))];
    };
    const hind = hop?.hind ?? [0, 0];
    const front = hop?.front ?? [0, 0];
    drawFarHind({ put, pose: legPose(body, 36, 53, [hind[0] * 0.7, hind[1] * 0.8]) });
    drawFarFront({ put, pose: legPose(body, 36, 52, [front[0] * 0.7, front[1] * 0.8]) });
    drawBody({ put, pose: belly });
    drawHind({ put, pose: legPose(body, 33, 56, hind) });
    drawFront({ put, pose: legPose(body, 31, 55, front) });
    drawHead({ put, pose: face }, { put, pose: head }, attack?.gape ?? 0, idle === 6 || hit);
    drawSpores({ put, pose: body });
  };
}
