import type Phaser from 'phaser';
import { add } from './canvas';
import { line, oval, shape, wash } from './forestEnemies/paint';

export const CASTLE_WALL_ORIGIN_Y = 72 / 112;
export const CASTLE_TRAP_STATES = ['dormant', 'warning', 'active'] as const;
export type CastleTrapState = typeof CASTLE_TRAP_STATES[number];

function wall(mask: number, variant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 80; canvas.height = 112;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(8, 40);
  const south = !!(mask & 4), east = !!(mask & 2), west = !!(mask & 8);
  ctx.fillStyle = '#1a1b2599'; ctx.fillRect(-3, 58, 70, 8);
  ctx.fillStyle = '#292d39'; ctx.fillRect(-2, -29, 68, 93);
  ctx.fillStyle = ['#6f727b', '#767781', '#686d78'][variant]; ctx.fillRect(0, -26, 64, 62);
  for (let row = 0; row < 4; row++) {
    const y = -26 + row * 16;
    for (let col = -1; col < 3; col++) {
      const x = col * 32 + (row & 1) * 16;
      ctx.save(); ctx.beginPath(); ctx.rect(0, -26, 64, 62); ctx.clip();
      ctx.fillStyle = '#464c5a'; ctx.fillRect(x, y, 32, 16);
      ctx.fillStyle = (row + col + variant) % 3 === 0 ? '#85858a' : '#747985';
      ctx.fillRect(x + 1, y + 1, 30, 14);
      ctx.fillStyle = '#9a9793'; ctx.fillRect(x + 2, y + 1, 28, 1);
      ctx.fillStyle = '#5a616e'; ctx.fillRect(x + 1, y + 13, 30, 2);
      ctx.restore();
    }
  }
  if (!south) {
    ctx.fillStyle = wash(ctx, 36, 64, [[0, '#777884'], [.2, '#4e5664'], [1, '#303846']]);
    ctx.fillRect(0, 36, 64, 28);
    line(ctx, '#292f3d', 2, p => {
      p.moveTo(0, 49); p.lineTo(64, 49); p.moveTo(20, 36); p.lineTo(20, 49);
      p.moveTo(48, 36); p.lineTo(48, 49); p.moveTo(34, 49); p.lineTo(34, 63);
    });
    ctx.fillStyle = '#aaa396'; ctx.fillRect(-1, 32, 66, 4);
    ctx.fillStyle = '#555e6a'; ctx.fillRect(-1, 36, 66, 2);
    ctx.fillStyle = '#6b6c70'; ctx.fillRect(-1, 60, 66, 3);
  }
  if (!east) { ctx.fillStyle = '#3c4351'; ctx.fillRect(61, -25, 3, south ? 61 : 86); }
  if (!west) { ctx.fillStyle = '#a19c93'; ctx.fillRect(0, -25, 2, 60); }
  line(ctx, '#444a56', 1.2, p => {
    p.moveTo(12 + variant * 13, -20); p.lineTo(16 + variant * 13, -12); p.lineTo(13 + variant * 13, -8);
    p.moveTo(44 - variant * 9, 11); p.lineTo(40 - variant * 9, 18); p.lineTo(43 - variant * 9, 22);
  });
  return canvas;
}

function tomb(crypt: boolean, variant: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 144; canvas.height = crypt ? 176 : 112;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(8, 24);
  const height = crypt ? 128 : 64;
  const top = crypt ? -9 : -10;
  const lidBottom = height - (crypt ? 35 : 24);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  oval(ctx, 65, height - 3, 66, 9, '#11172266');
  shape(ctx, wash(ctx, lidBottom, height, [[0, '#71747c'], [1, '#353b4b']]), 2, p => {
    p.moveTo(5, 5); p.lineTo(123, 5); p.lineTo(126, height - 6);
    p.lineTo(119, height); p.lineTo(9, height); p.lineTo(2, height - 6);
  });
  shape(ctx, wash(ctx, top, lidBottom, [[0, '#aaa493'], [.35, '#85878a'], [1, '#626b79']]), 2.5, p => {
    p.moveTo(13, top); p.lineTo(115, top); p.lineTo(125, top + 10);
    p.lineTo(122, lidBottom); p.lineTo(112, lidBottom + 6); p.lineTo(13, lidBottom + 6);
    p.lineTo(3, lidBottom); p.lineTo(4, top + 11);
  });
  line(ctx, '#c3b79d', 1.8, p => {
    p.moveTo(14, top + 4); p.lineTo(113, top + 4); p.lineTo(120, top + 13); p.lineTo(117, lidBottom - 2);
    p.lineTo(111, lidBottom + 1); p.lineTo(15, lidBottom + 1); p.lineTo(8, lidBottom - 3);
  });
  line(ctx, '#4d5665', 1.6, p => {
    p.moveTo(18, top + 11); p.lineTo(109, top + 11); p.lineTo(112, lidBottom - 7);
    p.lineTo(17, lidBottom - 7); p.closePath();
  });
  if (crypt) {
    shape(ctx, '#686a71', 1.5, p => {
      p.moveTo(56, 18); p.lineTo(71, 18); p.lineTo(74, 28); p.lineTo(87, 49); p.lineTo(89, 66);
      p.lineTo(80, 74); p.lineTo(48, 74); p.lineTo(41, 65); p.lineTo(44, 48); p.lineTo(54, 30);
    });
    oval(ctx, 64, 23, 8, 9, '#969692');
    line(ctx, '#aaa393', 2, p => { p.moveTo(57, 39); p.lineTo(63, 49); p.lineTo(73, 39); p.moveTo(52, 61); p.lineTo(76, 61); });
    for (const x of [17, 99]) {
      shape(ctx, '#454d5c', 1.5, p => { p.moveTo(x, 106); p.lineTo(x + 12, 106); p.lineTo(x + 15, 119); p.lineTo(x - 1, 119); });
    }
  } else {
    line(ctx, '#4e5664', 3, p => { p.moveTo(63, 7); p.lineTo(63, 27); p.moveTo(51, 15); p.lineTo(76, 15); });
    line(ctx, '#b6ab94', 1.3, p => { p.moveTo(65, 7); p.lineTo(65, 27); p.moveTo(53, 17); p.lineTo(76, 17); });
    for (const x of [19, 106]) oval(ctx, x, height - 8, 5, 3.7, '#353c49');
  }
  line(ctx, '#48505c', 1.4, p => {
    p.moveTo(23 + variant * 17, top + 4); p.lineTo(30 + variant * 15, top + 13); p.lineTo(26 + variant * 16, top + 21);
    p.moveTo(101, lidBottom - 9); p.lineTo(96, lidBottom - 2); p.lineTo(99, lidBottom + 4);
  });
  return canvas;
}

function trap(state: CastleTrapState): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 88;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(0, 24);
  ctx.fillStyle = '#252c38'; ctx.fillRect(3, 3, 58, 58);
  ctx.fillStyle = '#666969'; ctx.fillRect(5, 5, 54, 54);
  ctx.strokeStyle = '#98927e'; ctx.lineWidth = 1; ctx.strokeRect(6.5, 6.5, 51, 51);
  for (const y of [16, 32, 48]) for (const x of [16, 32, 48]) {
    oval(ctx, x, y, 5, 3, '#202735');
    if (state === 'active') {
      shape(ctx, '#adb5b5', 1, p => { p.moveTo(x - 4, y); p.lineTo(x, y - 23); p.lineTo(x + 4, y); });
      shape(ctx, '#636e7d', 0, p => { p.moveTo(x, y - 21); p.lineTo(x + 3, y - 1); p.lineTo(x, y + 1); });
      line(ctx, '#e4dcc1', .7, p => { p.moveTo(x - 2, y - 2); p.lineTo(x, y - 18); });
    } else if (state === 'warning') oval(ctx, x, y - 1, 3, 1.8, '#e9a35b');
  }
  if (state !== 'dormant') {
    ctx.strokeStyle = state === 'warning' ? '#df9a58' : '#b27b59'; ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 54, 54);
  }
  return canvas;
}

export function generateCastleTerrainTextures(scene: Phaser.Scene): void {
  for (let mask = 0; mask < 16; mask++) for (let v = 0; v < 3; v++) add(scene, `castle_wall_${mask}_${v}`, wall(mask, v));
  for (let v = 0; v < 3; v++) {
    add(scene, `castle_tomb_${v}`, tomb(false, v));
    add(scene, `castle_crypt_${v}`, tomb(true, v));
  }
  for (const state of CASTLE_TRAP_STATES) add(scene, `castle_trap_${state}`, trap(state));
}
