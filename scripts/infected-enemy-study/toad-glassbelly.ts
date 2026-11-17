import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Clip = 'move' | 'attack';
type Trace = (path: CanvasRenderingContext2D) => void;

const pearl = '#dce5e3';
const lilac = '#a9a9c6';
const shadow = '#67617e';
const deep = '#43384f';

function ease(start: number, end: number, phase: number) {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function bulb(start: number, crest: number, end: number, phase: number) {
  return ease(start, crest, phase) * (1 - ease(crest, end, phase));
}

function pose(clip: Clip, phase: number) {
  if (clip === 'attack') {
    const charge = ease(.02, .49, phase) * (1 - ease(.49, .62, phase));
    const spit = bulb(.44, .55, .73, phase);
    return { x: -3 * charge + 6 * spit, y: 2.3 * charge - 3.3 * spit, height: 1 + .04 * charge + .065 * spit,
      lift: 0, fold: 0, reach: 0, charge, spit, flow: bulb(.32, .49, .56, phase) };
  }
  const launch = Math.max(0, Math.min(1, (phase - .235) / .535));
  const air = Math.sin(Math.PI * launch);
  const coil = bulb(.03, .194, .26, phase);
  const settle = bulb(.76, .83, .986, phase);
  return { x: -5 * coil + 11.5 * air + 5.3 * settle, y: -24.5 * air + 5 * coil + 4.5 * settle,
    height: 1 + .12 * air - .09 * coil - .1 * settle,
    lift: 24.5 * air, fold: bulb(.295, .472, .704, phase), reach: bulb(.53, .669, .787, phase),
    charge: 0, spit: 0, flow: 0 };
}

function skin(ctx: CanvasRenderingContext2D, top: number, bottom: number) {
  return wash(ctx, top, bottom, [[0, pearl], [.36, lilac], [.73, '#8984a7'], [1, '#58506d']]);
}

function leg(ctx: CanvasRenderingContext2D, hipX: number, hipY: number, footX: number, footY: number, hind: boolean, far: boolean) {
  const kneeX = hipX - (hind ? 13 : -4) + (footX - hipX) * .19;
  const kneeY = hipY + (footY - hipY) * (hind ? .42 : .56);
  const width = hind ? 15 : 7;
  const web = hind ? 16 : 13;
  const legColor = far ? '#74738f' : skin(ctx, hipY - 7, footY);
  shape(ctx, legColor, far ? 1.9 : 2.5, p => {
    p.moveTo(hipX - width + 3, hipY);
    p.bezierCurveTo(hipX - width + 1, hipY - 9, hipX + width * .35, hipY - 11.5, hipX + width * .53, hipY - 3);
    p.quadraticCurveTo(hipX + width, hipY + 4, kneeX + width * .75, kneeY + 2.3);
    p.quadraticCurveTo(kneeX + width * .61, kneeY + 9.1, footX - 2, footY - 3.9);
    p.quadraticCurveTo(footX + 3, footY - 7, footX + web * .67, footY - 5.05);
    p.quadraticCurveTo(footX + web, footY - 5.5, footX + web, footY - 3.9);
    p.quadraticCurveTo(footX + web, footY - 3, footX + web * .77, footY - 2.65);
    p.quadraticCurveTo(footX + web * .64, footY - 1.7, footX + web * .82, footY - .6);
    p.quadraticCurveTo(footX + web * .6, footY + .15, footX + web * .51, footY - 1.1);
    p.quadraticCurveTo(footX + web * .24, footY - 1.75, footX + web * .24, footY + .05);
    p.quadraticCurveTo(footX - 1, footY + .23, footX - 3, footY - .05);
    p.quadraticCurveTo(footX - 11, footY + .15, footX - 12, footY - 4.9);
    p.quadraticCurveTo(footX - 14, footY - 9.5, kneeX - width * .38, kneeY + 6.4);
    p.quadraticCurveTo(kneeX - width, kneeY - 1, hipX - width + 3, hipY);
  });
  if (far) return;
  line(ctx, '#d9d8e5', 1.15, p => {
    p.moveTo(hipX - width * .64, hipY - 1.8); p.quadraticCurveTo(hipX - 11, hipY - 7, hipX - 1.4, hipY - 7.4);
    p.moveTo(footX - 3.7, footY - 3.2); p.quadraticCurveTo(footX + 1, footY - 5, footX + 5.1, footY - 4.2);
  });
  line(ctx, '#59536c', 1.05, p => {
    p.moveTo(footX + web * .66, footY - 1.3); p.quadraticCurveTo(footX + 6, footY - 3.8, footX + 1.3, footY - 3.7);
    p.moveTo(footX + web * .28, footY - .85); p.lineTo(footX + .55, footY - 2.3);
  });
}

const membrane: Trace = p => {
  p.moveTo(-35, -25);
  p.bezierCurveTo(-38, -41, -18, -48, -5, -45);
  p.bezierCurveTo(9, -42, 24, -39, 27, -26);
  p.bezierCurveTo(27, -16, 11, -10, -1, -10);
  p.bezierCurveTo(-12, -8, -33, -14, -35, -25);
};

function poisonPearl(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, bright: number) {
  oval(ctx, x, y, r + .85, r * .78 + .65, '#542963', -.5);
  oval(ctx, x, y - .23, r, r * .78, wash(ctx, y - r, y + r, [
    [0, bright > .55 ? '#fcb0ee' : '#c995d7'], [.35, '#b765c6'], [1, '#642977'],
  ]), -.5);
  oval(ctx, x - r * .32, y - r * .28, r * .36, r * .19, bright > .55 ? '#ffd5f5' : '#e6bee8', -.53);
}

function belly(ctx: CanvasRenderingContext2D, p: ReturnType<typeof pose>, phase: number) {
  shape(ctx, wash(ctx, -46, -8, [[0, '#adbad6'], [.42, '#8c80ad'], [.76, '#80649c'], [1, '#b0a6c3']]), 1.55, membrane);
  ctx.save();
  ctx.beginPath(); membrane(ctx); ctx.closePath(); ctx.clip();
  const charge = p.charge;
  const flow = p.flow;
  const centerX = -12 + 19 * flow;
  const centerY = -25 - 3 * charge - 4 * flow;
  const shimmer = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25 + charge * 5);
  shimmer.addColorStop(0, charge > .48 ? '#dc68c8' : '#ba82ba');
  shimmer.addColorStop(.35, charge > .48 ? '#a74baf' : '#9a61a7');
  shimmer.addColorStop(1, '#69447a00');
  oval(ctx, -5, -27, 38, 25, shimmer);
  shape(ctx, wash(ctx, -41, -16, [[0, '#c7a3d5'], [.39, '#994cb0'], [1, '#632c80']]), 0, g => {
    g.moveTo(centerX - 13 - 5 * charge, centerY + 4);
    g.bezierCurveTo(centerX - 14, centerY - 9, centerX - 4, centerY - 15 * charge, centerX + 2, centerY - 9 * charge);
    g.bezierCurveTo(centerX + 10, centerY - 8 * charge, centerX + 17, centerY - 7 * flow, centerX + 15, centerY + 2);
    g.bezierCurveTo(centerX + 10, centerY + 9, centerX - 3, centerY + 7.6, centerX - 13 - 5 * charge, centerY + 4);
  });
  line(ctx, '#e7b2de', 1.2, g => {
    g.moveTo(centerX - 19, centerY - 1); g.bezierCurveTo(centerX - 7, centerY - 7, centerX - 4, centerY + 7.5, centerX + 12, centerY - 1.7 - 6 * flow);
    g.moveTo(centerX - 9, centerY - 1); g.quadraticCurveTo(centerX - 17, centerY - 2, centerX - 19, centerY - 5.2);
  });
  for (const [index, [x, y, r]] of [[-19, -29, 4.8], [-12, -21.5, 4.2], [-4, -32, 5.7], [4, -24, 3.1], [-24, -21, 2.5], [9, -31, 2.3]].entries()) {
    const bloat = index < 3 ? 1.9 : 2.15;
    poisonPearl(ctx, x + flow * (14 + index), y + Math.sin(2 * Math.PI * (phase + index * .17)) * (1 + charge), r + charge * bloat, charge);
  }
  shape(ctx, wash(ctx, -43, -9, [[0, '#f2e9f8db'], [.42, '#eceaf745'], [.73, '#bab2d81a'], [1, '#e1cfe2aa']]), 0, membrane);
  ctx.restore();
  line(ctx, '#f6eef5', 2.1, g => {
    g.moveTo(-30, -29); g.bezierCurveTo(-28, -35, -19, -40, -9, -39.5);
    g.moveTo(-26.5, -17); g.quadraticCurveTo(-20, -13, -16, -13.2);
  });
  oval(ctx, -24.5, -37.2, 4.2, 1.14, '#fcf7f3', -.48);
}

function body(ctx: CanvasRenderingContext2D, p: ReturnType<typeof pose>, phase: number) {
  shape(ctx, skin(ctx, -61, -9), 3.05, g => {
    g.moveTo(-53, -25);
    g.bezierCurveTo(-54, -39, -43, -49, -31, -53);
    g.bezierCurveTo(-10, -64, 13, -56, 25, -47);
    g.bezierCurveTo(46, -32, 37, -14, 23, -10);
    g.quadraticCurveTo(9, -4, -18, -10);
    g.bezierCurveTo(-37, -8, -51, -14, -53, -25);
  });
  shape(ctx, '#70708f', 0, g => {
    g.moveTo(-49, -28); g.bezierCurveTo(-43, -19, -28, -20, -17, -15);
    g.quadraticCurveTo(8, -5, 34, -21); g.bezierCurveTo(30, -7, 7, -5, -16, -11.2);
    g.quadraticCurveTo(-44, -9, -49, -28);
  });
  shape(ctx, '#d6d9df', 0, g => {
    g.moveTo(-49, -31); g.bezierCurveTo(-46, -46, -26, -54, -13, -55);
    g.quadraticCurveTo(2, -56.9, 12, -50); g.quadraticCurveTo(-3, -54, -13, -50);
    g.quadraticCurveTo(-35, -47, -49, -31);
  });
  belly(ctx, p, phase);
  for (const [x, y, r] of [[-43, -31, 2.2], [-37, -44, 1.65], [-29, -48, 2.4], [-21, -51, 1.05], [-43, -22, 1.48], [-9, -51, 1.57], [8, -47, 1.2]]) {
    oval(ctx, x, y, r, r * .65, '#9387a7', -.53);
    oval(ctx, x - .3, y - .61, r * .62, r * .25, '#ebd8e3', -.42);
  }
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, far: boolean) {
  shape(ctx, skin(ctx, y - r - 5, y + r), far ? 2.2 : 2.6, g => {
    g.moveTo(x - r - 4, y + 7); g.bezierCurveTo(x - r - 4, y - r, x - r * .46, y - r - 2.6, x + 1, y - r - 2.8);
    g.bezierCurveTo(x + r + 4, y - r - 2, x + r + 6, y + 1, x + r + 2.6, y + 7.4);
    g.quadraticCurveTo(x + 3, y + 11, x - r - 4, y + 7);
  });
  oval(ctx, x + 1, y, r + .9, r * .84 + 1.3, '#514456', -.2);
  oval(ctx, x + 1, y, r, r * .84, wash(ctx, y - r, y + r, [[0, '#fff4e8'], [.53, '#e0ced7'], [1, '#a88ea4']]), -.2);
  oval(ctx, x + r * .39, y + .12, r * .176, r * .35, '#42334c', -.26);
  oval(ctx, x + r * .29, y - r * .35, r * .2, r * .15, '#fffcee', -.2);
  line(ctx, '#fcf3ef', 1.25, g => { g.moveTo(x - r * .67, y - r * .69); g.quadraticCurveTo(x - r * .22, y - r - 1, x + 2.2, y - r * .9); });
}

function head(ctx: CanvasRenderingContext2D, p: ReturnType<typeof pose>) {
  const open = p.spit * 8.5;
  eye(ctx, 39, -47.5, 7, true);
  shape(ctx, skin(ctx, -52, -12 + open), 2.75, g => {
    g.moveTo(0, -26); g.bezierCurveTo(0, -43, 12, -51, 29, -48);
    g.quadraticCurveTo(41, -49, 47, -40); g.bezierCurveTo(56, -36, 61, -29, 56, -24);
    g.quadraticCurveTo(57, -16 + open, 47, -13 + open * .8);
    g.bezierCurveTo(32, -8.7 + p.charge * 3, 8, -12, 0, -26);
  });
  shape(ctx, wash(ctx, -32, -10, [[0, '#cabbd4'], [.49, '#aea0c0'], [1, '#756687']]), 0, g => {
    g.moveTo(3, -27); g.bezierCurveTo(9, -33, 19, -27, 26, -23);
    g.quadraticCurveTo(35, -19 - p.charge * 4, 50, -24); g.quadraticCurveTo(53, -17 + open * .6, 48, -15 + open * .7);
    g.quadraticCurveTo(21, -10, 5, -22);
  });
  if (p.charge > .05) {
    const project = 21 + p.flow * 12;
    const glow = ctx.createRadialGradient(project, -21, 0, project, -21, 13 + p.charge * 5);
    glow.addColorStop(0, '#d762c5ce'); glow.addColorStop(.52, '#9d57a983'); glow.addColorStop(1, '#9769a000');
    oval(ctx, project, -22, 18 + p.charge * 2.6, 10.5, glow, -.2);
    poisonPearl(ctx, project + 3.3, -22, 2.8 + p.charge, p.charge);
  }
  shape(ctx, open > 1.7 ? '#562f5d' : '#5b4c66', 1.24, g => {
    g.moveTo(25, -25); g.bezierCurveTo(41, -23, 50, -22.2, 56.4, -27);
    g.quadraticCurveTo(53, -21 + open, 46, -21.7 + open);
    g.quadraticCurveTo(34, -21.5 + open * .75, 25, -25);
  });
  if (open > 2.7) line(ctx, '#e898df', 1.75, g => { g.moveTo(48, -22 + open * .6); g.quadraticCurveTo(40, -22 + open * .91, 35, -24 + open * .5); });
  eye(ctx, 21.8, -44, 11.5, false);
  line(ctx, '#ece6eb', 1.8, g => { g.moveTo(38, -34.3); g.quadraticCurveTo(45, -36.3, 51.3, -31.9); });
  oval(ctx, 48.8, -32.6, 1.5, .8, deep, .36);
  oval(ctx, 53.2, -30.6, 1.25, .72, shadow, .2);
  oval(ctx, 10, -29, 1.3, .7, shadow, -.4);
}

function lob(ctx: CanvasRenderingContext2D, phase: number) {
  if (phase < .545 || phase > .95) return;
  const t = (phase - .545) / .405;
  const x = 60 + 48 * t;
  const y = -26 - 27 * Math.sin(Math.PI * t) + 19 * t;
  if (t > .87) {
    const impact = (t - .87) / .13;
    ctx.save(); ctx.globalAlpha *= 1 - impact;
    oval(ctx, 108, -1.8, 5.5 + impact * 2.8, 1.55, '#aa56a5');
    for (const [dx, dy] of [[-4.2, -4], [2.8, -4.8], [5.5, -2]]) oval(ctx, 108 + dx, -2.1 + dy * impact, 1.6, 1.25, '#d078c4');
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((t - .46) * .9);
  ctx.globalAlpha *= Math.min(1, .48 + t * 13);
  oval(ctx, -11, 2, 2.6, 1.9, '#b576b5', -.3);
  poisonPearl(ctx, 0, 0, 7.4 - t * 1.5, 1);
  ctx.restore();
}

function drawGlassbelly(ctx: CanvasRenderingContext2D, clip: Clip, phase: number) {
  const p = pose(clip, phase);
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  leg(ctx, p.x - 28, p.y - 31, -34 + p.x - p.fold * 8, -5.7 - p.lift - p.fold * 3.5, true, true);
  leg(ctx, p.x + 23, p.y - 31, 30 + p.x + p.reach * 6, -5 - p.lift - p.fold * 4.5, false, true);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1 + (1 - p.height) * .37, p.height);
  body(ctx, p, phase);
  ctx.restore();
  leg(ctx, p.x - 35, p.y - 29, -41 - p.fold * 6 + p.x * .6, -1.03 - p.lift - p.fold * 2.5, true, false);
  leg(ctx, p.x + 24, p.y - 27, 36 + p.reach * 8 - p.fold * 8 + p.x * .54, -1.25 - p.lift - p.fold * 2, false, false);
  ctx.save();
  ctx.translate(p.x + p.spit * 2.4, p.y);
  ctx.scale(1, p.height);
  head(ctx, p);
  ctx.restore();
  if (clip === 'attack') lob(ctx, phase);
  ctx.restore();
}

export const glassbellyOption = {
  name: 'Glassbelly',
  description: 'A pale cave toad whose violet poison swells under translucent skin before it spits.',
  draw: drawGlassbelly,
} as const;
