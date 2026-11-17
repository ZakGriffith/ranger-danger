import { line, oval, shape, wash } from '../forestEnemies/paint';
import { drawPaintedToad, type PaintedToadArt, type ToadArtClip } from './paintedToad';

export const SPOREBACK_TOXIN_COLOR = '#b8cc59';

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

const art: PaintedToadArt = {
  profile: 'spore',
  skin: {
    light: '#bea1ae', ridge: '#e3bfbe', skin: '#94748f', shade: '#694e72', deep: '#47344f',
    belly: '#aa8467', throat: '#e1bd83', eye: '#f4c675', toxin: SPOREBACK_TOXIN_COLOR,
    hop: 19, pitch: .095, shoulder: 24, headY: -41, headScale: 1,
  },
  back: p => {
    p.moveTo(-51, -21); p.bezierCurveTo(-50, -43, -28, -52, -11, -50);
    p.bezierCurveTo(5, -51, 17, -42, 29, -38); p.quadraticCurveTo(44, -26, 34, -15);
    p.bezierCurveTo(25, -4, 2, -4, -15, -9);
    p.quadraticCurveTo(-44, -5, -51, -21);
  },
  decorate(ctx, tilt) {
    mushroom(ctx, -43, -42, .69, -.28 + tilt);
    mushroom(ctx, -28, -49, 1.02, -.1 + tilt * .65);
    mushroom(ctx, -6, -46, .75, .25 + tilt * .45);
  },
};

export function drawSporeback(ctx: CanvasRenderingContext2D, clip: ToadArtClip, phase: number, demoTravel = false) {
  drawPaintedToad(ctx, art, clip, phase, demoTravel);
}
