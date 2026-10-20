// Hand-placed pixel sprites. A Part is a block of rows authored as [x, run]
// segments against a palette of single-character tones. blit paints it
// through hd.ts with fixed hex colours, so hd.ts only strokes the outline
// and the shading stays exactly as authored instead of being auto-lit.

import type { HdPut } from './hd';

export type Palette = Record<string, `#${string}`>;
export type Remap = Record<string, string>;
/** Rows start at y0; each row is a list of [x, run] segments. '.' in a run is transparent. */
export type Part = { y0: number; rows: [number, string][][] };

export function blit(put: HdPut, pal: Palette, part: Part, dx = 0, dy = 0, remap?: Remap): void {
  part.rows.forEach((segs, j) => {
    for (const [x, run] of segs) {
      for (let i = 0; i < run.length; i++) {
        let c = run[i];
        if (c === '.') continue;
        if (remap) c = remap[c] ?? c;
        const hex = pal[c];
        if (!hex) throw new Error(`pixels: unknown tone '${c}'`);
        put(dx + x + i, dy + part.y0 + j, hex);
      }
    }
  });
}

/**
 * Tapered limb bone: a row-scanned stroke from (ax, ay) down to (bx, by)
 * whose width goes wa → wb. `widths[w]` gives the tones across a row of
 * width w, so the shading is still authored per width.
 */
export function limb(
  put: HdPut, pal: Palette,
  ax: number, ay: number, bx: number, by: number, wa: number, wb: number,
  widths: Record<number, string>, remap?: Remap,
): void {
  const y0 = Math.round(ay), y1 = Math.round(by);
  if (y1 < y0) throw new Error('pixels: limb must run downward');
  for (let y = y0; y <= y1; y++) {
    const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
    const w = Math.round(wa + (wb - wa) * t);
    const run = widths[w];
    if (!run) throw new Error(`pixels: no tones for limb width ${w}`);
    const left = Math.round(ax + (bx - ax) * t - w / 2);
    for (let i = 0; i < w; i++) {
      const c = remap ? (remap[run[i]] ?? run[i]) : run[i];
      put(left + i, y, pal[c]);
    }
  }
}
