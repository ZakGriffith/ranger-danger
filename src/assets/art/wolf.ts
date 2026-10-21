import { poly, type HdDraw, type HdPut, type Paint } from './hd';

export const WOLF_MOVE_FRAMES = ['move0', 'move1', 'move2', 'move3', 'move4', 'move5', 'move6', 'move7', 'move8', 'move9', 'move10', 'move11', 'move12', 'move13', 'move14', 'move15'] as const;
export const WOLF_ATK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'atk6', 'atk7', 'atk8', 'atk9', 'atk10', 'atk11'] as const;
export const WOLF_FRAMES = [...WOLF_MOVE_FRAMES, ...WOLF_ATK_FRAMES, 'hit', 'die0', 'die1', 'die2', 'die3'] as const;
export const WOLF_MOVE_FPS = 32;
export const WOLF_ATK_FPS = 18;
export type WolfFrame = typeof WOLF_FRAMES[number];

type Point = readonly [number, number];
type Transform = (x: number, y: number) => Point;
type Pen = { put: HdPut; pose: Transform };

const C = {
  edge: '#46505a', deep: '#525e68', shade: '#6c7a84', coat: '#8998a0',
  light: '#a9b5b7', ridge: '#c3ccc5', cream: '#d2d4c2', chest: '#b7c0b6',
  ear: '#8c8b8b', nose: '#28323c', eye: '#dfb566', claw: '#bac1b6',
} as const;

function polygon(pen: Pen, points: readonly Point[], color: Paint) {
  // Transform the shape before filling so bending limbs cannot leave gaps between source pixels.
  poly(pen.put, points.map(([x, y]) => pen.pose(x, y)), color);
}

function pixel(pen: Pen, x: number, y: number, color: Paint) {
  const [px, py] = pen.pose(x, y);
  pen.put(Math.round(px), Math.round(py), color);
}

function rect(pen: Pen, x: number, y: number, w: number, h: number, color: Paint) {
  polygon(pen, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color);
}

function translate(dx: number, dy: number): Transform {
  return (x, y) => [x + dx, y + dy];
}

const RUN_PAW: readonly Point[] = [
  [9, 0], [2, 0], [-5, 0], [-12, 0],
  [-12, 3], [-10, 6], [-8, 9], [-5, 11],
  [-1, 12], [3, 11], [6, 10], [8, 8],
  [9, 6], [9, 4], [9, 2], [9, 1],
];
const RUN_BODY_Y = [2, 3, 3, 2, 1, 0, -1, -1, 1, 2, 3, 3, 2, 1, 0, 0] as const;

function runLeg(frame: number, hipY: number, footY: number, front: boolean, bodyPose: Transform): Transform {
  const [reach, lift] = RUN_PAW[frame % WOLF_MOVE_FRAMES.length];
  return (x, y) => {
    const weight = Math.max(0, Math.min(1, (y - hipY) / (footY - hipY)));
    const [bx, by] = bodyPose(x, y);
    const fold = Math.sin(weight * Math.PI) * lift;
    // Keep contact paws on the ground while the spine flexes above them.
    return [
      x + (bx - x) * (1 - weight) + reach * weight + fold * (front ? -0.3 : 0.25),
      y + (by - y) * (1 - weight) - lift * weight - fold * 0.12,
    ];
  };
}

type BitePose = { bodyX: number; bodyY: number; headX: number; headY: number; gape: number; reach: number };
const BITE: readonly BitePose[] = [
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0, reach: 0 },
  { bodyX: -1, bodyY: 1, headX: -1, headY: 1, gape: 1, reach: -1 },
  { bodyX: -2, bodyY: 1, headX: -3, headY: 0, gape: 3, reach: -2 },
  { bodyX: -2, bodyY: 2, headX: -3, headY: -1, gape: 6, reach: -2 },
  { bodyX: -1, bodyY: 1, headX: -2, headY: 0, gape: 7, reach: -1 },
  { bodyX: 0, bodyY: 0, headX: 0, headY: 1, gape: 5, reach: 1 },
  { bodyX: 1, bodyY: 0, headX: 1, headY: 2, gape: 1, reach: 2 },
  { bodyX: 1, bodyY: 1, headX: 1, headY: 2, gape: 0, reach: 2 },
  { bodyX: 0, bodyY: 1, headX: 0, headY: 1, gape: 0, reach: 1 },
  { bodyX: -1, bodyY: 0, headX: -1, headY: 0, gape: 0, reach: 0 },
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0, reach: 0 },
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0, reach: 0 },
];

function braceLeg(pose: BitePose, hipY: number, footY: number, front: boolean): Transform {
  return (x, y) => {
    const weight = Math.max(0, Math.min(1, (y - hipY) / (footY - hipY)));
    const reach = front ? pose.reach : -pose.reach * 0.4;
    return [x + pose.bodyX * (1 - weight) + reach * weight, y + pose.bodyY * (1 - weight)];
  };
}

function drawFarHind(pen: Pen) {
  polygon(pen, [[24, 34], [28, 34], [30, 39], [27, 44], [29, 49], [33, 50], [34, 52], [27, 52], [25, 48], [23, 44], [26, 39]], C.deep);
  polygon(pen, [[25, 35], [28, 35], [28, 39], [25, 44], [28, 50], [32, 51], [28, 51], [26, 47], [24, 44], [27, 39]], C.shade);
}

function drawFarFront(pen: Pen) {
  polygon(pen, [[43, 31], [47, 32], [48, 40], [47, 48], [51, 49], [52, 51], [45, 51], [44, 47], [44, 40]], C.deep);
  polygon(pen, [[44, 33], [46, 34], [46, 41], [46, 48], [50, 50], [46, 50], [45, 47]], C.shade);
}

function drawTail(pen: Pen) {
  polygon(pen, [[16, 27], [18, 30], [16, 36], [13, 40], [9, 43], [4, 43], [6, 41], [2, 41], [5, 38], [4, 37], [8, 36], [12, 31]], C.shade);
  polygon(pen, [[15, 27], [17, 29], [15, 34], [11, 38], [7, 40], [5, 40], [8, 37], [12, 31]], C.coat);
  polygon(pen, [[15, 27], [16, 29], [13, 33], [11, 35], [8, 37], [10, 33], [12, 29]], C.light);
  polygon(pen, [[12, 39], [9, 42], [4, 43], [7, 41]], C.edge);
}

function drawBody(pen: Pen) {
  polygon(pen, [[14, 26], [18, 23], [24, 23], [29, 24], [34, 22], [38, 20], [42, 21], [46, 25], [47, 31], [44, 36], [39, 39], [34, 37], [29, 35], [24, 37], [19, 37], [15, 33]], C.coat);
  polygon(pen, [[15, 31], [20, 32], [25, 31], [31, 30], [35, 29], [42, 29], [46, 32], [43, 36], [39, 38], [34, 36], [29, 34], [24, 36], [19, 36]], C.shade);
  polygon(pen, [[19, 35], [24, 35], [28, 33], [32, 34], [35, 36], [39, 37], [42, 36], [40, 39], [35, 38], [30, 35], [25, 37], [20, 37]], C.deep);
  polygon(pen, [[15, 26], [18, 23], [24, 23], [29, 24], [34, 22], [38, 20], [41, 21], [38, 24], [34, 25], [30, 27], [25, 26], [21, 27], [18, 28]], C.light);
  polygon(pen, [[18, 23], [22, 23], [25, 24], [28, 24], [32, 23], [34, 22], [38, 20], [40, 21], [36, 23], [33, 24], [28, 25], [23, 24]], C.ridge);
  polygon(pen, [[22, 27], [26, 28], [32, 27], [35, 25], [37, 26], [33, 29], [28, 30], [24, 29]], C.coat);
  polygon(pen, [[34, 25], [38, 23], [41, 24], [43, 27], [42, 32], [39, 34], [36, 32], [38, 28]], C.light);
  polygon(pen, [[38, 27], [41, 27], [41, 30], [39, 32], [37, 31]], C.coat);
}

function drawHind(pen: Pen) {
  polygon(pen, [[17, 32], [22, 31], [26, 35], [25, 40], [21, 44], [20, 49], [24, 51], [25, 54], [16, 54], [16, 51], [18, 46], [19, 42], [16, 39]], C.shade);
  polygon(pen, [[17, 32], [21, 31], [25, 34], [24, 38], [21, 41], [19, 41], [17, 37]], C.coat);
  polygon(pen, [[18, 32], [22, 32], [24, 34], [22, 37], [19, 37]], C.light);
  polygon(pen, [[20, 40], [22, 40], [20, 45], [18, 50], [22, 51], [24, 53], [17, 53], [18, 49]], C.light);
  polygon(pen, [[18, 42], [20, 42], [18, 49], [17, 52], [24, 53], [25, 54], [16, 54], [16, 51]], C.deep);
  rect(pen, 19, 53, 1, 1, C.claw);
  rect(pen, 22, 53, 1, 1, C.claw);
}

function drawFront(pen: Pen) {
  polygon(pen, [[37, 30], [42, 30], [45, 34], [44, 39], [42, 44], [42, 49], [46, 51], [47, 54], [39, 54], [38, 52], [40, 47], [39, 41], [36, 37]], C.shade);
  polygon(pen, [[37, 30], [41, 30], [44, 33], [43, 37], [41, 40], [39, 39], [37, 36]], C.chest);
  polygon(pen, [[39, 32], [42, 32], [42, 36], [40, 38], [38, 35]], C.cream);
  polygon(pen, [[40, 40], [42, 39], [41, 45], [41, 49], [45, 51], [46, 53], [40, 53], [41, 48]], C.light);
  polygon(pen, [[39, 41], [40, 42], [40, 48], [39, 52], [46, 53], [47, 54], [39, 54], [38, 52], [40, 47]], C.deep);
  rect(pen, 42, 53, 1, 1, C.claw);
  rect(pen, 45, 53, 1, 1, C.claw);
}

function drawOpenMuzzle(pen: Pen, gape: number) {
  const jawY = 34 + gape;
  polygon(pen, [[47, 31], [58, 30], [60, 33], [59, jawY - 1], [55, jawY + 1], [50, jawY], [47, 36]], C.nose);
  polygon(pen, [[51, jawY - 2], [56, jawY - 2], [58, jawY - 1], [56, jawY], [52, jawY]], '#9b6d6a');
  polygon(pen, [[48, 34], [51, jawY - 1], [56, jawY], [60, jawY - 2], [59, jawY + 1], [55, jawY + 3], [50, jawY + 2], [47, 37]], C.shade);
  polygon(pen, [[50, jawY], [55, jawY + 1], [59, jawY - 1], [58, jawY + 1], [54, jawY + 2], [51, jawY + 1]], C.chest);
  const upper: Pen = { put: pen.put, pose: (x, y) => pen.pose(x, y - Math.round(gape / 4)) };
  polygon(upper, [[47, 29], [51, 28], [56, 28], [60, 29], [61, 31], [59, 33], [54, 34], [49, 33]], C.cream);
  polygon(upper, [[48, 32], [53, 32], [58, 31], [59, 32], [55, 34], [49, 34]], C.shade);
  polygon(upper, [[57, 29], [61, 29], [61, 31], [59, 33], [57, 31]], C.nose);
  rect(upper, 58, 29, 2, 1, C.shade);
  if (gape >= 3) {
    polygon(upper, [[55, 33], [58, 33], [57, 36], [56, 35]], '#eee6cf');
    pixel(upper, 51, 33, '#eee6cf');
    polygon(pen, [[55, jawY], [56, jawY - 3], [58, jawY - 1], [57, jawY + 1]], '#eee6cf');
  }
}

function drawHead(pen: Pen, gape: number) {
  polygon(pen, [[44, 23], [46, 15], [48, 11], [49, 18], [52, 23]], C.shade);
  polygon(pen, [[46, 21], [47, 15], [48, 13], [49, 20]], C.light);
  const muzzle: readonly Point[] = gape > 0
    ? [[52, 29], [51, 34]]
    : [[54, 28], [58, 28], [61, 30], [60, 33], [56, 35], [52, 35]];
  polygon(pen, [[37, 25], [40, 22], [44, 21], [49, 22], [52, 25], ...muzzle, [48, 37], [44, 39], [41, 38], [39, 39], [39, 36], [36, 35], [38, 32], [36, 30]], C.coat);
  polygon(pen, [[38, 25], [41, 22], [45, 21], [49, 22], [51, 24], [50, 26], [46, 26], [43, 28], [40, 28]], C.light);
  polygon(pen, [[41, 22], [45, 21], [48, 22], [46, 23], [43, 24], [41, 26], [39, 25]], C.ridge);
  polygon(pen, [[38, 31], [42, 29], [46, 30], [48, 32], [46, 35], [43, 37], [40, 37], [41, 34], [38, 35]], C.chest);
  polygon(pen, [[40, 31], [43, 30], [46, 31], [45, 33], [42, 35], [40, 34]], C.cream);
  if (gape > 0) drawOpenMuzzle(pen, gape);
  else {
    polygon(pen, [[48, 29], [52, 29], [56, 29], [59, 30], [59, 33], [55, 34], [51, 34], [47, 36], [45, 36]], C.cream);
    polygon(pen, [[47, 34], [51, 32], [56, 32], [58, 31], [58, 33], [54, 34], [50, 34], [47, 36]], C.shade);
    polygon(pen, [[48, 35], [52, 33], [57, 33], [56, 34], [52, 35], [48, 37], [45, 38]], C.edge);
    polygon(pen, [[50, 33], [54, 33], [56, 34], [52, 35], [48, 36]], C.chest);
    polygon(pen, [[57, 29], [61, 29], [61, 31], [59, 33], [57, 31]], C.nose);
    rect(pen, 58, 29, 2, 1, C.shade);
  }
  polygon(pen, [[39, 25], [40, 18], [42, 13], [43, 10], [45, 17], [47, 23], [44, 26]], C.light);
  polygon(pen, [[43, 12], [44, 18], [46, 23], [44, 24], [42, 23], [42, 19]], C.shade);
  polygon(pen, [[43, 16], [44, 20], [45, 23], [43, 22]], C.ear);
  rect(pen, 47, 26, 4, 2, C.edge);
  rect(pen, 49, 27, 2, 1, C.eye);
  pixel(pen, 51, 27, C.nose);
  pixel(pen, 48, 25, C.ridge);
}

function outlined(draw: (put: HdPut) => void, dir: 'r' | 'l', flash: boolean): HdDraw {
  return put => {
    const pixels = new Map<number, Paint>();
    draw((x, y, color) => { if (color !== null) pixels.set(y * 64 + x, color); });
    // Outline only the finished silhouette so overlapping legs and fur stay light.
    const border = new Set<number>();
    for (const index of pixels.keys()) {
      for (const neighbor of [index - 64, index + 64, index - 1, index + 1]) {
        if (!pixels.has(neighbor)) border.add(neighbor);
      }
    }
    const output = (index: number, color: Paint) => {
      const x = index % 64;
      put(dir === 'l' ? 63 - x : x, Math.floor(index / 64), color);
    };
    for (const index of border) {
      output(index, pixels.has(index - 64) ? '#34404b' : pixels.has(index + 64) ? '#53616d' : '#3c4854');
    }
    for (const [index, color] of pixels) output(index, flash ? '#ffffff' : color);
  };
}

function renderWolf(frame: WolfFrame | 'idle', dir: 'r' | 'l'): HdDraw {
  return outlined(put => {
    const move = frame.startsWith('move') ? Number(frame.slice(4)) : -1;
    const attack = frame.startsWith('atk') ? Number(frame.slice(3)) : -1;
    const death = frame.startsWith('die') ? Number(frame.slice(3)) : -1;
    if (death === 3) {
      for (const [x, y] of [[16, 53], [25, 52], [38, 54], [49, 52]] as const) {
        put(x, y, C.shade);
        put(x + 1, y, C.light);
      }
      return;
    }

    const moving = move >= 0;
    const phase = moving ? move / WOLF_MOVE_FRAMES.length : 0;
    const bite = BITE[attack >= 0 ? attack : 0];
    const bodyY = moving ? RUN_BODY_Y[move] : bite.bodyY;
    const stretch = moving ? 1.03 + Math.sin((phase - 0.125) * Math.PI * 2) * 0.05 : 1;
    const bodyPose: Transform = (x, y) => [30 + (x - 30) * stretch + bite.bodyX, y + bodyY];
    const collapse: Transform = death >= 0
      ? (x, y) => [32 + (x - 32) * (1 - death * 0.08), 54 - (54 - y) * [0.78, 0.48, 0.22][death]]
      : (x, y) => [x, y];
    const pen = (pose: Transform): Pen => ({ put, pose: (x, y) => {
      const [px, py] = pose(x, y);
      return collapse(px, py);
    } });
    const leg = (offset: number, hip: number, foot: number, front: boolean) => pen(moving
      ? runLeg(move + offset, hip, foot, front, bodyPose)
      : braceLeg(bite, hip, foot, front));

    drawFarHind(leg(14, 34, 52, false));
    drawFarFront(leg(6, 31, 51, true));
    drawTail(pen((x, y) => {
      const baseWeight = Math.max(0, Math.min(1, (x - 2) / 14));
      const sway = moving ? -6 + Math.sin(phase * Math.PI * 2 - 0.6) * 1.5 : -bite.gape * 0.22;
      const anchorX = moving ? (16 - 30) * (stretch - 1) : bite.bodyX;
      return [x + anchorX * baseWeight, y + bodyY * baseWeight + sway * (1 - baseWeight)];
    }));
    drawBody(pen(bodyPose));
    drawHind(leg(0, 31, 54, false));
    drawFront(leg(8, 30, 54, true));
    const headY = moving ? 2 + Math.round(bodyY * 0.3) : bite.headY;
    const headPose: Transform = moving
      ? (x, y) => [x - Math.max(0, 29 - y) * 0.07, y + headY]
      : translate(bite.headX, headY);
    drawHead(pen((x, y) => headPose(40 + (x - 40) * 0.88, 33 + (y - 33) * 0.88)), bite.gape);
  }, dir, frame === 'hit');
}

export function drawWolf(frame: WolfFrame, dir: 'r' | 'l' = 'r'): HdDraw {
  return renderWolf(frame, dir);
}

export function drawWolfIdle(dir: 'r' | 'l' = 'r'): HdDraw {
  return renderWolf('idle', dir);
}
