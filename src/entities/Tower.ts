import Phaser from 'phaser';
import { CFG } from '../config';
import { DEBUG } from '../debug.config';
import { ARROW_TOWER_ART_SCALE, ARROW_TOWER_BASE_SCALE } from '../assets/art/arrowTower/textures';
import { createArrowTowerArcher, setArrowTowerArcherPose } from '../assets/art/arrowTower/rig';
import { CANNON_TOWER_ART_SCALE } from '../assets/art/cannonTower/base';
import { CANNON_TOWER_BASE_SCALE, CANNON_TOWER_PLATFORM_Y } from '../assets/art/cannonTower/textures';
import { createCannonTowerGun, setCannonTowerGunPose } from '../assets/art/cannonTower/rig';

export type TowerKind = 'arrow' | 'cannon';

export class Tower extends Phaser.Physics.Arcade.Sprite {
  kind: TowerKind;
  level = 0;
  hp: number;
  maxHp: number;
  totalSpent: number;
  lastShot = 0;
  top: Phaser.GameObjects.Sprite;
  archerAim = 0;
  cannonAim = 0;
  hpBar: Phaser.GameObjects.Graphics;
  tileX: number;
  tileY: number;
  size = CFG.tower.tiles;

  // visual tint per level per kind
  static readonly TIER_TINT: Record<TowerKind, number[]> = {
    arrow:  [0xffffff, 0xffffff, 0xffffff],
    cannon: [0xffffff, 0xffffff, 0xffffff]
  };

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, kind: TowerKind = 'arrow') {
    const size = CFG.tower.tiles;
    const wx = (tileX + size / 2) * CFG.tile;
    const wy = (tileY + size / 2) * CFG.tile;
    const baseTex = kind === 'cannon' ? 'c_base' : 't_base';
    super(scene, wx, wy, baseTex);
    this.setScale(kind === 'arrow' ? ARROW_TOWER_BASE_SCALE : CANNON_TOWER_BASE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static
    this.kind = kind;
    this.tileX = tileX;
    this.tileY = tileY;
    this.setDepth(6);
    const bodyRadius = (CFG.tile * this.size - 20) / 2;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    // Set the offset before refreshing so the static collision tree indexes
    // the circle at the grid center, independent of the art dimensions.
    const offX = this.displayWidth / 2 - bodyRadius;
    const offY = this.displayHeight / 2 - bodyRadius;
    body.setCircle(bodyRadius, offX, offY);
    body.updateFromGameObject();

    this.top = (kind === 'arrow' ? createArrowTowerArcher(scene, wx, wy)
      : createCannonTowerGun(scene, wx, wy + CANNON_TOWER_PLATFORM_Y)).setDepth(7);

    this.hpBar = scene.add.graphics().setDepth(20);

    const s = this.stats();
    this.hp = s.hp;
    this.maxHp = s.hp;
    this.totalSpent = CFG.tower.kinds[kind].cost;
    this.applyTierVisual();
  }

  poseArcher(shot: number) {
    setArrowTowerArcherPose(this.top, this.level as 0 | 1 | 2, this.archerAim, shot);
  }

  poseCannon(cycle: number) {
    setCannonTowerGunPose(this.top, this.level as 0 | 1 | 2, this.cannonAim, cycle);
  }

  stats() {
    return CFG.tower.kinds[this.kind].levels[this.level];
  }

  canUpgrade(): boolean {
    return this.level < CFG.tower.kinds[this.kind].levels.length - 1;
  }

  upgradeCost(): number {
    return this.stats().upgradeCost;
  }

  upgrade(): boolean {
    if (!this.canUpgrade()) return false;
    this.level++;
    const s = this.stats();
    const ratio = this.hp / this.maxHp;
    this.maxHp = s.hp;
    this.hp = Math.ceil(s.hp * ratio);
    this.applyTierVisual();
    if (this.kind === 'arrow') this.poseArcher(0);
    else this.poseCannon(0);
    const baseScale = this.kind === 'arrow' ? ARROW_TOWER_BASE_SCALE : CANNON_TOWER_BASE_SCALE;
    const topScale = this.kind === 'arrow' ? ARROW_TOWER_ART_SCALE : CANNON_TOWER_ART_SCALE;
    this.scene.tweens.add({ targets: this,
      scale: { from: baseScale * 1.15, to: baseScale }, duration: 220, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.top,
      scale: { from: topScale * 1.15, to: topScale }, duration: 220, ease: 'Back.Out' });
    return true;
  }

  applyTierVisual() {
    // hurt() schedules a 60ms delayedCall that lands here. If a follow-up hit
    // kills the tower in that window the timer still fires on a destroyed
    // GameObject (Phaser nulls `scene` on destroy) — bail out.
    if (!this.scene) return;
    const tint = Tower.TIER_TINT[this.kind][this.level] ?? 0xffffff;
    const baseKey = this.kind === 'arrow' ? 't_base' : 'c_base';
    this.setTexture(this.level === 0 ? baseKey : `${baseKey}_${this.level}`).setTint(tint);
    this.top.setTint(tint);
  }

  hurt(amount: number) {
    if (DEBUG.noDamage) return;
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.top.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.scene) return;
      this.applyTierVisual();
    });
  }

  /** Cached values from the last drawHpBar paint — skip re-rendering when
   *  nothing changed (most frames, since most towers are full HP). */
  private _lastDrawnHp = -1;
  private _lastDrawnMaxHp = -1;

  drawHpBar() {
    if (this.hp === this._lastDrawnHp && this.maxHp === this._lastDrawnMaxHp) return;
    this._lastDrawnHp = this.hp;
    this._lastDrawnMaxHp = this.maxHp;
    this.hpBar.clear();
    // Always render — even at 100% — so the player can spot freshly damaged
    // towers immediately without having to wait for the bar to appear.
    const pct = Math.max(0, this.hp / this.maxHp);
    const w = 28, h = 3;
    const bx = this.x - w / 2;
    const by = this.y + CFG.tile * this.size / 2 + 3;
    this.hpBar.fillStyle(0x111826, 0.8);
    this.hpBar.fillRect(bx - 1, by - 1, w + 2, h + 2);
    const color = pct > 0.5 ? 0x4ad96a : pct > 0.25 ? 0xd9a84a : 0xd94a4a;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  destroyTower() {
    this.hpBar.destroy();
    this.top.destroy();
    this.destroy();
  }
}
