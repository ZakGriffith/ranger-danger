// Meadow rat — a lean brown rat in side view (Enemy flips X), hand-placed
// pixel blocks (pixels.ts) at 64 px. Three palettes so a pack is not a row
// of identical clones; each Enemy picks one at spawn (Enemy.texPrefix).
//
// Frames: an 8-frame bounding run (move0..7: push off the hind feet,
// stretch through the air, land on the forefeet, gather the hind feet
// forward under the body) and a 5-frame bite (atk0..4: crouch back, lunge,
// jaws open, snap, recover). Three body blocks carry the gait (standing,
// stretched, gathered); the legs and tail are small blocks keyed per frame.

import type { HdDraw } from './hd';
import { blit, type Palette, type Part, type Remap } from './pixels';
import type { MeadowFrame } from './meadow';

const r = (ch: string, n: number) => ch.repeat(n);

const SKIN = {
  p: '#e8a8a0', P: '#c48880', q: '#7f4f4b',   // bare skin: ears, feet, nose
  E: '#7a6350', e: '#4a3a2c',                 // ear rims (near, far)
  t: '#c9a090', T: '#9e7466', u: '#6b4a40',   // tail
  r: '#b01818', R: '#ff7a7a',                 // eye
  w: '#f2eee4', k: '#1a130e',                 // teeth, mouth
} as const;

const PALETTES: readonly Palette[] = [
  // agouti brown
  { '1': '#b89a78', '2': '#8c7254', '3': '#66503a', '4': '#43321f', c: '#d9ccb0', C: '#b3a78c', ...SKIN },
  // darker grey-brown
  { '1': '#9c8a74', '2': '#6e5c4a', '3': '#4c3f32', '4': '#30271d', c: '#c4b8a2', C: '#9c9080', ...SKIN },
  // sandy tan
  { '1': '#cdb088', '2': '#a3865c', '3': '#78603f', '4': '#4f3d26', c: '#e6dcc2', C: '#c0b49a', ...SKIN },
];
export const RAT_VARIANTS = PALETTES.length;

/** Facing right. Ground (foot bottoms) is y=51. Blocks are authored with the nose at x 62 and shifted by DX. */
const DX = -4;

/** Far-side legs are the same shapes in the shade tones. */
const FAR: Remap = { '1': '3', '2': '3', '3': '4', '4': '4', p: 'P', P: 'q' };

// ---------------------------------------------------------------- bodies (head included)

/** Standing: humped rump, dip at the neck, domed skull, wedge snout. Eye at (54, 40). */
const BODY_STAND: Part = { y0: 33, rows: [
  /*33*/ [[25, '111111']],
  /*34*/ [[23, '11' + '222222' + '111']],
  /*35*/ [[22, '111' + r('2', 9) + '111']],
  /*36*/ [[21, '111' + r('2', 13) + '111']],
  /*37*/ [[21, r('2', 19) + '1111'], [48, '11111']],
  /*38*/ [[20, r('2', 24) + '1111' + '22222' + '11']],
  /*39*/ [[20, '3' + r('2', 34) + '11']],
  /*40*/ [[20, '3' + r('2', 33) + 'rR' + '2' + '1']],
  /*41*/ [[20, '3' + r('2', 33) + 'r' + '222' + '1']],
  /*42*/ [[21, '33' + r('2', 33) + '333' + '1']],
  /*43*/ [[21, '333' + r('2', 31) + r('3', 6) + 'Pq']],
  /*44*/ [[22, '3333' + r('2', 27) + r('3', 7) + 'C' + '3' + 'q']],
  /*45*/ [[23, r('3', 35) + 'CC' + '3']],
  /*46*/ [[24, '4' + r('c', 31)]],
  /*47*/ [[26, '4' + r('C', 15)]],
] };

/** Stretched low for the flight phase: back nearly flat, a row lower and the head a row lower. */
const BODY_RUN: Part = { y0: 37, rows: [
  /*37*/ [[24, '11111111']],
  /*38*/ [[22, '11' + r('2', 8) + r('1', 11)], [47, '111111']],
  /*39*/ [[21, '1' + r('2', 21) + '1111' + r('2', 6) + '11']],
  /*40*/ [[21, r('2', 34) + '11']],
  /*41*/ [[21, '3' + r('2', 32) + 'rR' + '2' + '1']],
  /*42*/ [[21, '3' + r('2', 32) + 'r' + '222' + '1']],
  /*43*/ [[21, '33' + r('2', 33) + '333' + '1']],
  /*44*/ [[22, '333' + r('2', 30) + r('3', 6) + 'Pq']],
  /*45*/ [[23, '333' + r('2', 26) + r('3', 7) + 'C' + '3' + 'q']],
  /*46*/ [[24, r('3', 34) + 'CC' + '3']],
  /*47*/ [[25, '4' + r('c', 30)]],
  /*48*/ [[27, '4' + r('C', 15)]],
] };

/** Gathered: rump pulled in three px and arched two px higher as the hind feet land under the body. */
const BODY_GATHER: Part = { y0: 31, rows: [
  /*31*/ [[27, '111111']],
  /*32*/ [[25, '11' + '222222' + '11']],
  /*33*/ [[24, '11' + r('2', 9) + '11']],
  /*34*/ [[23, '11' + r('2', 11) + '11']],
  /*35*/ [[23, '1' + r('2', 14) + '11']],
  /*36*/ [[23, '1' + r('2', 16) + '11']],
  /*37*/ [[23, r('2', 18) + '111'], [48, '11111']],
  /*38*/ [[23, r('2', 21) + '1111' + '22222' + '11']],
  /*39*/ [[23, '3' + r('2', 31) + '11']],
  /*40*/ [[23, '3' + r('2', 30) + 'rR' + '2' + '1']],
  /*41*/ [[23, '3' + r('2', 30) + 'r' + '222' + '1']],
  /*42*/ [[24, '33' + r('2', 30) + '333' + '1']],
  /*43*/ [[24, '333' + r('2', 28) + r('3', 6) + 'Pq']],
  /*44*/ [[25, '3333' + r('2', 24) + r('3', 7) + 'C' + '3' + 'q']],
  /*45*/ [[26, r('3', 32) + 'CC' + '3']],
  /*46*/ [[27, '4' + r('c', 28)]],
  /*47*/ [[29, '4' + r('C', 12)]],
] };

/** Jaws open for the bite, laid over BODY_RUN's snout: dark mouth, a tooth top and bottom, the lower jaw dropped two px. */
const JAW_OPEN: Part = { y0: 45, rows: [
  [[54, 'kkkkkkw']],
  [[53, '3kkkkwC']],
  [[53, '33333C']],
  [[54, '333']],
] };

// ---------------------------------------------------------------- ears, tails

const EAR_NEAR: Part = { y0: 32, rows: [
  [[49, 'EEE']],
  [[48, 'EpppE']],
  [[48, 'EpppE']],
  [[48, 'EPPPE']],
  [[48, 'EPPPE']],
  [[49, 'EPE']],
] };

const EAR_FAR: Part = { y0: 33, rows: [
  [[46, 'ee']],
  [[45, 'ePe']],
  [[45, 'ePe']],
  [[45, 'ePe']],
  [[46, 'ee']],
] };

/** Drooping to the ground behind the rump (standing, gathered). */
const TAIL_DROOP: Part = { y0: 42, rows: [
  [[19, 'tttt']],
  [[16, 'tttTTTT']],
  [[13, 'tttTTTuu']],
  [[11, 'ttTTu']],
  [[9, 'ttTT']],
  [[7, 'ttT']],
  [[5, 'tT']],
] };

/** Streaming out behind at the top of the bound, tip flicked up. */
const TAIL_STRAIGHT: Part = { y0: 43, rows: [
  [[2, 'tt'], [14, 'tttttttt']],
  [[3, 'tttt' + r('T', 15)]],
  [[8, r('u', 14)]],
] };

/** Between the two: out behind and sagging. */
const TAIL_MID: Part = { y0: 42, rows: [
  [[18, 'ttttt']],
  [[12, 'tttttt' + 'TTTTT']],
  [[5, 'ttttttt' + 'TTTTTTT' + 'uuu']],
  [[3, 'ttt' + r('T', 6)]],
] };

// ---------------------------------------------------------------- legs (near side; far side via FAR)

/** Hind leg poses. Hind feet are long and sit flat when planted. */
const H_STAND: Part = { y0: 48, rows: [
  [[27, '33']],
  [[28, '33']],
  [[27, '3PPPPPPq']],
  [[28, 'qqqqqqq']],
] };
/** Foot planted forward under the belly, leg folded (gathered). */
const H_PLANT: Part = { y0: 47, rows: [
  [[28, '33']],
  [[29, '33']],
  [[30, '33']],
  [[31, '3PPPPPPq']],
  [[32, 'qqqqqqq']],
] };
/** Driving back off the toes (push-off). */
const H_PUSH: Part = { y0: 47, rows: [
  [[25, '33']],
  [[24, '33']],
  [[22, 'P33']],
  [[20, 'PPP']],
  [[18, 'qqq']],
] };
/** Fully extended behind, foot off the ground (flight). */
const H_TRAIL: Part = { y0: 47, rows: [
  [[23, '33']],
  [[22, '33']],
  [[20, 'PP3']],
  [[18, 'PPP']],
  [[17, 'qq']],
] };
/** Folded forward under the body, foot off the ground (swinging through). */
const H_FOLD: Part = { y0: 47, rows: [
  [[28, '33']],
  [[29, '333']],
  [[30, 'PPPP']],
  [[31, 'qqq']],
] };

/** Foreleg poses. */
const F_SUPPORT: Part = { y0: 48, rows: [
  [[43, '32']],
  [[43, '32']],
  [[43, '3PPP']],
  [[44, 'qqq']],
] };
/** Reaching forward, paw off the ground. */
const F_REACH: Part = { y0: 47, rows: [
  [[44, '32']],
  [[46, '32']],
  [[48, '3PP']],
  [[50, 'qq']],
] };
/** Landed ahead of the chest. */
const F_LAND: Part = { y0: 48, rows: [
  [[45, '32']],
  [[47, '32']],
  [[49, '3PP']],
  [[50, 'qqq']],
] };
/** Angled back under the chest, pushing. */
const F_BACK: Part = { y0: 48, rows: [
  [[42, '32']],
  [[41, '32']],
  [[39, 'PPP']],
  [[39, 'qqq']],
] };
/** Tucked up under the chest, off the ground. */
const F_TUCK: Part = { y0: 47, rows: [
  [[43, '32']],
  [[42, '32']],
  [[41, 'PP']],
  [[41, 'qq']],
] };

/** Whiskers on the raw layer: no outline, visible only outside the silhouette. Relative to the standing head. */
const WHISKERS: ReadonlyArray<readonly [number, number]> = [
  [58, 39], [59, 38], [60, 37],
  [59, 41], [60, 41], [61, 40],
  [61, 45], [62, 46], [63, 47],
];

// ---------------------------------------------------------------- frames

type Body = 'stand' | 'run' | 'gather';
const BODIES: Record<Body, { part: Part; headDy: number; tailDx: number }> = {
  stand:  { part: BODY_STAND,  headDy: 0, tailDx: 0 },
  run:    { part: BODY_RUN,    headDy: 1, tailDx: 0 },
  gather: { part: BODY_GATHER, headDy: 0, tailDx: 3 },
};

type Pose = {
  body: Body;
  /** Whole-rat offset; dy lifts the body and head only, the feet stay keyed to the ground. */
  dx: number; dy: number;
  tail: Part;
  /** [near hind, far hind, near fore, far fore]; far legs sit 3 px ahead (hind) or behind (fore). */
  legs: readonly [Part, Part, Part, Part];
  jaws?: boolean;
};

const RUN: readonly Pose[] = [
  { body: 'stand',  dx: 0, dy: 0,  tail: TAIL_MID,      legs: [H_PUSH,  H_PUSH,  F_REACH,   F_TUCK] },
  { body: 'run',    dx: 0, dy: -1, tail: TAIL_STRAIGHT, legs: [H_TRAIL, H_TRAIL, F_REACH,   F_REACH] },
  { body: 'run',    dx: 0, dy: -2, tail: TAIL_STRAIGHT, legs: [H_TRAIL, H_TRAIL, F_LAND,    F_REACH] },
  { body: 'run',    dx: 0, dy: -1, tail: TAIL_STRAIGHT, legs: [H_FOLD,  H_FOLD,  F_LAND,    F_SUPPORT] },
  { body: 'stand',  dx: 0, dy: 0,  tail: TAIL_MID,      legs: [H_FOLD,  H_FOLD,  F_SUPPORT, F_BACK] },
  { body: 'gather', dx: 0, dy: 0,  tail: TAIL_DROOP,    legs: [H_PLANT, H_PLANT, F_BACK,    F_BACK] },
  { body: 'gather', dx: 0, dy: 1,  tail: TAIL_DROOP,    legs: [H_PLANT, H_PLANT, F_TUCK,    F_TUCK] },
  { body: 'stand',  dx: 0, dy: 0,  tail: TAIL_MID,      legs: [H_STAND, H_PUSH,  F_TUCK,    F_BACK] },
];

const BITE: readonly Pose[] = [
  { body: 'gather', dx: 0, dy: 0,  tail: TAIL_DROOP,    legs: [H_PLANT, H_PLANT, F_BACK,    F_BACK] },
  { body: 'stand',  dx: 1, dy: 0,  tail: TAIL_MID,      legs: [H_PUSH,  H_PUSH,  F_REACH,   F_REACH] },
  { body: 'run',    dx: 3, dy: 0,  tail: TAIL_STRAIGHT, legs: [H_TRAIL, H_TRAIL, F_LAND,    F_REACH], jaws: true },
  { body: 'run',    dx: 3, dy: 0,  tail: TAIL_STRAIGHT, legs: [H_TRAIL, H_FOLD,  F_SUPPORT, F_LAND], jaws: true },
  { body: 'stand',  dx: 1, dy: 0,  tail: TAIL_MID,      legs: [H_STAND, H_PUSH,  F_SUPPORT, F_BACK] },
];

export function drawRat(f: MeadowFrame, variant: number): HdDraw {
  const pal = PALETTES[variant];
  if (!pal) throw new Error(`drawRat: no palette for variant ${variant}`);
  const pose = f.startsWith('move') ? RUN[+f.slice(4)] : BITE[+f.slice(3)];
  const { part: body, headDy, tailDx } = BODIES[pose.body];
  return (put, raw) => {
    const ox = DX + pose.dx, oy = pose.dy;
    const [nh, fh, nf, ff] = pose.legs;
    blit(put, pal, pose.tail, ox + tailDx, oy);
    blit(put, pal, fh, ox + 3, 0, FAR);
    blit(put, pal, ff, ox - 3, 0, FAR);
    blit(put, pal, EAR_FAR, ox, oy + headDy);
    blit(put, pal, body, ox, oy);
    if (pose.jaws) blit(put, pal, JAW_OPEN, ox, oy);
    blit(put, pal, nh, ox, 0);
    blit(put, pal, nf, ox, 0);
    blit(put, pal, EAR_NEAR, ox, oy + headDy);
    for (const [x, y] of WHISKERS) raw(x + ox, y + oy + headDy, '#ece8dc', 0.75);
  };
}
