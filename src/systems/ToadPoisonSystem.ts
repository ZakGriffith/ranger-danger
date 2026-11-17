import type Phaser from 'phaser';
import { CFG } from '../config';
import { LANTERN_MAW_GOO_FRAMES } from '../assets/art/infectedEnemies/lanternMawThrow';
import { TOAD_ATTACK_RELEASE_MS, toadSpitOrigin } from '../assets/art/toad';
import { TOAD_BOMB_FRAMES, TOAD_BOMB_FRAME_MS, TOAD_VENOM_TRAIL, toadBombTextureKey } from '../assets/art/toadPoison';
import { POISON_SMOKE_VARIANTS, POISON_SMOKE_FRAME_MS, POISON_SMOKE_GROUND_Y, POISON_SMOKE_RADIUS, POISON_SMOKE_DEPTH } from '../assets/art/poisonSmoke';
import type { Tower } from '../entities/Tower';
import type { Enemy } from '../entities/Enemy';
import type { GameScene } from '../scenes/GameScene';

type PendingThrow = { source: Enemy; x: number; y: number; releaseAt: number; animationPausedByUs: boolean };
type CloudStyle = { radius: number; lifetime: number; texturePrefix: string; name: string };
type BombStyle = {
  frameKey: (frame: number) => string;
  frameCount: number;
  names: readonly [projectile: string, shadow: string, trail: string];
  scale: number;
  shadowSize: readonly [width: number, height: number];
  trailColors: readonly number[];
  trailScale: number;
  cloud: CloudStyle;
};
type BombLaunch = {
  sx: number;
  sy: number;
  startGroundY: number;
  tx: number;
  ty: number;
  born: number;
  duration: number;
  arcHeight: number;
  style: BombStyle;
  landingCue?: Phaser.GameObjects.Graphics;
};
type Bomb = BombLaunch & {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Graphics;
};
type Cloud = CloudStyle & { sprite: Phaser.GameObjects.Image; x: number; y: number; born: number; variant: number };
type ExposureInterval = { start: number; end: number };

export const LANTERN_MAW_GOO_RADIUS = 36;
const LANTERN_MAW_GOO_SPEED = 240;

const TOAD_CLOUD: CloudStyle = {
  radius: CFG.infected.toadPoisonRadius,
  lifetime: CFG.infected.toadPoisonLifetime,
  texturePrefix: 'toad_smoke',
  name: 'toad_smoke-cloud',
};

const TOAD_BOMBS = TOAD_VENOM_TRAIL.map((trailColors, variant): BombStyle => ({
  frameKey: frame => toadBombTextureKey(variant, frame),
  frameCount: TOAD_BOMB_FRAMES.length,
  names: ['toad-poison-bomb', 'toad-poison-shadow', 'toad-poison-trail'],
  scale: 0.8,
  shadowSize: [9, 2.5],
  trailColors,
  trailScale: 1,
  cloud: TOAD_CLOUD,
}));

const LANTERN_MAW_GOO: BombStyle = {
  frameKey: frame => `iboss_goo_${frame}`,
  frameCount: LANTERN_MAW_GOO_FRAMES.length,
  names: ['lantern-maw-goo', 'lantern-maw-goo-shadow', 'lantern-maw-goo-trail'],
  scale: 0.85,
  shadowSize: [13, 4],
  trailColors: [0xc6ce77, 0xa9ba62, 0x82944e],
  trailScale: 1.4,
  cloud: { ...TOAD_CLOUD, radius: LANTERN_MAW_GOO_RADIUS, name: 'lantern-maw-goo-cloud' },
};

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
    this.spawnAt(sx, sy, tx, ty, this.time, 0);
  }

  spawnLanternMawGoo(sx: number, sy: number, groundY: number, tx: number, ty: number, landingCue: Phaser.GameObjects.Graphics): void {
    const distance = Math.hypot(tx - sx, ty - groundY);
    this.spawnBomb({
      sx, sy, startGroundY: groundY, tx, ty, born: this.time, landingCue,
      duration: distance === 0 ? 0 : Math.max(420, Math.min(1050, distance / LANTERN_MAW_GOO_SPEED * 1000)),
      arcHeight: Math.min(63, 19 + distance * 0.21),
      style: LANTERN_MAW_GOO,
    });
  }

  spawnSpiderCloud(x: number, y: number): void {
    this.addCloud(x, y, this.time, {
      radius: CFG.infected.spiderPoisonRadius,
      lifetime: CFG.infected.spiderPoisonLifetime,
      texturePrefix: 'spider_smoke',
      name: 'spider_smoke-cloud',
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
        const anchor = toadSpitOrigin(source.variant);
        const mouthX = source.flipX ? source.width - anchor.x : anchor.x;
        const mouthY = source.flipY ? source.height - anchor.y : anchor.y;
        const mouth = source.getWorldTransformMatrix().transformPoint(
          mouthX - source.displayOriginX,
          mouthY - source.displayOriginY,
        );
        this.spawnAt(mouth.x, mouth.y, pending.x, pending.y, pending.releaseAt, source.variant);
        this.pending.delete(pending);
      }
    }

    for (const bomb of this.bombs) {
      if (this.time >= bomb.born + bomb.duration) {
        this.addCloud(bomb.tx, bomb.ty, bomb.born + bomb.duration, bomb.style.cloud);
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

  private spawnAt(sx: number, sy: number, tx: number, ty: number, born: number, variant: number): void {
    const distance = Math.hypot(tx - sx, ty - sy);
    this.spawnBomb({
      sx, sy, startGroundY: sy, tx, ty, born,
      duration: distance / CFG.infected.toadBombSpeed * 1000,
      arcHeight: CFG.infected.toadBombArcHeight,
      style: TOAD_BOMBS[variant],
    });
  }

  private spawnBomb(launch: BombLaunch): void {
    const { sx, sy, startGroundY, tx, ty, born, duration, style, landingCue } = launch;
    if (duration === 0) {
      this.addCloud(tx, ty, born, style.cloud);
      landingCue?.destroy();
      return;
    }
    const [projectileName, shadowName, trailName] = style.names;
    const bomb: Bomb = {
      ...launch,
      sprite: this.scene.add.image(sx, sy, style.frameKey(0)).setScale(style.scale).setName(projectileName),
      shadow: this.scene.add.ellipse(sx, startGroundY, ...style.shadowSize, 0x101115, 0.19).setName(shadowName),
      trail: this.scene.add.graphics().setName(trailName),
    };
    this.bombs.add(bomb);
    this.drawBomb(bomb);
  }

  private drawBomb(bomb: Bomb): void {
    const age = this.time - bomb.born;
    const progress = Math.min(1, age / bomb.duration);
    const groundX = bomb.sx + (bomb.tx - bomb.sx) * progress;
    const groundY = bomb.startGroundY + (bomb.ty - bomb.startGroundY) * progress;
    const depth = 100 + groundY * 0.1;
    const { style } = bomb;
    const frame = Math.floor(age / TOAD_BOMB_FRAME_MS) % style.frameCount;
    bomb.sprite.setPosition(groundX, this.bombFlightY(bomb, progress))
      .setDepth(depth + 3).setTexture(style.frameKey(frame));
    bomb.shadow.setPosition(groundX, groundY).setDepth(depth - 0.5).setScale(1 + progress * 0.3);
    bomb.trail.clear().setDepth(depth + 2.9);
    for (let i = 3; i >= 1; i--) {
      const tail = progress - i * 0.045;
      if (tail < 0) continue;
      const x = bomb.sx + (bomb.tx - bomb.sx) * tail;
      const y = this.bombFlightY(bomb, tail);
      bomb.trail.fillStyle(style.trailColors[i - 1], 0.4 - i * 0.07);
      bomb.trail.fillCircle(x, y, (0.5 + i * 0.25) * style.trailScale);
    }
  }

  private bombFlightY(bomb: Bomb, progress: number): number {
    return bomb.sy + (bomb.ty - bomb.sy) * progress - Math.sin(Math.PI * progress) * bomb.arcHeight;
  }

  private addCloud(x: number, y: number, born: number, style: CloudStyle): void {
    const { radius, texturePrefix, name } = style;
    const variant = Math.floor(Math.random() * POISON_SMOKE_VARIANTS);
    const sprite = this.scene.add.image(x, y, `${texturePrefix}_${variant}_0`)
      .setFlipX(Math.random() < 0.5)
      .setOrigin(0.5, POISON_SMOKE_GROUND_Y / 128).setScale(radius / POISON_SMOKE_RADIUS)
      .setDepth(100 + (y + radius * POISON_SMOKE_DEPTH) * 0.1 + 0.1).setName(name);
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
    bomb.landingCue?.destroy();
  }

  private resumeSourceAnimation(pending: PendingThrow): void {
    if (pending.animationPausedByUs && pending.source.active && !pending.source.dying) pending.source.anims.resume();
    pending.animationPausedByUs = false;
  }
}
