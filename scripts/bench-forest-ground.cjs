// Times the forest HD ground and the HD tree clusters, and renders a 2x2
// chunk grid plus every cluster pattern from the game modules to check seams.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
(async () => {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const terrain = (await runnerImport('/src/assets/art/terrain.ts', config)).module;
  const forest = (await runnerImport('/src/assets/art/groundForest.ts', config)).module;
  const size = 16 * forest.FOREST_TILE_PX;
  let t0 = performance.now();
  for (let i = 0; i < 9; i++) { const buf = new Uint8ClampedArray(size * size * 4); forest.drawForestChunk(buf, size, i * size, 5 * size); }
  console.log('forest HD', ((performance.now() - t0) / 9).toFixed(1), 'ms per chunk');
  t0 = performance.now();
  const clusters = terrain.TREE_PATTERNS.map((_, i) => terrain.drawTreeClusterCanvas(i));
  console.log('tree clusters', (performance.now() - t0).toFixed(1), 'ms for', clusters.length);
  const out = path.join(__dirname, 'out', 'forest-studies');
  const board = createCanvas(size * 2, size * 2);
  const ctx = board.getContext('2d');
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
    const buf = new Uint8ClampedArray(size * size * 4);
    forest.drawForestChunk(buf, size, cx * size, cy * size);
    ctx.putImageData(createImageData(buf, size, size), cx * size, cy * size);
  }
  fs.writeFileSync(path.join(out, 'game-chunks.png'), board.toBuffer('image/png'));
  let x = 0, y = 0, rowH = 0;
  const sheet = createCanvas(1600, 1400);
  const sctx = sheet.getContext('2d');
  sctx.drawImage(board, 0, 0, 1600, 1400);
  for (const c of clusters) {
    if (x + c.width > 1600) { x = 0; y += rowH; rowH = 0; }
    sctx.drawImage(c, x, y); x += c.width; rowH = Math.max(rowH, c.height);
  }
  fs.writeFileSync(path.join(out, 'game-clusters.png'), sheet.toBuffer('image/png'));
  console.log('wrote game-chunks.png and game-clusters.png');
})().catch(e => { console.error(e); process.exit(1); });
