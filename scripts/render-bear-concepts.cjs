const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

globalThis.document = { createElement: () => createCanvas(1, 1) };

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
  const spider = await load('/src/assets/art/spider.ts');
  const specs = [
    ['grizzly', 'drawGrizzly', 'A', 'Woodland grizzly', 'Warm fur / raised shoulders'],
    ['black', 'drawBlackBear', 'B', 'Forest black bear', 'Charcoal coat / longer silhouette'],
    ['shaggy', 'drawShaggyBear', 'C', 'Shaggy brown bear', 'Heavy chest / broad planted paws'],
  ];
  const out = path.join(__dirname, 'out', 'bear-pixel-concepts');
  fs.mkdirSync(out, { recursive: true });
  const board = createCanvas(1152, 734);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#17241e'; ctx.fillRect(0, 0, 1152, 734);
  ctx.fillStyle = '#f0e9d6'; ctx.font = 'bold 30px sans-serif';
  ctx.fillText('FOREST BEARS', 32, 48);
  ctx.fillStyle = '#b5c1ab'; ctx.font = '16px sans-serif';
  ctx.fillText('64 × 64 pixel art • static design options', 33, 77);

  for (let i = 0; i < specs.length; i++) {
    const [name, exportName, letter, title, detail] = specs[i];
    const mod = await load(`/scripts/sprite-tries/bear-${name}.ts`);
    const sprite = hd.makeHD(64, mod[exportName]);
    fs.writeFileSync(path.join(out, `${name}-64.png`), sprite.toBuffer('image/png'));
    const x = 32 + i * 372;
    ctx.fillStyle = '#25382c'; ctx.fillRect(x, 108, 344, 508);
    ctx.fillStyle = '#d5bd80'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText(letter, x + 18, 142);
    ctx.fillStyle = '#f0e9d6'; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(title, x + 47, 142);
    ctx.fillStyle = '#b5c1ab'; ctx.font = '14px sans-serif';
    ctx.fillText(detail, x + 18, 169);
    ctx.fillStyle = '#405c38'; ctx.fillRect(x + 12, 190, 320, 292);
    ctx.drawImage(sprite, x + 44, 202, 256, 256);
    ctx.fillStyle = '#a6ba94'; ctx.font = '12px sans-serif';
    ctx.fillText('4× enlarged', x + 23, 472);
    ctx.fillStyle = '#405c38'; ctx.fillRect(x + 20, 512, 80, 80);
    ctx.drawImage(sprite, x + 28, 520, 64, 64);
    ctx.fillStyle = '#e3e1cf'; ctx.font = '15px sans-serif';
    ctx.fillText('Native 64 px', x + 118, 544);
    ctx.fillStyle = '#aebca6'; ctx.font = '13px sans-serif';
    ctx.fillText('Unscaled sprite', x + 118, 565);
  }
  ctx.fillStyle = '#25382c'; ctx.fillRect(32, 636, 1088, 76);
  ctx.drawImage(hd.makeHD(64, spider.drawSpider('move0')), 46, 637, 64, 64);
  ctx.fillStyle = '#e3e1cf'; ctx.font = '15px sans-serif';
  ctx.fillText('Same technique as the approved spider', 126, 665);
  ctx.fillStyle = '#aebca6'; ctx.font = '13px sans-serif';
  ctx.fillText('Hand-authored pixel shapes, limited palettes, clear outlines and clustered highlights.', 126, 689);
  const target = path.join(out, 'bear-options.png');
  fs.writeFileSync(target, board.toBuffer('image/png'));
  console.log(target);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
