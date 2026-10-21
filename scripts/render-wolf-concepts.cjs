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
  const bear = await load('/src/assets/art/bear.ts');
  const lighter = process.argv.includes('--lighter');
  const specs = lighter ? [
    ['balanced', 'drawBalancedWolf', 'D', 'Soft charcoal edge', 'Medium definition / softer interior shadows'],
    ['fine', 'drawFineWolf', 'E', 'Fine colored edge', 'Thin border / warm gray fur'],
    ['selective', 'drawSelectiveWolf', 'F', 'Selective outline', 'Open highlights / shadowed lower edges'],
  ] : [
    ['gray', 'drawGrayWolf', 'A', 'Gray prowler', 'Lean frame / silver coat / alert ears'],
    ['timber', 'drawTimberWolf', 'B', 'Shaggy timber wolf', 'Thick ruff / warm gray / cream throat'],
    ['dark', 'drawDarkWolf', 'C', 'Dark woodland wolf', 'Broad shoulders / slate fur / low stance'],
  ];
  const out = path.join(__dirname, 'out', 'wolf-pixel-concepts');
  fs.mkdirSync(out, { recursive: true });
  const board = createCanvas(1248, 790);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const text = (value, x, y, size = 14, color = '#b5c1ab', bold = false) => {
    ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`; ctx.fillText(value, x, y);
  };
  const fill = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const sprite = (image, x, y, scale) => {
    ctx.fillStyle = '#20321d66'; ctx.beginPath();
    ctx.ellipse(x + 32 * scale, y + 55 * scale, 25 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(image, x, y, 64 * scale, 64 * scale);
  };
  fill(0, 0, 1248, 790, '#17241e');
  text(lighter ? 'FOREST WOLVES / LIGHTER EDGES' : 'FOREST WOLVES', 32, 49, 30, '#f0e9d6', true);
  text(lighter ? 'Three lighter treatments · static 64 × 64 pixel art' : 'Static design options · hand-authored 64 × 64 pixel art · bold dark borders', 33, 79, 16);

  for (let i = 0; i < specs.length; i++) {
    const [name, exportName, letter, title, detail] = specs[i];
    const mod = await load(`/scripts/sprite-tries/wolf-${name}.ts`);
    const image = hd.makeHD(64, (put, raw) => mod[exportName]((x, y, color) => {
      if (color !== null && (x < 1 || y < 1 || x >= 63 || y >= 63)) throw Error(`${name} pixel clips its outline at ${x},${y}`);
      put(x, y, color);
    }, raw), { outline: !lighter });
    fs.writeFileSync(path.join(out, `wolf-${name}.png`), image.toBuffer('image/png'));
    const x = 32 + i * 400;
    fill(x, 108, 384, 526, '#25382c');
    text(letter, x + 18, 144, 22, '#d5bd80', true);
    text(title, x + 50, 144, 20, '#f0e9d6', true);
    text(detail, x + 18, 174, 14);
    fill(x + 16, 196, 352, 310, '#405c38');
    sprite(image, x + 64, 211, 4);
    text('4× enlarged', x + 29, 491, 12);
    if (lighter) {
      const [previousName, previousDraw] = [['gray', 'drawGrayWolf'], ['timber', 'drawTimberWolf'], ['dark', 'drawDarkWolf']][i];
      const previous = await load(`/scripts/sprite-tries/wolf-${previousName}.ts`);
      fill(x + 20, 526, 80, 80, '#405c38');
      sprite(hd.makeHD(64, previous[previousDraw]), x + 28, 526, 1);
      text('Previous', x + 32, 604, 12);
      fill(x + 116, 526, 80, 80, '#405c38');
      sprite(image, x + 124, 526, 1);
      text('New', x + 143, 604, 12);
      text('Native 64 px', x + 216, 556, 15, '#e3e1cf');
      text('Compare edge weight', x + 216, 581, 12);
    } else {
      fill(x + 20, 526, 80, 80, '#405c38');
      sprite(image, x + 28, 534, 1);
      text('Native 64 px', x + 118, 556, 15, '#e3e1cf');
      text('Same outline treatment in each option', x + 118, 581, 12);
    }
  }
  fill(32, 654, 1184, 108, '#25382c');
  sprite(hd.makeHD(64, bear.drawBear('atk0')), 42, 657, 1.5);
  text('Shaggy bear / style reference', 160, 691, 17, '#e3e1cf', true);
  text(lighter ? 'The same pixel art family, with less dark edging and more visible fur.' : 'Dark silhouettes, layered fur shapes, and clean highlights — carried into all three wolves.', 160, 721, 15);
  const basename = lighter ? 'wolf-light-options' : 'wolf-options';
  const target = path.join(out, basename + '.png');
  fs.writeFileSync(target, board.toBuffer('image/png'));
  const description = lighter
    ? 'Three lighter pixel art wolf options: D soft charcoal edges, E fine colored edges, F selective outlining. Previous versions shown below at native size.'
    : 'Three static pixel art wolf options: A lean silver-gray prowler, B shaggy timber wolf, C dark stocky woodland wolf. All have thick dark outlines.';
  fs.writeFileSync(path.join(out, basename + '.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Forest wolves — ${lighter ? 'lighter edges' : 'static pixel art options'}</title><style>body{margin:0;padding:20px;background:#17241e;color:#f0e9d6;font:16px system-ui}main{max-width:1248px;margin:auto}img{display:block;width:100%;height:auto;image-rendering:pixelated}p{padding:0 12px;color:#b5c1ab}</style><main><img src="${basename}.png" alt="${description}"><p>Choose ${lighter ? 'D, E, or F' : 'A, B, or C'}, or combine details you like. These are static concepts; animations have not been started.</p></main></html>`);
  console.log('All three static sprites passed outline bounds checks.');
  console.log(target);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
