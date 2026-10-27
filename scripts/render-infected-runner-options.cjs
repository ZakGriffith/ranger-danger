const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'infected-runner-options');
const C = { page: '#191b23', card: '#252932', ground: '#393343', moss: '#35443b', text: '#eeeade', muted: '#b8bbc2', accent: '#dec58e' };
const specs = [
  { file: 'infected-runner-options', draw: 'drawFungalHound', letter: 'A', title: 'Fungal hound', lines: ['Lean plum hide / rust-colored shelves', 'Low pursuit stance and a snapping jaw.'] },
  { file: 'infected-runner-options', draw: 'drawSporeSkitterer', letter: 'B', title: 'Spore skitterer', lines: ['Lichen shell / six angular legs', 'Wide, quick and unsettling.'] },
  { file: 'infected-runner-options', draw: 'drawWitheredSprinter', letter: 'C', title: 'Withered sprinter', lines: ['Pale face / exposed ribs / fungal mantle', 'A forward lean and long grasping arms.'] },
];

globalThis.document = { createElement: () => createCanvas(1, 1) };

function bounds(image) {
  const pixels = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
  const b = { left: image.width, top: image.height, right: -1, bottom: -1 };
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (!pixels[(y * image.width + x) * 4 + 3]) continue;
    b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
    b.top = Math.min(b.top, y); b.bottom = Math.max(b.bottom, y);
  }
  return b;
}

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color; ctx.fillText(value, x, y);
}

function sprite(ctx, subject, x, feet, scale, flip = false) {
  const b = subject.bounds, w = b.right - b.left + 1, h = b.bottom - b.top + 1;
  ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#10121955'; ctx.beginPath();
  ctx.ellipse(0, 0, w * scale * .43, Math.max(2, w * scale * .055), 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(subject.image, b.left, b.top, w, h, -Math.floor(w / 2), -h, w, h);
  ctx.restore();
}

function panel(ctx, subject, player, zoom = 4, ground = C.ground, flip = false, silhouette = false) {
  ctx.clearRect(0, 0, 360, 416);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, 360, 288);
  sprite(ctx, silhouette ? { ...subject, image: subject.silhouette } : subject, 180, zoom === 5 ? 277 : 259, zoom, flip);
  text(ctx, `${zoom}× detail`, 16, 278, 12);
  ctx.fillStyle = C.card; ctx.fillRect(0, 288, 360, 12);
  ctx.fillStyle = ground; ctx.fillRect(0, 300, 174, 116);
  ctx.fillStyle = C.moss; ctx.fillRect(186, 300, 174, 116);
  sprite(ctx, subject, 87, 387, 1, flip);
  sprite(ctx, player, 249, 376, .5);
  sprite(ctx, subject, 303, 376, subject.gameScale, flip);
  text(ctx, 'Native pixels', 49, 405, 12);
  text(ctx, 'Ranger + game size', 210, 405, 12);
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{
    name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null,
    load: id => id === '\0phaser-stub' ? 'export default {};' : null,
  }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const legacy = await load('/src/assets/art/canvas.ts');
  const enemies = await load('/src/assets/art/enemies.ts');
  const playerArt = await load('/src/assets/art/player.ts');
  const toad = await load('/src/assets/art/toad.ts');
  const blob = await load('/src/assets/art/infectedBlob.ts');
  const { CFG } = await load('/src/config.ts');
  const enemySource = fs.readFileSync(path.join(ROOT, 'src/entities/Enemy.ts'), 'utf8');
  const gameScale = Number(enemySource.match(/applyEntityVisual\(this, 'infected_basic', 'move', ([0-9.]+)/)[1]);
  fs.mkdirSync(OUT, { recursive: true });
  const subjects = [];
  for (const spec of specs) {
    const mod = await load(`/scripts/sprite-tries/${spec.file}.ts`);
    const image = hd.makeHD(64, (put, raw) => {
      const validate = (x, y) => {
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x > 62 || y > 62) throw Error(`${spec.letter}: pixel outside padded canvas: ${x}, ${y}`);
      };
      mod[spec.draw]((x, y, color) => { if (color !== null) validate(x, y); put(x, y, color); },
        (x, y, color, alpha) => { validate(x, y); raw(x, y, color, alpha); });
    }, { outline: false });
    const silhouette = createCanvas(64, 64), silhouetteContext = silhouette.getContext('2d');
    silhouetteContext.drawImage(image, 0, 0);
    silhouetteContext.globalCompositeOperation = 'source-in'; silhouetteContext.fillStyle = '#17151d'; silhouetteContext.fillRect(0, 0, 64, 64);
    const subject = { image, silhouette, bounds: bounds(image), gameScale };
    fs.writeFileSync(path.join(OUT, `${spec.letter}.png`), image.toBuffer('image/png'));
    subjects.push(subject);
  }
  const makeSubject = (image, scale) => ({ image, bounds: bounds(image), gameScale: scale });
  const player = makeSubject(hd.makeHD(64, playerArt.drawPlayer('idle0')), .5);
  const oldRunner = legacy.makeCanvas(32, enemies.drawEnemyInfectedBasic('move0'));
  const oldContext = oldRunner.getContext('2d');
  const oldPixels = oldContext.getImageData(0, 0, oldRunner.width, oldRunner.height);
  for (let i = 0; i < oldPixels.data.length; i += 4) {
    oldPixels.data[i] = Math.round(oldPixels.data[i] * 224 / 255);
    oldPixels.data[i + 1] = Math.round(oldPixels.data[i + 1] * 208 / 255);
    oldPixels.data[i + 2] = Math.round(oldPixels.data[i + 2] * 32 / 255);
  }
  oldContext.putImageData(oldPixels, 0, 0);
  const current = makeSubject(oldRunner, gameScale);
  const jelly = makeSubject(blob.makeInfectedBlobFrame('move0', 0), .5);
  const sporeback = makeSubject(hd.makeHD(64, toad.drawToad('idle0'), { outline: false }), .55);
  const refs = [{ ...player, name: 'Ranger' }, { ...jelly, name: 'Approved blob' }, { ...sporeback, name: 'Approved toad' }, { ...current, name: 'Old runner shape' }];
  const strip = createCanvas(1120, 124), stripContext = strip.getContext('2d');
  stripContext.fillStyle = C.card; stripContext.fillRect(0, 0, 1120, 124);
  text(stripContext, 'CURRENT ROSTER', 18, 28, 12, C.accent, true);
  refs.forEach((ref, i) => { sprite(stripContext, ref, 300 + i * 232, 86, ref.gameScale * 2); text(stripContext, ref.name, 253 + i * 232, 110, 13); });
  text(stripContext, 'Relative sizes at 2×', 18, 55, 13);
  text(stripContext, 'Concepts use runner scale.', 18, 77, 13);
  fs.writeFileSync(path.join(OUT, 'roster.png'), strip.toBuffer('image/png'));

  const board = createCanvas(1168, 846), ctx = board.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, board.width, board.height);
  text(ctx, 'INFECTED / RUNNER CONCEPTS', 24, 41, 28, C.text, true);
  text(ctx, `Fast pack enemy · ${CFG.enemy.runner.hp} base HP · ${CFG.enemy.runner.speed} speed · ${CFG.enemy.runner.dmg} damage`, 25, 72, 16);
  text(ctx, 'Three static pixel-art directions. Choose the model before animation.', 25, 99, 15);
  subjects.forEach((subject, i) => {
    const x = 24 + i * 384;
    ctx.fillStyle = C.card; ctx.fillRect(x, 121, 360, 548);
    text(ctx, specs[i].letter, x + 16, 157, 24, C.accent, true);
    text(ctx, specs[i].title, x + 52, 156, 23, C.text, true);
    specs[i].lines.forEach((line, j) => text(ctx, line, x + 16, 184 + j * 21, 14));
    const p = createCanvas(360, 416); panel(p.getContext('2d'), subject, player);
    ctx.drawImage(p, x, 237);
  });
  ctx.drawImage(strip, 24, 692);
  fs.writeFileSync(path.join(OUT, 'runner-options.png'), board.toBuffer('image/png'));

  const data = subjects.map(({ image, silhouette, ...subject }) => ({ ...subject, src: image.toDataURL(), silhouetteSrc: silhouette.toDataURL() }));
  const playerData = { bounds: player.bounds, src: player.image.toDataURL() };
  fs.writeFileSync(path.join(OUT, 'runner-options.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Infected runner · Pixel art concepts</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1192px;margin:auto;padding:24px}.eyebrow{color:${C.accent};font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:28px;margin:5px 0 9px}p{color:${C.muted};line-height:1.5;margin:7px 0}.stats{font-size:14px}.controls{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:18px 0}label{display:flex;gap:8px;align-items:center}select{background:${C.card};color:${C.text};font:inherit;border:1px solid #6a6571;border-radius:5px;padding:6px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{background:${C.card};border:1px solid #424450;border-radius:7px;overflow:hidden}.copy{padding:13px 14px}h2{font-size:21px;margin:0 0 7px}h2 span{color:${C.accent};margin-right:9px}.copy p{font-size:13px;margin:4px 0}canvas{width:100%;height:auto;display:block;image-rendering:pixelated}.roster{display:block;width:100%;height:auto;image-rendering:pixelated;margin:21px 0;border-radius:7px}a{color:${C.accent}}#preview-status{color:#ffb7a5}.foot{font-size:13px}@media(max-width:740px){main{max-width:430px}.grid{grid-template-columns:1fr}.roster{min-width:560px}.roster-wrap{overflow:auto}}</style></head><body><main>
<div class="eyebrow">INFECTED · NEXT ENEMY</div><h1>The runner: three directions</h1><p class="stats">${CFG.enemy.runner.hp} base HP · ${CFG.enemy.runner.speed} speed · ${CFG.enemy.runner.dmg} melee damage — fragile and fast, distinct from the blobs and Ironcap.</p><p>Hand-authored pixel art, subtle dark borders, distinct silhouettes. Choose a model before animation.</p>
<div class="controls"><label>Detail <select id="zoom"><option value="4">4×</option><option value="3">3×</option><option value="5">5×</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Infected purple</option><option value="${C.moss}">Moss green</option><option value="#7d7b84">Light stone</option></select></label><label><input id="flip" type="checkbox">Flip</label><label><input id="silhouette" type="checkbox">Silhouettes</label></div>
<section class="grid">${specs.map(s => `<article class="card"><div class="copy"><h2><span>${s.letter}</span>${s.title}</h2><p>${s.lines[0]}</p><p>${s.lines[1]}</p></div><canvas width="360" height="416" aria-label="${s.letter}: ${s.title} pixel art, native pixels and game size beside ranger"></canvas></article>`).join('')}</section>
<p id="preview-status" role="status">Loading concepts…</p><div class="roster-wrap"><img class="roster" src="roster.png" alt="Roster at twice game size: ranger, blob, toad, old runner shape"></div><p class="foot">Static concepts only. No gameplay or animation changes yet. <a href="runner-options.png">Open comparison sheet</a>.</p>
</main><script>const C=${JSON.stringify(C)},subjects=${JSON.stringify(data)},player=${JSON.stringify(playerData)};
${text.toString()}
${sprite.toString()}
${panel.toString()}
const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
Promise.all([load(player.src).then(image=>player.image=image),...subjects.map(async subject=>{subject.image=await load(subject.src);subject.silhouette=await load(subject.silhouetteSrc);})]).then(()=>{const canvases=[...document.querySelectorAll('canvas')];const redraw=()=>canvases.forEach((canvas,i)=>panel(canvas.getContext('2d'),subjects[i],player,Number(document.querySelector('#zoom').value),document.querySelector('#ground').value,document.querySelector('#flip').checked,document.querySelector('#silhouette').checked));document.querySelectorAll('select,input').forEach(control=>control.onchange=redraw);redraw();document.querySelector('#preview-status').textContent='';}).catch(error=>{document.querySelector('#preview-status').textContent='Preview failed: '+error.message;console.error(error);});</script></body></html>`);
  console.log(JSON.stringify({ concepts: subjects.map((s, i) => ({ name: specs[i].title, bounds: s.bounds, gameScale })), html: path.join(OUT, 'runner-options.html'), image: path.join(OUT, 'runner-options.png') }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
