import type Phaser from 'phaser';
import { add } from '../canvas';
import { MEADOW_ATK_FRAMES, MEADOW_MOVE_FRAMES } from '../meadow';
import { drawSnake } from './snake';
import { drawRat } from './rat';
import { drawDeer } from './deer';
import { meadowEnemyPose, type MeadowEnemyPose } from './pose';

type EnemyArt = (ctx: CanvasRenderingContext2D, pose: MeadowEnemyPose) => void;

const SPRITE_SIZE = 64;
const ATTACK_PHASES = [0, .35, .56, .71, .9];
const ART = [
  { prefix: 'esnk', draw: drawSnake, x: 30, y: 41, scale: .45 },
  { prefix: 'erat', draw: drawRat, x: 30, y: 51, scale: .48 },
  { prefix: 'eder', draw: drawDeer, x: 28, y: 60, scale: .49 },
];

function makeMeadowEnemyFrame(art: { draw: EnemyArt; x: number; y: number; scale: number }, pose: MeadowEnemyPose): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(art.x, art.y);
  ctx.scale(art.scale, art.scale);
  art.draw(ctx, pose);
  return canvas;
}

export function generateMeadowEnemyTextures(scene: Phaser.Scene): void {
  for (const art of ART) {
    for (const [index, frame] of MEADOW_MOVE_FRAMES.entries()) {
      add(scene, `${art.prefix}_${frame}`, makeMeadowEnemyFrame(art, meadowEnemyPose('move', index / MEADOW_MOVE_FRAMES.length, 0)));
    }
    for (const [index, frame] of MEADOW_ATK_FRAMES.entries()) {
      add(scene, `${art.prefix}_${frame}`, makeMeadowEnemyFrame(art, meadowEnemyPose('attack', ATTACK_PHASES[index])));
    }
  }
  add(scene, 'esnk_move0t', makeMeadowEnemyFrame(ART[0], meadowEnemyPose('move', 0, .75)));
}
