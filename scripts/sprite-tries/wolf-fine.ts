import type { HdDraw, HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const C = {
  edge: '#4d4944', edgeLight: '#756f63', deep: '#514e49', shade: '#706d64',
  coat: '#938c7e', warm: '#aaa18d', light: '#c0b6a0', creamShade: '#aaa391',
  cream: '#d1c9b4', glint: '#e4dcc7', ink: '#2c2a29', eye: '#d8b66b',
} as const;

function poly(put: HdPut, points: readonly Point[], color: Color) {
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));
  for (let y = minY; y < maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2) {
      for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) put(x, y, color);
    }
  }
}

function rect(put: HdPut, x: number, y: number, width: number, height: number, color: Color) {
  for (let yy = y; yy < y + height; yy++) for (let xx = x; xx < x + width; xx++) put(xx, yy, color);
}

export const drawFineWolf: HdDraw = output => {
  const pixels = new Map<number, Color>();
  const put: HdPut = (x, y, color) => { if (color) pixels.set(y * 64 + x, color as Color); };

  poly(put, [[22, 31], [28, 32], [28, 39], [24, 44], [26, 49], [30, 50], [30, 53], [22, 53], [21, 49], [19, 44], [22, 38]], C.shade);
  poly(put, [[24, 35], [27, 35], [26, 40], [22, 44], [24, 49], [25, 51], [28, 51], [28, 52], [23, 52], [20, 44]], C.coat);
  rect(put, 26, 51, 3, 1, C.creamShade);
  poly(put, [[43, 29], [49, 30], [48, 40], [47, 49], [51, 50], [51, 53], [43, 53], [43, 46], [42, 38]], C.shade);
  poly(put, [[45, 34], [47, 34], [46, 46], [46, 50], [50, 51], [45, 52], [44, 44]], C.coat);

  poly(put, [[15, 26], [18, 30], [15, 35], [13, 39], [10, 43], [6, 45], [7, 42], [3, 43], [5, 39], [4, 36], [7, 33], [9, 29]], C.shade);
  poly(put, [[14, 27], [17, 30], [14, 35], [11, 40], [7, 42], [8, 38], [5, 40], [6, 36], [9, 32]], C.coat);
  poly(put, [[13, 29], [15, 29], [13, 33], [10, 35], [8, 38], [8, 35]], C.warm);

  poly(put, [[12, 26], [16, 23], [23, 23], [29, 21], [34, 19], [35, 16], [38, 18], [40, 15], [43, 19], [47, 23], [47, 29], [49, 32], [46, 33], [47, 37], [43, 36], [42, 39], [38, 36], [33, 36], [30, 39], [24, 37], [18, 39], [12, 35], [10, 30]], C.coat);
  poly(put, [[12, 28], [17, 24], [24, 24], [30, 22], [35, 19], [37, 20], [40, 17], [43, 22], [39, 24], [32, 24], [28, 27], [20, 27], [16, 30], [12, 31]], C.warm);
  poly(put, [[16, 24], [24, 24], [29, 22], [34, 20], [32, 23], [27, 25], [22, 25], [18, 26]], C.light);
  poly(put, [[19, 29], [26, 29], [31, 27], [35, 25], [39, 25], [37, 31], [33, 35], [28, 36], [24, 35], [19, 36], [15, 33]], C.shade);
  poly(put, [[18, 28], [22, 28], [21, 30], [24, 30], [22, 32], [18, 32]], C.coat);
  poly(put, [[30, 26], [34, 21], [38, 19], [40, 23], [38, 27], [36, 29], [34, 28], [32, 30]], C.warm);
  poly(put, [[35, 21], [38, 20], [37, 24], [34, 26]], C.light);
  poly(put, [[26, 34], [31, 33], [35, 32], [34, 35], [30, 37], [25, 36]], C.creamShade);

  poly(put, [[16, 30], [23, 30], [26, 35], [25, 40], [20, 45], [20, 49], [24, 52], [24, 55], [14, 55], [14, 52], [16, 48], [15, 43], [12, 38]], C.coat);
  poly(put, [[16, 31], [21, 31], [24, 34], [23, 38], [19, 42], [16, 42], [13, 37]], C.warm);
  poly(put, [[17, 31], [20, 31], [22, 33], [21, 36], [18, 38], [15, 37]], C.light);
  poly(put, [[23, 35], [25, 36], [24, 40], [19, 45], [19, 49], [22, 52], [18, 52], [17, 48], [17, 43], [21, 39]], C.shade);
  poly(put, [[17, 48], [19, 50], [22, 52], [23, 54], [15, 54], [15, 52]], C.creamShade);
  rect(put, 17, 52, 4, 1, C.cream);

  poly(put, [[35, 29], [40, 28], [44, 31], [44, 37], [41, 42], [41, 50], [45, 52], [45, 55], [35, 55], [34, 53], [36, 48], [36, 42], [34, 38]], C.coat);
  poly(put, [[35, 31], [39, 30], [41, 33], [41, 37], [39, 40], [37, 42], [35, 37]], C.warm);
  poly(put, [[41, 32], [43, 33], [43, 37], [40, 42], [40, 49], [39, 51], [38, 47], [38, 41], [40, 37]], C.shade);
  poly(put, [[37, 39], [39, 39], [39, 48], [40, 51], [44, 53], [44, 54], [35, 54], [37, 48]], C.creamShade);
  poly(put, [[37, 43], [38, 43], [38, 49], [39, 52], [42, 53], [36, 53]], C.cream);

  poly(put, [[40, 16], [45, 16], [48, 21], [48, 27], [45, 34], [46, 37], [42, 36], [41, 39], [38, 35], [35, 36], [36, 33], [33, 31], [36, 26]], C.coat);
  poly(put, [[42, 18], [45, 19], [47, 23], [46, 28], [44, 33], [44, 35], [41, 34], [41, 37], [38, 34], [36, 34], [38, 30], [36, 30], [39, 26]], C.creamShade);
  poly(put, [[44, 23], [47, 24], [45, 28], [43, 29], [42, 33], [40, 31], [38, 32], [40, 28]], C.cream);

  poly(put, [[46, 18], [48, 11], [52, 14], [53, 21]], C.shade);
  poly(put, [[48, 17], [49, 13], [51, 16], [51, 20]], C.coat);
  poly(put, [[41, 18], [41, 10], [45, 12], [48, 17], [52, 18], [55, 21], [56, 25], [54, 29], [49, 31], [45, 28], [42, 27], [43, 24], [40, 22]], C.coat);
  poly(put, [[42, 12], [44, 13], [46, 17], [45, 20], [42, 19]], C.shade);
  poly(put, [[43, 14], [44, 16], [44, 19], [43, 18]], C.deep);
  poly(put, [[46, 19], [51, 19], [54, 22], [52, 24], [49, 23], [46, 22], [43, 23], [42, 21]], C.warm);
  poly(put, [[46, 20], [49, 20], [51, 21], [48, 22], [46, 21]], C.light);
  poly(put, [[45, 24], [49, 25], [51, 28], [49, 30], [46, 27], [44, 27]], C.creamShade);
  poly(put, [[49, 26], [53, 24], [56, 24], [58, 26], [61, 26], [61, 29], [58, 31], [52, 31], [48, 29]], C.creamShade);
  poly(put, [[50, 26], [54, 25], [57, 26], [59, 27], [58, 28], [52, 28]], C.cream);
  rect(put, 54, 26, 3, 1, C.glint);

  for (const [index, color] of pixels) {
    const x = index % 64, y = Math.floor(index / 64);
    const exposedAbove = !pixels.has(index - 64);
    const exposedSide = !pixels.has(index - 1) || !pixels.has(index + 1);
    const exposedBelow = !pixels.has(index + 64);
    output(x, y, exposedAbove ? C.edgeLight : exposedBelow || exposedSide ? C.edge : color);
  }
  rect(output, 59, 26, 2, 2, C.ink);
  rect(output, 54, 29, 5, 1, C.deep);
  rect(output, 49, 23, 4, 1, C.ink);
  output(51, 24, C.eye);
  output(52, 24, C.ink);
  output(22, 53, C.shade);
  output(43, 53, C.shade);
};

export const TRIES = [{ name: 'E Fine-edged timber wolf', frames: [{ label: 'static concept', draw: drawFineWolf }] }];
