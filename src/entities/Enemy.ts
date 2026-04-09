import Phaser from 'phaser';
import { CFG } from '../config';

export type EnemyKind = 'basic' | 'heavy';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  coin: number;
  path: { x: number; y: number }[] = [];
  pathIdx = 0;
  lastPath = 0;
  attackCd = 0;
  dying = false;
  targetRef: any = null; // current target object (player, tower, wall)

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const data = kind === 'basic' ? CFG.enemy.basic : CFG.enemy.heavy;
    super(scene, x, y, kind === 'basic' ? 'eb_move0' : 'eh_move0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.speed = data.speed;
    this.dmg = data.dmg;
    this.coin = data.coin;
    this.setDepth(8);
    this.setSize(kind === 'basic' ? 12 : 16, kind === 'basic' ? 12 : 16)
        .setOffset(kind === 'basic' ? 10 : 8, kind === 'basic' ? 12 : 10);
    this.play(kind === 'basic' ? 'eb-move' : 'eh-move');
  }

  hurt(amount: number) {
    if (this.dying) return;
    this.hp -= amount;
    const prefix = this.kind === 'basic' ? 'eb' : 'eh';
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => { if (!this.dying) this.clearTint(); });
    if (this.hp <= 0) {
      this.dying = true;
      this.setVelocity(0, 0);
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
      this.play(`${prefix}-die`);
      this.once('animationcomplete', () => this.destroy());
    }
  }
}
