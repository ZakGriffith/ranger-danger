import { STUDIES, FUNGAL_STUDIES } from './roster';
import { paintBackdrop } from './backdrop';
import { oval, type Action } from './paint';
import { drawForestBear, forestBearPose } from '../../src/assets/art/forestEnemies/bear';
import { drawMireSnapper } from '../../src/assets/art/infectedEnemies/mireSnapper';

const play = document.querySelector<HTMLButtonElement>('#play')!;
const modeSelect = document.querySelector<HTMLSelectElement>('#mode')!;
const speedSelect = document.querySelector<HTMLSelectElement>('#speed')!;
const scrub = document.querySelector<HTMLInputElement>('#pose')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const studies = document.body.dataset.study === 'fungal' ? FUNGAL_STUDIES : STUDIES;
const stages = studies.map(study => ({ ...study, canvas: document.querySelector<HTMLCanvasElement>(`#${study.id}`)! }));
const width = 432, height = 350;
const backdrop = document.createElement('canvas'); backdrop.width = width * 2; backdrop.height = height * 2;
const ground = backdrop.getContext('2d')!; ground.scale(2, 2); paintBackdrop(ground, width, height);
let elapsed = 0, last = 0, playing = !reducedMotion.matches;

function clip(): [Action, number] {
  const mode = modeSelect.value;
  if (mode !== 'cycle') return [mode as Action, elapsed % 1];
  const progress = elapsed % 1;
  return progress < .57 ? ['move', progress / .57 * 2 % 1] : ['attack', (progress - .57) / .43];
}
function paint() {
  const [action, phase] = clip();
  for (const { canvas, draw } of stages) {
    const ctx = canvas.getContext('2d')!; ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.lineJoin = ctx.lineCap = 'round';
    ctx.drawImage(backdrop, 0, 0, width, height);
    ctx.save(); ctx.translate(width / 2, 246); ctx.scale(1.5, 1.5);
    oval(ctx, 0, 1, 51, 5.5, '#1b182a70'); draw(ctx, action, phase); ctx.restore();
    ctx.fillStyle = '#c9c1c5'; ctx.font = '12px system-ui'; ctx.fillText('GAME SIZE', 20, 326);
    const frame = document.createElement('canvas'); frame.width = frame.height = 96;
    const f = frame.getContext('2d')!; f.translate(48, 76); f.scale(.48, .48); draw(f, action, phase);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(frame, 185, 276, 62.4, 62.4);
  }
  scrub.value = String(Math.round((elapsed % 1) * 1000));
  const windEnd = document.body.dataset.study === 'fungal' ? .365 : .35;
  const strikeEnd = document.body.dataset.study === 'fungal' ? .54 : .65;
  status.textContent = action === 'move' ? 'Heavy walk' : phase < windEnd ? 'Attack · wind-up' : phase < strikeEnd ? 'Attack · strike' : 'Attack · recovery';
}
function setPlaying(value: boolean) {
  playing = value; last = 0; play.textContent = playing ? 'Pause' : 'Play'; play.setAttribute('aria-pressed', String(!playing));
}
function tick(now: number) {
  if (playing && last) {
    const duration = modeSelect.value === 'cycle' ? 4 : modeSelect.value === 'move' ? 1.25 : 1.65;
    elapsed += Math.min(.06, Math.max(0, (now - last) / 1000)) / duration * Number(speedSelect.value);
  }
  last = now; paint(); requestAnimationFrame(tick);
}
play.addEventListener('click', () => setPlaying(!playing));
modeSelect.addEventListener('change', () => { elapsed = 0; last = 0; paint(); });
scrub.addEventListener('input', () => { setPlaying(false); elapsed = Number(scrub.value) / 1000; paint(); });
reducedMotion.addEventListener('change', e => setPlaying(!e.matches));

for (const [id, draw, scale] of [
  ['bear-reference', (ctx: CanvasRenderingContext2D) => drawForestBear(ctx, forestBearPose('move', 3)), 1.35],
  ['turtle-reference', (ctx: CanvasRenderingContext2D) => drawMireSnapper(ctx, 'move', .2), .95],
] as const) {
  const canvas = document.querySelector<HTMLCanvasElement>(`#${id}`)!;
  const ctx = canvas.getContext('2d')!; ctx.scale(2, 2); paintBackdrop(ctx, 300, 160);
  ctx.translate(150, 132); ctx.scale(scale, scale); oval(ctx, 0, 1, 45, 5, '#17142065'); draw(ctx);
}
setPlaying(playing); requestAnimationFrame(tick);
