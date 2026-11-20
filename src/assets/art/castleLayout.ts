export const CASTLE_CELL_TILES = 12;
const CELL_CENTER = CASTLE_CELL_TILES / 2;
export const CASTLE_SOLID_TILE = 10;
export const CASTLE_TRAP_TILE = 6;

type Cell = { x: number; y: number };
export type CastleProp = { x: number; y: number; width: number; height: number };

export function castleHash(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1597334677);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function castleCell(tx: number, ty: number): Cell {
  return { x: Math.floor((tx + CELL_CENTER) / CASTLE_CELL_TILES), y: Math.floor((ty + CELL_CENTER) / CASTLE_CELL_TILES) };
}

function parent(x: number, y: number, seed: number): Cell {
  // Every parent reduces Manhattan distance to the starting chamber.
  // This guarantees a connected maze across chunk boundaries without a generation-order dependency.
  if (x !== 0 && (y === 0 || castleHash(x, y, seed) < .5)) return { x: x - Math.sign(x), y };
  return { x, y: y - Math.sign(y) };
}

function doorway(ax: number, ay: number, bx: number, by: number, seed: number): boolean {
  const a = parent(ax, ay, seed), b = parent(bx, by, seed);
  return (a.x === bx && a.y === by) || (b.x === ax && b.y === ay)
    || castleHash(ax * 3 + bx, ay * 3 + by, seed + 37) < .18;
}

export function castleWallAt(tx: number, ty: number, seed: number): boolean {
  const { x, y } = castleCell(tx, ty);
  const lx = tx - (x * CASTLE_CELL_TILES - CELL_CENTER);
  const ly = ty - (y * CASTLE_CELL_TILES - CELL_CENTER);
  if (lx === 0 && ly === 0) return true;
  if (lx === 0) return !(ly >= CELL_CENTER - 2 && ly <= CELL_CENTER + 2 && doorway(x - 1, y, x, y, seed));
  if (ly === 0) return !(lx >= CELL_CENTER - 2 && lx <= CELL_CENTER + 2 && doorway(x, y - 1, x, y, seed));
  return false;
}

export function castleProps(x: number, y: number, seed: number): CastleProp[] {
  if (x === 0 && y === 0) return [];
  const props: CastleProp[] = [];
  const ox = x * CASTLE_CELL_TILES - CELL_CENTER, oy = y * CASTLE_CELL_TILES - CELL_CENTER;
  for (const [i, [dx, dy]] of [[1, 1], [CASTLE_CELL_TILES - 3, 1], [1, CASTLE_CELL_TILES - 3], [CASTLE_CELL_TILES - 3, CASTLE_CELL_TILES - 3]].entries()) {
    const roll = castleHash(x * 4 + i, y, seed + 71);
    if (roll < .17 || roll > .42) continue;
    props.push({ x: ox + dx, y: oy + dy, width: 2, height: 1 });
  }
  return props;
}

export function castleTrapAt(tx: number, ty: number, seed: number): boolean {
  const { x, y } = castleCell(tx, ty);
  if (x === 0 && y === 0) return false;
  if (castleHash(x, y, seed + 109) > .65) return false;
  const ox = x * CASTLE_CELL_TILES - CELL_CENTER, oy = y * CASTLE_CELL_TILES - CELL_CENTER;
  const horizontal = castleHash(x, y, seed + 113) < .5;
  const longSide = castleHash(x, y, seed + 127) < .5 ? 3 : 4;
  const width = horizontal ? longSide : 3;
  const height = horizontal ? 3 : longSide;
  const left = ox + CELL_CENTER - 2, top = oy + CELL_CENTER - 2;
  return tx >= left && tx < left + width && ty >= top && ty < top + height;
}

export function castleTileAt(tx: number, ty: number, seed: number): number {
  if (castleWallAt(tx, ty, seed)) return CASTLE_SOLID_TILE;
  const cell = castleCell(tx, ty);
  for (const prop of castleProps(cell.x, cell.y, seed)) {
    if (tx >= prop.x && tx < prop.x + prop.width && ty >= prop.y && ty < prop.y + prop.height) return CASTLE_SOLID_TILE;
  }
  return castleTrapAt(tx, ty, seed) ? CASTLE_TRAP_TILE : 0;
}
