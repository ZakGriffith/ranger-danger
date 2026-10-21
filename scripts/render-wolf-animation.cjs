const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw Error(`Unexpected element: ${tag}`);
    return createCanvas(1, 1);
  },
};

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'wolf-animation');
const SIZE = 64;
const GAME_SCALE = 0.54;
const C = {
  background: '#17241e', panel: '#25382c', field: '#405c38',
  title: '#f0e9d6', text: '#b5c1ab', accent: '#d5bd80',
};

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

function fill(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function text(ctx, value, x, y, size = 14, color = C.text, bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillText(value, x, y);
}

function sprite(ctx, frame, x, y, scale) {
  ctx.drawImage(frame, x, y, SIZE * scale, SIZE * scale);
}

function checkedFrame(hd, draw, name) {
  const frame = hd.makeHD(SIZE, (put, raw) => draw(
    (x, y, paint) => {
      if (paint !== null && (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= SIZE || y >= SIZE)) {
        throw Error(`${name}: painted pixel (${x}, ${y}) is outside the 64 px canvas`);
      }
      put(x, y, paint);
    },
    (x, y, color, alpha = 1) => {
      if (alpha > 0 && (Math.floor(x) < 0 || Math.floor(y) < 0 || Math.floor(x) >= SIZE || Math.floor(y) >= SIZE)) {
        throw Error(`${name}: shadow pixel (${x}, ${y}) is outside the 64 px canvas`);
      }
      raw(x, y, color, alpha);
    },
  ), { outline: false });
  const pixels = frame.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  const bounds = [SIZE, SIZE, -1, -1];
  let count = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!pixels[(y * SIZE + x) * 4 + 3]) continue;
      count++;
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
  }
  if (!count) throw Error(`${name}: empty frame`);
  return { frame, bounds, pixels: count };
}

function writePng(name, canvas) {
  fs.writeFileSync(path.join(OUT, name), canvas.toBuffer('image/png'));
}

function verifyApprovedBody(reference, idle) {
  const expected = reference.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  const actual = idle.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  let preservedPixels = 0;
  let shadowPixels = 0;
  for (let index = 0; index < expected.length; index += 4) {
    const x = index / 4 % SIZE;
    const y = Math.floor(index / 4 / SIZE);
    if (x >= 34 && y < 46) continue;
    if (expected[index + 3]) {
      for (let component = 0; component < 4; component++) {
        if (expected[index + component] !== actual[index + component]) {
          throw Error(`Approved F body outside the head changed at (${x}, ${y})`);
        }
      }
      preservedPixels++;
    } else if (actual[index + 3]) {
      if (actual[index + 3] === 255 || actual[index] || actual[index + 1] || actual[index + 2]) {
        throw Error(`Idle adds a non-shadow pixel outside the approved body region at (${x}, ${y})`);
      }
      shadowPixels++;
    }
  }
  return { region: 'x < 34 or y >= 46 (excludes resized head)', preservedPixels, shadowPixels };
}

function verifyMirrors(frames) {
  let verifiedFrames = 0;
  for (const group of Object.keys(frames.right)) {
    frames.right[group].forEach((frame, index) => {
      const right = frame.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
      const left = frames.left[group][index].getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          for (let component = 0; component < 4; component++) {
            if (right[(y * SIZE + x) * 4 + component] !== left[(y * SIZE + SIZE - 1 - x) * 4 + component]) {
              throw Error(`${group} frame ${index}: left-facing image is not the exact mirror at (${x}, ${y})`);
            }
          }
        }
      }
      verifiedFrames++;
    });
  }
  return verifiedFrames;
}

function sheet(frames) {
  const canvas = createCanvas(SIZE * frames.length, SIZE);
  const ctx = canvas.getContext('2d');
  frames.forEach((frame, index) => ctx.drawImage(frame, SIZE * index, 0));
  return canvas;
}

function contactSheet(groups, direction) {
  const columns = 8;
  const cell = 140;
  const rowHeight = 162;
  const height = 80 + groups.reduce((sum, group) => sum + 44 + Math.ceil(group.frames.length / columns) * rowHeight, 0);
  const canvas = createCanvas(48 + columns * cell, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, canvas.width, canvas.height, C.background);
  text(ctx, `F / SILVER WOODLAND WOLF — ${direction.toUpperCase()}`, 24, 40, 24, C.title, true);
  let top = 72;
  for (const group of groups) {
    text(ctx, group.label, 24, top + 15, 16, C.accent, true);
    top += 36;
    group.frames.forEach((frame, index) => {
      const x = 24 + index % columns * cell;
      const y = top + Math.floor(index / columns) * rowHeight;
      fill(ctx, x, y, 128, 128, C.field);
      sprite(ctx, frame, x, y, 2);
      text(ctx, group.names[index], x + 4, y + 148, 13);
    });
    top += Math.ceil(group.frames.length / columns) * rowHeight + 8;
  }
  return canvas;
}

function previewBoard(frames, reference, moveFps, attackFps) {
  const canvas = createCanvas(1200, 674);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, canvas.width, canvas.height, C.background);
  text(ctx, 'F / SILVER WOODLAND WOLF', 24, 46, 30, C.title, true);
  text(ctx, 'Smaller head · silver fur and subtle border · animated pixel art', 25, 78, 16);
  const cards = [
    ['RUN / RIGHT', `${frames.right.moves.length} frames · ${moveFps} fps`, frames.right.moves[Math.floor(frames.right.moves.length * 0.375)]],
    ['RUN / LEFT', 'Low, stretched stride', frames.left.moves[Math.floor(frames.left.moves.length * 0.375)]],
    ['BITE / RIGHT', `${frames.right.attacks.length} frames · ${attackFps} fps`, frames.right.attacks[Math.floor(frames.right.attacks.length / 2)]],
    ['BITE / LEFT', 'Wind-up · lunge · recover', frames.left.attacks[Math.floor(frames.left.attacks.length / 2)]],
  ];
  cards.forEach(([label, detail, frame], index) => {
    const x = 24 + index * 292;
    fill(ctx, x, 104, 276, 436, C.panel);
    text(ctx, label, x + 12, 134, 18, C.accent, true);
    text(ctx, detail, x + 12, 159, 13);
    fill(ctx, x + 10, 176, 256, 256, C.field);
    sprite(ctx, frame, x + 10, 176, 4);
    text(ctx, '4× detail', x + 16, 422, 12);
    fill(ctx, x + 10, 446, 256, 80, C.field);
    sprite(ctx, frame, x + 18, 450, 1);
    sprite(ctx, frame, x + 172, 476, GAME_SCALE);
    text(ctx, 'Native', x + 86, 489, 12);
    text(ctx, 'Game size', x + 168, 519, 11);
  });
  fill(ctx, 24, 558, 1152, 92, C.panel);
  sprite(ctx, reference, 36, 562, 1.25);
  text(ctx, 'REVISED PROPORTIONS / SMALLER HEAD', 134, 586, 14, C.accent, true);
  text(ctx, 'Same silver coat, cream muzzle, amber eye, and one-pixel border', 134, 612, 14);
  text(ctx, 'Open the animated preview to compare both directions and adjust speed.', 134, 635, 13);
  return canvas;
}

function headComparison(original, revised) {
  const canvas = createCanvas(880, 514);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, canvas.width, canvas.height, C.background);
  text(ctx, 'F / WOLF HEAD PROPORTIONS', 24, 40, 26, C.title, true);
  text(ctx, 'A slightly smaller head, with the same body and subtle border.', 24, 70, 16);
  [[original, 'ORIGINAL F'], [revised, 'SMALLER HEAD']].forEach(([frame, label], index) => {
    const x = 24 + index * 432;
    fill(ctx, x, 94, 400, 396, C.panel);
    text(ctx, label, x + 20, 126, 18, C.accent, true);
    fill(ctx, x + 20, 142, 360, 260, C.field);
    sprite(ctx, frame, x + 72, 144, 4);
    sprite(ctx, frame, x + 50, 416, 1);
    text(ctx, 'Native 64 px', x + 132, 452, 14);
  });
  return canvas;
}

function writeHtml(frames, reference, original, names, moveFps, attackFps, qa) {
  const sources = Object.fromEntries(Object.entries(frames).map(([direction, groups]) => [direction,
    Object.fromEntries(Object.entries(groups).map(([group, images]) => [group, images.map(image => image.toDataURL())])),
  ]));
  const cards = [
    ['Run / right', 'right', 'moves'], ['Run / left', 'left', 'moves'],
    ['Bite / right', 'right', 'attacks'], ['Bite / left', 'left', 'attacks'],
  ];
  const cardHtml = cards.map(([label, direction, group], index) => `<article class="card">
<h2>${label}</h2><p class="timing">${group === 'moves' ? `${names.moves.length} frames · ${moveFps} fps` : `${names.attacks.length} frames · ${attackFps} fps`}</p>
<canvas class="large" width="256" height="256" data-direction="${direction}" data-group="${group}" aria-label="Animated wolf ${label.toLowerCase()}"></canvas>
<div class="sizes"><div><canvas width="88" height="76" data-direction="${direction}" data-group="${group}" data-scale="1" aria-label="Native 64 pixel ${label.toLowerCase()}"></canvas><span>Native 64 px</span></div><div><canvas width="88" height="76" data-direction="${direction}" data-group="${group}" data-scale="${GAME_SCALE}" aria-label="Game-size ${label.toLowerCase()}"></canvas><span>Game size</span></div></div><p class="frame" id="frame${index}"></p></article>`).join('');
  const statesHtml = frames.right.states.map((image, index) => `<figure><img width="64" height="64" src="${image.toDataURL()}" alt="Wolf ${names.states[index]} frame"><figcaption>${names.states[index]}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(OUT, 'wolf-preview.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Silver woodland wolf — animation preview</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.background};color:${C.title};font:15px system-ui,sans-serif}main{max-width:1224px;padding:28px 24px;margin:auto}h1{font-size:28px;margin:0 0 10px}h2{margin:0;font-size:18px;color:${C.accent}}p{color:${C.text};line-height:1.5}.intro{margin:0 0 24px}.controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}button,select{font:inherit;color:${C.title};background:${C.panel};border:1px solid #62735b;border-radius:5px;padding:8px 12px}button{cursor:pointer}button:hover{background:#344a37}button:focus-visible,select:focus-visible{outline:2px solid ${C.accent};outline-offset:3px}label{display:flex;gap:8px;align-items:center;color:${C.text}}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.card{padding:10px;background:${C.panel};border-radius:6px;min-width:0}.card h2,.timing{padding:0 3px}.timing{margin:6px 0 12px;font-size:13px}.large{display:block;width:256px;height:256px;margin:auto;max-width:100%;background:${C.field};image-rendering:pixelated}.sizes{display:flex;justify-content:space-around;margin-top:12px;gap:8px;background:${C.field}}.sizes div{text-align:center}.sizes canvas{display:block;image-rendering:pixelated}.sizes span{display:block;font-size:12px;color:${C.text};padding:0 0 8px}.frame{font:12px ui-monospace,monospace;text-align:center;margin:10px 0 2px;min-height:18px}.reference{display:flex;align-items:center;gap:24px;margin-top:24px;padding:18px;background:${C.panel};border-radius:6px}.reference img{background:${C.field};image-rendering:pixelated;flex:none}.reference h2{font-size:16px}.reference p{margin:8px 0 0;font-size:14px}.states{margin-top:26px}.state-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}figure{margin:0;padding:12px;background:${C.panel};text-align:center}figure img{display:block;background:${C.field};image-rendering:pixelated}figcaption{font:12px ui-monospace,monospace;color:${C.text};margin-top:8px}.notes{font-size:13px;margin-top:22px}a{color:${C.accent}}@media(max-width:1100px){.cards{grid-template-columns:repeat(2,1fr)}.card{padding:16px}}@media(max-width:620px){main{padding:20px 12px}.cards{grid-template-columns:1fr}.reference{gap:14px;padding:12px}.reference img{width:96px;height:96px}h1{font-size:23px}}
</style></head><body><main>
<h1>F / Silver woodland wolf</h1><p class="intro">A slightly smaller head balances the same silver body and subtle border. The low, stretched run keeps its long strides, tucked legs, and brief airborne moments.</p>
<div class="controls"><button id="pause" type="button">Pause</button><button id="step" type="button">Step frame</button><label>Speed <select id="speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><label>Detail scale <select id="zoom"><option value="4" selected>4×</option><option value="2">2×</option><option value="1">Native 64 px</option><option value="${GAME_SCALE}">Game size</option></select></label></div>
<section class="cards" aria-label="Wolf animations">${cardHtml}</section>
<section class="states"><h2>In-game running pace</h2><p>120 world pixels per second at the wolf’s existing 0.54 scale. Speed and pause controls also apply here.</p><canvas id="pace" width="1152" height="112" style="display:block;width:100%;height:auto;background:${C.field};image-rendering:pixelated" aria-label="Wolf running across the ground at its in-game speed"></canvas></section>
<section class="reference"><img src="${reference.toDataURL()}" width="128" height="128" alt="Revised wolf with smaller head and subtle one-pixel border"><div><h2>Revised proportions — smaller head</h2><p>Silver coat, cream muzzle, amber eye, and a small charcoal border.</p><p>The reference remains still so you can compare the animated silhouette.</p></div></section>
<section class="reference"><img src="${original.toDataURL()}" width="128" height="128" alt="Original F head proportions before the size adjustment"><div><h2>Original F reference</h2><p>The earlier head size, retained for comparison with the revised proportions above.</p><p><a href="wolf-head-proportions.png">Compare the head proportions side by side</a></p></div></section>
<section class="states"><h2>Hit and defeat poses</h2><div class="state-row">${statesHtml}</div></section>
<p class="notes">Movement and attack are looped here for comparison. Game-size views use the wolf’s existing 0.54 scale. <a href="wolf-contact-right.png">View every frame</a> · <a href="wolf-contact-left.png">View mirrored frames</a></p>
</main><script>
const sources=${JSON.stringify(sources)}, frameNames=${JSON.stringify(names)}, quality=${JSON.stringify(qa)};
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src});
async function start(){const frames={};for(const [direction,groups] of Object.entries(sources)){frames[direction]={};for(const [group,images] of Object.entries(groups))frames[direction][group]=await Promise.all(images.map(load));}
const fps={moves:${moveFps},attacks:${attackFps}};let paused=false,rate=1,zoom=4,time=0,last;
const canvases=[...document.querySelectorAll('canvas[data-group]')];
const pace=document.querySelector('#pace'), paceCtx=pace.getContext('2d');
const pause=document.querySelector('#pause');
function setPaused(value){paused=value;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));}
pause.onclick=()=>setPaused(!paused);
document.querySelector('#step').onclick=()=>{setPaused(true);time+=1/Math.max(fps.moves,fps.attacks);};
document.querySelector('#speed').onchange=event=>{rate=Number(event.target.value);};
document.querySelector('#zoom').onchange=event=>{zoom=Number(event.target.value);};
function tick(now){if(last!==undefined&&!paused)time+=Math.min((now-last)/1000,0.1)*rate;last=now;
for(const canvas of canvases){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);const group=canvas.dataset.group;const index=Math.floor(time*fps[group]+1e-8)%frames[canvas.dataset.direction][group].length;const scale=Number(canvas.dataset.scale||zoom);const width=64*scale;ctx.drawImage(frames[canvas.dataset.direction][group][index],Math.round((canvas.width-width)/2),Math.round((canvas.height-width)/2),width,width);}
paceCtx.imageSmoothingEnabled=false;paceCtx.clearRect(0,0,pace.width,pace.height);paceCtx.fillStyle='#547244';for(let x=16;x<pace.width;x+=48){paceCtx.fillRect(x,78,5,2);paceCtx.fillRect(x+17,38,2,3);}const runFrame=Math.floor(time*fps.moves+1e-8)%frames.right.moves.length;const gameSize=64*${GAME_SCALE};const runX=(time*120+40)%(pace.width+gameSize)-gameSize;paceCtx.drawImage(frames.right.moves[runFrame],Math.round(runX),42,gameSize,gameSize);
${JSON.stringify(cards)}.forEach(([,direction,group],index)=>{const frame=Math.floor(time*fps[group]+1e-8)%frames[direction][group].length;document.querySelector('#frame'+index).textContent=frameNames[group][frame]+' / '+direction;});requestAnimationFrame(tick);}
window.wolfPreview={quality,get paused(){return paused},get time(){return time},get rate(){return rate},get zoom(){return zoom}};
requestAnimationFrame(tick);}
start().catch(error=>{document.querySelector('.intro').textContent='Preview failed to load: '+error.message;console.error(error);});
</script></body></html>`);
}

async function main() {
  const load = await makeLoader();
  const hd = await load('/src/assets/art/hd.ts');
  const wolf = await load('/src/assets/art/wolf.ts');
  const approved = await load('/scripts/sprite-tries/wolf-selective.ts');
  const names = {
    moves: wolf.WOLF_MOVE_FRAMES,
    attacks: wolf.WOLF_ATK_FRAMES,
    states: wolf.WOLF_FRAMES.filter(name => !wolf.WOLF_MOVE_FRAMES.includes(name) && !wolf.WOLF_ATK_FRAMES.includes(name)),
  };
  const frames = {};
  const bounds = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const direction of ['right', 'left']) {
    frames[direction] = {};
    for (const [group, frameNames] of Object.entries(names)) {
      frames[direction][group] = frameNames.map(name => {
        const result = checkedFrame(hd, wolf.drawWolf(name, direction === 'left' ? 'l' : 'r'), `${name}-${direction}`);
        bounds.push({ name, direction, bounds: result.bounds, pixels: result.pixels });
        writePng(`${name}-${direction}.png`, result.frame);
        return result.frame;
      });
      writePng(`wolf-${group}-${direction}-sheet.png`, sheet(frames[direction][group]));
    }
    const groups = [
      { frames: frames[direction].moves, names: names.moves, label: `Low, stretched run · ${wolf.WOLF_MOVE_FPS} fps` },
      { frames: frames[direction].attacks, names: names.attacks, label: `Bite · ${wolf.WOLF_ATK_FPS} fps` },
      { frames: frames[direction].states, names: names.states, label: 'Hit and defeat' },
    ];
    writePng(`wolf-contact-${direction}.png`, contactSheet(groups, direction));
  }
  const reference = checkedFrame(hd, approved.drawOutlinedSelectiveWolf, 'approved-reference').frame;
  const idle = checkedFrame(hd, wolf.drawWolfIdle(), 'idle').frame;
  const approvedBody = verifyApprovedBody(reference, idle);
  const verifiedMirrors = verifyMirrors(frames);
  const unique = {
    moves: new Set(frames.right.moves.map(frame => frame.toDataURL())).size,
    attacks: new Set(frames.right.attacks.map(frame => frame.toDataURL())).size,
  };
  const qa = { frameCount: bounds.length, nativeSize: SIZE, moveFps: wolf.WOLF_MOVE_FPS, attackFps: wolf.WOLF_ATK_FPS, approvedBody, verifiedMirrors, unique, bounds };
  writePng('wolf-preview.png', previewBoard(frames, idle, wolf.WOLF_MOVE_FPS, wolf.WOLF_ATK_FPS));
  writePng('wolf-approved-reference.png', reference);
  writePng('wolf-revised-reference.png', idle);
  writePng('wolf-head-proportions.png', headComparison(reference, idle));
  writeHtml(frames, idle, reference, names, wolf.WOLF_MOVE_FPS, wolf.WOLF_ATK_FPS, qa);
  fs.writeFileSync(path.join(OUT, 'frame-bounds.json'), JSON.stringify(qa, null, 2));
  console.log(`Validated ${bounds.length} nonempty frames, both directions, with no out-of-canvas body or shadow pixels.`);
  console.log(`Preserved ${approvedBody.preservedPixels} approved F body and border pixels outside the resized head region; ${verifiedMirrors} exact mirrored frame pairs; ${unique.moves} unique movement and ${unique.attacks} unique attack poses.`);
  console.log(path.join(OUT, 'wolf-preview.html'));
  console.log(path.join(OUT, 'wolf-preview.png'));
  console.log(path.join(OUT, 'wolf-contact-right.png'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
