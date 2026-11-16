import Phaser from 'phaser';
import { P } from './canvas';

export const COIN_TEXTURE = 'coins';
const COIN_TIERS = ['bronze', 'silver', 'gold'] as const;
export type CoinTier = typeof COIN_TIERS[number];

const FRAME_SIZE = 64;
const FRAME_COUNT = 36;
const FRAME_RATE = 30;
const ATLAS_COLUMNS = 9;
const RADIUS_X = 7.7;
const RADIUS_Y = 7.15;
const HALF_THICKNESS = 0.825;

const palettes = {
  bronze: { face: P.bronze, ink: P.bronzeD, shade: P.bronzeM, light: P.bronzeL },
  silver: { face: P.silver, ink: P.silverD, shade: P.silverM, light: P.silverL },
  gold: { face: P.gold, ink: P.goldD, shade: P.goldM, light: P.goldL },
};

const face = new Path2D();
face.ellipse(0, 0, RADIUS_X, RADIUS_Y, 0, 0, Math.PI * 2);
const shadow = new Path2D();
shadow.ellipse(0, 8.7, 5.8, 1.13, 0, 0, Math.PI * 2);
const star = new Path2D(
  'M 0,-2.65 Q .7,-.55 2.75,-.05 Q .73,.65 .06,2.55 Q -.62,.67 -2.75,.05 Q -.77,-.51 0,-2.65 Z',
);
const highlight = new Path2D(
  'M -6.2,-1.9 C -5.65,-4.56 -3.22,-6.19 -1.16,-5.98 C .63,-5.84 .07,-4.55 -.54,-3.64 ' +
  'C -1.34,-2.4 -2.51,-2.45 -3.59,-2.38 C -4.57,-2.31 -5.65,-1.52 -6.2,-1.9 Z',
);
const shade = new Path2D(
  'M 1.7,5.97 C 3.98,5.67 5.36,4.13 6.13,2.29 C 3.95,2.06 2.81,3.12 1.41,3.94 C .7,4.35 .5,5.31 1.7,5.97 Z',
);

export function coinFrame(tier: CoinTier, index: number): string {
  return `${tier}-${index}`;
}

function drawCoin(ctx: CanvasRenderingContext2D, tier: CoinTier, turn: number) {
  const palette = palettes[tier];
  const width = 0.10 + 0.90 * Math.abs(Math.cos(turn));
  const edgeOffset = Math.sin(turn) * HALF_THICKNESS;

  ctx.fillStyle = '#1e231d73';
  ctx.fill(shadow);

  if (Math.abs(edgeOffset) > 0.01) {
    const rim = ctx.createLinearGradient(0, -RADIUS_Y, 0, RADIUS_Y);
    rim.addColorStop(0, palette.light);
    rim.addColorStop(0.35, palette.face);
    rim.addColorStop(0.73, palette.shade);
    rim.addColorStop(1, palette.ink);
    // The swept edge keeps the coin visible when its face turns away.
    const radius = RADIUS_X * width;
    const sweep = Number(edgeOffset > 0);
    const wall = new Path2D(
      `M ${-edgeOffset} ${-RADIUS_Y} H ${edgeOffset}
       A ${radius} ${RADIUS_Y} 0 0 ${sweep} ${edgeOffset} ${RADIUS_Y}
       H ${-edgeOffset} A ${radius} ${RADIUS_Y} 0 0 ${1 - sweep} ${-edgeOffset} ${-RADIUS_Y} Z`,
    );
    ctx.fillStyle = rim;
    ctx.fill(wall);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 0.52;
    ctx.stroke(wall);
  }

  ctx.translate(-edgeOffset, 0);
  ctx.scale(width, 1);
  ctx.fillStyle = palette.face;
  ctx.fill(face);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1;
  ctx.stroke(face);
  ctx.fillStyle = palette.light;
  ctx.fill(highlight);
  ctx.fillStyle = palette.shade;
  ctx.fill(shade);
  ctx.fillStyle = palette.ink;
  ctx.fill(star);
}

export function generateCoinTextures(scene: Phaser.Scene) {
  const rows = Math.ceil((COIN_TIERS.length * FRAME_COUNT) / ATLAS_COLUMNS);
  const texture = scene.textures.createCanvas(COIN_TEXTURE, ATLAS_COLUMNS * FRAME_SIZE, rows * FRAME_SIZE)!;
  const ctx = texture.context;
  let cell = 0;

  for (const tier of COIN_TIERS) {
    for (let index = 0; index < FRAME_COUNT; index++, cell++) {
      const x = (cell % ATLAS_COLUMNS) * FRAME_SIZE;
      const y = Math.floor(cell / ATLAS_COLUMNS) * FRAME_SIZE;
      ctx.save();
      ctx.translate(x + FRAME_SIZE / 2, y + FRAME_SIZE / 2);
      ctx.scale(2, 2);
      drawCoin(ctx, tier, (index / FRAME_COUNT) * Math.PI * 2);
      ctx.restore();
      texture.add(coinFrame(tier, index), 0, x, y, FRAME_SIZE, FRAME_SIZE);
    }
  }

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

export function registerCoinAnimations(scene: Phaser.Scene) {
  for (const tier of COIN_TIERS) {
    const key = `coin-${tier}-spin`;
    if (scene.anims.exists(key)) scene.anims.remove(key);
    const frames = Array.from({ length: FRAME_COUNT }, (_, index) => ({
      key: COIN_TEXTURE,
      frame: coinFrame(tier, index),
    }));
    scene.anims.create({ key, frames, frameRate: FRAME_RATE, repeat: -1 });
  }
}
