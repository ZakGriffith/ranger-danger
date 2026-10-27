const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { prepareBlobTexture, deformBlob } = require('./blob-soft-motion.cjs');
const blobCache = new WeakMap();

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'infected-blob-options');
const C = { page: '#181e20', card: '#273031', ground: '#333e3b', purple: '#3a3146', text: '#e9ead9', muted: '#acbbb1', accent: '#cadb8e' };
const specs = [
  { file: 'infected-blob-jelly', draw: 'drawJellyBlob', letter: 'A', title: 'Blight jelly', lines: ['Smooth gel / diseased core', 'The clearest soft, bouncy shape.'] },
  { file: 'infected-blob-colony', draw: 'drawColonyBlob', letter: 'B', title: 'Boil colony', lines: ['Swollen lobes / dark infection pockets', 'A rougher, more visibly infected body.'] },
  { file: 'infected-blob-coil', draw: 'drawCoilBlob', letter: 'C', title: 'Coiled sludge', lines: ['Folded slime / winding inner bands', 'The strongest pattern for reading spin.'] },
];
const paletteNames = ['Moss', 'Lichen', 'Jade'];
globalThis.document = { createElement: () => createCanvas(1, 1) };

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color; ctx.fillText(value, x, y);
}

function shadow(ctx, x, y, width, height = 4, alpha = .3) {
  ctx.fillStyle = `rgba(10,17,16,${alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2); ctx.fill();
}

function blob(ctx, image, x, feet, scale, angle = 0, squash = 1, height = 0) {
  const canvas = (w, h) => {
    const result = ctx.canvas.ownerDocument ? ctx.canvas.ownerDocument.createElement('canvas') : createCanvas(w, h);
    result.width = w; result.height = h; return result;
  };
  let cached = blobCache.get(image);
  if (!cached) {
    const original = canvas(64, 64), originalContext = original.getContext('2d');
    originalContext.drawImage(image, 0, 0);
    cached = { texture: prepareBlobTexture(originalContext.getImageData(0, 0, 64, 64).data), frames: new Map() };
    blobCache.set(image, cached);
  }
  const frame = ((Math.round(angle / (Math.PI * 2) * 48) % 48) + 48) % 48;
  const compression = Math.round(squash * 24) / 24;
  const rising = Math.min(1, height / 14), air = Math.round(rising * rising * (3 - 2 * rising) * 12) / 12;
  const key = `${frame}:${compression}:${air}`;
  let buffer = cached.frames.get(key);
  if (!buffer) {
    const shaped = deformBlob(cached.texture, frame / 48 * Math.PI * 2, compression, air);
    buffer = canvas(shaped.width, shaped.height);
    const pixels = buffer.getContext('2d'), output = pixels.createImageData(shaped.width, shaped.height);
    output.data.set(shaped.data); pixels.putImageData(output, 0, 0);
    cached.frames.set(key, buffer);
  }
  const radius = (27 * (1 - air) + 20 * air) * scale * compression;
  shadow(ctx, x, feet + 1, radius * (1 - Math.min(height / 220, .35)), Math.max(2, radius * .11), Math.max(.1, .32 - height / 300));
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, Math.round(x - 48 * scale), Math.round(feet - 72 * scale - height), 96 * scale, 80 * scale);
  ctx.restore();
}

function pose(time, mode = 'both') {
  const t = mode === 'roll' ? time % 2000 : mode === 'bounce' ? 2000 + time % 1800 : time % 5000;
  if (mode === 'still') return { x: 94, angle: .12, squash: 1, height: 0, phase: 'Still concept' };
  if (t < 2000) {
    const x = 60 + t * .052;
    return { x, angle: (x - 60) / 22, squash: 1 + .065 * Math.sin(t / 170), height: 0, phase: 'Flow and roll along the ground' };
  }
  const baseAngle = 104 / 22;
  if (t < 2360) return { x: 164, angle: baseAngle, squash: 1 + .3 * ((t - 2000) / 360), height: 0, phase: 'Spread and compress before takeoff' };
  if (t < 2880) {
    const p = (t - 2360) / 520;
    return { x: 164 + 117 * p, angle: baseAngle + p * Math.PI * 1.1, squash: .85 + .08 * p, height: 52 * Math.sin(Math.PI * p), phase: 'Stretch into the bounce' };
  }
  if (t < 3140) {
    const p = (t - 2880) / 260;
    return { x: 281, angle: baseAngle + Math.PI * 1.1, squash: 1 + .38 * Math.sin(Math.PI * p), height: 0, phase: 'Spread into a soft landing' };
  }
  if (t < 3800) {
    const p = (t - 3140) / 660;
    return { x: 281 - 117 * p, angle: baseAngle + Math.PI * 1.1 - p * Math.PI * 1.3, squash: 1, height: 23 * Math.sin(Math.PI * p), phase: 'Recoil and recover' };
  }
  return { x: 164, angle: baseAngle - Math.PI * .2, squash: 1 + .02 * Math.sin(t / 180), height: 0, phase: 'Ready to roll again' };
}

function ranger(ctx, image, x, feet) {
  shadow(ctx, x, feet, 13, 3);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, x - 32, feet - 60, 64, 64); ctx.restore();
}

function card(ctx, subject, spec, player, time = 0, mode = 'both', ground = C.ground, chosenPalette = -1, staticSheet = false) {
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, 360, 702);
  text(ctx, spec.letter, 18, 34, 24, C.accent, true);
  text(ctx, spec.title, 54, 33, 23, C.text, true);
  spec.lines.forEach((line, i) => text(ctx, line, 18, 62 + i * 21, 13));
  ctx.fillStyle = ground; ctx.fillRect(12, 104, 336, 240);
  const variant = chosenPalette < 0 ? 0 : chosenPalette;
  const detail = staticSheet ? pose(900, 'roll') : pose(time, mode);
  blob(ctx, subject.images[variant], 180, 319, 4, detail.angle, detail.squash, Math.min(18, detail.height));
  text(ctx, '4× moving detail', 26, 333, 11);
  text(ctx, 'Related colors within the same enemy family', 18, 371, 12);
  for (let i = 0; i < 3; i++) {
    blob(ctx, subject.images[i], 70 + i * 110, 435, 1.2);
    text(ctx, paletteNames[i], 51 + i * 110, 454, 12);
  }
  ctx.fillStyle = ground; ctx.fillRect(12, 476, 336, 206);
  if (staticSheet) {
    blob(ctx, subject.images[0], 83, 625, 1.5, 1.1);
    blob(ctx, subject.images[2], 204, 625, 1.5, 2.1, .9, 43);
    ranger(ctx, player, 303, 625);
    text(ctx, 'Roll', 69, 656, 12);
    text(ctx, 'Bounce attack', 168, 656, 12);
  } else {
    const state = pose(time, mode);
    const motionVariant = chosenPalette < 0 ? Math.floor(time / 5000) % 3 : chosenPalette;
    ranger(ctx, player, 303, 625);
    blob(ctx, subject.images[motionVariant], state.x, 625, 1, state.angle, state.squash, state.height);
    text(ctx, state.phase, 25, 659, 12);
  }
  text(ctx, 'Motion study · 2× game size', 25, 498, 11);
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const playerArt = await load('/src/assets/art/player.ts');
  const player = hd.makeHD(64, playerArt.drawPlayer('idle0', 'level'));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'ranger.png'), player.toBuffer('image/png'));
  const subjects = [];
  for (const spec of specs) {
    const art = await load(`/scripts/sprite-tries/${spec.file}.ts`);
    const images = [];
    for (let variant = 0; variant < 3; variant++) {
      const image = hd.makeHD(64, (put, raw) => art[spec.draw](variant)((x, y, color) => {
        if (color !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x > 62 || y < 1 || y > 62)) throw Error(`${spec.letter}/${variant}: invalid pixel ${x},${y}`);
        put(x, y, color);
      }, raw), { outline: false });
      fs.writeFileSync(path.join(OUT, `${spec.file}-${variant}.png`), image.toBuffer('image/png'));
      images.push(image);
    }
    subjects.push({ images });
  }
  const sheet = createCanvas(1168, 880), ctx = sheet.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, sheet.width, sheet.height);
  text(ctx, 'INFECTED / ROLLING BLOBS', 24, 43, 29, C.text, true);
  text(ctx, 'Three surfaces · three closely related colors each · roll to move, bounce to attack', 25, 75, 16);
  subjects.forEach((subject, i) => { ctx.save(); ctx.translate(24 + i * 384, 100); card(ctx, subject, specs[i], player, 0, 'still', C.ground, -1, true); ctx.restore(); });
  text(ctx, 'Look and motion concepts — choose a surface before game integration.', 25, 842, 16);
  fs.writeFileSync(path.join(OUT, 'blob-options.png'), sheet.toBuffer('image/png'));
  const sources = specs.map(spec => ({ src: [0, 1, 2].map(i => `${spec.file}-${i}.png`) }));
  fs.writeFileSync(path.join(OUT, 'blob-options.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Infected blobs — roll and bounce</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1216px;margin:auto;padding:24px}h1{font-size:29px;margin:0 0 10px}p{color:${C.muted};line-height:1.5}.controls{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:20px 0}label{display:flex;gap:8px;align-items:center}select,button{background:${C.card};color:${C.text};font:inherit;border:1px solid #647366;border-radius:5px;padding:7px}button{cursor:pointer}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}canvas{width:100%;height:auto;display:block;image-rendering:pixelated;border-radius:6px}a{color:${C.accent}}@media(max-width:820px){main{max-width:440px}.grid{grid-template-columns:1fr}}</style></head><body><main>
<h1>Infected / rolling blobs</h1><p>Soft blobs with a wide grounded base: their bodies flow and fold as they roll, stretch into a bounce, then spread on landing.</p>
<div class="controls"><button id="pause" aria-pressed="false">Pause</button><button id="restart">Restart</button><label>Motion <select id="motion"><option value="both">Roll + bounce</option><option value="roll">Rolling</option><option value="bounce">Bounce attack</option><option value="still">Still</option></select></label><label>Color <select id="palette"><option value="-1">Mixed family</option>${paletteNames.map((s, i) => `<option value="${i}">${s}</option>`).join('')}</select></label><label>Ground <select id="ground"><option value="${C.ground}">Moss</option><option value="${C.purple}">Infected purple</option><option value="#6d796b">Light contrast</option></select></label><label>Speed <select id="speed"><option value="1">1×</option><option value="0.5">½×</option></select></label></div>
<p id="status" role="status">Loading blobs…</p><section class="grid">${specs.map(s => `<canvas width="360" height="702" aria-label="${s.letter}: ${s.title}. ${s.lines.join(' ')}"></canvas>`).join('')}</section><p>Choose A, B or C for the surface you prefer. Mixed family cycles through the color variations. This is a motion study; the game has not been changed. <a href="blob-options.png">Open the comparison sheet</a>.</p></main>
<script type="module">const C=${JSON.stringify(C)},specs=${JSON.stringify(specs)},paletteNames=${JSON.stringify(paletteNames)},sources=${JSON.stringify(sources)},blobCache=new WeakMap();
${prepareBlobTexture.toString()}
${deformBlob.toString()}
${text.toString()}
${shadow.toString()}
${blob.toString()}
${pose.toString()}
${ranger.toString()}
${card.toString()}
const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Could not load '+src));img.src=src;});
async function start(){const subjects=await Promise.all(sources.map(async source=>({images:await Promise.all(source.src.map(load))}))),player=await load('ranger.png'),canvases=[...document.querySelectorAll('canvas')];document.querySelector('#status').textContent='';let time=0,last,paused=false;const pause=document.querySelector('#pause');pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));};document.querySelector('#restart').onclick=()=>{time=0;};document.querySelector('#motion').onchange=()=>{time=0;};function tick(now){const dt=last===undefined||paused?0:Math.min(50,now-last)*Number(document.querySelector('#speed').value);last=now;time+=dt;const mode=document.querySelector('#motion').value,ground=document.querySelector('#ground').value,palette=Number(document.querySelector('#palette').value);canvases.forEach((canvas,i)=>card(canvas.getContext('2d'),subjects[i],specs[i],player,time,mode,ground,palette));requestAnimationFrame(tick);}requestAnimationFrame(tick);}start().catch(error=>{document.querySelector('#status').textContent=error.message;console.error(error);});</script></body></html>`);
  console.log(path.join(OUT, 'blob-options.html'));
  console.log(path.join(OUT, 'blob-options.png'));
}
module.exports = { blob, pose, card };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
