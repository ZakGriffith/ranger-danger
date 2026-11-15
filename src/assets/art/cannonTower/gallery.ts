import type Phaser from 'phaser';
import { CANNON_TOWER_DECK_Y, drawCannonTowerBase } from './base';
import { drawCannonTowerGun } from './gun';

export const CANNON_TOWER_GALLERY_KEYS = [
  'cannon-tower-gallery-1', 'cannon-tower-gallery-2', 'cannon-tower-gallery-3',
] as const;

export function generateCannonTowerGalleryTextures(scene: Phaser.Scene): void {
  for (const tier of [0, 1, 2] as const) {
    const key = CANNON_TOWER_GALLERY_KEYS[tier];
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, 124, 145)!;
    const ctx = texture.context;
    ctx.translate(texture.width / 2, 130);
    drawCannonTowerBase(ctx, tier);
    ctx.translate(0, CANNON_TOWER_DECK_Y);
    drawCannonTowerGun(ctx, tier, .38, 0);
    texture.refresh();
  }
}
