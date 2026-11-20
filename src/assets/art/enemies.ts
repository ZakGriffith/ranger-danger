// Shared ground, flying, and castle enemy art and their projectile effects.
// Enemies with dedicated palettes and frame schemas live in their own modules.

import { Put, P, mirrorX, strokeOutline, rect, disc, ring, line, ellipse } from './canvas';

export type EFrame = 'move0'|'move1'|'move2'|'move3'|'atk0'|'atk1'|'hit'|'die0'|'die1'|'die2'|'die3';

/** Extended frame set — 6-frame move cycles and 4-frame attacks. */
export type EFrame6 = EFrame | 'move4' | 'move5' | 'atk2' | 'atk3';

export function drawEnemyBasic(f: EFrame) {
  return (put: Put) => {
    if (f.startsWith('die')) {
      const step = parseInt(f.slice(3));
      const r = 8 - step * 2;
      if (r <= 0) return;
      disc(put, 16, 18, r, P.red);
      disc(put, 16, 18, Math.max(0, r - 1), P.redL);
      // splat debris
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + step * 0.4;
        const d = step * 3 + 3;
        const px = Math.round(16 + Math.cos(a) * d);
        const py = Math.round(18 + Math.sin(a) * d);
        put(px, py, P.redD);
        put(px + 1, py, P.red);
      }
      return;
    }
    const flash = f === 'hit';
    const body = flash ? P.white : P.red;
    const bodyD = flash ? P.white : P.redD;
    const bodyM = flash ? P.white : P.redM;
    const bodyL = flash ? P.white : P.redL;

    // ----- shadow -----
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -6; dx <= 6; dx++)
        if ((dx * dx) / 36 + (dy * dy) / 1.5 <= 1) put(16 + dx, 28 + dy, P.shadow);

    // ----- feet (tiny claws) -----
    let footY = 0;
    if (f === 'move1') footY = -1;
    if (f === 'move3') footY = 1;
    rect(put, 11, 25 + footY, 3, 2, bodyD);
    rect(put, 18, 25 - footY, 3, 2, bodyD);
    put(10, 26 + footY, P.outline);
    put(21, 26 - footY, P.outline);
    put(13, 27 + footY, P.outline);
    put(18, 27 - footY, P.outline);

    // ----- body (round with spines) -----
    disc(put, 16, 17, 8, bodyD);
    disc(put, 16, 17, 7, body);
    disc(put, 16, 16, 5, bodyL);
    // back spines
    put(10, 12, P.outline); put(11, 11, bodyD);
    put(13, 10, P.outline); put(14, 9, bodyD);
    put(18, 9, P.outline); put(19, 10, bodyD);
    put(21, 11, P.outline); put(22, 12, bodyD);

    // ----- face area -----
    // eyes
    put(12, 16, P.white); put(13, 16, P.white);
    put(19, 16, P.white); put(20, 16, P.white);
    put(12, 16, P.outline); put(20, 16, P.outline);
    // brow
    rect(put, 11, 15, 3, 1, bodyM);
    rect(put, 18, 15, 3, 1, bodyM);
    // fangs / mouth
    if (f === 'atk0') {
      rect(put, 13, 19, 6, 2, P.outline);
      put(14, 20, P.white); put(17, 20, P.white);
    } else if (f === 'atk1') {
      rect(put, 13, 18, 6, 4, P.outline);
      put(14, 19, P.white); put(17, 19, P.white);
      put(15, 21, P.white); put(16, 21, P.white);
    } else {
      rect(put, 14, 19, 4, 1, P.outline);
      put(14, 20, P.white); put(17, 20, P.white);
    }

    // little arms/claws
    put(7, 18, bodyD); put(8, 19, bodyD); put(8, 18, body);
    put(25, 18, bodyD); put(24, 19, bodyD); put(24, 18, body);
  };
}

// ==================================================================
//  ENEMY HEAVY (32x32) — bigger dark-red armored brute
// ==================================================================
export function drawEnemyHeavy(f: EFrame) {
  return (put: Put) => {
    if (f.startsWith('die')) {
      const step = parseInt(f.slice(3));
      const r = 10 - step * 2;
      if (r <= 0) return;
      disc(put, 16, 18, r, P.heavy);
      disc(put, 16, 18, Math.max(0, r - 1), P.heavyL);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + step * 0.3;
        const d = step * 3 + 4;
        put(Math.round(16 + Math.cos(a) * d), Math.round(18 + Math.sin(a) * d), P.heavyD);
      }
      return;
    }
    const flash = f === 'hit';
    const body = flash ? P.white : P.heavy;
    const bodyD = flash ? P.white : P.heavyD;
    const bodyM = flash ? P.white : P.heavyM;
    const bodyL = flash ? P.white : P.heavyL;

    // shadow
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -8; dx <= 8; dx++)
        if ((dx * dx) / 64 + (dy * dy) / 1.5 <= 1) put(16 + dx, 29 + dy, P.shadow);

    // feet (heavy stompers)
    let footY = 0;
    if (f === 'move1') footY = -1;
    if (f === 'move3') footY = 1;
    rect(put, 9, 26 + footY, 5, 3, bodyD);
    rect(put, 18, 26 - footY, 5, 3, bodyD);
    rect(put, 9, 28 + footY, 5, 1, P.outline);
    rect(put, 18, 28 - footY, 5, 1, P.outline);

    // main body
    disc(put, 16, 17, 10, bodyD);
    disc(put, 16, 17, 9, body);
    disc(put, 16, 16, 7, bodyL);
    // armor plates
    rect(put, 10, 18, 12, 1, bodyD);
    rect(put, 10, 21, 12, 1, bodyD);
    rect(put, 14, 13, 4, 1, bodyD);
    // rivets
    put(11, 18, P.steel); put(15, 18, P.steel); put(20, 18, P.steel);
    put(11, 21, P.steel); put(15, 21, P.steel); put(20, 21, P.steel);

    // horns
    put(9, 8, P.outline); put(10, 9, bodyD); put(11, 10, body);
    put(23, 8, P.outline); put(22, 9, bodyD); put(21, 10, body);

    // glowing eyes
    put(11, 14, P.redL); put(12, 14, P.white);
    put(20, 14, P.white); put(21, 14, P.redL);
    put(11, 15, P.redD); put(21, 15, P.redD);

    // tusks / mouth
    if (f === 'atk0' || f === 'atk1') {
      rect(put, 12, 18, 9, 3, P.outline);
      put(12, 20, P.white); put(14, 20, P.white); put(17, 20, P.white); put(19, 20, P.white);
      if (f === 'atk1') put(16, 21, P.red);
    } else {
      rect(put, 13, 19, 7, 1, P.outline);
      put(13, 20, P.white);
      put(19, 20, P.white);
    }

    // big shoulders
    rect(put, 5, 15, 3, 3, bodyD);
    rect(put, 24, 15, 3, 3, bodyD);
    put(6, 15, bodyM);
    put(25, 15, bodyM);
  };
}

// ==================================================================
//  INFECTED BASIC (32x32) — purple infected variant of basic enemy
// ==================================================================
export function drawEnemyInfectedBasic(f: EFrame6) {
  return (rawPut: Put) => {
    if (f.startsWith('die')) {
      const step = parseInt(f.slice(3));
      const r = 8 - step * 2;
      if (r <= 0) return;
      disc(rawPut, 16, 18, r, P.infect);
      disc(rawPut, 16, 18, Math.max(0, r - 1), P.infectL);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + step * 0.4;
        const d = step * 3 + 3;
        const x = Math.round(16 + Math.cos(a) * d);
        const y = Math.round(18 + Math.sin(a) * d);
        rawPut(x, y, P.infectD);
        rawPut(x + 1, y, i % 2 === 0 ? P.infectH : P.infect);
      }
      return;
    }

    const mput = mirrorX(rawPut);
    const px = new Set<number>();
    const put: Put = (x, y, c) => {
      if (c == null || x < 0 || y < 0 || x >= 32 || y >= 32) return;
      px.add(y * 32 + x);
      mput(x, y, c);
    };

    const flash = f === 'hit';
    const fl  = flash ? P.white : P.infect;    // purple flesh
    const flD = flash ? P.white : P.infectD;
    const flM = flash ? P.white : P.infectM;
    const flL = flash ? P.white : P.infectL;
    const boil  = flash ? P.white : P.infectH;  // orange pustules
    const boilL = flash ? P.white : P.infectHL;
    const spike = flash ? P.white : P.bronze;   // bone-orange back spikes
    const spikeL = flash ? P.white : P.bronzeL;
    const fang = flash ? P.white : P.arrow;     // golden-bone fangs

    // 6-phase lumber; attack = maw opens → gapes WIDE → lunge + bite shut
    const mi = f.startsWith('move') ? +f[4] : -1;
    const ai = f.startsWith('atk') ? +f[3] : -1;
    const ph = mi >= 0 ? mi : 0;
    const bob = mi >= 0 ? Math.round(Math.sin((ph / 6) * Math.PI * 2) * 1.2) : ai === 1 ? 1 : 0;
    const ox = ai >= 0 ? [1, 0, -2, -1][ai] : 0;       // lunge thrust (toward prey)
    const gape = ai === 0 ? 2 : ai === 1 ? 6 : 0;      // mouth opening height
    const clamp = ai === 2;                            // jaws slam shut mid-lunge

    // ground shadow (unrecorded)
    for (let dy = 0; dy <= 1; dy++)
      for (let dx = -10; dx <= 10; dx++)
        if ((dx * dx) / 100 + (dy * dy) / 1.2 <= 1) mput(16 + dx + ox, 27 + dy, P.shadow);

    // ---- three stumpy legs: two front, one back ----
    // [x, width, phaseOffset, far]
    const legs: ReadonlyArray<readonly [number, number, number, boolean]> = [
      [6, 4, 0, false],            // near front
      [11, 3, Math.PI, true],      // far front
      [20, 5, Math.PI / 2, false], // single back leg
    ];
    for (const [lx, w, off, far] of legs) {
      let dx = 0, lift = 0;
      if (mi >= 0) {
        const ang = (ph / 6) * Math.PI * 2 + off;
        dx = Math.round(Math.sin(ang) * 1.5);
        lift = Math.max(0, Math.round(Math.cos(ang)));
      }
      const x = lx + dx + ox;
      rect(put, x, 20, w, 6 - lift, far ? flD : fl);
      rect(put, x, 20, 1, 5 - lift, far ? flM : flL);  // lit edge
      // toe folds
      put(x + 1, 25 - lift, flash ? P.white : P.outline);
      if (w >= 4) put(x + w - 2, 25 - lift, flash ? P.white : P.outline);
      if (!far) put(x + w - 1, 23 - lift, flD);        // ankle fold
    }
    // boil on the back leg
    put(22 + ox, 22, boil);
    put(23 + ox, 22, flD);

    // ---- body: lumpy tumorous mass (overlapping lobes) ----
    const B = ox; // body shift
    disc(put, 18 + B, 14 + bob, 9, fl);
    disc(put, 12 + B, 11 + bob, 6, fl);
    disc(put, 23 + B, 11 + bob, 6, fl);
    disc(put, 10 + B, 17 + bob, 5, fl);
    disc(put, 24 + B, 17 + bob, 6, fl);
    // mottled sick flesh
    for (let yy = 4; yy <= 23; yy++)
      for (let xx = 4; xx <= 29; xx++) {
        const X = xx + B, Y = yy + bob;
        if (!px.has(Y * 32 + X)) continue;
        if ((xx * 3 + yy * 7) % 11 === 0) put(X, Y, flM);
        else if ((xx * 5 + yy * 3) % 13 === 0) put(X, Y, flD);
      }
    // sheen along the upper-back lobes
    put(20 + B, 6 + bob, flL); put(23 + B, 7 + bob, flL);
    put(14 + B, 7 + bob, flL); put(25 + B, 9 + bob, flL);
    // deep crease folds between the lobes
    put(16 + B, 12 + bob, flD); put(17 + B, 13 + bob, flD);
    put(21 + B, 16 + bob, flD); put(20 + B, 17 + bob, flD);

    // ---- bone spikes along the back ridge ----
    for (const [sx2, sy2, tall] of [[11, 6, 2], [15, 4, 3], [20, 4, 3], [25, 7, 2]] as const) {
      for (let j = 0; j < tall; j++) {
        put(sx2 + B, sy2 + bob - j, j === tall - 1 ? spikeL : spike);
        if (j === 0) put(sx2 + 1 + B, sy2 + bob, flash ? P.white : P.bronzeD);
      }
    }

    // ---- weeping pustules (drips animate with the walk phase) ----
    // the big boil
    disc(put, 19 + B, 11 + bob, 2, boil);
    put(18 + B, 10 + bob, boilL);
    put(19 + B, 10 + bob, P.white);                    // wet glint
    ring(put, 19 + B, 11 + bob, 3, flD);               // swollen rim
    // medium boils
    disc(put, 13 + B, 9 + bob, 1, boil); put(13 + B, 8 + bob, boilL);
    disc(put, 24 + B, 15 + bob, 1, boil); put(24 + B, 14 + bob, boilL);
    disc(put, 11 + B, 15 + bob, 1, flash ? P.white : '#e088a8'); // pink one
    put(11 + B, 14 + bob, P.white);
    // small boil pips
    put(16 + B, 18 + bob, boil);
    put(22 + B, 19 + bob, boil);
    put(9 + B, 11 + bob, boil);
    // orange ooze trailing down from the weepers
    put(19 + B, 14 + bob, boil);
    put(19 + B, 15 + bob + (ph % 2), flash ? P.white : P.infectHM);
    put(24 + B, 17 + bob + ((ph + 1) % 2), flash ? P.white : P.infectHM);

    // ---- furious eye sunk in a brow fold ----
    const ey = 9 + bob;
    rect(put, 6 + B, ey - 1, 5, 1, flD);               // heavy brow fold
    put(5 + B, ey, flD);
    put(7 + B, ey, flash ? P.white : '#ff5020');       // burning iris
    put(8 + B, ey, flash ? P.white : '#8a1408');
    if (ai === 1) put(6 + B, ey, P.white);             // eye flares at full gape

    // ---- the MAW ----
    const mx = 4 + B;
    if (gape > 0) {
      // open: dark gullet between two rows of long bone fangs
      const top = 15 - (gape >> 1) + bob;
      rect(put, mx - 1, top, 9, gape, flash ? P.white : '#3a0a14');
      put(mx + 2, top + (gape >> 1), flash ? P.white : '#6a1020'); // throat
      put(mx + 4, top + (gape >> 1), flash ? P.white : P.redD);
      for (let k = 0; k < 4; k++) {
        const fx2 = mx + k * 2;
        const flen = gape >= 6 ? 2 : 1;
        for (let j = 0; j < flen; j++) put(fx2, top + j, fang);              // upper fangs
        for (let j = 0; j < flen; j++) put(fx2 + 1, top + gape - 1 - j, fang); // lower fangs
      }
      if (gape >= 6) put(mx - 1, top + gape, boil);    // drool at the corner
    } else if (clamp) {
      // jaws slammed shut — interlocked fangs + impact burst
      line(put, mx - 1, 16 + bob, mx + 7, 17 + bob, flD);
      for (let k = 0; k < 4; k++) {
        put(mx + k * 2, 15 + bob, fang);
        put(mx + 1 + k * 2, 17 + bob, fang);
      }
      mput(mx - 2, 13 + bob, P.white);                 // the clack
      mput(mx - 2, 16 + bob, P.white);
      mput(mx - 2, 19 + bob, P.white);
    } else {
      // closed: wide lip seam with fang tips poking through
      line(put, mx - 1, 16 + bob, mx + 8, 17 + bob, flD);
      for (let k = 0; k < 4; k++) {
        put(mx + k * 2, 15 + bob, fang);
        put(mx + 1 + k * 2, 17 + bob, fang);
      }
    }

    strokeOutline(px, mput);
  };
}

// ==================================================================
//  INFECTED HEAVY (32x32) — orange infected armored brute
// ==================================================================
export function drawEnemyInfectedHeavy(f: EFrame6) {
  return (rawPut: Put) => {
    if (f.startsWith('die')) {
      const step = parseInt(f.slice(3));
      const r = 10 - step * 2;
      if (r <= 0) return;
      disc(rawPut, 16, 18, r, P.infectH);
      disc(rawPut, 16, 18, Math.max(0, r - 1), P.infectHL);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + step * 0.3;
        const d = step * 3 + 4;
        rawPut(Math.round(16 + Math.cos(a) * d), Math.round(18 + Math.sin(a) * d), P.infectHD);
        rawPut(Math.round(16 + Math.cos(a) * d) + 1, Math.round(18 + Math.sin(a) * d), i % 2 === 0 ? P.infectR : P.wBone);
      }
      return;
    }

    const mput = mirrorX(rawPut);
    const px = new Set<number>();
    const put: Put = (x, y, c) => {
      if (c == null || x < 0 || y < 0 || x >= 32 || y >= 32) return;
      px.add(y * 32 + x);
      mput(x, y, c);
    };

    const flash = f === 'hit';
    const fl  = flash ? P.white : P.infectH;    // orange flesh
    const flD = flash ? P.white : P.infectHD;
    const flM = flash ? P.white : P.infectHM;
    const flL = flash ? P.white : P.infectHL;
    const boil  = flash ? P.white : P.infectR;  // yellow-green boils
    const boilL = flash ? P.white : P.infectRL;
    const bn  = flash ? P.white : P.wBone;      // spikes / claws / fangs
    const bnL = flash ? P.white : P.wBoneL;
    const ooze = flash ? P.white : '#d8d040';

    // 6-phase upright lumber; attack = near-camera claw swipe
    const mi = f.startsWith('move') ? +f[4] : -1;
    const ai = f.startsWith('atk') ? +f[3] : -1;
    const ph = mi >= 0 ? mi : 0;
    const bob = mi >= 0 ? Math.round(Math.sin((ph / 6) * Math.PI * 2) * 1.3) : 0;
    const ox = ai >= 0 ? [1, 0, -2, -1][ai] : 0;       // lunge into the swipe
    const rear = ai >= 0 ? [1, 2, 0, 0][ai] : 0;       // rocks back on the windup
    const roar = ai === 1 || ai === 2 ? 2 : 0;         // maw gapes wider mid-swipe

    // ground shadow (unrecorded)
    for (let dy = 0; dy <= 1; dy++)
      for (let dx = -10; dx <= 10; dx++)
        if ((dx * dx) / 100 + (dy * dy) / 1.2 <= 1) mput(15 + dx + ox, 28 + dy, P.shadow);

    // ---- two sturdy legs (it stands TALL — nothing like the basic's blob) ----
    const stride = mi >= 0 ? Math.round(Math.sin((ph / 6) * Math.PI * 2) * 2) : 0;
    const liftN = mi >= 0 ? Math.max(0, Math.round(Math.cos((ph / 6) * Math.PI * 2) * 1.2)) : 0;
    const liftF = mi >= 0 ? Math.max(0, Math.round(-Math.cos((ph / 6) * Math.PI * 2) * 1.2)) : 0;
    const B = ox;
    // far leg
    rect(put, 15 - stride + B, 19 + bob, 3, 8 - liftF - bob, flD);
    put(14 - stride + B, 26 - liftF, bn);              // bone toe claws
    put(16 - stride + B, 26 - liftF, bn);
    // near leg — knee accent, lit front edge
    rect(put, 10 + stride + B, 19 + bob, 4, 8 - liftN - bob, fl);
    rect(put, 10 + stride + B, 19 + bob, 1, 7 - liftN - bob, flL);
    put(11 + stride + B, 22 + bob, flD);               // knee crease
    put(9 + stride + B, 26 - liftN, bn);               // splayed toe claws
    put(11 + stride + B, 26 - liftN, bn);
    put(13 + stride + B, 26 - liftN, bnL);

    // ---- UPRIGHT torso: broad shoulders tapering to the hips ----
    // (rocking back on the windup shifts the upper body rearward)
    for (let y = 10; y <= 19; y++) {
      const t = (y - 10) / 9;
      const halfW = Math.round(7 - t * 3);             // shoulders 14 wide → hips 8
      const cxT = 13 + Math.round(t) + Math.round(rear * (1 - t)) + B;
      rect(put, cxT - halfW, y + bob, halfW * 2 + 1, 1, fl);
      put(cxT - halfW, y + bob, flL);                  // lit chest edge
      put(cxT + halfW, y + bob, flD);                  // shaded back edge
    }
    // muscle definition — pec line, ab creases, lat shading
    put(10 + rear + B, 13 + bob, flD);
    put(11 + rear + B, 13 + bob, flD);
    put(12 + B, 15 + bob, flD);
    put(13 + B, 17 + bob, flD);
    rect(put, 17 + B, 12 + bob, 2, 5, flM);            // lat/back shading
    // light mottling (sparser than the basic — muscle, not tumor)
    for (let yy = 10; yy <= 19; yy++)
      for (let xx = 7; xx <= 20; xx++) {
        const X = xx + B, Y = yy + bob;
        if (!px.has(Y * 32 + X)) continue;
        if ((xx * 5 + yy * 3) % 17 === 0) put(X, Y, flM);
      }

    // ---- bone spikes down the back edge ----
    for (const [sx2, sy2, tall] of [[14, 8, 3], [17, 9, 2], [19, 12, 2], [20, 15, 2]] as const) {
      for (let j = 0; j < tall; j++)
        put(sx2 + rear + B, sy2 + bob - j, j === tall - 1 ? bnL : bn);
    }

    // ---- a few boils (restrained — the heavy is muscle, not blob) ----
    disc(put, 16 + B, 13 + bob, 2, boil);              // big one on the shoulder blade
    put(15 + B, 12 + bob, boilL);
    put(16 + B, 12 + bob, P.white);                    // wet glint
    ring(put, 16 + B, 13 + bob, 3, flD);               // swollen rim
    disc(put, 12 + B, 17 + bob, 1, boil); put(12 + B, 16 + bob, boilL);
    put(18 + B, 18 + bob, boil);
    put(12 + stride + B, 21 + bob, boil);              // one on the near thigh
    // ooze trail (animates with the walk)
    put(16 + B, 16 + bob, ooze);
    put(16 + B, 17 + bob + (ph % 2), ooze);

    // ---- head: ON TOP of the shoulders, brow and teeth ----
    const hx = 9 + rear + B, hy = 6 + bob;
    disc(put, hx + 1, hy, 4, fl);
    put(hx + 3, hy - 3, flL);                          // crown light
    rect(put, hx - 3, hy - 2, 7, 2, flD);              // massive scowling brow
    put(hx - 3, hy - 1, flM);
    // slitted furious eye
    put(hx - 1, hy - 1, flash ? P.white : '#d8e030');
    put(hx, hy - 1, flash ? P.white : P.outline);
    // ---- the gaping maw (wider when it roars mid-swipe) ----
    const gape = 2 + roar;
    rect(put, hx - 4, hy + 1, 8, gape, flash ? P.white : '#4a1408');
    put(hx - 1, hy + 2, flash ? P.white : P.redD);      // throat
    for (let k = 0; k < 4; k++) {
      put(hx - 4 + k * 2, hy + 1, bnL);                 // upper fangs
      if (roar > 0) put(hx - 4 + k * 2, hy + 2, bn);
      put(hx - 3 + k * 2, hy + gape, bnL);              // lower fangs
    }
    put(hx - 4, hy + gape + 1, ooze);                   // drool off the jaw
    put(hx - 4, hy + gape + 2 + (ph % 2), ooze);
    // thick neck planting the head on the shoulders
    rect(put, hx, hy + 3, 4, 2, flM);

    // ---- far arm: hangs from the far shoulder, small claw drag ----
    line(put, 17 + rear + B, 12 + bob, 18 + B, 18 + bob, flD);
    line(put, 18 + B, 18 + bob, 17 + B, 23 + bob, flM);
    put(16 + B, 25 + bob, bn);                          // dragging claws
    put(17 + B, 26 + bob, bn);

    // ---- near arm: the SWIPE claw, drawn last over everything ----
    {
      const shX = 8 + rear + B, shY = 11 + bob;         // near shoulder (top of the torso)
      // wrist arc: rest → raised back → overhead → raking down past the maw → low
      const W: ReadonlyArray<readonly [number, number]> =
        ai >= 0 ? [[14, 6], [9, 4], [2, 12], [4, 20]] : [[5, 21], [5, 21], [5, 21], [5, 21]];
      const [wx0, wy] = ai >= 0 ? W[ai] : [5 - Math.round(stride / 2), 21];
      const wx = wx0 + B;
      const elX = Math.round((shX + wx) / 2) + (ai === 0 || ai === 1 ? 2 : -2);
      const elY = Math.round((shY + wy) / 2) - (ai === 0 || ai === 1 ? 2 : 0);
      // thick arm (3px)
      line(put, shX, shY - 1, elX, elY - 1, flL);
      line(put, shX, shY, elX, elY, fl);
      line(put, shX, shY + 1, elX, elY + 1, flD);
      line(put, elX, elY - 1, wx, wy - 1, flL);
      line(put, elX, elY, wx, wy, fl);
      line(put, elX, elY + 1, wx, wy + 1, flD);
      disc(put, elX, elY, 1, fl);                       // elbow knob
      put(elX, elY - 2, boil);                          // boil at the joint
      // the big claw: knuckle mass + three long bone talons
      disc(put, wx, wy, 2, flM);
      put(wx, wy - 1, fl);
      const cdx = ai < 0 ? 0 : ai <= 1 ? 1 : 1;         // talon direction
      const cdy = ai < 0 ? 1 : ai <= 1 ? -1 : 1;
      for (let k = -1; k <= 1; k++) {
        put(wx + 2 * cdx + k, wy + 2 * cdy, bn);
        put(wx + 3 * cdx + k, wy + 3 * cdy, k === 0 ? bnL : bn);
        if (k === 0) put(wx + 4 * cdx, wy + 4 * cdy, bnL);
      }
      // motion arc on the impact frame — traces overhead → strike point
      if (ai === 2) {
        for (let a = Math.PI * 1.05; a <= Math.PI * 1.5; a += 0.15) {
          const ax2 = Math.round(shX + Math.cos(a) * 9);
          const ay2 = Math.round(shY + Math.sin(a) * 9);
          mput(ax2, ay2, a < Math.PI * 1.25 ? P.white : flL);
        }
        mput(wx - 1, wy - 3, P.white);                  // crack at the strike point
        mput(wx + 1, wy - 2, P.white);
      } else if (ai === 3) {
        mput(wx + 1, wy - 4, flL);                      // fading trail
        mput(wx + 2, wy - 6, flL);
      }
    }

    strokeOutline(px, mput);
  };
}

type DesertEnemyVariant = 'scorpion' | 'boss_scorpion' | 'scarab' | 'sand_mite' | 'cactus_hopper' | 'dune_strider' | 'sand_wraith' | 'temple_guardian' | 'sun_mote';

export function drawEnemyDesert(f: EFrame, variant: DesertEnemyVariant) {
  return (put: Put) => {
    if (f.startsWith('die')) {
      const step = parseInt(f.slice(3));
      const r = 8 - step * 2;
      if (r <= 0) return;
      const col = variant === 'sun_mote' ? '#ffd45a'
        : variant === 'boss_scorpion' ? '#7f9a38'
        : variant === 'cactus_hopper' ? '#4f8a3a'
        : '#b88442';
      disc(put, 16, 18, Math.max(0, r), col);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + step * 0.45;
        const d = step * 3 + 3;
        put(Math.round(16 + Math.cos(a) * d), Math.round(18 + Math.sin(a) * d), '#6a4528');
      }
      return;
    }
    const flash = f === 'hit';
    const phase = f === 'move0' ? 0 : f === 'move1' ? 1 : f === 'move2' ? 2 : f === 'move3' ? 3 : 0;
    const bob = [0, -1, 0, 1][phase];
    const attack = f === 'atk0' || f === 'atk1';
    const palettes: Record<DesertEnemyVariant, { d: string; m: string; l: string; hi: string }> = {
      scorpion: { d: '#4a2512', m: '#9a5a24', l: '#d08a3a', hi: '#ffcf70' },
      boss_scorpion: { d: '#273018', m: '#5f6f2f', l: '#9bb84a', hi: '#e4f080' },
      scarab: { d: '#153a38', m: '#2f5c58', l: '#56a29a', hi: '#b8f0d8' },
      sand_mite: { d: '#6a4218', m: '#c8943e', l: '#f0c060', hi: '#fff0a0' },
      cactus_hopper: { d: '#245024', m: '#4f8a3a', l: '#87bf5c', hi: '#e0f0c8' },
      dune_strider: { d: '#6a4920', m: '#d0a45a', l: '#f0ca78', hi: '#fff0b8' },
      sand_wraith: { d: '#4a3c30', m: '#b8a070', l: '#e0d0a0', hi: '#fff0c8' },
      temple_guardian: { d: '#4d3820', m: '#b89052', l: '#d8b878', hi: '#fff0a0' },
      sun_mote: { d: '#9a4a10', m: '#ffb82e', l: '#ffe070', hi: '#ffffff' },
    };
    const pal = palettes[variant];
    const d = flash ? P.white : pal.d;
    const m = flash ? P.white : pal.m;
    const l = flash ? P.white : pal.l;
    const hi = flash ? P.white : pal.hi;

    if (variant === 'scorpion' || variant === 'boss_scorpion') {
      const small = variant === 'boss_scorpion';
      disc(put, 15, 18 + bob, small ? 5 : 7, d);
      disc(put, 15, 17 + bob, small ? 4 : 6, m);
      rect(put, 20, 12 + bob, 3, small ? 6 : 8, d);
      rect(put, 21, 10 + bob, small ? 3 : 4, 3, m);
      put(25, 11 + bob, attack ? hi : small ? '#d9f06a' : '#d04020');
      for (let i = 0; i < 4; i++) {
        line(put, 9 + i * 3, 20 + bob, 5 + i * 2, 23 + ((i + phase) % 2), d);
        line(put, 18 + i * 2, 20 + bob, 25 + i, 23 + ((i + phase + 1) % 2), d);
      }
      put(12, 15 + bob, P.outline); put(18, 15 + bob, P.outline);
      return;
    }
    if (variant === 'scarab') {
      disc(put, 16, 18 + bob, 8, d);
      disc(put, 16, 17 + bob, 7, m);
      rect(put, 10, 16 + bob, 12, 1, hi);
      rect(put, 15, 10 + bob, 2, 13, d);
      rect(put, 9, 22 + bob, 14, 2, d);
      put(12, 14 + bob, '#ffd84a'); put(20, 14 + bob, '#ffd84a');
      return;
    }
    if (variant === 'sand_mite') {
      for (let i = 0; i < 4; i++) {
        disc(put, 10 + i * 4, 18 + ((i + phase) % 2) + bob, i === 1 || i === 2 ? 4 : 3, i % 2 ? m : l);
      }
      for (let i = 0; i < 6; i++) {
        const x = 7 + i * 3;
        put(x, 23 + ((i + phase) % 2), d);
        put(x + 1, 24 + ((i + phase) % 2), d);
      }
      put(8, 16 + bob, P.outline); put(9, 16 + bob, hi);
      return;
    }
    if (variant === 'cactus_hopper') {
      rect(put, 12, 11 + bob, 8, 14, d);
      rect(put, 13, 10 + bob, 7, 15, m);
      rect(put, 16, 10 + bob, 1, 14, hi);
      rect(put, 8, 17 + bob, 4, 3, m);
      rect(put, 20, 15 + bob, 4, 3, m);
      rect(put, 11, 25 + bob, 5, 3, d);
      rect(put, 18, 25 - bob, 5, 3, d);
      put(14, 14 + bob, P.outline); put(19, 14 + bob, P.outline);
      return;
    }
    if (variant === 'dune_strider') {
      disc(put, 16, 15 + bob, 5, m);
      rect(put, 12, 19 + bob, 8, 5, l);
      for (let i = 0; i < 6; i++) {
        const legX = 8 + i * 3;
        line(put, 15, 21 + bob, legX, 27 + ((i + phase) % 2), d);
      }
      rect(put, 11, 12 + bob, 10, 1, hi);
      put(13, 15 + bob, P.outline); put(19, 15 + bob, P.outline);
      return;
    }
    if (variant === 'sand_wraith') {
      ellipse(put, 16, 16 + bob, 8, 10, d);
      ellipse(put, 16, 15 + bob, 7, 9, m);
      for (let i = 0; i < 5; i++) {
        const x = 10 + i * 3;
        line(put, x, 23 + bob, x - 2 + phase, 28, i % 2 ? d : l);
      }
      put(13, 14 + bob, '#64c8ff'); put(19, 14 + bob, '#64c8ff');
      if (attack) rect(put, 12, 19 + bob, 8, 2, P.outline);
      return;
    }
    if (variant === 'temple_guardian') {
      rect(put, 9, 12 + bob, 14, 13, d);
      rect(put, 10, 11 + bob, 12, 13, m);
      rect(put, 11, 12 + bob, 10, 2, l);
      rect(put, 11, 19 + bob, 10, 2, d);
      rect(put, 7, 24 + bob, 7, 4, d);
      rect(put, 18, 24 - bob, 7, 4, d);
      put(12, 16 + bob, '#40e0ff'); put(20, 16 + bob, '#40e0ff');
      return;
    }
    // sun_mote
    disc(put, 16, 16 + bob, attack ? 7 : 6, d);
    disc(put, 16, 16 + bob, attack ? 6 : 5, m);
    disc(put, 16, 16 + bob, 3, hi);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + phase * 0.25;
      line(put,
        Math.round(16 + Math.cos(a) * 7),
        Math.round(16 + bob + Math.sin(a) * 7),
        Math.round(16 + Math.cos(a) * 10),
        Math.round(16 + bob + Math.sin(a) * 10),
        l);
    }
  };
}

export function drawSunBolt(frame: 0 | 1) {
  return (put: Put) => {
    const shift = frame === 0 ? 0 : 1;
    line(put, 3, 8 + shift, 12, 8 - shift, '#fff0a0');
    line(put, 4, 9 + shift, 13, 9 - shift, '#ffb82e');
    line(put, 5, 7 + shift, 11, 5 - shift, '#ffd84a');
    disc(put, 12, 8 - shift, 2, '#ffffff');
  };
}

// ==================================================================
//  WARLOCK MAGIC BOLT (32x32) — purple orb projectile
// ==================================================================
export function drawWarlockBolt(f: 'bolt0' | 'bolt1') {
  return (put: Put) => {
    const phase = f === 'bolt0' ? 0 : 1;
    const glow = '#aa40ff';
    const glowL = '#dd80ff';
    const core = '#ffffff';
    const trail = '#6a20c0';

    // Outer glow
    disc(put, 16, 16, 5, trail);
    disc(put, 16, 16, 4, glow);
    disc(put, 16, 16, 2, glowL);
    // Core
    put(16, 16, core); put(15, 16, core); put(17, 16, core);
    put(16, 15, core); put(16, 17, core);

    // Sparkle effect rotating between frames
    if (phase === 0) {
      put(12, 16, glowL); put(20, 16, glowL);
      put(16, 12, glowL); put(16, 20, glowL);
    } else {
      put(13, 13, glowL); put(19, 13, glowL);
      put(13, 19, glowL); put(19, 19, glowL);
    }

    // Trail wisps
    put(10, 16 + (phase === 0 ? -1 : 1), trail);
    put(9, 16, trail);
    put(8, 16 + (phase === 0 ? 1 : -1), trail);
  };
}
