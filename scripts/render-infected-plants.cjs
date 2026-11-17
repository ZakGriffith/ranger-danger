// Renders the HD infected plant studies: the real cluster patterns over the
// I3 Toxic Marsh floor, next to the current plant clusters for scale.
// Output: scripts/out/infected-studies/plants-*.png
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const HD = 64;
const only = process.argv.slice(2);
async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const terrain = await load('/src/assets/art/terrain.ts');
  const { INFECTED_STYLES } = await load('/scripts/infected-studies/infected.ts');
  const { drawPlantCluster, PLANT_STYLES } = await load('/scripts/infected-studies/plants.ts');
  const { drawStackCluster, STACK_STYLES } = await load('/scripts/infected-studies/stacks.ts');
  const out = path.join(__dirname, 'out', 'infected-studies');
  fs.mkdirSync(out, { recursive: true });
  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  const toCanvas = r => { const c = createCanvas(r.w, r.h); c.getContext('2d').putImageData(createImageData(r.data, r.w, r.h), 0, 0); return c; };

  const COLS = 30, ROWS = 14, W = COLS * HD, H = ROWS * HD;
  const FLOOR = process.env.FLOOR || 'I3', suffix = FLOOR === 'I3' ? '' : `-${FLOOR}`;
  const floor = toCanvas(INFECTED_STYLES[FLOOR].render(0, 0, W, H));
  // the game's cluster placement: pattern anchored at tile origin, image centred on the pattern
  const placements = [[0, 1, 2], [4, 1, 6], [8, 2, 14], [14, 1, 9], [19, 3, 4], [24, 1, 13], [2, 8, 7], [8, 9, 11], [15, 8, 3], [21, 9, 12], [26, 8, 0]];
  const variants = [['current', null], ['P1', 'P1'], ['P2', 'P2'], ['P3', 'P3'], ['P4', 'P4'], ['Q1', 'Q1'], ['Q2', 'Q2'], ['Q3', 'Q3']];
  for (const [name, id] of variants) {
    if (only.length && !only.includes(name)) continue;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(floor, 0, 0);
    const sorted = placements.map(([tx, ty, pat]) => ({ tx, ty, pat, p: terrain.TREE_PATTERNS[pat] })).sort((a, b) => (a.ty + a.p.h) - (b.ty + b.p.h));
    for (const { tx, ty, pat, p } of sorted) {
      if (!id) {
        // the game's clusters (now HD, 64 px per tile with an 80 px pad); drawn 1:1
        const c = terrain.drawInfectedPlantCanvas(pat);
        ctx.drawImage(c, tx * HD - 80, ty * HD - 80);
      } else {
        const cl = id.startsWith('Q') ? drawStackCluster(id, p, pat, 80) : drawPlantCluster(id, p, pat, 80);
        ctx.drawImage(toCanvas(cl), tx * HD - 80, ty * HD - 80);
      }
    }
    for (const [tx, ty] of [[12, 6], [22, 11]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
    fs.writeFileSync(path.join(out, `plants-${name}${suffix}.png`), canvas.toBuffer('image/png'));
    // 3x crop of one cluster
    const crop = createCanvas(360 * 3, 240 * 3);
    const cc = crop.getContext('2d'); cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, 7 * HD + 20, 130, 360, 240, 0, 0, 1080, 720);
    fs.writeFileSync(path.join(out, `plants-${name}${suffix}-detail.png`), crop.toBuffer('image/png'));
    console.log(name, id ? (PLANT_STYLES[id] || STACK_STYLES[id]).title : 'today', 'done');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
