import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { measureOpaqueBounds } from '../entities/spriteBounds';
import { DEATH_DUST_DURATION, drawDeathDust, sampleDustDeath } from '../assets/art/deathDust';

type DeathSource = Phaser.GameObjects.Sprite & { flying: boolean; shadow: unknown };
type DeathEffect = { elapsed: number; draw: (elapsed: number) => void; destroy: () => void };

export class EnemyDeathSystem {
  private effects = new Set<DeathEffect>();

  constructor(private scene: GameScene) {}

  play(source: DeathSource, tint = 0xffffff): void {
    const bounds = measureOpaqueBounds(this.scene, source.texture.key)!;
    const left = (source.flipX ? bounds.sourceW - bounds.right - 1 : bounds.left) - source.displayOriginX;
    const top = (source.flipY ? bounds.sourceH - bounds.bottom - 1 : bounds.top) - source.displayOriginY;
    const right = left + bounds.right - bounds.left + 1;
    const bottom = top + bounds.bottom - bounds.top + 1;
    const cos = Math.cos(source.rotation), sin = Math.sin(source.rotation);
    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]].map(([x, y]) => ({
      x: source.x + x * source.scaleX * cos - y * source.scaleY * sin,
      y: source.y + x * source.scaleX * sin + y * source.scaleY * cos,
    }));
    const minX = Math.min(...corners.map(point => point.x));
    const maxX = Math.max(...corners.map(point => point.x));
    const minY = Math.min(...corners.map(point => point.y));
    const feetY = Math.max(...corners.map(point => point.y));
    const x = (minX + maxX) / 2;
    const width = maxX - minX, height = feetY - minY;
    const altitude = source.flying ? 20 : 0;
    const alpha = source.alpha;
    const pixelSize = Math.min(Math.abs(source.scaleX), Math.abs(source.scaleY));

    // Detach the visual so combat can remove the enemy and award its kill immediately.
    const image = this.scene.add.image(source.x - x, source.y - feetY, source.texture.key, source.frame.name)
      .setOrigin(source.originX, source.originY)
      .setScale(source.scaleX, source.scaleY)
      .setRotation(source.rotation)
      .setFlip(source.flipX, source.flipY)
      .setTint(tint);
    const body = this.scene.add.container(x, feetY, image).setDepth(source.depth).setName('enemy-death-body');
    const dust = this.scene.add.graphics({ x, y: feetY + altitude })
      .setDepth(source.depth + 0.1).setAlpha(alpha).setName('enemy-death-dust');
    const shadow = source.shadow ? this.scene.add.ellipse(x, feetY + altitude, width * 0.9, width * 0.27, 0x000000)
      .setDepth(source.depth - 0.5).setName('enemy-death-shadow') : null;
    const draw = (elapsed: number) => {
      const { settle, bodyAlpha } = sampleDustDeath(elapsed);
      body.setScale(1 + settle * 0.035, 1 - settle * 0.11);
      body.y = feetY + (altitude + height * 0.025) * settle;
      body.setAlpha(alpha * bodyAlpha);
      shadow?.setAlpha(alpha * 0.25 * (1 - elapsed / DEATH_DUST_DURATION));
      dust.clear();
      drawDeathDust(dust, width, height, pixelSize, elapsed);
    };
    const destroy = () => {
      body.destroy();
      dust.destroy();
      shadow?.destroy();
    };
    this.effects.add({ elapsed: 0, draw, destroy });
    draw(0);
  }

  update(delta: number): void {
    for (const effect of this.effects) {
      effect.elapsed += delta;
      if (effect.elapsed >= DEATH_DUST_DURATION) {
        effect.destroy();
        this.effects.delete(effect);
      } else {
        effect.draw(effect.elapsed);
      }
    }
  }

  destroy(): void {
    for (const effect of this.effects) effect.destroy();
    this.effects.clear();
  }
}
