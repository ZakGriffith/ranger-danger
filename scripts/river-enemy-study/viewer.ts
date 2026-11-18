import { line, oval, shape, wash } from '../../src/assets/art/forestEnemies/paint';
import { crowOptions, batOptions } from './birds';
import { dragonflyOptions, mosquitoOptions } from './insects';
import { phantomOptions } from './phantom';

type Action = 'move' | 'attack';
type Mode = Action | 'cycle';

type Option = {
  name: string;
  description: string;
  draw(ctx: CanvasRenderingContext2D, action: Action, phase: number): void;
  shadowX?(action: Action, phase: number): number;
};

type Enemy = {
  id: string;
  name: string;
  role: string;
  options: readonly Option[];
  gameScale: number;
  defaultOption?: number;
};

type Stage = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  enemy: Enemy;
  option: Option;
  width: number;
  height: number;
  lineup: boolean;
};

const enemies: Enemy[] = [
  { id: 'crow', name: 'Crow', role: 'Flying patrol · Diving peck', options: crowOptions, gameScale: .32 },
  { id: 'bat', name: 'Bat', role: 'Heavy flier · Biting lunge', options: batOptions, gameScale: .35 },
  { id: 'dragonfly', name: 'Dragonfly', role: 'Fast flier · Darting strike', options: dragonflyOptions, gameScale: .29 },
  { id: 'mosquito', name: 'Mosquito', role: 'Ranged flier · Dart shot', options: mosquitoOptions, gameScale: .29, defaultOption: 1 },
  { id: 'fog-phantom', name: 'Rivers boss designs', role: 'Flight and aerial dash', options: phantomOptions, gameScale: .57 },
];

const roster = document.querySelector<HTMLDivElement>('#roster')!;
const nav = document.querySelector<HTMLElement>('#roster-nav')!;
const lineupGrid = document.querySelector<HTMLDivElement>('#lineup-grid')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const mode = document.querySelector<HTMLSelectElement>('#mode')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;
const viewScale = document.querySelector<HTMLSelectElement>('#view-scale')!;
const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const stages: Stage[] = [];
const visible = new Set<Element>();
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
  if (paused) paint();
});

const density = 2;
const moveMs = 1460;
const attackMs = 1280;
const scrubSteps = Number(scrub.max);
const lineupBackdrop = riverBackdrop(216, 152);
const cardBackdrop = riverBackdrop(384, 216);
const bossLineupBackdrop = flightBackdrop(216, 152);
const bossCardBackdrop = flightBackdrop(384, 216);
let animationMode: Mode = 'cycle';
let elapsed = 0;
let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}

function makeStage(enemy: Enemy, option: Option, lineup: boolean): Stage {
  const width = lineup ? 216 : 384;
  const height = lineup ? 152 : 216;
  const canvas = element('canvas');
  canvas.width = width * density;
  canvas.height = height * density;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${option.name}, animated ${enemy.name}`);
  const context = canvas.getContext('2d')!;
  const stage = { canvas, context, enemy, option, width, height, lineup };
  stages.push(stage);
  observer.observe(canvas);
  return stage;
}

function riverBackdrop(width: number, height: number) {
  const canvas = element('canvas');
  canvas.width = width * density;
  canvas.height = height * density;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(density, density);
  ctx.scale(width / 384, height / 216);
  ctx.fillStyle = wash(ctx, 0, 216, [[0, '#5b7972'], [.61, '#76958b'], [1, '#5b7a73']]);
  ctx.fillRect(0, 0, 384, 216);
  shape(ctx, '#8ba395', 0, path => {
    path.moveTo(0, 148); path.bezierCurveTo(51, 123, 87, 164, 177, 143);
    path.bezierCurveTo(258, 119, 305, 139, 384, 110);
    path.lineTo(384, 141); path.bezierCurveTo(307, 154, 257, 138, 174, 163);
    path.bezierCurveTo(102, 185, 59, 144, 0, 169);
  });
  shape(ctx, '#81907c', 0, path => {
    path.moveTo(251, 216); path.bezierCurveTo(283, 194, 325, 204, 345, 184);
    path.quadraticCurveTo(363, 168, 384, 172); path.lineTo(384, 216);
  });
  shape(ctx, '#536c55', 0, path => {
    path.moveTo(270, 216); path.bezierCurveTo(294, 203, 331, 211, 355, 187);
    path.quadraticCurveTo(371, 172, 384, 178); path.lineTo(384, 216);
  });
  ctx.lineCap = 'round';
  for (const [x, y, length] of [[14, 69, 25], [58, 93, 18], [42, 128, 45], [12, 161, 34], [67, 180, 22], [98, 175, 32], [137, 195, 23], [239, 166, 39], [281, 83, 31], [321, 69, 20], [326, 125, 37], [318, 174, 22], [350, 150, 34]]) {
    line(ctx, '#c5d4ae55', 1.5, path => {
      path.moveTo(x, y); path.quadraticCurveTo(x + length * .45, y - 3, x + length, y - 1);
    });
  }
  for (const [x, y, rx, ry] of [[33, 183, 13, 6], [49, 190, 6, 3], [41, 192, 3, 2], [322, 194, 10, 4], [353, 181, 7, 4]]) {
    oval(ctx, x, y + 1, rx + 2, ry, '#45645d');
    oval(ctx, x, y - 1, rx, ry, '#a6ad96', -.18);
    oval(ctx, x - rx * .25, y - ry * .5, rx * .54, ry * .35, '#c0c3a7', -.18);
  }
  for (const [x, y] of [[348, 213], [373, 201], [381, 207]]) {
    for (const lean of [-8, -1, 6]) {
      line(ctx, '#a0a579', 1.5, path => {
        path.moveTo(x, y); path.quadraticCurveTo(x, y - 7, x + lean, y - 13 - Math.abs(lean) * .5);
      });
    }
  }
  return canvas;
}

function flightBackdrop(width: number, height: number) {
  const canvas = element('canvas');
  canvas.width = width * density;
  canvas.height = height * density;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(width * density / 384, height * density / 216);
  ctx.fillStyle = wash(ctx, 0, 216, [[0, '#768a67'], [1, '#576f51']]);
  ctx.fillRect(0, 0, 384, 216);
  shape(ctx, '#6a7f5f', 0, path => {
    path.moveTo(0, 35);
    path.bezierCurveTo(51, 12, 98, 50, 149, 30);
    path.bezierCurveTo(178, 16, 231, 11, 270, 0);
    path.lineTo(0, 0);
  });
  shape(ctx, '#687c56', 0, path => {
    path.moveTo(168, 216);
    path.bezierCurveTo(242, 182, 296, 216, 340, 180);
    path.quadraticCurveTo(365, 160, 384, 164);
    path.lineTo(384, 216);
  });

  const channel = new Path2D();
  channel.moveTo(-10, 113);
  channel.bezierCurveTo(56, 145, 103, 143, 160, 118);
  channel.bezierCurveTo(216, 93, 254, 118, 300, 91);
  channel.bezierCurveTo(337, 69, 356, 53, 394, 53);
  channel.lineTo(394, 116);
  channel.bezierCurveTo(350, 114, 328, 146, 294, 154);
  channel.bezierCurveTo(246, 164, 211, 144, 162, 177);
  channel.bezierCurveTo(103, 213, 52, 207, -10, 176);
  channel.closePath();
  ctx.strokeStyle = '#969577';
  ctx.lineWidth = 7;
  ctx.stroke(channel);
  ctx.fillStyle = wash(ctx, 40, 213, [[0, '#557d95'], [.55, '#4c748f'], [1, '#395c7d']]);
  ctx.fill(channel);
  ctx.save();
  ctx.clip(channel);
  ctx.lineCap = 'round';
  line(ctx, '#99b5b93d', 7, path => {
    path.moveTo(-6, 150);
    path.bezierCurveTo(55, 177, 107, 178, 161, 149);
    path.bezierCurveTo(212, 121, 243, 143, 299, 121);
    path.bezierCurveTo(337, 103, 358, 84, 389, 87);
  });
  for (const [x, y, span] of [[9, 149, 25], [38, 172, 17], [77, 157, 26], [112, 177, 29], [142, 145, 18], [193, 128, 26], [235, 142, 29], [259, 122, 19], [302, 126, 16], [332, 93, 25], [359, 77, 12]]) {
    line(ctx, '#c0d6cf55', 1.25, path => {
      path.moveTo(x, y);
      path.quadraticCurveTo(x + span * .55, y - 1, x + span, y - 4);
    });
  }
  ctx.restore();

  for (const [x, y, size] of [[14, 124, 4], [35, 131, 3], [54, 138, 4], [72, 140, 2], [103, 137, 4], [154, 121, 3], [262, 104, 5], [299, 92, 4], [324, 77, 3], [369, 55, 4], [19, 187, 5], [37, 195, 3], [65, 201, 4], [98, 201, 4], [139, 192, 3], [160, 180, 5], [190, 163, 3], [219, 156, 4], [255, 157, 3], [284, 156, 4], [315, 149, 4], [337, 136, 3], [366, 120, 5]]) {
    oval(ctx, x, y + 1, size + .6, size * .63, '#596c5d', -.15);
    oval(ctx, x, y, size, size * .6, '#b3b298', -.15);
  }
  ctx.lineCap = 'round';
  for (const [x, y] of [[22, 50], [45, 97], [107, 90], [166, 78], [220, 36], [282, 60], [25, 207], [176, 205], [230, 189], [300, 189], [349, 168], [361, 204]]) {
    line(ctx, '#bac39a7a', 1.25, path => {
      path.moveTo(x - 3, y);
      path.lineTo(x - 5, y - 3);
      path.moveTo(x, y);
      path.quadraticCurveTo(x + 1, y - 4, x + 4, y - 6);
    });
  }
  return canvas;
}

function addEnemy(enemy: Enemy) {
  const link = element('a', '', enemy.name);
  link.href = `#${enemy.id}`;
  nav.append(link);

  const lineup = element('article', 'lineup-item');
  const defaultOption = enemy.defaultOption ?? 0;
  const picked = makeStage(enemy, enemy.options[defaultOption], true);
  const label = element('div');
  const selectedName = element('p');
  label.append(element('h3', '', enemy.name), selectedName);
  lineup.append(picked.canvas, label);
  lineupGrid.append(lineup);

  const section = element('section');
  section.id = enemy.id;
  const variants = element('div', enemy.options.length === 3 ? 'variants three' : 'variants');
  const choices = enemy.options.map((option, index) => {
    const letter = String.fromCharCode(65 + index);
    const card = element('article', 'card');
    const stage = makeStage(enemy, option, false);
    const details = element('div');
    const choose = element('button', '', `Select ${letter}`);
    choose.type = 'button';
    choose.setAttribute('aria-label', `Select ${option.name} for the lineup`);
    choose.addEventListener('click', () => select(index));
    details.append(choose, element('h3', '', `${letter} · ${option.name}`), element('p', '', option.description));
    card.append(stage.canvas, details);
    variants.append(card);
    return { card, choose, letter };
  });
  section.append(element('h2', '', enemy.name), element('p', 'role', enemy.role), variants);
  roster.append(section);

  function select(index: number) {
    picked.option = enemy.options[index];
    picked.canvas.setAttribute('aria-label', `${picked.option.name}, animated ${enemy.name}`);
    selectedName.textContent = `${choices[index].letter} · ${picked.option.name}`;
    choices.forEach(({ card, choose, letter }, choice) => {
      const selected = choice === index;
      card.classList.toggle('selected', selected);
      choose.setAttribute('aria-pressed', String(selected));
      choose.textContent = selected ? `Selected ${letter}` : `Select ${letter}`;
    });
    paint();
  }

  select(defaultOption);
}

function duration() {
  if (animationMode === 'move') return moveMs;
  if (animationMode === 'attack') return attackMs;
  return moveMs + attackMs;
}

function paint(all = false) {
  const action = animationMode === 'attack' || (animationMode === 'cycle' && elapsed >= moveMs) ? 'attack' : 'move';
  const actionTime = action === 'attack' && animationMode === 'cycle' ? elapsed - moveMs : elapsed;
  const phase = actionTime / (action === 'move' ? moveMs : attackMs);
  const gameSize = viewScale.value === 'game';
  for (const stage of stages) {
    if (!all && !visible.has(stage.canvas)) continue;
    const { context: ctx, enemy, option, width, height, lineup } = stage;
    const boss = enemy.id === 'fog-phantom';
    const bossInLineup = lineup && boss;
    const closeScale = lineup ? (bossInLineup ? .95 : .88) : 1.30;
    const scale = gameSize ? enemy.gameScale : closeScale;
    const groundY = gameSize ? .66 : bossInLineup ? .86 : .82;
    const backdrop = boss ? (lineup ? bossLineupBackdrop : bossCardBackdrop) : (lineup ? lineupBackdrop : cardBackdrop);
    const posePhase = Math.min(phase, 1);
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(backdrop, 0, 0, width, height);
    ctx.save();
    ctx.translate(width * .48, height * groundY);
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (option.shadowX) {
      const x = option.shadowX(action, posePhase);
      oval(ctx, x, 3, 27, 6, '#232b2440');
      oval(ctx, x, 3, 19, 4, '#232b2430');
    }
    option.draw(ctx, action, posePhase);
    ctx.restore();
  }
}

function setPaused(next: boolean) {
  paused = next;
  play.textContent = paused ? 'Play' : 'Pause';
}

mode.addEventListener('change', () => {
  animationMode = mode.value as Mode;
  elapsed = 0;
  scrub.value = '0';
  paint();
});
viewScale.addEventListener('change', () => paint());
play.addEventListener('click', () => setPaused(!paused));
scrub.addEventListener('input', () => {
  setPaused(true);
  elapsed = Math.min(duration() - .001, Number(scrub.value) / scrubSteps * duration());
  paint();
});

for (const enemy of enemies) addEnemy(enemy);
setPaused(paused);
paint(true);

let lastPaint = 0;
let lastFrame = 0;
function tick(now: number) {
  const dt = Math.min(now - (lastFrame || now), 50);
  lastFrame = now;
  if (!paused) {
    elapsed = (elapsed + dt * Number(speed.value)) % duration();
    if (now - lastPaint >= 25) {
      lastPaint = now;
      scrub.value = String(Math.round(elapsed / duration() * scrubSteps));
      paint();
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
