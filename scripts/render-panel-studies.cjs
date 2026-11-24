// Renders the difficulty-panel studies over a dimmed shot of the scroll map.
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const FONTS = process.env.FONT_DIR || '/private/tmp/claude-501/-Users-zakgriffith-ranger-danger/19e30c46-a06a-409f-a372-3acab35a1a94/scratchpad/fonts';
registerFont(path.join(FONTS, 'Cinzel.ttf'), { family: 'Cinzel' });
registerFont(path.join(FONTS, 'CinzelDecorative-Bold.ttf'), { family: 'Cinzel Decorative', weight: '700' });
async function main() {
  const { runnerImport } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const config = { root, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const { PANELS, DRAW } = (await runnerImport('/scripts/levelmap-studies/panelStudies.ts', config)).module;
  const out = path.join(__dirname, 'out', 'levelmap-studies');
  const shot = await loadImage(path.join(out, 'ingame.png'));
  const S = 2, W = 480, H = 360;
  const states = [
    { name: 'Meadow', biome: 'grasslands', biomeLabel: 'Grasslands', earned: ['easy', 'medium', 'hard'], selected: 'medium' },
    { name: 'Desert Temple', biome: 'desert', biomeLabel: 'Desert', earned: ['easy'], selected: '' },
  ];
  for (const id of Object.keys(PANELS)) {
    const sheet = createCanvas(W * S * 2 + 8, H * S);
    const sc = sheet.getContext('2d');
    sc.fillStyle = '#15161c'; sc.fillRect(0, 0, sheet.width, sheet.height);
    states.forEach((st, i) => {
      const c = createCanvas(W * S, H * S), ctx = c.getContext('2d');
      // a 480x360 window of the 1920-wide shot, around the centre, dimmed like the live backdrop
      ctx.drawImage(shot, 480, 260, W * S, H * S, 0, 0, W * S, H * S);
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.scale(S, S);
      DRAW[id](ctx, W / 2, H / 2, st);
      sc.drawImage(c, i * (W * S + 8), 0);
    });
    fs.writeFileSync(path.join(out, `panel-${id}.png`), sheet.toBuffer('image/png'));
    console.log(id);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
