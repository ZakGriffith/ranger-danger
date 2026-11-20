import { castleHash, CASTLE_CELL_TILES } from './castleLayout';

export const CASTLE_TILE_PX = 64;

export function drawCastleChunk(buf: Uint8ClampedArray, size: number, x0: number, y0: number): void {
  const colors = [[88, 87, 88], [98, 94, 91], [79, 82, 87], [107, 101, 95], [88, 89, 94]];
  for (let ly = 0; ly < size; ly++) {
    const y = y0 + ly;
    const row = Math.floor(y / 32);
    const sy = y - row * 32;
    const offset = (row & 1) * 32;
    for (let lx = 0; lx < size; lx++) {
      const x = x0 + lx;
      const col = Math.floor((x + offset) / 64);
      const sx = x + offset - col * 64;
      const hash = castleHash(col, row, 421);
      const c = colors[Math.floor(hash * colors.length)];
      const grain = (castleHash(x, y, 431) - .5) * 6;
      const chipped = sy < 5 && sx > 7 && sx < 16 && castleHash(col, row, 439) < .13;
      const edge = sx < 2 || sy < 2 || sx > 61 || sy > 29 || chipped;
      const bevel = sx === 2 || sy === 2 ? 10 : sx === 61 || sy === 29 ? -12 : 0;
      const tx = Math.floor(x / CASTLE_TILE_PX), ty = Math.floor(y / CASTLE_TILE_PX);
      const inlay = tx % CASTLE_CELL_TILES === 0 && ty % CASTLE_CELL_TILES === 0;
      const px = x - tx * CASTLE_TILE_PX, py = y - ty * CASTLE_TILE_PX;
      const diamond = Math.abs(px - 32) + Math.abs(py - 32);
      const ornament = inlay && (Math.abs(diamond - 23) < 1.5 || Math.abs(diamond - 15) < 1);
      const crack = hash < .12 && Math.abs(sx - (24 + sy * .24 + Math.sin(sy * .5) * 1.4)) < .6;
      const damp = castleHash(Math.floor(x / 256), Math.floor(y / 256), 449) < .23;
      const light = grain + bevel - (damp ? 6 : 0);
      const i = (ly * size + lx) * 4;
      for (let channel = 0; channel < 3; channel++) {
        buf[i + channel] = edge || crack ? [39, 43, 49][channel] + grain
          : ornament ? [133, 119, 91][channel] + grain
          : c[channel] + light;
      }
      buf[i + 3] = 255;
    }
  }
}
