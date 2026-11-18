import type Phaser from 'phaser';
import { add } from '../canvas';
import { drawRiverBat, drawRiverCrow, RIVER_BAT_VARIANTS } from './birds';
import {
  drawRiverDragonfly, drawRiverMosquito, drawRiverMosquitoDart, mosquitoMuzzle,
  RIVER_DRAGONFLY_VARIANTS, RIVER_MOSQUITO_RELEASE_PHASE,
} from './insects';

type FlierAction = 'move' | 'attack';
type DrawFlier = (ctx: CanvasRenderingContext2D, action: FlierAction, phase: number) => void;

export const RIVER_FLIER_SIZE = 80;
const artScale = .4;
const artBaselineY = 59;
const muzzle = mosquitoMuzzle(true);
export const RIVER_MOSQUITO_MUZZLE = {
  x: muzzle.x * artScale,
  y: artBaselineY + muzzle.y * artScale - RIVER_FLIER_SIZE / 2,
};
export const RIVER_FLIER_ART = {
  crow: { scale: .5, bodySize: 24, folder: 'crow' },
  bat: { scale: .5, bodySize: 26, folder: 'river_bat' },
  dragonfly: { scale: .45, bodySize: 20, folder: 'dragonfly' },
  mosquito: { scale: .45, bodySize: 20, folder: 'mosquito' },
} as const;
export const RIVER_BAT_COUNT = RIVER_BAT_VARIANTS.length;
export const RIVER_DRAGONFLY_COUNT = RIVER_DRAGONFLY_VARIANTS.length;
export const riverBatTexturePrefix = (variant: number) => `ebt${variant}`;
export const riverDragonflyTexturePrefix = (variant: number) => variant === 0 ? 'edf' : `edf${variant}`;

const meleePhases = [0, .14, .25, .38, .48, .60, .74, .88];
const mosquitoReleasePhases = [RIVER_MOSQUITO_RELEASE_PHASE, .49, .53, .58, .65, .74, .86, .98];
const fliers: readonly {
  prefix: string;
  draw: DrawFlier;
  moveFrames: number;
  moveFps: number;
  attackPhases: readonly number[];
  attackFps: number;
  attackRepeat: number;
}[] = [
  { prefix: 'ecr', draw: drawRiverCrow, moveFrames: 12, moveFps: 24, attackPhases: meleePhases, attackFps: 10, attackRepeat: -1 },
  ...RIVER_BAT_VARIANTS.map((variant, index) => ({
    prefix: riverBatTexturePrefix(index), draw: (ctx: CanvasRenderingContext2D, action: FlierAction, phase: number) => drawRiverBat(ctx, action, phase, variant),
    moveFrames: 8, moveFps: 16, attackPhases: meleePhases, attackFps: 10, attackRepeat: -1,
  })),
  ...RIVER_DRAGONFLY_VARIANTS.map(variant => ({
    prefix: riverDragonflyTexturePrefix(variant), draw: (ctx: CanvasRenderingContext2D, action: FlierAction, phase: number) => drawRiverDragonfly(ctx, action, phase, variant),
    moveFrames: 24, moveFps: 36, attackPhases: meleePhases, attackFps: 10, attackRepeat: -1,
  })),
  { prefix: 'emq', draw: drawRiverMosquito, moveFrames: 24, moveFps: 36, attackPhases: mosquitoReleasePhases, attackFps: 24, attackRepeat: 0 },
];

function makeFlierFrame(draw: DrawFlier, action: FlierAction, phase: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = RIVER_FLIER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(RIVER_FLIER_SIZE / 2, artBaselineY);
  ctx.scale(artScale, artScale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, action, phase);
  return canvas;
}

export function generateRiverEnemyTextures(scene: Phaser.Scene): void {
  for (const { prefix, draw, moveFrames, attackPhases } of fliers) {
    for (let i = 0; i < moveFrames; i++) add(scene, `${prefix}_move${i}`, makeFlierFrame(draw, 'move', i / moveFrames));
    for (const [i, phase] of attackPhases.entries()) add(scene, `${prefix}_atk${i}`, makeFlierFrame(draw, 'attack', phase));
  }
  for (let i = 0; i < 2; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    drawRiverMosquitoDart(canvas.getContext('2d')!, i);
    add(scene, `mdart_${i}`, canvas);
  }
}

export function registerRiverEnemyAnimations(scene: Phaser.Scene): void {
  const register = (key: string, textureKeys: readonly string[], frameRate: number, repeat: number) => {
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({ key, frames: textureKeys.map(texture => ({ key: texture })), frameRate, repeat });
  };
  for (const { prefix, moveFrames, moveFps, attackPhases, attackFps, attackRepeat } of fliers) {
    register(`${prefix}-move`, Array.from({ length: moveFrames }, (_, i) => `${prefix}_move${i}`), moveFps, -1);
    register(`${prefix}-atk`, attackPhases.map((_, i) => `${prefix}_atk${i}`), attackFps, attackRepeat);
  }
  register('mdart-spin', ['mdart_0', 'mdart_1'], 8, -1);
}
