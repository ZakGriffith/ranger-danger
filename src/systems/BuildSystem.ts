import Phaser from 'phaser';
import { getRegistry } from '../core/registry';
import { getEvents } from '../core/events';
import { CFG } from '../config';
import { wallTextureKey } from '../assets/art/fieldstone';
import { Tower, TowerKind } from '../entities/Tower';
import { Wall } from '../entities/Wall';
import { SFX } from '../audio/sfx';
import { gridGet, gridKey, gridSet } from './Pathfinding';
import type { GameScene, BuildKind } from '../scenes/GameScene';
import type { Enemy } from '../entities/Enemy';

type Tile = { x: number; y: number };
type WallDraft = {
  lastTile: Tile;
  moved: boolean;
  tiles: Map<string, { tile: Tile; ghost: Phaser.GameObjects.Sprite }>;
};

function* wallStroke(from: Tile, to: Tile): Generator<Tile> {
  const dx = Math.abs(to.x - from.x), dy = Math.abs(to.y - from.y);
  const sx = Math.sign(to.x - from.x), sy = Math.sign(to.y - from.y);
  let x = from.x, y = from.y;
  let ix = 0, iy = 0;
  // Step one axis at a time so a diagonal sweep builds connected walls.
  while (ix < dx || iy < dy) {
    if ((2 * ix + 1) * dy <= (2 * iy + 1) * dx) { x += sx; ix++; }
    else { y += sy; iy++; }
    yield { x, y };
  }
}

/**
 * Build-mode state machine: choose tower / cannon / mage / wall, position
 * the ghost cursor, validate placement (gold, pathing, screen bounds), and
 * commit on tap/click. Owns the grid overlay redraw cache so canvas resizes
 * during build mode invalidate it correctly.
 */
export class BuildSystem {
  /** Last build-error string emitted — skip the per-frame event re-emit
   *  when the message didn't change so UIScene doesn't churn its toast. */
  private lastBuildErr = '';
  private wallDraft?: WallDraft;
  private readonly rangeCircle: Phaser.GameObjects.Graphics;

  // Last camera scroll tile + zoom we drew the grid overlay against —
  // skip the redraw entirely when nothing relevant changed (which is
  // most frames while the player is standing or barely drifting).
  private lastGridOverlayLeft = NaN;
  private lastGridOverlayTop = NaN;
  private lastGridOverlayZoom = NaN;
  private lastGridOverlayCols = NaN;
  private lastGridOverlayRows = NaN;

  // Cached "how many spawn directions can reach the player from where they
  // stand right now?" — same answer for every uncached hovered tile, so we
  // pay the BFS once per player-tile/grid-version change instead of per-cell.
  private _beforeReach = -1;
  private _beforeReachKey = '';

  constructor(private scene: GameScene) {
    this.rangeCircle = scene.add.graphics().setDepth(797).setVisible(false);
    this.rangeCircle.fillStyle(0x8fcfff, 0.035);
    this.rangeCircle.fillCircle(0, 0, CFG.buildRadius);
    this.rangeCircle.lineStyle(2, 0x8fcfff, 0.75);
    this.rangeCircle.strokeCircle(0, 0, CFG.buildRadius);
  }

  bindInput() {
    const { input, game, events } = this.scene;
    input.on('pointerdown', this.handleClick, this);
    input.on('pointermove', this.moveWallDraft, this);
    input.on('pointerup', this.finishWallDraft, this);
    input.on('pointerupoutside', this.cancelWallDraft, this);
    input.on('gameout', this.cancelWallDraft, this);
    game.events.on(Phaser.Core.Events.BLUR, this.cancelWallDraft, this);
    events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off(Phaser.Core.Events.BLUR, this.cancelWallDraft, this);
      this.cancelWallDraft();
    });
  }

  toggleBuild(k: BuildKind, towerKind?: TowerKind) {
    const scene = this.scene;
    // If same build mode is already active, cancel it (toggle off)
    if (k === 'wall' && scene.buildState.kind === 'wall') {
      this.setBuild('none');
      return;
    }
    if (k === 'tower' && scene.buildState.kind === 'tower' && towerKind === scene.buildState.towerKind) {
      this.setBuild('none');
      return;
    }
    this.setBuild(k, towerKind);
  }

  setBuild(k: BuildKind, towerKind?: TowerKind) {
    const scene = this.scene;
    this.cancelWallDraft();
    scene.buildState.setKind(k, towerKind);
    this.rangeCircle.setPosition(scene.player.x, scene.player.y).setVisible(k !== 'none');
    scene.ghost.setVisible(k !== 'none');
    if (scene.deleteIcon) scene.deleteIcon.setVisible(false);
    if (scene.gridOverlay) scene.gridOverlay.setVisible(k !== 'none');
    getEvents(scene.game.events).emit('build-mode', k !== 'none', k, towerKind);
    if (k === 'none') {
      getEvents(scene.game.events).emit('build-error', '');
      this.lastBuildErr = '';
    }
    if (k === 'tower') {
      scene.ghost.setTexture(scene.buildState.towerKind === 'cannon' ? 'c_base' : 't_base');
      const baseTint = Tower.TIER_TINT[scene.buildState.towerKind][0];
      scene.ghost.setTint(baseTint);
    }
    if (k === 'wall') {
      scene.ghost.setTexture(wallTextureKey());
      scene.ghost.clearTint();
    }
    if (k !== 'none') scene.towerSelect.deselectTower();

    // Pause/unpause game world for build mode
    if (k !== 'none' && !scene.buildState.paused) {
      scene.buildState.paused = true;
      scene.physics.pause();
      scene.tweens.pauseAll();
      scene.anims.pauseAll();
    } else if (k === 'none' && scene.buildState.paused) {
      scene.buildState.paused = false;
      scene.physics.resume();
      scene.tweens.resumeAll();
      scene.anims.resumeAll();
    }

    scene.hud.pushHud();
  }

  /**
   * Check if a 2x2 block with top-left at (tx,ty) is all free, not under
   * player, and wouldn't block enemy pathing from all 4 edges to the player.
   */
  canPlaceTower(tx: number, ty: number): boolean {
    const scene = this.scene;
    const s = CFG.tower.tiles;
    if (!this.inBuildRange(tx, ty, s)) return false;
    const pt = scene.pathing.worldToTile(scene.player.x, scene.player.y);
    for (let j = 0; j < s; j++) {
      for (let i = 0; i < s; i++) {
        if (gridGet(scene.grid, tx + i, ty + j) !== 0) return false;
      }
    }
    if (this.occupied(tx, ty, s)) return false;
    // Rivers enemies all fly, and its clearings sit inside solid woods, so a
    // ground-reach test from the player would fail everywhere. Skip it there.
    if (scene.biome === 'river') return true;
    // A maze chamber can have one approach. Building must preserve it.
    const minimumReach = scene.biome === 'castle' ? this.minimumWallReach(pt) : 2;
    // Temporarily block tiles and check spawn directions can still reach the
    // player. PathingSystem.countReachableDirections runs a single BFS flood
    // from the player; the legacy canReachFromSpawnDirections did up to ~200
    // separate BFS calls per check and stalled the ghost cursor near towers.
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) gridSet(scene.grid, tx + i, ty + j, 2);
    const ok = scene.pathing.countReachableDirections(pt.x, pt.y) >= minimumReach;
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) gridSet(scene.grid, tx + i, ty + j, 0);
    return ok;
  }

  private inBuildRange(tx: number, ty: number, size = 1): boolean {
    const { x, y } = this.scene.player;
    const nearestX = Phaser.Math.Clamp(x, tx * CFG.tile, (tx + size) * CFG.tile);
    const nearestY = Phaser.Math.Clamp(y, ty * CFG.tile, (ty + size) * CFG.tile);
    return (x - nearestX) ** 2 + (y - nearestY) ** 2 <= CFG.buildRadius ** 2;
  }

  /**
   * True when the ranger, a live ground enemy or a grounded boss is standing
   * on the footprint. Flying creatures pass over structures, so they don't
   * count. Compares physics bodies, not sprite art, so a tall sprite whose
   * head overlaps the tile doesn't block it.
   */
  private occupied(tx: number, ty: number, size = 1): boolean {
    const scene = this.scene;
    const left = tx * CFG.tile, top = ty * CFG.tile, right = left + size * CFG.tile, bottom = top + size * CFG.tile;
    const onFootprint = (go: Phaser.GameObjects.GameObject) => {
      const b = go.body as Phaser.Physics.Arcade.Body | null;
      if (!b) return false;
      return b.x < right && b.x + b.width > left && b.y < bottom && b.y + b.height > top;
    };
    if (onFootprint(scene.player)) return true;
    for (const e of scene.enemies.getChildren() as Enemy[]) {
      if (e.active && !e.dying && !e.flying && onFootprint(e)) return true;
    }
    for (const b of [scene.bossState.boss, scene.bossState.midBoss]) {
      if (b && b.active && !b.dying && !b.flying && onFootprint(b)) return true;
    }
    return false;
  }

  private handleClick(p: Phaser.Input.Pointer) {
    const scene = this.scene;
    if (scene.endState.gameOver) return;

    // Right-click cancels build mode
    if (p.rightButtonDown() && scene.buildState.kind !== 'none') {
      this.setBuild('none');
      return;
    }

    // Ignore taps that land inside the mobile joystick's hit zone — otherwise
    // dragging the stick during build mode would also place a tower beneath
    // the thumb. Bounds are published by UIScene in screen-space pixels.
    const jb = getRegistry(scene.game).get('joystickBounds') as
      | { x: number; y: number; w: number; h: number }
      | undefined;
    if (jb && p.x >= jb.x && p.x <= jb.x + jb.w && p.y >= jb.y && p.y <= jb.y + jb.h) {
      return;
    }

    const wx = p.worldX, wy = p.worldY;

    // panel takes priority — clicks inside it are handled by button hit areas
    if (scene.selectedTower && scene.towerSelect.pointInPanel(wx, wy)) return;

    const tx = Math.floor(wx / CFG.tile);
    const ty = Math.floor(wy / CFG.tile);

    // sell with X held + click
    if (scene.keys.X.isDown) {
      if (getRegistry(scene.game).get('tutorialActive')) return; // no selling during tutorial
      scene.sell.sellAt(tx, ty);
      return;
    }

    // click an existing tower with no active build = select it.
    // Wall deletion is gated to wall build mode only (handled further down)
    // so that a stray click outside any build mode never starts a sell
    // countdown on a wall the player meant to walk past.
    if (scene.buildState.kind === 'none') {
      const hit = scene.towers.find(t =>
        tx >= t.tileX && tx < t.tileX + t.size &&
        ty >= t.tileY && ty < t.tileY + t.size);
      if (hit) {
        scene.towerSelect.selectTower(hit);
        return;
      }
      scene.towerSelect.deselectTower();
      return;
    }

    // entering build mode cancels selection
    scene.towerSelect.deselectTower();

    if (scene.buildState.kind === 'tower') {
      // Tutorial caps placements at 1 tower; ignore further click-to-place
      // even if the player somehow stays in tower build mode.
      if (getRegistry(scene.game).get('tutorialActive') && scene.towers.length >= 1) return;
      const s = CFG.tower.tiles;
      // For even-size footprints, snap to the nearest grid intersection
      // so the tower centers under the cursor. For odd, snap to tile center.
      const ox = s % 2 === 0
        ? Math.round(wx / CFG.tile) - s / 2
        : Math.floor(wx / CFG.tile) - Math.floor(s / 2);
      const oy = s % 2 === 0
        ? Math.round(wy / CFG.tile) - s / 2
        : Math.floor(wy / CFG.tile) - Math.floor(s / 2);
      if (!this.canPlaceTower(ox, oy)) return;
      const kindCost = CFG.tower.kinds[scene.buildState.towerKind].cost;
      if (scene.player.money < kindCost) return;
      scene.player.money -= kindCost;
      scene.runStats.coinsSpent += kindCost;
      scene.runStats.towersBuilt++;
      const t = new Tower(scene, ox, oy, scene.buildState.towerKind);
      scene.towers.push(t);
      scene.towerGroup.add(t);
      scene.depthSort.applyTowerDepth(t); // static — set once, skipped in updateDepthSort
      for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) gridSet(scene.grid, ox + i, oy + j, 2);
      scene.gridVersion++; scene._wallCheckCache.clear(); scene.pathing.rebuildGapBlockers();
      scene.hud.pushHud();
      SFX.play('towerPlace');
      if (getRegistry(scene.game).get('tutorialActive')) getEvents(scene.game.events).emit('tutorial-tower-placed');
      this.setBuild('none');
      return;
    }

    const tile = { x: tx, y: ty };
    if (p.wasTouch) {
      if (!this.sellWallAt(tile)) this.placeWalls([tile]);
    } else if ('button' in p.event && p.event.button === 0) {
      this.cancelWallDraft();
      const draft = { lastTile: tile, moved: p.event.shiftKey, tiles: new Map() };
      this.wallDraft = draft;
      if (!p.event.shiftKey) this.paintWallTiles(draft, [tile]);
    }
  }

  private moveWallDraft(p: Phaser.Input.Pointer) {
    const draft = this.wallDraft;
    if (!draft || p.wasTouch) return;
    if (!p.leftButtonDown()) {
      this.cancelWallDraft();
      return;
    }
    this.extendWallDraft(draft, p);
  }

  private extendWallDraft(draft: WallDraft, p: Phaser.Input.Pointer) {
    const tile = this.scene.pathing.worldToTile(p.worldX, p.worldY);
    const last = draft.lastTile;
    if (!p.event.shiftKey && tile.x === last.x && tile.y === last.y) return;
    draft.moved = true;
    draft.lastTile = tile;
    if (p.event.shiftKey) {
      for (const cell of [last, ...wallStroke(last, tile)]) {
        const key = gridKey(cell.x, cell.y);
        draft.tiles.get(key)?.ghost.destroy();
        draft.tiles.delete(key);
      }
      this.showBuildError('');
    } else {
      this.paintWallTiles(draft, wallStroke(last, tile));
    }
  }

  private finishWallDraft(p: Phaser.Input.Pointer) {
    const draft = this.wallDraft;
    if (!draft || p.wasTouch || !('button' in p.event) || p.event.button !== 0) return;
    if (this.scene.endState.gameOver) {
      this.cancelWallDraft();
      return;
    }
    this.extendWallDraft(draft, p);
    const tiles = Array.from(draft.tiles.values(), ({ tile }) => tile);
    this.cancelWallDraft();
    if (!draft.moved && !p.event.shiftKey && this.sellWallAt(draft.lastTile)) return;
    this.placeWalls(tiles);
  }

  cancelWallDraft() {
    if (!this.wallDraft) return;
    for (const { ghost } of this.wallDraft.tiles.values()) ghost.destroy();
    this.wallDraft = undefined;
    this.showBuildError('');
  }

  private paintWallTiles({ tiles }: WallDraft, candidates: Iterable<Tile>) {
    const scene = this.scene;
    const limit = this.wallPlacementLimit();
    const pending = Array.from(candidates).filter(({ x, y }) => !tiles.has(gridKey(x, y)));
    if (!pending.length) return;

    const temporaryWalls: Tile[] = [];
    const markTemporaryWall = (tile: Tile) => {
      gridSet(scene.grid, tile.x, tile.y, 1);
      temporaryWalls.push(tile);
    };
    let error = '';
    try {
      for (const { tile } of tiles.values()) {
        if (gridGet(scene.grid, tile.x, tile.y) === 0) markTemporaryWall(tile);
      }
      const playerTile = scene.pathing.worldToTile(scene.player.x, scene.player.y);
      const minReach = this.minimumWallReach(playerTile);
      for (const tile of pending) {
        const { x, y } = tile;
        if (!this.inBuildRange(x, y)) { error = 'Out of range'; continue; }
        if (gridGet(scene.grid, x, y) !== 0 || this.occupied(x, y)) { error = 'Blocked'; continue; }
        if (tiles.size >= limit) {
          error = (tiles.size + 1) * CFG.wall.cost > scene.player.money ? 'Not enough gold' : '';
          break;
        }
        if (!this.wallPreservesPaths(x, y, playerTile, minReach)) { error = 'Blocks path'; continue; }
        markTemporaryWall(tile);
        const ghost = scene.add.sprite((x + 0.5) * CFG.tile, (y + 0.5) * CFG.tile, wallTextureKey())
          .setDepth(800).setScale(0.5).setAlpha(0.55).setTint(0x88ff88);
        tiles.set(gridKey(x, y), { tile, ghost });
        error = '';
      }
    } finally {
      for (const { x, y } of temporaryWalls) gridSet(scene.grid, x, y, 0);
    }
    this.showBuildError(error);
  }

  private sellWallAt({ x, y }: Tile): boolean {
    const scene = this.scene;
    if (getRegistry(scene.game).get('tutorialActive')) return false;
    const wall = scene.walls.find(w => w.tileX === x && w.tileY === y);
    if (!wall) return false;
    scene.sell.startSellTimer(wall);
    return true;
  }

  private wallPlacementLimit(): number {
    const scene = this.scene;
    const affordable = Math.floor(scene.player.money / CFG.wall.cost);
    return getRegistry(scene.game).get('tutorialActive') ? Math.min(affordable, 3 - scene.walls.length) : affordable;
  }

  private minimumWallReach(playerTile: Tile): number {
    return Math.min(this.scene.pathing.countReachableDirections(playerTile.x, playerTile.y), 2);
  }

  private wallPreservesPaths(tx: number, ty: number, playerTile: Tile, minReach: number): boolean {
    const scene = this.scene;
    gridSet(scene.grid, tx, ty, 1);
    try {
      return scene.pathing.countReachableDirections(playerTile.x, playerTile.y) >= minReach;
    } finally {
      gridSet(scene.grid, tx, ty, 0);
    }
  }

  private placeWalls(tiles: Tile[]) {
    const scene = this.scene;
    const limit = this.wallPlacementLimit();
    if (!tiles.length || limit <= 0) return;
    const playerTile = scene.pathing.worldToTile(scene.player.x, scene.player.y);
    const minReach = this.minimumWallReach(playerTile);
    let placed = 0;
    for (const { x, y } of tiles) {
      if (placed >= limit) break;
      if (!this.inBuildRange(x, y)) continue;
      if (gridGet(scene.grid, x, y) !== 0 || this.occupied(x, y) || !this.wallPreservesPaths(x, y, playerTile, minReach)) continue;
      const wall = new Wall(scene, x, y);
      scene.walls.push(wall);
      scene.wallGroup.add(wall);
      gridSet(scene.grid, x, y, 1);
      scene.pathing.syncWallTile(x, y, true);
      scene.sell.updateWallNeighbors(x, y);
      placed++;
    }
    if (!placed) return;
    scene.player.money -= placed * CFG.wall.cost;
    scene.runStats.coinsSpent += placed * CFG.wall.cost;
    scene.runStats.wallsBuilt += placed;
    scene.gridVersion++; scene._wallCheckCache.clear(); scene.pathing.rebuildGapBlockers();
    scene.hud.pushHud();
    SFX.play('wallPlace');
    if (getRegistry(scene.game).get('tutorialActive')) {
      for (let i = 0; i < placed; i++) getEvents(scene.game.events).emit('tutorial-wall-placed');
    }
  }

  /**
   * Per-frame ghost cursor render + placement validity check while in build
   * mode. Emits `build-error` toasts via the dedupe field so UIScene only
   * sees a re-emit when the message changes.
   */
  updateGhost() {
    const scene = this.scene;
    if (scene.buildState.kind === 'none') return;
    this.rangeCircle.setPosition(scene.player.x, scene.player.y);
    if (this.wallDraft) {
      if (scene.input.mousePointer.leftButtonDown()) {
        const pointer = scene.input.mousePointer;
        const tile = scene.pathing.worldToTile(pointer.worldX, pointer.worldY);
        const outOfRange = !this.inBuildRange(tile.x, tile.y);
        scene.ghost.setPosition((tile.x + 0.5) * CFG.tile, (tile.y + 0.5) * CFG.tile)
          .setVisible(outOfRange).setTint(0xff8888);
        scene.deleteIcon.setVisible(false);
        if (outOfRange) this.showBuildError('Out of range');
        else if (this.lastBuildErr === 'Out of range') this.showBuildError('');
        return;
      }
      this.cancelWallDraft();
    }
    const p = scene.input.activePointer;
    // Don't snap the ghost onto the joystick when the player's thumb is on
    // the stick — keep it at its last position until they tap elsewhere.
    const jb = getRegistry(scene.game).get('joystickBounds') as
      | { x: number; y: number; w: number; h: number }
      | undefined;
    const overJoystick = !!jb && p.x >= jb.x && p.x <= jb.x + jb.w && p.y >= jb.y && p.y <= jb.y + jb.h;
    if (overJoystick) return;
    const tx = Math.floor(p.worldX / CFG.tile);
    const ty = Math.floor(p.worldY / CFG.tile);
    let buildErr = '';
    if (scene.buildState.kind === 'tower') {
      const s = CFG.tower.tiles;
      const ox = s % 2 === 0
        ? Math.round(p.worldX / CFG.tile) - s / 2
        : Math.floor(p.worldX / CFG.tile) - Math.floor(s / 2);
      const oy = s % 2 === 0
        ? Math.round(p.worldY / CFG.tile) - s / 2
        : Math.floor(p.worldY / CFG.tile) - Math.floor(s / 2);
      scene.ghost.setPosition((ox + s / 2) * CFG.tile, (oy + s / 2) * CFG.tile);
      const towerCost = CFG.tower.kinds[scene.buildState.towerKind].cost;
      const canAffordTower = scene.player.money >= towerCost;
      const canPlace = this.canPlaceTower(ox, oy);
      if (!this.inBuildRange(ox, oy, s)) buildErr = 'Out of range';
      else if (!canAffordTower) buildErr = 'Not enough gold';
      else if (!canPlace) buildErr = 'Blocked';
      scene.ghost.setTint(canPlace && canAffordTower ? 0x88ff88 : 0xff8888);
    } else {
      scene.ghost.setPosition(tx * CFG.tile + CFG.tile / 2, ty * CFG.tile + CFG.tile / 2);
      // Hovering an existing wall? Show a red X — clicking will start
      // the sell countdown to tear it down. Skip the BFS pathing check
      // entirely (way cheaper, and there's nothing to validate). Mobile
      // has no real hover (the pointer stays parked on the last touch),
      // so suppress the red X there — it would spuriously appear over
      // the just-placed wall every time the player taps to build. Tap-
      // to-sell still works through the regular pointer-down handler.
      const wallHere = !getRegistry(scene.game).get('tutorialActive')
        && !getRegistry(scene.game).get('isMobile')
        && scene.walls.find(w => w.tileX === tx && w.tileY === ty);
      if (wallHere) {
        scene.ghost.setVisible(false);
        // If the wall already has a pending sell timer the marker is
        // drawn over the wall itself — skip the hover hint to avoid a
        // doubled-up X.
        if (scene.sellTimers.has(wallHere)) {
          scene.deleteIcon.setVisible(false);
        } else {
          scene.deleteIcon.setPosition(tx * CFG.tile + CFG.tile / 2, ty * CFG.tile + CFG.tile / 2)
            .setVisible(true);
        }
      } else {
        scene.ghost.setVisible(true);
        scene.deleteIcon.setVisible(false);

        // Invalidate cache when player moves to a new tile
        const ptKey = `${Math.floor(scene.player.x / CFG.tile)},${Math.floor(scene.player.y / CFG.tile)}`;
        if (ptKey !== scene._lastWallCheckPlayerTile) {
          scene._lastWallCheckPlayerTile = ptKey;
          scene._wallCheckCache.clear();
        }
        const inRange = this.inBuildRange(tx, ty);
        const tileBlocked = gridGet(scene.grid, tx, ty) !== 0 || this.occupied(tx, ty);
        let valid = inRange && !tileBlocked;
        if (valid) {
          // Per-tile cache — cleared on player move and on any grid
          // change. Sweeping the cursor over already-hovered tiles is
          // free; only first-hovered tiles pay for BFS.
          const cacheKey = `${tx},${ty}`;
          const cached = scene._wallCheckCache.get(cacheKey);
          if (cached !== undefined) {
            valid = cached;
          } else {
            const pt = scene.pathing.worldToTile(scene.player.x, scene.player.y);
            // beforeReach is identical for every uncached cell at the same
            // player-tile + gridVersion — only afterReach varies per cell.
            const beforeKey = `${ptKey}|${scene.gridVersion}`;
            if (this._beforeReachKey !== beforeKey) {
              this._beforeReachKey = beforeKey;
              this._beforeReach = scene.pathing.countReachableDirections(pt.x, pt.y);
            }
            valid = this.wallPreservesPaths(tx, ty, pt, Math.min(this._beforeReach, 2));
            scene._wallCheckCache.set(cacheKey, valid);
          }
        }
        const canAffordWall = scene.player.money >= CFG.wall.cost;
        // Suppress the "Blocked" / "Blocks path" toasts on mobile when
        // building walls — the pointer parks on the last touch position,
        // so these would spuriously fire over the just-placed tile every
        // frame. The red ghost tint already conveys "can't place here".
        // The "Not enough gold" toast still shows since it isn't tied to
        // cursor location.
        const suppressPlacementToast = !!getRegistry(scene.game).get('isMobile');
        if (!inRange) buildErr = 'Out of range';
        else if (!canAffordWall) buildErr = 'Not enough gold';
        else if (tileBlocked && !suppressPlacementToast) buildErr = 'Blocked';
        else if (!valid && !suppressPlacementToast) buildErr = 'Blocks path';
        scene.ghost.setTint(valid && canAffordWall ? 0x88ff88 : 0xff8888);
      }
    }
    this.showBuildError(buildErr);
  }

  private showBuildError(message: string) {
    if (message === this.lastBuildErr) return;
    this.lastBuildErr = message;
    getEvents(this.scene.game.events).emit('build-error', message);
  }

  redrawGridOverlay() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const tile = CFG.tile;
    // cam.worldView is Phaser's authoritative visible-world rectangle —
    // it accounts for zoom and origin correctly. cam.scrollX/scrollY are
    // pixel-space scroll offsets, NOT the visible-world left/top, so using
    // them here would (and did) draw the grid offset and at the wrong size
    // when zoom != 1.
    const view = cam.worldView;
    const left = Math.floor(view.x / tile) - 1;
    const top = Math.floor(view.y / tile) - 1;
    const cols = Math.ceil(view.width / tile) + 2;
    const rows = Math.ceil(view.height / tile) + 2;
    if (left === this.lastGridOverlayLeft &&
        top === this.lastGridOverlayTop &&
        cam.zoom === this.lastGridOverlayZoom &&
        cols === this.lastGridOverlayCols &&
        rows === this.lastGridOverlayRows) {
      return;
    }
    this.lastGridOverlayLeft = left;
    this.lastGridOverlayTop = top;
    this.lastGridOverlayZoom = cam.zoom;
    this.lastGridOverlayCols = cols;
    this.lastGridOverlayRows = rows;
    const right = left + cols;
    const bottom = top + rows;
    const g = scene.gridOverlay;
    g.clear();
    g.lineStyle(1, 0xffffff, 0.18);
    for (let x = left; x <= right; x++) {
      g.lineBetween(x * tile, top * tile, x * tile, bottom * tile);
    }
    for (let y = top; y <= bottom; y++) {
      g.lineBetween(left * tile, y * tile, right * tile, y * tile);
    }
  }
}
