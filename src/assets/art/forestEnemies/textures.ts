import type Phaser from 'phaser';
import { BEAR_FRAMES, BEAR_MOVE_FRAMES, BEAR_ATK_FRAMES, BEAR_BITE_FRAMES, BEAR_MOVE_FPS, BEAR_ATK_FPS } from '../bear';
import { add } from '../canvas';
import { meadowEnemyPose, type MeadowEnemyPose } from '../meadowEnemies/pose';
import { SPIDER_ATK_FRAMES, SPIDER_MOVE_FRAMES } from '../spider';
import { WOLF_ATK_FRAMES, WOLF_MOVE_FRAMES, WOLF_MOVE_FPS, WOLF_ATK_FPS } from '../wolf';
import { createForestBearFrame } from './bear';
import { drawForestSpider } from './spider';
import { drawForestWolf } from './wolf';
import { forestWendigoClips } from './wendigo';

interface ForestEnemyArt {
  prefix: string;
  moveFrames: readonly string[];
  attackFrames: readonly string[];
  draw: (ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose) => void;
  x: number;
  feetY: number;
  scale: number;
}

const SIZE = 64;
const ART: readonly ForestEnemyArt[] = [
  { prefix: 'ew', moveFrames: WOLF_MOVE_FRAMES, attackFrames: WOLF_ATK_FRAMES,
    draw: drawForestWolf, x: 34, feetY: 54, scale: .48 },
  { prefix: 'es', moveFrames: SPIDER_MOVE_FRAMES, attackFrames: SPIDER_ATK_FRAMES,
    draw: drawForestSpider, x: 31, feetY: 56, scale: .55 },
];
const DEATH_FRAMES = [
  { squash: .86, alpha: 1 },
  { squash: .67, alpha: .74 },
  { squash: .46, alpha: .42 },
  { squash: .31, alpha: .14 },
];

function makeFrame(art: ForestEnemyArt, pose: MeadowEnemyPose, squash = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(art.x, art.feetY);
  ctx.scale(art.scale, art.scale * squash);
  art.draw(ctx, pose);
  return canvas;
}

function makeDeathFrame(art: ForestEnemyArt, pose: MeadowEnemyPose, squash: number, alpha: number): HTMLCanvasElement {
  const canvas = makeFrame(art, pose, squash);
  const ctx = canvas.getContext('2d')!;
  ctx.resetTransform();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, SIZE, SIZE);
  return canvas;
}

function makeHitFrame(art: ForestEnemyArt, pose: MeadowEnemyPose): HTMLCanvasElement {
  const canvas = makeFrame(art, pose);
  const ctx = canvas.getContext('2d')!;
  ctx.resetTransform();
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  return canvas;
}

export function generateForestEnemyTextures(scene: Phaser.Scene): void {
  for (const art of ART) {
    for (const [index, frame] of art.moveFrames.entries()) {
      const pose = meadowEnemyPose('move', index / art.moveFrames.length);
      add(scene, `${art.prefix}_${frame}`, makeFrame(art, pose));
    }
    for (const [index, frame] of art.attackFrames.entries()) {
      const pose = meadowEnemyPose('attack', index / (art.attackFrames.length - 1));
      add(scene, `${art.prefix}_${frame}`, makeFrame(art, pose));
    }
    add(scene, `${art.prefix}_hit`, makeHitFrame(art, meadowEnemyPose('attack', .36)));
    const deathPose = meadowEnemyPose('attack', .73);
    for (const [index, { squash, alpha }] of DEATH_FRAMES.entries()) {
      add(scene, `${art.prefix}_die${index}`, makeDeathFrame(art, deathPose, squash, alpha));
    }
  }
  for (const [prefix, facing] of [['ear', 'r'], ['eal', 'l']] as const) {
    for (const frame of [...BEAR_FRAMES, ...BEAR_BITE_FRAMES]) {
      add(scene, `${prefix}_${frame}`, createForestBearFrame(frame, facing));
    }
  }
  for (const clip of forestWendigoClips) {
    for (const frame of clip.textures) add(scene, frame.key, frame.draw());
  }
}

export function registerForestAnimations(scene: Phaser.Scene): void {
  const register = (key: string, frameKeys: readonly string[], frameRate: number, repeat: number) => {
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({ key, frames: frameKeys.map(frameKey => ({ key: frameKey })), frameRate, repeat });
  };
  const registerEnemy = (prefix: string, move: readonly string[], attack: readonly string[], moveFps: number, attackFps: number, attackRepeat: number, reactionFps: number) => {
    register(`${prefix}-move`, move.map(frame => `${prefix}_${frame}`), moveFps, -1);
    register(`${prefix}-atk`, attack.map(frame => `${prefix}_${frame}`), attackFps, attackRepeat);
    register(`${prefix}-hit`, [`${prefix}_hit`], reactionFps, 0);
    register(`${prefix}-die`, DEATH_FRAMES.map((_, index) => `${prefix}_die${index}`), reactionFps, 0);
  };

  registerEnemy('ew', WOLF_MOVE_FRAMES, WOLF_ATK_FRAMES, WOLF_MOVE_FPS, WOLF_ATK_FPS, 0, 10);
  registerEnemy('es', SPIDER_MOVE_FRAMES, SPIDER_ATK_FRAMES, 18, 16, -1, 10);
  for (const prefix of ['ear', 'eal']) {
    registerEnemy(prefix, BEAR_MOVE_FRAMES, BEAR_ATK_FRAMES, BEAR_MOVE_FPS, BEAR_ATK_FPS, 0, 8);
    register(`${prefix}-bite`, BEAR_BITE_FRAMES.map(frame => `${prefix}_${frame}`), BEAR_ATK_FPS, 0);
  }
  for (const clip of forestWendigoClips) register(clip.key, clip.animationFrames, clip.fps, clip.repeat);
}
