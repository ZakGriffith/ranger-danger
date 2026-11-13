import type { RangerPose } from './pose';

type Trace = (ctx: CanvasRenderingContext2D) => void;

const ink = '#2b2330';
const greenShadow = '#243b32';
const green = '#4d7149';
const greenLight = '#86a75e';
const seam = '#b6c994';
const skin = '#e3a371';
const skinLight = '#f8c488';
const skinShade = '#ae6659';
const leather = '#714838';
const leatherLight = '#ad7046';
const gold = '#e9b76d';

function fill(ctx: CanvasRenderingContext2D, color: string | CanvasGradient, trace: Trace, outline = 0) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = outline;
    ctx.strokeStyle = ink;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, color: string, width: number, trace: Trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ellipse(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, rx: number, ry: number, outline = 0) {
  fill(ctx, color, p => p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), outline);
}

function gradient(ctx: CanvasRenderingContext2D, y0: number, y1: number, light: string, shade: string) {
  const value = ctx.createLinearGradient(0, y0, 0, y1);
  value.addColorStop(0, light);
  value.addColorStop(1, shade);
  return value;
}

function drawBoot(ctx: CanvasRenderingContext2D, hipX: number, x: number, y: number, toe: number, dark: boolean) {
  fill(ctx, dark ? '#413644' : '#54414a', p => {
    p.moveTo(hipX - 6, -24);
    p.quadraticCurveTo(hipX, -27, hipX + 6, -23);
    p.quadraticCurveTo(x + 5.5, y - 18, x + 4.6, y - 10);
    p.lineTo(x - 5.8, y - 9);
    p.quadraticCurveTo(x - 6, y - 13, hipX - 6, -24);
  }, 2.3);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(toe, 1);
  fill(ctx, gradient(ctx, -15, 1, dark ? '#77514a' : '#98604b', dark ? '#492f3b' : '#5c3840'), p => {
    p.moveTo(-6, -14);
    p.quadraticCurveTo(-.5, -15.5, 4.7, -12.5);
    p.lineTo(4.5, -7);
    p.quadraticCurveTo(10, -6.4, 10.1, -3);
    p.quadraticCurveTo(9.8, -.2, 5.8, 0);
    p.lineTo(-5.4, 0);
    p.quadraticCurveTo(-8, -1.4, -7.1, -4.5);
    p.lineTo(-6, -14);
  }, 2.2);
  fill(ctx, dark ? '#8f5d50' : '#b17858', p => {
    p.moveTo(-5.7, -13.1);
    p.quadraticCurveTo(-.3, -14.8, 4.6, -11.7);
    p.lineTo(4.3, -8.9);
    p.quadraticCurveTo(-.1, -10.8, -5.8, -9.7);
  }, 1.15);
  line(ctx, '#573541', 1.2, p => {
    p.moveTo(-5.3, -3);
    p.quadraticCurveTo(.1, -1.5, 8.4, -2.6);
  });
  if (!dark) {
    line(ctx, '#d59763', 1.15, p => {
      p.moveTo(3.5, -6.1);
      p.quadraticCurveTo(6.7, -6.2, 7.5, -4.8);
    });
  }
  ctx.restore();
}

function drawQuiver(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, visible: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  for (const [offset, top, vane] of [[-3.5, -15, '#b75a4e'], [1, -18, '#e5a574'], [5.2, -14, '#b75a4e']] as const) {
    line(ctx, ink, 1.9, p => { p.moveTo(offset, top + 2); p.lineTo(offset - .5, 4); });
    fill(ctx, vane, p => {
      p.moveTo(offset - 2.2, top + 2);
      p.lineTo(offset, top - 1);
      p.quadraticCurveTo(offset + 2.1, top + 1.5, offset + 2.3, top + 5.8);
      p.lineTo(offset - 2.1, top + 7.2);
    }, 1);
  }
  fill(ctx, gradient(ctx, -2, 23, leatherLight, '#6d4241'), p => {
    p.moveTo(-7.5, -3);
    p.quadraticCurveTo(.3, -6, 8, -3);
    p.lineTo(6.2, 22);
    p.quadraticCurveTo(0, 26, -5, 21.5);
  }, 2);
  fill(ctx, '#bd8057', p => {
    p.moveTo(-7.3, -2.6);
    p.quadraticCurveTo(0, .4, 8, -2.6);
    p.lineTo(7.3, 2.5);
    p.quadraticCurveTo(.8, 5.6, -7, 2.1);
  }, 1.3);
  if (visible) {
    line(ctx, '#e0a364', 1.3, p => { p.moveTo(-2.8, 6); p.quadraticCurveTo(-2, 12, -2, 19); });
    line(ctx, '#513541', 1.6, p => { p.moveTo(-5.6, 16.3); p.quadraticCurveTo(0, 19.7, 6.4, 15.9); });
  }
  ctx.restore();
}

function drawFrontCoat(ctx: CanvasRenderingContext2D, profile: boolean) {
  const far = profile ? -13.3 : -16.5;
  fill(ctx, gradient(ctx, -45, -13, green, greenShadow), p => {
    p.moveTo(far, -38);
    p.quadraticCurveTo(far + 3, -47, -6, -46);
    p.quadraticCurveTo(7, -46.8, 15.5, -40);
    p.quadraticCurveTo(14, -31.5, 11, -26.5);
    p.lineTo(15, -15);
    p.quadraticCurveTo(6, -12, 1.5, -14.5);
    p.lineTo(-.5, -17);
    p.quadraticCurveTo(-7, -12.6, far + 2, -16.4);
    p.quadraticCurveTo(far + 5, -24, far + 3, -30);
  }, 2.6);
  fill(ctx, '#6c8c55', p => {
    p.moveTo(far + 2, -38);
    p.quadraticCurveTo(-7, -45, 2.3, -42.2);
    p.quadraticCurveTo(9.4, -41.8, 12.8, -38);
    p.lineTo(10.9, -30.1);
    p.quadraticCurveTo(2, -33.8, -2, -26.3);
    p.quadraticCurveTo(-3, -32, far + 3, -30);
  });
  fill(ctx, '#385b40', p => {
    p.moveTo(far + 3.4, -26);
    p.quadraticCurveTo(-4, -22, 2, -25);
    p.quadraticCurveTo(6, -19, 12.4, -20.8);
    p.lineTo(13.7, -15.7);
    p.quadraticCurveTo(6, -14, 1.7, -16);
    p.lineTo(-1, -18.8);
    p.quadraticCurveTo(-8, -14.1, far + 3.5, -17.2);
  });
  line(ctx, '#85a367', 1.3, p => {
    p.moveTo(far + 4.4, -18.4);
    p.quadraticCurveTo(-7, -17, -4.5, -19.1);
    p.moveTo(4, -17.4);
    p.quadraticCurveTo(8, -16.3, 12.6, -17.5);
  });
}

function drawBackCoat(ctx: CanvasRenderingContext2D) {
  fill(ctx, gradient(ctx, -44, -11, '#4b704b', greenShadow), p => {
    p.moveTo(-16.5, -36);
    p.quadraticCurveTo(-13.3, -46.5, -2.5, -47);
    p.quadraticCurveTo(12, -46.2, 17.5, -36.5);
    p.quadraticCurveTo(15.2, -29, 13.8, -24);
    p.lineTo(17.7, -12.6);
    p.quadraticCurveTo(5.4, -12.1, 1.8, -17.2);
    p.quadraticCurveTo(-3.5, -13.3, -15.5, -13);
    p.quadraticCurveTo(-12.1, -20, -12.9, -27.5);
  }, 2.5);
  fill(ctx, '#72935a', p => {
    p.moveTo(-13.7, -37.2);
    p.quadraticCurveTo(-8.4, -44.2, 2.7, -43.5);
    p.quadraticCurveTo(10.5, -44.3, 14.8, -37.7);
    p.quadraticCurveTo(12.4, -35.2, 10.4, -27.9);
    p.quadraticCurveTo(4.3, -30.1, 2.8, -26.6);
    p.quadraticCurveTo(-6.8, -29.3, -9.3, -26.9);
  });
  line(ctx, '#283f34', 1.5, p => {
    p.moveTo(-3.8, -32.1); p.quadraticCurveTo(-3, -26.2, -5.2, -20.1);
    p.moveTo(10.6, -31.6); p.quadraticCurveTo(8.1, -24.2, 10.2, -18.6);
  });
}

function drawBelt(ctx: CanvasRenderingContext2D, profile: boolean) {
  fill(ctx, leather, p => {
    p.moveTo(profile ? -10.8 : -13.5, -29.8);
    p.quadraticCurveTo(-.5, -27.6, 12.5, -29.8);
    p.lineTo(12.7, -24.2);
    p.quadraticCurveTo(-.5, -21.9, profile ? -11.1 : -13.8, -24.4);
  }, 1.45);
  line(ctx, leatherLight, 1.1, p => {
    p.moveTo(profile ? -9.6 : -12.7, -28.2);
    p.quadraticCurveTo(-.5, -26.3, 12.4, -28.3);
  });
  const buckle = profile ? 5.7 : 2;
  ellipse(ctx, gold, buckle, -26.1, 3.5, 3.15, 1.25);
  ellipse(ctx, leather, buckle, -26.1, 1.4, 1.33);
  fill(ctx, leatherLight, p => {
    p.moveTo(profile ? -10 : -12, -25.8);
    p.quadraticCurveTo(-7.9, -26.1, -6.2, -23.9);
    p.lineTo(-6.4, -19.1);
    p.quadraticCurveTo(-10.4, -17.2, -13, -19.6);
    p.lineTo(-12.7, -24.2);
  }, 1.3);
  ellipse(ctx, gold, -10.3, -22.3, .9, .9);
}

function drawStrap(ctx: CanvasRenderingContext2D) {
  fill(ctx, leather, p => {
    p.moveTo(-11, -43.3);
    p.lineTo(-6.5, -44.6);
    p.quadraticCurveTo(3.2, -39.9, 10.2, -28.3);
    p.lineTo(6.2, -26.7);
    p.quadraticCurveTo(-1, -36.4, -11, -43.3);
  }, 1.6);
  line(ctx, leatherLight, .95, p => { p.moveTo(-8.2, -42.8); p.quadraticCurveTo(1.4, -38.2, 7.6, -29.6); });
  ellipse(ctx, gold, 3.2, -34.3, 1.55, 1.45, .85);
}

export function drawRangerBody(ctx: CanvasRenderingContext2D, pose: RangerPose) {
  const { view, phase, run, bob, recoil } = pose;
  const profile = view === 'east' || view === 'west';
  const rear = view === 'north';
  const stride = Math.sin(phase) * run;
  const strideSize = profile ? 7.8 : 3.7;
  const leftX = (profile ? -4 : -8.1) - stride * strideSize;
  const rightX = (profile ? 4.8 : 7) + stride * strideSize;
  const leftY = -Math.max(0, Math.cos(phase)) * run * (profile ? 5 : 7);
  const rightY = -Math.max(0, -Math.cos(phase)) * run * (profile ? 5 : 7) + (profile ? .1 : -.1);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (view === 'west') ctx.scale(-1, 1);
  drawBoot(ctx, -5.7, leftX, leftY - (profile ? 1.7 : 0), profile ? 1 : -1, true);
  drawBoot(ctx, 5.8, rightX, rightY, 1, false);

  ctx.translate(profile ? -recoil * 1.7 : 0, bob);
  if (!rear) drawQuiver(ctx, profile ? -14.4 : -13.8, -39.7, -.36, false);
  if (rear) {
    drawBackCoat(ctx);
    drawQuiver(ctx, 7.8, -41.6, -.29, true);
  } else {
    drawFrontCoat(ctx, profile);
    if (!profile) drawStrap(ctx);
    drawBelt(ctx, profile);
  }
  ctx.restore();
}

function drawFeather(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, front: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  fill(ctx, gradient(ctx, -13, 1, '#ef7e65', '#a74752'), p => {
    p.moveTo(0, 4);
    p.quadraticCurveTo(-6.4, 1, -9.3, -3);
    p.lineTo(-7.5, -2.4);
    p.quadraticCurveTo(-14.4, -6.6, -15.7, -12.3);
    p.quadraticCurveTo(-8.4, -12.4, -5.9, -9.6);
    p.lineTo(-7.3, -10.3);
    p.quadraticCurveTo(-1.6, -10.1, .3, -4.7);
    p.quadraticCurveTo(2.1, 0, 0, 4);
  }, 1.9);
  line(ctx, front ? '#ffd389' : '#c58766', 1.15, p => {
    p.moveTo(.1, 4.1); p.quadraticCurveTo(-5, -4.5, -12, -9.5);
  });
  ctx.restore();
}

function drawProfileHead(ctx: CanvasRenderingContext2D) {
  drawFeather(ctx, -9, -58.5, -.1, true);
  fill(ctx, gradient(ctx, -69, -39, greenLight, greenShadow), p => {
    p.moveTo(-16.2, -44);
    p.quadraticCurveTo(-13.3, -49.3, -15.3, -55.4);
    p.quadraticCurveTo(-15.3, -67, -4, -69.5);
    p.quadraticCurveTo(9.2, -71.2, 14.6, -60.4);
    p.quadraticCurveTo(19, -53.7, 15.3, -43.5);
    p.quadraticCurveTo(10, -38.2, 1.5, -40.8);
    p.quadraticCurveTo(-6.5, -37.8, -12.1, -43);
    p.quadraticCurveTo(-17.3, -42.8, -21, -40.6);
    p.quadraticCurveTo(-20.1, -43.4, -16.2, -44);
  }, 2.65);
  fill(ctx, '#a0ba73', p => {
    p.moveTo(-13.1, -55);
    p.quadraticCurveTo(-12.5, -64.8, -3.8, -67.3);
    p.quadraticCurveTo(4.4, -69, 10, -63.6);
    p.quadraticCurveTo(3.2, -66, -3.4, -62.4);
    p.quadraticCurveTo(-9.9, -59.9, -13.1, -55);
  });
  fill(ctx, '#263b2e', p => {
    p.moveTo(9, -61.8);
    p.quadraticCurveTo(12.4, -61, 14.5, -56.2);
    p.quadraticCurveTo(16.7, -50.6, 14.2, -45);
    p.quadraticCurveTo(10, -39.6, 2, -42.1);
    p.quadraticCurveTo(-4.1, -46.1, -.6, -53.7);
    p.quadraticCurveTo(3.2, -59.5, 9, -61.8);
  });
  fill(ctx, gradient(ctx, -58, -42, skinLight, skin), p => {
    p.moveTo(7.3, -58.4);
    p.quadraticCurveTo(12.5, -59.2, 15.1, -54.7);
    p.lineTo(18.4, -51.2);
    p.quadraticCurveTo(19.2, -49.3, 15.2, -48.2);
    p.quadraticCurveTo(15.2, -43.2, 10.7, -42.4);
    p.quadraticCurveTo(3.1, -40.6, .9, -47.5);
    p.quadraticCurveTo(1.5, -54.3, 7.3, -58.4);
  }, 1.8);
  fill(ctx, '#976052', p => {
    p.moveTo(2.2, -49.2);
    p.quadraticCurveTo(4.8, -46.1, 6.4, -45.7);
    p.quadraticCurveTo(10.3, -46.6, 14.7, -47.6);
    p.quadraticCurveTo(15.1, -43.5, 10.8, -42.7);
    p.quadraticCurveTo(5.2, -41.6, 2.8, -45.3);
  });
  line(ctx, ink, 1.7, p => {
    p.moveTo(8, -54.2);
    p.quadraticCurveTo(10.1, -56.4, 13, -55.5);
    p.moveTo(10.1, -46.8);
    p.quadraticCurveTo(12.3, -46.3, 13.8, -47.4);
  });
  ellipse(ctx, ink, 11.8, -52.2, 1.32, 1.72);
  ellipse(ctx, '#ffe9b7', 12.2, -52.8, .47, .52);
  line(ctx, '#bbce91', 1.15, p => {
    p.moveTo(7.5, -61.7);
    p.quadraticCurveTo(2.9, -60, .5, -56);
    p.moveTo(-3.9, -42.7);
    p.quadraticCurveTo(-7.2, -43.4, -8.4, -46);
  });
}

function drawFrontHead(ctx: CanvasRenderingContext2D) {
  drawFeather(ctx, -9.1, -59.5, -.23, true);
  fill(ctx, gradient(ctx, -69, -41, '#90ab66', greenShadow), p => {
    p.moveTo(-18, -46.5);
    p.quadraticCurveTo(-14.7, -50.4, -14.7, -58.1);
    p.quadraticCurveTo(-13.4, -67, -3.3, -69.8);
    p.quadraticCurveTo(6, -71, 11.6, -65.6);
    p.quadraticCurveTo(16, -61.7, 16.3, -53.6);
    p.lineTo(19, -45.2);
    p.quadraticCurveTo(14.2, -41.1, 6.7, -40.1);
    p.quadraticCurveTo(.6, -37.5, -5.8, -41.3);
    p.quadraticCurveTo(-13.7, -40.6, -18, -46.5);
  }, 2.65);
  fill(ctx, '#a8bd7b', p => {
    p.moveTo(-13, -56.5);
    p.quadraticCurveTo(-12.8, -65.2, -3, -68.3);
    p.quadraticCurveTo(4.2, -69.5, 9.5, -65.3);
    p.quadraticCurveTo(2.4, -67.3, -3.9, -64);
    p.quadraticCurveTo(-8.9, -61.5, -13, -56.5);
  });
  fill(ctx, '#263b2e', p => {
    p.moveTo(-12.1, -51.9);
    p.quadraticCurveTo(-8.2, -60.3, -.1, -60.7);
    p.quadraticCurveTo(9.5, -61.2, 13.1, -52.8);
    p.quadraticCurveTo(15.6, -41.7, .6, -40.2);
    p.quadraticCurveTo(-13.8, -40.4, -12.1, -51.9);
  });
  fill(ctx, gradient(ctx, -58, -41, skinLight, skin), p => {
    p.moveTo(-9.3, -52.2);
    p.quadraticCurveTo(-6.4, -58.6, .3, -58.7);
    p.quadraticCurveTo(7.7, -59.1, 11.1, -53);
    p.quadraticCurveTo(13.4, -45.8, 7.3, -43.5);
    p.quadraticCurveTo(1.7, -39.7, -4.8, -42.8);
    p.quadraticCurveTo(-11.3, -44.5, -9.3, -52.2);
  }, 1.5);
  fill(ctx, skinShade, p => {
    p.moveTo(-8.3, -48.9);
    p.quadraticCurveTo(-5.2, -45.9, -2.7, -45.6);
    p.quadraticCurveTo(.6, -47.4, 2, -46.8);
    p.quadraticCurveTo(4.4, -46.6, 5.6, -45.9);
    p.quadraticCurveTo(9.5, -46.8, 10.9, -50);
    p.quadraticCurveTo(10.6, -44.5, 6.8, -43.3);
    p.quadraticCurveTo(1.3, -40.2, -4.6, -43.2);
    p.quadraticCurveTo(-8.3, -44.3, -8.3, -48.9);
  });
  line(ctx, ink, 1.55, p => {
    p.moveTo(-7.1, -53.8); p.quadraticCurveTo(-4.8, -55.1, -2.5, -53.2);
    p.moveTo(5, -53.4); p.quadraticCurveTo(7.4, -55.2, 9, -54);
    p.moveTo(-1.2, -45.6); p.quadraticCurveTo(1.9, -44.9, 4.1, -45.8);
  });
  ellipse(ctx, ink, -4.8, -51.2, 1.15, 1.51);
  ellipse(ctx, ink, 7, -51.3, 1.16, 1.52);
  line(ctx, '#b9705a', 1.15, p => { p.moveTo(.6, -52.1); p.quadraticCurveTo(.2, -49, 2.5, -49.5); });
  line(ctx, '#cfdaa5', 1.05, p => { p.moveTo(-7.2, -58.7); p.quadraticCurveTo(-3.2, -61.6, 2.3, -61.5); });
}

function drawBackHead(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(-1, 1);
  drawFeather(ctx, -9.4, -59.5, -.14, false);
  ctx.restore();
  fill(ctx, gradient(ctx, -71, -42, '#88a467', greenShadow), p => {
    p.moveTo(-16.8, -45.9);
    p.quadraticCurveTo(-16, -48.4, -15.4, -56.4);
    p.quadraticCurveTo(-14, -67, -3.9, -69.8);
    p.quadraticCurveTo(5.8, -71.2, 11.8, -63.5);
    p.quadraticCurveTo(16.2, -57.4, 15.9, -50.1);
    p.lineTo(17.7, -45.3);
    p.quadraticCurveTo(10.3, -39.2, 4.9, -41.7);
    p.quadraticCurveTo(-6.4, -40.3, -9.6, -43);
    p.quadraticCurveTo(-14, -40.8, -18.5, -42.8);
    p.lineTo(-16.8, -45.9);
  }, 2.65);
  fill(ctx, '#9db97b', p => {
    p.moveTo(-13.3, -56.8);
    p.quadraticCurveTo(-11.9, -64.7, -3.4, -67.3);
    p.quadraticCurveTo(4.3, -69, 9.7, -62.5);
    p.quadraticCurveTo(4.1, -65.5, -.7, -63.4);
    p.quadraticCurveTo(-9, -62, -13.3, -56.8);
  });
  fill(ctx, '#3d6042', p => {
    p.moveTo(-14.5, -51.4);
    p.quadraticCurveTo(-12.3, -47.2, -5.4, -47.1);
    p.quadraticCurveTo(5.8, -42.6, 15, -49.8);
    p.lineTo(16.2, -45.6);
    p.quadraticCurveTo(10.3, -41.2, 4.8, -43);
    p.quadraticCurveTo(-5, -41.7, -9.8, -44.2);
    p.quadraticCurveTo(-14.3, -41.6, -16.7, -43.2);
  });
  line(ctx, '#36553b', 1.45, p => {
    p.moveTo(.9, -65.9);
    p.quadraticCurveTo(7.7, -60, 7.2, -55.9);
    p.quadraticCurveTo(6.9, -49.2, 4.9, -47.8);
  });
  line(ctx, seam, .8, p => {
    p.moveTo(1, -65.4); p.lineTo(2.7, -63.7);
    p.moveTo(3.6, -62.6); p.lineTo(4.8, -61);
    p.moveTo(5.6, -59.4); p.lineTo(6.2, -57.9);
  });
}

export function drawRangerHead(ctx: CanvasRenderingContext2D, { view, bob, draw, recoil }: RangerPose) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.translate(0, bob);
  if (view === 'west') ctx.scale(-1, 1);
  if (view === 'east' || view === 'west') {
    ctx.translate(draw * .8 - recoil * 1.5, 0);
    drawProfileHead(ctx);
  } else if (view === 'north') {
    drawBackHead(ctx);
  } else {
    drawFrontHead(ctx);
  }
  ctx.restore();
}
