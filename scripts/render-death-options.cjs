const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'death-options');
const FILES = ['death-collapse.cjs', 'death-dust.cjs', 'death-scatter.cjs'];
const options = FILES.map(file => require(path.join(__dirname, 'sprite-tries', file)));
const C = { page: '#17241e', card: '#263a2c', field: '#405c38', ink: '#f0ead7', muted: '#b7c6ae', accent: '#d9bf82' };
globalThis.document = { createElement: () => createCanvas(1, 1) };

function bounds(image) {
  const data = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
  const b = { left: image.width, top: image.height, right: -1, bottom: -1 };
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (data[(y * image.width + x) * 4 + 3] === 0) continue;
    b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
    b.top = Math.min(b.top, y); b.bottom = Math.max(b.bottom, y);
  }
  return b;
}

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function drawSubject(ctx, subject, option, t, x, feet, zoom) {
  ctx.save(); ctx.translate(x, feet); ctx.scale(zoom, zoom); ctx.imageSmoothingEnabled = false;
  const shadow = t < 0 ? 1 : Math.max(0, 1 - t / option.duration);
  ctx.fillStyle = `rgba(12,24,13,${0.25 * shadow})`;
  ctx.beginPath(); ctx.ellipse(0, 0, subject.width * 0.42, subject.width * 0.075, 0, 0, Math.PI * 2); ctx.fill();
  if (t < 0) {
    const b = subject.bounds;
    ctx.drawImage(subject.image, b.left, b.top, b.right - b.left + 1, b.bottom - b.top + 1,
      -subject.width / 2, -subject.height, subject.width, subject.height);
  } else option.draw(ctx, subject, t);
  ctx.restore();
}

function drawColumn(ctx, subjects, option, time, zoom = 3, displayScale = 1) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, 352, 510);
  subjects.forEach((subject, i) => {
    const y = i * 170;
    ctx.fillStyle = C.field; ctx.fillRect(8, y + 8, 336, 154);
    text(ctx, subject.kind.toUpperCase(), 20, y + 30, 13, C.ink, true);
    drawSubject(ctx, subject, option, time, 123, y + 135, zoom * displayScale);
    drawSubject(ctx, subject, option, time, 287, y + 120, displayScale);
    text(ctx, `${zoom}× detail`, 91, y + 153, 11);
    text(ctx, 'Game size', 257, y + 153, 11);
  });
}

function board(subjects, time) {
  const image = createCanvas(1136, 684);
  const ctx = image.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, image.width, image.height);
  text(ctx, 'ENEMY DEATH / THREE DIRECTIONS', 24, 40, 27, C.ink, true);
  text(ctx, 'Same creatures, same game sizes. Each effect follows the visible body.', 25, 67, 15);
  options.forEach((option, i) => {
    const x = 24 + i * 368;
    text(ctx, `${'ABC'[i]} / ${option.title.toUpperCase()}`, x + 8, 105, 20, C.accent, true);
    ctx.save(); ctx.translate(x, 122); drawColumn(ctx, subjects, option, time); ctx.restore();
  });
  text(ctx, 'Preview options only · no gameplay changes yet', 25, 663, 14);
  return image;
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{
    name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null,
    load: id => id === '\0phaser-stub' ? 'export default {};' : null,
  }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const spider = await load('/src/assets/art/spider.ts');
  const wolf = await load('/src/assets/art/wolf.ts');
  const bear = await load('/src/assets/art/bear.ts');
  const entities = fs.readFileSync(path.join(ROOT, 'src/entities/Enemy.ts'), 'utf8');
  const scale = kind => Number(entities.match(new RegExp(`applyEntityVisual\\(this, '${kind}', 'move', ([0-9.]+)`))[1]);
  const subjects = [
    { kind: 'spider', image: hd.makeHD(64, spider.drawSpider('atk0')), scale: scale('spider'), palette: ['#453027', '#755038', '#ad8055', '#c4a070'] },
    { kind: 'wolf', image: hd.makeHD(64, wolf.drawWolfIdle(), { outline: false }), scale: scale('wolf'), palette: ['#46505a', '#6c7a84', '#a9b5b7', '#d2d4c2'] },
    { kind: 'bear', image: hd.makeHD(64, bear.drawBear('atk0')), scale: scale('bear'), palette: ['#342825', '#604232', '#906544', '#c49968'] },
  ];
  for (const subject of subjects) {
    subject.bounds = bounds(subject.image);
    subject.width = (subject.bounds.right - subject.bounds.left + 1) * subject.scale;
    subject.height = (subject.bounds.bottom - subject.bounds.top + 1) * subject.scale;
  }
  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  const sources = subjects.map(({ image, ...data }) => ({ ...data, src: image.toDataURL() }));
  fs.writeFileSync(path.join(OUT, 'death-options.png'), board(subjects, 0.22).toBuffer('image/png'));
  const samples = [-0.1, 0.12, 0.26, 0.42, 0.6, 0.8];
  const contact = createCanvas(1136, samples.length * 220);
  const contactCtx = contact.getContext('2d');
  contactCtx.fillStyle = C.page; contactCtx.fillRect(0, 0, contact.width, contact.height);
  samples.forEach((time, row) => {
    text(contactCtx, time < 0 ? 'BEFORE' : `${Math.round(time * 1000)} ms`, 24, row * 220 + 28, 15, C.accent, true);
    options.forEach((option, column) => {
      const x = 24 + column * 368;
      contactCtx.fillStyle = C.field; contactCtx.fillRect(x, row * 220 + 42, 352, 160);
      text(contactCtx, `${'ABC'[column]} / ${option.title}`, x + 10, row * 220 + 65, 14, C.ink, true);
      subjects.forEach((s, i) => drawSubject(contactCtx, s, option, time, x + 61 + i * 114, row * 220 + 182, 2.3));
    });
  });
  fs.writeFileSync(path.join(OUT, 'death-contact.png'), contact.toBuffer('image/png'));
  const fps = 24, loopDuration = 2.25, leadIn = 0.55;
  for (let frame = 0; frame < fps * loopDuration; frame++) {
    fs.writeFileSync(path.join(OUT, 'frames', `${String(frame).padStart(3, '0')}.png`), board(subjects, frame / fps - leadIn).toBuffer('image/png'));
  }
  const moduleSource = FILES.map(file => `(() => { const module = { exports: {} }; ${fs.readFileSync(path.join(__dirname, 'sprite-tries', file), 'utf8')} return module.exports; })()`).join(',\n');
  fs.writeFileSync(path.join(OUT, 'death-options.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enemy death — animation options</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.ink};font:15px system-ui}main{max-width:1184px;margin:auto;padding:24px}h1{font-size:29px;margin:0 0 10px}h2{font-size:21px;color:${C.accent};margin:0 0 8px}.intro,p{color:${C.muted};line-height:1.45}.controls{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:22px 0}button,select{font:inherit;color:${C.ink};background:${C.card};padding:8px 13px;border:1px solid #566e53;border-radius:5px}button{cursor:pointer}label{display:flex;gap:8px;align-items:center}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{background:${C.card};padding:12px 8px 8px;border-radius:6px}article header{padding:0 8px;min-height:144px}article p{font-size:13px;margin:0 0 9px}canvas{display:block;width:100%;height:auto;image-rendering:pixelated}input{accent-color:${C.accent}}.timeline{display:flex;gap:12px;align-items:center;margin-bottom:20px}.timeline input{flex:1}.status{color:${C.accent};min-width:110px}a{color:${C.accent}}@media(max-width:820px){.grid{grid-template-columns:1fr}main{max-width:440px}}</style></head>
<body><main><h1>Enemy death / three directions</h1><p class="intro">Compare the same spider, wolf, and bear at their current game sizes. Each effect follows the creature’s visible body.</p>
<div class="controls"><button id="replay">Replay all</button><button id="pause" aria-pressed="false">Pause</button><label>Speed <select id="speed"><option value="1">1×</option><option value="0.5">½×</option><option value="0.25">¼×</option></select></label><label>Detail <select id="zoom"><option value="3">3×</option><option value="4">4×</option><option value="2">2×</option><option value="1">Game size</option></select></label><label><input id="loop" type="checkbox" checked>Loop</label><span class="status" id="status"></span></div>
<div class="timeline"><label for="scrub">Inspect</label><input id="scrub" type="range" min="-0.25" max="0.9" step="0.01" value="-0.25" aria-label="Time after defeat"><output id="clock">Ready</output></div>
<section class="grid">${options.map((o, i) => `<article><header><h2>${'ABC'[i]} / ${o.title}</h2><p>${o.description}</p><p>${Math.round(o.duration * 1000)} ms</p></header><canvas width="352" height="510" aria-label="${o.title} on spider, wolf, and bear"></canvas></article>`).join('')}</section>
<p>Preview options only. The game’s current death effects have not been changed. <a href="death-contact.png">View the frame comparison</a>.</p></main>
<script>
const C = ${JSON.stringify(C)};
const options = [${moduleSource}];
${text.toString()}
${drawSubject.toString()}
${drawColumn.toString()}
const subjects = ${JSON.stringify(sources)};
const load = src => new Promise((resolve,reject) => {const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
(async()=>{
await Promise.all(subjects.map(async s=>{s.image=await load(s.src);}));
const canvases=[...document.querySelectorAll('canvas')],pause=document.querySelector('#pause'),scrub=document.querySelector('#scrub');
let time=-${leadIn},previous,paused=false,rate=1,zoom=3;
function setPaused(value){paused=value;pause.textContent=value?'Play':'Pause';pause.setAttribute('aria-pressed',String(value));}
pause.onclick=()=>setPaused(!paused);
document.querySelector('#replay').onclick=()=>{time=-${leadIn};setPaused(false);};
document.querySelector('#speed').onchange=e=>{rate=Number(e.target.value);};
document.querySelector('#zoom').onchange=e=>{zoom=Number(e.target.value);};
scrub.oninput=()=>{time=Number(scrub.value);setPaused(true);};
function tick(now){if(previous!==undefined&&!paused){time+=Math.min((now-previous)/1000,0.1)*rate;if(time>${loopDuration-leadIn}){if(document.querySelector('#loop').checked)time=-${leadIn};else{time=0.9;setPaused(true);}}}previous=now;
canvases.forEach((canvas,i)=>drawColumn(canvas.getContext('2d'),subjects,options[i],time,zoom,canvas.width/canvas.clientWidth));
document.querySelector('#status').textContent=time<0?'Ready':time<0.86?'Defeat':'Cleared';
document.querySelector('#clock').textContent=time<0?'Before':Math.round(Math.min(time,0.9)*1000)+' ms';scrub.value=String(Math.max(-0.25,Math.min(0.9,time)));requestAnimationFrame(tick);}
requestAnimationFrame(tick);
})().catch(error=>{document.querySelector('#status').textContent='Preview failed: '+error.message;console.error(error);});
</script></body></html>`);
  fs.writeFileSync(path.join(OUT, 'render-info.json'), JSON.stringify({ fps, loopDuration, leadIn, subjects: sources.map(({ src, ...s }) => s), options: options.map(({ draw, ...o }) => o) }, null, 2));
  console.log(path.join(OUT, 'death-options.html'));
  console.log(path.join(OUT, 'death-options.png'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
