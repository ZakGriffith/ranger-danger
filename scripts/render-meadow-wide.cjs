// Zoomed-out view of the B studies: 90x60 tiles (nine screens) scaled down 3x.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const { STYLES } = (await runnerImport('/scripts/meadow-studies/styles.ts', config)).module;
  const out = path.join(__dirname, 'out', 'meadow-studies');
  const W = 90 * 64, H = 60 * 64, S = 3;
  for (const id of (process.argv.length > 2 ? process.argv.slice(2) : ['B', 'B2'])) {
    const t0 = Date.now();
    const raster = STYLES[id].render(0, 0, W, H);
    const full = createCanvas(W, H);
    full.getContext('2d').putImageData(createImageData(raster.data, W, H), 0, 0);
    const small = createCanvas(W / S, H / S);
    const ctx = small.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, W / S, H / S);
    // outline one play-screen so the scale is obvious
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.strokeRect(30 * 64 / S, 20 * 64 / S, 30 * 64 / S, 20 * 64 / S);
    fs.writeFileSync(path.join(out, `${id}-wide.png`), small.toBuffer('image/png'));
    console.log(id, 'wide', `${Date.now() - t0}ms`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
