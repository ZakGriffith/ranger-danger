const path = require('path');
(async () => {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const meadow = (await runnerImport('/src/assets/art/groundMeadow.ts', config)).module;
  const size = 1024;
  const buf = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < 5; i++) meadow.drawMeadowChunk(buf, size, i * size, 0); // warm up
  const t0 = performance.now();
  for (let i = 0; i < 20; i++) meadow.drawMeadowChunk(buf, size, i * size, size);
  console.log('warm', ((performance.now() - t0) / 20).toFixed(1), 'ms per chunk');
})();
