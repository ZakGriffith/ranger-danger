import { oval, shape } from '../../src/assets/art/forestEnemies/paint';
import { blobOptions } from './blob';
import { ironcapOptions } from './ironcap';
import { runnerOptions } from './runner';
import { toadOptions } from './toad';
import { gulperOption } from './toad-gulper';
import { glassbellyOption } from './toad-glassbelly';
import { bellowsOption } from './toad-bellows';
import { blightedOptions } from './blighted';

const roster = [
  { name: 'Blob', actions: 'Roll · Jump strike', options: blobOptions, field: .36, close: 1.50, stride: 1.10, shadow: 40 },
  { name: 'Ironcap', actions: 'Lumber · Heavy slam', options: ironcapOptions, field: .48, close: 1.24, stride: 1.22, shadow: 44 },
  { name: 'Infected Runner', actions: 'Skitter · Fang lunge', options: runnerOptions, field: .30, close: 1.54, stride: .63, shadow: 42 },
  {
    name: 'Poison Toad', actions: 'Hop · Poison lob',
    options: [...toadOptions, gulperOption, glassbellyOption, bellowsOption],
    field: .34, close: 1.36, stride: .90, shadow: 40, offset: -17,
  },
  { name: 'The Blighted One', actions: 'Advance · Poison charge', options: blightedOptions, field: .58, close: 1.11, stride: 1.28, shadow: 55 },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DURATION = { cycle: 3.1, move: 1.05, attack: 1.35 };
const CUT = .58;
const resolution = 2;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const enemyTemplate = document.querySelector('#enemy');
const optionTemplate = document.querySelector('#option');
const root = document.querySelector('#enemies');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const playButton = document.querySelector('#play');
const speedSelect = document.querySelector('#speed');
const scaleSelect = document.querySelector('#scale');
const scrub = document.querySelector('#phase');
const stage = document.querySelector('.stage');
const stageCtx = stage.getContext('2d');
const stageBg = document.createElement('canvas');
const cardBg = document.createElement('canvas');
const lineupKeys = document.querySelector('.lineup-keys');
let mode = 'cycle';
let playing = !reducedMotion.matches;
let position = .12;
let stageSize = null;
let raf = 0;
let lastFrame = 0;

const sections = roster.map((enemy, enemyIndex) => {
  const section = enemyTemplate.content.firstElementChild.cloneNode(true);
  section.id = enemy.name.toLowerCase().replaceAll(' ', '-');
  const name = section.querySelector('h2');
  name.textContent = enemy.name;
  name.id = `enemy-${enemyIndex}`;
  section.setAttribute('aria-labelledby', name.id);
  section.querySelector('.actions').textContent = enemy.actions;
  const options = section.querySelector('.options');
  const lineupKey = document.createElement('div');
  const lineage = document.createElement('strong');
  lineage.textContent = enemy.name;
  const selection = document.createElement('span');
  lineupKey.append(lineage, selection);
  lineupKeys.append(lineupKey);

  const cards = enemy.options.map((option, index) => {
    const article = optionTemplate.content.firstElementChild.cloneNode(true);
    const canvas = article.querySelector('canvas');
    const button = article.querySelector('button');
    canvas.setAttribute('aria-label', `${enemy.name}, option ${LETTERS[index]}: ${option.name}. Animated study.`);
    button.querySelector('.letter').textContent = LETTERS[index];
    button.querySelector('.label').textContent = option.name;
    button.setAttribute('aria-label', `Use ${enemy.name} option ${LETTERS[index]}, ${option.name}, in lineup`);
    article.querySelector('.description').textContent = option.description;
    button.addEventListener('click', () => {
      setChoice(sections[enemyIndex], index);
      paint();
    });
    options.append(article);
    return { article, canvas, button, ctx: canvas.getContext('2d'), option };
  });
  root.append(section);
  return { enemy, selection, selected: 0, cards, section };
});

function setChoice(group, index) {
  group.selected = index;
  for (const [i, { article, button }] of group.cards.entries()) {
    article.toggleAttribute('data-selected', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  }
  group.selection.textContent = `${LETTERS[index]} · ${group.enemy.options[index].name}`;
}
for (const group of sections) setChoice(group, group.selected);

function clip(enemy) {
  if (mode === 'attack') return ['attack', position];
  if (mode === 'move') return ['move', position];
  if (position < CUT) {
    const cycles = Math.max(1, Math.round(CUT * DURATION.cycle / enemy.stride));
    return ['move', position / CUT * cycles % 1];
  }
  return ['attack', (position - CUT) / (1 - CUT)];
}

function drawEnemy(ctx, enemy, option, action, phase, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = ctx.lineJoin = 'round';
  oval(ctx, 0, -1, enemy.shadow, 5.1, '#15121b8c');
  option.draw(ctx, action, phase);
  ctx.restore();
}

function ground(ctx, width, height) {
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, '#36283e');
  shade.addColorStop(.53, '#4e3d4c');
  shade.addColorStop(1, '#2c2736');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < Math.ceil(width * height / 480); i++) {
    const x = (i * 71.37 + i * i * 8.43) % width;
    const y = (i * 33.1 + i * i * 3.29) % height;
    const tints = ['#966e8355', '#251d2d76', '#8378695a', '#6859688a'];
    oval(ctx, x, y, 1.3 + (i % 5) * 1.9, .4 + (i % 4) * .46, tints[i % tints.length], -0.09);
  }
  for (const [u, v, s] of [[.06, .88, .86], [.36, .23, .37], [.78, .79, .67], [.96, .32, .45]]) {
    ctx.save();
    ctx.translate(u * width, v * height);
    ctx.scale(s, s);
    shape(ctx, '#443c3d', 0, p => {
      p.moveTo(-39, 7); p.quadraticCurveTo(-31, -12, -14, -11); p.quadraticCurveTo(-7, -18, 11, -14);
      p.quadraticCurveTo(27, -14, 41, -2); p.quadraticCurveTo(50, 6, 27, 11); p.quadraticCurveTo(-8, 19, -39, 7);
    });
    oval(ctx, 1, 1, 30, 8.5, '#57613d', .025);
    oval(ctx, 4, 1, 23, 6.1, '#6a7850', .025);
    oval(ctx, -7, -.1, 7.2, 1.45, '#94a46080', .05);
    oval(ctx, 16, 3.4, 3.2, 1.0, '#a3ac7788', .06);
    ctx.restore();
  }
}

cardBg.width = sections[0].cards[0].canvas.width;
cardBg.height = sections[0].cards[0].canvas.height;
const cardBgContext = cardBg.getContext('2d');
cardBgContext.scale(resolution, resolution);
ground(cardBgContext, cardBg.width / resolution, cardBg.height / resolution);

const visible = new Set(sections);
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const group = sections.find(item => item.section === entry.target);
    if (entry.isIntersecting) visible.add(group);
    else visible.delete(group);
  }
  if (!playing) paint();
}, { rootMargin: '160px' });
for (const { section } of sections) observer.observe(section);

function paint() {
  const field = scaleSelect.value === 'field';
  for (const group of visible) {
    const { enemy, cards } = group;
    const [action, phase] = clip(enemy);
    for (const { canvas, ctx, option } of cards) {
      const width = canvas.width / resolution;
      const height = canvas.height / resolution;
      ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (field) ctx.drawImage(cardBg, 0, 0, width, height);
      drawEnemy(ctx, enemy, option, action, phase, width / 2 + (enemy.offset ?? 0), field ? height * .63 : height * .80,
        field ? enemy.field * 1.36 : enemy.close);
    }
  }
  if (!stageSize) return;
  const { width, height } = stageSize;
  const scale = Math.min(width / 610, height / 118, 1.28);
  stageCtx.setTransform(resolution, 0, 0, resolution, 0, 0);
  stageCtx.drawImage(stageBg, 0, 0, width, height);
  for (const [index, { enemy, selected }] of sections.entries()) {
    const [action, phase] = clip(enemy);
    const x = width * (.1 + index * .195);
    drawEnemy(stageCtx, enemy, enemy.options[selected], action, phase, x, height * .77, enemy.field * scale);
  }
}

new ResizeObserver(([{ contentRect }]) => {
  const width = Math.max(1, Math.round(contentRect.width));
  const height = Math.max(1, Math.round(contentRect.height));
  stageSize = { width, height };
  stage.width = stageBg.width = resolution * width;
  stage.height = stageBg.height = resolution * height;
  const ctx = stageBg.getContext('2d');
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  ground(ctx, width, height);
  paint();
}).observe(stage);

function tick(now) {
  if (!playing) return;
  if (!lastFrame) lastFrame = now;
  const elapsed = now - lastFrame;
  if (elapsed >= 27) {
    position = (position + Math.min(.1, elapsed / 1000) * Number(speedSelect.value) / DURATION[mode]) % 1;
    scrub.value = Math.round(position * 1000);
    lastFrame = now;
    paint();
  }
  raf = requestAnimationFrame(tick);
}

function setPlaying(value) {
  playing = value;
  playButton.textContent = playing ? 'Pause' : 'Play';
  cancelAnimationFrame(raf);
  lastFrame = 0;
  if (playing) raf = requestAnimationFrame(tick);
  else paint();
}
playButton.addEventListener('click', () => setPlaying(!playing));
reducedMotion.addEventListener('change', event => setPlaying(!event.matches));
scaleSelect.addEventListener('change', paint);
scrub.addEventListener('input', () => {
  position = Number(scrub.value) / 1000;
  setPlaying(false);
});
for (const button of modeButtons) {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    position = 0;
    scrub.value = '0';
    for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button));
    paint();
  });
}
scrub.value = Math.round(position * 1000);
setPlaying(playing);
paint();
const linkedSection = document.getElementById(window.location.hash.slice(1));
if (linkedSection) requestAnimationFrame(() => linkedSection.scrollIntoView());
