import Phaser from 'phaser';
import type { LevelSelectScene } from '../scenes/LevelSelectScene';
import { getRegistry } from '../core/registry';
import { UNLOCKS, type UnlockDef } from '../state/unlocks';
import { SOFT_CAP_LEVEL } from '../state/PlayerProgressState';
import {
  INK, drawPlankBoardCanvas, drawIronPlateCanvas, drawBrassPlateCanvas, drawNailedSheetCanvas,
  drawIronButtonCanvas, drawMedalCheckCanvas, drawMedallionCanvas, drawXpTroughCanvas, drawLockCanvas,
} from '../assets/art/levelMap';

const RED_INK = '#8c2a22';
const CINZEL = 'Cinzel, Georgia, serif';
const CINZEL_DECO = '"Cinzel Decorative", Georgia, serif';

/**
 * Modal opened from the Ranger tag on LevelSelect: the ranger's rank on a
 * brass medallion, an iron XP trough, and the unlock ledger inked on a
 * sheet nailed to the mission panel's plank board. Backdrop click or the
 * iron button closes it.
 */
export class PlayerProfilePanel {
  private root: Phaser.GameObjects.Container;
  private destroyed = false;
  private onClose: () => void;

  constructor(scene: LevelSelectScene, onClose: () => void) {
    this.onClose = onClose;
    const p = (v: number) => scene.p(v);
    const fs = (v: number) => scene.fs(v);
    const bs = scene.sf;
    const W = scene.scale.width, H = scene.scale.height;

    const progress = getRegistry(scene.game).get('playerProgress');
    const rank = progress.level;
    const inLvl = progress.xpInCurrentLevel;
    const need = progress.xpToNextLevel;
    const total = progress.totalXp;
    const capped = rank >= SOFT_CAP_LEVEL;
    const earned: UnlockDef[] = UNLOCKS.filter((u) => u.requiredLevel <= rank);
    const upcoming: UnlockDef[] = UNLOCKS
      .filter((u) => u.requiredLevel > rank)
      .slice()
      .sort((a, b) => a.requiredLevel - b.requiredLevel);

    const rowGap = 22, headerH = 16;
    const sectionH = (rows: number) => headerH + Math.max(1, rows) * rowGap;
    const sheetH = 20 + sectionH(earned.length) + 4 + sectionH(upcoming.length) + 8;
    const w = 320, sheetTop = capped ? 178 : 166, h = sheetTop + sheetH + 26;
    const x = -w / 2, y = -h / 2;
    const items: Phaser.GameObjects.GameObject[] = [];
    const tex = (key: string, make: () => HTMLCanvasElement) => scene.canvasTexture(key, make);
    const text = (tx: number, ty: number, s: string, size: number, color: string, opts: { deco?: boolean; weight?: string; origin?: [number, number]; stroke?: string } = {}) => {
      const t = scene.add.text(p(tx), p(ty), s, {
        fontFamily: opts.deco ? CINZEL_DECO : CINZEL, fontSize: fs(size), fontStyle: opts.weight ?? 'bold', color,
        ...(opts.stroke ? { stroke: opts.stroke, strokeThickness: p(2) } : {}),
      }).setOrigin(...(opts.origin ?? [0.5, 0.5]));
      items.push(t);
      return t;
    };
    const image = (tx: number, ty: number, key: string, dw: number, dh: number) => {
      const img = scene.add.image(p(tx), p(ty), key).setDisplaySize(p(dw), p(dh));
      items.push(img);
      return img;
    };

    const backdrop = scene.add.rectangle(-W / 2, -H / 2, W, H, 0x000000, 0.55).setOrigin(0).setInteractive();
    backdrop.on('pointerdown', () => this.close());
    const blocker = scene.add.rectangle(0, 0, p(w + 6), p(h + 6), 0x000000, 0).setInteractive();
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRect(p(x + 5), p(y + 7), p(w), p(h));
    items.push(backdrop, blocker, shadow);
    image(0, 0, tex(`profile_board_${h}`, () => drawPlankBoardCanvas(w, h, bs)), w, h);

    const plateW = 180, plateH = 30, plateY = y + 14 + plateH / 2;
    image(0, plateY, tex('profile_plate_back', () => drawIronPlateCanvas(plateW, plateH, bs)), plateW, plateH);
    image(0, plateY, tex('profile_plate', () => drawBrassPlateCanvas(plateW - 8, plateH - 8, bs, 'lit')), plateW - 8, plateH - 8);
    text(0, plateY + 1, 'RANGER', 15, INK, { deco: true });

    const closeR = 8, closeX = x + w - 24, closeY = y + 28;
    const closeIdle = tex('panel_close_idle', () => drawIronButtonCanvas(closeR, bs, false));
    const closeHover = tex('panel_close_hover', () => drawIronButtonCanvas(closeR, bs, true));
    const closeBtn = image(closeX, closeY, closeIdle, closeR * 2 + 2, closeR * 2 + 2);
    const closeHit = scene.add.rectangle(p(closeX), p(closeY), p(32), p(32), 0x000000, 0).setInteractive({ useHandCursor: true });
    closeHit.on('pointerover', () => closeBtn.setTexture(closeHover).setDisplaySize(p(closeR * 2 + 2), p(closeR * 2 + 2)));
    closeHit.on('pointerout', () => closeBtn.setTexture(closeIdle).setDisplaySize(p(closeR * 2 + 2), p(closeR * 2 + 2)));
    closeHit.on('pointerdown', () => this.close());
    items.push(closeHit);

    const mr = 27, my = y + 84;
    const medalShadow = scene.add.graphics();
    medalShadow.fillStyle(0x000000, 0.35);
    medalShadow.fillCircle(p(2), p(my + 3), p(mr));
    items.push(medalShadow);
    image(0, my, tex('profile_medallion', () => drawMedallionCanvas(mr, bs)), mr * 2 + 4, mr * 2 + 4);
    text(0, my - 11, 'RANK', 6.5, '#5a3e14');
    text(0, my + 5, String(rank), 26, INK, { deco: true });

    const bw = w - 60, bh = 16, by = y + 124 + bh / 2;
    const pct = need > 0 ? Math.max(0, Math.min(1, inLvl / need)) : 1;
    image(0, by, tex(`profile_trough_${Math.round(pct * 100)}`, () => drawXpTroughCanvas(bw, bh, bs, pct)), bw + 6, bh + 6);
    text(0, by + 0.5, `${inLvl} / ${need} XP`, 9.5, '#f6e7bf', { stroke: '#1e140a' });
    text(0, by + bh / 2 + 12, `${total.toLocaleString()} XP in all`, 7.5, '#d9c6a0', { weight: 'normal' });
    if (capped) text(0, by + bh / 2 + 23, 'Soft cap reached. Every rank beyond is bragging rights.', 7, '#d9c6a0', { weight: 'normal' });

    const sx = x + 26, sy = y + sheetTop, sw = w - 52;
    const sheetShadow = scene.add.graphics();
    sheetShadow.fillStyle(0x000000, 0.35);
    sheetShadow.fillRect(p(sx + 2), p(sy + 3), p(sw), p(sheetH));
    items.push(sheetShadow);
    image(sx + sw / 2, sy + sheetH / 2, tex(`profile_sheet_${sheetH}`, () => drawNailedSheetCanvas(sw, sheetH, bs)), sw, sheetH);

    const rules = scene.add.graphics();
    items.push(rules);
    const lx = sx + 16, lw = sw - 32;
    let cursor = sy + 20;
    const section = (label: string, rows: UnlockDef[], isEarned: boolean, empty: string) => {
      const head = text(lx, cursor, label, 8.5, RED_INK, { origin: [0, 0.5] });
      rules.lineStyle(p(0.8), 0x2b1d12, 0.45);
      rules.lineBetween(head.x + head.width + p(8), p(cursor), p(lx + lw), p(cursor));
      cursor += headerH;
      if (rows.length === 0) {
        text(lx + lw / 2, cursor + 2, empty, 9, 'rgba(43,29,18,0.6)', { weight: 'normal' });
        cursor += rowGap;
        return;
      }
      for (const def of rows) {
        const iconKey = isEarned
          ? tex('profile_check', () => drawMedalCheckCanvas('#e6c06a', bs))
          : tex('profile_lock', () => drawLockCanvas(RED_INK, bs));
        image(lx + 7, cursor, iconKey, 14, 14);
        text(lx + 20, cursor + 0.5, def.label, 10.5, INK, { origin: [0, 0.5], weight: 'normal' });
        text(lx + lw, cursor + 0.5, isEarned ? 'Unlocked' : `Rank ${def.requiredLevel}`, 9, isEarned ? '#8a6a1e' : RED_INK, { origin: [1, 0.5] });
        rules.lineStyle(p(0.8), 0x2b1d12, 0.2);
        rules.lineBetween(p(lx), p(cursor + 10), p(lx + lw), p(cursor + 10));
        cursor += rowGap;
      }
    };
    section('UNLOCKED', earned, true, 'Nothing yet. Rank up to earn rewards.');
    cursor += 4;
    section('UPCOMING', upcoming, false, 'All current rewards collected.');

    this.root = scene.add.container(W / 2, H / 2, items).setDepth(3000).setAlpha(0);
    scene.tweens.add({ targets: this.root, alpha: 1, duration: 200 });
  }

  close() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.root.destroy();
    this.onClose();
  }
}
