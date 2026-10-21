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
  const wolf = await load('/scripts/sprite-tries/wolf-selective.ts');
  const render = (name, draw) => hd.makeHD(64, (put, raw) => draw((x, y, color) => {
    if (color !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x >= 63 || y >= 63)) {
      throw Error(`${name} pixel outside the padded 64 px canvas at ${x},${y}`);
    }
    put(x, y, color);
  }, raw), { outline: false });
  const original = render('Original F', wolf.drawSelectiveWolf);
  const refined = render('F with subtle border', wolf.drawOutlinedSelectiveWolf);
  const originalPixels = original.getContext('2d').getImageData(0, 0, 64, 64).data;
  const refinedPixels = refined.getContext('2d').getImageData(0, 0, 64, 64).data;
  const occupied = (x, y) => x >= 0 && y >= 0 && x < 64 && y < 64 && originalPixels[(y * 64 + x) * 4 + 3] !== 0;
  let preserved = 0;
  let added = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const index = (y * 64 + x) * 4;
      if (occupied(x, y)) {
        for (let component = 0; component < 4; component++) {
          if (originalPixels[index + component] !== refinedPixels[index + component]) {
            throw Error(`Original F body changed at ${x},${y}`);
          }
        }
        preserved++;
      } else if (refinedPixels[index + 3] !== 0) {
        if (![[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => occupied(x + dx, y + dy))) {
          throw Error(`Added border is more than one orthogonal pixel from the silhouette at ${x},${y}`);
        }
        added++;
      }
    }
  }
  if (added === 0) throw Error('The refined F has no added border pixels.');

  const out = path.join(__dirname, 'out', 'wolf-pixel-concepts');
  fs.mkdirSync(out, { recursive: true });
  const board = createCanvas(912, 626);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const text = (value, x, y, size = 14, color = '#b5c1ab', bold = false) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
    ctx.fillText(value, x, y);
  };
  const fill = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const sprite = (image, x, y, scale) => {
    ctx.fillStyle = '#20321d66';
    ctx.beginPath();
    ctx.ellipse(x + 32 * scale, y + 55 * scale, 25 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(image, x, y, 64 * scale, 64 * scale);
  };
  fill(0, 0, 912, 626, '#17241e');
  text('FOREST WOLF / F REFINED', 32, 48, 28, '#f0e9d6', true);
  text('Same silver fur and shape, with a small darker border.', 33, 78, 16);
  const cards = [
    [original, 'ORIGINAL F', 'Open highlights / selective dark edges'],
    [refined, 'F / SUBTLE BORDER', 'One-pixel edge / original fur preserved'],
  ];
  for (let i = 0; i < cards.length; i++) {
    const [image, title, detail] = cards[i];
    const x = 32 + i * 432;
    fill(x, 106, 416, 474, '#25382c');
    text(title, x + 20, 141, 20, '#f0e9d6', true);
    text(detail, x + 20, 168, 14);
    fill(x + 16, 188, 384, 282, '#405c38');
    sprite(image, x + 80, 194, 4);
    text('4× enlarged', x + 28, 458, 12);
    fill(x + 20, 486, 80, 78, '#405c38');
    sprite(image, x + 28, 486, 1);
    text('Native 64 px', x + 118, 517, 15, '#e3e1cf');
    text('Same size as the other forest enemies', x + 118, 542, 12);
  }
  text('Static art refinement · animation has not started', 33, 608, 14);
  const basename = 'wolf-f-border';
  const target = path.join(out, basename + '.png');
  fs.writeFileSync(target, board.toBuffer('image/png'));
  fs.writeFileSync(path.join(out, basename + '.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forest wolf F — subtle border</title>
<style>body{margin:0;padding:20px;background:#17241e;color:#f0e9d6;font:16px system-ui}main{max-width:912px;margin:auto}img{display:block;width:100%;height:auto;image-rendering:pixelated}p{padding:0 12px;color:#b5c1ab}</style>
<main><img src="${basename}.png" alt="Original silver wolf F on the left and the same wolf with a subtle one-pixel darker border on the right, each shown enlarged and at native size."><p>The fur colors, interior details, and pose are unchanged. This is a static art refinement; animation has not started.</p></main></html>`);
  console.log(`Preserved ${preserved} original body pixels; added ${added} border pixels, each one orthogonal pixel from the original silhouette. All pixels are in bounds.`);
  console.log(target);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
