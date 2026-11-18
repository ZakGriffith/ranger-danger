import Phaser from 'phaser';
import { CFG } from '../config';
import { DEBUG } from '../debug.config';
import { WALL_ART_SCALE, wallTextureKey } from '../assets/art/fieldstone';
import type { GameScene } from '../scenes/GameScene';

export class Wall extends Phaser.Physics.Arcade.Sprite {
  hp = CFG.wall.hp;
  maxHp = CFG.wall.hp;
  tileX: number;
  tileY: number;
  neighborMask = 0; // N=1, E=2, S=4, W=8

  constructor(scene: GameScene, tileX: number, tileY: number) {
    const wx = tileX * CFG.tile + CFG.tile / 2;
    const wy = tileY * CFG.tile + CFG.tile / 2;
    super(scene, wx, wy, wallTextureKey());
    this.setScale(WALL_ART_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    // Full tile body
    const wallBody = CFG.tile;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(wallBody, wallBody);
    body.position.set(wx - wallBody / 2, wy - wallBody / 2);
    this.tileX = tileX;
    this.tileY = tileY;
    scene.depthSort.applyWallDepth(this);
  }

  hurt(amount: number) {
    if (DEBUG.noDamage) return;
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.scene) return;
      this.clearTint();
    });
    this.updateTexture();
  }

  /** Update texture based on current neighborMask and damage state */
  updateTexture() {
    const dmg = this.hp < this.maxHp * 0.5;
    this.setTexture(wallTextureKey(this.neighborMask, dmg));
  }
}
