// Tower archer outfit per tower level next to the ranger (src/assets/art/player.ts drawPlayer + drawBow).
//
// Render: node scripts/render-sprite-sheet.cjs --tries scripts/sprite-tries/archer-outfits.ts scripts/out/archer-outfits.png 6

import type { HdDraw } from '../../src/assets/art/hd';
import { drawPlayer, drawBow, RANGER, TOWER_ARCHER, type Outfit } from '../../src/assets/art/player';

export type Try = { name: string; frames: { label: string; draw: HdDraw }[] };

const row = (name: string, o: Outfit): Try => ({ name, frames: [
  { label: 'idle0', draw: drawPlayer('idle0', 'level', o) },
  { label: 'aim up', draw: drawPlayer('idle0', 'up', o) },
  { label: 'aim down', draw: drawPlayer('idle0', 'down', o) },
  { label: 'bow', draw: drawBow(false, o.tunic) },
  { label: 'bow drawn', draw: drawBow(true, o.tunic) },
] });

export const TRIES: Try[] = [
  row('ranger (reference)', RANGER),
  ...TOWER_ARCHER.map((o, t) => row(`tower archer, level ${t}`, o)),
];
