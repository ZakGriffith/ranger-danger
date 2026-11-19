// Renders the river studies over a 30x20-tile viewport centred on the spawn
// (seed via SEED, default 1), with the HD ranger overlaid, plus 3x crops of
// a rapids stretch and of the bridge nearest the spawn, seeded map overviews, and (ANIM=1) a looping frame set of
// the flow effects. WIDE=1 adds nine-screen zoomed-out views.
// Output: scripts/out/river-studies/.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };

const COLS = 30, ROWS = 20, HD = 64;
const W = COLS * HD, H = ROWS * HD;
const X0 = -W / 2, Y0 = -H / 2;
const SEED = Number(process.env.SEED || 1);
const only = process.argv.slice(2).filter(a => /^R\d$/.test(a));

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const geo = await load('/src/assets/art/riverGeometry.ts');
  const study = await load('/scripts/river-studies/river.ts');
  const out = path.join(__dirname, 'out', 'river-studies');
  fs.mkdirSync(out, { recursive: true });

  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  const overlay = ctx => {
    ctx.imageSmoothingEnabled = false;
    for (const [tx, ty] of [[15, 10], [7, 6], [23, 15]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
  };
  const toCanvas = raster => {
    const c = createCanvas(raster.w, raster.h);
    c.getContext('2d').putImageData(createImageData(raster.data, raster.w, raster.h), 0, 0);
    return c;
  };
  const crop3 = (canvas, cx, cy, cw, ch) => {
    const c = createCanvas(cw * 3, ch * 3), ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw * 3, ch * 3);
    return c;
  };

  const t0 = Date.now();
  const net = geo.generateRiverNet(SEED);
  console.log(`seed ${SEED}: ${net.bridges.length} bridges, ${Date.now() - t0}ms`);

  // map overviews for three seeds
  for (const seed of [1, 2, 3]) {
    const n = seed === SEED ? net : geo.generateRiverNet(seed);
    const Hh = geo.RIVER_MAP_HALF_TILES, Ww = Hh * 2, S = 2;
    const c = createCanvas(Ww * S, Ww * S), ctx = c.getContext('2d');
    ctx.fillStyle = '#3e6d33'; ctx.fillRect(0, 0, Ww * S, Ww * S);
    for (let y = 0; y < Ww; y++) for (let x = 0; x < Ww; x++) { const v = n.tiles[y * Ww + x]; if (v) { ctx.fillStyle = v === 4 ? '#2f6fb0' : '#d9a24a'; ctx.fillRect(x * S, y * S, S, S); } }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
    ctx.strokeRect((Hh - COLS / 2) * S, (Hh - ROWS / 2) * S, COLS * S, ROWS * S);
    ctx.fillStyle = '#ff4040'; ctx.fillRect(Hh * S - 3, Hh * S - 3, 6, 6);
    for (const b of n.bridges) { ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc((b.x / 32 + Hh) * S, (b.y / 32 + Hh) * S, 4, 0, Math.PI * 2); ctx.fill(); }
    fs.writeFileSync(path.join(out, `map-seed${seed}.png`), c.toBuffer('image/png'));
  }

  // crop targets: the rapids run nearest the spawn (wherever it is) and the bridge nearest the spawn
  const CW = 400, CH = 260;
  let rapidSpot = null;
  for (const river of net.rivers) {
    let run = null;
    for (let i = 0; i <= river.length; i++) {
      const s = river[i];
      if (s && s.rapids) { if (!run) run = { start: i }; run.end = i; continue; }
      if (run) {
        const mid = river[Math.floor((run.start + run.end) / 2)];
        const x = mid.x * 2, y = mid.y * 2, dist = Math.hypot(x, y);
        if (run.end - run.start >= 12 && (!rapidSpot || dist < rapidSpot.dist)) rapidSpot = { x, y, dist };
        run = null;
      }
    }
  }
  if (!rapidSpot) rapidSpot = { x: net.samples[0].x * 2, y: net.samples[0].y * 2, dist: 0 };
  const bridge = net.bridges.slice().sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0];
  const bridgeSpot = { x: bridge.x * 2, y: bridge.y * 2 };
  console.log('rapids crop at', Math.round(rapidSpot.x), Math.round(rapidSpot.y), 'bridge crop at', Math.round(bridgeSpot.x), Math.round(bridgeSpot.y));

  for (const id of Object.keys(study.RIVER_STYLES)) {
    if (only.length && !only.includes(id)) continue;
    const style = study.RIVER_STYLES[id];
    const t1 = Date.now();
    const canvas = toCanvas(study.renderRiver(id, net, X0, Y0, W, H));
    // the rapids and the bridge may sit off screen: render their own regions
    const rx0 = Math.round(rapidSpot.x - CW / 2), ry0 = Math.round(rapidSpot.y - CH / 2);
    fs.writeFileSync(path.join(out, `${id}-detail.png`), crop3(toCanvas(study.renderRiver(id, net, rx0, ry0, CW, CH)), 0, 0, CW, CH).toBuffer('image/png'));
    const bx0 = Math.round(bridgeSpot.x - CW / 2), by0 = Math.round(bridgeSpot.y - CH / 2);
    const bridgeCanvas = toCanvas(study.renderRiver(id, net, bx0, by0, CW, CH));
    fs.writeFileSync(path.join(out, `${id}-bridge.png`), crop3(bridgeCanvas, 0, 0, CW, CH).toBuffer('image/png'));
    // the stone walkway alternative, as its own bridge crop and first screen
    const stoneCanvas = toCanvas(study.renderRiver(id, net, bx0, by0, CW, CH, 'stone'));
    fs.writeFileSync(path.join(out, `${id}-bridge-stone.png`), crop3(stoneCanvas, 0, 0, CW, CH).toBuffer('image/png'));
    if (process.env.STONE_SCREEN) {
      const sc = toCanvas(study.renderRiver(id, net, X0, Y0, W, H, 'stone'));
      overlay(sc.getContext('2d'));
      fs.writeFileSync(path.join(out, `${id}-stone.png`), sc.toBuffer('image/png'));
    }
    const ctx = canvas.getContext('2d');
    overlay(ctx);
    fs.writeFileSync(path.join(out, `${id}.png`), canvas.toBuffer('image/png'));
    console.log(id, style.title, `${Date.now() - t1}ms`);

    if (process.env.WIDE) {
      const t2 = Date.now();
      const big = toCanvas(study.renderRiver(id, net, X0 - W, Y0 - H, W * 3, H * 3));
      const small = createCanvas(W, H), sc = small.getContext('2d');
      sc.imageSmoothingEnabled = true;
      sc.drawImage(big, 0, 0, W, H);
      sc.strokeStyle = 'rgba(255,255,255,0.9)'; sc.lineWidth = 3;
      sc.strokeRect(W / 3, H / 3, W / 3, H / 3);
      fs.writeFileSync(path.join(out, `${id}-wide.png`), small.toBuffer('image/png'));
      console.log(id, 'wide', `${Date.now() - t2}ms`);
    }

    if (process.env.ANIM) {
      // a looping frame set over the rapids crop: base once, effects per frame
      const t3 = Date.now();
      const AW = 480, AH = 300, FRAMES = 16;
      const ax0 = Math.round(rapidSpot.x - AW / 2), ay0 = Math.round(rapidSpot.y - AH / 2);
      const base = toCanvas(study.renderRiver(id, net, ax0, ay0, AW, AH));
      for (let f = 0; f < FRAMES; f++) {
        const fx = toCanvas(study.renderRiverFx(id, net, ax0, ay0, AW, AH, f / 8));
        const frame = createCanvas(AW * 2, AH * 2), fc = frame.getContext('2d');
        fc.imageSmoothingEnabled = false;
        fc.drawImage(base, 0, 0, AW * 2, AH * 2);
        fc.drawImage(fx, 0, 0, AW * 2, AH * 2);
        fs.writeFileSync(path.join(out, `anim-${id}-${String(f).padStart(2, '0')}.png`), frame.toBuffer('image/png'));
      }
      console.log(id, 'anim', `${Date.now() - t3}ms`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
