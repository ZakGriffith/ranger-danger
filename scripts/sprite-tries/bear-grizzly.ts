import { ellipse, poly, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';

const C = {
  deep: '#302321', dark: '#4a3027', shade: '#69442e', mid: '#865836',
  fur: '#a16d43', warm: '#b98150', light: '#cc9b65', cream: '#e1b57d',
  muzzle: '#c2996a', muzzleShade: '#8d694a', nose: '#211b1b',
  eye: '#d9aa57', claw: '#ddcba8', glint: '#f6e7c3',
} as const;

function farLeg(put: HdPut, hipX: number, footX: number, footY: number) {
  poly(put, [[hipX - 4, 35], [hipX + 3, 35], [footX + 2, footY - 4], [footX + 5, footY - 2], [footX + 5, footY], [footX - 3, footY], [footX - 4, footY - 3]], C.dark);
  poly(put, [[hipX - 2, 38], [hipX + 1, 37], [footX + 1, footY - 3], [footX - 2, footY - 3]], C.shade);
  rect(put, footX + 3, footY - 1, 2, 1, C.muzzleShade);
}

function hindLeg(put: HdPut) {
  poly(put, [[13, 36], [21, 35], [26, 40], [24, 45], [22, 49], [22, 51], [27, 52], [28, 54], [27, 55], [17, 55], [16, 52], [17, 47], [14, 43]], C.dark);
  poly(put, [[14, 36], [21, 36], [24, 40], [22, 45], [20, 49], [20, 52], [25, 52], [26, 54], [18, 54], [18, 47], [15, 42]], C.mid);
  poly(put, [[14, 37], [19, 36], [22, 39], [22, 42], [19, 44], [16, 42]], C.fur);
  poly(put, [[16, 37], [19, 37], [21, 39], [20, 40], [16, 40]], C.warm);
  rect(put, 19, 48, 2, 4, C.fur);
  rect(put, 24, 54, 1, 1, C.claw);
  rect(put, 27, 54, 1, 1, C.claw);
}

function foreLeg(put: HdPut) {
  poly(put, [[33, 32], [40, 32], [44, 39], [41, 46], [41, 51], [45, 52], [46, 54], [45, 55], [35, 55], [34, 52], [35, 44], [32, 39]], C.dark);
  poly(put, [[34, 33], [39, 33], [41, 39], [39, 46], [39, 52], [44, 53], [44, 54], [36, 54], [36, 44], [34, 39]], C.mid);
  poly(put, [[34, 33], [38, 33], [40, 37], [39, 42], [37, 45], [35, 42]], C.fur);
  poly(put, [[34, 34], [37, 33], [38, 36], [37, 40], [35, 41]], C.warm);
  rect(put, 36, 46, 2, 6, C.fur);
  rect(put, 40, 54, 1, 1, C.claw);
  rect(put, 43, 54, 1, 1, C.claw);
  rect(put, 45, 54, 1, 1, C.claw);
}

export const drawGrizzly: HdDraw = (put) => {
  farLeg(put, 13, 10, 51);
  farLeg(put, 39, 46, 51);
  ellipse(put, 7, 32, 3, 3, C.shade);
  poly(put, [[6, 29], [8, 24], [12, 21], [20, 20], [26, 20], [30, 17], [35, 16], [40, 19], [43, 25], [45, 32], [44, 40], [39, 44], [29, 44], [22, 43], [13, 43], [8, 39], [6, 35]], C.shade);
  poly(put, [[7, 29], [9, 25], [13, 22], [22, 21], [27, 22], [31, 18], [35, 17], [39, 20], [42, 26], [41, 33], [36, 37], [28, 39], [18, 39], [11, 36], [7, 33]], C.fur);
  poly(put, [[9, 27], [13, 23], [22, 22], [27, 23], [29, 21], [30, 24], [26, 27], [18, 26], [13, 28], [10, 31]], C.warm);
  poly(put, [[11, 25], [15, 23], [22, 23], [24, 24], [17, 24], [14, 26]], C.light);
  poly(put, [[29, 23], [32, 19], [35, 18], [38, 20], [40, 24], [38, 27], [33, 26], [30, 29]], C.warm);
  poly(put, [[31, 22], [33, 19], [35, 19], [37, 21], [37, 23], [34, 22]], C.light);
  poly(put, [[8, 34], [14, 36], [24, 36], [28, 34], [31, 37], [37, 35], [41, 31], [44, 34], [42, 40], [36, 43], [27, 43], [21, 41], [13, 41], [9, 38]], C.mid);
  poly(put, [[10, 37], [17, 39], [22, 38], [25, 40], [31, 39], [34, 41], [29, 43], [20, 42], [12, 41]], C.shade);
  poly(put, [[25, 25], [28, 24], [29, 29], [27, 34], [24, 36], [26, 30]], C.mid);
  put(8, 28, C.warm); put(10, 24, C.light); put(31, 17, C.warm);
  put(35, 15, C.warm); put(40, 23, C.warm);
  hindLeg(put);
  foreLeg(put);

  ellipse(put, 48, 23, 3, 3, C.dark);
  ellipse(put, 45, 29, 8, 8, C.mid);
  poly(put, [[40, 25], [44, 23], [48, 24], [52, 28], [53, 32], [49, 36], [43, 36], [39, 32]], C.fur);
  poly(put, [[40, 26], [44, 24], [48, 25], [50, 27], [46, 27], [43, 29]], C.warm);
  ellipse(put, 42, 23, 3.5, 3.5, C.mid);
  ellipse(put, 42, 23, 2, 2, C.dark);
  rect(put, 40, 20, 3, 1, C.light);
  put(39, 21, C.warm); put(44, 22, C.warm);
  poly(put, [[39, 29], [42, 31], [45, 33], [47, 34], [46, 37], [42, 37], [40, 35]], C.mid);
  poly(put, [[49, 30], [53, 30], [55, 32], [59, 32], [61, 33], [61, 36], [58, 38], [52, 38], [49, 36]], C.muzzleShade);
  poly(put, [[50, 31], [53, 31], [55, 33], [60, 33], [59, 35], [55, 36], [51, 35]], C.muzzle);
  rect(put, 53, 32, 3, 1, C.cream);
  rect(put, 58, 32, 3, 3, C.nose);
  put(58, 32, C.muzzleShade);
  rect(put, 52, 37, 7, 1, C.dark);
  put(54, 37, C.claw);
  rect(put, 48, 28, 3, 1, C.dark);
  rect(put, 49, 29, 2, 1, C.nose);
  put(49, 29, C.eye);
  put(48, 27, C.light);
};

export const TRIES = [{ name: 'A Woodland grizzly', frames: [{ label: 'static concept', draw: drawGrizzly }] }];
