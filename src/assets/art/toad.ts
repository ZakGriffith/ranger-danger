import { drawBriarback } from './infectedEnemies/briarback';
import { drawVenomBellows } from './infectedEnemies/venomBellows';

export const TOAD_IDLE_FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'idle4', 'idle5', 'idle6', 'idle7'] as const;
export const TOAD_HOP_FRAMES = ['hop0', 'hop1', 'hop2', 'hop3', 'hop4', 'hop5', 'hop6', 'hop7', 'hop8', 'hop9', 'hop10', 'hop11'] as const;
export const TOAD_ATTACK_FRAMES = ['atk0', 'atk1', 'atk2', 'atk3', 'atk4', 'atk5', 'atk6', 'atk7', 'atk8', 'atk9'] as const;
export const TOAD_FRAMES = [...TOAD_IDLE_FRAMES, ...TOAD_HOP_FRAMES, ...TOAD_ATTACK_FRAMES, 'hit'] as const;
export const TOAD_IDLE_FPS = 8;
export const TOAD_ATTACK_FPS = 30;
export const TOAD_ATTACK_RELEASE_MS = 200;
export type ToadFrame = typeof TOAD_FRAMES[number];

// Each pose is widest at frame 6 so the bomb sprite leaves the open mouth at 200 ms.
const VARIANTS = [
  { draw: drawVenomBellows, spit: { x: 74, y: 39 }, attack: [0, .08, .18, .26, .35, .47, .53, .61, .75, 1] },
  { draw: drawBriarback, spit: { x: 76, y: 34 }, attack: [0, .08, .18, .28, .37, .49, .56, .65, .78, 1] },
] as const;
export const TOAD_VARIANTS = VARIANTS.length;
export const TOAD_ART = { width: 80, height: 64, spriteScale: .55, originX: .5, originY: .5 } as const;
const ART_SCALE = .55;
const GROUND_Y = 55;

export function toadTexturePrefix(variant: number) {
  return `etd${variant}`;
}

export function toadSpitOrigin(variant: number) {
  return VARIANTS[variant].spit;
}

export function makeIllustratedToadFrame(frame: ToadFrame, variant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TOAD_ART.width;
  canvas.height = TOAD_ART.height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(TOAD_ART.width / 2, GROUND_Y);
  ctx.scale(ART_SCALE, ART_SCALE);
  const art = VARIANTS[variant];
  if (frame.startsWith('atk')) {
    art.draw(ctx, 'attack', art.attack[Number(frame.slice(3))]);
  } else if (frame.startsWith('hop')) {
    art.draw(ctx, 'move', Number(frame.slice(3)) / (TOAD_HOP_FRAMES.length - 1));
  } else {
    art.draw(ctx, 'idle', frame === 'hit' ? .75 : Number(frame.slice(4)) / TOAD_IDLE_FRAMES.length);
  }
  return canvas;
}
