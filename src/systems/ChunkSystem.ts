import Phaser from 'phaser';
import { CFG } from '../config';
import {
  createGroundChunk,
  TREE_PATTERNS,
  SPIKE_PATTERNS,
  SPIKE_VARIANT_COUNT,
  CACTUS_VARIANT_COUNT,
  TEMPLE_BLOCK_VARIANT_COUNT,
} from '../assets/generateArt';
import { RIVER_TILE_BRIDGE, RIVER_TILE_WATER, RIVER_TILE_WOODS } from '../assets/art/riverGeometry';
import { drawRiverWoodsChunk } from '../assets/art/riverWoods';
import { canReachFromSpawnDirections, gridGet, gridSet } from './Pathfinding';
import { TREE_CLUSTER_CONFIG } from '../assets/treeOverrides';
import { INFECTED_PLANT_CLUSTER_CONFIG } from '../assets/infectedPlantOverrides';
import { ClusterConfig } from '../assets/clusterConfig';
import type { GameScene } from '../scenes/GameScene';

type ClusterPattern = { tiles: { dx: number; dy: number }[]; w: number; h: number };
/** A ground chunk image, with the River biome's woods overlay riding along so both are culled together. */
type ChunkImage = Phaser.GameObjects.Image & { _woods?: Phaser.GameObjects.Image };

/**
 * Streamed ground-chunk generation, plus the per-biome decoration passes
 * (river, trees, spikes) that piggyback on the chunk pipeline. Also owns the
 * river flow ambient FX update. Tree-tile destruction lives here too
 * because trees are a chunk-spawned obstacle.
 */
export class ChunkSystem {
  constructor(private scene: GameScene) {}

  // Queue ground chunks around a world position (deferred generation)
  generateChunksAround(wx: number, wy: number, force = false) {
    const scene = this.scene;
    const cs = CFG.chunkSize;
    const tile = CFG.tile;
    const cx = Math.floor(wx / (cs * tile));
    const cy = Math.floor(wy / (cs * tile));
    // Skip if player is still in the same chunk (unless forced at startup)
    if (!force && cx === scene.lastChunkCx && cy === scene.lastChunkCy) return;
    scene.lastChunkCx = cx;
    scene.lastChunkCy = cy;
    const cs2 = CFG.chunkSize;
    const tile2 = CFG.tile;
    const chunkPx = cs2 * tile2;
    const radius = 3; // generate around viewport
    const terrainKey = this.terrainKey();
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const ck = `${cx + dx},${cy + dy}`;
        // Already have a display image? skip
        if (scene.chunkImages.has(ck)) continue;
        // Texture already cached from a previous visit? Just create image, no re-render
        const texKey = `gnd_chunk_${terrainKey}_${cx + dx}_${cy + dy}`;
        if (scene.generatedChunks.has(ck) && scene.textures.exists(texKey)) {
          this.addChunkImages(cx + dx, cy + dy, texKey);
          continue;
        }
        // New chunk — queue for generation
        if (!scene.generatedChunks.has(ck)) {
          scene.generatedChunks.add(ck);
          scene.pendingChunks.push({ cx: cx + dx, cy: cy + dy });
        }
      }
    }
    // Sort by distance to player chunk so nearest chunks render first
    scene.pendingChunks.sort((a, b) =>
      ((a.cx - cx) ** 2 + (a.cy - cy) ** 2) - ((b.cx - cx) ** 2 + (b.cy - cy) ** 2)
    );

    // Destroy distant chunk images; textures stay cached a while longer for
    // instant re-creation, then go too (a 1024² HD chunk is 4 MB, and the
    // generators are deterministic so a far chunk simply regenerates).
    const cullRadius = radius + 3;
    const textureCullRadius = cullRadius + 3;
    for (const [key, img] of scene.chunkImages) {
      const [kcx, kcy] = key.split(',').map(Number);
      if (Math.abs(kcx - cx) > cullRadius || Math.abs(kcy - cy) > cullRadius) {
        (img as ChunkImage)._woods?.destroy();
        img.destroy();
        scene.chunkImages.delete(key);
      }
    }
    for (const key of scene.generatedChunks) {
      const [kcx, kcy] = key.split(',').map(Number);
      if (Math.abs(kcx - cx) > textureCullRadius || Math.abs(kcy - cy) > textureCullRadius) {
        const texKey = `gnd_chunk_${terrainKey}_${kcx}_${kcy}`;
        if (scene.textures.exists(texKey)) scene.textures.remove(texKey);
        if (scene.textures.exists(`${texKey}_woods`)) scene.textures.remove(`${texKey}_woods`);
        scene.generatedChunks.delete(key);
      }
    }
  }

  /**
   * Process pending chunks with a time budget.
   * @param budgetMs max milliseconds to spend (0 = unlimited, process all)
   */
  processChunkQueue(budgetMs: number) {
    const scene = this.scene;
    const cs = CFG.chunkSize;
    const tile = CFG.tile;
    const chunkPx = cs * tile;
    const start = performance.now();
    // Hard cap: at most 1 chunk per frame when budgeted (river chunks are expensive)
    const maxPerFrame = budgetMs > 0 ? 1 : Infinity;
    let processed = 0;
    while (scene.pendingChunks.length > 0 && processed < maxPerFrame) {
      // Time-budget check (skip on unlimited/startup)
      if (budgetMs > 0 && performance.now() - start >= budgetMs) break;
      const { cx: ccx, cy: ccy } = scene.pendingChunks.shift()!;
      const texKey = createGroundChunk(scene, ccx, ccy, cs, 32, scene.biome);
      this.addChunkImages(ccx, ccy, texKey);
      // Generate trees for this chunk if forest biome
      if (scene.biome === 'forest' || scene.biome === 'infected') this.placeTreesInChunk(ccx, ccy);
      if (scene.biome === 'castle') this.placeSpikesInChunk(ccx, ccy);
      if (scene.biome === 'desert') {
        this.placeCactusInChunk(ccx, ccy);
        if (scene.levelId === 7) this.placeQuicksandInChunk(ccx, ccy);
        if (scene.levelId === 8) this.placeTempleBlocksInChunk(ccx, ccy);
      }
      // Generate river terrain blockers
      if (scene.biome === 'river') this.placeRiverInChunk(ccx, ccy);
      processed++;
    }
  }

  /** The biome part of ground texture keys; the River's carries the run's layout seed. */
  private terrainKey(): string {
    const scene = this.scene;
    return scene.biome === 'desert' ? `${scene.biome}_${scene.levelId}`
         : scene.biome === 'river' ? `river_${scene.riverNet?.seed ?? 0}`
         : scene.biome;
  }

  /**
   * Shows a generated chunk: the ground image, and in the River biome the
   * chunk's woods overlay above it. HD ground textures are 2 px per world
   * px; both display from the world extent so every density lands the same.
   * The overlay sits at the depth of the chunk's bottom edge, so anything on
   * the ground inside the chunk draws behind the crowns, and flyers (lifted
   * by DepthSortSystem) draw over them.
   */
  private addChunkImages(ccx: number, ccy: number, texKey: string): void {
    const scene = this.scene;
    const chunkPx = CFG.chunkSize * CFG.tile;
    const wx = ccx * chunkPx + chunkPx / 2, wy = ccy * chunkPx + chunkPx / 2;
    const img = scene.add.image(wx, wy, texKey).setDepth(-1000).setDisplaySize(chunkPx, chunkPx) as ChunkImage;
    if (scene.biome === 'river' && scene.riverNet) {
      const woodsKey = `${texKey}_woods`;
      if (!scene.textures.exists(woodsKey)) {
        const canvas = drawRiverWoodsChunk(scene.riverNet, ccx, ccy, CFG.chunkSize);
        if (canvas) scene.textures.addCanvas(woodsKey, canvas);
      }
      if (scene.textures.exists(woodsKey)) {
        img._woods = scene.add.image(wx, wy, woodsKey)
          .setDisplaySize(chunkPx, chunkPx)
          .setDepth(100 + (ccy + 1) * chunkPx * 0.1);
      }
    }
    scene.chunkImages.set(`${ccx},${ccy}`, img);
  }

  /**
   * Destroy a tree tile at grid coords, removing its blocker and sprite.
   * PNG-mode trees are tagged per tile (_gx/_gy) so only that tile's trees
   * go. Baked clusters are one image per cluster (tagged with _tiles), so
   * the image goes and every tile it covered is freed with it; freeing only
   * the hit tile left the rest of the cluster as invisible blockers.
   */
  destroyTreeTile(gx: number, gy: number) {
    const scene = this.scene;
    const t = CFG.tile;
    const free = new Map<string, { gx: number; gy: number }>();
    free.set(`${gx},${gy}`, { gx, gy });

    for (let i = scene.treeSprites.length - 1; i >= 0; i--) {
      const spr = scene.treeSprites[i] as Phaser.GameObjects.Image & {
        _gx?: number; _gy?: number; _tiles?: { gx: number; gy: number }[];
      };
      let hit = false;
      if (spr._tiles) {
        hit = spr._tiles.some(tile => tile.gx === gx && tile.gy === gy);
        if (hit) for (const tile of spr._tiles) free.set(`${tile.gx},${tile.gy}`, tile);
      } else {
        hit = spr._gx === gx && spr._gy === gy;
      }
      if (hit) {
        spr.destroy();
        scene.treeSprites.splice(i, 1);
      }
    }

    const blockers = scene.wallGroup.getChildren();
    for (const tile of free.values()) {
      if (gridGet(scene.grid, tile.gx, tile.gy) !== 3) continue;
      gridSet(scene.grid, tile.gx, tile.gy, 0);
      scene.pathing.syncWallTile(tile.gx, tile.gy, false);
      const wx = tile.gx * t + t / 2;
      const wy = tile.gy * t + t / 2;
      for (const child of blockers) {
        if (Math.abs((child as any).x - wx) < 2 && Math.abs((child as any).y - wy) < 2) {
          child.destroy();
          break;
        }
      }
    }

    scene.gridVersion++; scene._wallCheckCache.clear();
    scene.pathing.rebuildGapBlockers();
  }

  // ---------- RIVER TERRAIN (river biome) ----------
  /**
   * Marks the seeded layout's tiles in this chunk: water and woods block
   * the player (collision tilemap) and ground pathing, bridge decks are
   * walkable but unbuildable. Flyers ignore all of it. No sprites: the
   * water and bridges are baked into the ground chunk and the trees into
   * the chunk's woods overlay.
   */
  placeRiverInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const net = scene.riverNet;
    if (!net) return;
    const chunkKey = `${cx},${cy}`;
    if (scene.riverChunksGenerated.has(chunkKey)) return;
    scene.riverChunksGenerated.add(chunkKey);

    const cs = CFG.chunkSize;
    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;

    for (let ty = 0; ty < cs; ty++) {
      for (let tx = 0; tx < cs; tx++) {
        const gx = chunkTileX + tx;
        const gy = chunkTileY + ty;
        const kind = net.tileKind(gx, gy);
        if (kind === RIVER_TILE_WATER || kind === RIVER_TILE_WOODS) {
          gridSet(scene.grid, gx, gy, kind);
          scene.pathing.syncWallTile(gx, gy, true);
        } else if (kind === RIVER_TILE_BRIDGE) {
          gridSet(scene.grid, gx, gy, RIVER_TILE_BRIDGE);
        }
      }
    }
    // Don't bump gridVersion here — river terrain is static and shouldn't
    // force all enemies to recalculate paths on every chunk load.
  }

  // ---------- RIVER FLOW (streaks sliding downstream, foam in the rapids) ----------
  /** Makes the two small FX textures once: a pale streak and a soft foam puff, drawn at HD and shown at half scale. */
  private ensureRiverFlowTextures(): void {
    const scene = this.scene;
    if (scene.textures.exists('river_flow_streak')) return;
    const streak = document.createElement('canvas');
    streak.width = 32; streak.height = 6;
    const sc = streak.getContext('2d')!;
    sc.strokeStyle = '#ffffff'; sc.lineCap = 'round';
    sc.lineWidth = 2; sc.globalAlpha = 1;
    sc.beginPath(); sc.moveTo(2, 2.5); sc.lineTo(30, 2.5); sc.stroke();
    sc.lineWidth = 1; sc.globalAlpha = 0.6;
    sc.beginPath(); sc.moveTo(6, 4.5); sc.lineTo(24, 4.5); sc.stroke();
    scene.textures.addCanvas('river_flow_streak', streak);
    const foam = document.createElement('canvas');
    foam.width = 14; foam.height = 14;
    const fc = foam.getContext('2d')!;
    const grad = fc.createRadialGradient(7, 7, 1, 7, 7, 7);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    fc.fillStyle = grad;
    fc.fillRect(0, 0, 14, 14);
    scene.textures.addCanvas('river_flow_foam', foam);
  }

  /**
   * Ambient flow over the water: short pale streaks spawn on river samples
   * in view and slide downstream, re-reading the current each frame so they
   * follow the bends; white foam puffs pulse in the rapids. Everything is
   * tinted to the water palette and sits just above the ground.
   */
  updateRiverFlow(delta: number) {
    const scene = this.scene;
    const net = scene.riverNet;
    if (!net || net.samples.length === 0) return;
    this.ensureRiverFlowTextures();
    const cam = scene.cameras.main;
    const camL = cam.scrollX - 40, camR = cam.scrollX + cam.width + 40;
    const camT = cam.scrollY - 40, camB = cam.scrollY + cam.height + 40;
    const MAX = 36, SPEED = 0.045; // world px per ms downstream

    scene.squiggleTimer -= delta;
    if (scene.squiggleTimer <= 0 && scene.riverSquiggles.length < MAX) {
      scene.squiggleTimer = 70;
      for (let tries = 0; tries < 6; tries++) {
        const s = net.samples[Math.floor(Math.random() * net.samples.length)];
        if (s.x < camL || s.x > camR || s.y < camT || s.y > camB) continue;
        const lane = (Math.random() - 0.5) * 1.5 * s.hw;
        const x = s.x - s.ty * lane, y = s.y + s.tx * lane;
        const foam = s.rapids && Math.random() < 0.5;
        const sprite = scene.add.image(x, y, foam ? 'river_flow_foam' : 'river_flow_streak')
          .setDepth(-999).setAlpha(0).setRotation(Math.atan2(s.ty, s.tx))
          .setScale(foam ? 0.4 + Math.random() * 0.4 : 0.5)
          .setTint(foam || s.rapids ? 0xeef7f5 : 0x8fcfd6);
        scene.riverSquiggles.push({ sprite, age: 0, life: 1800 + Math.random() * 1400, dx: s.tx * SPEED, dy: s.ty * SPEED });
        break;
      }
    }

    for (let i = scene.riverSquiggles.length - 1; i >= 0; i--) {
      const sq = scene.riverSquiggles[i];
      sq.age += delta;
      sq.sprite.x += sq.dx * delta;
      sq.sprite.y += sq.dy * delta;
      const sx = sq.sprite.x, sy = sq.sprite.y;
      const q = net.query(sx, sy);
      if (sq.age >= sq.life || q.d < 3 || sx < camL - 80 || sx > camR + 80 || sy < camT - 80 || sy > camB + 80) {
        sq.sprite.destroy();
        scene.riverSquiggles.splice(i, 1);
        continue;
      }
      // follow the current
      sq.dx = q.tx * SPEED; sq.dy = q.ty * SPEED;
      sq.sprite.setRotation(Math.atan2(q.ty, q.tx));
      const t = sq.age / sq.life;
      const fade = Math.sin(Math.PI * t);
      const foam = sq.sprite.texture.key === 'river_flow_foam';
      if (foam) sq.sprite.setScale(0.5 + 0.35 * Math.sin(sq.age * 0.012));
      sq.sprite.setAlpha(fade * (foam ? 0.85 : q.rapids ? 0.7 : 0.45));
    }
  }

  // ---------- TREE OBSTACLES (forest biome) ----------
  /** Place tree clusters in a single chunk. Deterministic per chunk coords + treeSeed. */
  placeTreesInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const chunkKey = `${cx},${cy}`;
    if (scene.treeChunksGenerated.has(chunkKey)) return;
    scene.treeChunksGenerated.add(chunkKey);

    const t = CFG.tile;
    const cs = CFG.chunkSize; // tiles per chunk
    const clustersPerChunk = 2; // target clusters per chunk
    const maxAttempts = clustersPerChunk * 6;

    // Deterministic RNG for this chunk (same treeSeed + chunk coords = same trees)
    let seed = ((scene.treeSeed + cx * 73856093 + cy * 19349669) >>> 0) || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const ptx = Math.floor(scene.player.x / t);
    const pty = Math.floor(scene.player.y / t);
    // Only do pathfinding checks near spawn (within spawnDist + margin)
    const nearSpawn = Math.abs(cx * cs) < scene.spawnDist + cs && Math.abs(cy * cs) < scene.spawnDist + cs;

    // Chunk tile origin
    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;

    let placed = 0;
    let attempts = 0;
    while (placed < clustersPerChunk && attempts < maxAttempts) {
      attempts++;
      const pattern = TREE_PATTERNS[Math.floor(rng() * TREE_PATTERNS.length)];
      // Random tile within this chunk
      const ox = chunkTileX + Math.floor(rng() * (cs - pattern.w));
      const oy = chunkTileY + Math.floor(rng() * (cs - pattern.h));

      // Don't place too close to player spawn
      if (Math.abs(ox) < 3 && Math.abs(oy) < 3) continue;

      // Check all tiles in pattern are free
      let blocked = false;
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        if (gridGet(scene.grid, gx, gy) !== 0) { blocked = true; break; }
        if (Math.abs(gx - ptx) <= 1 && Math.abs(gy - pty) <= 1) { blocked = true; break; }
      }
      if (blocked) continue;

      // Tentatively place on grid
      for (const tile of pattern.tiles) {
        gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 3);
      }

      // Pathfinding check only near spawn area
      if (nearSpawn && !canReachFromSpawnDirections(scene.grid, ptx, pty, scene.spawnDist, 3)) {
        for (const tile of pattern.tiles) {
          gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 0);
        }
        continue;
      }

      // Place cluster sprite. PNG mode (per-tile placement) when override
      // PNGs exist for this biome; otherwise fall back to the pre-baked
      // single-image-per-cluster procedural texture.
      const patIdx = TREE_PATTERNS.indexOf(pattern);
      const sprX = ox * t + (pattern.w * t) / 2;
      const sprY = oy * t + (pattern.h * t) / 2;
      const bottomY = oy * t + pattern.h * t;
      const cfg = scene.biome === 'infected' ? INFECTED_PLANT_CLUSTER_CONFIG : TREE_CLUSTER_CONFIG;
      if (cfg.pngCount > 0) {
        this.placePngCluster(pattern, ox, oy, t, rng, cfg);
      } else {
        const texKey = scene.biome === 'infected' ? `infected_plant_${patIdx}` : `tree_cluster_${patIdx}`;
        // clusters are HD (64 px per tile) and display at half scale
        const spr = scene.add.image(sprX, sprY, texKey).setScale(0.5).setDepth(100 + bottomY * 0.1);
        // One image covers the whole cluster, so remember which tiles it
        // stands for: destroying it has to free all of them (destroyTreeTile).
        (spr as any)._tiles = pattern.tiles.map(tile => ({ gx: ox + tile.dx, gy: oy + tile.dy }));
        scene.treeSprites.push(spr);
      }

      // Place per-tile collision blockers
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        const wx = gx * t + t / 2;
        const wy = gy * t + t / 2;

        const blocker = scene.add.zone(wx, wy, t, t);
        scene.physics.add.existing(blocker, true);
        (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(t, t);
        (blocker.body as Phaser.Physics.Arcade.StaticBody).position.set(wx - t / 2, wy - t / 2);
        scene.wallGroup.add(blocker);

        scene.pathing.syncWallTile(gx, gy, true);
      }
      placed++;
    }
  }

  /**
   * Render a tree / infected-plant cluster from individual per-tile PNG
   * sprites instead of one baked cluster image. Driven by a biome-specific
   * ClusterConfig — forest trees and infected plants pass independent
   * configs (densities, scale targets, tints, jitter) but share this loop.
   */
  private placePngCluster(
    pattern: ClusterPattern,
    ox: number,
    oy: number,
    t: number,
    rng: () => number,
    cfg: ClusterConfig,
  ): void {
    const scene = this.scene;
    for (const tile of pattern.tiles) {
      const gx = ox + tile.dx, gy = oy + tile.dy;
      const tileCx = gx * t + t / 2;
      const tileCy = gy * t + t * cfg.trunkYFraction;
      // Cluster tiles are path blockers, so leaving a tile without a sprite
      // would create an invisible wall. Floor of 1 guards against any config
      // that sums to less than 1 sprite per tile.
      const count = Math.max(1, cfg.perTileBase + (rng() < cfg.perTileExtraChance ? 1 : 0));
      for (let i = 0; i < count; i++) {
        const jx = (rng() - 0.5) * t * cfg.jitterXFraction;
        const jy = (rng() - 0.5) * t * cfg.jitterYFraction;
        const variant = Math.floor(rng() * cfg.pngCount);
        const key = cfg.pngKey(variant)!;
        const pngH = (scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement).height || 1;
        const variantScale = cfg.variantScales?.[variant] ?? 1;
        const baseScale = (cfg.targetWorldHeight / pngH) * variantScale;
        const scale = baseScale * (1 - cfg.scaleJitter + rng() * cfg.scaleJitter * 2);
        const spriteX = tileCx + jx;
        const spriteY = tileCy + jy;
        const spr = scene.add.sprite(spriteX, spriteY, key)
          .setOrigin(0.5, 1.0)
          .setScale(scale)
          .setDepth(100 + spriteY * 0.1);
        if (rng() > 0.5) spr.setFlipX(true);
        const tint = cfg.tints[Math.floor(rng() * cfg.tints.length)];
        if (tint !== 0xffffff) spr.setTint(tint);
        (spr as any)._gx = gx;
        (spr as any)._gy = gy;
        scene.treeSprites.push(spr);
      }
    }
  }

  /**
   * Castle floor spikes — same deterministic chunk generator as trees,
   * but spikes block enemy pathing only (grid value 6) without joining
   * wallGroup, so the player can walk through and take damage.
   */
  placeSpikesInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const chunkKey = `${cx},${cy}`;
    if (scene.spikeChunksGenerated.has(chunkKey)) return;
    scene.spikeChunksGenerated.add(chunkKey);

    const t = CFG.tile;
    const cs = CFG.chunkSize;
    const spikesPerChunk = 4; // a touch denser than tree clusters
    const maxAttempts = spikesPerChunk * 6;

    // Independent seed from trees so swapping biomes doesn't reuse layouts.
    let seed = ((scene.treeSeed * 2654435761 + cx * 73856093 + cy * 19349669 + 31337) >>> 0) || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const ptx = Math.floor(scene.player.x / t);
    const pty = Math.floor(scene.player.y / t);
    const nearSpawn = Math.abs(cx * cs) < scene.spawnDist + cs && Math.abs(cy * cs) < scene.spawnDist + cs;

    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;

    let placed = 0;
    let attempts = 0;
    while (placed < spikesPerChunk && attempts < maxAttempts) {
      attempts++;
      const pattern = SPIKE_PATTERNS[Math.floor(rng() * SPIKE_PATTERNS.length)];
      const ox = chunkTileX + Math.floor(rng() * (cs - pattern.w));
      const oy = chunkTileY + Math.floor(rng() * (cs - pattern.h));

      // Don't place too close to player spawn
      if (Math.abs(ox) < 3 && Math.abs(oy) < 3) continue;

      // All target tiles must be empty AND not adjacent to player spawn
      let blocked = false;
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        if (gridGet(scene.grid, gx, gy) !== 0) { blocked = true; break; }
        if (Math.abs(gx - ptx) <= 1 && Math.abs(gy - pty) <= 1) { blocked = true; break; }
      }
      if (blocked) continue;

      // Tentatively mark as obstacles (grid value 6 = spike)
      for (const tile of pattern.tiles) {
        gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 6);
      }

      // Don't strangle pathing near spawn — same check trees use.
      if (nearSpawn && !canReachFromSpawnDirections(scene.grid, ptx, pty, scene.spawnDist, 3)) {
        for (const tile of pattern.tiles) {
          gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 0);
        }
        continue;
      }

      // Per-tile spike sprite (no wallGroup → player walks through). Each
      // tile within a cluster picks its own jitter variant so a 3-tile
      // strip doesn't look stamped.
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        const wx = gx * t + t / 2;
        const wy = gy * t + t / 2;
        const variant = Math.floor(rng() * SPIKE_VARIANT_COUNT);
        const spr = scene.add.image(wx, wy, `castle_spikes_${variant}`).setDepth(100 + wy * 0.1);
        scene.spikeSprites.push(spr);
      }
      placed++;
    }
  }

  destroyDesertObstacleTile(gx: number, gy: number) {
    const scene = this.scene;
    const v = gridGet(scene.grid, gx, gy);
    if (v !== 7 && v !== 9) return;
    const t = CFG.tile;
    gridSet(scene.grid, gx, gy, 0);
    scene.pathing.syncWallTile(gx, gy, false);
    const wx = gx * t + t / 2;
    const wy = gy * t + t / 2;
    for (const child of scene.wallGroup.getChildren()) {
      if (Math.abs((child as any).x - wx) < 2 && Math.abs((child as any).y - wy) < 2) {
        child.destroy();
        break;
      }
    }
    const sprites = v === 7 ? scene.cactusSprites : scene.templeBlockSprites;
    for (let i = sprites.length - 1; i >= 0; i--) {
      const spr = sprites[i] as Phaser.GameObjects.Image & { _gx?: number; _gy?: number };
      if (spr._gx === gx && spr._gy === gy) {
        spr.destroy();
        sprites.splice(i, 1);
      }
    }
    scene.gridVersion++;
    scene._wallCheckCache.clear();
    scene.pathing.rebuildGapBlockers();
  }

  placeCactusInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const chunkKey = `${cx},${cy}`;
    if (scene.cactusChunksGenerated.has(chunkKey)) return;
    scene.cactusChunksGenerated.add(chunkKey);

    const t = CFG.tile;
    const cs = CFG.chunkSize;
    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;
    const clustersPerChunk = scene.levelId === 6 ? 8 : scene.levelId === 8 ? 1 : 2;
    const maxAttempts = clustersPerChunk * 8;
    let seed = ((scene.treeSeed * 2246822519 + cx * 73856093 + cy * 19349669 + 7001) >>> 0) || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const ptx = Math.floor(scene.player.x / t);
    const pty = Math.floor(scene.player.y / t);
    const nearSpawn = Math.abs(cx * cs) < scene.spawnDist + cs && Math.abs(cy * cs) < scene.spawnDist + cs;
    const makeCactusBlobPattern = (): ClusterPattern => {
      for (let shapeAttempt = 0; shapeAttempt < 16; shapeAttempt++) {
        const targetTiles = 3 + Math.floor(rng() * 4);
        const tiles = [{ dx: 0, dy: 0 }];
        const seen = new Set(['0,0']);
        let guard = 0;
        while (tiles.length < targetTiles && guard < targetTiles * 14) {
          guard++;
          const base = tiles[Math.floor(rng() * tiles.length)];
          const dir = Math.floor(rng() * 4);
          const dx = base.dx + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
          const dy = base.dy + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
          const key = `${dx},${dy}`;
          if (seen.has(key)) continue;
          const nextMinX = Math.min(dx, ...tiles.map(tile => tile.dx));
          const nextMaxX = Math.max(dx, ...tiles.map(tile => tile.dx));
          const nextMinY = Math.min(dy, ...tiles.map(tile => tile.dy));
          const nextMaxY = Math.max(dy, ...tiles.map(tile => tile.dy));
          if (nextMaxX - nextMinX > 2 || nextMaxY - nextMinY > 2) continue;
          seen.add(key);
          tiles.push({ dx, dy });
        }
        const minX = Math.min(...tiles.map(tile => tile.dx));
        const minY = Math.min(...tiles.map(tile => tile.dy));
        const normalized = tiles.map(tile => ({ dx: tile.dx - minX, dy: tile.dy - minY }));
        const w = Math.max(...normalized.map(tile => tile.dx)) + 1;
        const h = Math.max(...normalized.map(tile => tile.dy)) + 1;
        const isLine = w === 1 || h === 1;
        const isFilledRect = normalized.length === w * h;
        if (isLine || isFilledRect) continue;
        const tileSet = new Set(normalized.map(tile => `${tile.dx},${tile.dy}`));
        const filled = normalized.slice();
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (tileSet.has(`${x},${y}`)) continue;
            const up = y > 0 && tileSet.has(`${x},${y - 1}`);
            const dn = y < h - 1 && tileSet.has(`${x},${y + 1}`);
            const lf = x > 0 && tileSet.has(`${x - 1},${y}`);
            const rt = x < w - 1 && tileSet.has(`${x + 1},${y}`);
            if (up && dn && lf && rt) filled.push({ dx: x, dy: y });
          }
        }
        return { tiles: filled, w, h };
      }
      return { tiles: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }], w: 2, h: 2 };
    };

    let placed = 0;
    let attempts = 0;
    while (placed < clustersPerChunk && attempts < maxAttempts) {
      attempts++;
      const pattern = makeCactusBlobPattern();
      const ox = chunkTileX + Math.floor(rng() * (cs - pattern.w));
      const oy = chunkTileY + Math.floor(rng() * (cs - pattern.h));
      if (Math.abs(ox) < 4 && Math.abs(oy) < 4) continue;
      let blocked = false;
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        if (gridGet(scene.grid, gx, gy) !== 0) { blocked = true; break; }
        if (Math.abs(gx - ptx) <= 1 && Math.abs(gy - pty) <= 1) { blocked = true; break; }
      }
      if (blocked) continue;
      for (const tile of pattern.tiles) gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 7);
      if (nearSpawn && !canReachFromSpawnDirections(scene.grid, ptx, pty, scene.spawnDist, 3)) {
        for (const tile of pattern.tiles) gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 0);
        continue;
      }
      for (const tile of pattern.tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        const wx = gx * t + t / 2;
        const wy = gy * t + t / 2;
        const blocker = scene.add.zone(wx, wy, t, t);
        scene.physics.add.existing(blocker, true);
        (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(t, t);
        (blocker.body as Phaser.Physics.Arcade.StaticBody).position.set(wx - t / 2, wy - t / 2);
        scene.wallGroup.add(blocker);
        scene.pathing.syncWallTile(gx, gy, true);
        const variant = Math.floor(rng() * CACTUS_VARIANT_COUNT);
        const spr = scene.add.image(wx, wy + t * 0.1, `desert_cactus_${variant}`)
          .setDepth(100 + wy * 0.1);
        (spr as any)._gx = gx;
        (spr as any)._gy = gy;
        scene.cactusSprites.push(spr);
      }
      placed++;
    }
  }

  placeQuicksandInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const chunkKey = `${cx},${cy}`;
    if (scene.quicksandChunksGenerated.has(chunkKey)) return;
    scene.quicksandChunksGenerated.add(chunkKey);

    const t = CFG.tile;
    const cs = CFG.chunkSize;
    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;
    const poolsPerChunk = 2;
    let seed = ((scene.treeSeed * 1103515245 + cx * 73856093 + cy * 19349669 + 8803) >>> 0) || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const ptx = Math.floor(scene.player.x / t);
    const pty = Math.floor(scene.player.y / t);
    const nearSpawn = Math.abs(cx * cs) < scene.spawnDist + cs && Math.abs(cy * cs) < scene.spawnDist + cs;
    let placed = 0;
    let attempts = 0;

    const makeQuicksandPattern = (): ClusterPattern => {
      for (let shapeAttempt = 0; shapeAttempt < 16; shapeAttempt++) {
        const targetTiles = 5 + Math.floor(rng() * 4);
        const tiles = [{ dx: 0, dy: 0 }];
        const seen = new Set(['0,0']);
        let guard = 0;
        while (tiles.length < targetTiles && guard < targetTiles * 14) {
          guard++;
          const base = tiles[Math.floor(rng() * tiles.length)];
          const dir = Math.floor(rng() * 4);
          const dx = base.dx + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
          const dy = base.dy + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
          const key = `${dx},${dy}`;
          if (seen.has(key)) continue;
          const nextMinX = Math.min(dx, ...tiles.map(tile => tile.dx));
          const nextMaxX = Math.max(dx, ...tiles.map(tile => tile.dx));
          const nextMinY = Math.min(dy, ...tiles.map(tile => tile.dy));
          const nextMaxY = Math.max(dy, ...tiles.map(tile => tile.dy));
          if (nextMaxX - nextMinX > 3 || nextMaxY - nextMinY > 3) continue;
          seen.add(key);
          tiles.push({ dx, dy });
        }

        const minX = Math.min(...tiles.map(tile => tile.dx));
        const minY = Math.min(...tiles.map(tile => tile.dy));
        const normalized = tiles.map(tile => ({ dx: tile.dx - minX, dy: tile.dy - minY }));
        const w = Math.max(...normalized.map(tile => tile.dx)) + 1;
        const h = Math.max(...normalized.map(tile => tile.dy)) + 1;
        const isLine = w === 1 || h === 1;
        const isFilledRect = normalized.length === w * h;
        if (!isLine && !isFilledRect) return { tiles: normalized, w, h };
      }
      return {
        tiles: [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 2, dy: 1 }, { dx: 1, dy: 2 }],
        w: 3,
        h: 3,
      };
    };

    let poolIndex = 0;
    const drawPool = (tiles: { dx: number; dy: number }[], ox: number, oy: number) => {
      let minDx = Infinity, maxDx = -Infinity, minDy = Infinity, maxDy = -Infinity;
      for (const tile of tiles) {
        minDx = Math.min(minDx, tile.dx);
        maxDx = Math.max(maxDx, tile.dx);
        minDy = Math.min(minDy, tile.dy);
        maxDy = Math.max(maxDy, tile.dy);
      }
      const pad = t * 0.4;
      const texW = Math.ceil((maxDx - minDx + 1) * t + pad * 2);
      const texH = Math.ceil((maxDy - minDy + 1) * t + pad * 2);
      const worldCx = (ox + (minDx + maxDx + 1) / 2) * t;
      const worldCy = (oy + (minDy + maxDy + 1) / 2) * t;
      const tileShapes = tiles.map(tile => ({
        tcx: (tile.dx - minDx + 0.5) * t + pad,
        tcy: (tile.dy - minDy + 0.5) * t + pad,
        w: t * (1.26 + rng() * 0.2),
        h: t * (1.26 + rng() * 0.2),
        r: t * (0.32 + rng() * 0.14),
        jx: (rng() - 0.5) * t * 0.18,
        jy: (rng() - 0.5) * t * 0.18,
      }));
      const rimBw = 2.5;
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xa98552, 1);
      for (const s of tileShapes) {
        const rw = s.w + rimBw * 2;
        const rh = s.h + rimBw * 2;
        g.fillRoundedRect(s.tcx - rw / 2 + s.jx, s.tcy - rh / 2 + s.jy, rw, rh, s.r + rimBw);
      }
      g.fillStyle(0x97744a, 1);
      for (const s of tileShapes) {
        g.fillRoundedRect(s.tcx - s.w / 2 + s.jx, s.tcy - s.h / 2 + s.jy, s.w, s.h, s.r);
      }
      g.lineStyle(1, 0x6f4f2a, 0.4);
      for (const tile of tiles) {
        const tcx = (tile.dx - minDx + 0.5) * t + pad;
        const tcy = (tile.dy - minDy + 0.5) * t + pad;
        const x = tcx + (rng() - 0.5) * t * 0.36;
        const y = tcy + (rng() - 0.5) * t * 0.28;
        g.lineBetween(x - t * (0.12 + rng() * 0.14), y, x + t * (0.12 + rng() * 0.14), y + (rng() - 0.5) * t * 0.08);
      }

      const texKey = `qs_${cx}_${cy}_${poolIndex++}`;
      if (scene.textures.exists(texKey)) scene.textures.remove(texKey);
      g.generateTexture(texKey, texW, texH);
      g.destroy();
      const img = scene.add.image(worldCx, worldCy, texKey).setOrigin(0.5).setDepth(1);
      scene.quicksandTextureKeys.push(texKey);

      const ripple = scene.add.graphics().setDepth(2);
      ripple.lineStyle(1, 0xd8b878, 0.45);
      for (const tile of tiles) {
        if (rng() > 0.65) continue;
        const tcx = (ox + tile.dx + 0.5) * t;
        const tcy = (oy + tile.dy + 0.5) * t;
        const wx = tcx + (rng() - 0.5) * t * 0.32;
        const wy = tcy + (rng() - 0.5) * t * 0.24;
        ripple.strokeEllipse(wx, wy, t * (0.24 + rng() * 0.12), t * (0.1 + rng() * 0.06));
      }
      scene.tweens.add({
        targets: ripple,
        alpha: { from: 0.45, to: 0.18 },
        duration: 1400 + Math.floor(rng() * 500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });

      scene.quicksandSprites.push(img, ripple);
    };

    while (placed < poolsPerChunk && attempts < poolsPerChunk * 8) {
      attempts++;
      const pattern = makeQuicksandPattern();
      const ox = chunkTileX + Math.floor(rng() * (cs - pattern.w));
      const oy = chunkTileY + Math.floor(rng() * (cs - pattern.h));
      if (Math.abs(ox) < 4 && Math.abs(oy) < 4) continue;
      const tiles = pattern.tiles;
      let blocked = false;
      for (const tile of tiles) {
        const gx = ox + tile.dx, gy = oy + tile.dy;
        if (gridGet(scene.grid, gx, gy) !== 0) { blocked = true; break; }
        if (Math.abs(gx - ptx) <= 1 && Math.abs(gy - pty) <= 1) { blocked = true; break; }
      }
      if (blocked) continue;
      for (const tile of tiles) gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 8);
      if (nearSpawn && !canReachFromSpawnDirections(scene.grid, ptx, pty, scene.spawnDist, 3)) {
        for (const tile of tiles) gridSet(scene.grid, ox + tile.dx, oy + tile.dy, 0);
        continue;
      }
      drawPool(tiles, ox, oy);
      placed++;
    }
  }

  placeTempleBlocksInChunk(cx: number, cy: number) {
    const scene = this.scene;
    const chunkKey = `${cx},${cy}`;
    if (scene.templeChunksGenerated.has(chunkKey)) return;
    scene.templeChunksGenerated.add(chunkKey);

    const t = CFG.tile;
    const cs = CFG.chunkSize;
    const chunkTileX = cx * cs;
    const chunkTileY = cy * cs;
    let seed = ((scene.treeSeed * 747796405 + cx * 73856093 + cy * 19349669 + 9919) >>> 0) || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const ptx = Math.floor(scene.player.x / t);
    const pty = Math.floor(scene.player.y / t);
    const nearSpawn = Math.abs(cx * cs) < scene.spawnDist + cs && Math.abs(cy * cs) < scene.spawnDist + cs;
    const candidates: { gx: number; gy: number }[] = [];
    for (let ty = 1; ty < cs - 1; ty++) {
      for (let tx = 1; tx < cs - 1; tx++) {
        const gx = chunkTileX + tx;
        const gy = chunkTileY + ty;
        if (Math.abs(gx) < 4 && Math.abs(gy) < 4) continue;
        const corridor = ((gx + Math.floor(gy / 2)) % 6 === 0) || ((gy + Math.floor(gx / 3)) % 7 === 0);
        if (corridor && rng() < 0.72) candidates.push({ gx, gy });
      }
    }
    let placed = 0;
    for (const { gx, gy } of candidates) {
      if (placed >= 34) break;
      if (gridGet(scene.grid, gx, gy) !== 0) continue;
      if (Math.abs(gx - ptx) <= 1 && Math.abs(gy - pty) <= 1) continue;
      gridSet(scene.grid, gx, gy, 9);
      if (nearSpawn && !canReachFromSpawnDirections(scene.grid, ptx, pty, scene.spawnDist, 3)) {
        gridSet(scene.grid, gx, gy, 0);
        continue;
      }
      const wx = gx * t + t / 2;
      const wy = gy * t + t / 2;
      const blocker = scene.add.zone(wx, wy, t, t);
      scene.physics.add.existing(blocker, true);
      (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(t, t);
      (blocker.body as Phaser.Physics.Arcade.StaticBody).position.set(wx - t / 2, wy - t / 2);
      scene.wallGroup.add(blocker);
      scene.pathing.syncWallTile(gx, gy, true);
      const spr = scene.add.image(wx, wy, `temple_block_${Math.floor(rng() * TEMPLE_BLOCK_VARIANT_COUNT)}`)
        .setDepth(100 + wy * 0.1);
      (spr as any)._gx = gx;
      (spr as any)._gy = gy;
      scene.templeBlockSprites.push(spr);
      placed++;
    }
  }
}
