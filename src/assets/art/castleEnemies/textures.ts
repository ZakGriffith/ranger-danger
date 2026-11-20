import type Phaser from 'phaser';
import { add } from '../canvas';
import {
  IRONCAP_ATTACK_FPS, IRONCAP_ATTACK_FRAMES, IRONCAP_FRAMES,
  IRONCAP_MOVE_FPS, IRONCAP_MOVE_FRAMES, makeIllustratedIroncapFrame,
} from '../ironcap';
import { drawCastleSkeleton } from './skeleton';
import { drawCastleWarlock } from './warlock';
import { drawCastleImp } from './imp';
import { drawCastleBat } from './vermin';
import { CASTLE_RAT_COUNT, drawCastleRat } from './rat';
import { drawPhantomQueen } from './queen';
import { drawCastleDragon } from './dragon';
import type { CastleDraw } from './pose';

export { CASTLE_RAT_COUNT } from './rat';

interface CastleArt {
  prefix: string;
  draw: CastleDraw;
  size: number;
  baseline: number;
  scale: number;
  moveFps: number;
  attackFps: number;
  attackRepeat: number;
}

const rat = (variant: number): CastleDraw => (ctx, action, phase) => drawCastleRat(ctx, action, phase, variant);
const ENEMIES: readonly CastleArt[] = [
  { prefix: 'esk', draw: drawCastleSkeleton, size: 96, baseline: 72, scale: .46, moveFps: 20, attackFps: 20, attackRepeat: -1 },
  { prefix: 'ewl', draw: drawCastleWarlock, size: 96, baseline: 72, scale: .46, moveFps: 20, attackFps: 20, attackRepeat: 0 },
  { prefix: 'esi', draw: drawCastleImp, size: 96, baseline: 71, scale: .47, moveFps: 24, attackFps: 20, attackRepeat: -1 },
  { prefix: 'ebt', draw: drawCastleBat, size: 64, baseline: 60, scale: .5, moveFps: 24, attackFps: 20, attackRepeat: -1 },
  ...Array.from({ length: CASTLE_RAT_COUNT }, (_, variant) => ({
    prefix: `ecrat${variant}`, draw: rat(variant), size: 64, baseline: 51, scale: .45,
    moveFps: 30, attackFps: 20, attackRepeat: -1,
  })),
];
const BOSSES: readonly CastleArt[] = [
  { prefix: 'cqboss', draw: drawPhantomQueen, size: 128, baseline: 97, scale: .53, moveFps: 24, attackFps: 20, attackRepeat: 0 },
  { prefix: 'cdboss', draw: drawCastleDragon, size: 128, baseline: 89, scale: .46, moveFps: 21, attackFps: 20, attackRepeat: 0 },
];
const MOVE_COUNT = 12;
const ATTACK_PHASES = [0, .12, .25, .3, .42, .6, .78, .95];
const BOSS_ATTACK_COUNT = 10;

function makeFrame(art: CastleArt, action: 'move' | 'attack', phase: number, alpha = 1, squash = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = art.size;
  const ctx = canvas.getContext('2d')!;
  ctx.globalAlpha = alpha;
  ctx.translate(art.size / 2, art.baseline);
  ctx.scale(art.scale, art.scale * squash);
  art.draw(ctx, action, phase);
  return canvas;
}

export function generateCastleEnemyTextures(scene: Phaser.Scene): void {
  for (const art of [...ENEMIES, ...BOSSES]) {
    const boss = BOSSES.includes(art);
    for (let i = 0; i < MOVE_COUNT; i++) {
      const frame = makeFrame(art, 'move', i / MOVE_COUNT);
      add(scene, `${art.prefix}_move${i}`, frame);
      if (boss) add(scene, `${art.prefix}_idle${i}`, makeFrame(art, 'move', i / MOVE_COUNT));
    }
    const attackPhases = boss ? Array.from({ length: BOSS_ATTACK_COUNT }, (_, i) => i / (BOSS_ATTACK_COUNT - 1)) : ATTACK_PHASES;
    for (const [i, phase] of attackPhases.entries()) add(scene, `${art.prefix}_atk${i}`, makeFrame(art, 'attack', phase));
    const hit = makeFrame(art, 'move', 0);
    const ctx = hit.getContext('2d')!;
    ctx.resetTransform();
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, art.size, art.size);
    add(scene, `${art.prefix}_hit`, hit);
    for (let i = 0; i < (boss ? 5 : 4); i++) {
      add(scene, `${art.prefix}_die${i}`, makeFrame(art, 'move', .5, 1 - i * .2, 1 - i * .18));
    }
    if (boss) {
      add(scene, `${art.prefix}_chargeWind`, makeFrame(art, 'attack', .28));
      for (let i = 0; i < 5; i++) add(scene, `${art.prefix}_birth${i}`, makeFrame(art, 'attack', i / 5));
    }
  }
  for (const frame of IRONCAP_FRAMES) add(scene, `ego_${frame}`, makeIllustratedIroncapFrame(frame));
}

export function registerCastleEnemyAnimations(scene: Phaser.Scene): void {
  const register = (prefix: string, suffix: string, frames: readonly string[], frameRate: number, repeat: number) => {
    const key = `${prefix}-${suffix}`;
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({ key, frames: frames.map(frame => ({ key: `${prefix}_${frame}` })), frameRate, repeat });
  };
  for (const art of [...ENEMIES, ...BOSSES]) {
    const { prefix, moveFps, attackFps, attackRepeat } = art;
    const boss = BOSSES.includes(art);
    register(prefix, 'move', Array.from({ length: MOVE_COUNT }, (_, i) => `move${i}`), moveFps, -1);
    register(prefix, 'atk', Array.from({ length: boss ? BOSS_ATTACK_COUNT : ATTACK_PHASES.length }, (_, i) => `atk${i}`), attackFps, attackRepeat);
    register(prefix, 'hit', ['hit'], 10, 0);
    register(prefix, 'die', Array.from({ length: boss ? 5 : 4 }, (_, i) => `die${i}`), boss ? 6 : 10, 0);
    if (boss) {
      register(prefix, 'idle', Array.from({ length: MOVE_COUNT }, (_, i) => `idle${i}`), prefix === 'cqboss' ? 18 : 15, -1);
      register(prefix, 'chargewind', ['chargeWind', 'idle0'], 6, -1);
      register(prefix, 'birth', Array.from({ length: 5 }, (_, i) => `birth${i}`), 4, 0);
    }
  }
  register('ego', 'move', IRONCAP_MOVE_FRAMES, IRONCAP_MOVE_FPS, -1);
  register('ego', 'atk', IRONCAP_ATTACK_FRAMES, IRONCAP_ATTACK_FPS, -1);
  register('ego', 'hit', ['hit'], 8, 0);
}
