import type Phaser from 'phaser';
import { CANNON_TOWER_DECK_Y, CANNON_TOWER_WEAPON_SIZE_MULTIPLIER } from './base';
import { drawFoundryBase } from './foundry';
import { drawCannonTowerGun } from './gun';

export const CANNON_TOWER_GALLERY_KEYS = [
  'cannon-tower-gallery-1', 'cannon-tower-gallery-2', 'cannon-tower-gallery-3',
] as const;

export function generateCannonTowerGalleryTextures(scene: Phaser.Scene): void {
  for (const tier of [0, 1, 2] as const) {
    const key = CANNON_TOWER_GALLERY_KEYS[tier];
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, 132, 164)!;
    const ctx = texture.context;
    ctx.translate(texture.width / 2, 144);
    drawFoundryBase(ctx, tier);
    ctx.translate(0, CANNON_TOWER_DECK_Y);
    ctx.scale(CANNON_TOWER_WEAPON_SIZE_MULTIPLIER, CANNON_TOWER_WEAPON_SIZE_MULTIPLIER);
    drawCannonTowerGun(ctx, tier, .38, 0);
    texture.refresh();
  }
}
