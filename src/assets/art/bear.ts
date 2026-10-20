import type { HdDraw, HdPut } from './hd';

export const BEAR_MOVE_FRAMES = ['move0', 'move1', 'move2', 'move3', 'move4', 'move5', 'move6', 'move7', 'move8', 'move9', 'move10', 'move11', 'move12', 'move13', 'move14', 'move15'] as const;
export const BEAR_ATK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'atk6', 'atk7', 'atk8', 'atk9', 'atk10', 'atk11'] as const;
export const BEAR_BITE_FRAMES = ['bite0', 'bite1', 'bite2', 'bite3', 'bite4', 'bite5', 'bite6', 'bite7', 'bite8', 'bite9', 'bite10', 'bite11'] as const;
export const BEAR_FRAMES = [...BEAR_MOVE_FRAMES, ...BEAR_ATK_FRAMES, 'hit', 'die0', 'die1', 'die2', 'die3'] as const;
export const BEAR_MOVE_FPS = 16;
export const BEAR_ATK_FPS = 15;
export type BearFrame = typeof BEAR_FRAMES[number];
export type BearBiteFrame = typeof BEAR_BITE_FRAMES[number];

type Point = readonly [number, number];
type Color = `#${string}`;
type Transform = (x: number, y: number) => Point;
type Pen = { pixel: HdPut; pose: Transform };

const C = {
  outline: '#241d1c', deep: '#342825', dark: '#48322a', shade: '#604232',
  coat: '#77513a', warm: '#906544', light: '#ad8055', ridge: '#c49968',
  muzzleShade: '#977653', muzzle: '#ba9567', muzzleLight: '#d5b381',
  nose: '#221c1b', eye: '#e0ba65', claw: '#c7b99c', tooth: '#ead8ad', tongue: '#a65d52',
} as const;

function pixel(pen: Pen, x: number, y: number, color: Color) {
  const [px, py] = pen.pose(x, y);
  pen.pixel(Math.round(px), Math.round(py), color);
}

function polygon(pen: Pen, points: readonly Point[], color: Color) {
  // Pose vertices before rasterizing so stretching a limb cannot leave holes between pixel rows.
  const posed = points.map(([x, y]): Point => {
    const [px, py] = pen.pose(x, y);
    return [Math.round(px), Math.round(py)];
  });
  const minY = Math.min(...posed.map(p => p[1]));
  const maxY = Math.max(...posed.map(p => p[1]));
  for (let y = minY; y <= maxY; y++) {
    const crossings: number[] = [];
    for (let i = 0; i < posed.length; i++) {
      const [ax, ay] = posed[i], [bx, by] = posed[(i + 1) % posed.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) crossings.push(ax + (y - ay) * (bx - ax) / (by - ay));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i < crossings.length; i += 2) {
      for (let x = Math.ceil(crossings[i]); x <= Math.floor(crossings[i + 1]); x++) pen.pixel(x, y, color);
    }
  }
}

function oval(pen: Pen, cx: number, cy: number, rx: number, ry: number, color: Color) {
  for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.ceil(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) pixel(pen, x, y, color);
    }
  }
}

function rect(pen: Pen, x: number, y: number, w: number, h: number, color: Color) {
  polygon(pen, [[x, y], [x + w - 1, y], [x + w - 1, y + h], [x, y + h]], color);
}

function translate(x: number, y: number): Transform {
  return (px, py) => [px + x, py + y];
}

function walkLeg(phase: number, hipY: number, footY: number, bodyX: number, bodyY: number, moving: boolean): Transform {
  let swing = 0, lift = 0;
  if (moving) {
    const step = phase % 1;
    if (step < 0.65) swing = 3 - 6 * step / 0.65;
    else {
      const recovery = (step - 0.65) / 0.35;
      swing = -3 + recovery * 6;
      lift = Math.sin(recovery * Math.PI) * 3;
    }
  }
  return (x, y) => {
    const weight = Math.max(0, Math.min(1, (y - hipY) / (footY - hipY)));
    return [x + bodyX * (1 - weight) + swing * weight, y + bodyY * (1 - weight) - lift * weight];
  };
}

type SwipePose = { bodyX: number; bodyY: number; headY: number; elbow: Point; paw: Point };
const SWIPE: readonly SwipePose[] = [
  { bodyX: 0, bodyY: 0, headY: 0, elbow: [39, 42], paw: [40, 53] },
  { bodyX: -1, bodyY: -1, headY: -1, elbow: [37, 37], paw: [40, 44] },
  { bodyX: -1, bodyY: -2, headY: -2, elbow: [35, 31], paw: [38, 31] },
  { bodyX: -1, bodyY: -2, headY: -2, elbow: [35, 26], paw: [38, 21] },
  { bodyX: -1, bodyY: -2, headY: -2, elbow: [39, 24], paw: [43, 15] },
  { bodyX: 0, bodyY: -1, headY: -1, elbow: [44, 27], paw: [52, 24] },
  { bodyX: 0, bodyY: 1, headY: 1, elbow: [47, 34], paw: [54, 38] },
  { bodyX: 0, bodyY: 1, headY: 1, elbow: [46, 40], paw: [50, 48] },
  { bodyX: 0, bodyY: 1, headY: 1, elbow: [43, 42], paw: [45, 53] },
  { bodyX: 0, bodyY: 0, headY: 1, elbow: [41, 42], paw: [42, 53] },
  { bodyX: 0, bodyY: 0, headY: 0, elbow: [40, 42], paw: [41, 53] },
  { bodyX: 0, bodyY: 0, headY: 0, elbow: [39, 42], paw: [40, 53] },
];

type BitePose = { bodyX: number; bodyY: number; headX: number; headY: number; gape: number };
const BITE: readonly BitePose[] = [
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0 },
  { bodyX: -1, bodyY: 0, headX: -1, headY: -1, gape: 1 },
  { bodyX: -1, bodyY: -1, headX: -2, headY: -1, gape: 3 },
  { bodyX: -1, bodyY: -1, headX: -3, headY: -2, gape: 6 },
  { bodyX: -1, bodyY: -1, headX: -3, headY: -2, gape: 8 },
  { bodyX: 0, bodyY: 0, headX: -1, headY: 0, gape: 7 },
  { bodyX: 1, bodyY: 1, headX: 1, headY: 1, gape: 3 },
  { bodyX: 1, bodyY: 1, headX: 1, headY: 2, gape: 0 },
  { bodyX: 1, bodyY: 1, headX: 0, headY: 1, gape: 0 },
  { bodyX: 0, bodyY: 0, headX: -1, headY: 1, gape: 1 },
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0 },
  { bodyX: 0, bodyY: 0, headX: 0, headY: 0, gape: 0 },
];

function swipeLeg(pose: SwipePose): Transform {
  const shoulder: Point = [39 + pose.bodyX, 30 + pose.bodyY];
  return (x, y) => {
    const lower = y > 42;
    const a = lower ? pose.elbow : shoulder;
    const b = lower ? pose.paw : pose.elbow;
    const t = (y - (lower ? 42 : 30)) / (lower ? 11 : 12);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    const across = x - (lower ? 39 + t : 39);
    return [a[0] + dx * t + dy / length * across, a[1] + dy * t - dx / length * across];
  };
}

function drawFarHind(put: Pen) {
  polygon(put, [[20, 35], [28, 35], [28, 43], [26, 48], [30, 49], [31, 52], [19, 52], [19, 48], [21, 44]], C.outline);
  polygon(put, [[22, 36], [27, 36], [26, 44], [24, 49], [29, 50], [29, 51], [21, 51], [21, 47]], C.dark);
  rect(put, 27, 51, 2, 1, C.muzzleShade);
}

function drawFarFront(put: Pen) {
  polygon(put, [[42, 32], [51, 32], [51, 43], [50, 47], [54, 49], [54, 51], [43, 51], [43, 45]], C.outline);
  polygon(put, [[44, 35], [49, 35], [49, 45], [48, 48], [52, 49], [52, 50], [45, 50]], C.dark);
  rect(put, 51, 50, 2, 1, C.muzzleShade);
}

function drawBody(put: Pen) {
  oval(put, 6, 29, 3, 3, C.outline);
  oval(put, 6, 28, 2, 2, C.shade);
  polygon(put, [[6, 25], [8, 21], [13, 18], [22, 17], [27, 14], [32, 12], [39, 12], [43, 15], [45, 21], [48, 26], [49, 34], [46, 41], [43, 43], [38, 42], [35, 44], [31, 42], [25, 44], [19, 42], [13, 43], [8, 39], [5, 33]], C.outline);
  polygon(put, [[7, 25], [10, 22], [14, 20], [23, 19], [28, 16], [33, 14], [39, 14], [42, 17], [43, 22], [47, 28], [47, 34], [44, 40], [40, 41], [35, 40], [31, 42], [25, 41], [20, 42], [15, 40], [11, 40], [7, 35]], C.coat);
  polygon(put, [[8, 32], [13, 35], [20, 35], [25, 33], [30, 35], [35, 33], [43, 33], [46, 31], [46, 37], [43, 41], [38, 40], [35, 42], [31, 40], [25, 42], [19, 40], [13, 41], [9, 38]], C.shade);
  polygon(put, [[9, 25], [13, 22], [22, 21], [27, 18], [32, 16], [38, 16], [40, 18], [38, 22], [32, 22], [28, 25], [22, 24], [17, 26]], C.warm);
  polygon(put, [[12, 22], [15, 20], [24, 20], [29, 17], [34, 14], [38, 15], [39, 17], [34, 17], [30, 20], [23, 23], [17, 22]], C.light);
  polygon(put, [[28, 18], [33, 15], [37, 15], [36, 16], [32, 17], [30, 19]], C.ridge);
  polygon(put, [[25, 25], [30, 22], [34, 23], [33, 28], [30, 32], [28, 35], [24, 34], [27, 29]], C.shade);
  polygon(put, [[8, 28], [11, 26], [14, 27], [12, 32], [10, 34], [8, 32]], C.warm);
  polygon(put, [[31, 24], [35, 21], [39, 23], [40, 28], [38, 32], [35, 33], [34, 29]], C.warm);

}

function drawHind(put: Pen) {
  polygon(put, [[11, 34], [17, 32], [23, 35], [24, 41], [22, 47], [22, 51], [25, 52], [25, 55], [10, 55], [9, 53], [11, 46], [9, 42]], C.outline);
  polygon(put, [[12, 36], [17, 34], [21, 36], [22, 41], [20, 47], [20, 52], [23, 53], [23, 54], [11, 54], [13, 46], [11, 42]], C.shade);
  polygon(put, [[12, 36], [16, 34], [20, 36], [20, 41], [17, 45], [16, 50], [12, 51], [14, 44]], C.coat);
  polygon(put, [[13, 36], [16, 35], [18, 37], [17, 42], [15, 44], [14, 41]], C.warm);
  rect(put, 13, 51, 7, 2, C.coat);
  rect(put, 18, 54, 2, 1, C.claw);
  rect(put, 22, 54, 2, 1, C.claw);

}

function drawFront(put: Pen) {
  polygon(put, [[34, 29], [41, 27], [47, 31], [48, 37], [46, 41], [47, 43], [44, 45], [44, 50], [48, 52], [48, 55], [34, 55], [32, 53], [34, 46], [32, 43], [34, 41], [32, 37]], C.outline);
  polygon(put, [[35, 30], [40, 29], [45, 31], [46, 37], [44, 41], [45, 43], [42, 44], [42, 51], [46, 53], [46, 54], [34, 54], [36, 46], [34, 43], [36, 41], [34, 37]], C.shade);
  polygon(put, [[35, 31], [39, 30], [43, 32], [43, 38], [41, 41], [40, 45], [39, 51], [35, 52], [37, 45], [36, 41], [35, 38]], C.coat);
  polygon(put, [[36, 31], [39, 31], [41, 33], [41, 36], [38, 39], [36, 37]], C.warm);
  polygon(put, [[35, 39], [38, 40], [38, 43], [36, 42]], C.light);
  rect(put, 36, 51, 6, 2, C.coat);
  rect(put, 40, 54, 2, 1, C.claw);
  rect(put, 44, 54, 2, 1, C.claw);

}

function drawOpenMuzzle(put: Pen, gape: number) {
  const jawY = 36 + gape;
  const upperY = Math.round(gape / 4);
  polygon(put, [[49, 33], [55, 32], [60, 32], [60, jawY - 2], [57, jawY + 1], [52, jawY], [49, 37]], C.outline);
  polygon(put, [[50, 34], [58, 33], [59, 35], [58, jawY - 1], [53, jawY - 1], [51, 37]], C.nose);
  polygon(put, [[52, jawY - 2], [56, jawY - 3], [58, jawY - 2], [57, jawY], [53, jawY]], C.tongue);
  polygon(put, [[50, 36], [52, jawY - 1], [57, jawY], [60, jawY - 3], [60, jawY], [57, jawY + 2], [52, jawY + 1], [49, 38]], C.muzzleShade);
  polygon(put, [[52, jawY], [57, jawY + 1], [59, jawY - 1], [58, jawY + 1], [55, jawY + 2], [52, jawY + 1]], C.muzzle);
  if (gape >= 3) {
    polygon(put, [[57, jawY - 1], [58, jawY - 4], [59, jawY - 2], [59, jawY]], C.tooth);
    rect(put, 53, jawY - 1, 2, 1, C.tooth);
  }

  const upper: Pen = { pixel: put.pixel, pose: (x, y) => put.pose(x, y - upperY) };
  polygon(upper, [[51, 29], [55, 28], [59, 29], [61, 31], [60, 35], [55, 36], [50, 34], [49, 32]], C.outline);
  polygon(upper, [[51, 30], [55, 29], [58, 30], [60, 31], [59, 34], [55, 35], [51, 33]], C.muzzleShade);
  polygon(upper, [[52, 29], [55, 29], [58, 30], [59, 32], [56, 33], [52, 32]], C.muzzle);
  rect(upper, 53, 30, 4, 1, C.muzzleLight);
  polygon(upper, [[58, 30], [61, 30], [61, 33], [59, 34], [57, 32]], C.nose);
  rect(upper, 59, 30, 2, 1, C.deep);
  if (gape >= 3) {
    polygon(upper, [[55, 34], [58, 34], [57, 38], [56, 37]], C.tooth);
    pixel(upper, 52, 34, C.tooth);
  }
}

function drawHead(put: Pen, gape = 0) {
  oval(put, 49, 20, 4, 4, C.outline);
  oval(put, 49, 20, 3, 3, C.shade);
  oval(put, 49, 20, 1, 2, C.deep);
  polygon(put, [[39, 22], [43, 20], [49, 20], [53, 23], [55, 27], [56, 31], [54, 36], [50, 39], [45, 39], [42, 41], [41, 38], [38, 37], [40, 34], [38, 31]], C.outline);
  polygon(put, [[41, 23], [45, 22], [49, 22], [52, 24], [53, 27], [54, 31], [52, 35], [49, 37], [45, 38], [43, 37], [41, 35], [42, 32], [40, 29]], C.coat);
  polygon(put, [[41, 24], [45, 22], [49, 23], [51, 25], [49, 27], [45, 27], [43, 30], [41, 28]], C.warm);
  polygon(put, [[42, 25], [44, 24], [47, 24], [46, 25], [43, 27]], C.light);
  polygon(put, [[41, 32], [44, 33], [47, 32], [50, 33], [51, 36], [47, 37], [44, 36], [42, 37]], C.shade);
  oval(put, 42, 21, 4, 4, C.outline);
  oval(put, 42, 20, 3, 3, C.coat);
  oval(put, 43, 21, 2, 2, C.dark);
  rect(put, 41, 18, 2, 1, C.light);

  if (gape > 0) drawOpenMuzzle(put, gape);
  else {
    polygon(put, [[51, 29], [55, 28], [59, 29], [61, 31], [60, 36], [57, 38], [51, 37], [49, 34]], C.outline);
    polygon(put, [[52, 29], [55, 29], [58, 30], [60, 31], [59, 35], [56, 37], [52, 36], [50, 33]], C.muzzleShade);
    polygon(put, [[52, 29], [55, 29], [58, 30], [59, 32], [57, 34], [53, 34], [51, 32]], C.muzzle);
    rect(put, 53, 30, 4, 1, C.muzzleLight);
    polygon(put, [[58, 30], [61, 30], [61, 33], [59, 34], [57, 32]], C.nose);
    rect(put, 59, 30, 2, 1, C.deep);
    polygon(put, [[54, 35], [57, 35], [59, 34], [58, 36], [54, 36]], C.dark);
  }
  rect(put, 49, 27, 4, 1, C.deep);
  pixel(put, 51, 28, C.eye);
  pixel(put, 52, 28, C.nose);
  pixel(put, 50, 26, C.light);
}

export function drawBearBite(frame: BearBiteFrame, dir: 'r' | 'l' = 'r'): HdDraw {
  return (drawPixel) => {
    const pose = BITE[Number(frame.slice(4))];
    const output: HdPut = (x, y, color) => drawPixel(dir === 'l' ? 63 - x : x, y, color);
    const pen = (transform: Transform): Pen => ({ pixel: output, pose: transform });
    drawFarHind(pen(walkLeg(0, 35, 52, pose.bodyX, pose.bodyY, false)));
    drawFarFront(pen(walkLeg(0, 32, 51, pose.bodyX, pose.bodyY, false)));
    drawBody(pen(translate(pose.bodyX, pose.bodyY)));
    drawHind(pen(walkLeg(0, 34, 55, pose.bodyX, pose.bodyY, false)));
    drawFront(pen(walkLeg(0, 29, 55, pose.bodyX, pose.bodyY, false)));
    drawHead(pen(translate(pose.headX, pose.headY)), pose.gape);
  };
}

export function drawBear(frame: BearFrame, dir: 'r' | 'l' = 'r'): HdDraw {
  return (drawPixel) => {
    const move = frame.startsWith('move') ? Number(frame.slice(4)) : -1;
    const attack = frame.startsWith('atk') ? Number(frame.slice(3)) : -1;
    const death = frame.startsWith('die') ? Number(frame.slice(3)) : -1;
    const output: HdPut = (x, y, color) => drawPixel(dir === 'l' ? 63 - x : x, y, frame === 'hit' && color !== null ? '#ffffff' : color);
    const pen = (pose: Transform): Pen => ({ pixel: output, pose });
    if (death === 3) {
      const dust = pen(translate(0, 0));
      for (const [x, y] of [[14, 53], [25, 54], [38, 53], [50, 54]] as const) oval(dust, x, y, 1, 1, C.shade);
      return;
    }

    const moving = move >= 0;
    const phase = moving ? move / BEAR_MOVE_FRAMES.length : 0;
    const swipe = attack >= 0 ? SWIPE[attack] : SWIPE[0];
    const bob = moving ? Math.round(Math.sin(phase * Math.PI * 4) * 0.8) : 0;
    const bodyX = swipe.bodyX;
    const bodyY = swipe.bodyY + bob;
    const collapse: Transform = death >= 0
      ? (x, y) => [x, 55 - (55 - y) * (1 - (death + 1) * 0.22)]
      : (x, y) => [x, y];
    const posedPen = (pose: Transform) => pen((x, y) => {
      const [px, py] = pose(x, y);
      return collapse(px, py);
    });

    drawFarHind(posedPen(walkLeg(phase + 0.5, 35, 52, bodyX, bodyY, moving)));
    drawFarFront(posedPen(walkLeg(phase + 0.75, 32, 51, bodyX, bodyY, moving)));
    drawBody(posedPen(translate(bodyX, bodyY)));
    drawHind(posedPen(walkLeg(phase, 34, 55, bodyX, bodyY, moving)));
    const foregroundSwipe = attack >= 1 && attack <= 8;
    if (!foregroundSwipe) drawFront(posedPen(attack >= 0 ? swipeLeg(swipe) : walkLeg(phase + 0.25, 29, 55, bodyX, bodyY, moving)));
    const headY = moving ? Math.round(Math.sin(phase * Math.PI * 4 - 0.45) * 0.7) : swipe.headY;
    drawHead(posedPen(translate(bodyX, headY)));
    if (foregroundSwipe) drawFront(posedPen(swipeLeg(swipe)));
  };
}
