# Ranger Danger

A top-down 2D tower defense / survival game built with **Phaser 3 + TypeScript + Vite**. Pixel art is procedurally generated in code — external sprites used for tower bases and the level select map.

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost URL and hit **PLAY**.

## Controls

- **WASD / Arrow keys** — move
- **Stand still** — auto-shoots nearest enemy in range (half speed while moving)
- **1** — select Arrow Tower
- **2** — select Cannon Tower
- **3** — select Wall
- **Click** — place on grid (ghost tints green/red for valid/invalid)
- **Hold X + Click** — sell tower/wall (50% refund)
- **ESC** — cancel build / deselect tower

## Levels & Biomes

Progress through levels on a Kingdom Rush-style map screen. Each level has 4 difficulty tiers (Easy, Medium, Hard, 1 HP) with medals. Levels unlock sequentially — complete the previous level to unlock the next.

### The Meadow (Grasslands)
Green fields with scattered flowers and rocks. Fight basic red goblins, heavy brutes, and fast runner packs. Boss: **The Brood Mother**.

### Forest
Dense pine forest with tree cluster obstacles that block movement and building. Fight wolves, bears, and spiders. Firefly particles float through the air. Boss: **The Forest Guardian** (Ent).

### Infected Riverside
A corrupted landscape of dark purples and toxic greens. Infected plant obstacles block the terrain. Purple and green spore particles drift across the map. Fight infected variants of basic, heavy, and runner enemies. Boss: **The Blighted One** — leaves permanent pink gas clouds along its charge path that damage the player on contact.

## Gameplay

- Survive waves of enemies across multiple biomes.
- Build arrow towers, cannon towers (with splash damage), and walls to funnel and kill enemies.
- Towers auto-target the nearest enemy in range; enemies target the nearest player, tower, or wall.
- Between waves, a build break timer lets you reposition defenses.
- After clearing all waves, a boss spawns — defeat it to earn a medal and unlock the next level.
- Wave progress bar drains as enemies are killed, reaching zero when the wave ends.

## Towers

- **Arrow Tower** (60g) — fast single-target damage, 3 upgrade tiers
- **Cannon Tower** (100g) — slower, splash damage AoE, 3 upgrade tiers
- **Wall** (5g) — cheap blocker to funnel enemies

## Architecture

```
src/
├── main.ts                  # Phaser bootstrap + start screen + wake lock
├── config.ts                # All tunables (HP, costs, speeds, spawn ramp, boss)
├── levels.ts                # Level definitions, biomes, medal/unlock system
├── assets/
│   ├── generateArt.ts       # Procedural pixel art + biome ground tiles
│   └── sprites/             # External PNG sprites (tower bases, map, checkmark)
├── scenes/
│   ├── BootScene.ts         # Loads external sprites, starts level select
│   ├── LevelSelectScene.ts  # Map screen with level nodes, difficulty panel
│   ├── GameScene.ts         # World, AI, build system, spawning, boss, biome logic
│   └── UIScene.ts           # HUD: hotbar, wave bar, boss bar, gold badge, progress
├── entities/
│   ├── Player.ts
│   ├── Enemy.ts             # basic, heavy, runner, wolf, bear, spider, infected variants
│   ├── Boss.ts              # Brood Mother / Forest Guardian / Blighted One
│   ├── Tower.ts             # 2x2 static turret with upgrade tiers
│   ├── Wall.ts
│   ├── Projectile.ts
│   └── Coin.ts
└── systems/
    └── Pathfinding.ts       # BFS over sparse tile grid with wall-fallback
```

## Notes

- All enemy/boss sprites are generated programmatically in `generateArt.ts`. Tower bases and the level map use external PNGs.
- The game uses `Scale.ENVELOP` during gameplay (fills viewport, may crop edges) and `Scale.FIT` on the level select screen (no cropping).
- The Screen Wake Lock API keeps the tab alive during long play sessions.
