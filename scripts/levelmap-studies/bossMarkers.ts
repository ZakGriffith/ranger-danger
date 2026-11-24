// Boss-level marker studies for the scroll map. Four treatments drawn on the
// shipped shield, each shown beside a regular marker and in place on the map.
//   B1 Crowned: a larger shield with a gold crown and double rim (Super Mario
//      World's bigger castle nodes, Candy Crush's ornate boss frames)
//   B2 Skull banner: a dark pennant hangs behind the shield with a skull badge
//      (Slay the Spire's skull boss node, Kingdom Rush's skull flags)
//   B3 Laurel: a gold wreath rings the shield (Shovel Knight / many mobile maps)
//   B4 Ember crown: the Crowned shield with a pulsing red glow for the final boss only
import { LEVELS, type LevelDef } from '../../src/levels';
import { MAP_FRAME, MAP_CROP, SHIELD_W, SHIELD_H, SHIELD_CENTER, drawShieldCanvas, INK, PARCHMENT_LIGHT } from '../../src/assets/art/levelMap';

export type Host = { createCanvas: (w: number, h: number) => any; loadImage: (p: string) => Promise<any> };
type Ctx = any;

function shieldPath(ctx: Ctx, cx: number, cy: number, grow = 0) {
  const w = SHIELD_W + grow * 2, h = SHIELD_H + grow * 2, top = cy - SHIELD_H * 0.46 - grow;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx + w / 2, top); ctx.lineTo(cx + w / 2, top + h * 0.5);
  ctx.quadraticCurveTo(cx + w / 2, top + h * 0.85, cx, top + h); ctx.quadraticCurveTo(cx - w / 2, top + h * 0.85, cx - w / 2, top + h * 0.5); ctx.closePath();
}
function crown(ctx: Ctx, cx: number, cy: number, w: number) {
  // cy = crown base line
  const h = w * 0.55;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx - w / 2, cy - h * 0.6); ctx.lineTo(cx - w * 0.25, cy - h * 0.3); ctx.lineTo(cx, cy - h); ctx.lineTo(cx + w * 0.25, cy - h * 0.3); ctx.lineTo(cx + w / 2, cy - h * 0.6); ctx.lineTo(cx + w / 2, cy); ctx.closePath();
  ctx.fillStyle = '#e6c06a'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#b23a2e'; for (const ox of [-w * 0.25, 0, w * 0.25]) { ctx.beginPath(); ctx.arc(cx + ox, cy - h * 0.15, w * 0.07, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff2c4'; ctx.fillRect(cx - w / 2 + 1, cy - h * 0.6 + 1, 1.5, 2);
}
function skull(ctx: Ctx, cx: number, cy: number, r: number, c = '#f1e9d6') {
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - r * 0.6, cy + r * 0.3, r * 1.2, r * 0.7);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx - r * 0.4, cy - r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.arc(cx + r * 0.4, cy - r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - r * 0.12, cy + r * 0.25); ctx.lineTo(cx + r * 0.12, cy + r * 0.25); ctx.lineTo(cx, cy + r * 0.45); ctx.fill();
  for (const ox of [-r * 0.35, -r * 0.12, r * 0.12, r * 0.35]) ctx.fillRect(cx + ox - 0.5, cy + r * 0.6, 1, r * 0.35);
}
function laurel(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.lineWidth = 1; ctx.strokeStyle = INK;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + side * (0.35 + i * 0.3);
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      const ta = a + side * Math.PI / 2;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ta + side * 0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 1.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? '#d9b35a' : '#e6c06a'; ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI / 2 + side * 0.3, Math.PI / 2 + side * 2.2, side < 0); ctx.lineWidth = 1.4; ctx.strokeStyle = '#b8903a'; ctx.stroke();
  }
  ctx.fillStyle = '#b23a2e'; ctx.beginPath(); ctx.moveTo(cx - 4, cy + r + 1); ctx.lineTo(cx + 4, cy + r + 1); ctx.lineTo(cx + 2.5, cy + r + 5); ctx.lineTo(cx - 2.5, cy + r + 5); ctx.closePath(); ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = INK; ctx.stroke();
}

export type Variant = 'B1' | 'B2' | 'B3' | 'B4';
export const VARIANTS: Record<Variant, { title: string; note: string }> = {
  B1: { title: 'Crowned Crest', note: 'A quarter larger, double gold rim, a crown on the chief. Final boss gets a taller crown.' },
  B2: { title: 'Skull Banner', note: 'Same size shield, a dark pennant hanging behind it and a skull badge on the point. Reads as danger from across the map.' },
  B3: { title: 'Laurel Wreath', note: 'Gold laurels ring the shield with a red ribbon at the foot. Says "prize" more than "threat".' },
  B4: { title: 'Ember Crown', note: 'The Crowned Crest for all three, and the final boss alone burns: a red glow that would pulse in game.' },
};

/** Draws a boss marker centred at (cx, cy) in base units, on a ctx already scaled. */
export function drawBossMarker(ctx: Ctx, host: Host, v: Variant, level: LevelDef, cx: number, cy: number, sfInner: number, final: boolean) {
  const scale = v === 'B1' || v === 'B4' ? 1.25 : 1;
  const shield = drawShieldCanvas(level.biome, true, sfInner);
  const w = shield.width / sfInner, h = shield.height / sfInner;
  const draw = () => ctx.drawImage(shield, cx - SHIELD_CENTER.x * scale, cy - SHIELD_CENTER.y * scale, w * scale, h * scale);
  if (v === 'B4' && final) {
    for (let i = 4; i >= 1; i--) { ctx.save(); ctx.scale(scale, scale); shieldPath(ctx, cx / scale, cy / scale, 2 + i * 2.2); ctx.fillStyle = `rgba(255,90,30,${0.09 * (5 - i)})`; ctx.fill(); ctx.restore(); }
  }
  if (v === 'B2') {
    // pennant behind
    const top = cy - SHIELD_H * 0.46 - 3;
    ctx.beginPath(); ctx.moveTo(cx - SHIELD_W * 0.62, top); ctx.lineTo(cx + SHIELD_W * 0.62, top); ctx.lineTo(cx + SHIELD_W * 0.62, cy + SHIELD_H * 0.55); ctx.lineTo(cx, cy + SHIELD_H * 0.78); ctx.lineTo(cx - SHIELD_W * 0.62, cy + SHIELD_H * 0.55); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.save(); ctx.translate(1.5, 2.5); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2a1a1c'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = '#e6c06a'; ctx.stroke();
    ctx.fillStyle = '#b23a2e'; ctx.fillRect(cx - SHIELD_W * 0.62, top, SHIELD_W * 1.24, 2.5);
  }
  if (v === 'B3') laurel(ctx, cx, cy + 1, SHIELD_W * 0.78);
  draw();
  if (v === 'B1' || v === 'B4') {
    ctx.save(); ctx.scale(scale, scale); shieldPath(ctx, cx / scale, cy / scale, 2.4); ctx.lineWidth = 1.2; ctx.strokeStyle = '#e6c06a'; ctx.stroke(); shieldPath(ctx, cx / scale, cy / scale, 3.6); ctx.lineWidth = 0.7; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    crown(ctx, cx, cy - SHIELD_H * 0.46 * scale - 1.5, final ? SHIELD_W * 0.8 : SHIELD_W * 0.6);
  }
  if (v === 'B2') skull(ctx, cx, cy + SHIELD_H * 0.5, 4.2);
}

export const BOSS_IDS = new Set([9, 13, 17]);

/** A context tile: the map around a level, its neighbours as regular shields, the boss marker in the chosen variant. */
export async function renderContext(host: Host, mapImg: any, v: Variant, level: LevelDef, S: number, tileW = 300, tileH = 190): Promise<any> {
  const c = host.createCanvas(tileW * S, tileH * S), ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.scale(S, S);
  ctx.fillStyle = '#dcc69a'; ctx.fillRect(0, 0, tileW, tileH);
  // map region in base coords centred on the level
  const bx0 = level.x - tileW / 2, by0 = level.y - tileH / 2;
  const fw = MAP_FRAME.x1 - MAP_FRAME.x0, fh = MAP_FRAME.y1 - MAP_FRAME.y0;
  const toImg = (x: number, y: number) => [(MAP_FRAME.x0 + (x * 1024 / 960 - MAP_CROP.x) / MAP_CROP.w * fw), (MAP_FRAME.y0 + (y * 764 / 640 - MAP_CROP.y) / MAP_CROP.h * fh)] as [number, number];
  // the frame space: draw the crop of the jpg so that frame coords land in base coords
  const sx = fw / MAP_CROP.w, sy = fh / MAP_CROP.h;
  ctx.save(); ctx.translate(-bx0, -by0);
  ctx.drawImage(mapImg, MAP_CROP.x, MAP_CROP.y, MAP_CROP.w, MAP_CROP.h, MAP_FRAME.x0, MAP_FRAME.y0, MAP_CROP.w * sx, MAP_CROP.h * sy);
  const pos = (l: LevelDef) => toImg(l.x, l.y);
  // route
  const byId = new Map(LEVELS.map(l => [l.id, l]));
  ctx.setLineDash([4.5, 4]);
  for (const l of LEVELS) for (const t of l.connectsTo) {
    const [x0, y0] = pos(l), [x1, y1] = pos(byId.get(t)!);
    const ax = x0 + (x1 - x0) * 0.14, ay = y0 + (y1 - y0) * 0.14, bx = x0 + (x1 - x0) * 0.86, by = y0 + (y1 - y0) * 0.86;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(234,220,180,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(43,29,18,0.9)'; ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const l of LEVELS) {
    const [x, y] = pos(l);
    if (x < bx0 - 40 || x > bx0 + tileW + 40 || y < by0 - 40 || y > by0 + tileH + 40) continue;
    if (BOSS_IDS.has(l.id)) drawBossMarker(ctx, host, v, l, x, y, S, l.id === 17);
    else { const sh = drawShieldCanvas(l.biome, true, S); ctx.drawImage(sh, x - SHIELD_CENTER.x, y - SHIELD_CENTER.y, sh.width / S, sh.height / S); }
    const scale = BOSS_IDS.has(l.id) && (v === 'B1' || v === 'B4') ? 1.25 : 1;
    ctx.font = '700 10.5px Cinzel'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const ly = y + 15 * scale + 10 + (v === 'B2' && BOSS_IDS.has(l.id) ? 5 : v === 'B3' && BOSS_IDS.has(l.id) ? 8 : 0);
    ctx.lineWidth = 3; ctx.strokeStyle = PARCHMENT_LIGHT; ctx.strokeText(l.name, x, ly); ctx.fillStyle = INK; ctx.fillText(l.name, x, ly);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 13.5 + i * 9, ly + 11, 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(232,214,172,0.6)'; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(43,29,18,0.7)'; ctx.stroke(); }
  }
  ctx.restore();
  return c;
}
