import { ink, line, oval, shape, wash } from '../forestEnemies/paint';
import { drawRangerBody } from '../ranger/body';
import { drawRangerBow, getArrowOrigin } from '../ranger/bow';
import type { RangerPose, RangerView } from '../ranger/pose';

export const ARROW_TOWER_ARCHER_SCALE = .73;
export const ARROW_TOWER_RELEASE = .55;

const VIEWS: readonly RangerView[] = ['east', 'south', 'west', 'north'];
const UNIFORMS = [
  { capLight: '#a0b878', cap: '#63824f', capDark: '#3d5040', trim: '#c2aa78', gleam: '#e0c99b', collar: '#6e844f' },
  { capLight: '#b6ced3', cap: '#6e8d98', capDark: '#405562', trim: '#a2b8bb', gleam: '#e2e6d2', collar: '#658b95' },
  { capLight: '#c27b68', cap: '#944e50', capDark: '#633a48', trim: '#e9b76b', gleam: '#ffda8a', collar: '#a35656' },
] as const;

type TowerTier = 0 | 1 | 2;
type Uniform = typeof UNIFORMS[TowerTier];

function makePose(aim: number, shot: number, time: number): RangerPose {
  const turn = Math.round(aim / (Math.PI / 2));
  const view = VIEWS[((turn % 4) + 4) % 4];
  const pull = shot / ARROW_TOWER_RELEASE;
  return {
    view,
    angle: aim,
    phase: 0,
    run: 0,
    bob: .63 * Math.sin(time * 3.1),
    draw: shot < ARROW_TOWER_RELEASE ? pull * pull * (3 - 2 * pull) : 0,
    recoil: shot < ARROW_TOWER_RELEASE ? 0 : Math.max(0, 1 - (shot - ARROW_TOWER_RELEASE) / .22),
    loaded: shot < ARROW_TOWER_RELEASE || shot >= .89,
  };
}

export function getArrowTowerShotOrigin(aim: number, time: number): { x: number; y: number } {
  const pose = makePose(aim, 0, time);
  const { x, y } = getArrowOrigin({ ...pose, draw: 1 });
  return { x: x * ARROW_TOWER_ARCHER_SCALE, y: y * ARROW_TOWER_ARCHER_SCALE };
}

function drawMantle(ctx: CanvasRenderingContext2D, pose: RangerPose, uniform: Uniform) {
  ctx.save();
  ctx.translate(0, pose.bob);
  if (pose.view === 'west') ctx.scale(-1, 1);
  const profile = pose.view === 'east' || pose.view === 'west';
  const rear = pose.view === 'north';
  const right = profile ? 10 : 15;
  const color = wash(ctx, -45, -30, [[0, uniform.collar], [1, uniform.capDark]]);
  shape(ctx, color, 1.7, p => {
    p.moveTo(-14, -37);
    p.quadraticCurveTo(-9, -46, -.4, -45.2);
    p.quadraticCurveTo(8, -44.4, right, -39.5);
    p.quadraticCurveTo(right + .5, -35.5, right - 1.3, -33);
    p.quadraticCurveTo(7.5, -34, 2.2, -32);
    p.quadraticCurveTo(-3, -34.6, -8, -32.3);
    p.quadraticCurveTo(-11.7, -33.2, -14, -37);
  });
  line(ctx, uniform.capLight, 1.05, p => {
    p.moveTo(-11.6, -36.3);
    p.quadraticCurveTo(-6.8, -34.9, -3.7, -36);
    p.moveTo(5.2, -34.9);
    p.quadraticCurveTo(right - 4.4, -36.2, right - 2, -35.6);
  });
  if (!rear) oval(ctx, profile ? 5.6 : 1.4, -34.8, 2.5, 1.65, uniform.trim, -.2);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, profile: boolean) {
  const skin = wash(ctx, -57, -39, [[0, '#ffd094'], [.55, '#e5a776'], [1, '#b8775e']]);
  shape(ctx, skin, 1.85, p => {
    p.moveTo(-11, -53);
    p.quadraticCurveTo(1.5, -60, 11, -54);
    if (profile) {
      p.quadraticCurveTo(14.1, -52.3, 14.3, -49.2);
      p.quadraticCurveTo(19.1, -47.4, 15, -45.5);
      p.quadraticCurveTo(14.9, -41.3, 10.6, -40.4);
      p.quadraticCurveTo(3.2, -36.8, -4.1, -42.7);
    } else {
      p.quadraticCurveTo(14, -43.5, 7.2, -41.3);
      p.quadraticCurveTo(2, -37.6, -5.3, -41.2);
      p.quadraticCurveTo(-10.5, -42.6, -11, -48.5);
    }
    p.quadraticCurveTo(-12, -50.7, -11, -53);
  });
  if (profile) {
    line(ctx, '#78463f', 1.25, p => {
      p.moveTo(5.4, -49.8);
      p.quadraticCurveTo(9, -51, 11.4, -50.2);
      p.moveTo(10.4, -43.5);
      p.quadraticCurveTo(12.6, -43.2, 14, -44.1);
    });
    oval(ctx, 9.4, -47.8, 1.22, 1.52, ink);
    oval(ctx, 9.85, -48.35, .41, .43, '#fff0bf');
  } else {
    line(ctx, '#78463f', 1.2, p => {
      p.moveTo(-7, -49.7);
      p.quadraticCurveTo(-5, -51.1, -2.6, -50);
      p.moveTo(4.1, -49.9);
      p.quadraticCurveTo(6.8, -51.2, 9.1, -49.8);
      p.moveTo(-.6, -43.5);
      p.quadraticCurveTo(1.6, -42.7, 3.6, -43.5);
    });
    oval(ctx, -4.5, -47.55, 1.15, 1.5, ink);
    oval(ctx, 7, -47.6, 1.15, 1.5, ink);
    line(ctx, '#ac654f', 1.05, p => {
      p.moveTo(.65, -48.3);
      p.quadraticCurveTo(-.3, -45.8, 2.3, -46);
    });
  }
}

function drawCap(ctx: CanvasRenderingContext2D, uniform: Uniform, profile: boolean, rear: boolean) {
  const brimEnd = profile ? 20 : 17;
  const dome = wash(ctx, -70, -52, [[0, uniform.capLight], [.48, uniform.cap], [1, uniform.capDark]]);
  shape(ctx, dome, 2.3, p => {
    p.moveTo(-16.5, -53);
    p.bezierCurveTo(-17.1, -61.9, -11.9, -68.5, -4.4, -70);
    p.bezierCurveTo(5.2, -71.9, 13.4, -66.9, 15.9, -60);
    p.lineTo(16.9, -53);
    p.quadraticCurveTo(6.2, -48.9, -3.6, -49.7);
    p.quadraticCurveTo(-13, -49.8, -16.5, -53);
  });
  shape(ctx, uniform.capLight, 0, p => {
    p.moveTo(-13.1, -58.1);
    p.quadraticCurveTo(-11.2, -66.5, -2.1, -68);
    p.quadraticCurveTo(4.7, -68.8, 8.5, -64.8);
    p.quadraticCurveTo(1.9, -67.2, -4.1, -63.8);
    p.quadraticCurveTo(-10.1, -62.6, -13.1, -58.1);
  });
  line(ctx, uniform.capDark, 1.4, p => {
    p.moveTo(1.2, -68.9);
    p.quadraticCurveTo(6.5, -64.2, 8.2, -56.1);
  });
  shape(ctx, uniform.trim, 2, p => {
    p.moveTo(-17.1, -56);
    p.quadraticCurveTo(-10.2, -53, -.8, -54);
    p.quadraticCurveTo(7.9, -54.9, brimEnd - 1, -57.2);
    p.quadraticCurveTo(brimEnd + 1, -55.8, brimEnd, -53.5);
    p.quadraticCurveTo(9.2, -50.2, .1, -49.8);
    p.quadraticCurveTo(-9.1, -48.9, -17.8, -52.3);
    p.quadraticCurveTo(-18.3, -54.1, -17.1, -56);
  });
  line(ctx, uniform.gleam, .95, p => {
    p.moveTo(-15.9, -54.4);
    p.quadraticCurveTo(-6.8, -51, 2.2, -52.8);
  });
  if (rear) {
    shape(ctx, uniform.capDark, 1.45, p => {
      p.moveTo(-13.5, -50.8);
      p.quadraticCurveTo(1.1, -46.3, 13.9, -51);
      p.lineTo(12.9, -44.1);
      p.quadraticCurveTo(2, -39, -12.5, -43.2);
    });
    line(ctx, uniform.cap, 1.2, p => {
      p.moveTo(-9.7, -47.8);
      p.quadraticCurveTo(1.2, -44.5, 9.4, -47.8);
    });
  } else {
    shape(ctx, uniform.capDark, 1.35, p => {
      p.moveTo(-12.1, -52.4);
      p.quadraticCurveTo(-8.1, -52, -7.7, -47);
      p.quadraticCurveTo(-7.9, -43, -11.4, -43.7);
      p.quadraticCurveTo(-14.7, -44.5, -14.8, -49.5);
      p.quadraticCurveTo(-14.8, -51.8, -12.1, -52.4);
    });
    oval(ctx, -11.65, -49.15, 1.4, 1.35, uniform.gleam);
  }
}

function drawArcherHead(ctx: CanvasRenderingContext2D, pose: RangerPose, uniform: Uniform) {
  const profile = pose.view === 'east' || pose.view === 'west';
  const rear = pose.view === 'north';
  ctx.save();
  ctx.translate(0, pose.bob);
  if (pose.view === 'west') ctx.scale(-1, 1);
  if (profile) ctx.translate(pose.draw * .8 - pose.recoil * 1.5, 0);
  if (!rear) drawFace(ctx, profile);
  drawCap(ctx, uniform, profile, rear);
  ctx.restore();
}

export function drawArrowTowerArcher(ctx: CanvasRenderingContext2D, tier: TowerTier, aim: number, shot: number, time: number): void {
  const pose = makePose(aim, shot, time);
  const uniform = UNIFORMS[tier];
  ctx.save();
  ctx.scale(ARROW_TOWER_ARCHER_SCALE, ARROW_TOWER_ARCHER_SCALE);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  oval(ctx, 0, -1, 16, 4, '#1c20237c');
  if (pose.view === 'north') drawRangerBow(ctx, pose);
  drawRangerBody(ctx, pose);
  drawMantle(ctx, pose, uniform);
  if (pose.view !== 'north') drawRangerBow(ctx, pose);
  drawArcherHead(ctx, pose, uniform);
  ctx.restore();
}
