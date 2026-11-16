import type Phaser from 'phaser';
import { CFG } from '../../config';
import { add } from './canvas';
import { WALL_ART_SCALE, WALL_TEXTURE_SIZE, drawFieldstoneWall, wallTextureKey } from './fieldstone';

export function generateWallTextures(scene: Phaser.Scene) {
  const resolution = 1 / WALL_ART_SCALE;
  const padding = (WALL_TEXTURE_SIZE - CFG.tile) / 2;
  for (let mask = 0; mask < 16; mask++) {
    for (const damaged of [false, true]) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = WALL_TEXTURE_SIZE * resolution;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(resolution, resolution);
      ctx.translate(padding, padding);
      drawFieldstoneWall(ctx, mask, damaged);
      add(scene, wallTextureKey(mask, damaged), canvas);
    }
  }
}
