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
/** The marker canvas is centred on the shield's centre: (SHIELD_W/2 + pad, SHIELD_H*0.46 + pad). */
export function drawShieldCanvas(biome: Biome, unlocked: boolean, sf: number): HTMLCanvasElement {
  const cw = SHIELD_W + SHIELD_PAD * 2, ch = SHIELD_H + SHIELD_PAD * 2;
  const [c, ctx] = canvasOf(cw * sf, ch * sf);
  ctx.scale(sf, sf);
  const cx = cw / 2, cy = SHIELD_PAD + SHIELD_H * 0.46, top = cy - SHIELD_H * 0.46, w = SHIELD_W, h = SHIELD_H;
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
  return c;
}
/** A gold outline a little larger than the shield, for the hover state. Same canvas size and centre as the marker. */
export function drawShieldGlowCanvas(sf: number): HTMLCanvasElement {
  const cw = SHIELD_W + SHIELD_PAD * 2, ch = SHIELD_H + SHIELD_PAD * 2;
  const [c, ctx] = canvasOf(cw * sf, ch * sf);
  ctx.scale(sf, sf);
  const cx = cw / 2, cy = SHIELD_PAD + SHIELD_H * 0.46;
  shieldPath(ctx, cx, cy, 4.5); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,216,74,0.35)'; ctx.stroke();
  shieldPath(ctx, cx, cy, 3); ctx.lineWidth = 1.6; ctx.strokeStyle = '#ffd84a'; ctx.stroke();
  return c;
}
/** Centre of the shield inside its canvas, in base px. */
export const SHIELD_CENTER = { x: SHIELD_W / 2 + SHIELD_PAD, y: SHIELD_PAD + SHIELD_H * 0.46 };
