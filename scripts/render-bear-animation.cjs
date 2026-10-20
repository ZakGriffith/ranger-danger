const { createCanvas } = require('canvas');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`Unexpected element: ${tag}`);
    return createCanvas(1, 1);
  },
};

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'bear-animation');
const SIZE = 64;
const WIDTH = 1192;
const HEIGHT = 652;
const SAMPLE_FPS = 60;
const C = {
  background: '#17241e', panel: '#25382c', field: '#405c38',
  title: '#f0e9d6', text: '#b5c1ab', accent: '#d5bd80',
};

async function makeLoader() {
  const { runnerImport } = await import('vite');
  const config = {
    root: ROOT,
    logLevel: 'error',
    plugins: [{
      name: 'phaser-stub',
      resolveId: id => id === 'phaser' ? '\0phaser-stub' : null,
      load: id => id === '\0phaser-stub' ? 'export default {};' : null,
    }],
  };
  return async file => (await runnerImport(file, config)).module;
}

function text(ctx, value, x, y, size = 14, color = C.text, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function fill(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function sprite(ctx, frame, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#20321d66';
  ctx.beginPath();
  ctx.ellipse(32 * scale, 54 * scale, 23 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(frame, 0, 0, SIZE * scale, SIZE * scale);
  ctx.restore();
}

function makeBackdrop(moveCount, attackCount, moveFps, attackFps) {
  const board = createCanvas(WIDTH, HEIGHT);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, WIDTH, HEIGHT, C.background);
  text(ctx, 'C / SHAGGY BROWN BEAR', 28, 48, 30, C.title, true);
  text(ctx, 'Hand-authored 64 × 64 pixel art', 29, 78, 16);
  fill(ctx, 28, 106, 732, 490, C.panel);
  fill(ctx, 780, 106, 384, 490, C.panel);
  text(ctx, 'WALK', 48, 140, 20, C.accent, true);
  text(ctx, `Heavy stride · ${moveCount} frames · ${moveFps} fps`, 48, 165);
  text(ctx, 'SWIPE', 800, 140, 20, C.accent, true);
  text(ctx, `Front paw · ${attackCount} frames · ${attackFps} fps`, 800, 165);
  fill(ctx, 48, 186, 336, 296, C.field);
  fill(ctx, 404, 186, 336, 296, C.field);
  fill(ctx, 800, 186, 344, 296, C.field);
  text(ctx, 'Facing right / 4×', 64, 470, 12);
  text(ctx, 'Facing left / 4×', 420, 470, 12);
  text(ctx, 'Wind-up · strike · recovery / 4×', 816, 470, 12);
  for (const x of [48, 404, 800]) {
    fill(ctx, x, 500, 80, 80, C.field);
    text(ctx, 'Native 64 px', x + 96, 529, 15, C.title);
    text(ctx, 'Unscaled sprite', x + 96, 550, 13);
  }
  text(ctx, 'Preview loop · shaggy chest · broad paws · warm brown coat', 29, 629, 14);
  return board;
}

function frameIndex(time, fps, count) {
  return Math.floor(time * fps + 1e-8) % count;
}

function renderBoard(backdrop, frames, moveFps, attackFps, time) {
  const board = createCanvas(WIDTH, HEIGHT);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(backdrop, 0, 0);
  const moveIndex = frameIndex(time, moveFps, frames.right.moves.length);
  const attackIndex = frameIndex(time, attackFps, frames.right.attacks.length);
  const right = frames.right.moves[moveIndex];
  const left = frames.left.moves[moveIndex];
  const swipe = frames.right.attacks[attackIndex];
  sprite(ctx, right, 88, 198, 4);
  sprite(ctx, left, 444, 198, 4);
  sprite(ctx, swipe, 844, 198, 4);
  sprite(ctx, right, 56, 508, 1);
  sprite(ctx, left, 412, 508, 1);
  sprite(ctx, swipe, 808, 508, 1);
  return board;
}

function writePng(name, canvas) {
  fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
}

function makeSheet(frames) {
  const sheet = createCanvas(SIZE * frames.length, SIZE);
  const ctx = sheet.getContext('2d');
  frames.forEach((frame, i) => ctx.drawImage(frame, i * SIZE, 0));
  return sheet;
}

function contactSheet(moves, attacks, direction, moveFps, attackFps) {
  const columns = 8;
  const cell = 140;
  const rowHeight = 176;
  const moveRows = Math.ceil(moves.length / columns);
  const attackRows = Math.ceil(attacks.length / columns);
  const width = 48 + cell * columns;
  const height = 148 + rowHeight * (moveRows + attackRows);
  const sheet = createCanvas(width, height);
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, width, height, C.background);
  text(ctx, `C / SHAGGY BROWN BEAR — FACING ${direction.toUpperCase()}`, 24, 36, 23, C.title, true);
  let top = 88;
  for (const [frames, label, prefix] of [
    [moves, `Walk · ${moveFps} fps`, 'move'],
    [attacks, `Front-paw swipe · ${attackFps} fps`, 'atk'],
  ]) {
    text(ctx, label, 24, top - 14, 15, C.accent, true);
    frames.forEach((frame, i) => {
      const x = 24 + i % columns * cell;
      const y = top + Math.floor(i / columns) * rowHeight;
      fill(ctx, x, y, 128, 128, C.field);
      sprite(ctx, frame, x, y, 2);
      text(ctx, `${prefix}${i}`, x + 3, y + 148, 12);
    });
    top += Math.ceil(frames.length / columns) * rowHeight + 24;
  }
  return sheet;
}

function writeHtml(backdrop, frames, moveFps, attackFps) {
  const sources = {
    backdrop: backdrop.toDataURL(),
    right: frames.right.moves.map(frame => frame.toDataURL()),
    left: frames.left.moves.map(frame => frame.toDataURL()),
    attacks: frames.right.attacks.map(frame => frame.toDataURL()),
  };
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shaggy brown bear — animation study</title>
<style>
body{margin:0;padding:24px;background:${C.background};color:${C.title};font:15px system-ui,sans-serif}
main{max-width:${WIDTH}px;margin:auto}canvas{display:block;width:100%;height:auto;image-rendering:pixelated}
.controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 28px}button,select{font:inherit;color:${C.title};background:${C.panel};border:1px solid ${C.field};border-radius:4px;padding:7px 12px}
label{color:${C.text}}p{color:${C.text};padding:0 28px;font-size:13px}
</style><main><canvas width="${WIDTH}" height="${HEIGHT}" aria-label="Animated shaggy brown bear walking right, walking left, and swiping its front paw"></canvas>
<div class="controls"><button id="pause">Pause</button><label>Speed <select id="speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><span>Walk: ${moveFps} fps · Swipe: ${attackFps} fps</span></div>
<p>Pixel art is displayed at exact 4× and 1× scale on the full-size canvas. Resize the browser to inspect the complete board.</p></main>
<script>
const sources=${JSON.stringify(sources)};
const load=src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.src=src});
Promise.all([load(sources.backdrop),Promise.all(sources.right.map(load)),Promise.all(sources.left.map(load)),Promise.all(sources.attacks.map(load))]).then(([backdrop,right,left,attacks])=>{
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
let paused=false,time=0,last,rate=1;
document.querySelector('#pause').onclick=event=>{paused=!paused;event.target.textContent=paused?'Play':'Pause'};
document.querySelector('#speed').onchange=event=>{rate=Number(event.target.value)};
const draw=(frame,x,y,scale)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle='#20321d66';ctx.beginPath();ctx.ellipse(32*scale,54*scale,23*scale,4*scale,0,0,Math.PI*2);ctx.fill();ctx.drawImage(frame,0,0,64*scale,64*scale);ctx.restore()};
function tick(now){if(last!==undefined&&!paused)time+=(now-last)/1000*rate;last=now;
ctx.drawImage(backdrop,0,0);const moveIndex=Math.floor(time*${moveFps}+1e-8)%right.length;const attackIndex=Math.floor(time*${attackFps}+1e-8)%attacks.length;
draw(right[moveIndex],88,198,4);draw(left[moveIndex],444,198,4);draw(attacks[attackIndex],844,198,4);draw(right[moveIndex],56,508,1);draw(left[moveIndex],412,508,1);draw(attacks[attackIndex],808,508,1);requestAnimationFrame(tick)}requestAnimationFrame(tick);
});
</script></html>`;
  fs.writeFileSync(path.join(OUT, 'bear-preview.html'), html);
}

function writeGif(python, sampleCount) {
  const source = `import sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
images = [Image.open(root / 'preview-frames' / f'{i:03d}.png').convert('RGB') for i in range(${sampleCount})]
palette_source = Image.new('RGB', (${WIDTH}, ${HEIGHT} * min(12, len(images))))
for i in range(min(12, len(images))):
    palette_source.paste(images[i * len(images) // min(12, len(images))], (0, i * ${HEIGHT}))
palette = palette_source.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
durations = [round((i+1)*100/${SAMPLE_FPS})*10-round(i*100/${SAMPLE_FPS})*10 for i in range(len(frames))]
target = root / 'bear-animation.gif'
frames[0].save(target, save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=1, optimize=True)
with Image.open(target) as image:
    duration = 0
    for i in range(image.n_frames):
        image.seek(i)
        duration += image.info['duration']
    assert duration == sum(durations), (duration, sum(durations))
    print(f'{target} ({image.n_frames} GIF frames; {duration} ms)')
`;
  const result = spawnSync(python, ['-c', source, OUT], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  process.stdout.write(result.stdout);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return a / gcd(a, b) * b;
}

function loopSeconds(moveCount, attackCount, moveFps, attackFps) {
  const ticksPerSecond = lcm(moveFps, attackFps);
  const moveTicks = moveCount * (ticksPerSecond / moveFps);
  const attackTicks = attackCount * (ticksPerSecond / attackFps);
  return lcm(moveTicks, attackTicks) / ticksPerSecond;
}

function checkedFrame(hd, draw, name) {
  const frame = hd.makeHD(SIZE, (put, raw) => draw(
    (x, y, paint) => {
      if (paint !== null && (Math.floor(x) < 1 || Math.floor(y) < 1 || Math.floor(x) >= SIZE - 1 || Math.floor(y) >= SIZE - 1)) {
        throw new Error(`${name}: body pixel (${x}, ${y}) leaves no room for the outline`);
      }
      put(x, y, paint);
    },
    (x, y, color, alpha = 1) => {
      if (alpha > 0 && (Math.floor(x) < 0 || Math.floor(y) < 0 || Math.floor(x) >= SIZE || Math.floor(y) >= SIZE)) {
        throw new Error(`${name}: shadow pixel (${x}, ${y}) is outside the canvas`);
      }
      raw(x, y, color, alpha);
    },
  ));
  const pixels = frame.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  const bounds = [SIZE, SIZE, -1, -1];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (pixels[(y * SIZE + x) * 4 + 3] === 0) continue;
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
  }
  if (bounds[2] < 0) throw new Error(`${name}: empty frame`);
  return { frame, bounds };
}

async function main() {
  const args = process.argv.slice(2);
  const pythonIndex = args.indexOf('--python');
  const python = pythonIndex < 0 ? null : args[pythonIndex + 1];
  if (pythonIndex >= 0 && !python) throw new Error('--python requires a Python executable with Pillow installed');
  const load = await makeLoader();
  const hd = await load('/src/assets/art/hd.ts');
  const bear = await load('/src/assets/art/bear.ts');
  const moveFps = bear.BEAR_MOVE_FPS;
  const attackFps = bear.BEAR_ATK_FPS;
  if (!Number.isInteger(moveFps) || moveFps <= 0 || !Number.isInteger(attackFps) || attackFps <= 0) {
    throw new Error('Bear animation exports must include positive integer BEAR_MOVE_FPS and BEAR_ATK_FPS');
  }
  if (SAMPLE_FPS < Math.max(moveFps, attackFps)) throw new Error('Preview sampling would omit animation frames');
  const frames = {};
  const bounds = [];
  for (const [direction, dir] of [['right', 'r'], ['left', 'l']]) {
    const render = names => names.map(name => {
      const result = checkedFrame(hd, bear.drawBear(name, dir), `${name}_${dir}`);
      bounds.push({ frame: `${name}_${dir}`, bounds: result.bounds });
      return result.frame;
    });
    frames[direction] = { moves: render(bear.BEAR_MOVE_FRAMES), attacks: render(bear.BEAR_ATK_FRAMES) };
  }
  const seconds = loopSeconds(bear.BEAR_MOVE_FRAMES.length, bear.BEAR_ATK_FRAMES.length, moveFps, attackFps);
  const sampleCount = Math.round(seconds * SAMPLE_FPS);
  if (Math.abs(sampleCount / SAMPLE_FPS - seconds) > 1e-8) throw new Error('Common animation cycle must align with preview sampling');
  const sampledMoves = new Set();
  const sampledAttacks = new Set();
  for (let i = 0; i < sampleCount; i++) {
    sampledMoves.add(frameIndex(i / SAMPLE_FPS, moveFps, bear.BEAR_MOVE_FRAMES.length));
    sampledAttacks.add(frameIndex(i / SAMPLE_FPS, attackFps, bear.BEAR_ATK_FRAMES.length));
  }
  if (sampledMoves.size !== bear.BEAR_MOVE_FRAMES.length || sampledAttacks.size !== bear.BEAR_ATK_FRAMES.length) {
    throw new Error('Preview loop is missing animation frames');
  }
  fs.mkdirSync(path.join(OUT, 'preview-frames'), { recursive: true });
  for (const [direction, rows] of Object.entries(frames)) {
    rows.moves.forEach((frame, i) => writePng(`move${i}-${direction}.png`, frame));
    rows.attacks.forEach((frame, i) => writePng(`atk${i}-${direction}.png`, frame));
    writePng(`bear-move-${direction}-sheet.png`, makeSheet(rows.moves));
    writePng(`bear-swipe-${direction}-sheet.png`, makeSheet(rows.attacks));
    writePng(`bear-contact-${direction}.png`, contactSheet(rows.moves, rows.attacks, direction, moveFps, attackFps));
  }
  const backdrop = makeBackdrop(bear.BEAR_MOVE_FRAMES.length, bear.BEAR_ATK_FRAMES.length, moveFps, attackFps);
  writePng('bear-preview.png', renderBoard(backdrop, frames, moveFps, attackFps, 0));
  for (let i = 0; i < sampleCount; i++) {
    writePng(`preview-frames/${String(i).padStart(3, '0')}.png`, renderBoard(backdrop, frames, moveFps, attackFps, i / SAMPLE_FPS));
  }
  writeHtml(backdrop, frames, moveFps, attackFps);
  fs.writeFileSync(path.join(OUT, 'frame-bounds.json'), JSON.stringify(bounds, null, 2));
  console.log(`Validated ${bounds.length} frames: no clipped body or shadow pixels; all ${sampledMoves.size} move and ${sampledAttacks.size} swipe poses sampled in a ${seconds}s loop at ${SAMPLE_FPS} fps.`);
  if (python) writeGif(python, sampleCount);
  console.log(path.join(OUT, 'bear-preview.png'));
  console.log(path.join(OUT, 'bear-preview.html'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
