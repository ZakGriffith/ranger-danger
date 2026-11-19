// Renders the river woods studies: the arena edge where the spawn river
// leaves the clearing, with the R2 ground and wooden bridges under each tree
// treatment (W1–W3), a 3x crop, a nine-screen view of the whole arena, and
// seeded map overviews with the woods marked. SEED picks the seed.
// Output: scripts/out/river-studies/.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };

const COLS = 30, ROWS = 20, HD = 64;
const W = COLS * HD, H = ROWS * HD;
const SEED = Number(process.env.SEED || 1);
const only = process.argv.slice(2).filter(a => /^W\d$/.test(a));

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const geo = await load('/src/assets/art/riverGeometry.ts');
  const river = await load('/scripts/river-studies/river.ts');
  const woods = await load('/scripts/river-studies/woods.ts');
  const out = path.join(__dirname, 'out', 'river-studies');
  fs.mkdirSync(out, { recursive: true });

  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  const toCanvas = raster => {
    const c = createCanvas(raster.w, raster.h);
    c.getContext('2d').putImageData(createImageData(raster.data, raster.w, raster.h), 0, 0);
    return c;
  };
  const scene = (id, x0, y0, w, h) => {
    const c = toCanvas(river.renderRiver('R2', net, x0, y0, w, h));
    c.getContext('2d').drawImage(toCanvas(woods.renderWoods(id, net, x0, y0, w, h)), 0, 0);
    return c;
  };

  const t0 = Date.now();
  const net = geo.generateRiverNet(SEED);
  console.log(`seed ${SEED}: ${net.bridges.length} bridges, ${Date.now() - t0}ms`);

  // map overviews: the network at 4 px a tile over 240 tiles, first screen outlined
  for (const seed of [1, 2, 3]) {
    const n = seed === SEED ? net : geo.generateRiverNet(seed);
    const R = 120, S = 4, A = createCanvas(R * 2 * S, R * 2 * S), actx = A.getContext('2d');
    for (let y = -R; y < R; y++) for (let x = -R; x < R; x++) {
      const v = n.tileKind(x, y);
      actx.fillStyle = v === 4 ? '#2f6fb0' : v === 5 ? '#d9a24a' : v === 3 ? '#1d3a1a' : '#3e6d33';
      actx.fillRect((x + R) * S, (y + R) * S, S, S);
    }
    actx.strokeStyle = 'rgba(255,255,255,0.9)'; actx.lineWidth = 3;
    actx.strokeRect((R - COLS / 2) * S, (R - ROWS / 2) * S, COLS * S, ROWS * S);
    actx.fillStyle = '#ff4040'; actx.fillRect(R * S - 5, R * S - 5, 10, 10);
    fs.writeFileSync(path.join(out, `woods-arena-seed${seed}.png`), A.toBuffer('image/png'));
    console.log(`seed ${seed}: ${n.clearings.length} clearings, ${n.corridors.length} trails, ${n.bridges.length} bridges`);
  }

  // the view: the first trail out of the spawn clearing, centred where it enters the woods
  const first = net.corridors.filter(c => c.a === 0 || c.b === 0).sort((p, q) => {
    const lp = Math.hypot(p.pts[2].x - p.pts[0].x, p.pts[2].y - p.pts[0].y), lq = Math.hypot(q.pts[2].x - q.pts[0].x, q.pts[2].y - q.pts[0].y);
    return lp - lq;
  })[0];
  const far = first.a === 0 ? net.clearings[first.b] : net.clearings[first.a];
  const ang = Math.atan2(far.y, far.x), sr = net.clearings[0].r + 3 * 32;
  const exit = { x: Math.cos(ang) * sr, y: Math.sin(ang) * sr };
  const cx = Math.round(exit.x * 2), cy = Math.round(exit.y * 2);
  const X0 = cx - W / 2, Y0 = cy - H / 2;
  console.log('view centred on the first trail at tile', Math.round(exit.x / 32), Math.round(exit.y / 32), 'leading to a clearing at', Math.round(far.x / 32), Math.round(far.y / 32));

  for (const id of Object.keys(woods.WOODS_STYLES)) {
    if (only.length && !only.includes(id)) continue;
    const t1 = Date.now();
    const canvas = scene(id, X0, Y0, W, H);
    const CW = 400, CH = 260;
    const crop = createCanvas(CW * 3, CH * 3), cc = crop.getContext('2d');
    cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, W / 2 - CW / 2, H / 2 - CH / 2, CW, CH, 0, 0, CW * 3, CH * 3);
    fs.writeFileSync(path.join(out, `${id}-detail.png`), crop.toBuffer('image/png'));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (const [tx, ty] of [[15, 10], [7, 6], [23, 15]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
    fs.writeFileSync(path.join(out, `${id}.png`), canvas.toBuffer('image/png'));
    console.log(id, woods.WOODS_STYLES[id].title, `${Date.now() - t1}ms`);

    if (id === 'W4') {
      // the clearing at the far end of that trail, at play size
      const pc = scene(id, Math.round(far.x * 2) - W / 2, Math.round(far.y * 2) - H / 2, W, H);
      const pctx = pc.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      for (const [tx, ty] of [[15, 10], [7, 6], [23, 15]]) { pctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); pctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
      fs.writeFileSync(path.join(out, `${id}-room.png`), pc.toBuffer('image/png'));
    }

    if (process.env.ARENA) {
      const t2 = Date.now();
      // the network around the spawn: 150x100 tiles
      const AC = 150, AR = 100, AW = AC * HD, AH = AR * HD;
      const big = scene(id, -AW / 2, -AH / 2, AW, AH);
      const small = createCanvas(W, Math.round(W * AH / AW)), sc = small.getContext('2d');
      sc.imageSmoothingEnabled = true;
      sc.drawImage(big, 0, 0, small.width, small.height);
      const k = W / AW;
      sc.strokeStyle = 'rgba(255,255,255,0.9)'; sc.lineWidth = 3;
      sc.strokeRect((AW - W) / 2 * k, (AH - H) / 2 * k, W * k, H * k);
      fs.writeFileSync(path.join(out, `${id}-arena.png`), small.toBuffer('image/png'));
      console.log(id, 'arena', `${Date.now() - t2}ms`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
