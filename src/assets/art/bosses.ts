// Pixel art for bosses that use the shared 64×64 canvas.

import { Put, P, mirrorX, strokeOutline, rect, disc, ring, line, ellipse } from './canvas';

// ==================================================================
//  BOSS — The Brood Mother (64x64, 2x2 tile footprint)
// ==================================================================
export interface BossOpts {
  bob?: number;
  flash?: boolean;
  chargeGlow?: boolean;
  pockets?: number; // 0..4 for birth animation stages, undefined = no pockets
  rearUp?: boolean; // slam windup pose
  legStep?: number; // -1 | 0 | 1
}

export function drawBossBody(put: Put, opts: BossOpts) {
  const cx = 32;
  const baseCy = 34 + (opts.bob ?? 0) + (opts.rearUp ? -2 : 0);

  const col = {
    out: opts.flash ? P.white : P.outline,
    d:   opts.flash ? P.white : P.heavyD,
    m:   opts.flash ? P.white : P.heavyM,
    b:   opts.flash ? P.white : P.heavy,
    l:   opts.flash ? P.white : P.heavyL
  };

  // drop shadow
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -26; dx <= 26; dx++)
      if ((dx * dx) / 676 + (dy * dy) / 5 <= 1) put(cx + dx, 59 + dy, P.shadow);

  // stubby legs (4)
  const legStep = opts.legStep ?? 0;
  rect(put, cx - 22, baseCy + 12 + legStep, 4, 6, col.d);
  rect(put, cx - 14, baseCy + 17 - legStep, 4, 5, col.d);
  rect(put, cx + 10, baseCy + 17 - legStep, 4, 5, col.d);
  rect(put, cx + 18, baseCy + 12 + legStep, 4, 6, col.d);
  // feet
  put(cx - 22, baseCy + 17 + legStep, P.outline);
  put(cx - 14, baseCy + 21 - legStep, P.outline);
  put(cx + 13, baseCy + 21 - legStep, P.outline);
  put(cx + 21, baseCy + 17 + legStep, P.outline);

  // main bulbous body
  disc(put, cx, baseCy, 24, col.out);
  disc(put, cx, baseCy, 23, col.d);
  disc(put, cx, baseCy, 22, col.b);

  // upper back (darker, textured)
  for (let y = -22; y <= -3; y++)
    for (let x = -22; x <= 22; x++)
      if (x * x + y * y <= 484) put(cx + x, baseCy + y, col.d);
  for (let y = -20; y <= -5; y++)
    for (let x = -20; x <= 20; x++)
      if (x * x + y * y <= 400) put(cx + x, baseCy + y, col.b);
  // highlight arc upper-left
  for (let y = -20; y <= -10; y++)
    for (let x = -18; x <= -2; x++)
      if (x * x + y * y <= 324) put(cx + x, baseCy + y, col.m);
  for (let y = -18; y <= -14; y++)
    for (let x = -10; x <= -4; x++)
      if (x * x + y * y <= 256) put(cx + x, baseCy + y, col.l);

  // pale swollen underbelly (lower half)
  for (let y = 4; y <= 22; y++)
    for (let x = -20; x <= 20; x++)
      if (x * x + y * y <= 476) put(cx + x, baseCy + y, P.belly);
  for (let y = 10; y <= 22; y++)
    for (let x = -17; x <= 17; x++)
      if (x * x + y * y <= 400) put(cx + x, baseCy + y, P.bellyM);
  // segmentation lines
  for (let x = -17; x <= 17; x++) {
    if (Math.abs(x) < 16) put(cx + x, baseCy + 8, P.bellyD);
    if (Math.abs(x) < 14) put(cx + x, baseCy + 14, P.bellyD);
    if (Math.abs(x) < 10) put(cx + x, baseCy + 19, P.bellyD);
  }

  // back spines (row along top of upper body)
  const spinePositions: Array<[number, number]> = [
    [-16, -16], [-10, -19], [-4, -21], [2, -21], [8, -20], [14, -17]
  ];
  for (const [sx, sy] of spinePositions) {
    put(cx + sx, baseCy + sy + 1, col.d);
    put(cx + sx, baseCy + sy, col.out);
    put(cx + sx, baseCy + sy - 1, col.out);
  }

  // eye cluster (5 glowing eyes, center-top)
  const eyes: Array<[number, number]> = [
    [-12, -4], [-6, -8], [0, -10], [6, -8], [12, -4]
  ];
  for (const [ex, ey] of eyes) {
    const glow = opts.chargeGlow ? P.sparkL : P.redL;
    put(cx + ex - 1, baseCy + ey, P.outline);
    put(cx + ex,     baseCy + ey, glow);
    put(cx + ex + 1, baseCy + ey, opts.chargeGlow ? P.spark : P.white);
    put(cx + ex,     baseCy + ey + 1, P.redD);
  }

  // mouth (hidden behind under-bulge, slit)
  rect(put, cx - 5, baseCy + 1, 10, 1, P.outline);
  put(cx - 6, baseCy + 1, P.redD);
  put(cx + 5, baseCy + 1, P.redD);

  // ----- birth pockets on back -----
  if (opts.pockets !== undefined) {
    const stage = opts.pockets;
    const pockets: Array<[number, number]> = [
      [-10, -13], [-2, -15], [6, -14]
    ];
    for (const [px, py] of pockets) {
      const ox = cx + px, oy = baseCy + py;
      if (stage === 0) {
        // smooth bumps forming
        disc(put, ox, oy, 3, col.l);
        disc(put, ox, oy, 2, col.b);
      } else if (stage === 1) {
        // dark pockets split open
        disc(put, ox, oy, 3, col.d);
        disc(put, ox, oy, 2, P.outline);
        put(ox, oy, P.redD);
      } else if (stage === 2) {
        // little heads visible inside
        disc(put, ox, oy, 3, col.d);
        disc(put, ox, oy, 2, P.red);
        put(ox - 1, oy, P.white);
        put(ox + 1, oy, P.white);
        put(ox, oy + 1, P.outline);
      } else if (stage === 3) {
        // heads pushing out, bulging higher
        disc(put, ox, oy - 1, 4, col.d);
        disc(put, ox, oy - 1, 3, P.red);
        disc(put, ox, oy - 2, 2, P.redL);
        put(ox - 1, oy - 1, P.white);
        put(ox + 1, oy - 1, P.white);
        put(ox, oy, P.outline);
      } else if (stage === 4) {
        // empty crater just after pop
        disc(put, ox, oy, 3, P.outline);
        disc(put, ox, oy, 2, col.d);
      }
    }
  }
}

export type BossFrame =
  | 'idle0' | 'idle1'
  | 'move0' | 'move1' | 'move2' | 'move3'
  | 'atk0' | 'atk1'
  | 'chargeWind'
  | 'hit'
  | 'birth0' | 'birth1' | 'birth2' | 'birth3' | 'birth4'
  | 'die0' | 'die1' | 'die2' | 'die3' | 'die4';

export function drawBoss(frame: BossFrame) {
  return (put: Put) => {
    switch (frame) {
      case 'idle0':      return drawBossBody(put, { bob: 0 });
      case 'idle1':      return drawBossBody(put, { bob: 1 });
      case 'move0':      return drawBossBody(put, { bob: 0, legStep: 1 });
      case 'move1':      return drawBossBody(put, { bob: 1, legStep: 0 });
      case 'move2':      return drawBossBody(put, { bob: 0, legStep: -1 });
      case 'move3':      return drawBossBody(put, { bob: 1, legStep: 0 });
      case 'atk0':       return drawBossBody(put, { rearUp: true, bob: -1 });
      case 'atk1':       return drawBossBody(put, { bob: 2 });
      case 'chargeWind': return drawBossBody(put, { chargeGlow: true, bob: 0 });
      case 'hit':        return drawBossBody(put, { flash: true });
      case 'birth0':     return drawBossBody(put, { pockets: 0 });
      case 'birth1':     return drawBossBody(put, { pockets: 1 });
      case 'birth2':     return drawBossBody(put, { pockets: 2 });
      case 'birth3':     return drawBossBody(put, { pockets: 3 });
      case 'birth4':     return drawBossBody(put, { pockets: 4 });
      case 'die0':       return drawBossDie(put, 0);
      case 'die1':       return drawBossDie(put, 1);
      case 'die2':       return drawBossDie(put, 2);
      case 'die3':       return drawBossDie(put, 3);
      case 'die4':       return drawBossDie(put, 4);
    }
  };
}

export function drawBossDie(put: Put, step: number) {
  const cx = 32, cy = 36;
  const r = Math.max(0, 24 - step * 5);
  if (r > 0) {
    disc(put, cx, cy, r, P.heavyD);
    disc(put, cx, cy, Math.max(0, r - 1), P.heavy);
    disc(put, cx, cy, Math.max(0, r - 3), P.heavyL);
  }
  // shrapnel + belly chunks flying out
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + step * 0.3;
    const d = step * 6 + 6;
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(cy + Math.sin(a) * d);
    put(x, y, P.heavyD);
    put(x + 1, y, P.red);
    if (i % 3 === 0) put(x, y + 1, P.belly);
  }
  // central flash
  if (step < 2) disc(put, cx, cy, 6, P.sparkL);
}

// ==================================================================
//  MEADOW BOSS — The Ancient Ram (64x64)
// ==================================================================

export interface RamOpts {
  bob?: number;
  flash?: boolean;
  chargeGlow?: boolean;
  pockets?: number;
  rearUp?: boolean;
  legStep?: number;
  headDown?: number;  // px the head is lowered (atk windup → slam)
  earFlick?: boolean; // idle fidget — ear swivels up
  tailWag?: number;   // -1 | 0 | 1 vertical tail offset
  breath?: boolean;   // snort puff ahead of the nose
}

export function drawRamBody(rawPut: Put, opts: RamOpts) {
  const bob = opts.bob ?? 0;
  const frontLift = opts.rearUp ? 3 : 0;  // windup: front end rears off the ground
  const headDown = opts.headDown ?? 0;
  const ls = opts.legStep ?? 0;

  // Demonic palette: charcoal hide, near-black fleece, soot horns, ember glow
  const col = {
    out: opts.flash ? P.white : P.outline,
    d:   opts.flash ? P.white : P.dramD,
    m:   opts.flash ? P.white : P.dramM,
    b:   opts.flash ? P.white : P.dram,
    l:   opts.flash ? P.white : P.dramL
  };
  const wc = {
    d: opts.flash ? P.white : P.dmaneD,
    b: opts.flash ? P.white : P.dmane,
    l: opts.flash ? P.white : P.dmaneL
  };
  const hc = {
    d: opts.flash ? P.white : P.dhornD,
    m: opts.flash ? P.white : P.dhornM,
    b: opts.flash ? P.white : P.dhorn,
    l: opts.flash ? P.white : P.dhornL
  };
  const ec = {
    d: opts.flash ? P.white : P.emberD,
    b: opts.flash ? P.white : P.ember,
    l: opts.flash ? P.white : P.emberL
  };
  const fc = (c: string) => opts.flash ? P.white : c;

  // Record body pixels for the silhouette outline (matches the ranger look).
  // Shadow + breath stay on rawPut so they aren't outlined.
  const px = new Set<number>();
  const put: Put = (x, y, c) => {
    if (c == null || x < 0 || y < 0 || x >= 64 || y >= 64) return;
    px.add(y * 64 + x);
    rawPut(x, y, c);
  };

  // Drop shadow
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -24; dx <= 24; dx++)
      if ((dx * dx) / 576 + (dy * dy) / 5 <= 1) rawPut(32 + dx, 59 + dy, P.shadow);

  // --- proportions: side-profile quadruped facing right ---
  // rump x~10 → chest x~46, barrel centre (26, bodyCy), skull out front at
  // (50, headY) on a wool neck. headDown drives the slam; rearUp the windup.
  const bodyCy = 36 + bob;
  const headY = bodyCy - 12 - frontLift + headDown;

  // Trot gait: diagonal leg pairs swing in opposition, swinging pair lifts.
  const liftA = Math.max(0, ls);   // near-front + far-rear
  const liftB = Math.max(0, -ls);  // far-front + near-rear
  const leg = (x: number, dx: number, lift: number, near: boolean, front: boolean) => {
    const fl = front ? frontLift * 2 : 0;
    const hoofY = 54 - lift - fl;
    const topY = bodyCy + 4 - (front ? frontLift : 0);
    const lx = x + dx;
    rect(put, x, topY, 4, 6, near ? col.b : col.d);                                  // thigh
    rect(put, lx, topY + 6, 3, Math.max(0, hoofY - topY - 6), near ? col.m : col.d); // shin
    if (near) rect(put, lx + 2, topY + 6, 1, Math.max(0, hoofY - topY - 6), col.l);
    // molten crack running down the shin, brightening toward the hoof
    for (let yy = topY + 7; yy < hoofY - 1; yy++)
      put(lx + (yy % 2), yy, yy >= hoofY - 4 ? ec.b : ec.d);
    // fetlock glow band above the dark hoof
    rect(put, lx, hoofY - 1, 3, 1, ec.d);
    put(lx + 1, hoofY - 1, ec.b);
    rect(put, lx, hoofY, 3, 2, col.out);                                             // hoof
    put(lx + 1, hoofY, ec.b);                                                        // burning split
  };

  // far-side legs first — the body overlaps them
  leg(35, -ls, liftB, false, true);
  leg(18, ls, liftA, false, false);

  // --- woolly tail (wags) ---
  const tw = opts.tailWag ?? 0;
  disc(put, 9, bodyCy - 3 + tw, 3, wc.d);
  disc(put, 9, bodyCy - 3 + tw, 2, wc.b);
  put(8, bodyCy - 5 + tw, wc.l);

  // --- fleece barrel + haunch + shoulder masses ---
  ellipse(put, 26, bodyCy, 17, 10, wc.d);
  ellipse(put, 26, bodyCy, 16, 9, wc.b);
  disc(put, 15, bodyCy + 1, 8, wc.d);   // rear haunch
  disc(put, 15, bodyCy + 1, 7, wc.b);
  // hunched shoulder hump — the silhouette looms over the lowered skull
  disc(put, 36, bodyCy - 4 - frontLift, 9, wc.d);
  disc(put, 36, bodyCy - 4 - frontLift, 8, wc.b);
  disc(put, 36, bodyCy - 10 - frontLift, 5, wc.d);
  disc(put, 35, bodyCy - 10 - frontLift, 3, wc.b);

  // lumpy back line with crevices between the lumps
  const lumps: ReadonlyArray<readonly [number, number, number]> =
    [[14, -8, 3], [20, -10, 4], [27, -11, 4], [34, -10, 4]];
  for (const [lx, ly, r] of lumps) {
    disc(put, lx, bodyCy + ly, r, wc.b);
    for (let a = 0.5; a < 2.6; a += 0.4)
      put(lx + Math.round(Math.cos(a) * (r + 1)), bodyCy + ly + Math.round(Math.sin(a) * (r + 1)), wc.d);
  }
  // matted, filth-streaked fleece — dark speckling dominates the highlight
  ellipse(put, 20, bodyCy - 5, 7, 3, wc.l);
  for (let y = -10; y <= 9; y++)
    for (let x = -16; x <= 16; x++) {
      if ((x * x) / 289 + (y * y) / 100 > 1) continue;
      if ((x * 3 + y * 7 + 64) % 17 === 0) put(26 + x, bodyCy + y, wc.l);
      else if ((x * 5 + y * 3 + 64) % 9 === 0) put(26 + x, bodyCy + y, wc.d);
    }
  // soot-black spurs breaking through the fleece, tips smouldering
  for (const [sx, sy] of [[17, -11], [24, -13], [31, -13], [38, -12]] as const) {
    put(sx, bodyCy + sy, hc.d);
    put(sx, bodyCy + sy - 1, hc.b);
    put(sx, bodyCy + sy - 2, ec.d);
  }
  // demonic runes seared into the hide (per the reference art):
  // spiral on the haunch...
  for (let t = 0; t <= 1; t += 0.03) {
    const a = t * 10.5;            // ~1.7 turns
    const r = 0.5 + t * 4;
    put(15 + Math.round(Math.cos(a) * r), bodyCy + 1 + Math.round(Math.sin(a) * r), t < 0.75 ? ec.b : ec.d);
  }
  // ...circle-and-dot on the barrel with a tail streaking down...
  ring(put, 27, bodyCy - 2, 3, ec.d);
  put(27, bodyCy - 2, ec.b);
  put(27, bodyCy + 2, ec.d);
  put(26, bodyCy + 4, ec.d);
  put(26, bodyCy + 5, ec.b);
  // ...and a hooked flick on the shoulder hump
  put(34, bodyCy - 7, ec.d);
  put(35, bodyCy - 8, ec.b);
  put(36, bodyCy - 7, ec.d);
  // shaded belly with long matted clumps dangling off it
  ellipse(put, 26, bodyCy + 7, 13, 3, wc.d);
  for (let x = 14; x <= 39; x += 3) {
    put(x, bodyCy + 10, wc.d);
    put(x + 1, bodyCy + 11, wc.d);
  }

  // chest wool + hanging tuft
  disc(put, 42, bodyCy + 1 - frontLift, 5, wc.b);
  put(43, bodyCy + 6 - frontLift, wc.d);
  put(44, bodyCy + 5 - frontLift, wc.b);

  // near-side legs (over the body)
  leg(40, ls, liftA, true, true);
  leg(12, -ls, liftB, true, false);

  // --- wool neck stepping up to the skull ---
  const neckPts: ReadonlyArray<readonly [number, number]> = [
    [40, bodyCy - 7 - frontLift],
    [44, Math.round((bodyCy - 9 - frontLift + headY + 4) / 2)],
    [47, headY + 4],
  ];
  for (const [nx, ny] of neckPts) {
    disc(put, nx, ny, 4, wc.d);
    disc(put, nx, ny, 3, wc.b);
  }

  // --- far horn: heavy curl behind the head ---
  for (let t = 0; t <= 0.7; t += 0.02) {
    const a = (-90 - 310 * t) * (Math.PI / 180);
    const r = 8 - 4.8 * t;
    disc(put, Math.round(42 + Math.cos(a) * r), Math.round(headY + Math.sin(a) * r), 1, t < 0.4 ? hc.m : hc.d);
  }
  // faint sigils on the far curl
  put(38, headY - 6, ec.d);
  put(36, headY + 2, ec.d);

  // --- ear (torn and notched; swivels up on the idle flick) ---
  if (opts.earFlick) {
    rect(put, 43, headY - 7, 2, 3, col.d);
    put(43, headY - 6, fc('#4a2018'));
  } else {
    rect(put, 43, headY - 4, 3, 2, col.d);
    put(44, headY - 4, fc('#4a2018'));
    put(44, headY - 5, col.d);            // ragged tip
  }

  // --- head: gaunt skull, jutting brow, roman-nose profile ---
  disc(put, 50, headY, 5, col.d);
  disc(put, 50, headY, 4, col.b);
  put(49, headY + 2, col.m);              // sunken cheek
  put(50, headY + 2, col.m);
  rect(put, 46, headY - 6, 8, 2, col.d);  // bony forehead plate
  rect(put, 49, headY - 4, 5, 1, col.d);  // brow juts out, casting the eye in shadow
  put(53, headY - 3, col.d);
  put(48, headY - 3, col.m);
  // demonic mark seared down the brow (reference: red streak above the eye)
  put(50, headY - 5, ec.d);
  put(51, headY - 6, ec.b);
  put(52, headY - 5, ec.d);
  put(53, headY - 2, ec.d);
  put(54, headY - 1, ec.b);
  put(55, headY, ec.d);
  // muzzle slopes down and forward, snout wrinkled mid-snarl
  rect(put, 53, headY + 1, 4, 4, col.b);
  rect(put, 55, headY + 3, 3, 4, col.m);
  rect(put, 56, headY + 5, 3, 3, col.b);
  put(55, headY + 4, col.d);              // snarl wrinkle
  put(56, headY + 3, col.d);
  put(58, headY + 6, col.out);            // flared nostril
  put(57, headY + 5, ec.d);               // nostril rim glowing
  // snarling jaw — lips pulled back over bared teeth
  rect(put, 55, headY + 8, 4, 1, P.white);  // teeth
  rect(put, 55, headY + 9, 4, 1, col.out);  // open jaw shadow
  put(54, headY + 8, col.d);                // lip curl
  put(54, headY + 7, col.m);
  // eye — burning ember with a white-hot core, sunk deep under the brow
  put(51, headY - 1, ec.b);
  put(52, headY - 1, ec.l);               // hot core
  put(51, headY, ec.d);
  put(52, headY, col.out);                // pupil
  put(50, headY - 1, ec.d);               // ember bleed at the socket
  put(53, headY - 1, ec.d);
  if (opts.chargeGlow) {                  // eye flares while winding up
    put(50, headY, P.ember);
    put(53, headY, P.ember);
    rawPut(49, headY - 1, P.emberL);      // heat shimmer off the socket
  }

  // --- the signature horn: massive, battle-worn curling spiral ---
  // top of skull → back over the ear → down the jaw → tip snapped off mid-curl
  const hornCx = 46, hornCy = headY + 1;
  const hornPt = (t: number, rOff = 0) => {
    const a = (-90 - 310 * t) * (Math.PI / 180);
    const r = 10 - 6.6 * t + rOff;
    return [Math.round(hornCx + Math.cos(a) * r), Math.round(hornCy + Math.sin(a) * r)] as const;
  };
  for (let t = 0; t <= 0.93; t += 0.015) {
    const [hx, hy] = hornPt(t);
    disc(put, hx, hy, t < 0.5 ? 2 : 1, t < 0.45 ? hc.b : t < 0.8 ? hc.m : hc.d);
  }
  // growth-ring ridges along the outer edge
  for (let t = 0.04; t < 0.85; t += 0.08) {
    const [hx, hy] = hornPt(t, 1.6);
    put(hx, hy, hc.d);
  }
  // ember sigils branded into each horn segment (reference: red marks
  // running the length of the curl)
  let sig = 0;
  for (let t = 0.06; t < 0.88; t += 0.09, sig++) {
    const [hx, hy] = hornPt(t, 0.4);
    put(hx, hy, sig % 2 === 0 ? ec.b : ec.d);
  }
  // deep cracks gouged across the curl
  for (const t of [0.18, 0.42, 0.63]) {
    const [hx, hy] = hornPt(t);
    put(hx, hy, col.out);
    const [ox, oy] = hornPt(t, 1.4);
    put(ox, oy, col.out);
  }
  // jagged snapped-off tip with a molten core
  {
    const [bx, by] = hornPt(0.93);
    put(bx, by, hc.d);
    put(bx + 1, by - 1, col.out);
    put(bx, by - 1, ec.b);          // molten marrow
    put(bx + 1, by, hc.m);
  }
  // dull edge light — worn, not polished
  for (let t = 0; t < 0.25; t += 0.05) {
    const [hx, hy] = hornPt(t, -1.2);
    put(hx, hy, hc.l);
  }
  if (opts.chargeGlow) { // horn crackles with heat
    for (const t of [0, 0.3, 0.55, 0.8]) {
      const [hx, hy] = hornPt(t, 2);
      rawPut(hx, hy, P.emberL);
    }
    rawPut(hornCx, hornCy - 13, P.ember);
  }

  // --- birth pockets along the back ---
  if (opts.pockets !== undefined) {
    const stage = opts.pockets;
    const pockets: Array<[number, number]> = [
      [16, bodyCy - 10], [25, bodyCy - 12], [34, bodyCy - 11]
    ];
    for (const [ox, oy] of pockets) {
      if (stage === 0) {
        disc(put, ox, oy, 3, wc.l);
        disc(put, ox, oy, 2, wc.b);
      } else if (stage === 1) {
        disc(put, ox, oy, 3, wc.d);
        disc(put, ox, oy, 2, col.out);
        put(ox, oy, P.emberD);
      } else if (stage === 2) {
        disc(put, ox, oy, 3, wc.d);
        disc(put, ox, oy, 2, P.ember);
        put(ox - 1, oy, P.white);
        put(ox + 1, oy, P.white);
        put(ox, oy + 1, col.out);
      } else if (stage === 3) {
        disc(put, ox, oy - 1, 4, wc.d);
        disc(put, ox, oy - 1, 3, P.ember);
        disc(put, ox, oy - 2, 2, P.emberL);
        put(ox - 1, oy - 1, P.white);
        put(ox + 1, oy - 1, P.white);
        put(ox, oy, col.out);
      } else if (stage === 4) {
        disc(put, ox, oy, 3, col.out);
        disc(put, ox, oy, 2, wc.d);
      }
    }
  }

  // --- snort puff (unrecorded — sooty smoke with embers in it) ---
  if (opts.breath) {
    rawPut(60, headY + 5, P.stoneM);
    rawPut(61, headY + 6, P.emberL);
    rawPut(60, headY + 7, P.stoneM);
    rawPut(62, headY + 4, P.stoneM);
    rawPut(59, headY + 6, P.stoneM);
    rawPut(62, headY + 6, P.ember);   // ember carried on the breath
  }

  // Crisp 1px silhouette outline (matches the ranger + meadow enemies)
  strokeOutline(px, rawPut, 64);
}

/** Ram frame set — the shared BossFrame plus extra idle/move/atk in-betweens
 *  for smoother animation (the ram is the tutorial-adjacent boss the player
 *  stares at the longest). */
export type RamFrame = BossFrame | 'idle2' | 'idle3' | 'move4' | 'move5' | 'atk2' | 'atk3';

export function drawRam(frame: RamFrame) {
  return (put: Put) => {
    switch (frame) {
      // breathing bob with an ear flick + tail wag mid-cycle
      case 'idle0':      return drawRamBody(put, { bob: 0 });
      case 'idle1':      return drawRamBody(put, { bob: 1, tailWag: 1 });
      case 'idle2':      return drawRamBody(put, { bob: 1, earFlick: true, tailWag: 1 });
      case 'idle3':      return drawRamBody(put, { bob: 0 });
      // 6-step trot: legs swing through ±2 with the body dipping on contact
      case 'move0':      return drawRamBody(put, { bob: 1, legStep: 2 });
      case 'move1':      return drawRamBody(put, { bob: 0, legStep: 1, tailWag: 1 });
      case 'move2':      return drawRamBody(put, { bob: 0, legStep: -1, tailWag: 1 });
      case 'move3':      return drawRamBody(put, { bob: 1, legStep: -2 });
      case 'move4':      return drawRamBody(put, { bob: 0, legStep: -1, tailWag: -1 });
      case 'move5':      return drawRamBody(put, { bob: 0, legStep: 1, tailWag: -1 });
      // 4-step slam: rear up → drop → full headbutt (with snort) → recover
      case 'atk0':       return drawRamBody(put, { rearUp: true, headDown: 0, bob: -1 });
      case 'atk1':       return drawRamBody(put, { headDown: 2, bob: 1 });
      case 'atk2':       return drawRamBody(put, { headDown: 5, bob: 2, breath: true });
      case 'atk3':       return drawRamBody(put, { headDown: 2, bob: 1 });
      case 'chargeWind': return drawRamBody(put, { chargeGlow: true, headDown: 3, bob: 0, breath: true });
      case 'hit':        return drawRamBody(put, { flash: true });
      case 'birth0':     return drawRamBody(put, { pockets: 0 });
      case 'birth1':     return drawRamBody(put, { pockets: 1 });
      case 'birth2':     return drawRamBody(put, { pockets: 2 });
      case 'birth3':     return drawRamBody(put, { pockets: 3 });
      case 'birth4':     return drawRamBody(put, { pockets: 4 });
      case 'die0':       return drawRamDie(put, 0);
      case 'die1':       return drawRamDie(put, 1);
      case 'die2':       return drawRamDie(put, 2);
      case 'die3':       return drawRamDie(put, 3);
      case 'die4':       return drawRamDie(put, 4);
    }
  };
}

export function drawRamDie(put: Put, step: number) {
  const cx = 32, cy = 36;
  const r = Math.max(0, 24 - step * 5);
  if (r > 0) {
    disc(put, cx, cy, r, P.dmaneD);
    disc(put, cx, cy, Math.max(0, r - 1), P.dmane);
    disc(put, cx, cy, Math.max(0, r - 3), P.ember); // burning core
  }
  // Horn shards + sooty fleece chunks flying out, trailing embers
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + step * 0.3;
    const d = step * 6 + 6;
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(cy + Math.sin(a) * d);
    put(x, y, P.dmaneD);
    put(x + 1, y, i % 3 === 0 ? P.dhorn : P.dramD);
    if (i % 4 === 0) put(x, y + 1, P.emberD);
  }
  // Central flash
  if (step < 2) disc(put, cx, cy, 6, P.emberL);
}

// ==================================================================
//  QUEEN ORB projectile (32x32) — blue-white glowing orb
// ==================================================================
export function drawQueenOrb(frame: 0|1) {
  return (put: Put) => {
    const cx = 16, cy = 16, r = 5;
    // Outer glow
    disc(put, cx, cy, r + 1, '#3a5a8a');
    // Main orb body
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / r;
        let color: string;
        if (dist < 0.3) color = '#ffffff';
        else if (dist < 0.5) color = '#cce0ff';
        else if (dist < 0.7) color = '#8abadd';
        else color = '#4a6a8a';
        put(cx + dx, cy + dy, color);
      }
    }
    // Specular highlight — shifts per frame for spin
    const hx = frame === 0 ? cx - 2 : cx - 1;
    const hy = frame === 0 ? cy - 2 : cy - 3;
    put(hx, hy, '#ffffff');
    put(hx + 1, hy, '#cce0ff');
    // Wispy trail
    put(cx + 3 + frame, cy + 2, '#6a8aaa');
    put(cx + 4 + frame, cy + 3, '#4a6a8a');
  };
}

// ==================================================================
//  DRAGON FIREBALL projectile (32x32) — round flame ball with flickering wisps
// ==================================================================
export function drawDragonFireball(frame: 0|1|2|3) {
  return (put: Put) => {
    const cx = 16, cy = 16, r = 7;
    const rot = frame * 0.8; // rotation offset per frame

    // Outer fire glow — soft halo
    for (let dy = -(r + 3); dy <= r + 3; dy++) {
      for (let dx = -(r + 3); dx <= r + 3; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > (r + 3) * (r + 3) || d2 <= (r + 1) * (r + 1)) continue;
        put(cx + dx, cy + dy, '#6a1800');
      }
    }

    // Main flame body — layered with color gradient
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / r;
        // Angle-based color variation for flame feel
        const ang = Math.atan2(dy, dx) + rot;
        const flicker = Math.sin(ang * 3) * 0.12;
        const d = dist + flicker;
        let color: string;
        if (d < 0.2) color = '#ffffcc';
        else if (d < 0.35) color = '#ffee60';
        else if (d < 0.5) color = '#ffaa40';
        else if (d < 0.7) color = '#ff6020';
        else color = '#c04010';
        put(cx + dx, cy + dy, color);
      }
    }

    // Outline ring
    for (let dy = -(r + 1); dy <= r + 1; dy++) {
      for (let dx = -(r + 1); dx <= r + 1; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > (r + 1) * (r + 1) || d2 <= r * r) continue;
        if (Math.sqrt(d2) > r && Math.sqrt(d2) <= r + 1.2) put(cx + dx, cy + dy, '#8a2010');
      }
    }

    // Flame wisps radiating outward (rotating per frame)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rot;
      for (let d = r; d < r + 3 + (i % 2); d++) {
        const fx = Math.round(cx + Math.cos(a) * d);
        const fy = Math.round(cy + Math.sin(a) * d);
        const colors = ['#ff6020', '#ff8030', '#c04010', '#ff4000'];
        put(fx, fy, colors[(i + frame) % colors.length]);
      }
    }

    // Hot center specular
    const hx = cx + (frame < 2 ? -1 : 0);
    const hy = cy + (frame % 2 === 0 ? -2 : -1);
    put(hx, hy, '#ffffff');
    put(hx + 1, hy, '#ffffcc');
    put(hx, hy + 1, '#ffee60');
  };
}

// ==================================================================
//  DRAGON FIREBALL EXPLOSION (32x32) — fiery burst, 5 frames
// ==================================================================
export function drawDragonFireExplosion(frame: number) {
  return (put: Put) => {
    const cx = 16, cy = 16;
    // Expanding ring of fire
    const outerR = 3 + frame * 3;
    const innerR = Math.max(0, frame * 2 - 1);
    const alpha = 1 - frame * 0.15;

    // Outer fire ring
    for (let dy = -outerR; dy <= outerR; dy++) {
      for (let dx = -outerR; dx <= outerR; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > outerR || d < innerR) continue;
        const norm = (d - innerR) / (outerR - innerR);
        let color: string;
        if (norm < 0.3) color = frame < 2 ? '#ffffcc' : '#ffee60';
        else if (norm < 0.5) color = '#ffaa40';
        else if (norm < 0.7) color = '#ff6020';
        else color = '#c04010';
        if (alpha < 0.6 && norm > 0.5) continue; // fade outer edges
        put(cx + dx, cy + dy, color);
      }
    }

    // Flying ember chunks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + frame * 0.3;
      const d = outerR + 1 + frame;
      const ex = Math.round(cx + Math.cos(a) * d);
      const ey = Math.round(cy + Math.sin(a) * d);
      if (ex >= 0 && ex < 32 && ey >= 0 && ey < 32) {
        const colors = ['#ff4000', '#ff8030', '#ffaa40', '#c04010'];
        put(ex, ey, colors[i % colors.length]);
        if (frame < 3) put(ex + (i % 2 === 0 ? 1 : -1), ey, '#ff6020');
      }
    }

    // Central bright core (fades out)
    if (frame < 3) {
      const coreR = Math.max(0, 3 - frame);
      disc(put, cx, cy, coreR, frame === 0 ? '#ffffff' : '#ffee60');
    }

    // Smoke wisps (later frames)
    if (frame >= 3) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + frame * 0.5;
        const d = outerR - 2;
        const sx = Math.round(cx + Math.cos(a) * d);
        const sy = Math.round(cy + Math.sin(a) * d);
        if (sx >= 0 && sx < 32 && sy >= 0 && sy < 32) {
          put(sx, sy, '#4a4a4a');
        }
      }
    }
  };
}

export type DesertBossVariant = 'burrower' | 'scorpion' | 'sandstorm' | 'wraith' | 'construct' | 'sun_priest';

export function drawDesertBoss(frame: BossFrame, variant: DesertBossVariant) {
  return (put: Put) => {
    if (frame.startsWith('die')) {
      const step = parseInt(frame.slice(3));
      const r = 24 - step * 4;
      if (r <= 0) return;
      const col = variant === 'sun_priest' ? '#ffd84a'
        : variant === 'construct' ? '#b89052'
        : variant === 'sandstorm' ? '#c8a45a'
        : variant === 'burrower' ? '#8a5830'
        : '#a06028';
      disc(put, 32, 34, r, col);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + step * 0.35;
        const d = step * 7 + 8;
        put(Math.round(32 + Math.cos(a) * d), Math.round(34 + Math.sin(a) * d), '#6a4528');
      }
      return;
    }
    const flash = frame === 'hit';
    const bob = frame === 'idle1' || frame === 'move1' ? -1 : frame === 'move3' ? 1 : 0;
    const wind = frame === 'chargeWind';
    const atk = frame === 'atk0' || frame === 'atk1';
    const pal = variant === 'wraith'
      ? { d: '#4a3c30', m: '#9f875f', l: '#e0d0a0', hi: '#64c8ff' }
      : variant === 'construct'
      ? { d: '#4d3820', m: '#9a7849', l: '#d8b878', hi: '#40e0ff' }
      : variant === 'sun_priest'
      ? { d: '#8a3a10', m: '#e09a28', l: '#ffd84a', hi: '#ffffff' }
      : variant === 'sandstorm'
      ? { d: '#5a421f', m: '#b8893d', l: '#e0c06f', hi: '#fff0b0' }
      : variant === 'burrower'
      ? { d: '#3f2417', m: '#8a5830', l: '#c88a4a', hi: '#ffd090' }
      : { d: '#4a2512', m: '#9a5a24', l: '#d08a3a', hi: '#ffcf70' };
    const d = flash ? P.white : pal.d;
    const m = flash ? P.white : pal.m;
    const l = flash ? P.white : pal.l;
    const hi = flash ? P.white : pal.hi;

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -24; dx <= 24; dx++) {
        if ((dx * dx) / 576 + (dy * dy) / 6 <= 1) put(32 + dx, 58 + dy, P.shadow);
      }
    }

    if (variant === 'burrower') {
      const sway = frame === 'move1' ? -2 : frame === 'move3' ? 2 : 0;
      for (let i = 0; i < 7; i++) {
        const x = 15 + i * 5;
        const y = 42 - Math.abs(i - 3) * 4 + bob;
        ellipse(put, x + sway, y, 8, 7, i % 2 ? d : m);
        ellipse(put, x + sway, y - 2, 6, 5, i % 2 ? m : l);
        rect(put, x - 5 + sway, y + 3, 10, 2, d);
      }
      ellipse(put, 45 + sway, 22 + bob, 12, 10, d);
      ellipse(put, 44 + sway, 20 + bob, 10, 8, m);
      for (let i = 0; i < 6; i++) {
        const a = -0.9 + i * 0.36;
        line(put,
          Math.round(50 + sway + Math.cos(a) * 4),
          Math.round(20 + bob + Math.sin(a) * 4),
          Math.round(57 + sway + Math.cos(a) * (atk ? 10 : 7)),
          Math.round(20 + bob + Math.sin(a) * (atk ? 10 : 7)),
          hi);
      }
      disc(put, 41 + sway, 18 + bob, 2, P.outline);
      disc(put, 48 + sway, 18 + bob, 2, P.outline);
      return;
    }

    if (variant === 'scorpion') {
      ellipse(put, 30, 36 + bob, 20, 13, d);
      ellipse(put, 30, 34 + bob, 18, 11, m);
      ellipse(put, 26, 31 + bob, 10, 6, l);
      for (let i = 0; i < 5; i++) {
        const lx = 14 + i * 5;
        line(put, lx, 44 + bob, lx - 9, 53 + ((i + (frame === 'move1' ? 1 : 0)) % 2), d);
        line(put, lx + 8, 44 + bob, lx + 16, 53 + ((i + (frame === 'move3' ? 1 : 0)) % 2), d);
      }
      rect(put, 43, 18 + bob, 6, 22, d);
      rect(put, 47, 13 + bob, 8, 6, m);
      disc(put, 56, 14 + bob, wind ? 4 : 3, wind ? hi : '#d04020');
      rect(put, 10, 31 + bob, atk ? 12 : 8, 5, d);
      rect(put, 45, 31 + bob, atk ? 12 : 8, 5, d);
      put(24, 29 + bob, '#ffd84a'); put(35, 29 + bob, '#ffd84a');
      return;
    }

    if (variant === 'sandstorm') {
      ellipse(put, 32, 36 + bob, 18, 15, d);
      ellipse(put, 32, 33 + bob, 16, 13, m);
      ellipse(put, 23, 26 + bob, 9, 9, d);
      ellipse(put, 22, 24 + bob, 8, 8, m);
      rect(put, 16, 46 + bob, 10, 8, d);
      rect(put, 38, 46 - bob, 10, 8, d);
      rect(put, 12, 34 + bob, atk ? 16 : 10, 5, d);
      rect(put, 42, 34 + bob, atk ? 16 : 10, 5, d);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + (wind ? 0.4 : 0);
        line(put,
          Math.round(32 + Math.cos(a) * 18),
          Math.round(34 + bob + Math.sin(a) * 12),
          Math.round(32 + Math.cos(a) * 24),
          Math.round(34 + bob + Math.sin(a) * 17),
          i % 2 ? l : hi);
      }
      disc(put, 20, 23 + bob, 2, P.outline);
      if (wind || atk) ring(put, 32, 34 + bob, 20, hi);
      return;
    }

    if (variant === 'wraith') {
      ellipse(put, 32, 30 + bob, 17, 21, d);
      ellipse(put, 32, 28 + bob, 15, 19, m);
      for (let i = 0; i < 9; i++) {
        const x = 17 + i * 4;
        line(put, x, 47 + bob, x - 4 + i, 58, i % 2 ? d : l);
      }
      disc(put, 25, 27 + bob, 2, hi); disc(put, 39, 27 + bob, 2, hi);
      if (atk || wind) ring(put, 32, 31 + bob, wind ? 15 : 11, '#64c8ff');
      return;
    }

    if (variant === 'construct') {
      rect(put, 16, 18 + bob, 32, 33, d);
      rect(put, 18, 16 + bob, 28, 32, m);
      rect(put, 20, 18 + bob, 24, 5, l);
      rect(put, 20, 34 + bob, 24, 4, d);
      rect(put, 10, 42 + bob, 14, 10, d);
      rect(put, 40, 42 - bob, 14, 10, d);
      rect(put, 11, 28 + bob, 8, atk ? 18 : 12, m);
      rect(put, 45, 28 + bob, 8, atk ? 18 : 12, m);
      disc(put, 25, 29 + bob, 2, hi); disc(put, 39, 29 + bob, 2, hi);
      return;
    }

    // Sun Priest
    ellipse(put, 32, 34 + bob, 15, 18, d);
    ellipse(put, 32, 31 + bob, 13, 16, m);
    rect(put, 22, 21 + bob, 20, 5, l);
    disc(put, 32, 18 + bob, wind ? 9 : 7, l);
    disc(put, 32, 18 + bob, wind ? 5 : 4, hi);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + (wind ? 0.25 : 0);
      line(put,
        Math.round(32 + Math.cos(a) * 11),
        Math.round(18 + bob + Math.sin(a) * 11),
        Math.round(32 + Math.cos(a) * 16),
        Math.round(18 + bob + Math.sin(a) * 16),
        l);
    }
    disc(put, 27, 31 + bob, 2, P.outline); disc(put, 37, 31 + bob, 2, P.outline);
    if (atk) ring(put, 32, 35 + bob, 18, '#ffd84a');
  };
}
