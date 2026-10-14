// Player + bow sprites, drawn with the HD pipeline (hd.ts) at 64 px.
// The "Ranger" hero — hooded, blue tunic, quiver over the left shoulder —
// plus a separate rotatable bow sprite that carries both arms.
//
// drawPlayer(frame, pose):
//  - frame: 4-frame idle (breathing bob + blink), 6-frame run cycle
//    (legs scissor along x with a swing-leg lift, body dips on contact).
//  - pose: vertical aim stance picked by GameScene from the bow angle.
//    'up' tilts the head back and slides the hood; 'down' tucks the chin
//    and bends the knees into a slight crouch.
//
// Sprite is 64 HD px = 32 world px (entities render at scale 0.5), so
// 2 HD px = 1 world px. Facing right; GameScene flips X to face left.

import { HdDraw, rect, rrect, disc, ellipse, line, poly, groundShadow } from './hd';

export type PPose = 'level' | 'up' | 'down';
export type PFrame =
  'idle0' | 'idle1' | 'idle2' | 'idle3' |
  'move0' | 'move1' | 'move2' | 'move3' | 'move4' | 'move5' |
  'shoot0' | 'shoot1' | 'hit';

// Body-bob tables in world px (positive = torso/head sink, feet planted).
// Shared by drawPlayer and playerFrameBob so the bow can ride the bob.
const IDLE_BOB = [0, 1, 1, 0] as const;
const MOVE_BOB = [1, 0, 0, 1, 0, 0] as const;

/** Vertical body bob baked into a player texture frame, in world px.
 *  GameScene adds this to the bow/nock offsets so the arms ride the torso
 *  instead of floating. */
export function playerFrameBob(textureKey: string): number {
  const m = textureKey.match(/^p_(idle|move)_(?:up_|down_)?(\d)$/);
  if (!m) return 0;
  return (m[1] === 'idle' ? IDLE_BOB[+m[2]] : MOVE_BOB[+m[2]]) ?? 0;
}

const EYE = '#0b0f1a';

export function drawPlayer(frame: PFrame, pose: PPose = 'level'): HdDraw {
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
      rrect(put, x, top, 6, 53 - top, 2, far ? 'blue.d' : 'blue');
      rrect(put, x - 1, 51 + lift, 8, 5, 2, far ? 'boot.d' : 'boot');
    };
    leg(cx - 8 + strideL, liftL, true);
    leg(cx + 2 + strideR, liftR, false);

    // ----- torso (tunic) -----
    const torsoY = 26 + bob + crouch;
    rrect(put, cx - 12, torsoY, 24, 18, 4, 'blue');
    rect(put, cx, torsoY + 14, 1, 4, 'blue.d');                       // tunic front split
    line(put, cx - 10, torsoY + 2, cx + 9, torsoY + 12, 'leather', 2); // quiver strap
    rect(put, cx - 12, torsoY + 12, 24, 3, 'leather');                 // belt
    rrect(put, cx - 1, torsoY + 11, 4, 5, 1, 'gold');                  // buckle
    rrect(put, cx + 6, torsoY + 14, 6, 5, 1, 'wood');                  // hip pouch

    // ----- quiver over the left shoulder -----
    const qy = torsoY - 6;
    poly(put, [[cx - 17, qy + 2], [cx - 12, qy], [cx - 10, qy + 12], [cx - 15, qy + 14]], 'wood');
    line(put, cx - 15, qy + 2, cx - 16, qy - 4, 'wood.l', 2);
    disc(put, cx - 16, qy - 5, 2, 'red');
    line(put, cx - 12, qy + 1, cx - 12, qy - 5, 'wood.l', 2);
    disc(put, cx - 12, qy - 6, 2, 'red.l');

    // ----- shoulders (arms are on the bow sprite) -----
    ellipse(put, cx - 13, torsoY + 5, 3, 4, 'blue');
    ellipse(put, cx + 12, torsoY + 5, 3, 4, 'blue');

    // ----- head -----
    const headCx = cx + (moveIdx >= 0 ? 2 : 0); // slight forward lean at a run
    const headCy = 17 + bob + headDy + crouch;
    rect(put, cx - 2, headCy + 8, 5, 2, 'skin.d');                     // neck
    disc(put, headCx + 1, headCy, 8, 'skin');
    // hood: cap over the skull down to the brow, brim fold under it
    const capCx = headCx + hoodDx;
    for (let y = -11; y <= -3 + brimDrop; y++)
      for (let x = -11; x <= 11; x++)
        if (x * x + y * y <= 118) put(capCx + x, headCy + y, 'hood');
    for (let x = -10; x <= 10; x++)
      if (x * x + 4 <= 118) rect(put, capCx + x, headCy - 2 + brimDrop, 1, 2, 'hood.l');
    // hood tail trailing off the back
    poly(put, [[capCx - 11, headCy - 4], [capCx - 8, headCy + 1], [capCx - 12, headCy + 3], [capCx - 14, headCy - 1]], 'hood');
    // gold feather swept back along the hood
    line(put, capCx - 4, headCy - 9, capCx - 13, headCy - 5, 'gold', 3);
    put(capCx - 14, headCy - 4, 'gold.l');
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
export function drawBow(shooting: boolean): HdDraw {
  return (put, raw) => {
    const gx = 16, gy = 32;

    // ===== BACK ARM (string hand) — far side, darker =====
    const stringPullX = shooting ? gx - 8 : gx;
    rrect(put, gx - 12, gy - 2, 5, 6, 2, 'blue.d');                      // upper arm
    rect(put, stringPullX, gy - 1, gx - 8 - stringPullX + 2, 5, 'blue.d'); // forearm
    rrect(put, stringPullX - 2, gy - 3, 5, 6, 2, 'skin.d');                // string hand

    // ===== FRONT ARM (bow hand) =====
    rrect(put, gx - 12, gy - 6, 5, 6, 2, 'blue');                         // upper arm
    rrect(put, gx - 8, gy - 6, 9, 6, 2, 'blue');                          // forearm
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
