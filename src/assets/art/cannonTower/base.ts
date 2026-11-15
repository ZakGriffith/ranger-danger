import { line, oval, shape, wash } from '../forestEnemies/paint';

type Tier = 0 | 1 | 2;
type Point = readonly [number, number];

export const CANNON_TOWER_DECK_Y = -83;
export const CANNON_TOWER_ART_SCALE = .40;
const BASE_WIDTH_SCALE = .89;

const PALETTES = [
  {
    lit: '#d5bb99', stone: '#ae9278', shade: '#7c6665', deep: '#574852', mortar: '#644f4e',
    edge: '#f0cf9f', trim: '#c8a580', trimShadow: '#856a5d', trimLight: '#ecd0a5',
    deck: '#8c644c', deckShade: '#54413c', cloth: '#a2784a', clothShade: '#63453c', emblem: '#f7d68e',
  },
  {
    lit: '#c2c7b9', stone: '#8c9694', shade: '#626a73', deep: '#474b58', mortar: '#50535c',
    edge: '#dfe7ce', trim: '#8ca5aa', trimShadow: '#4c6270', trimLight: '#c6d9d4',
    deck: '#82735f', deckShade: '#4e4947', cloth: '#487687', clothShade: '#314a57', emblem: '#d4ecdc',
  },
  {
    lit: '#d3c1a9', stone: '#a19689', shade: '#756975', deep: '#554a58', mortar: '#594d5a',
    edge: '#efdeba', trim: '#d7a956', trimShadow: '#906640', trimLight: '#ffe1a0',
    deck: '#a37556', deckShade: '#5b443f', cloth: '#a15d4c', clothShade: '#603443', emblem: '#ffe194',
  },
] as const;

type Palette = typeof PALETTES[number];

function drawDirt(ctx: CanvasRenderingContext2D) {
  shape(ctx, '#8e684a', 0, p => {
    p.moveTo(-58, -21);
    p.bezierCurveTo(-66, -17, -64, -11, -60, -8);
    p.quadraticCurveTo(-60, -4, -53, -2);
    p.bezierCurveTo(-51, 2, -46, 1, -41, 4);
    p.quadraticCurveTo(-37, 8, -26, 7);
    p.bezierCurveTo(-18, 11, -10, 8.7, -4, 11);
    p.quadraticCurveTo(6, 11.5, 11, 9);
    p.bezierCurveTo(17, 11, 27, 7.7, 33, 7);
    p.quadraticCurveTo(43, 8.2, 48, 2);
    p.bezierCurveTo(55, 1, 53, -3, 60, -4);
    p.quadraticCurveTo(65, -9, 63, -13);
    p.bezierCurveTo(66, -18, 58, -22, 52, -24);
    p.quadraticCurveTo(0, -34, -58, -21);
  });
  for (const [x, y, size, color] of [
    [-60, -9, 2.2, '#b88c5c'], [-49, 1, 1.45, '#a6784f'], [-40, 4, 1.6, '#bea06d'],
    [-21, 8, 2, '#b78e62'], [-5, 9, 1.3, '#6f5142'], [10, 11.5, 1.3, '#af835a'],
    [26, 7.8, 2.2, '#bf9567'], [43, 5.6, 1.55, '#b78e62'], [58, -5, 2.1, '#a77955'],
  ] as const) {
    oval(ctx, x, y, size, .72, color, x * -.011);
  }
}

function drawWall(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  shape(ctx, wash(ctx, -80, 7, [[0, palette.lit], [.45, palette.stone], [1, palette.deep]]), 3.6, p => {
    p.moveTo(-51, -72);
    p.bezierCurveTo(-53, -54, -48, -35, -55, -21);
    p.bezierCurveTo(-64, -5, -43, 6, 0, 6);
    p.bezierCurveTo(38, 6, 63, -7, 56, -21);
    p.bezierCurveTo(50, -39, 52, -60, 51, -72);
    p.quadraticCurveTo(0, -92, -51, -72);
  });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-50, -70);
  ctx.bezierCurveTo(-52, -54, -47, -35, -54, -20);
  ctx.bezierCurveTo(-64, -4, -39, 6, 0, 6);
  ctx.bezierCurveTo(39, 6, 62, -7, 55, -20);
  ctx.bezierCurveTo(49, -39, 51, -60, 50, -70);
  ctx.closePath();
  ctx.clip();
  shape(ctx, wash(ctx, -70, 7, [[0, palette.stone], [.55, palette.shade], [1, palette.deep]]), 0, p => {
    p.moveTo(19, -78);
    p.bezierCurveTo(34, -43, 18, -18, 13, 6);
    p.lineTo(63, 6);
    p.lineTo(62, -81);
  });

  const rows = [
    [-59, [-42, -18, 9, 33, 48]],
    [-45, [-51, -29, -2, 21, 43]],
    [-31, [-43, -16, 11, 36, 52]],
    [-17, [-51, -29, -6, 24, 47]],
  ] as const;
  const bend = (x: number) => 13 - x * x / 205;
  for (const [row, [top, joints]] of rows.entries()) {
    line(ctx, palette.mortar, 1.75, p => {
      p.moveTo(-57, top - 3);
      p.bezierCurveTo(-35, top + 15, 24, top + 16, 57, top - 1);
      for (const [index, x] of joints.entries()) {
        const y = top + bend(x);
        p.moveTo(x, y - 1);
        p.quadraticCurveTo(x + (index % 2 ? -2 : .9), y + 6, x + (row % 2 ? -.75 : .75), y + 12);
      }
    });
    for (const x of joints.slice(0, 3)) {
      const y = top + bend(x);
      line(ctx, palette.edge, 1.05, p => {
        p.moveTo(x + 3, y + 3.1);
        p.quadraticCurveTo(x + 7, y + 4.6, x + 13, y + 5);
      });
    }
  }
  ctx.restore();

  shape(ctx, wash(ctx, -24, 7, [[0, palette.stone], [.67, palette.shade], [1, palette.deep]]), 2.5, p => {
    p.moveTo(-55, -19);
    p.bezierCurveTo(-50, -5, -24, -2, 1, -3);
    p.bezierCurveTo(27, -3, 50, -10, 56, -20);
    p.bezierCurveTo(64, -7, 40, 6, 0, 6);
    p.bezierCurveTo(-34, 6, -62, -2, -55, -19);
  });
  line(ctx, tier === 2 ? palette.trim : palette.edge, tier === 2 ? 2 : 1.25, p => {
    p.moveTo(-53, -13);
    p.bezierCurveTo(-44, 2, 27, 4, 53, -13);
  });
}

function drawDoor(ctx: CanvasRenderingContext2D, palette: Palette) {
  ctx.save();
  ctx.transform(1, -.15, -.025, 1, 15, -1);
  shape(ctx, palette.trim, 2.15, p => {
    p.moveTo(-12, 0);
    p.lineTo(-12, -13);
    p.bezierCurveTo(-12, -29, 11, -30, 11.8, -14);
    p.lineTo(12.5, 0);
  });
  shape(ctx, wash(ctx, -21, 0, [[0, '#be8a59'], [1, '#825138']]), 1.7, p => {
    p.moveTo(-8.8, -.4);
    p.lineTo(-8.8, -12.2);
    p.bezierCurveTo(-8.5, -24.4, 8.4, -25, 8.6, -12.8);
    p.lineTo(9.3, -.5);
  });
  line(ctx, '#593b36', 1.2, p => {
    p.moveTo(-3, -20.5); p.lineTo(-3, -1.2);
    p.moveTo(3, -20.6); p.lineTo(3.5, -1.2);
  });
  line(ctx, '#d9a36e', 1, p => {
    p.moveTo(-6.2, -15.2); p.quadraticCurveTo(-6.8, -8.3, -6.2, -2.5);
    p.moveTo(-.9, -20); p.lineTo(-.9, -5);
  });
  shape(ctx, '#edc386', 1.0, p => p.ellipse(6.2, -8.1, 1.55, 1.55, 0, 0, Math.PI * 2));
  ctx.restore();
}

function drawBanner(ctx: CanvasRenderingContext2D, palette: Palette) {
  ctx.save();
  ctx.transform(1, .25, 0, 1, -28, -43);
  line(ctx, palette.trimShadow, 5, p => { p.moveTo(-13, 0); p.lineTo(13, 0); });
  line(ctx, palette.trimLight, 1.6, p => { p.moveTo(-13, -.75); p.lineTo(13, -.75); });
  shape(ctx, wash(ctx, -1, 29, [[0, palette.cloth], [1, palette.clothShade]]), 2.2, p => {
    p.moveTo(-10.5, 0);
    p.quadraticCurveTo(.5, 2, 10.5, 0);
    p.quadraticCurveTo(9, 13, 10, 23);
    p.quadraticCurveTo(3, 25, 0, 29);
    p.quadraticCurveTo(-3.5, 24, -10.5, 23);
  });
  oval(ctx, -2.9, 15.2, 3.3, 3, palette.emblem);
  oval(ctx, 3.2, 15.2, 3.05, 3, palette.emblem);
  oval(ctx, 0, 9.85, 3.1, 3, palette.emblem);
  ctx.restore();
}

function drawBands(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  if (tier === 0) return;
  for (const side of [-1, 1] as const) {
    shape(ctx, wash(ctx, -67, -15, [[0, palette.trim], [1, palette.trimShadow]]), 2.25, p => {
      p.moveTo(side * 43, -61);
      p.lineTo(side * 50, -66);
      p.bezierCurveTo(side * 49, -49, side * 51, -34, side * 54, -20);
      p.lineTo(side * 46, -16);
      p.quadraticCurveTo(side * 41, -38, side * 43, -61);
    });
    for (const [x, y] of [[47, -52], [49, -26]] as const) {
      shape(ctx, palette.trimLight, .95, p => p.ellipse(side * x, y, 1.6, 1.7, 0, 0, Math.PI * 2));
    }
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  const y = CANNON_TOWER_DECK_Y;
  shape(ctx, wash(ctx, y - 5, y + 32, [[0, palette.stone], [.57, palette.shade], [1, palette.deep]]), 3.4, p => {
    p.moveTo(-58, y - 1);
    p.bezierCurveTo(-58, y - 36, 58, y - 36, 58, y - 1);
    p.lineTo(58, y + 12);
    p.bezierCurveTo(57, y + 43, -57, y + 43, -58, y + 12);
  });
  shape(ctx, wash(ctx, y - 26, y + 25, [[0, palette.lit], [1, palette.trimShadow]]), 2.45, p => {
    p.ellipse(0, y, 58, 26, 0, 0, 2 * Math.PI);
  });
  shape(ctx, wash(ctx, y - 19, y + 17, [[0, palette.deck], [1, palette.deckShade]]), 2.25, p => {
    p.ellipse(0, y, 44, 17, 0, 0, 2 * Math.PI);
  });
  const deckGrain: readonly [Point, Point, Point][] = [
    [[-35, y - 9], [-19, y - 11], [6, y - 14]],
    [[-43, y - 2], [-20, y - 4], [37, y - 9]],
    [[-36, y + 7], [-6, y + 4], [43, y + 1]],
    [[-17, y + 14], [11, y + 12], [37, y + 8]],
  ];
  for (const [[x, startY], [cx, cy], [ex, ey]] of deckGrain) {
    line(ctx, palette.deckShade, 1.2, p => { p.moveTo(x, startY); p.quadraticCurveTo(cx, cy, ex, ey); });
  }
  line(ctx, tier === 0 ? palette.edge : palette.trimLight, tier > 0 ? 1.9 : 1.45, p => {
    p.moveTo(-53, y + 10);
    p.bezierCurveTo(-38, y + 32, 35, y + 32, 53, y + 10);
  });
  line(ctx, palette.mortar, 1.6, p => {
    for (const [x, offset] of [[-43, 17], [-23, 24], [2, 26], [28, 23], [46, 15]] as const) {
      p.moveTo(x, y + offset);
      p.lineTo(x - .85, y + offset + 6);
    }
  });
}

function drawRimBlock(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier, x: number, y: number, halfWidth: number, height: number) {
  ctx.save();
  ctx.translate(x, y);
  const end = halfWidth * .41;
  shape(ctx, tier > 0 ? palette.trimShadow : palette.shade, 2.3, p => {
    p.moveTo(-halfWidth, -end);
    p.lineTo(-halfWidth, -height - end);
    p.lineTo(0, -height - end * 2);
    p.lineTo(halfWidth, -height - end);
    p.lineTo(halfWidth, -end);
    p.quadraticCurveTo(halfWidth, 0, 0, end);
    p.quadraticCurveTo(-halfWidth, 0, -halfWidth, -end);
  });
  shape(ctx, tier > 0 ? palette.trim : palette.stone, 0, p => {
    p.moveTo(-halfWidth + 1, -height - end);
    p.lineTo(-1, -height + end);
    p.lineTo(-1, end - .85);
    p.quadraticCurveTo(-halfWidth, -1, -halfWidth + 1, -end);
  });
  shape(ctx, tier === 2 ? palette.trimLight : palette.lit, 1.6, p => {
    p.moveTo(-halfWidth, -height - end);
    p.lineTo(-.5, -height - end * 2);
    p.lineTo(halfWidth, -height - end);
    p.lineTo(0, -height + end);
  });
  if (tier > 0) {
    shape(ctx, palette.trimLight, .85, p => p.ellipse(-halfWidth * .51, -height * .38, 1.35, 1.45, 0, 0, 2 * Math.PI));
  }
  ctx.restore();
}

export function drawCannonTowerBase(ctx: CanvasRenderingContext2D, tier: Tier) {
  const palette = PALETTES[tier];
  const y = CANNON_TOWER_DECK_Y;
  ctx.save();
  ctx.scale(BASE_WIDTH_SCALE, 1);
  ctx.lineJoin = ctx.lineCap = 'round';
  drawDirt(ctx);
  drawWall(ctx, palette, tier);
  drawBands(ctx, palette, tier);
  drawDoor(ctx, palette);
  drawBanner(ctx, palette);
  drawPlatform(ctx, palette, tier);
  for (const [x, offset, width, height] of [
    [0, -24, 8, 6], [-32, -18, 8, 6], [32, -18, 8, 6],
    [-51, -3, 7.5, 7], [51, -3, 7.5, 7], [-37, 13, 8, 6], [37, 13, 8, 6],
  ] as const) {
    drawRimBlock(ctx, palette, tier, x, y + offset, width, height + tier * .75);
  }
  ctx.restore();
}
