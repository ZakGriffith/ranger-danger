import type { HdDraw, HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const C = {
  deep: '#191c24', shade: '#292d38', fur: '#414650', light: '#606675',
  far: '#252830', farLight: '#373b46',
  tanShade: '#84634c', tan: '#b68a62', tanLight: '#d8b284',
  nose: '#14171e', amber: '#c9a061', claw: '#b4aaa0',
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

function rect(put: HdPut, x: number, y: number, w: number, h: number, color: Color) {
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) put(col, row, color);
}

export const drawBlackBear: HdDraw = (put, raw) => {
  for (let y = 53; y <= 57; y++) {
    for (let x = 7; x <= 57; x++) {
      if (((x - 32) / 25) ** 2 + ((y - 55) / 2.5) ** 2 <= 1) raw(x, y, '#17251d', 0.38);
    }
  }

  polygon(put, [[17, 35], [25, 36], [24, 43], [23, 49], [26, 50], [27, 52], [19, 52], [18, 48]], C.far);
  polygon(put, [[21, 40], [24, 39], [23, 47], [22, 50], [20, 50]], C.farLight);
  polygon(put, [[33, 34], [40, 35], [39, 44], [38, 48], [41, 50], [41, 52], [33, 52], [32, 49]], C.far);
  rect(put, 34, 43, 2, 6, C.farLight);
  put(25, 51, C.tanShade); put(40, 51, C.tanShade);

  polygon(put, [[7, 28], [5, 29], [5, 32], [7, 34], [11, 32], [10, 28]], C.shade);
  rect(put, 6, 29, 3, 2, C.fur);

  polygon(put, [[8, 28], [10, 24], [14, 21], [21, 19], [29, 19], [34, 17], [39, 17], [44, 20], [47, 25], [47, 34], [44, 40], [39, 43], [31, 45], [24, 45], [18, 43], [12, 40], [9, 36]], C.fur);
  polygon(put, [[11, 26], [15, 23], [22, 21], [30, 21], [35, 19], [39, 19], [42, 21], [36, 21], [32, 23], [24, 23], [17, 25], [13, 28]], C.light);
  polygon(put, [[9, 32], [12, 34], [18, 36], [24, 37], [31, 36], [37, 33], [42, 28], [46, 27], [46, 35], [42, 40], [37, 43], [30, 44], [24, 44], [17, 41], [12, 39]], C.shade);
  polygon(put, [[20, 40], [27, 42], [34, 41], [40, 37], [43, 34], [44, 39], [38, 43], [31, 45], [25, 45]], C.deep);
  polygon(put, [[16, 27], [20, 25], [26, 25], [29, 27], [26, 28], [22, 27], [18, 29]], C.fur);
  polygon(put, [[29, 24], [34, 22], [39, 23], [41, 26], [38, 26], [35, 25], [32, 27]], C.light);
  polygon(put, [[31, 29], [35, 27], [38, 28], [36, 30], [33, 30]], C.fur);

  polygon(put, [[13, 34], [19, 33], [23, 37], [22, 42], [19, 47], [18, 51], [21, 53], [21, 55], [10, 55], [9, 53], [11, 49], [11, 44], [10, 40]], C.fur);
  polygon(put, [[14, 35], [18, 35], [20, 38], [18, 41], [16, 44], [14, 49], [12, 50], [13, 42], [12, 39]], C.light);
  polygon(put, [[20, 38], [22, 39], [21, 43], [18, 48], [17, 51], [20, 53], [20, 55], [11, 55], [10, 53], [14, 52], [16, 47], [17, 43]], C.shade);
  rect(put, 11, 53, 7, 1, C.fur);
  put(16, 54, C.claw); put(19, 54, C.claw);

  polygon(put, [[37, 29], [43, 29], [47, 34], [47, 41], [46, 47], [47, 51], [51, 53], [51, 55], [40, 55], [39, 53], [40, 47], [39, 43], [37, 39]], C.fur);
  polygon(put, [[38, 32], [40, 30], [43, 31], [43, 37], [42, 42], [43, 48], [42, 51], [40, 51], [41, 46], [39, 40]], C.light);
  polygon(put, [[44, 35], [47, 37], [46, 46], [47, 51], [50, 53], [50, 55], [41, 55], [40, 53], [44, 52], [43, 47], [43, 41]], C.shade);
  rect(put, 41, 53, 7, 1, C.fur);
  put(46, 54, C.claw); put(49, 54, C.claw);

  polygon(put, [[45, 18], [47, 17], [50, 18], [51, 21], [50, 24], [46, 24], [44, 21]], C.shade);
  rect(put, 46, 19, 3, 3, C.deep);
  polygon(put, [[40, 23], [44, 21], [48, 22], [52, 25], [54, 29], [53, 35], [50, 39], [45, 40], [41, 37], [39, 32]], C.fur);
  polygon(put, [[41, 24], [45, 23], [48, 24], [50, 26], [47, 26], [45, 25], [42, 27]], C.light);
  polygon(put, [[40, 31], [43, 33], [47, 34], [51, 32], [53, 33], [51, 37], [48, 39], [44, 38], [41, 36]], C.shade);

  polygon(put, [[39, 21], [39, 18], [41, 16], [44, 16], [46, 18], [46, 22], [44, 24], [41, 24]], C.fur);
  rect(put, 41, 18, 3, 4, C.deep);
  rect(put, 41, 17, 3, 1, C.light);
  put(40, 18, C.light); put(44, 19, C.shade); put(43, 22, C.shade);

  polygon(put, [[49, 29], [53, 29], [55, 30], [59, 31], [59, 35], [57, 38], [52, 38], [49, 36], [48, 33]], C.tanShade);
  polygon(put, [[50, 30], [54, 30], [56, 31], [58, 31], [58, 34], [55, 35], [51, 35], [49, 33]], C.tan);
  polygon(put, [[51, 30], [54, 30], [56, 31], [56, 32], [53, 32], [51, 33], [50, 32]], C.tanLight);
  rect(put, 57, 31, 3, 2, C.nose);
  put(59, 33, C.nose); put(57, 30, C.shade);
  rect(put, 53, 36, 4, 1, C.nose);
  put(57, 35, C.nose); put(52, 36, C.tan);
  rect(put, 47, 28, 3, 1, C.deep);
  put(49, 29, C.amber); put(50, 29, C.nose); put(48, 29, C.deep);
};

export const TRIES = [{ name: 'B Forest black bear', frames: [{ label: 'static concept', draw: drawBlackBear }] }];
