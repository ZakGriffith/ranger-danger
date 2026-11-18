import { Projectile } from '../entities/Projectile';
import { Tower } from '../entities/Tower';
import type { Boss } from '../entities/Boss';
import type { Wall } from '../entities/Wall';
import type { GameScene } from '../scenes/GameScene';

/**
 * Per-frame depth sorting for the player, enemies, and projectiles.
 * Walls, towers, and coins get their depth when placed or spawned.
 */
export class DepthSortSystem {
  /**
   * y-based depth formula. Coin.ts has its own hardcoded copy of this — if
   * the formula ever changes, update it there too.
   */
  private static yDepth(y: number) { return 100 + y * 0.1; }

  constructor(private scene: GameScene) {}

  applyTowerDepth(t: Tower) {
    const d = DepthSortSystem.yDepth(t.y);
    t.setDepth(d);
    t.top.setDepth(d + 0.2);
  }

  applyWallDepth(wall: Wall) {
    wall.setDepth(DepthSortSystem.yDepth(wall.y));
  }

  applyAirborneBossDepth(boss: Boss): void {
    boss.setDepth(DepthSortSystem.yDepth(boss.y + 80));
  }

  update() {
    const scene = this.scene;
    const yD = DepthSortSystem.yDepth;

    scene.player.setDepth(yD(scene.player.y));

    // Enemies move every frame — keep sorting them.
    const enemies = scene.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.active) e.setDepth(yD(e.y));
    }

    // Both arrows and cannonballs y-sort. Using the cannonball's CURRENT
    // sprite y (which already includes the arc offset, so it tracks the
    // visual position) keeps it in front of the firing tower as soon as
    // the muzzle clears the base — without this it sat at fixed depth 14
    // while towers render at yDepth(y) ≈ 120+, so a cannon firing south
    // had its shot obscured by its own tower for the first several frames.
    const projs = scene.projectiles.getChildren() as Projectile[];
    for (let i = 0; i < projs.length; i++) {
      const p = projs[i];
      if (!p.active) continue;
      p.setDepth(yD(p.y) + 5);
    }
  }
}
