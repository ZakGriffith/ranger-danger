import { CFG } from '../config';

export type Grid = number[][]; // 0 = walkable, 1 = blocked (wall/tower)

export function createGrid(cols = CFG.worldCols, rows = CFG.worldRows): Grid {
  const g: Grid = [];
  for (let y = 0; y < rows; y++) {
    g.push(new Array(cols).fill(0));
  }
  return g;
}

export function inBounds(g: Grid, x: number, y: number) {
  return y >= 0 && y < g.length && x >= 0 && x < g[0].length;
}

// BFS from (sx,sy) to (tx,ty). If target unreachable, returns path to the
// closest reached wall tile neighboring the frontier (so enemies attack walls).
// Returns list of {x,y} tile coords (from start to goal) or empty if nothing.
export function findPath(
  g: Grid,
  sx: number, sy: number,
  tx: number, ty: number
): { x: number; y: number }[] {
  if (!inBounds(g, sx, sy)) return [];
  const rows = g.length, cols = g[0].length;
  const prev = new Array(rows * cols).fill(-1);
  const visited = new Uint8Array(rows * cols);
  const idx = (x: number, y: number) => y * cols + x;
  const queue: number[] = [];
  const start = idx(sx, sy);
  queue.push(start);
  visited[start] = 1;

  let foundTarget = false;
  // Also track nearest wall tile encountered during BFS as fallback
  let nearestWall = -1;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length) {
    const cur = queue.shift()!;
    const cx = cur % cols, cy = Math.floor(cur / cols);
    if (cx === tx && cy === ty) { foundTarget = true; break; }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const ni = idx(nx, ny);
      if (visited[ni]) continue;
      if (g[ny][nx] === 1) {
        // it's a wall. Record as potential fallback target (closest to start via BFS order)
        if (nearestWall === -1) nearestWall = ni;
        continue;
      }
      visited[ni] = 1;
      prev[ni] = cur;
      queue.push(ni);
    }
  }

  const goalIdx = foundTarget ? idx(tx, ty) : nearestWall;
  if (goalIdx === -1) return [];
  // reconstruct
  const path: { x: number; y: number }[] = [];
  let c = goalIdx;
  while (c !== -1 && c !== start) {
    path.push({ x: c % cols, y: Math.floor(c / cols) });
    c = prev[c];
  }
  path.reverse();
  return path;
}
