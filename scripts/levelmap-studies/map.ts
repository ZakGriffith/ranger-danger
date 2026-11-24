// Level-select map studies: the world as a drawn chart on an unrolled scroll.
// Three treatments share one engine (parchment, rods, warped biome regions,
// hand-inked symbols, route, nodes, chrome): M1 ink and wash, M2 painted
// atlas, M3 ranger's journal where unexplored lands stay in pencil.
// Everything is laid out in the 960x640 base space the scene uses and drawn
// at S x that, so the node coordinates in src/levels.ts stay valid.
import { LEVELS, MEDAL_COLORS, type Biome, type LevelDef } from '../../src/levels';

export type Host = { createCanvas: (w: number, h: number) => any; createImageData: (d: Uint8ClampedArray, w: number, h: number) => any };
export type MapStyle = 'M1' | 'M2' | 'M3';
export const BASE_W = 960, BASE_H = 640, S = 2, W = BASE_W * S, H = BASE_H * S;

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: Rgb, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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
  const a = hash2(gx, gy, seed), b = hash2(gx + 1, gy, seed), c = hash2(gx, gy + 1, seed), d = hash2(gx + 1, gy + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
export function fbm(x: number, y: number, scale: number, seed: number, octaves = 2, gain = 0.5): number {
  let sum = 0, amp = 1, norm = 0;
  for (let i = 0; i < octaves; i++) { sum += valueNoise(x + i * 1013, y - i * 719, scale, seed + i * 31) * amp; norm += amp; amp *= gain; scale *= 0.5; }
  return sum / norm;
}

// ---------------------------------------------------------------- layout
const ROD_L = 40, ROD_R = 920, ROD_R_ = 13;           // rod centres and radius (base px)
const PX0 = ROD_L + 4, PX1 = ROD_R - 4, PY0 = 16, PY1 = 624;
const FRAME = { x0: 58, y0: 46, x1: 902, y1: 598 };     // M2 painting frame
const tornTop = (bx: number) => (fbm(bx, 7, 38, 91, 2) - 0.5) * 9 + (hash2(bx | 0, 1, 5) - 0.5) * 1.5;
const tornBot = (bx: number) => (fbm(bx, 99, 38, 92, 2) - 0.5) * 9 + (hash2(bx | 0, 2, 6) - 0.5) * 1.5;
export function insideParchment(bx: number, by: number): boolean {
  return bx >= PX0 && bx <= PX1 && by >= PY0 + tornTop(bx) && by <= PY1 + tornBot(bx);
}

// ---------------------------------------------------------------- regions
// Biome ids. River woods are the Rivers level's own wooded grassland.
const B = { grass: 0, forest: 1, infected: 2, desert: 3, tundra: 4, volcanic: 5, castle: 6, woods: 7 } as const;
type BId = typeof B[keyof typeof B];
const ANCHORS: [number, number, BId][] = [];
const add = (b: BId, pts: [number, number][]) => pts.forEach(([x, y]) => ANCHORS.push([x, y, b]));
add(B.grass, [[150, 345], [90, 300], [60, 420], [230, 330], [300, 470], [100, 520], [250, 560], [60, 150], [240, 110], [180, 600], [320, 300], [40, 480]]);
add(B.woods, [[168, 200], [200, 240], [120, 230], [230, 180], [150, 160]]);
add(B.castle, [[125, 95], [165, 70], [90, 60], [120, 30]]);
add(B.forest, [[265, 425], [300, 390], [220, 470], [330, 450], [260, 500], [200, 420]]);
add(B.infected, [[410, 320], [450, 360], [370, 290], [430, 260], [480, 300], [400, 380], [350, 330]]);
add(B.desert, [[430, 170], [540, 110], [620, 200], [500, 160], [600, 120], [560, 220], [380, 180], [680, 150], [660, 230], [310, 90], [420, 70], [500, 40], [600, 50], [690, 80]]);
add(B.tundra, [[380, 460], [490, 530], [610, 450], [500, 470], [560, 560], [420, 560], [640, 540], [680, 480], [340, 560], [440, 610], [560, 620], [660, 610]]);
add(B.volcanic, [[750, 340], [830, 200], [870, 420], [800, 300], [850, 520], [780, 120], [760, 220], [900, 300], [720, 420], [760, 540], [880, 120], [720, 480], [710, 180], [900, 560], [920, 200], [820, 40]]);

export type Region = { bio: Uint8Array; edge: Float32Array };
export function buildRegions(): Region {
  const bio = new Uint8Array(BASE_W * BASE_H), edge = new Float32Array(BASE_W * BASE_H);
  for (let y = 0; y < BASE_H; y++) for (let x = 0; x < BASE_W; x++) {
    const wx = x + (fbm(x, y, 70, 301, 3) - 0.5) * 90, wy = y + (fbm(x, y, 70, 302, 3) - 0.5) * 90;
    let d1 = 1e9, d2 = 1e9, b1: BId = 0;
    for (const [ax, ay, ab] of ANCHORS) {
      const d = Math.hypot(wx - ax, wy - ay);
      if (d < d1) { if (ab !== b1) d2 = d1; d1 = d; b1 = ab; } else if (ab !== b1 && d < d2) d2 = d;
    }
    bio[y * BASE_W + x] = b1; edge[y * BASE_W + x] = d2 - d1;
  }
  return { bio, edge };
}
const bioAt = (r: Region, bx: number, by: number) => r.bio[clamp(by | 0, 0, BASE_H - 1) * BASE_W + clamp(bx | 0, 0, BASE_W - 1)];
const edgeAt = (r: Region, bx: number, by: number) => r.edge[clamp(by | 0, 0, BASE_H - 1) * BASE_W + clamp(bx | 0, 0, BASE_W - 1)];
const BIOME_OF_LEVEL: Record<Biome, BId> = { grasslands: B.grass, forest: B.forest, infected: B.infected, river: B.woods, castle: B.castle, desert: B.desert, tundra: B.tundra, volcanic: B.volcanic };

// ---------------------------------------------------------------- palettes
const INK = hex('#2b1d12'), INK_SOFT = hex('#4a3524'), PENCIL = hex('#6b5a48');
const PARCH = hex('#dcc69a'), PARCH_D = hex('#c3a773'), PARCH_DD = hex('#9d7d4f');
const WASH: Record<number, [Rgb, number]> = {
  [B.grass]: [hex('#86ad4e'), 0.34], [B.woods]: [hex('#6f9c48'), 0.38], [B.forest]: [hex('#487f3a'), 0.46], [B.infected]: [hex('#8c5a9e'), 0.48],
  [B.desert]: [hex('#d8b25e'), 0.40], [B.tundra]: [hex('#a9c3da'), 0.52], [B.volcanic]: [hex('#6e3b36'), 0.48], [B.castle]: [hex('#9b968c'), 0.40],
};
const PAINT: Record<number, [Rgb, Rgb]> = {
  [B.grass]: [hex('#6f9f41'), hex('#8ab654')], [B.woods]: [hex('#5f8f3b'), hex('#7aa84a')], [B.forest]: [hex('#3e6e2f'), hex('#4f8238')], [B.infected]: [hex('#5c4a68'), hex('#73587f')],
  [B.desert]: [hex('#d3b36e'), hex('#e3c98a')], [B.tundra]: [hex('#d6e1ea'), hex('#eef3f7')], [B.volcanic]: [hex('#3a2c2c'), hex('#4c3a38')], [B.castle]: [hex('#8c8a84'), hex('#a39f97')],
};

// ---------------------------------------------------------------- parchment + table
function drawTable(ctx: any) {
  ctx.fillStyle = '#0e1117'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
  g.addColorStop(0, 'rgba(40,46,60,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // the title screen's faint star specks
  for (let i = 0; i < 90; i++) { const x = hash2(i, 1, 77) * W, y = hash2(i, 2, 77) * H; ctx.fillStyle = `rgba(120,200,140,${0.15 + 0.3 * hash2(i, 3, 77)})`; ctx.fillRect(x | 0, y | 0, 2, 2); }
}

function blit(host: Host, ctx: any, img: any) {
  // putImageData replaces pixels; go through a layer so alpha blends
  const layer = host.createCanvas(W, H);
  layer.getContext('2d').putImageData(img, 0, 0);
  ctx.drawImage(layer, 0, 0);
}

function drawParchment(host: Host, ctx: any, style: MapStyle) {
  const img = host.createImageData(new Uint8ClampedArray(W * H * 4), W, H);
  const d = img.data;
  const stains: [number, number, number, number][] = [[210, 560, 60, 0.35], [700, 90, 48, 0.3], [860, 580, 70, 0.4], [480, 40, 36, 0.25], [90, 140, 40, 0.22], [600, 610, 44, 0.3]];
  // shadow under the sheet so it lifts off the table
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bx = x / S, by = y / S;
    const i = (y * W + x) * 4;
    if (!insideParchment(bx, by)) {
      const sx = bx - 5, sy = by - 7;
      if (insideParchment(sx, sy)) { d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 140; }
      continue;
    }
    const n = fbm(bx, by, 160, 11, 3), f = fbm(bx * 0.35, by * 4, 24, 12, 2), sp = hash2(x, y, 13);
    let c = mix(PARCH, PARCH_D, clamp(n * 1.3 - 0.2, 0, 1));
    c = mix(c, PARCH_DD, clamp((f - 0.62) * 1.2, 0, 0.35));
    if (sp > 0.985) c = mix(c, PARCH_DD, 0.35);
    for (const [cx, cy, r, a] of stains) {
      const dd = Math.hypot(bx - cx, by - cy) / (r * (0.8 + 0.4 * fbm(bx, by, 30, 14)));
      if (dd < 1) c = mix(c, PARCH_DD, a * (1 - dd) ** 1.5 * (0.6 + 0.4 * fbm(bx, by, 9, 15)));
    }
    // worn, darkened edges and the curl shadow where the sheet meets each rod
    const et = by - (PY0 + tornTop(bx)), eb = (PY1 + tornBot(bx)) - by;
    const e = Math.min(et, eb);
    if (e < 26) c = mix(c, PARCH_DD, (1 - e / 26) ** 2 * 0.75);
    if (e < 3) c = mix(c, hex('#5a4026'), (1 - e / 3) * 0.7);
    const rl = bx - PX0, rr = PX1 - bx, rd = Math.min(rl, rr);
    if (rd < 34) c = mix(c, hex('#4a3420'), (1 - rd / 34) ** 2.2 * 0.6);
    if (rd > 34 && rd < 40) c = mix(c, hex('#f1e2bd'), 0.25 * (1 - Math.abs(rd - 37) / 3));
    if (style === 'M2') {
      // the atlas sits in an ink frame; outside it the margin stays plain
      const inF = bx > FRAME.x0 && bx < FRAME.x1 && by > FRAME.y0 && by < FRAME.y1;
      if (inF) c = mix(c, hex('#e8d7ad'), 0.3);
    }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  blit(host, ctx, img);
}

function drawRods(ctx: any) {
  const bands: [number, string][] = [[-13, '#3a2414'], [-10, '#5a3a22'], [-6, '#7d5131'], [-2, '#9a6a40'], [2, '#7d5131'], [7, '#5a3a22'], [10, '#3a2414']];
  for (const rx of [ROD_L, ROD_R]) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect((rx - 15) * S, 4 * S, 32 * S, (BASE_H - 6) * S);
    for (let i = 0; i < bands.length; i++) {
      const x0 = rx + bands[i][0], x1 = i + 1 < bands.length ? rx + bands[i + 1][0] : rx + 13;
      ctx.fillStyle = bands[i][1]; ctx.fillRect(x0 * S, 8 * S, (x1 - x0) * S, (BASE_H - 16) * S);
    }
    // grain
    for (let y = 8; y < BASE_H - 8; y += 1) { if (hash2(rx, y, 21) < 0.08) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect((rx - 9 + hash2(rx, y, 22) * 14) * S, y * S, (3 + hash2(rx, y, 23) * 6) * S, 1 * S); } }
    // turned end caps with a brass collar
    for (const [cy, dir] of [[8, -1], [BASE_H - 8, 1]] as [number, number][]) {
      ctx.fillStyle = '#2d1a0e'; ctx.beginPath(); ctx.ellipse(rx * S, (cy + dir * 2) * S, 15 * S, 5 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4526'; ctx.beginPath(); ctx.ellipse(rx * S, (cy + dir * 1) * S, 14 * S, 4 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9893c'; ctx.fillRect((rx - 13) * S, (cy + (dir < 0 ? 3 : -6)) * S, 26 * S, 3 * S);
      ctx.fillStyle = '#e6c06a'; ctx.fillRect((rx - 13) * S, (cy + (dir < 0 ? 3 : -6)) * S, 26 * S, 1 * S);
      ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.ellipse(rx * S, (cy + dir * 6) * S, 7 * S, 4 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a30'; ctx.beginPath(); ctx.ellipse(rx * S, (cy + dir * 5) * S, 5 * S, 2.5 * S, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- washes and paint
function drawWashes(host: Host, ctx: any, reg: Region, style: MapStyle, explored: (b: number) => boolean) {
  const img = host.createImageData(new Uint8ClampedArray(W * H * 4), W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bx = x / S, by = y / S;
    if (!insideParchment(bx, by)) continue;
    const i = (y * W + x) * 4;
    const b = bioAt(reg, bx, by), e = edgeAt(reg, bx, by);
    const et = by - (PY0 + tornTop(bx)), eb = (PY1 + tornBot(bx)) - by;
    const margin = Math.min(et, eb, bx - PX0, PX1 - bx);
    if (style === 'M2') {
      if (bx < FRAME.x0 || bx > FRAME.x1 || by < FRAME.y0 || by > FRAME.y1) continue;
      const [c0, c1] = PAINT[b];
      const n = fbm(bx, by, 36, 400 + b, 3);
      let c = mix(c0, c1, clamp(n * 1.4 - 0.2, 0, 1));
      // per-biome marks laid into the paint
      if (b === B.desert) { const r = Math.sin((by + 18 * fbm(bx, by, 60, 41)) / 11 + bx / 90); if (r > 0.86) c = mix(c, hex('#b48a46'), 0.5); }
      if (b === B.volcanic) { const v = Math.abs(fbm(bx, by, 85, 42, 2) - 0.5); if (v < 0.009) c = mix(hex('#ff7a2a'), hex('#ffd060'), fbm(bx, by, 10, 43)); else if (v < 0.024) c = mix(c, hex('#8a2a1a'), 0.6 * (1 - v / 0.024)); }
      if (b === B.infected) { const v = fbm(bx, by, 22, 44, 3); if (v > 0.64) c = mix(c, hex('#8b3fa6'), 0.55); }
      if (b === B.tundra) { const v = fbm(bx, by, 50, 45, 2); if (v > 0.6) c = mix(c, hex('#b8cde0'), 0.5); }
      if (b === B.grass || b === B.woods) { if (hash2(x >> 1, y >> 1, 46) < 0.012) c = mix(c, hex('#4e7a2c'), 0.7); }
      if (e < 2.2) c = mix(c, INK, 0.55); else if (e < 5) c = mix(c, hex('#000000'), 0.18 * (1 - e / 5));
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    } else {
      const [c, a0] = WASH[b];
      const ex = explored(b);
      const n = fbm(bx, by, 48, 500 + b, 2);
      let a = a0 * (0.75 + 0.5 * n);
      if (e < 7) a += 0.16 * (1 - e / 7);                    // pigment pools at the edge of each wash
      if (margin < 18) a *= margin / 18;                     // and fades out short of the sheet's edge
      if (!ex) { a *= 0.0; }
      if (a > 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = Math.round(clamp(a, 0, 1) * 255); }
    }
  }
  blit(host, ctx, img);
}

// Ink border between regions: dots along boundary cells give a wobbly pen line.
function drawBorders(ctx: any, reg: Region, style: MapStyle, explored: (b: number) => boolean) {
  for (let y = 1; y < BASE_H - 1; y++) for (let x = 1; x < BASE_W - 1; x++) {
    const b = reg.bio[y * BASE_W + x];
    const r = reg.bio[y * BASE_W + x + 1], dn = reg.bio[(y + 1) * BASE_W + x];
    if (b === r && b === dn) continue;
    if (!insideParchment(x, y)) continue;
    const et = y - (PY0 + tornTop(x)), eb = (PY1 + tornBot(x)) - y;
    if (Math.min(et, eb, x - PX0, PX1 - x) < 14) continue;
    if (style === 'M2' && (x < FRAME.x0 || x > FRAME.x1 || y < FRAME.y0 || y > FRAME.y1)) continue;
    const ex = explored(b) || explored(r) || explored(dn);
    const w = style === 'M2' ? 1.2 : 1.6;
    ctx.fillStyle = css(ex ? INK : PENCIL, ex ? 0.85 : 0.5);
    ctx.fillRect((x - w / 2) * S, (y - w / 2) * S, w * S, w * S);
    if (style !== 'M2' && ex && hash2(x, y, 61) < 0.18) { ctx.fillStyle = css(INK, 0.35); ctx.fillRect((x + 1.5) * S, (y + 1.5) * S, 1.6 * S, 1.6 * S); }
  }
}

// ---------------------------------------------------------------- pen helpers (base units, ctx pre-scaled by S)
type Pt = [number, number];
function wobbly(pts: Pt[], amp: number, seed: number, step = 3): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step));
    const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1);
    for (let k = 0; k < n; k++) {
      const t = k / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      const j = (valueNoise(px, py, 9, seed) - 0.5) * amp;
      out.push([px + nx * j, py + ny * j]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function stroke(ctx: any, pts: Pt[], width: number, color: string, close = false) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
function fill(ctx: any, pts: Pt[], color: string) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function hatch(ctx: any, pts: Pt[], spacing: number, color: string, width: number, angle = 0.8) {
  // parallel pen lines clipped to a polygon
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.clip();
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9; for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const dx = Math.cos(angle), dy = Math.sin(angle), L = Math.hypot(maxX - minX, maxY - minY) + 4;
  ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let s = -L; s < L; s += spacing) {
    const cx = (minX + maxX) / 2 - dy * s, cy = (minY + maxY) / 2 + dx * s;
    ctx.beginPath(); ctx.moveTo(cx - dx * L, cy - dy * L); ctx.lineTo(cx + dx * L, cy + dy * L); ctx.stroke();
  }
  ctx.restore();
}
function ring(ctx: any, cx: number, cy: number, r: number, amp: number, seed: number, n = 28): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = r * (1 + (valueNoise(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + 10, 1, seed) - 0.5) * amp); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}

// ---------------------------------------------------------------- symbols (base units)
type Pen = { ink: string; inkSoft: string; faint: boolean; painted: boolean };
function treeRound(ctx: any, x: number, y: number, s: number, pen: Pen, seed: number, leaf = '#5f9a3e', leafD = '#3f7030') {
  const trunkC = pen.faint ? pen.inkSoft : '#4a2e18';
  ctx.lineWidth = 1.1; ctx.strokeStyle = trunkC; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.55); ctx.stroke();
  const lobes: Pt[] = [[x - s * 0.42, y - s * 0.7], [x, y - s * 1.0], [x + s * 0.42, y - s * 0.7], [x + s * 0.1, y - s * 0.55], [x - s * 0.15, y - s * 0.5]];
  for (let i = 0; i < 3; i++) {
    const [lx, ly] = lobes[i]; const r = s * (0.36 + 0.06 * hash2(i, seed, 3));
    ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2);
    if (!pen.faint) { ctx.fillStyle = i === 1 ? leaf : leafD; ctx.fill(); }
    ctx.lineWidth = 0.9; ctx.strokeStyle = pen.faint ? pen.inkSoft : pen.ink; ctx.stroke();
  }
  if (!pen.faint) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 1, s * 0.5, s * 0.14, 0, 0, Math.PI * 2); ctx.fill(); }
}
function pine(ctx: any, x: number, y: number, h: number, pen: Pen, snow: boolean) {
  const w = h * 0.55;
  const pts: Pt[] = [[x, y - h], [x + w * 0.35, y - h * 0.62], [x + w * 0.2, y - h * 0.62], [x + w * 0.45, y - h * 0.32], [x + w * 0.28, y - h * 0.32], [x + w * 0.55, y], [x - w * 0.55, y], [x - w * 0.28, y - h * 0.32], [x - w * 0.45, y - h * 0.32], [x - w * 0.2, y - h * 0.62], [x - w * 0.35, y - h * 0.62]];
  if (!pen.faint) fill(ctx, pts, snow ? '#3f6a55' : '#2f6a35');
  if (!pen.faint && snow) { fill(ctx, [[x, y - h], [x + w * 0.35, y - h * 0.62], [x - w * 0.35, y - h * 0.62]], '#e9f1f6'); }
  stroke(ctx, pts, 0.9, pen.faint ? pen.inkSoft : pen.ink, true);
  ctx.lineWidth = 1.2; ctx.strokeStyle = pen.faint ? pen.inkSoft : '#3a2416'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 2.5); ctx.stroke();
}
function mountain(ctx: any, x: number, y: number, w: number, h: number, pen: Pen, seed: number, kind: 'rock' | 'snow' | 'lava' | 'basalt') {
  const px = x + (hash2(seed, 1, 9) - 0.5) * w * 0.25;
  const pts: Pt[] = [[x - w / 2, y], [x - w * 0.22, y - h * 0.55], [px, y - h], [x + w * 0.18, y - h * 0.5], [x + w * 0.32, y - h * 0.62], [x + w / 2, y]];
  const right: Pt[] = [[px, y - h], [x + w * 0.18, y - h * 0.5], [x + w * 0.32, y - h * 0.62], [x + w / 2, y], [px, y]];
  if (!pen.faint) {
    fill(ctx, pts, kind === 'lava' ? '#5a403a' : kind === 'basalt' ? '#8a7268' : kind === 'snow' ? '#c9d6de' : '#a99a86');
    fill(ctx, right, kind === 'lava' ? '#3a2826' : kind === 'basalt' ? '#4e3c38' : kind === 'snow' ? '#8fa6b6' : '#7a6a58');
  }
  hatch(ctx, right, 2.6, pen.faint ? 'rgba(90,75,60,0.35)' : 'rgba(40,28,18,0.45)', 0.7, 1.1);
  stroke(ctx, pts, 1.1, pen.faint ? pen.inkSoft : pen.ink);
  ctx.lineWidth = 0.9; ctx.strokeStyle = pen.faint ? pen.inkSoft : pen.ink; ctx.beginPath(); ctx.moveTo(px, y - h); ctx.lineTo(px + w * 0.06, y - h * 0.3); ctx.lineTo(px + w * 0.02, y); ctx.stroke();
  if (kind === 'snow') { const cap: Pt[] = [[px, y - h], [x + w * 0.18, y - h * 0.5], [x + w * 0.05, y - h * 0.58], [x - w * 0.08, y - h * 0.5], [x - w * 0.22, y - h * 0.55]]; if (!pen.faint) fill(ctx, cap, '#f4f8fb'); stroke(ctx, cap, 0.8, pen.faint ? pen.inkSoft : pen.ink, true); }
  if (kind === 'lava') {
    if (!pen.faint) {
      ctx.fillStyle = '#2a1a16'; ctx.beginPath(); ctx.ellipse(px, y - h + 1.5, w * 0.11, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      const trail = wobbly([[px - w * 0.02, y - h + 2], [px - w * 0.12, y - h * 0.5], [px - w * 0.2, y - 1]], 2.5, seed);
      stroke(ctx, trail, 2.2, '#ff6a24'); stroke(ctx, trail, 0.9, '#ffd36a');
      ctx.fillStyle = 'rgba(255,120,40,0.18)'; ctx.beginPath(); ctx.ellipse(px, y - h * 0.5, w * 0.35, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    } else { ctx.strokeStyle = pen.inkSoft; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(px, y - h + 1.5, w * 0.11, h * 0.07, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function dune(ctx: any, x: number, y: number, w: number, pen: Pen) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.0; ctx.strokeStyle = pen.faint ? pen.inkSoft : pen.ink;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.12, y - w * 0.17, x + w / 2, y - w * 0.03); ctx.stroke();
  ctx.lineWidth = 0.8; ctx.strokeStyle = pen.faint ? pen.inkSoft : 'rgba(120,88,40,0.55)';
  ctx.beginPath(); ctx.moveTo(x - w * 0.32, y + 3); ctx.quadraticCurveTo(x + w * 0.02, y - w * 0.05, x + w * 0.36, y + 2.5); ctx.stroke();
  if (!pen.faint) { ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,246,215,0.75)'; ctx.beginPath(); ctx.moveTo(x - w * 0.42, y - 1); ctx.quadraticCurveTo(x - w * 0.12, y - w * 0.15, x + w * 0.3, y - 1.5); ctx.stroke(); }
}
function blight(ctx: any, x: number, y: number, s: number, pen: Pen, seed: number) {
  const c = pen.faint ? pen.inkSoft : '#2e1a2e';
  ctx.lineWidth = 1.3; ctx.strokeStyle = c; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y - s * 0.5); ctx.lineTo(x - s * 0.3, y - s * 0.9); ctx.moveTo(x + 1, y - s * 0.5); ctx.lineTo(x + s * 0.35, y - s * 0.85); ctx.stroke();
  for (const [lx, ly, r] of [[x - s * 0.3, y - s * 0.95, s * 0.3], [x + s * 0.35, y - s * 0.9, s * 0.33], [x, y - s * 0.75, s * 0.26]] as [number, number, number][]) {
    const pts = ring(ctx, lx, ly, r, 0.45, seed + lx);
    if (!pen.faint) fill(ctx, pts, hash2(seed, lx | 0, 2) < 0.5 ? '#8e45a8' : '#6e3488');
    stroke(ctx, pts, 0.8, pen.faint ? pen.inkSoft : pen.ink, true);
  }
}
function crack(ctx: any, x: number, y: number, len: number, pen: Pen, seed: number) {
  const pts: Pt[] = [[x, y]];
  let cx = x, cy = y, a = hash2(seed, 1, 3) * Math.PI * 2;
  for (let i = 0; i < 6; i++) { a += (hash2(seed, i, 4) - 0.5) * 1.4; const l = len / 6; cx += Math.cos(a) * l; cy += Math.sin(a) * l * 0.5; pts.push([cx, cy]); }
  stroke(ctx, pts, 1.4, pen.faint ? pen.inkSoft : pen.ink);
  stroke(ctx, pts.slice(1, 4).map(([px, py]) => [px + 1, py + 1.2] as Pt), 0.8, pen.faint ? pen.inkSoft : 'rgba(255,240,200,0.6)');
  const [bx, by] = pts[3]; stroke(ctx, [[bx, by], [bx + len * 0.12, by - len * 0.12]], 1, pen.faint ? pen.inkSoft : pen.ink);
}
function tuft(ctx: any, x: number, y: number, pen: Pen) {
  ctx.lineWidth = 0.9; ctx.strokeStyle = pen.faint ? pen.inkSoft : 'rgba(45,80,30,0.9)'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x - 3, y - 3.5); ctx.moveTo(x, y); ctx.lineTo(x + 0.5, y - 4.5); ctx.moveTo(x + 2, y); ctx.lineTo(x + 3.5, y - 3); ctx.stroke();
}
function lake(ctx: any, x: number, y: number, rx: number, ry: number, pen: Pen, seed: number, ice: boolean) {
  const pts: Pt[] = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const j = 1 + (valueNoise(Math.cos(a) * 4 + 20, Math.sin(a) * 4 + 20, 1.3, seed) - 0.5) * 0.45; pts.push([x + Math.cos(a) * rx * j, y + Math.sin(a) * ry * j]); }
  if (!pen.faint) { fill(ctx, pts, ice ? '#a9c8e4' : '#5f93c7'); ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.clip(); for (let k = 0; k < 7; k++) { const yy = y - ry + (k + 0.5) * ry * 2 / 7; stroke(ctx, wobbly([[x - rx, yy], [x + rx, yy]], 1.5, seed + k), 0.7, ice ? 'rgba(255,255,255,0.55)' : 'rgba(210,235,255,0.5)'); } ctx.restore(); }
  stroke(ctx, pts, 1.1, pen.faint ? pen.inkSoft : pen.ink, true);
  if (!pen.faint) { const in2 = pts.map(([px, py]) => [x + (px - x) * 1.08, y + (py - y) * 1.1] as Pt); stroke(ctx, in2, 0.6, 'rgba(40,30,20,0.35)', true); }
}
function river(ctx: any, pts: Pt[], width: number, pen: Pen, seed: number) {
  const w = wobbly(pts, 4, seed, 4);
  if (!pen.faint) { stroke(ctx, w, width + 1.6, 'rgba(40,30,20,0.35)'); stroke(ctx, w, width, '#5f93c7'); stroke(ctx, w, width * 0.45, 'rgba(190,225,250,0.55)'); }
  // pen banks
  const off = (sgn: number): Pt[] => w.map(([x, y], i) => { const [x2, y2] = w[Math.min(i + 1, w.length - 1)], [x1, y1] = w[Math.max(i - 1, 0)]; const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1; return [x - dy / l * sgn * width / 2, y + dx / l * sgn * width / 2]; });
  stroke(ctx, off(1), 0.8, pen.faint ? pen.inkSoft : pen.ink); stroke(ctx, off(-1), 0.8, pen.faint ? pen.inkSoft : pen.ink);
}

// landmarks: small pixel-style buildings drawn with 1-base-px blocks
function px(ctx: any, x: number, y: number, w: number, h: number, c: string) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function castleKeep(ctx: any, x: number, y: number, pen: Pen) {
  // x,y = bottom centre; 44 wide, 34 tall
  const st = pen.faint ? 'rgba(0,0,0,0)' : '#9a9aa6', sd = pen.faint ? 'rgba(0,0,0,0)' : '#6a6a78', sl = pen.faint ? 'rgba(0,0,0,0)' : '#bdbdc8', ink = pen.faint ? pen.inkSoft : pen.ink;
  px(ctx, x - 22, y - 18, 44, 18, st); px(ctx, x - 22, y - 18, 44, 2, sl);
  for (let i = -22; i < 22; i += 5) px(ctx, x + i, y - 21, 3, 3, st);
  px(ctx, x - 24, y - 30, 10, 30, st); px(ctx, x + 14, y - 30, 10, 30, st);
  for (let i = -24; i < -14; i += 4) px(ctx, x + i, y - 33, 2, 3, st); for (let i = 14; i < 24; i += 4) px(ctx, x + i, y - 33, 2, 3, st);
  px(ctx, x - 6, y - 34, 12, 34, sd); for (let i = -6; i < 6; i += 4) px(ctx, x + i, y - 37, 2, 3, sd);
  px(ctx, x - 20, y - 24, 2, 5, pen.faint ? pen.inkSoft : '#2b2b36'); px(ctx, x + 18, y - 24, 2, 5, pen.faint ? pen.inkSoft : '#2b2b36'); px(ctx, x - 2, y - 28, 3, 6, pen.faint ? pen.inkSoft : '#2b2b36');
  px(ctx, x - 4, y - 9, 8, 9, pen.faint ? pen.inkSoft : '#2b1d12'); ctx.fillStyle = pen.faint ? pen.inkSoft : '#2b1d12'; ctx.beginPath(); ctx.arc(x, y - 9, 4, Math.PI, 0); ctx.fill();
  px(ctx, x - 1, y - 48, 1, 12, ink); if (!pen.faint) { ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.moveTo(x, y - 48); ctx.lineTo(x + 9, y - 45); ctx.lineTo(x, y - 42); ctx.fill(); }
  ctx.lineWidth = 0.9; ctx.strokeStyle = ink;
  ctx.strokeRect(x - 22, y - 18, 44, 18); ctx.strokeRect(x - 24, y - 30, 10, 30); ctx.strokeRect(x + 14, y - 30, 10, 30); ctx.strokeRect(x - 6, y - 34, 12, 34);
  if (!pen.faint) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 1.5, 28, 4, 0, 0, Math.PI * 2); ctx.fill(); }
}
function temple(ctx: any, x: number, y: number, pen: Pen) {
  const st = pen.faint ? 'rgba(0,0,0,0)' : '#c9a86a', sd = pen.faint ? 'rgba(0,0,0,0)' : '#8f7444', ink = pen.faint ? pen.inkSoft : pen.ink;
  px(ctx, x - 20, y - 3, 40, 3, sd); px(ctx, x - 24, y, 48, 2, st);
  for (const cx of [-15, -5, 5, 15]) { const h = cx === 5 ? 12 : 20; px(ctx, x + cx - 2, y - 3 - h, 4, h, st); px(ctx, x + cx + 1, y - 3 - h, 1, h, sd); ctx.strokeStyle = ink; ctx.lineWidth = 0.8; ctx.strokeRect(x + cx - 2, y - 3 - h, 4, h); }
  px(ctx, x - 18, y - 26, 26, 4, st); ctx.strokeStyle = ink; ctx.strokeRect(x - 18, y - 26, 26, 4);
  ctx.strokeRect(x - 20, y - 3, 40, 3);
  if (!pen.faint) { px(ctx, x + 10, y - 8, 5, 5, st); ctx.strokeRect(x + 10, y - 8, 5, 5); px(ctx, x + 18, y - 5, 7, 4, st); ctx.strokeRect(x + 18, y - 5, 7, 4); }
}
function cave(ctx: any, x: number, y: number, w: number, h: number, pen: Pen, icy: boolean) {
  const pts: Pt[] = [[x - w / 2, y], [x - w * 0.45, y - h * 0.6], [x - w * 0.2, y - h], [x + w * 0.2, y - h], [x + w * 0.45, y - h * 0.6], [x + w / 2, y]];
  if (!pen.faint) fill(ctx, pts, icy ? '#9fb9cf' : '#6a5c58');
  stroke(ctx, pts, 1.1, pen.faint ? pen.inkSoft : pen.ink, true);
  const mouth: Pt[] = [[x - w * 0.3, y], [x - w * 0.25, y - h * 0.5], [x, y - h * 0.68], [x + w * 0.25, y - h * 0.5], [x + w * 0.3, y]];
  fill(ctx, mouth, pen.faint ? 'rgba(90,75,60,0.35)' : '#17120f');
  if (!pen.faint && icy) for (let i = 0; i < 4; i++) { const ix = x - w * 0.2 + i * w * 0.13; ctx.fillStyle = '#dbe9f3'; ctx.beginPath(); ctx.moveTo(ix - 1.5, y - h * 0.6); ctx.lineTo(ix + 1.5, y - h * 0.6); ctx.lineTo(ix, y - h * 0.35 + i % 2 * 3); ctx.fill(); }
}
function dragonMaw(ctx: any, x: number, y: number, pen: Pen) {
  // a skull-faced cave mouth
  const ink = pen.faint ? pen.inkSoft : pen.ink;
  const sk = ring(ctx, x, y - 14, 16, 0.18, 9, 36);
  if (!pen.faint) fill(ctx, sk, '#d9cfb8');
  stroke(ctx, sk, 1.1, ink, true);
  for (const ex of [-6, 6]) { ctx.fillStyle = pen.faint ? 'rgba(90,75,60,0.5)' : '#1a1410'; ctx.beginPath(); ctx.ellipse(x + ex, y - 17, 4.5, 5, 0, 0, Math.PI * 2); ctx.fill(); if (!pen.faint) { ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.arc(x + ex + 1, y - 16, 1.5, 0, Math.PI * 2); ctx.fill(); } }
  ctx.fillStyle = pen.faint ? 'rgba(90,75,60,0.5)' : '#1a1410'; ctx.beginPath(); ctx.moveTo(x - 2, y - 10); ctx.lineTo(x + 2, y - 10); ctx.lineTo(x, y - 6); ctx.fill();
  // jaw: the cave entrance with teeth
  const jaw: Pt[] = [[x - 14, y - 4], [x - 16, y + 8], [x + 16, y + 8], [x + 14, y - 4]];
  fill(ctx, jaw, pen.faint ? 'rgba(90,75,60,0.35)' : '#17120f'); stroke(ctx, jaw, 1, ink, true);
  for (let i = -12; i <= 12; i += 4) { ctx.fillStyle = pen.faint ? pen.inkSoft : '#e8e0cc'; ctx.beginPath(); ctx.moveTo(x + i - 1.5, y - 4); ctx.lineTo(x + i + 1.5, y - 4); ctx.lineTo(x + i, y + 1); ctx.fill(); }
}

// ---------------------------------------------------------------- node markers
function biomeGlyph(ctx: any, cx: number, cy: number, b: Biome, c: string) {
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  switch (b) {
    case 'grasslands': ctx.beginPath(); ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx - 5, cy - 3); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy - 6); ctx.moveTo(cx + 4, cy + 4); ctx.lineTo(cx + 5, cy - 3); ctx.stroke(); break;
    case 'forest': for (const [ox, h] of [[-3, 9], [3, 7]] as [number, number][]) { ctx.beginPath(); ctx.moveTo(cx + ox, cy - h / 2 - 1); ctx.lineTo(cx + ox + 3.5, cy + 4); ctx.lineTo(cx + ox - 3.5, cy + 4); ctx.closePath(); ctx.fill(); } break;
    case 'river': for (const oy of [-3, 1, 5]) { ctx.beginPath(); ctx.moveTo(cx - 6, cy + oy); ctx.quadraticCurveTo(cx - 3, cy + oy - 3, cx, cy + oy); ctx.quadraticCurveTo(cx + 3, cy + oy + 3, cx + 6, cy + oy); ctx.stroke(); } break;
    case 'infected': ctx.beginPath(); ctx.arc(cx, cy - 1, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 7); ctx.stroke(); ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 1.2, 0, Math.PI * 2); ctx.arc(cx + 2, cy, 1.2, 0, Math.PI * 2); ctx.fill(); break;
    case 'castle': ctx.fillRect(cx - 6, cy - 2, 12, 8); for (const ox of [-6, -2, 2]) ctx.fillRect(cx + ox, cy - 5, 2, 3); ctx.fillRect(cx + 4, cy - 5, 2, 3); break;
    case 'desert': ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 7, cy + 5); ctx.lineTo(cx - 7, cy + 5); ctx.closePath(); ctx.fill(); break;
    case 'tundra': for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.lineTo(cx - Math.cos(a) * 6, cy - Math.sin(a) * 6); ctx.stroke(); } break;
    case 'volcanic': ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.quadraticCurveTo(cx + 7, cy, cx + 3, cy + 6); ctx.quadraticCurveTo(cx, cy + 3, cx - 3, cy + 6); ctx.quadraticCurveTo(cx - 7, cy, cx, cy - 7); ctx.fill(); break;
  }
}
function lockGlyph(ctx: any, cx: number, cy: number, c: string) {
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1.6;
  ctx.fillRect(cx - 5, cy - 1, 10, 7); ctx.beginPath(); ctx.arc(cx, cy - 2, 3.5, Math.PI, 0); ctx.stroke();
}
const SEAL_BY_BIOME: Record<Biome, string> = { grasslands: '#b23a2e', forest: '#b23a2e', infected: '#b23a2e', river: '#b23a2e', castle: '#b23a2e', desert: '#b23a2e', tundra: '#b23a2e', volcanic: '#b23a2e' };
function waxSeal(ctx: any, cx: number, cy: number, r: number, level: LevelDef, unlocked: boolean, seed: number) {
  const outer = ring(ctx, cx, cy, r, 0.14, seed, 30);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 1.5, cy + 2.5, r + 1, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  const base = unlocked ? SEAL_BY_BIOME[level.biome] : '#6f6a64', dark = unlocked ? '#7d241c' : '#4b4743', light = unlocked ? '#d4584a' : '#8f8a83';
  fill(ctx, outer, base);
  // drips of wax
  for (let i = 0; i < 3; i++) { const a = hash2(seed, i, 5) * Math.PI * 2, rr = r * (1.02 + 0.1 * hash2(seed, i, 6)); ctx.fillStyle = base; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * 0.16, 0, Math.PI * 2); ctx.fill(); }
  const inner = ring(ctx, cx, cy, r * 0.74, 0.06, seed + 1, 30);
  ctx.save(); ctx.beginPath(); ctx.moveTo(inner[0][0], inner[0][1]); for (const p of inner) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.clip();
  ctx.fillStyle = dark; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  stroke(ctx, inner, 0.9, dark, true);
  ctx.strokeStyle = light; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, Math.PI * 0.1, Math.PI * 0.6); ctx.stroke();
  // embossed device: dark imprint offset by the highlight
  if (unlocked) { biomeGlyph(ctx, cx + 0.6, cy + 0.6, level.biome, light); biomeGlyph(ctx, cx, cy, level.biome, dark); }
  else { lockGlyph(ctx, cx + 0.6, cy + 0.6, light); lockGlyph(ctx, cx, cy, dark); }
}
const SHIELD_FILL: Record<Biome, string> = { grasslands: '#4f8a3a', forest: '#2f6a35', infected: '#7a3f8c', river: '#3a76b0', castle: '#6c6c7c', desert: '#c9a24e', tundra: '#7fa9c9', volcanic: '#b0402e' };
function shield(ctx: any, cx: number, cy: number, r: number, level: LevelDef, unlocked: boolean) {
  const w = r * 1.7, h = r * 2.05, top = cy - h * 0.46;
  const path = () => { ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx + w / 2, top); ctx.lineTo(cx + w / 2, top + h * 0.5); ctx.quadraticCurveTo(cx + w / 2, top + h * 0.85, cx, top + h); ctx.quadraticCurveTo(cx - w / 2, top + h * 0.85, cx - w / 2, top + h * 0.5); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 3); path(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = unlocked ? SHIELD_FILL[level.biome] : '#5e5a55'; ctx.fill();
  ctx.save(); path(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(cx - w / 2, top, w / 2, h); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - w / 2, top + h * 0.62, w, h); ctx.restore();
  path(); ctx.lineWidth = 2; ctx.strokeStyle = unlocked ? '#e6c06a' : '#8b8378'; ctx.stroke();
  path(); ctx.lineWidth = 0.9; ctx.strokeStyle = '#2b1d12'; ctx.stroke();
  // rivets
  ctx.fillStyle = unlocked ? '#f3dc9a' : '#a39b8e'; for (const [ox, oy] of [[-w * 0.36, top + 4], [w * 0.36, top + 4]]) { ctx.beginPath(); ctx.arc(cx + ox, oy, 1.1, 0, Math.PI * 2); ctx.fill(); }
  if (unlocked) { biomeGlyph(ctx, cx + 0.7, cy + 0.7, level.biome, 'rgba(0,0,0,0.45)'); biomeGlyph(ctx, cx, cy, level.biome, '#f6ecd2'); }
  else { lockGlyph(ctx, cx + 0.7, cy + 0.7, 'rgba(0,0,0,0.45)'); lockGlyph(ctx, cx, cy, '#c9c1b2'); }
}

// ---------------------------------------------------------------- text + chrome
function label(ctx: any, x: number, y: number, text: string, size: number, color: string, halo: string, weight = 600, family = 'Cinzel', align = 'center') {
  ctx.font = `${weight} ${size}px ${family}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.3; ctx.strokeStyle = halo; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function ribbon(ctx: any, cx: number, cy: number, w: number, h: number, ink: string) {
  const body = (x0: number, x1: number, y0: number, y1: number) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath(); };
  // tails
  for (const sgn of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(cx + sgn * (w / 2 - 8), cy - h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 + 14), cy - h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 + 8), cy + 1); ctx.lineTo(cx + sgn * (w / 2 + 14), cy + h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2 - 8), cy + h / 2 + 4); ctx.closePath();
    ctx.fillStyle = '#9a2f26'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + sgn * (w / 2), cy + h / 2); ctx.lineTo(cx + sgn * (w / 2 - 8), cy + h / 2 + 4); ctx.lineTo(cx + sgn * (w / 2), cy + h / 2 + 4); ctx.closePath(); ctx.fillStyle = '#5e1812'; ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; body(cx - w / 2 + 2, cx + w / 2 + 2, cy - h / 2 + 3, cy + h / 2 + 3); ctx.fill();
  ctx.fillStyle = '#c23a2f'; body(cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; body(cx - w / 2, cx + w / 2, cy - h / 2, cy - h / 2 + 4); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; body(cx - w / 2, cx + w / 2, cy + h / 2 - 4, cy + h / 2); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = ink; body(cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2); ctx.stroke();
}
function tag(ctx: any, x: number, y: number, w: number, h: number, ink: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 1.5, y + 2, w, h);
  ctx.fillStyle = '#e8d6ac'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,90,50,0.25)'; ctx.fillRect(x, y + h - 3, w, 3);
  ctx.lineWidth = 1; ctx.strokeStyle = ink; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 0.6; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  // pin
  ctx.fillStyle = '#8c2a22'; ctx.beginPath(); ctx.arc(x + w / 2, y + 1, 2.2, 0, Math.PI * 2); ctx.fill();
}
function compass(ctx: any, cx: number, cy: number, r: number, ink: string, faint: string) {
  ctx.lineWidth = 0.8; ctx.strokeStyle = faint; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
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
  star(4, r * 0.92, r * 0.2, -Math.PI / 2, '#e9dcb8', '#2b1d12');
  ctx.strokeStyle = ink; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(cx, cy, r * 0.05, 0, Math.PI * 2); ctx.stroke();
  label(ctx, cx, cy - r - 7, 'N', 9, ink, 'rgba(0,0,0,0)', 700);
}

// ---------------------------------------------------------------- main
export type RenderOpts = { host: Host; style: MapStyle; unlockedIds: Set<number>; medals: Record<number, string[]>; ranger?: any; playerLevel?: number };
const POS: Record<number, [number, number]> = { 14: [846, 424] };
const at = (l: LevelDef) => POS[l.id] ?? [l.x, l.y];
export function renderMap(o: RenderOpts) {
  const { host, style } = o;
  const canvas = host.createCanvas(W, H), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const reg = buildRegions();
  const unlockedBiomes = new Set<number>();
  for (const l of LEVELS) if (o.unlockedIds.has(l.id)) unlockedBiomes.add(BIOME_OF_LEVEL[l.biome]);
  const explored = (b: number) => style !== 'M3' || unlockedBiomes.has(b);
  const penFor = (b: number): Pen => ({ ink: css(INK), inkSoft: css(PENCIL, 0.7), faint: !explored(b), painted: style === 'M2' });

  drawTable(ctx);
  drawParchment(host, ctx, style);
  drawWashes(host, ctx, reg, style, explored);
  drawBorders(ctx, reg, style, explored);

  ctx.save(); ctx.scale(S, S);
  if (style === 'M2') { ctx.lineWidth = 1.4; ctx.strokeStyle = css(INK); ctx.strokeRect(FRAME.x0, FRAME.y0, FRAME.x1 - FRAME.x0, FRAME.y1 - FRAME.y0); ctx.lineWidth = 0.6; ctx.strokeRect(FRAME.x0 - 3, FRAME.y0 - 3, FRAME.x1 - FRAME.x0 + 6, FRAME.y1 - FRAME.y0 + 6); }

  // exclusion zones: nodes with their labels, the chrome
  const keepOut: [number, number, number, number][] = LEVELS.map(l => { const [x, y] = at(l); return [x - 36, y - 30, x + 36, y + 44]; });
  keepOut.push([290, 4, 670, 44], [PX1 - 150, 10, PX1, 44], [PX0, 10, PX0 + 150, 50], [PX0 + 20, 540, PX0 + 110, 630]);
  const free = (x: number, y: number, m = 0) => keepOut.every(([x0, y0, x1, y1]) => x < x0 - m || x > x1 + m || y < y0 - m || y > y1 + m);
  const onSheet = (x: number, y: number, m: number) => {
    if (!insideParchment(x, y)) return false;
    const et = y - (PY0 + tornTop(x)), eb = (PY1 + tornBot(x)) - y;
    if (Math.min(et, eb, x - PX0, PX1 - x) < m) return false;
    if (style === 'M2' && (x < FRAME.x0 + 6 || x > FRAME.x1 - 6 || y < FRAME.y0 + 6 || y > FRAME.y1 - 6)) return false;
    return true;
  };

  // rivers: from the castle hills down through the woods and meadow
  const riverPen = penFor(B.woods);
  const rivers: Pt[][] = [
    [[150, 118], [172, 150], [205, 185], [228, 232], [214, 292], [238, 372], [268, 460], [290, 540], [280, 600]],
    [[52, 232], [100, 252], [150, 278], [214, 292]],
    [[238, 372], [196, 410], [160, 470], [130, 540], [112, 600]],
  ];
  // gather symbols so they draw back to front
  type Sym = { y: number; draw: () => void };
  const syms: Sym[] = [];
  const scatter = (b: number, spacing: number, keep: number, margin: number, draw: (x: number, y: number, k: number) => void) => {
    for (let gy = 0; gy < BASE_H; gy += spacing) for (let gx = 0; gx < BASE_W; gx += spacing) {
      const x = gx + (hash2(gx, gy, 71 + b) - 0.5) * spacing * 0.9, y = gy + (hash2(gx, gy, 72 + b) - 0.5) * spacing * 0.9;
      if (bioAt(reg, x, y) !== b || edgeAt(reg, x, y) < 9) continue;
      if (!onSheet(x, y, margin) || !free(x, y, 2)) continue;
      if (hash2(gx, gy, 73 + b) > keep) continue;
      const k = hash2(gx, gy, 74 + b);
      syms.push({ y, draw: () => draw(x, y, k) });
    }
  };
  const pens = { grass: penFor(B.grass), woods: penFor(B.woods), forest: penFor(B.forest), infected: penFor(B.infected), desert: penFor(B.desert), tundra: penFor(B.tundra), volcanic: penFor(B.volcanic), castle: penFor(B.castle) };
  scatter(B.forest, 15, 0.95, 16, (x, y, k) => treeRound(ctx, x, y, 7 + k * 4, pens.forest, (x * 7 + y) | 0, '#5b9a3c', '#3d7a2f'));
  scatter(B.woods, 19, 0.8, 16, (x, y, k) => (k < 0.35 ? pine(ctx, x, y, 11 + k * 6, pens.woods, false) : treeRound(ctx, x, y, 6 + k * 4, pens.woods, (x * 3 + y) | 0, '#78a848', '#4e8a36')));
  scatter(B.grass, 26, 0.75, 16, (x, y, k) => (k < 0.16 ? treeRound(ctx, x, y, 6 + k * 6, pens.grass, (x + y * 5) | 0, '#86b44e', '#5a9238') : tuft(ctx, x, y, pens.grass)));
  scatter(B.infected, 18, 0.92, 16, (x, y, k) => blight(ctx, x, y, 8 + k * 5, pens.infected, (x * 5 + y) | 0));
  scatter(B.desert, 34, 0.85, 16, (x, y, k) => dune(ctx, x, y, 22 + k * 16, pens.desert));
  scatter(B.tundra, 34, 0.8, 16, (x, y, k) => (k < 0.55 ? mountain(ctx, x, y, 24 + k * 20, 18 + k * 12, pens.tundra, (x + y) | 0, 'snow') : pine(ctx, x, y, 9 + k * 6, pens.tundra, true)));
  scatter(B.volcanic, 44, 0.8, 16, (x, y, k) => mountain(ctx, x, y, 28 + k * 26, 24 + k * 18, pens.volcanic, (x * 2 + y) | 0, k < 0.3 ? 'lava' : 'basalt'));
  scatter(B.castle, 22, 0.6, 16, (x, y, k) => (k < 0.5 ? pine(ctx, x, y, 9 + k * 5, pens.castle, false) : tuft(ctx, x, y, pens.castle)));

  // landmarks
  for (const [cx, cy, l] of [[392, 214, 34], [474, 132, 30], [372, 150, 28], [455, 212, 26]] as [number, number, number][]) syms.push({ y: cy, draw: () => crack(ctx, cx, cy, l, pens.desert, cx) });
  syms.push({ y: 70, draw: () => castleKeep(ctx, 205, 70, pens.castle) });
  syms.push({ y: 292, draw: () => temple(ctx, 625, 292, pens.desert) });
  syms.push({ y: 520, draw: () => lake(ctx, 330, 520, 42, 22, pens.tundra, 3, true) });
  syms.push({ y: 588, draw: () => cave(ctx, 560, 588, 40, 26, pens.tundra, true) });
  syms.push({ y: 270, draw: () => mountain(ctx, 812, 270, 70, 54, pens.volcanic, 99, 'lava') });
  syms.push({ y: 512, draw: () => dragonMaw(ctx, 880, 512, pens.volcanic) });

  // rivers go under the trees
  for (let i = 0; i < rivers.length; i++) river(ctx, rivers[i], i === 0 ? 6 : 4, riverPen, 11 + i);
  syms.sort((a, b) => a.y - b.y);
  for (const s of syms) s.draw();

  // route
  const byId = new Map(LEVELS.map(l => [l.id, l]));
  for (const l of LEVELS) for (const t of l.connectsTo) {
    const target = byId.get(t)!; const open = o.unlockedIds.has(target.id);
    const pts = wobbly([at(l), at(target)], 6, 90 + l.id, 6);
    // skip the stretch inside each marker
    const total = pts.length, a = Math.round(total * 0.14), b = Math.round(total * 0.86);
    const seg = pts.slice(a, b);
    ctx.setLineDash([4.5, 4]); ctx.lineDashOffset = 0;
    if (open) { stroke(ctx, seg, 3.2, 'rgba(236,222,180,0.7)'); stroke(ctx, seg, 2.2, css(INK, 0.9)); }
    else stroke(ctx, seg, 1.6, css(style === 'M3' ? PENCIL : INK_SOFT, 0.45));
    ctx.setLineDash([]);
  }

  // nodes
  const R = style === 'M2' ? 15 : 16;
  for (const l of LEVELS) {
    const unlocked = o.unlockedIds.has(l.id);
    const [lx, ly] = at(l);
    if (style === 'M2') shield(ctx, lx, ly, R, l, unlocked); else waxSeal(ctx, lx, ly, R, l, unlocked, l.id * 17);
    const haloC = 'rgba(232,214,172,0.9)';
    label(ctx, lx, ly + R + 10, l.name, 10.5, css(INK, unlocked ? 1 : 0.72), haloC, 700);
    // medals
    const earned = o.medals[l.id] ?? [];
    const diffs = ['easy', 'medium', 'hard', 'oneHP'] as const;
    const sx = lx - 13.5, my = ly + R + 21;
    diffs.forEach((d, i) => {
      const x = sx + i * 9; const got = earned.includes(d);
      ctx.beginPath(); ctx.arc(x, my, 3, 0, Math.PI * 2);
      if (got) { ctx.fillStyle = MEDAL_COLORS[d].hex; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = css(INK); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 1, my - 1, 1, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = 'rgba(232,214,172,0.6)'; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = css(unlocked ? INK : PENCIL, unlocked ? 0.7 : 0.5); ctx.stroke(); }
    });
  }

  // the ranger stands at the furthest unlocked level
  if (o.ranger) {
    let here = LEVELS[0]; for (const l of LEVELS) if (o.unlockedIds.has(l.id) && l.id > here.id) here = l;
    const [hx, hy] = at(here);
    const sz = 32, rx = hx + 18, ry = hy - 28;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(rx + sz / 2, ry + sz - 2, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(o.ranger, rx, ry, sz, sz);
  }

  // chrome: title ribbon, medal tag, rank tag, compass, flavour
  ribbon(ctx, BASE_W / 2, 24, 300, 26, css(INK));
  label(ctx, BASE_W / 2, 25, 'Choose Your Mission', 15, '#f6e7bf', 'rgba(60,10,8,0.9)', 700, 'Cinzel Decorative');
  const totalMedals = Object.values(o.medals).reduce((n, a) => n + a.length, 0);
  tag(ctx, PX1 - 142, 12, 122, 26, css(INK));
  ctx.fillStyle = '#e0b43c'; ctx.beginPath(); ctx.arc(PX1 - 128, 25, 5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = css(INK); ctx.stroke(); ctx.fillStyle = '#b23a2e'; ctx.fillRect(PX1 - 131, 15, 6, 6);
  label(ctx, PX1 - 118, 25.5, `Medals  ${totalMedals} / ${LEVELS.length * 4}`, 10.5, css(INK), 'rgba(0,0,0,0)', 700, 'Cinzel', 'left');
  tag(ctx, PX0 + 16, 12, 128, 36, css(INK));
  label(ctx, PX0 + 24, 23, `Ranger  ·  Rank ${o.playerLevel ?? 1}`, 10.5, css(INK), 'rgba(0,0,0,0)', 700, 'Cinzel', 'left');
  ctx.fillStyle = 'rgba(43,29,18,0.25)'; ctx.fillRect(PX0 + 24, 33, 112, 6); ctx.fillStyle = '#5f9a3e'; ctx.fillRect(PX0 + 24, 33, 112 * 0.42, 6); ctx.lineWidth = 0.8; ctx.strokeStyle = css(INK); ctx.strokeRect(PX0 + 24, 33, 112, 6);
  compass(ctx, PX0 + 62, 584, 26, css(INK), css(INK, 0.6));
  if (style !== 'M2') label(ctx, 820, 600, 'Here be Dragons', 10, css(explored(B.volcanic) ? INK : PENCIL, 0.8), 'rgba(0,0,0,0)', 400);
  if (style === 'M3') { label(ctx, 560, 60, 'Unexplored', 11, css(PENCIL, 0.8), 'rgba(0,0,0,0)', 400); label(ctx, 520, 620, 'Unexplored', 11, css(PENCIL, 0.8), 'rgba(0,0,0,0)', 400); label(ctx, 800, 420, 'Unexplored', 11, css(PENCIL, 0.8), 'rgba(0,0,0,0)', 400); }
  ctx.restore();
  drawRods(ctx);
  return canvas;
}
