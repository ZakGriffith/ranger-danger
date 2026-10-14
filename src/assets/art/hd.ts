// HD procedural pixel art. Sprites are drawn directly at physical resolution
// (64 px for characters, 128 px for towers and bosses) instead of the legacy
// 32-px-then-Scale2x path in canvas.ts, so every sprite has 4× the pixels
// at the same world size (entities keep setScale(0.5)).
//
// Draw functions paint *materials* rather than colours. After the draw, a
// post pass resolves each pixel to one tone of the material's ramp from the
// silhouette: pixels on the top/left edge of a material region get rim
// light, pixels on the bottom/right edge get shade, and a 1-px outline is
// stroked around the whole body. That gives every sprite consistent
// lighting without each draw function hand-placing highlight pixels.
//
//   put(x, y, 'blue')      base tone, auto-lit
//   put(x, y, 'blue.d')    start from the dark tone (still auto-lit ±1)
//   put(x, y, '#0b0f1a')   fixed colour, part of the silhouette, never lit
//   raw(x, y, hex, alpha)  under-layer (ground shadow); not body, no outline

import { P } from './canvas';

/** [light, base, dark, darkest] */
export type Ramp = readonly [string, string, string, string];

export const M = {
  blue:    ['#86bdff', '#3f7fd6', '#1f4590', '#122a5e'],
  hood:    ['#3f63b4', '#27407a', '#172a56', '#0e1a38'],
  skin:    ['#ffe4c4', '#f0c49a', '#c48a5c', '#8a5a34'],
  boot:    ['#9a6a3c', '#6b4424', '#422712', '#2a1808'],
  wood:    ['#c08850', '#8b5a2b', '#5a3618', '#3a2210'],
  leather: ['#6e4626', '#4a2e16', '#2c1a0a', '#1a0f05'],
  gold:    ['#fff2a8', '#ffd84a', '#c08820', '#7a4e08'],
  red:     ['#ff7a5c', '#d9412b', '#8a2414', '#5a1408'],
  steel:   ['#eef2f6', '#c0c8d4', '#7a8090', '#4a525a'],
  string:  ['#ffffff', '#d8dce4', '#a0a8b4', '#6a7280'],
  spark:   ['#fffbd0', '#ffe070', '#e0a020', '#a06010'],
} as const satisfies Record<string, Ramp>;

export type Mat = keyof typeof M;
export type ToneKey = 'l' | 'b' | 'd' | 'dd';
export type Paint = Mat | `${Mat}.${ToneKey}` | `#${string}`;

export type HdPut = (x: number, y: number, p: Paint | null) => void;
export type RawPut = (x: number, y: number, hex: string, alpha?: number) => void;
export type HdDraw = (put: HdPut, raw: RawPut) => void;

export type HdOptions = {
  /** White-out the body (hit flash). Outline is kept. */
  flash?: boolean;
  outline?: boolean;
};

const TONE_INDEX: Record<ToneKey, number> = { l: 0, b: 1, d: 2, dd: 3 };
const MAT_NAMES = Object.keys(M) as Mat[];
const MAT_INDEX = new Map<string, number>(MAT_NAMES.map((m, i) => [m, i]));

type Parsed = { mat: number; tone: number } | { hex: string };
const parseCache = new Map<string, Parsed>();
function parsePaint(p: Paint): Parsed {
  let r = parseCache.get(p);
  if (r) return r;
  if (p.startsWith('#')) r = { hex: p };
  else {
    const dot = p.indexOf('.');
    const mat = MAT_INDEX.get(dot < 0 ? p : p.slice(0, dot));
    if (mat === undefined) throw new Error(`unknown material: ${p}`);
    r = { mat, tone: dot < 0 ? 1 : TONE_INDEX[p.slice(dot + 1) as ToneKey] };
  }
  parseCache.set(p, r);
  return r;
}

const hexCache = new Map<string, [number, number, number]>();
function hexToRgb(hex: string): [number, number, number] {
  let c = hexCache.get(hex);
  if (!c) {
    c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    hexCache.set(hex, c);
  }
  return c;
}

export function makeHD(size: number, draw: HdDraw, opts: HdOptions = {}): HTMLCanvasElement {
  const n = size * size;
  // region: (mat * 4 + baseTone) per body pixel, -1 empty, -2 fixed-hex body pixel
  const region = new Int16Array(n).fill(-1);
  const fixed: (string | null)[] = new Array(n).fill(null);
  const rawRgba = new Uint8ClampedArray(n * 4);

  const put: HdPut = (x, y, p) => {
    if (p == null) return;
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const k = y * size + x;
    const parsed = parsePaint(p);
    if ('hex' in parsed) { region[k] = -2; fixed[k] = parsed.hex; }
    else { region[k] = parsed.mat * 4 + parsed.tone; fixed[k] = null; }
  };
  const raw: RawPut = (x, y, hex, alpha = 1) => {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const [r, g, b] = hexToRgb(hex);
    const i = (y * size + x) * 4;
    rawRgba[i] = r; rawRgba[i + 1] = g; rawRgba[i + 2] = b; rawRgba[i + 3] = Math.round(alpha * 255);
  };

  draw(put, raw);

  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  const isBody = (k: number) => region[k] !== -1;
  const sameRegion = (k: number, r: number) => region[k] === r;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      const r = region[k];
      if (r === -1) continue;
      let hex: string;
      if (opts.flash) hex = P.white;
      else if (r === -2) hex = fixed[k]!;
      else {
        const mat = MAT_NAMES[(r / 4) | 0];
        const base = r & 3;
        const lit = (y === 0 || !sameRegion(k - size, r)) || (x === 0 || !sameRegion(k - 1, r));
        const shaded = (y === size - 1 || !sameRegion(k + size, r)) || (x === size - 1 || !sameRegion(k + 1, r));
        const tone = lit ? Math.max(0, base - 1) : shaded ? Math.min(3, base + 1) : base;
        hex = M[mat][tone];
      }
      const [cr, cg, cb] = hexToRgb(hex);
      const i = k * 4;
      d[i] = cr; d[i + 1] = cg; d[i + 2] = cb; d[i + 3] = 255;
    }
  }

  if (opts.outline !== false) {
    const [or, og, ob] = hexToRgb(P.outline);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const k = y * size + x;
        if (isBody(k)) continue;
        const edge =
          (y > 0 && isBody(k - size)) || (y < size - 1 && isBody(k + size)) ||
          (x > 0 && isBody(k - 1)) || (x < size - 1 && isBody(k + 1));
        if (!edge) continue;
        const i = k * 4;
        d[i] = or; d[i + 1] = og; d[i + 2] = ob; d[i + 3] = 255;
      }
    }
  }

  // Raw under-layer fills whatever is still transparent.
  for (let k = 0; k < n; k++) {
    const i = k * 4;
    if (d[i + 3] !== 0 || rawRgba[i + 3] === 0) continue;
    d[i] = rawRgba[i]; d[i + 1] = rawRgba[i + 1]; d[i + 2] = rawRgba[i + 2]; d[i + 3] = rawRgba[i + 3];
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

// ------------------------------------------------------------------
//  Primitives (HD pixel coordinates)
// ------------------------------------------------------------------

export function rect(put: HdPut, x: number, y: number, w: number, h: number, p: Paint | null) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, p);
}

/** Rounded rectangle; `r` is the corner radius in px. */
export function rrect(put: HdPut, x: number, y: number, w: number, h: number, r: number, p: Paint | null) {
  r = Math.min(r, w / 2, h / 2);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const px = i + 0.5, py = j + 0.5;
      const qx = Math.max(r - px, px - (w - r), 0);
      const qy = Math.max(r - py, py - (h - r), 0);
      if (qx * qx + qy * qy <= r * r) put(x + i, y + j, p);
    }
  }
}

export function disc(put: HdPut, cx: number, cy: number, r: number, p: Paint | null) {
  ellipse(put, cx, cy, r, r, p);
}

export function ellipse(put: HdPut, cx: number, cy: number, rx: number, ry: number, p: Paint | null) {
  const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
  const y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(x, y, p);
    }
  }
}

/** Line of the given pixel thickness (square brush). */
export function line(put: HdPut, x0: number, y0: number, x1: number, y1: number, p: Paint | null, thick = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = (thick - 1) / 2;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    for (let j = 0; j < thick; j++)
      for (let i = 0; i < thick; i++)
        put(Math.round(x - half + i), Math.round(y - half + j), p);
  }
}

/** Filled polygon (even-odd), points in HD px. */
export function poly(put: HdPut, pts: ReadonlyArray<readonly [number, number]>, p: Paint | null) {
  let minY = Infinity, maxY = -Infinity;
  for (const [, y] of pts) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const sy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((sy >= ay) !== (sy >= by)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) put(x, y, p);
  }
}

/** Soft elliptical ground shadow on the raw layer. */
export function groundShadow(raw: RawPut, cx: number, cy: number, rx: number, ry: number, alpha = 0.3) {
  const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
  const y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 1) raw(x, y, '#000000', alpha * (d2 > 0.75 ? 0.5 : 1));
    }
  }
}

/** Mirror a put horizontally around the sprite centre. */
export function mirrorX(put: HdPut, size: number): HdPut {
  return (x, y, p) => put(size - 1 - x, y, p);
}
