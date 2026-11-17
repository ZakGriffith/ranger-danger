import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Clip = 'move' | 'attack';

const hide = {
  ridge: '#c39a6f', lit: '#9c774e', amber: '#835937', warm: '#674630', shade: '#493429',
  dark: '#352a24', throat: '#9a7558', iris: '#e7b657', venom: '#b6d16d',
};

function ease(start: number, end: number, phase: number) {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function pulse(start: number, peak: number, end: number, phase: number) {
  return ease(start, peak, phase) * (1 - ease(peak, end, phase));
}

function foot(
  ctx: CanvasRenderingContext2D, rootX: number, rootY: number, toeX: number, toeY: number, hind: boolean, far: boolean,
) {
  const color = far ? hide.dark : wash(ctx, rootY - 8, toeY, [[0, hide.lit], [.48, hide.amber], [1, hide.shade]]);
  const kneeX = rootX - (hind ? 14 : 6);
  const kneeY = (rootY + toeY) * .5;
  const thickness = hind ? 12 : 8;
  shape(ctx, color, far ? 2.1 : 2.75, p => {
    p.moveTo(rootX - thickness, rootY - 1);
    p.quadraticCurveTo(rootX - thickness + 2, rootY - 12, rootX + 1, rootY - 10);
    p.bezierCurveTo(rootX + thickness, rootY - 9, rootX + thickness - 1, kneeY - 2, kneeX + thickness - 3, kneeY + 3);
    p.quadraticCurveTo(toeX - 5, toeY - 8, toeX - 1, toeY - 4);
    p.quadraticCurveTo(toeX + 6, toeY - 5.5, toeX + 12, toeY - 2.5);
    p.quadraticCurveTo(toeX + 14, toeY, toeX + 8, toeY);
    p.quadraticCurveTo(toeX + 4, toeY - .45, toeX + 2, toeY - .1);
    p.quadraticCurveTo(toeX - 2, toeY + .6, toeX - 6, toeY - .2);
    p.quadraticCurveTo(toeX - 13, toeY, toeX - 12, toeY - 4.6);
    p.quadraticCurveTo(kneeX - thickness, kneeY + 7, rootX - thickness, rootY - 1);
  });
  if (!far) {
    line(ctx, hide.ridge, 1.55, p => {
      p.moveTo(rootX - 7, rootY - 3);
      p.quadraticCurveTo(rootX - 1, rootY - 10, rootX + 5, rootY - 4.6);
      p.moveTo(toeX - 3, toeY - 3);
      p.quadraticCurveTo(toeX + 3, toeY - 4.2, toeX + 8, toeY - 2.5);
    });
    line(ctx, hide.dark, 1.15, p => {
      p.moveTo(toeX + 1, toeY - 3.1); p.lineTo(toeX + 3, toeY - .6);
      p.moveTo(toeX + 7, toeY - 3); p.lineTo(toeX + 8.5, toeY - .6);
    });
  }
}

function body(ctx: CanvasRenderingContext2D) {
  shape(ctx, wash(ctx, -51, -4, [[0, hide.lit], [.38, hide.amber], [.7, hide.warm], [1, hide.dark]]), 3.4, p => {
    p.moveTo(-60, -22);
    p.bezierCurveTo(-58, -36, -47, -44, -31, -45);
    p.bezierCurveTo(-19, -49, -2, -44, 7, -41);
    p.quadraticCurveTo(17, -40, 26, -30);
    p.quadraticCurveTo(33, -18, 22, -11);
    p.bezierCurveTo(9, -3, -17, -8, -28, -7);
    p.bezierCurveTo(-47, -5, -64, -13, -60, -22);
  });
  shape(ctx, '#a47d53', 0, p => {
    p.moveTo(-55, -25);
    p.bezierCurveTo(-48, -42, -25, -45, -13, -42);
    p.quadraticCurveTo(-4, -42, -.5, -39);
    p.quadraticCurveTo(-12, -38, -21, -36);
    p.quadraticCurveTo(-39, -38, -55, -25);
  });
  shape(ctx, '#9c7656', 0, p => {
    p.moveTo(-36, -20);
    p.bezierCurveTo(-26, -17, -14, -23, 0, -24);
    p.quadraticCurveTo(16, -25, 23, -19);
    p.quadraticCurveTo(22, -14, 12, -12);
    p.quadraticCurveTo(-5, -8, -31, -11);
    p.quadraticCurveTo(-39, -13, -36, -20);
  });
  for (const [x, y, r] of [[-49, -29, 3.2], [-41, -35, 4], [-35, -29, 2.3], [-27, -40, 3.2], [-18, -34, 4.1], [-8, -38, 2.25], [0, -32, 3.2], [8, -27, 2]] as const) {
    oval(ctx, x, y, r, r * .55, '#544136', -.29);
    oval(ctx, x - r * .32, y - r * .32, r * .56, r * .36, '#ad845a', -.16);
  }
  line(ctx, '#c4a07b', 1.15, p => {
    p.moveTo(-47, -38); p.quadraticCurveTo(-44, -41, -39, -41.7);
    p.moveTo(-34, -43.1); p.quadraticCurveTo(-27, -45, -21, -43.9);
  });
}

function head(ctx: CanvasRenderingContext2D, charge: number, release: number) {
  const gape = release * 14;
  shape(ctx, '#574133', 2.4, p => {
    p.moveTo(19, -8); p.quadraticCurveTo(19, -18, 26, -17);
    p.quadraticCurveTo(32, -17, 33, -9); p.quadraticCurveTo(29, -4, 19, -8);
  });
  oval(ctx, 27, -12.4, 3.2, 1.55, hide.iris, .08);
  oval(ctx, 28, -12.4, 1.36, 1.25, ink);
  shape(ctx, wash(ctx, 2, 28, [[0, '#b18a64'], [.45, hide.throat], [1, '#5d4237']]), 2.9, p => {
    p.moveTo(-19, 2);
    p.quadraticCurveTo(7, -2, 36, 5 + gape * .61);
    p.bezierCurveTo(35, 13 + gape, 22, 18 + gape + charge * 6, 5, 18 + charge * 8);
    p.quadraticCurveTo(-13, 19 + charge * 6, -19, 2);
  });
  line(ctx, '#cba37f', 1.15, p => {
    p.moveTo(-5, 12 + charge * 5); p.quadraticCurveTo(11, 18 + charge * 6, 24, 12 + gape * .75);
    p.moveTo(3, 14.5 + charge * 6); p.quadraticCurveTo(9, 17.5 + charge * 6, 18, 13.6 + gape * .75);
  });
  shape(ctx, wash(ctx, -26, 9, [[0, hide.lit], [.41, hide.amber], [1, hide.shade]]), 3.1, p => {
    p.moveTo(-24, .5);
    p.quadraticCurveTo(-23, -11, -12, -14);
    p.quadraticCurveTo(-5, -23, 4, -20);
    p.quadraticCurveTo(10, -17, 15, -12);
    p.bezierCurveTo(25, -13, 34, -9, 42, -5);
    p.quadraticCurveTo(49, -.7, 41, 4);
    p.quadraticCurveTo(28, 8, 14, 6.5);
    p.quadraticCurveTo(-6, 11, -24, .5);
  });
  shape(ctx, hide.lit, 0, p => {
    p.moveTo(-16, -7);
    p.quadraticCurveTo(-5, -19, 3, -17);
    p.quadraticCurveTo(8, -15, 11, -11);
    p.quadraticCurveTo(20, -11.5, 30, -8);
    p.quadraticCurveTo(16, -9, 11, -6);
    p.quadraticCurveTo(3, -12, -3, -8);
    p.quadraticCurveTo(-9, -6, -16, -7);
  });
  oval(ctx, 35, -4.8, 3.05, 1.25, hide.dark, .22);
  if (release > .07) {
    shape(ctx, '#312534', 1.7, p => {
      p.moveTo(-12, 5); p.bezierCurveTo(6, 9, 29, 8, 41, 3);
      p.bezierCurveTo(43, 10 + gape * .55, 33, 11 + gape, 15, 11 + gape * .78);
      p.quadraticCurveTo(-5, 13 + gape * .3, -12, 5);
    });
    oval(ctx, 27, 10.3 + gape * .63, 8.4, 1.6 + gape * .12, '#ac6e70', -.08);
    if (release > .5) oval(ctx, 33, 8 + gape * .26, 3.7, 1.8, hide.venom, -.27);
  } else {
    line(ctx, '#372922', 1.8, p => {
      p.moveTo(-12, 3.2); p.bezierCurveTo(3, 6.4, 28, 7, 41, 2.5);
    });
  }
  oval(ctx, 6.6, -9.3, 7.2, 3.9, hide.dark, .06);
  oval(ctx, 8.6, -9.04, 4.36, 2.05, hide.iris, -.06);
  oval(ctx, 10.25, -8.92, 1.44, 1.8, '#2e2424');
  oval(ctx, 7.8, -9.82, 1.05, .62, '#fff0c0');
  line(ctx, hide.ridge, 1.8, p => {
    p.moveTo(-.6, -13.9); p.quadraticCurveTo(6.8, -15.3, 13.8, -10.9);
    p.moveTo(16, -1.4); p.quadraticCurveTo(27.2, .4, 32.7, -.5);
  });
}

function lob(ctx: CanvasRenderingContext2D, phase: number) {
  if (phase < .56 || phase > .99) return;
  const t = Math.min(1, (phase - .56) / .365);
  const x = 64 + 42 * t;
  const y = -27 * (1 - t) - 28 * 4 * t * (1 - t) - 4 * t * t;
  if (t < 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.3 - .4);
    const r = 6.2 + Math.sin(Math.PI * t) * 1.2;
    shape(ctx, wash(ctx, -r, r, [[0, '#cfdf86'], [.55, hide.venom], [1, '#6d8950']]), 2, p => {
      p.moveTo(r, -.8); p.quadraticCurveTo(r + 1, r * .65, .7, r);
      p.quadraticCurveTo(-r * .9, r, -r, 1); p.quadraticCurveTo(-r * .92, -r, -.8, -r);
      p.quadraticCurveTo(r * .9, -r, r, -.8);
    });
    oval(ctx, -1.8, -r * .52, r * .4, r * .22, '#f1ecb1', -.31);
    oval(ctx, -r - 4, 1.2, 1.35, .9, hide.venom);
    ctx.restore();
  } else {
    const spread = ease(.925, .99, phase);
    oval(ctx, 106, -1.5, 5 + spread * 6.2, 1.6 + spread, '#6d8652');
    oval(ctx, 106, -2.2, 3.6 + spread * 4.2, 1.25, hide.venom);
  }
}

function drawGulper(ctx: CanvasRenderingContext2D, clip: Clip, phase: number) {
  const air = Math.max(0, Math.min(1, (phase - .26) / .53));
  const jump = clip === 'move' ? Math.sin(Math.PI * air) : 0;
  const load = clip === 'move' ? pulse(.025, .20, .30, phase) + pulse(.78, .875, 1, phase) * .72 : 0;
  const charge = clip === 'attack' ? pulse(.04, .47, .67, phase) : 0;
  const release = clip === 'attack' ? pulse(.46, .57, .79, phase) : 0;
  const tilt = clip === 'move' ? -.09 * jump * Math.cos(Math.PI * air) : -.18 * charge + .11 * release;
  const dx = 5 * jump - 5 * load - 5 * charge + 4 * release;
  const dy = -15 * jump + 4 * load + 2 * charge - 4 * release;
  const scaleY = 1 + .065 * jump - .08 * load - .055 * charge;
  const shoulder = -22 * scaleY + dy;
  const backToe = -39 + dx - 7 * jump;
  const foreToe = 27 + dx + 10 * jump;
  const ground = -15 * jump;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  foot(ctx, -39 + dx, shoulder, backToe - 6, ground - 5, true, true);
  foot(ctx, 20 + dx, shoulder - 1, foreToe + 8, ground - 5, false, true);
  ctx.save(); ctx.translate(dx, dy); ctx.scale(1 + load * .04, scaleY); body(ctx); ctx.restore();
  foot(ctx, -38 + dx, shoulder, backToe, ground - 2 * jump, true, false);
  foot(ctx, 24 + dx, shoulder - 2, foreToe, ground - 3 * jump, false, false);
  ctx.save();
  ctx.translate(18 + dx + 2 * release, -27 * scaleY + dy);
  ctx.rotate(tilt);
  head(ctx, charge, release);
  ctx.restore();
  if (clip === 'attack') lob(ctx, phase);
  ctx.restore();
}

export const gulperOption = {
  name: 'Bog Gulper',
  description: 'A low tobacco-brown toad with a shovel jaw, hooded eyes, and a full-mouth venom lob.',
  draw: drawGulper,
} as const;
