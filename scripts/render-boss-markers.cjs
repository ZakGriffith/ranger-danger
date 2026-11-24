// Renders the boss-marker study sheet: each variant beside a regular shield at
// 4x, then in place on the map at the three boss levels. Output scripts/out/levelmap-studies/boss-*.png
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const FONTS = process.env.FONT_DIR || '/private/tmp/claude-501/-Users-zakgriffith-ranger-danger/19e30c46-a06a-409f-a372-3acab35a1a94/scratchpad/fonts';
registerFont(path.join(FONTS, 'Cinzel.ttf'), { family: 'Cinzel' });

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const { LEVELS } = await load('/src/levels.ts');
  const lm = await load('/src/assets/art/levelMap.ts');
  const bm = await load('/scripts/levelmap-studies/bossMarkers.ts');
  const host = { createCanvas, loadImage };
  const mapImg = await loadImage(path.join(root, 'src/assets/sprites/level_map_bg.jpg'));
  const out = path.join(__dirname, 'out', 'levelmap-studies');
  const bosses = LEVELS.filter(l => bm.BOSS_IDS.has(l.id));
  for (const v of Object.keys(bm.VARIANTS)) {
    // close-up row: regular shield, then the three bosses, at 4x
    const S = 4, cellW = 80, cellH = 80;
    const close = createCanvas(cellW * 4 * S, cellH * S);
    const cc = close.getContext('2d');
    cc.fillStyle = '#dcc69a'; cc.fillRect(0, 0, close.width, close.height);
    cc.scale(S, S);
    const reg = lm.drawShieldCanvas('tundra', true, S);
    cc.drawImage(reg, cellW / 2 - lm.SHIELD_CENTER.x, 34 - lm.SHIELD_CENTER.y, reg.width / S, reg.height / S);
    cc.font = '700 8px Cinzel'; cc.textAlign = 'center'; cc.fillStyle = '#2b1d12'; cc.fillText('regular', cellW / 2, 70);
    bosses.forEach((l, i) => { bm.drawBossMarker(cc, host, v, l, cellW * (i + 1) + cellW / 2, 34, S, l.id === 17); cc.font = '700 8px Cinzel'; cc.textAlign = 'center'; cc.fillStyle = '#2b1d12'; cc.fillText(l.name, cellW * (i + 1) + cellW / 2, 70); });
    fs.writeFileSync(path.join(out, `boss-${v}-close.png`), close.toBuffer('image/png'));
    // in place, at game scale (about 1.8x): three tiles side by side
    const CS = 2, tw = 300, th = 190;
    const sheet = createCanvas(tw * CS * 3 + 8 * 2, th * CS);
    const sc = sheet.getContext('2d');
    sc.fillStyle = '#15161c'; sc.fillRect(0, 0, sheet.width, sheet.height);
    for (let i = 0; i < bosses.length; i++) { const tile = await bm.renderContext(host, mapImg, v, bosses[i], CS, tw, th); sc.drawImage(tile, i * (tw * CS + 8), 0); }
    fs.writeFileSync(path.join(out, `boss-${v}-map.png`), sheet.toBuffer('image/png'));
    console.log(v);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
