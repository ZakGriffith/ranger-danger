// Renders the forest floor studies over a full 30x20-tile viewport with the
// current procedural pine clusters and the ranger overlaid, plus the current
// forest ground for comparison and 3x edge crops. Output: scripts/out/forest-studies/.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };

const COLS = 30, ROWS = 20, HD = 64;
const W = COLS * HD, H = ROWS * HD;

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const terrain = await load('/src/assets/art/terrain.ts');
  const { FOREST_STYLES } = await load('/scripts/meadow-studies/forest.ts');
  const out = path.join(__dirname, 'out', 'forest-studies');
  fs.mkdirSync(out, { recursive: true });

  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  // the game's clusters are HD (64 px per tile, 80 px pad); draw them 1:1
  const clusters = [[4, 2, 1], [9, 4, 14], [20, 3, 10], [25, 12, 7], [3, 13, 11], [14, 15, 4]];
  const overlay = ctx => {
    ctx.imageSmoothingEnabled = false;
    for (const [tx, ty, pat] of clusters) {
      const c = terrain.drawTreeClusterCanvas(pat);
      ctx.drawImage(c, tx * HD - 80, ty * HD - 80);
    }
    for (const [tx, ty] of [[15, 10], [7, 6], [23, 15]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
  };

  const store = {};
  const fakeScene = { levelId: 2, textures: { exists: () => false, remove() {}, addCanvas: (k, c) => { store[k] = c; } } };
  const cur = createCanvas(COLS * 32, ROWS * 32);
  const cctx = cur.getContext('2d');
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) cctx.drawImage(store[terrain.createGroundChunk(fakeScene, cx, cy, 16, 32, 'forest')], cx * 512, cy * 512);
  const curHD = createCanvas(W, H);
  const hctx = curHD.getContext('2d');
  hctx.imageSmoothingEnabled = false;
  hctx.drawImage(cur, 0, 0, W, H);
  overlay(hctx);
  fs.writeFileSync(path.join(out, 'forest-current.png'), curHD.toBuffer('image/png'));

  for (const id of Object.keys(FOREST_STYLES)) {
    const t0 = Date.now();
    const raster = FOREST_STYLES[id].render(0, 0, W, H);
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(createImageData(raster.data, W, H), 0, 0);
    const CW = 400, CH = 260;
    let best = null;
    for (let y = 0; y + CH <= H; y += 40) for (let x = 0; x + CW <= W; x += 40) {
      let dirt = 0, n = 0;
      for (let yy = y; yy < y + CH; yy += 6) for (let xx = x; xx < x + CW; xx += 6) { const i = (yy * W + xx) * 4; n++; if (raster.data[i] > raster.data[i + 1]) dirt++; }
      const score = Math.abs(dirt / n - 0.45);
      if (!best || score < best.score) best = { x, y, score };
    }
    const crop = createCanvas(CW * 3, CH * 3);
    const cc = crop.getContext('2d');
    cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, best.x, best.y, CW, CH, 0, 0, CW * 3, CH * 3);
    fs.writeFileSync(path.join(out, `${id}-detail.png`), crop.toBuffer('image/png'));
    overlay(ctx);
    fs.writeFileSync(path.join(out, `${id}.png`), canvas.toBuffer('image/png'));
    console.log(id, FOREST_STYLES[id].title, `${Date.now() - t0}ms`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
