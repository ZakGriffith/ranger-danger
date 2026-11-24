import { createCanvas } from 'canvas';
import { build, runnerImport } from 'vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const source = new URL('./', import.meta.url);
const output = new URL('../out/infected-tank-options/', source);
const { module: { STUDIES, FUNGAL_STUDIES } } = await runnerImport(new URL('roster.ts', source).pathname, { configFile: false });
const { module: { paintBackdrop } } = await runnerImport(new URL('backdrop.ts', source).pathname, { configFile: false });

for (const study of STUDIES) {
  for (const action of ['move', 'attack']) {
    const distinct = new Set();
    for (let i = 0; i < 48; i++) {
      const frame = createCanvas(96, 96), ctx = frame.getContext('2d');
      ctx.translate(48, 76); ctx.scale(.48, .48); ctx.lineCap = ctx.lineJoin = 'round'; study.draw(ctx, action, i / 48);
      const pixels = ctx.getImageData(0, 0, 96, 96).data;
      if (!pixels.some((value, index) => index % 4 === 3 && value)) throw new Error(`${study.id} ${action} ${i} is empty`);
      for (let edge = 0; edge < 96; edge++) for (const offset of [edge * 4 + 3, (95 * 96 + edge) * 4 + 3, edge * 96 * 4 + 3, (edge * 96 + 95) * 4 + 3]) {
        if (pixels[offset]) throw new Error(`${study.id} ${action} ${i} clips its frame`);
      }
      distinct.add(frame.toBuffer('image/png').toString('base64'));
    }
    if (distinct.size < 12) throw new Error(`${study.id} ${action} has too few distinct poses`);
  }
}

const sheet = createCanvas(1440, 870), ctx = sheet.getContext('2d');
ctx.fillStyle = '#1c1922'; ctx.fillRect(0, 0, sheet.width, sheet.height);
ctx.fillStyle = '#ced8a1'; ctx.font = '14px sans-serif'; ctx.fillText('RANGER DANGER  /  INFECTED TANK ALTERNATIVES', 30, 34);
ctx.fillStyle = '#f3e7d4'; ctx.font = '30px Georgia'; ctx.fillText('Three creatures. One slow, heavy role.', 30, 76);
for (const [i, study] of STUDIES.entries()) {
  ctx.save(); ctx.translate(i * 480, 102); paintBackdrop(ctx, 480, 722);
  ctx.fillStyle = '#f3e7d4'; ctx.font = '27px Georgia'; ctx.fillText(`${study.letter}  ${study.name}`, 24, 39);
  for (const [row, [action, phase]] of [['move', .18], ['attack', .53]].entries()) {
    ctx.save(); ctx.translate(230, 300 + row * 288); ctx.scale(1.65, 1.65); ctx.lineJoin = ctx.lineCap = 'round';
    ctx.fillStyle = '#19152666'; ctx.beginPath(); ctx.ellipse(0, 1, 51, 5, 0, 0, Math.PI * 2); ctx.fill();
    study.draw(ctx, action, phase); ctx.restore();
    ctx.fillStyle = '#c3b6c5'; ctx.font = '12px sans-serif'; ctx.fillText(row === 0 ? 'HEAVY WALK' : 'STRIKE', 24, 310 + row * 288);
  }
  ctx.save(); ctx.translate(240, 698); ctx.scale(.312, .312); study.draw(ctx, 'move', .18); ctx.restore();
  ctx.fillStyle = '#c3b6c5'; ctx.font = '12px sans-serif'; ctx.fillText('GAME SIZE', 24, 696);
  ctx.restore();
}
await mkdir(output, { recursive: true });
await writeFile(new URL('preview.png', output), sheet.toBuffer('image/png'));
const swings = createCanvas(1440, 410), swingCtx = swings.getContext('2d');
swingCtx.fillStyle = '#1c1922'; swingCtx.fillRect(0, 0, 1440, 410);
swingCtx.fillStyle = '#f2e7d7'; swingCtx.font = '28px Georgia'; swingCtx.fillText('Fungal Brute · heavy punch', 24, 38);
for (const [row, study] of FUNGAL_STUDIES.entries()) {
  for (const [column, [label, phase]] of [['Wind-up', .32], ['Snap forward', .40], ['Full extension', .46], ['Recovery', .78]].entries()) {
    swingCtx.save(); swingCtx.translate(column * 360, 60 + row * 350); paintBackdrop(swingCtx, 360, 345);
    swingCtx.fillStyle = '#e8dfca'; swingCtx.font = '18px Georgia'; swingCtx.fillText(`${study.letter} · ${study.name}`, 17, 29);
    swingCtx.fillStyle = '#c0b4c5'; swingCtx.font = '12px sans-serif'; swingCtx.fillText(label, 17, 51);
    swingCtx.translate(176, 310); swingCtx.scale(1.5, 1.5); study.draw(swingCtx, 'attack', phase); swingCtx.restore();
  }
}
await writeFile(new URL('fungal-attacks.png', output), swings.toBuffer('image/png'));
const [result] = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: false, lib: { entry: new URL('viewer.ts', source).pathname, formats: ['es'], fileName: 'infected-tanks' } } });
const script = result.output.find(item => item.type === 'chunk');
const page = await readFile(new URL('page.html', source), 'utf8');
await writeFile(new URL('index.html', output), page.replace('<script type="module" src="./viewer.ts"></script>', () => `<script type="module">${script.code}</script>`));
const fungalPage = await readFile(new URL('fungal.html', source), 'utf8');
await writeFile(new URL('fungal.html', output), fungalPage.replace('<script type="module" src="./viewer.ts"></script>', () => `<script type="module">${script.code}</script>`));
console.log('Validated 288 unclipped walk/attack poses. Wrote creature and Fungal Brute attack studies.');
