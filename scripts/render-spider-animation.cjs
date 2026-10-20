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
const OUT = path.join(__dirname, 'out', 'spider-animation');
const SIZE = 64;
const WIDTH = 1192;
const HEIGHT = 652;
const FPS = 18;
const SECONDS = 8 / 3;
const ATTACK_PERIOD = SECONDS / 2;
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

function sprite(ctx, frame, x, y, scale, flip = false) {
  ctx.save();
  ctx.translate(x + (flip ? SIZE * scale : 0), y);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.fillStyle = '#20321d66';
  ctx.beginPath();
  ctx.ellipse(32 * scale, 52 * scale, 23 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(frame, 0, 0, SIZE * scale, SIZE * scale);
  ctx.restore();
}

function makeBackdrop() {
  const board = createCanvas(WIDTH, HEIGHT);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, WIDTH, HEIGHT, C.background);
  text(ctx, 'A / WOODLAND TARANTULA', 28, 48, 30, C.title, true);
  text(ctx, 'Hand-authored 64 × 64 pixel art', 29, 78, 16);
  fill(ctx, 28, 106, 732, 490, C.panel);
  fill(ctx, 780, 106, 384, 490, C.panel);
  text(ctx, 'WALK', 48, 140, 20, C.accent, true);
  text(ctx, 'Alternating feet · 12 frames', 48, 165);
  text(ctx, 'BITE', 800, 140, 20, C.accent, true);
  text(ctx, 'Anticipation · strike · recovery', 800, 165);
  fill(ctx, 48, 186, 336, 296, C.field);
  fill(ctx, 404, 186, 336, 296, C.field);
  fill(ctx, 800, 186, 344, 296, C.field);
  text(ctx, 'Facing right / 4×', 64, 470, 12);
  text(ctx, 'Facing left / 4×', 420, 470, 12);
  text(ctx, '8 frames / 4×', 816, 470, 12);
  for (const x of [48, 404, 800]) {
    fill(ctx, x, 500, 80, 80, C.field);
    text(ctx, 'Native 64 px', x + 96, 529, 15, C.title);
    text(ctx, 'Unscaled sprite', x + 96, 550, 13);
  }
  text(ctx, 'Preview loop · warm copper bands · separated face and leg roots', 29, 629, 14);
  return board;
}

function renderBoard(backdrop, moves, attacks, time) {
  const board = createCanvas(WIDTH, HEIGHT);
  const ctx = board.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(backdrop, 0, 0);
  const move = moves[Math.floor(time * 18) % moves.length];
  const attackTime = time % ATTACK_PERIOD - 0.25;
  const attackIndex = Math.floor(attackTime * 16);
  const bite = attackIndex >= 0 && attackIndex < attacks.length ? attacks[attackIndex] : moves[0];
  sprite(ctx, move, 88, 198, 4);
  sprite(ctx, move, 444, 198, 4, true);
  sprite(ctx, bite, 844, 198, 4);
  sprite(ctx, move, 56, 508, 1);
  sprite(ctx, move, 412, 508, 1, true);
  sprite(ctx, bite, 808, 508, 1);
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

function contactSheet(moves, attacks) {
  const scale = 2;
  const cell = SIZE * scale + 12;
  const width = 48 + cell * moves.length;
  const sheet = createCanvas(width, 440);
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, width, 440, C.background);
  text(ctx, 'A / WOODLAND TARANTULA — FRAME STUDY', 24, 36, 23, C.title, true);
  for (const [rowIndex, [row, label, prefix]] of [[moves, 'Walk · 18 fps', 'move'], [attacks, 'Bite · 16 fps', 'atk']].entries()) {
    const y = 83 + rowIndex * 183;
    text(ctx, label, 24, y - 14, 15, C.accent, true);
    row.forEach((frame, i) => {
      const x = 24 + i * cell;
      fill(ctx, x, y, 128, 128, C.field);
      sprite(ctx, frame, x, y, scale);
      text(ctx, `${prefix}${i}`, x + 3, y + 148, 12);
    });
  }
  return sheet;
}

function writeHtml(backdrop, moves, attacks) {
  const sources = {
    backdrop: backdrop.toDataURL(),
    moves: moves.map(frame => frame.toDataURL()),
    attacks: attacks.map(frame => frame.toDataURL()),
  };
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Woodland tarantula — animation study</title>
<style>
body{margin:0;padding:24px;background:${C.background};color:${C.title};font:15px system-ui,sans-serif}
main{max-width:${WIDTH}px;margin:auto}canvas{display:block;width:100%;height:auto;image-rendering:pixelated}
.controls{display:flex;align-items:center;gap:16px;padding:12px 28px}button,select{font:inherit;color:${C.title};background:${C.panel};border:1px solid ${C.field};border-radius:4px;padding:7px 12px}
label{color:${C.text}}p{color:${C.text};padding:0 28px;font-size:13px}
</style><main><canvas width="${WIDTH}" height="${HEIGHT}" aria-label="Animated woodland tarantula walking right, walking left, and biting"></canvas>
<div class="controls"><button id="pause">Pause</button><label>Speed <select id="speed"><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><span>Walk: 18 fps · Bite: 16 fps</span></div>
<p>Pixel art is displayed at exact 4× and 1× scale on the full-size canvas. Resize the browser to inspect the complete board.</p></main>
<script>
const sources=${JSON.stringify(sources)};
const load=src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.src=src});
Promise.all([load(sources.backdrop),Promise.all(sources.moves.map(load)),Promise.all(sources.attacks.map(load))]).then(([backdrop,moves,attacks])=>{
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
let paused=false,time=0,last,rate=1;
document.querySelector('#pause').onclick=event=>{paused=!paused;event.target.textContent=paused?'Play':'Pause'};
document.querySelector('#speed').onchange=event=>{rate=Number(event.target.value)};
const draw=(frame,x,y,scale,flip=false)=>{ctx.save();ctx.translate(x+(flip?64*scale:0),y);ctx.scale(flip?-1:1,1);ctx.fillStyle='#20321d66';ctx.beginPath();ctx.ellipse(32*scale,52*scale,23*scale,5*scale,0,0,Math.PI*2);ctx.fill();ctx.drawImage(frame,0,0,64*scale,64*scale);ctx.restore()};
function tick(now){if(last!==undefined&&!paused)time+=(now-last)/1000*rate;last=now;
ctx.drawImage(backdrop,0,0);const move=moves[Math.floor(time*18)%moves.length];const index=Math.floor((time%${ATTACK_PERIOD}-.25)*16);const bite=index>=0&&index<attacks.length?attacks[index]:moves[0];
draw(move,88,198,4);draw(move,444,198,4,true);draw(bite,844,198,4);draw(move,56,508,1);draw(move,412,508,1,true);draw(bite,808,508,1);requestAnimationFrame(tick)}requestAnimationFrame(tick);
});
</script></html>`;
  fs.writeFileSync(path.join(OUT, 'spider-preview.html'), html);
}

function writeGif(python) {
  const source = `import sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
paths = sorted((root / 'preview-frames').glob('*.png'))
images = [Image.open(p).convert('RGB') for p in paths]
palette = images[0].quantize(colors=256, method=Image.Quantize.MEDIANCUT)
frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
durations = [round((i+1)*100/${FPS})*10-round(i*100/${FPS})*10 for i in range(len(frames))]
frames[0].save(root / 'spider-animation.gif', save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=1, optimize=True)
print(root / 'spider-animation.gif')
`;
  const result = spawnSync(python, ['-c', source, OUT], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  process.stdout.write(result.stdout);
}

async function main() {
  const args = process.argv.slice(2);
  const pythonIndex = args.indexOf('--python');
  const python = pythonIndex < 0 ? null : args[pythonIndex + 1];
  if (pythonIndex >= 0 && !python) throw new Error('--python requires a Python executable with Pillow installed');
  const load = await makeLoader();
  const hd = await load('/src/assets/art/hd.ts');
  const spider = await load('/src/assets/art/spider.ts');
  const moves = spider.SPIDER_MOVE_FRAMES.map(frame => hd.makeHD(SIZE, spider.drawSpider(frame)));
  const attacks = spider.SPIDER_ATK_FRAMES.map(frame => hd.makeHD(SIZE, spider.drawSpider(frame)));
  fs.mkdirSync(path.join(OUT, 'preview-frames'), { recursive: true });
  moves.forEach((frame, i) => writePng(`move${i}.png`, frame));
  attacks.forEach((frame, i) => writePng(`atk${i}.png`, frame));
  writePng('spider-move-sheet.png', makeSheet(moves));
  writePng('spider-bite-sheet.png', makeSheet(attacks));
  writePng('spider-contact-sheet.png', contactSheet(moves, attacks));
  const backdrop = makeBackdrop();
  writePng('spider-preview.png', renderBoard(backdrop, moves, attacks, 0));
  for (let i = 0; i < FPS * SECONDS; i++) {
    writePng(`preview-frames/${String(i).padStart(3, '0')}.png`, renderBoard(backdrop, moves, attacks, i / FPS));
  }
  writeHtml(backdrop, moves, attacks);
  if (python) writeGif(python);
  console.log(path.join(OUT, 'spider-preview.png'));
  console.log(path.join(OUT, 'spider-preview.html'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
