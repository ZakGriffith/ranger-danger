// Side-view design tries for the meadow snake and rat, for picking a
// direction before it goes into src/assets/art/meadow.ts. Not imported by
// the game. Render with:
//
//   node scripts/render-sprite-sheet.cjs --tries scripts/sprite-tries/meadow-side-view.ts
//
// Each try is one parameter set fed through a shared side-view drawer, so
// a pick can be tuned further rather than redrawn.

import { HdDraw, HdPut, RawPut, Paint, Mat, rect, disc, ellipse, line, poly } from '../../src/assets/art/hd';
import type { MeadowFrame } from '../../src/assets/art/meadow';

export type Try = { name: string; frames: ReadonlyArray<{ label: string; draw: HdDraw }> };

const TAU = Math.PI * 2;
const GY = 55;   // ground line: bottom of the snake's body, the rat's feet
const KEY_FRAMES: readonly MeadowFrame[] = ['move0', 'move2', 'move4', 'move6', 'atk0', 'atk3'];

type Pt = readonly [number, number];

function phases(f: MeadowFrame): { move: number; atk: number } {
  return f.startsWith('move') ? { move: +f.slice(4), atk: -1 } : { move: -1, atk: +f.slice(3) };
}
function smooth(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
type Xform = (lx: number, ly: number) => Pt;
function xform(ox: number, oy: number, angle: number): Xform {
  const c = Math.cos(angle), s = Math.sin(angle);
  return (lx, ly) => [ox + lx * c - ly * s, oy + lx * s + ly * c];
}
function putAt(put: HdPut, pt: Pt, p: Paint): void {
  put(Math.round(pt[0]), Math.round(pt[1]), p);
}
function rawAt(raw: RawPut, pt: Pt, hex: string, alpha = 1): void {
  raw(Math.round(pt[0]), Math.round(pt[1]), hex, alpha);
}
/** Catmull-Rom spline through `pts`, `per` samples per segment. */
function spline(pts: readonly Pt[], per: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const at = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ==================================================================
//  SNAKE — side view, facing right. The body is a chain of discs along a
//  spline spine. Flat styles undulate along the ground; raised styles
//  bring the front third up through an S so the head rides high.
// ==================================================================
type SnakeStyle = {
  body: Mat;
  pattern: Paint;
  patternH: number; // dorsal zigzag height, px
  belly: Paint;
  eye: string;
  thick: number;    // max body thickness, px
  amp: number;      // arch height of the ground slither, px
  raise: number;    // head height above the ground, px (0 = flat slither)
  headLen: number;
  headH: number;
  hood: number;     // cobra hood depth behind the head, px (0 = none)
  cartoon: boolean; // white eye with a pupil, rounder skull
};

function sideSnake(st: SnakeStyle, f: MeadowFrame): HdDraw {
  return (put, raw) => {
    const { move, atk } = phases(f);
    const [reach, gape, venom] = atk >= 0
      ? ([[-5, 0, 0], [-3, 0.4, 0], [4, 1, 0], [6, 1, 1], [1, 0.4, 0]] as const)[atk]
      : ([0, 0, 0] as const);
    const phi = move >= 0 ? move * (TAU / 8) : atk * 0.5;
    const tail = 4, neck = 43 + reach;
    const base = GY - st.thick / 2;
    const k = (TAU * 1.5) / (neck - tail);
    const wave = (x: number) => st.amp * (0.5 + 0.5 * Math.sin(k * (x - tail) + phi));

    const ctrl: Pt[] = [];
    if (st.raise <= 0) {
      for (let x = tail; x < neck; x += 4) ctrl.push([x, base - wave(x) * (1 - 0.3 * (x - tail) / (neck - tail))]);
      ctrl.push([neck, base - wave(neck) * 0.7]);
    } else {
      const xRise = neck - 13;
      const lift = st.raise + (atk === 0 || atk === 1 ? 4 : 0);    // coils higher while winding up
      for (let x = tail; x < xRise; x += 4) ctrl.push([x, base - wave(x) * 0.8]);
      ctrl.push([xRise, base - wave(xRise) * 0.5], [xRise + 4, base - lift * 0.12], [xRise + 6, base - lift * 0.5],
        [xRise + 8, base - lift * 0.9], [xRise + 11, base - lift], [neck, base - lift + 1]);
    }
    const pts = spline(ctrl, 8);
    const n = pts.length;
    const thickAt = (u: number) =>
      u < 0.5 ? 2 + (st.thick - 2) * smooth(u / 0.5) : st.thick - (st.thick - 6) * smooth((u - 0.5) / 0.5);

    for (let i = 0; i < n; i++) disc(put, pts[i][0], pts[i][1], thickAt(i / (n - 1)) / 2, st.body);
    // belly scutes along the underside, dorsal zigzag along the back
    let arc = 0;
    for (let i = 1; i < n; i++) {
      const [x, y] = pts[i], [px, py] = pts[i - 1];
      const dx = x - px, dy = y - py, d = Math.hypot(dx, dy) || 1;
      arc += d;
      const nx = dy / d, ny = -dx / d;                       // normal toward the back
      const r = thickAt(i / (n - 1)) / 2;
      if (r >= 2) for (let j = 1; j <= 2; j++) put(Math.round(x - nx * (r - j)), Math.round(y - ny * (r - j)), st.belly);
      const p7 = Math.floor(arc) % 7;
      if (r >= 3 && p7 < 3) {
        const h = [st.patternH - 1, st.patternH, st.patternH - 1][p7];
        for (let j = 0; j < h; j++) put(Math.round(x + nx * (r - 1 - j)), Math.round(y + ny * (r - 1 - j)), st.pattern);
      }
      if (r < 2 && Math.floor(arc) % 3 === 0) put(Math.round(x), Math.round(y), st.pattern);
    }

    // head — hinged at the neck, aligned with the end of the spine
    const [hx, hy] = pts[n - 1];
    const [ax, ay] = pts[n - 4];
    const T = xform(hx, hy, Math.atan2(hy - ay, hx - ax) + (gape > 0 ? 0.12 : 0));
    const L = st.headLen, hh = st.headH / 2;
    if (st.hood > 0) {
      const flare = atk >= 0 ? 1 : 0.5;
      const [cx, cy] = T(-3, 0);
      ellipse(put, cx, cy, 3 + st.hood * 0.4 * flare, hh + st.hood * flare, st.body);
    }
    poly(put, [T(-1, -3.5), T(3, -hh), T(L - 4, -hh + 0.5), T(L, -1), T(L, 1.5), T(L - 5, 3), T(2, 3.5), T(-1, 3)], st.body);
    if (st.cartoon) { const [cx, cy] = T(5, -1.5); disc(put, cx, cy, hh + 1, st.body); }
    if (gape > 0) {
      // lower jaw swings down from a hinge under the eye; interior shows behind it
      const [jx, jy] = T(3, 2);
      const J = xform(jx, jy, Math.atan2(hy - ay, hx - ax) + gape * 0.7);
      poly(put, [J(0, -1), J(L - 4, -2), J(L - 4, 0.5), J(0, 2)], 'red.dd');
      poly(put, [J(0, 0), J(L - 4, -0.5), J(L - 4, 1.5), J(0, 2)], st.body);
      putAt(put, T(L - 3, 2), 'string.l');
      putAt(put, T(L - 3, 3), 'string.l');
      if (venom) { rawAt(raw, T(L - 2, 6), '#86e060'); rawAt(raw, T(L - 1, 8), '#86e060'); }
    } else {
      putAt(put, T(L - 2, 1.5), '#1a2a12');
      putAt(put, T(L - 5, 2), '#1a2a12');
    }
    if (st.cartoon) {
      for (let ex = 4; ex <= 6; ex++) for (let ey = -3; ey <= -1; ey++) putAt(put, T(ex, ey), '#ffffff');
      putAt(put, T(6, -2), '#0b0f1a');
      putAt(put, T(6, -1), '#0b0f1a');
    } else {
      putAt(put, T(5, -2), st.eye);
      putAt(put, T(5, -1), st.eye);
      putAt(put, T(6, -2), '#0b0f1a');
      putAt(put, T(6, -1), '#0b0f1a');
    }
    putAt(put, T(L - 1, -0.5), '#1a2a12');                         // nostril
    if (move === 4) {                                               // tongue flick
      for (let i = 2; i <= 4; i++) rawAt(raw, T(L + i, 0.5), '#e03848');
      rawAt(raw, T(L + 5, -0.5), '#e03848');
      rawAt(raw, T(L + 5, 1.5), '#e03848');
    }
  };
}

// ==================================================================
//  RAT — side view, facing right. Arched back over a flat belly, head
//  carried low and tapering to the snout, short legs in a diagonal-pair
//  scurry, naked tail behind.
// ==================================================================
type RatStyle = {
  fur: Mat;
  belly: Paint;
  earIn: Paint;
  tail: Paint;
  eye: string;
  hump: number;     // arch height multiplier (1 = rat, 0.8 = round mouse)
  len: number;      // rump centre to shoulder centre, px
  earR: number;
  bigEye: boolean;
  snout: number;    // snout length past the skull, px
  tailUp: number;   // tail arc height, px (0 = drags on the ground)
  low: number;      // how far the head hangs below the shoulder, px
  bald: boolean;    // mangy pink patches
  legLen: number;   // hip to foot, px
};

function sideRat(st: RatStyle, f: MeadowFrame): HdDraw {
  return (put, raw) => {
    const { move, atk } = phases(f);
    const [reach, gape, crouch] = atk >= 0
      ? ([[-3, 0, 1], [-2, 0.5, 1], [4, 1, 0], [5, 0, 0], [1, 0, 0]] as const)[atk]
      : ([0, 0, 0] as const);
    const phi = move >= 0 ? move * (TAU / 8) : 0;
    const bob = move >= 0 ? -Math.round(Math.abs(Math.sin(phi)) * 1.5) : crouch;   // two bounces per cycle
    const bx = 24 + Math.round(reach * 0.4);                                         // rump centre
    const by = GY - st.legLen - 2 + bob;                                             // belly line
    const H = 6 * st.hump, L = st.len;
    const hipY = by + 2;

    // tail — drawn first so the rump overlaps its root
    for (let s = 0; s < 16; s++) {
      const arc = -st.tailUp * Math.sin(Math.PI * s / 16);
      const wave = move >= 0 ? 1.5 * Math.sin(phi - s * 0.35) : 0;
      const droop = st.tailUp === 0 ? s * 0.35 : 0;
      const ty = Math.round(by + arc + wave + droop);
      const th = s < 8 ? 2 : 1;
      rect(put, bx - 6 - s, ty - (th >> 1), 1, th, st.tail);
    }

    // legs — far pair first in the dark tone; diagonal pairs share a phase
    const furD = `${st.fur}.d` as Paint, furDD = `${st.fur}.dd` as Paint;
    const legs = [
      { x: bx - 1, far: true, k: 0 },
      { x: bx + L - 1, far: true, k: Math.PI },
      { x: bx - 2, far: false, k: Math.PI },
      { x: bx + L, far: false, k: 0 },
    ];
    for (const Lg of legs) {
      const ang = phi + Lg.k;
      const lift = move >= 0 ? Math.max(0, Math.sin(ang)) : 0;
      const footX = Math.round(Lg.x + (move >= 0 ? -3 * Math.cos(ang) : (Lg.x > bx ? 2 : -2) * (atk >= 0 ? 1 : 0)));
      const footY = GY - Math.round(3 * lift);
      const kx = Math.round((Lg.x + footX) / 2 + (Lg.x > bx ? 1 : -1)), ky = Math.round((hipY + footY) / 2);
      line(put, Lg.x, hipY, kx, ky, Lg.far ? furD : st.fur, 3);
      line(put, kx, ky, footX, footY, Lg.far ? furD : st.fur, 2);
      rect(put, footX - 1, footY - 1, 3, 2, furDD);
    }

    // body — arched back over a flat belly
    poly(put, [
      [bx - 8, by - 1], [bx - 6, by - H * 0.6], [bx - 2, by - H - 1], [bx + 4, by - H - 1.5], [bx + L - 3, by - H * 0.6], [bx + L + 2, by - 2],
      [bx + L + 3, by + 2], [bx + L, by + 4], [bx + 2, by + 4.5], [bx - 6, by + 3.5], [bx - 9, by + 1.5],
    ], st.fur);
    disc(put, bx - 6, by + 1, 3.5, st.fur);
    disc(put, bx + L, by + 1, 3.5, st.fur);
    ellipse(put, bx + L / 2 - 1, by + 3, L / 2 + 2, 1.5, st.belly);
    if (st.bald) for (const [sx, sy] of [[-4, -3], [3, -5], [8, -1]]) rect(put, bx + sx, by + sy, 3, 2, 'pink.d');

    // head — skull disc and a tapering snout, carried low
    const hx = bx + L + 5 + Math.max(0, reach), hy = by - 2 + st.low;
    disc(put, hx, hy, 4, st.fur);
    const tipX = hx + 4 + st.snout;
    poly(put, [[hx - 1, hy - 3.5], [tipX, hy + 0.5], [tipX, hy + 2], [hx + 2, hy + 4], [hx - 2, hy + 3.5]], st.fur);
    const earBack = atk === 0 || atk === 1 ? 2 : 0;
    disc(put, hx - 2 - earBack, hy - 5, st.earR - 0.5, furD);                 // far ear
    disc(put, hx + 0.5 - earBack, hy - 4.5, st.earR, st.fur);                 // near ear
    disc(put, hx + 0.5 - earBack, hy - 4.5, st.earR - 1.5, st.earIn);
    if (st.bigEye) {
      for (const [ex, ey] of [[1, -2], [2, -2], [1, -1], [2, -1]]) put(hx + ex, hy + ey, st.eye);
      put(hx + 1, hy - 2, '#ffffff');
    } else {
      put(hx + 2, hy - 1, st.eye);
      put(hx + 2, hy - 2, st.eye);
    }
    rect(put, tipX - 1, hy, 2, 2, 'pink');                                     // nose
    if (gape > 0) {
      rect(put, tipX - 5, hy + 1, 5, Math.round(2 + 2 * gape), 'red.dd');
      put(tipX - 3, hy + 1, 'string.l');                                       // incisors
      put(tipX - 2, hy + 1, 'string.l');
    }
    for (let i = 0; i < 4; i++) {                                              // whiskers
      raw(tipX - 3 + i, hy + 4 + i, '#d8d8cc');
      raw(tipX - 2 + i, hy - 3 - i, '#d8d8cc');
    }
    if (atk === 3) for (let i = 0; i < 6; i++) raw(bx - 22 + i, by - 6 + (i % 2) * 8, '#ffffff', 0.45);
  };
}

// ==================================================================
//  The tries
// ==================================================================
const SNAKES: ReadonlyArray<[string, SnakeStyle]> = [
  ['S1 grass viper (flat, naturalistic)',
    { body: 'scale', pattern: 'scale.dd', patternH: 2, belly: 'moss.l', eye: '#f2c62e', thick: 9, amp: 4, raise: 0, headLen: 13, headH: 8, hood: 0, cartoon: false }],
  ['S2 cobra (front raised, hood)',
    { body: 'moss', pattern: 'moss.dd', patternH: 2, belly: 'cream', eye: '#f2c62e', thick: 8, amp: 2.5, raise: 15, headLen: 12, headH: 8, hood: 4, cartoon: false }],
  ['S3 chunky cartoon',
    { body: 'scale', pattern: 'scale.d', patternH: 2, belly: 'moss.l', eye: '#ffffff', thick: 11, amp: 4, raise: 4, headLen: 14, headH: 11, hood: 0, cartoon: true }],
  ['S4 corrupted adder (dark, ember zigzag)',
    { body: 'ink', pattern: 'ember', patternH: 3, belly: 'ink.l', eye: '#ff3030', thick: 9, amp: 3.5, raise: 7, headLen: 13, headH: 8, hood: 0, cartoon: false }],
];

const RATS: ReadonlyArray<[string, RatStyle]> = [
  ['R1 field rat (arched back, dragging tail)',
    { fur: 'fur', belly: 'cream.d', earIn: 'pink', tail: 'pink.d', eye: '#e02828', hump: 1, len: 14, earR: 3, bigEye: false, snout: 7, tailUp: 0, low: 2, bald: false, legLen: 8 }],
  ['R2 hunched scurrier (long, low, tail up)',
    { fur: 'wood', belly: 'cream.d', earIn: 'pink', tail: 'pink.d', eye: '#e02828', hump: 1.4, len: 17, earR: 2.5, bigEye: false, snout: 8, tailUp: 7, low: 4, bald: false, legLen: 9 }],
  ['R3 round mouse (big ears, big eye)',
    { fur: 'steel', belly: 'cream', earIn: 'pink', tail: 'pink.d', eye: '#0b0f1a', hump: 0.8, len: 10, earR: 4.5, bigEye: true, snout: 5, tailUp: 3, low: 0, bald: false, legLen: 7 }],
  ['R4 plague rat (dark, mangy, red eyes)',
    { fur: 'ink', belly: 'ink.l', earIn: 'pink.d', tail: 'pink.dd', eye: '#ff3030', hump: 1.2, len: 15, earR: 3, bigEye: false, snout: 8, tailUp: 2, low: 3, bald: true, legLen: 8 }],
];

export const TRIES: Try[] = [
  ...SNAKES.map(([name, st]) => ({ name, frames: KEY_FRAMES.map((f) => ({ label: f, draw: sideSnake(st, f) })) })),
  ...RATS.map(([name, st]) => ({ name, frames: KEY_FRAMES.map((f) => ({ label: f, draw: sideRat(st, f) })) })),
];
