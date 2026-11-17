import type Phaser from 'phaser';
import { CFG } from '../../../config';
import { add } from '../canvas';
import {
  BLOB_ATTACK_FRAMES, BLOB_ATTACK_FRAME_MS, BLOB_FRAMES, BLOB_MOVE_FRAMES, BLOB_VARIANTS,
  makeInfectedBlobFrame,
} from '../infectedBlob';
import {
  INFECTED_SPIDER_ATTACK_FPS, INFECTED_SPIDER_ATTACK_FRAMES, INFECTED_SPIDER_FRAMES,
  INFECTED_SPIDER_MOVE_FPS, INFECTED_SPIDER_MOVE_FRAMES, makeIllustratedInfectedRunnerFrame,
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
import { LANTERN_MAW_DASH_FRAMES, LANTERN_MAW_FRAMES, makeLanternMawFrame } from './lanternMaw';

export function generateInfectedTextures(scene: Phaser.Scene): void {
  for (let variant = 0; variant < BLOB_VARIANTS; variant++) {
    for (const frame of BLOB_FRAMES) add(scene, `eiblob${variant}_${frame}`, makeInfectedBlobFrame(frame, variant));
  }
  for (const frame of IRONCAP_FRAMES) add(scene, `eih_${frame}`, makeIllustratedIroncapFrame(frame));
  for (const frame of INFECTED_SPIDER_FRAMES) add(scene, `eir_${frame}`, makeIllustratedInfectedRunnerFrame(frame));
  for (let variant = 0; variant < TOAD_VARIANTS; variant++) {
    const prefix = toadTexturePrefix(variant);
    for (const frame of TOAD_FRAMES) add(scene, `${prefix}_${frame}`, makeIllustratedToadFrame(frame, variant));
    for (const frame of TOAD_BOMB_FRAMES) add(scene, toadBombTextureKey(variant, frame), makeToadVenomFrame(frame, variant));
  }
  for (const frame of LANTERN_MAW_FRAMES) {
    add(scene, `iboss_${frame}`, makeLanternMawFrame(frame));
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
  register('eir', 'move', INFECTED_SPIDER_MOVE_FRAMES, INFECTED_SPIDER_MOVE_FPS, -1);
  register('eir', 'atk', INFECTED_SPIDER_ATTACK_FRAMES, INFECTED_SPIDER_ATTACK_FPS, -1);

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
  register('iboss', 'hit', ['hit'], 10, 0);
  register('iboss', 'birth', ['birth0', 'birth1', 'birth2', 'birth3', 'birth4'], 4, 0);
  register('iboss', 'die', ['die0', 'die1', 'die2', 'die3', 'die4'], 6, 0);
}
