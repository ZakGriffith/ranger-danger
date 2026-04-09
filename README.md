# lil-homie-td

A top-down 2D tower defense / survival game built with **Phaser 3 + TypeScript + Vite**. All pixel art is procedurally generated in code at native resolution — no external assets.

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost URL, enter a name, and hit **START**.

## Controls

- **WASD / Arrow keys** — move
- **Stand still** — auto-shoots nearest enemy in range
- **1** — select Arrow Tower
- **2** — select Wall
- **Click** — place on grid (ghost tints green/red for valid/invalid)
- **Hold X + Click** — sell tower/wall (50% refund)
- **ESC** — cancel build

## Gameplay

- Survive waves of red goblins and heavy brutes.
- Build arrow towers (2×2 footprint) and walls to funnel and kill enemies.
- Towers auto-target the nearest enemy in range; enemies target the nearest of player or tower.
- Every 100 spawns, a 15-second build break lets you reposition defenses.
- At **200 kills**, the **Brood Mother** boss spawns — a bloated red matriarch who slams, births spawnlings out of her back, and performs telegraphed charges with AoE impact.
- Defeat the boss to win the level.

## Architecture

```
src/
├── main.ts                  # Phaser bootstrap + start screen + wake lock
├── config.ts                # All tunables (HP, costs, speeds, spawn ramp, boss)
├── assets/
│   └── generateArt.ts       # 100% procedural pixel art at native 32/64 px
├── scenes/
│   ├── BootScene.ts         # generates art & animations
│   ├── GameScene.ts         # world, AI, build system, spawning, boss
│   └── UIScene.ts           # HP bars, money, kills, build buttons, boss bar
├── entities/
│   ├── Player.ts
│   ├── Enemy.ts             # basic + heavy
│   ├── Boss.ts              # Brood Mother state machine
│   ├── Tower.ts             # 2x2 static turret
│   ├── Wall.ts
│   ├── Projectile.ts
│   └── Coin.ts
└── systems/
    └── Pathfinding.ts       # BFS over tile grid with wall-fallback
```

## Boss: The Brood Mother

- **HP:** 1500
- **Speed:** 28 (slower than a heavy)
- **Slam:** 0.6s windup, 56px AoE, 4.2s cooldown
- **Birth:** every 9s, pockets open on her back and launch 3 spawnlings
- **Charge:** every 14s if the player is far away — 1.2s telegraph, 1s burst, 80px AoE detonation on impact

## Notes

- All sprites are generated programmatically in `src/assets/generateArt.ts`. To edit art, modify the `draw*` functions — every frame is its own texture registered via `textures.addCanvas`.
- The Screen Wake Lock API keeps the tab alive during long play sessions.
