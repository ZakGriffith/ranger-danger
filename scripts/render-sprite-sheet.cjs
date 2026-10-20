// Renders sprite contact sheets to PNG without launching the game. The
// TypeScript art modules are loaded through Vite's module runner and drawn
// with node-canvas.
//
//   node scripts/render-sprite-sheet.cjs                       -> scripts/out/meadow-sheet.png
//        the HD meadow enemies (snake, rat, deer) next to the ranger, every frame
//   node scripts/render-sprite-sheet.cjs --tries <module.ts>   -> scripts/out/<module name>.png
//        one row per design try exported by the module (export const TRIES: Try[])
//
// Optional trailing args: <out.png> <pixel scale>   (defaults: see above, 3)
// Optional --crop x,y,w,h   renders only that region (sprite px) of every frame

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// hd.ts builds textures with document.createElement('canvas'); hand it node-canvas.
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`render-sprite-sheet: unexpected createElement('${tag}')`);
    return createCanvas(1, 1);
  },
};

const ROOT = path.resolve(__dirname, '..');
const FRAME = 64;

async function makeLoader() {
  const { runnerImport } = await import('vite');
  const config = {
    root: ROOT,
    logLevel: 'error',
    // canvas.ts imports Phaser for a type; Phaser itself needs a browser, so stub it.
    plugins: [{
      name: 'phaser-stub',
      resolveId: (id) => (id === 'phaser' ? '\0phaser-stub' : null),
      load: (id) => (id === '\0phaser-stub' ? 'export default {};' : null),
    }],
  };
  return async (file) => (await runnerImport(file, config)).module;
}

async function meadowRows(load, hd) {
  const md = await load('/src/assets/art/meadow.ts');
  const dr = await load('/src/assets/art/deer.ts');
  const pl = await load('/src/assets/art/player.ts');
  const moves = [...md.MEADOW_MOVE_FRAMES];
  const atks = [...md.MEADOW_ATK_FRAMES];
  const enemy = (draw, extra) => [...moves, ...atks].map((f) => hd.makeHD(FRAME, draw(f))).concat(extra ? [hd.makeHD(FRAME, extra)] : []);
  return [
    { label: 'snake   move0-7 | atk0-4 | tongue', frames: enemy(md.drawSnake, md.drawSnake('move0', true)) },
    { label: 'rat     move0-7 | atk0-4', frames: enemy(md.drawRat) },
    { label: 'deer    move0-7 | atk0-4', frames: enemy(dr.drawDeer) },
    { label: 'ranger (reference)   idle0-3 | move0-5',
      frames: ['idle0', 'idle1', 'idle2', 'idle3', 'move0', 'move1', 'move2', 'move3', 'move4', 'move5'].map((f) => hd.makeHD(FRAME, pl.drawPlayer(f))) },
  ];
}

async function triesRows(load, hd, modulePath) {
  const url = '/' + path.relative(ROOT, path.resolve(modulePath)).split(path.sep).join('/');
  const mod = await load(url);
  if (!Array.isArray(mod.TRIES)) throw new Error(`${modulePath} does not export TRIES`);
  return mod.TRIES.map((t) => ({
    label: `${t.name}   ${t.frames.map((fr) => fr.label).join('  ')}`,
    frames: t.frames.map((fr) => hd.makeHD(FRAME, fr.draw)),
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const triesIdx = args.indexOf('--tries');
  const triesModule = triesIdx >= 0 ? args.splice(triesIdx, 2)[1] : null;
  const cropIdx = args.indexOf('--crop');
  const crop = cropIdx >= 0 ? args.splice(cropIdx, 2)[1].split(',').map(Number) : [0, 0, FRAME, FRAME];
  const [cx, cy, cw, ch] = crop;
  const [outArg, scaleArg] = args;
  const defaultName = triesModule ? path.basename(triesModule).replace(/\.[cm]?[tj]s$/, '') : 'meadow-sheet';
  const outPath = path.resolve(outArg || path.join(__dirname, 'out', `${defaultName}.png`));
  const px = Number(scaleArg || 3);

  const load = await makeLoader();
  const hd = await load('/src/assets/art/hd.ts');
  const rows = triesModule ? await triesRows(load, hd, triesModule) : await meadowRows(load, hd);

  const cellW = cw * px, cellH = ch * px, gap = 4, margin = 10, labelH = 18;
  const cols = Math.max(...rows.map((r) => r.frames.length));
  const W = margin * 2 + cols * (cellW + gap) - gap;
  const H = margin * 2 + rows.length * (labelH + cellH + gap) - gap;
  const sheet = createCanvas(W, H);
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2a4a1e';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '13px monospace';

  let y = margin;
  for (const row of rows) {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(row.label, margin, y + 13);
    y += labelH;
    row.frames.forEach((frame, i) => {
      const x = margin + i * (cellW + gap);
      ctx.fillStyle = '#355f28';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.drawImage(frame, cx, cy, cw, ch, x, y, cellW, cellH);
    });
    y += cellH + gap;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, sheet.toBuffer('image/png'));
  console.log(`wrote ${outPath} (${W}x${H})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
