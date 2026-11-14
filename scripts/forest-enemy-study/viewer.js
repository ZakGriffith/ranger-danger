import { drawForestChunk } from '../../src/assets/art/groundForest';
import { DURATION, ENEMIES, paintEnemy } from './study.js';

const grid = document.querySelector('#enemies');
const template = document.querySelector('#card');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
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
const ground = terrainContext.createImageData(terrain.width, terrain.height);
drawForestChunk(ground.data, terrain.width, 80, 110);
terrainContext.putImageData(ground, 0, 0);

const cards = ENEMIES.map(enemy => {
  const card = template.content.firstElementChild.cloneNode(true);
  const art = card.querySelector('.art');
  const field = card.querySelector('.field');
  card.querySelector('h2').textContent = enemy.name;
  card.querySelector('.actions').textContent = enemy.actions;
  art.setAttribute('aria-label', `${enemy.name} animation close-up`);
  field.setAttribute('aria-label', `${enemy.name} at approximate game scale on Forest terrain`);
  grid.append(card);
  return { enemy, art, artCtx: art.getContext('2d'), field, fieldCtx: field.getContext('2d') };
});

function paint() {
  for (const { enemy, art, artCtx, field, fieldCtx } of cards) {
    const [closeWidth, closeHeight] = enemy.close;
    const scale = Math.min(art.width / closeWidth, art.height / closeHeight);
    artCtx.clearRect(0, 0, art.width, art.height);
    paintEnemy(artCtx, enemy, mode, phase, art.width * .46, art.height * .84, scale);
    fieldCtx.drawImage(terrain, 2, 23, field.width, field.height, 0, 0, field.width, field.height);
    const fieldGround = field.height * (enemy.charge ? .9 : .63);
    paintEnemy(fieldCtx, enemy, mode, phase, field.width * .43, fieldGround, enemy.gameScale * 2);
  }
  phaseControl.value = Math.round(phase * 100);
}

const observer = new ResizeObserver(() => {
  const ratio = window.devicePixelRatio || 1;
  for (const { art } of cards) {
    art.width = Math.max(1, Math.round(art.clientWidth * ratio));
    art.height = Math.max(1, Math.round(art.clientHeight * ratio));
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
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  paint();
}

for (const button of modeButtons) button.addEventListener('click', () => setMode(button.dataset.mode));
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
paint();
requestAnimationFrame(frame);
