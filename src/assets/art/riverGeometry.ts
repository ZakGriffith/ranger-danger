// Seeded layout for the River biome: a network of clearings cut through
// dense woods and joined by trails into a graph with loops (the spawn
// clearing is one node), with wandering rivers running through it all and
// wooden bridges planned wherever a room or trail would otherwise be cut
// off. The same network drives the ground drawer, the blocking tiles and the
// flow effects, so everything agrees to the pixel. No Phaser or DOM dependency.
//
// Units: world px (32 per tile) unless a name says tiles or HD.

export const RIVER_MAP_HALF_TILES = 200;      // the map is 400×400 tiles around the origin
export const BRIDGE_HALF_W = 32;              // a bridge is two tiles wide
export const BRIDGE_SHORE = 56;               // how far the deck reaches onto each bank
const TILE = 32;
const STEP = 40;                              // random-walk step between control points
const SAMPLE_PX = 8;                          // spline sampling along the centreline
const BUCKET = 128;                           // spatial hash cell for distance queries
const QUERY_REACH = 200;                      // samples farther than this (per axis) are skipped: they read as open land
const SPAWN_CLEAR = 4.5 * TILE;               // rivers steer clear of this radius at the origin
const RIVER_COUNT = 3;
const RIVER_GAP = 14 * TILE;                  // a river this close to another's bank turns in and joins it
const SELF_GAP = 8 * TILE;                    // a river keeps this far from its own earlier course (an oxbow neck)
const MEANDER_WAVE = 56;                      // steps per meander, about 70 tiles, so an oxbow loop is 20-odd tiles across
const MEANDER_MAX = 1.8;                      // peak heading swing in radians; past about 1.6 a bend loops back like an oxbow
const MAX_CURV = 0.2;                         // steering curvature, radians per step: a steered bend is never tighter than 6 tiles
const CURV_RATE = 0.05;                       // how fast steering can tighten or ease, per step
const SELF_TOUCH = 4.5 * TILE;                // closer than this to its own course, a river ends short rather than cross itself
const LOOKAHEAD = 5;                          // steps ahead that steering looks
const OTHERS_CLEAR = 24 * TILE;               // the other rivers keep out of this radius, so only the spawn river crosses the spawn clearing
const ANCHOR_CLEAR = RIVER_GAP * 1.5;         // the other rivers start at least this far from water
const BRIDGE_SPACING = 12 * TILE;             // least distance between any two bridges
const BRIDGE_SPACING_MIN = 8 * TILE;          // never closer than this, even to reconnect a region
const SLIVER_TILES = 40;                      // a land region smaller than this is not worth a bridge
const SITE_SPACING = 6;                       // samples between candidate bridge sites (1.5 tiles)
const BRIDGE_MIN_GAP = 40 * TILE;             // along a river, never longer than this without a crossing
const SPAWN_BRIDGE_MAX = 22 * TILE;           // the spawn river gets a bridge at most this far from the origin
export const MAP_RADIUS_TILES = 110;          // the network of clearings fits in this radius; solid woods beyond
const SPAWN_CLEARING_TILES = 20;              // radius of the clearing the player starts in
const CLEARING_RADIUS_TILES = [7, 14];        // size range of the other clearings
const CLEARING_COUNT = 16;                    // how many to try for
const WOODS_BAND_TILES = 8;                   // least woods between two clearings
const TRAIL_HALF_W_TILES = [1.0, 1.8];        // corridor half width range
const LANDING_R = 2.4 * TILE;                 // the corridor widens this much around a river crossing

export type RiverSample = {
  x: number; y: number;
  hw: number;              // half width of the water
  tx: number; ty: number;  // unit tangent, pointing downstream
  along: number;           // distance along the river from its source, px
  rapids: number;                             // white-water strength 0..1, ramping in and out over a few tiles
  river: number;
};

export type Bridge = {
  x: number; y: number;    // deck centre, on the river centreline
  nx: number; ny: number;  // unit direction across the river (the walking direction)
  halfLen: number;         // half the deck length: water half width + BRIDGE_SHORE
  river: number;
  along: number;
};

export type Clearing = {
  x: number; y: number;      // centre, world px
  r: number;                 // base radius, world px
  p1: number; p2: number;    // wobble phases
};

export type Corridor = {
  a: number; b: number;      // clearing indices
  pts: { x: number; y: number }[]; // centreline polyline, world px
  halfW: number;
};

export type RiverQuery = {
  d: number;               // signed distance to the water edge, positive inside the water
  sx: number; sy: number;  // the nearest centreline sample
  tx: number; ty: number;  // tangent of the nearest river
  along: number; hw: number; rapids: number; river: number;
};

/** Tile kinds the network reports, matching the grid values GameScene uses (woods = the tree value). */
export const RIVER_TILE_LAND = 0, RIVER_TILE_WOODS = 3, RIVER_TILE_WATER = 4, RIVER_TILE_BRIDGE = 5;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash1(i: number, seed: number): number {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h & 0xfffff) / 0xfffff;
}

/** Smooth 1-D value noise in 0..1. */
function noise1(t: number, seed: number): number {
  const i = Math.floor(t), f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i, seed) * (1 - u) + hash1(i + 1, seed) * u;
}

type Pt = { x: number; y: number };

export class RiverNet {
  readonly samples: RiverSample[] = [];
  readonly rivers: RiverSample[][] = [];
  readonly bridges: Bridge[] = [];
  readonly clearings: Clearing[] = [];
  readonly corridors: Corridor[] = [];
  /** 400×400 tile kinds (RIVER_TILE_*), row-major from tile (-200, -200). */
  readonly tiles: Uint8Array;
  private readonly buckets = new Map<number, number[]>();
  /**
   * Query index, rebuilt lazily after a river is added: the samples as flat
   * typed arrays, and for every bucket near a river the merged list of the
   * samples in its 3×3 neighbourhood, so a query is one lookup and one tight
   * loop over typed arrays.
   */
  private index: { x: Float32Array; y: Float32Array; tx: Float32Array; ty: Float32Array; hw: Float32Array; near: Map<number, Int32Array> } | null = null;

  constructor(readonly seed: number) {
    this.tiles = new Uint8Array(RIVER_MAP_HALF_TILES * 2 * RIVER_MAP_HALF_TILES * 2);
  }

  /** Signed distance into a clearing, world px, positive inside its wobbling edge. */
  static clearingDistance(c: Clearing, wx: number, wy: number): number {
    const dx = wx - c.x, dy = wy - c.y, theta = Math.atan2(dy, dx);
    const r = c.r * (1 + 0.2 * Math.sin(2 * theta + c.p1) + 0.12 * Math.sin(3 * theta + c.p2));
    return r - Math.hypot(dx, dy);
  }

  /** Signed distance into a corridor, world px, positive on it. */
  static corridorDistance(c: Corridor, wx: number, wy: number): number {
    let best = -Infinity;
    for (let i = 0; i < c.pts.length - 1; i++) {
      const a = c.pts[i], b = c.pts[i + 1];
      const abx = b.x - a.x, aby = b.y - a.y, len2 = abx * abx + aby * aby || 1;
      const t = Math.max(0, Math.min(1, ((wx - a.x) * abx + (wy - a.y) * aby) / len2));
      const d = c.halfW - Math.hypot(wx - (a.x + abx * t), wy - (a.y + aby * t));
      if (d > best) best = d;
    }
    return best;
  }

  /** Signed distance into the nearest clearing (any), world px. */
  clearingAt(wx: number, wy: number): number {
    let best = -Infinity;
    for (const c of this.clearings) {
      if (Math.abs(wx - c.x) > c.r * 1.5 || Math.abs(wy - c.y) > c.r * 1.5) continue;
      const d = RiverNet.clearingDistance(c, wx, wy);
      if (d > best) best = d;
    }
    return best;
  }

  /** Signed distance into the nearest clearing or corridor, world px: positive on open ground. */
  openAt(wx: number, wy: number): number {
    let best = this.clearingAt(wx, wy);
    for (const c of this.corridors) {
      const d = RiverNet.corridorDistance(c, wx, wy);
      if (d > best) best = d;
    }
    return best;
  }

  /** Lay out the clearings and the trails between them, carving both out of the woods. */
  private buildNetwork(rng: () => number): void {
    const cs = this.clearings;
    cs.push({ x: 0, y: 0, r: SPAWN_CLEARING_TILES * TILE, p1: rng() * Math.PI * 2, p2: rng() * Math.PI * 2 });
    // clearings: random placement with a band of woods kept between any two
    for (let attempt = 0; attempt < 600 && cs.length < CLEARING_COUNT + 1; attempt++) {
      const r = (CLEARING_RADIUS_TILES[0] + rng() * (CLEARING_RADIUS_TILES[1] - CLEARING_RADIUS_TILES[0])) * TILE;
      const a = rng() * Math.PI * 2, dist = Math.sqrt(rng()) * (MAP_RADIUS_TILES * TILE - r);
      const x = Math.cos(a) * dist, y = Math.sin(a) * dist;
      if (cs.some(c => Math.hypot(c.x - x, c.y - y) < c.r + r + WOODS_BAND_TILES * TILE)) continue;
      cs.push({ x, y, r, p1: rng() * Math.PI * 2, p2: rng() * Math.PI * 2 });
    }
    // edges: relative neighbourhood graph (loops, no long crossings) plus a spanning tree for safety
    const n = cs.length;
    const dist = (i: number, j: number) => Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y);
    const edges = new Set<string>();
    const key = (i: number, j: number) => i < j ? `${i},${j}` : `${j},${i}`;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dij = dist(i, j);
        let blocked = false;
        for (let k = 0; k < n && !blocked; k++) if (k !== i && k !== j && Math.max(dist(i, k), dist(j, k)) < dij) blocked = true;
        if (!blocked) edges.add(key(i, j));
      }
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    for (const e of edges) { const [i, j] = e.split(',').map(Number); parent[find(i)] = find(j); }
    const pairs: [number, number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([dist(i, j), i, j]);
    pairs.sort((p, q) => p[0] - q[0]);
    for (const [, i, j] of pairs) if (find(i) !== find(j)) { parent[find(i)] = find(j); edges.add(key(i, j)); }
    // corridors: a bent trail between the two centres, a bit wider or narrower each
    for (const e of edges) {
      const [i, j] = e.split(',').map(Number);
      const a = cs[i], b = cs[j];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, len = dist(i, j);
      const px = -(b.y - a.y) / len, py = (b.x - a.x) / len, off = (rng() - 0.5) * 0.5 * len;
      const halfW = (TRAIL_HALF_W_TILES[0] + rng() * (TRAIL_HALF_W_TILES[1] - TRAIL_HALF_W_TILES[0])) * TILE;
      this.corridors.push({ a: i, b: j, pts: [{ x: a.x, y: a.y }, { x: mx + px * off, y: my + py * off }, { x: b.x, y: b.y }], halfW });
    }
    // carve: clearings and corridors become open ground where there is no water
    const carve = (wx: number, wy: number) => {
      const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
      if (this.tileKind(tx, ty) === RIVER_TILE_WOODS) this.setTile(tx, ty, RIVER_TILE_LAND);
    };
    for (const c of cs) {
      const reach = c.r * 1.4;
      for (let ty = Math.floor((c.y - reach) / TILE); ty <= Math.ceil((c.y + reach) / TILE); ty++)
        for (let tx = Math.floor((c.x - reach) / TILE); tx <= Math.ceil((c.x + reach) / TILE); tx++)
          if (RiverNet.clearingDistance(c, tx * TILE + 16, ty * TILE + 16) > 0) carve(tx * TILE + 16, ty * TILE + 16);
    }
    for (const c of this.corridors) {
      const xs = c.pts.map(p => p.x), ys = c.pts.map(p => p.y), reach = c.halfW + LANDING_R;
      for (let ty = Math.floor((Math.min(...ys) - reach) / TILE); ty <= Math.ceil((Math.max(...ys) + reach) / TILE); ty++)
        for (let tx = Math.floor((Math.min(...xs) - reach) / TILE); tx <= Math.ceil((Math.max(...xs) + reach) / TILE); tx++)
          if (RiverNet.corridorDistance(c, tx * TILE + 16, ty * TILE + 16) > 0) carve(tx * TILE + 16, ty * TILE + 16);
      // where the trail meets a river it opens into a landing on both banks, so a bridge can sit there
      for (let i = 0; i < c.pts.length - 1; i++) {
        const a = c.pts[i], b = c.pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.ceil(len / 8);
        for (let k = 0; k <= steps; k++) {
          const x = a.x + (b.x - a.x) * k / steps, y = a.y + (b.y - a.y) * k / steps;
          if (this.farFromWater(x, y)) continue;
          const q = this.query(x, y);
          if (q.d < -(BRIDGE_SHORE + 20)) continue;
          for (let ty = Math.floor((y - LANDING_R) / TILE); ty <= Math.ceil((y + LANDING_R) / TILE); ty++)
            for (let tx = Math.floor((x - LANDING_R) / TILE); tx <= Math.ceil((x + LANDING_R) / TILE); tx++)
              if (Math.hypot(tx * TILE + 16 - x, ty * TILE + 16 - y) < LANDING_R) carve(tx * TILE + 16, ty * TILE + 16);
        }
      }
    }
  }

  // ---------------------------------------------------------------- build --

  addRiver(pts: Pt[], hwAt: (k: number) => number, rapidsAt: (k: number) => number): void {
    const river: RiverSample[] = [];
    const idx = this.rivers.length;
    let along = 0;
    // Catmull-Rom through the control points, sampled every SAMPLE_PX
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const n = Math.max(1, Math.round(segLen / SAMPLE_PX));
      for (let s = 0; s < n; s++) {
        const t = s / n, t2 = t * t, t3 = t2 * t;
        const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        const k = i + t;
        if (river.length) { const prev = river[river.length - 1]; along += Math.hypot(x - prev.x, y - prev.y); }
        river.push({ x, y, hw: hwAt(k), tx: 0, ty: 0, along, rapids: rapidsAt(k), river: idx });
      }
    }
    for (let i = 0; i < river.length; i++) {
      const a = river[Math.max(i - 1, 0)], b = river[Math.min(i + 1, river.length - 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      river[i].tx = (b.x - a.x) / len; river[i].ty = (b.y - a.y) / len;
    }
    // rapids ramp in and out: a triangular filter over 6 tiles each way, and the
    // channel narrows with the smoothed strength so the banks pinch in gradually
    const R = 24, raw = river.map(s => s.rapids);
    for (let i = 0; i < river.length; i++) {
      let sum = 0, wsum = 0;
      for (let j = -R; j <= R; j++) {
        const k = Math.max(0, Math.min(river.length - 1, i + j)), w = R + 1 - Math.abs(j);
        sum += raw[k] * w; wsum += w;
      }
      river[i].rapids = sum / wsum;
      river[i].hw *= 1 - 0.2 * river[i].rapids;
    }
    this.rivers.push(river);
    for (const s of river) {
      const id = this.samples.length;
      this.samples.push(s);
      const key = this.bucketKey(Math.floor(s.x / BUCKET), Math.floor(s.y / BUCKET));
      const list = this.buckets.get(key);
      if (list) list.push(id); else this.buckets.set(key, [id]);
    }
    this.index = null;
  }

  private bucketKey(bx: number, by: number): number { return (bx + 32768) * 65536 + (by + 32768); }

  private ensureIndex(): NonNullable<RiverNet['index']> {
    if (this.index) return this.index;
    const n = this.samples.length;
    const x = new Float32Array(n), y = new Float32Array(n), tx = new Float32Array(n), ty = new Float32Array(n), hw = new Float32Array(n);
    for (let i = 0; i < n; i++) { const s = this.samples[i]; x[i] = s.x; y[i] = s.y; tx[i] = s.tx; ty[i] = s.ty; hw[i] = s.hw; }
    const near = new Map<number, Int32Array>();
    for (const key of this.buckets.keys()) {
      const bx = Math.floor(key / 65536) - 32768, by = (key % 65536) - 32768;
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          const k = this.bucketKey(bx + ox, by + oy);
          if (near.has(k)) continue;
          const merged: number[] = [];
          for (let my = -1; my <= 1; my++)
            for (let mx = -1; mx <= 1; mx++) {
              const list = this.buckets.get(this.bucketKey(bx + ox + mx, by + oy + my));
              if (list) for (const id of list) merged.push(id);
            }
          near.set(k, Int32Array.from(merged));
        }
    }
    this.index = { x, y, tx, ty, hw, near };
    return this.index;
  }

  // ---------------------------------------------------------------- query --

  /** Nearest-river query. Cheap enough per frame; the drawer samples it on a grid. Far from any river it returns river -1 and d = -1e4. */
  query(wx: number, wy: number): RiverQuery {
    const idx = this.ensureIndex();
    const list = idx.near.get(this.bucketKey(Math.floor(wx / BUCKET), Math.floor(wy / BUCKET)));
    let best = -1, bestD = -1e9;
    if (list) {
      const X = idx.x, Y = idx.y, TX = idx.tx, TY = idx.ty, HW = idx.hw;
      for (let j = 0; j < list.length; j++) {
        const i = list[j];
        const dx = wx - X[i], dy = wy - Y[i];
        // samples beyond QUERY_REACH can only give d < -130 px, which nothing distinguishes from "far"
        if (dx > QUERY_REACH || dx < -QUERY_REACH || dy > QUERY_REACH || dy < -QUERY_REACH) continue;
        // distance to the sample's tangent line, clamped to the sample spacing
        let t = dx * TX[i] + dy * TY[i];
        if (t > SAMPLE_PX) t = SAMPLE_PX; else if (t < -SAMPLE_PX) t = -SAMPLE_PX;
        const ex = dx - TX[i] * t, ey = dy - TY[i] * t;
        const d = HW[i] - Math.sqrt(ex * ex + ey * ey);
        if (d > bestD) { bestD = d; best = i; }
      }
    }
    if (best < 0) return { d: -1e4, sx: 0, sy: 0, tx: 1, ty: 0, along: 0, hw: 0, rapids: 0, river: -1 };
    const s = this.samples[best];
    return { d: bestD, sx: s.x, sy: s.y, tx: s.tx, ty: s.ty, along: s.along, hw: s.hw, rapids: s.rapids, river: s.river };
  }

  /** True when no river sample lies within a bucket of the point: open land, no query needed. */
  /** Nearest water within reach of a point: signed distance into it and the centreline point there, or null. */
  nearWater(wx: number, wy: number, reach: number): { d: number; sx: number; sy: number } | null {
    const bx0 = Math.floor((wx - reach) / BUCKET), bx1 = Math.floor((wx + reach) / BUCKET);
    const by0 = Math.floor((wy - reach) / BUCKET), by1 = Math.floor((wy + reach) / BUCKET);
    let best: RiverSample | null = null, bestD = -Infinity;
    for (let by = by0; by <= by1; by++)
      for (let bx = bx0; bx <= bx1; bx++) {
        const list = this.buckets.get(this.bucketKey(bx, by));
        if (!list) continue;
        for (const id of list) {
          const s = this.samples[id];
          const d = s.hw - Math.hypot(wx - s.x, wy - s.y);
          if (d > bestD) { bestD = d; best = s; }
        }
      }
    return best && bestD > -reach ? { d: bestD, sx: best.x, sy: best.y } : null;
  }

  farFromWater(wx: number, wy: number): boolean {
    return !this.ensureIndex().near.has(this.bucketKey(Math.floor(wx / BUCKET), Math.floor(wy / BUCKET)));
  }

  /** The planned tile kind at a tile coordinate (RIVER_TILE_*). */
  tileKind(tx: number, ty: number): number {
    const mx = tx + RIVER_MAP_HALF_TILES, my = ty + RIVER_MAP_HALF_TILES;
    if (mx < 0 || my < 0 || mx >= RIVER_MAP_HALF_TILES * 2 || my >= RIVER_MAP_HALF_TILES * 2) return RIVER_TILE_LAND;
    return this.tiles[my * RIVER_MAP_HALF_TILES * 2 + mx];
  }

  /** Signed distance to the nearest bridge deck edge (positive on the deck), and that bridge. */
  bridgeAt(wx: number, wy: number): { d: number; bridge: Bridge } | null {
    let best: { d: number; bridge: Bridge } | null = null;
    for (const b of this.bridges) {
      const dx = wx - b.x, dy = wy - b.y;
      if (Math.abs(dx) > b.halfLen + BRIDGE_HALF_W || Math.abs(dy) > b.halfLen + BRIDGE_HALF_W) continue;
      const u = dx * b.nx + dy * b.ny, v = -dx * b.ny + dy * b.nx;
      const d = Math.min(b.halfLen - Math.abs(u), BRIDGE_HALF_W - Math.abs(v));
      if (!best || d > best.d) best = { d, bridge: b };
    }
    return best;
  }

  // ------------------------------------------------------- tiles & bridges --

  private waterTile(tx: number, ty: number): boolean {
    const bx = tx * TILE, by = ty * TILE;
    if (this.farFromWater(bx + 16, by + 16)) return false;
    let n = 0;
    for (let sy = 4; sy < TILE; sy += 8)
      for (let sx = 4; sx < TILE; sx += 8)
        if (this.query(bx + sx, by + sy).d > 0) n++;
    return n >= 4;
  }

  private setTile(tx: number, ty: number, kind: number): void {
    const mx = tx + RIVER_MAP_HALF_TILES, my = ty + RIVER_MAP_HALF_TILES;
    if (mx < 0 || my < 0 || mx >= RIVER_MAP_HALF_TILES * 2 || my >= RIVER_MAP_HALF_TILES * 2) return;
    this.tiles[my * RIVER_MAP_HALF_TILES * 2 + mx] = kind;
  }

  /** Classify every tile, then plan bridges so the land stays connected. */
  finish(rng: () => number): void {
    const H = RIVER_MAP_HALF_TILES, W = H * 2;
    // everything is woods or water until the network carves the open ground
    for (let ty = -H; ty < H; ty++)
      for (let tx = -H; tx < H; tx++)
        this.setTile(tx, ty, this.waterTile(tx, ty) ? RIVER_TILE_WATER : RIVER_TILE_WOODS);
    this.buildNetwork(rng);

    // land regions by flood fill (4-connected, like the player's movement)
    const region = new Int32Array(W * W).fill(-1);
    const regionSize: number[] = [];
    let regions = 0;
    const stack: number[] = [];
    for (let i = 0; i < W * W; i++) {
      if (this.tiles[i] !== RIVER_TILE_LAND || region[i] >= 0) continue;
      region[i] = regions; stack.push(i);
      let size = 0;
      while (stack.length) {
        const j = stack.pop()!;
        size++;
        const x = j % W, y = (j - x) / W;
        const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < W - 1 ? j + W : -1];
        for (const k of nb) if (k >= 0 && this.tiles[k] === RIVER_TILE_LAND && region[k] < 0) { region[k] = regions; stack.push(k); }
      }
      regionSize.push(size);
      regions++;
    }
    const regionAt = (wx: number, wy: number): number => {
      const mx = Math.floor(wx / TILE) + H, my = Math.floor(wy / TILE) + H;
      if (mx < 0 || my < 0 || mx >= W || my >= W) return -1;
      return this.tiles[my * W + mx] === RIVER_TILE_LAND ? region[my * W + mx] : -1;
    };

    // union-find over regions
    const parent = Array.from({ length: regions }, (_, i) => i);
    const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };

    // candidate sites: straight, calm, not too wide, dry land on both banks
    type Site = { s: RiverSample; nx: number; ny: number; ra: number; rb: number; dist: number };
    const sites: Site[] = [];
    for (const river of this.rivers) {
      const offset = Math.floor(rng() * SITE_SPACING);
      for (let i = offset + 8; i < river.length - 8; i += SITE_SPACING) {
        const s = river[i];
        if (s.rapids > 0.25 || s.hw > 70) continue;
        const a = river[i - 8], b = river[i + 8];
        if (a.tx * b.tx + a.ty * b.ty < 0.9) continue;
        const nx = -s.ty, ny = s.tx;
        const reach = s.hw + BRIDGE_SHORE + 8;
        const ax = s.x + nx * reach, ay = s.y + ny * reach, bx = s.x - nx * reach, by = s.y - ny * reach;
        if (this.query(ax, ay).d > -12 || this.query(bx, by).d > -12) continue;
        const ra = regionAt(ax, ay), rb = regionAt(bx, by);
        if (ra < 0 || rb < 0 || ra === rb) continue;
        if (regionSize[ra] < SLIVER_TILES || regionSize[rb] < SLIVER_TILES) continue;
        sites.push({ s, nx, ny, ra, rb, dist: Math.hypot(s.x, s.y) });
      }
    }
    sites.sort((p, q) => p.dist - q.dist);

    const lastAlong = new Map<number, number[]>();
    const accept = (site: Site) => {
      const { s } = site;
      parent[find(site.ra)] = find(site.rb);
      this.bridges.push({ x: s.x, y: s.y, nx: site.nx, ny: site.ny, halfLen: s.hw + BRIDGE_SHORE, river: s.river, along: s.along });
      const list = lastAlong.get(s.river) ?? []; list.push(s.along); lastAlong.set(s.river, list);
    };
    const nearestBridge = (site: Site) => this.bridges.reduce((m, b) => Math.min(m, Math.hypot(b.x - site.s.x, b.y - site.s.y)), Infinity);
    // pass 1: the spawn river gets a crossing close to the player before anything else
    const spawnSite = sites.find(site => site.s.river === 0 && site.dist <= SPAWN_BRIDGE_MAX);
    if (spawnSite) accept(spawnSite);
    // pass 2: join regions (nearest first), and never leave a long stretch without a
    // crossing, keeping every bridge BRIDGE_SPACING from the others
    for (const site of sites) {
      if (site === spawnSite || nearestBridge(site) < BRIDGE_SPACING) continue;
      const joins = find(site.ra) !== find(site.rb);
      const prior = lastAlong.get(site.s.river) ?? [];
      const gap = prior.reduce((m, a) => Math.min(m, Math.abs(a - site.s.along)), Infinity);
      if (joins || gap > BRIDGE_MIN_GAP) accept(site);
    }
    // pass 3: a region the spacing rule left cut off still gets its bridge, as long as the decks don't touch
    for (const site of sites)
      if (find(site.ra) !== find(site.rb) && nearestBridge(site) >= BRIDGE_SPACING_MIN) accept(site);
    // open ground that still cannot be reached from the spawn becomes woods
    const spawnRoot = find(regionAt(16, 16));
    for (let i = 0; i < W * W; i++)
      if (this.tiles[i] === RIVER_TILE_LAND && find(region[i]) !== spawnRoot) this.tiles[i] = RIVER_TILE_WOODS;
    // bridge decks: the water tiles under them become walkable, unbuildable bridge tiles
    for (const b of this.bridges) {
      const r = b.halfLen + BRIDGE_HALF_W;
      const tx0 = Math.floor((b.x - r) / TILE), tx1 = Math.ceil((b.x + r) / TILE);
      const ty0 = Math.floor((b.y - r) / TILE), ty1 = Math.ceil((b.y + r) / TILE);
      for (let ty = ty0; ty <= ty1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          const cx = tx * TILE + 16 - b.x, cy = ty * TILE + 16 - b.y;
          const u = cx * b.nx + cy * b.ny, v = -cx * b.ny + cy * b.nx;
          if (Math.abs(u) <= b.halfLen && Math.abs(v) <= BRIDGE_HALF_W && this.tileKind(tx, ty) === RIVER_TILE_WATER) this.setTile(tx, ty, RIVER_TILE_BRIDGE);
        }
    }
  }
}

/**
 * Walk a river out from an anchor in both directions. Its heading is the
 * course plus a meander wave whose amplitude drifts with noise, so most bends
 * are gentle and now and then one swells into an oxbow loop. Everything that
 * has to push the river about (the spawn, other rivers, its own earlier
 * course) does so through a curvature that can only change slowly, looking a
 * few steps ahead, so the river never kinks.
 */
function walkRiver(anchor: Pt, baseHeading: number, seed: number, net: RiverNet, clear: number): Pt[] {
  const half = (dir: number, s: number, others: Pt[]): Pt[] => {
    const pts: Pt[] = [];
    let x = anchor.x, y = anchor.y;
    let drift = 0, curv = 0, heading = baseHeading + dir;
    const wave = MEANDER_WAVE * (0.8 + noise1(0, s + 5) * 0.4), phase = noise1(0, s + 9) * Math.PI * 2;
    const limit = (RIVER_MAP_HALF_TILES + 8) * TILE;
    const turnTo = (toward: number) => Math.atan2(Math.sin(toward - heading), Math.cos(toward - heading));
    for (let k = 0; k < 2000; k++) {
      pts.push({ x, y });
      if (Math.abs(x) > limit || Math.abs(y) > limit) break;
      // a river that reaches water already placed joins it there, as a tributary
      if (k > 4) {
        const q = net.nearWater(x, y, RIVER_GAP);
        if (q && q.d > 0) { pts.push({ x: x + Math.cos(heading) * STEP, y: y + Math.sin(heading) * STEP }); break; }
      }
      // one about to cross its own course ends short of it instead, as a headwater
      let touch = false;
      for (let i = 0; i < pts.length - 12 && !touch; i++) touch = Math.hypot(x - pts[i].x, y - pts[i].y) < SELF_TOUCH;
      for (let i = 0; i < others.length - 12 && !touch; i++) touch = Math.hypot(x - others[i].x, y - others[i].y) < SELF_TOUCH;
      if (touch) { pts.length = Math.max(1, pts.length - 4); break; }
      // steering: each term asks for a turn, the sum becomes a curvature demand
      let want = 0;
      const ax = x + Math.cos(heading) * STEP * LOOKAHEAD, ay = y + Math.sin(heading) * STEP * LOOKAHEAD;
      // off the spawn clearing, which outranks joining the river that runs through it
      const nearSpawn = Math.hypot(ax, ay) < clear + 2.5 * TILE;
      if (nearSpawn) want += turnTo(Math.atan2(ay, ax));
      // within RIVER_GAP of another river: heading squarely at it, turn in and join cleanly;
      // running alongside, turn off to keep the gap
      if (k > 4 && !nearSpawn) {
        const q = net.nearWater(ax, ay, RIVER_GAP);
        if (q) {
          const toward = Math.atan2(q.sy - ay, q.sx - ax), turn = turnTo(toward);
          if (Math.abs(turn) < Math.PI * 0.35) want += turn * 0.5;
          else if (Math.abs(turn) < Math.PI * 0.75) want += turnTo(toward + Math.PI) * 0.5 * (1 + q.d / RIVER_GAP);
        }
      }
      // off its own earlier course, so a meander never cuts through the last one
      let selfD = SELF_GAP, sx = 0, sy = 0;
      const consider = (p: Pt) => { const d = Math.hypot(ax - p.x, ay - p.y); if (d < selfD) { selfD = d; sx = p.x; sy = p.y; } };
      for (let i = 0; i < pts.length - 12; i++) consider(pts[i]);
      for (let i = 0; i < others.length - 12; i++) consider(others[i]);
      if (selfD < SELF_GAP) want += turnTo(Math.atan2(ay - sy, ax - sx)) * 0.6 * (1 - selfD / SELF_GAP);
      const curvWant = Math.max(-MAX_CURV, Math.min(MAX_CURV, want * 0.3));
      curv += Math.max(-CURV_RATE, Math.min(CURV_RATE, curvWant - curv));
      drift += curv;
      // the meander wave rides on the steered course, which itself wanders slowly;
      // the wave stays gentle except where the noise peaks, where it swells into oxbows
      const n = noise1(k / 45, s + 3), t = Math.max(0, Math.min(1, (n - 0.62) / 0.3));
      // no oxbows in the spawn clearing or beside another river, where a loop would swing into the gap
      const near = k > 4 ? net.nearWater(x, y, RIVER_GAP * 1.5) : null;
      const calm = Math.min(Math.max(0, Math.min(1, (Math.hypot(x, y) - 24 * TILE) / (16 * TILE))),
                            near ? Math.max(0, Math.min(1, (-near.d - RIVER_GAP * 0.5) / RIVER_GAP)) : 1);
      const amp = MEANDER_MAX * (0.15 + 0.85 * t * t * (3 - 2 * t) * calm);
      const wanderAngle = (noise1(k / 40, s + 13) - 0.5) * 1.4;
      heading = baseHeading + dir + drift + wanderAngle + amp * Math.sin((2 * Math.PI * k) / wave + phase);
      x += Math.cos(heading) * STEP; y += Math.sin(heading) * STEP;
    }
    return pts;
  };
  const back = half(Math.PI, seed * 2 + 1, []).reverse();
  const fwd = half(0, seed * 2 + 2, back);
  return back.concat(fwd.slice(1));
}

export function generateRiverNet(seed: number): RiverNet {
  const net = new RiverNet(seed);
  const rng = mulberry32(seed);
  for (let i = 0; i < RIVER_COUNT; i++) {
    let anchor: Pt, heading: number;
    if (i === 0) {
      // the spawn river: it passes a short walk from the origin
      const a = rng() * Math.PI * 2, r = (7 + rng() * 3) * TILE;
      anchor = { x: Math.cos(a) * r, y: Math.sin(a) * r };
      heading = a + Math.PI / 2 + (rng() - 0.5) * 0.8;
    } else {
      // the others start farther out, well clear of the water already placed, and
      // run across rather than at the spawn so they skirt it instead of wrapping it
      anchor = { x: 0, y: 0 }; heading = 0;
      for (let tries = 0; tries < 24; tries++) {
        const a = rng() * Math.PI * 2, r = (i === 1 ? 34 + rng() * 16 : 46 + rng() * 24) * TILE;
        anchor = { x: Math.cos(a) * r, y: Math.sin(a) * r };
        heading = a + (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2) + (rng() - 0.5) * 0.8;
        if (!net.nearWater(anchor.x, anchor.y, ANCHOR_CLEAR)) break;
      }
    }
    const pts = walkRiver(anchor, heading, seed * 17 + i * 101, net, i === 0 ? SPAWN_CLEAR : OTHERS_CLEAR);
    const base = 34 + rng() * 20;                          // 1.1–1.7 tiles half width
    const wSeed = Math.floor(rng() * 1e6), rSeed = Math.floor(rng() * 1e6);
    const rapidsAt = (k: number) => { const t = Math.max(0, Math.min(1, (noise1(k / 5, rSeed) - 0.62) / 0.16)); return t * t * (3 - 2 * t); };
    const hwAt = (k: number) => base * (0.78 + noise1(k / 11, wSeed) * 0.5);
    net.addRiver(pts, hwAt, rapidsAt);
  }
  net.finish(rng);
  return net;
}
