import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Motion = 'move' | 'attack';
type BlobStyle = 'jelly' | 'colony' | 'tar';

const TAU = Math.PI * 2;

function ease(a: number, b: number, t: number) {
  const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
}

function blobPose(style: BlobStyle, motion: Motion, phase: number) {
  if (motion === 'move') {
    const roll = phase * TAU;
    const squash = style === 'tar' ? .085 : .10;
    const pulse = Math.sin(roll * 2 - .65) * squash;
    return { x: Math.sin(roll) * 3, lift: 0, yScale: 1 + pulse, xScale: 1 - pulse * .7, roll, impact: 0 };
  }
  const preload = ease(.01, .22, phase) * (1 - ease(.22, .37, phase));
  const lunge = ease(.24, .55, phase) * (1 - ease(.55, 1, phase));
  const hop = ease(.23, .38, phase) * (1 - ease(.39, .58, phase));
  const impact = ease(.50, .58, phase) * (1 - ease(.60, .84, phase));
  const lift = style === 'jelly' ? 27 : style === 'colony' ? 23 : 19;
  return {
    x: -6 * preload + 18 * lunge,
    lift: lift * hop,
    yScale: 1 - .26 * preload + .19 * hop - .29 * impact,
    xScale: 1 + .17 * preload - .15 * hop + .24 * impact,
    roll: 1.8 * lunge,
    impact,
  };
}

function glint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, paint: string, angle = -.28) {
  oval(ctx, x, y, r, r * .31, paint, angle);
}

const JELLY_BUBBLES = [
  [-27, -7, 5.1], [-17, -20, 6.6], [-5, -19, 3.1], [-7, -3, 4.3],
  [18, -16, 5.3], [24, 4, 7.6], [4, 17, 8.2], [-20, 16, 4.2], [12, 26, 3.6],
] as const;

function jellyBubbles(ctx: CanvasRenderingContext2D, turn: number) {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  for (const [localX, localY, r] of JELLY_BUBBLES) {
    const x = localX * cos - localY * sin;
    const y = -35 + (localX * sin + localY * cos) * .78;
    oval(ctx, x, y, r + .75, r * .88 + .75, '#367763b0', -.24);
    oval(ctx, x, y - .35, r - .2, r * .86, '#9bca848a', -.24);
    glint(ctx, x - r * .27, y - r * .47, r * .49, '#f0f4bbd9', -.43);
  }
}

function jadeShell(ctx: CanvasRenderingContext2D, turn: number) {
  const bulge = Math.sin(turn) * 3.6;
  const body = wash(ctx, -68, 1, [[0, '#cce69b'], [.24, '#8bbf76'], [.59, '#4f9a65'], [.83, '#327c62'], [1, '#285e53']]);
  shape(ctx, body, 3, p => {
    p.moveTo(-21, -1);
    p.bezierCurveTo(-39, -2, -48, -15, -47, -32);
    p.bezierCurveTo(-47, -52, -29 + bulge, -66, -5 + bulge, -67);
    p.bezierCurveTo(19 + bulge, -70, 43, -55, 45, -38);
    p.bezierCurveTo(51, -21, 38, -4, 21, -1);
    p.quadraticCurveTo(2, 1, -21, -1);
  });

  ctx.save();
  ctx.clip();
  shape(ctx, '#306e61ab', 0, p => {
    p.moveTo(-44, -15); p.quadraticCurveTo(-34, -18, -19, -12);
    p.bezierCurveTo(4, -4, 31, -12, 47, -26);
    p.lineTo(55, 4); p.lineTo(-49, 4);
  });
  jellyBubbles(ctx, turn);
  shape(ctx, '#d7ecaa66', 0, p => {
    p.moveTo(-39, -40);
    p.bezierCurveTo(-35, -53, -19, -61, -3, -61);
    p.quadraticCurveTo(1, -60, 4, -57); p.quadraticCurveTo(-17, -57, -27, -44);
    p.quadraticCurveTo(-33, -36, -39, -40);
  });
  line(ctx, '#edf3bd', 2.6, p => {
    p.moveTo(-25, -50); p.quadraticCurveTo(-18, -56, -10, -57);
    p.moveTo(-3, -58); p.quadraticCurveTo(1, -59, 4, -58);
  });
  ctx.restore();
}

function jadeRollPose(phase: number) {
  const flight = Math.max(0, Math.min(1, (phase - .22) / .55));
  const bounce = 4 * flight * (1 - flight);
  const compress = ease(.05, .16, phase) * (1 - ease(.16, .22, phase));
  const land = ease(.77, .84, phase) * (1 - ease(.84, 1, phase));
  const squash = .085 * compress + .12 * land - .045 * bounce;
  return { x: Math.sin(phase * TAU) * 2.4, lift: 6.4 * bounce, xScale: 1 + squash, yScale: 1 - squash, roll: phase * TAU };
}

function drawJadeJelly(ctx: CanvasRenderingContext2D, motion: Motion, phase: number) {
  const pose = motion === 'move' ? jadeRollPose(phase) : blobPose('jelly', motion, phase);
  const height = motion === 'attack' && pose.yScale > 1 ? 1 + (pose.yScale - 1) * .25 : pose.yScale;
  ctx.save();
  ctx.translate(pose.x, -pose.lift);
  ctx.scale(pose.xScale, height);
  ctx.transform(1, 0, -.071, 1, 0, 0);
  ctx.lineJoin = ctx.lineCap = 'round';
  jadeShell(ctx, pose.roll);
  ctx.restore();
}

function blister(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pulse: number, hot = false) {
  const height = r * (.9 + pulse * .12);
  const skin = wash(ctx, y - height, y + height, hot
    ? [[0, '#f1bf8d'], [.38, '#cf8b68'], [1, '#8e4c62']]
    : [[0, '#c989ad'], [.38, '#a7648e'], [1, '#603750']]);
  shape(ctx, skin, 2.2, p => {
    p.moveTo(x - r * .94, y + height * .42);
    p.bezierCurveTo(x - r * 1.17, y - height * .13, x - r * .7, y - height, x, y - height);
    p.bezierCurveTo(x + r * .64, y - height * 1.1, x + r * 1.26, y - height * .35, x + r * .91, y + height * .41);
    p.quadraticCurveTo(x + r * .38, y + height * .83, x - r * .94, y + height * .42);
  });
  glint(ctx, x - r * .27, y - height * .58, r * .42, hot ? '#ffe4a7' : '#e8add2');
  if (r > 10) line(ctx, hot ? '#a15f6a' : '#78506d', 1.15, p => {
    p.moveTo(x + r * .29, y - height * .25);
    p.quadraticCurveTo(x + r * .58, y - height * .05, x + r * .52, y + height * .28);
  });
}

function colony(ctx: CanvasRenderingContext2D, roll: number, impact: number) {
  for (const [i, x, y, r, hot] of [
    [0, -30, -31, 15, false], [1, -15, -43, 14, true], [2, 4, -49, 19, false],
    [3, 24, -38, 16, true], [4, 37, -28, 13, false],
  ] as const) blister(ctx, x, y + Math.sin(roll + i) * 2, r, Math.cos(roll + i), hot);
  shape(ctx, wash(ctx, -42, 2, [[0, '#bb829a'], [.36, '#945573'], [.7, '#703d5f'], [1, '#483149']]), 3.2, p => {
    p.moveTo(-49, -9); p.bezierCurveTo(-58, -19, -44, -41, -30, -34);
    p.bezierCurveTo(-24, -42, -3, -44, 8, -39);
    p.bezierCurveTo(25, -43, 32, -35, 40, -30);
    p.bezierCurveTo(54, -25, 60, -12, 47, -6);
    p.quadraticCurveTo(39, -1, 28, -3); p.quadraticCurveTo(18, 2, 7, -1.5);
    p.quadraticCurveTo(-8, 2, -23, -2); p.quadraticCurveTo(-40, 0, -49, -9);
  });
  shape(ctx, '#54364e', 0, p => {
    p.moveTo(-43, -12); p.quadraticCurveTo(-18, -7, -4, -11);
    p.quadraticCurveTo(13, -8, 34, -14); p.quadraticCurveTo(49, -11, 47, -8);
    p.quadraticCurveTo(38, -3, 28, -5); p.quadraticCurveTo(18, 0, 6, -4);
    p.quadraticCurveTo(-10, 0, -24, -5); p.quadraticCurveTo(-38, -2, -43, -12);
  });
  blister(ctx, -27, -13, 13, Math.cos(roll + .8));
  blister(ctx, -7, -20, 15, Math.sin(roll), true);
  blister(ctx, 11, -10, 10, Math.cos(roll));
  line(ctx, '#d7a085', 1.35, p => {
    p.moveTo(-35, -26); p.quadraticCurveTo(-26, -28, -24, -25);
    p.moveTo(5, -29); p.quadraticCurveTo(11, -33, 17, -28);
  });
  shape(ctx, '#422b41', 2, p => {
    p.moveTo(20, -25); p.quadraticCurveTo(33, -30, 42, -20);
    p.quadraticCurveTo(41, -13 + impact * 2, 29, -15); p.quadraticCurveTo(23, -16, 20, -25);
  });
  oval(ctx, 34, -20, 5, 2.75, '#f0b27d', .23);
  oval(ctx, 36.1, -20.4, 1.5, 2.9, '#512e42', .22);
  if (impact > .08) {
    for (const [x, y, r] of [[48, -15, 2.6], [-45, -24, 3.3], [45, -36, 2.8], [-22, -42, 2.2]] as const) {
      oval(ctx, x + Math.sign(x) * 7 * impact, y - 9 * impact, r * impact, r * .74 * impact, '#e9b47d', -.35);
    }
  }
}

function tar(ctx: CanvasRenderingContext2D, roll: number, impact: number) {
  shape(ctx, wash(ctx, -50, 1, [[0, '#566568'], [.37, '#454e55'], [.75, '#374048'], [1, '#292c38']]), 3.1, p => {
    p.moveTo(-56, -7); p.quadraticCurveTo(-60, -12, -49, -15);
    p.quadraticCurveTo(-44, -30, -29, -36); p.quadraticCurveTo(-20, -49, -4, -50);
    p.quadraticCurveTo(26, -53, 39, -34); p.quadraticCurveTo(52, -28, 49, -16);
    p.quadraticCurveTo(58, -13, 54, -8); p.quadraticCurveTo(47, -2, 32, -3);
    p.quadraticCurveTo(12, 1, -2, -2); p.quadraticCurveTo(-16, 1, -22, -2);
    p.quadraticCurveTo(-44, 2, -56, -7);
  });
  shape(ctx, '#5d6761', 0, p => {
    p.moveTo(-42, -25); p.quadraticCurveTo(-29, -46, -13, -41);
    p.quadraticCurveTo(-19, -27, -25, -17); p.quadraticCurveTo(-35, -18, -42, -25);
  });
  shape(ctx, '#a49155', 2.3, p => {
    p.moveTo(-38, -32); p.lineTo(-34, -46); p.lineTo(-26, -48);
    p.lineTo(-18, -62); p.lineTo(-10, -57); p.lineTo(1, -63);
    p.lineTo(7, -55); p.lineTo(22, -55); p.lineTo(32, -45);
    p.lineTo(30, -36); p.lineTo(17, -34); p.lineTo(7, -39);
    p.lineTo(-3, -32); p.lineTo(-17, -39); p.lineTo(-23, -30);
  });
  shape(ctx, '#d0b96e', 0, p => {
    p.moveTo(-34, -44); p.lineTo(-26, -46); p.lineTo(-17, -59); p.lineTo(-11, -55);
    p.lineTo(1, -61); p.lineTo(8, -52); p.lineTo(20, -53); p.lineTo(26, -47);
    p.lineTo(10, -48); p.lineTo(3, -53); p.lineTo(-9, -46); p.lineTo(-18, -48); p.lineTo(-24, -42);
  });
  shape(ctx, '#76683f', 0, p => {
    p.moveTo(-10, -54); p.lineTo(-14, -44); p.lineTo(-3, -35); p.lineTo(6, -42);
    p.lineTo(15, -39); p.lineTo(24, -41); p.lineTo(15, -49); p.lineTo(7, -47); p.lineTo(1, -56);
  });
  line(ctx, '#eccf79', 1.65, p => {
    p.moveTo(-31, -43); p.lineTo(-25, -45); p.lineTo(-17, -56);
    p.moveTo(-9, -46); p.lineTo(-1, -50); p.lineTo(1, -54);
    p.moveTo(12, -42); p.lineTo(16, -44); p.lineTo(25, -42);
  });
  const gleam = Math.sin(roll) * 1.8;
  shape(ctx, '#24232e', 1.75, p => {
    p.moveTo(25, -30); p.lineTo(45, -27); p.quadraticCurveTo(48, -22, 40, -18);
    p.quadraticCurveTo(30, -18, 25, -22);
  });
  shape(ctx, '#f3c762', 0, p => {
    p.moveTo(31, -26 + gleam); p.lineTo(44, -26); p.quadraticCurveTo(42, -20, 37, -21);
    p.quadraticCurveTo(32, -21, 31, -26 + gleam);
  });
  oval(ctx, 40, -24, 1.6, 2.6, '#6c4c47');
  shape(ctx, '#6a664b', 1.45, p => {
    p.moveTo(-40, -21); p.lineTo(-35, -27); p.lineTo(-27, -23); p.lineTo(-26, -17); p.lineTo(-34, -15);
  });
  line(ctx, '#c4a65e', 1.15, p => { p.moveTo(-37, -21); p.lineTo(-33, -24); p.lineTo(-30, -22); });
  line(ctx, '#746d54', 1.65, p => {
    p.moveTo(-14, -19); p.quadraticCurveTo(-8, -20, -4, -15);
    p.moveTo(11, -12); p.quadraticCurveTo(27, -8, 36, -12);
  });
  for (const [x,y,r] of [[3, -20, 2], [13, -15, 1.8], [-20, -13, 1.5], [-34, -8, 2.3]] as const) oval(ctx, x, y, r, r * .6, '#b29b61');
  if (impact > .1) for (const [x, y] of [[48, -10], [44, -19], [-49, -8]] as const) {
    glint(ctx, x + Math.sign(x) * impact * 6, y - impact * 4, 3.5 * impact, '#b19659', -.45);
  }
}

const PAINTERS = { colony, tar };

function drawBlob(ctx: CanvasRenderingContext2D, style: Exclude<BlobStyle, 'jelly'>, motion: Motion, phase: number) {
  const pose = blobPose(style, motion, phase);
  ctx.save();
  ctx.translate(pose.x, -pose.lift);
  ctx.scale(pose.xScale, pose.yScale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  PAINTERS[style](ctx, pose.roll, pose.impact);
  ctx.restore();
}

export const blobOptions = [
  {
    name: 'Jade Jelly',
    description: 'A bubbly jade gel with a small bounce in its roll and a bigger jump strike.',
    draw: drawJadeJelly,
  },
  {
    name: 'Boil Colony',
    description: 'A lopsided stack of purple and amber sacs that swell before the leap.',
    draw: (ctx: CanvasRenderingContext2D, motion: Motion, phase: number) => drawBlob(ctx, 'colony', motion, phase),
  },
  {
    name: 'Sulfur Crust',
    description: 'A dark tar mound carrying cracked yellow mineral plates.',
    draw: (ctx: CanvasRenderingContext2D, motion: Motion, phase: number) => drawBlob(ctx, 'tar', motion, phase),
  },
] as const;
