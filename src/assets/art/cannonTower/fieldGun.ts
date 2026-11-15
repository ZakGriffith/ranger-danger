import { CANNON_GROUND_Y } from '../cannon';
import { line, oval, shape, wash } from '../forestEnemies/paint';
import { CANNON_TOWER_RELEASE, drawCannonTowerFlash } from './gun';

type Tier = 0 | 1 | 2;
type Project = (forward: number, side: number, lift?: number) => readonly [number, number];

const TIERS = [
  {
    muzzle: 50, breech: 9, mouth: 6.5, fork: 13,
    metalLight: '#abb1a3', metal: '#626f68', metalDark: '#353d41',
    brassLight: '#e6bf79', brass: '#ae7b4b', brassDark: '#72513f',
    woodLight: '#c59460', wood: '#966244', woodDark: '#593f3d',
  },
  {
    muzzle: 54, breech: 9.9, mouth: 7.2, fork: 14,
    metalLight: '#a9cac0', metal: '#608d83', metalDark: '#375054',
    brassLight: '#e1d298', brass: '#a68b5b', brassDark: '#6d5b49',
    woodLight: '#b49a75', wood: '#877352', woodDark: '#52423e',
  },
  {
    muzzle: 58, breech: 11, mouth: 8, fork: 15,
    metalLight: '#ebc886', metal: '#aa7c50', metalDark: '#644438',
    brassLight: '#fff0b4', brass: '#d7a55f', brassDark: '#815837',
    woodLight: '#c58b63', wood: '#965743', woodDark: '#603b40',
  },
] as const;
type FieldGun = typeof TIERS[Tier];

const BARREL_Y = -22;
const LIGHT_ANGLE = Math.atan2(-1, -.55);

function pose(model: FieldGun, angle: number, cycle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const depth = 1 / Math.hypot(cos, sin / CANNON_GROUND_Y);
  const afterRelease = cycle - CANNON_TOWER_RELEASE;
  const recoil = afterRelease < 0 ? 0 : Math.max(0, 1 - afterRelease / .29) ** 2 * 8.5 * depth;
  return { cos, sin, depth, recoil };
}

export function getFieldGunMuzzle(tier: Tier, angle: number, cycle: number): { x: number; y: number } {
  const model = TIERS[tier];
  const { cos, sin, depth, recoil } = pose(model, angle, cycle);
  const forward = model.muzzle * depth - recoil;
  return { x: cos * forward, y: BARREL_Y + sin * forward };
}

function turntable(ctx: CanvasRenderingContext2D, model: FieldGun) {
  const width = model.fork + 10;
  shape(ctx, model.woodDark, 2.5, p => {
    p.moveTo(-width, -1);
    p.lineTo(-width, 3.5);
    p.bezierCurveTo(-width, 16.7, width, 16.7, width, 3.5);
    p.lineTo(width, -1);
  });
  shape(ctx, wash(ctx, -11, 10, [[0, '#788076'], [.6, '#55625d'], [1, '#404548']]), 2.3, p => {
    p.ellipse(0, -1.5, width, 10.5, 0, 0, Math.PI * 2);
  });
  line(ctx, model.brass, 1.4, p => {
    p.moveTo(-width + 3.1, 4);
    p.bezierCurveTo(-width + 7, 12, width - 7.7, 12, width - 3.4, 4.7);
  });
  for (const [x, y] of [[-width + 5, -.2], [-10, 5.6], [11, 5.5], [width - 5, -.5]] as const) {
    shape(ctx, model.brassLight, .85, p => p.ellipse(x, y, 1.55, .95, 0, 0, Math.PI * 2));
  }
}

function forkRail(ctx: CanvasRenderingContext2D, model: FieldGun, project: Project, side: -1 | 1) {
  const rail = (x: number, width: number, lift = 0) => project(x, side * width, lift);
  const outside = model.fork + 2;
  const inside = model.fork - 3.8;
  const timberFill = wash(ctx, -24, 14, [[0, model.woodLight], [.49, model.wood], [1, model.woodDark]]);
  shape(ctx, timberFill, 2.2, p => {
    p.moveTo(...rail(-35, outside + .8, 1));
    p.quadraticCurveTo(...rail(-36, outside + 1, 6), ...rail(-29, outside, 7));
    p.lineTo(...rail(15, outside, 7));
    p.quadraticCurveTo(...rail(23, outside, 6), ...rail(20, outside, 1));
    p.quadraticCurveTo(...rail(-7, outside + .5, -1), ...rail(-35, outside + .8, 1));
  });
  shape(ctx, model.woodLight, 1.8, p => {
    p.moveTo(...rail(-32, outside + .6, 7));
    p.quadraticCurveTo(...rail(-37, inside + .2, 7), ...rail(-30, inside, 7));
    p.lineTo(...rail(16, inside, 7));
    p.quadraticCurveTo(...rail(24, inside, 7), ...rail(20, outside, 7));
    p.quadraticCurveTo(...rail(-5, outside - .9, 7), ...rail(-32, outside + .6, 7));
  });
  line(ctx, model.wood, 1.25, p => {
    p.moveTo(...rail(-29, inside + 2.25, 7));
    p.quadraticCurveTo(...rail(-20, inside + 3.45, 7), ...rail(-12, inside + 2.75, 7));
    p.moveTo(...rail(5, inside + 3.2, 7));
    p.quadraticCurveTo(...rail(9, inside + 2.5, 7), ...rail(16.7, inside + 2.75, 7));
  });
  shape(ctx, timberFill, 2.35, p => {
    p.moveTo(...rail(-15, outside - .2, 6.5));
    p.lineTo(...rail(-10, outside - .2, 18));
    p.quadraticCurveTo(...rail(-7, outside - .2, 23), ...rail(-1, outside - .5, 22.8));
    p.quadraticCurveTo(...rail(5, outside - .4, 21), ...rail(9, outside - .2, 6.5));
  });
  line(ctx, model.woodLight, 1.25, p => {
    p.moveTo(...rail(-10.8, outside - .3, 9.8));
    p.lineTo(...rail(-7.8, outside - .3, 17.7));
  });
  for (const [x, lift, radius] of [[-29.5, 7, 1.55], [16.8, 7, 1.55], [-2.5, 16.7, 3.55]] as const) {
    const [px, py] = rail(x, outside - 1.3, lift);
    shape(ctx, model.brass, 1.35, p => p.ellipse(px, py, radius, radius * .86, 0, 0, Math.PI * 2));
    oval(ctx, px - radius * .21, py - radius * .22, radius * .42, radius * .28, model.brassLight);
  }
}

function cylinderGradient(ctx: CanvasRenderingContext2D, radius: number, lightAcross: number, light: string, mid: string, dark: string) {
  const shine = .5 + .29 * lightAcross;
  return wash(ctx, -radius, radius, [
    [0, dark], [shine * .5, mid], [shine, light], [shine + .32 * (1 - shine), mid], [1, dark],
  ]);
}

function collar(ctx: CanvasRenderingContext2D, model: FieldGun, x: number, radius: number, width: number, lightAcross: number) {
  const brass = cylinderGradient(ctx, radius, lightAcross, model.brassLight, model.brass, model.brassDark);
  shape(ctx, brass, 1.5, p => {
    p.moveTo(x - width, -radius);
    p.quadraticCurveTo(x + 1.3 - width, 0, x - width, radius);
    p.quadraticCurveTo(x - width * .45, radius + 1, x, radius);
    p.quadraticCurveTo(x + 1.9, 0, x, -radius);
    p.quadraticCurveTo(x - width * .45, -radius - 1, x - width, -radius);
  });
}

function barrel(ctx: CanvasRenderingContext2D, model: FieldGun, tier: Tier, angle: number, cycle: number) {
  const { cos, sin, depth, recoil } = pose(model, angle, cycle);
  const lightAcross = Math.sin(LIGHT_ANGLE - angle);
  const lightAlong = Math.cos(LIGHT_ANGLE - angle);
  const breech = -19 * depth;
  const muzzle = model.muzzle * depth;
  const radius = model.breech;
  const bore = model.mouth * .69;
  const rimWidth = 1.95 + 3.1 * Math.abs(sin);
  const metal = '#212630';

  ctx.save();
  ctx.translate(-cos * recoil, BARREL_Y - sin * recoil);
  ctx.rotate(angle);
  const bronze = cylinderGradient(ctx, radius, lightAcross, model.metalLight, model.metal, model.metalDark);
  shape(ctx, bronze, 2.85, p => {
    p.moveTo(breech - 11, -2.8);
    p.quadraticCurveTo(breech - 15, 0, breech - 11, 3.3);
    p.lineTo(breech - 1.6, 3.5);
    p.quadraticCurveTo(breech - .3, radius * .89, breech + 5.6, radius * .94);
    p.bezierCurveTo(breech + 17, radius * 1.04, muzzle * .48, bore * 1.13, muzzle - 2.5, bore);
    p.lineTo(muzzle - 2.5, -bore);
    p.bezierCurveTo(muzzle * .5, -bore * .98, breech + 17, -radius * 1.09, breech + 4.4, -radius);
    p.quadraticCurveTo(breech - 1.15, -radius * .89, breech - 1.6, -3.9);
  });
  const sheen = lightAcross * .68;
  line(ctx, model.metalLight, 1.35, p => {
    p.moveTo(breech + 7, sheen * radius * .94);
    p.bezierCurveTo(breech + 17, sheen * radius, muzzle * .44, sheen * bore * 1.05, muzzle * .76, sheen * bore);
  });
  collar(ctx, model, breech + 10, radius * 1.04, 5.4, lightAcross);
  if (tier > 0) collar(ctx, model, muzzle * .2, radius * .86, tier === 2 ? 4.5 : 3.2, lightAcross);
  collar(ctx, model, muzzle - .9, model.mouth, 5.2, lightAcross);

  const lightSpan = Math.hypot(lightAlong * rimWidth, lightAcross * model.mouth);
  const rim = ctx.createLinearGradient(muzzle + lightAlong * lightSpan, lightAcross * lightSpan,
    muzzle - lightAlong * lightSpan, -lightAcross * lightSpan);
  rim.addColorStop(0, model.brassLight);
  rim.addColorStop(.51, model.brass);
  rim.addColorStop(1, model.brassDark);
  shape(ctx, rim, 1.95, p => p.ellipse(muzzle, 0, rimWidth, model.mouth, 0, 0, Math.PI * 2));
  oval(ctx, muzzle + rimWidth * .13, 0, rimWidth * .53, bore * .86, metal);
  const rimArc = Math.atan2(lightAcross * model.mouth, lightAlong * rimWidth);
  line(ctx, model.brassLight, 1.05, p => {
    p.ellipse(muzzle, 0, rimWidth * .81, model.mouth * .8, 0, rimArc - .52, rimArc + .52);
  });
  ctx.restore();

  const vent = breech + 4.25 - recoil;
  const x = cos * vent;
  const y = BARREL_Y + sin * vent - 3.4;
  shape(ctx, model.brass, 1, p => p.ellipse(x, y, 2.7, 1.65, 0, 0, Math.PI * 2));
  oval(ctx, x + .15, y - .15, 1.15, .76, metal);
  const spark = Math.max(0, 1 - Math.abs(cycle - CANNON_TOWER_RELEASE + .075) / .095);
  if (spark > 0) {
    ctx.save();
    ctx.globalAlpha = spark;
    oval(ctx, x, y - 1.1, 1.6, 1.4, '#ffbb61');
    line(ctx, '#ffe5a2', 1, p => {
      p.moveTo(x + 1.3, y - 3.8); p.lineTo(x + 2.8, y - 5.7);
      p.moveTo(x - 1.7, y - 2.5); p.lineTo(x - 4.3, y - 4.5);
    });
    ctx.restore();
  }
}

export function drawFieldGun(ctx: CanvasRenderingContext2D, tier: Tier, angle: number, cycle: number): void {
  const model = TIERS[tier];
  const { cos, sin, depth } = pose(model, angle, cycle);
  const project: Project = (forward, side, lift = 0) => [
    (cos * forward - sin * side / CANNON_GROUND_Y) * depth,
    (sin * forward + cos * side * CANNON_GROUND_Y) * depth - lift,
  ];
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  turntable(ctx, model);
  forkRail(ctx, model, project, -1);
  forkRail(ctx, model, project, 1);
  barrel(ctx, model, tier, angle, cycle);
  drawCannonTowerFlash(ctx, tier, angle, cycle, getFieldGunMuzzle(tier, angle, cycle));
  ctx.restore();
}
