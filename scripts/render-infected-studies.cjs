// Renders the infected floor studies over a full 30x20-tile viewport with the
// current infected plant clusters and the ranger overlaid, plus the current
// infected ground for comparison, 3x detail crops and (with WIDE=1) nine-
// screen zoomed-out views. Output: scripts/out/infected-studies/.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };

const COLS = 30, ROWS = 20, HD = 64;
const W = COLS * HD, H = ROWS * HD;
const only = process.argv.slice(2).filter(a => /^I\d$/.test(a));

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const terrain = await load('/src/assets/art/terrain.ts');
  const { INFECTED_STYLES } = await load('/scripts/infected-studies/infected.ts');
  const out = path.join(__dirname, 'out', 'infected-studies');
  fs.mkdirSync(out, { recursive: true });

  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  // the game's infected clusters are 32 px per tile with a 30 px pad, shown at scale 1; draw them 2x
  const clusters = [[4, 2, 1], [9, 4, 14], [20, 3, 10], [25, 12, 7], [3, 13, 11], [14, 15, 4]];
  const overlay = ctx => {
    ctx.imageSmoothingEnabled = false;
    for (const [tx, ty, pat] of clusters) {
      const c = terrain.drawInfectedPlantCanvas(pat);
      ctx.drawImage(c, (tx * 32 - 30) * 2, (ty * 32 - 30) * 2, c.width * 2, c.height * 2);
    }
    for (const [tx, ty] of [[15, 10], [7, 6], [23, 15]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
  };

  if (only.length === 0) {
    const store = {};
    const fakeScene = { levelId: 3, textures: { exists: () => false, remove() {}, addCanvas: (k, c) => { store[k] = c; } } };
    const cur = createCanvas(COLS * 32, ROWS * 32);
    const cctx = cur.getContext('2d');
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) cctx.drawImage(store[terrain.createGroundChunk(fakeScene, cx, cy, 16, 32, 'infected')], cx * 512, cy * 512);
    const curHD = createCanvas(W, H);
    const hctx = curHD.getContext('2d');
    hctx.imageSmoothingEnabled = false;
    hctx.drawImage(cur, 0, 0, W, H);
    overlay(hctx);
    fs.writeFileSync(path.join(out, 'infected-current.png'), curHD.toBuffer('image/png'));
  }

  for (const id of Object.keys(INFECTED_STYLES)) {
    if (only.length && !only.includes(id)) continue;
    const style = INFECTED_STYLES[id];
    const t0 = Date.now();
    const raster = style.render(0, 0, W, H);
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(createImageData(raster.data, W, H), 0, 0);
    const CW = 400, CH = 260;
    let best = null;
    for (let y = 0; y + CH <= H; y += 40) for (let x = 0; x + CW <= W; x += 40) {
      let patch = 0, n = 0;
      for (let yy = y; yy < y + CH; yy += 6) for (let xx = x; xx < x + CW; xx += 6) { const i = (yy * W + xx) * 4; n++; if (style.patch(raster.data[i], raster.data[i + 1], raster.data[i + 2])) patch++; }
      const score = Math.abs(patch / n - 0.45);
      if (!best || score < best.score) best = { x, y, score };
    }
    const crop = createCanvas(CW * 3, CH * 3);
    const cc = crop.getContext('2d');
    cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, best.x, best.y, CW, CH, 0, 0, CW * 3, CH * 3);
    fs.writeFileSync(path.join(out, `${id}-detail.png`), crop.toBuffer('image/png'));
    overlay(ctx);
    fs.writeFileSync(path.join(out, `${id}.png`), canvas.toBuffer('image/png'));
    console.log(id, style.title, `${Date.now() - t0}ms`);

    if (process.env.WIDE) {
      const t1 = Date.now();
      const big = style.render(-W, -H, W * 3, H * 3);
      const bc = createCanvas(W * 3, H * 3);
      bc.getContext('2d').putImageData(createImageData(big.data, W * 3, H * 3), 0, 0);
      const small = createCanvas(W, H);
      const sc = small.getContext('2d');
      sc.imageSmoothingEnabled = true;
      sc.drawImage(bc, 0, 0, W, H);
      sc.strokeStyle = 'rgba(255,255,255,0.9)'; sc.lineWidth = 3;
      sc.strokeRect(W / 3, H / 3, W / 3, H / 3);
      fs.writeFileSync(path.join(out, `${id}-wide.png`), small.toBuffer('image/png'));
      console.log(id, 'wide', `${Date.now() - t1}ms`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
