// Times the meadow HD ground against the legacy 32-px grasslands ground, and
// renders a 2x2 chunk grid from the game module to check for seams.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
(async () => {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const terrain = (await runnerImport('/src/assets/art/terrain.ts', config)).module;
  const meadow = (await runnerImport('/src/assets/art/groundMeadow.ts', config)).module;
  const scene = { levelId: 1, textures: { exists: () => false, remove() {}, addCanvas() {} } };
  let t0 = performance.now();
  for (let i = 0; i < 9; i++) terrain.createGroundChunk(scene, i, 5, 16, 32, 'forest');
  console.log('legacy forest', ((performance.now() - t0) / 9).toFixed(1), 'ms per chunk');
  const size = 16 * meadow.MEADOW_TILE_PX;
  t0 = performance.now();
  for (let i = 0; i < 9; i++) { const buf = new Uint8ClampedArray(size * size * 4); meadow.drawMeadowChunk(buf, size, i * size, 5 * size); }
  console.log('meadow HD', ((performance.now() - t0) / 9).toFixed(1), 'ms per chunk');
  const board = createCanvas(size * 2, size * 2);
  const ctx = board.getContext('2d');
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
    const buf = new Uint8ClampedArray(size * size * 4);
    meadow.drawMeadowChunk(buf, size, cx * size, cy * size);
    ctx.putImageData(createImageData(buf, size, size), cx * size, cy * size);
  }
  const out = path.join(__dirname, 'out', 'meadow-studies', 'game-chunks.png');
  fs.writeFileSync(out, board.toBuffer('image/png'));
  console.log('wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
