const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'cannon-options');
const SIZE = 128, COUNT = 360, COLS = 20;
const COLORS = { page: '#171d22', panel: '#242d32', text: '#ece7d9', muted: '#b2bebd', accent: '#e1bc79', grass: '#3b4a39', stone: '#45474b' };
globalThis.document = { createElement: () => createCanvas(1, 1) };

function writePng(name, canvas) { fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png')); }
function text(ctx, value, x, y, size = 14, color = COLORS.muted, bold = false) {
  ctx.font = `${bold ? '600 ' : ''}${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}
function ground(ctx, width, height, color = COLORS.grass) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff05';
  for (let i = 0; i < 110; i++) ctx.fillRect((i * 71 + 23) % width, (i * 53 + 17) % height, 3 + i % 5, 1);
}
function tower(ctx, base, mount, top, x, y, zoom, angle = null) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const scale = zoom * .5;
  ctx.drawImage(base, Math.round(x - base.width * scale / 2), Math.round(y - base.height * scale / 2), base.width * scale, base.height * scale);
  const pivotY = y - 20 * zoom;
  ctx.drawImage(mount, x - 64 * scale, pivotY - 64 * scale, 128 * scale, 128 * scale);
  ctx.translate(x, pivotY);
  if (angle !== null) ctx.rotate(angle);
  ctx.drawImage(top, -64 * scale, -64 * scale, 128 * scale, 128 * scale);
  ctx.restore();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const legacy = await load('/src/assets/art/canvas.ts');
  const towers = await load('/scripts/sprite-tries/cannon-legacy.ts');
  const art = await load('/scripts/sprite-tries/cannon-options.ts');
  if (art.CANNON_SIZE !== SIZE) throw Error('Unexpected cannon canvas size');
  const mount = legacy.makeCanvas(64, towers.drawCannonMount());
  const current = legacy.makeCanvas(64, towers.drawCannonTop(false));
  writePng('mount.png', mount); writePng('current.png', current);
  const bases = [];
  for (let tier = 0; tier < 3; tier++) {
    const source = await loadImage(path.join(ROOT, 'src/assets/sprites', `cannon_base${tier ? '_' + tier : ''}.png`));
    const canvas = createCanvas(source.width, source.height), ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);
    if (tier === 0) {
      const id = ctx.getImageData(0, 0, source.width, source.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 2] > 180 && d[i + 1] < 100) d[i + 3] = 0;
      ctx.putImageData(id, 0, 0);
    }
    bases.push(canvas); writePng(`base-${tier}.png`, canvas);
  }
  const frames = [], checks = [];
  for (const option of art.CANNON_OPTIONS) {
    const atlas = createCanvas(COLS * SIZE, Math.ceil(COUNT / COLS) * SIZE), ac = atlas.getContext('2d');
    const optionFrames = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = i * Math.PI * 2 / COUNT;
      const frame = hd.makeHD(SIZE, (put, raw) => art.drawCannonOption(option.id, angle)((x, y, paint) => {
        if (paint !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x >= SIZE - 1 || y < 1 || y >= SIZE - 1)) throw Error(`${option.id}/${i}: out-of-bounds pixel ${x},${y}`);
        put(x, y, paint);
      }, raw), { outline: false });
      const rgba = frame.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
      const bounds = [SIZE, SIZE, -1, -1]; let pixels = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!rgba[(y * SIZE + x) * 4 + 3]) continue;
        bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
        bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y); pixels++;
      }
      if (pixels < 100) throw Error(`${option.id}/${i}: empty silhouette`);
      checks.push({ option: option.id, angle: i * 360 / COUNT, bounds, pixels });
      optionFrames.push(frame); ac.drawImage(frame, i % COLS * SIZE, Math.floor(i / COLS) * SIZE);
    }
    const closed = hd.makeHD(SIZE, art.drawCannonOption(option.id, Math.PI * 2), { outline: false });
    const firstPixels = optionFrames[0].getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
    const lastPixels = closed.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
    if (!Buffer.from(firstPixels).equals(Buffer.from(lastPixels))) throw Error(`${option.id}: 360-degree seam differs from 0 degrees`);
    frames.push(optionFrames); writePng(`cannon-${option.id}.png`, atlas);
  }
  const board = createCanvas(1200, 864), ctx = board.getContext('2d');
  ctx.fillStyle = COLORS.page; ctx.fillRect(0, 0, board.width, board.height);
  text(ctx, 'CANNON / THREE DIRECTIONS', 28, 44, 28, COLORS.text, true);
  text(ctx, 'Pixel-art cannon tops, shown on the existing tower. Every option turns through a full 360°.', 29, 76, 16);
  const angleIndex = 44;
  art.CANNON_OPTIONS.forEach((option, index) => {
    const x = 24 + index * 392;
    ctx.fillStyle = COLORS.panel; ctx.fillRect(x, 106, 368, 590);
    text(ctx, option.id, x + 16, 144, 26, COLORS.accent, true);
    text(ctx, option.name, x + 52, 143, 20, COLORS.text, true);
    const panel = createCanvas(368, 340), pc = panel.getContext('2d'); ground(pc, 368, 340);
    tower(pc, bases[0], mount, frames[index][angleIndex], 184, 195, 4);
    text(pc, '4× game size', 14, 26, 12); ctx.drawImage(panel, x, 163);
    text(ctx, 'AT GAME SIZE', x + 16, 529, 11, COLORS.accent, true);
    tower(ctx, bases[0], mount, frames[index][angleIndex], x + 72, 591, 1);
    tower(ctx, bases[0], mount, frames[index][0], x + 158, 591, 1);
    tower(ctx, bases[0], mount, frames[index][COUNT / 4], x + 244, 591, 1);
    text(ctx, 'Full turn + tower tiers in the interactive preview', x + 16, 670, 12);
  });
  text(ctx, 'EIGHT DIRECTIONS', 28, 730, 12, COLORS.accent, true);
  frames.forEach((optionFrames, row) => {
    text(ctx, art.CANNON_OPTIONS[row].id, 28, 767 + row * 33, 16, COLORS.text, true);
    for (let dir = 0; dir < 8; dir++) {
      const frame = optionFrames[Math.round(dir * COUNT / 8) % COUNT];
      ctx.imageSmoothingEnabled = false; ctx.drawImage(frame, 74 + dir * 137, 734 + row * 33, 64, 64);
    }
  });
  writePng('cannon-options.png', board);
  const directions = createCanvas(1232, 660), dc = directions.getContext('2d');
  dc.fillStyle = COLORS.page; dc.fillRect(0, 0, directions.width, directions.height);
  text(dc, 'CANNON / FULL TURN', 22, 35, 25, COLORS.text, true);
  art.CANNON_OPTIONS.forEach((option, row) => {
    text(dc, `${option.id} · ${option.name}`, 22, 70 + row * 196, 18, COLORS.accent, true);
    for (let dir = 0; dir < 8; dir++) {
      const x = 18 + dir * 152, y = 81 + row * 196;
      const p = createCanvas(144, 160), c = p.getContext('2d'); ground(c, 144, 160);
      tower(c, bases[0], mount, frames[row][Math.round(dir * COUNT / 8) % COUNT], 72, 91, 2);
      text(c, `${dir * 45}°`, 9, 20, 12); dc.drawImage(p, x, y);
    }
  });
  writePng('cannon-directions.png', directions);
  fs.writeFileSync(path.join(OUT, 'rotation-checks.json'), JSON.stringify({ size: SIZE, framesPerOption: COUNT, seam: 'exact', checks }, null, 2));
  writeHtml(art.CANNON_OPTIONS);
  console.log(JSON.stringify({ preview: path.join(OUT, 'cannon-options.html'), frames: checks.length, seam: 'exact', board: path.join(OUT, 'cannon-options.png') }, null, 2));
}

function writeHtml(options) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cannon · 360° options</title><style>
  :root{color-scheme:dark;font-family:Inter,Segoe UI,sans-serif;color:#ece7d9;background:#171d22}*{box-sizing:border-box}body{margin:0;padding:26px;max-width:1280px;margin-inline:auto}h1{font-size:30px;margin:8px 0 9px;letter-spacing:-.7px}p{line-height:1.5;color:#b2bebd;margin:0}header .eyebrow{color:#e1bc79;font-size:12px;letter-spacing:2px;font-weight:700}.controls{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:17px 0 20px}button,select{background:#303b41;border:1px solid #56635f;color:#f3eddf;padding:10px 14px;border-radius:7px;font:inherit;font-size:13px;cursor:pointer}button:hover{background:#425049}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #e1bc79;outline-offset:3px}label{display:flex;align-items:center;gap:9px;font-size:13px;color:#b2bebd}input[type=range]{accent-color:#e1bc79;width:190px}output{font-variant-numeric:tabular-nums;min-width:38px;color:#ece7d9}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#242d32;border:1px solid #38443f;border-radius:12px;overflow:hidden}.card header{padding:18px 16px 14px;min-height:128px}h2{font-size:20px;font-weight:600;margin:0 0 9px;display:flex;gap:12px;align-items:center}h2 b{color:#e1bc79;font-size:26px}.card p{font-size:13px;max-width:310px}.card canvas{width:100%;display:block;image-rendering:pixelated}.caption{padding:12px 16px 5px;color:#e1bc79;font-size:11px;letter-spacing:1.3px}.sizes{background:#21292e}.reference{margin-top:22px;border:1px solid #38443f;border-radius:12px;background:#242d32;display:flex;gap:22px;align-items:center;overflow:hidden}.reference canvas{width:240px;height:180px;image-rendering:pixelated;flex-shrink:0}.reference h3{margin:0 0 9px;font-size:17px}.reference p{max-width:720px;font-size:14px}.reference .copy{padding:18px 20px 18px 0}details{margin-top:20px;border-top:1px solid #38443f;padding-top:16px}summary{cursor:pointer;color:#e1bc79;font-size:14px}details img{width:100%;margin-top:15px;image-rendering:pixelated}footer{padding:18px 0;color:#91a19d;font-size:12px}#status{font-size:12px;margin-top:4px;min-height:18px}@media(max-width:900px){body{padding:15px}.grid{grid-template-columns:1fr}.card header{min-height:0}.card{max-width:520px;margin:auto;width:100%}.reference{align-items:flex-start;flex-direction:column;gap:0}.reference .copy{padding:18px}.controls{gap:9px}}
  .card canvas{height:340px}.card canvas.sizes{height:162px}</style></head><body><header><div class="eyebrow">TOWER ART / DESIGN STUDY</div><h1>A new cannon, from every angle.</h1><p>Three pixel-art directions on the existing stone tower. Pause the turn or drag the angle to inspect any view.</p></header>
  <div class="controls"><button id="play" type="button">Pause rotation</button><label>Angle <input id="angle" aria-label="Rotation angle" type="range" min="0" max="359" value="44"><output id="degrees">44°</output></label><button id="step" type="button">Step 45°</button><label>Stone base <select id="tier"><option value="0">Level 1</option><option value="1">Level 2</option><option value="2">Level 3</option></select></label><label>Ground <select id="ground"><option value="#3b4a39">Forest green</option><option value="#45474b">Slate gray</option><option value="#554638">Warm earth</option></select></label></div>
  <main class="grid">${options.map((o,i)=>`<article class="card"><header><h2><b>${o.id}</b>${o.name}</h2><p>${o.description}</p></header><canvas id="main${i}" width="368" height="340" aria-label="${o.name}, rotating on the tower"></canvas><div class="caption">GAME SIZE / 2× GAME SIZE</div><canvas class="sizes" id="sizes${i}" width="368" height="162" aria-label="${o.name} at gameplay scale"></canvas></article>`).join('')}</main>
  <section class="reference"><canvas id="reference" width="240" height="180" aria-label="Current cannon reference"></canvas><div class="copy"><h3>Current cannon, for comparison</h3><p>The new options keep a fixed mount and turn around the same tower pivot. Their muzzle, rear cap, and shading change with the view so they stay readable throughout the turn.</p><p id="status">Loading the rotation study…</p></div></section><details><summary>Compare eight directions side by side</summary><img src="cannon-directions.png" alt="All three cannon concepts on the tower facing eight directions"></details><footer>Concept preview only · Choose a design before changing the game.</footer>
  <script type="module">
  const specs=${JSON.stringify(options)},COUNT=${COUNT},COLS=${COLS},SIZE=${SIZE};
  const load=name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load '+name));image.src=name;});
  const [base0,base1,base2,mount,current,...atlases]=await Promise.all(['base-0.png','base-1.png','base-2.png','mount.png','current.png',...specs.map(o=>'cannon-'+o.id+'.png')].map(load));
  const bases=[base0,base1,base2],main=specs.map((_,i)=>document.getElementById('main'+i).getContext('2d')),sizes=specs.map((_,i)=>document.getElementById('sizes'+i).getContext('2d')),reference=document.querySelector('#reference').getContext('2d');
  let angle=44,playing=true,tier=0,groundColor='#3b4a39',last=performance.now();
  const play=document.querySelector('#play'),slider=document.querySelector('#angle'),degrees=document.querySelector('#degrees');
  const text=${text.toString()},ground=${ground.toString()},COLORS=${JSON.stringify(COLORS)};
  function draw(ctx,option,x,y,zoom){ctx.save();ctx.imageSmoothingEnabled=false;const s=zoom*.5,base=bases[tier],py=y-20*zoom;ctx.drawImage(base,Math.round(x-base.width*s/2),Math.round(y-base.height*s/2),base.width*s,base.height*s);ctx.drawImage(mount,x-64*s,py-64*s,128*s,128*s);if(option<0){ctx.translate(x,py);ctx.rotate(angle*Math.PI/180);ctx.drawImage(current,-64*s,-64*s,128*s,128*s);}else{const f=Math.round(angle/360*COUNT)%COUNT;ctx.drawImage(atlases[option],f%COLS*SIZE,Math.floor(f/COLS)*SIZE,SIZE,SIZE,x-64*s,py-64*s,128*s,128*s);}ctx.restore();}
  function render(){main.forEach((ctx,i)=>{ground(ctx,ctx.canvas.width,340,groundColor);draw(ctx,i,Math.round(ctx.canvas.width/2),195,4);text(ctx,'4× game size',14,26,12);const c=sizes[i];c.fillStyle='#21292e';c.fillRect(0,0,c.canvas.width,162);const left=Math.round(c.canvas.width*.23),right=Math.round(c.canvas.width*.72);draw(c,i,left,78,1);draw(c,i,right,90,2);text(c,'1×',left-8,144,12);text(c,'2×',right-8,154,12);});ground(reference,240,180,groundColor);draw(reference,-1,120,102,2);text(reference,'Current · 2× game size',14,168,11);slider.value=String(Math.floor(angle));degrees.textContent=Math.floor(angle)+'°';}
  function setPlaying(value){playing=value;play.textContent=playing?'Pause rotation':'Resume rotation';last=performance.now();}
  play.addEventListener('click',()=>setPlaying(!playing));slider.addEventListener('input',()=>{setPlaying(false);angle=Number(slider.value);render();});document.querySelector('#step').addEventListener('click',()=>{setPlaying(false);angle=(Math.floor(angle/45)*45+45)%360;render();});document.querySelector('#tier').addEventListener('change',e=>{tier=Number(e.target.value);render();});document.querySelector('#ground').addEventListener('change',e=>{groundColor=e.target.value;render();});
  const resize=new ResizeObserver(()=>{for(const ctx of [...main,...sizes]){const width=Math.round(ctx.canvas.getBoundingClientRect().width);if(ctx.canvas.width!==width)ctx.canvas.width=width;}render();});for(const ctx of [...main,...sizes])resize.observe(ctx.canvas);
  let previousFrame=-1;function tick(now){const dt=Math.min(now-last,100);last=now;if(playing){angle=(angle+dt*.024)%360;const f=Math.round(angle*COUNT/360)%COUNT;if(f!==previousFrame){render();previousFrame=f;}}requestAnimationFrame(tick);}render();document.querySelector('#status').textContent='Ready · 360° rotation · A, B, and C use the same tower scale.';requestAnimationFrame(tick);
  </script></body></html>`;
  fs.writeFileSync(path.join(OUT, 'cannon-options.html'), html);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
