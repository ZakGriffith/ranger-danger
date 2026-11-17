import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Clip = 'move' | 'attack';
type Profile = 'spore' | 'lantern' | 'briar';
type Trace = (path: CanvasRenderingContext2D) => void;

const skins = {
  spore: {
    light: '#bea1ae', ridge: '#e3bfbe', skin: '#94748f', shade: '#694e72', deep: '#47344f',
    belly: '#aa8467', throat: '#e1bd83', eye: '#f4c675', toxin: '#b8cc59',
    hop: 19, pitch: .095, shoulder: 24, headY: -41, headScale: 1,
  },
  lantern: {
    light: '#91af98', ridge: '#c6d4a3', skin: '#5a877a', shade: '#436667', deep: '#30474d',
    belly: '#798951', throat: '#dce991', eye: '#fdedaa', toxin: '#cfe66c',
    hop: 26, pitch: .17, shoulder: 27, headY: -38, headScale: .92,
  },
  briar: {
    light: '#afaa75', ridge: '#d5cb99', skin: '#847858', shade: '#605749', deep: '#423c39',
    belly: '#846954', throat: '#d5a789', eye: '#f1a966', toxin: '#aebf67',
    hop: 13, pitch: .07, shoulder: 23, headY: -39, headScale: 1.08,
  },
} as const;

type Skin = typeof skins[Profile];

const ease = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const pulse = (start: number, peak: number, end: number, phase: number) =>
  phase < peak ? ease(start, peak, phase) : 1 - ease(peak, end, phase);

function motion(clip: Clip, phase: number, skin: Skin) {
  if (clip === 'attack') {
    const charge = ease(.03, .47, phase) * (1 - ease(.48, .65, phase));
    const release = pulse(.43, .56, .77, phase);
    return {
      x: 5 * release - 5 * charge, y: 2.4 * charge - 3 * release,
      compression: 1 - .08 * charge + .06 * release, lift: 0, tuck: 0, stride: 2 * release,
      tilt: -(.23 * charge + .12 * release), charge, release,
    };
  }
  const t = Math.max(0, Math.min(1, (phase - .2) / .59));
  const lift = Math.pow(Math.sin(Math.PI * t), 1.05);
  const crouch = pulse(.015, .16, .24, phase);
  const landing = pulse(.77, .87, .99, phase);
  return {
    x: -4 * crouch + 8 * lift + 5 * landing,
    y: -skin.hop * lift + 5 * crouch + 4 * landing,
    compression: 1 + .08 * lift - .095 * crouch - .09 * landing,
    lift: skin.hop * lift, tuck: pulse(.31, .53, .78, phase),
    stride: Math.sin(Math.PI * t) * (t - .28) * 13,
    tilt: skin.pitch * Math.sin(t * 2 * Math.PI), charge: 0, release: 0,
  };
}

function footLeg(
  ctx: CanvasRenderingContext2D, skin: Skin,
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

function torso(ctx: CanvasRenderingContext2D, profile: Profile, skin: Skin) {
  const lower = -9;
  const back: Record<Profile, Trace> = {
    spore: p => {
      p.moveTo(-51, -21); p.bezierCurveTo(-50, -43, -28, -52, -11, -50);
      p.bezierCurveTo(5, -51, 17, -42, 29, -38); p.quadraticCurveTo(44, -26, 34, -15);
      p.bezierCurveTo(25, -4, 2, -4, -15, lower);
      p.quadraticCurveTo(-44, -5, -51, -21);
    },
    lantern: p => {
      p.moveTo(-54, -17); p.bezierCurveTo(-57, -29, -43, -43, -28, -42);
      p.bezierCurveTo(-11, -44, 7, -38, 27, -41); p.quadraticCurveTo(47, -31, 35, -15);
      p.bezierCurveTo(27, -7, 13, -10, 1, -9); p.quadraticCurveTo(-30, -5, -45, -10);
      p.quadraticCurveTo(-52, -12, -54, -17);
    },
    briar: p => {
      p.moveTo(-55, -21); p.quadraticCurveTo(-58, -32, -49, -44);
      p.quadraticCurveTo(-44, -48, -39, -46); p.quadraticCurveTo(-29, -58, -15, -52);
      p.quadraticCurveTo(-4, -53, 5, -47); p.quadraticCurveTo(23, -47, 34, -35);
      p.bezierCurveTo(52, -26, 35, -9, 25, -8);
      p.bezierCurveTo(7, 0, -27, -8, -43, -10); p.quadraticCurveTo(-53, -13, -55, -21);
    },
  };
  shape(ctx, wash(ctx, -55, lower, [[0, skin.light], [.4, skin.skin], [.76, skin.shade], [1, skin.deep]]), 3.2, back[profile]);
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

function mushroom(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, turn: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.scale(scale, scale);
  shape(ctx, '#9d7164', 1.8, p => {
    p.moveTo(-5, 1); p.quadraticCurveTo(-6, -4, -3, -11); p.lineTo(5, -11);
    p.quadraticCurveTo(1, -5, 6, 1); p.quadraticCurveTo(2, 7, -5, 1);
  });
  shape(ctx, wash(ctx, -28, -8, [[0, '#e5af76'], [.5, '#be7960'], [1, '#784557']]), 2.3, p => {
    p.moveTo(-15, -10); p.quadraticCurveTo(-17, -13, -12, -20);
    p.bezierCurveTo(-7, -30, 4, -31, 12, -22);
    p.quadraticCurveTo(15, -18, 17, -13); p.quadraticCurveTo(13, -7, 4, -7);
    p.quadraticCurveTo(-6, -7, -15, -10);
  });
  shape(ctx, '#8a5361', 1.1, p => {
    p.moveTo(-13, -11); p.quadraticCurveTo(-4, -14, 9, -12); p.quadraticCurveTo(16, -13, 16, -12);
    p.quadraticCurveTo(11, -6, -.5, -7); p.quadraticCurveTo(-9, -7.5, -13, -11);
  });
  line(ctx, '#d79480', .95, p => {
    p.moveTo(-8, -11.3); p.lineTo(-5, -8.4);
    p.moveTo(-2, -11.5); p.lineTo(0, -8.5);
    p.moveTo(5.5, -11.4); p.lineTo(5, -8.9);
    p.moveTo(11, -11.8); p.lineTo(10, -9.6);
  });
  line(ctx, '#f9c78b', 1.7, p => {
    p.moveTo(-9.2, -21.2); p.quadraticCurveTo(-3, -28, 4, -25.4);
  });
  oval(ctx, 8.4, -20.5, 2.4, 1.85, '#eeb58c');
  oval(ctx, -4.5, -18.9, 1.9, 1.25, '#ec9a79');
  ctx.restore();
}

function lanternCrest(ctx: CanvasRenderingContext2D, pulse: number) {
  shape(ctx, wash(ctx, -66, -37, [[0, '#a3c1aa'], [.56, '#69887d'], [1, '#485b61']]), 2.4, p => {
    p.moveTo(-48, -35);
    p.quadraticCurveTo(-44, -54, -35, -55); p.quadraticCurveTo(-36, -50, -33, -47);
    p.quadraticCurveTo(-27, -62, -18, -62); p.quadraticCurveTo(-20, -53, -15, -48);
    p.quadraticCurveTo(-9, -57, -2, -57); p.quadraticCurveTo(-3, -51, 3, -43);
    p.quadraticCurveTo(-14, -42, -29, -40); p.quadraticCurveTo(-41, -41, -48, -35);
  });
  for (const [x, y, r] of [[-37, -39, 5.8], [-23, -44, 7], [-8, -39, 4.8]] as const) {
    const radius = r * (1 + pulse * .13);
    shape(ctx, '#668950', 1.75, p => p.ellipse(x, y, radius, radius * .79, -.35, 0, Math.PI * 2));
    oval(ctx, x - 1.2, y - 1.9, radius * .61, radius * .43, '#b9c76d', -.35);
    oval(ctx, x - 1.9, y - 2.8, 1.75, 1.1, '#e9e99a');
  }
}

function briarPlates(ctx: CanvasRenderingContext2D) {
  for (const [x, y, size, tilt] of [[-45, -38, 17, -.28], [-29, -47, 22, -.18], [-10, -49, 23, .05], [12, -43, 20, .34]] as const) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    shape(ctx, wash(ctx, -size * .88, size * .4, [[0, '#c3bc86'], [.43, '#92976a'], [1, '#59604a']]), 2.5, p => {
      p.moveTo(-size * .47, size * .22);
      p.quadraticCurveTo(-size * .64, -size * .24, -size * .28, -size * .46);
      p.lineTo(-size * .17, -size * .85);
      p.quadraticCurveTo(size * .15, -size * .69, size * .36, -size * .41);
      p.quadraticCurveTo(size * .54, -size * .36, size * .58, size * .01);
      p.quadraticCurveTo(size * .38, size * .42, -size * .18, size * .39);
    });
    shape(ctx, '#acb47b', 0, p => {
      p.moveTo(-size * .38, -size * .14); p.lineTo(-size * .14, -size * .53);
      p.quadraticCurveTo(size * .19, -size * .39, size * .37, -size * .2);
      p.lineTo(size * .12, -size * .24);
      p.quadraticCurveTo(-size * .05, -size * .22, -size * .08, -size * .03);
      p.lineTo(-size * .16, -size * .14);
    });
    line(ctx, '#4f5947', 1.25, p => {
      p.moveTo(-size * .12, -size * .49); p.lineTo(-size * .04, -size * .17);
      p.lineTo(size * .14, -size * .08); p.lineTo(size * .22, size * .16);
    });
    ctx.restore();
  }
  for (const [x, y, r] of [[-28, -35, 3], [-17, -39, 4.4], [2, -34, 3.3]] as const) {
    oval(ctx, x, y, r, r * .68, '#754659', -.18);
    oval(ctx, x - .6, y - 1.1, r * .58, r * .37, '#c8848e', -.28);
  }
}

function face(ctx: CanvasRenderingContext2D, profile: Profile, skin: Skin, charge: number, open: number, blink: boolean) {
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

function glob(ctx: CanvasRenderingContext2D, skin: Skin, phase: number, startX: number) {
  if (phase < .55 || phase > .985) return;
  const t = Math.min(1, (phase - .55) / .385);
  const x = startX + (106 - startX) * t;
  const y = -35 * (1 - t) - 39 * t * (1 - t) * 4 - 4 * t * t;
  if (t < 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.65 + t * 1.65);
    const r = 6 + Math.sin(Math.PI * t) * 1.5;
    shape(ctx, wash(ctx, -r, r, [[0, '#dce990'], [.49, skin.toxin], [1, '#667e50']]), 1.85, p => {
      p.moveTo(r, -.5); p.quadraticCurveTo(r + 1, r * .83, .5, r);
      p.quadraticCurveTo(-r, r * .86, -r, .5); p.quadraticCurveTo(-r - .7, -r, -r * .2, -r);
      p.quadraticCurveTo(r * .87, -r * 1.18, r, -.5);
    });
    oval(ctx, -2, -r * .49, r * .49, r * .22, '#f3f5ba', -.36);
    oval(ctx, -r - 5, 1.1, r * .21, r * .16, skin.toxin, -.2);
    ctx.restore();
    return;
  }
  const splash = ease(.935, .985, phase);
  oval(ctx, 106, -1.5, 4 + splash * 7.5, 1.5 + splash * 1.2, '#778e56');
  oval(ctx, 105, -2, 2.5 + splash * 5.5, 1.1, skin.toxin);
  oval(ctx, 111 + splash * 3.2, -3.5 - Math.sin(Math.PI * splash) * 4, 1.5, 2.1 * (1 - splash), skin.toxin, .35);
}

function drawToad(ctx: CanvasRenderingContext2D, profile: Profile, clip: Clip, phase: number) {
  const skin = skins[profile];
  const pose = motion(clip, phase, skin);
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
  torso(ctx, profile, skin);
  if (profile === 'spore') {
    mushroom(ctx, -43, -42, .69, -.28 + pose.tilt);
    mushroom(ctx, -28, -49, 1.02, -.1 + pose.tilt * .65);
    mushroom(ctx, -6, -46, .75, .25 + pose.tilt * .45);
  } else if (profile === 'lantern') {
    lanternCrest(ctx, pose.charge);
  } else {
    briarPlates(ctx);
  }
  ctx.restore();

  footLeg(ctx, skin, rearX, joinY + 1, rearFoot, feetY - pose.tuck * 3, true, false);
  footLeg(ctx, skin, skin.shoulder + pose.x, joinY, foreFoot, feetY - pose.tuck * 4, false, false);
  ctx.save();
  ctx.translate(23 + pose.x + 3 * pose.release + (profile === 'lantern' ? 6 : 0), skin.headY * pose.compression + pose.y);
  ctx.rotate(pose.tilt);
  ctx.scale(skin.headScale, skin.headScale);
  face(ctx, profile, skin, pose.charge, pose.release, clip === 'move' && phase > .86 && phase < .93);
  ctx.restore();
  if (clip === 'attack') glob(ctx, skin, phase, 56 + (profile === 'lantern' ? 5 : 0));
  ctx.restore();
}

export const toadOptions = [
  {
    name: 'Sporeback',
    description: 'A broad plum toad with rusty shelf mushrooms and a swelling ochre throat.',
    draw: (ctx: CanvasRenderingContext2D, clip: Clip, phase: number) => drawToad(ctx, 'spore', clip, phase),
  },
  {
    name: 'Lantern Throat',
    description: 'A long jumping bog toad with a finned back and luminous poison sacs.',
    draw: (ctx: CanvasRenderingContext2D, clip: Clip, phase: number) => drawToad(ctx, 'lantern', clip, phase),
  },
  {
    name: 'Briarback',
    description: 'A squat toad braced under mossy thorns, with violet blight between the plates.',
    draw: (ctx: CanvasRenderingContext2D, clip: Clip, phase: number) => drawToad(ctx, 'briar', clip, phase),
  },
] as const;
