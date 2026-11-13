import type Phaser from 'phaser';
import { drawFlyingArrow } from './bow';
import { drawRanger } from './index';
import type { RangerPose } from './pose';

export const RANGER_SCALE = 0.44;
export const RANGER_FEET_OFFSET = 12.5;
export const RANGER_TEXTURE_WIDTH = 128;
export const RANGER_TEXTURE_HEIGHT = 144;
export const RANGER_TEXTURE_FEET = 116;
export const RANGER_ARROW_TEXTURE = 'ranger-arrow';
export const RANGER_ARROW_TIP_X = 45;

export function paintRangerTexture(texture: Phaser.Textures.CanvasTexture, pose: RangerPose): void {
  const ctx = texture.context;
  ctx.clearRect(0, 0, RANGER_TEXTURE_WIDTH, RANGER_TEXTURE_HEIGHT);
  ctx.save();
  ctx.translate(RANGER_TEXTURE_WIDTH / 2, RANGER_TEXTURE_FEET);
  drawRanger(ctx, pose);
  ctx.restore();
  texture.refresh();
}

export function generateRangerArrow(textures: Phaser.Textures.TextureManager): void {
  const texture = textures.createCanvas(RANGER_ARROW_TEXTURE, 64, 64)!;
  const ctx = texture.context;
  ctx.translate(RANGER_ARROW_TIP_X, 32);
  ctx.scale(RANGER_SCALE / 0.5, RANGER_SCALE / 0.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawFlyingArrow(ctx);
  texture.refresh();
}

const GALLERY_ANIMS = [
  { suffix: 'idle', animKey: 'ranger-gallery-idle', frameCount: 4, frameRate: 4, repeat: -1 },
  { suffix: 'move', animKey: 'ranger-gallery-move', frameCount: 8, frameRate: 16, repeat: -1 },
  { suffix: 'shoot', animKey: 'ranger-gallery-shoot', frameCount: 8, frameRate: 14, repeat: 0 },
  { suffix: 'hit', animKey: 'ranger-gallery-hit', frameCount: 2, frameRate: 8, repeat: 0 },
] as const;

export const RANGER_GALLERY_ANIMS = GALLERY_ANIMS.map(({ suffix, animKey }) => ({ suffix, animKey }));
export const RANGER_GALLERY_IDLE_FRAME = `${GALLERY_ANIMS[0].animKey}-0`;

export function registerRangerGalleryArt(scene: Phaser.Scene): void {
  for (const { suffix, animKey, frameCount, frameRate, repeat } of GALLERY_ANIMS) {
    if (scene.anims.exists(animKey)) continue;
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let index = 0; index < frameCount; index++) {
      const key = `${animKey}-${index}`;
      const texture = scene.textures.createCanvas(key, RANGER_TEXTURE_WIDTH, RANGER_TEXTURE_HEIGHT)!;
      const phase = index / frameCount * Math.PI * 2;
      const run = Number(suffix === 'move');
      const shooting = suffix === 'shoot';
      const pose: RangerPose = {
        view: 'east',
        angle: 0,
        phase,
        run,
        bob: run ? 1.8 * Math.cos(phase * 2) - 0.65 : 0.7 * Math.sin(phase),
        draw: shooting && index < 4 ? index / 3 : 0,
        recoil: shooting && index >= 4 ? Math.max(0, 1 - (index - 4) / 2) : 0,
        loaded: !shooting || index < 4 || index === frameCount - 1,
      };
      paintRangerTexture(texture, pose);
      if (suffix === 'hit' && index === 0) {
        const ctx = texture.context;
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, RANGER_TEXTURE_WIDTH, RANGER_TEXTURE_HEIGHT);
        ctx.restore();
        texture.refresh();
      }
      frames.push({ key });
    }
    scene.anims.create({ key: animKey, frames, frameRate, repeat });
  }
}
