// Shared raster + noise helpers for the meadow ground studies. Everything is
// deterministic in world coordinates so a region renders identically no
// matter how it is chunked — the same contract the game's terrain uses.

export type Rgb = readonly [number, number, number];

export function hex(h: string): Rgb {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}

const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function valueNoise(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const fx = x / scale - gx, fy = y / scale - gy;
  const u = quintic(fx), v = quintic(fy);
  const a = hash2(gx, gy, seed), b = hash2(gx + 1, gy, seed);
  const c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** 0..1-ish fractal noise. Few octaves on purpose: large readable shapes, no speckle. */
export function fbm(x: number, y: number, scale: number, seed: number, octaves = 2, gain = 0.5): number {
  let sum = 0, amp = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x + i * 1013, y - i * 719, scale, seed + i * 31) * amp;
    norm += amp;
    amp *= gain;
    scale *= 0.5;
  }
  return sum / norm;
}

export class Raster {
  readonly data: Uint8ClampedArray;
  constructor(readonly x0: number, readonly y0: number, readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  /** Opaque or alpha-blended write in world px. */
  put(wx: number, wy: number, c: Rgb, alpha = 1): void {
    const x = (wx - this.x0) | 0, y = (wy - this.y0) | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const d = this.data;
    if (alpha >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    d[i] = d[i] + (c[0] - d[i]) * alpha;
    d[i + 1] = d[i + 1] + (c[1] - d[i + 1]) * alpha;
    d[i + 2] = d[i + 2] + (c[2] - d[i + 2]) * alpha;
    d[i + 3] = 255;
  }
  /** Multiply the existing pixel (soft shadows / sun dapple). */
  mul(wx: number, wy: number, f: number): void {
    const x = (wx - this.x0) | 0, y = (wy - this.y0) | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const d = this.data;
    d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
  }
}

export type Put = (wx: number, wy: number, c: Rgb, alpha?: number) => void;

export function disc(put: Put, cx: number, cy: number, r: number, c: Rgb, alpha = 1): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) put(x, y, c, alpha);
}

export function ellipse(put: Put, cx: number, cy: number, rx: number, ry: number, c: Rgb, alpha = 1): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, c, alpha);
}

export function line(put: Put, x0: number, y0: number, x1: number, y1: number, c: Rgb, alpha = 1): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c, alpha);
}

/** Lerp two colours. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Signed distance (in px, approx) from the contour `n(x,y) = thresh` of a
 * fractal field, positive inside. Computed on a coarse grid from the gradient
 * and bilinearly sampled, which is also how it would ship in the game.
 */
export function distanceField(x0: number, y0: number, w: number, h: number, scale: number, seed: number, thresh: number, octaves = 2, step = 2) {
  const gw = Math.ceil(w / step) + 3, gh = Math.ceil(h / step) + 3;
  const n = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++)
      n[gy * gw + gx] = fbm(x0 + (gx - 1) * step, y0 + (gy - 1) * step, scale, seed, octaves);
  const dist = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      const l = n[gy * gw + Math.max(gx - 1, 0)], r = n[gy * gw + Math.min(gx + 1, gw - 1)];
      const u = n[Math.max(gy - 1, 0) * gw + gx], d = n[Math.min(gy + 1, gh - 1) * gw + gx];
      const grad = Math.hypot((r - l) / (2 * step), (d - u) / (2 * step));
      const v = (n[gy * gw + gx] - thresh) / Math.max(grad, 1e-4);
      dist[gy * gw + gx] = Math.max(-80, Math.min(80, v));
    }
  return (wx: number, wy: number): number => {
    const fx = (wx - x0) / step + 1, fy = (wy - y0) / step + 1;
    const ix = Math.max(0, Math.min(gw - 2, Math.floor(fx))), iy = Math.max(0, Math.min(gh - 2, Math.floor(fy)));
    const tx = fx - ix, ty = fy - iy;
    const a = dist[iy * gw + ix], b = dist[iy * gw + ix + 1], c = dist[(iy + 1) * gw + ix], d = dist[(iy + 1) * gw + ix + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };
}
