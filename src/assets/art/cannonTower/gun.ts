import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { CANNON_GROUND_Y } from '../cannon';

type Tier = 0 | 1 | 2;
type Point = readonly [number, number];

const GUNS = [
  {
    length: 39, breech: 12, lip: 10, carriage: 19,
    metalLight: '#859290', metal: '#56636b', metalDark: '#333947', metalDeep: '#292d39',
    bandLight: '#c1ad85', band: '#8d765e', bandDark: '#55493e',
    woodLight: '#b6855b', wood: '#895a47', woodDark: '#5e4142',
  },
  {
    length: 43, breech: 13.4, lip: 11.5, carriage: 21,
    metalLight: '#a6b8b3', metal: '#667e8a', metalDark: '#3d4a5f', metalDeep: '#283442',
    bandLight: '#ccdad4', band: '#829da5', bandDark: '#485a6a',
    woodLight: '#9b8870', wood: '#776050', woodDark: '#53444a',
  },
  {
    length: 46, breech: 15, lip: 13.8, carriage: 22.5,
    metalLight: '#929ca1', metal: '#596473', metalDark: '#362f44', metalDeep: '#262839',
    bandLight: '#f5d599', band: '#c59856', bandDark: '#795734',
    woodLight: '#bb8c64', wood: '#93634c', woodDark: '#684550',
  },
] as const;
type Gun = typeof GUNS[Tier];

export const CANNON_TOWER_RELEASE = .35;
export const CANNON_TOWER_BARREL_Y = -20;
export const CANNON_TOWER_BARREL_RISE = .28;
export const CANNON_TOWER_RECOIL_DURATION = .28;

const IGNITION_PEAK = CANNON_TOWER_RELEASE - .095;
const IGNITION_DURATION = .12;
const LIGHT_ANGLE = Math.atan2(-1, -.3);

export const CANNON_TOWER_IGNITION_START = IGNITION_PEAK - IGNITION_DURATION;

function pose(gun: Gun, angle: number, cycle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const depth = 1 / Math.hypot(cos, sin / CANNON_GROUND_Y);
  const barrelY = sin - CANNON_TOWER_BARREL_RISE;
  const barrelAngle = Math.atan2(barrelY, cos);
  const barrelDepth = depth * Math.hypot(cos, barrelY);
  const afterRelease = cycle - CANNON_TOWER_RELEASE;
  const recoil = afterRelease < 0 ? 0 : Math.max(0, 1 - afterRelease / CANNON_TOWER_RECOIL_DURATION) ** 2;
  const forward = gun.length * depth - recoil * 7.5 * depth;
  return { cos, sin, depth, barrelY, barrelAngle, barrelDepth, recoil, forward };
}

function muzzleOffset({ cos, barrelY, forward }: ReturnType<typeof pose>) {
  return { x: cos * forward, y: CANNON_TOWER_BARREL_Y + barrelY * forward };
}

export function getCannonTowerMuzzle(tier: Tier, angle: number, cycle: number): { x: number; y: number } {
  return muzzleOffset(pose(GUNS[tier], angle, cycle));
}

function timber(ctx: CanvasRenderingContext2D, trace: (p: CanvasRenderingContext2D) => void, light: string, dark: string, outline = 2.35) {
  shape(ctx, wash(ctx, -17, 9, [[0, light], [1, dark]]), outline, trace);
}

function plate(ctx: CanvasRenderingContext2D, gun: Gun, tier: Tier) {
  const radius = gun.carriage + 5;
  shape(ctx, gun.woodDark, 2.75, p => {
    p.moveTo(-radius, -1);
    p.bezierCurveTo(-radius, -16, radius, -16, radius, -1);
    p.lineTo(radius, 4);
    p.bezierCurveTo(radius - 1, 16.6, -radius + 1, 16.6, -radius, 4);
  });
  shape(ctx, wash(ctx, -15, 10, [[0, gun.woodLight], [.53, gun.wood], [1, gun.woodDark]]), 2.15, p => {
    p.moveTo(-radius, -1.8);
    p.bezierCurveTo(-radius, -15.5, radius, -15.5, radius, -1.8);
    p.bezierCurveTo(radius, 11, -radius, 11, -radius, -1.8);
  });
  line(ctx, gun.band, tier === 2 ? 2.1 : 1.55, p => {
    p.moveTo(-radius + 2, 3);
    p.bezierCurveTo(-radius + 7, 12.7, radius - 7, 12.7, radius - 2, 3);
  });
  for (const [x, y] of [[-radius + 5, -1], [radius - 5, -1], [-radius * .63, 4], [radius * .63, 4]] as const) {
    oval(ctx, x, y, 1.75, 1.1, ink);
    oval(ctx, x - .21, y - .23, 1.1, .66, gun.bandLight);
  }
}

function timberCheek(ctx: CanvasRenderingContext2D, gun: Gun, project: (a: number, side: number, lift?: number) => Point, side: -1 | 1) {
  const offset = gun.breech * .68;
  const at = (a: number, lift: number) => project(a, side * offset, lift);
  const rail = (a: number, lift: number) => project(a, side * (offset + 4), lift);
  timber(ctx, p => {
    p.moveTo(...rail(-22, 2));
    p.lineTo(...rail(20, 2));
    p.quadraticCurveTo(...rail(26, 3), ...rail(24, 7));
    p.lineTo(...rail(13, 10));
    p.quadraticCurveTo(...rail(9, 21), ...rail(4, 23.5));
    p.quadraticCurveTo(...rail(-6, 27), ...rail(-11, 17));
    p.lineTo(...rail(-17, 10));
    p.quadraticCurveTo(...rail(-23, 7), ...rail(-22, 2));
  }, gun.woodLight, gun.woodDark);
  timber(ctx, p => {
    p.moveTo(...rail(-6, 22));
    p.quadraticCurveTo(...at(-7, 23.5), ...at(-2, 25.2));
    p.quadraticCurveTo(...at(5, 25), ...at(8, 18));
    p.lineTo(...rail(8, 18));
    p.quadraticCurveTo(...rail(3, 26), ...rail(-6, 22));
  }, gun.woodLight, gun.wood, 1.3);
  line(ctx, gun.woodLight, 1.1, p => {
    p.moveTo(...rail(-18, 5));
    p.quadraticCurveTo(...rail(-4, 6.6), ...rail(13, 6.4));
    p.lineTo(...rail(20, 5.8));
  });
  const [x, y] = rail(-2, 17);
  shape(ctx, gun.band, 1.5, p => p.ellipse(x, y, 4.8, 4.5, 0, 0, 2 * Math.PI));
  oval(ctx, x - .6, y - .7, 2.5, 2.1, gun.bandLight);
  line(ctx, gun.bandDark, .9, p => {
    p.moveTo(x - 1.3, y + .6); p.lineTo(x + 1.7, y + .6);
  });
}

function touchhole(ctx: CanvasRenderingContext2D, gun: Gun, { cos, barrelY, depth, recoil }: ReturnType<typeof pose>, cycle: number) {
  const breech = -11 * depth - recoil * 7.5 * depth;
  const x = cos * breech;
  const y = CANNON_TOWER_BARREL_Y + barrelY * breech - gun.breech * .6;
  const l = Math.max(0, 1 - Math.abs(cycle - IGNITION_PEAK) / IGNITION_DURATION);
  shape(ctx, gun.band, 1.4, p => p.ellipse(x, y, 3.9, 2.6, 0, 0, 2 * Math.PI));
  oval(ctx, x + .2, y - .2, 1.6, 1.05, '#28232b');
  if (l > 0) {
    ctx.save();
    ctx.globalAlpha = l;
    oval(ctx, x, y - 1.3, 1.85, 1.5, '#ffb359');
    line(ctx, '#ffe6a3', .95, p => {
      p.moveTo(x + 1, y - 5.2); p.lineTo(x + 2.8, y - 6.8);
      p.moveTo(x - 1.6, y - 2.2); p.lineTo(x - 4.8, y - 4.1);
    });
    ctx.restore();
  }
}

function barrelBand(ctx: CanvasRenderingContext2D, gun: Gun, x: number, radius: number, width: number, curve: number, lightAcross: number) {
  const highlight = .5 + .32 * lightAcross;
  const gradient = wash(ctx, -radius, radius, [
    [0, gun.bandDark], [.45 * highlight, gun.band],
    [highlight, gun.bandLight], [highlight + .46 * (1 - highlight), gun.band], [1, gun.bandDark],
  ]);
  shape(ctx, gradient, 1.5, p => {
    p.moveTo(x - width / 2, -radius);
    p.quadraticCurveTo(x + curve - width / 2, 0, x - width / 2, radius);
    p.lineTo(x + width / 2, radius);
    p.quadraticCurveTo(x + curve + width / 2, 0, x + width / 2, -radius);
    p.quadraticCurveTo(x, -radius - 1.2, x - width / 2, -radius);
  });
  const gleam = lightAcross * radius;
  line(ctx, gun.bandLight, 1.25, p => {
    p.moveTo(x + curve * .65 - width * .23, gleam * .72 - radius * .15);
    p.quadraticCurveTo(x + curve * .82 - width * .23, gleam * .72,
      x + curve * .72 - width * .23, gleam * .72 + radius * .15);
  });
}

function barrel(ctx: CanvasRenderingContext2D, gun: Gun, tier: Tier, { cos, sin, depth, barrelY, barrelAngle, barrelDepth, recoil }: ReturnType<typeof pose>) {
  const back = -23 * barrelDepth;
  const neck = gun.length * barrelDepth;
  const throat = gun.lip * .68;
  const radius = gun.breech;
  const localLight = LIGHT_ANGLE - barrelAngle;
  const lightAcross = Math.sin(localLight);
  const lightAlong = Math.cos(localLight);
  const highlight = .5 + .32 * lightAcross;
  const ringDepth = 2.7 + 4.8 * Math.abs(sin);
  ctx.save();
  ctx.translate(-cos * recoil * 7.5 * depth, CANNON_TOWER_BARREL_Y - barrelY * recoil * 7.5 * depth);
  ctx.rotate(barrelAngle);

  const steel = wash(ctx, -radius, radius, [
    [0, gun.metalDeep], [.35 * highlight, gun.metalDark], [.73 * highlight, gun.metal],
    [highlight, gun.metalLight], [highlight + .27 * (1 - highlight), gun.metal],
    [highlight + .65 * (1 - highlight), gun.metalDark], [1, gun.metalDeep],
  ]);
  const knobX = back - 2;
  shape(ctx, gun.bandDark, 2, p => {
    p.moveTo(back + 3, -4.4);
    p.quadraticCurveTo(knobX - 1, -4, knobX - 2.8, -5);
    p.bezierCurveTo(knobX - 11, -5.4, knobX - 12, 3.5, knobX - 4.7, 5.25);
    p.quadraticCurveTo(knobX - 2.5, 5.3, back + 3, 3.6);
  });
  line(ctx, gun.bandLight, 1.4, p => {
    p.moveTo(knobX - 7 + lightAlong * 1.2, lightAcross * 2.9 + .8);
    p.quadraticCurveTo(knobX - 5.8 + lightAlong * 1.2, lightAcross * 3.4 - .9,
      knobX - 4 + lightAlong * 1.2, lightAcross * 2.9 - .4);
  });
  shape(ctx, steel, 3.25, p => {
    p.moveTo(back, -6.5);
    p.bezierCurveTo(back + 1, -radius * .92, back + 6.5, -radius * 1.06, back + 12, -radius);
    p.bezierCurveTo(3, -radius, neck * .43, -throat, neck - 5.6, -throat);
    p.quadraticCurveTo(neck + ringDepth * .28, -throat, neck + ringDepth * .44, 0);
    p.quadraticCurveTo(neck + ringDepth * .28, throat, neck - 6, throat);
    p.bezierCurveTo(neck * .36, throat, 1, radius * .93, back + 11, radius);
    p.bezierCurveTo(back + 4, radius, back + .5, radius * .78, back, 5.7);
    p.quadraticCurveTo(back - 1.5, 0, back, -6.5);
  });
  const gleam = lightAcross * .72;
  line(ctx, gun.metalLight, 1.25, p => {
    p.moveTo(back + 6.5, gleam * radius);
    p.bezierCurveTo(back + 18, gleam * radius * 1.12, neck * .29, gleam * throat * .97, neck * .63, gleam * throat * .8);
  });
  barrelBand(ctx, gun, back + 9.5, radius * 1.04, 4.7 + tier, 1.95 + depth, lightAcross);
  if (tier > 0) barrelBand(ctx, gun, neck * .39, radius * .78, tier === 1 ? 3.4 : 4.6, 1.8, lightAcross);
  barrelBand(ctx, gun, neck - 5.7, gun.lip * 1.06, tier === 2 ? 8.4 : 6.6, ringDepth * .46, lightAcross);

  const faceWidth = ringDepth * (.57 + .43 * Math.max(0, sin));
  const boreWidth = faceWidth * (.61 - .34 * Math.max(0, -sin));
  const rimSpan = Math.hypot(lightAlong * faceWidth, lightAcross * gun.lip);
  const rim = ctx.createLinearGradient(neck + lightAlong * rimSpan, lightAcross * rimSpan,
    neck - lightAlong * rimSpan, -lightAcross * rimSpan);
  rim.addColorStop(0, gun.bandLight);
  rim.addColorStop(.52, gun.band);
  rim.addColorStop(1, gun.bandDark);
  shape(ctx, rim, 2.75, p => p.ellipse(neck, 0, faceWidth, gun.lip, 0, 0, 2 * Math.PI));
  shape(ctx, '#252833', .95, p => p.ellipse(neck + boreWidth * .2, 0, boreWidth, gun.lip * .67, 0, 0, 2 * Math.PI));
  oval(ctx, neck + boreWidth * .32, .75, boreWidth * .70, gun.lip * .46, '#171b26');
  line(ctx, gun.bandLight, .9, p => {
    const arc = Math.atan2(lightAcross * gun.lip, lightAlong * faceWidth);
    p.ellipse(neck, 0, faceWidth * .84, gun.lip * .83, 0, arc - .64, arc + .64);
  });
  ctx.restore();
}

export function drawCannonTowerFlash(
  ctx: CanvasRenderingContext2D, tier: Tier, angle: number, cycle: number, muzzle: { x: number; y: number },
): void {
  const progress = (cycle - CANNON_TOWER_RELEASE) / .13;
  if (progress < 0 || progress >= 1) return;
  const size = (1 + tier * .12) * (1 + progress * .15);
  ctx.save();
  ctx.translate(muzzle.x, muzzle.y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.globalAlpha = (1 - progress) ** 1.45;
  shape(ctx, '#c9693b', 0, p => {
    p.moveTo(-2, -3.9);
    p.lineTo(3, -4); p.lineTo(7, -10.8); p.lineTo(12.2, -6);
    p.lineTo(23.5, -7); p.lineTo(19, -2.2); p.lineTo(27, .1);
    p.lineTo(18.2, 2.6); p.lineTo(21.2, 8.2); p.lineTo(12, 6.5);
    p.lineTo(8, 10); p.quadraticCurveTo(5, 6, -2, 3.9);
  });
  shape(ctx, '#ffc268', 0, p => {
    p.moveTo(-1.2, -2.7);
    p.lineTo(5, -3.1); p.lineTo(9, -6.8); p.lineTo(13, -3.4);
    p.lineTo(21.7, -.1); p.lineTo(13, 3.1); p.lineTo(9, 6.8); p.lineTo(5, 3.1);
  });
  shape(ctx, '#fff0ad', 0, p => {
    p.moveTo(-.8, -1.7); p.quadraticCurveTo(5, -1.3, 9, -3);
    p.lineTo(15, 0); p.lineTo(9, 2.9); p.quadraticCurveTo(5, 1.35, -.8, 1.7);
  });
  ctx.restore();
}

export function drawCannonTowerGun(ctx: CanvasRenderingContext2D, tier: Tier, angle: number, cycle: number): void {
  const gun = GUNS[tier];
  const gunPose = pose(gun, angle, cycle);
  const { cos, sin, depth, barrelAngle } = gunPose;
  const project = (a: number, side: number, lift = 0): Point => [
    cos * a * depth - sin * side,
    sin * a * depth + cos * side * CANNON_GROUND_Y - lift * .76,
  ];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  plate(ctx, gun, tier);
  timberCheek(ctx, gun, project, -1);
  timberCheek(ctx, gun, project, 1);
  barrel(ctx, gun, tier, gunPose);
  touchhole(ctx, gun, gunPose, cycle);
  drawCannonTowerFlash(ctx, tier, barrelAngle, cycle, muzzleOffset(gunPose));
  ctx.restore();
}
