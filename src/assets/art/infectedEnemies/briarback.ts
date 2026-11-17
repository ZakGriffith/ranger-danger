import { line, oval, shape, wash } from '../forestEnemies/paint';
import { drawPaintedToad, type PaintedToadArt, type ToadArtClip } from './paintedToad';

function briarPlates(ctx: CanvasRenderingContext2D) {
  for (const [x, y, size, tilt] of [[-45, -38, 17, -.28], [-29, -47, 22, -.18], [-10, -49, 23, .05], [12, -43, 20, .34]] as const) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    shape(ctx, wash(ctx, -size * .88, size * .4, [[0, '#c3bc86'], [.43, '#92976a'], [1, '#59604a']]), 2.5, p => {
      p.moveTo(-size * .47, size * .22);
      p.quadraticCurveTo(-size * .64, -size * .24, -size * .28, -size * .46);
      p.lineTo(-size * .17, -size * .85);
      p.quadraticCurveTo(size * .15, -size * .69, size * .36, -size * .41);
      p.quadraticCurveTo(size * .54, -size * .36, size * .58, size * .01);
      p.quadraticCurveTo(size * .38, size * .42, -size * .18, size * .39);
    });
    shape(ctx, '#acb47b', 0, p => {
      p.moveTo(-size * .38, -size * .14); p.lineTo(-size * .14, -size * .53);
      p.quadraticCurveTo(size * .19, -size * .39, size * .37, -size * .2);
      p.lineTo(size * .12, -size * .24);
      p.quadraticCurveTo(-size * .05, -size * .22, -size * .08, -size * .03);
      p.lineTo(-size * .16, -size * .14);
    });
    line(ctx, '#4f5947', 1.25, p => {
      p.moveTo(-size * .12, -size * .49); p.lineTo(-size * .04, -size * .17);
      p.lineTo(size * .14, -size * .08); p.lineTo(size * .22, size * .16);
    });
    ctx.restore();
  }
  for (const [x, y, r] of [[-28, -35, 3], [-17, -39, 4.4], [2, -34, 3.3]] as const) {
    oval(ctx, x, y, r, r * .68, '#754659', -.18);
    oval(ctx, x - .6, y - 1.1, r * .58, r * .37, '#c8848e', -.28);
  }
}

const art: PaintedToadArt = {
  profile: 'briar',
  skin: {
    light: '#afaa75', ridge: '#d5cb99', skin: '#847858', shade: '#605749', deep: '#423c39',
    belly: '#846954', throat: '#d5a789', eye: '#f1a966', toxin: '#aebf67',
    hop: 13, pitch: .07, shoulder: 23, headY: -39, headScale: 1.08,
  },
  back: p => {
    p.moveTo(-55, -21); p.quadraticCurveTo(-58, -32, -49, -44);
    p.quadraticCurveTo(-44, -48, -39, -46); p.quadraticCurveTo(-29, -58, -15, -52);
    p.quadraticCurveTo(-4, -53, 5, -47); p.quadraticCurveTo(23, -47, 34, -35);
    p.bezierCurveTo(52, -26, 35, -9, 25, -8);
    p.bezierCurveTo(7, 0, -27, -8, -43, -10); p.quadraticCurveTo(-53, -13, -55, -21);
  },
  decorate: briarPlates,
};

export function drawBriarback(ctx: CanvasRenderingContext2D, clip: ToadArtClip, phase: number, demoTravel = false) {
  drawPaintedToad(ctx, art, clip, phase, demoTravel);
}
