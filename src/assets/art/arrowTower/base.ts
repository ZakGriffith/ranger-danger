type Tier = 0 | 1 | 2;
type Point = readonly [number, number];
type Paint = string | CanvasGradient;

export const ARROW_TOWER_DECK_Y = -84;

const INK = '#292633';
const TIERS = [
  {
    light: '#c9af89', stone: '#a18a70', dark: '#6b5760', seam: '#584750', edge: '#f1ce9b',
    floor: '#6a4a43', wood: '#ac7c58', flag: '#52744d', trim: '#dac280',
    post: '#b89b76', postShade: '#766052', postLight: '#ead0a3',
  },
  {
    light: '#b9b6a1', stone: '#898d86', dark: '#535664', seam: '#484554', edge: '#dfd5b7',
    floor: '#574743', wood: '#998065', flag: '#497589', trim: '#cee1c7',
    post: '#839ca0', postShade: '#4c6372', postLight: '#b7ced0',
  },
  {
    light: '#c8b79a', stone: '#a49986', dark: '#625861', seam: '#51444f', edge: '#e9d4ad',
    floor: '#5d4644', wood: '#ab8059', flag: '#9b514e', trim: '#f5ce7e',
    post: '#d5a557', postShade: '#986340', postLight: '#fae0a1',
  },
] as const;
type Palette = typeof TIERS[number];

function shape(ctx: CanvasRenderingContext2D, fill: Paint, outline: number, trace: (path: CanvasRenderingContext2D) => void) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = outline;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, color: string, width: number, trace: (path: CanvasRenderingContext2D) => void) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function shade(ctx: CanvasRenderingContext2D, top: number, bottom: number, light: string, dark: string) {
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, light);
  fill.addColorStop(1, dark);
  return fill;
}

function roundPolygon(ctx: CanvasRenderingContext2D, fill: Paint, outline: number, points: readonly Point[], softness = .10) {
  shape(ctx, fill, outline, p => {
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      const [beforeX, beforeY] = points[(i + points.length - 1) % points.length];
      const [afterX, afterY] = points[(i + 1) % points.length];
      const enterX = x + (beforeX - x) * softness;
      const enterY = y + (beforeY - y) * softness;
      if (i === 0) p.moveTo(enterX, enterY);
      else p.lineTo(enterX, enterY);
      p.quadraticCurveTo(x, y, x + (afterX - x) * softness, y + (afterY - y) * softness);
    }
  });
}

function wallPoint(side: -1 | 1, u: number, v: number): Point {
  return [side * u * (46 + 8 * v), -75 + v * 76 - u * (20 + 3 * v)];
}

function block(ctx: CanvasRenderingContext2D, palette: Palette, side: -1 | 1, row: number, index: number, u0: number, u1: number, v0: number, v1: number) {
  const top = (u: number) => wallPoint(side, u, v0);
  const bottom = (u: number) => wallPoint(side, u, v1);
  const variation = (row * 3 + index) % 4;
  const lighter = side < 0 && variation !== 2;
  const fill = shade(ctx, top(u1)[1], bottom(u0)[1], lighter ? palette.light : palette.stone, lighter ? palette.stone : palette.dark);
  roundPolygon(ctx, fill, 0, [top(u0), top(u1), bottom(u1), bottom(u0)], .17);

  if (variation === 1 || (row === 0 && index === 1)) {
    const [x, y] = wallPoint(side, u0 + (u1 - u0) * .20, v0 + .025);
    const [endX, endY] = wallPoint(side, u0 + (u1 - u0) * .64, v0 + .025);
    line(ctx, lighter ? palette.edge : palette.stone, 1.15, p => {
      p.moveTo(x, y);
      p.quadraticCurveTo((x + endX) * .5, (y + endY) * .5 - 1.15, endX, endY);
    });
  }
}

function dirtBorder(ctx: CanvasRenderingContext2D) {
  shape(ctx, '#8e6849', 0, p => {
    p.moveTo(-51, -28);
    p.quadraticCurveTo(-58, -29, -60, -25);
    p.bezierCurveTo(-65, -25, -66, -21, -61, -19);
    p.quadraticCurveTo(-57, -18, -55, -16);
    p.bezierCurveTo(-51, -17, -50, -11, -45, -11);
    p.quadraticCurveTo(-41, -12, -37, -8.5);
    p.bezierCurveTo(-33, -8.5, -31, -4, -26, -4.5);
    p.bezierCurveTo(-22, -4, -21, .5, -16, 1);
    p.quadraticCurveTo(-10, 0, -8, 4.8);
    p.bezierCurveTo(-5, 9.5, 1, 8, 3, 8.5);
    p.quadraticCurveTo(8, 10, 11, 5.6);
    p.bezierCurveTo(13, 3.1, 19, 5, 22, 1.2);
    p.quadraticCurveTo(25, -3, 29, -2.4);
    p.bezierCurveTo(35, -1.9, 34, -7.2, 41, -7.9);
    p.quadraticCurveTo(47, -7.5, 50, -13.8);
    p.bezierCurveTo(54, -13.6, 55, -18, 61, -17.5);
    p.bezierCurveTo(66, -18.5, 66, -23, 61, -23.6);
    p.quadraticCurveTo(59, -27.6, 52, -27);
    p.lineTo(0, -35);
  });
  const clumps = [
    [-62, -22, 1.8, 1, '#b78a60'], [-49, -13, 2.6, 1, '#aa7c53'],
    [-35, -7.4, 1.7, .9, '#694b3e'], [-20, -.4, 2.3, 1.1, '#b78a60'],
    [-7, 5.2, 1.2, .8, '#694b3e'], [5.8, 7.1, 2, .9, '#b78a60'],
    [18, 2, 2.5, .8, '#aa7c53'], [32, -4.1, 2.2, 1.1, '#b78a60'],
    [45, -9.5, 1.3, .8, '#694b3e'], [59.2, -19.4, 2.6, 1, '#b78a60'],
    [-47, -9, 1.05, .65, '#9c7552'], [8.6, 11, 1.25, .75, '#9c7552'],
    [47.1, -7.4, 1, .65, '#9c7552'],
  ] as const;
  for (const [x, y, width, height, color] of clumps) {
    shape(ctx, color, 0, p => p.ellipse(x, y, width, height, Math.sign(x) * -.32, 0, Math.PI * 2));
  }
}

function masonry(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  roundPolygon(ctx, palette.seam, 3.5, [[-46, -96], [0, -104], [46, -96], [54, -23], [0, 3], [-54, -22]], .10);
  const rows = [
    [.0, .18, [.29, .61]],
    [.21, .36, [.19, .52, .82]],
    [.39, .55, [.37, .71]],
    [.58, .73, [.22, .57, .87]],
    [.76, .86, [.33, .67]],
  ] as const;
  for (const side of [-1, 1] as const) {
    for (const [row, [v0, v1, seams]] of rows.entries()) {
      const cuts = [0, ...seams, 1];
      for (let i = 0; i < cuts.length - 1; i++) {
        const u0 = i === 0 ? .018 : cuts[i] + .016;
        const u1 = i === cuts.length - 2 ? .974 : cuts[i + 1] - .016;
        block(ctx, palette, side, row, i, u0, u1, v0, v1);
      }
    }
    const footTop = wallPoint(side, 1, .86);
    const footInner = wallPoint(side, 0, .86);
    roundPolygon(ctx, side < 0 ? palette.stone : palette.dark, 2.3, [
      [footTop[0] + side * 3, footTop[1]], footInner, [0, 3], [side * 57, -22],
    ]);
    line(ctx, side < 0 ? palette.edge : palette.stone, 1.25, p => {
      p.moveTo(side * 52, -27); p.quadraticCurveTo(side * 29, -16.8, side * 6, -9);
    });
  }
  line(ctx, palette.seam, 2, p => {
    p.moveTo(0, -69); p.quadraticCurveTo(-2, -41, 0, -13);
  });
  line(ctx, palette.light, 1.05, p => {
    p.moveTo(-2, -58); p.lineTo(-3, -45);
    p.moveTo(-2.5, -34); p.lineTo(-2, -23);
  });
  if (tier > 0) {
    for (const side of [-1, 1] as const) {
      const x = side * 46;
      roundPolygon(ctx, shade(ctx, -85, -23, palette.post, palette.postShade), 2.1,
        [[x - 3, -84], [x + 4, -87], [x + side * 7 + 4, -27], [x + side * 7 - 4, -23]]);
      line(ctx, palette.postLight, 1.15, p => {
        p.moveTo(x - 1.9, -77); p.lineTo(x + side * 6 - 2.4, -31);
      });
      for (const [y, boltX] of [[-72, x + side], [-32, x + side * 6]]) {
        shape(ctx, palette.postLight, .85, p => p.arc(boltX, y, 1.55, 0, Math.PI * 2));
      }
    }
  }
  if (tier === 2) {
    line(ctx, palette.postShade, 4.2, p => {
      p.moveTo(-54, -24); p.lineTo(0, -2); p.lineTo(54, -24);
    });
    line(ctx, palette.post, 2.25, p => {
      p.moveTo(-54, -25); p.lineTo(0, -3); p.lineTo(54, -25);
    });
  }
}

function doorway(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  ctx.save();
  ctx.transform(1, -.39, 0, 1, 27, -11);
  const arch = (p: CanvasRenderingContext2D) => {
    p.moveTo(-10, 0);
    p.lineTo(-9.8, -15);
    p.bezierCurveTo(-9.8, -29, 10, -29, 10, -15);
    p.lineTo(10.2, 0);
  };
  shape(ctx, shade(ctx, -27, 0, tier === 2 ? palette.postLight : palette.light, tier === 2 ? palette.postShade : palette.stone), 2.4, arch);
  shape(ctx, shade(ctx, -22, 0, '#bc8758', '#865137'), 1.8, p => {
    p.moveTo(-6.6, 0);
    p.lineTo(-6.4, -15);
    p.bezierCurveTo(-6.3, -23.7, 6.1, -24, 6.6, -15);
    p.lineTo(6.8, 0);
  });
  line(ctx, '#58382f', 1.15, p => {
    p.moveTo(-2.2, -20.35); p.lineTo(-2.2, -.9);
    p.moveTo(2.2, -20.35); p.lineTo(2.2, -.9);
  });
  line(ctx, '#dba36b', .9, p => {
    p.moveTo(-4.65, -16); p.quadraticCurveTo(-5, -11, -4.65, -3);
    p.moveTo(-.65, -18.8); p.lineTo(-.65, -4.5);
    p.moveTo(3.8, -17.5); p.lineTo(3.8, -12.2);
  });
  shape(ctx, '#e0b875', 1.1, p => p.ellipse(4.35, -8.2, 1.25, 1.35, 0, 0, Math.PI * 2));
  line(ctx, palette.postShade, 1.15, p => {
    p.moveTo(-9.5, -14); p.lineTo(-7, -14);
    p.moveTo(6.6, -14); p.lineTo(9.6, -14);
    p.moveTo(-4, -23); p.lineTo(-3.1, -20.5);
    p.moveTo(4.7, -22.9); p.lineTo(3.8, -20.1);
  });
  ctx.restore();
}

function banner(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  ctx.save();
  ctx.transform(1, .39, 0, 1, -25, -57);
  line(ctx, INK, 4.9, p => { p.moveTo(-12, 0); p.lineTo(12, 0); });
  line(ctx, palette.postLight, 1.8, p => { p.moveTo(-12, -.6); p.lineTo(12, -.6); });
  shape(ctx, shade(ctx, 1, 33, palette.flag, tier === 2 ? '#5d303b' : '#304b48'), 2.35, p => {
    p.moveTo(-9, 0);
    p.quadraticCurveTo(-.7, 1.2, 9, 0);
    p.lineTo(8, 27);
    p.quadraticCurveTo(4, 29, 0, 34);
    p.quadraticCurveTo(-3, 30, -9, 29);
    p.quadraticCurveTo(-7, 16, -9, 0);
  });
  line(ctx, palette.trim, 1.15, p => {
    p.moveTo(-6.4, 24); p.quadraticCurveTo(-3, 25, 0, 30);
    p.quadraticCurveTo(3.5, 26, 5.6, 25);
  });
  line(ctx, palette.trim, 1.65, p => {
    p.moveTo(0, 21); p.lineTo(0, 8);
    p.moveTo(-4.6, 12.5); p.lineTo(0, 7.9); p.lineTo(4.6, 12.5);
    p.moveTo(-3.1, 21); p.lineTo(0, 18); p.lineTo(3.1, 21);
  });
  ctx.restore();
}

function deck(ctx: CanvasRenderingContext2D, palette: Palette) {
  roundPolygon(ctx, palette.dark, 3.25, [[-55, -93], [0, -121], [55, -93], [54, -83], [0, -58], [-54, -83]]);
  roundPolygon(ctx, palette.light, 2.6, [[-55, -93], [0, -121], [55, -93], [0, -66]]);
  roundPolygon(ctx, palette.floor, 2.2, [[-38, -93], [0, -110], [37, -93], [0, -76]]);
  for (const [x, y, width] of [[-23, -97, 34], [-12, -102, 30], [-29, -91, 45], [-19, -85, 43]] as const) {
    line(ctx, palette.wood, 1.4, p => {
      p.moveTo(x, y); p.quadraticCurveTo(x + width * .6, y + width * .2, x + width, y + width * .43);
    });
  }
  line(ctx, palette.edge, 1.8, p => {
    p.moveTo(-53, -94); p.quadraticCurveTo(-28, -108, -6, -118);
    p.moveTo(-32, -96); p.lineTo(-17, -103);
  });
}

function merlon(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier, x: number, y: number, size: number, tall: number) {
  ctx.save();
  ctx.translate(x, y);
  const mid = size * .43;
  const top = -tall;
  const metal = tier > 0;
  const face = metal ? palette.post : palette.stone;
  const side = metal ? palette.postShade : palette.dark;
  const light = metal ? palette.postLight : palette.light;
  roundPolygon(ctx, face, 2.45, [[-size, -mid], [-size, top - mid], [0, top - mid * 2], [size, top - mid], [size, -mid], [0, mid]], .14);
  roundPolygon(ctx, side, 1.6, [[0, top + mid], [size, top - mid], [size, -mid], [0, mid]], .12);
  roundPolygon(ctx, light, 1.7, [[-size, top - mid], [0, top - mid * 2.25], [size, top - mid], [0, top + mid * .6]], .15);
  line(ctx, metal ? palette.postLight : palette.edge, 1.35, p => {
    p.moveTo(-size * .77, top - mid - .4); p.lineTo(-.6, top - mid * 1.88);
  });
  if (metal) {
    for (const [dx, dy] of [[-size * .53, top + 4], [size * .54, top + 5]] as const) {
      shape(ctx, palette.postLight, .9, p => p.arc(dx, dy, tier === 2 ? 1.85 : 1.45, 0, Math.PI * 2));
    }
  }
  ctx.restore();
}

function forwardRim(ctx: CanvasRenderingContext2D, palette: Palette, tier: Tier) {
  roundPolygon(ctx, shade(ctx, -94, -63, palette.stone, palette.dark), 2.6,
    [[-54, -93], [0, -69], [54, -93], [53, -83], [0, -59], [-53, -83]]);
  line(ctx, palette.edge, 1.5, p => {
    p.moveTo(-50, -90); p.quadraticCurveTo(-26, -80, -5, -71);
    p.moveTo(5, -71); p.lineTo(49, -90);
  });
  for (const [x, y] of [[-23, -77], [24, -77]] as const) {
    line(ctx, palette.seam, 1.7, p => { p.moveTo(x, y - 1); p.lineTo(x, y + 6); });
  }
  if (tier === 2) {
    line(ctx, palette.post, 2.1, p => {
      p.moveTo(-51, -85); p.lineTo(0, -62); p.lineTo(51, -85);
    });
  }
  merlon(ctx, palette, tier, -24, -77, 7, 8 + tier);
  merlon(ctx, palette, tier, 24, -77, 7, 8 + tier);
  merlon(ctx, palette, tier, -48, -88, 8.5, 10.5 + tier);
  merlon(ctx, palette, tier, 48, -88, 8.5, 10.5 + tier);
  merlon(ctx, palette, tier, 0, -66, 11, 12 + tier);
}

export function drawArrowTowerBase(ctx: CanvasRenderingContext2D, tier: Tier) {
  const palette = TIERS[tier];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  dirtBorder(ctx);
  masonry(ctx, palette, tier);
  doorway(ctx, palette, tier);
  banner(ctx, palette, tier);
  deck(ctx, palette);
  merlon(ctx, palette, tier, 0, -115, 9.5, 11 + tier);
  merlon(ctx, palette, tier, -24, -104, 7, 8 + tier);
  merlon(ctx, palette, tier, 24, -104, 7, 8 + tier);
  forwardRim(ctx, palette, tier);
  ctx.restore();
}
