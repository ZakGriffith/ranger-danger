import Phaser from 'phaser';
import type { Boss } from '../entities/Boss';
import type { Tower } from '../entities/Tower';
import type { GameScene } from '../scenes/GameScene';

const FIRST_ATTACK_DELAY = 3150;
const ATTACK_REST = 2300;
const RECOVERY_DURATION = 500;

const SWOOP_WINDUP = 1050;
const SWOOP_DURATION = 780;
const SWOOP_MIN_RANGE = 64;
const SWOOP_MAX_RANGE = 310;
const SWOOP_SEGMENTS = 28;
const SWOOP_RADIUS = 25;
const SWOOP_PLAYER_DAMAGE = 30;
const SWOOP_TOWER_DAMAGE = 30;

const BUFFET_WINDUP = 750;
const BUFFET_DURATION = 250;
const BUFFET_RANGE = 148;
const BUFFET_HALF_ANGLE = .58;
const BUFFET_DAMAGE = 10;
const WIND_DURATION = 240;
const WIND_SPEED = 168;

type Point = { x: number; y: number };
type AttackType = 'swoop' | 'buffet';
type SwoopPath = { start: Point; control: Point; end: Point };
type BuffetCone = { origin: Point; angle: number };

type Maneuver =
  | { kind: 'swoopWindup'; path: SwoopPath; releaseAt: number }
  | { kind: 'swoop'; path: SwoopPath; startAt: number; progress: number; hitPlayer: boolean; hitTower: boolean }
  | { kind: 'buffetWindup'; cone: BuffetCone; releaseAt: number }
  | { kind: 'buffet'; cone: BuffetCone; startAt: number; front: number; hitPlayer: boolean }
  | { kind: 'recover'; finishAt: number };

type Flight = {
  cue: Phaser.GameObjects.Graphics;
  maneuver: Maneuver | null;
  next: AttackType;
  attackAt: number;
  bank: number;
};

function pointOnSwoop({ start, control, end }: SwoopPath, t: number): Point {
  const startWeight = (1 - t) ** 2;
  const controlWeight = 2 * (1 - t) * t;
  const endWeight = t ** 2;
  return {
    x: start.x * startWeight + control.x * controlWeight + end.x * endWeight,
    y: start.y * startWeight + control.y * controlWeight + end.y * endWeight,
  };
}

function circleEntry(from: Point, to: Point, center: Point, radius: number): number {
  const ax = from.x - center.x;
  const ay = from.y - center.y;
  const outside = ax * ax + ay * ay - radius * radius;
  if (outside <= 0) return 0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = ax * dx + ay * dy;
  if (lengthSquared === 0 || projection >= 0) return Infinity;
  const discriminant = projection * projection - lengthSquared * outside;
  if (discriminant < 0) return Infinity;
  const entry = (-projection - Math.sqrt(discriminant)) / lengthSquared;
  return entry <= 1 ? entry : Infinity;
}

function conePoint(cone: BuffetCone, offset: number, distance: number): Point {
  return {
    x: cone.origin.x + Math.cos(cone.angle + offset) * distance,
    y: cone.origin.y + Math.sin(cone.angle + offset) * distance,
  };
}

export class GaleclawCombat {
  private readonly flights = new WeakMap<Boss, Flight>();
  private wind: { x: number; y: number; until: number } | null = null;

  constructor(private readonly scene: GameScene) {}

  update(boss: Boss, time: number): boolean {
    const flight = this.getFlight(boss, time);
    const maneuver = flight.maneuver;
    if (maneuver) {
      switch (maneuver.kind) {
        case 'swoopWindup':
          if (time >= maneuver.releaseAt) this.releaseSwoop(boss, flight, maneuver.path, time);
          else this.pulseCue(flight.cue, maneuver.releaseAt - time, SWOOP_WINDUP);
          return true;
        case 'swoop':
          this.advanceSwoop(boss, flight, maneuver, time);
          return true;
        case 'buffetWindup':
          if (time >= maneuver.releaseAt) this.releaseBuffet(boss, flight, maneuver.cone, time);
          else this.pulseCue(flight.cue, maneuver.releaseAt - time, BUFFET_WINDUP);
          return true;
        case 'buffet':
          this.advanceBuffet(boss, flight, maneuver, time);
          return true;
        case 'recover':
          if (time < maneuver.finishAt) return true;
          flight.maneuver = null;
          break;
      }
    }

    if (time < flight.attackAt || !this.scene.cameras.main.worldView.contains(boss.x, boss.y)) return false;
    const deltaX = this.scene.player.x - boss.x;
    const deltaY = this.scene.player.y - boss.y;
    const distance = Math.hypot(deltaX, deltaY);
    const canSwoop = distance >= SWOOP_MIN_RANGE && distance <= SWOOP_MAX_RANGE;
    const canBuffet = distance <= BUFFET_RANGE;
    if (canSwoop && (flight.next === 'swoop' || !canBuffet)) {
      this.beginSwoop(boss, flight, deltaX, deltaY, distance, time);
      return true;
    }
    if (canBuffet) {
      this.beginBuffet(boss, flight, deltaX, deltaY, time);
      return true;
    }
    return false;
  }

  applyPlayerWind(time: number): void {
    const wind = this.wind;
    if (!wind) return;
    if (time >= wind.until || this.scene.player.hp <= 0) {
      this.wind = null;
      return;
    }
    const strength = (wind.until - time) / WIND_DURATION;
    const body = this.scene.player.body as Phaser.Physics.Arcade.Body;
    // The regular player colliders stop the shove at river tiles and structure edges.
    this.scene.player.setVelocity(body.velocity.x + wind.x * strength, body.velocity.y + wind.y * strength);
  }

  private getFlight(boss: Boss, time: number): Flight {
    const existing = this.flights.get(boss);
    if (existing) return existing;
    const cue = this.scene.add.graphics().setDepth(8).setName('galeclaw-attack-cue');
    const flight: Flight = { cue, maneuver: null, next: 'swoop', attackAt: time + FIRST_ATTACK_DELAY, bank: 1 };
    boss.once(Phaser.GameObjects.Events.DESTROY, () => cue.destroy());
    this.flights.set(boss, flight);
    return flight;
  }

  private beginSwoop(boss: Boss, flight: Flight, dx: number, dy: number, distance: number, time: number): void {
    const ux = dx / distance;
    const uy = dy / distance;
    const overshoot = 80;
    const bankWidth = 94 * flight.bank;
    const length = distance + overshoot;
    // Balance the control point against the overshoot so the curve crosses the locked target.
    const bankControl = -bankWidth * distance / (2 * overshoot);
    const path: SwoopPath = {
      start: { x: boss.x, y: boss.y },
      control: {
        x: boss.x + ux * length / 2 - uy * bankControl,
        y: boss.y + uy * length / 2 + ux * bankControl,
      },
      end: {
        x: boss.x + ux * length - uy * bankWidth,
        y: boss.y + uy * length + ux * bankWidth,
      },
    };
    flight.bank *= -1;
    flight.next = 'buffet';
    flight.maneuver = { kind: 'swoopWindup', path, releaseAt: time + SWOOP_WINDUP };
    boss.setVelocity(0, 0).setFlipX(path.control.x < boss.x).play('rboss-windup');
    this.drawSwoopCue(flight.cue, path);
  }

  private releaseSwoop(boss: Boss, flight: Flight, path: SwoopPath, time: number): void {
    flight.maneuver = { kind: 'swoop', path, startAt: time, progress: 0, hitPlayer: false, hitTower: false };
    flight.cue.setAlpha(.42);
    boss.play('rboss-dash');
  }

  private advanceSwoop(boss: Boss, flight: Flight, maneuver: Extract<Maneuver, { kind: 'swoop' }>, time: number): void {
    const progress = Math.min(1, (time - maneuver.startAt) / SWOOP_DURATION);
    if (progress <= maneuver.progress) return;

    // Follow the marked curve even if a long frame skips several path segments.
    const segments = Math.ceil((progress - maneuver.progress) * SWOOP_SEGMENTS);
    let from = pointOnSwoop(maneuver.path, maneuver.progress);
    for (let i = 1; i <= segments; i++) {
      const fraction = Phaser.Math.Linear(maneuver.progress, progress, i / segments);
      const to = pointOnSwoop(maneuver.path, fraction);
      this.resolveSwoopSegment(maneuver, from, to);
      from = to;
    }
    maneuver.progress = progress;
    if (Math.abs(from.x - boss.x) > .01) boss.setFlipX(from.x < boss.x);
    boss.setPosition(from.x, from.y);
    const body = boss.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();
    // The scene update runs between the Arcade step and post-update. Don't apply this move twice.
    body.prevFrame.copy(body.position);
    if (progress === 1) this.beginRecovery(boss, flight, time);
  }

  private resolveSwoopSegment(maneuver: Extract<Maneuver, { kind: 'swoop' }>, from: Point, to: Point): void {
    if (!maneuver.hitPlayer && circleEntry(from, to, this.scene.player, SWOOP_RADIUS) !== Infinity) {
      maneuver.hitPlayer = true;
      this.hurtPlayer(SWOOP_PLAYER_DAMAGE);
    }
    if (maneuver.hitTower) return;
    let firstAt = Infinity;
    let firstTower: Tower | undefined;
    for (const tower of this.scene.towers) {
      const body = tower.body as Phaser.Physics.Arcade.StaticBody;
      const reachedAt = circleEntry(from, to, body.center, SWOOP_RADIUS + body.radius);
      if (reachedAt < firstAt) {
        firstTower = tower;
        firstAt = reachedAt;
      }
    }
    if (firstTower) {
      maneuver.hitTower = true;
      firstTower.hurt(SWOOP_TOWER_DAMAGE);
      if (firstTower.hp <= 0) this.scene.sell.destroyTower(firstTower);
    }
  }

  private beginBuffet(boss: Boss, flight: Flight, dx: number, dy: number, time: number): void {
    const angle = dx || dy ? Math.atan2(dy, dx) : boss.flipX ? Math.PI : 0;
    const cone = { origin: { x: boss.x, y: boss.y }, angle };
    flight.next = 'swoop';
    flight.maneuver = { kind: 'buffetWindup', cone, releaseAt: time + BUFFET_WINDUP };
    boss.setVelocity(0, 0).setFlipX(Math.cos(angle) < 0).play('rboss-buffet-windup');
    this.drawBuffetCue(flight.cue, cone);
  }

  private releaseBuffet(boss: Boss, flight: Flight, cone: BuffetCone, time: number): void {
    flight.maneuver = { kind: 'buffet', cone, startAt: time, front: 0, hitPlayer: false };
    flight.cue.clear().setAlpha(1);
    boss.play('rboss-buffet');
  }

  private advanceBuffet(boss: Boss, flight: Flight, maneuver: Extract<Maneuver, { kind: 'buffet' }>, time: number): void {
    const { cone, front } = maneuver;
    const progress = Math.min(1, (time - maneuver.startAt) / BUFFET_DURATION);
    const nextFront = BUFFET_RANGE * progress;
    const dx = this.scene.player.x - cone.origin.x;
    const dy = this.scene.player.y - cone.origin.y;
    const distance = Math.hypot(dx, dy);
    const forward = dx * Math.cos(cone.angle) + dy * Math.sin(cone.angle);
    if (!maneuver.hitPlayer && distance >= front && distance <= nextFront &&
        forward >= distance * Math.cos(BUFFET_HALF_ANGLE)) {
      maneuver.hitPlayer = true;
      this.hurtPlayer(BUFFET_DAMAGE);
      this.wind = { x: WIND_SPEED * Math.cos(cone.angle), y: WIND_SPEED * Math.sin(cone.angle), until: time + WIND_DURATION };
    }
    maneuver.front = nextFront;
    this.drawBuffetFront(flight.cue, cone, nextFront, progress);
    if (progress === 1) this.beginRecovery(boss, flight, time);
  }

  private beginRecovery(boss: Boss, flight: Flight, time: number): void {
    flight.maneuver = { kind: 'recover', finishAt: time + RECOVERY_DURATION };
    flight.attackAt = time + RECOVERY_DURATION + ATTACK_REST;
    flight.cue.clear().setAlpha(1);
    boss.setVelocity(0, 0).play('rboss-recover');
  }

  private hurtPlayer(damage: number): void {
    this.scene.player.hurt(damage, this.scene);
    this.scene.hud.pushHud();
    if (this.scene.player.hp <= 0) this.scene.end.lose();
  }

  private pulseCue(cue: Phaser.GameObjects.Graphics, remaining: number, duration: number): void {
    const progress = 1 - remaining / duration;
    cue.setAlpha(.66 + .34 * progress + .06 * Math.sin(progress * Math.PI * 5));
  }

  private drawSwoopCue(cue: Phaser.GameObjects.Graphics, path: SwoopPath): void {
    const points = Array.from({ length: SWOOP_SEGMENTS + 1 }, (_, i) => pointOnSwoop(path, i / SWOOP_SEGMENTS));
    cue.clear().setAlpha(1);
    cue.lineStyle(SWOOP_RADIUS * 2, 0xf28a54, .27).strokePoints(points);
    cue.fillStyle(0xf28a54, .27)
      .fillCircle(path.start.x, path.start.y, SWOOP_RADIUS)
      .fillCircle(path.end.x, path.end.y, SWOOP_RADIUS);
    cue.lineStyle(2, 0xffddb2, .93).strokePoints(points);
    for (let i = 4; i < SWOOP_SEGMENTS; i += 5) {
      const prev = points[i - 1];
      const point = points[i];
      const angle = Math.atan2(point.y - prev.y, point.x - prev.x);
      this.drawArrow(cue, point, angle);
    }
  }

  private drawBuffetCue(cue: Phaser.GameObjects.Graphics, cone: BuffetCone): void {
    const points = [cone.origin];
    for (let i = 0; i <= 14; i++) {
      points.push(conePoint(cone, Phaser.Math.Linear(-BUFFET_HALF_ANGLE, BUFFET_HALF_ANGLE, i / 14), BUFFET_RANGE));
    }
    cue.clear().setAlpha(1);
    cue.fillStyle(0xdcaa56, .24).fillPoints(points, true);
    cue.lineStyle(2.25, 0xffe2a9, .88).strokePoints(points, true);
    for (const offset of [-.29, 0, .29]) {
      this.drawArrow(cue, conePoint(cone, offset, BUFFET_RANGE * .68), cone.angle + offset);
    }
  }

  private drawBuffetFront(cue: Phaser.GameObjects.Graphics, cone: BuffetCone, radius: number, progress: number): void {
    cue.clear();
    cue.lineStyle(4, 0xe8f8ec, .94 - progress * .38);
    cue.beginPath();
    cue.arc(cone.origin.x, cone.origin.y, radius, cone.angle - BUFFET_HALF_ANGLE, cone.angle + BUFFET_HALF_ANGLE);
    cue.strokePath();
    cue.lineStyle(2, 0xbbe8df, .73 * Math.sin(Math.PI * progress));
    cue.beginPath();
    cue.arc(cone.origin.x, cone.origin.y, radius * .78, cone.angle - .46, cone.angle + .47);
    cue.strokePath();
  }

  private drawArrow(cue: Phaser.GameObjects.Graphics, point: Point, angle: number): void {
    for (const side of [-1, 1]) {
      cue.lineBetween(point.x, point.y,
        point.x - Math.cos(angle + side * .58) * 11,
        point.y - Math.sin(angle + side * .58) * 11);
    }
  }
}
