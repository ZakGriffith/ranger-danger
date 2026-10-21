const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'toad-pixel-concepts');
const C = { page: '#1d1b27', card: '#302b3b', ground: '#3a3146', moss: '#394530', text: '#eee9dc', muted: '#bdb6c5', accent: '#d5bd84' };
const specs = [
  { file: 'toad-bog', draw: 'drawBogToad', letter: 'A', title: 'Bog toad', lines: ['Mossy hide / heavy folded haunches', 'The closest to a natural toad.'] },
  { file: 'toad-spore', draw: 'drawSporeToad', letter: 'B', title: 'Sporeback', lines: ['Plum hide / rust-colored growths', 'A bulky, visibly infected silhouette.'] },
  { file: 'toad-venom', draw: 'drawVenomToad', letter: 'C', title: 'Venom throat', lines: ['Dark hide / pale toxic throat sac', 'The clearest poison-spitting cue.'] },
];
globalThis.document = { createElement: () => createCanvas(1, 1) };

function bounds(image) {
  const pixels = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
  const b = { left: image.width, top: image.height, right: -1, bottom: -1 };
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (pixels[(y * image.width + x) * 4 + 3] === 0) continue;
    b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
    b.top = Math.min(b.top, y); b.bottom = Math.max(b.bottom, y);
  }
  return b;
}

function text(ctx, value, x, y, size = 14, color = C.muted, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}

function sprite(ctx, subject, x, feet, scale, flip = false) {
  const b = subject.bounds;
  const w = b.right - b.left + 1, h = b.bottom - b.top + 1;
  ctx.save(); ctx.translate(x, feet); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#14151b66'; ctx.beginPath(); ctx.ellipse(0, 0, w * scale * 0.43, w * scale * 0.055, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(subject.image, b.left, b.top, w, h, -w / 2, -h, w, h);
  ctx.restore();
}

function card(ctx, subject, spec, zoom = 4, ground = C.ground, flip = false) {
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, 360, 550);
  text(ctx, spec.letter, 18, 34, 24, C.accent, true);
  text(ctx, spec.title, 54, 33, 23, C.text, true);
  spec.lines.forEach((line, i) => text(ctx, line, 18, 62 + i * 21, 14));
  ctx.fillStyle = ground; ctx.fillRect(12, 104, 336, 296);
  sprite(ctx, subject, 180, 353, zoom, flip);
  text(ctx, `${zoom}× detail`, 26, 385, 12);
  ctx.fillStyle = ground; ctx.fillRect(12, 416, 162, 116);
  ctx.fillStyle = C.moss; ctx.fillRect(186, 416, 162, 116);
  sprite(ctx, subject, 93, 495, 1, flip);
  sprite(ctx, subject, 267, 492, subject.gameScale, flip);
  text(ctx, 'Native 64 px', 57, 521, 12);
  text(ctx, 'Game size', 239, 521, 12);
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{
    name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null,
    load: id => id === '\0phaser-stub' ? 'export default {};' : null,
  }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const toad = await load('/src/assets/art/toad.ts');
  const bear = await load('/src/assets/art/bear.ts');
  const enemySource = fs.readFileSync(path.join(ROOT, 'src/entities/Enemy.ts'), 'utf8');
  const gameScale = Number(enemySource.match(/applyEntityVisual\(this, 'toad', 'move', ([0-9.]+)/)[1]);
  fs.mkdirSync(OUT, { recursive: true });
  const subjects = [];
  for (const spec of specs) {
    const mod = await load(`/scripts/sprite-tries/${spec.file}.ts`);
    const image = hd.makeHD(64, (put, raw) => mod[spec.draw]((x, y, color) => {
      if (color !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x >= 63 || y < 1 || y >= 63)) {
        throw Error(`${spec.letter}: pixel outside padded canvas: ${x}, ${y}`);
      }
      put(x, y, color);
    }, raw), { outline: false });
    const b = bounds(image);
    fs.writeFileSync(path.join(OUT, spec.file + '.png'), image.toBuffer('image/png'));
    subjects.push({ image, bounds: b, gameScale });
  }
  const currentImage = hd.makeHD(64, toad.drawToad('idle0'), { outline: false });
  const current = { image: currentImage, bounds: bounds(currentImage), gameScale };
  const referenceImage = hd.makeHD(64, bear.drawBear('atk0'));
  const reference = { image: referenceImage, bounds: bounds(referenceImage) };
  fs.writeFileSync(path.join(OUT, 'toad-current.png'), currentImage.toBuffer('image/png'));
  fs.writeFileSync(path.join(OUT, 'bear-reference.png'), referenceImage.toBuffer('image/png'));

  const board = createCanvas(1168, 824), ctx = board.getContext('2d');
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, board.width, board.height);
  text(ctx, 'INFECTED / BLIGHTED TOAD', 24, 44, 29, C.text, true);
  text(ctx, 'Three static designs · hand-authored 64 × 64 pixel art · subtle dark borders', 25, 75, 16);
  subjects.forEach((subject, i) => { ctx.save(); ctx.translate(24 + i * 384, 100); card(ctx, subject, specs[i]); ctx.restore(); });
  ctx.fillStyle = C.card; ctx.fillRect(24, 672, 1120, 126);
  sprite(ctx, current, 99, 770, 1.6);
  text(ctx, 'Current toad', 169, 707, 17, C.text, true);
  text(ctx, 'The existing toxic-glob enemy', 169, 735, 14);
  text(ctx, 'Keeps its role and game size.', 169, 760, 14);
  sprite(ctx, reference, 632, 775, 1.6);
  text(ctx, 'Approved bear / style reference', 716, 707, 17, C.text, true);
  text(ctx, 'Clear silhouettes and clustered shading.', 716, 735, 14);
  text(ctx, 'Static concepts — animation comes next.', 716, 760, 14);
  fs.writeFileSync(path.join(OUT, 'toad-options.png'), board.toBuffer('image/png'));

  const data = subjects.map(({ image, ...subject }) => ({ ...subject, src: image.toDataURL() }));
  fs.writeFileSync(path.join(OUT, 'toad-options.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Infected toads — pixel art options</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1216px;margin:auto;padding:24px}h1{font-size:29px;margin:0 0 10px}p{color:${C.muted};line-height:1.5}.controls{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:20px 0}label{display:flex;gap:8px;align-items:center}select{background:${C.card};color:${C.text};font:inherit;border:1px solid #655971;border-radius:5px;padding:7px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}canvas{width:100%;height:auto;display:block;image-rendering:pixelated;border-radius:6px}.reference{display:flex;gap:24px;align-items:center;margin:22px 0;padding:16px;background:${C.card};border-radius:6px}.reference img{width:96px;height:96px;image-rendering:pixelated}.reference strong{display:block;margin-bottom:8px}a{color:${C.accent}}@media(max-width:820px){main{max-width:420px}.grid{grid-template-columns:1fr}.reference{flex-wrap:wrap}}</style></head>
<body><main><h1>Infected / blighted toad</h1><p>Three pixel-art directions for the enemy that lobs toxic globs. Each uses a small dark border and the same drawing technique as the Forest creatures.</p><div class="controls"><label>Detail <select id="zoom"><option value="4">4×</option><option value="5">5×</option><option value="3">3×</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Infected purple</option><option value="${C.moss}">Infected moss</option><option value="#756c7c">Light contrast</option></select></label><label><input id="flip" type="checkbox">Face left</label></div><section class="grid">${specs.map(s => `<canvas width="360" height="550" aria-label="${s.letter}: ${s.title}. ${s.lines.join(' ')}"></canvas>`).join('')}</section><div class="reference"><img src="toad-current.png" alt="Current blighted toad"><div><strong>Current toad</strong>The existing toxic-glob enemy.<br>These designs keep its role and game size.</div><img src="bear-reference.png" alt="Approved shaggy bear"><div><strong>Approved bear / style reference</strong>Clear silhouettes and clustered shading.</div></div><p>Choose A, B, or C, or combine details you like. These are static concepts; animations have not started. <a href="toad-options.png">Open the comparison sheet</a>.</p></main>
<script>const C=${JSON.stringify(C)},specs=${JSON.stringify(specs)},subjects=${JSON.stringify(data)};
${text.toString()}
${sprite.toString()}
${card.toString()}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
Promise.all(subjects.map(async subject=>{subject.image=await load(subject.src);})).then(()=>{const canvases=[...document.querySelectorAll('canvas')];const redraw=()=>canvases.forEach((canvas,i)=>card(canvas.getContext('2d'),subjects[i],specs[i],Number(document.querySelector('#zoom').value),document.querySelector('#ground').value,document.querySelector('#flip').checked));document.querySelectorAll('select,input').forEach(control=>control.onchange=redraw);redraw();});</script></body></html>`);
  console.log('All three concepts fit the 64px canvas.');
  console.log(path.join(OUT, 'toad-options.html'));
  console.log(path.join(OUT, 'toad-options.png'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
