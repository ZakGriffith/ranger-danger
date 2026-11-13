// Renders the current meadow ground plus three HD ground-style studies over a
// full 30x20-tile viewport, with the ranger overlaid for scale, and detail
// crops of each style's grass/dirt edge. Output: scripts/out/meadow-studies/.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');

globalThis.document = { createElement: () => createCanvas(1, 1) };

const COLS = 30, ROWS = 20, HD = 64;
const W = COLS * HD, H = ROWS * HD;

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = {
    root, logLevel: 'error',
    plugins: [{
      name: 'phaser-stub',
      resolveId: id => id === 'phaser' ? '\0phaser-stub' : null,
      load: id => id === '\0phaser-stub' ? 'export default {};' : null,
    }],
  };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const terrain = await load('/src/assets/art/terrain.ts');
  const { STYLES } = await load('/scripts/meadow-studies/styles.ts');

  const out = path.join(__dirname, 'out', 'meadow-studies');
  fs.mkdirSync(out, { recursive: true });

  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  const overlayRangers = (ctx) => {
    for (const [tx, ty] of [[15, 10], [6, 5], [23, 14]]) {
      const x = tx * HD, y = ty * HD;
      ctx.drawImage(ranger, x, y, 64, 64);
      ctx.drawImage(bow, x, y, 64, 64);
    }
  };

  // --- current ground: 32 px per tile, drawn by the game's own pipeline, shown at 2x nearest
  const store = {};
  const fakeScene = { levelId: 1, textures: { exists: () => false, remove() {}, addCanvas: (k, c) => { store[k] = c; } } };
  const cur = createCanvas(COLS * 32, ROWS * 32);
  const cctx = cur.getContext('2d');
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
    const key = terrain.createGroundChunk(fakeScene, cx, cy, 16, 32, 'grasslands');
    cctx.drawImage(store[key], cx * 512, cy * 512);
  }
  const curHD = createCanvas(W, H);
  const hctx = curHD.getContext('2d');
  hctx.imageSmoothingEnabled = false;
  hctx.drawImage(cur, 0, 0, W, H);
  overlayRangers(hctx);
  fs.writeFileSync(path.join(out, 'current.png'), curHD.toBuffer('image/png'));
  console.log('current done');

  // --- studies
  const crops = {};
  for (const id of Object.keys(STYLES)) {
    const t0 = Date.now();
    const raster = STYLES[id].render(0, 0, W, H);
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(createImageData(raster.data, W, H), 0, 0);
    // detail crop: the 400x260 window with the most even grass/dirt split, searched on a coarse grid
    const CW = 400, CH = 260;
    let best = null;
    for (let y = 0; y + CH <= H; y += 40) for (let x = 0; x + CW <= W; x += 40) {
      let dirt = 0, n = 0;
      for (let yy = y; yy < y + CH; yy += 6) for (let xx = x; xx < x + CW; xx += 6) {
        const i = (yy * W + xx) * 4; n++;
        if (raster.data[i] > raster.data[i + 1]) dirt++;
      }
      const score = Math.abs(dirt / n - 0.45);
      if (!best || score < best.score) best = { x, y, score };
    }
    crops[id] = best;
    const crop = createCanvas(CW * 3, CH * 3);
    const cc = crop.getContext('2d');
    cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, best.x, best.y, CW, CH, 0, 0, CW * 3, CH * 3);
    fs.writeFileSync(path.join(out, `${id}-detail.png`), crop.toBuffer('image/png'));
    overlayRangers(ctx);
    fs.writeFileSync(path.join(out, `${id}.png`), canvas.toBuffer('image/png'));
    console.log(id, STYLES[id].title, `${Date.now() - t0}ms`, 'crop', best);
  }
  // matching crop of the current ground, same window as A for a fair side-by-side
  const crop = createCanvas(400 * 3, 260 * 3);
  const cc = crop.getContext('2d');
  cc.imageSmoothingEnabled = false;
  cc.drawImage(curHD, crops.A.x, crops.A.y, 400, 260, 0, 0, 1200, 780);
  fs.writeFileSync(path.join(out, 'current-detail.png'), crop.toBuffer('image/png'));
}

main().catch(e => { console.error(e); process.exit(1); });
