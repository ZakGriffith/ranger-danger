// Frame sheet for the hand-placed deer in src/assets/art/deer.ts.
//
// Render: node scripts/render-sprite-sheet.cjs --tries scripts/sprite-tries/deer-pixels.ts scripts/out/deer-pixels.png 5

import type { HdDraw } from '../../src/assets/art/hd';
import { drawDeer } from '../../src/assets/art/deer';
import { MEADOW_MOVE_FRAMES, MEADOW_ATK_FRAMES } from '../../src/assets/art/meadow';
import { drawPlayer } from '../../src/assets/art/player';

export type Try = { name: string; frames: { label: string; draw: HdDraw }[] };

export const TRIES: Try[] = [
  { name: 'deer walk 0-3', frames: MEADOW_MOVE_FRAMES.slice(0, 4).map((f) => ({ label: f, draw: drawDeer(f) })) },
  { name: 'deer walk 4-7', frames: MEADOW_MOVE_FRAMES.slice(4).map((f) => ({ label: f, draw: drawDeer(f) })) },
  { name: 'deer lunge', frames: MEADOW_ATK_FRAMES.map((f) => ({ label: f, draw: drawDeer(f) })) },
  { name: 'ranger for scale', frames: [{ label: 'idle0', draw: drawPlayer('idle0') }] },
];
