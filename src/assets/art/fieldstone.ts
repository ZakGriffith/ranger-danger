import { CFG } from '../../config';
import { ink, line, oval, shape, wash } from './forestEnemies/paint';

const TILE = CFG.tile;
const APRON = 12;
const DECK_TOP = -6.5;
const DECK_BOTTOM = TILE + DECK_TOP;
export const WALL_TEXTURE_SIZE = TILE + APRON * 2;
export const WALL_ART_SCALE = .5;
export const WALL_NEIGHBOR = { north: 1, east: 2, south: 4, west: 8 } as const;

const stone = {
  floor: '#85826e',
  flagstones: ['#908c72', '#8d8b79', '#827d68', '#9a9476'],
  mortar: '#5a5d4c',
  front: '#9a9277',
  base: '#575958',
  lip: '#b7ae85',
  light: '#d4c69c',
  cap: '#aca185',
  capSide: '#68674f',
  soil: '#776849',
};

type Side = keyof typeof WALL_NEIGHBOR;
type Point = readonly [number, number];
type Fill = string | CanvasGradient;
const SIDES = ['north', 'east', 'south', 'west'] as const;

export function wallTextureKey(mask = 0, damaged = false) {
  return damaged ? `wall_${mask}_dmg` : `wall_${mask}`;
}

function isJoined(mask: number, side: Side) {
  return (mask & WALL_NEIGHBOR[side]) !== 0;
}

function horizontal(side: Side) {
  return side === 'north' || side === 'south';
}

function along(side: Side, position: number, inset: number, yOffset: number): Point {
  switch (side) {
    case 'north': return [position, inset + yOffset];
    case 'east': return [TILE - inset, position + yOffset];
    case 'south': return [position, TILE - inset + yOffset];
    case 'west': return [inset, position + yOffset];
  }
}

function edgeStroke(ctx: CanvasRenderingContext2D, side: Side, color: string, width: number, inset: number, yOffset: number) {
  line(ctx, color, width, p => {
    p.moveTo(...along(side, 0, inset, yOffset));
    p.lineTo(...along(side, TILE, inset, yOffset));
  });
}

function variation(x: number, y: number) {
  const hash = Math.imul(x + 17, 0x45d9f3b) ^ Math.imul(y - 7, 0x119de1f3);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x1_0000_0000;
}

function stoneBlock(
  ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number,
  rounding: number, fill: Fill, outline: number, skew = 0,
) {
  const right = x + width;
  const bottom = y + height;
  const radius = Math.min(rounding, width / 3, height / 3);
  shape(ctx, fill, outline, p => {
    p.moveTo(x + radius, y + skew);
    p.lineTo(right - radius, y);
    p.quadraticCurveTo(right, y, right, y + radius);
    p.lineTo(right - skew, bottom - radius);
    p.quadraticCurveTo(right - skew, bottom, right - skew - radius, bottom);
    p.lineTo(x + radius, bottom - skew * .6);
    p.quadraticCurveTo(x, bottom - skew * .6, x, bottom - radius - skew * .6);
    p.lineTo(x, y + radius + skew);
    p.quadraticCurveTo(x, y + skew, x + radius, y + skew);
  });
}

function dirtEdge(ctx: CanvasRenderingContext2D, side: Side, mask: number) {
  const startY = !horizontal(side) && isJoined(mask, 'north') ? DECK_TOP : 0;
  line(ctx, stone.soil, 3.8, p => {
    p.moveTo(...along(side, startY, -.85, 0));
    p.lineTo(...along(side, TILE, -.85, 0));
  });
  for (let position = startY + 2; position < TILE; position += 4) {
    const scatter = variation(Math.floor(position * 2), WALL_NEIGHBOR[side]);
    const [x, y] = along(side, position + scatter, -1.7 - scatter * .9, 0);
    oval(ctx, x, y, .55 + scatter * 1.65, .38 + scatter * .52, stone.soil, horizontal(side) ? .1 : 1.1);
    if (scatter > .63) oval(ctx, x + .35, y + .3, .5, .28, stone.lip);
  }
}

function frontFace(ctx: CanvasRenderingContext2D, mask: number) {
  const left = isJoined(mask, 'west') ? -2 : 0;
  const right = isJoined(mask, 'east') ? TILE + 2 : TILE;
  const fill = wash(ctx, DECK_BOTTOM, TILE, [[0, stone.front], [.74, stone.base], [1, stone.mortar]]);
  stoneBlock(ctx, left, DECK_BOTTOM - .55, right - left, TILE - DECK_BOTTOM + .75, 1.15, fill, 1.05);

  const joint = DECK_BOTTOM + (TILE - DECK_BOTTOM) * .51;
  line(ctx, stone.mortar, .64, p => {
    p.moveTo(left + 1.15, joint);
    p.lineTo(right - 1.15, joint);
    for (let row = 0; row < 2; row++) {
      const start = row === 0 ? 4 : 10;
      for (let x = start; x < TILE; x += 16) {
        p.moveTo(x, row === 0 ? DECK_BOTTOM + 1 : joint);
        p.lineTo(x - .45, row === 0 ? joint : TILE - 1.1);
      }
    }
  });
  line(ctx, stone.front, .5, p => {
    p.moveTo(left + 1.6, joint + .7);
    p.lineTo(right - 1.6, joint + .7);
  });
}

function flagstones(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = stone.floor;
  ctx.fillRect(0, DECK_TOP, TILE, TILE);
  const slabWidth = TILE / 2;
  const rowHeight = TILE / 4;
  for (let row = 0; row < 4; row++) {
    const y = DECK_TOP + row * rowHeight;
    const phase = row % 2 === 0 ? -slabWidth / 2 : -slabWidth / 4;
    for (let col = 0; col * slabWidth + phase < TILE; col++) {
      const x = phase + col * slabWidth;
      // Matching the two ends of each course lets one block cross the tile cut.
      const tone = variation(col % 2, row);
      stoneBlock(ctx, x + .24, y + .24, slabWidth - .5, rowHeight - .5, 1.8,
        stone.flagstones[Math.floor(tone * stone.flagstones.length)], 0, tone * 1.3);
      if (tone > .63) {
        ctx.save();
        ctx.globalAlpha = .35;
        line(ctx, stone.lip, .55, p => {
          p.moveTo(x + 2.2, y + 1);
          p.lineTo(x + slabWidth * .54, y + .92);
        });
        ctx.restore();
      }
    }
  }
}

function deckEdge(ctx: CanvasRenderingContext2D, side: Side) {
  const lit = side === 'north' || side === 'west';
  edgeStroke(ctx, side, stone.mortar, 3.4, 1, DECK_TOP);
  edgeStroke(ctx, side, lit ? stone.lip : stone.front, 1.1, lit ? 2.3 : 2.2, DECK_TOP);
  for (let position = 4; position < TILE; position += 8) {
    const speck = variation(position, WALL_NEIGHBOR[side]);
    if (speck < .45) continue;
    const [x, y] = along(side, position, 3, DECK_TOP);
    const angle = horizontal(side) ? -.15 : 1.38;
    oval(ctx, x, y, 2 + speck, 1.1, '#626c47', angle);
    oval(ctx, x - .4, y - .3, 1.1 + speck * .55, .5, '#86905a', angle);
  }
}

function crack(ctx: CanvasRenderingContext2D) {
  const x = TILE / 2;
  const y = DECK_TOP + TILE / 2;
  line(ctx, stone.lip, .8, p => {
    p.moveTo(x - 8, y - 4);
    p.lineTo(x - 2, y - .5);
    p.lineTo(x + 2.8, y - 2.2);
    p.lineTo(x + 7.4, y + 5.5);
  });
  line(ctx, ink, 1.05, p => {
    p.moveTo(x - 8, y - 5);
    p.lineTo(x - 2, y - 1.7);
    p.lineTo(x + 2.8, y - 3.3);
    p.lineTo(x + 7.4, y + 4.6);
    p.moveTo(x - 2, y - 1.7);
    p.lineTo(x - 1.3, y + 2.3);
    p.lineTo(x - 4, y + 4.1);
  });
  oval(ctx, x + 8, y + 4.4, 1.3, .62, stone.mortar, .5);
}

type Cap = { left: number; base: number; width: number; depth: number; rise: number; chip: number };

function ramparts(sides: readonly Side[], damaged: boolean): Cap[] {
  const caps: Cap[] = [];
  for (const side of sides) {
    // The elevated tops of the side stones need clearance from the north join.
    const offset = horizontal(side) ? 0 : 2;
    for (const position of [TILE / 4, TILE * .75]) {
      const center = position + offset;
      const chip = variation(position, WALL_NEIGHBOR[side]);
      if (damaged && chip > .57) continue;
      const half = (8.4 + (chip - .5) * 2.1) * .5;
      const [innerX, innerY] = along(side, center - half, 5.6, DECK_TOP);
      const [outerX, outerY] = along(side, center + half, .9, DECK_TOP);
      caps.push({
        left: Math.min(innerX, outerX),
        base: Math.max(innerY, outerY),
        width: Math.abs(innerX - outerX),
        depth: Math.abs(innerY - outerY),
        rise: 4 * (damaged ? .53 : .84 + chip * .30),
        chip,
      });
    }
  }
  return caps.sort((a, b) => a.base - b.base);
}

function merlon(ctx: CanvasRenderingContext2D, cap: Cap) {
  const { left, base, width, depth, rise, chip } = cap;
  const top = base - depth - rise;
  const bevel = .33 + chip * .74;
  const face = wash(ctx, top, base, [[0, stone.front], [1, stone.capSide]]);
  stoneBlock(ctx, left, top, width, depth + rise, 1.8, face, .96, bevel);
  const crown = wash(ctx, top, top + depth, [[0, stone.lip], [1, stone.cap]]);
  stoneBlock(ctx, left + .08, top, width - .16, depth, 1.8, crown, .72, bevel);
  line(ctx, stone.light, .62, p => {
    p.moveTo(left + Math.min(1.3, width * .25), top + 1.18 + bevel * .3);
    p.lineTo(left + width * .72, top + .86);
  });
}

export function drawFieldstoneWall(ctx: CanvasRenderingContext2D, mask: number, damaged: boolean) {
  const left = isJoined(mask, 'west') ? 0 : -APRON;
  const right = isJoined(mask, 'east') ? TILE : TILE + APRON;
  const top = isJoined(mask, 'north') ? DECK_TOP : -APRON;
  const bottom = isJoined(mask, 'south') ? DECK_BOTTOM : TILE + APRON;
  const sides = SIDES.filter(side => !isJoined(mask, side));

  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  // Cut at the shifted deck edge so north/south neighbors share the same painted seam.
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  for (const side of sides) dirtEdge(ctx, side, mask);
  if (!isJoined(mask, 'south')) frontFace(ctx, mask);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, DECK_TOP, TILE, TILE);
  ctx.clip();
  flagstones(ctx);
  for (const side of sides) deckEdge(ctx, side);
  if (damaged) crack(ctx);
  ctx.restore();

  for (const side of sides) edgeStroke(ctx, side, ink, 1, 0, DECK_TOP);
  for (const cap of ramparts(sides, damaged)) merlon(ctx, cap);
  ctx.restore();
}
