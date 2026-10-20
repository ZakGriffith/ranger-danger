// Meadow deer — a whitetail buck in side view (Enemy only flips X), built
// from hand-placed pixel blocks (pixels.ts) at 64 px. Body, neck, head,
// ear, antlers, tail, joints and hooves are authored pixel by pixel; the
// leg bones between the joints are tapered strokes so the walk can be
// keyed from joint positions without redrawing every leg.
//
// Frames: an 8-frame four-beat walk (move0..7; hind, front, far hind, far
// front touch down a quarter cycle apart) and a 5-frame antler lunge
// (atk0..4): pull back and drop the head, drive forward, recover.

import type { HdDraw, HdPut } from './hd';
import { blit, limb, type Palette, type Part, type Remap } from './pixels';
import type { MeadowFrame } from './meadow';

const PAL: Palette = {
  '1': '#d9ad78', // coat highlight
  '2': '#b67f4b', // coat base
  '3': '#8a5a31', // coat shade
  '4': '#5c3a1d', // coat dark
  w: '#f4ecda', W: '#d6c5a5', v: '#a79578', // white markings
  A: '#ebe1c7', a: '#b6a37f', b: '#7a6a4e', // antler
  k: '#1a130e', K: '#352619',               // nose, hooves
  r: '#b01818', R: '#ff7a7a',               // eye
};

const r = (ch: string, n: number) => ch.repeat(n);

/** The rest pose sits 2 px left of centre so the lunge has room to drive forward. */
const DX = -2;
/** Hoof bottoms; the outline lands on the row below. */
const GROUND = 61;

// ---------------------------------------------------------------- body blocks

const TORSO: Part = { y0: 28, rows: [
  /*28*/ [[15, '1111'], [32, '11' + r('2', 9) + '3334']],
  /*29*/ [[13, '11' + '2222' + '1111'], [29, '111' + r('2', 11) + '3334']],
  /*30*/ [[11, '11111' + r('2', 7) + '111111' + r('2', 14) + '334']],
  /*31*/ [[10, '11111' + r('2', 29) + '34']],
  /*32*/ [[9, '11111' + r('2', 16) + '3' + r('2', 12) + '34']],
  /*33*/ [[9, '2111' + r('2', 17) + '33' + r('2', 11) + '34']],
  /*34*/ [[8, '2211' + r('2', 18) + '33' + r('2', 10) + '34']],
  /*35*/ [[8, r('2', 23) + '33' + r('2', 9) + '34']],
  /*36*/ [[8, '3' + r('2', 22) + '33' + r('2', 8) + '34']],
  /*37*/ [[8, '333' + r('2', 21) + '33' + r('2', 7) + '34']],
  /*38*/ [[9, '333' + '222222' + '3' + r('3', 14) + '44' + r('3', 6) + '4']],
  /*39*/ [[9, '33' + '2222222' + 'WWW' + r('3', 13) + '44' + r('3', 5) + '4']],
  /*40*/ [[10, '3' + '222222' + '4' + 'www' + 'WW' + r('3', 12) + '44' + r('3', 3) + '4']],
  /*41*/ [[21, 'ww' + r('w', 13) + 'v' + '4444']],
  /*42*/ [[23, r('W', 8) + 'vvvv' + '444444']],
] };

const TAIL: Part = { y0: 31, rows: [
  [[8, '12']],
  [[7, '32']],
  [[7, '32']],
  [[6, 'W3']],
  [[6, 'W3']],
  [[6, 'W3']],
  [[6, 'W']],
  [[6, 'W']],
] };

/** Head at rest: skull back at x 47, nose at x 62, eye at (55, 13). Ear and antlers move with it. */
const HEAD: Part = { y0: 10, rows: [
  /*10*/ [[49, '21111']],
  /*11*/ [[47, '222222211']],
  /*12*/ [[47, '1' + r('2', 8) + '11']],
  /*13*/ [[47, r('2', 7) + 'WrR21']],
  /*14*/ [[47, r('2', 7) + 'Wrr221']],
  /*15*/ [[47, r('2', 8) + 'WW2221']],
  /*16*/ [[47, r('2', 10) + '3332k']],
  /*17*/ [[48, r('2', 8) + '3333wkk']],
  /*18*/ [[48, '22' + r('3', 10) + 'wwK']],
  /*19*/ [[49, '3WWWW3333wwww']],
  /*20*/ [[49, 'wwwwwvvWWWW']],
  /*21*/ [[50, 'WWWvv']],
] };

const EAR: Part = { y0: 4, rows: [
  [[44, '3']],
  [[43, '3W2']],
  [[43, '3WW2']],
  [[43, '3WWW2']],
  [[44, '3WW2']],
  [[45, '3W22']],
  [[46, '3222']],
] };

/** Near antler: main beam sweeps back off the pedicle, arcs forward over the face, two tines. */
const ANTLER: Part = { y0: 1, rows: [
  [[53, 'A']],
  [[52, 'AA'], [57, 'A']],
  [[51, 'AaaA'], [57, 'A']],
  [[50, 'Aa'], [54, 'aAAaA']],
  [[49, 'Aa'], [58, 'aA']],
  [[49, 'Aa'], [59, 'aA']],
  [[49, 'aa']],
  [[50, 'aa']],
  [[51, 'aa']],
] };
/** The far antler is the near one a px back and down in the darker tones; it reads as the beam's underside. */
const ANTLER_FAR: Part = { y0: ANTLER.y0 + 1, rows: ANTLER.rows.map((segs) => segs.map(([x, run]) => [x - 1, run] as [number, string])) };
const ANTLER_FAR_TONES: Remap = { A: 'a', a: 'b' };

/** Neck with the head up (rest and walk): withers at (33, 28) to the skull at (47, 13). */
const NECK_UP: Part = { y0: 13, rows: [
  /*13*/ [[46, '1']],
  /*14*/ [[45, '12']],
  /*15*/ [[44, '122']],
  /*16*/ [[43, '1222']],
  /*17*/ [[43, '12222']],
  /*18*/ [[42, '122222']],
  /*19*/ [[41, '1' + r('2', 6) + '3']],
  /*20*/ [[40, '1' + r('2', 6) + '33']],
  /*21*/ [[39, '1' + r('2', 6) + '3WWW']],
  /*22*/ [[38, '1' + r('2', 6) + '3vvv3']],
  /*23*/ [[37, '1' + r('2', 7) + '33334']],
  /*24*/ [[36, '1' + r('2', 7) + '33334']],
  /*25*/ [[36, '1' + r('2', 7) + '33334']],
  /*26*/ [[35, '1' + r('2', 7) + '33334']],
  /*27*/ [[34, '1' + r('2', 8) + '33334']],
] };

/** Head dropped by HEAD_DROP for the lunge: the neck flattens to ~35° and its underside bulges into the chest. */
const HEAD_DROP = 6;
const NECK_MID: Part = { y0: 18, rows: [
  /*18*/ [[46, '1']],
  /*19*/ [[45, '12']],
  /*20*/ [[43, '1222']],
  /*21*/ [[42, '12222']],
  /*22*/ [[41, '122222']],
  /*23*/ [[39, '1' + r('2', 7) + '3']],
  /*24*/ [[38, '1' + r('2', 7) + '33']],
  /*25*/ [[37, '1' + r('2', 7) + '3333']],
  /*26*/ [[35, '1' + r('2', 8) + '33WWW']],
  /*27*/ [[34, '1' + r('2', 8) + '33WWWWv']],
  /*28*/ [[43, '333WWvv']],
  /*29*/ [[43, '3333vv']],
  /*30*/ [[43, '33334']],
  /*31*/ [[44, '334']],
  /*32*/ [[43, '334']],
] };

// ---------------------------------------------------------------- legs

/** Far-side legs are the same shapes in the shade tones. */
const FAR: Remap = { '1': '3', '2': '3', '3': '4', '4': '4' };

const FOREARM: Record<number, string> = { 4: '1223', 3: '123' };
const THIGH: Record<number, string> = { 7: '2222223', 6: '222233', 5: '22233' };
const CANNON: Record<number, string> = { 3: '233', 2: '23' };

const KNEE: Part = { y0: 0, rows: [[[0, '2233']], [[0, '2233']]] };
const HOCK: Part = { y0: 0, rows: [[[0, '32233']], [[0, '32233']], [[0, '3233']], [[0, '3233']]] };

type Hoof = 'flat' | 'tuck';
const HOOF_FRONT: Record<Hoof, Part> = {
  flat: { y0: 0, rows: [[[0, '34']], [[0, 'KKK']], [[0, 'kkkk']], [[0, 'kkkk']]] },
  tuck: { y0: 0, rows: [[[0, '34']], [[-1, 'KKK']], [[-1, 'kkk']], [[0, 'kk']]] },
};
const HOOF_HIND: Record<Hoof, Part> = {
  flat: { y0: 0, rows: [[[0, '334']], [[0, 'KKKK']], [[0, 'kkkk']], [[0, 'kkkk']]] },
  tuck: { y0: 0, rows: [[[0, '34']], [[-1, 'KKK']], [[-1, 'kkk']], [[0, 'kk']]] },
};

/** Fetlock row of a hoof standing on the ground (the hoof block is 3 rows below it). */
const FETLOCK = GROUND - 3;

/**
 * Walk phases, 0 = touchdown with the hoof furthest forward, 0-4 on the
 * ground sliding back, 5-7 lifted and swinging forward.
 * Front: [knee x, knee y, fetlock x, fetlock y, hoof]; the elbow is fixed at x 38.5.
 */
const FRONT_PHASES: ReadonlyArray<readonly [number, number, number, number, Hoof]> = [
  [41, 49, 43.5, FETLOCK, 'flat'],
  [40, 49, 41.5, FETLOCK, 'flat'],
  [39.5, 49, 39.5, FETLOCK, 'flat'],
  [38.5, 49, 37.5, FETLOCK, 'flat'],
  [37.5, 49, 35.5, FETLOCK, 'flat'],
  [37.5, 49, 35, FETLOCK - 2, 'tuck'],
  [40, 48, 37.5, FETLOCK - 4, 'tuck'],
  [41.5, 48, 42, FETLOCK - 2, 'flat'],
];
/** Hind: [hock x, hock y, fetlock x, fetlock y, hoof]; the stifle is fixed at x 13.5. */
const HIND_PHASES: ReadonlyArray<readonly [number, number, number, number, Hoof]> = [
  [13.5, 48, 18, FETLOCK, 'flat'],
  [12.5, 48, 16, FETLOCK, 'flat'],
  [11.5, 48, 14, FETLOCK, 'flat'],
  [10.5, 48, 12, FETLOCK, 'flat'],
  [9.5, 48, 10, FETLOCK, 'flat'],
  [9.5, 48, 9.5, FETLOCK - 2, 'tuck'],
  [11, 47, 12, FETLOCK - 4, 'tuck'],
  [12.5, 48, 15.5, FETLOCK - 2, 'flat'],
];

function frontLeg(put: HdPut, phase: number, ox: number, oy: number, remap?: Remap): void {
  const [kx, ky, fx, fy, hoof] = FRONT_PHASES[phase];
  limb(put, PAL, 38.5 + ox, 41 + oy, kx + ox, ky - 1, 4, 3, FOREARM, remap);
  blit(put, PAL, KNEE, Math.round(kx - 1.5) + ox, ky, remap);
  limb(put, PAL, kx + ox, ky + 2, fx + ox, fy - 1, 3, 2, CANNON, remap);
  blit(put, PAL, HOOF_FRONT[hoof], Math.round(fx - 0.5) + ox, fy, remap);
}

function hindLeg(put: HdPut, phase: number, ox: number, oy: number, remap?: Remap): void {
  const [hx, hy, fx, fy, hoof] = HIND_PHASES[phase];
  limb(put, PAL, 13.5 + ox, 39 + oy, hx + 1.5 + ox, hy - 2, 7, 5, THIGH, remap);
  blit(put, PAL, HOCK, Math.round(hx - 2) + ox, hy - 2, remap);
  limb(put, PAL, hx + 0.5 + ox, hy + 2, fx - 0.5 + ox, fy - 1, 3, 2, CANNON, remap);
  blit(put, PAL, HOOF_HIND[hoof], Math.round(fx - 1) + ox, fy, remap);
}

// ---------------------------------------------------------------- frames

/** Body lift per walk frame: up a px while the hind legs pass under the body. */
const BOB = [0, 0, -1, -1, 0, 0, -1, -1];

type Pose = {
  dx: number; dy: number;
  neck: 'up' | 'mid';
  /** Walk phase per leg: [near hind, near front, far hind, far front]. */
  legs: readonly [number, number, number, number];
};

const LUNGE: readonly Pose[] = [
  { dx: -3, dy: 0, neck: 'up',  legs: [3, 1, 1, 4] },  // pull back
  { dx: -3, dy: 0, neck: 'mid', legs: [3, 1, 1, 4] },  // head drops
  { dx: 2,  dy: 1, neck: 'mid', legs: [4, 0, 0, 3] },  // drive forward
  { dx: 2,  dy: 1, neck: 'mid', legs: [4, 0, 0, 3] },  // hold
  { dx: 0,  dy: 0, neck: 'up',  legs: [3, 2, 2, 5] },  // recover
];

function walkPose(i: number): Pose {
  return { dx: 0, dy: BOB[i], neck: 'up', legs: [i, (i + 6) % 8, (i + 4) % 8, (i + 2) % 8] };
}

export function drawDeer(f: MeadowFrame): HdDraw {
  const pose = f.startsWith('move') ? walkPose(+f.slice(4)) : LUNGE[+f.slice(3)];
  return (put) => {
    const ox = DX + pose.dx, oy = pose.dy;
    const headDy = pose.neck === 'mid' ? HEAD_DROP : 0;
    const [nh, nf, fh, ff] = pose.legs;
    blit(put, PAL, ANTLER_FAR, ox, oy + headDy, ANTLER_FAR_TONES);
    hindLeg(put, fh, ox, oy, FAR);
    frontLeg(put, ff, ox, oy, FAR);
    hindLeg(put, nh, ox, oy);
    frontLeg(put, nf, ox, oy);
    blit(put, PAL, TAIL, ox, oy);
    blit(put, PAL, TORSO, ox, oy);
    blit(put, PAL, pose.neck === 'mid' ? NECK_MID : NECK_UP, ox, oy);
    blit(put, PAL, HEAD, ox, oy + headDy);
    blit(put, PAL, EAR, ox, oy + headDy);
    blit(put, PAL, ANTLER, ox, oy + headDy);
  };
}
