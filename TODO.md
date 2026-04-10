# TODO

## 1. Redo Tower Graphics (Isometric Perspective)
- Current tower art is top-down, which clashes with the angled perspective of the player and enemies
- Redraw tower base and top sprites at a 3/4 angle to match the rest of the game
- Base should visually fill its 2x2 grid footprint so players can clearly see the collision boundary
  - Avoids confusion when walking near tower corners and being blocked by invisible edges
- Maintain the tier tinting system (arrow: white → blue → gold, cannon: grey → bronze → red)
- Cannon and arrow tops should still rotate to aim but drawn from the angled perspective
- Update hit flash and upgrade pop animations to match new art style

## 2. Level Select Screen (Island Map)
- Create an island-themed world map as the level select screen
- The island is viewed from above at an angle, showing different biomes/regions
- Each level is a node on the map connected by a path
- Levels unlock sequentially — beating one unlocks the next
- Save/load progress (localStorage) to track which levels are beaten

### Level Progression & Biomes
1. **Grasslands** (Level 1) — current level, green fields, basic enemies
2. **Forest** — denser terrain, tree obstacles, faster enemy waves
3. **Swamp** — muddy ground slows player, poison enemies
4. **Desert** — open terrain, long sight lines, sandstorm events
5. **Mountains** — narrow paths, elevation advantage, tougher heavies
6. **Volcanic** — fire hazards, lava rivers as natural walls, elite enemies
7. **Frozen Peaks** — ice slows projectiles, blizzard reduces visibility
8. **Dark Fortress** — final level, all enemy types, multiple bosses

### Map Visual Style
- Hand-drawn pixel art island with biome colors visible on the map
- Beaten levels shown with a flag/checkmark
- Locked levels shown greyed out with a lock icon
- Animated path between levels lights up as you progress
- Player avatar stands on the current/last-beaten level node
