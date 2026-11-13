import Phaser from 'phaser';
import { CFG } from '../config';
import { SFX } from '../audio/sfx';
import { DEBUG } from '../debug.config';
import { RANGER_AIM_HEIGHT, type RangerPose, type RangerView } from '../assets/art/ranger';
import {
  paintRangerTexture, RANGER_FEET_OFFSET, RANGER_SCALE,
  RANGER_TEXTURE_FEET, RANGER_TEXTURE_HEIGHT, RANGER_TEXTURE_WIDTH,
} from '../assets/art/ranger/textures';

const VIEWS: RangerView[] = ['east', 'south', 'west', 'north'];
const TAU = Math.PI * 2;

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = CFG.player.hp;
  maxHp = CFG.player.hp;
  money = CFG.startMoney;
  kills = 0;
  lastShot = 0;
  invuln = 0;
  private readonly rangerTexture: Phaser.Textures.CanvasTexture;
  private readonly pose: RangerPose = { view: 'east', phase: 0, run: 0, bob: 0, draw: 0, recoil: 0, angle: 0, loaded: true };
  private lastPaint = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const texture = scene.textures.createCanvas('ranger-' + Phaser.Utils.String.UUID(), RANGER_TEXTURE_WIDTH, RANGER_TEXTURE_HEIGHT)!;
    super(scene, x, y, texture);
    this.rangerTexture = texture;
    this.setScale(RANGER_SCALE);
    this.setDisplayOrigin(RANGER_TEXTURE_WIDTH / 2, RANGER_TEXTURE_FEET - RANGER_FEET_OFFSET / RANGER_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Preserve the old 7px collision radius and its offset from the player position.
    (this.body as Phaser.Physics.Arcade.Body).setCircle(7 / RANGER_SCALE,
      this.displayOriginX - 7 / RANGER_SCALE, this.displayOriginY - 5 / RANGER_SCALE);
    this.setDepth(10);
    paintRangerTexture(texture, this.pose);
    this.once(Phaser.GameObjects.Events.DESTROY, () => texture.destroy());
  }

  advancePose(delta: number, vx: number, vy: number, target: { x: number; y: number } | null, time: number, interval: number): RangerPose {
    const pose = this.pose;
    const moving = vx !== 0 || vy !== 0;
    const backpedal = vx * Math.cos(pose.angle) + vy * Math.sin(pose.angle) < 0;
    pose.run += (Number(moving) - pose.run) * Math.min(1, delta * 0.013);
    pose.phase = (pose.phase + TAU + pose.run * delta * (backpedal ? -0.0127 : 0.0127)) % TAU;
    pose.bob = pose.run * (1.8 * Math.cos(pose.phase * 2) - 0.65)
      + (1 - pose.run) * 0.7 * Math.sin(time * 0.0032);

    if (target) {
      const pivotY = this.y + RANGER_FEET_OFFSET + (pose.bob - RANGER_AIM_HEIGHT) * RANGER_SCALE;
      pose.angle = Math.atan2(target.y - pivotY, target.x - this.x);
    } else if (moving) pose.angle = Math.atan2(vy, vx);

    const prior = VIEWS.indexOf(pose.view) * Math.PI / 2;
    const turn = Math.atan2(Math.sin(pose.angle - prior), Math.cos(pose.angle - prior));
    if (Math.abs(turn) > Math.PI / 4 + 0.055) {
      pose.view = VIEWS[(Math.round(pose.angle / (Math.PI / 2)) + 4) % 4];
    }

    const sinceShot = this.lastShot ? time - this.lastShot : Infinity;
    pose.recoil = Math.max(0, 1 - sinceShot / Math.min(170, interval * 0.38));
    pose.loaded = sinceShot >= Math.min(200, interval * 0.42);
    const drawTime = Math.min(240, interval * 0.42);
    const pull = target && pose.loaded ? Phaser.Math.Clamp(1 - (interval - sinceShot) / drawTime, 0, 1) : 0;
    pose.draw += (pull - pose.draw) * Math.min(1, delta * 0.035);
    return pose;
  }

  releaseShot(time: number): void {
    this.lastShot = time;
    this.pose.draw = 0;
    this.pose.recoil = 1;
    this.pose.loaded = false;
    this.lastPaint = -Infinity;
  }

  paintPose(time: number): void {
    if (time - this.lastPaint < 1000 / 60) return;
    paintRangerTexture(this.rangerTexture, this.pose);
    this.lastPaint = time;
  }

  hurt(amount: number, scene: Phaser.Scene, feedback: 'hit' | 'poison' = 'hit') {
    if (DEBUG.noDamage) return;
    const now = (scene as any).vTime ?? scene.time.now;
    if (this.invuln > now) return;
    this.hp -= amount;
    // Stats — track damage actually taken (post-invuln). Touch via any
    // to avoid pulling GameScene types into this file.
    const stats = (scene as any).runStats;
    if (stats) {
      stats.damageTaken += amount;
      stats.playerHits++;
    }
    this.invuln = now + 500;
    if (feedback === 'poison') {
      this.setTint(0xadc976);
      scene.time.delayedCall(120, () => {
        if (this.scene) this.clearTint();
      });
      return;
    }
    SFX.play('playerHurt');
    this.setTintFill(0xffffff);
    scene.time.delayedCall(80, () => {
      if (this.scene) this.clearTint();
    });
    scene.tweens.add({
      targets: this, alpha: 0.3, yoyo: true, duration: 80, repeat: 3,
      onComplete: () => this.setAlpha(1)
    });
    scene.cameras.main.shake(120, 0.006);
  }
}
