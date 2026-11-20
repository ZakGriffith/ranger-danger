import type Phaser from 'phaser';
import { CFG } from '../config';
import { SFX } from '../audio/sfx';
import { CASTLE_WALL_ORIGIN_Y, type CastleTrapState } from '../assets/art/castleTerrain';
import {
  castleCell, castleHash, castleProps, castleTileAt, castleTrapAt, castleWallAt,
  CASTLE_SOLID_TILE, CASTLE_TRAP_TILE,
} from '../assets/art/castleLayout';
import { gridSet } from './Pathfinding';
import type { GameScene } from '../scenes/GameScene';

type Trap = { x: number; y: number; offset: number; state: CastleTrapState; sprite: Phaser.GameObjects.Image };

export function castleTrapState(time: number, offset: number): CastleTrapState {
  const phase = (time + offset) % CFG.castle.trapCycle;
  if (phase >= CFG.castle.trapCycle - CFG.castle.trapActiveDuration) return 'active';
  if (phase >= CFG.castle.trapCycle - CFG.castle.trapActiveDuration - CFG.castle.trapWarningDuration) return 'warning';
  return 'dormant';
}

export class CastleSystem {
  readonly trapBlockers: Phaser.Physics.Arcade.StaticGroup;
  private generatedChunks = new Set<string>();
  private traps: Trap[] = [];
  private nextDamageAt = 0;

  constructor(private scene: GameScene) {
    this.trapBlockers = scene.physics.add.staticGroup();
  }

  generateChunk(cx: number, cy: number) {
    const key = `${cx},${cy}`;
    if (this.generatedChunks.has(key)) return;
    this.generatedChunks.add(key);
    const scene = this.scene;
    const seed = scene.treeSeed;
    const t = CFG.tile;
    const x0 = cx * CFG.chunkSize, y0 = cy * CFG.chunkSize;
    for (let y = y0; y < y0 + CFG.chunkSize; y++) {
      for (let x = x0; x < x0 + CFG.chunkSize; x++) {
        const value = castleTileAt(x, y, seed);
        if (value === 0) continue;
        gridSet(scene.grid, x, y, value);
        const wx = (x + .5) * t, wy = (y + .5) * t;
        if (value === CASTLE_SOLID_TILE) {
          const blocker = scene.add.zone(wx, wy, t, t);
          scene.physics.add.existing(blocker, true);
          const body = blocker.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(t, t);
          body.position.set(x * t, y * t);
          scene.wallGroup.add(blocker);
          scene.pathing.syncWallTile(x, y, true);
        }
        if (castleWallAt(x, y, seed)) {
          const mask = (castleWallAt(x, y - 1, seed) ? 1 : 0)
            | (castleWallAt(x + 1, y, seed) ? 2 : 0)
            | (castleWallAt(x, y + 1, seed) ? 4 : 0)
            | (castleWallAt(x - 1, y, seed) ? 8 : 0);
          const variant = Math.floor(castleHash(x, y, seed + 211) * 3);
          scene.add.image(wx, wy, `castle_wall_${mask}_${variant}`)
            .setScale(.5).setOrigin(.5, CASTLE_WALL_ORIGIN_Y).setDepth(100 + (wy + t / 2) * .1);
        } else if (value === CASTLE_TRAP_TILE && castleTrapAt(x, y, seed)) {
          const cell = castleCell(x, y);
          const offset = Math.floor(castleHash(cell.x, cell.y, seed + 223) * CFG.castle.trapCycle);
          const state = castleTrapState(scene.vTime, offset);
          const sprite = scene.add.image(wx, wy, `castle_trap_${state}`)
            .setScale(.5).setOrigin(.5, 56 / 88).setDepth(-10);
          this.traps.push({ x, y, offset, state, sprite });
          const blocker = scene.add.zone(wx, wy, t, t);
          scene.physics.add.existing(blocker, true);
          const body = blocker.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(t, t);
          body.position.set(x * t, y * t);
          this.trapBlockers.add(blocker);
        }
      }
    }
    // A prop belongs to the chunk containing its anchor, even when its footprint straddles the boundary.
    const first = castleCell(x0, y0), last = castleCell(x0 + CFG.chunkSize - 1, y0 + CFG.chunkSize - 1);
    for (let y = first.y; y <= last.y; y++) for (let x = first.x; x <= last.x; x++) {
      for (const prop of castleProps(x, y, seed)) {
        if (prop.x < x0 || prop.x >= x0 + CFG.chunkSize || prop.y < y0 || prop.y >= y0 + CFG.chunkSize) continue;
        const wx = (prop.x + prop.width / 2) * t, wy = (prop.y + prop.height / 2) * t;
        const variant = Math.floor(castleHash(prop.x, prop.y, seed + 227) * 3);
        scene.add.image(wx, wy, `castle_tomb_${variant}`).setScale(.5)
          .setDepth(100 + (prop.y + prop.height) * t * .1);
      }
    }
    scene.gridVersion++;
    scene._wallCheckCache.clear();
  }

  update(time: number) {
    const scene = this.scene;
    const view = scene.cameras.main.worldView;
    const body = scene.player.body as Phaser.Physics.Arcade.Body;
    let onActiveTrap = false;
    let spikesRising = false;
    for (const trap of this.traps) {
      const wx = trap.x * CFG.tile, wy = trap.y * CFG.tile;
      const state = castleTrapState(time, trap.offset);
      const rising = state === 'active' && trap.state !== 'active';
      trap.state = state;
      if (wx < view.left - CFG.tile || wx > view.right + CFG.tile || wy < view.top - CFG.tile || wy > view.bottom + CFG.tile) continue;
      if (rising) spikesRising = true;
      const key = `castle_trap_${state}`;
      if (trap.sprite.texture.key !== key) trap.sprite.setTexture(key);
      if (state === 'active' && body.right > wx + 4 && body.left < wx + CFG.tile - 4
        && body.bottom > wy + 4 && body.top < wy + CFG.tile - 4) onActiveTrap = true;
    }
    // A whole patch rises together; its tiles share one sound instead of stacking voices.
    if (spikesRising) SFX.play('spikeRise');
    if (onActiveTrap && time >= this.nextDamageAt) {
      this.nextDamageAt = time + CFG.castle.trapDamageInterval;
      scene.player.hurt(CFG.castle.trapDamage, scene);
      scene.hud.pushHud();
      if (scene.player.hp <= 0) scene.end.lose();
    }
  }
}
