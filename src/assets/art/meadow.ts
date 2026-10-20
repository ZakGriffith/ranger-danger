// Meadow enemies — snake, rat and deer — drawn with the HD pipeline (hd.ts)
// at 64 px, i.e. 32 world px at the entities' 0.5 scale, replacing the
// legacy 32-px Scale2x versions that used to live in enemies.ts.
//
// Views follow how each kind moves. Snake and rat rotate to face their
// travel direction (Enemy.rotates), so they are drawn top-down facing +x.
// Deer only flips X, so it is a side view facing right.
//
// Frames: an 8-frame move cycle (move0..7) and a 5-frame attack (atk0..4)
// built as anticipation → strike → recoil. Hit flash and death are handled
// programmatically by Enemy, so there are no hit/die frames.

import { HdDraw, HdPut, RawPut, Paint, rect, disc, ellipse, line, poly } from './hd';

export const MEADOW_MOVE_FRAMES = ['move0', 'move1', 'move2', 'move3', 'move4', 'move5', 'move6', 'move7'] as const;
export const MEADOW_ATK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4'] as const;
export type MeadowFrame = (typeof MEADOW_MOVE_FRAMES)[number] | (typeof MEADOW_ATK_FRAMES)[number];
export const MEADOW_FRAMES: readonly MeadowFrame[] = [...MEADOW_MOVE_FRAMES, ...MEADOW_ATK_FRAMES];

const TAU = Math.PI * 2;
const OUTLINE = '#0b0f1a';
const EYE_YELLOW = '#f2c62e';
const EYE_RED = '#e02828';
const EYE_GLINT = '#ff9a9a';
const VENOM = '#86e060';
const TONGUE = '#e03848';
const WHISKER = '#d8d8cc';

/** move: 0..7 inside the move cycle, else -1. atk: 0..4 inside the attack, else -1. */
function phases(f: MeadowFrame): { move: number; atk: number } {
  return f.startsWith('move') ? { move: +f.slice(4), atk: -1 } : { move: -1, atk: +f.slice(3) };
}

function smooth(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

/** Rigid transform: rotate a local offset by `angle` and translate to (ox, oy). */
type Xform = (lx: number, ly: number) => readonly [number, number];
function xform(ox: number, oy: number, angle: number): Xform {
  const c = Math.cos(angle), s = Math.sin(angle);
  return (lx, ly) => [ox + lx * c - ly * s, oy + lx * s + ly * c];
}
function putAt(put: HdPut, pt: readonly [number, number], p: Paint): void {
  put(Math.round(pt[0]), Math.round(pt[1]), p);
}
function rawAt(raw: RawPut, pt: readonly [number, number], hex: string, alpha = 1): void {
  raw(Math.round(pt[0]), Math.round(pt[1]), hex, alpha);
}
function seg(put: HdPut, a: readonly [number, number], b: readonly [number, number], p: Paint, thick: number): void {
  line(put, Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), p, thick);
}

// ==================================================================
//  SNAKE — top-down viper. Lateral undulation: a wave travels tail-ward
//  along the body while the sprite moves forward, so the body reads as
//  pushing itself along. Amplitude grows toward the tail; the head rides
//  the neck with damped sway and turns with the neck tangent.
// ==================================================================
const SNAKE_TAIL = 5;
const SNAKE_NECK = 43;

/** [reach: head fore(+)/aft(-) px, gape 0..2, flare 0..1] per attack frame. */
const SNAKE_STRIKE: ReadonlyArray<readonly [number, number, number]> = [
  [-5, 0, 0.5],  // coil back
  [-3, 1, 1],    // jaw opens
  [3, 2, 1],     // lunge
  [5, 2, 1],     // full extension, venom
  [1, 1, 0.5],   // recoil
];

export function drawSnake(f: MeadowFrame, tongue = false): HdDraw {
  return (put, raw) => {
    const { move, atk } = phases(f);
    const [reach, gape, flare] = atk >= 0 ? SNAKE_STRIKE[atk] : ([0, 0, 0] as const);
    const cy = 32;
    // the wave keeps creeping through a strike so the looping attack doesn't freeze the body
    const phi = move >= 0 ? move * (TAU / 8) : atk * 0.5;
    const neckX = SNAKE_NECK + reach;
    const len = neckX - SNAKE_TAIL;
    const ampScale = 1 - reach / 12;              // straightens on the lunge, bunches on the coil
    const k = (TAU * 1.25) / len;
    const spineY = (x: number) => {
      const u = (x - SNAKE_TAIL) / len;
      return cy + (2.5 + 3.5 * (1 - u)) * ampScale * Math.sin(k * (x - SNAKE_TAIL) + phi);
    };
    const thick = (x: number) => {
      const u = (x - SNAKE_TAIL) / len;
      return u < 0.55 ? 2 + 7 * smooth(u / 0.55) : 9 - 3 * smooth((u - 0.55) / 0.45);
    };

    for (let x = SNAKE_TAIL; x <= neckX; x++) disc(put, x + 0.5, spineY(x), thick(x) / 2, 'scale');

    // dorsal diamonds are fixed to the skin: they ride the wave rather than scroll along it
    for (let x = SNAKE_TAIL; x <= neckX; x++) {
      const th = thick(x), y = Math.round(spineY(x));
      if (th < 5) {
        if ((x - SNAKE_TAIL) % 3 === 0) put(x, y, 'scale.d');   // tail banding
        continue;
      }
      const half = [0, 1, 2, 3, 3, 2, 1, 0][(x - SNAKE_TAIL) % 8];
      const h = Math.min(2 * half - 1, Math.round(th) - 4);
      if (h > 0) rect(put, x, y - (h >> 1), 1, h, 'scale.d');
      else if (half === 0) put(x, y, 'scale.l');                  // pale spine dot between diamonds
    }

    // head — a wedge hinged at the neck, turned to follow the neck tangent
    const hx = neckX, hy = spineY(neckX);
    const tangent = Math.atan2(hy - spineY(neckX - 4), 4);
    const T = xform(hx, hy, Math.max(-0.45, Math.min(0.45, tangent * 0.7)));
    const hw = 5.5 + 1.5 * flare;
    poly(put, [T(-1, -3), T(4, -hw), T(10, -hw + 1.5), T(14, -1.5), T(14, 1.5), T(10, hw - 1.5), T(4, hw), T(-1, 3)], 'scale');
    for (const s of [-1, 1]) {
      poly(put, [T(1, s * 2.6), T(8, s * 1.8), T(8, s * 0.6), T(1, s * 1.4)], 'scale.d');  // brow stripe
      for (const [ex, ey] of [[5, 3], [5, 4], [6, 3], [6, 4]]) putAt(put, T(ex, s * ey), EYE_YELLOW);
      putAt(put, T(7, s * 3), OUTLINE);                                                    // slit pupil
      putAt(put, T(7, s * 4), OUTLINE);
    }
    putAt(put, T(13, 0), 'scale.l');

    if (gape > 0) {
      poly(put, [T(8, -gape), T(14.5, -2 * gape), T(14.5, 2 * gape), T(8, gape)], 'red.dd');
      putAt(put, T(12.5, -1.2 * gape), 'string.l');                                        // fangs
      putAt(put, T(12.5, 1.2 * gape), 'string.l');
      if (atk === 3) {
        rawAt(raw, T(16, 2.5), VENOM);
        rawAt(raw, T(17, 3.5), VENOM);
      }
    } else if (tongue) {
      // forked tongue on the raw layer so it stays 1 px wide with no outline
      for (let i = 16; i <= 18; i++) rawAt(raw, T(i, 0), TONGUE);
      rawAt(raw, T(19, -1), TONGUE);
      rawAt(raw, T(19, 1), TONGUE);
    }
  };
}

// ==================================================================
//  RAT — top-down, low scurry. Diagonal leg pairs alternate: the stance
//  pair reaches out while the swing pair tucks in. The naked tail whips
//  behind with a lag.
// ==================================================================

/** [reach, gape 0..2, earsBack 0..1, crouch 0..1, streaks] per attack frame. */
const RAT_BITE: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [-3, 0, 0.5, 1, 0],  // crouch back
  [-2, 1, 1, 1, 0],    // ears flat, mouth opens
  [4, 2, 1, 0, 0],     // lunge
  [5, 0, 0.5, 0, 1],   // snap
  [1, 0, 0, 0, 0],     // recover
];

export function drawRat(f: MeadowFrame): HdDraw {
  return (put, raw) => {
    const { move, atk } = phases(f);
    const [reach, gape, earsBack, crouch, streaks] = atk >= 0 ? RAT_BITE[atk] : ([0, 0, 0, 0, 0] as const);
    const phi = move >= 0 ? move * (TAU / 8) : 0;
    const bx = 29 + Math.round(reach / 2);
    const by = 32 + (move >= 0 ? Math.round(Math.sin(phi)) : 0);   // slight lateral sway

    // tail — drawn first so the rump overlaps its root
    for (let s = 0; s < 15; s++) {
      const wave = move >= 0 ? Math.sin(phi - s * 0.33) : 0.4 * Math.sin(s * 0.3);
      const ty = Math.round(by + wave * 4 * (s / 14));
      const th = s < 5 ? 3 : s < 11 ? 2 : 1;
      rect(put, bx - 13 - s, ty - (th >> 1), 1, th, 'pink.d');
    }

    // legs — short, out to the sides; diagonal pairs share a phase
    const legs = [
      { x: bx + 7, side: -1, k: 0, hw: 5.5 },
      { x: bx + 7, side: 1, k: Math.PI, hw: 5.5 },
      { x: bx - 6, side: -1, k: Math.PI, hw: 7.5 },
      { x: bx - 6, side: 1, k: 0, hw: 7.5 },
    ];
    for (const L of legs) {
      const ang = phi + L.k;
      const front = L.x > bx;
      const stride = move >= 0 ? Math.sin(ang) * 4
        : atk >= 0 ? (front ? [-2, -3, 3, 4, 1] : [2, 3, -3, -4, -1])[atk] : 0;
      const tucked = move >= 0 && Math.cos(ang) > 0;      // swing phase: lifted and drawn in
      const out = tucked ? 2 : 4 - crouch;
      const x1 = Math.round(L.x + stride), y1 = Math.round(by + L.side * (L.hw + out));
      line(put, L.x, Math.round(by + L.side * (L.hw - 2)), x1, y1, tucked ? 'fur.d' : 'fur', 2);
      rect(put, x1 - 1, y1 - (L.side < 0 ? 1 : 0), 3, 2, 'pink.d');
    }

    // body — plump pear: broad haunches, narrower shoulders
    ellipse(put, bx - 4, by, 10, 8 - crouch / 2, 'fur');
    ellipse(put, bx + 6, by, 7, 6, 'fur');
    poly(put, [[bx - 4, by - 8], [bx + 6, by - 6], [bx + 6, by + 6], [bx - 4, by + 8]], 'fur');
    for (const [sx, sy] of [[-9, -4], [-3, 2], [2, -4], [-6, 5], [5, 3]]) rect(put, bx + sx, by + sy, 2, 2, 'fur.dd');
    for (const [sx, sy] of [[-7, 0], [0, -1], [-2, 6], [4, -5]]) put(bx + sx, by + sy, 'fur.l');

    // head — pointed wedge; the neck stretches on a lunge
    const hx = bx + 12;
    const snout = hx + 11 + Math.max(0, reach) / 2;
    poly(put, [[hx - 1, by - 6], [snout - 4, by - 3], [snout, by - 1.5], [snout, by + 1.5], [snout - 4, by + 3], [hx - 1, by + 6]], 'fur');
    const ex = hx + 1 - earsBack * 3;
    for (const s of [-1, 1]) {
      disc(put, ex, by + s * 7, 3.5, 'fur');
      disc(put, ex + 0.5, by + s * 7, 1.5, 'pink');
      rect(put, hx + 6, by + (s < 0 ? -3 : 2), 1, 2, EYE_RED);
    }
    const sn = Math.round(snout);
    rect(put, sn - 2, by - 1, 2, 2, 'pink');                              // nose
    if (gape > 0) {
      rect(put, sn - 5, by - gape, 3, 2 * gape + 1, 'red.dd');
      put(sn - 4, by, 'string.l');                                        // incisors
    }
    for (let i = 0; i < 5; i++) {                                          // whiskers: raw, 1 px, no outline
      raw(sn - 5 + i, by - 3 - i, WHISKER);
      raw(sn - 5 + i, by + 3 + i, WHISKER);
    }
    if (streaks) {
      for (let i = 0; i < 6; i++) {
        raw(bx - 26 + i, by - 5, '#ffffff', 0.45);
        raw(bx - 28 + i, by + 5, '#ffffff', 0.45);
      }
    }
  };
}

// ==================================================================
//  DEER — side-view stag, the meadow heavy. Two-beat trot: diagonal leg
//  pairs alternate and the body lifts in the suspension between beats.
//  Attack is an antler rake: rear back, then drive the head down and
//  forward so the tines lead.
// ==================================================================

/** [headDx, headDy, tilt rad (+ = antlers forward), bodyDx, splay 0..1, streaks] per attack frame. */
const DEER_RAKE: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [-2, -3, -0.35, -1, 0, 0],  // rear back
  [-1, -1, -0.15, -1, 0, 0],  // head starts down
  [4, 5, 0.55, 1, 1, 0],      // drive forward
  [6, 6, 0.7, 2, 1, 1],       // full extension
  [2, 2, 0.25, 1, 0, 0],      // recover
];

export function drawDeer(f: MeadowFrame): HdDraw {
  return (put, raw) => {
    const { move, atk } = phases(f);
    const [headDx, headDy, tilt, bodyDx, splay, streaks] = atk >= 0 ? DEER_RAKE[atk] : ([0, 0, 0, 0, 0, 0] as const);
    const phi = move >= 0 ? move * (TAU / 8) : 0;
    const GROUND = 60;
    // the body lifts in the suspension between the two diagonal beats
    const bob = move >= 0 ? -Math.round(1.5 * (0.5 + 0.5 * Math.cos(2 * phi))) : atk === 2 || atk === 3 ? 1 : 0;
    const bx = 26 + bodyDx, by = 36 + bob;
    const hipY = by + 4;

    // legs — far pair first, in the dark tone, so the near pair overlaps it
    const legs = [
      { x: bx - 9, hind: true, far: true, k: 0 },
      { x: bx + 11, hind: false, far: true, k: Math.PI },
      { x: bx - 11, hind: true, far: false, k: Math.PI },
      { x: bx + 9, hind: false, far: false, k: 0 },
    ];
    for (const L of legs) {
      const ang = phi + L.k;
      const lift = move >= 0 ? Math.max(0, Math.sin(ang)) : 0;
      const hoofX = move >= 0 ? Math.round(L.x - 5 * Math.cos(ang)) : L.x + (L.hind ? -2 : 3) * splay;
      const hoofY = GROUND - Math.round(5 * lift);
      const midX = (L.x + hoofX) / 2, midY = (hipY + hoofY) / 2;
      // front knees fold forward and hind hocks fold back, more so when the leg is lifted
      const jointX = Math.round(L.hind ? midX - 2 - 2 * lift : midX + 1 + 2 * lift);
      const m: Paint = L.far ? 'hide.d' : 'hide';
      line(put, L.x, hipY, jointX, Math.round(midY), m, 4);
      line(put, jointX, Math.round(midY), hoofX, hoofY, m, 3);
      rect(put, hoofX - 1, hoofY - 1, 3, 2, 'leather.dd');
    }

    // body
    ellipse(put, bx, by, 15, 8, 'hide');
    ellipse(put, bx - 9, by - 2, 6, 6.5, 'hide');                      // rump
    ellipse(put, bx + 9, by - 1.5, 6.5, 7, 'hide');                    // shoulder
    ellipse(put, bx, by - 5.5, 11, 1.5, 'hide.d');                     // dorsal shading
    ellipse(put, bx + 1, by + 5, 11, 3, 'cream');                      // belly
    ellipse(put, bx - 13, by - 1, 3, 4, 'cream');                      // rump patch
    for (const [sx, sy] of [[-6, -3], [-1, -4], [4, -2], [-3, 1], [2, 2], [7, 0]]) rect(put, bx + sx, by + sy, 2, 2, 'cream.d');
    const tailDy = move >= 0 ? Math.round(Math.sin(phi + 1)) : 0;
    poly(put, [[bx - 15, by - 6 + tailDy], [bx - 18, by - 3 + tailDy], [bx - 17, by + 1 + tailDy], [bx - 14, by - 2 + tailDy]], 'cream.d');

    // neck + head; everything on the head goes through H so the rake can tilt it
    const nod = move >= 0 ? Math.round(Math.sin(2 * phi + 1)) : 0;
    const hx = bx + 20 + headDx, hy = 17 + bob + nod + headDy;
    const H = xform(hx, hy, tilt);
    line(put, bx + 11, by - 4, Math.round(hx - 3), Math.round(hy + 4), 'hide', 7);
    line(put, bx + 13, by - 1, Math.round(hx - 2), Math.round(hy + 6), 'cream.d', 2);  // throat
    disc(put, hx, hy, 5, 'hide');
    poly(put, [H(1, -3.5), H(7, -2), H(10, 1), H(9, 3.5), H(1, 4)], 'hide');          // snout
    poly(put, [H(2, 2.5), H(8, 3), H(8, 4), H(2, 4)], 'cream.d');                      // chin
    putAt(put, H(9, 1), OUTLINE);                                                      // nose
    putAt(put, H(9.5, 2), OUTLINE);
    putAt(put, H(7, 3.5), 'hide.dd');                                                  // mouth
    for (const [ex, ey] of [[1.5, -1.5], [2.5, -1.5], [1.5, -0.5], [2.5, -0.5]]) putAt(put, H(ex, ey), EYE_RED);
    putAt(put, H(1.5, -1.5), EYE_GLINT);
    poly(put, [H(-4, -3), H(-8, -9), H(-2, -5)], 'hide');                              // ear
    putAt(put, H(-5, -6), 'pink');

    const antler = (ox: number, m: Paint, tip: Paint) => {
      const A = (lx: number, ly: number) => H(lx + ox, ly);
      seg(put, A(0, -5), A(-3, -9), m, 2);     // beam: up and back...
      seg(put, A(-3, -9), A(-2, -13), m, 2);   // ...then forward at the top
      putAt(put, A(-2, -14), tip);
      seg(put, A(-1, -7), A(3, -10), m, 2);    // brow tine
      putAt(put, A(4, -11), tip);
      seg(put, A(-3, -10), A(1, -12), m, 1);   // mid tine
      putAt(put, A(2, -13), tip);
      seg(put, A(-3, -11), A(-6, -12), m, 1);  // back tine
      putAt(put, A(-7, -13), tip);
    };
    antler(-3, 'bone.d', 'bone');
    antler(0, 'bone', 'bone.l');

    if (streaks) {
      for (let i = 0; i < 3; i++) {
        rawAt(raw, H(13 + 2 * i, -9 + i), '#ffffff', 0.5);
        rawAt(raw, H(13 + 2 * i, -3 + i), '#ffffff', 0.4);
      }
    }
  };
}
