import { ink, line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';

type Action = 'move' | 'attack';
const TAU = 2 * Math.PI;

function ease(phase: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function mothPose(action: Action, phase: number) {
  const cycle = phase * TAU;
  const gather = action === 'attack' ? ease(phase, .10, .35) - ease(phase, .39, .54) : 0;
  const dive = action === 'attack' ? ease(phase, .38, .58) - ease(phase, .67, .97) : 0;
  return {
    x: Math.sin(cycle) * 3 - gather * 14 + dive * 26,
    y: -62 - gather * 3 + dive * 7 + Math.cos(cycle * 3) * 2.5,
    pitch: -.03 * Math.sin(cycle) - gather * .10 + dive * .17,
    wingbeat: Math.sin(cycle * 3) * (1 - dive * .82),
    gather,
    dive,
    cycle,
  };
}

function wingMark(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, angle: number, far: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  oval(ctx, 0, 0, rx + 1.8, ry + 1.6, far ? '#574251' : '#654752');
  oval(ctx, 0, 0, rx, ry, far ? '#9a694d' : '#d59858');
  oval(ctx, .8, .2, rx * .76, ry * .69, far ? '#624958' : '#81546a');
  oval(ctx, 1.8, -.2, rx * .44, ry * .41, far ? '#382d3c' : '#3e2b45');
  oval(ctx, -rx * .30, -ry * .44, rx * .31, ry * .18, far ? '#b99a6e' : '#f3ca82', -.08);
  ctx.restore();
}

function mothWing(ctx: CanvasRenderingContext2D, angle: number, spread: number, far: boolean) {
  ctx.save();
  ctx.translate(far ? 4 : -10, far ? -8 : -4);
  ctx.rotate(angle);
  ctx.scale(far ? .80 : .98, spread * (far ? .86 : 1));

  shape(ctx, wash(ctx, -18, 34, [[0, far ? '#634c5a' : '#7f526b'], [.57, far ? '#574151' : '#684456'], [1, '#382b3e']]), far ? 2.8 : 3.2, p => {
    p.moveTo(7, 4); p.quadraticCurveTo(-14, -19, -47, -20);
    p.bezierCurveTo(-59, -16, -77, 1, -72, 11);
    p.quadraticCurveTo(-71, 18, -65, 16);
    p.quadraticCurveTo(-66, 28, -57, 26);
    p.quadraticCurveTo(-54, 37, -44, 31);
    p.quadraticCurveTo(-42, 38, -31, 32);
    p.quadraticCurveTo(-19, 35, -10, 22);
    p.quadraticCurveTo(4, 18, 7, 4);
  });
  shape(ctx, far ? '#6a4b5b' : '#915e72', 0, p => {
    p.moveTo(-58, 17); p.quadraticCurveTo(-52, 8, -45, 6);
    p.quadraticCurveTo(-26, 7, -18, 16); p.quadraticCurveTo(-37, 33, -50, 27);
  });
  wingMark(ctx, -38, 18, 8, 5.7, -.44, far);

  shape(ctx, wash(ctx, -56, 19, [[0, far ? '#765161' : '#9c696f'], [.36, far ? '#67465d' : '#855770'], [.72, far ? '#594157' : '#70465d'], [1, '#493045']]), far ? 2.8 : 3.35, p => {
    p.moveTo(10, 2); p.bezierCurveTo(5, -14, -16, -39, -46, -49);
    p.bezierCurveTo(-58, -52, -76, -52, -81, -47);
    p.quadraticCurveTo(-79, -40, -73, -35);
    p.quadraticCurveTo(-74, -29, -67, -25);
    p.quadraticCurveTo(-72, -21, -66, -17);
    p.quadraticCurveTo(-71, -12, -62, -7);
    p.quadraticCurveTo(-64, -.5, -55, 3);
    p.quadraticCurveTo(-46, 15, -27, 12);
    p.quadraticCurveTo(-5, 17, 10, 2);
  });
  shape(ctx, far ? '#896367' : '#ad777a', 0, p => {
    p.moveTo(-8, -7); p.bezierCurveTo(-22, -30, -43, -44, -71, -47);
    p.quadraticCurveTo(-55, -36, -47, -36); p.lineTo(-56, -34);
    p.quadraticCurveTo(-43, -24, -37, -24); p.lineTo(-43, -22);
    p.quadraticCurveTo(-29, -11, -8, -7);
  });

  line(ctx, far ? '#93675b' : '#ce9564', far ? 1.7 : 2.35, p => {
    p.moveTo(-69, -42); p.quadraticCurveTo(-67, -36, -60, -33);
    p.lineTo(-61, -28); p.lineTo(-54, -23); p.lineTo(-56, -18);
    p.quadraticCurveTo(-54, -14, -46, -11); p.lineTo(-46, -6);
    p.quadraticCurveTo(-35, 1, -25, 2);
  });
  line(ctx, far ? '#674854' : '#594052', far ? 1.4 : 1.65, p => {
    p.moveTo(-19, -8); p.quadraticCurveTo(-42, -11, -55, -23);
    p.moveTo(-17, 3); p.quadraticCurveTo(-42, 6, -58, -4);
    p.moveTo(-27, 16); p.quadraticCurveTo(-49, 26, -60, 19);
  });
  wingMark(ctx, -43, -23, 14.6, 10.4, .47, far);
  for (const [x, y, size] of [[-69, -38, 1.4], [-62, -29, 1.45], [-59, -13, 1.65], [-51, -3, 1.25], [-29, -3, 1.25], [-53, 23, 1.5], [-48, 27, 1.2]]) {
    oval(ctx, x, y, size, size * .74, far ? '#b28566' : '#ecc381', .43);
  }
  ctx.restore();
}

function curledFeet(ctx: CanvasRenderingContext2D, far: boolean, dive: number, wave: number) {
  const behind = far ? 9 : 0;
  for (const [i, x] of [2, -6, -14].entries()) {
    const knee = x + behind + dive * (8 - i * 3);
    const foot = knee + (i === 2 ? -6 : 7) + dive * 7;
    const y = 29 - i * 2 - dive * (i + 2) + wave * .7;
    const trace = (p: CanvasRenderingContext2D) => {
      p.moveTo(x + behind, 11); p.quadraticCurveTo(knee + 1, 19, knee, 22 - dive * 3);
      p.quadraticCurveTo(foot, y - 3, foot, y); p.quadraticCurveTo(foot + 1, y + 2, foot + 4, y - 1.5);
    };
    line(ctx, ink, far ? 4.25 : 4.7, trace);
    line(ctx, far ? '#70534e' : '#ab835d', far ? 1.65 : 2.2, trace);
  }
}

function mothAntenna(ctx: CanvasRenderingContext2D, far: boolean, gather: number, dive: number, wave: number) {
  const tipX = (far ? 32 : 19) - gather * 2 - dive * 13;
  const tipY = (far ? -36 : -42) - gather * 3 + dive * 13 + wave * 1.6;
  const stem = (p: CanvasRenderingContext2D) => {
    p.moveTo(far ? 26 : 15, -11);
    p.quadraticCurveTo(far ? 36 - dive * 3 : 18 - dive * 7, -25 + dive * 9, tipX, tipY);
  };
  const bristles = (p: CanvasRenderingContext2D) => {
    for (let i = 0; i < 6; i++) {
      const step = i * 2.6;
      const x = tipX + i * .65 - i * i * .065;
      const y = tipY + step;
      const width = 2.7 + Math.sin(i * .64) * 3.2;
      p.moveTo(x, y); p.quadraticCurveTo(x - width * .57, y - 3.2, x - width, y - 2.5);
      p.moveTo(x, y + .5); p.quadraticCurveTo(x + width * .54, y - 1.8, x + width, y - 2.8);
    }
  };
  line(ctx, ink, 3.6, stem);
  line(ctx, ink, 2.7, bristles);
  line(ctx, far ? '#90624b' : '#d1a76d', 1.25, bristles);
  line(ctx, far ? '#755447' : '#9b6e50', 1.6, stem);
}

function mothBody(ctx: CanvasRenderingContext2D, wave: number, gather: number, dive: number) {
  shape(ctx, wash(ctx, -10, 26, [[0, '#a87b58'], [.45, '#8b604e'], [1, '#57414a']]), 3.1, p => {
    p.moveTo(9, 8); p.bezierCurveTo(1, -10, -19, -15, -42, -9);
    p.quadraticCurveTo(-52, -5, -55, 2 - wave * 2);
    p.quadraticCurveTo(-51, 15, -35, 22);
    p.bezierCurveTo(-17, 30, -2, 26, 7, 17);
  });
  for (const [x, y] of [[-44, 5], [-35, 12], [-24, 16]]) {
    line(ctx, '#5a424a', 2.9, p => {
      p.moveTo(x - 1, y - 11); p.quadraticCurveTo(x + 4, y - 2, x - 1, y + 6);
    });
    line(ctx, '#c28f61', 1.35, p => {
      p.moveTo(x + 2, y - 8); p.quadraticCurveTo(x + 6, y - 2, x + 3, y + 2);
    });
  }

  mothWing(ctx, .18 * wave + gather * .25 - dive * .23, .74 + wave * .15 + gather * .06 - dive * .10, false);

  shape(ctx, wash(ctx, -24, 24, [[0, '#e5bb77'], [.36, '#cb965e'], [.69, '#aa754c'], [1, '#755047']]), 3.25, p => {
    p.moveTo(20, -12); p.quadraticCurveTo(14, -20, 3, -19);
    p.lineTo(-1, -23); p.lineTo(-5, -19); p.lineTo(-11, -23); p.lineTo(-13, -18);
    p.quadraticCurveTo(-19, -20, -22, -12);
    p.lineTo(-26, -13); p.lineTo(-25, -6); p.lineTo(-29, -4); p.lineTo(-24, 1);
    p.lineTo(-26, 8); p.lineTo(-21, 10); p.quadraticCurveTo(-18, 19, -13, 18);
    p.lineTo(-11, 24); p.lineTo(-5, 20); p.lineTo(-1, 24); p.lineTo(5, 19);
    p.quadraticCurveTo(17, 20, 23, 10);
  });
  shape(ctx, '#e9b774', 0, p => {
    p.moveTo(-19, -8); p.quadraticCurveTo(-15, -15, -9, -14);
    p.lineTo(-7, -17); p.lineTo(-2, -13); p.lineTo(4, -15);
    p.quadraticCurveTo(9, -14, 10, -8); p.lineTo(3, -4);
    p.quadraticCurveTo(-3, -9, -12, -4); p.lineTo(-13, -7); p.lineTo(-15, -5);
  });
  line(ctx, '#785144', 1.6, p => {
    p.moveTo(12, 10); p.quadraticCurveTo(10, 15, 6, 16);
    p.moveTo(-1, 12); p.quadraticCurveTo(-2, 16, -5, 18);
    p.moveTo(-9, 8); p.lineTo(-12, 11);
  });
}

function mothFace(ctx: CanvasRenderingContext2D, dive: number, gather: number, wave: number) {
  ctx.save();
  ctx.translate(dive * 6 - gather * 3, dive * 3 - gather * 1.5);
  mothAntenna(ctx, true, gather, dive, wave);
  mothAntenna(ctx, false, gather, dive, wave);
  shape(ctx, wash(ctx, -17, 17, [[0, '#c79665'], [.46, '#99694f'], [1, '#65434a']]), 3.1, p => {
    p.moveTo(10, -9); p.bezierCurveTo(14, -19, 28, -20, 35, -12);
    p.quadraticCurveTo(43, -8, 41, 2); p.quadraticCurveTo(41, 11, 32, 13);
    p.lineTo(27, 17); p.lineTo(22, 13); p.lineTo(18, 15); p.lineTo(15, 10);
    p.quadraticCurveTo(7, 5, 10, -9);
  });
  oval(ctx, 34, -.5, 6.2, 5.4, '#4a3641', -.2);
  oval(ctx, 20.5, -1.8, 9.6, 7.2, '#402f3a', .22);
  shape(ctx, '#e8bb68', 0, p => {
    p.moveTo(14, -4); p.quadraticCurveTo(22, -4, 27, -1.2);
    p.quadraticCurveTo(26, 3.9, 21, 3.7); p.quadraticCurveTo(15, 3, 14, -4);
  });
  shape(ctx, '#d6a55d', 0, p => {
    p.moveTo(32, -1.4); p.lineTo(38, -3); p.quadraticCurveTo(38, 2, 34.2, 3);
    p.quadraticCurveTo(32, 2, 32, -1.4);
  });
  oval(ctx, 23.4, .4, 2, 2.7, '#502f39', .1);
  oval(ctx, 35.8, -.15, 1.25, 2, '#502f39', .2);
  oval(ctx, 19, -.9, 1.35, .95, '#fff0ba');
  line(ctx, '#ddae76', 1.9, p => {
    p.moveTo(12, -9); p.quadraticCurveTo(16, -13, 21, -12);
    p.moveTo(24, -11); p.quadraticCurveTo(28, -11, 30, -9);
  });
  line(ctx, '#523640', 1.8, p => {
    p.moveTo(23, 8); p.quadraticCurveTo(26, 10, 30, 8);
    p.moveTo(27, 9); p.quadraticCurveTo(27, 12, 25, 12);
    p.moveTo(32, 7); p.lineTo(34, 6);
  });
  ctx.restore();
}

function flightStreaks(ctx: CanvasRenderingContext2D, pose: ReturnType<typeof mothPose>) {
  const { x, y, cycle, gather, dive } = pose;
  ctx.save();
  ctx.lineCap = 'round';
  if (dive > .02) {
    ctx.globalAlpha = dive * .75;
    for (const [offset, dy, length] of [[-102, -17, 43], [-92, -7, 54], [-100, 7, 27], [-76, 20, 34]]) {
      const ty = y + dy + Math.sin(cycle + dy) * 2;
      line(ctx, '#dbd5ab', 1.4, p => {
        p.moveTo(offset, ty); p.quadraticCurveTo(offset + length * .54, ty - 3, offset + length, ty - 3);
      });
    }
  }
  if (gather > .02 || dive > .38) {
    ctx.globalAlpha = Math.max(gather * .8, dive * .55);
    for (const [dx, dy, size] of [[-62, -30, 9], [49, -27, 7], [-77, 3, 6]]) {
      const px = x + dx;
      const py = y + dy + Math.sin(cycle * 3 + dy) * 3;
      line(ctx, '#f1dda0', 1.5, p => {
        p.moveTo(px - size, py + size * .35); p.lineTo(px - size * .32, py + size * .05);
        p.lineTo(px - size * .4, py - size * .39); p.lineTo(px + size * .29, py - size * .48);
      });
    }
  }
  ctx.restore();
}

function drawThunderMoth(ctx: CanvasRenderingContext2D, action: Action, phase: number) {
  const pose = mothPose(action, phase);
  const { x, y, pitch, wingbeat, gather, dive } = pose;
  flightStreaks(ctx, pose);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, .87 - gather * .08);
  ctx.rotate(pitch);
  ctx.lineCap = ctx.lineJoin = 'round';
  mothWing(ctx, .27 - wingbeat * .21 + gather * .18 - dive * .31, .79 - wingbeat * .12 + gather * .08 - dive * .10, true);
  curledFeet(ctx, true, dive, wingbeat);
  curledFeet(ctx, false, dive, wingbeat);
  mothBody(ctx, wingbeat, gather, dive);
  mothFace(ctx, dive, gather, wingbeat);
  ctx.restore();
}

export const mothOption = {
  name: 'Thunder Moth',
  description: 'An ochre storm moth with broad violet wings. It raises its wings, gathers a flicker of charge, then dives head first.',
  draw: drawThunderMoth,
  shadowX: (action: Action, phase: number) => mothPose(action, phase).x,
};
