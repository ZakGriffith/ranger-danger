import { oval, line, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { drawPaintedToad, type PaintedToadArt } from '../../src/assets/art/infectedEnemies/paintedToad';
import { drawBriarback } from '../../src/assets/art/infectedEnemies/briarback';

type Clip = 'move' | 'attack';
type PreviewProfile = 'spore' | 'lantern';
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
} as const;

const ease = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const backs: Record<PreviewProfile, Trace> = {
  spore: p => {
    p.moveTo(-51, -21); p.bezierCurveTo(-50, -43, -28, -52, -11, -50);
    p.bezierCurveTo(5, -51, 17, -42, 29, -38); p.quadraticCurveTo(44, -26, 34, -15);
    p.bezierCurveTo(25, -4, 2, -4, -15, -9);
    p.quadraticCurveTo(-44, -5, -51, -21);
  },
  lantern: p => {
    p.moveTo(-54, -17); p.bezierCurveTo(-57, -29, -43, -43, -28, -42);
    p.bezierCurveTo(-11, -44, 7, -38, 27, -41); p.quadraticCurveTo(47, -31, 35, -15);
    p.bezierCurveTo(27, -7, 13, -10, 1, -9); p.quadraticCurveTo(-30, -5, -45, -10);
    p.quadraticCurveTo(-52, -12, -54, -17);
  },
};

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

function glob(ctx: CanvasRenderingContext2D, toxin: string, phase: number, startX: number) {
  if (phase < .55 || phase > .985) return;
  const t = Math.min(1, (phase - .55) / .385);
  const x = startX + (106 - startX) * t;
  const y = -35 * (1 - t) - 39 * t * (1 - t) * 4 - 4 * t * t;
  if (t < 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.65 + t * 1.65);
    ctx.lineJoin = ctx.lineCap = 'round';
    const r = 6 + Math.sin(Math.PI * t) * 1.5;
    shape(ctx, wash(ctx, -r, r, [[0, '#dce990'], [.49, toxin], [1, '#667e50']]), 1.85, p => {
      p.moveTo(r, -.5); p.quadraticCurveTo(r + 1, r * .83, .5, r);
      p.quadraticCurveTo(-r, r * .86, -r, .5); p.quadraticCurveTo(-r - .7, -r, -r * .2, -r);
      p.quadraticCurveTo(r * .87, -r * 1.18, r, -.5);
    });
    oval(ctx, -2, -r * .49, r * .49, r * .22, '#f3f5ba', -.36);
    oval(ctx, -r - 5, 1.1, r * .21, r * .16, toxin, -.2);
    ctx.restore();
    return;
  }
  const splash = ease(.935, .985, phase);
  oval(ctx, 106, -1.5, 4 + splash * 7.5, 1.5 + splash * 1.2, '#778e56');
  oval(ctx, 105, -2, 2.5 + splash * 5.5, 1.1, toxin);
  oval(ctx, 111 + splash * 3.2, -3.5 - Math.sin(Math.PI * splash) * 4, 1.5, 2.1 * (1 - splash), toxin, .35);
}

const styles: Record<PreviewProfile, PaintedToadArt> = {
  spore: {
    profile: 'spore', skin: skins.spore, back: backs.spore,
    decorate(ctx, tilt) {
      mushroom(ctx, -43, -42, .69, -.28 + tilt);
      mushroom(ctx, -28, -49, 1.02, -.1 + tilt * .65);
      mushroom(ctx, -6, -46, .75, .25 + tilt * .45);
    },
  },
  lantern: {
    profile: 'lantern', skin: skins.lantern, back: backs.lantern,
    decorate(ctx, _tilt, charge) { lanternCrest(ctx, charge); },
  },
};

function drawToad(ctx: CanvasRenderingContext2D, profile: PreviewProfile, clip: Clip, phase: number) {
  drawPaintedToad(ctx, styles[profile], clip, phase, true);
  if (clip === 'attack') glob(ctx, skins[profile].toxin, phase, profile === 'lantern' ? 61 : 56);
}

function drawBriarbackStudy(ctx: CanvasRenderingContext2D, clip: Clip, phase: number) {
  drawBriarback(ctx, clip, phase, true);
  if (clip === 'attack') glob(ctx, '#aebf67', phase, 56);
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
    draw: (ctx: CanvasRenderingContext2D, clip: Clip, phase: number) => drawBriarbackStudy(ctx, clip, phase),
  },
] as const;
