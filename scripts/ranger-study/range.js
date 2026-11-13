const FIELD_WIDTH = 840;
const FIELD_HEIGHT = 530;
const INK = '#252d24';

function shape(ctx, color, trace, stroke, width = 2) {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function oval(ctx, x, y, rx, ry, color, tilt = 0) {
  shape(ctx, color, p => p.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2));
}

function line(ctx, color, width, trace) {
  ctx.beginPath();
  trace(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function drawClearing(ctx) {
  const light = ctx.createRadialGradient(422, 242, 68, 422, 242, 495);
  light.addColorStop(0, '#4e6240');
  light.addColorStop(.54, '#455a39');
  light.addColorStop(1, '#24382d');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

  shape(ctx, '#294132', p => {
    p.moveTo(0, 0);
    p.lineTo(840, 0);
    p.lineTo(840, 199);
    p.bezierCurveTo(797, 201, 815, 145, 770, 130);
    p.bezierCurveTo(731, 115, 707, 98, 671, 101);
    p.bezierCurveTo(627, 98, 609, 69, 552, 86);
    p.bezierCurveTo(523, 92, 497, 66, 453, 79);
    p.bezierCurveTo(390, 98, 366, 74, 331, 77);
    p.bezierCurveTo(280, 72, 266, 111, 210, 107);
    p.bezierCurveTo(149, 102, 158, 142, 121, 144);
    p.bezierCurveTo(61, 151, 82, 209, 0, 202);
  });

  shape(ctx, '#304735', p => {
    p.moveTo(0, 369);
    p.bezierCurveTo(64, 401, 132, 402, 166, 435);
    p.bezierCurveTo(215, 480, 241, 448, 291, 465);
    p.bezierCurveTo(359, 490, 410, 463, 461, 481);
    p.bezierCurveTo(527, 501, 548, 447, 620, 456);
    p.bezierCurveTo(700, 466, 703, 419, 758, 421);
    p.bezierCurveTo(816, 424, 813, 377, 840, 376);
    p.lineTo(840, 530);
    p.lineTo(0, 530);
  });

  shape(ctx, '#82714a40', p => {
    p.moveTo(-22, 282);
    p.bezierCurveTo(23, 301, 38, 322, 68, 357);
    p.bezierCurveTo(86, 378, 117, 393, 156, 404);
    p.bezierCurveTo(191, 415, 199, 441, 229, 456);
    p.bezierCurveTo(262, 473, 274, 500, 274, 539);
    p.lineTo(319, 545);
    p.bezierCurveTo(312, 502, 286, 483, 252, 451);
    p.bezierCurveTo(224, 423, 216, 405, 168, 390);
    p.bezierCurveTo(124, 377, 99, 368, 79, 339);
    p.bezierCurveTo(41, 286, 26, 265, -18, 251);
  });

  shape(ctx, '#796d4b3b', p => {
    p.moveTo(684, -8);
    p.bezierCurveTo(665, 49, 727, 80, 751, 111);
    p.bezierCurveTo(780, 148, 802, 151, 840, 168);
    p.lineTo(851, 143);
    p.bezierCurveTo(806, 126, 781, 104, 768, 84);
    p.bezierCurveTo(742, 42, 718, 31, 719, -9);
  });

  for (const [x, y, rx, ry] of [[167, 182, 57, 18], [672, 357, 65, 18], [291, 362, 49, 14], [517, 134, 41, 12], [541, 411, 36, 10]]) {
    oval(ctx, x, y, rx, ry, '#2d463342', -.14);
    oval(ctx, x - 14, y + 3, rx * .56, ry * .67, '#64744623', -.15);
  }
}

function drawGrass(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  shape(ctx, color, p => {
    p.moveTo(-6, 0);
    p.quadraticCurveTo(-7, -6, -12, -10);
    p.quadraticCurveTo(-5, -10, -2, -4);
    p.quadraticCurveTo(-2, -11, 2, -14);
    p.quadraticCurveTo(1, -8, 3, -4);
    p.quadraticCurveTo(6, -10, 10, -10);
    p.quadraticCurveTo(7, -5, 7, 0);
  });
  ctx.restore();
}

function drawStone(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  oval(ctx, 1, 4, 24, 8, '#192b248c');
  shape(ctx, '#677261', p => {
    p.moveTo(-22, -1);
    p.lineTo(-16, -13);
    p.lineTo(-3, -18);
    p.lineTo(14, -14);
    p.quadraticCurveTo(23, -8, 21, 0);
    p.quadraticCurveTo(1, 8, -22, -1);
  }, '#283c34', 2.7);
  shape(ctx, '#89917a', p => {
    p.moveTo(-15, -11);
    p.lineTo(-3, -16);
    p.lineTo(12, -12);
    p.lineTo(15, -6);
    p.quadraticCurveTo(3, -2, -13, -5);
  });
  shape(ctx, '#52633f', p => {
    p.moveTo(-18, -8);
    p.quadraticCurveTo(-14, -15, -6, -15);
    p.quadraticCurveTo(-5, -10, 1, -12);
    p.quadraticCurveTo(5, -9, 0, -7);
    p.quadraticCurveTo(-8, -5, -12, -4);
    p.lineTo(-20, -3);
  });
  ctx.restore();
}

function drawFern(ctx, x, y, scale, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  oval(ctx, 0, 2, 17, 5, '#172e285e');
  for (const [angle, length] of [[-.93, .77], [-.47, .92], [.02, 1], [.55, .91], [1.04, .67]]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.scale(length, length);
    shape(ctx, '#2b4935', p => {
      p.moveTo(0, 2);
      p.quadraticCurveTo(-5, -10, -4, -15);
      p.lineTo(-8, -19);
      p.lineTo(-5, -22);
      p.lineTo(-5, -29);
      p.lineTo(0, -36);
      p.lineTo(4, -28);
      p.lineTo(5, -24);
      p.lineTo(7, -20);
      p.lineTo(4, -16);
      p.quadraticCurveTo(4, -6, 0, 2);
    }, '#243b2f', 1.4);
    line(ctx, '#7f8e50', 1.7, p => {
      p.moveTo(0, -1);
      p.quadraticCurveTo(2, -19, 0, -33);
      p.moveTo(1, -12);
      p.lineTo(-5, -18);
      p.moveTo(1, -17);
      p.lineTo(5, -21);
      p.moveTo(1, -21);
      p.lineTo(-3, -26);
    });
    ctx.restore();
  }
  ctx.restore();
}

function drawCanopy(ctx, x, y, scale, tone) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  oval(ctx, 8, 15, 53, 19, '#182c256b', -.04);
  const colors = [
    ['#274139', '#3b5742', '#50694a'],
    ['#2e4738', '#456040', '#5f7449'],
    ['#294038', '#3d5544', '#536a4e'],
  ][tone];

  shape(ctx, colors[0], p => {
    p.moveTo(-48, 9);
    p.bezierCurveTo(-61, 4, -56, -11, -48, -16);
    p.bezierCurveTo(-58, -30, -44, -43, -33, -42);
    p.bezierCurveTo(-29, -53, -17, -57, -6, -48);
    p.bezierCurveTo(7, -61, 20, -52, 25, -43);
    p.bezierCurveTo(42, -48, 53, -38, 50, -27);
    p.bezierCurveTo(68, -25, 69, -9, 56, -1);
    p.bezierCurveTo(61, 11, 46, 23, 32, 17);
    p.bezierCurveTo(24, 30, 8, 28, -4, 22);
    p.bezierCurveTo(-21, 31, -30, 22, -34, 17);
    p.quadraticCurveTo(-46, 22, -48, 9);
  }, '#243930', 3.7);

  shape(ctx, colors[1], p => {
    p.moveTo(-45, -7);
    p.bezierCurveTo(-39, -16, -44, -25, -32, -32);
    p.bezierCurveTo(-27, -48, -12, -48, -5, -40);
    p.bezierCurveTo(11, -50, 22, -36, 22, -30);
    p.bezierCurveTo(37, -39, 51, -30, 47, -21);
    p.bezierCurveTo(58, -13, 49, -3, 37, -6);
    p.bezierCurveTo(30, 5, 20, 8, 11, 2);
    p.bezierCurveTo(3, 12, -16, 10, -20, 2);
    p.bezierCurveTo(-32, 7, -44, 3, -45, -7);
  });

  shape(ctx, colors[2], p => {
    p.moveTo(-30, -31);
    p.bezierCurveTo(-24, -42, -13, -44, -6, -37);
    p.bezierCurveTo(3, -41, 11, -39, 15, -33);
    p.bezierCurveTo(5, -31, -2, -26, -7, -25);
    p.quadraticCurveTo(-22, -28, -30, -22);
  });

  line(ctx, '#72905c66', 1.9, p => {
    p.moveTo(-34, -16);
    p.quadraticCurveTo(-30, -22, -23, -22);
    p.moveTo(10, -14);
    p.quadraticCurveTo(14, -20, 21, -20);
    p.moveTo(29, -10);
    p.quadraticCurveTo(32, -14, 38, -15);
  });
  ctx.restore();
}

export function drawRange(ctx, width, height) {
  ctx.save();
  ctx.scale(width / FIELD_WIDTH, height / FIELD_HEIGHT);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawClearing(ctx);

  const random = seededRandom(40863);
  for (let i = 0; i < 820; i++) {
    const x = random() * FIELD_WIDTH;
    const y = random() * FIELD_HEIGHT;
    const shade = random() > .56 ? '#8b945142' : '#233c3249';
    oval(ctx, x, y, .5 + random() * 1.7, .4 + random() * .7, shade, -.18);
  }

  for (let i = 0; i < 79; i++) {
    const x = random() * FIELD_WIDTH;
    const y = random() * FIELD_HEIGHT;
    const edge = x < 155 || x > 701 || y < 115 || y > 406;
    const scale = .34 + random() * (edge ? .46 : .22);
    drawGrass(ctx, x, y, scale, edge ? '#8b995249' : '#73814e58');
  }

  for (const [x, y, scale] of [[61, 200, .95], [77, 212, .51], [754, 162, .81], [772, 168, .48], [103, 440, 1.02], [128, 446, .51], [689, 448, .85], [728, 424, .47], [226, 92, .56]]) {
    drawStone(ctx, x, y, scale);
  }

  for (const [x, y, scale, tilt] of [[117, 123, .86, -.38], [163, 110, .61, -.31], [706, 107, .96, .34], [752, 113, .6, .54], [34, 376, 1.06, -.31], [126, 436, .63, .26], [175, 469, .71, -.37], [790, 397, 1.03, .37], [747, 431, .78, -.17], [640, 479, .64, .24]]) {
    drawFern(ctx, x, y, scale, tilt);
  }

  const canopies = [
    [-5, 65, 1.5, 0], [69, 47, 1.34, 1], [151, 39, 1.07, 2], [233, 29, .91, 1],
    [336, 12, 1.21, 0], [465, 17, 1.03, 2], [550, 24, .96, 1], [646, 22, 1.27, 0],
    [753, 39, 1.22, 1], [835, 71, 1.52, 0], [859, 141, .97, 2], [-21, 136, 1.05, 2],
    [-15, 466, 1.36, 0], [53, 523, 1.34, 1], [140, 537, .9, 2], [379, 553, 1.11, 1],
    [548, 549, 1.06, 0], [681, 531, 1.08, 1], [780, 509, 1.31, 2], [849, 469, 1.49, 0],
  ];
  canopies.forEach(([x, y, scale, tone]) => drawCanopy(ctx, x, y, scale, tone));

  for (const [x, y, scale] of [[97, 153, .52], [762, 92, .61], [31, 243, .42], [177, 478, .66], [742, 469, .69], [810, 393, .53]]) {
    oval(ctx, x, y, 14 * scale, 5 * scale, '#1a302a81');
    drawGrass(ctx, x - 4, y, scale, '#647d47');
    drawGrass(ctx, x + 5, y + 3, scale * .64, '#92a25a');
  }
  ctx.restore();
}

export function drawTarget(ctx, x, y, hit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  oval(ctx, 2, 21, 23, 7, '#1e2d2684');
  const wobble = Math.sin((1 - hit) * 22) * hit * .1;
  ctx.rotate(wobble);

  line(ctx, INK, 6, p => {
    p.moveTo(-7, 7);
    p.lineTo(-13, 24);
    p.moveTo(8, 7);
    p.lineTo(15, 24);
  });
  line(ctx, '#ad8050', 2.7, p => {
    p.moveTo(-7, 8);
    p.lineTo(-13, 23);
    p.moveTo(8, 8);
    p.lineTo(14, 23);
  });
  line(ctx, '#55412e', 2.7, p => {
    p.moveTo(-11, 17);
    p.lineTo(12, 17);
  });

  oval(ctx, 2, 1.4, 21.1, 18.4, INK, -.11);
  oval(ctx, 1.8, 1.5, 18.8, 16.3, '#7f5c3a', -.11);
  oval(ctx, 0, 0, 18.2, 15.3, '#d4b57e', -.11);
  oval(ctx, 0, 0, 14.2, 11.8, '#885a45', -.11);
  oval(ctx, 0, 0, 11.1, 9.2, '#e6c792', -.11);
  oval(ctx, 0, 0, 7.2, 6.1, '#9b4c42', -.11);
  oval(ctx, 0, 0, 3.8, 3.2, '#f1ce90', -.11);

  line(ctx, '#f3dba77a', 1.6, p => {
    p.moveTo(-14, -7);
    p.quadraticCurveTo(-9, -14, .5, -13);
  });
  if (hit > 0) oval(ctx, 0, 0, 18.2, 15.3, 'rgba(255,231,154,' + hit * .52 + ')', -.11);
  ctx.restore();
}
