import Phaser from 'phaser';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  value = 3;
  born = 0;
  collecting = false;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'coin_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.value = value;
    this.born = scene.time.now;
    this.setDepth(7);
    this.setSize(12, 12).setOffset(10, 10);
    this.play('coin-spin');
    // little pop on spawn
    this.setScale(0.6);
    scene.tweens.add({ targets: this, scale: 1, duration: 180, ease: 'Back.Out' });
  }
}
