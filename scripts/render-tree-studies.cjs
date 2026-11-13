// Renders the HD tree studies: a lineup of single trees and the real cluster
// patterns over the F1 forest floor, next to the current trees for scale.
const { createCanvas, createImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const HD = 64;
async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const terrain = await load('/src/assets/art/terrain.ts');
  const { FOREST_STYLES } = await load('/scripts/meadow-studies/forest.ts');
  const { drawCluster, TREE_STYLES } = await load('/scripts/meadow-studies/trees.ts');
  const out = path.join(__dirname, 'out', 'forest-studies');
  fs.mkdirSync(out, { recursive: true });
  const ranger = hd.makeHD(64, player.drawPlayer('idle0', 'level'));
  const bow = hd.makeHD(64, player.drawBow(false));
  const toCanvas = r => { const c = createCanvas(r.w, r.h); c.getContext('2d').putImageData(createImageData(r.data, r.w, r.h), 0, 0); return c; };

  const COLS = 30, ROWS = 14, W = COLS * HD, H = ROWS * HD;
  const floor = toCanvas(FOREST_STYLES.F1.render(0, 0, W, H));
  // the game's cluster placement: pattern anchored at tile origin, image centred on the pattern
  const placements = [[0, 1, 2], [4, 1, 6], [8, 2, 14], [14, 1, 9], [19, 3, 4], [24, 1, 13], [2, 8, 7], [8, 9, 11], [15, 8, 3], [21, 9, 12], [26, 8, 0]];
  const variants = [['current', null, null], ['T1', 'T1', null], ['T2', 'T2', null], ['T3', 'T3', null]];
  for (const [name, id, earth] of variants) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(floor, 0, 0);
    const sorted = placements.map(([tx, ty, pat]) => ({ tx, ty, pat, p: terrain.TREE_PATTERNS[pat] })).sort((a, b) => (a.ty + a.p.h) - (b.ty + b.p.h));
    for (const { tx, ty, pat, p } of sorted) {
      if (!id) {
        const c = terrain.drawTreeClusterCanvas(pat);
        ctx.drawImage(c, tx * HD - 80, ty * HD - 80);
      } else {
        const c = toCanvas(drawCluster(id, p, pat, 80, earth));
        ctx.drawImage(c, tx * HD - 80, ty * HD - 80);
      }
    }
    for (const [tx, ty] of [[12, 6], [22, 11]]) { ctx.drawImage(ranger, tx * HD, ty * HD, 64, 64); ctx.drawImage(bow, tx * HD, ty * HD, 64, 64); }
    fs.writeFileSync(path.join(out, `trees-${name}.png`), canvas.toBuffer('image/png'));
    // 3x crop of one cluster
    const crop = createCanvas(360 * 3, 240 * 3);
    const cc = crop.getContext('2d'); cc.imageSmoothingEnabled = false;
    cc.drawImage(canvas, 7 * HD + 20, 130, 360, 240, 0, 0, 1080, 720);
    fs.writeFileSync(path.join(out, `trees-${name}-detail.png`), crop.toBuffer('image/png'));
    console.log(name, 'done');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
