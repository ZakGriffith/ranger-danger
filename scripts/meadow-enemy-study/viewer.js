import { drawMeadowChunk } from '../../src/assets/art/groundMeadow';
import { DURATION, ENEMIES, paintEnemy, poseAt } from './study.js';

const grid = document.querySelector('#enemies');
const template = document.querySelector('#card');
const move = document.querySelector('#move');
const attack = document.querySelector('#attack');
const play = document.querySelector('#play');
const speed = document.querySelector('#speed');
const phaseControl = document.querySelector('#phase');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let mode = 'move';
let phase = 0;
let playing = !preference.matches;
let previous;

const terrain = document.createElement('canvas');
terrain.width = terrain.height = 256;
const terrainContext = terrain.getContext('2d');
const ground = terrainContext.createImageData(256, 256);
drawMeadowChunk(ground.data, 256, 80, 110);
terrainContext.putImageData(ground, 0, 0);

const cards = ENEMIES.map(enemy => {
  const card = template.content.firstElementChild.cloneNode(true);
  const art = card.querySelector('.art');
  const field = card.querySelector('.field');
  const fieldCtx = field.getContext('2d');
  card.querySelector('h2').textContent = enemy.name;
  card.querySelector('.actions').textContent = enemy.move + ' · ' + enemy.attack;
  art.setAttribute('aria-label', enemy.name + ' animation close-up');
  field.setAttribute('aria-label', enemy.name + ' at approximate game scale on Meadow terrain');
  grid.append(card);
  return { enemy, art, artCtx: art.getContext('2d'), field, fieldCtx };
});

function paint() {
  const pose = poseAt(mode, phase);
  for (const { enemy, art, artCtx, field, fieldCtx } of cards) {
    const scale = Math.min(art.width / 174, art.height / 122) * enemy.scale;
    artCtx.clearRect(0, 0, art.width, art.height);
    paintEnemy(artCtx, enemy, pose, art.width * .46, art.height * .74, scale);
    fieldCtx.drawImage(terrain, 18, 20, field.width * 2, field.height * 2, 0, 0, field.width, field.height);
    paintEnemy(fieldCtx, enemy, pose, 48, enemy.width > 50 ? 67 : 49, enemy.width / 100);
  }
  phaseControl.value = Math.round(phase * 100);
}

const observer = new ResizeObserver(() => {
  for (const { art } of cards) {
    const ratio = window.devicePixelRatio || 1;
    art.width = Math.round(art.clientWidth * ratio);
    art.height = Math.round(art.clientHeight * ratio);
  }
  paint();
});
cards.forEach(({ art }) => observer.observe(art));

function setPlaying(next) {
  playing = next;
  play.textContent = playing ? 'Pause' : 'Play';
}
function setMode(next) {
  mode = next;
  phase = 0;
  move.setAttribute('aria-pressed', String(mode === 'move'));
  attack.setAttribute('aria-pressed', String(mode === 'attack'));
  paint();
}
move.addEventListener('click', () => setMode('move'));
attack.addEventListener('click', () => setMode('attack'));
play.addEventListener('click', () => setPlaying(!playing));
phaseControl.addEventListener('input', () => {
  setPlaying(false);
  phase = Number(phaseControl.value) / 100;
  paint();
});
preference.addEventListener('change', ({ matches }) => {
  if (matches) setPlaying(false);
});

function frame(now) {
  const delta = previous === undefined ? 0 : Math.min(.04, (now - previous) / 1000);
  previous = now;
  if (playing) {
    phase = (phase + delta * Number(speed.value) / DURATION[mode]) % 1;
    paint();
  }
  requestAnimationFrame(frame);
}
setPlaying(playing);
requestAnimationFrame(frame);
