import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

type Action = 'move' | 'attack';
const TAU = Math.PI * 2;

function ease(a: number, b: number, phase: number) {
  const t = Math.min(1, Math.max(0, (phase - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type Colors = {
  shell: [string, string, string];
  rim: string;
  band: string;
  eye: [string, string];
  membrane: [string, string, string];
  vein: string;
  wingMark: string;
};

const kingfisher: Colors = {
  shell: ['#79c5c0', '#347c83', '#24424f'], rim: '#b2e3cb', band: '#3eb5b0',
  eye: ['#fff1a4', '#db8a38'], membrane: ['#e9ffdc', '#b4e6b5', '#66aeb0'],
  vein: '#477c82', wingMark: '#e0aa51',
};
const kingfisherPalettes: readonly Colors[] = [
  kingfisher,
  { ...kingfisher, shell: ['#85bdce', '#3b7891', '#293f56'], rim: '#b8dfdb', band: '#53aab7',
    membrane: ['#e6fff0', '#b2dfd5', '#75aebc'] },
  { ...kingfisher, shell: ['#90cba5', '#4b8571', '#2d4748'], rim: '#c1e3c0', band: '#65ae90',
    membrane: ['#f6ffda', '#c9e4ae', '#81ab9a'] },
  { ...kingfisher, shell: ['#70abbf', '#326a81', '#293e53'], rim: '#aacfd8', band: '#4697aa',
    membrane: ['#e4f8e8', '#a8d8cc', '#6e9fb5'] },
];
export const RIVER_DRAGONFLY_VARIANTS = kingfisherPalettes.map((_, index) => index);

const copper: Colors = {
  shell: ['#c87765', '#8e4650', '#482d45'], rim: '#efb68b', band: '#df895e',
  eye: ['#d5f9a1', '#719b54'], membrane: ['#ffead0', '#e3ac83', '#b16c70'],
  vein: '#925f69', wingMark: '#9b435a',
};
const amber: Colors = {
  shell: ['#c59d64', '#8b623f', '#4a3942'], rim: '#e8c58c', band: '#c79251',
  eye: ['#ffd39a', '#b96340'], membrane: ['#ffebbd', '#d7d2a2', '#859980'],
  vein: '#8b785e', wingMark: '#c48747',
};
const dusk: Colors = {
  shell: ['#9eacc7', '#586982', '#343a55'], rim: '#cad8de', band: '#91b4be',
  eye: ['#f1aed5', '#a85783'], membrane: ['#e1f9f0', '#aecbd9', '#847bae'],
  vein: '#727299', wingMark: '#8e71a8',
};

function shellWash(ctx: CanvasRenderingContext2D, top: number, bottom: number, c: Colors) {
  return wash(ctx, top, bottom, [[0, c.shell[0]], [.48, c.shell[1]], [1, c.shell[2]]]);
}

function jointedLine(ctx: CanvasRenderingContext2D, color: string, width: number, points: readonly number[]) {
  const trace = (p: CanvasRenderingContext2D) => {
    p.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) p.lineTo(points[i], points[i + 1]);
  };
  line(ctx, ink, width + 1.6, trace);
  line(ctx, color, width, trace);
}

function compoundEye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, angle: number, c: Colors) {
  shape(ctx, wash(ctx, y - ry, y + ry, [[0, c.eye[0]], [.55, c.eye[1]], [1, c.shell[2]]]), 1.9,
    p => p.ellipse(x, y, rx, ry, angle, 0, TAU));
  oval(ctx, x + rx * .25, y + ry * .13, rx * .55, ry * .5, ink, angle);
  oval(ctx, x + rx * .25, y - ry * .34, rx * .23, ry * .19, '#fff6d8', angle);
  oval(ctx, x + rx * .55, y + ry * .06, rx * .12, ry * .1, c.eye[0], angle);
}

function wing(ctx: CanvasRenderingContext2D, c: Colors, type: 'broad' | 'swept' | 'needle' | 'notched', angle: number, length: number, height: number, far: boolean) {
  ctx.save();
  ctx.rotate(angle);
  ctx.scale(length, height);
  const wide = type === 'broad' ? 1 : type === 'notched' ? .77 : .64;
  ctx.globalAlpha *= far ? .76 : .95;
  const membrane = wash(ctx, -15 * wide, 14 * wide, [[0, c.membrane[0]], [.48, c.membrane[1]], [1, c.membrane[2]]]);
  shape(ctx, membrane, far ? 1.45 : 2.05, p => {
    p.moveTo(1, -1);
    p.bezierCurveTo(-18, -7 * wide, -39, -17 * wide, -58, -11 * wide);
    if (type === 'swept') {
      p.quadraticCurveTo(-67, -8, -70, -2); p.quadraticCurveTo(-65, -3, -61, 2);
    } else if (type === 'notched') {
      p.quadraticCurveTo(-69, -7, -69, -1); p.quadraticCurveTo(-65, 4, -59, 5);
      p.quadraticCurveTo(-57, 3, -53, 6);
    } else {
      p.bezierCurveTo(-71, -7 * wide, -70, 2 * wide, -59, 6 * wide);
    }
    p.quadraticCurveTo(-40, 14 * wide, -18, 5 * wide); p.quadraticCurveTo(-6, 1, 1, -1);
  });
  line(ctx, c.vein, .95, p => {
    p.moveTo(-4, -.7); p.quadraticCurveTo(-31, -2 * wide, -62, -3.5 * wide);
    p.moveTo(-24, -1.6 * wide); p.quadraticCurveTo(-35, -5.5 * wide, -41, -12 * wide);
    p.moveTo(-36, -2.4 * wide); p.quadraticCurveTo(-46, 4 * wide, -49, 8.1 * wide);
    p.moveTo(-45, -2.8 * wide); p.quadraticCurveTo(-49, -6 * wide, -53, -11 * wide);
  });
  line(ctx, c.membrane[0], 1.6, p => {
    p.moveTo(-18, -5 * wide); p.quadraticCurveTo(-40, -13 * wide, -54, -9.1 * wide);
  });
  if (type === 'broad' || type === 'notched') {
    shape(ctx, c.wingMark, .8, p => {
      p.moveTo(-56, -10 * wide); p.quadraticCurveTo(-63, -10 * wide, -65, -5 * wide);
      p.quadraticCurveTo(-61, -6 * wide, -57, -4.5 * wide); p.lineTo(-56, -10 * wide);
    });
  } else if (type === 'swept') {
    oval(ctx, -54, -6, 4, 2.1, c.wingMark, -.17);
    oval(ctx, -60, -3.8, 1.7, 1.15, c.membrane[0]);
  }
  ctx.restore();
}

function strokeWing(ctx: CanvasRenderingContext2D, c: Colors, type: Parameters<typeof wing>[2], x: number, y: number, angle: number, length: number, height: number, far: boolean) {
  ctx.save();
  ctx.translate(x, y);
  wing(ctx, c, type, angle, length, height, far);
  ctx.restore();
}

function dragonflyTail(ctx: CanvasRenderingContext2D, c: Colors, swept: boolean, lift: number) {
  ctx.save();
  ctx.translate(-8, 2);
  ctx.rotate(lift);
  shape(ctx, shellWash(ctx, -13, 11, c), 2.45, p => {
    p.moveTo(4, -8); p.bezierCurveTo(-11, -11, -27, swept ? 1 : -6, -43, swept ? 1 : -8);
    p.quadraticCurveTo(-49, swept ? 1 : -9, swept ? -54 : -50, swept ? -2 : -14);
    p.quadraticCurveTo(swept ? -58 : -53, -3, -50, swept ? 6 : 0);
    p.bezierCurveTo(-35, 11, -14, 7, 6, 7);
  });
  for (const [x, y, scale] of [[-42, 1, .51], [-34, 2, .68], [-25, 2, .83], [-15, 1, 1]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    line(ctx, c.band, 2.75, p => { p.moveTo(-3, -6); p.quadraticCurveTo(1, -1, -.4, 4); });
    line(ctx, ink, 1.25, p => { p.moveTo(-1, -7); p.quadraticCurveTo(2.6, -1, 1.1, 5); });
    ctx.restore();
  }
  line(ctx, c.rim, 1.4, p => {
    p.moveTo(-10, -5); p.quadraticCurveTo(-27, swept ? 2 : -1, -40, swept ? 2 : -3);
  });
  if (!swept) oval(ctx, -46, -2, 2.9, 1.6, c.band, -.1);
  ctx.restore();
}

function drawDragonfly(ctx: CanvasRenderingContext2D, action: Action, phase: number, c: Colors, swept: boolean) {
  const wind = action === 'attack' ? ease(.03, .28, phase) - ease(.31, .45, phase) : 0;
  const strike = action === 'attack' ? ease(.31, .48, phase) - ease(.56, .94, phase) : 0;
  const flap = Math.sin(TAU * (phase * 5 + .08));
  const drift = action === 'move' ? Math.sin(TAU * phase) * 5 + Math.sin(TAU * 2 * phase) * 3 : -wind * 11 + strike * 31;
  const y = -45 + 3 * Math.sin(TAU * 2 * phase) - wind * 4 + strike * 4;
  const liftScale = 1 - .055 * Math.max(0, flap);
  const type = swept ? 'swept' : 'broad';
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.translate(drift, y);
  if (strike > .22) {
    ctx.save();
    ctx.globalAlpha *= .49 * strike;
    line(ctx, c.membrane[0], 2, p => { p.moveTo(-47, 15); p.quadraticCurveTo(-36, 15, -24, 13); });
    line(ctx, c.membrane[1], 1.5, p => { p.moveTo(-66, 11); p.quadraticCurveTo(-57, 12, -49, 10); });
    ctx.restore();
  }
  ctx.rotate(-wind * .17 + strike * .095 + Math.sin(TAU * 2 * phase) * .045);
  strokeWing(ctx, c, type, 4, -5, .99 + .36 * flap, .94 * liftScale, .79, true);
  strokeWing(ctx, c, type, -8, -2, .64 + .27 * flap, .85 * liftScale, .7, true);
  dragonflyTail(ctx, c, swept, -.05 + .09 * Math.sin(TAU * 2 * phase - .4) + wind * .22);
  for (const [x, y, reach] of [[9, 7, 11], [1, 8, 9], [-6, 7, 7]]) {
    jointedLine(ctx, c.shell[1], 1.45, [x, y, x + reach - wind * 3, y + 7, x + reach + strike * 4, y + 4]);
  }
  shape(ctx, shellWash(ctx, -14, 15, c), 2.65, p => {
    p.moveTo(-17, -5); p.quadraticCurveTo(-14, -15, 0, -14);
    p.bezierCurveTo(11, -16, 19, -8, 19, -1); p.quadraticCurveTo(17, 12, 5, 13);
    p.bezierCurveTo(-6, 13, -14, 11, -17, 5); p.quadraticCurveTo(-19, 1, -17, -5);
  });
  strokeWing(ctx, c, type, -5, -4, .19 + .46 * flap, (swept ? .93 : .84) * liftScale, .88, false);
  strokeWing(ctx, c, type, 4, -7, .5 + .5 * flap, (swept ? 1 : .94) * liftScale, 1.02, false);
  shape(ctx, c.shell[1], 1.25, p => p.ellipse(2, -6, 5.4, 3.3, -.23, 0, TAU));
  line(ctx, c.rim, 1.6, p => { p.moveTo(1, -7.5); p.quadraticCurveTo(5, -9, 7, -7.4); });
  shape(ctx, shellWash(ctx, -16, 13, c), 2.5, p => {
    p.moveTo(12, -9); p.quadraticCurveTo(18, -17, 29, -13);
    p.quadraticCurveTo(39, -11, 38, -.5); p.bezierCurveTo(39, 8, 32, 12, 23, 12);
    p.quadraticCurveTo(14, 11, 11, 5); p.quadraticCurveTo(8, -1, 12, -9);
  });
  compoundEye(ctx, 32.5, -6.6, 7, 8, -.2, c);
  compoundEye(ctx, 22, -4.7, swept ? 8.5 : 9.6, swept ? 8.5 : 9.8, -.24, c);
  if (swept) {
    line(ctx, c.rim, 1.5, p => { p.moveTo(15, -4); p.quadraticCurveTo(17, -8, 21, -9); });
    oval(ctx, 17.2, 6.3, 2.4, 1, c.band, .12);
  } else {
    oval(ctx, 23.2, 7.3, 3.6, 1.25, c.band, -.1);
    oval(ctx, 17.5, 6.2, 1.6, 1.05, c.rim);
  }
  const jaw = strike * 4.7 + wind * 1.4;
  for (const [offset, open] of [[-1, -1], [5, 1]]) {
    shape(ctx, '#f1d8a3', 1.35, p => {
      p.moveTo(33, offset); p.bezierCurveTo(37, offset - 1, 41 + jaw, offset + open * jaw, 42 + jaw, offset + open * (jaw + 1));
      p.quadraticCurveTo(37 + jaw, offset + 2.8, 34, offset + 4);
    });
  }
  ctx.restore();
}

function mosquitoAbdomen(ctx: CanvasRenderingContext2D, c: Colors, needle: boolean, bend: number) {
  ctx.save();
  ctx.translate(-7, 4);
  ctx.rotate(bend);
  shape(ctx, shellWash(ctx, -14, 26, c), 2.45, p => {
    p.moveTo(4, -7);
    if (needle) {
      p.bezierCurveTo(-7, -9, -13, -5, -22, 0); p.bezierCurveTo(-35, 8, -46, 8, -48, 4);
      p.quadraticCurveTo(-46, 17, -34, 17); p.bezierCurveTo(-25, 18, -7, 8, 3, 6);
    } else {
      p.bezierCurveTo(-13, -9, -21, -2, -33, 0); p.bezierCurveTo(-42, 1, -44, 13, -36, 20);
      p.bezierCurveTo(-26, 29, -13, 16, -9, 9); p.quadraticCurveTo(-4, 5, 3, 6);
    }
  });
  const bands = needle ? [[-34, 10, .68], [-26, 7, .85], [-17, 4, 1], [-9, .6, .87]] :
    [[-35, 11, .67], [-28, 10, 1.15], [-20, 7, 1.04], [-12, 3, .75]];
  for (const [x, y, s] of bands) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    line(ctx, c.band, 3, p => { p.moveTo(-3, -6.5); p.quadraticCurveTo(-1, -1, 4, 6); });
    line(ctx, c.shell[2], 1.5, p => { p.moveTo(-.4, -6.8); p.quadraticCurveTo(.5, -1, 6, 5.5); });
    ctx.restore();
  }
  line(ctx, c.rim, 1.7, p => {
    p.moveTo(-11, -1); p.quadraticCurveTo(-20, needle ? 4 : 1, -29, needle ? 7 : 4);
  });
  if (needle) {
    oval(ctx, -36, 12.4, 1.65, 1.1, c.rim, -.21);
    oval(ctx, -41, 11, 1.35, .9, c.rim);
  } else oval(ctx, -35, 8, 2.7, 1.35, c.rim, -.65);
  ctx.restore();
}

function mosquitoLegs(ctx: CanvasRenderingContext2D, c: Colors, thin: boolean, reach: number, far: boolean) {
  const y = thin ? 4 : 0;
  const color = far ? c.shell[2] : c.shell[1];
  for (const [x, knee, foot, lift] of [[-8, -21, -42, 0], [-3, -10, -21, 5], [5, 15, 11, -3]]) {
    const depth = far ? -5 : 2;
    const footX = foot + reach * 6 + (far ? 6 : 0);
    const footY = 34 + y + depth + lift - 2 * reach;
    jointedLine(ctx, color, far ? 1.05 : 1.48, [x, 6, knee + reach * 7, 22 + y + depth, footX, footY, footX + 3.4, footY + 2.6]);
    if (!far) oval(ctx, knee + reach * 7, 22 + y + depth, 1.35, 1.45, c.rim, .4);
  }
}

function mosquitoNeedle(ctx: CanvasRenderingContext2D, c: Colors, thin: boolean, primed: number) {
  const tip = thin ? 53 : 49;
  shape(ctx, shellWash(ctx, -1, 12, c), 1.52, p => {
    p.moveTo(21, 1); p.quadraticCurveTo(33, 0, 38, 3.8); p.lineTo(tip + primed * 2, 8);
    p.quadraticCurveTo(37, 8.7, 30, 6.7); p.quadraticCurveTo(24, 7.7, 19, 5);
  });
  line(ctx, c.rim, 1.15, p => { p.moveTo(28, 3.2); p.quadraticCurveTo(34, 2.5, 42, 5.9); });
  line(ctx, ink, 1.65, p => {
    p.moveTo(27, 5); p.quadraticCurveTo(26, 13, 35, 13); p.lineTo(39, 10.5);
  });
  line(ctx, c.shell[0], 1, p => { p.moveTo(30, 8); p.quadraticCurveTo(31, 12, 35, 11.3); });
}

export const RIVER_MOSQUITO_RELEASE_PHASE = .46;

function dartShape(ctx: CanvasRenderingContext2D, frame: number, band: string) {
  ctx.lineJoin = ctx.lineCap = 'round';
  const light = frame === 0 ? '#d5eca0' : '#e6f3b2';
  const streak = frame === 0 ? '#d6e8a9c8' : '#e2e9b885';
  line(ctx, streak, 1.45, p => { p.moveTo(-14, .3); p.quadraticCurveTo(-11.5, .5, -9, 0); });
  shape(ctx, wash(ctx, -2.6, 2.6, [[0, light], [.55, '#a9c96c'], [1, '#658b47']]), 1.45, p => {
    p.moveTo(-7.7, -1.7); p.quadraticCurveTo(-2.2, -2.35, 1.55, -1.95);
    p.quadraticCurveTo(5.3, -1.15, 8.8, 0); p.quadraticCurveTo(4.7, 1.42, 1.5, 1.95);
    p.quadraticCurveTo(-2.25, 2.4, -7.2, 1.55); p.lineTo(-7.7, -1.7);
  });
  oval(ctx, -4.8, -.08, 1.45, 1.62, band, -.12);
  line(ctx, light, .85, p => { p.moveTo(-1.7, -.87); p.quadraticCurveTo(1.3, -1.25, 4.2, -.44); });
}

function studyDart(ctx: CanvasRenderingContext2D, c: Colors, phase: number, x: number, y: number, angle: number) {
  const progress = (phase - RIVER_MOSQUITO_RELEASE_PHASE) / (.91 - RIVER_MOSQUITO_RELEASE_PHASE);
  const px = x + (96 - x) * progress;
  const py = y + (px - x) * Math.tan(angle);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.globalAlpha *= 1 - ease(.73, 1, progress);
  ctx.scale(.88, .88);
  dartShape(ctx, 0, c.wingMark);
  ctx.restore();
}

function mosquitoPose(action: Action, phase: number) {
  const prime = action === 'attack' ? ease(.11, .40, phase) - ease(.42, .5, phase) : 0;
  const jab = action === 'attack' ? ease(.39, RIVER_MOSQUITO_RELEASE_PHASE, phase) - ease(.48, .63, phase) : 0;
  const recoil = action === 'attack' ? ease(RIVER_MOSQUITO_RELEASE_PHASE, .53, phase) - ease(.56, .78, phase) : 0;
  const hover = Math.sin(TAU * phase);
  const dx = 3.6 * hover - 7 * prime + 8 * jab - 6 * recoil;
  const dy = -48 + 3.4 * Math.sin(TAU * phase * 2) - 4 * prime + 1.8 * recoil;
  const pitch = -.045 - .13 * prime + .14 * jab + .06 * hover;
  return { prime, jab, hover, dx, dy, pitch };
}

function drawMosquito(ctx: CanvasRenderingContext2D, action: Action, phase: number, c: Colors, thin: boolean) {
  const { prime, jab, hover, dx, dy, pitch } = mosquitoPose(action, phase);
  const flap = Math.sin(TAU * phase * 6);
  const liftScale = 1 - (thin ? .16 : .045) * Math.max(0, flap);
  const reach = jab + .22 * Math.sin(TAU * (phase + .1)) - prime * .5;
  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate(pitch);
  ctx.lineJoin = ctx.lineCap = 'round';
  strokeWing(ctx, c, thin ? 'notched' : 'needle', 2, -7, 1.22 + .38 * flap, (thin ? .86 : .8) * liftScale, .74, true);
  mosquitoLegs(ctx, c, thin, reach, true);
  mosquitoAbdomen(ctx, c, thin, -.06 * hover + .13 * prime - .07 * jab);
  mosquitoLegs(ctx, c, thin, reach, false);
  shape(ctx, shellWash(ctx, -14, 14, c), 2.55, p => {
    p.moveTo(-14, -6); p.quadraticCurveTo(-7, -16, 3, -13); p.quadraticCurveTo(14, -10, 16, 1);
    p.quadraticCurveTo(12, 13, 2, 13); p.bezierCurveTo(-10, 13, -17, 6, -14, -6);
  });
  strokeWing(ctx, c, thin ? 'notched' : 'needle', -1, -7, .68 + .5 * flap, (thin ? .97 : .89) * liftScale, 1, false);
  line(ctx, c.rim, 1.75, p => { p.moveTo(-3, -7.3); p.quadraticCurveTo(1, -10, 6, -7); });
  mosquitoNeedle(ctx, c, thin, prime);
  shape(ctx, shellWash(ctx, -12, 12, c), 2.25, p => {
    p.moveTo(9, -7); p.quadraticCurveTo(13, -14, 23, -11); p.quadraticCurveTo(31, -10, 31, -1);
    p.quadraticCurveTo(30, 8, 22, 10); p.quadraticCurveTo(12, 10, 9, 5); p.quadraticCurveTo(6, -1, 9, -7);
  });
  compoundEye(ctx, 26, -5.5, 5.45, 6, .25, c);
  compoundEye(ctx, 17.5, -3.1, thin ? 6.3 : 6.9, thin ? 7.8 : 7.25, -.3, c);
  for (const [x, spread] of [[17, 0], [24, 6]]) {
    const sway = 2 * flap - prime * 3;
    line(ctx, ink, 1.85, p => {
      p.moveTo(x, -10); p.quadraticCurveTo(x + spread + 3, -16, x + spread + sway, -22 - prime * 3);
    });
    if (thin) {
      oval(ctx, x + spread + sway, -22 - prime * 3, 2, 1.7, c.band, -.3);
    } else {
      line(ctx, c.rim, 1.35, p => {
        p.moveTo(x + spread + sway, -22 - prime * 3); p.lineTo(x + spread + sway + 4, -25 - prime * 3);
        p.moveTo(x + spread + sway + 1, -20 - prime * 3); p.lineTo(x + spread + sway + 5, -21 - prime * 3);
      });
    }
  }
  oval(ctx, 20.5, 6.25, 2.65, 1, c.band, -.18);
  if (jab > .58) oval(ctx, thin ? 53 : 49, 8, 3.2 * jab, 1.75 * jab, c.eye[0], .16);
  ctx.restore();
}

export function drawRiverDragonfly(ctx: CanvasRenderingContext2D, action: Action, phase: number, variant: number) {
  drawDragonfly(ctx, action, phase, kingfisherPalettes[variant], false);
}

export function drawRiverMosquito(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  drawMosquito(ctx, action, phase, dusk, true);
}

export function drawRiverMosquitoDart(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.save();
  ctx.translate(16, 16);
  dartShape(ctx, frame, dusk.wingMark);
  ctx.restore();
}

export function mosquitoMuzzle(thin: boolean) {
  const { dx, dy, pitch, prime } = mosquitoPose('attack', RIVER_MOSQUITO_RELEASE_PHASE);
  const tip = (thin ? 53 : 49) + prime * 2;
  return { x: dx + tip * Math.cos(pitch) - 8 * Math.sin(pitch),
    y: dy + tip * Math.sin(pitch) + 8 * Math.cos(pitch), angle: pitch + .14 };
}

export function drawCopperDarter(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  drawDragonfly(ctx, action, phase, copper, true);
}

export function drawMosquitoStudy(ctx: CanvasRenderingContext2D, action: Action, phase: number, thin: boolean) {
  const c = thin ? dusk : amber;
  drawMosquito(ctx, action, phase, c, thin);
  if (action === 'attack' && phase >= RIVER_MOSQUITO_RELEASE_PHASE && phase < .91) {
    // Use the muzzle at the release pose so the dart does not follow the body on recoil.
    const { x, y, angle } = mosquitoMuzzle(thin);
    studyDart(ctx, c, phase, x, y, angle);
  }
}
