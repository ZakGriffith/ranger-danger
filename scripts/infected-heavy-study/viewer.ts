import { oval, shape } from '../../src/assets/art/forestEnemies/paint';
import { drawMireSnapper, MIRE_SNAPPER_PALETTES } from '../../src/assets/art/infectedEnemies/mireSnapper';
import { drawBogclaw } from './bogclaw';
import { drawSporebell } from './sporebell';

type Action = 'move' | 'attack';
type Mode = Action | 'cycle';

const turtleColor = document.querySelector<HTMLSelectElement>('#turtle-color')!;
MIRE_SNAPPER_PALETTES.forEach((name, variant) => turtleColor.add(new Option(name, String(variant))));
const painters = [
  (ctx: CanvasRenderingContext2D, action: Action, phase: number) => drawMireSnapper(ctx, action, phase, Number(turtleColor.value)),
  drawBogclaw,
  drawSporebell,
];
const canvases = [...document.querySelectorAll<HTMLCanvasElement>('.art')];
const stages = canvases.map((canvas, index) => ({ ctx: canvas.getContext('2d')!, draw: painters[index] }));
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-mode]')];
const play = document.querySelector<HTMLButtonElement>('#play')!;
const scale = document.querySelector<HTMLSelectElement>('#scale')!;
const pose = document.querySelector<HTMLInputElement>('#pose')!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const backdrop = document.createElement('canvas');
const width = 432;
const height = 300;
backdrop.width = width * 2;
backdrop.height = height * 2;
paintMarsh();

let mode: Mode = 'cycle';
let playing = !reducedMotion.matches;
let position = .08;
let lastFrame = 0;
let frameRequest = 0;

function paintMarsh() {
  const ctx = backdrop.getContext('2d')!;
  ctx.scale(2, 2);
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#4a425e');
  base.addColorStop(.55, '#423951');
  base.addColorStop(1, '#302835');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  shape(ctx, '#3b3746', 0, p => {
    p.moveTo(0, 215); p.quadraticCurveTo(81, 185, 171, 215);
    p.bezierCurveTo(269, 255, 353, 209, 432, 201);
    p.lineTo(432, 300); p.lineTo(0, 300);
  });
  shape(ctx, '#4c554b', 0, p => {
    p.moveTo(0, 248); p.bezierCurveTo(49, 246, 68, 262, 103, 286);
    p.quadraticCurveTo(133, 301, 180, 300); p.lineTo(0, 300);
  });
  shape(ctx, '#596c4c', 0, p => {
    p.moveTo(0, 255); p.bezierCurveTo(51, 252, 66, 271, 100, 292);
    p.quadraticCurveTo(111, 299, 137, 300); p.lineTo(0, 300);
  });
  for (let i = 0; i < 145; i++) {
    const x = ((i * 2537) % 7853) / 7853 * width;
    const y = 151 + ((i * 982) % 3833) / 3833 * 145;
    const color = i % 5 === 0 ? '#d0cb8e32' : '#a08fa62b';
    oval(ctx, x, y, .6 + i % 4 * .36, .49 + i % 3 * .18, color, -.36);
  }
  for (const [x, y, s] of [[22, 221, 1], [399, 216, .78], [416, 263, .92]]) {
    oval(ctx, x, y + 1, 13 * s, 3.7 * s, '#211d2b65');
    for (let i = 0; i < 3; i++) {
      const size = s * (1 - i * .15);
      const capX = x - (i - 1) * s * 5;
      const capY = y - i * 7 * s;
      oval(ctx, capX, capY - 1, 7.5 * size, 3.2 * size, '#51456f', -.16);
      oval(ctx, capX - 1, capY - 2, 5.9 * size, 2.3 * size, '#79638d', -.16);
      oval(ctx, capX + 3.8 * size, capY - 4, 1.1 * size, 1.0 * size, '#bac581');
    }
  }
}

function clip(): [Action, number] {
  if (mode !== 'cycle') return [mode, position];
  const cut = .57;
  return position < cut ? ['move', (position / cut * 2) % 1] : ['attack', (position - cut) / (1 - cut)];
}

function paint() {
  const [action, progress] = clip();
  const size = scale.value === 'close' ? 1.64 : .52;
  for (const { ctx, draw } of stages) {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.drawImage(backdrop, 0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height * .79);
    ctx.scale(size, size);
    oval(ctx, -4, 1, 51, 5.5, '#17142062');
    draw(ctx, action, progress);
    ctx.restore();
  }
  pose.value = String(Math.round(position * 1000));
}

function schedule() {
  if (playing && !frameRequest) frameRequest = requestAnimationFrame(tick);
}

function tick(now: number) {
  frameRequest = 0;
  if (!playing) return;
  if (lastFrame) {
    const loop = mode === 'cycle' ? 3200 : mode === 'move' ? 930 : 1380;
    position = (position + Math.min(60, now - lastFrame) / loop) % 1;
  }
  lastFrame = now;
  paint();
  schedule();
}

function setPlaying(next: boolean) {
  playing = next;
  lastFrame = 0;
  play.textContent = playing ? 'Pause' : 'Play';
  schedule();
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    mode = button.dataset.mode as Mode;
    position = 0;
    buttons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    paint();
  });
}
scale.addEventListener('change', paint);
turtleColor.addEventListener('change', paint);
pose.addEventListener('input', () => {
  setPlaying(false);
  position = Number(pose.value) / 1000;
  paint();
});
play.addEventListener('click', () => setPlaying(!playing));
reducedMotion.addEventListener('change', ({ matches }) => setPlaying(!matches));
setPlaying(playing);
paint();
