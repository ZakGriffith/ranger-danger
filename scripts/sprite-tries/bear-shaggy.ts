import type { HdDraw, HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const C = {
  outline: '#241d1c', deep: '#342825', dark: '#48322a', shade: '#604232',
  coat: '#77513a', warm: '#906544', light: '#ad8055', ridge: '#c49968',
  muzzleShade: '#977653', muzzle: '#ba9567', muzzleLight: '#d5b381',
  nose: '#221c1b', eye: '#e0ba65', claw: '#c7b99c',
} as const;

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

function oval(put: HdPut, cx: number, cy: number, rx: number, ry: number, color: Color) {
  for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.ceil(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, color);
    }
  }
}

function rect(put: HdPut, x: number, y: number, w: number, h: number, color: Color) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(xx, yy, color);
}

export const drawShaggyBear: HdDraw = (put, raw) => {
  for (let y = 52; y <= 57; y++) {
    for (let x = 6; x <= 57; x++) {
      if (((x - 31) / 26) ** 2 + ((y - 54) / 3) ** 2 <= 1) raw(x, y, '#17251d', 0.35);
    }
  }

  polygon(put, [[20, 35], [28, 35], [28, 43], [26, 48], [30, 49], [31, 52], [19, 52], [19, 48], [21, 44]], C.outline);
  polygon(put, [[22, 36], [27, 36], [26, 44], [24, 49], [29, 50], [29, 51], [21, 51], [21, 47]], C.dark);
  polygon(put, [[42, 32], [51, 32], [51, 43], [50, 47], [54, 49], [54, 51], [43, 51], [43, 45]], C.outline);
  polygon(put, [[44, 35], [49, 35], [49, 45], [48, 48], [52, 49], [52, 50], [45, 50]], C.dark);
  rect(put, 27, 51, 2, 1, C.muzzleShade);
  rect(put, 51, 50, 2, 1, C.muzzleShade);

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

  polygon(put, [[11, 34], [17, 32], [23, 35], [24, 41], [22, 47], [22, 51], [25, 52], [25, 55], [10, 55], [9, 53], [11, 46], [9, 42]], C.outline);
  polygon(put, [[12, 36], [17, 34], [21, 36], [22, 41], [20, 47], [20, 52], [23, 53], [23, 54], [11, 54], [13, 46], [11, 42]], C.shade);
  polygon(put, [[12, 36], [16, 34], [20, 36], [20, 41], [17, 45], [16, 50], [12, 51], [14, 44]], C.coat);
  polygon(put, [[13, 36], [16, 35], [18, 37], [17, 42], [15, 44], [14, 41]], C.warm);
  rect(put, 13, 51, 7, 2, C.coat);
  rect(put, 18, 54, 2, 1, C.claw);
  rect(put, 22, 54, 2, 1, C.claw);

  polygon(put, [[34, 29], [41, 27], [47, 31], [48, 37], [46, 41], [47, 43], [44, 45], [44, 50], [48, 52], [48, 55], [34, 55], [32, 53], [34, 46], [32, 43], [34, 41], [32, 37]], C.outline);
  polygon(put, [[35, 30], [40, 29], [45, 31], [46, 37], [44, 41], [45, 43], [42, 44], [42, 51], [46, 53], [46, 54], [34, 54], [36, 46], [34, 43], [36, 41], [34, 37]], C.shade);
  polygon(put, [[35, 31], [39, 30], [43, 32], [43, 38], [41, 41], [40, 45], [39, 51], [35, 52], [37, 45], [36, 41], [35, 38]], C.coat);
  polygon(put, [[36, 31], [39, 31], [41, 33], [41, 36], [38, 39], [36, 37]], C.warm);
  polygon(put, [[35, 39], [38, 40], [38, 43], [36, 42]], C.light);
  rect(put, 36, 51, 6, 2, C.coat);
  rect(put, 40, 54, 2, 1, C.claw);
  rect(put, 44, 54, 2, 1, C.claw);

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

  polygon(put, [[51, 29], [55, 28], [59, 29], [61, 31], [60, 36], [57, 38], [51, 37], [49, 34]], C.outline);
  polygon(put, [[52, 29], [55, 29], [58, 30], [60, 31], [59, 35], [56, 37], [52, 36], [50, 33]], C.muzzleShade);
  polygon(put, [[52, 29], [55, 29], [58, 30], [59, 32], [57, 34], [53, 34], [51, 32]], C.muzzle);
  rect(put, 53, 30, 4, 1, C.muzzleLight);
  polygon(put, [[58, 30], [61, 30], [61, 33], [59, 34], [57, 32]], C.nose);
  rect(put, 59, 30, 2, 1, C.deep);
  polygon(put, [[54, 35], [57, 35], [59, 34], [58, 36], [54, 36]], C.dark);
  rect(put, 49, 27, 4, 1, C.deep);
  put(51, 28, C.eye);
  put(52, 28, C.nose);
  put(50, 26, C.light);
};

export const TRIES = [{ name: 'C Old-growth bruiser', frames: [{ label: 'static concept', draw: drawShaggyBear }] }];
