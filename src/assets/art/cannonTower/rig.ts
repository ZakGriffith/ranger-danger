import type Phaser from 'phaser';
import { CANNON_TOWER_WEAPON_SCALE } from './base';
import {
  CANNON_TOWER_BARREL_RISE, CANNON_TOWER_BARREL_Y, CANNON_TOWER_IGNITION_START, CANNON_TOWER_RECOIL_DURATION, CANNON_TOWER_RELEASE,
  drawCannonTowerGun, getCannonTowerMuzzle,
} from './gun';

type Tier = 0 | 1 | 2;
type Sprite = Phaser.GameObjects.Sprite;

const DIRECTION_COUNT = 120;
const DIRECTION_STEP = 2 * Math.PI / DIRECTION_COUNT;
const IDLE_FRAME = { width: 112, height: 96, pivotY: 73 };
const SHOT_FRAME = { width: 166, height: 148, pivotY: 100 };
const RECOVERY_END = CANNON_TOWER_RELEASE + CANNON_TOWER_RECOIL_DURATION;

interface GunPose {
  tier: Tier;
  direction: number;
  cycle: number;
  shotTexture: Phaser.Textures.CanvasTexture | null;
}

const poses = new WeakMap<Sprite, GunPose>();
let nextShotTextureId = 0;

function directionFor(aim: number): number {
  const direction = Math.round(aim / DIRECTION_STEP) % DIRECTION_COUNT;
  return (direction + DIRECTION_COUNT) % DIRECTION_COUNT;
}

function idleKey(scene: Phaser.Scene, tier: Tier, direction: number): string {
  const key = `cannon-tower-gun-${tier}-${direction}`;
  if (scene.textures.exists(key)) return key;

  const { width, height, pivotY } = IDLE_FRAME;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(width / 2, pivotY);
  drawCannonTowerGun(ctx, tier, direction * DIRECTION_STEP, 0);
  scene.textures.addCanvas(key, canvas);
  return key;
}

export function getCannonTowerGunIdleKey(scene: Phaser.Scene, tier: Tier): string {
  return idleKey(scene, tier, 0);
}

export function createCannonTowerGun(scene: Phaser.Scene, x: number, deckY: number, tier: Tier = 0): Sprite {
  const sprite = scene.add.sprite(x, deckY, getCannonTowerGunIdleKey(scene, tier))
    .setDisplayOrigin(IDLE_FRAME.width / 2, IDLE_FRAME.pivotY)
    .setScale(CANNON_TOWER_WEAPON_SCALE);
  const pose: GunPose = { tier, direction: 0, cycle: 0, shotTexture: null };
  poses.set(sprite, pose);
  sprite.once('destroy', () => {
    if (pose.shotTexture) {
      sprite.setVisible(false);
      scene.textures.remove(pose.shotTexture);
    }
  });
  return sprite;
}

export function setCannonTowerGunPose(sprite: Sprite, tier: Tier, aim: number, shot: number): void {
  const pose = poses.get(sprite)!;
  const direction = directionFor(aim);
  const cycle = shot > CANNON_TOWER_IGNITION_START && shot < RECOVERY_END ? shot : 0;
  if (pose.tier === tier && pose.direction === direction && pose.cycle === cycle) return;
  pose.tier = tier;
  pose.direction = direction;
  pose.cycle = cycle;

  const scene = sprite.scene;
  if (cycle === 0) {
    sprite.setTexture(idleKey(scene, tier, direction)).setDisplayOrigin(IDLE_FRAME.width / 2, IDLE_FRAME.pivotY);
    return;
  }

  // Keep shot texture memory proportional to the number of towers while sharing idle headings.
  const { width, height, pivotY } = SHOT_FRAME;
  pose.shotTexture ??= scene.textures.createCanvas(`cannon-tower-shot-${nextShotTextureId++}`, width, height)!;
  const texture = pose.shotTexture;
  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, pivotY);
  drawCannonTowerGun(ctx, tier, direction * DIRECTION_STEP, cycle);
  ctx.restore();
  texture.refresh();
  if (sprite.texture !== texture) sprite.setTexture(texture.key).setDisplayOrigin(width / 2, pivotY);
}

export function getCannonTowerAim(sprite: Sprite, targetX: number, targetY: number): { angle: number; launchLift: number } {
  const boreY = sprite.y + CANNON_TOWER_BARREL_Y * sprite.scaleY;
  const x = (targetX - sprite.x) / sprite.scaleX;
  const y = (targetY - boreY) / sprite.scaleY;
  return {
    angle: Math.atan2(y, x),
    launchLift: Math.hypot(x, y) * CANNON_TOWER_BARREL_RISE * sprite.scaleY,
  };
}

export function getCannonTowerShot(sprite: Sprite, tier: Tier, aim: number, shot = CANNON_TOWER_RELEASE): { x: number; y: number } {
  const offset = getCannonTowerMuzzle(tier, directionFor(aim) * DIRECTION_STEP, shot);
  return { x: sprite.x + offset.x * sprite.scaleX, y: sprite.y + offset.y * sprite.scaleY };
}
