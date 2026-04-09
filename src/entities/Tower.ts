import Phaser from 'phaser';
import { CFG } from '../config';

// 3x3 tile footprint. (tileX, tileY) is the TOP-LEFT tile of the footprint.
export class Tower extends Phaser.Physics.Arcade.Sprite {
  hp = CFG.tower.hp;
  maxHp = CFG.tower.hp;
  lastShot = 0;
  top: Phaser.GameObjects.Sprite;
  tileX: number;
  tileY: number;
  size = CFG.tower.tiles; // 3

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    const size = CFG.tower.tiles;
    const wx = (tileX + size / 2) * CFG.tile;
    const wy = (tileY + size / 2) * CFG.tile;
    super(scene, wx, wy, 't_base');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static
    this.tileX = tileX;
    this.tileY = tileY;
    this.setDepth(6);
    // tighten body so player & enemies can brush the corners
    const bodySize = CFG.tile * this.size - 10;
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(bodySize, bodySize);
    (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.top = scene.add.sprite(wx, wy, 't_top_0').setDepth(7);
  }

  hurt(amount: number) {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.top.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => { this.clearTint(); this.top.clearTint(); });
  }

  destroyTower() {
    this.top.destroy();
    this.destroy();
  }
}
