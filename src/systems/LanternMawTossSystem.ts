import Phaser from 'phaser';
import { LANTERN_MAW_THROW_RELEASE_POINT } from '../assets/art/infectedEnemies/lanternMaw';
import { LANTERN_MAW_THROW_FRAME_MS, LANTERN_MAW_THROW_FRAMES, LANTERN_MAW_THROW_RELEASE_MS } from '../assets/art/infectedEnemies/lanternMawThrow';
import { POISON_SMOKE_DEPTH } from '../assets/art/poisonSmoke';
import { CFG } from '../config';
import type { Boss } from '../entities/Boss';
import type { GameScene } from '../scenes/GameScene';
import { LANTERN_MAW_GOO_RADIUS } from './ToadPoisonSystem';

const THROW_ANIMATION_MS = LANTERN_MAW_THROW_FRAMES.length * LANTERN_MAW_THROW_FRAME_MS;

type Windup = {
  x: number;
  y: number;
  releaseAt: number;
  cue: Phaser.GameObjects.Graphics;
  onBossDestroyed: () => void;
};

export class LanternMawTossSystem {
  private readonly windups = new WeakMap<Boss, Windup>();

  constructor(private readonly scene: GameScene) {}

  tryStart(boss: Boss, time: number, x: number, y: number, distance: number): boolean {
    const { lanternMawThrowMinRange, lanternMawThrowMaxRange, lanternMawThrowCooldown } = CFG.infected;
    if (time < boss.nextGooThrow || distance < lanternMawThrowMinRange || distance > lanternMawThrowMaxRange) return false;

    const cue = this.drawLandingCue(x, y);
    const onBossDestroyed = () => {
      this.windups.delete(boss);
      cue.destroy();
    };
    boss.once(Phaser.GameObjects.Events.DESTROY, onBossDestroyed);
    this.windups.set(boss, { x, y, releaseAt: time + LANTERN_MAW_THROW_RELEASE_MS, cue, onBossDestroyed });
    boss.beginGooThrow(time + THROW_ANIMATION_MS, time + lanternMawThrowCooldown);
    boss.setVelocity(0, 0).setFlipX(x < boss.x).play('iboss-throw');
    return true;
  }

  update(boss: Boss, time: number): void {
    const windup = this.windups.get(boss);
    if (windup && time >= windup.releaseAt) {
      boss.off(Phaser.GameObjects.Events.DESTROY, windup.onBossDestroyed);
      this.windups.delete(boss);
      const anchor = LANTERN_MAW_THROW_RELEASE_POINT;
      const localX = (boss.flipX ? boss.width - anchor.x : anchor.x) - boss.displayOriginX;
      const transform = boss.getWorldTransformMatrix();
      const tip = transform.transformPoint(localX, anchor.y - boss.displayOriginY);
      const ground = transform.transformPoint(localX, anchor.groundY - boss.displayOriginY);
      this.scene.toadPoison.spawnLanternMawGoo(tip.x, tip.y, ground.y, windup.x, windup.y, windup.cue);
    }
    if (time >= boss.stateEnd) {
      boss.finishGooThrow();
      boss.play('iboss-idle');
    }
  }

  private drawLandingCue(x: number, y: number): Phaser.GameObjects.Graphics {
    const cue = this.scene.add.graphics().setPosition(x, y).setDepth(8).setName('lantern-maw-goo-target');
    const width = LANTERN_MAW_GOO_RADIUS * 2;
    const height = width * POISON_SMOKE_DEPTH;
    cue.fillStyle(0x99a84f, 0.16).fillEllipse(0, 0, width, height);
    cue.lineStyle(3.5, 0x292a26, 0.86).strokeEllipse(0, 0, width, height);
    cue.lineStyle(1.5, 0xd1db83, 0.9).strokeEllipse(0, 0, width, height);
    cue.lineBetween(-5, 0, 5, 0).lineBetween(0, -3.5, 0, 3.5);
    return cue;
  }
}
