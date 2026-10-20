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
const OUT = path.join(__dirname, 'out', 'bear-attacks');
const SIZE = 64;
const WIDTH = 1120;
const HEIGHT = 652;
const SAMPLE_FPS = 60;
const C = {
  background: '#17241e', panel: '#25382c', field: '#405c38',
  title: '#f0e9d6', text: '#b5c1ab', accent: '#d5bd80',
};
const PANELS = [
  { key: 'swipe', x: 28, label: 'A / PAW SWIPE', detail: 'Raised paw · broad downward strike' },
  { key: 'bite', x: 570, label: 'B / BITE', detail: 'Open jaw · forward snap · recovery' },
];

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

function makeBackdrop(count, fps) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, WIDTH, HEIGHT, C.background);
  text(ctx, 'C / SHAGGY BROWN BEAR', 28, 48, 30, C.title, true);
  text(ctx, `Attack comparison · ${count} poses each · ${fps} fps · ${count / fps * 1000} ms`, 29, 78, 16);
  for (const panel of PANELS) {
    fill(ctx, panel.x, 106, 522, 490, C.panel);
    text(ctx, panel.label, panel.x + 20, 140, 20, C.accent, true);
    text(ctx, panel.detail, panel.x + 20, 165);
    fill(ctx, panel.x + 20, 186, 482, 296, C.field);
    text(ctx, '4× enlarged', panel.x + 36, 470, 12);
    fill(ctx, panel.x + 20, 500, 80, 80, C.field);
    text(ctx, 'Native 64 px', panel.x + 116, 529, 15, C.title);
    text(ctx, 'Both attacks share the same timing', panel.x + 116, 550, 13);
  }
  text(ctx, 'Compare the silhouette, impact, and recovery at the same scale.', 29, 629, 14);
  return canvas;
}

function frameIndex(time, fps, count) {
  return Math.floor(time * fps + 1e-8) % count;
}

function renderBoard(backdrop, rows, index) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(backdrop, 0, 0);
  for (const panel of PANELS) {
    sprite(ctx, rows[panel.key][index], panel.x + 133, 198, 4);
    sprite(ctx, rows[panel.key][index], panel.x + 28, 508, 1);
  }
  text(ctx, `Pose ${String(index + 1).padStart(2, '0')} / ${rows.swipe.length}`, WIDTH - 143, 629, 14, C.accent);
  return canvas;
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

function contactSheet(rows, direction, fps) {
  const columns = 6;
  const cellWidth = 148;
  const cellHeight = 166;
  const rowCount = Math.ceil(rows.swipe.length / columns);
  const width = 48 + columns * cellWidth;
  const height = 112 + (rowCount * cellHeight + 42) * 2;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, width, height, C.background);
  text(ctx, `BEAR ATTACKS / FACING ${direction.toUpperCase()}`, 24, 38, 24, C.title, true);
  text(ctx, `Each column advances both attacks by the same ${Math.round(1000 / fps)} ms`, 24, 64, 14);
  let top = 114;
  for (const panel of PANELS) {
    text(ctx, panel.label, 24, top - 16, 16, C.accent, true);
    rows[panel.key].forEach((frame, i) => {
      const x = 24 + i % columns * cellWidth;
      const y = top + Math.floor(i / columns) * cellHeight;
      fill(ctx, x, y, 128, 128, C.field);
      sprite(ctx, frame, x, y, 2);
      text(ctx, `Pose ${i + 1} · ${Math.round(i / fps * 1000)} ms`, x + 2, y + 148, 12);
    });
    top += rowCount * cellHeight + 42;
  }
  return canvas;
}

function checkedFrame(hd, draw, name) {
  const canvas = hd.makeHD(SIZE, (put, raw) => draw(
    (x, y, color) => {
      if (color !== null && (Math.floor(x) < 1 || Math.floor(y) < 1 || Math.floor(x) >= SIZE - 1 || Math.floor(y) >= SIZE - 1)) {
        throw new Error(`${name}: body pixel (${x}, ${y}) leaves no room for its outline`);
      }
      put(x, y, color);
    },
    (x, y, color, alpha = 1) => {
      if (alpha > 0 && (Math.floor(x) < 0 || Math.floor(y) < 0 || Math.floor(x) >= SIZE || Math.floor(y) >= SIZE)) {
        throw new Error(`${name}: raw pixel (${x}, ${y}) is outside the canvas`);
      }
      raw(x, y, color, alpha);
    },
  ));
  const pixels = canvas.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
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
  return { canvas, bounds };
}

function checkMirroring(frames) {
  for (const key of ['swipe', 'bite']) {
    frames.right[key].forEach((canvas, index) => {
      const right = canvas.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
      const left = frames.left[key][index].getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          for (let channel = 0; channel < 4; channel++) {
            if (right[(y * SIZE + x) * 4 + channel] !== left[(y * SIZE + SIZE - 1 - x) * 4 + channel]) {
              throw new Error(`${key}${index}: left-facing pixels are not an exact mirror at (${x}, ${y})`);
            }
          }
        }
      }
    });
  }
}

function writeHtml(backdrop, frames, fps) {
  const sources = { backdrop: backdrop.toDataURL() };
  for (const direction of ['right', 'left']) {
    sources[direction] = Object.fromEntries(['swipe', 'bite'].map(key => [key, frames[direction][key].map(frame => frame.toDataURL())]));
  }
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bear C — swipe or bite</title>
<style>
body{margin:0;padding:24px;background:${C.background};color:${C.title};font:15px system-ui,sans-serif}
main{max-width:${WIDTH}px;margin:auto}canvas{display:block;width:100%;height:auto;image-rendering:pixelated}
.controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 28px}button,select{font:inherit;color:${C.title};background:${C.panel};border:1px solid ${C.field};border-radius:4px;padding:7px 12px;cursor:pointer}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid ${C.accent};outline-offset:3px}label{color:${C.text}}p{color:${C.text};padding:0 28px;font-size:13px}input{accent-color:${C.accent};vertical-align:middle}#position{min-width:150px;color:${C.accent};font-variant-numeric:tabular-nums}
</style><main><canvas width="${WIDTH}" height="${HEIGHT}" aria-label="Side-by-side comparison of bear C swiping its front paw and biting"></canvas>
<div class="controls"><button id="pause">Pause</button><button id="previous" aria-label="Previous pose">← Pose</button><button id="next" aria-label="Next pose">Pose →</button><label>Facing <select id="facing"><option value="right">Right</option><option value="left">Left</option></select></label><label>Speed <select id="speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div>
<div class="controls"><label>Pose <input id="scrub" type="range" min="0" max="${frames.right.swipe.length - 1}" value="0" step="1"></label><span id="position" aria-live="off"></span></div>
<p>Both attacks play together at ${fps} fps. Pause, scrub, or step to compare matching poses. The full-size canvas shows exact 4× and native 64 px sprites.</p></main>
<script>
const sources=${JSON.stringify(sources)};
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src});
async function start(){const backdrop=await load(sources.backdrop);const frames={};for(const direction of ['right','left']){frames[direction]={};for(const key of ['swipe','bite'])frames[direction][key]=await Promise.all(sources[direction][key].map(load))}
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const pause=document.querySelector('#pause'),scrub=document.querySelector('#scrub'),position=document.querySelector('#position');
const count=frames.right.swipe.length;let paused=false,pose=0,last,rate=1,direction='right';
const setPaused=value=>{paused=value;pause.textContent=value?'Play':'Pause'};
pause.onclick=()=>setPaused(!paused);
document.querySelector('#speed').onchange=event=>{rate=Number(event.target.value)};
document.querySelector('#facing').onchange=event=>{direction=event.target.value};
const step=amount=>{setPaused(true);pose=(Math.floor(pose)+amount+count)%count};
document.querySelector('#previous').onclick=()=>step(-1);document.querySelector('#next').onclick=()=>step(1);
scrub.oninput=event=>{setPaused(true);pose=Number(event.target.value)};
const draw=(frame,x,y,scale)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle='#20321d66';ctx.beginPath();ctx.ellipse(32*scale,54*scale,23*scale,4*scale,0,0,Math.PI*2);ctx.fill();ctx.drawImage(frame,0,0,64*scale,64*scale);ctx.restore()};
function tick(now){if(last!==undefined&&!paused)pose=(pose+(now-last)/1000*rate*${fps})%count;last=now;const index=Math.floor(pose+1e-8)%count;ctx.drawImage(backdrop,0,0);for(const panel of ${JSON.stringify(PANELS)}){draw(frames[direction][panel.key][index],panel.x+133,198,4);draw(frames[direction][panel.key][index],panel.x+28,508,1)}ctx.font='14px sans-serif';ctx.fillStyle='${C.accent}';ctx.fillText('Pose '+String(index+1).padStart(2,'0')+' / '+count,${WIDTH - 143},629);scrub.value=index;position.textContent='Pose '+(index+1)+' / '+count+' · '+Math.round(index/${fps}*1000)+' ms';requestAnimationFrame(tick)}requestAnimationFrame(tick)}start().catch(error=>{document.querySelector('#position').textContent='Preview failed to load';console.error(error)});
</script></html>`;
  fs.writeFileSync(path.join(OUT, 'bear-attacks.html'), html);
}

function writeGif(python, sampleCount) {
  const source = `import sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
images = [Image.open(root / 'preview-frames' / f'{i:03d}.png').convert('RGB') for i in range(${sampleCount})]
palette_source = Image.new('RGB', (${WIDTH}, ${HEIGHT} * 12))
for i in range(12):
    palette_source.paste(images[i * len(images) // 12], (0, i * ${HEIGHT}))
palette = palette_source.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
durations = [round((i+1)*100/${SAMPLE_FPS})*10-round(i*100/${SAMPLE_FPS})*10 for i in range(len(frames))]
target = root / 'bear-attacks.gif'
frames[0].save(target, save_all=True, append_images=frames[1:], duration=durations, loop=0, disposal=1, optimize=True)
with Image.open(target) as image:
    duration = 0
    for i in range(image.n_frames):
        image.seek(i)
        duration += image.info['duration']
    assert duration == sum(durations), (duration, sum(durations))
    assert image.n_frames == 12, image.n_frames
    print(f'{target} ({image.n_frames} poses; {duration} ms)')
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
  const bear = await load('/src/assets/art/bear.ts');
  const fps = bear.BEAR_ATK_FPS;
  const count = bear.BEAR_ATK_FRAMES.length;
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('BEAR_ATK_FPS must be a positive integer');
  if (bear.BEAR_BITE_FRAMES.length !== count) throw new Error('Both attacks must have the same number of frames');
  if (SAMPLE_FPS < fps) throw new Error('Preview sampling would omit animation poses');
  const frames = {};
  const bounds = [];
  for (const [direction, dir] of [['right', 'r'], ['left', 'l']]) {
    const render = (names, draw) => names.map(name => {
      const result = checkedFrame(hd, draw(name, dir), `${name}_${dir}`);
      bounds.push({ frame: `${name}_${dir}`, bounds: result.bounds });
      return result.canvas;
    });
    frames[direction] = {
      swipe: render(bear.BEAR_ATK_FRAMES, bear.drawBear),
      bite: render(bear.BEAR_BITE_FRAMES, bear.drawBearBite),
    };
  }
  checkMirroring(frames);
  const seconds = count / fps;
  const sampleCount = Math.round(seconds * SAMPLE_FPS);
  if (Math.abs(sampleCount / SAMPLE_FPS - seconds) > 1e-8) throw new Error('Attack cycle must align with preview sampling');
  const sampled = new Set(Array.from({ length: sampleCount }, (_, i) => frameIndex(i / SAMPLE_FPS, fps, count)));
  if (sampled.size !== count) throw new Error('Preview loop is missing attack poses');
  fs.mkdirSync(path.join(OUT, 'preview-frames'), { recursive: true });
  for (const [direction, rows] of Object.entries(frames)) {
    for (const panel of PANELS) {
      rows[panel.key].forEach((frame, index) => writePng(`${panel.key}${index}-${direction}.png`, frame));
      writePng(`bear-${panel.key}-${direction}-sheet.png`, makeSheet(rows[panel.key]));
    }
    writePng(`bear-attacks-contact-${direction}.png`, contactSheet(rows, direction, fps));
  }
  const backdrop = makeBackdrop(count, fps);
  writePng('bear-attacks.png', renderBoard(backdrop, frames.right, 4));
  for (let i = 0; i < sampleCount; i++) {
    writePng(`preview-frames/${String(i).padStart(3, '0')}.png`, renderBoard(backdrop, frames.right, frameIndex(i / SAMPLE_FPS, fps, count)));
  }
  writeHtml(backdrop, frames, fps);
  fs.writeFileSync(path.join(OUT, 'frame-bounds.json'), JSON.stringify(bounds, null, 2));
  console.log(`Validated ${bounds.length} bounded frames, exact left/right mirroring, and all ${count} paired attack poses in a ${seconds}s loop.`);
  if (python) writeGif(python, sampleCount);
  console.log(path.join(OUT, 'bear-attacks.png'));
  console.log(path.join(OUT, 'bear-attacks.html'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
