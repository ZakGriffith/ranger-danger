import { drawSnake } from '../../src/assets/art/meadowEnemies/snake';
import { drawRat } from '../../src/assets/art/meadowEnemies/rat';
import { drawDeer } from '../../src/assets/art/meadowEnemies/deer';
import { MEADOW_ENEMY_ART } from '../../src/assets/art/meadowEnemies/textures';
import { drawRam, MEADOW_RAM_ART } from '../../src/assets/art/meadowRam';
import { CFG } from '../../src/config';
export { meadowEnemyPose as poseAt } from '../../src/assets/art/meadowEnemies/pose';

function gameWidth({ frameScale, spriteScale, scale }) {
  return 100 * frameScale * spriteScale * scale;
}

export const ENEMIES = [
  { name: 'Snake', move: 'Slither', attack: 'Fanged strike', draw: drawSnake, width: gameWidth(MEADOW_ENEMY_ART.snake), scale: 1.12 },
  { name: 'Rat', move: 'Skitter', attack: 'Lunging bite', draw: drawRat, width: 28, scale: .95 },
  { name: 'Deer', move: 'Trot', attack: 'Antler jab', draw: drawDeer, width: gameWidth(MEADOW_ENEMY_ART.deer), scale: 1.02 },
  { name: 'Ancient Ram', move: 'Heavy walk', attack: 'Headbutt', draw: drawRam, width: gameWidth({ ...MEADOW_RAM_ART, spriteScale: CFG.bossScale }), scale: .99 },
];

export const DURATION = { move: .85, attack: 1.28 };

export function paintEnemy(ctx, enemy, pose, x, y, scale) {
  ctx.save();
  ctx.translate(x + pose.lunge * 7 * scale, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#1d211d70';
  ctx.beginPath();
  ctx.ellipse(0, -1, 37, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  enemy.draw(ctx, pose);
  ctx.restore();
}
