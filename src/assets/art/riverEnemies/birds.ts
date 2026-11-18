import { ink, line, oval, shape, wash } from '../forestEnemies/paint';

type Action = 'move' | 'attack';
export const RIVER_BAT_VARIANTS = ['velvet', 'copper'] as const;
type BatVariant = typeof RIVER_BAT_VARIANTS[number];
type CrowVariant = 'slate' | 'reed';

const tau = Math.PI * 2;

function between(phase: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function flight(ctx: CanvasRenderingContext2D, action: Action, phase: number, bat: boolean) {
  const frame = phase * tau;
  const windup = action === 'attack' ? between(phase, 0, 0.22) - between(phase, 0.24, 0.4) : 0;
  const strike = action === 'attack' ? between(phase, 0.24, 0.46) - between(phase, 0.53, 0.86) : 0;
  const flap = Math.sin(frame * (bat ? 1 : 2)) * (1 - strike * 0.75) + strike * 0.48 - windup * 0.6;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.translate(3 * Math.sin(frame) - 9 * windup + strike * (bat ? 25 : 19), -48 - Math.cos(frame * 2) * 2 - windup * 9 + strike * (bat ? 7 : 18));
  ctx.rotate(Math.sin(frame) * 0.045 - windup * 0.14 + strike * (bat ? 0.1 : 0.55));
  return { windup, strike, flap };
}

const crowPaint = {
  slate: { light: '#647682', crest: '#899999', mid: '#404b5c', dark: '#292e3b', under: '#343344', vein: '#77838d', throat: '#4e5b66', eye: '#f1b854', beak: '#777f82' },
  reed: { light: '#908277', crest: '#c1ac8a', mid: '#584e55', dark: '#35313e', under: '#3d3442', vein: '#9a8c7e', throat: '#b49b7f', eye: '#f8d473', beak: '#80746b' },
};

function crowWing(ctx: CanvasRenderingContext2D, reed: boolean, far: boolean, flap: number, strike: number) {
  const pal = reed ? crowPaint.reed : crowPaint.slate;
  ctx.save();
  ctx.translate(far ? 4 : -7, far ? -5 : 2);
  ctx.rotate(far ? -0.26 + flap * 0.47 : 0.35 - flap * (flap < 0 ? 0.52 : 0.94) - strike * 0.5);
  if (far) ctx.scale(-0.67 + strike * 0.17, 0.74 - strike * 0.14);
  else ctx.scale(0.9 - strike * 0.09, 0.82 - strike * 0.23);
  const color = wash(ctx, -45, 17, [[0, far ? pal.mid : pal.light], [0.48, far ? pal.under : pal.mid], [1, pal.dark]]);
  if (reed) {
    shape(ctx, color, 2.5, p => {
      p.moveTo(10, 2); p.bezierCurveTo(2, -14, -18, -23, -35, -28);
      p.quadraticCurveTo(-46, -33, -54, -41); p.quadraticCurveTo(-60, -42, -55, -31);
      p.quadraticCurveTo(-52, -23, -47, -20); p.quadraticCurveTo(-57, -23, -60, -22);
      p.quadraticCurveTo(-58, -13, -43, -10); p.quadraticCurveTo(-52, -11, -54, -9);
      p.quadraticCurveTo(-51, -1, -36, 0); p.quadraticCurveTo(-41, 1, -41, 4);
      p.quadraticCurveTo(-34, 9, -26, 6); p.quadraticCurveTo(-22, 13, -12, 9); p.quadraticCurveTo(3, 14, 10, 2);
    });
    line(ctx, far ? pal.mid : pal.vein, far ? 1.2 : 2, p => {
      p.moveTo(2, -2); p.quadraticCurveTo(-17, -7, -30, -14); p.quadraticCurveTo(-41, -22, -48, -29);
      p.moveTo(-17, -6); p.quadraticCurveTo(-31, -6, -43, -14);
      p.moveTo(-21, 0); p.quadraticCurveTo(-28, 0, -33, -3);
    });
    if (!far) line(ctx, pal.crest, 1.8, p => {
      p.moveTo(-13, -12); p.quadraticCurveTo(-21, -15, -31, -18);
      p.moveTo(-21, -8); p.quadraticCurveTo(-30, -10, -37, -15);
    });
  } else {
    shape(ctx, color, 2.5, p => {
      p.moveTo(10, 4); p.quadraticCurveTo(5, -16, -17, -28); p.bezierCurveTo(-33, -36, -44, -40, -53, -49);
      p.quadraticCurveTo(-53, -39, -40, -27); p.quadraticCurveTo(-52, -32, -59, -39); p.quadraticCurveTo(-58, -28, -43, -18);
      p.quadraticCurveTo(-55, -22, -61, -28); p.quadraticCurveTo(-59, -16, -45, -11); p.quadraticCurveTo(-54, -11, -57, -15);
      p.quadraticCurveTo(-53, -3, -36, -3); p.quadraticCurveTo(-42, -1, -44, 0);
      p.quadraticCurveTo(-34, 8, -24, 5); p.quadraticCurveTo(-16, 18, 10, 4);
    });
    line(ctx, far ? pal.mid : pal.vein, far ? 1.25 : 2, p => {
      p.moveTo(1, 0); p.quadraticCurveTo(-21, -18, -41, -25);
      p.moveTo(-12, -5); p.quadraticCurveTo(-27, -10, -46, -15);
      p.moveTo(-21, 1); p.quadraticCurveTo(-29, -2, -36, -5);
    });
    if (!far) line(ctx, pal.crest, 1.55, p => {
      p.moveTo(-22, -25); p.quadraticCurveTo(-31, -29, -41, -33);
      p.moveTo(-16, -20); p.lineTo(-10, -17);
    });
  }
  ctx.restore();
}

export function drawRiverCrow(ctx: CanvasRenderingContext2D, action: Action, phase: number, variant: CrowVariant = 'slate') {
  const reed = variant === 'reed';
  const pal = crowPaint[variant];
  const { flap, strike } = flight(ctx, action, phase, false);
  crowWing(ctx, reed, true, flap, strike);
  shape(ctx, pal.under, 2.5, p => {
    p.moveTo(-12, 2); p.quadraticCurveTo(-27, 6, reed ? -51 : -46, reed ? 2 : 9 - flap * 5);
    p.quadraticCurveTo(-49, 9, -39, 13); p.lineTo(reed ? -47 : -44, reed ? 15 : 18);
    p.quadraticCurveTo(-31, 21, -12, 14);
  });
  line(ctx, pal.vein, 1.4, p => { p.moveTo(-38, 14); p.quadraticCurveTo(-22, 12, -18, 10); });
  for (const x of [-10, 1]) {
    const toe = x + 3 + strike * 7;
    line(ctx, ink, 4.4, p => {
      p.moveTo(x, 9); p.quadraticCurveTo(x - 3, 16, toe, 18 + strike * 2);
      p.quadraticCurveTo(toe + 5, 18 + strike * 2, toe + 5, 21 + strike * 2);
    });
    line(ctx, pal.beak, 1.75, p => { p.moveTo(x, 12); p.quadraticCurveTo(x - 1, 16, toe, 17 + strike * 2); p.lineTo(toe + 3, 18 + strike * 2); });
  }
  shape(ctx, wash(ctx, -12, 15, [[0, pal.light], [0.36, pal.mid], [1, pal.dark]]), 2.6, p => {
    p.moveTo(-25, 6); p.bezierCurveTo(-22, -10, -1, -14, 17, -9);
    p.bezierCurveTo(29, -6, 27, 8, 19, 12); p.quadraticCurveTo(2, 22, -25, 6);
  });
  crowWing(ctx, reed, false, flap, strike);

  ctx.save();
  ctx.translate(5 * strike, 0);
  if (reed) {
    shape(ctx, pal.throat, 2.6, p => {
      p.moveTo(4, -15); p.quadraticCurveTo(4, -24, 13, -28); p.quadraticCurveTo(7, -32, 3, -32);
      p.quadraticCurveTo(17, -37, 27, -28); p.quadraticCurveTo(36, -28, 38, -20);
      p.bezierCurveTo(43, -12, 38, -6, 28, -2); p.quadraticCurveTo(18, 8, 5, 10);
      p.lineTo(8, 3); p.lineTo(1, 5); p.quadraticCurveTo(4, -1, 5, -6); p.quadraticCurveTo(2, -10, 4, -15);
    });
    shape(ctx, wash(ctx, -32, -6, [[0, pal.crest], [0.3, pal.light], [1, pal.mid]]), 0, p => {
      p.moveTo(6, -14); p.quadraticCurveTo(10, -26, 16, -28); p.quadraticCurveTo(15, -31, 11, -32);
      p.quadraticCurveTo(20, -33, 28, -26); p.quadraticCurveTo(35, -27, 37, -18); p.quadraticCurveTo(32, -16, 27, -12);
      p.lineTo(17, -9); p.lineTo(11, -7); p.lineTo(13, -12); p.quadraticCurveTo(7, -8, 6, -14);
    });
    line(ctx, '#e0c397', 1.5, p => { p.moveTo(13, -1); p.quadraticCurveTo(16, -3, 19, -5); p.moveTo(16, 3); p.lineTo(22, -1); });
  } else {
    shape(ctx, wash(ctx, -33, 7, [[0, pal.light], [0.35, pal.mid], [0.68, pal.dark], [1, pal.throat]]), 2.6, p => {
      p.moveTo(4, -15); p.lineTo(0, -19); p.lineTo(8, -21); p.quadraticCurveTo(11, -34, 26, -32);
      p.bezierCurveTo(41, -32, 45, -20, 39, -11); p.quadraticCurveTo(35, -6, 23, -3);
      p.quadraticCurveTo(18, 5, 12, 7); p.lineTo(12, 2); p.lineTo(5, 6); p.lineTo(7, -1);
      p.lineTo(1, 0); p.quadraticCurveTo(4, -6, 4, -15);
    });
    line(ctx, pal.crest, 1.95, p => { p.moveTo(12, -23); p.quadraticCurveTo(17, -30, 26, -28); p.moveTo(9, -12); p.lineTo(15, -14); });
  }

  const y = reed ? -15 : -15.5;
  const lower = 2.2 + strike * 4;
  shape(ctx, pal.dark, 2.2, p => {
    p.moveTo(32, y + 1); p.quadraticCurveTo(43, y, 51, y + 4 + lower);
    p.quadraticCurveTo(41, y + 7 + lower, 32, y + 5);
  });
  shape(ctx, wash(ctx, y - 6, y + 7, [[0, pal.beak], [1, pal.dark]]), 2.4, p => {
    p.moveTo(32, y - 3); p.quadraticCurveTo(43, y - 7, reed ? 54 : 49, y - 1);
    p.quadraticCurveTo(reed ? 60 : 55, y + 1, reed ? 57 : 54, y + 5); p.quadraticCurveTo(47, y + 1, 41, y + 3); p.lineTo(32, y + 4);
  });
  line(ctx, '#bcb19b', 1.4, p => { p.moveTo(37, y - 2); p.quadraticCurveTo(43, y - 4, reed ? 51 : 48, y - 1); });
  oval(ctx, 43, y, 1.8, 0.8, ink, -0.17);
  shape(ctx, pal.eye, 1.65, p => {
    p.moveTo(21, -21.5); p.quadraticCurveTo(25, -25, 31, -23); p.quadraticCurveTo(32, -20, 27, -18.5); p.quadraticCurveTo(24, -18, 21, -21.5);
  });
  oval(ctx, 27.8, -21.65, 1.35, 1.6, ink, 0.15);
  oval(ctx, 28.2, -22.7, 0.65, 0.65, '#fff1bd');
  line(ctx, ink, 1.8, p => { p.moveTo(19, -24.5); p.quadraticCurveTo(26, -25, 31, -23); });
  ctx.restore();
  ctx.restore();
}

const batPaint = {
  velvet: { fur: '#685064', ridge: '#97748a', deep: '#3c3046', dark: '#302635', wing: '#66455f', sheen: '#a2677f', vein: '#aa7486', ear: '#a46a7e', nose: '#bf9099', gleam: '#e3aa69' },
  copper: { fur: '#805844', ridge: '#af8062', deep: '#4c3940', dark: '#362c37', wing: '#734a47', sheen: '#bc7959', vein: '#bd896b', ear: '#ad705d', nose: '#bd836a', gleam: '#efcc74' },
};

function batWing(ctx: CanvasRenderingContext2D, copper: boolean, far: boolean, flap: number) {
  const pal = copper ? batPaint.copper : batPaint.velvet;
  ctx.save();
  ctx.translate(far ? 8 : -7, far ? -5 : -2);
  ctx.rotate(far ? -0.18 + flap * 0.51 : 0.29 - flap * 0.66);
  if (far) ctx.scale(-0.69, 0.8);
  const color = wash(ctx, -45, 22, [[0, far ? pal.wing : pal.sheen], [0.48, far ? pal.deep : pal.wing], [1, pal.dark]]);
  if (copper) {
    shape(ctx, color, 2.8, p => {
      p.moveTo(9, 7); p.bezierCurveTo(1, -6, -14, -28, -29, -32); p.lineTo(-35, -43); p.lineTo(-39, -33);
      p.bezierCurveTo(-49, -29, -62, -21, -70, -5); p.bezierCurveTo(-56, -10, -52, -1, -51, 10);
      p.bezierCurveTo(-39, 2, -34, 8, -31, 17); p.bezierCurveTo(-21, 13, -15, 12, -13, 20); p.quadraticCurveTo(-3, 16, 9, 7);
    });
    line(ctx, far ? pal.wing : pal.vein, 1.6, p => {
      p.moveTo(-67, -6); p.quadraticCurveTo(-48, -24, -34, -30); p.quadraticCurveTo(-23, -17, -8, -2);
      p.moveTo(-51, 7); p.quadraticCurveTo(-44, -11, -34, -30);
      p.moveTo(-31, 14); p.quadraticCurveTo(-29, -4, -34, -30);
      p.moveTo(-13, 17); p.quadraticCurveTo(-14, 5, -19, -10);
    });
  } else {
    shape(ctx, color, 2.8, p => {
      p.moveTo(9, 6); p.quadraticCurveTo(-5, -15, -21, -33); p.lineTo(-24, -44); p.lineTo(-29, -36);
      p.bezierCurveTo(-40, -39, -49, -35, -61, -30); p.quadraticCurveTo(-51, -22, -56, -8);
      p.quadraticCurveTo(-43, -14, -42, 4); p.quadraticCurveTo(-28, -4, -28, 15);
      p.quadraticCurveTo(-16, 6, -12, 17); p.quadraticCurveTo(1, 15, 9, 6);
    });
    line(ctx, far ? pal.wing : pal.vein, 1.6, p => {
      p.moveTo(-57, -30); p.quadraticCurveTo(-41, -31, -26, -33); p.quadraticCurveTo(-13, -22, -2, -6);
      p.moveTo(-54, -10); p.quadraticCurveTo(-44, -25, -26, -33);
      p.moveTo(-41, 1); p.quadraticCurveTo(-35, -15, -26, -33);
      p.moveTo(-27, 12); p.quadraticCurveTo(-25, -10, -22, -27);
      p.moveTo(-12, 14); p.quadraticCurveTo(-14, 3, -14, -12);
    });
  }
  if (!far) line(ctx, pal.ridge, 1, p => {
    const x = copper ? -34 : -26;
    p.moveTo(x + 2, -33); p.quadraticCurveTo(x + 11, -28, x + 17, -20);
  });
  ctx.restore();
}

export function drawRiverBat(ctx: CanvasRenderingContext2D, action: Action, phase: number, variant: BatVariant = 'velvet') {
  const copper = variant === 'copper';
  const pal = batPaint[variant];
  const { flap, strike, windup } = flight(ctx, action, phase, true);
  batWing(ctx, copper, true, flap);
  shape(ctx, pal.wing, 2.2, p => {
    p.moveTo(-26, 7); p.lineTo(-33, 17); p.quadraticCurveTo(-19, 14, -18, 21);
    p.quadraticCurveTo(-9, 18, -7, 11);
  });
  for (const x of [-11, 2]) {
    const toe = x + strike * 7;
    line(ctx, ink, 4.5, p => { p.moveTo(x - 2, 7); p.quadraticCurveTo(x - 5, 17, toe, 17); p.quadraticCurveTo(toe + 3, 17, toe + 4, 20); });
    line(ctx, pal.ridge, 1.8, p => { p.moveTo(x - 1, 11); p.quadraticCurveTo(x - 3, 15, toe, 16); p.lineTo(toe + 2, 17); });
  }
  shape(ctx, wash(ctx, -18, 21, [[0, pal.ridge], [0.35, pal.fur], [1, pal.deep]]), 2.7, p => {
    p.moveTo(-27, 5); p.quadraticCurveTo(-29, -8, -15, -13); p.quadraticCurveTo(2, -23, 22, -6);
    p.bezierCurveTo(26, 9, 13, 17, -7, 17); p.quadraticCurveTo(-23, 16, -27, 5);
  });
  batWing(ctx, copper, false, flap);

  ctx.save();
  ctx.translate(strike * 8, -windup * 2);
  const earLift = flap * 2 - windup * 4;
  shape(ctx, pal.deep, 2.6, p => {
    p.moveTo(20, -19); p.quadraticCurveTo(19, -33, 30, (copper ? -31 : -42) + earLift);
    p.quadraticCurveTo(41, -29, 35, -15);
  });
  shape(ctx, pal.ear, 0, p => {
    p.moveTo(27, -23); p.quadraticCurveTo(25, -30, 30, (copper ? -29 : -37) + earLift); p.quadraticCurveTo(36, -27, 32, -20);
  });
  if (copper) {
    shape(ctx, wash(ctx, -33, 14, [[0, pal.ridge], [0.47, pal.fur], [1, pal.deep]]), 2.7, p => {
      p.moveTo(-2, -15); p.quadraticCurveTo(-9, -22, -6, -29 + earLift); p.quadraticCurveTo(-2, -35 + earLift, 7, -29 + earLift);
      p.quadraticCurveTo(10, -26, 10, -22); p.lineTo(17, -26); p.lineTo(17, -20); p.quadraticCurveTo(28, -24, 36, -17);
      p.quadraticCurveTo(45, -12, 42, -1); p.quadraticCurveTo(41, 13, 22, 15); p.quadraticCurveTo(6, 17, -3, 9);
      p.lineTo(-5, 2); p.lineTo(-8, 4); p.quadraticCurveTo(-7, -1, -4, -6); p.lineTo(-8, -6); p.quadraticCurveTo(-3, -9, -2, -15);
    });
    shape(ctx, pal.ear, 1.6, p => { p.moveTo(0, -18); p.quadraticCurveTo(-6, -23, -3, -28 + earLift); p.quadraticCurveTo(4, -29 + earLift, 6, -22); p.quadraticCurveTo(4, -17, 0, -18); });
    shape(ctx, '#a77955', 0, p => {
      p.moveTo(0, -2); p.lineTo(4, -4); p.lineTo(9, -9); p.lineTo(12, -6); p.quadraticCurveTo(12, -2, 20, 2);
      p.quadraticCurveTo(17, 11, 21, 12); p.quadraticCurveTo(5, 14, 2, 8); p.lineTo(7, 7); p.quadraticCurveTo(2, 7, 0, 4);
    });
  } else {
    shape(ctx, wash(ctx, -46, 12, [[0, pal.ridge], [0.65, pal.fur], [1, pal.deep]]), 2.7, p => {
      p.moveTo(0, -13); p.quadraticCurveTo(-8, -27, -5, -45 + earLift); p.quadraticCurveTo(8, -39 + earLift, 12, -23);
      p.lineTo(18, -29); p.lineTo(20, -23); p.quadraticCurveTo(30, -26, 37, -19); p.quadraticCurveTo(44, -14, 43, -4);
      p.quadraticCurveTo(44, 10, 32, 13); p.quadraticCurveTo(22, 16, 11, 12); p.lineTo(5, 15); p.lineTo(6, 9);
      p.lineTo(-1, 10); p.lineTo(1, 3); p.lineTo(-4, 5); p.quadraticCurveTo(-2, -1, 0, -13);
    });
    shape(ctx, pal.ear, 1.5, p => { p.moveTo(2, -18); p.quadraticCurveTo(-4, -27, -3, -39 + earLift); p.quadraticCurveTo(6, -33 + earLift, 7, -23); p.quadraticCurveTo(6, -17, 2, -18); });
    line(ctx, '#c48797', 1.4, p => { p.moveTo(0, -35 + earLift); p.quadraticCurveTo(3, -29, 4, -25); });
    line(ctx, pal.ridge, 1.4, p => { p.moveTo(3, -8); p.lineTo(7, -12); p.moveTo(5, -1); p.lineTo(8, -5); });
  }

  shape(ctx, pal.gleam, 1.7, p => { p.moveTo(11, -13); p.quadraticCurveTo(17, -19, 23, -14); p.quadraticCurveTo(22, -9, 17, -9); p.quadraticCurveTo(12, -9, 11, -13); });
  oval(ctx, 18.8, -13.35, 1.4, 2.1, ink, 0.15);
  oval(ctx, 19.2, -14.25, 0.8, 0.75, '#fff0bd');
  line(ctx, ink, 2.15, p => { p.moveTo(9, -17); p.quadraticCurveTo(15, -19, 22, -15.5); });

  const jaw = 1 + strike * 9;
  shape(ctx, pal.deep, 2.3, p => {
    p.moveTo(21, 1); p.quadraticCurveTo(33, -2, 45, 1); p.quadraticCurveTo(45, 5 + jaw, 37, 8 + jaw); p.quadraticCurveTo(25, 10 + jaw, 21, 1);
  });
  shape(ctx, '#2d222a', 0, p => { p.moveTo(22, 0.5); p.quadraticCurveTo(33, 3, 44, 0.5); p.quadraticCurveTo(43, 5 + jaw, 35, 5 + jaw * 0.9); p.quadraticCurveTo(26, 7, 22, 0.5); });
  if (strike > 0.1) oval(ctx, 35, 4 + jaw * 0.67, 4.3, 1.15, '#955669', -0.1);
  shape(ctx, wash(ctx, -11, 5, [[0, pal.ridge], [0.6, pal.fur], [1, pal.deep]]), 2.1, p => {
    p.moveTo(21, -4); p.quadraticCurveTo(21, -11, 31, -10); p.quadraticCurveTo(34, -10, 38, -8); p.quadraticCurveTo(46, -10, 47, -3);
    p.quadraticCurveTo(47, 3, 40, 4); p.quadraticCurveTo(36, 4, 34, 1); p.quadraticCurveTo(27, 5, 22, 1);
  });
  shape(ctx, '#f2dfb7', 1.35, p => { p.moveTo(26, 2); p.quadraticCurveTo(28, 6, 31, 7.5); p.lineTo(32, 2); });
  shape(ctx, '#f2dfb7', 1.35, p => { p.moveTo(39, 3); p.quadraticCurveTo(41, 6, 43, 6.5); p.lineTo(43.5, 2.7); });
  shape(ctx, pal.nose, 1.85, p => {
    p.moveTo(33, -7); p.quadraticCurveTo(35, -12, 41, -10); p.quadraticCurveTo(45, -9, 44, -5); p.quadraticCurveTo(41, -1, 36, -4); p.quadraticCurveTo(33, -4, 33, -7);
  });
  oval(ctx, 37, -6.5, 1.3, 0.95, ink, 0.4);
  oval(ctx, 42, -7, 0.8, 0.85, ink, -0.4);
  line(ctx, pal.ridge, 1.45, p => { p.moveTo(23, -5); p.quadraticCurveTo(26, -8, 30, -7); });
  ctx.restore();
  ctx.restore();
}
