import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Motion = 'move' | 'attack';
type Style = 'iron' | 'bark' | 'bone';
type Point = readonly [number, number];

const TAU = Math.PI * 2;
const COLORS = {
  iron: { light: '#b8a493', upper: '#817478', middle: '#655562', deep: '#484052', armor: '#c3c2a8', shade: '#767775', accent: '#d29261', glow: '#f3cf80', toe: '#a79e91' },
  bark: { light: '#bf9363', upper: '#956750', middle: '#765143', deep: '#50373c', armor: '#b48859', shade: '#654740', accent: '#c27846', glow: '#f5b75b', toe: '#d0a56f' },
  bone: { light: '#e0d1b1', upper: '#b7afa0', middle: '#928493', deep: '#6b566b', armor: '#cfc4ae', shade: '#91828f', accent: '#c3797c', glow: '#f79d77', toe: '#f1dec1' },
};
type Palette = typeof COLORS[Style];

function ease(a: number, b: number, t: number) {
  const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
}

function mix(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function foot(phase: number, center: number, y: number, stride: number): Point {
  const t = phase % 1;
  if (t < .64) return [center + stride * (1 - 2 * t / .64), y];
  const step = (t - .64) / .36;
  return [center - stride * Math.cos(Math.PI * step), y - 8.5 * Math.sin(Math.PI * step)];
}

function polygon(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, width: number, points: readonly Point[]) {
  shape(ctx, fill, width, p => {
    for (const [i, [x, y]] of points.entries()) i ? p.lineTo(x, y) : p.moveTo(x, y);
  });
}

function limb(ctx: CanvasRenderingContext2D, start: Point, end: Point, wide: number, thin: number, c: Palette, dark: boolean) {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  ctx.save();
  ctx.translate(...start);
  ctx.rotate(Math.atan2(start[0] - end[0], end[1] - start[1]));
  const fill = dark ? c.deep : wash(ctx, -7, length + 4, [[0, c.light], [.32, c.upper], [.66, c.middle], [1, c.deep]]);
  shape(ctx, fill, dark ? 2.5 : 3, p => {
    p.moveTo(-wide, 0);
    p.bezierCurveTo(-wide - 1, -wide * .82, wide + 1, -wide * .89, wide, .8);
    p.quadraticCurveTo(wide + 1, length * .38, thin, length - 1);
    p.quadraticCurveTo(thin + 1, length + 7, .2, length + 7);
    p.quadraticCurveTo(-thin - 2, length + 7, -thin - 1, length);
    p.quadraticCurveTo(-wide - 3, length * .55, -wide, 0);
  });
  if (!dark) {
    shape(ctx, c.light, 0, p => {
      p.moveTo(-wide + 2.8, -.3); p.quadraticCurveTo(-wide + 4.5, -5.3, 0, -4);
      p.quadraticCurveTo(-wide * .33, 2, -thin + 1.5, length * .64);
      p.quadraticCurveTo(-wide + 3, length * .39, -wide + 2.8, -.3);
    });
    line(ctx, c.shade, 1.35, p => { p.moveTo(2, length * .33); p.quadraticCurveTo(2.9, length * .44, 1.7, length * .62); });
  }
  ctx.restore();
}

function boot(ctx: CanvasRenderingContext2D, point: Point, c: Palette, dark: boolean) {
  ctx.save(); ctx.translate(...point);
  shape(ctx, dark ? c.deep : wash(ctx, -13, 0, [[0, c.upper], [1, c.deep]]), 2.75, p => {
    p.moveTo(-9, -2); p.quadraticCurveTo(-12, -8, -5, -13);
    p.quadraticCurveTo(1, -15, 7, -8); p.quadraticCurveTo(15, -9, 16, -4);
    p.quadraticCurveTo(17, .5, 9, .1); p.quadraticCurveTo(-3, .8, -9, -2);
  });
  if (!dark) {
    line(ctx, c.toe, 1.65, p => {
      p.moveTo(9, -5); p.lineTo(11, -3);
      p.moveTo(13, -5.1); p.lineTo(14.5, -3.1);
      p.moveTo(-4, -4); p.quadraticCurveTo(0, -3.2, 4, -4);
    });
  }
  ctx.restore();
}

function leg(ctx: CanvasRenderingContext2D, hip: Point, paw: Point, c: Palette, dark: boolean, style: Style) {
  const knee: Point = [(hip[0] + paw[0]) * .5 + (style === 'bark' ? 4 : 2.5), (hip[1] + paw[1]) * .5 - 2];
  limb(ctx, knee, [paw[0], paw[1] - 7], dark ? 7.2 : 9, 5.8, c, dark);
  limb(ctx, hip, knee, dark ? 11 : 13, dark ? 8 : 10, c, dark);
  boot(ctx, paw, c, dark);
}

function shingle(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, angle: number, c: Palette) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  polygon(ctx, wash(ctx, -12, 14, [[0, c.armor], [.42, c.upper], [1, c.shade]]), 2.4,
    [[-15, -5], [-11, -11], [4, -13], [11, -7], [15, -8], [12, 5], [5, 12], [-9, 10], [-14, 3]]);
  polygon(ctx, c.armor, 0, [[-13, -5], [-10, -9], [3, -11], [9, -6], [-2, -8], [-10, -5], [-13, 1]]);
  line(ctx, c.shade, 1.6, p => { p.moveTo(8, -4); p.lineTo(4, 0); p.lineTo(6, 4); });
  ctx.restore();
}

function barkSpike(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, length: number, c: Palette) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  shape(ctx, wash(ctx, -length, 3, [[0, c.light], [.38, c.armor], [1, c.middle]]), 2.8, p => {
    p.moveTo(-6, 0); p.quadraticCurveTo(-9, -length * .54, -4, -length * .83);
    p.lineTo(1.5, -length); p.quadraticCurveTo(4, -length + 1, 3, -length + 6);
    p.quadraticCurveTo(1, -length * .46, 7, -4); p.quadraticCurveTo(6, 3, -6, 0);
  });
  line(ctx, c.light, 1.35, p => { p.moveTo(-4, -3); p.quadraticCurveTo(-6, -length * .57, -.4, -length + 4.5); });
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D, style: Style, x: number, y: number, lean: number) {
  const c = COLORS[style];
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  if (style === 'bark') {
    barkSpike(ctx, -37, -17, -.49, 32, c);
    barkSpike(ctx, -27, -22, -.61, 35, c);
    barkSpike(ctx, -11, -26, .18, 27, c);
    barkSpike(ctx, 1, -23, .39, 23, c);
  }
  if (style === 'iron') {
    shingle(ctx, -32, -20, .82, -.52, c);
    shingle(ctx, -14, -27, .86, -.22, c);
  }
  const fill = wash(ctx, -32, 43, [[0, c.light], [.26, c.upper], [.56, c.middle], [1, c.deep]]);
  shape(ctx, fill, 3.4, p => {
    p.moveTo(-39, 16);
    if (style === 'bone') {
      p.bezierCurveTo(-53, -9, -41, -34, -18, -31);
      p.bezierCurveTo(-7, -31, 3, -20, 15, -22);
      p.bezierCurveTo(34, -24, 42, -14, 37, 4);
    } else if (style === 'bark') {
      p.quadraticCurveTo(-46, -5, -37, -24); p.lineTo(-25, -31);
      p.quadraticCurveTo(-1, -35, 12, -20);
      p.quadraticCurveTo(39, -20, 34, 6);
    } else {
      p.bezierCurveTo(-47, -8, -37, -29, -21, -27);
      p.bezierCurveTo(-6, -32, 10, -28, 22, -22);
      p.quadraticCurveTo(46, -18, 37, 4);
    }
    p.quadraticCurveTo(37, 16, 25, 23); p.quadraticCurveTo(26, 35, 12, 43);
    p.quadraticCurveTo(-8, 49, -25, 39); p.quadraticCurveTo(-35, 32, -39, 16);
  });
  shape(ctx, c.deep, 0, p => {
    p.moveTo(27, -14); p.quadraticCurveTo(39, -2, 33, 10);
    p.quadraticCurveTo(32, 18, 21, 23); p.quadraticCurveTo(24, 35, 8, 40);
    p.quadraticCurveTo(-7, 46, -22, 38); p.quadraticCurveTo(-9, 35, 1, 29);
    p.quadraticCurveTo(3, 15, 15, 10); p.quadraticCurveTo(25, 1, 27, -14);
  });
  shape(ctx, c.light, 0, p => {
    p.moveTo(-35, -13); p.quadraticCurveTo(-31, -24, -19, -25);
    p.quadraticCurveTo(-9, -27, -2, -21); p.quadraticCurveTo(-17, -21, -21, -12);
    p.quadraticCurveTo(-27, -5, -35, -13);
  });
  if (style === 'iron') {
    shingle(ctx, -1, 12, 1, -.14, c);
    shingle(ctx, 2, 31, .74, -.14, c);
    for (const [dx,dy] of [[-13,10], [8,8], [-6,29]] as const) {
      oval(ctx, dx, dy, 2.8, 2.6, c.deep);
      oval(ctx, dx - .4, dy - .4, 1.45, 1.25, c.accent);
    }
  } else if (style === 'bark') {
    for (const [dx, dy, branch] of [[-23,-13,1], [-12,4,-1], [2,19,1], [21,4,-1]] as const) {
      line(ctx, c.deep, 2.3, p => {
        p.moveTo(dx, dy); p.lineTo(dx + 6 * branch, dy + 8);
        p.lineTo(dx + 3.1 * branch, dy + 20);
        p.moveTo(dx + 6 * branch, dy + 8); p.lineTo(dx + 12 * branch, dy + 7);
      });
      line(ctx, c.accent, 1.05, p => { p.moveTo(dx + 1, dy + 1); p.lineTo(dx + 6 * branch + 1, dy + 9); });
    }
    for (const [dx, dy, r] of [[-30, 8, 4.9], [13, 19, 4.1], [-3, -14, 5.4]] as const) {
      oval(ctx, dx, dy, r, r * .88, '#574137', -.45);
      oval(ctx, dx + .4, dy, r * .69, r * .51, c.accent, -.45);
      oval(ctx, dx - .9, dy - .7, r * .30, r * .17, c.glow, -.45);
    }
  } else {
    for (const [dx,dy] of [[-29,5], [-16,15], [4,24]] as const) {
      shape(ctx, '#b9a99d', 0, p => {
        p.moveTo(dx - 6, dy + 7); p.quadraticCurveTo(dx - 2, dy - 8, dx + 11, dy - 6);
        p.quadraticCurveTo(dx + 5, dy - 1, dx + 2, dy + 4); p.quadraticCurveTo(dx - 1, dy + 10, dx - 6, dy + 7);
      });
    }
    oval(ctx, -26, -16, 6.7, 5.6, '#986878', -.38);
    oval(ctx, -28, -18, 3.2, 2.4, '#cd8893', -.38);
    oval(ctx, -11, -21, 3.4, 3.2, '#be8991');
  }
  ctx.restore();
}

function face(ctx: CanvasRenderingContext2D, style: Style, x: number, y: number, tilt: number, strain: number) {
  const c = COLORS[style];
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  const fill = wash(ctx, -24, 19, [[0, c.armor], [.51, c.upper], [1, c.deep]]);
  if (style === 'iron') {
    polygon(ctx, fill, 3, [[-20,-8],[-16,-21],[-7,-23],[-5,-28],[4,-23],[15,-26],[22,-18],[25,-7],[21,1],[19,13],[7,17],[-10,13],[-16,6]]);
    polygon(ctx, c.armor, 0, [[-16,-15],[-13,-20],[-7,-20],[-4,-25],[4,-20],[14,-23],[19,-18],[11,-16],[4,-17],[-3,-12],[-10,-16]]);
    polygon(ctx, c.shade, 0, [[-14,-9],[-2,-11],[1,-5],[0,4],[-6,12],[-11,10],[-8,2]]);
    line(ctx, c.accent, 1.8, p => { p.moveTo(-12, -14); p.lineTo(-4, -16); p.moveTo(19,-13); p.lineTo(21,-8); });
    oval(ctx, -10, -6, 2.5, 2.2, c.deep);
    oval(ctx, -10.5, -6.4, 1.5, 1.25, c.accent);
  } else if (style === 'bark') {
    barkSpike(ctx, -8, -13, -.25, 16, c);
    polygon(ctx, fill, 3, [[-21,-8],[-15,-20],[-5,-21],[7,-15],[15,-16],[24,-9],[23,-1],[20,4],[19,10],[9,18],[-3,15],[-13,9],[-15,3]]);
    polygon(ctx, c.light, 0, [[-18,-8],[-13,-18],[-6,-19],[5,-14],[8,-11],[-2,-12],[-8,-7],[-11,-2]]);
    line(ctx, c.deep, 1.8, p => { p.moveTo(-14,-7); p.lineTo(-10,-4); p.lineTo(-8,2); p.lineTo(-3,6); });
    line(ctx, c.accent, 1.7, p => { p.moveTo(-2,11); p.lineTo(5,13); p.lineTo(11,11); });
  } else {
    shape(ctx, fill, 3, p => {
      p.moveTo(-21, -4); p.bezierCurveTo(-23, -16, -10, -24, .3, -20);
      p.quadraticCurveTo(13, -22, 19, -15); p.quadraticCurveTo(28, -12, 26, -4);
      p.quadraticCurveTo(28, .5, 21, 2); p.quadraticCurveTo(25, 13, 15, 16);
      p.bezierCurveTo(7, 21, -10, 18, -14, 9); p.quadraticCurveTo(-21, 5, -21, -4);
    });
    shape(ctx, c.light, 0, p => {
      p.moveTo(-18,-10); p.quadraticCurveTo(-8,-21,.6,-17);
      p.quadraticCurveTo(7,-20,13,-16); p.quadraticCurveTo(5,-13,0,-11);
      p.quadraticCurveTo(-10,-15,-18,-10);
    });
    line(ctx, c.shade, 1.55, p => { p.moveTo(-16,-2); p.quadraticCurveTo(-11, .8, -8, 6); p.moveTo(-11,0); p.lineTo(-6,-2); });
  }
  shape(ctx, c.deep, 1.6, p => {
    p.moveTo(4, -7); p.quadraticCurveTo(13, -11, 21, -7);
    p.quadraticCurveTo(19, -.5, 12, -2); p.quadraticCurveTo(5, -2, 4, -7);
  });
  shape(ctx, c.glow, 0, p => {
    p.moveTo(7,-7); p.quadraticCurveTo(13,-7.6, 20,-6.4);
    p.quadraticCurveTo(16,-3.4, 11,-4); p.quadraticCurveTo(9,-4.6, 7,-7);
  });
  oval(ctx, 16.1, -5.6, 1.3, 1.4, '#513945');
  shape(ctx, '#3b2a37', 1.4, p => {
    p.moveTo(7, 7); p.quadraticCurveTo(13, 4, 22, 5);
    p.quadraticCurveTo(20, 11 + 4 * strain, 11, 11 + 2 * strain);
    p.quadraticCurveTo(8, 10, 7, 7);
  });
  if (style !== 'iron') {
    polygon(ctx, style === 'bone' ? '#f5dfb7' : '#d8ba89', 0, [[17,5.7],[21,5.5],[19,9.6],[17,8]]);
  }
  ctx.restore();
}

function fist(ctx: CanvasRenderingContext2D, style: Style, at: Point, angle: number, far: boolean) {
  const c = COLORS[style];
  const size = far ? .69 : style === 'bone' ? 1.12 : 1;
  ctx.save(); ctx.translate(...at); ctx.rotate(angle); ctx.scale(size, size);
  const fill = far ? c.deep : wash(ctx, -18, 16, [[0,c.armor],[.42,c.upper],[1,c.deep]]);
  if (style === 'iron') {
    polygon(ctx, fill, 3, [[-18,-8],[-12,-16],[1,-18],[7,-15],[15,-13],[20,-5],[17,6],[13,13],[4,15],[-3,12],[-12,14],[-17,7]]);
    if (!far) {
      shingle(ctx, -3, -5, .69, .15, c);
      for (const x of [4, 10, 15]) oval(ctx, x, 6 - (x - 4) * .18, 2.4, 2, c.accent, -.34);
    }
  } else if (style === 'bark') {
    const width = far ? 17 : 19.5;
    shape(ctx, fill, 3, p => {
      p.moveTo(-17,-6); p.quadraticCurveTo(-19,-15,-10,-15);
      p.quadraticCurveTo(-9,-20,-1,-16); p.quadraticCurveTo(6,-20,12,-14);
      p.quadraticCurveTo(width,-16,width,-5); p.quadraticCurveTo(width + 1,6,13,11);
      p.quadraticCurveTo(9,16,3,12); p.quadraticCurveTo(-2,16,-8,11);
      p.quadraticCurveTo(-17,8,-17,-6);
    });
    if (!far) line(ctx, c.light, 1.8, p => {
      p.moveTo(-12,-9); p.quadraticCurveTo(-8,-16,-4,-13);
      p.moveTo(0,-12); p.quadraticCurveTo(3,-16,7,-12);
      p.moveTo(10,-9); p.quadraticCurveTo(14,-12,16,-8);
    });
  } else {
    shape(ctx, fill, 3, p => {
      p.moveTo(-15,-6); p.quadraticCurveTo(-17,-16,-7,-15);
      p.quadraticCurveTo(-.8,-20,5,-15); p.quadraticCurveTo(12,-18,15,-13);
      p.quadraticCurveTo(23,-13,20,-5); p.quadraticCurveTo(22,7,16,9);
      p.quadraticCurveTo(14,16,6,12); p.quadraticCurveTo(0,16,-7,11);
      p.quadraticCurveTo(-19,9,-15,-6);
    });
    if (!far) {
      for (const [i, x] of [-5,3,11,16].entries()) {
        oval(ctx, x, -5.8 + i * 1.25, 3.3, 2.5, c.light, .3);
        line(ctx, c.shade, 1.3, p => { p.moveTo(x, -.4 + i * .8); p.quadraticCurveTo(x + .7, 3 + i * .55, x - .5, 5.8 + i * .35); });
      }
    }
  }
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, style: Style, shoulder: Point, elbow: Point, hand: Point, far: boolean, turn: number) {
  const c = COLORS[style];
  limb(ctx, elbow, hand, far ? 10 : style === 'bone' ? 15 : 12.5, far ? 9 : 12.5, c, far);
  limb(ctx, shoulder, elbow, far ? 10 : style === 'bone' ? 17.7 : 14.6, far ? 9 : 11.5, c, far);
  if (style === 'iron' && !far) {
    shingle(ctx, shoulder[0] - 1, shoulder[1] + 1, 1.19, -.23 * (1 + turn), c);
    const guard = mix(elbow, hand, .53);
    shingle(ctx, guard[0], guard[1], .68, -turn * .46, c);
  } else if (style === 'bark' && !far) {
    barkSpike(ctx, shoulder[0] - 5, shoulder[1] + 1, -.61 + turn * .2, 19, c);
  } else if (style === 'bone' && !far) {
    oval(ctx, shoulder[0] - 5, shoulder[1] - 2, 5.4, 3.75, c.accent, -.42);
    oval(ctx, shoulder[0] - 6.6, shoulder[1] - 3.4, 2.6, 1.4, '#ebaaa2', -.42);
  }
  fist(ctx, style, hand, turn, far);
}

function drawHeavy(ctx: CanvasRenderingContext2D, style: Style, motion: Motion, phase: number) {
  const attacking = motion === 'attack';
  const beat = phase * TAU;
  const pickup = attacking ? ease(.025, .31, phase) * (1 - ease(.36, .55, phase)) : 0;
  const hit = attacking ? ease(.37, .56, phase) * (1 - ease(.60, .96, phase)) : 0;
  const brace = attacking ? ease(.025, .20, phase) * (1 - ease(.67, 1, phase)) : 0;
  const bob = attacking ? -3 * pickup + 4 * hit : Math.cos(2 * beat) * 1.8;
  const shift = attacking ? -3 * pickup + 9 * hit : Math.sin(beat) * 2;
  const lean = attacking ? -.083 * pickup + .10 * hit : Math.sin(beat) * .035;
  const stride = style === 'bark' ? 8.1 : style === 'bone' ? 11 : 9.5;
  const farFoot: Point = attacking ? [19 + 6 * brace, -5] : foot(phase + .5, 19, -5, stride);
  const nearFoot: Point = attacking ? [-15 - 6 * brace, -1] : foot(phase, -15, -1, stride);
  const c = COLORS[style];
  const height = style === 'bark' ? -64 : style === 'bone' ? -60 : -62;
  const shoulder: Point = [-31 + shift, height - 10 + bob];
  const restElbow: Point = [-38 - (nearFoot[0] + 15) * .39, -44 + bob * .62];
  const restHand: Point = [-33 - (nearFoot[0] + 15) * .85, style === 'bone' ? -23 : -28];
  const highElbow: Point = style === 'bark' ? [-42,-89] : [-48,-76];
  const highHand: Point = style === 'bark' ? [-23,-94] : [-43,-94];
  const lowElbow: Point = [15,-51];
  const lowHand: Point = [52,-25];
  const elbow = mix(mix(restElbow, highElbow, pickup), lowElbow, hit);
  const hand = mix(mix(restHand, highHand, pickup), lowHand, hit);
  const turn = -.12 + .21 * Math.sin(beat) * Number(!attacking) - .47 * pickup - .36 * hit;
  const farShoulder: Point = [29 + shift, height - 9 + bob];
  const farElbow: Point = [41 + shift - (farFoot[0] - 19) * .35, -51 + bob];
  const farHand: Point = [42 + shift - (farFoot[0] - 19) * .64, -36 - 4 * brace];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  leg(ctx, [13 + shift, -36 + bob], farFoot, c, true, style);
  arm(ctx, style, farShoulder, farElbow, farHand, true, -.22);
  body(ctx, style, shift, height + bob, lean);
  leg(ctx, [-12 + shift, -35 + bob], nearFoot, c, false, style);
  arm(ctx, style, shoulder, elbow, hand, false, turn);
  face(ctx, style, 25 + shift + 2.5 * hit, height - (style === 'bone' ? 4 : 12) + bob, lean + .12 * hit, Math.max(hit, pickup));
  if (hit > .55) {
    const flare = (hit - .55) / .45;
    line(ctx, `rgba(229, 200, 145, ${(flare * .7).toFixed(3)})`, 1.8, p => {
      p.moveTo(47 + flare * 8, -8); p.quadraticCurveTo(58 + flare * 10, -6, 69 + flare * 12, -11);
      p.moveTo(60 + flare * 9, -4); p.lineTo(66 + flare * 12, -5.5);
    });
  }
  ctx.restore();
}

export const ironcapOptions = [
  {
    name: 'Rusted Ironcap',
    description: 'A slate brute in battered iron plates with a heavy armored fist.',
    draw: (ctx: CanvasRenderingContext2D, motion: Motion, phase: number) => drawHeavy(ctx, 'iron', motion, phase),
  },
  {
    name: 'Rootbound Hulk',
    description: 'A bark hulk with broken branches, glowing sap, and a high overhead windup.',
    draw: (ctx: CanvasRenderingContext2D, motion: Motion, phase: number) => drawHeavy(ctx, 'bark', motion, phase),
  },
  {
    name: 'Pale Mauler',
    description: 'A hunched bone-colored brute with broad shoulders and a long knuckle swing.',
    draw: (ctx: CanvasRenderingContext2D, motion: Motion, phase: number) => drawHeavy(ctx, 'bone', motion, phase),
  },
] as const;
