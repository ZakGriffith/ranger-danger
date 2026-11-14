import type Phaser from 'phaser';
import { add } from '../canvas';
import { ARROW_TOWER_DECK_Y, drawArrowTowerBase } from './base';

const SIZE = 128;
const GROUND_Y = 112;
export const ARROW_TOWER_BASE_SCALE = .5;
export const ARROW_TOWER_ART_SCALE = .40;
export const ARROW_TOWER_PLATFORM_Y = (GROUND_Y - SIZE / 2) * ARROW_TOWER_BASE_SCALE + ARROW_TOWER_DECK_Y * ARROW_TOWER_ART_SCALE;

const BASE_KEYS = ['t_base', 't_base_1', 't_base_2'] as const;

export function generateArrowTowerBases(scene: Phaser.Scene): void {
  for (const tier of [0, 1, 2] as const) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    const scale = ARROW_TOWER_ART_SCALE / ARROW_TOWER_BASE_SCALE;
    ctx.translate(SIZE / 2, GROUND_Y);
    ctx.scale(scale, scale);
    drawArrowTowerBase(ctx, tier);
    add(scene, BASE_KEYS[tier], canvas);
  }
}
