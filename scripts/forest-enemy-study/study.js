import { BEAR_ATK_FRAMES, BEAR_MOVE_FRAMES } from '../../src/assets/art/bear';
import { meadowEnemyPose } from '../../src/assets/art/meadowEnemies/pose';
import { drawForestBear, forestBearOffset, forestBearPose, FOREST_BEAR_ART } from '../../src/assets/art/forestEnemies/bear';
import { drawForestWolf } from '../../src/assets/art/forestEnemies/wolf';
import { drawForestSpider } from '../../src/assets/art/forestEnemies/spider';
import { drawForestWendigo } from '../../src/assets/art/forestEnemies/wendigo';

export const DURATION = { move: 1, attack: 1.28, charge: 1.48 };

export const ENEMIES = [
  { name: 'Bear', actions: 'Heavy walk · Claw swipe', draw: drawForestBear, close: [152, 94], gameScale: FOREST_BEAR_ART.frameScale * FOREST_BEAR_ART.spriteScale, shadow: 38, bear: true },
  { name: 'Wolf', actions: 'Gallop · Lunging bite', draw: drawForestWolf, close: [165, 88], gameScale: .30, shadow: 36 },
  { name: 'Spider', actions: 'Scuttle · Fang strike', draw: drawForestSpider, close: [148, 83], gameScale: .25, shadow: 30 },
  { name: 'Wendigo', actions: 'Glide · Claw slam · Charge', draw: drawForestWendigo, close: [169, 148], gameScale: .77, shadow: 33, charge: true },
];

export function paintEnemy(ctx, enemy, mode, phase, x, ground, scale) {
  const clip = mode === 'charge' ? 'attack' : mode;
  const time = mode === 'charge' && !enemy.charge ? 0 : phase;
  const bearFrameCount = clip === 'move' ? BEAR_MOVE_FRAMES.length : BEAR_ATK_FRAMES.length;
  const frame = Math.min(bearFrameCount - 1, Math.floor(time * bearFrameCount));
  const pose = enemy.bear ? forestBearPose(clip, frame) : meadowEnemyPose(clip, time);
  const offset = enemy.bear ? forestBearOffset(pose) : 0;

  ctx.save();
  ctx.translate(x + offset * scale, ground);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#171c1894';
  ctx.beginPath();
  ctx.ellipse(0, -1, enemy.shadow, 4.3, 0, 0, 2 * Math.PI);
  ctx.fill();
  enemy.draw(ctx, pose, mode === 'charge' && enemy.charge ? 'charge' : undefined);
  ctx.restore();
}
