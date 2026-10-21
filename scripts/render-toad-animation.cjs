const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'toad-animation');
const SIZE = 64;
const GROUND_Y = 56;
const C = {
  page: '#1d1b27', card: '#302b3b', ground: '#3a3146', moss: '#394530',
  text: '#eee9dc', muted: '#bdb6c5', accent: '#d5bd84', shadow: '#15121a75',
};
const timing = { idleFps: 8, hopDuration: 350, hopRest: 500, attackFps: 30, attackCycle: 1700, release: 200 };
const projectile = { mouth: { x: 61, y: 38 }, scale: 0.8, gameScale: 0.55, speed: 120, arcHeight: 60, distance: 96, frameMs: 75 };
const specs = [
  { key: 'idle', title: 'Idle', detail: 'Quiet breathing and a slow blink' },
  { key: 'hop', title: 'Hop', detail: 'Gather · spring · tuck · settle' },
  { key: 'attack', title: 'Poison-bomb attack', detail: 'Throat swell · lob · recover' },
];

globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw Error(`Unexpected element: ${tag}`);
    return createCanvas(1, 1);
  },
};

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function bounds(image) {
  const rgba = image.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  const b = { left: SIZE, top: SIZE, right: -1, bottom: -1, count: 0 };
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (!rgba[(y * SIZE + x) * 4 + 3]) continue;
    b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
    b.top = Math.min(b.top, y); b.bottom = Math.max(b.bottom, y); b.count++;
  }
  if (!b.count) throw Error('Empty toad frame');
  return b;
}

function checkedFrame(hd, draw, name) {
  const verify = (x, y) => {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x >= SIZE - 1 || y >= SIZE - 1) {
      throw Error(`${name}: pixel (${x}, ${y}) is not an integer inside the padded 64px canvas`);
    }
  };
  const image = hd.makeHD(SIZE, (put, raw) => draw((x, y, color) => {
    if (color !== null) verify(x, y);
    put(x, y, color);
  }, (x, y, color, alpha = 1) => {
    if (alpha > 0) verify(x, y);
    raw(x, y, color, alpha);
  }), { outline: false });
  return { image, bounds: bounds(image) };
}

function selectFrame(frames, group, time) {
  if (group === 'idle') {
    const index = Math.floor(time * timing.idleFps / 1000) % frames.idle.length;
    return { image: frames.idle[index], name: `idle${index}`, phase: 'Breathing' };
  }
  if (group === 'hop') {
    const phase = time % (timing.hopDuration + timing.hopRest);
    if (phase >= timing.hopDuration) return { ...selectFrame(frames, 'idle', phase - timing.hopDuration), phase: 'Grounded rest' };
    const index = Math.min(frames.hop.length - 1, Math.floor(phase / timing.hopDuration * frames.hop.length));
    return { image: frames.hop[index], name: `hop${index}`, phase: ['Gathering', 'Springing', 'Airborne', 'Landing'][Math.min(3, Math.floor(index / 3))] };
  }
  const phase = time % timing.attackCycle;
  const index = Math.floor(phase * timing.attackFps / 1000);
  if (index >= frames.attack.length) return { ...selectFrame(frames, 'idle', phase), phase: 'Resting' };
  return { image: frames.attack[index], name: `atk${index}`, phase: phase < timing.release ? 'Throat wind-up' : phase < 270 ? 'Spit' : 'Recovery' };
}

function drawSprite(ctx, image, center, feet, scale, flip) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(center), Math.round(feet));
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(image, -32, -GROUND_Y);
  ctx.restore();
}

function drawShadow(ctx, center, feet, scale) {
  ctx.fillStyle = C.shadow;
  ctx.beginPath(); ctx.ellipse(center, feet, 23 * scale, 2.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
}

function drawBomb(ctx, bombs, center, feet, scale, flip, elapsed) {
  const duration = projectile.distance / projectile.speed * 1000;
  if (elapsed < 0 || elapsed > duration) return;
  const fraction = elapsed / duration;
  const enlargement = scale / projectile.gameScale;
  const direction = flip ? -1 : 1;
  const arc = 4 * projectile.arcHeight * fraction * (1 - fraction);
  const bombSize = 32 * projectile.scale * enlargement;
  const x = center + direction * ((projectile.mouth.x - 32) * scale + projectile.speed * elapsed / 1000 * enlargement);
  const y = feet + (projectile.mouth.y - GROUND_Y) * scale * (1 - fraction) - arc * enlargement;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bombs[Math.floor(elapsed / projectile.frameMs) % bombs.length], x - bombSize / 2, y - bombSize / 2, bombSize, bombSize);
  ctx.restore();
}

function stage(ctx, frames, bombs, group, time, width, height, scale, flip, ground, showBomb = true) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, width, height);
  const center = width / 2;
  const feet = height - (height > 150 ? 34 : 19);
  drawShadow(ctx, center, feet, scale);
  const current = selectFrame(frames, group, time);
  drawSprite(ctx, current.image, center, feet, scale, flip);
  if (group === 'attack' && showBomb) drawBomb(ctx, bombs, center, feet, scale, flip, time % timing.attackCycle - timing.release);
  return current;
}

function lane(ctx, frames, bombs, time, width, height, gameScale, flip, ground) {
  ctx.fillStyle = ground; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#7a70842a';
  for (let x = 22; x < width; x += 47) { ctx.fillRect(x, height - 20, 3, 2); ctx.fillRect(x + 17, height - 44, 2, 1); }
  const center = flip ? width - 72 : 72, feet = height - 24;
  drawShadow(ctx, center, feet, gameScale);
  drawSprite(ctx, selectFrame(frames, 'attack', time).image, center, feet, gameScale, flip);
  drawBomb(ctx, bombs, center, feet, gameScale, flip, time % timing.attackCycle - timing.release);
}

function board(frames, bombs, time, gameScale) {
  const canvas = createCanvas(1152, 636), ctx = canvas.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, canvas.width, canvas.height);
  text(ctx, 'B / SPOREBACK TOAD', 24, 42, 28, C.text, true);
  text(ctx, 'Plum hide, rust-colored growths, and a subtle dark border', 25, 71, 16);
  specs.forEach((spec, index) => {
    const x = 24 + index * 376;
    ctx.fillStyle = C.card; ctx.fillRect(x, 94, 352, 520);
    text(ctx, spec.title, x + 14, 124, 21, C.accent, true);
    text(ctx, spec.detail, x + 14, 151, 13);
    ctx.save(); ctx.translate(x + 8, 170); stage(ctx, frames, bombs, spec.key, time, 336, 304, 4, false, C.ground); ctx.restore();
    text(ctx, '4× detail', x + 18, 463, 12);
    ctx.save(); ctx.translate(x + 8, 486); stage(ctx, frames, bombs, spec.key, time, 160, 100, 1, false, C.ground, false); ctx.restore();
    ctx.save(); ctx.translate(x + 184, 486); stage(ctx, frames, bombs, spec.key, time, 160, 100, gameScale, false, C.moss, false); ctx.restore();
    text(ctx, 'Native 64 px', x + 47, 602, 12); text(ctx, 'Game size', x + 231, 602, 12);
  });
  return canvas;
}

function contactSheet(frames, names) {
  const cell = 142, columns = 6, rowHeight = 156;
  const height = 80 + specs.reduce((total, spec) => total + 44 + Math.ceil(frames[spec.key].length / columns) * rowHeight, 0);
  const canvas = createCanvas(48 + cell * columns, height), ctx = canvas.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, canvas.width, height);
  text(ctx, 'B / SPOREBACK — FRAME STUDIES', 24, 42, 25, C.text, true);
  let top = 76;
  for (const spec of specs) {
    text(ctx, spec.title, 24, top + 15, 17, C.accent, true); top += 36;
    frames[spec.key].forEach((image, index) => {
      const x = 24 + index % columns * cell, y = top + Math.floor(index / columns) * rowHeight;
      ctx.fillStyle = C.ground; ctx.fillRect(x, y, 128, 128);
      drawShadow(ctx, x + 64, y + 112, 2);
      drawSprite(ctx, image, x + 64, y + 112, 2, false);
      text(ctx, names[spec.key][index], x + 4, y + 147, 12);
    });
    top += Math.ceil(frames[spec.key].length / columns) * rowHeight + 8;
  }
  return canvas;
}

function html(frames, bombs, gameScale, qa) {
  const sources = Object.fromEntries(Object.entries(frames).map(([key, images]) => [key, images.map(image => image.toDataURL())]));
  const cards = specs.map(spec => `<article><h2>${spec.title}</h2><p>${spec.detail}</p><canvas class="detail" width="336" height="304" data-group="${spec.key}" data-scale="4" aria-label="Sporeback toad ${spec.title.toLowerCase()} at four times native size"></canvas><div class="sizes"><div><canvas width="160" height="100" data-group="${spec.key}" data-scale="1" aria-label="Native-size ${spec.title.toLowerCase()}"></canvas><span>Native 64 px</span></div><div><canvas width="160" height="100" data-group="${spec.key}" data-scale="${gameScale}" aria-label="Game-size ${spec.title.toLowerCase()}"></canvas><span>Game size</span></div></div><p class="phase" id="phase-${spec.key}"></p></article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sporeback toad — animation preview</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui,sans-serif}main{max-width:1184px;margin:auto;padding:26px 24px}h1{font-size:29px;margin:0 0 10px}h2{font-size:20px;color:${C.accent};margin:0}p{color:${C.muted};line-height:1.5}.intro{margin:0 0 22px}.controls{display:flex;align-items:center;gap:17px;flex-wrap:wrap;margin-bottom:22px}button,select{font:inherit;background:${C.card};color:${C.text};border:1px solid #6e6079;border-radius:5px;padding:8px 11px}button{cursor:pointer}button:hover{background:#443a51}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid ${C.accent};outline-offset:3px}label{display:flex;align-items:center;gap:8px;color:${C.muted}}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}article{background:${C.card};padding:8px;border-radius:6px;min-width:0}article h2,article>p{margin:12px 8px}article>p{font-size:13px}canvas{display:block;image-rendering:pixelated}.detail{width:336px;max-width:100%;height:auto;margin:auto}.sizes{display:flex;justify-content:space-between;gap:16px;margin-top:12px}.sizes>div{width:160px;max-width:calc(50% - 8px);text-align:center;background:${C.ground}}.sizes canvas{width:100%;height:auto}.sizes span{display:block;font-size:12px;color:${C.muted};padding:0 0 8px}.phase{font:12px ui-monospace,monospace;text-align:center;min-height:18px}.lane{margin-top:24px;padding:18px;background:${C.card};border-radius:6px}.lane p{margin:8px 0 12px;font-size:14px}.lane canvas{width:100%;height:auto}.notes{font-size:13px}a{color:${C.accent}}@media(max-width:850px){main{max-width:420px}.cards{grid-template-columns:1fr;gap:18px}.lane{padding:12px}.lane canvas{min-height:140px;object-fit:cover;object-position:left}h1{font-size:25px}}</style></head>
<body><main><h1>B / Sporeback toad</h1><p class="intro">The selected plum-and-rust design, now breathing, hopping, and lobbing blight bombs. The feet and shadow share a fixed ground line, so you can see the lift and landing clearly.</p>
<div class="controls"><button id="pause" type="button" aria-pressed="false">Pause</button><button id="step" type="button">Step frame</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">½ speed</option><option value="0.25">¼ speed</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Infected purple</option><option value="${C.moss}">Infected moss</option><option value="#756c7c">Light contrast</option></select></label><label><input type="checkbox" id="flip">Face left</label><button id="restart" type="button">Restart cycles</button></div>
<section class="cards" aria-label="Sporeback animations">${cards}</section>
<section class="lane"><h2>Spit timing at game size</h2><p>The blight bomb leaves the mouth after the throat winds up, using its in-game size and speed. This preview repeats attacks frequently for comparison.</p><canvas id="lane" width="1096" height="188" aria-label="Game-size toad launching a blight bomb"></canvas></section>
<p class="notes">Hop: ${timing.hopDuration} ms of movement, then a ${timing.hopRest} ms rest. Game-size views use the existing ${gameScale} scale. <a href="toad-contact-sheet.png">View every frame</a> · <a href="toad-preview.png">Still comparison</a></p></main>
<script>const C=${JSON.stringify(C)},timing=${JSON.stringify(timing)},projectile=${JSON.stringify(projectile)},specs=${JSON.stringify(specs)},SIZE=${SIZE},GROUND_Y=${GROUND_Y};
${selectFrame.toString()}
${drawSprite.toString()}
${drawShadow.toString()}
${drawBomb.toString()}
${stage.toString()}
${lane.toString()}
const sources=${JSON.stringify(sources)},bombSources=${JSON.stringify(bombs.map(image => image.toDataURL()))};
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
async function start(){const frames={};for(const [group,images] of Object.entries(sources))frames[group]=await Promise.all(images.map(load));const bombs=await Promise.all(bombSources.map(load));
let time=0,rate=1,paused=false,flip=false,ground=C.ground,last;const pause=document.querySelector('#pause');
const setPaused=value=>{paused=value;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));};
pause.onclick=()=>setPaused(!paused);document.querySelector('#step').onclick=()=>{setPaused(true);time+=1000/30;};document.querySelector('#speed').onchange=e=>rate=Number(e.target.value);document.querySelector('#ground').onchange=e=>ground=e.target.value;document.querySelector('#flip').onchange=e=>flip=e.target.checked;document.querySelector('#restart').onclick=()=>time=0;
const canvases=[...document.querySelectorAll('canvas[data-group]')],laneCanvas=document.querySelector('#lane');
function tick(now){if(last!==undefined&&!paused)time+=Math.min(100,now-last)*rate;last=now;for(const canvas of canvases){const result=stage(canvas.getContext('2d'),frames,bombs,canvas.dataset.group,time,canvas.width,canvas.height,Number(canvas.dataset.scale),flip,ground,canvas.classList.contains('detail'));if(canvas.classList.contains('detail'))document.querySelector('#phase-'+canvas.dataset.group).textContent=result.phase+' · '+result.name;}
lane(laneCanvas.getContext('2d'),frames,bombs,time,laneCanvas.width,laneCanvas.height,${gameScale},flip,ground);requestAnimationFrame(tick);}
window.toadPreview={quality:${JSON.stringify(qa)},get time(){return time},get paused(){return paused},get rate(){return rate},get flip(){return flip}};requestAnimationFrame(tick);}
start().catch(error=>{document.querySelector('.intro').textContent='Preview failed: '+error.message;console.error(error);});</script></body></html>`;
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const toad = await load('/src/assets/art/toad.ts');
  const { CFG } = await load('/src/config.ts');
  Object.assign(timing, { idleFps: toad.TOAD_IDLE_FPS, hopDuration: CFG.infected.toadHopDuration, hopRest: CFG.infected.toadHopInterval, attackFps: toad.TOAD_ATTACK_FPS, release: toad.TOAD_ATTACK_RELEASE_MS });
  const poison = await load('/src/assets/art/toadPoison.ts');
  const approved = await load('/scripts/sprite-tries/toad-spore.ts');
  const source = fs.readFileSync(path.join(ROOT, 'src/entities/Enemy.ts'), 'utf8');
  const gameScale = Number(source.match(/applyEntityVisual\(this, 'toad', 'move', ([0-9.]+)/)[1]);
  Object.assign(projectile, { mouth: toad.TOAD_SPIT_ORIGIN, gameScale, speed: CFG.infected.toadBombSpeed, arcHeight: CFG.infected.toadBombArcHeight, frameMs: poison.TOAD_BOMB_FRAME_MS });
  const names = { idle: toad.TOAD_IDLE_FRAMES, hop: toad.TOAD_HOP_FRAMES, attack: toad.TOAD_ATTACK_FRAMES };
  const frames = {}, measurements = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const [group, frameNames] of Object.entries(names)) {
    frames[group] = frameNames.map(name => {
      const result = checkedFrame(hd, toad.drawToad(name), name);
      measurements.push({ name, ...result.bounds });
      fs.writeFileSync(path.join(OUT, name + '.png'), result.image.toBuffer('image/png'));
      return result.image;
    });
  }
  const hit = checkedFrame(hd, toad.drawToad('hit'), 'hit');
  measurements.push({ name: 'hit', ...hit.bounds });
  fs.writeFileSync(path.join(OUT, 'hit.png'), hit.image.toBuffer('image/png'));
  const reference = checkedFrame(hd, approved.drawSporeToad, 'approved-B').image;
  const expected = reference.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  const actual = frames.idle[0].getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  let changedPixels = 0;
  for (let i = 0; i < expected.length; i += 4) if (expected.slice(i, i + 4).some((value, j) => value !== actual[i + j])) changedPixels++;
  if (changedPixels) throw Error(`Idle base differs from selected B at ${changedPixels} pixels`);
  const bombs = poison.TOAD_BOMB_FRAMES.map(frame => hd.makeHD(32, poison.drawToadBomb(frame), { outline: false }));
  const qa = { frameCount: measurements.length, approvedBaseChangedPixels: changedPixels, timing, projectile, unique: Object.fromEntries(Object.entries(frames).map(([group, images]) => [group, new Set(images.map(image => image.toDataURL())).size])), bounds: measurements };
  fs.writeFileSync(path.join(OUT, 'frame-bounds.json'), JSON.stringify(qa, null, 2));
  fs.writeFileSync(path.join(OUT, 'toad-preview.html'), html(frames, bombs, gameScale, qa));
  fs.writeFileSync(path.join(OUT, 'toad-preview.png'), board(frames, bombs, 180, gameScale).toBuffer('image/png'));
  fs.writeFileSync(path.join(OUT, 'toad-contact-sheet.png'), contactSheet(frames, names).toBuffer('image/png'));
  if (process.argv.includes('--gif')) {
    const gifFolder = path.join(OUT, 'gif-frames');
    fs.mkdirSync(gifFolder, { recursive: true });
    for (let i = 0; i < 102; i++) fs.writeFileSync(path.join(gifFolder, `${String(i).padStart(3, '0')}.png`), board(frames, bombs, i * 100 / 3, gameScale).toBuffer('image/png'));
    const python = process.env.TOAD_PREVIEW_PYTHON || 'python';
    const result = spawnSync(python, ['-c', 'from PIL import Image\nfrom pathlib import Path\nimport sys\np=Path(sys.argv[1]); images=[Image.open(f).convert("RGB") for f in sorted((p/"gif-frames").glob("*.png"))]\nimages[0].save(p/"toad-preview.gif",save_all=True,append_images=images[1:],duration=[30,30,40]*34,loop=0,optimize=True)', OUT], { encoding: 'utf8' });
    if (result.status !== 0) throw Error(result.stderr || result.error || 'GIF generation failed');
  }
  console.log(JSON.stringify({ frameCount: qa.frameCount, approvedBaseChangedPixels: changedPixels, unique: qa.unique, preview: path.join(OUT, 'toad-preview.html') }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
