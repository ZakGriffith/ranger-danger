const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'infected-heavy-animation');
const C = { page: '#191b23', panel: '#252932', ground: '#393343', moss: '#35443b', text: '#eeeade', muted: '#b8bbc2', accent: '#dec58e' };
globalThis.document = { createElement: () => createCanvas(1, 1) };

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}

function figure(ctx, image, x, feet, scale, flip = false) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#14141c66'; ctx.beginPath(); ctx.ellipse(0, 0, 23 * scale, Math.max(2, 3 * scale), 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(flip ? -1 : 1, 1); ctx.drawImage(image, -48 * scale, -76 * scale, 96 * scale, 96 * scale); ctx.restore();
}

function ranger(ctx, image, x, feet, scale = .5) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, Math.round(x - 32 * scale), Math.round(feet - 60 * scale), 64 * scale, 64 * scale); ctx.restore();
}

function stage(ctx, image, ground = C.ground, flip = false) {
  ctx.fillStyle = ground; ctx.fillRect(0, 0, 480, 420);
  ctx.fillStyle = '#ffffff06';
  for (let i = 0; i < 45; i++) ctx.fillRect(14 + i * 67 % 450, 40 + i * 71 % 333, 3 + i % 4, 1);
  figure(ctx, image, 240, 340, 4, flip);
  text(ctx, '4× detail', 20, 402, 12);
}

function sizes(ctx, image, player, ground = C.ground, flip = false) {
  ctx.fillStyle = C.panel; ctx.fillRect(0, 0, 480, 108);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, 234, 108);
  ctx.fillStyle = C.moss; ctx.fillRect(246, 0, 234, 108);
  figure(ctx, image, 117, 79, 1, flip);
  ranger(ctx, player, 328, 73);
  figure(ctx, image, 390, 73, .6, flip);
  text(ctx, 'Native pixels', 79, 100, 12);
  text(ctx, 'Ranger + game size', 302, 100, 12);
}

function checked(hd, draw, name) {
  const image = hd.makeHD(96, (put, raw) => draw((x, y, paint) => {
    if (paint !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x > 94 || y > 94)) throw Error(`${name}: clipped or fractional pixel ${x}, ${y}`);
    put(x, y, paint);
  }, raw), { outline: false });
  const pixels = image.getContext('2d').getImageData(0, 0, 96, 96).data;
  const bounds = [96, 96, -1, -1];
  for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
    if (!pixels[(y * 96 + x) * 4 + 3]) continue;
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
  }
  if (bounds[2] === -1) throw Error(`${name}: empty frame`);
  return { image, bounds };
}

function sheet(frames) {
  const canvas = createCanvas(96 * frames.length, 96), ctx = canvas.getContext('2d');
  frames.forEach((frame, i) => ctx.drawImage(frame, i * 96, 0)); return canvas;
}

function contact(frames, title) {
  const canvas = createCanvas(1200, 870), ctx = canvas.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, 1200, 870);
  text(ctx, title, 24, 37, 25, C.text, true);
  frames.forEach((frame, i) => {
    const x = 24 + i % 6 * 196, y = 62 + Math.floor(i / 6) * 198;
    ctx.fillStyle = C.ground; ctx.fillRect(x, y, 184, 174);
    figure(ctx, frame, x + 92, y + 147, 2);
    text(ctx, String(i + 1).padStart(2, '0'), x + 7, y + 191, 13);
  });
  return canvas;
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const art = await load('/src/assets/art/ironcap.ts');
  const idleArt = await load('/src/assets/art/ironcapIdle.ts');
  const playerArt = await load('/src/assets/art/player.ts');
  fs.mkdirSync(OUT, { recursive: true });
  const frameBounds = [];
  const render = name => { const result = checked(hd, art.drawIroncap(name), name); frameBounds.push({ name, bounds: result.bounds }); return result.image; };
  const idle = render('idle');
  const moves = art.IRONCAP_MOVE_FRAMES.map(render), attacks = art.IRONCAP_ATTACK_FRAMES.map(render);
  const player = hd.makeHD(64, playerArt.drawPlayer('idle0'));
  const reference = hd.makeHD(64, idleArt.drawIroncapHeavy, { outline: false });
  const original = reference.getContext('2d').getImageData(0, 0, 64, 64).data;
  const preserved = idle.getContext('2d').getImageData(16, 16, 64, 64).data;
  for (let i = 0; i < original.length; i++) if (original[i] !== preserved[i]) throw Error(`Production idle differs at component ${i}`);
  const write = (name, canvas) => fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
  write('ironcap-idle.png', idle); write('ironcap-move-sheet.png', sheet(moves)); write('ironcap-attack-sheet.png', sheet(attacks));
  write('ironcap-move-contact.png', contact(moves, 'IRONCAP / HEAVY WALK — ALL 24 FRAMES'));
  write('ironcap-attack-contact.png', contact(attacks, 'IRONCAP / ARM STRIKE — ALL 24 FRAMES'));
  const board = createCanvas(1040, 768), ctx = board.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, 1040, 768);
  text(ctx, 'A / IRONCAP BRUTE', 24, 43, 29, C.text, true);
  text(ctx, 'Heavy walk and arm strike · approved fungal armor and charcoal body', 25, 75, 16);
  [[moves[3], 'MOVE', 'Weight shift / planted steps'], [attacks[art.IRONCAP_IMPACT_FRAME], 'ATTACK', 'Wind-up / strike / settle']].forEach(([frame, label, detail], i) => {
    const x = 24 + i * 512;
    ctx.fillStyle = C.panel; ctx.fillRect(x, 98, 480, 632);
    text(ctx, label, x + 16, 128, 20, C.accent, true); text(ctx, detail, x + 16, 152, 14);
    const large = createCanvas(480, 420); stage(large.getContext('2d'), frame); ctx.drawImage(large, x, 170);
    const small = createCanvas(480, 108); sizes(small.getContext('2d'), frame, player); ctx.drawImage(small, x, 606);
  });
  text(ctx, 'Production game art — play, slow down, or step through the poses in the preview.', 25, 753, 13);
  write('ironcap-animation-board.png', board);

  const sources = { idle: idle.toDataURL(), player: player.toDataURL(), moves: moves.map(f => f.toDataURL()), attacks: attacks.map(f => f.toDataURL()) };
  const meta = { moveFps: art.IRONCAP_MOVE_FPS, attackFps: art.IRONCAP_ATTACK_FPS, impact: art.IRONCAP_IMPACT_FRAME };
  const card = (group, title, subtitle) => `<article class="card"><div class="copy"><h2>${title}</h2><p>${subtitle}</p></div><canvas class="stage" width="480" height="420" data-group="${group}" aria-label="Ironcap ${title.toLowerCase()} animation enlarged"></canvas><div class="readout"><span id="${group}-phase"></span><span id="${group}-frame"></span></div><canvas class="sizes" width="480" height="108" data-group="${group}" aria-label="Ironcap ${title.toLowerCase()} animation at native and game sizes"></canvas></article>`;
  fs.writeFileSync(path.join(OUT, 'ironcap-preview.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ironcap brute · Move & attack</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1088px;margin:auto;padding:24px}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700;color:${C.accent}}h1{font-size:28px;margin:5px 0 8px}p{color:${C.muted};line-height:1.5;margin:8px 0}.controls{display:flex;gap:13px;align-items:center;flex-wrap:wrap;margin:19px 0}button,select{font:inherit;color:${C.text};background:${C.panel};border:1px solid #66616e;border-radius:5px;padding:7px 11px}button{cursor:pointer}button:hover{background:#353845}label{display:flex;align-items:center;gap:7px}button:focus-visible,select:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:22px}.card{min-width:0;background:${C.panel};border:1px solid #424450;border-radius:7px;overflow:hidden}.copy{padding:15px 17px 10px}h2{font-size:20px;margin:0;color:${C.accent}}.copy p{margin:6px 0 0;font-size:14px}canvas{display:block;max-width:100%;height:auto;image-rendering:pixelated}.stage,.sizes{width:100%}.readout{display:flex;justify-content:space-between;gap:15px;padding:8px 14px;font-size:12px;color:${C.muted};min-height:33px}.readout span:first-child{color:${C.accent}}.reference{display:flex;gap:20px;align-items:center;margin-top:22px;padding:12px 20px;background:${C.panel};border-radius:7px}.reference canvas{width:96px;height:96px;flex:none}.reference h2{font-size:16px}.reference p,.notes{font-size:13px}.notes{margin:18px 0;color:${C.muted}}a{color:${C.accent}}details{margin-top:16px;color:${C.muted};font-size:13px}summary{cursor:pointer}input[type=range]{width:180px}details label{margin:13px 0}.failed{color:#ffbcaa}@media(max-width:680px){.cards{grid-template-columns:1fr}main{padding:20px 13px}.reference{gap:8px;padding:8px 12px}}</style></head><body><main>
<div class="eyebrow">INFECTED HEAVY · APPROVED MODEL A</div><h1>Ironcap brute: move + attack</h1><p>A heavy walk with rolling shoulders, followed by a deliberate arm strike. The fungal plates and dark body stay true to A.</p>
<div class="controls"><button id="pause" type="button" aria-pressed="false">Pause</button><button id="replay" type="button">Replay attack</button><button id="step" type="button">Step frame</button><label>Speed <select id="speed"><option value="1">1×</option><option value="0.5">½×</option><option value="0.25">¼×</option><option value="2">2×</option></select></label><label>Facing <select id="facing"><option value="right">Right</option><option value="left">Left</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Purple</option><option value="${C.moss}">Moss</option><option value="#77767c">Light</option></select></label></div>
<section class="cards">${card('moves', 'Heavy walk', 'Planted steps · counter-swinging arms · shoulder weight shift')}${card('attacks', 'Arm strike', 'Draw back · quick strike · weighted recovery')}</section>
<section class="reference"><canvas id="reference" width="96" height="96" aria-label="Approved Ironcap static pose"></canvas><div><h2>Approved A, held still for comparison</h2><p>Both animations also appear at native resolution and game size beside the ranger.</p></div></section>
<details><summary>Inspect individual frames</summary><label>Walk <input id="move-scrub" aria-label="Walk frame" type="range" min="0" max="23" value="0"></label><label>Attack <input id="attack-scrub" aria-label="Attack frame" type="range" min="0" max="23" value="0"></label><p><a href="ironcap-move-contact.png">Every walk pose</a> · <a href="ironcap-attack-contact.png">Every attack pose</a></p></details>
<p class="notes" id="status">Loading animation frames…</p></main><script>
const C=${JSON.stringify(C)},sources=${JSON.stringify(sources)},meta=${JSON.stringify(meta)};
${text.toString()}
${figure.toString()}
${ranger.toString()}
${stage.toString()}
${sizes.toString()}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
async function start(){
const frames={moves:await Promise.all(sources.moves.map(load)),attacks:await Promise.all(sources.attacks.map(load))},idle=await load(sources.idle),player=await load(sources.player);
const reference=document.querySelector('#reference').getContext('2d');reference.imageSmoothingEnabled=false;reference.drawImage(idle,0,0);
let paused=false,rate=1,flip=false,ground=C.ground,moveTime=0,attackTime=-.3,last;
const duration=frames.attacks.length/meta.attackFps,cycle=duration+.6,pauseButton=document.querySelector('#pause');
function setPaused(value){paused=value;pauseButton.textContent=value?'Play':'Pause';pauseButton.setAttribute('aria-pressed',String(value));}
function indices(){return {moves:Math.floor(moveTime*meta.moveFps+1e-7)%frames.moves.length,attacks:attackTime<0?0:Math.min(frames.attacks.length-1,Math.floor(attackTime*meta.attackFps+1e-7))};}
function attackPhase(i){return attackTime<0||attackTime>=duration?'Ready':i<meta.impact-2?'Wind-up':i<=meta.impact+1?'Strike':'Recovery';}
function render(){const index=indices();for(const canvas of document.querySelectorAll('canvas[data-group]')){const group=canvas.dataset.group,image=frames[group][index[group]],ctx=canvas.getContext('2d');if(canvas.classList.contains('stage'))stage(ctx,image,ground,flip);else sizes(ctx,image,player,ground,flip);}document.querySelector('#moves-phase').textContent='Heavy walk';document.querySelector('#attacks-phase').textContent=attackPhase(index.attacks);for(const group of ['moves','attacks'])document.querySelector('#'+group+'-frame').textContent=String(index[group]+1).padStart(2,'0')+' / '+frames[group].length;document.querySelector('#move-scrub').value=index.moves;document.querySelector('#attack-scrub').value=index.attacks;}
pauseButton.onclick=()=>setPaused(!paused);document.querySelector('#replay').onclick=()=>{attackTime=0;setPaused(false);render();};document.querySelector('#step').onclick=()=>{setPaused(true);moveTime+=1/meta.moveFps;attackTime=attackTime<0||attackTime>=duration?0:attackTime+1/meta.attackFps;render();};document.querySelector('#speed').onchange=e=>{rate=Number(e.target.value);};document.querySelector('#facing').onchange=e=>{flip=e.target.value==='left';render();};document.querySelector('#ground').onchange=e=>{ground=e.target.value;render();};document.querySelector('#move-scrub').oninput=e=>{setPaused(true);moveTime=Number(e.target.value)/meta.moveFps;render();};document.querySelector('#attack-scrub').oninput=e=>{setPaused(true);attackTime=Number(e.target.value)/meta.attackFps;render();};
function tick(now){if(last!==undefined&&!paused){const delta=Math.min((now-last)/1000,.1)*rate;moveTime+=delta;attackTime+=delta;if(attackTime>=cycle)attackTime-=cycle;}last=now;render();requestAnimationFrame(tick);}
document.querySelector('#status').textContent='Production Ironcap art used in the game. Move and attack animations run at 24 frames per second.';render();requestAnimationFrame(tick);
}
start().catch(error=>{document.querySelector('#status').textContent='Preview failed: '+error.message;document.querySelector('#status').classList.add('failed');console.error(error);});
</script></body></html>`);
  fs.writeFileSync(path.join(OUT, 'frame-bounds.json'), JSON.stringify(frameBounds, null, 2));
  console.log(JSON.stringify({ productionIdle: 'pixel-identical', frames: frameBounds.length, meta, html: path.join(OUT, 'ironcap-preview.html') }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
