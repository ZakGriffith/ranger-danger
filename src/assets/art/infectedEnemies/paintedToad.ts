import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

export type ToadArtClip = 'idle' | 'move' | 'attack';
type Profile = 'spore' | 'lantern' | 'briar';
type Trace = (path: CanvasRenderingContext2D) => void;

export type PaintedToadSkin = {
  light: string; ridge: string; skin: string; shade: string; deep: string;
  belly: string; throat: string; eye: string; toxin: string;
  hop: number; pitch: number; shoulder: number; headY: number; headScale: number;
};

export type PaintedToadArt = {
  profile: Profile;
  skin: PaintedToadSkin;
  back: Trace;
  decorate(ctx: CanvasRenderingContext2D, tilt: number, charge: number): void;
};

const ease = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const pulse = (start: number, peak: number, end: number, phase: number) =>
  phase < peak ? ease(start, peak, phase) : 1 - ease(peak, end, phase);

function motion(clip: ToadArtClip, phase: number, skin: PaintedToadSkin, demoTravel: boolean) {
  if (clip === 'attack') {
    const charge = ease(.03, .47, phase) * (1 - ease(.48, .65, phase));
    const release = pulse(.43, .56, .77, phase);
    return {
      x: 5 * release - 5 * charge, y: 2.4 * charge - 3 * release,
      compression: 1 - .08 * charge + .06 * release, lift: 0, tuck: 0, stride: 2 * release,
      tilt: -(.23 * charge + .12 * release), charge, release,
    };
  }
  if (clip === 'idle') {
    const breath = .5 - .5 * Math.cos(phase * Math.PI * 2);
    return {
      x: 0, y: 0, compression: 1 + .025 * breath, lift: 0, tuck: 0, stride: 0,
      tilt: 0, charge: .085 * breath, release: 0,
    };
  }
  const t = Math.max(0, Math.min(1, (phase - .2) / .59));
  const travel = demoTravel ? 1 : 0;
  const lift = Math.pow(Math.sin(Math.PI * t), 1.05);
  const crouch = pulse(.015, .16, .24, phase);
  const landing = pulse(.77, .87, .99, phase);
  return {
    x: travel * (-4 * crouch + 8 * lift + 5 * landing),
    y: -skin.hop * lift + 5 * crouch + 4 * landing,
    compression: 1 + .08 * lift - .095 * crouch - .09 * landing,
    lift: skin.hop * lift, tuck: pulse(.31, .53, .78, phase),
    stride: Math.sin(Math.PI * t) * (t - .28) * 13,
    tilt: skin.pitch * Math.sin(t * 2 * Math.PI), charge: 0, release: 0,
  };
}

function footLeg(
  ctx: CanvasRenderingContext2D, skin: PaintedToadSkin,
  shoulderX: number, shoulderY: number, footX: number, footY: number, hind: boolean, far: boolean,
) {
  const kneeX = shoulderX + (hind ? -11 : 3) + (footX - shoulderX) * .15;
  const kneeY = shoulderY + (footY - shoulderY) * (hind ? .44 : .54);
  const width = hind ? 15 : 8;
  const toe = hind ? 12 : 9;
  const color = far ? skin.shade : wash(ctx, shoulderY - 9, footY, [
    [0, skin.light], [.43, skin.skin], [.8, skin.shade], [1, skin.deep],
  ]);
  shape(ctx, color, far ? 2 : 2.6, p => {
    p.moveTo(shoulderX - width + 5, shoulderY + 3);
    p.quadraticCurveTo(shoulderX - width, shoulderY - 11, shoulderX + 1, shoulderY - 10);
    p.bezierCurveTo(shoulderX + 12, shoulderY - 9, shoulderX + width, kneeY - 6, kneeX + width * .73, kneeY + 1);
    p.quadraticCurveTo(kneeX + width * .61, kneeY + 6, footX - 3, footY - 4);
    p.quadraticCurveTo(footX + 4.7, footY - 8, footX + toe, footY - 3);
    p.quadraticCurveTo(footX + toe + 1, footY - .5, footX + toe - 4, footY);
    p.quadraticCurveTo(footX + 2, footY - 1.1, footX - 1, footY);
    p.quadraticCurveTo(footX - 12, footY + 1, footX - 12, footY - 4);
    p.quadraticCurveTo(footX - 11, footY - 8, kneeX - width * .5, kneeY + 4.5);
    p.quadraticCurveTo(kneeX - width, kneeY - 1, shoulderX - width + 5, shoulderY + 3);
  });
  if (!far) {
    shape(ctx, skin.light, 0, p => {
      p.moveTo(shoulderX - width * .58, shoulderY + 2);
      p.quadraticCurveTo(shoulderX - 8, shoulderY - 7.2, shoulderX + 3, shoulderY - 7);
      p.quadraticCurveTo(shoulderX + width * .79, shoulderY - 4, kneeX + width * .58, kneeY - 2.3);
      p.quadraticCurveTo(kneeX + width * .44, kneeY + 2, kneeX + .8, kneeY + .9);
      p.quadraticCurveTo(shoulderX + 3, kneeY - 5, shoulderX - width * .58, shoulderY + 2);
    });
    line(ctx, skin.deep, 1.2, p => {
      p.moveTo(footX + 1, footY - 3);
      p.quadraticCurveTo(footX + 1.9, footY - 2.1, footX + 1.3, footY - .6);
      p.moveTo(footX + 5, footY - 3.5);
      p.lineTo(footX + 5.7, footY - 1.2);
    });
  }
}

function torso(ctx: CanvasRenderingContext2D, skin: PaintedToadSkin, back: Trace) {
  const lower = -9;
  shape(ctx, wash(ctx, -55, lower, [[0, skin.light], [.4, skin.skin], [.76, skin.shade], [1, skin.deep]]), 3.2, back);
  shape(ctx, wash(ctx, -33, -8, [[0, skin.belly], [1, skin.deep]]), 0, p => {
    p.moveTo(-29, -21);
    p.bezierCurveTo(-18, -18, -11, -20, 0, -26);
    p.quadraticCurveTo(13, -31, 31, -28);
    p.quadraticCurveTo(29, -16, 21, -11);
    p.quadraticCurveTo(1, -7, -25, -12);
    p.quadraticCurveTo(-31, -15, -29, -21);
  });
  shape(ctx, skin.light, 0, p => {
    p.moveTo(-47, -29);
    p.bezierCurveTo(-37, -43, -29, -44, -18, -43);
    p.quadraticCurveTo(-9, -42, -4, -39);
    p.quadraticCurveTo(-18, -39, -20, -36);
    p.quadraticCurveTo(-34, -39, -47, -29);
  });
  for (const [x, y, r] of [[-40, -32, 3.4], [-34, -27, 2], [-22, -33, 2.6], [-10, -32, 1.8], [7, -33, 3]] as const) {
    oval(ctx, x, y, r, r * .63, skin.shade, -.33);
    oval(ctx, x - r * .34, y - r * .37, r * .47, r * .37, skin.light, -.2);
  }
}

function face(ctx: CanvasRenderingContext2D, profile: Profile, skin: PaintedToadSkin, charge: number, open: number, blink: boolean) {
  const snout = profile === 'lantern' ? 31 : 32;
  const cheek = profile === 'briar' ? -16 : -13;
  shape(ctx, wash(ctx, -20, -3, [[0, skin.shade], [1, skin.deep]]), 2.2, p => {
    p.moveTo(14, -4); p.bezierCurveTo(13, -19, 27, -24, 29, -12);
    p.quadraticCurveTo(30, -7, 25, -3); p.lineTo(14, -4);
  });
  oval(ctx, 23.4, -13, 3.8, 3, skin.eye, -.23);
  oval(ctx, 24.9, -13, 1.45, 2.2, ink);

  shape(ctx, wash(ctx, -2, 25 + charge * 9, [[0, skin.throat], [.55, skin.belly], [1, skin.shade]]), 2.7, p => {
    p.moveTo(cheek + 1, 4); p.quadraticCurveTo(8, 0, snout - 1, 5 + open * 8);
    p.bezierCurveTo(snout + 3, 13 + charge * 6, 24, 18 + charge * 10, 9, 20 + charge * 10);
    p.quadraticCurveTo(cheek, 21 + charge * 5, cheek + 1, 4);
  });
  shape(ctx, skin.throat, 0, p => {
    p.moveTo(cheek + 5, 10); p.quadraticCurveTo(5, 10 + open * 4, 22, 10 + open * 5);
    p.quadraticCurveTo(18, 17 + charge * 8, 7, 17 + charge * 8);
    p.quadraticCurveTo(cheek + 5, 17 + charge * 4, cheek + 5, 10);
  });
  if (charge > .05 || profile === 'lantern') {
    line(ctx, profile === 'lantern' ? '#f0f0a8' : skin.ridge, 1.05, p => {
      p.moveTo(-4, 17 + charge * 4); p.quadraticCurveTo(6, 22 + charge * 6, 16, 17 + charge * 5);
    });
  }

  shape(ctx, wash(ctx, -26, 14, [[0, skin.light], [.47, skin.skin], [1, skin.shade]]), 2.7, p => {
    p.moveTo(cheek - 3, 5);
    p.quadraticCurveTo(cheek - 6, -9, -10, -12);
    if (profile === 'briar') {
      p.lineTo(-11, -17); p.quadraticCurveTo(-8, -20, -3, -19);
    }
    p.bezierCurveTo(-7, -24, 6, -25, 13, -17);
    p.quadraticCurveTo(13, -13, 17, -11);
    p.bezierCurveTo(25, -12, 32, -9, snout, -4);
    p.quadraticCurveTo(snout + 1, 1, snout - 2, 4);
    p.quadraticCurveTo(22, 9, 11, 7);
    p.quadraticCurveTo(-2, 12, cheek, 9);
  });
  shape(ctx, skin.light, 0, p => {
    p.moveTo(cheek + 4, -4); p.quadraticCurveTo(-9, -13, -3, -13);
    p.quadraticCurveTo(-3, -18, 1, -19);
    p.quadraticCurveTo(7, -21, 12, -16);
    p.lineTo(10, -13); p.quadraticCurveTo(5, -16, 1, -12);
    p.quadraticCurveTo(-6, -7, cheek + 4, -4);
  });
  line(ctx, skin.ridge, 1.5, p => {
    p.moveTo(-1, -19.8); p.quadraticCurveTo(5, -24, 10, -19.3);
    p.moveTo(17, -7.2); p.quadraticCurveTo(22, -9.3, 27, -6.7);
  });
  if (open > .02) {
    shape(ctx, '#312330', 1.45, p => {
      p.moveTo(-2, 5.9); p.quadraticCurveTo(16, 7.5, snout - 1, 2.7);
      p.quadraticCurveTo(snout + 2, 7 + open * 7, 24, 9 + open * 5);
      p.quadraticCurveTo(10, 11 + open * 3.5, -2, 5.9);
    });
    oval(ctx, 21, 9 + open * 4, 5.6, 1.35 + open * .85, '#c07881', -.16);
    if (open > .52) oval(ctx, 27, 6 + open * 4, 2.45, 1.65, skin.toxin, -.29);
  } else {
    line(ctx, skin.deep, 1.5, p => {
      p.moveTo(-3, 6); p.quadraticCurveTo(8, 9.5, 17, 6.7);
      p.quadraticCurveTo(25, 6.8, snout - 2, 3.8);
    });
  }
  oval(ctx, snout - 5.7, -3.6, 2.15, 1.33, skin.deep, .25);
  oval(ctx, 5.5, -10.5, 7.9, 6.55, skin.deep, .13);
  if (!blink) {
    oval(ctx, 5.8, -10.6, 6.15, 5.05, skin.eye, .16);
    oval(ctx, 7.1, -10.1, 4, 2.45, ink, .10);
    oval(ctx, 4.1, -12.4, 1.65, 1.2, '#fff7da', .07);
  } else {
    oval(ctx, 5.8, -10.4, 6.35, 4.5, skin.shade, .13);
    line(ctx, ink, 1.3, p => { p.moveTo(.5, -10.5); p.quadraticCurveTo(6, -7.5, 11, -9.5); });
  }
  line(ctx, skin.skin, 1.6, p => { p.moveTo(-1.4, -13.8); p.quadraticCurveTo(5, -20, 13, -13.7); });
}

export function drawPaintedToad(
  ctx: CanvasRenderingContext2D, art: PaintedToadArt, clip: ToadArtClip, phase: number, demoTravel = false,
) {
  const { profile, skin } = art;
  const pose = motion(clip, phase, skin, demoTravel);
  const feetY = -pose.lift;
  const rearFoot = (profile === 'briar' ? -35 : -31) + pose.x + pose.stride - 11 * pose.tuck;
  const foreFoot = (profile === 'lantern' ? 37 : 34) + pose.x + pose.stride + 8 * pose.tuck;
  const rearX = (profile === 'lantern' ? -32 : -27) + pose.x;
  const joinY = -26 * pose.compression + pose.y;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  footLeg(ctx, skin, rearX - 8, joinY - 2, rearFoot - 13, feetY - 4, true, true);
  footLeg(ctx, skin, skin.shoulder + pose.x - 5, joinY - 4, foreFoot + 7, feetY - 5, false, true);

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.scale(1 + (1 - pose.compression) * .55, pose.compression);
  torso(ctx, skin, art.back);
  art.decorate(ctx, pose.tilt, pose.charge);
  ctx.restore();

  footLeg(ctx, skin, rearX, joinY + 1, rearFoot, feetY - pose.tuck * 3, true, false);
  footLeg(ctx, skin, skin.shoulder + pose.x, joinY, foreFoot, feetY - pose.tuck * 4, false, false);
  ctx.save();
  ctx.translate(23 + pose.x + 3 * pose.release + (profile === 'lantern' ? 6 : 0), skin.headY * pose.compression + pose.y);
  ctx.rotate(pose.tilt);
  ctx.scale(skin.headScale, skin.headScale);
  face(ctx, profile, skin, pose.charge, pose.release,
    (clip === 'move' && phase > .86 && phase < .93) || (clip === 'idle' && phase === .75));
  ctx.restore();
  ctx.restore();
}
