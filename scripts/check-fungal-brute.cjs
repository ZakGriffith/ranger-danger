const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createCanvas } = require('canvas');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, window: {}, document: { createElement: () => createCanvas(96, 96) }, require(id) {
    if (relative === 'src/systems/EnemyBossSystem.ts') {
      if (id === '../assets/art/infectedEnemies/fungalBrute') return art;
      if (id === '../config') return { CFG: { tile: 32 } };
      if (id === './LanternMawTossSystem') return { LanternMawTossSystem: class {} };
      if (id === './GaleclawCombat') return { GaleclawCombat: class {} };
      return {};
    }
    return load(path.relative(root, path.resolve(path.dirname(file), id + '.ts')));
  } });
  return exports;
}
const art = load('src/assets/art/infectedEnemies/fungalBrute.ts');
for (const frame of art.FUNGAL_BRUTE_FRAMES) {
  const canvas = art.makeFungalBruteFrame(frame), pixels = canvas.getContext('2d').getImageData(0, 0, 96, 96).data;
  assert.ok(pixels.some((value, i) => i % 4 === 3 && value), frame + ' is empty');
  for (let i = 0; i < 96; i++) for (const edge of [i * 4 + 3, (95 * 96 + i) * 4 + 3, i * 96 * 4 + 3, (i * 96 + 95) * 4 + 3]) assert.equal(pixels[edge], 0, frame + ' clips');
  if (frame === 'hit') for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 200) assert.ok(pixels[i] >= 254 && pixels[i + 1] >= 254 && pixels[i + 2] >= 254, 'Hit flash must be white');
}
const { EnemyBossSystem } = load('src/systems/EnemyBossSystem.ts');
function encounter(playerX = 20) {
  const e = { kind: 'infected_heavy', active: true, dying: false, x: 0, y: 0, dmg: 10, flipX: false, attackCd: 0, anims: { isPlaying: false },
    dirPrefix: () => art.FUNGAL_BRUTE_PREFIX, updateShadow() {}, setVelocity() {}, setFlipX(v) { this.flipX = v; },
    play(key) { this.anims = { isPlaying: true, currentAnim: { key }, currentFrame: { index: 1 } }; } };
  const s = { vTime: 100, spawnDist: 10, endState: {}, end: { lose() {} },
    player: { x: playerX, y: 0, hp: 100, hurt(n) { this.hp -= n; } }, hud: { pushHud() {} },
    desertCombat: { handlesContact: () => false }, enemies: { children: { iterate: fn => fn(e) } } };
  return { e, s, system: new EnemyBossSystem(s) };
}
{
  const { e, s, system } = encounter();
  system.enemyHitsPlayer(e);
  assert.equal(e.anims.currentAnim.key, art.FUNGAL_BRUTE_PREFIX + '-atk');
  assert.equal(s.player.hp, 100, 'Contact must start the wind-up without immediate damage');
  for (let index = 1; index <= art.FUNGAL_BRUTE_IMPACT_FRAME; index++) {
    e.anims.currentFrame.index = index; system.updateEnemies(100 + index, 16);
    assert.equal(s.player.hp, 100, 'Wind-up must not deal damage');
  }
  e.anims.currentFrame.index = art.FUNGAL_BRUTE_IMPACT_FRAME + 1;
  system.updateEnemies(200, 16);
  assert.equal(s.player.hp, 90, 'Damage must land on the full-extension texture');
  system.enemyHitsPlayer(e); system.updateEnemies(216, 16);
  assert.equal(s.player.hp, 90, 'One punch must damage only once');
}
for (const dodgeX of [50, -20]) {
  const { e, s, system } = encounter(); system.enemyHitsPlayer(e); s.player.x = dodgeX;
  e.anims.currentFrame.index = art.FUNGAL_BRUTE_IMPACT_FRAME + 1; system.updateEnemies(200, 16);
  assert.equal(s.player.hp, 100, 'Leaving range or moving behind the locked punch must dodge it');
}
{
  const { e, s, system } = encounter(-20); system.enemyHitsPlayer(e);
  assert.equal(e.flipX, true);
  e.anims.currentFrame.index = art.FUNGAL_BRUTE_IMPACT_FRAME + 1; system.updateEnemies(200, 16);
  assert.equal(s.player.hp, 90, 'A left-facing punch must hit correctly');
}
console.log('Fungal Brute checks passed: all gameplay frames, white hit flash, delayed impact, single damage, dodging, and both facings.');
