// Player + bow sprites, drawn with the HD pipeline (hd.ts) at 64 px.
// The "Ranger" hero — hooded, blue tunic, quiver over the left shoulder —
// plus a separate rotatable bow sprite that carries both arms. The arrow
// tower's archer is the same figure in a different outfit per tower level
// (TOWER_ARCHER).
//
// drawPlayer(frame, pose, outfit):
//  - frame: 4-frame idle (breathing bob + blink), 6-frame run cycle
//    (legs scissor along x with a swing-leg lift, body dips on contact).
//  - pose: vertical aim stance picked by GameScene from the bow angle.
//    'up' tilts the head back and slides the hood; 'down' tucks the chin
//    and bends the knees into a slight crouch.
//
// Sprite is 64 HD px = 32 world px (entities render at scale 0.5), so
// 2 HD px = 1 world px. Facing right; GameScene flips X to face left.

import { HdDraw, HdPut, Mat, Paint, rect, rrect, disc, ellipse, line, poly, groundShadow } from './hd';

export type PPose = 'level' | 'up' | 'down';
export type PFrame =
  'idle0' | 'idle1' | 'idle2' | 'idle3' |
  'move0' | 'move1' | 'move2' | 'move3' | 'move4' | 'move5' |
  'shoot0' | 'shoot1' | 'hit';

export type Outfit = {
  tunic: Mat;
  hood: Mat;
  /** 'tail': hood with a trailing tail; 'point': peaked hood; 'cap': close-fitting cap. */
  hat: 'tail' | 'point' | 'cap';
  feather: { vane: Mat; quill: Paint } | null;
  pouch: boolean;
  /** Quiver slung over the left shoulder, or hung off the left hip. */
  quiver: 'back' | 'hip';
  /** Belt and hood-edge material; a leather belt and a lighter hood edge when null. */
  trim: Mat | null;
};
export const RANGER: Outfit = { tunic: 'blue', hood: 'hood', hat: 'tail', feather: { vane: 'red', quill: 'gold.d' }, pouch: true, quiver: 'back', trim: null };
/** Indexed by tower level: field green, then a darker veteran, then crimson hood with gold trim. */
export const TOWER_ARCHER: readonly Outfit[] = [
  { tunic: 'green',  hood: 'olive',   hat: 'tail', feather: null, pouch: false, quiver: 'hip', trim: null },
  { tunic: 'forest', hood: 'slate',   hat: 'tail', feather: null, pouch: false, quiver: 'hip', trim: null },
  { tunic: 'forest', hood: 'crimson', hat: 'tail', feather: null, pouch: false, quiver: 'hip', trim: 'gold' },
];

// Body-bob tables in world px (positive = torso/head sink, feet planted).
// Shared by drawPlayer and playerFrameBob so the bow can ride the bob.
const IDLE_BOB = [0, 1, 1, 0] as const;
const MOVE_BOB = [1, 0, 0, 1, 0, 0] as const;

/** Vertical body bob baked into a player texture frame, in world px.
 *  GameScene adds this to the bow/nock offsets so the arms ride the torso
 *  instead of floating. */
export function playerFrameBob(textureKey: string): number {
  const m = textureKey.match(/^(?:p|ta\d)_(idle|move)_(?:up_|down_)?(\d)$/);
  if (!m) return 0;
  return (m[1] === 'idle' ? IDLE_BOB[+m[2]] : MOVE_BOB[+m[2]]) ?? 0;
}

const EYE = '#0b0f1a';

export type Plume = {
  base: readonly [number, number];
  tip: readonly [number, number];
  /** How far the spine bows away from the base-tip chord, toward the outer edge. */
  bow: number;
  /** Half-width of the vane at its widest. */
  width: number;
  vane: Paint;
  quill: Paint;
  edge: Paint;
  /** Positions along the spine (0..1) where the outer edge is notched into barbs. */
  notches?: readonly number[];
};

/** Tapered feather: a bowed spine with a quill, a light outer edge, and barb notches. */
export function drawPlume(put: HdPut, p: Plume) {
  const [x0, y0] = p.base, [x1, y1] = p.tip;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  const mx = (x0 + x1) / 2 + nx * p.bow, my = (y0 + y1) / 2 + ny * p.bow;
  const spine = (t: number): [number, number, number, number] => [
    (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1,
    (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1,
    2 * (1 - t) * (mx - x0) + 2 * t * (x1 - mx),
    2 * (1 - t) * (my - y0) + 2 * t * (y1 - my),
  ];
  const steps = Math.ceil(len * 3);
  // Stamp into a map so the quill lands on top of the vane regardless of order.
  const cells = new Map<number, [number, number, Paint]>();
  const stamp = (x: number, y: number, c: Paint) => { x = Math.round(x); y = Math.round(y); cells.set(y * 1000 + x, [x, y, c]); };
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [cx, cy, tx, ty] = spine(t);
    const tl = Math.hypot(tx, ty) || 1;
    const pnx = -ty / tl, pny = tx / tl;
    let w = p.width * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8;
    if (t < 0.12) w = Math.min(w, 0.6);                                    // bare quill at the base
    const notched = (p.notches ?? []).some((n) => Math.abs(t - n) < 0.045);
    const outerW = notched ? w * 0.45 : w;
    for (let s = -w; s <= outerW; s += 0.35)
      stamp(cx + pnx * s, cy + pny * s, s > outerW - 0.9 && t <= 0.82 ? p.edge : p.vane);
  }
  for (let i = 0; i <= steps * 0.78; i++) {
    const [cx, cy] = spine(i / steps);
    stamp(cx, cy, p.quill);
  }
  for (const [x, y, c] of cells.values()) put(x, y, c);
}

export function drawPlayer(frame: PFrame, pose: PPose = 'level', o: Outfit = RANGER): HdDraw {
  const tunic = o.tunic, tunicD = `${o.tunic}.d` as Paint;
  const hood = o.hood, hoodL = `${o.hood}.l` as Paint;
  return (put, raw) => {
    const cx = 32;

    groundShadow(raw, cx, 57, 13, 3.5, 0.35);

    // ----- frame parameters
    const idleIdx = frame.startsWith('idle') ? +frame[4] : frame.startsWith('shoot') ? 0 : -1;
    const moveIdx = frame.startsWith('move') ? +frame[4] : -1;
    const bob = 2 * (idleIdx >= 0 ? IDLE_BOB[idleIdx] : moveIdx >= 0 ? MOVE_BOB[moveIdx] : 0);
    const blink = idleIdx === 2;
    // run cycle: legs scissor along x; the swinging (airborne) leg lifts
    const strideL = moveIdx >= 0 ? 2 * [2, 1, -1, -2, -1, 1][moveIdx] : 0;
    const strideR = -strideL;
    const liftL = moveIdx === 4 || moveIdx === 5 ? -2 : 0;
    const liftR = moveIdx === 1 || moveIdx === 2 ? -2 : 0;

    // ----- pose (vertical aim stance)
    const crouch = pose === 'down' ? 2 : 0;
    const headDy = pose === 'up' ? -2 : pose === 'down' ? 2 : 0;
    const hoodDx = pose === 'up' ? -2 : 0;
    const brimDrop = pose === 'down' ? 2 : 0;

    // ----- legs (far leg first so the near leg overlaps it)
    const leg = (x: number, lift: number, far: boolean) => {
      const top = 43 + crouch + lift;
      rrect(put, x, top, 6, 53 - top, 2, far ? tunicD : tunic);
      rrect(put, x - 1, 51 + lift, 8, 5, 2, far ? 'boot.d' : 'boot');
    };
    leg(cx - 8 + strideL, liftL, true);
    leg(cx + 2 + strideR, liftR, false);

    // ----- torso (tunic) -----
    const torsoY = 26 + bob + crouch;
    rrect(put, cx - 12, torsoY, 24, 18, 4, tunic);
    rect(put, cx, torsoY + 14, 1, 4, tunicD);                          // tunic front split
    if (o.quiver === 'back') line(put, cx - 10, torsoY + 2, cx + 9, torsoY + 12, 'leather', 2); // quiver strap
    rect(put, cx - 12, torsoY + 12, 24, 3, o.trim ?? 'leather');       // belt
    rrect(put, cx - 1, torsoY + 11, 4, 5, 1, 'gold');                  // buckle
    if (o.pouch) rrect(put, cx + 6, torsoY + 14, 6, 5, 1, 'wood');     // hip pouch

    // ----- quiver: over the left shoulder, or hung off the left hip -----
    if (o.quiver === 'back') {
      const qy = torsoY - 6;
      poly(put, [[cx - 17, qy + 2], [cx - 12, qy], [cx - 10, qy + 12], [cx - 15, qy + 14]], 'wood');
      line(put, cx - 15, qy + 2, cx - 16, qy - 4, 'wood.l', 2);
      disc(put, cx - 16, qy - 5, 2, 'red');
      line(put, cx - 12, qy + 1, cx - 12, qy - 5, 'wood.l', 2);
      disc(put, cx - 12, qy - 6, 2, 'red.l');
    } else {
      const qy = torsoY + 12;
      poly(put, [[cx - 16, qy + 1], [cx - 10, qy], [cx - 9, qy + 10], [cx - 15, qy + 11]], 'wood');
      line(put, cx - 13, qy, cx - 15, qy - 7, 'wood.l', 2);
      disc(put, cx - 16, qy - 8, 2, 'red');
      line(put, cx - 11, qy, cx - 11, qy - 7, 'wood.l', 2);
      disc(put, cx - 11, qy - 8, 2, 'red.l');
    }

    // ----- shoulders (arms are on the bow sprite) -----
    ellipse(put, cx - 13, torsoY + 5, 3, 4, tunic);
    ellipse(put, cx + 12, torsoY + 5, 3, 4, tunic);

    // ----- head -----
    const headCx = cx + (moveIdx >= 0 ? 2 : 0); // slight forward lean at a run
    const headCy = 17 + bob + headDy + crouch;
    rect(put, cx - 2, headCy + 8, 5, 2, 'skin.d');                     // neck
    disc(put, headCx + 1, headCy, 8, 'skin');
    // hood: cap over the skull down to the brow, brim fold under it (a cap sits higher)
    const capCx = headCx + hoodDx;
    const capBottom = (o.hat === 'cap' ? -5 : -3) + brimDrop;
    for (let y = -11; y <= capBottom; y++)
      for (let x = -11; x <= 11; x++)
        if (x * x + y * y <= 118) put(capCx + x, headCy + y, hood);
    for (let x = -10; x <= 10; x++)
      if (x * x + 4 <= 118) rect(put, capCx + x, headCy + capBottom + 1, 1, 2, o.trim ?? hoodL);
    if (o.hat === 'tail') {
      // hood tail trailing off the back
      poly(put, [[capCx - 11, headCy - 4], [capCx - 8, headCy + 1], [capCx - 12, headCy + 3], [capCx - 14, headCy - 1]], hood);
    } else if (o.hat === 'point') {
      // peaked hood, the point swept back
      poly(put, [[capCx - 5, headCy - 9], [capCx + 3, headCy - 10], [capCx - 1, headCy - 14], [capCx - 6, headCy - 12]], hood);
    }
    if (o.feather) {
      // tucked in the front of the hood band and curving back over the crown;
      // kept on the facing side so it stays clear of the quiver
      drawPlume(put, {
        base: [capCx + 11, headCy - 4], tip: [capCx - 5, headCy - 14], bow: 3, width: 2.6,
        vane: o.feather.vane, quill: o.feather.quill, edge: `${o.feather.vane}.l`, notches: [0.45, 0.65],
      });
    }
    // face (quarter view — features sit toward the facing side)
    if (blink) {
      rect(put, headCx - 1, headCy, 2, 1, 'skin.d');
      rect(put, headCx + 4, headCy, 2, 1, 'skin.d');
    } else {
      rect(put, headCx - 1, headCy - 1, 2, 3, EYE);
      rect(put, headCx + 4, headCy - 1, 2, 3, EYE);
    }
    rect(put, headCx + 1, headCy + 4, 3, 1, 'skin.dd');                // mouth
  };
}

// ==================================================================
//  BOW (64x64) — separate rotatable weapon sprite carrying both arms.
//  Drawn pointing right. Origin (0.25, 0.5) = grip at (16, 32).
// ==================================================================
export function drawBow(shooting: boolean, sleeve: Mat = 'blue'): HdDraw {
  const sleeveD = `${sleeve}.d` as Paint;
  return (put, raw) => {
    const gx = 16, gy = 32;

    // ===== BACK ARM (string hand) — far side, darker =====
    const stringPullX = shooting ? gx - 8 : gx;
    rrect(put, gx - 12, gy - 2, 5, 6, 2, sleeveD);                        // upper arm
    rect(put, stringPullX, gy - 1, gx - 8 - stringPullX + 2, 5, sleeveD);  // forearm
    rrect(put, stringPullX - 2, gy - 3, 5, 6, 2, 'skin.d');                // string hand

    // ===== FRONT ARM (bow hand) =====
    rrect(put, gx - 12, gy - 6, 5, 6, 2, sleeve);                         // upper arm
    rrect(put, gx - 8, gy - 6, 9, 6, 2, sleeve);                          // forearm
    rrect(put, gx - 1, gy - 6, 6, 8, 2, 'skin');                          // grip hand

    // ===== BOW (wooden arc, convex toward the target) =====
    // Arc runs from x = gx+8 at the grip back to gx at the limb tips; the
    // string joins the tips at gx-1, 1 px clear of the arc's outline.
    for (let y = -20; y <= 20; y++) {
      const curve = Math.round(y * y * 0.02);
      const bx = gx + 8 - curve;
      rect(put, bx - 2, gy + y, 5, 1, 'wood');
    }
    rrect(put, gx - 3, gy - 24, 6, 5, 1, 'steel');                        // limb tips
    rrect(put, gx - 3, gy + 20, 6, 5, 1, 'steel');

    // ===== BOWSTRING (raw layer: 1 px, no outline) =====
    for (let y = -19; y <= 19; y++) {
      const pull = shooting ? Math.round((1 - (y * y) / 361) * 8) : 0;
      raw(gx - 1 - pull, gy + y, '#d8dce4');
    }

    if (shooting) {
      put(gx + 34, gy, 'spark.l');
      put(gx + 35, gy - 1, 'spark');
      put(gx + 35, gy + 1, 'spark');
      put(gx + 36, gy, 'spark');
    }
  };
}
