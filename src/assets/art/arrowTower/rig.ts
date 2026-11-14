import type Phaser from 'phaser';
import { drawFlyingArrow, RANGER_AIM_HEIGHT } from '../ranger/bow';
import { RANGER_ARROW_TIP_X } from '../ranger/textures';
import { ARROW_TOWER_ARCHER_SCALE, ARROW_TOWER_RELEASE, drawArrowTowerArcher, getArrowTowerShotOrigin } from './archer';
import { ARROW_TOWER_ART_SCALE, ARROW_TOWER_PLATFORM_Y } from './textures';

export const ARROW_TOWER_AIM_Y = -RANGER_AIM_HEIGHT * ARROW_TOWER_ARCHER_SCALE * ARROW_TOWER_ART_SCALE;
export const ARROW_TOWER_PROJECTILE_TEXTURE = 'arrow-tower-arrow';

const DIRECTION_COUNT = 32;
const DIRECTION_STEP = 2 * Math.PI / DIRECTION_COUNT;
const POSES = [0, .18, .36, ARROW_TOWER_RELEASE - .001, ARROW_TOWER_RELEASE, .66, .77];
const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 104;
const FRAME_FEET_Y = 86;

function directionFor(aim: number): number {
  const direction = Math.round(aim / DIRECTION_STEP) % DIRECTION_COUNT;
  return (direction + DIRECTION_COUNT) % DIRECTION_COUNT;
}

function frameFor(shot: number): number {
  if (shot < ARROW_TOWER_RELEASE) return Math.min(3, Math.round(shot / ARROW_TOWER_RELEASE * 3));
  if (shot >= .89) return 0;
  return 4 + Math.min(2, Math.round((shot - ARROW_TOWER_RELEASE) / .11));
}

function archerFrames(textures: Phaser.Textures.TextureManager, tier: 0 | 1 | 2, direction: number): string {
  const key = `arrow-tower-archer-${tier}-${direction}`;
  if (textures.exists(key)) return key;

  const texture = textures.createCanvas(key, FRAME_WIDTH * POSES.length, FRAME_HEIGHT)!;
  const ctx = texture.context;
  POSES.forEach((pose, index) => {
    ctx.save();
    ctx.translate(FRAME_WIDTH * (index + .5), FRAME_FEET_Y);
    drawArrowTowerArcher(ctx, tier, direction * DIRECTION_STEP, pose, 0);
    ctx.restore();
    texture.add(String(index), 0, index * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT);
  });
  texture.refresh();
  return key;
}

export function createArrowTowerArcher(scene: Phaser.Scene, x: number, towerY: number): Phaser.GameObjects.Sprite {
  const texture = getArrowTowerArcherIdleKey(scene, 0);
  return scene.add.sprite(x, towerY + ARROW_TOWER_PLATFORM_Y, texture)
    .setDisplayOrigin(FRAME_WIDTH / 2, FRAME_FEET_Y)
    .setScale(ARROW_TOWER_ART_SCALE);
}

export function getArrowTowerArcherIdleKey(scene: Phaser.Scene, tier: 0 | 1 | 2): string {
  const key = `arrow-tower-archer-idle-${tier}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, FRAME_WIDTH, FRAME_HEIGHT)!;
    const ctx = texture.context;
    ctx.translate(FRAME_WIDTH / 2, FRAME_FEET_Y);
    drawArrowTowerArcher(ctx, tier, 0, 0, 0);
    texture.refresh();
  }
  return key;
}

export function setArrowTowerArcherPose(sprite: Phaser.GameObjects.Sprite, tier: 0 | 1 | 2, aim: number, shot: number): void {
  const direction = directionFor(aim);
  const pose = frameFor(shot);
  if (direction === 0 && pose === 0) {
    const idle = getArrowTowerArcherIdleKey(sprite.scene, tier);
    if (sprite.texture.key !== idle) sprite.setTexture(idle);
    return;
  }
  const texture = archerFrames(sprite.scene.textures, tier, direction);
  const frame = String(pose);
  if (sprite.texture.key !== texture) sprite.setTexture(texture, frame);
  else if (sprite.frame.name !== frame) sprite.setFrame(frame);
}

export function getArrowTowerArcherShot(sprite: Phaser.GameObjects.Sprite, aim: number): { x: number; y: number } {
  const offset = getArrowTowerShotOrigin(directionFor(aim) * DIRECTION_STEP, 0);
  return { x: sprite.x + offset.x * sprite.scaleX, y: sprite.y + offset.y * sprite.scaleY };
}

export function generateArrowTowerProjectile(scene: Phaser.Scene): void {
  const texture = scene.textures.createCanvas(ARROW_TOWER_PROJECTILE_TEXTURE, 64, 64)!;
  const ctx = texture.context;
  ctx.translate(RANGER_ARROW_TIP_X, 32);
  const scale = ARROW_TOWER_ART_SCALE * ARROW_TOWER_ARCHER_SCALE / .5;
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawFlyingArrow(ctx);
  texture.refresh();
}
