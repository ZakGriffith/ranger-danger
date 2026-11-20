import type Phaser from 'phaser';
import { CFG } from '../config';
import { castleTileAt, CASTLE_CELL_TILES } from '../assets/art/castleLayout';
import type { Enemy } from '../entities/Enemy';
import type { Boss } from '../entities/Boss';
import type { GameScene } from '../scenes/GameScene';
import { gridGet, gridKey } from './Pathfinding';

type Tile = { x: number; y: number };
type Walker = Enemy | Boss;
type TileLookup = (x: number, y: number) => number;
type SearchNode = Tile & { cost: number; priority: number; parent?: SearchNode };

class Frontier {
  private nodes: SearchNode[] = [];

  get size(): number { return this.nodes.length; }

  push(node: SearchNode) {
    let index = this.nodes.length;
    this.nodes.push(node);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.nodes[parent].priority <= node.priority) break;
      this.nodes[index] = this.nodes[parent];
      index = parent;
    }
    this.nodes[index] = node;
  }

  pop(): SearchNode {
    const first = this.nodes[0];
    const last = this.nodes.pop()!;
    if (!this.nodes.length) return first;
    let index = 0;
    while (index * 2 + 1 < this.nodes.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.nodes.length && this.nodes[child + 1].priority < this.nodes[child].priority) child++;
      if (last.priority <= this.nodes[child].priority) break;
      this.nodes[index] = this.nodes[child];
      index = child;
    }
    this.nodes[index] = last;
    return first;
  }
}

function clearBody(tileAt: TileLookup, x: number, y: number, halfW: number, halfH: number): boolean {
  for (let ty = Math.floor((y - halfH) / CFG.tile); ty <= Math.floor((y + halfH) / CFG.tile); ty++) {
    for (let tx = Math.floor((x - halfW) / CFG.tile); tx <= Math.floor((x + halfW) / CFG.tile); tx++) {
      const tile = tileAt(tx, ty);
      if (tile !== 0 && tile !== 5) return false;
    }
  }
  return true;
}

export function findCastleRoute(tileAt: TileLookup, start: Tile, goal: Tile, halfW: number, halfH: number): Tile[] {
  const clearance = new Map<string, boolean>();
  const canStand = (x: number, y: number) => {
    const key = gridKey(x, y);
    let clear = clearance.get(key);
    if (clear === undefined) {
      clear = clearBody(tileAt, (x + .5) * CFG.tile, (y + .5) * CFG.tile, halfW, halfH);
      clearance.set(key, clear);
    }
    return clear;
  };
  const goals: Tile[] = [];
  // When the ranger stands on spikes, walkers approach the nearest safe edge.
  for (let radius = 0; radius <= CASTLE_CELL_TILES && !goals.length; radius++) {
    for (let y = goal.y - radius; y <= goal.y + radius; y++) for (let x = goal.x - radius; x <= goal.x + radius; x++) {
      if (Math.max(Math.abs(x - goal.x), Math.abs(y - goal.y)) !== radius) continue;
      if (canStand(x, y)) goals.push({ x, y });
    }
  }
  if (!goals.length) return [];
  const goalKeys = new Set(goals.map(({ x, y }) => gridKey(x, y)));
  const heuristic = (x: number, y: number) => Math.min(...goals.map(goal => Math.abs(goal.x - x) + Math.abs(goal.y - y)));
  // Castle room connections can detour back toward the starting chamber.
  // The old fixed 20-tile margin could exclude the only door around a wall.
  const pad = CASTLE_CELL_TILES * 2;
  const left = Math.min(start.x, goal.x, 0) - pad, right = Math.max(start.x, goal.x, 0) + pad;
  const top = Math.min(start.y, goal.y, 0) - pad, bottom = Math.max(start.y, goal.y, 0) + pad;
  const frontier = new Frontier();
  const costs = new Map<string, number>([[gridKey(start.x, start.y), 0]]);
  frontier.push({ ...start, cost: 0, priority: heuristic(start.x, start.y) });
  while (frontier.size) {
    const node = frontier.pop();
    const key = gridKey(node.x, node.y);
    if (node.cost !== costs.get(key)) continue;
    if (goalKeys.has(key)) {
      const route: Tile[] = [];
      let step: SearchNode | undefined = node;
      while (step) {
        route.push({ x: step.x, y: step.y });
        step = step.parent;
      }
      return route.reverse();
    }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const x = node.x + dx, y = node.y + dy;
      if (x < left || x > right || y < top || y > bottom || !canStand(x, y)) continue;
      const cost = node.cost + 1;
      const nextKey = gridKey(x, y);
      const previous = costs.get(nextKey);
      if (previous !== undefined && previous <= cost) continue;
      costs.set(nextKey, cost);
      frontier.push({ x, y, cost, priority: cost + heuristic(x, y), parent: node });
    }
  }
  return [];
}

export class CastleNavigationSystem {
  private terrain = new Map<string, number>();
  private routes = new WeakMap<Walker, { goalX: number; goalY: number; version: number }>();

  constructor(private scene: GameScene) {}

  private tileAt = (x: number, y: number): number => {
    const placed = gridGet(this.scene.grid, x, y);
    if (placed !== 0) return placed;
    const key = gridKey(x, y);
    let tile = this.terrain.get(key);
    if (tile === undefined) {
      tile = castleTileAt(x, y, this.scene.treeSeed);
      this.terrain.set(key, tile);
    }
    return tile;
  };

  alignSpawn(actor: Walker) {
    const body = actor.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();
    const start = this.scene.pathing.worldToTile(body.center.x, body.center.y);
    for (let radius = 0; ; radius++) {
      for (let y = start.y - radius; y <= start.y + radius; y++) for (let x = start.x - radius; x <= start.x + radius; x++) {
        if (Math.max(Math.abs(x - start.x), Math.abs(y - start.y)) !== radius) continue;
        const wx = (x + .5) * CFG.tile, wy = (y + .5) * CFG.tile;
        if (!clearBody(this.tileAt, wx, wy, body.width / 2 + 1, body.height / 2 + 1)) continue;
        actor.setPosition(actor.x + wx - body.center.x, actor.y + wy - body.center.y);
        body.updateFromGameObject();
        return;
      }
    }
  }

  private clearSweep(x0: number, y0: number, x1: number, y1: number, halfW: number, halfH: number): boolean {
    const dx = x1 - x0, dy = y1 - y0;
    const left = Math.floor((Math.min(x0, x1) - halfW) / CFG.tile);
    const right = Math.floor((Math.max(x0, x1) + halfW) / CFG.tile);
    const top = Math.floor((Math.min(y0, y1) - halfH) / CFG.tile);
    const bottom = Math.floor((Math.max(y0, y1) + halfH) / CFG.tile);
    for (let ty = top; ty <= bottom; ty++) for (let tx = left; tx <= right; tx++) {
      const tile = this.tileAt(tx, ty);
      if (tile === 0 || tile === 5) continue;
      const minX = tx * CFG.tile - halfW, maxX = (tx + 1) * CFG.tile + halfW;
      const minY = ty * CFG.tile - halfH, maxY = (ty + 1) * CFG.tile + halfH;
      let enter = 0, exit = 1;
      for (const [position, delta, min, max] of [
        [x0, dx, minX, maxX],
        [y0, dy, minY, maxY],
      ]) {
        if (delta === 0) {
          if (position < min || position > max) { enter = 2; break; }
        } else {
          const a = (min - position) / delta, b = (max - position) / delta;
          enter = Math.max(enter, Math.min(a, b));
          exit = Math.min(exit, Math.max(a, b));
        }
      }
      if (enter > exit) continue;
      // Physics can press a body against a wall inside the navigation margin.
      // Let it leave through the nearest edge so a contact never pins it in place.
      const inside = x0 >= minX && x0 <= maxX && y0 >= minY && y0 <= maxY;
      if (inside && exit < 1) {
        const nearest = Math.min(x0 - minX, maxX - x0, y0 - minY, maxY - y0);
        const leaving = (x0 - minX === nearest && dx < 0) || (maxX - x0 === nearest && dx > 0)
          || (y0 - minY === nearest && dy < 0) || (maxY - y0 === nearest && dy > 0);
        if (leaving) continue;
      }
      return false;
    }
    return true;
  }

  velocity(actor: Walker, time: number, delta: number): Tile {
    const scene = this.scene;
    const body = actor.body as Phaser.Physics.Arcade.Body;
    const playerBody = scene.player.body as Phaser.Physics.Arcade.Body;
    const x = body.center.x, y = body.center.y;
    const halfW = body.width / 2 + 1, halfH = body.height / 2 + 1;
    let targetX = playerBody.center.x, targetY = playerBody.center.y;
    if (!this.clearSweep(x, y, targetX, targetY, halfW, halfH)) {
      const goal = scene.pathing.worldToTile(targetX, targetY);
      const cached = this.routes.get(actor);
      if (!cached || !actor.path.length || cached.goalX !== goal.x || cached.goalY !== goal.y || cached.version !== scene.gridVersion || time >= actor.lastPath + 400) {
        actor.lastPath = time;
        actor.path = findCastleRoute(this.tileAt, scene.pathing.worldToTile(x, y), goal, halfW, halfH);
        actor.pathIdx = 0;
        this.routes.set(actor, { goalX: goal.x, goalY: goal.y, version: scene.gridVersion });
      }
      if (!actor.path.length) return { x: 0, y: 0 };
      while (actor.pathIdx < actor.path.length - 1) {
        const node = actor.path[actor.pathIdx];
        if (Math.hypot((node.x + .5) * CFG.tile - x, (node.y + .5) * CFG.tile - y) > .25) break;
        actor.pathIdx++;
      }
      let selected = actor.pathIdx;
      // Grid turns need not become movement turns when the whole body can pass directly.
      for (let i = actor.path.length - 1; i >= actor.pathIdx; i--) {
        const node = actor.path[i];
        if (this.clearSweep(x, y, (node.x + .5) * CFG.tile, (node.y + .5) * CFG.tile, halfW, halfH)) { selected = i; break; }
      }
      actor.pathIdx = selected;
      targetX = (actor.path[selected].x + .5) * CFG.tile;
      targetY = (actor.path[selected].y + .5) * CFG.tile;
      if (!this.clearSweep(x, y, targetX, targetY, halfW, halfH)) return { x: 0, y: 0 };
    }
    const dx = targetX - x, dy = targetY - y;
    const distance = Math.hypot(dx, dy);
    if (distance < .25) return { x: 0, y: 0 };
    const speed = Math.min(actor.speed, distance / (delta / 1000));
    return { x: dx / distance * speed, y: dy / distance * speed };
  }

  moveEnemy(enemy: Enemy, time: number, delta: number, preserveAttack = false) {
    const velocity = this.velocity(enemy, time, delta);
    enemy.setVelocity(velocity.x, velocity.y);
    const finalNode = enemy.path[enemy.path.length - 1];
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    if (velocity.x === 0 && velocity.y === 0 && finalNode && enemy.pathIdx === enemy.path.length - 1
      && Math.hypot((finalNode.x + .5) * CFG.tile - body.center.x, (finalNode.y + .5) * CFG.tile - body.center.y) < .25) {
      enemy.stuckMsec = 0;
      enemy.windowStartedAt = time;
      enemy.lastMovingAt = time;
    }
    if (enemy.rotates) enemy.rotateToward(velocity.x, velocity.y);
    else if (enemy.kind === 'bear') enemy.updateFacing(velocity.x);
    else if (!preserveAttack) enemy.setFlipX((Math.abs(velocity.x) > 1 ? velocity.x : this.scene.player.x - enemy.x) < 0);
    const move = `${enemy.dirPrefix()}-move`;
    if (!preserveAttack && enemy.anims.currentAnim?.key !== move) enemy.play(move);
  }
}
