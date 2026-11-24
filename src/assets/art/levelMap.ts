import type { Biome } from '../../levels';

/**
 * Level-select dressing: the painted map sits inside an unrolled scroll with
 * wooden rods, and the chrome (ribbon title, pinned parchment tags, compass,
 * heraldic shield markers) is drawn in the same hand. Everything is laid out
 * in the scene's 960x640 base space and rendered at the scene's scale factor,
 * so it stays crisp at any canvas size.
 */

export const BASE_W = 960, BASE_H = 640;
/** Where the painted map goes, in base px. The parchment margin around it carries the chrome. */
export const MAP_FRAME = { x0: 58, y0: 50, x1: 902, y1: 600 };
/** The painted interior of level_map_bg.jpg (1024x764), inside its own baked-in parchment border. */
export const MAP_CROP = { x: 56, y: 50, w: 914, h: 660 };
const ROD_L = 40, ROD_R = 920, PX0 = ROD_L + 4, PX1 = ROD_R - 4, PY0 = 16, PY1 = 624;

export const INK = '#2b1d12';
export const PARCHMENT_LIGHT = '#e8d6ac';

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}
const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
function valueNoise(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const fx = x / scale - gx, fy = y / scale - gy;
  const u = quintic(fx), v = quintic(fy);
  const a = hash2(gx, gy, seed), b = hash2(gx + 1, gy, seed), c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x: number, y: number, scale: number, seed: number, octaves = 2): number {
  let sum = 0, amp = 1, norm = 0;
  for (let i = 0; i < octaves; i++) { sum += valueNoise(x + i * 1013, y - i * 719, scale, seed + i * 31) * amp; norm += amp; amp *= 0.5; scale *= 0.5; }
  return sum / norm;
}

function canvasOf(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return [c, c.getContext('2d')!];
}

const tornTop = (bx: number) => (fbm(bx, 7, 38, 91) - 0.5) * 9 + (hash2(bx | 0, 1, 5) - 0.5) * 1.5;
const tornBot = (bx: number) => (fbm(bx, 99, 38, 92) - 0.5) * 9 + (hash2(bx | 0, 2, 6) - 0.5) * 1.5;
const insideSheet = (bx: number, by: number) => bx >= PX0 && bx <= PX1 && by >= PY0 + tornTop(bx) && by <= PY1 + tornBot(bx);

/** The parchment sheet at base resolution; the frame scales it up, which suits its soft grain. */
function drawSheet(): HTMLCanvasElement {
  const [c, ctx] = canvasOf(BASE_W, BASE_H);
  const img = ctx.createImageData(BASE_W, BASE_H);
  const d = img.data;
  const PARCH = hex('#dcc69a'), PARCH_D = hex('#c3a773'), PARCH_DD = hex('#9d7d4f'), BURN = hex('#5a4026'), CURL = hex('#4a3420'), LIGHT = hex('#f1e2bd');
  const stains: [number, number, number, number][] = [[210, 560, 60, 0.35], [700, 90, 48, 0.3], [860, 580, 70, 0.4], [480, 40, 36, 0.25], [90, 140, 40, 0.22], [600, 610, 44, 0.3]];
  for (let y = 0; y < BASE_H; y++) for (let x = 0; x < BASE_W; x++) {
    const i = (y * BASE_W + x) * 4;
    if (!insideSheet(x, y)) {
      if (insideSheet(x - 5, y - 7)) { d[i + 3] = 140; }
      continue;
    }
    const n = fbm(x, y, 160, 11, 3), f = fbm(x * 0.35, y * 4, 24, 12), sp = hash2(x, y, 13);
    let col = mix(PARCH, PARCH_D, clamp(n * 1.3 - 0.2, 0, 1));
    col = mix(col, PARCH_DD, clamp((f - 0.62) * 1.2, 0, 0.35));
    if (sp > 0.985) col = mix(col, PARCH_DD, 0.35);
    for (const [cx, cy, r, a] of stains) {
      const dd = Math.hypot(x - cx, y - cy) / (r * (0.8 + 0.4 * fbm(x, y, 30, 14)));
      if (dd < 1) col = mix(col, PARCH_DD, a * (1 - dd) ** 1.5 * (0.6 + 0.4 * fbm(x, y, 9, 15)));
    }
    const e = Math.min(y - (PY0 + tornTop(x)), (PY1 + tornBot(x)) - y);
    if (e < 26) col = mix(col, PARCH_DD, (1 - e / 26) ** 2 * 0.75);
    if (e < 3) col = mix(col, BURN, (1 - e / 3) * 0.7);
    const rd = Math.min(x - PX0, PX1 - x);
    if (rd < 34) col = mix(col, CURL, (1 - rd / 34) ** 2.2 * 0.6);
    if (rd > 34 && rd < 40) col = mix(col, LIGHT, 0.25 * (1 - Math.abs(rd - 37) / 3));
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function drawRods(ctx: CanvasRenderingContext2D) {
  const bands: [number, string][] = [[-13, '#3a2414'], [-10, '#5a3a22'], [-6, '#7d5131'], [-2, '#9a6a40'], [2, '#7d5131'], [7, '#5a3a22'], [10, '#3a2414']];
  for (const rx of [ROD_L, ROD_R]) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rx - 15, 4, 32, BASE_H - 6);
    for (let i = 0; i < bands.length; i++) {
      const x0 = rx + bands[i][0], x1 = i + 1 < bands.length ? rx + bands[i + 1][0] : rx + 13;
      ctx.fillStyle = bands[i][1]; ctx.fillRect(x0, 8, x1 - x0, BASE_H - 16);
    }
    for (let y = 8; y < BASE_H - 8; y++) {
      if (hash2(rx, y, 21) < 0.08) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(rx - 9 + hash2(rx, y, 22) * 14, y, 3 + hash2(rx, y, 23) * 6, 1); }
    }
    for (const [cy, dir] of [[8, -1], [BASE_H - 8, 1]] as [number, number][]) {
      ctx.fillStyle = '#2d1a0e'; ctx.beginPath(); ctx.ellipse(rx, cy + dir * 2, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4526'; ctx.beginPath(); ctx.ellipse(rx, cy + dir, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9893c'; ctx.fillRect(rx - 13, cy + (dir < 0 ? 3 : -6), 26, 3);
      ctx.fillStyle = '#e6c06a'; ctx.fillRect(rx - 13, cy + (dir < 0 ? 3 : -6), 26, 1);
      ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.ellipse(rx, cy + dir * 6, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a30'; ctx.beginPath(); ctx.ellipse(rx, cy + dir * 5, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/** The table, the sheet, the rods and the ink frame the map sits in, at canvas size w x h with scale sf. */
export function drawScrollFrameCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w, h);
  ctx.fillStyle = '#0e1117'; ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
  g.addColorStop(0, 'rgba(40,46,60,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(120,200,140,${0.15 + 0.3 * hash2(i, 3, 77)})`;
    ctx.fillRect(Math.round(hash2(i, 1, 77) * w), Math.round(hash2(i, 2, 77) * h), 2, 2);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(drawSheet(), 0, 0, w, h);
  ctx.save(); ctx.scale(sf, sf);
  // a lighter panel under the map, then the ink frame around it
  ctx.fillStyle = 'rgba(232,215,173,0.3)'; ctx.fillRect(MAP_FRAME.x0, MAP_FRAME.y0, MAP_FRAME.x1 - MAP_FRAME.x0, MAP_FRAME.y1 - MAP_FRAME.y0);
  ctx.lineWidth = 1.4; ctx.strokeStyle = INK; ctx.strokeRect(MAP_FRAME.x0, MAP_FRAME.y0, MAP_FRAME.x1 - MAP_FRAME.x0, MAP_FRAME.y1 - MAP_FRAME.y0);
  ctx.lineWidth = 0.6; ctx.strokeRect(MAP_FRAME.x0 - 3, MAP_FRAME.y0 - 3, MAP_FRAME.x1 - MAP_FRAME.x0 + 6, MAP_FRAME.y1 - MAP_FRAME.y0 + 6);
  drawRods(ctx);
  ctx.restore();
  return c;
}

/** Inner shadow over the map so it reads as set into the sheet. Drawn as a separate layer above the map image. */
export function drawMapInsetCanvas(sf: number): HTMLCanvasElement {
  const w = MAP_FRAME.x1 - MAP_FRAME.x0, h = MAP_FRAME.y1 - MAP_FRAME.y0;
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  const edge = 14;
  for (const [x0, y0, x1, y1, dx, dy] of [[0, 0, w, edge, 0, 1], [0, h - edge, w, h, 0, -1], [0, 0, edge, h, 1, 0], [w - edge, 0, w, h, -1, 0]] as number[][]) {
    const gr = ctx.createLinearGradient(dx ? (dx > 0 ? 0 : w) : 0, dy ? (dy > 0 ? 0 : h) : 0, dx ? (dx > 0 ? edge : w - edge) : 0, dy ? (dy > 0 ? edge : h - edge) : 0);
    gr.addColorStop(0, 'rgba(40,25,10,0.35)'); gr.addColorStop(1, 'rgba(40,25,10,0)');
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  return c;
}

export function drawRibbonCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const pad = 18;
  const [c, ctx] = canvasOf((w + pad * 2) * sf, (h + 10) * sf);
  ctx.scale(sf, sf);
  const cx = w / 2 + pad, cy = h / 2 + 2;
  const body = (x0: number, x1: number, y0: number, y1: number) => { ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); };
  for (const sgn of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(cx + sgn * (w / 2 - 8), cy - h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 + 14), cy - h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 + 8), cy + 1); ctx.lineTo(cx + sgn * (w / 2 + 14), cy + h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 - 8), cy + h / 2 + 4); ctx.closePath();
    ctx.fillStyle = '#9a2f26'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + sgn * (w / 2), cy + h / 2); ctx.lineTo(cx + sgn * (w / 2 - 8), cy + h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2), cy + h / 2 + 4); ctx.closePath(); ctx.fillStyle = '#5e1812'; ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; body(cx - w / 2 + 2, cx + w / 2 + 2, cy - h / 2 + 3, cy + h / 2 + 3); ctx.fill();
  ctx.fillStyle = '#c23a2f'; body(cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; body(cx - w / 2, cx + w / 2, cy - h / 2, cy - h / 2 + 4); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; body(cx - w / 2, cx + w / 2, cy + h / 2 - 4, cy + h / 2); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = INK; body(cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2); ctx.stroke();
  return c;
}

/** A pinned parchment tag; w x h in base px. */
export function drawTagCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf((w + 4) * sf, (h + 5) * sf);
  ctx.scale(sf, sf);
  const x = 1, y = 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 1.5, y + 2, w, h);
  ctx.fillStyle = PARCHMENT_LIGHT; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,90,50,0.25)'; ctx.fillRect(x, y + h - 3, w, 3);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 0.6; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  ctx.fillStyle = '#8c2a22'; ctx.beginPath(); ctx.arc(x + w / 2, y + 1, 2.2, 0, Math.PI * 2); ctx.fill();
  return c;
}

export function drawMedalIconCanvas(sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(14 * sf, 16 * sf);
  ctx.scale(sf, sf);
  ctx.fillStyle = '#b23a2e'; ctx.fillRect(4, 1, 6, 6);
  ctx.fillStyle = '#e0b43c'; ctx.beginPath(); ctx.arc(7, 10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 0.8; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(5.5, 8.5, 1.4, 0, Math.PI * 2); ctx.fill();
  return c;
}

export function drawCompassCanvas(r: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf((r * 2 + 4) * sf, (r * 2 + 4) * sf);
  ctx.scale(sf, sf);
  const cx = r + 2, cy = r + 2;
  ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(43,29,18,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, l = i % 4 === 0 ? r * 0.12 : r * 0.06; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a) * (r - l), cy + Math.sin(a) * (r - l)); ctx.stroke(); }
  const star = (n: number, R: number, rr: number, rot: number, c1: string, c2: string) => {
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * Math.PI * 2, b = a + Math.PI / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); ctx.closePath(); ctx.fillStyle = c1; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a - Math.PI / n) * rr, cy + Math.sin(a - Math.PI / n) * rr); ctx.closePath(); ctx.fillStyle = c2; ctx.fill();
    }
  };
  star(4, r * 0.62, r * 0.18, Math.PI / 4, '#7a1f18', '#b23a2e');
  star(4, r * 0.92, r * 0.2, -Math.PI / 2, '#e9dcb8', INK);
  ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(cx, cy, r * 0.05, 0, Math.PI * 2); ctx.stroke();
  return c;
}

function biomeGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Biome, c: string) {
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  switch (b) {
    case 'grasslands': ctx.beginPath(); ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx - 5, cy - 3); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy - 6); ctx.moveTo(cx + 4, cy + 4); ctx.lineTo(cx + 5, cy - 3); ctx.stroke(); break;
    case 'forest': for (const [ox, h] of [[-3, 9], [3, 7]] as [number, number][]) { ctx.beginPath(); ctx.moveTo(cx + ox, cy - h / 2 - 1); ctx.lineTo(cx + ox + 3.5, cy + 4); ctx.lineTo(cx + ox - 3.5, cy + 4); ctx.closePath(); ctx.fill(); } break;
    case 'river': for (const oy of [-3, 1, 5]) { ctx.beginPath(); ctx.moveTo(cx - 6, cy + oy); ctx.quadraticCurveTo(cx - 3, cy + oy - 3, cx, cy + oy); ctx.quadraticCurveTo(cx + 3, cy + oy + 3, cx + 6, cy + oy); ctx.stroke(); } break;
    case 'infected': ctx.beginPath(); ctx.arc(cx, cy - 1, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 7); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 1.2, 0, Math.PI * 2); ctx.arc(cx + 2, cy, 1.2, 0, Math.PI * 2); ctx.fill(); break;
    case 'castle': ctx.fillRect(cx - 6, cy - 2, 12, 8); for (const ox of [-6, -2, 2]) ctx.fillRect(cx + ox, cy - 5, 2, 3); ctx.fillRect(cx + 4, cy - 5, 2, 3); break;
    case 'desert': ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 7, cy + 5); ctx.lineTo(cx - 7, cy + 5); ctx.closePath(); ctx.fill(); break;
    case 'tundra': for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.lineTo(cx - Math.cos(a) * 6, cy - Math.sin(a) * 6); ctx.stroke(); } break;
    case 'volcanic': ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.quadraticCurveTo(cx + 7, cy, cx + 3, cy + 6); ctx.quadraticCurveTo(cx, cy + 3, cx - 3, cy + 6); ctx.quadraticCurveTo(cx - 7, cy, cx, cy - 7); ctx.fill(); break;
  }
}
function lockGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, c: string) {
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1.6;
  ctx.fillRect(cx - 5, cy - 1, 10, 7); ctx.beginPath(); ctx.arc(cx, cy - 2, 3.5, Math.PI, 0); ctx.stroke();
}
const SHIELD_FILL: Record<Biome, string> = { grasslands: '#4f8a3a', forest: '#2f6a35', infected: '#7a3f8c', river: '#3a76b0', castle: '#6c6c7c', desert: '#c9a24e', tundra: '#7fa9c9', volcanic: '#b0402e' };

/** Shield marker geometry shared by the marker, its glow and the scene's layout. r is the marker's half-height-ish radius in base px. */
export const SHIELD_R = 15;
export const SHIELD_W = SHIELD_R * 1.7, SHIELD_H = SHIELD_R * 2.05;
function shieldPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, grow = 0) {
  const w = SHIELD_W + grow * 2, h = SHIELD_H + grow * 2, top = cy - SHIELD_H * 0.46 - grow;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx + w / 2, top); ctx.lineTo(cx + w / 2, top + h * 0.5);
  ctx.quadraticCurveTo(cx + w / 2, top + h * 0.85, cx, top + h); ctx.quadraticCurveTo(cx - w / 2, top + h * 0.85, cx - w / 2, top + h * 0.5); ctx.closePath();
}
const SHIELD_PAD = 6;
/** Boss shields are a quarter larger and carry a crown above the chief. */
export const BOSS_SCALE = 1.25;
const CROWN_H = 11;
export type BossTier = 'biome' | 'final' | undefined;
/** Canvas footprint of a marker in base px, with the shield's centre inside it. */
export function shieldLayout(boss: BossTier) {
  const scale = boss ? BOSS_SCALE : 1;
  const w = (SHIELD_W + SHIELD_PAD * 2) * scale, h = (SHIELD_H + SHIELD_PAD * 2) * scale + (boss ? CROWN_H : 0);
  return { w, h, cx: w / 2, cy: (SHIELD_PAD + SHIELD_H * 0.46) * scale + (boss ? CROWN_H : 0), scale };
}
function crown(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, unlocked: boolean) {
  const h = w * 0.55;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx - w / 2, cy - h * 0.6); ctx.lineTo(cx - w * 0.25, cy - h * 0.3); ctx.lineTo(cx, cy - h); ctx.lineTo(cx + w * 0.25, cy - h * 0.3); ctx.lineTo(cx + w / 2, cy - h * 0.6); ctx.lineTo(cx + w / 2, cy); ctx.closePath();
  ctx.fillStyle = unlocked ? '#e6c06a' : '#a39b8e'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = unlocked ? '#b23a2e' : '#6e6862';
  for (const ox of [-w * 0.25, 0, w * 0.25]) { ctx.beginPath(); ctx.arc(cx + ox, cy - h * 0.15, w * 0.07, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - w / 2 + 1, cy - h * 0.6 + 1, 1.5, 2);
}
/** The marker canvas; shieldLayout(boss) gives the shield centre inside it. */
export function drawShieldCanvas(biome: Biome, unlocked: boolean, sf: number, boss: BossTier = undefined): HTMLCanvasElement {
  const L = shieldLayout(boss);
  const [c, ctx] = canvasOf(L.w * sf, L.h * sf);
  ctx.scale(sf * L.scale, sf * L.scale);
  const cx = L.cx / L.scale, cy = L.cy / L.scale, top = cy - SHIELD_H * 0.46, w = SHIELD_W, h = SHIELD_H;
  ctx.save(); ctx.translate(2, 3); shieldPath(ctx, cx, cy); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
  shieldPath(ctx, cx, cy); ctx.fillStyle = unlocked ? SHIELD_FILL[biome] : '#5e5a55'; ctx.fill();
  ctx.save(); shieldPath(ctx, cx, cy); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(cx - w / 2, top, w / 2, h);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - w / 2, top + h * 0.62, w, h);
  ctx.restore();
  shieldPath(ctx, cx, cy); ctx.lineWidth = 2; ctx.strokeStyle = unlocked ? '#e6c06a' : '#8b8378'; ctx.stroke();
  shieldPath(ctx, cx, cy); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = unlocked ? '#f3dc9a' : '#a39b8e';
  for (const ox of [-w * 0.36, w * 0.36]) { ctx.beginPath(); ctx.arc(cx + ox, top + 4, 1.1, 0, Math.PI * 2); ctx.fill(); }
  if (unlocked) { biomeGlyph(ctx, cx + 0.7, cy + 0.7, biome, 'rgba(0,0,0,0.45)'); biomeGlyph(ctx, cx, cy, biome, '#f6ecd2'); }
  else { lockGlyph(ctx, cx + 0.7, cy + 0.7, 'rgba(0,0,0,0.45)'); lockGlyph(ctx, cx, cy, '#c9c1b2'); }
  if (boss) {
    shieldPath(ctx, cx, cy, 2.4); ctx.lineWidth = 1.2; ctx.strokeStyle = unlocked ? '#e6c06a' : '#8b8378'; ctx.stroke();
    shieldPath(ctx, cx, cy, 3.6); ctx.lineWidth = 0.7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.setTransform(sf, 0, 0, sf, 0, 0);
    crown(ctx, L.cx, L.cy - SHIELD_H * 0.46 * L.scale - 1.5, boss === 'final' ? SHIELD_W * 0.8 : SHIELD_W * 0.6, unlocked);
  }
  return c;
}
/** A gold outline a little larger than the shield, for the hover state. Same footprint and centre as the marker. */
export function drawShieldGlowCanvas(sf: number, boss: BossTier = undefined): HTMLCanvasElement {
  const L = shieldLayout(boss);
  const [c, ctx] = canvasOf(L.w * sf, L.h * sf);
  ctx.scale(sf * L.scale, sf * L.scale);
  const cx = L.cx / L.scale, cy = L.cy / L.scale, g = boss ? 4 : 0;
  shieldPath(ctx, cx, cy, 4.5 + g); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,216,74,0.35)'; ctx.stroke();
  shieldPath(ctx, cx, cy, 3 + g); ctx.lineWidth = 1.6; ctx.strokeStyle = '#ffd84a'; ctx.stroke();
  return c;
}
/** The final boss's ember glow, drawn under its shield; the scene pulses its alpha. Same footprint and centre as the marker. */
export function drawEmberGlowCanvas(sf: number): HTMLCanvasElement {
  const L = shieldLayout('final');
  const [c, ctx] = canvasOf(L.w * sf, L.h * sf);
  ctx.scale(sf * L.scale, sf * L.scale);
  const cx = L.cx / L.scale, cy = L.cy / L.scale;
  for (let i = 4; i >= 1; i--) { shieldPath(ctx, cx, cy, 2 + i * 2.2); ctx.fillStyle = `rgba(255,90,30,${0.09 * (5 - i)})`; ctx.fill(); }
  return c;
}
/** Centre of a regular shield inside its canvas, in base px. */
export const SHIELD_CENTER = { x: SHIELD_W / 2 + SHIELD_PAD, y: SHIELD_PAD + SHIELD_H * 0.46 };

// ---------------------------------------------------------------- mission panel: iron and timber
function nail(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fillStyle = '#c9a24e'; ctx.fill();
  ctx.lineWidth = 0.7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 1.2, y - 1.2, 1, 1);
}
function parchmentSheet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  ctx.fillStyle = PARCHMENT_LIGHT; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,90,50,0.08)';
  for (let i = 0; i < 40; i++) {
    const px = x + ((i * 7919 + seed * 13) % 1000) / 1000 * w, py = y + ((i * 104729 + seed * 7) % 1000) / 1000 * h;
    ctx.beginPath(); ctx.ellipse(px, py, 6 + (i % 5) * 4, 3 + (i % 3) * 2, i, 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,245,220,0.25)'); g.addColorStop(1, 'rgba(90,60,30,0.18)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
function bracket(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, arm: number) {
  const t = arm * 0.26;
  ctx.fillStyle = '#4b4a4e'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * arm, y); ctx.lineTo(x + sx * arm, y + sy * t); ctx.lineTo(x + sx * t, y + sy * t); ctx.lineTo(x + sx * t, y + sy * arm); ctx.lineTo(x, y + sy * arm); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = '#1e1d20'; ctx.stroke();
  ctx.fillStyle = '#8c8b90'; ctx.fillRect(Math.min(x, x + sx * arm), Math.min(y, y + sy * 2), arm, 1.5);
  for (const [rx, ry] of [[x + sx * t * 0.55, y + sy * t * 0.55], [x + sx * arm * 0.76, y + sy * t * 0.55], [x + sx * t * 0.55, y + sy * arm * 0.76]]) {
    ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#9a9aa2'; ctx.fill(); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 0.7; ctx.stroke();
  }
}
/** The plank board the mission panel is built on; w x h in base px. */
export function drawPlankBoardCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  const n = Math.max(4, Math.round(h / 60)), ph = h / n;
  for (let i = 0; i < n; i++) {
    const y = i * ph;
    ctx.fillStyle = i % 2 ? '#7a4f2d' : '#6e4628'; ctx.fillRect(0, y, w, ph);
    ctx.strokeStyle = 'rgba(40,20,8,0.35)'; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) { const yy = y + 3 + ((k * 37 + i * 11) % Math.max(1, ph - 6)); ctx.beginPath(); ctx.moveTo(4, yy); ctx.bezierCurveTo(w * 0.3, yy + 2, w * 0.6, yy - 2, w - 4, yy + 1); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,220,160,0.12)'; ctx.fillRect(0, y, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, y + ph - 2, w, 2);
  }
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#2a1608'; ctx.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
  const arm = Math.min(34, w * 0.14);
  bracket(ctx, 1, 1, 1, 1, arm); bracket(ctx, w - 1, 1, -1, 1, arm); bracket(ctx, 1, h - 1, 1, -1, arm); bracket(ctx, w - 1, h - 1, -1, -1, arm);
  return c;
}
/** A brass plate with four nails; lit is the usable state, unlit the waiting one. */
export function drawBrassPlateCanvas(w: number, h: number, sf: number, state: 'lit' | 'hover' | 'unlit'): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  ctx.fillStyle = state === 'unlit' ? '#7a6f58' : state === 'hover' ? '#e2bd6a' : '#c9a24e'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, 0, w, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, h - 3, w, 3);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  for (const [nx, ny] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) nail(ctx, nx, ny);
  return c;
}
/** The dark iron backing a brass title plate sits on. */
export function drawIronPlateCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  ctx.fillStyle = '#3f3e42'; ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 1; ctx.strokeStyle = '#1e1d20'; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  return c;
}
/** The parchment sheet nailed to the board; w x h in base px. */
export function drawNailedSheetCanvas(w: number, h: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  parchmentSheet(ctx, 0, 0, w, h, 5);
  ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  for (const [nx, ny] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) nail(ctx, nx, ny);
  return c;
}
/** A wooden difficulty tab with a brass nail at its left. */
export function drawWoodTabCanvas(w: number, h: number, sf: number, state: 'idle' | 'hover' | 'selected'): HTMLCanvasElement {
  const [c, ctx] = canvasOf(w * sf, h * sf);
  ctx.scale(sf, sf);
  ctx.fillStyle = state === 'selected' ? '#b07a3e' : state === 'hover' ? '#b8864c' : '#9a6a3a'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(40,20,8,0.3)'; ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) { const yy = 4 + ((k * 37 + 5) % Math.max(1, h - 8)); ctx.beginPath(); ctx.moveTo(4, yy); ctx.bezierCurveTo(w * 0.3, yy + 1.5, w * 0.6, yy - 1.5, w - 4, yy + 0.5); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,180,0.2)'; ctx.fillRect(0, 0, w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, h - 2, w, 2);
  ctx.lineWidth = state === 'selected' ? 1.4 : 0.9; ctx.strokeStyle = state === 'selected' ? '#e6c06a' : '#3a2010'; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  nail(ctx, 8, h / 2);
  return c;
}
/** The round iron close button. */
export function drawIronButtonCanvas(r: number, sf: number, hover: boolean): HTMLCanvasElement {
  const [c, ctx] = canvasOf((r * 2 + 2) * sf, (r * 2 + 2) * sf);
  ctx.scale(sf, sf);
  const cx = r + 1, cy = r + 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = hover ? '#6e6d73' : '#5a595e'; ctx.fill(); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.3, r * 0.6, Math.PI, 0); ctx.fill();
  const a = r * 0.4; ctx.lineWidth = 1.8; ctx.strokeStyle = '#e8e0cc'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - a, cy - a); ctx.lineTo(cx + a, cy + a); ctx.moveTo(cx + a, cy - a); ctx.lineTo(cx - a, cy + a); ctx.stroke();
  return c;
}
/** A medal check for an earned difficulty, or an empty inked ring. */
export function drawMedalCheckCanvas(colorHex: string | null, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(14 * sf, 14 * sf);
  ctx.scale(sf, sf);
  if (!colorHex) { ctx.beginPath(); ctx.arc(7, 7, 5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,235,200,0.55)'; ctx.lineWidth = 1; ctx.stroke(); return c; }
  ctx.beginPath(); ctx.arc(7, 7, 5.5, 0, Math.PI * 2); ctx.fillStyle = colorHex; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, 7); ctx.lineTo(6.2, 9.4); ctx.lineTo(10.2, 4.4); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  return c;
}

// ---------------------------------------------------------------- ranger profile: ledger on the board
/** The brass medallion the rank sits on; r in base px. */
export function drawMedallionCanvas(r: number, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf((r * 2 + 4) * sf, (r * 2 + 4) * sf);
  ctx.scale(sf, sf);
  const cx = r + 2, cy = r + 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#c9a24e'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(43,29,18,0.6)'; ctx.stroke();
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.37, 2, cx, cy, r); g.addColorStop(0, 'rgba(255,245,210,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  return c;
}
/** An iron trough with a gold XP fill; w x h is the inner bar in base px, the frame adds 3 all round. */
export function drawXpTroughCanvas(w: number, h: number, sf: number, pct: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf((w + 6) * sf, (h + 6) * sf);
  ctx.scale(sf, sf);
  ctx.fillStyle = '#3f3e42'; ctx.fillRect(0, 0, w + 6, h + 6); ctx.lineWidth = 1; ctx.strokeStyle = '#1e1d20'; ctx.strokeRect(0.5, 0.5, w + 5, h + 5);
  ctx.fillStyle = '#1e1a16'; ctx.fillRect(3, 3, w, h);
  const fill = Math.max(0, Math.min(1, pct)) * w;
  if (fill > 0) { ctx.fillStyle = '#c9a24e'; ctx.fillRect(3, 3, fill, h); ctx.fillStyle = 'rgba(255,245,210,0.35)'; ctx.fillRect(3, 3, fill, 3); }
  for (const [nx, ny] of [[3, 3], [w + 3, 3], [3, h + 3], [w + 3, h + 3]]) nail(ctx, nx, ny);
  return c;
}
/** A small padlock in the given colour, 14 px square. */
export function drawLockCanvas(colorHex: string, sf: number): HTMLCanvasElement {
  const [c, ctx] = canvasOf(14 * sf, 14 * sf);
  ctx.scale(sf, sf);
  lockGlyph(ctx, 7, 8, colorHex);
  return c;
}
