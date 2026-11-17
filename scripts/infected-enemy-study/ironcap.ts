import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { drawRustedIroncap } from '../../src/assets/art/ironcap';
import { drawHeavy, paintHeavyFace, paintHeavyTorso, polygon, type HeavyArt, type HeavyMotion, type HeavyPalette, type Point } from '../../src/assets/art/infectedEnemies/heavyMotion';

type Style = 'bark' | 'bone';

const COLORS = {
  bark: { light: '#bf9363', upper: '#956750', middle: '#765143', deep: '#50373c', armor: '#b48859', shade: '#654740', accent: '#c27846', glow: '#f5b75b', toe: '#d0a56f' },
  bone: { light: '#e0d1b1', upper: '#b7afa0', middle: '#928493', deep: '#6b566b', armor: '#cfc4ae', shade: '#91828f', accent: '#c3797c', glow: '#f79d77', toe: '#f1dec1' },
};

function barkSpike(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, length: number, c: HeavyPalette) {
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
  paintHeavyTorso(ctx, c, p => {
    if (style === 'bone') {
      p.bezierCurveTo(-53, -9, -41, -34, -18, -31);
      p.bezierCurveTo(-7, -31, 3, -20, 15, -22);
      p.bezierCurveTo(34, -24, 42, -14, 37, 4);
    } else if (style === 'bark') {
      p.quadraticCurveTo(-46, -5, -37, -24); p.lineTo(-25, -31);
      p.quadraticCurveTo(-1, -35, 12, -20);
      p.quadraticCurveTo(39, -20, 34, 6);
    }
  });
  if (style === 'bark') {
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
  if (style === 'bark') {
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
  paintHeavyFace(ctx, c, strain);
  polygon(ctx, style === 'bone' ? '#f5dfb7' : '#d8ba89', 0, [[17,5.7],[21,5.5],[19,9.6],[17,8]]);
  ctx.restore();
}

function fist(ctx: CanvasRenderingContext2D, style: Style, at: Point, angle: number, far: boolean) {
  const c = COLORS[style];
  const size = far ? .69 : style === 'bone' ? 1.12 : 1;
  ctx.save(); ctx.translate(...at); ctx.rotate(angle); ctx.scale(size, size);
  const fill = far ? c.deep : wash(ctx, -18, 16, [[0,c.armor],[.42,c.upper],[1,c.deep]]);
  if (style === 'bark') {
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

function studyArt(style: Style): HeavyArt {
  const c = COLORS[style];
  return {
    palette: c,
    height: style === 'bark' ? -64 : -60,
    headRise: style === 'bark' ? 12 : 4,
    stride: style === 'bark' ? 8.1 : 11,
    kneeBend: style === 'bark' ? 4 : 2.5,
    forearmWidth: style === 'bark' ? 12.5 : 15,
    upperArmWidth: style === 'bark' ? 14.6 : 17.7,
    handRestY: style === 'bark' ? -28 : -23,
    windupElbow: style === 'bark' ? [-42, -89] : [-48, -76],
    windupHand: style === 'bark' ? [-23, -94] : [-43, -94],
    torso: (ctx, x, y, lean) => body(ctx, style, x, y, lean),
    head: (ctx, x, y, tilt, strain) => face(ctx, style, x, y, tilt, strain),
    fist: (ctx, at, angle, far) => fist(ctx, style, at, angle, far),
    armDetail(ctx, shoulder, _elbow, _hand, turn) {
      if (style === 'bark') {
    barkSpike(ctx, shoulder[0] - 5, shoulder[1] + 1, -.61 + turn * .2, 19, c);
      } else {
    oval(ctx, shoulder[0] - 5, shoulder[1] - 2, 5.4, 3.75, c.accent, -.42);
    oval(ctx, shoulder[0] - 6.6, shoulder[1] - 3.4, 2.6, 1.4, '#ebaaa2', -.42);
      }
    },
  };
}

const rootbound = studyArt('bark');
const pale = studyArt('bone');

export const ironcapOptions = [
  {
    name: 'Rusted Ironcap',
    description: 'A slate brute in battered iron plates with a heavy armored fist.',
    draw: drawRustedIroncap,
  },
  {
    name: 'Rootbound Hulk',
    description: 'A bark hulk with broken branches, glowing sap, and a high overhead windup.',
    draw: (ctx: CanvasRenderingContext2D, motion: HeavyMotion, phase: number) => drawHeavy(ctx, rootbound, motion, phase),
  },
  {
    name: 'Pale Mauler',
    description: 'A hunched bone-colored brute with broad shoulders and a long knuckle swing.',
    draw: (ctx: CanvasRenderingContext2D, motion: HeavyMotion, phase: number) => drawHeavy(ctx, pale, motion, phase),
  },
] as const;
