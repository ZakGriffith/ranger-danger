// Renders the level-select map studies to scripts/out/levelmap-studies/.
//   node scripts/render-levelmap-studies.cjs [M1 M2 M3]
const { createCanvas, createImageData, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const FONTS = process.env.FONT_DIR || '/private/tmp/claude-501/-Users-zakgriffith-ranger-danger/19e30c46-a06a-409f-a372-3acab35a1a94/scratchpad/fonts';
registerFont(path.join(FONTS, 'Cinzel.ttf'), { family: 'Cinzel' });
registerFont(path.join(FONTS, 'CinzelDecorative-Bold.ttf'), { family: 'Cinzel Decorative', weight: '700' });
registerFont(path.join(FONTS, 'CinzelDecorative-Black.ttf'), { family: 'Cinzel Decorative', weight: '900' });

const only = process.argv.slice(2).filter(a => /^M\d$/.test(a));
const want = id => only.length === 0 || only.includes(id);

async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const player = await load('/src/assets/art/player.ts');
  const { renderMap } = await load('/scripts/levelmap-studies/map.ts');
  const out = path.join(__dirname, 'out', 'levelmap-studies');
  fs.mkdirSync(out, { recursive: true });
  const ranger = createCanvas(64, 64);
  const rc = ranger.getContext('2d');
  rc.drawImage(hd.makeHD(64, player.drawPlayer('idle0', 'level')), 0, 0);
  rc.drawImage(hd.makeHD(64, player.drawBow(false)), 0, 0);
  const host = { createCanvas, createImageData };
  const unlockedIds = new Set([1, 2, 3, 4, 5]);
  const medals = { 1: ['easy', 'medium', 'hard'], 2: ['easy', 'medium'], 3: ['easy'], 4: ['easy'] };
  for (const style of ['M1', 'M2', 'M3']) {
    if (!want(style)) continue;
    const t0 = Date.now();
    const c = renderMap({ host, style, unlockedIds, medals, ranger, playerLevel: 3 });
    fs.writeFileSync(path.join(out, `${style}.png`), c.toBuffer('image/png'));
    // detail: the meadow / forest / rivers corner at 2x
    const crop = createCanvas(1200, 800);
    const cc = crop.getContext('2d');
    cc.imageSmoothingEnabled = false;
    cc.drawImage(c, 180, 120, 600, 400, 0, 0, 1200, 800);
    fs.writeFileSync(path.join(out, `${style}-detail.png`), crop.toBuffer('image/png'));
    console.log(style, `${Date.now() - t0}ms`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
