import type { HdDraw, HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const C = {
  deepest: '#251c20', dark: '#422b29', shade: '#644032', base: '#8c5538',
  warm: '#ab7046', light: '#d09861', cream: '#e7ba7c',
  far: '#594139', farLight: '#85624a', fang: '#e6d5a6',
  fangShade: '#a78d69', eye: '#21191d', glint: '#fff1ca',
} as const;

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

function leg(put: HdPut, root: Point, knee: Point, toe: Point, far: boolean) {
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

export const drawTarantula: HdDraw = (put, raw) => {
  for (let y = 51; y <= 55; y++) {
    for (let x = 9; x <= 59; x++) {
      if (((x - 34) / 25) ** 2 + ((y - 53) / 2.5) ** 2 <= 1) raw(x, y, '#17251d', 0.38);
    }
  }

  leg(put, [34, 31], [20, 22], [8, 44], true);
  leg(put, [38, 30], [31, 20], [26, 44], true);
  leg(put, [41, 31], [45, 22], [48, 44], true);
  leg(put, [44, 32], [54, 26], [60, 46], true);

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

  oval(put, 39, 34, 12, 9, C.dark);
  oval(put, 40, 32, 11, 7, C.base);
  polygon(put, [[31, 29], [35, 26], [42, 26], [47, 28], [49, 30], [41, 29], [37, 31], [31, 32]], C.warm);
  stroke(put, [35, 27], [42, 27], 1, 1, C.light);
  polygon(put, [[31, 34], [34, 33], [37, 35], [41, 34], [45, 36], [47, 39], [40, 41], [33, 40]], C.shade);

  leg(put, [33, 36], [21, 33], [7, 52], false);
  leg(put, [37, 38], [31, 35], [24, 55], false);
  leg(put, [41, 38], [45, 35], [44, 56], false);
  leg(put, [45, 36], [53, 35], [60, 53], false);

  oval(put, 49, 33, 4, 4, C.warm);
  oval(put, 49, 34, 3, 3, C.base);
  oval(put, 49, 31, 1.6, 1.6, C.eye);
  oval(put, 52, 32, 1, 1, C.eye);
  put(46, 30, C.eye); put(49, 30, C.glint); put(52, 31, C.cream);
  polygon(put, [[50, 36], [52, 36], [52, 39], [50, 42], [50, 39]], C.fangShade);
  polygon(put, [[49, 36], [51, 36], [51, 39], [49, 41]], C.fang);
  polygon(put, [[53, 35], [54, 36], [54, 39], [52, 41], [53, 38]], C.fang);
};

export const TRIES = [{ name: 'A Woodland tarantula', frames: [{ label: 'static concept', draw: drawTarantula }] }];
