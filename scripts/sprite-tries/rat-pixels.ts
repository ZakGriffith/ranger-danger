// Frame sheet for the hand-placed rat in src/assets/art/rat.ts, one row per palette variant.
//
// Render: node scripts/render-sprite-sheet.cjs --tries scripts/sprite-tries/rat-pixels.ts scripts/out/rat-pixels.png 5

import type { HdDraw } from '../../src/assets/art/hd';
import { drawRat, RAT_VARIANTS } from '../../src/assets/art/rat';
import { MEADOW_MOVE_FRAMES, MEADOW_ATK_FRAMES } from '../../src/assets/art/meadow';
import { drawDeer } from '../../src/assets/art/deer';

export type Try = { name: string; frames: { label: string; draw: HdDraw }[] };

export const TRIES: Try[] = [
  { name: 'rat run 0-3', frames: MEADOW_MOVE_FRAMES.slice(0, 4).map((f) => ({ label: f, draw: drawRat(f, 0) })) },
  { name: 'rat run 4-7', frames: MEADOW_MOVE_FRAMES.slice(4).map((f) => ({ label: f, draw: drawRat(f, 0) })) },
  { name: 'rat bite, variant 0', frames: MEADOW_ATK_FRAMES.map((f) => ({ label: f, draw: drawRat(f, 0) })) },
  { name: 'palette variants (move0)   |   deer for scale', frames: [
    ...Array.from({ length: RAT_VARIANTS }, (_, v) => ({ label: `variant ${v}`, draw: drawRat('move0', v) })),
    { label: 'deer', draw: drawDeer('move0') },
  ] },
];
