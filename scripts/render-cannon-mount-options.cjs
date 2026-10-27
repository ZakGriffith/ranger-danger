const { createCanvas, loadImage } = require('canvas');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'cannon-mount-options');
const CANNON_OUT = path.join(__dirname, 'out', 'cannon-options');
const SIZE = 128, COUNT = 360, COLS = 20, PIVOT_Y = -16;
const COLORS = { page: '#171d22', panel: '#242d32', text: '#ece7d9', muted: '#b2bebd', accent: '#e1bc79', ground: '#3b4a39' };
globalThis.document = { createElement: () => createCanvas(1, 1) };

function text(ctx, value, x, y, size = 14, color = COLORS.muted, bold = false) {
  ctx.font = `${bold ? '600 ' : ''}${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}
function ground(ctx, width, height) {
  ctx.fillStyle = COLORS.ground; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff05';
  for (let i = 0; i < 75; i++) ctx.fillRect((i * 71 + 23) % width, (i * 53 + 17) % height, 3 + i % 5, 1);
}
function tower(ctx, base, mount, atlas, angle, x, y, zoom, showCannon = true, pivotOffset = PIVOT_Y) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const scale = zoom * .5, py = y + pivotOffset * zoom;
  ctx.drawImage(base, Math.round(x - base.width * scale / 2), Math.round(y - base.height * scale / 2), base.width * scale, base.height * scale);
  ctx.drawImage(mount, x - 64 * scale, py - 64 * scale, 128 * scale, 128 * scale);
  if (showCannon) {
    const frame = Math.round(angle * COUNT / 360) % COUNT;
    ctx.drawImage(atlas, frame % COLS * SIZE, Math.floor(frame / COLS) * SIZE, SIZE, SIZE, x - 64 * scale, py - 64 * scale, 128 * scale, 128 * scale);
  }
  ctx.restore();
}
function writePng(name, canvas) { fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png')); }

async function main() {
  execFileSync(process.execPath, [path.join(__dirname, 'render-cannon-options.cjs')], { cwd: ROOT, stdio: 'pipe' });
  fs.mkdirSync(OUT, { recursive: true });
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error', plugins: [{ name: 'phaser-stub', resolveId: id => id === 'phaser' ? '\0phaser-stub' : null, load: id => id === '\0phaser-stub' ? 'export default {};' : null }] };
  const load = async file => (await runnerImport(file, config)).module;
  const hd = await load('/src/assets/art/hd.ts');
  const art = await load('/scripts/sprite-tries/cannon-mount-options.ts');
  const cannonArt = await load('/scripts/sprite-tries/cannon-options.ts');
  if (art.CANNON_MOUNT_SIZE !== SIZE) throw Error('Unexpected mount canvas size');
  for (const name of ['base-0.png', 'base-1.png', 'base-2.png', 'cannon-A.png', 'cannon-B.png', 'cannon-C.png']) {
    fs.copyFileSync(path.join(CANNON_OUT, name), path.join(OUT, name));
  }
  fs.copyFileSync(path.join(CANNON_OUT, 'mount.png'), path.join(OUT, 'previous-mount.png'));
  const base = await loadImage(path.join(OUT, 'base-0.png'));
  const atlas = await loadImage(path.join(OUT, 'cannon-A.png'));
  const previous = await loadImage(path.join(OUT, 'previous-mount.png'));
  const mounts = [], checks = [];
  for (const option of art.CANNON_MOUNT_OPTIONS) {
    const mount = hd.makeHD(SIZE, (put, raw) => art.drawCannonMountOption(option.id)((x, y, paint) => {
      if (paint !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x >= SIZE - 1 || y < 1 || y >= SIZE - 1)) throw Error(`${option.id}: invalid pixel ${x},${y}`);
      put(x, y, paint);
    }, raw), { outline: false });
    const data = mount.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
    const bounds = [SIZE, SIZE, -1, -1]; let count = 0;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!data[(y * SIZE + x) * 4 + 3]) continue;
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y); count++;
    }
    if (count < 400) throw Error(`${option.id}: empty mount`);
    checks.push({ id: option.id, bounds, pixels: count }); mounts.push(mount); writePng(`mount-${option.id}.png`, mount);
  }
  const board = createCanvas(1200, 884), ctx = board.getContext('2d');
  ctx.fillStyle = COLORS.page; ctx.fillRect(0, 0, board.width, board.height);
  text(ctx, 'CANNON / ROUND SWIVEL MOUNTS', 28, 44, 28, COLORS.text, true);
  text(ctx, 'Low, stationary platforms. The same darker cannon turns above each one.', 29, 76, 16);
  art.CANNON_MOUNT_OPTIONS.forEach((option, index) => {
    const x = 24 + index * 392;
    ctx.fillStyle = COLORS.panel; ctx.fillRect(x, 104, 368, 648);
    text(ctx, option.id, x + 16, 144, 26, COLORS.accent, true);
    text(ctx, option.name, x + 50, 143, 20, COLORS.text, true);
    const panel = createCanvas(368, 330), pc = panel.getContext('2d'); ground(pc, 368, 330);
    tower(pc, base, mounts[index], atlas, 45, 184, 190, 4);
    text(pc, 'Mounted · 4× game size', 14, 26, 12); ctx.drawImage(panel, x, 162);
    text(ctx, 'THE PLATFORM', x + 16, 520, 11, COLORS.accent, true);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mounts[index], x + 110 - 192, 586 - 192, 384, 384);
    text(ctx, '6× detail', x + 81, 666, 12);
    tower(ctx, base, mounts[index], atlas, 45, x + 286, 592, 1);
    text(ctx, 'Game size', x + 254, 666, 12);
    text(ctx, 'Switch cannons and hide the top in the preview', x + 16, 726, 12);
  });
  text(ctx, 'PREVIOUS MOUNT', 28, 792, 12, COLORS.accent, true);
  ctx.drawImage(previous, 25, 770, 128, 128);
  text(ctx, 'A continuous circular rim makes the swivel visible underneath the cannon.', 174, 809, 16, COLORS.text);
  text(ctx, 'Mounts stay fixed while the barrel turns through 360°.', 174, 838, 14);
  writePng('cannon-mount-options.png', board);
  const combinations = createCanvas(1136, 770), cc = combinations.getContext('2d');
  cc.fillStyle = COLORS.page; cc.fillRect(0, 0, combinations.width, combinations.height);
  text(cc, 'ROUND MOUNTS / ALL CANNON SHAPES', 24, 36, 25, COLORS.text, true);
  const atlases = await Promise.all(['A', 'B', 'C'].map(id => loadImage(path.join(OUT, `cannon-${id}.png`))));
  for (let row = 0; row < 3; row++) {
    text(cc, `${art.CANNON_MOUNT_OPTIONS[row].id} · ${art.CANNON_MOUNT_OPTIONS[row].name}`, 24, 75 + row * 226, 18, COLORS.accent, true);
    for (let col = 0; col < 6; col++) {
      const panel = createCanvas(176, 180), p = panel.getContext('2d'); ground(p, 176, 180);
      tower(p, base, mounts[row], atlases[Math.floor(col / 2)], col % 2 ? 270 : 45, 88, 102, 2);
      text(p, `${['A', 'B', 'C'][Math.floor(col / 2)]} · ${col % 2 ? 'rear' : 'front'}`, 12, 20, 12);
      cc.drawImage(panel, 24 + col * 182, 88 + row * 226);
    }
  }
  writePng('mount-combinations.png', combinations);
  fs.writeFileSync(path.join(OUT, 'mount-checks.json'), JSON.stringify({ size: SIZE, pivotOffset: PIVOT_Y, mounts: checks }, null, 2));
  writeHtml(art.CANNON_MOUNT_OPTIONS, cannonArt.CANNON_OPTIONS);
  console.log(JSON.stringify({ preview: path.join(OUT, 'cannon-mount-options.html'), checks }, null, 2));
}

function writeHtml(options, cannons) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cannon · round swivel mounts</title><style>
  :root{color-scheme:dark;font-family:Inter,Segoe UI,sans-serif;color:#ece7d9;background:#171d22}*{box-sizing:border-box}body{margin:0;padding:26px;max-width:1280px;margin-inline:auto}h1{font-size:30px;margin:8px 0 9px;letter-spacing:-.7px}p{line-height:1.5;color:#b2bebd;margin:0}.eyebrow{color:#e1bc79;font-size:12px;letter-spacing:2px;font-weight:700}.controls{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:17px 0 20px}button,select{background:#303b41;border:1px solid #56635f;color:#f3eddf;padding:10px 12px;border-radius:7px;font:inherit;font-size:13px;cursor:pointer}button:hover{background:#425049}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #e1bc79;outline-offset:3px}label{display:flex;align-items:center;gap:8px;font-size:13px;color:#b2bebd}input{accent-color:#e1bc79}input[type=range]{width:150px}output{font-variant-numeric:tabular-nums;min-width:36px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#242d32;border:1px solid #38443f;border-radius:12px;overflow:hidden}.card header{padding:18px 16px 14px;min-height:128px}h2{font-size:20px;font-weight:600;margin:0 0 9px;display:flex;gap:12px;align-items:center}h2 b{color:#e1bc79;font-size:26px}.card p{font-size:13px}.card canvas{width:100%;height:330px;display:block;image-rendering:pixelated}.card canvas.sizes{height:156px}.caption{padding:12px 16px 5px;color:#e1bc79;font-size:11px;letter-spacing:1.2px}.reference{margin-top:22px;border:1px solid #38443f;border-radius:12px;background:#242d32;display:flex;gap:22px;align-items:center;overflow:hidden}.reference canvas{width:210px;height:172px;image-rendering:pixelated;flex-shrink:0}.reference h3{margin:0 0 9px;font-size:17px}.reference .copy{padding:18px 20px 18px 0}.reference p{font-size:14px;max-width:760px}details{margin-top:20px;border-top:1px solid #38443f;padding-top:16px}summary{cursor:pointer;color:#e1bc79;font-size:14px}details img{width:100%;margin-top:15px;image-rendering:pixelated}footer{padding:18px 0;color:#91a19d;font-size:12px}#status{font-size:12px;margin-top:7px;min-height:18px}@media(max-width:900px){body{padding:15px}.grid{grid-template-columns:1fr}.card{max-width:520px;margin:auto;width:100%}.card header{min-height:0}.reference{flex-direction:column;gap:0;align-items:flex-start}.reference .copy{padding:18px}}
  </style></head><body><header><div class="eyebrow">TOWER ART / SWIVEL MOUNTS</div><h1>A round base beneath the cannon.</h1><p>Three low platforms, fixed to the tower. The same cannon rotates above each one.</p></header>
  <div class="controls"><button id="play" type="button">Pause rotation</button><label>Angle <input id="angle" aria-label="Rotation angle" type="range" min="0" max="359" value="45"><output id="degrees">45°</output></label><label>Cannon <select id="cannon">${cannons.map((c,i)=>`<option value="${i}">${c.id} · ${c.name}</option>`).join('')}</select></label><label>Stone base <select id="tier"><option value="0">Level 1</option><option value="1">Level 2</option><option value="2">Level 3</option></select></label><label><input type="checkbox" id="show" checked> Show cannon</label></div>
  <main class="grid">${options.map((o,i)=>`<article class="card"><header><h2><b>${o.id}</b>${o.name}</h2><p>${o.description}</p></header><canvas id="main${i}" width="368" height="330" aria-label="${o.name} underneath a rotating cannon"></canvas><div class="caption">GAME SIZE / PLATFORM DETAIL</div><canvas id="sizes${i}" class="sizes" width="368" height="156" aria-label="${o.name} at game size and isolated mount detail"></canvas></article>`).join('')}</main>
  <section class="reference"><canvas id="reference" width="210" height="172" aria-label="Previous block-shaped mount"></canvas><div class="copy"><h3>Previous mount, for comparison</h3><p>The new platforms have a continuous round rim and a shallow profile. Hide the cannon to compare the surface, or switch between A, B, and C to check the fit.</p><p id="status">Loading the mount study…</p></div></section><details><summary>Compare all cannon shapes, front and rear</summary><img src="mount-combinations.png" alt="Three mounting platforms paired with each cannon from front and rear"></details><footer>Concept preview only · Choose a mount before changing the game.</footer>
  <script type="module">
  const specs=${JSON.stringify(options)},COUNT=${COUNT},COLS=${COLS},SIZE=${SIZE},PIVOT_Y=${PIVOT_Y},COLORS=${JSON.stringify(COLORS)};
  const load=name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load '+name));image.src=name;});
  const [base0,base1,base2,oldMount,atlasA,atlasB,atlasC,...mounts]=await Promise.all(['base-0.png','base-1.png','base-2.png','previous-mount.png','cannon-A.png','cannon-B.png','cannon-C.png',...specs.map(o=>'mount-'+o.id+'.png')].map(load));
  const bases=[base0,base1,base2],atlases=[atlasA,atlasB,atlasC],main=specs.map((_,i)=>document.getElementById('main'+i).getContext('2d')),sizes=specs.map((_,i)=>document.getElementById('sizes'+i).getContext('2d')),ref=document.querySelector('#reference').getContext('2d');
  const text=${text.toString()},ground=${ground.toString()},tower=${tower.toString()};
  let angle=45,playing=true,tier=0,cannon=0,showCannon=true,last=performance.now();
  const play=document.querySelector('#play'),slider=document.querySelector('#angle'),degrees=document.querySelector('#degrees');
  function render(){main.forEach((ctx,i)=>{ground(ctx,ctx.canvas.width,330);tower(ctx,bases[tier],mounts[i],atlases[cannon],angle,Math.round(ctx.canvas.width/2),190,4,showCannon);text(ctx,showCannon?'Mounted · 4× game size':'Platform only · 4× game size',14,26,12);const c=sizes[i],left=Math.round(c.canvas.width*.23),right=Math.round(c.canvas.width*.73);c.fillStyle=COLORS.panel;c.fillRect(0,0,c.canvas.width,156);tower(c,bases[tier],mounts[i],atlases[cannon],angle,left,79,1,showCannon);c.imageSmoothingEnabled=false;c.drawImage(mounts[i],right-128,72-128,256,256);text(c,'Game size',left-28,143,12);text(c,'Mount · 4×',right-29,143,12);});ground(ref,210,172);tower(ref,bases[tier],oldMount,atlases[cannon],angle,105,100,2,showCannon,-20);text(ref,'Previous mount · 2×',14,161,11);slider.value=String(Math.floor(angle));degrees.textContent=Math.floor(angle)+'°';}
  function setPlaying(value){playing=value;play.textContent=playing?'Pause rotation':'Resume rotation';last=performance.now();}
  play.addEventListener('click',()=>setPlaying(!playing));slider.addEventListener('input',()=>{setPlaying(false);angle=Number(slider.value);render();});document.querySelector('#cannon').addEventListener('change',e=>{cannon=Number(e.target.value);render();});document.querySelector('#tier').addEventListener('change',e=>{tier=Number(e.target.value);render();});document.querySelector('#show').addEventListener('change',e=>{showCannon=e.target.checked;render();});
  const resize=new ResizeObserver(()=>{for(const ctx of [...main,...sizes]){const width=Math.round(ctx.canvas.getBoundingClientRect().width);if(ctx.canvas.width!==width)ctx.canvas.width=width;}render();});for(const ctx of [...main,...sizes])resize.observe(ctx.canvas);
  let previousFrame=-1;function tick(now){const dt=Math.min(now-last,100);last=now;if(playing){angle=(angle+dt*.024)%360;const frame=Math.round(angle)%COUNT;if(frame!==previousFrame){render();previousFrame=frame;}}requestAnimationFrame(tick);}render();document.querySelector('#status').textContent='Ready · The mounting plates stay fixed throughout the full turn.';requestAnimationFrame(tick);
  </script></body></html>`;
  fs.writeFileSync(path.join(OUT, 'cannon-mount-options.html'), html);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
