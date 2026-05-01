import Phaser from 'phaser';

export type CoinTier = 'bronze' | 'silver' | 'gold';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  value = 1;
  tier: CoinTier = 'bronze';
  born = 0;
  collecting = false;

  constructor(scene: Phaser.Scene, x: number, y: number, tier: CoinTier = 'bronze') {
    super(scene, x, y, `coin_${tier}_0`);
    this.setScale(0.5);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tier = tier;
    this.value = tier === 'gold' ? 3 : tier === 'silver' ? 2 : 1;
    this.born = (scene as any).vTime ?? scene.time.now;
    // Match GameScene.yDepth so the coin sorts correctly with player /
    // enemies / projectiles. Coins don't move after spawn (auto-collect
    // destroys them), so this is set once and skipped in the per-frame
    // depth-sort loop.
    this.setDepth(100 + y * 0.1);
    this.setSize(24, 24).setOffset(20, 20);
    this.play(`coin-${tier}-spin`);
    // little pop on spawn
    this.setScale(0.3);
    scene.tweens.add({ targets: this, scale: 0.5, duration: 180, ease: 'Back.Out' });
  }
}
