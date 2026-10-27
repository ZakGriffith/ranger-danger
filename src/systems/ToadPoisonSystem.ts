import type Phaser from 'phaser';
import { CFG } from '../config';
import { TOAD_ATTACK_RELEASE_MS, TOAD_SPIT_ORIGIN } from '../assets/art/toad';
import { TOAD_BOMB_FRAMES, TOAD_BOMB_FRAME_MS } from '../assets/art/toadPoison';
import { POISON_SMOKE_VARIANTS, POISON_SMOKE_FRAME_MS, POISON_SMOKE_GROUND_Y, POISON_SMOKE_RADIUS, POISON_SMOKE_DEPTH } from '../assets/art/poisonSmoke';
import type { Tower } from '../entities/Tower';
import type { Enemy } from '../entities/Enemy';
import type { GameScene } from '../scenes/GameScene';

type PendingThrow = { source: Enemy; x: number; y: number; releaseAt: number; animationPausedByUs: boolean };
type Bomb = {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Graphics;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  born: number;
  duration: number;
};
type CloudStyle = { radius: number; lifetime: number; texturePrefix: string };
type Cloud = CloudStyle & { sprite: Phaser.GameObjects.Image; x: number; y: number; born: number; variant: number };
type ExposureInterval = { start: number; end: number };

export class ToadPoisonSystem {
  private time = 0;
  private exposure = 0;
  private towerExposure = new Map<Tower, number>();
  private pending = new Set<PendingThrow>();
  private bombs = new Set<Bomb>();
  private clouds = new Set<Cloud>();

  constructor(private scene: GameScene) {}

  queueThrow(source: Enemy, tx: number, ty: number): void {
    this.pending.add({ source, x: tx, y: ty, releaseAt: this.time + TOAD_ATTACK_RELEASE_MS, animationPausedByUs: false });
  }

  spawn(sx: number, sy: number, tx: number, ty: number): void {
    this.spawnAt(sx, sy, tx, ty, this.time);
  }

  spawnSpiderCloud(x: number, y: number): void {
    this.addCloud(x, y, this.time, {
      radius: CFG.infected.spiderPoisonRadius,
      lifetime: CFG.infected.spiderPoisonLifetime,
      texturePrefix: 'spider_smoke',
    });
  }

  update(deltaGameMs: number): void {
    const scene = this.scene;
    if (scene.physics.world.isPaused || scene.buildState.paused) {
      for (const pending of this.pending) {
        if (!pending.source.active || pending.source.dying) {
          this.pending.delete(pending);
        } else if (!pending.source.anims.isPaused) {
          pending.source.anims.pause();
          pending.animationPausedByUs = true;
        }
      }
      return;
    }
    if (scene.endState.gameOver || scene.endState.dying) return;
    const start = this.time;
    this.time += deltaGameMs;

    for (const pending of this.pending) {
      const source = pending.source;
      this.resumeSourceAnimation(pending);
      if (!source.active || source.dying) {
        this.pending.delete(pending);
      } else if (pending.releaseAt <= this.time) {
        const mouthX = (source.flipX ? 64 - TOAD_SPIT_ORIGIN.x : TOAD_SPIT_ORIGIN.x) / 64;
        const mouthY = (source.flipY ? 64 - TOAD_SPIT_ORIGIN.y : TOAD_SPIT_ORIGIN.y) / 64;
        const mouth = source.getWorldTransformMatrix().transformPoint(
          (mouthX - source.originX) * source.width,
          (mouthY - source.originY) * source.height,
        );
        this.spawnAt(mouth.x, mouth.y, pending.x, pending.y, pending.releaseAt);
        this.pending.delete(pending);
      }
    }

    for (const bomb of this.bombs) {
      if (this.time >= bomb.born + bomb.duration) {
        this.addCloud(bomb.tx, bomb.ty, bomb.born + bomb.duration);
        this.destroyBomb(bomb);
        this.bombs.delete(bomb);
      } else {
        this.drawBomb(bomb);
      }
    }

    this.updateExposure(start);
    if (!scene.endState.gameOver && !scene.endState.dying) this.updateTowerExposure(start);
    for (const cloud of this.clouds) {
      const age = this.time - cloud.born;
      if (age >= cloud.lifetime) {
        cloud.sprite.destroy();
        this.clouds.delete(cloud);
      } else {
        cloud.sprite.setTexture(`${cloud.texturePrefix}_${cloud.variant}_${Math.floor(age / POISON_SMOKE_FRAME_MS)}`);
      }
    }
  }

  destroy(): void {
    for (const pending of this.pending) this.resumeSourceAnimation(pending);
    this.pending.clear();
    for (const bomb of this.bombs) this.destroyBomb(bomb);
    this.bombs.clear();
    for (const cloud of this.clouds) cloud.sprite.destroy();
    this.clouds.clear();
    this.exposure = 0;
    this.towerExposure.clear();
  }

  private spawnAt(sx: number, sy: number, tx: number, ty: number, born: number): void {
    const distance = Math.hypot(tx - sx, ty - sy);
    if (distance === 0) {
      this.addCloud(tx, ty, born);
      return;
    }
    const bomb: Bomb = {
      sprite: this.scene.add.image(sx, sy, 'toad_bomb_0').setScale(0.8).setName('toad-poison-bomb'),
      shadow: this.scene.add.ellipse(sx, sy, 9, 2.5, 0x101115, 0.19).setName('toad-poison-shadow'),
      trail: this.scene.add.graphics().setName('toad-poison-trail'),
      sx, sy, tx, ty, born,
      duration: distance / CFG.infected.toadBombSpeed * 1000,
    };
    this.bombs.add(bomb);
    this.drawBomb(bomb);
  }

  private drawBomb(bomb: Bomb): void {
    const age = this.time - bomb.born;
    const progress = Math.min(1, age / bomb.duration);
    const groundX = bomb.sx + (bomb.tx - bomb.sx) * progress;
    const groundY = bomb.sy + (bomb.ty - bomb.sy) * progress;
    const depth = 100 + groundY * 0.1;
    bomb.sprite.setPosition(groundX, groundY - Math.sin(Math.PI * progress) * CFG.infected.toadBombArcHeight)
      .setDepth(depth + 3).setTexture(`toad_bomb_${Math.floor(age / TOAD_BOMB_FRAME_MS) % TOAD_BOMB_FRAMES.length}`);
    bomb.shadow.setPosition(groundX, groundY).setDepth(depth - 0.5).setScale(1 + progress * 0.3);
    bomb.trail.clear().setDepth(depth + 2.9);
    for (let i = 3; i >= 1; i--) {
      const tail = progress - i * 0.045;
      if (tail < 0) continue;
      const x = bomb.sx + (bomb.tx - bomb.sx) * tail;
      const y = bomb.sy + (bomb.ty - bomb.sy) * tail - Math.sin(Math.PI * tail) * CFG.infected.toadBombArcHeight;
      bomb.trail.fillStyle(i === 1 ? 0xa8bd6b : i === 2 ? 0x83a163 : 0xbdd485, 0.4 - i * 0.07);
      bomb.trail.fillRect(Math.round(x), Math.round(y), 1 + i * 0.5, 1 + i * 0.5);
    }
  }

  private addCloud(x: number, y: number, born: number, style: CloudStyle = {
    radius: CFG.infected.toadPoisonRadius,
    lifetime: CFG.infected.toadPoisonLifetime,
    texturePrefix: 'toad_smoke',
  }): void {
    const { radius, texturePrefix } = style;
    const variant = Math.floor(Math.random() * POISON_SMOKE_VARIANTS);
    const sprite = this.scene.add.image(x, y, `${texturePrefix}_${variant}_0`)
      .setFlipX(Math.random() < 0.5)
      .setOrigin(0.5, POISON_SMOKE_GROUND_Y / 128).setScale(radius / POISON_SMOKE_RADIUS)
      .setDepth(100 + (y + radius * POISON_SMOKE_DEPTH) * 0.1 + 0.1).setName(`${texturePrefix}-cloud`);
    this.clouds.add({ sprite, x, y, born, variant, ...style });
  }

  private updateExposure(start: number): void {
    const scene = this.scene;
    const { intervals: merged, insideAtEnd } = this.coverage(start, scene.player.x, scene.player.y);
    let cursor = start;
    for (const interval of merged) {
      if (interval.start > cursor) this.exposure = 0;
      this.exposure += interval.end - interval.start;
      if (this.exposure >= CFG.infected.toadPoisonTickMs) {
        const hp = scene.player.hp;
        scene.player.hurt(CFG.infected.toadPoisonDamage, scene, 'poison');
        if (scene.player.hp < hp) {
          // Retry immune ticks on the next frame; align new exposure with actual damage.
          this.exposure = 0;
          scene.hud.pushHud();
          if (scene.player.hp <= 0) {
            scene.end.lose();
            this.exposure = 0;
            return;
          }
        }
      }
      cursor = interval.end;
    }
    if (!insideAtEnd || cursor < this.time) this.exposure = 0;
  }

  private coverage(start: number, x: number, y: number, halfWidth = 0, halfHeight = 0): { intervals: ExposureInterval[]; insideAtEnd: boolean } {
    const intervals: ExposureInterval[] = [];
    let insideAtEnd = false;
    for (const cloud of this.clouds) {
      const dx = Math.max(0, Math.abs(x - cloud.x) - halfWidth);
      const dy = Math.max(0, Math.abs(y - cloud.y) - halfHeight) / POISON_SMOKE_DEPTH;
      if (dx * dx + dy * dy >= cloud.radius ** 2) continue;
      const expiry = cloud.born + cloud.lifetime;
      const interval = { start: Math.max(start, cloud.born), end: Math.min(this.time, expiry) };
      if (interval.end > interval.start) intervals.push(interval);
      if (cloud.born <= this.time && expiry > this.time) insideAtEnd = true;
    }
    intervals.sort((a, b) => a.start - b.start);
    // Merge coverage before ticking: overlapping clouds are one poison exposure,
    // and a landing partway through a frame cannot count its earlier flight time.
    const merged: ExposureInterval[] = [];
    for (const interval of intervals) {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push({ ...interval });
    }
    return { intervals: merged, insideAtEnd };
  }

  private updateTowerExposure(start: number): void {
    const scene = this.scene;
    for (const tower of this.towerExposure.keys()) {
      if (!tower.active) this.towerExposure.delete(tower);
    }
    // Destruction removes towers from scene.towers while this loop is running.
    for (const tower of [...scene.towers]) {
      const halfSize = tower.size * CFG.tile / 2;
      const { intervals, insideAtEnd } = this.coverage(start, tower.x, tower.y, halfSize, halfSize);
      let exposure = this.towerExposure.get(tower) ?? 0;
      let cursor = start;
      for (const interval of intervals) {
        if (interval.start > cursor) exposure = 0;
        exposure += interval.end - interval.start;
        const ticks = Math.floor(exposure / CFG.infected.toadPoisonTickMs);
        if (ticks > 0) {
          exposure -= ticks * CFG.infected.toadPoisonTickMs;
          tower.hurt(ticks * CFG.infected.toadPoisonDamage);
          if (tower.hp <= 0) {
            scene.sell.destroyTower(tower);
            break;
          }
        }
        cursor = interval.end;
      }
      if (tower.active && insideAtEnd && cursor === this.time) this.towerExposure.set(tower, exposure);
      else this.towerExposure.delete(tower);
    }
  }

  private destroyBomb(bomb: Bomb): void {
    bomb.sprite.destroy();
    bomb.shadow.destroy();
    bomb.trail.destroy();
  }

  private resumeSourceAnimation(pending: PendingThrow): void {
    if (pending.animationPausedByUs && pending.source.active && !pending.source.dying) pending.source.anims.resume();
    pending.animationPausedByUs = false;
  }
}
