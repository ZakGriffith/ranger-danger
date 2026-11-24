// Difficulty-panel studies for the scroll level select. Three treatments of
// the pop-up that opens when a level shield is clicked, each drawn in base
// units (the panel is about 300 x 300) on a ctx already scaled.
//   P1 Rope-bound Parchment  P2 Iron and Timber board  P3 Heraldic Scroll
import { INK, PARCHMENT_LIGHT, drawShieldCanvas, shieldLayout } from '../../src/assets/art/levelMap';
import { MEDAL_COLORS, type Biome } from '../../src/levels';

type Ctx = any;
export type PanelId = 'P1' | 'P2' | 'P3';
export const PANELS: Record<PanelId, { title: string; note: string }> = {
  P1: { title: 'Rope-bound Parchment', note: 'A parchment card lashed in twisted rope with knotted corners. Difficulties are inked rows with a wax seal marking the pick; START is a red ribbon.' },
  P2: { title: 'Iron and Timber', note: 'A plank board with riveted iron corners, the level sheet nailed to it. Difficulties are wooden tabs with a brass nail; START is a brass plate.' },
  P3: { title: 'Heraldic Scroll', note: 'A small scroll on rods, matching the map, with the level\'s own shield at the head. Difficulties are pennants in the biome colour; START is a crowned gold button.' },
};

const DIFFS = [['Easy', 'easy'], ['Medium', 'medium'], ['Hard', 'hard'], ['1 HP', 'oneHP'], ['Endless', 'endless']] as const;
export type PanelState = { name: string; biome: Biome; biomeLabel: string; earned: string[]; selected: string };

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, opts: { weight?: number; family?: string; align?: string; halo?: string } = {}) {
  ctx.font = `${opts.weight ?? 700} ${size}px ${opts.family ?? 'Cinzel'}`; ctx.textAlign = opts.align ?? 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (opts.halo) { ctx.lineWidth = size * 0.28; ctx.strokeStyle = opts.halo; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function parchmentFill(ctx: Ctx, x: number, y: number, w: number, h: number, seed = 1) {
  ctx.fillStyle = PARCHMENT_LIGHT; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,90,50,0.08)';
  for (let i = 0; i < 40; i++) { const px = x + ((i * 7919 + seed * 13) % 1000) / 1000 * w, py = y + ((i * 104729 + seed * 7) % 1000) / 1000 * h; ctx.beginPath(); ctx.ellipse(px, py, 6 + (i % 5) * 4, 3 + (i % 3) * 2, i, 0, Math.PI * 2); ctx.fill(); }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,245,220,0.25)'); g.addColorStop(1, 'rgba(90,60,30,0.18)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
function medalCheck(ctx: Ctx, x: number, y: number, diff: string, earned: boolean) {
  if (!earned) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(43,29,18,0.45)'; ctx.lineWidth = 0.9; ctx.stroke(); return; }
  const c = (MEDAL_COLORS as any)[diff]?.hex ?? '#e0b43c';
  ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 0.8, y + 2.4); ctx.lineTo(x + 3.2, y - 2.6); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
}
function ribbonButton(ctx: Ctx, cx: number, cy: number, w: number, h: number, label: string, lit: boolean) {
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (w / 2 - 6), cy - h / 2 + 3); ctx.lineTo(cx + s * (w / 2 + 10), cy - h / 2 + 3); ctx.lineTo(cx + s * (w / 2 + 5), cy); ctx.lineTo(cx + s * (w / 2 + 10), cy + h / 2 + 3); ctx.lineTo(cx + s * (w / 2 - 6), cy + h / 2 + 3); ctx.closePath(); ctx.fillStyle = lit ? '#8f2a22' : '#5b4a44'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - w / 2 + 2, cy - h / 2 + 3, w, h);
  ctx.fillStyle = lit ? '#c23a2f' : '#7a6a62'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx - w / 2, cy - h / 2, w, 4);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  text(ctx, label, cx, cy + 0.5, 13, lit ? '#f6e7bf' : '#cfc3b0', { family: 'Cinzel Decorative', halo: lit ? 'rgba(60,10,8,0.9)' : 'rgba(30,20,15,0.7)' });
}
function closeSeal(ctx: Ctx, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = '#b23a2e'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = '#6d1f18'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.strokeStyle = '#7d241c'; ctx.stroke();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#f3dcc8'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
}

// --- rope ---------------------------------------------------------------
function ropeLine(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, thick = 5) {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
  ctx.lineCap = 'round';
  ctx.lineWidth = thick + 1.6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.lineWidth = thick; ctx.strokeStyle = '#b89457'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  // twist: alternating dark strands across the rope
  const step = thick * 0.9;
  ctx.lineWidth = 1.2; ctx.lineCap = 'butt';
  for (let d = 2; d < len - 2; d += step) {
    const cx = x0 + ux * d, cy = y0 + uy * d;
    ctx.strokeStyle = 'rgba(70,45,20,0.75)'; ctx.beginPath(); ctx.moveTo(cx - nx * thick / 2 + ux * 1.2, cy - ny * thick / 2 + uy * 1.2); ctx.lineTo(cx + nx * thick / 2 - ux * 1.2, cy + ny * thick / 2 - uy * 1.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,180,0.45)'; ctx.beginPath(); ctx.moveTo(cx - nx * thick / 2 + ux * 2.4, cy - ny * thick / 2 + uy * 2.4); ctx.lineTo(cx + nx * thick / 2 - ux * 0.2, cy + ny * thick / 2 - uy * 0.2); ctx.stroke();
  }
}
function knot(ctx: Ctx, x: number, y: number) {
  for (const [ox, oy, r] of [[0, 0, 6], [-4, 3, 4], [4, -3, 4]] as number[][]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2); ctx.fillStyle = '#b89457'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(70,45,20,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3.5, 0.5, 3.5); ctx.stroke();
}

export function drawP1(ctx: Ctx, cx: number, cy: number, st: PanelState) {
  const w = 300, h = 292, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 5, y + 7, w, h);
  parchmentFill(ctx, x, y, w, h, 3);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  // rope lashing, corners knotted
  ropeLine(ctx, x + 10, y + 7, x + w - 10, y + 7); ropeLine(ctx, x + 10, y + h - 7, x + w - 10, y + h - 7);
  ropeLine(ctx, x + 7, y + 10, x + 7, y + h - 10); ropeLine(ctx, x + w - 7, y + 10, x + w - 7, y + h - 10);
  for (const [kx, ky] of [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]]) knot(ctx, kx, ky);
  // head
  text(ctx, st.name, cx, y + 34, 19, INK, { family: 'Cinzel Decorative' });
  text(ctx, st.biomeLabel.toUpperCase(), cx, y + 56, 8.5, '#8c2a22', { weight: 700 });
  ctx.strokeStyle = 'rgba(43,29,18,0.55)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x + 40, y + 70); ctx.lineTo(x + w - 40, y + 70); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(cx - 4, y + 70); ctx.lineTo(cx, y + 67); ctx.lineTo(cx + 4, y + 70); ctx.lineTo(cx, y + 73); ctx.fill();
  closeSeal(ctx, x + w - 26, y + 26);
  // rows
  DIFFS.forEach(([label, key], i) => {
    const ry = y + 90 + i * 30, sel = st.selected === key;
    if (sel) { ctx.fillStyle = 'rgba(178,58,46,0.16)'; ctx.fillRect(x + 28, ry - 11, w - 56, 24); ctx.strokeStyle = '#8c2a22'; ctx.lineWidth = 1; ctx.strokeRect(x + 28, ry - 11, w - 56, 24); }
    else { ctx.strokeStyle = 'rgba(43,29,18,0.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(x + 28, ry - 11, w - 56, 24); }
    if (sel) { ctx.beginPath(); ctx.arc(x + 42, ry + 1, 6.5, 0, Math.PI * 2); ctx.fillStyle = '#b23a2e'; ctx.fill(); ctx.strokeStyle = '#6d1f18'; ctx.lineWidth = 0.9; ctx.stroke(); ctx.beginPath(); ctx.arc(x + 42, ry + 1, 4, 0, Math.PI * 2); ctx.stroke(); }
    text(ctx, label, x + 58, ry + 1, 12, sel ? '#8c2a22' : INK, { align: 'left' });
    medalCheck(ctx, x + w - 44, ry + 1, key, st.earned.includes(key));
  });
  ribbonButton(ctx, cx, y + h - 32, 150, 26, 'START', !!st.selected);
}

// --- iron and timber -----------------------------------------------------
function plank(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  ctx.fillStyle = seed % 2 ? '#7a4f2d' : '#6e4628'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(40,20,8,0.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { const yy = y + 3 + ((i * 37 + seed * 11) % (h - 6)); ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.bezierCurveTo(x + w * 0.3, yy + 2, x + w * 0.6, yy - 2, x + w - 4, yy + 1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,220,160,0.12)'; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + h - 2, w, 2);
}
function bracket(ctx: Ctx, x: number, y: number, sx: number, sy: number) {
  ctx.fillStyle = '#4b4a4e'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 34, y); ctx.lineTo(x + sx * 34, y + sy * 9); ctx.lineTo(x + sx * 9, y + sy * 9); ctx.lineTo(x + sx * 9, y + sy * 34); ctx.lineTo(x, y + sy * 34); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = '#1e1d20'; ctx.stroke();
  ctx.fillStyle = '#8c8b90'; ctx.fillRect(Math.min(x, x + sx * 34), Math.min(y, y + sy * 2), 34, 1.5);
  for (const [rx, ry] of [[x + sx * 5, y + sy * 5], [x + sx * 26, y + sy * 5], [x + sx * 5, y + sy * 26]]) { ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#9a9aa2'; ctx.fill(); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 0.7; ctx.stroke(); }
}
function nail(ctx: Ctx, x: number, y: number) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fillStyle = '#c9a24e'; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 1.2, y - 1.2, 1, 1); }
export function drawP2(ctx: Ctx, cx: number, cy: number, st: PanelState) {
  const w = 304, h = 300, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 5, y + 7, w, h);
  for (let i = 0; i < 5; i++) plank(ctx, x, y + i * (h / 5), w, h / 5, i);
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#2a1608'; ctx.strokeRect(x, y, w, h);
  bracket(ctx, x + 1, y + 1, 1, 1); bracket(ctx, x + w - 1, y + 1, -1, 1); bracket(ctx, x + 1, y + h - 1, 1, -1); bracket(ctx, x + w - 1, y + h - 1, -1, -1);
  // title plate
  ctx.fillStyle = '#3f3e42'; ctx.fillRect(cx - 100, y + 14, 200, 30); ctx.strokeStyle = '#1e1d20'; ctx.strokeRect(cx - 100, y + 14, 200, 30);
  ctx.fillStyle = '#c9a24e'; ctx.fillRect(cx - 96, y + 18, 192, 22); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(cx - 96, y + 18, 192, 22);
  text(ctx, st.name, cx, y + 29.5, 15, '#2b1d12', { family: 'Cinzel Decorative' });
  for (const [nx, ny] of [[cx - 92, y + 22], [cx + 92, y + 22], [cx - 92, y + 36], [cx + 92, y + 36]]) nail(ctx, nx, ny);
  // close: iron button
  ctx.beginPath(); ctx.arc(x + w - 24, y + 28, 8, 0, Math.PI * 2); ctx.fillStyle = '#5a595e'; ctx.fill(); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 1; ctx.stroke();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#e8e0cc'; ctx.beginPath(); ctx.moveTo(x + w - 27, y + 25); ctx.lineTo(x + w - 21, y + 31); ctx.moveTo(x + w - 21, y + 25); ctx.lineTo(x + w - 27, y + 31); ctx.stroke();
  // the sheet nailed on
  const sx = x + 28, sy = y + 56, sw = w - 56, sh = 170;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx + 2, sy + 3, sw, sh);
  parchmentFill(ctx, sx, sy, sw, sh, 5); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.strokeRect(sx, sy, sw, sh);
  for (const [nx, ny] of [[sx + 6, sy + 6], [sx + sw - 6, sy + 6], [sx + 6, sy + sh - 6], [sx + sw - 6, sy + sh - 6]]) nail(ctx, nx, ny);
  text(ctx, st.biomeLabel.toUpperCase(), cx, sy + 13, 8.5, '#8c2a22');
  DIFFS.forEach(([label, key], i) => {
    const ry = sy + 36 + i * 27, sel = st.selected === key;
    // wooden tab
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx + 14, ry - 9, sw - 28, 22);
    ctx.fillStyle = sel ? '#b07a3e' : '#9a6a3a'; ctx.fillRect(sx + 12, ry - 11, sw - 28, 22);
    ctx.fillStyle = 'rgba(255,230,180,0.2)'; ctx.fillRect(sx + 12, ry - 11, sw - 28, 3);
    ctx.lineWidth = sel ? 1.4 : 0.9; ctx.strokeStyle = sel ? '#e6c06a' : '#3a2010'; ctx.strokeRect(sx + 12, ry - 11, sw - 28, 22);
    nail(ctx, sx + 20, ry); text(ctx, label, sx + 30, ry + 0.5, 12, sel ? '#fff0c8' : '#f0dfb8', { align: 'left', halo: 'rgba(40,20,8,0.8)' });
    medalCheck(ctx, sx + sw - 28, ry, key, st.earned.includes(key));
  });
  // brass start plate
  const by = y + h - 36;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(cx - 72, by - 12, 148, 28);
  ctx.fillStyle = st.selected ? '#c9a24e' : '#7a6f58'; ctx.fillRect(cx - 74, by - 14, 148, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - 74, by - 14, 148, 4);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(cx - 74, by - 14, 148, 28);
  for (const [nx, ny] of [[cx - 68, by - 8], [cx + 68, by - 8], [cx - 68, by + 8], [cx + 68, by + 8]]) nail(ctx, nx, ny);
  text(ctx, 'START', cx, by + 0.5, 14, st.selected ? '#2b1d12' : '#3a3328', { family: 'Cinzel Decorative' });
}

// --- heraldic scroll ------------------------------------------------------
function rod(ctx: Ctx, cx: number, cy: number, w: number) {
  const bands: [number, string][] = [[-7, '#3a2414'], [-5, '#5a3a22'], [-2, '#7d5131'], [1, '#9a6a40'], [3, '#7d5131'], [5, '#5a3a22'], [7, '#3a2414']];
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(cx - w / 2 - 10, cy - 6, w + 20, 16);
  for (let i = 0; i < bands.length - 1; i++) { ctx.fillStyle = bands[i][1]; ctx.fillRect(cx - w / 2 - 8, cy + bands[i][0], w + 16, bands[i + 1][0] - bands[i][0]); }
  for (const s of [-1, 1]) { const ex = cx + s * (w / 2 + 8); ctx.fillStyle = '#2d1a0e'; ctx.beginPath(); ctx.ellipse(ex + s * 2, cy, 5, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#b9893c'; ctx.fillRect(ex - 3 + (s < 0 ? 0 : 0), cy - 7, 3, 14); ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.ellipse(ex + s * 7, cy, 4, 5, 0, 0, Math.PI * 2); ctx.fill(); }
}
function pennant(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, sel: boolean) {
  ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w - 10, y - h / 2); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 10, y + h / 2); ctx.lineTo(x, y + h / 2); ctx.closePath();
  ctx.save(); ctx.translate(2, 2.5); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w - 10, y - h / 2); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 10, y + h / 2); ctx.lineTo(x, y + h / 2); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = sel ? 1.8 : 0.9; ctx.strokeStyle = sel ? '#e6c06a' : INK; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y - h / 2, w - 10, 3);
}
const PENNANT_FILL: Record<Biome, string> = { grasslands: '#4f8a3a', forest: '#2f6a35', infected: '#7a3f8c', river: '#3a76b0', castle: '#6c6c7c', desert: '#c9a24e', tundra: '#7fa9c9', volcanic: '#b0402e' };
export function drawP3(ctx: Ctx, cx: number, cy: number, st: PanelState) {
  const w = 280, h = 276, x = cx - w / 2, y = cy - h / 2 + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 4, y + 6, w, h);
  parchmentFill(ctx, x, y, w, h, 9);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(60,35,10,0.25)'); g.addColorStop(0.08, 'rgba(0,0,0,0)'); g.addColorStop(0.92, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,35,10,0.25)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.strokeRect(x + 10, y + 22, w - 20, h - 44); ctx.lineWidth = 0.6; ctx.strokeRect(x + 13, y + 25, w - 26, h - 50);
  rod(ctx, cx, y + 2, w); rod(ctx, cx, y + h - 2, w);
  // the level's shield at the head, over the top rod
  const sf = 3, L = shieldLayout('biome'); const sh = drawShieldCanvas(st.biome, true, sf, 'biome');
  ctx.drawImage(sh, cx - L.cx, y - 10 - L.cy + L.cy * 0.5, L.w, L.h);
  text(ctx, st.name, cx, y + 52, 18, INK, { family: 'Cinzel Decorative' });
  text(ctx, st.biomeLabel.toUpperCase(), cx, y + 72, 8.5, '#8c2a22');
  closeSeal(ctx, x + w - 28, y + 40);
  DIFFS.forEach(([label, key], i) => {
    const ry = y + 98 + i * 28, sel = st.selected === key;
    pennant(ctx, x + 34, ry, w - 68, 22, sel ? '#e6c06a' : PENNANT_FILL[st.biome], sel);
    text(ctx, label, x + 46, ry + 0.5, 12, sel ? INK : '#f6ecd2', { align: 'left', halo: sel ? 'rgba(255,240,200,0.6)' : 'rgba(20,12,8,0.75)' });
    medalCheck(ctx, x + w - 54, ry, key, st.earned.includes(key));
  });
  // crowned gold start
  const by = y + h - 40;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(cx - 68, by - 10, 140, 26);
  ctx.fillStyle = st.selected ? '#e6c06a' : '#9a8d6e'; ctx.fillRect(cx - 70, by - 12, 140, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cx - 70, by - 12, 140, 4);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(cx - 70, by - 12, 140, 26);
  ctx.beginPath(); ctx.moveTo(cx - 9, by - 12); ctx.lineTo(cx - 9, by - 20); ctx.lineTo(cx - 4.5, by - 16); ctx.lineTo(cx, by - 22); ctx.lineTo(cx + 4.5, by - 16); ctx.lineTo(cx + 9, by - 20); ctx.lineTo(cx + 9, by - 12); ctx.closePath(); ctx.fillStyle = '#e6c06a'; ctx.fill(); ctx.stroke();
  text(ctx, 'START', cx, by + 1.5, 14, st.selected ? '#2b1d12' : '#3a3328', { family: 'Cinzel Decorative' });
}
export const DRAW: Record<PanelId, (ctx: Ctx, cx: number, cy: number, st: PanelState) => void> = { P1: drawP1, P2: drawP2, P3: drawP3 };
