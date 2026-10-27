const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'infected-pixel-concepts');
const C = { page: '#1b1923', card: '#2c2736', ground: '#3a3146', moss: '#394530', text: '#eee9dc', muted: '#bcb3c4', accent: '#d5b789' };
const specs = [
  { file: 'infected-bristle', draw: 'drawBristleInfected', letter: 'A', title: 'Bristleback', lines: ['Plum hide / amber boils / bone ridge', 'Closest to the original creature.'] },
  { file: 'infected-bloom', draw: 'drawBloomInfected', letter: 'B', title: 'Bloomback', lines: ['Rust-colored shelves / heavy forelimbs', 'The strongest link to the Sporeback.'] },
  { file: 'infected-splitjaw', draw: 'drawSplitjawInfected', letter: 'C', title: 'Splitjaw', lines: ['Pale violet hide / pronounced fang jaw', 'A lower, more predatory silhouette.'] },
];

globalThis.document = { createElement: () => createCanvas(1, 1) };

function bounds(image) {
  const data = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
  const box = { left: image.width, top: image.height, right: -1, bottom: -1 };
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (!data[(y * image.width + x) * 4 + 3]) continue;
    box.left = Math.min(box.left, x); box.right = Math.max(box.right, x);
    box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y);
  }
  return box;
}

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color; ctx.fillText(value, x, y);
}

function sprite(ctx, subject, x, feet, scale, flip = false) {
  const b = subject.bounds, w = b.right - b.left + 1, h = b.bottom - b.top + 1;
  ctx.save(); ctx.translate(x, feet); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#17131c66'; ctx.beginPath();
  ctx.ellipse(0, 0, w * scale * .43, w * scale * .06, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(subject.image, b.left, b.top, w, h, -Math.floor(w / 2), -h, w, h);
  ctx.restore();
}

function card(ctx, subject, spec, zoom = 4, ground = C.ground, flip = false) {
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, 360, 568);
  text(ctx, spec.letter, 18, 34, 24, C.accent, true);
  text(ctx, spec.title, 54, 33, 23, C.text, true);
  spec.lines.forEach((line, i) => text(ctx, line, 18, 62 + i * 21, 14));
  ctx.fillStyle = ground; ctx.fillRect(12, 104, 336, 320);
  sprite(ctx, subject, 180, 391, zoom, flip);
  text(ctx, `${zoom}× detail`, 26, 412, 12);
  ctx.fillStyle = ground; ctx.fillRect(12, 438, 162, 112);
  ctx.fillStyle = C.moss; ctx.fillRect(186, 438, 162, 112);
  sprite(ctx, subject, 93, 517, 1, flip);
  sprite(ctx, subject, 267, 506, subject.gameScale, flip);
  text(ctx, 'Native pixels', 55, 539, 12);
  text(ctx, 'Game size', 239, 539, 12);
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
  const toad = await load('/src/assets/art/toad.ts');
  const enemySource = fs.readFileSync(path.join(ROOT, 'src/entities/Enemy.ts'), 'utf8');
  const gameScale = Number(enemySource.match(/applyEntityVisual\(this, 'infected_basic', 'move', ([0-9.]+)/)[1]);
  const toadScale = Number(enemySource.match(/applyEntityVisual\(this, 'toad', 'move', ([0-9.]+)/)[1]);
  fs.mkdirSync(OUT, { recursive: true });
  const subjects = [];
  for (const spec of specs) {
    const mod = await load(`/scripts/sprite-tries/${spec.file}.ts`);
    const image = hd.makeHD(64, (put, raw) => {
      const validate = (x, y) => {
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x > 62 || y > 62) {
          throw Error(`${spec.letter}: pixel outside padded canvas: ${x}, ${y}`);
        }
      };
      mod[spec.draw]((x, y, color) => { if (color !== null) validate(x, y); put(x, y, color); },
        (x, y, color, alpha) => { validate(x, y); raw(x, y, color, alpha); });
    }, { outline: false });
    const subject = { image, bounds: bounds(image), gameScale };
    fs.writeFileSync(path.join(OUT, `${spec.file}.png`), image.toBuffer('image/png'));
    subjects.push(subject);
  }
  const currentImage = legacy.makeCanvas(32, enemies.drawEnemyInfectedBasic('move0'));
  const toadImage = hd.makeHD(64, toad.drawToad('idle0'), { outline: false });
  const current = { image: currentImage, bounds: bounds(currentImage), gameScale };
  const reference = { image: toadImage, bounds: bounds(toadImage), gameScale: toadScale };
  fs.writeFileSync(path.join(OUT, 'infected-current.png'), currentImage.toBuffer('image/png'));
  fs.writeFileSync(path.join(OUT, 'sporeback-reference.png'), toadImage.toBuffer('image/png'));
  const board = createCanvas(1168, 856), ctx = board.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, board.width, board.height);
  text(ctx, 'INFECTED / BASIC ENEMY', 24, 43, 29, C.text, true);
  text(ctx, 'Three static designs · hand-authored pixel art · small dark borders', 25, 75, 16);
  subjects.forEach((subject, i) => { ctx.save(); ctx.translate(24 + i * 384, 100); card(ctx, subject, specs[i]); ctx.restore(); });
  ctx.fillStyle = C.card; ctx.fillRect(24, 690, 1120, 140);
  sprite(ctx, current, 98, 802, 1.7);
  text(ctx, 'Current basic Infected', 174, 726, 17, C.text, true);
  text(ctx, 'Small purple melee creature.', 174, 753);
  text(ctx, 'The familiar body, boils and fang maw.', 174, 779);
  sprite(ctx, reference, 663, 802, 1.7);
  text(ctx, 'Approved Sporeback / style reference', 731, 726, 17, C.text, true);
  text(ctx, 'Clean silhouettes and clustered shading.', 731, 753);
  text(ctx, 'Choose a design before animation.', 731, 779);
  fs.writeFileSync(path.join(OUT, 'infected-options.png'), board.toBuffer('image/png'));
  const data = subjects.map(({ image, ...subject }) => ({ ...subject, src: image.toDataURL() }));
  fs.writeFileSync(path.join(OUT, 'infected-options.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Infected basic — pixel art options</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1216px;margin:auto;padding:24px}h1{font-size:29px;margin:0 0 10px}p{color:${C.muted};line-height:1.5}.controls{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:20px 0}label{display:flex;gap:8px;align-items:center}select{background:${C.card};color:${C.text};font:inherit;border:1px solid #655971;border-radius:5px;padding:7px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}canvas{width:100%;height:auto;display:block;image-rendering:pixelated;border-radius:6px}.reference{display:flex;gap:24px;align-items:center;margin:22px 0;padding:16px;background:${C.card};border-radius:6px}.reference img{width:96px;height:96px;image-rendering:pixelated}.reference strong{display:block;margin-bottom:8px}.reference div{flex:1}a{color:${C.accent}}@media(max-width:820px){main{max-width:420px}.grid{grid-template-columns:1fr}.reference{flex-wrap:wrap}.reference div{min-width:180px}}</style></head>
<body><main><h1>Infected / basic enemy</h1><p>The small purple melee creature. Three directions using the same pixel-art technique as the Sporeback toad.</p><div class="controls"><label>Detail <select id="zoom"><option value="4">4×</option><option value="5">5×</option><option value="3">3×</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Infected purple</option><option value="${C.moss}">Infected moss</option><option value="#756c7c">Light contrast</option></select></label><label><input id="flip" type="checkbox">Face left</label></div><p id="preview-status" role="status">Loading concepts…</p><section class="grid">${specs.map(s => `<canvas width="360" height="568" aria-label="${s.letter}: ${s.title}. ${s.lines.join(' ')}"></canvas>`).join('')}</section><div class="reference"><img src="infected-current.png" alt="Current purple Infected creature"><div><strong>Current basic Infected</strong>The familiar body, boils and fang maw.</div><img src="sporeback-reference.png" alt="Approved Sporeback toad"><div><strong>Approved Sporeback</strong>The reference for clean silhouettes, clustered shading and small dark borders.</div></div><p>Choose A, B or C, or combine the details you like. These are static concepts; animations come after your pick. <a href="infected-options.png">Open the comparison sheet</a>.</p></main>
<script>const C=${JSON.stringify(C)},specs=${JSON.stringify(specs)},subjects=${JSON.stringify(data)};
${text.toString()}
${sprite.toString()}
${card.toString()}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
Promise.all(subjects.map(async subject=>{subject.image=await load(subject.src);})).then(()=>{const canvases=[...document.querySelectorAll('canvas')];const redraw=()=>canvases.forEach((canvas,i)=>card(canvas.getContext('2d'),subjects[i],specs[i],Number(document.querySelector('#zoom').value),document.querySelector('#ground').value,document.querySelector('#flip').checked));document.querySelectorAll('select,input').forEach(control=>control.onchange=redraw);redraw();document.querySelector("#preview-status").textContent="";}).catch(error=>{document.querySelector("#preview-status").textContent="Preview failed: "+error.message;console.error(error);});</script></body></html>`);
  console.log(JSON.stringify({ concepts: subjects.map((s, i) => ({ name: specs[i].title, bounds: s.bounds, gameScale: s.gameScale })), html: path.join(OUT, 'infected-options.html'), image: path.join(OUT, 'infected-options.png') }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
