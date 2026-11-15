import { CANNON_GROUND_Y } from '../cannon';
import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { CANNON_TOWER_RELEASE, drawCannonTowerFlash } from './gun';

type Tier = 0 | 1 | 2;
type Side = -1 | 1;
type Point = readonly [number, number];

const TURRETS = [
  {
    range: 33, span: 13.5, cylinder: 6.5, hub: 25,
    steel: ['#9ea6a1', '#657176', '#343844'],
    brass: ['#e0ba7d', '#a77f4c', '#69503d'],
    paint: ['#b59365', '#816044', '#533c37'],
    timber: ['#a97b57', '#81533d', '#513a37'],
  },
  {
    range: 36, span: 14, cylinder: 6.8, hub: 27,
    steel: ['#bdccc6', '#788d96', '#394653'],
    brass: ['#cee1d8', '#82a1a1', '#495e66'],
    paint: ['#799a99', '#4a666f', '#38454f'],
    timber: ['#9b8470', '#72604d', '#504247'],
  },
  {
    range: 39, span: 15, cylinder: 7.25, hub: 29,
    steel: ['#aab5ba', '#626c80', '#383244'],
    brass: ['#ffe09a', '#c78d4d', '#75543d'],
    paint: ['#c48866', '#91564e', '#5b424d'],
    timber: ['#bb8b5d', '#976447', '#5b4039'],
  },
] as const;

type Turret = typeof TURRETS[Tier];
type Colors = readonly [string, string, string];
type Project = (forward: number, across: number, lift?: number) => Point;

const TAU = 2 * Math.PI;
const BARREL_HEIGHT = 21;
const RECOIL_LENGTH = 6.5;
const LIGHT_ANGLE = Math.atan2(-1, -.45);

function firingSide(shotIndex: number): Side {
  return shotIndex % 2 === 0 ? 1 : -1;
}

function modelPose(angle: number, cycle: number) {
  const yaw = Math.atan2(Math.sin(angle) / CANNON_GROUND_Y, Math.cos(angle));
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const depth = Math.hypot(cos, sin * CANNON_GROUND_Y);
  const afterRelease = cycle - CANNON_TOWER_RELEASE;
  const recoil = afterRelease < 0 ? 0 : RECOIL_LENGTH * Math.max(0, 1 - afterRelease / .31) ** 2;
  const project: Project = (forward, across, lift = 0) => [
    cos * forward - sin * across,
    (sin * forward + cos * across) * CANNON_GROUND_Y - lift,
  ];
  return { yaw, depth, recoil, project };
}

export function getTwinCannonTowerMuzzle(tier: Tier, angle: number, cycle: number, shotIndex = 0) {
  const turret = TURRETS[tier];
  const { recoil, project } = modelPose(angle, cycle);
  const [x, y] = project(turret.range - recoil, firingSide(shotIndex) * turret.span, BARREL_HEIGHT);
  return { x, y };
}

function litPaint(ctx: CanvasRenderingContext2D, radius: number, y: number, colors: Colors) {
  const shade = ctx.createLinearGradient(-radius * .66, y - radius * .65, radius * .65, y + radius * .65);
  shade.addColorStop(0, colors[0]);
  shade.addColorStop(.5, colors[1]);
  shade.addColorStop(1, colors[2]);
  return shade;
}

function drawTurntable(ctx: CanvasRenderingContext2D, turret: Turret, yaw: number, tier: Tier) {
  const { hub, brass, timber } = turret;
  const top = -5;
  const height = hub * CANNON_GROUND_Y * .8;
  const ringPoint = (radius: number, index: number): Point => {
    const angle = yaw + index * TAU / 8;
    return [radius * Math.cos(angle), top + radius * CANNON_GROUND_Y * .8 * Math.sin(angle)];
  };
  const rim: Point[] = [];
  for (let index = 0; index < 8; index++) {
    rim.push(ringPoint(hub - 2, index - .22), ringPoint(hub, index - .12),
      ringPoint(hub, index + .12), ringPoint(hub - 2, index + .23));
  }
  const traceRim = (p: CanvasRenderingContext2D, drop: number) => {
    const [[x, y], ...points] = rim;
    p.moveTo(x, y + drop);
    for (const [px, py] of points) p.lineTo(px, py + drop);
  };
  shape(ctx, wash(ctx, top - height, top + height + 6, [[0, brass[1]], [.64, brass[2]], [1, ink]]),
    2.4, p => traceRim(p, 5));
  shape(ctx, litPaint(ctx, hub, top, brass), 2.1, p => traceRim(p, 0));
  shape(ctx, litPaint(ctx, hub, top, timber), 1.75, p => p.ellipse(0, top, hub - 6, height - 3.7, 0, 0, TAU));
  for (const seam of [-.7, .7]) {
    const along = ringPoint(hub * .62, seam);
    const opposite = ringPoint(hub * .62, 4 - seam);
    line(ctx, timber[2], 1.1, p => {
      p.moveTo(...along);
      p.quadraticCurveTo((along[0] + opposite[0]) / 2 - 1, (along[1] + opposite[1]) / 2 + .7, ...opposite);
    });
  }
  for (let index = 0; index < 8; index++) {
    const [x, y] = ringPoint(hub - 4, index);
    oval(ctx, x, y + .2, tier === 2 ? 1.85 : 1.55, 1.14, brass[2]);
    oval(ctx, x - .2, y - .3, 1.08, .62, brass[0]);
  }
}

function drawCradle(ctx: CanvasRenderingContext2D, turret: Turret, project: Project, tier: Tier) {
  const span = turret.span;
  const trace = (p: CanvasRenderingContext2D, lift: number) => {
    p.moveTo(...project(-25, -span + 1, lift));
    p.lineTo(...project(-18, -span - 5, lift));
    p.lineTo(...project(9, -span - 5, lift));
    p.quadraticCurveTo(...project(16, -span - 5, lift), ...project(17, -span + 1, lift));
    p.lineTo(...project(17, span - 1, lift));
    p.quadraticCurveTo(...project(16, span + 5, lift), ...project(9, span + 5, lift));
    p.lineTo(...project(-18, span + 5, lift));
    p.lineTo(...project(-25, span - 1, lift));
  };
  shape(ctx, turret.paint[2], 2.6, p => trace(p, 5));
  shape(ctx, litPaint(ctx, span * 1.65, -12, turret.paint), 2.3, p => trace(p, 12));
  line(ctx, turret.brass[2], 4.4 + tier * .65, p => {
    p.moveTo(...project(-19, -span - 1, 12));
    p.lineTo(...project(-19, span + 1, 12));
  });
  line(ctx, turret.brass[0], 1.16, p => {
    p.moveTo(...project(-20, -span - .5, 12.7));
    p.lineTo(...project(-20, span + .5, 12.7));
  });
  const [x, y] = project(-19, 0, 12.7);
  shape(ctx, turret.brass[1], 1.35, p => p.ellipse(x, y, 3.1 + tier * .35, 2.2, 0, 0, TAU));
  oval(ctx, x - .5, y - .52, 1.42, .68, turret.brass[0]);
}

function curvedMetal(ctx: CanvasRenderingContext2D, radius: number, highlight: number, colors: Colors) {
  return wash(ctx, -radius, radius, [
    [0, colors[2]], [.50 * highlight, colors[1]], [highlight, colors[0]],
    [highlight + .52 * (1 - highlight), colors[1]], [1, colors[2]],
  ]);
}

function drawBand(ctx: CanvasRenderingContext2D, turret: Turret, position: number, radius: number, width: number, highlight: number) {
  shape(ctx, curvedMetal(ctx, radius, highlight, turret.brass), 1.35, p => {
    p.moveTo(position, -radius);
    p.quadraticCurveTo(position + 2.1, 0, position, radius);
    p.lineTo(position + width, radius);
    p.quadraticCurveTo(position + width + 2.2, 0, position + width, -radius);
    p.quadraticCurveTo(position + width * .48, -radius - .65, position, -radius);
  });
}

function drawBarrel(ctx: CanvasRenderingContext2D, turret: Turret, tier: Tier, angle: number, depth: number, origin: Point) {
  const tip = turret.range * depth;
  const back = -24 * depth;
  const radius = turret.cylinder;
  const lip = radius + .15;
  const lightAcross = Math.sin(LIGHT_ANGLE - angle);
  const lightAlong = Math.cos(LIGHT_ANGLE - angle);
  const highlight = .50 + .32 * lightAcross;
  ctx.save();
  ctx.translate(...origin);
  ctx.rotate(angle);
  shape(ctx, curvedMetal(ctx, radius, highlight, turret.steel), 2.1, p => {
    p.moveTo(back, -radius * .54);
    p.quadraticCurveTo(back + 1, -radius, back + 8, -radius);
    p.bezierCurveTo(tip * .34, -radius, tip * .67, -radius * .7, tip - 4, -radius * .72);
    p.quadraticCurveTo(tip + 1.5, -radius * .61, tip + 1.5, 0);
    p.quadraticCurveTo(tip + 1.5, radius * .65, tip - 4, radius * .72);
    p.bezierCurveTo(tip * .67, radius * .74, tip * .30, radius, back + 8, radius);
    p.quadraticCurveTo(back, radius * .9, back, radius * .54);
  });
  const gleam = lightAcross * radius * .69;
  line(ctx, turret.steel[0], 1.2, p => {
    p.moveTo(back + 10.4, gleam);
    p.bezierCurveTo(-3, gleam * .97, tip * .47, gleam * .81, tip - 11.2, gleam * .78);
  });
  drawBand(ctx, turret, back + 3.4, radius * 1.1, 4 + tier * .45, highlight);
  if (tier === 2) drawBand(ctx, turret, tip * .27, radius * .9, 3.2, highlight);
  drawBand(ctx, turret, tip - 7.6, lip, 6.5, highlight);
  const faceWidth = 2.15 + 2.9 * Math.abs(Math.sin(angle));
  const faceSpan = Math.hypot(lightAlong * faceWidth, lightAcross * lip);
  const rim = ctx.createLinearGradient(tip + faceSpan * lightAlong, faceSpan * lightAcross,
    tip - faceSpan * lightAlong, -faceSpan * lightAcross);
  rim.addColorStop(0, turret.brass[0]);
  rim.addColorStop(.47, turret.brass[1]);
  rim.addColorStop(1, turret.brass[2]);
  shape(ctx, rim, 2.05, p => p.ellipse(tip, 0, faceWidth, lip, 0, 0, TAU));
  oval(ctx, tip + .3, 0, faceWidth * (.54 + .14 * Math.sin(angle)), lip * .64, '#21202b');
  ctx.restore();
}

export function drawTwinCannonTowerGun(ctx: CanvasRenderingContext2D, tier: Tier, angle: number, cycle: number, shotIndex = 0): void {
  const turret = TURRETS[tier];
  const { yaw, depth, recoil, project } = modelPose(angle, cycle);
  const active = firingSide(shotIndex);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawTurntable(ctx, turret, yaw, tier);
  drawCradle(ctx, turret, project, tier);
  for (const side of [-1, 1] as const) {
    const offset = side === active ? -recoil : 0;
    const across = side * turret.span;
    drawBarrel(ctx, turret, tier, angle, depth, project(offset, across, BARREL_HEIGHT));
    const [x, y] = project(-14 + offset, across, BARREL_HEIGHT + 2.9);
    oval(ctx, x, y, 2.05, 1.35, turret.brass[2]);
    oval(ctx, x - .2, y - .35, 1.1, .55, turret.brass[0]);
    if (side === active && cycle > CANNON_TOWER_RELEASE - .16 && cycle < CANNON_TOWER_RELEASE) {
      ctx.save();
      ctx.globalAlpha = Math.sin(Math.PI * (CANNON_TOWER_RELEASE - cycle) / .16);
      oval(ctx, x, y - .35, 1.75, 1.2, '#ffd473');
      line(ctx, '#ffae63', 1.1, p => { p.moveTo(x + 1, y - 3.6); p.lineTo(x + 3.35, y - 5.4); });
      ctx.restore();
    }
  }
  drawCannonTowerFlash(ctx, tier, angle, cycle, getTwinCannonTowerMuzzle(tier, angle, cycle, shotIndex));
  ctx.restore();
}
