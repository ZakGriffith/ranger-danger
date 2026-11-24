// Player-profile panel studies for the scroll level select. Three treatments
// of the modal that opens from the Ranger tag, drawn in base units (about
// 300 x 340) on a ctx already scaled.
//   R1 Ledger on the Board  R2 Sealed Charter  R3 Heraldic Plaque
import { INK, drawShieldCanvas, shieldLayout } from '../../src/assets/art/levelMap';
import { text, parchmentFill, closeSeal, plank, bracket, nail, rod } from './panelStudies';

type Ctx = any;
export type ProfileId = 'R1' | 'R2' | 'R3';
export const PROFILES: Record<ProfileId, { title: string; note: string }> = {
  R1: { title: 'Ledger on the Board', note: 'The mission panel\'s plank board and brass plate, with the rank on a brass medallion, an iron XP trough filled with gold, and the unlock ledger inked on the nailed sheet.' },
  R2: { title: 'Sealed Charter', note: 'A parchment charter under the map\'s red ribbon, the rank pressed into a wax seal, XP as an inked rule, unlocks as ledger lines with gold medals and wax dots.' },
  R3: { title: 'Heraldic Plaque', note: 'A dark stone plaque with gold trim and the ranger\'s crest shield carrying the rank, a chain-bound XP bar, and unlocks as wooden tabs.' },
};
export type Unlock = { label: string; lvl: number };
export type ProfileState = { rank: number; xp: number; need: number; total: number; earned: Unlock[]; upcoming: Unlock[] };

function lock(ctx: Ctx, x: number, y: number, c: string) {
  ctx.fillStyle = c; ctx.fillRect(x - 4, y - 1, 8, 6);
  ctx.lineWidth = 1.4; ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y - 1.5, 2.8, Math.PI, 0); ctx.stroke();
}
function goldCheck(ctx: Ctx, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#e6c06a'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 0.8, y + 2.4); ctx.lineTo(x + 3.2, y - 2.6); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
}
function inkRule(ctx: Ctx, x0: number, x1: number, y: number, a = 0.5) { ctx.strokeStyle = `rgba(43,29,18,${a})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
function ironButton(ctx: Ctx, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = '#5a595e'; ctx.fill(); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 1; ctx.stroke();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#e8e0cc'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
}
/** Ledger: a header in red ink, then one line per unlock. Returns the y after the block. */
function ledger(ctx: Ctx, x: number, w: number, y: number, st: ProfileState, inkColor: string, rowGap = 22) {
  const section = (label: string, rows: Unlock[], earned: boolean, empty: string) => {
    text(ctx, label, x, y, 8.5, '#8c2a22', { align: 'left' }); inkRule(ctx, x + ctx.measureText(label).width + 8, x + w, y, 0.45); y += 16;
    if (!rows.length) { text(ctx, empty, x + w / 2, y + 2, 9, 'rgba(43,29,18,0.6)', { weight: 400 }); y += rowGap; return; }
    for (const r of rows) {
      if (earned) goldCheck(ctx, x + 7, y); else lock(ctx, x + 7, y, '#8c2a22');
      text(ctx, r.label, x + 20, y + 0.5, 10.5, inkColor, { align: 'left', weight: 400 });
      text(ctx, earned ? 'Unlocked' : `Rank ${r.lvl}`, x + w, y + 0.5, 9, earned ? '#8a6a1e' : '#8c2a22', { align: 'right' });
      inkRule(ctx, x, x + w, y + 10, 0.2); y += rowGap;
    }
  };
  section('UNLOCKED', st.earned, true, 'Nothing yet. Rank up to earn rewards.');
  y += 4;
  section('UPCOMING', st.upcoming, false, 'All current rewards collected.');
  return y;
}

// --- R1 ledger on the board ----------------------------------------------
export function drawR1(ctx: Ctx, cx: number, cy: number, st: ProfileState) {
  const w = 304, h = 344, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 5, y + 7, w, h);
  for (let i = 0; i < 6; i++) plank(ctx, x, y + i * (h / 6), w, h / 6, i);
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#2a1608'; ctx.strokeRect(x, y, w, h);
  bracket(ctx, x + 1, y + 1, 1, 1); bracket(ctx, x + w - 1, y + 1, -1, 1); bracket(ctx, x + 1, y + h - 1, 1, -1); bracket(ctx, x + w - 1, y + h - 1, -1, -1);
  ctx.fillStyle = '#3f3e42'; ctx.fillRect(cx - 90, y + 14, 180, 30); ctx.strokeStyle = '#1e1d20'; ctx.strokeRect(cx - 90, y + 14, 180, 30);
  ctx.fillStyle = '#c9a24e'; ctx.fillRect(cx - 86, y + 18, 172, 22); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(cx - 86, y + 18, 172, 22);
  text(ctx, 'RANGER', cx, y + 29.5, 15, '#2b1d12', { family: 'Cinzel Decorative' });
  for (const [nx, ny] of [[cx - 82, y + 22], [cx + 82, y + 22], [cx - 82, y + 36], [cx + 82, y + 36]]) nail(ctx, nx, ny);
  ironButton(ctx, x + w - 24, y + 28);
  // brass medallion with the rank
  const my = y + 84;
  ctx.beginPath(); ctx.arc(cx + 2, my + 3, 27, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, my, 27, 0, Math.PI * 2); ctx.fillStyle = '#c9a24e'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, my, 22, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(43,29,18,0.6)'; ctx.stroke();
  const rg = ctx.createRadialGradient(cx - 8, my - 10, 2, cx, my, 27); rg.addColorStop(0, 'rgba(255,245,210,0.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, my, 27, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'RANK', cx, my - 11, 6.5, '#5a3e14');
  text(ctx, String(st.rank), cx, my + 5, 26, '#2b1d12', { family: 'Cinzel Decorative' });
  // iron trough with gold fill
  const bx = x + 30, by = y + 124, bw = w - 60, bh = 16;
  ctx.fillStyle = '#3f3e42'; ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6); ctx.strokeStyle = '#1e1d20'; ctx.lineWidth = 1; ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
  ctx.fillStyle = '#1e1a16'; ctx.fillRect(bx, by, bw, bh);
  const pct = Math.min(1, st.xp / st.need);
  if (pct > 0) { ctx.fillStyle = '#c9a24e'; ctx.fillRect(bx, by, bw * pct, bh); ctx.fillStyle = 'rgba(255,245,210,0.35)'; ctx.fillRect(bx, by, bw * pct, 3); }
  for (const [nx, ny] of [[bx - 3, by - 3], [bx + bw + 3, by - 3], [bx - 3, by + bh + 3], [bx + bw + 3, by + bh + 3]]) nail(ctx, nx, ny);
  text(ctx, `${st.xp} / ${st.need} XP`, cx, by + bh / 2 + 0.5, 9.5, '#f6e7bf', { halo: 'rgba(30,20,10,0.9)' });
  text(ctx, `${st.total.toLocaleString()} XP in all`, cx, by + bh + 12, 7.5, '#d9c6a0', { weight: 400 });
  // ledger sheet
  const sx = x + 26, sy = y + 166, sw = w - 52, sh = h - 192;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx + 2, sy + 3, sw, sh);
  parchmentFill(ctx, sx, sy, sw, sh, 7); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.strokeRect(sx, sy, sw, sh);
  for (const [nx, ny] of [[sx + 6, sy + 6], [sx + sw - 6, sy + 6], [sx + 6, sy + sh - 6], [sx + sw - 6, sy + sh - 6]]) nail(ctx, nx, ny);
  ledger(ctx, sx + 16, sw - 32, sy + 20, st, INK);
}

// --- R2 sealed charter ---------------------------------------------------
function ribbon(ctx: Ctx, cx: number, cy: number, w: number, h: number, label: string) {
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (w / 2 - 6), cy - h / 2 + 4); ctx.lineTo(cx + s * (w / 2 + 14), cy - h / 2 + 4); ctx.lineTo(cx + s * (w / 2 + 8), cy + 1); ctx.lineTo(cx + s * (w / 2 + 14), cy + h / 2 + 4); ctx.lineTo(cx + s * (w / 2 - 6), cy + h / 2 + 4); ctx.closePath(); ctx.fillStyle = '#8f2a22'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - w / 2 + 2, cy - h / 2 + 3, w, h);
  ctx.fillStyle = '#c23a2f'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx - w / 2, cy - h / 2, w, 4);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  text(ctx, label, cx, cy + 1, 14, '#f6e7bf', { family: 'Cinzel Decorative', halo: 'rgba(60,10,8,0.9)' });
}
function waxSeal(ctx: Ctx, x: number, y: number, r: number, rank: number) {
  ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = r + ((i * 7) % 3) - 1; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = '#b23a2e'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#6d1f18'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI * 2); ctx.lineWidth = 1.2; ctx.strokeStyle = '#7d241c'; ctx.stroke();
  const rg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r); rg.addColorStop(0, 'rgba(255,200,190,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'RANK', x, y - r * 0.4, r * 0.22, '#f3dcc8');
  text(ctx, String(rank), x, y + r * 0.14, r * 0.9, '#f3dcc8', { family: 'Cinzel Decorative', halo: 'rgba(90,20,15,0.8)' });
}
export function drawR2(ctx: Ctx, cx: number, cy: number, st: ProfileState) {
  const w = 300, h = 336, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 5, y + 7, w, h);
  parchmentFill(ctx, x, y, w, h, 11);
  ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h); ctx.lineWidth = 0.6; ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  ribbon(ctx, cx, y + 6, 170, 26, 'RANGER');
  closeSeal(ctx, x + w - 22, y + 22);
  waxSeal(ctx, cx, y + 76, 32, st.rank);
  // inked XP rule
  const bx = x + 34, by = y + 128, bw = w - 68, bh = 12;
  ctx.fillStyle = 'rgba(43,29,18,0.08)'; ctx.fillRect(bx, by, bw, bh);
  const pct = Math.min(1, st.xp / st.need);
  if (pct > 0) { ctx.fillStyle = '#c9a24e'; ctx.fillRect(bx, by, bw * pct, bh); }
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.strokeRect(bx, by, bw, bh);
  for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(bx + bw * i / 10, by + bh - 3); ctx.lineTo(bx + bw * i / 10, by + bh); ctx.lineWidth = 0.6; ctx.stroke(); }
  text(ctx, `${st.xp} / ${st.need} XP`, cx, by + bh + 11, 9, INK);
  text(ctx, `${st.total.toLocaleString()} XP in all`, cx, by + bh + 23, 7.5, 'rgba(43,29,18,0.65)', { weight: 400 });
  inkRule(ctx, x + 40, x + w - 40, y + 176, 0.55);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(cx - 4, y + 176); ctx.lineTo(cx, y + 173); ctx.lineTo(cx + 4, y + 176); ctx.lineTo(cx, y + 179); ctx.fill();
  ledger(ctx, x + 32, w - 64, y + 194, st, INK);
}

// --- R3 heraldic plaque --------------------------------------------------
function stone(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#3b3a40'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 60; i++) { const px = x + ((i * 7919) % 997) / 997 * w, py = y + ((i * 104729) % 991) / 991 * h; ctx.fillRect(px, py, 6 + (i % 4) * 3, 2); }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 40; i++) { const px = x + ((i * 6007) % 983) / 983 * w, py = y + ((i * 9973) % 977) / 977 * h; ctx.fillRect(px, py, 4 + (i % 3) * 3, 1.5); }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
function goldTrim(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.lineWidth = 2; ctx.strokeStyle = '#c9a24e'; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 0.8; ctx.strokeStyle = '#e6c06a'; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { ctx.beginPath(); ctx.moveTo(px, py - 7); ctx.lineTo(px + 7, py); ctx.lineTo(px, py + 7); ctx.lineTo(px - 7, py); ctx.closePath(); ctx.fillStyle = '#c9a24e'; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = INK; ctx.stroke(); }
}
function chainBar(ctx: Ctx, x: number, y: number, w: number, h: number, pct: number) {
  ctx.fillStyle = '#1b1a1e'; ctx.fillRect(x, y, w, h); ctx.lineWidth = 1; ctx.strokeStyle = '#6c6b72'; ctx.strokeRect(x, y, w, h);
  if (pct > 0) { ctx.fillStyle = '#c9a24e'; ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2); ctx.fillStyle = 'rgba(255,245,210,0.35)'; ctx.fillRect(x + 1, y + 1, (w - 2) * pct, 3); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const lx = x + (s < 0 ? -6 - i * 7 : w + 6 + i * 7); ctx.beginPath(); ctx.ellipse(lx, y + h / 2, 4, 2.6, 0, 0, Math.PI * 2); ctx.lineWidth = 1.6; ctx.strokeStyle = i % 2 ? '#8c8b90' : '#b5b4ba'; ctx.stroke(); }
}
function woodTab(ctx: Ctx, x: number, y: number, w: number, h: number, sel: boolean) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, y + 2, w, h);
  ctx.fillStyle = sel ? '#b07a3e' : '#9a6a3a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,230,180,0.2)'; ctx.fillRect(x, y, w, 3);
  ctx.lineWidth = sel ? 1.4 : 0.9; ctx.strokeStyle = sel ? '#e6c06a' : '#3a2010'; ctx.strokeRect(x, y, w, h);
  nail(ctx, x + 8, y + h / 2);
}
export function drawR3(ctx: Ctx, cx: number, cy: number, st: ProfileState) {
  const w = 300, h = 366, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 5, y + 7, w, h);
  stone(ctx, x, y, w, h); goldTrim(ctx, x + 7, y + 7, w - 14, h - 14);
  text(ctx, 'RANGER', cx, y + 28, 15, '#e6c06a', { family: 'Cinzel Decorative', halo: 'rgba(0,0,0,0.6)' });
  ironButton(ctx, x + w - 26, y + 26);
  // crest shield carrying the rank
  const sf = 3, L = shieldLayout('biome'); const sh = drawShieldCanvas('castle', true, sf, 'biome');
  const scale = 1.5, shw = L.w * scale, shh = L.h * scale, shx = cx - L.cx * scale, shy = y + 42;
  ctx.drawImage(sh, shx, shy, shw, shh);
  ctx.fillStyle = 'rgba(20,16,12,0.6)'; ctx.beginPath(); ctx.arc(cx, shy + L.cy * scale + 6, 11, 0, Math.PI * 2); ctx.fill();
  text(ctx, String(st.rank), cx, shy + L.cy * scale + 7, 17, '#f6e7bf', { family: 'Cinzel Decorative', halo: 'rgba(0,0,0,0.8)' });
  text(ctx, 'RANK', cx, shy + shh + 9, 7, '#c9a24e');
  // chain-bound xp bar
  const bx = x + 50, by = shy + shh + 24, bw = w - 100, bh = 14;
  chainBar(ctx, bx, by, bw, bh, Math.min(1, st.xp / st.need));
  text(ctx, `${st.xp} / ${st.need} XP`, cx, by + bh / 2 + 0.5, 9, '#f6e7bf', { halo: 'rgba(0,0,0,0.85)' });
  text(ctx, `${st.total.toLocaleString()} XP in all`, cx, by + bh + 12, 7.5, '#b5b4ba', { weight: 400 });
  // tabs
  let ty = by + bh + 34;
  const section = (label: string, rows: Unlock[], earned: boolean, empty: string) => {
    text(ctx, label, x + 30, ty, 8, '#e6c06a', { align: 'left' }); ctx.strokeStyle = 'rgba(201,162,78,0.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 30 + ctx.measureText(label).width + 8, ty); ctx.lineTo(x + w - 30, ty); ctx.stroke(); ty += 14;
    if (!rows.length) { text(ctx, empty, cx, ty + 4, 8.5, '#b5b4ba', { weight: 400 }); ty += 26; return; }
    for (const r of rows) {
      woodTab(ctx, x + 30, ty - 4, w - 60, 20, earned);
      if (earned) goldCheck(ctx, x + 50, ty + 6); else lock(ctx, x + 50, ty + 6, '#f0dfb8');
      text(ctx, r.label, x + 62, ty + 6.5, 10, '#f0dfb8', { align: 'left', halo: 'rgba(40,20,8,0.8)' });
      text(ctx, earned ? 'Unlocked' : `Rank ${r.lvl}`, x + w - 38, ty + 6.5, 8.5, earned ? '#fff0c8' : '#f0dfb8', { align: 'right', halo: 'rgba(40,20,8,0.8)' });
      ty += 26;
    }
  };
  section('UNLOCKED', st.earned, true, 'Nothing yet. Rank up to earn rewards.');
  ty += 4;
  section('UPCOMING', st.upcoming, false, 'All current rewards collected.');
}
export const DRAW: Record<ProfileId, (ctx: Ctx, cx: number, cy: number, st: ProfileState) => void> = { R1: drawR1, R2: drawR2, R3: drawR3 };
