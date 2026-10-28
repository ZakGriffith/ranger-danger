const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// GIF export requires Python 3 with Pillow; these development dependencies are outside npm.
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'ram-windup');
const FRAME_SIZE = 160;
const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 420;
globalThis.document = { createElement: () => createCanvas(1, 1) };

function meadow(context, width, height, floorY) {
  context.fillStyle = '#40513a';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#45563d';
  context.fillRect(0, floorY - 17, width, height - floorY + 17);
  for (let i = 0; i < 34; i++) {
    const x = (i * 137 + 27) % width;
    const y = (i * 71 + 31) % height;
    context.fillStyle = i % 3 === 0 ? '#526344' : '#354831';
    context.fillRect(x, y, 4, 2);
    if (i % 2 === 0) context.fillRect(x + 2, y - 3, 2, 4);
  }
}

function drawRam(context, frame, centerX, feet, zoom, faceLeft = false, alpha = 1) {
  context.save();
  context.translate(Math.round(centerX), Math.round(feet));
  context.globalAlpha = alpha;
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#17221b66';
  context.beginPath();
  context.ellipse(0, 2, zoom * 42, zoom * 5, 0, 0, Math.PI * 2);
  context.fill();
  context.scale(faceLeft ? -zoom : zoom, zoom);
  context.drawImage(frame, -80, -140);
  context.restore();
}

function drawStage(context, frame, options = {}) {
  const { x = 230, left = false, alpha = 1, width = STAGE_WIDTH, height = STAGE_HEIGHT, zoom = 3 } = options;
  const feet = height - (zoom === 3 ? 64 : 44);
  meadow(context, width, height, feet);
  drawRam(context, frame, x, feet, zoom, left, alpha);
}

function sampleTimeline(time, windup, charge, frameMs, chargeFrameMs, full = true, startX = 230, travel = 120) {
  const neutralMs = 700, windupMs = windup.length * frameMs, dashMs = 650, resetMs = 550;
  const period = neutralMs + windupMs + (full ? dashMs + resetMs : 450);
  const t = time % period;
  if (t < neutralMs) return { frame: windup[0], label: 'Neutral', x: startX };
  if (t < neutralMs + windupMs) {
    const index = Math.min(windup.length - 1, Math.floor((t - neutralMs) / frameMs));
    const label = index < 3 ? 'Lowering the horns' : index < 9 ? 'Two hoof scrapes' : 'Planted brace';
    return { frame: windup[index], label: label + ' · ' + ((t - neutralMs) / 1000).toFixed(1) + ' / 1.2 s', x: startX };
  }
  if (!full) return { frame: windup[windup.length - 1], label: 'Ready to launch', x: startX };
  const afterWindup = t - neutralMs - windupMs;
  if (afterWindup < dashMs) {
    const p = afterWindup / dashMs;
    const frame = charge[Math.floor(afterWindup / chargeFrameMs) % charge.length];
    return { frame, label: 'Charge', x: startX + travel * p * p };
  }
  return { frame: windup[0], label: 'Reset', x: startX };
}

function writeText(context, value, x, y, size = 16, color = '#b8bbc2') {
  context.fillStyle = color;
  context.font = `${size}px system-ui`;
  context.fillText(value, x, y);
}

function nonTransparentBounds(image) {
  const pixels = image.getContext('2d').getImageData(0, 0, FRAME_SIZE, FRAME_SIZE).data;
  const result = { left: FRAME_SIZE, top: FRAME_SIZE, right: -1, bottom: -1 };
  for (let y = 0; y < FRAME_SIZE; y++) for (let x = 0; x < FRAME_SIZE; x++) {
    if (!pixels[(y * FRAME_SIZE + x) * 4 + 3]) continue;
    result.left = Math.min(result.left, x);
    result.top = Math.min(result.top, y);
    result.right = Math.max(result.right, x);
    result.bottom = Math.max(result.bottom, y);
  }
  return result;
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = { root: ROOT, logLevel: 'error' };
  const load = async file => (await runnerImport(file, config)).module;
  const { makeHD } = await load('/src/assets/art/hd.ts');
  const art = await load('/scripts/sprite-tries/ram-patriarch-windup.ts');
  const windup = art.RAM_WINDUP_FRAMES.map(frame => makeHD(FRAME_SIZE, art.drawPatriarchWindup(frame), { outline: false }));
  const charge = art.RAM_CHARGE_FRAMES.map(frame => makeHD(FRAME_SIZE, art.drawPatriarchCharge(frame), { outline: false }));
  const frameMs = art.RAM_WINDUP_FRAME_MS;
  const chargeFrameMs = art.RAM_CHARGE_FRAME_MS;
  fs.mkdirSync(OUT, { recursive: true });
  const frameBounds = [...windup, ...charge].map(nonTransparentBounds);
  if (frameBounds.some(b => b.left <= 0 || b.top <= 0 || b.right >= FRAME_SIZE - 1 || b.bottom >= FRAME_SIZE - 1)) {
    throw new Error('Ram frame touches the edge of its source canvas');
  }

  const board = createCanvas(1280, 1040);
  const context = board.getContext('2d');
  context.fillStyle = '#191b23';
  context.fillRect(0, 0, board.width, board.height);
  writeText(context, 'GREAT PATRIARCH / HOOF SCRAPE + BRACE', 24, 42, 29, '#eeeade');
  writeText(context, 'A 1.2-second warning: lower the horns, scrape twice, settle the weight, then launch.', 24, 77, 17);
  const stage = createCanvas(STAGE_WIDTH, STAGE_HEIGHT);
  drawStage(stage.getContext('2d'), windup[9]);
  context.drawImage(stage, 24, 100);
  writeText(context, '3× source pixels · near the end of the wind-up', 40, 510, 14, '#eeeade');

  context.fillStyle = '#252932';
  context.fillRect(688, 100, 568, 420);
  writeText(context, 'THE WARNING', 712, 138, 18, '#dec58e');
  writeText(context, 'Horns lower into the charge direction.', 712, 176, 17, '#eeeade');
  writeText(context, 'The front hoof scrapes back twice.', 712, 209, 17, '#eeeade');
  writeText(context, 'A short final brace makes the launch readable.', 712, 242, 17, '#eeeade');
  for (let i = 0; i < 3; i++) {
    const x = 780 + i * 171;
    drawRam(context, [windup[0], windup[6], charge[0]][i], x, 455, 1);
    writeText(context, ['Neutral', 'Hoof scrape', 'Launch'][i], x - 42, 491, 14);
  }

  writeText(context, 'WIND-UP STORYBOARD / 100 ms PER FRAME', 24, 564, 18, '#dec58e');
  windup.forEach((frame, i) => {
    const x = 24 + (i % 6) * 208;
    const y = 588 + Math.floor(i / 6) * 212;
    context.fillStyle = '#252932';
    context.fillRect(x, y, 192, 198);
    context.fillStyle = '#40513a';
    context.fillRect(x + 8, y + 34, 176, 154);
    drawRam(context, frame, x + 88, y + 178, 1);
    writeText(context, `${(i * frameMs / 1000).toFixed(1)} s`, x + 12, y + 24, 14, '#eeeade');
  });
  fs.writeFileSync(path.join(OUT, 'ram-windup.png'), board.toBuffer('image/png'));

  const gifFrames = path.join(OUT, 'gif-frames');
  fs.mkdirSync(gifFrames, { recursive: true });
  for (let i = 0; i < 31; i++) {
    const pose = sampleTimeline(i * 100, windup, charge, frameMs, chargeFrameMs);
    drawStage(stage.getContext('2d'), pose.frame, { x: pose.x });
    fs.writeFileSync(path.join(gifFrames, `${String(i).padStart(2, '0')}.png`), stage.toBuffer('image/png'));
  }
  const gifExport = spawnSync('python3', ['-c', `
from PIL import Image
from pathlib import Path
import sys
root = Path(sys.argv[1])
frames = [Image.open(root / 'gif-frames' / f'{i:02}.png').convert('RGB') for i in range(31)]
frames[0].save(root / 'ram-windup.gif', save_all=True, append_images=frames[1:], duration=100, loop=0, optimize=False, disposal=2)
`, OUT], { encoding: 'utf8' });
  if (gifExport.status !== 0) throw new Error(gifExport.stderr || 'Unable to export the animated GIF');

  const data = {
    windup: windup.map(frame => frame.toDataURL()),
    charge: charge.map(frame => frame.toDataURL()),
    frameMs,
    chargeFrameMs,
    bounds: {
      left: Math.min(...frameBounds.map(b => b.left)),
      right: Math.max(...frameBounds.map(b => b.right)),
    },
  };

  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Great patriarch · Hoof scrape and brace</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#191b23;color:#eeeade;font:16px system-ui}main{max-width:1280px;padding:24px;margin:auto}h1{font-size:29px;margin:0 0 12px}p{color:#b8bbc2;line-height:1.5}.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:20px 0}button,select{font:inherit;background:#252932;color:#eeeade;border:1px solid #665971;padding:8px 10px;border-radius:5px}label{display:flex;align-items:center;gap:8px}input{accent-color:#dec58e}.stage-layout{display:grid;grid-template-columns:640px 1fr;gap:24px;align-items:start}.stage-wrap{overflow:auto;max-width:100%;background:#40513a;border-radius:6px}canvas{display:block;image-rendering:pixelated}#stage{max-width:100%;height:auto}.notes{padding:16px 20px;background:#252932;border-radius:6px}.notes h2{font-size:20px;color:#dec58e;margin-top:0}#phase{color:#dec58e;min-height:24px}h2{font-size:21px;margin-top:32px}.storyboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(192px,100%),1fr));gap:14px}.frame{padding:10px 8px;background:#252932;border-radius:6px;overflow:auto}.frame p{font-size:14px;margin:0 4px 8px;color:#dec58e}.frame canvas{height:auto;margin:auto}.storyboard.double{grid-template-columns:repeat(auto-fit,minmax(min(368px,100%),1fr))}a{color:#dec58e}@media(max-width:1050px){.stage-layout{grid-template-columns:1fr}.notes{max-width:640px}}@media(max-width:600px){main{padding:16px}}
</style>
<main>
  <h1>E · Hoof scrape + brace</h1>
  <p>Lower the horns, scrape a front hoof twice, shift the weight back, then launch. The wind-up lasts 1.2 seconds.</p>
  <div class="controls">
    <button id="pause" type="button">Pause</button>
    <button id="replay" type="button">Replay</button>
    <label>Sequence <select id="mode"><option value="full">Full sequence</option><option value="windup">Wind-up only</option></select></label>
    <label>Speed <select id="speed"><option value="1">1×</option><option value="0.5">½×</option></select></label>
    <label><input id="flip" type="checkbox"> Face left</label>
  </div>
  <div class="stage-layout">
    <div class="stage-wrap"><canvas id="stage" width="640" height="420" aria-label="Animated ram charge warning"></canvas></div>
    <div class="notes"><h2>The warning</h2><p>First the horns lower. Two hoof scrapes build anticipation, then a short planted brace leads into the charge.</p><p id="phase" aria-live="off">Loading sprites…</p><p>The stage uses 3× source pixels, or 2× in a narrow pane. The ground shadow stays beneath the ram.</p><p>This is an animation study for review.</p><p><a href="ram-windup.png">Open the storyboard image</a> · <a href="ram-windup.gif">Animated GIF</a></p></div>
  </div>
  <h2>Wind-up frames</h2>
  <div class="controls"><label>Storyboard <select id="story-zoom"><option value="1">Native pixels</option><option value="2">2× source pixels</option></select></label></div>
  <div class="storyboard">${windup.map((_, i) => `<div class="frame"><p>${(i * frameMs / 1000).toFixed(1)} s</p><canvas width="176" height="164" aria-label="Wind-up frame ${i + 1}"></canvas></div>`).join('')}</div>
</main>
<script>
const data = ${JSON.stringify(data)};
${meadow.toString()}
${drawRam.toString()}
${drawStage.toString()}
${sampleTimeline.toString()}
const STAGE_WIDTH = 640, STAGE_HEIGHT = 420;
const loadImage = src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
Promise.all([Promise.all(data.windup.map(loadImage)), Promise.all(data.charge.map(loadImage))]).then(([windup, charge]) => {
  const stage = document.querySelector('#stage').getContext('2d');
  const phase = document.querySelector('#phase');
  const mode = document.querySelector('#mode');
  const speed = document.querySelector('#speed');
  const flip = document.querySelector('#flip');
  const pause = document.querySelector('#pause');
  let elapsed = 0, previous = null, paused = false;
  pause.onclick = () => { paused = !paused; pause.textContent = paused ? 'Play' : 'Pause'; };
  document.querySelector('#replay').onclick = () => { elapsed = 0; paused = false; pause.textContent = 'Pause'; };
  mode.onchange = () => elapsed = 0;
  function storyboard() {
    const zoom = Number(document.querySelector('#story-zoom').value);
    document.querySelector('.storyboard').classList.toggle('double', zoom === 2);
    document.querySelectorAll('.frame canvas').forEach((canvas, i) => {
      canvas.width = 176 * zoom;
      canvas.height = 164 * zoom;
      const context = canvas.getContext('2d');
      meadow(context, canvas.width, canvas.height, 146 * zoom);
      drawRam(context, windup[i], 82 * zoom, 146 * zoom, zoom, flip.checked);
    });
  }
  flip.onchange = storyboard;
  document.querySelector('#story-zoom').onchange = storyboard;
  storyboard();
  let viewport = { width: 640, height: 420, zoom: 3, startX: 230, travel: 120 };
  function resizeStage() {
    const width = Math.min(640, Math.floor(document.querySelector('.stage-wrap').clientWidth));
    const zoom = width >= 560 ? 3 : 2;
    const height = zoom === 3 ? 420 : 300;
    const footprint = (data.bounds.right - data.bounds.left + 1) * zoom;
    const travel = Math.min(120, Math.max(0, width - footprint - 48));
    const startX = Math.round((width - footprint - travel) / 2 - (data.bounds.left - 80) * zoom);
    const canvas = document.querySelector('#stage');
    canvas.width = width;
    canvas.height = height;
    viewport = { width, height, zoom, startX, travel };
  }
  window.addEventListener('resize', resizeStage);
  resizeStage();
  function tick(now) {
    if (previous !== null && !paused) elapsed += Math.min(100, now - previous) * Number(speed.value);
    previous = now;
    const pose = sampleTimeline(elapsed, windup, charge, data.frameMs, data.chargeFrameMs, mode.value === 'full', viewport.startX, viewport.travel);
    drawStage(stage, pose.frame, { ...viewport, x: flip.checked ? viewport.width - pose.x : pose.x, left: flip.checked });
    phase.textContent = pose.label;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}).catch(error => { document.querySelector('#phase').textContent = 'Unable to load the animation: ' + error.message; });
</script>
</html>`;
  fs.writeFileSync(path.join(OUT, 'ram-windup.html'), html);
  console.log(JSON.stringify({ preview: path.join(OUT, 'ram-windup.html'), windupFrames: windup.length, chargeFrames: charge.length, frameBounds }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
