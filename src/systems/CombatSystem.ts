import Phaser from 'phaser';
import { getRegistry } from '../core/registry';
import { getEvents } from '../core/events';
import { CFG } from '../config';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Coin } from '../entities/Coin';
import { Projectile } from '../entities/Projectile';
import { SFX } from '../audio/sfx';
import { playerFrameBob } from '../assets/art/player';
import {
  CANNON_DIRECTION_COUNT, CANNON_GROUND_Y, CANNON_HEIGHT_Y,
  CANNON_BARREL_HEIGHT, CANNON_MUZZLE_DISTANCE,
} from '../assets/art/cannon';
import type { Tower } from '../entities/Tower';
import type { GameScene } from '../scenes/GameScene';

/**
 * Tower firing logic, target selection (nearest, most-threatening,
 * best-cannon-splash), projectile lifecycle, and damage application
 * (including the cannon explosion VFX + crater).
 */
export class CombatSystem {
  constructor(private scene: GameScene) {}

  updateTowers(time: number) {
    const scene = this.scene;
    for (const tower of scene.towers) {
      tower.drawHpBar();
      // Pending sale — tower stops firing during the sell countdown so the
      // player can't milk damage from a tower they've already cashed out.
      // Walls keep blocking enemies until the timer completes (handled by
      // the grid still containing them until executeSell).
      if (scene.sellTimers.has(tower)) {
        tower.muzzleFlash?.setVisible(false);
        continue;
      }
      const st = tower.stats();

      if (st.splashRadius > 0) {
        // Cannon: aim at the spot that hits the most enemies
        const aim = this.findBestCannonTarget(tower.x, tower.y, st.range, st.splashRadius, st.projectileSpeed);
        if (!aim) continue;
        const muzzle = this.aimCannon(tower, aim.x, aim.y);
        if (time > tower.lastShot + st.fireRate) {
          tower.lastShot = time;
          SFX.play('cannonShoot');
          tower.muzzleFlash!.play('c-muzzle-flash');
          const cScale = 0.5 + tower.level * 0.15;
          this.spawnProjectile(muzzle.x, muzzle.y, aim.x, aim.y, st.projectileSpeed, st.damage, st.splashRadius, cScale);
        }
      } else {
        // Arrow: shoot at nearest enemy with lead targeting
        const tgt = this.findNearestEnemy(tower.x, tower.y, st.range);
        if (!tgt) {
          // Hold the last aim; the archer keeps breathing and the bow rides the bob
          this.aimArcher(tower, tower.top.rotation);
          continue;
        }
        let aimX = tgt.x, aimY = tgt.y;
        if (tgt.body) {
          const dist = Math.hypot(tgt.x - tower.x, tgt.y - tower.y) || 1;
          const travelTime = dist / st.projectileSpeed;
          const tb = tgt.body as Phaser.Physics.Arcade.Body;
          aimX = tgt.x + tb.velocity.x * travelTime;
          aimY = tgt.y + tb.velocity.y * travelTime;
        }
        // Aim from the archer, not the base center
        const archer = tower.stand ?? tower.top;
        const angle = Math.atan2(aimY - archer.y, aimX - archer.x);
        this.aimArcher(tower, angle);
        if (time > tower.lastShot + st.fireRate) {
          tower.lastShot = time;
          SFX.play('arrowShoot');
          const bow = tower.top, nock = tower.nockedArrow;
          const shoot = `${tower.bowAnim}-shoot`;
          bow.play(shoot, true);
          nock?.setVisible(false);
          bow.once(`animationcomplete-${shoot}`, () => {
            bow.play(`${tower.bowAnim}-idle`);
            nock?.setVisible(true);
          });
          const aScale = 0.5 + tower.level * 0.12;
          const aTint = tower.level === 2 ? 0xffd67a : tower.level === 1 ? 0x9fd9ff : 0;
          // Spawn at the nocked-arrow position so the shot emanates from the bow
          const spawnX = bow.x + Math.cos(angle) * 15;
          const spawnY = bow.y + Math.sin(angle) * 15;
          this.spawnProjectile(spawnX, spawnY, aimX, aimY, st.projectileSpeed, st.damage, 0, aScale, aTint, tgt);
        }
      }
    }
  }

  private aimCannon(tower: Tower, aimX: number, aimY: number): { x: number; y: number } {
    const top = tower.top;
    const centerY = top.y - CANNON_BARREL_HEIGHT * CANNON_HEIGHT_Y * top.scaleY;
    // The visual arc starts with tangent (dx, dy - 22π). Invert the ground
    // projection before choosing a frame so the lit barrel follows that tangent.
    const yaw = Math.atan2(
      (aimY - centerY - 22 * Math.PI) / (CANNON_GROUND_Y * top.scaleY),
      (aimX - top.x) / top.scaleX,
    );
    tower.cannonDirection = Phaser.Math.Wrap(Math.round(yaw / (Math.PI * 2) * CANNON_DIRECTION_COUNT), 0, CANNON_DIRECTION_COUNT);
    top.setFrame(tower.cannonDirection).setRotation(0);
    const heading = tower.cannonDirection / CANNON_DIRECTION_COUNT * Math.PI * 2;
    const dx = Math.cos(heading) * top.scaleX;
    const dy = Math.sin(heading) * CANNON_GROUND_Y * top.scaleY;
    const muzzle = { x: top.x + CANNON_MUZZLE_DISTANCE * dx, y: centerY + CANNON_MUZZLE_DISTANCE * dy };
    tower.muzzleFlash!.setPosition(muzzle.x, muzzle.y).setRotation(Math.atan2(dy, dx)).setScale(top.scaleX, top.scaleY);
    return muzzle;
  }

  /**
   * Pose the arrow tower's archer the way GameScene poses the ranger: the body
   * faces and tilts toward the aim, the bow (which carries the arms) swings
   * around the shoulders and rides the breathing bob, and aiming up-screen
   * puts the bow behind the body. Mirrors GameScene's player bow offsets.
   */
  private aimArcher(tower: Tower, angle: number) {
    const stand = tower.stand, bow = tower.top, nock = tower.nockedArrow;
    if (!stand) return;
    const facingLeft = Math.abs(angle) > Math.PI / 2;
    const vert = Math.sin(angle); // negative = aiming up-screen
    const pose = vert < -0.45 ? 'up' : vert > 0.45 ? 'down' : 'level';
    const behind = vert < -0.3;

    stand.setFlipX(facingLeft);
    const anim = `${tower.archerAnim}-idle` + (pose === 'level' ? '' : `-${pose}`);
    if (stand.anims.currentAnim?.key !== anim) stand.play(anim);

    const bob = playerFrameBob(stand.anims.currentFrame?.textureKey ?? '');
    const offset = 6 + Math.abs(Math.cos(angle)) * 5;
    const anchorY = pose === 'up' ? 0 : pose === 'down' ? 4 : 2;
    // Depths ride on the body's y-sorted depth (DepthSortSystem.applyTowerDepth
    // puts it a tenth above the tower base): the bow tucks just behind the body
    // when aiming up-screen and sits in front otherwise, but either way stays
    // above the base so it never disappears behind the tower. The nocked arrow
    // matches projectile depth so it reads as the arrow about to fly.
    const d = stand.depth;
    bow.setRotation(angle).setFlipY(facingLeft).setDepth(d + (behind ? -0.05 : 0.1));
    bow.setPosition(stand.x + Math.cos(angle) * offset, stand.y + anchorY + bob + Math.sin(angle) * offset);
    if (nock) {
      nock.setRotation(angle).setDepth(behind ? d - 0.04 : d + 4.9);
      nock.setPosition(bow.x + Math.cos(angle) * 15, bow.y + Math.sin(angle) * 15);
    }
  }

  /**
   * Find the aim point within range that maximizes enemies hit by splash.
   * Considers each enemy's predicted position when the cannonball arrives.
   */
  findBestCannonTarget(tx: number, ty: number, range: number, splash: number, projSpeed: number): { x: number; y: number } | null {
    const scene = this.scene;
    const r2 = range * range;
    const s2 = splash * splash;

    // Collect predicted positions for all enemies in range
    const candidates: { px: number; py: number }[] = [];
    scene.enemies.children.iterate((c: any) => {
      const e = c as Enemy;
      if (!e || !e.active || e.dying) return true;
      const d2 = (e.x - tx) ** 2 + (e.y - ty) ** 2;
      if (d2 > r2) return true;
      // Lead: predict where enemy will be when ball arrives
      const dist = Math.sqrt(d2) || 1;
      const travelTime = dist / projSpeed;
      const b = e.body as Phaser.Physics.Arcade.Body;
      const px = e.x + (b ? b.velocity.x * travelTime : 0);
      const py = e.y + (b ? b.velocity.y * travelTime : 0);
      candidates.push({ px, py });
      return true;
    });
    // Also consider the boss(es). Endless mode's double-boss events
    // stash the secondary in midBoss, so cannons can lead-target either.
    const bossesToCheck: (Boss | null)[] = [scene.bossState.boss];
    if (scene.difficulty === 'endless' && scene.bossState.midBoss && scene.bossState.midBoss !== scene.bossState.boss) {
      bossesToCheck.push(scene.bossState.midBoss);
    }
    for (const bb of bossesToCheck) {
      if (!bb || !bb.active || bb.dying) continue;
      const d2 = (bb.x - tx) ** 2 + (bb.y - ty) ** 2;
      if (d2 <= r2) {
        const dist = Math.sqrt(d2) || 1;
        const travelTime = dist / projSpeed;
        const body = bb.body as Phaser.Physics.Arcade.Body;
        const px = bb.x + (body ? body.velocity.x * travelTime : 0);
        const py = bb.y + (body ? body.velocity.y * travelTime : 0);
        candidates.push({ px, py });
      }
    }

    if (candidates.length === 0) return null;

    // Test each candidate position as a potential aim point and pick the one
    // that catches the most enemies in the splash radius
    let bestCount = 0;
    let bestX = candidates[0].px, bestY = candidates[0].py;
    for (const c of candidates) {
      let count = 0;
      for (const o of candidates) {
        if ((c.px - o.px) ** 2 + (c.py - o.py) ** 2 <= s2) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        bestX = c.px;
        bestY = c.py;
      }
    }
    return { x: bestX, y: bestY };
  }

  findNearestEnemy(x: number, y: number, range: number): Enemy | Boss | null {
    const scene = this.scene;
    let best: Enemy | Boss | null = null;
    let bestD = range * range;
    scene.enemies.children.iterate((c: any) => {
      const e = c as Enemy;
      if (!e || !e.active || e.dying) return true;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
      return true;
    });
    if (scene.bossState.boss && scene.bossState.boss.active && !scene.bossState.boss.dying) {
      const d = (scene.bossState.boss.x - x) ** 2 + (scene.bossState.boss.y - y) ** 2;
      if (d < bestD) { bestD = d; best = scene.bossState.boss; }
    }
    if (scene.difficulty === 'endless' && scene.bossState.midBoss && scene.bossState.midBoss !== scene.bossState.boss
        && scene.bossState.midBoss.active && !scene.bossState.midBoss.dying) {
      const d = (scene.bossState.midBoss.x - x) ** 2 + (scene.bossState.midBoss.y - y) ** 2;
      if (d < bestD) { bestD = d; best = scene.bossState.midBoss; }
    }
    return best;
  }

  /**
   * Player targeting: pick the enemy closest to arriving (shortest remaining
   * path). Enemies with direct LOS (no BFS path) use euclidean distance.
   * Still filters to within shooting range.
   */
  findMostThreateningEnemy(x: number, y: number, range: number): Enemy | Boss | null {
    const scene = this.scene;
    let best: Enemy | Boss | null = null;
    let bestPathDist = Infinity;
    const r2 = range * range;
    scene.enemies.children.iterate((c: any) => {
      const e = c as Enemy;
      if (!e || !e.active || e.dying) return true;
      const eucD2 = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (eucD2 > r2) return true; // out of shooting range
      // Path distance: remaining BFS steps, or euclidean if direct LOS
      const pathDist = e.path && e.path.length > 0
        ? (e.path.length - e.pathIdx) * CFG.tile
        : Math.sqrt(eucD2);
      if (pathDist < bestPathDist) { bestPathDist = pathDist; best = e; }
      return true;
    });
    const bossesToCheck: (Boss | null)[] = [scene.bossState.boss];
    if (scene.difficulty === 'endless' && scene.bossState.midBoss && scene.bossState.midBoss !== scene.bossState.boss) {
      bossesToCheck.push(scene.bossState.midBoss);
    }
    for (const bb of bossesToCheck) {
      if (!bb || !bb.active || bb.dying) continue;
      const eucD2 = (bb.x - x) ** 2 + (bb.y - y) ** 2;
      if (eucD2 <= r2) {
        const pathDist = bb.path && bb.path.length > 0
          ? (bb.path.length - bb.pathIdx) * CFG.tile
          : Math.sqrt(eucD2);
        if (pathDist < bestPathDist) { bestPathDist = pathDist; best = bb; }
      }
    }
    return best;
  }

  spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, splashRadius = 0, scale = 0.5, tint = 0, homingTarget: Phaser.GameObjects.Sprite | null = null) {
    const scene = this.scene;
    const pr = new Projectile(scene, x, y);
    scene.projectiles.add(pr);
    pr.fire(tx, ty, speed, dmg, splashRadius, scale, tint, homingTarget);
  }

  updateProjectiles(time: number) {
    const scene = this.scene;
    scene.projectiles.children.iterate((c: any) => {
      const p = c as Projectile;
      if (!p || !p.active) return true;
      if (time - p.born > p.lifetime) { p.destroy(); return true; }

      // Homing arrows: steer toward target each frame
      if (p.homingTarget && !p.groundTarget) {
        if (p.homingTarget.active && !(p.homingTarget as any).dying) {
          const dx = p.homingTarget.x - p.x;
          const dy = p.homingTarget.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const angle = Math.atan2(dy, dx);
          p.setVelocity((dx / d) * p.speed, (dy / d) * p.speed);
          p.setRotation(angle);
        } else {
          // Target dead — stop homing, fly straight with current velocity
          p.homingTarget = null;
        }
      }

      if (p.groundTarget) {
        // Undo previous arc offset so physics position is correct
        p.y += p.arcOffset;

        // Check arrival at ground target
        const d = Math.hypot(p.groundX - p.x, p.groundY - p.y);
        if (d < 14) {
          p.arcOffset = 0;
          this.cannonExplode(p.groundX, p.groundY, p.splashRadius, p.damage);
          p.destroy();
          return true;
        }

        // Arc: parabolic height based on flight progress
        const traveled = Math.hypot(p.x - p.startX, p.y - p.startY);
        const t = Math.min(traveled / p.totalDist, 1);
        const arcHeight = Math.sin(t * Math.PI) * 22;
        p.arcOffset = arcHeight;

        // Shadow follows on the ground
        if (p.shadow) {
          p.shadow.setPosition(p.x, p.y);
          const shadowScale = 0.2 + Math.sin(t * Math.PI) * 0.25;
          p.shadow.setScale(shadowScale);
          p.shadow.setAlpha(0.4 - Math.sin(t * Math.PI) * 0.2);
        }

        // Visually shift the ball upward (arc)
        p.y -= arcHeight;
      }
      return true;
    });
  }

  projectileHitsBoss(pr: Projectile, b: Boss) {
    const scene = this.scene;
    if (!pr.active || !b.active || b.dying) return;
    // Cannonballs ignore direct hits — they explode on reaching their ground target
    if (pr.groundTarget) return;
    SFX.play('hit');
    const dmgApplied = Math.min(pr.damage, Math.max(0, b.hp));
    const mirageActive = !!(b as any)._mirageActive;
    const mirageLethal = mirageActive && pr.damage >= b.hp;
    b.hurt(pr.damage);
    scene.runStats.damageDealt += dmgApplied;
    const spark = scene.add.sprite(pr.x, pr.y, 'fx_hit_0').setDepth(15).setScale(0.5);
    spark.play('fx-hit');
    spark.once('animationcomplete', () => spark.destroy());
    pr.destroy();
    if (mirageLethal) {
      scene.enemyBoss.resolveMirageDeath(b);
      return;
    }
    // Only the primary boss drives the top HUD bar — otherwise endless-
    // mode double-boss events flicker the bar between two HP values as
    // hits land on each. Each boss still gets its own in-world bar via
    // Boss.drawHpBar().
    if (b === scene.bossState.boss) {
      getEvents(scene.game.events).emit('boss-hp', { hp: b.hp, maxHp: b.maxHp });
      getRegistry(scene.game).set('bossHp', b.hp);
    }
    if (b.dying) {
      // bossActive only flips off when the primary dies — for endless
      // doubles we still want the HUD to show the secondary's HP via
      // its in-world bar; the primary bar hides at this moment.
      if (b === scene.bossState.boss) getRegistry(scene.game).set('bossActive', false);
      this.dropBossLoot(b);
      // Stats — bucket the kill by boss kind so the death panel can
      // show "Rams: 3, Dragons: 1" etc.
      scene.runStats.bossesKilled++;
      const bucket = b.bossKind === 'queen' ? 'queen'
        : b.bossKind === 'dragon' ? 'dragon'
        : b.bossKind === 'fissure_burrower' ? 'fissureBurrower'
        : b.bossKind === 'desert_scorpion' ? 'giantScorpion'
        : b.bossKind === 'sandstorm_beast' ? 'sandstormBeast'
        : b.bossKind === 'dune_wraith' ? 'duneWraith'
        : b.bossKind === 'temple_construct' ? 'templeConstruct'
        : b.bossKind === 'sun_priest' ? 'sunPriest'
        : b.animPrefix === 'fboss' ? 'wendigo'
        : b.animPrefix === 'iboss' ? 'blighted'
        : b.animPrefix === 'rboss' ? 'fog'
        : 'ram';
      scene.runStats.bossesByKind[bucket] = (scene.runStats.bossesByKind[bucket] ?? 0) + 1;
    }
  }

  dropBossLoot(b: Boss) {
    const scene = this.scene;
    const drops = 12;
    for (let i = 0; i < drops; i++) {
      const a = (i / drops) * Math.PI * 2;
      const d = Phaser.Math.Between(6, 22);
      const coin = new Coin(scene, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 'gold');
      scene.coins.add(coin);
    }
  }

  projectileHitsEnemy(pr: Projectile, e: Enemy) {
    const scene = this.scene;
    if (!pr.active || !e.active || e.dying) return;
    // Cannonballs ignore direct hits — they explode on reaching their ground target
    if (pr.groundTarget) return;

    this.applyDamageToEnemy(e, pr.damage);
    const spark = scene.add.sprite(pr.x, pr.y, 'fx_hit_0').setDepth(15).setScale(0.5);
    spark.play('fx-hit');
    spark.once('animationcomplete', () => spark.destroy());
    pr.destroy();
  }

  /** Damage a single enemy and handle its death drops/counts. */
  applyDamageToEnemy(e: Enemy, dmg: number) {
    const scene = this.scene;
    if (!e || !e.active || e.dying) return;
    SFX.play('hit');
    const dmgApplied = Math.min(dmg, Math.max(0, e.hp));
    e.hurt(dmg);
    scene.runStats.damageDealt += dmgApplied;
    if (e.hp <= 0) {
      if (!e.noCoinDrop) {
        const tier =
          e.kind === 'heavy' || e.kind === 'deer' || e.kind === 'bear' || e.kind === 'infected_heavy' ? 'silver' :
                                                     'bronze';
        const coin = new Coin(scene, e.x + Phaser.Math.Between(-4, 4), e.y + Phaser.Math.Between(-4, 4), tier);
        scene.coins.add(coin);
      }
      scene.player.kills++;
      scene.runStats.enemiesKilled++;
      scene.waveState.recordKill();
      scene.hud.pushHud();
      if (getRegistry(scene.game).get('tutorialActive')) getEvents(scene.game.events).emit('tutorial-kill');
    }
  }

  cannonExplode(x: number, y: number, radius: number, dmg: number) {
    const scene = this.scene;
    SFX.play('boom');
    // ---------- VISUALS ----------
    // 1) Bright white core flash (fast)
    const core = scene.add.circle(x, y, radius * 0.55, 0xfff5c0, 0.95)
      .setDepth(16)
      .setScale(0.3);
    scene.tweens.add({
      targets: core,
      scale: 1,
      alpha: { from: 1, to: 0 },
      duration: 160,
      ease: 'Sine.Out',
      onComplete: () => core.destroy()
    });

    // 2) Orange fireball layer
    const fire = scene.add.circle(x, y, radius * 0.85, 0xff8a20, 0.85)
      .setDepth(15)
      .setScale(0.25);
    scene.tweens.add({
      targets: fire,
      scale: 1,
      alpha: { from: 0.9, to: 0 },
      duration: 260,
      ease: 'Cubic.Out',
      onComplete: () => fire.destroy()
    });

    // 3) Dark red outer shell for depth
    const shell = scene.add.circle(x, y, radius, 0xc93010, 0.55)
      .setDepth(14)
      .setScale(0.2);
    scene.tweens.add({
      targets: shell,
      scale: 1.05,
      alpha: { from: 0.7, to: 0 },
      duration: 340,
      ease: 'Cubic.Out',
      onComplete: () => shell.destroy()
    });

    // 4) Fiery shrapnel sparks shooting outward
    const sparkCount = 14;
    for (let i = 0; i < sparkCount; i++) {
      const a = (i / sparkCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const dist = radius * Phaser.Math.FloatBetween(0.7, 1.1);
      const sparkColor = [0xffe070, 0xff9030, 0xffffff][i % 3];
      const s = scene.add.circle(x, y, Phaser.Math.Between(2, 3), sparkColor, 1).setDepth(18);
      scene.tweens.add({
        targets: s,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(260, 420),
        ease: 'Cubic.Out',
        onComplete: () => s.destroy()
      });
    }

    // 5) Dust and smoke puffs that linger after the fire fades
    const smokeCount = 11;
    for (let i = 0; i < smokeCount; i++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const offD = Phaser.Math.FloatBetween(0, radius * 0.82);
      const px = x + Math.cos(a) * offD;
      const py = y + Math.sin(a) * offD;
      const shade = [0x6a5a42, 0x8c7650, 0x4a4030, 0xa88a5a][i % 4];
      const puff = scene.add.ellipse(px, py, Phaser.Math.Between(14, 24), Phaser.Math.Between(7, 13), shade, 0.62)
        .setRotation(Phaser.Math.FloatBetween(0, Math.PI))
        .setStrokeStyle(1, 0x2a2118, 0.35)
        .setDepth(13)
        .setScale(0.3);
      const driftX = Math.cos(a) * Phaser.Math.Between(8, 20);
      const driftY = Math.sin(a) * Phaser.Math.Between(5, 14) - Phaser.Math.Between(6, 16);
      scene.tweens.add({
        targets: puff,
        scale: { from: 0.3, to: 1.6 },
        alpha: { from: 0.65, to: 0 },
        x: px + driftX,
        y: py + driftY,
        duration: Phaser.Math.Between(650, 1050),
        delay: Phaser.Math.Between(40, 140),
        ease: 'Sine.Out',
        onComplete: () => puff.destroy()
      });
    }

    // 6) Dirt crater on the ground
    this.spawnCrater(x, y, radius);

    // Damage all enemies in radius
    const r2 = radius * radius;
    const hitList: Enemy[] = [];
    scene.enemies.children.iterate((c: any) => {
      const en = c as Enemy;
      if (!en || !en.active || en.dying) return true;
      const dx = en.x - x, dy = en.y - y;
      if (dx * dx + dy * dy <= r2) hitList.push(en);
      return true;
    });
    for (const en of hitList) {
      this.spawnCannonSplashHitFeedback(en, x, y);
      this.applyDamageToEnemy(en, dmg);
    }

    // Also chip the boss if in range
    if (scene.bossState.boss && scene.bossState.boss.active && !scene.bossState.boss.dying) {
      const dx = scene.bossState.boss.x - x, dy = scene.bossState.boss.y - y;
      if (dx * dx + dy * dy <= r2) {
        scene.bossState.boss.hurt(Math.floor(dmg * 0.6));
        getEvents(scene.game.events).emit('boss-hp', { hp: scene.bossState.boss.hp, maxHp: scene.bossState.boss.maxHp });
        getRegistry(scene.game).set('bossHp', scene.bossState.boss.hp);
        if (scene.bossState.boss.dying) {
          getRegistry(scene.game).set('bossActive', false);
          this.dropBossLoot(scene.bossState.boss);
        }
      }
    }
  }

  spawnCannonSplashHitFeedback(en: Enemy, cx: number, cy: number) {
    const scene = this.scene;
    const dx = en.x - cx;
    const dy = en.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;
    const flash = scene.add.circle(en.x, en.y - 4, 10, 0xfff0a0, 0.75)
      .setDepth(en.depth + 0.6)
      .setScale(0.35);
    scene.tweens.add({
      targets: flash,
      scale: 1.1,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy()
    });
    const dust = scene.add.ellipse(en.x, en.y + 10, 20, 8, 0x8c7650, 0.55)
      .setRotation(Math.atan2(ny, nx))
      .setDepth(en.depth - 0.2)
      .setScale(0.5);
    scene.tweens.add({
      targets: dust,
      x: en.x + nx * 12,
      y: en.y + 10 + ny * 6,
      scale: 1.3,
      alpha: 0,
      duration: 300,
      ease: 'Sine.Out',
      onComplete: () => dust.destroy()
    });
    for (let i = 0; i < 4; i++) {
      const spread = Phaser.Math.FloatBetween(-0.75, 0.75);
      const sx = nx * Math.cos(spread) - ny * Math.sin(spread);
      const sy = nx * Math.sin(spread) + ny * Math.cos(spread);
      const chip = scene.add.circle(en.x, en.y - 3, Phaser.Math.Between(2, 3), i % 2 ? 0xffd070 : 0x7a4a28, 0.95)
        .setDepth(en.depth + 0.8);
      scene.tweens.add({
        targets: chip,
        x: en.x + sx * Phaser.Math.Between(12, 22),
        y: en.y - 3 + sy * Phaser.Math.Between(8, 18),
        alpha: 0,
        scale: 0.35,
        duration: Phaser.Math.Between(220, 360),
        ease: 'Cubic.Out',
        onComplete: () => chip.destroy()
      });
    }
  }

  spawnCrater(x: number, y: number, _radius: number) {
    const scene = this.scene;
    const g = scene.add.graphics().setDepth(0);
    const cr = 10;
    const streakColors = [0x1a1008, 0x241810, 0x2e2014];
    const streaks = Phaser.Math.Between(5, 8);
    for (let i = 0; i < streaks; i++) {
      const a = (i / streaks) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.35, 0.35);
      const len = Phaser.Math.FloatBetween(6, 12);
      const steps = 5;
      const color = streakColors[i % 3];
      const alpha = Phaser.Math.FloatBetween(0.45, 0.65);
      g.fillStyle(color, alpha);
      for (let s = 0; s < steps; s++) {
        const t = s / (steps - 1);
        const d = cr * 0.7 + len * t;
        const sx = x + Math.cos(a) * d;
        const sy = y + Math.sin(a) * d;
        const r = 2.2 * (1 - t * 0.85);
        g.fillCircle(sx, sy, Math.max(r, 0.5));
      }
    }
    g.fillStyle(0x3e2e1a, 0.6);
    g.fillEllipse(x, y, cr * 2, cr * 1.5);
    g.fillStyle(0x2a1e10, 0.5);
    g.fillEllipse(x + Phaser.Math.FloatBetween(-1, 1), y + Phaser.Math.FloatBetween(-1, 1), cr * 1.1, cr * 0.8);
    g.fillStyle(0x9a7a50, 0.25);
    g.fillEllipse(x, y - cr * 0.3, cr * 1.3, cr * 0.35);
    scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 6000,
      ease: 'Sine.In',
      onComplete: () => g.destroy()
    });
  }
}
