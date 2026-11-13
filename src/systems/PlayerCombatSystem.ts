import type Phaser from 'phaser';
import { RANGER_AIM_HEIGHT, getArrowOrigin } from '../assets/art/ranger';
import { RANGER_FEET_OFFSET, RANGER_SCALE, RANGER_ARROW_TEXTURE } from '../assets/art/ranger/textures';
import { SFX } from '../audio/sfx';
import { CFG } from '../config';
import type { GameScene } from '../scenes/GameScene';

export class PlayerCombatSystem {
  private stoppedAt = 0;

  constructor(private scene: GameScene) {}

  update(time: number, delta: number, vx: number, vy: number): void {
    const { player, combat, playerUpgrades } = this.scene;
    const moving = vx !== 0 || vy !== 0;
    const target = combat.findMostThreateningEnemy(player.x, player.y, CFG.player.range * playerUpgrades.multiplier('atkRange'));

    if (target) {
      if (moving) this.stoppedAt = 0;
      else if (this.stoppedAt === 0) this.stoppedAt = time;
    }

    const settled = !moving && this.stoppedAt > 0 && time - this.stoppedAt >= 400;
    const interval = CFG.player.fireRate * (settled ? 1 : 2) / playerUpgrades.multiplier('atkSpeed');
    const aim = player.advancePose(delta, vx, vy, target, time, interval);

    if (target && time > player.lastShot + interval) {
      const origin = getArrowOrigin(aim);
      const muzzleDistance = Math.hypot(origin.x, origin.y - aim.bob + RANGER_AIM_HEIGHT) * RANGER_SCALE;
      const pivotY = player.y + RANGER_FEET_OFFSET + (aim.bob - RANGER_AIM_HEIGHT) * RANGER_SCALE;
      const targetDistance = Math.hypot(target.x - player.x, target.y - pivotY);
      // Keep point-blank shots on the near side of the target's collision body.
      const distance = Math.min(muzzleDistance, Math.max(0, targetDistance - 7));
      const x = player.x + Math.cos(aim.angle) * distance;
      const y = pivotY + Math.sin(aim.angle) * distance;

      let aimX = target.x;
      let aimY = target.y;
      if (target.body) {
        const travelTime = Math.hypot(aimX - player.x, aimY - player.y) / CFG.player.projectileSpeed;
        const { velocity } = target.body as Phaser.Physics.Arcade.Body;
        aimX += velocity.x * travelTime;
        aimY += velocity.y * travelTime;
      }

      player.releaseShot(time);
      SFX.play('arrowShoot');
      combat.spawnProjectile(x, y, aimX, aimY, CFG.player.projectileSpeed,
        CFG.player.damage * playerUpgrades.multiplier('atkPower'), 0, 0.5, 0, target, RANGER_ARROW_TEXTURE);
    }
    player.paintPose(time);
  }
}
