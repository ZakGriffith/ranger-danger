import type Phaser from 'phaser';
import { CFG } from '../../../config';
import { add } from '../canvas';
import {
  BLOB_ATTACK_FRAMES, BLOB_ATTACK_FRAME_MS, BLOB_FRAMES, BLOB_MOVE_FRAMES, BLOB_VARIANTS,
  makeInfectedBlobFrame,
} from '../infectedBlob';
import {
  INFECTED_SPIDER_ATTACK_FPS, INFECTED_SPIDER_ATTACK_FRAMES, INFECTED_SPIDER_FRAMES,
  INFECTED_SPIDER_MOVE_FPS, INFECTED_SPIDER_MOVE_FRAMES, INFECTED_SPIDER_VARIANTS,
  infectedSpiderTexturePrefix, makeIllustratedInfectedRunnerFrame,
} from '../infectedSpider';
import {
  IRONCAP_ATTACK_FPS, IRONCAP_ATTACK_FRAMES, IRONCAP_FRAMES, IRONCAP_MOVE_FPS, IRONCAP_MOVE_FRAMES,
  makeIllustratedIroncapFrame,
} from '../ironcap';
import {
  TOAD_ATTACK_FPS, TOAD_ATTACK_FRAMES, TOAD_FRAMES, TOAD_HOP_FRAMES, TOAD_IDLE_FPS, TOAD_IDLE_FRAMES,
  TOAD_VARIANTS, makeIllustratedToadFrame, toadTexturePrefix,
} from '../toad';
import { makeToadVenomFrame, TOAD_BOMB_FRAMES, toadBombTextureKey } from '../toadPoison';
import { POISON_SMOKE_FRAME_MS } from '../poisonSmoke';
import { LANTERN_MAW_DASH_FRAMES, LANTERN_MAW_FRAMES, makeLanternMawFrame, makeLanternMawThrowFrame } from './lanternMaw';
import { LANTERN_MAW_GOO_FRAMES, LANTERN_MAW_THROW_FRAME_MS, LANTERN_MAW_THROW_FRAMES, makeLanternMawGooFrame } from './lanternMawThrow';
import {
  LANTERN_MAW_GAS_FIRST_FRAME, LANTERN_MAW_WAKE_FRAMES, LANTERN_MAW_WAKE_VARIANTS,
  lanternMawWakeKey, makeLanternMawWakeFrame,
} from './lanternMawSmoke';

export function generateInfectedTextures(scene: Phaser.Scene): void {
  for (let variant = 0; variant < BLOB_VARIANTS; variant++) {
    for (const frame of BLOB_FRAMES) add(scene, `eiblob${variant}_${frame}`, makeInfectedBlobFrame(frame, variant));
  }
  for (const frame of IRONCAP_FRAMES) add(scene, `eih_${frame}`, makeIllustratedIroncapFrame(frame));
  for (let variant = 0; variant < INFECTED_SPIDER_VARIANTS; variant++) {
    const prefix = infectedSpiderTexturePrefix(variant);
    for (const frame of INFECTED_SPIDER_FRAMES) add(scene, `${prefix}_${frame}`, makeIllustratedInfectedRunnerFrame(frame, variant));
  }
  for (let variant = 0; variant < TOAD_VARIANTS; variant++) {
    const prefix = toadTexturePrefix(variant);
    for (const frame of TOAD_FRAMES) add(scene, `${prefix}_${frame}`, makeIllustratedToadFrame(frame, variant));
    for (const frame of TOAD_BOMB_FRAMES) add(scene, toadBombTextureKey(variant, frame), makeToadVenomFrame(frame, variant));
  }
  for (const frame of LANTERN_MAW_FRAMES) {
    add(scene, `iboss_${frame}`, makeLanternMawFrame(frame));
  }
  for (const frame of LANTERN_MAW_THROW_FRAMES) {
    add(scene, `iboss_${frame}`, makeLanternMawThrowFrame(frame));
  }
  for (const frame of LANTERN_MAW_GOO_FRAMES) {
    add(scene, `iboss_goo_${frame}`, makeLanternMawGooFrame(frame));
  }
  for (let variant = 0; variant < LANTERN_MAW_WAKE_VARIANTS; variant++) {
    for (const frame of LANTERN_MAW_WAKE_FRAMES) add(scene, lanternMawWakeKey(variant, frame), makeLanternMawWakeFrame(variant, frame));
  }
}

export function registerInfectedAnimations(scene: Phaser.Scene): void {
  const register = (prefix: string, clip: string, frames: readonly string[], frameRate: number, repeat: number) => {
    const key = `${prefix}-${clip}`;
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({ key, frames: frames.map(frame => ({ key: `${prefix}_${frame}` })), frameRate, repeat });
  };

  for (let variant = 0; variant < BLOB_VARIANTS; variant++) {
    const prefix = `eiblob${variant}`;
    register(prefix, 'move', BLOB_MOVE_FRAMES, 32, -1);
    register(prefix, 'atk', BLOB_ATTACK_FRAMES, 1000 / BLOB_ATTACK_FRAME_MS, 0);
    register(prefix, 'hit', ['hit'], 10, 0);
  }
  register('eih', 'move', IRONCAP_MOVE_FRAMES, IRONCAP_MOVE_FPS, -1);
  register('eih', 'atk', IRONCAP_ATTACK_FRAMES, IRONCAP_ATTACK_FPS, 0);
  register('eih', 'hit', ['hit'], 8, 0);
  for (let variant = 0; variant < INFECTED_SPIDER_VARIANTS; variant++) {
    const prefix = infectedSpiderTexturePrefix(variant);
    register(prefix, 'move', INFECTED_SPIDER_MOVE_FRAMES, INFECTED_SPIDER_MOVE_FPS, -1);
    register(prefix, 'atk', INFECTED_SPIDER_ATTACK_FRAMES, INFECTED_SPIDER_ATTACK_FPS, -1);
  }

  const hopFps = TOAD_HOP_FRAMES.length * 1000 / CFG.infected.toadHopDuration;
  for (let variant = 0; variant < TOAD_VARIANTS; variant++) {
    const prefix = toadTexturePrefix(variant);
    register(prefix, 'idle', TOAD_IDLE_FRAMES, TOAD_IDLE_FPS, -1);
    register(prefix, 'hop', TOAD_HOP_FRAMES, hopFps, 0);
    register(prefix, 'atk', TOAD_ATTACK_FRAMES, TOAD_ATTACK_FPS, 0);
    register(prefix, 'hit', ['hit'], 8, 0);
  }

  register('iboss', 'idle', ['idle0', 'idle1', 'idle2', 'idle3'], 6, -1);
  register('iboss', 'move', ['move0', 'move1', 'move2', 'move3'], 8, -1);
  register('iboss', 'atk', ['atk0', 'atk1'], 4, 0);
  register('iboss', 'chargewind', [
    'chargeWind0', 'chargeWind1', 'chargeWind2', 'chargeWind3', 'chargeWind4', 'chargeWind5',
    'chargeWind2', 'chargeWind3', 'chargeWind4', 'chargeWind5',
  ], 8, 0);
  register('iboss', 'dash', LANTERN_MAW_DASH_FRAMES, 12, -1);
  register('iboss', 'throw', LANTERN_MAW_THROW_FRAMES, 1000 / LANTERN_MAW_THROW_FRAME_MS, 0);
  register('iboss', 'hit', ['hit'], 10, 0);
  register('iboss', 'birth', ['birth0', 'birth1', 'birth2', 'birth3', 'birth4'], 4, 0);
  register('iboss', 'die', ['die0', 'die1', 'die2', 'die3', 'die4'], 6, 0);

  for (let variant = 0; variant < LANTERN_MAW_WAKE_VARIANTS; variant++) {
    register('iboss', `wake-${variant}`, LANTERN_MAW_WAKE_FRAMES.map(frame => `wake_${variant}_${frame}`), 1000 / POISON_SMOKE_FRAME_MS, 0);
  }
  const gasKey = 'iboss-gas';
  if (scene.anims.exists(gasKey)) scene.anims.remove(gasKey);
  scene.anims.create({
    key: gasKey,
    frames: Array.from({ length: 55 }, (_, i) => ({ key: `toad_smoke_0_${i + LANTERN_MAW_GAS_FIRST_FRAME}` })),
    frameRate: 1000 / POISON_SMOKE_FRAME_MS,
    repeat: -1,
    yoyo: true,
  });
}
