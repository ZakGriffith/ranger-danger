import { CANNON_GROUND_Y } from '../cannon';
import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { CANNON_TOWER_RELEASE, drawCannonTowerFlash } from './gun';

type Tier = 0 | 1 | 2;

const BOMBARDS = [
  {
    length: 31, chamber: 12.8, mouth: 14, mount: 23,
    iron: '#67676a', ironLit: '#a39b8f', ironShade: '#383340',
    brass: '#ad8253', brassLit: '#e4bb79', brassShade: '#654b40',
    timber: '#9d6d50', timberLit: '#c59060', timberShade: '#65443e',
  },
  {
    length: 33, chamber: 14.5, mouth: 15.5, mount: 24.5,
    iron: '#667582', ironLit: '#b2b9b1', ironShade: '#363e51',
    brass: '#a89164', brassLit: '#e4cc94', brassShade: '#605144',
    timber: '#866555', timberLit: '#b88b67', timberShade: '#54444b',
  },
  {
    length: 36, chamber: 16, mouth: 17.5, mount: 26,
    iron: '#6d5d61', ironLit: '#ad9b93', ironShade: '#3f3245',
    brass: '#c99149', brassLit: '#ffdd91', brassShade: '#86513c',
    timber: '#a2644c', timberLit: '#d59369', timberShade: '#683e47',
  },
] as const;

type Bombard = typeof BOMBARDS[Tier];

const BARREL_Y = -20;
const LIGHT = Math.atan2(-1, -.55);
const TAU = Math.PI * 2;

function motion(bombard: Bombard, angle: number, cycle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const depth = 1 / Math.hypot(cos, sin / CANNON_GROUND_Y);
  const recoil = cycle < CANNON_TOWER_RELEASE ? 0 : Math.max(0, 1 - (cycle - CANNON_TOWER_RELEASE) / .31) ** 2;
  const travel = recoil * (7 + bombard.length * .04) * depth;
  return { cos, sin, depth, travel };
}

export function getForgeCannonMuzzle(tier: Tier, angle: number, cycle: number): { x: number; y: number } {
  const bombard = BOMBARDS[tier];
  const { cos, sin, depth, travel } = motion(bombard, angle, cycle);
  const muzzle = bombard.length * depth - travel;
  return { x: cos * muzzle, y: BARREL_Y + sin * muzzle };
}

function drawMount(ctx: CanvasRenderingContext2D, bombard: Bombard, angle: number) {
  const radius = bombard.mount;
  shape(ctx, bombard.ironShade, 2.6, p => {
    p.moveTo(-radius, -1);
    p.bezierCurveTo(-radius, -15, radius, -15, radius, -1);
    p.lineTo(radius, 3.8);
    p.bezierCurveTo(radius, 15.4, -radius, 15.4, -radius, 3.8);
  });
  shape(ctx, wash(ctx, -12, 7, [[0, bombard.brassLit], [.53, bombard.brass], [1, bombard.brassShade]]), 2, p => {
    p.ellipse(0, -1.5, radius, 10.4, 0, 0, TAU);
  });
  oval(ctx, 0, -2, radius - 4.1, 7.5, bombard.ironShade);

  const yaw = Math.atan2(Math.sin(angle) / CANNON_GROUND_Y, Math.cos(angle));
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const at = (along: number, across: number, lift: number): [number, number] => [
    along * cos - across * sin,
    (along * sin + across * cos) * CANNON_GROUND_Y - lift,
  ];
  const lift = 5 + (radius - 23) * .22;
  const railEnd = radius * .91;
  const railSide = radius * .67;
  const timber = wash(ctx, -20, 12, [[0, bombard.timberLit], [.61, bombard.timber], [1, bombard.timberShade]]);
  for (const side of [-1, 1]) {
    const inside = railSide * side * .59;
    const outside = railSide * side;
    shape(ctx, bombard.timberShade, 2.15, p => {
      p.moveTo(...at(-railEnd, inside, lift));
      p.lineTo(...at(railEnd - 3, inside, lift));
      p.lineTo(...at(railEnd, outside, lift));
      p.lineTo(...at(railEnd, outside, 0));
      p.lineTo(...at(-railEnd + 2, outside, 0));
      p.lineTo(...at(-railEnd, outside, lift));
    });
    shape(ctx, timber, 1.65, p => {
      p.moveTo(...at(-railEnd, inside, lift));
      p.lineTo(...at(railEnd - 3, inside, lift));
      p.lineTo(...at(railEnd, outside * .84, lift));
      p.lineTo(...at(railEnd - 1, outside, lift));
      p.lineTo(...at(-railEnd + 2, outside, lift));
    });
    line(ctx, bombard.timberLit, 1.2, p => {
      p.moveTo(...at(-railEnd + 4, outside * .91, lift));
      p.quadraticCurveTo(...at(1, outside * .83, lift), ...at(railEnd - 5, outside * .91, lift));
    });
    for (const end of [-1, 1]) {
      const [x, y] = at((railEnd - 4.7) * end, outside * .84, lift);
      oval(ctx, x, y, 1.9, 1.4, ink);
      oval(ctx, x - .27, y - .25, 1.12, .78, bombard.brassLit);
    }
  }
  const beam = wash(ctx, -20, 8, [[0, bombard.brassLit], [.43, bombard.brass], [1, bombard.brassShade]]);
  shape(ctx, beam, 2.1, p => {
    p.moveTo(...at(-5.8, -railSide - 3, lift + 4));
    p.lineTo(...at(5.8, -railSide - 3, lift + 4));
    p.lineTo(...at(7.4, -railSide, lift - 1));
    p.lineTo(...at(7.4, railSide, lift - 1));
    p.lineTo(...at(5.8, railSide + 3, lift + 4));
    p.lineTo(...at(-5.8, railSide + 3, lift + 4));
    p.lineTo(...at(-7.4, railSide, lift - 1));
    p.lineTo(...at(-7.4, -railSide, lift - 1));
  });
}

function drawBarrel(ctx: CanvasRenderingContext2D, bombard: Bombard, tier: Tier, angle: number, cycle: number) {
  const { cos, sin, depth, travel } = motion(bombard, angle, cycle);
  const mouth = bombard.length * depth;
  const tail = -(bombard.length * .58) * depth;
  const radius = bombard.chamber;
  const flare = bombard.mouth;
  const alongLight = Math.cos(LIGHT - angle);
  const acrossLight = Math.sin(LIGHT - angle);
  const highlight = .5 + .28 * acrossLight;
  ctx.save();
  ctx.translate(-cos * travel, BARREL_Y - sin * travel);
  ctx.rotate(angle);

  const iron = wash(ctx, -flare, flare, [
    [0, bombard.ironShade], [.6 * highlight, bombard.iron], [highlight, bombard.ironLit],
    [highlight + .24 * (1 - highlight), bombard.iron], [1, bombard.ironShade],
  ]);
  const brass = wash(ctx, -flare, flare, [
    [0, bombard.brassShade], [.57 * highlight, bombard.brass], [highlight, bombard.brassLit],
    [highlight + .29 * (1 - highlight), bombard.brass], [1, bombard.brassShade],
  ]);
  shape(ctx, brass, 2.35, p => {
    p.moveTo(tail + 2.5, -4.4);
    p.bezierCurveTo(tail - 2, -4.3, tail - 2.8, -6.6, tail - 6, -6.2);
    p.bezierCurveTo(tail - 13, -5.1, tail - 13, 4.8, tail - 6.1, 6.1);
    p.bezierCurveTo(tail - 3, 6.6, tail - 2.8, 3.9, tail + 2.5, 4.4);
  });
  shape(ctx, iron, 3.15, p => {
    p.moveTo(tail - 1, -4.2);
    p.bezierCurveTo(tail - .2, -radius * .84, tail + 5.7, -radius, tail + 13, -radius);
    p.bezierCurveTo(tail + 19.5, -radius, 2, -radius * .63, mouth * .44, -radius * .62);
    p.quadraticCurveTo(mouth * .70, -radius * .63, mouth - 3, -flare * .92);
    p.lineTo(mouth - 3, flare * .92);
    p.quadraticCurveTo(mouth * .70, radius * .63, mouth * .44, radius * .62);
    p.bezierCurveTo(2, radius * .63, tail + 19, radius, tail + 13, radius);
    p.bezierCurveTo(tail + 6, radius, tail + .1, radius * .87, tail - 1, 4.2);
    p.quadraticCurveTo(tail - 1.8, 0, tail - 1, -4.2);
  });

  const strap = tail + 12;
  const strapWidth = 7 + tier * 1.3;
  shape(ctx, brass, 1.85, p => {
    p.moveTo(strap - strapWidth / 2, -radius * .99);
    p.quadraticCurveTo(strap, -radius * 1.17, strap + strapWidth / 2, -radius * 1.02);
    p.quadraticCurveTo(strap + strapWidth / 2 + 4, 0, strap + strapWidth / 2, radius * 1.02);
    p.quadraticCurveTo(strap, radius * 1.17, strap - strapWidth / 2, radius * .99);
    p.quadraticCurveTo(strap - strapWidth / 2 + 3, 0, strap - strapWidth / 2, -radius * .99);
  });
  for (const offset of [-.52, .52]) {
    const y = radius * offset;
    const x = strap + 1.1;
    oval(ctx, x, y, 1.75, 1.9, bombard.brassShade);
    oval(ctx, x + alongLight * .55, y + acrossLight * .55, .83, .97, bombard.brassLit);
  }

  const shine = acrossLight * .66;
  line(ctx, bombard.ironLit, 1.4, p => {
    p.moveTo(strap + strapWidth / 2 + 2.5, shine * radius * .87);
    p.quadraticCurveTo(mouth * .34, shine * radius * .56, mouth * .65, shine * radius * .68);
  });
  shape(ctx, brass, 1.75, p => {
    const collar = mouth - 7.6 - tier * .5;
    const shoulder = flare * .83;
    p.moveTo(collar, -shoulder);
    p.quadraticCurveTo(mouth - 3.9, -flare * 1.05, mouth, -flare);
    p.lineTo(mouth, flare);
    p.quadraticCurveTo(mouth - 3.9, flare * 1.05, collar, shoulder);
    p.quadraticCurveTo(collar + 2.7, 0, collar, -shoulder);
  });

  const faceWidth = 2.1 + 5 * Math.max(0, sin) ** 1.3;
  const boreWidth = faceWidth * (.55 + .23 * sin);
  const rimSpan = Math.hypot(alongLight * faceWidth, acrossLight * flare);
  const rim = ctx.createLinearGradient(mouth + alongLight * rimSpan, acrossLight * rimSpan,
    mouth - alongLight * rimSpan, -acrossLight * rimSpan);
  rim.addColorStop(0, bombard.brassLit);
  rim.addColorStop(.54, bombard.brass);
  rim.addColorStop(1, bombard.brassShade);
  shape(ctx, rim, 2.4, p => p.ellipse(mouth, 0, faceWidth, flare, 0, 0, TAU));
  shape(ctx, '#362b37', 1.04, p => p.ellipse(mouth + .22, 0, boreWidth, flare * .73, 0, 0, TAU));
  oval(ctx, mouth + boreWidth * .19, 0, boreWidth * .72, flare * .61, '#1c1b25');
  const rimLight = Math.atan2(acrossLight * flare, alongLight * faceWidth);
  line(ctx, bombard.brassLit, 1.05, p => {
    p.ellipse(mouth, 0, faceWidth * .86, flare * .88, 0, rimLight - .57, rimLight + .57);
  });
  ctx.restore();

  const fuse = tail + 8 - travel;
  const fx = cos * fuse;
  const fy = BARREL_Y + sin * fuse - radius * .57;
  shape(ctx, bombard.brass, 1.3, p => p.ellipse(fx, fy, 3.05, 2.05, 0, 0, TAU));
  oval(ctx, fx, fy, 1.15, .78, '#33252b');
  const spark = Math.max(0, 1 - Math.abs(cycle - (CANNON_TOWER_RELEASE - .08)) / .11);
  if (spark > 0) {
    ctx.save();
    ctx.globalAlpha = spark;
    oval(ctx, fx, fy - .9, 1.5, 1.4, '#ffb76a');
    line(ctx, '#ffe3ab', 1, p => {
      p.moveTo(fx - 1.4, fy - 2.5); p.lineTo(fx - 3.9, fy - 4.6);
      p.moveTo(fx + .5, fy - 3.9); p.lineTo(fx + 1.3, fy - 6.5);
    });
    ctx.restore();
  }
}

export function drawForgeCannonGun(ctx: CanvasRenderingContext2D, tier: Tier, angle: number, cycle: number): void {
  const bombard = BOMBARDS[tier];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawMount(ctx, bombard, angle);
  drawBarrel(ctx, bombard, tier, angle, cycle);
  drawCannonTowerFlash(ctx, tier, angle, cycle, getForgeCannonMuzzle(tier, angle, cycle));
  ctx.restore();
}
