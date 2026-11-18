// Procedural pixel art drawn at logical resolution then Scale2x'\d to 2× physical.
// Logical sizes: gameplay sprites 32→64px, towers/boss 64→128px.
// All sprites use setScale(0.5) to maintain the same world-space dimensions.

import Phaser from 'phaser';
import { CFG } from '../config';
import { generateRangerArrow } from './art/ranger/textures';
import { generateArrowTowerProjectile } from './art/arrowTower/rig';
import { generateArrowTowerBases } from './art/arrowTower/textures';
import { generateCannonTowerBases, generateCannonTowerProjectile } from './art/cannonTower/textures';
import { generateCoinTextures, registerCoinAnimations } from './art/coins';
import { generateWallTextures } from './art/wallTextures';
import { makeHD } from './art/hd';
import { POISON_SMOKE_VARIANTS, POISON_SMOKE_FRAME_MS } from './art/poisonSmoke';
import {
  EFrame, EFrame6,
  drawEnemyBasic, drawEnemyHeavy,
  drawEnemyBat, drawBirdPoop,
  drawEnemySkeleton, drawEnemyWarlock, drawEnemyGolem, drawEnemyShadowImp,
  drawWarlockBolt,
  drawEnemyDesert, drawSunBolt,
} from './art/enemies';
import { MEADOW_FRAMES, MEADOW_MOVE_FRAMES, MEADOW_ATK_FRAMES } from './art/meadow';
import { generateMeadowEnemyTextures } from './art/meadowEnemies/textures';
import { SPIDER_SMOKE_FRAMES, drawSpiderSmoke } from './art/spiderPoison';
import { drawRat, RAT_VARIANTS } from './art/rat';
import { TOAD_SMOKE_FRAMES, drawToadSmoke } from './art/toadPoison';
import { generateInfectedTextures, registerInfectedAnimations } from './art/infectedEnemies/textures';
import {
  Put, PutRGB, P, S,
  pxIdx, pxEq, pxCopy, scale2x, makeCanvas, mirrorX,
  rect, disc, ring, line, ellipse, flashOverlay, hexToRgb, add,
} from './art/canvas';
import { generateForestEnemyTextures, registerForestAnimations } from './art/forestEnemies/textures';
import { generateRiverEnemyTextures, registerRiverEnemyAnimations } from './art/riverEnemies/textures';
import { registerGaleclawTextures, registerGaleclawAnimations } from './art/riverEnemies/griffin';
import {
  BossFrame, RamFrame,
  phantomQueenFrames, castleDragonFrames,
  drawBoss,
  drawPhantomQueen, drawCastleDragon, drawDesertBoss,
  drawQueenOrb, drawDragonFireball, drawDragonFireExplosion,
} from './art/bosses';
import { createMeadowRamFrame } from './art/meadowRam';
import { drawArrow, drawBoulder, drawBoulderShadow, drawCannonballShadow } from './art/projectiles';
import { drawBoulderImpact, drawHitSpark, drawDeathBurst, drawCoinPop } from './art/fx';
import {
  TREE_PATTERNS, SPIKE_VARIANT_COUNT, CACTUS_VARIANT_COUNT, QUICKSAND_VARIANT_COUNT, TEMPLE_BLOCK_VARIANT_COUNT,
  drawCastleSpikesCanvas, drawCactusCanvas, drawQuicksandCanvas, drawTempleBlockCanvas,
  drawTreeClusterCanvas, drawInfectedPlantCanvas, drawFoundation,
} from './art/terrain';
// Re-export terrain names that ChunkSystem and other callers consume from
// generateArt — keeps the public surface stable while the implementation
// moves to art/terrain.ts.
export {
  RIVER_HALF_W, riverHorizontalCenterY, riverCenterPx, getRiverTileGrid,
  TREE_PATTERNS, SPIKE_PATTERNS, SPIKE_VARIANT_COUNT, CACTUS_VARIANT_COUNT, QUICKSAND_VARIANT_COUNT, TEMPLE_BLOCK_VARIANT_COUNT,
  createGroundChunk,
} from './art/terrain';
import {
  drawIndicatorArrow, drawIndicatorCannon, drawIndicatorBoss, drawIndicatorPointer,
} from './art/ui';












let artGenerated = false;
export function generateAllArt(scene: Phaser.Scene) {
  if (artGenerated) return;
  artGenerated = true;
  generateRangerArrow(scene.textures);
  generateArrowTowerProjectile(scene);

  // Enemies
  const eFrames: EFrame[] = ['move0','move1','move2','move3','atk0','atk1','hit','die0','die1','die2','die3'];
  for (const f of eFrames) add(scene, `eb_${f}`, makeCanvas(32, drawEnemyBasic(f)));
  for (const f of eFrames) add(scene, `eh_${f}`, makeCanvas(32, drawEnemyHeavy(f)));
  // Extended frame set (6-frame move, 4-frame atk) shared by the biome enemies below
  const e6Frames: EFrame6[] = ['move0','move1','move2','move3','move4','move5','atk0','atk1','atk2','atk3','hit','die0','die1','die2','die3'];
  generateMeadowEnemyTextures(scene);
  for (let v = 0; v < RAT_VARIANTS; v++) {
    for (const frame of MEADOW_FRAMES) add(scene, `ecrat${v}_${frame}`, makeHD(64, drawRat(frame, v)));
  }
  generateInfectedTextures(scene);
  for (let variant = 0; variant < POISON_SMOKE_VARIANTS; variant++) for (const frame of SPIDER_SMOKE_FRAMES) {
    add(scene, `spider_smoke_${variant}_${frame}`, makeHD(128, drawSpiderSmoke(frame * POISON_SMOKE_FRAME_MS, variant), { outline: false }));
  }
  for (let variant = 0; variant < POISON_SMOKE_VARIANTS; variant++) for (const f of TOAD_SMOKE_FRAMES) {
    add(scene, `toad_smoke_${variant}_${f}`, makeHD(128, drawToadSmoke(f * POISON_SMOKE_FRAME_MS, CFG.infected.toadPoisonLifetime, variant), { outline: false }));
  }
  generateForestEnemyTextures(scene);
  generateRiverEnemyTextures(scene);
  add(scene, 'bird_poop', makeCanvas(16, drawBirdPoop()));

  // Castle enemies
  for (const f of e6Frames) add(scene, `ebt_${f}`, makeCanvas(32, drawEnemyBat(f)));
  // Skeleton uses the extended frame set (6-frame shamble, 4-frame sword slash)
  for (const f of e6Frames) add(scene, `esk_${f}`, makeCanvas(32, drawEnemySkeleton(f)));
  // Warlock uses the extended frame set (6-frame glide, 4-frame staff cast)
  for (const f of e6Frames) add(scene, `ewl_${f}`, makeCanvas(32, drawEnemyWarlock(f)));
  // Golem uses the extended frame set (6-frame stomp, 4-frame punch)
  for (const f of e6Frames) add(scene, `ego_${f}`, makeCanvas(32, drawEnemyGolem(f)));
  // Shadow imp uses the extended frame set (6-frame scamper, 4-frame swipe)
  for (const f of e6Frames) add(scene, `esi_${f}`, makeCanvas(32, drawEnemyShadowImp(f)));
  // Warlock magic bolt projectile
  add(scene, 'wbolt_0', makeCanvas(32, drawWarlockBolt('bolt0')));
  add(scene, 'wbolt_1', makeCanvas(32, drawWarlockBolt('bolt1')));
  const desertEnemies = [
    ['escp', 'scorpion'],
    ['ebsc', 'boss_scorpion'],
    ['esrb', 'scarab'],
    ['esmt', 'sand_mite'],
    ['echp', 'cactus_hopper'],
    ['edst', 'dune_strider'],
    ['eswr', 'sand_wraith'],
    ['etgd', 'temple_guardian'],
    ['esun', 'sun_mote'],
  ] as const;
  for (const [prefix, variant] of desertEnemies) {
    for (const f of eFrames) add(scene, `${prefix}_${f}`, makeCanvas(32, drawEnemyDesert(f, variant)));
  }
  add(scene, 'sunbolt_0', makeCanvas(16, drawSunBolt(0)));
  add(scene, 'sunbolt_1', makeCanvas(16, drawSunBolt(1)));

  generateArrowTowerBases(scene);
  generateCannonTowerBases(scene);

  // Off-screen tower indicators
  add(scene, 'ind_arrow',  makeCanvas(32, drawIndicatorArrow()));
  add(scene, 'ind_cannon', makeCanvas(32, drawIndicatorCannon()));
  add(scene, 'ind_boss',   makeCanvas(32, drawIndicatorBoss()));
  add(scene, 'ind_ptr',    makeCanvas(16, drawIndicatorPointer()));

  // Green checkmark for level select
  {
    const s = 20;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const x = c.getContext('2d')!;
    // Black outline
    x.strokeStyle = '#000';
    x.lineWidth = 4;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(3, 10);
    x.lineTo(8, 16);
    x.lineTo(17, 4);
    x.stroke();
    // Green fill
    x.strokeStyle = '#4ad96a';
    x.lineWidth = 2.5;
    x.beginPath();
    x.moveTo(3, 10);
    x.lineTo(8, 16);
    x.lineTo(17, 4);
    x.stroke();
    add(scene, 'ui_check', c);
  }

  generateWallTextures(scene);

  // Arrow
  add(scene, 'arrow_0', makeCanvas(32, drawArrow(0)));
  add(scene, 'arrow_1', makeCanvas(32, drawArrow(1)));

  // Cannonball
  generateCannonTowerProjectile(scene);
  add(scene, 'cball_shadow', makeCanvas(32, drawCannonballShadow()));

  // Boulder (boss projectile)
  add(scene, 'boulder_0', makeCanvas(32, drawBoulder(0)));
  add(scene, 'boulder_1', makeCanvas(32, drawBoulder(1)));
  add(scene, 'boulder_shadow', makeCanvas(32, drawBoulderShadow()));

  generateCoinTextures(scene);

  // Effects
  for (let i = 0; i < 3; i++) add(scene, `fx_hit_${i}`,   makeCanvas(32, drawHitSpark(i as any)));
  for (let i = 0; i < 5; i++) add(scene, `fx_death_${i}`, makeCanvas(32, drawDeathBurst(i as any)));
  for (let i = 0; i < 3; i++) add(scene, `fx_pop_${i}`,   makeCanvas(32, drawCoinPop(i as any)));
  for (let i = 0; i < 5; i++) add(scene, `fx_boulder_${i}`, makeCanvas(32, drawBoulderImpact(i as any)));

  // Ground tile variations
  // Ground tiles are generated per-tile in GameScene.generateChunksAround()
  add(scene, 'foundation', makeCanvas(64, drawFoundation));

  // Tree cluster sprites (one per pattern)
  for (let i = 0; i < TREE_PATTERNS.length; i++) add(scene, `tree_cluster_${i}`, drawTreeClusterCanvas(i));

  // Infected plant cluster sprites (one per pattern)
  for (let i = 0; i < TREE_PATTERNS.length; i++) add(scene, `infected_plant_${i}`, drawInfectedPlantCanvas(i));

  // Castle floor spikes — register N jitter variants. The placement code
  // picks per-tile across patterns so multi-tile clusters don't look stamped.
  for (let i = 0; i < SPIKE_VARIANT_COUNT; i++) add(scene, `castle_spikes_${i}`, drawCastleSpikesCanvas(i));

  for (let i = 0; i < CACTUS_VARIANT_COUNT; i++) add(scene, `desert_cactus_${i}`, drawCactusCanvas(i));
  for (let i = 0; i < QUICKSAND_VARIANT_COUNT; i++) add(scene, `desert_quicksand_${i}`, drawQuicksandCanvas(i));
  for (let i = 0; i < TEMPLE_BLOCK_VARIANT_COUNT; i++) add(scene, `temple_block_${i}`, drawTempleBlockCanvas(i));

  // Firefly particle (tiny yellow-green glow, 4x4 logical)
  {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 4;
    const x = c.getContext('2d')!;
    x.fillStyle = '#80c040';
    x.fillRect(0, 0, 4, 4);
    x.fillStyle = '#b0ff60';
    x.fillRect(1, 1, 2, 2);
    add(scene, 'firefly', c);
  }

  // Infection spore particle (4x4 — purple/green glow)
  {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 4;
    const x = c.getContext('2d')!;
    x.fillStyle = '#6030a0';
    x.fillRect(0, 0, 4, 4);
    x.fillStyle = '#a060e0';
    x.fillRect(1, 1, 2, 2);
    add(scene, 'infection_spore', c);
  }

  // Infection spore green variant (4x4)
  {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 4;
    const x = c.getContext('2d')!;
    x.fillStyle = '#208040';
    x.fillRect(0, 0, 4, 4);
    x.fillStyle = '#40e060';
    x.fillRect(1, 1, 2, 2);
    add(scene, 'infection_spore_green', c);
  }

  // Spider web texture (16x16 semi-transparent white circle)
  {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const x = c.getContext('2d')!;
    x.globalAlpha = 0.4;
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(16, 16, 14, 0, Math.PI * 2); x.fill();
    // Cross lines for web look
    x.globalAlpha = 0.5;
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      x.beginPath();
      x.moveTo(16, 16);
      x.lineTo(16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13);
      x.stroke();
    }
    // Concentric rings
    x.globalAlpha = 0.3;
    for (const r of [5, 9, 12]) {
      x.beginPath(); x.arc(16, 16, r, 0, Math.PI * 2); x.stroke();
    }
    add(scene, 'spider_web', c);
  }

  // Boss (64x64 native — 2x2 tile footprint)
  const bossFrames: BossFrame[] = [
    'idle0','idle1',
    'move0','move1','move2','move3',
    'atk0','atk1',
    'chargeWind','hit',
    'birth0','birth1','birth2','birth3','birth4',
    'die0','die1','die2','die3','die4'
  ];
  for (const f of bossFrames) add(scene, `boss_${f}`, makeCanvas(64, drawBoss(f)));
  // Ram gets extra in-between frames on top of the shared boss set
  const ramFrames: RamFrame[] = [...bossFrames, 'idle2', 'idle3', 'move4', 'move5', 'atk2', 'atk3'];
  for (const f of ramFrames) add(scene, `ram_${f}`, createMeadowRamFrame(f));
  registerGaleclawTextures(scene);

  // Castle boss (Phantom Queen) textures
  // Queen gets extra idle frames (flowing hair/gown) on top of the shared set
  for (const f of phantomQueenFrames) add(scene, `cqboss_${f}`, makeCanvas(64, drawPhantomQueen(f)));
  // Castle boss (Castle Dragon) textures — extra idle + windup/emit atk frames
  for (const f of castleDragonFrames) add(scene, `cdboss_${f}`, makeCanvas(64, drawCastleDragon(f)));

  for (const f of bossFrames) add(scene, `dfboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'burrower')));
  for (const f of bossFrames) add(scene, `dsboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'scorpion')));
  for (const f of bossFrames) add(scene, `sbboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'sandstorm')));
  for (const f of bossFrames) add(scene, `dwboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'wraith')));
  for (const f of bossFrames) add(scene, `dtboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'construct')));
  for (const f of bossFrames) add(scene, `spboss_${f}`, makeCanvas(64, drawDesertBoss(f, 'sun_priest')));

  // Queen orb projectile
  add(scene, 'qorb_0', makeCanvas(32, drawQueenOrb(0)));
  add(scene, 'qorb_1', makeCanvas(32, drawQueenOrb(1)));

  // Dragon fireball projectile (4 frames for rotation)
  add(scene, 'dfball_0', makeCanvas(32, drawDragonFireball(0)));
  add(scene, 'dfball_1', makeCanvas(32, drawDragonFireball(1)));
  add(scene, 'dfball_2', makeCanvas(32, drawDragonFireball(2)));
  add(scene, 'dfball_3', makeCanvas(32, drawDragonFireball(3)));

  // Dragon fireball explosion (5 frames)
  for (let i = 0; i < 5; i++)
    add(scene, `dfexpl_${i}`, makeCanvas(32, drawDragonFireExplosion(i)));
}

function framesFromKeys(keys: string[]): Phaser.Types.Animations.AnimationFrame[] {
  return keys.map(k => ({ key: k }));
}

export function registerAnimations(scene: Phaser.Scene) {
  const a = scene.anims;
  const mk = (key: string, keys: string[], frameRate: number, repeat: number) => {
    if (a.exists(key)) a.remove(key);
    a.create({ key, frames: framesFromKeys(keys), frameRate, repeat });
  };

  mk('eb-move', ['eb_move0','eb_move1','eb_move2','eb_move3'], 8, -1);
  mk('eb-atk',  ['eb_atk0','eb_atk1'], 8, -1);
  mk('eb-hit',  ['eb_hit'], 10, 0);
  mk('eb-die',  ['eb_die0','eb_die1','eb_die2','eb_die3'], 10, 0);

  mk('eh-move', ['eh_move0','eh_move1','eh_move2','eh_move3'], 6, -1);
  mk('eh-atk',  ['eh_atk0','eh_atk1'], 6, -1);
  mk('eh-hit',  ['eh_hit'], 8, 0);
  mk('eh-die',  ['eh_die0','eh_die1','eh_die2','eh_die3'], 8, 0);

  const mv = (p: string) => MEADOW_MOVE_FRAMES.map(f => `${p}_${f}`);
  const ak = (p: string) => MEADOW_ATK_FRAMES.map(f => `${p}_${f}`);
  // Snake move loop spans 4 slither cycles with the tongue-flick variant
  // frame appearing only once — one brief flick every ~1.8s.
  const snkTail = mv('esnk').slice(1);
  const snkLoop = ['esnk_move0t', ...snkTail];
  for (let i = 0; i < 3; i++) snkLoop.push('esnk_move0', ...snkTail);
  mk('esnk-move', snkLoop, 18, -1);
  mk('esnk-atk',  ak('esnk'), 10, -1);

  mk('erat-move', mv('erat'), 20, -1);
  mk('erat-atk',  ak('erat'), 12, -1);
  for (let v = 0; v < RAT_VARIANTS; v++) {
    mk(`ecrat${v}-move`, mv(`ecrat${v}`), 20, -1);
    mk(`ecrat${v}-atk`,  ak(`ecrat${v}`), 12, -1);
  }

  mk('eder-move', mv('eder'), 12, -1);
  mk('eder-atk',  ak('eder'), 10, -1);

  registerInfectedAnimations(scene);
  registerForestAnimations(scene);

  registerRiverEnemyAnimations(scene);

  // Castle enemies
  mk('ebt-move', ['ebt_move0','ebt_move1','ebt_move2','ebt_move3','ebt_move4','ebt_move5'], 12, -1);
  mk('ebt-atk',  ['ebt_atk0','ebt_atk1','ebt_atk2','ebt_atk3'], 10, -1);
  mk('ebt-hit',  ['ebt_hit'], 8, 0);
  mk('ebt-die',  ['ebt_die0','ebt_die1','ebt_die2','ebt_die3'], 8, 0);

  // 6-frame shamble + 4-frame raise-and-slash
  mk('esk-move', ['esk_move0','esk_move1','esk_move2','esk_move3','esk_move4','esk_move5'], 10, -1);
  mk('esk-atk',  ['esk_atk0','esk_atk1','esk_atk2','esk_atk3'], 10, -1);
  mk('esk-hit',  ['esk_hit'], 10, 0);
  mk('esk-die',  ['esk_die0','esk_die1','esk_die2','esk_die3'], 10, 0);

  // 6-frame gliding walk + 4-frame charge-aim-fire staff cast
  mk('ewl-move', ['ewl_move0','ewl_move1','ewl_move2','ewl_move3','ewl_move4','ewl_move5'], 10, -1);
  mk('ewl-atk',  ['ewl_atk0','ewl_atk1','ewl_atk2','ewl_atk3'], 10, 0); // one cycle per cast
  mk('ewl-hit',  ['ewl_hit'], 10, 0);
  mk('ewl-die',  ['ewl_die0','ewl_die1','ewl_die2','ewl_die3'], 10, 0);

  // 6-frame stomping walk + 4-frame wind-and-punch
  mk('ego-move', ['ego_move0','ego_move1','ego_move2','ego_move3','ego_move4','ego_move5'], 9, -1);
  mk('ego-atk',  ['ego_atk0','ego_atk1','ego_atk2','ego_atk3'], 8, -1);
  mk('ego-hit',  ['ego_hit'], 8, 0);
  mk('ego-die',  ['ego_die0','ego_die1','ego_die2','ego_die3'], 8, 0);

  // 6-frame scamper + 4-frame coil-and-rake claw swipe
  mk('esi-move', ['esi_move0','esi_move1','esi_move2','esi_move3','esi_move4','esi_move5'], 12, -1);
  mk('esi-atk',  ['esi_atk0','esi_atk1','esi_atk2','esi_atk3'], 10, -1);
  mk('esi-hit',  ['esi_hit'], 10, 0);
  mk('esi-die',  ['esi_die0','esi_die1','esi_die2','esi_die3'], 10, 0);



  // Warlock bolt
  mk('wbolt-spin', ['wbolt_0','wbolt_1'], 8, -1);

  const desertEnemyAnims = [
    ['escp', 8],
    ['esrb', 10],
    ['esmt', 12],
    ['echp', 7],
    ['edst', 10],
    ['eswr', 6],
    ['etgd', 6],
    ['esun', 8],
  ] as const;
  for (const [prefix, rate] of desertEnemyAnims) {
    mk(`${prefix}-move`, [`${prefix}_move0`,`${prefix}_move1`,`${prefix}_move2`,`${prefix}_move3`], rate, -1);
    mk(`${prefix}-atk`,  [`${prefix}_atk0`,`${prefix}_atk1`], rate, -1);
    mk(`${prefix}-hit`,  [`${prefix}_hit`], 10, 0);
    mk(`${prefix}-die`,  [`${prefix}_die0`,`${prefix}_die1`,`${prefix}_die2`,`${prefix}_die3`], 10, 0);
  }
  mk('sunbolt-spin', ['sunbolt_0','sunbolt_1'], 10, -1);

  mk('arrow-spin', ['arrow_0','arrow_1'], 20, -1);
  mk('boulder-spin', ['boulder_0','boulder_1'], 6, -1);

  registerCoinAnimations(scene);

  mk('fx-hit',    ['fx_hit_0','fx_hit_1','fx_hit_2'], 22, 0);
  mk('fx-death',  ['fx_death_0','fx_death_1','fx_death_2','fx_death_3','fx_death_4'], 18, 0);
  mk('fx-pop',    ['fx_pop_0','fx_pop_1','fx_pop_2'], 20, 0);
  mk('fx-boulder', ['fx_boulder_0','fx_boulder_1','fx_boulder_2','fx_boulder_3','fx_boulder_4'], 14, 0);

  // Boss
  mk('boss-idle',       ['boss_idle0','boss_idle1'], 2, -1);
  mk('boss-move',       ['boss_move0','boss_move1','boss_move2','boss_move3'], 5, -1);
  mk('boss-atk',        ['boss_atk0','boss_atk1'], 4, 0);
  mk('boss-chargewind', ['boss_chargeWind','boss_idle0'], 6, -1);
  mk('boss-hit',        ['boss_hit'], 10, 0);
  mk('boss-birth',      ['boss_birth0','boss_birth1','boss_birth2','boss_birth3','boss_birth4'], 4, 0);
  mk('boss-die',        ['boss_die0','boss_die1','boss_die2','boss_die3','boss_die4'], 6, 0);

  // Meadow boss (Ancient Ram) animations
  // 4-frame idle (breath + ear flick), 6-frame trot, 4-frame slam.
  // ram-atk keeps its ~500ms total duration (2@4fps → 4@8fps) so boss
  // attack timing in EnemyBossSystem is unchanged.
  mk('ram-idle',       ['ram_idle0','ram_idle1','ram_idle2','ram_idle3'], 3, -1);
  mk('ram-move',       ['ram_move0','ram_move1','ram_move2','ram_move3','ram_move4','ram_move5'], 8, -1);
  mk('ram-atk',        ['ram_atk0','ram_atk1','ram_atk2','ram_atk3'], 8, 0);
  mk('ram-chargewind', ['ram_chargeWind','ram_idle0'], 6, -1);
  mk('ram-hit',        ['ram_hit'], 10, 0);
  mk('ram-birth',      ['ram_birth0','ram_birth1','ram_birth2','ram_birth3','ram_birth4'], 4, 0);
  mk('ram-die',        ['ram_die0','ram_die1','ram_die2','ram_die3','ram_die4'], 6, 0);

  registerGaleclawAnimations(scene);

  // Castle boss (Phantom Queen) animations
  // 4-frame idle/move so the hair + gown never stop flowing
  mk('cqboss-idle',       ['cqboss_idle0','cqboss_idle1','cqboss_idle2','cqboss_idle3'], 6, -1);
  mk('cqboss-move',       ['cqboss_move0','cqboss_move1','cqboss_move2','cqboss_move3'], 8, -1);
  mk('cqboss-atk',        ['cqboss_atk0','cqboss_atk1'], 4, 0);
  mk('cqboss-chargewind', ['cqboss_chargeWind','cqboss_idle0'], 6, -1);
  mk('cqboss-hit',        ['cqboss_hit'], 10, 0);
  mk('cqboss-birth',      ['cqboss_birth0','cqboss_birth1','cqboss_birth2','cqboss_birth3','cqboss_birth4'], 4, 0);
  mk('cqboss-die',        ['cqboss_die0','cqboss_die1','cqboss_die2','cqboss_die3','cqboss_die4'], 6, 0);

  // Castle boss (Castle Dragon) animations
  // 4-frame breathing idle + prowling walk
  mk('cdboss-idle',       ['cdboss_idle0','cdboss_idle1','cdboss_idle2','cdboss_idle3'], 5, -1);
  mk('cdboss-move',       ['cdboss_move0','cdboss_move1','cdboss_move2','cdboss_move3'], 7, -1);
  // Fireball attack: windup (rear + throat ignites) for 250ms, then the maw
  // opens and the jet roars — EnemyBossSystem spawns the fireball at 250ms
  // to line up with the open-mouth frames.
  mk('cdboss-atk',        ['cdboss_atk0','cdboss_atk2','cdboss_atk1','cdboss_atk3'], 8, 0);
  mk('cdboss-chargewind', ['cdboss_chargeWind','cdboss_idle0'], 6, -1);
  mk('cdboss-hit',        ['cdboss_hit'], 10, 0);
  mk('cdboss-birth',      ['cdboss_birth0','cdboss_birth1','cdboss_birth2','cdboss_birth3','cdboss_birth4'], 4, 0);
  mk('cdboss-die',        ['cdboss_die0','cdboss_die1','cdboss_die2','cdboss_die3','cdboss_die4'], 6, 0);

  for (const prefix of ['dsboss', 'dwboss', 'dtboss', 'spboss']) {
    mk(`${prefix}-idle`,       [`${prefix}_idle0`,`${prefix}_idle1`], 2, -1);
    mk(`${prefix}-move`,       [`${prefix}_move0`,`${prefix}_move1`,`${prefix}_move2`,`${prefix}_move3`], 5, -1);
    mk(`${prefix}-atk`,        [`${prefix}_atk0`,`${prefix}_atk1`], 4, 0);
    mk(`${prefix}-chargewind`, [`${prefix}_chargeWind`,`${prefix}_idle0`], 6, -1);
    mk(`${prefix}-hit`,        [`${prefix}_hit`], 10, 0);
    mk(`${prefix}-birth`,      [`${prefix}_birth0`,`${prefix}_birth1`,`${prefix}_birth2`,`${prefix}_birth3`,`${prefix}_birth4`], 4, 0);
    mk(`${prefix}-die`,        [`${prefix}_die0`,`${prefix}_die1`,`${prefix}_die2`,`${prefix}_die3`,`${prefix}_die4`], 6, 0);
  }

  // Queen orb spin animation
  mk('qorb-spin', ['qorb_0','qorb_1'], 8, -1);

  // Dragon fireball spin animation
  mk('dfball-spin', ['dfball_0','dfball_1','dfball_2','dfball_3'], 10, -1);
  mk('dfexpl', ['dfexpl_0','dfexpl_1','dfexpl_2','dfexpl_3','dfexpl_4'], 14, 0);

  // Pre-render river squiggle textures (small clusters of dashes)
  for (let vi = 0; vi < 5; vi++) {
    const sz = 20;
    const c = document.createElement('canvas');
    c.width = sz; c.height = sz;
    const x = c.getContext('2d')!;
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1;
    x.lineCap = 'round';
    let h = ((vi * 73856093 + 12345) >>> 0) % 2147483647;
    const rng = () => { h = (h * 16807) % 2147483647; return h / 2147483647; };
    const count = 3 + (vi % 3);
    for (let j = 0; j < count; j++) {
      const ox = sz / 2 + (rng() - 0.5) * 14;
      const oy = sz / 2 + (rng() - 0.5) * 10;
      const ang = rng() * Math.PI;
      const halfLen = 1.5 + rng() * 3;
      x.globalAlpha = 0.5 + rng() * 0.3;
      x.beginPath();
      x.moveTo(ox - Math.cos(ang) * halfLen, oy - Math.sin(ang) * halfLen);
      x.lineTo(ox + Math.cos(ang) * halfLen, oy + Math.sin(ang) * halfLen);
      x.stroke();
    }
    if (scene.textures.exists(`river_squig_${vi}`)) scene.textures.remove(`river_squig_${vi}`);
    scene.textures.addCanvas(`river_squig_${vi}`, c);
  }
}
