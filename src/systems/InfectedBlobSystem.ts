import type Phaser from 'phaser';
import {
  BLOB_MOVE_FRAMES, BLOB_ATTACK_FRAMES, BLOB_ATTACK_FRAME_MS,
  BLOB_ATTACK_DURATION_MS, BLOB_WINDUP_MS, BLOB_FLIGHT_MS, BLOB_IMPACT_MS,
} from '../assets/art/infectedBlob';
import type { Enemy } from '../entities/Enemy';
import type { Tower } from '../entities/Tower';
import type { GameScene } from '../scenes/GameScene';
import { InfectedBlobState } from '../state/InfectedBlobState';

const ATTACK_RANGE = 30;
const IMPACT_RANGE = 22;
const MAX_LUNGE = 32;
const ROLL_RADIUS = 12;

export class InfectedBlobSystem {
  private states = new Map<Enemy, InfectedBlobState>();

  constructor(private scene: GameScene) {}

  isAttacking(enemy: Enemy): boolean {
    return this.states.get(enemy)?.attacking === true;
  }

  tryAttack(enemy: Enemy): boolean {
    const scene = this.scene;
    if (enemy.kind !== 'infected_basic' || !enemy.active || enemy.dying
        || scene.physics.world.isPaused || scene.buildState.paused
        || scene.endState.gameOver || scene.endState.dying) return false;
    const state = this.stateFor(enemy);
    if (state.attacking) return false;
    const dx = scene.player.x - enemy.x;
    const dy = scene.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= ATTACK_RANGE || this.routeBlocked(enemy, scene.player.x, scene.player.y)) return false;

    const speed = Math.min(distance, MAX_LUNGE) / (BLOB_FLIGHT_MS / 1000);
    const inverseDistance = distance === 0 ? 0 : 1 / distance;
    state.startWindup(dx * inverseDistance * speed, dy * inverseDistance * speed);
    if (dx !== 0) enemy.setFlipX(dx < 0);
    enemy.setVelocity(0, 0);
    enemy.setTexture(`eiblob${enemy.variant}_atk0`);
    return true;
  }

  update(deltaGameMs: number): void {
    const scene = this.scene;
    for (const [enemy] of this.states) {
      if (!enemy.active || enemy.dying) {
        if (enemy.active) enemy.setVelocity(0, 0);
        this.states.delete(enemy);
      }
    }
    if (scene.physics.world.isPaused || scene.buildState.paused
        || scene.endState.gameOver || scene.endState.dying) return;

    for (const enemy of scene.enemies.getChildren() as Enemy[]) {
      if (!enemy.active || enemy.dying || enemy.kind !== 'infected_basic') continue;
      const state = this.stateFor(enemy);
      const distance = Math.hypot(enemy.x - state.previousX, enemy.y - state.previousY);
      state.previousX = enemy.x;
      state.previousY = enemy.y;
      if (!state.attacking) {
        state.rollFrame = (state.rollFrame + distance / (Math.PI * 2 * ROLL_RADIUS) * BLOB_MOVE_FRAMES.length) % BLOB_MOVE_FRAMES.length;
        this.drawRolling(enemy, state);
        continue;
      }

      state.elapsed += deltaGameMs;
      if (state.phase === 'windup' && state.elapsed >= BLOB_WINDUP_MS) state.launch();
      if (state.phase === 'airborne' && state.elapsed >= BLOB_IMPACT_MS) {
        state.land();
        enemy.setVelocity(0, 0);
        this.hitPlayer(enemy);
      }
      if (state.elapsed >= BLOB_ATTACK_DURATION_MS) {
        state.resumeRolling();
        enemy.setVelocity(0, 0);
        this.drawRolling(enemy, state);
      } else {
        if (state.phase === 'airborne') enemy.setVelocity(state.velocityX, state.velocityY);
        else enemy.setVelocity(0, 0);
        const frame = Math.min(BLOB_ATTACK_FRAMES.length - 1, Math.floor(state.elapsed / BLOB_ATTACK_FRAME_MS));
        enemy.setTexture(`eiblob${enemy.variant}_atk${frame}`);
      }
      if (scene.endState.dying) return;
    }
  }

  destroy(): void {
    for (const [enemy, state] of this.states) {
      if (enemy.active && state.attacking) enemy.setVelocity(0, 0);
    }
    this.states.clear();
  }

  private stateFor(enemy: Enemy): InfectedBlobState {
    let state = this.states.get(enemy);
    if (!state) {
      state = new InfectedBlobState(enemy.x, enemy.y, Math.random() * BLOB_MOVE_FRAMES.length);
      this.states.set(enemy, state);
    }
    return state;
  }

  private drawRolling(enemy: Enemy, state: InfectedBlobState): void {
    enemy.setTexture(`eiblob${enemy.variant}_move${Math.floor(state.rollFrame)}`);
  }

  private hitPlayer(enemy: Enemy): void {
    const scene = this.scene;
    if (Math.hypot(scene.player.x - enemy.x, scene.player.y - enemy.y) > IMPACT_RANGE
        || this.routeBlocked(enemy, scene.player.x, scene.player.y)) return;
    scene.player.hurt(enemy.dmg, scene);
    scene.hud.pushHud();
    if (scene.player.hp <= 0) scene.end.lose();
  }

  private routeBlocked(enemy: Enemy, tx: number, ty: number): boolean {
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const halfW = body.width / 2 + 1;
    const halfH = body.height / 2 + 1;
    if (this.scene.pathing.bodyLineBlocked(enemy.x, enemy.y, tx, ty, halfW, halfH)) return true;

    // Pathfinding allows gaps around tower tiles; attacks still respect their actual bodies.
    for (const tower of this.scene.towerGroup.getChildren() as Tower[]) {
      const blocker = tower.body as Phaser.Physics.Arcade.StaticBody;
      if (!tower.active || !blocker.enable) continue;
      if (this.segmentHitsRectangle(enemy.x, enemy.y, tx, ty,
        blocker.left - halfW, blocker.top - halfH,
        blocker.right + halfW, blocker.bottom + halfH)) return true;
    }
    return false;
  }

  private segmentHitsRectangle(
    x0: number, y0: number, x1: number, y1: number,
    left: number, top: number, right: number, bottom: number,
  ): boolean {
    let enter = 0;
    let exit = 1;
    for (const [origin, delta, min, max] of [
      [x0, x1 - x0, left, right], [y0, y1 - y0, top, bottom],
    ]) {
      if (delta === 0) {
        if (origin < min || origin > max) return false;
      } else {
        const a = (min - origin) / delta;
        const b = (max - origin) / delta;
        enter = Math.max(enter, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
        if (enter > exit) return false;
      }
    }
    return true;
  }
}
