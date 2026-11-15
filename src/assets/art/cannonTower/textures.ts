import type Phaser from 'phaser';
import { add } from '../canvas';
import { CANNON_TOWER_ART_SCALE, CANNON_TOWER_DECK_Y, drawCannonTowerBase } from './base';
import { CANNON_TOWER_BALL_RADIUS, drawCannonTowerBall } from './ball';

const BASE_SIZE = 128;
const BASE_GROUND_Y = 112;
export const CANNON_TOWER_BASE_SCALE = .5;
export const CANNON_TOWER_PROJECTILE_TEXTURE = 'cannon-tower-ball';
export const CANNON_TOWER_PLATFORM_Y = (BASE_GROUND_Y - BASE_SIZE / 2) * CANNON_TOWER_BASE_SCALE
  + CANNON_TOWER_DECK_Y * CANNON_TOWER_ART_SCALE;
const BASE_KEYS = ['c_base', 'c_base_1', 'c_base_2'] as const;

export function generateCannonTowerBases(scene: Phaser.Scene): void {
  for (const tier of [0, 1, 2] as const) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = BASE_SIZE;
    const ctx = canvas.getContext('2d')!;
    const scale = CANNON_TOWER_ART_SCALE / CANNON_TOWER_BASE_SCALE;
    ctx.translate(BASE_SIZE / 2, BASE_GROUND_Y);
    ctx.scale(scale, scale);
    drawCannonTowerBase(ctx, tier);
    add(scene, BASE_KEYS[tier], canvas);
  }
}

export function generateCannonTowerProjectile(scene: Phaser.Scene): void {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  drawCannonTowerBall(ctx, canvas.width / 2, canvas.height / 2, CANNON_TOWER_BALL_RADIUS);
  add(scene, CANNON_TOWER_PROJECTILE_TEXTURE, canvas);
}
