import { ARROW_TOWER_DECK_Y, drawArrowTowerBase } from '../../src/assets/art/arrowTower/base';
import { ARROW_TOWER_ART_SCALE } from '../../src/assets/art/arrowTower/textures';
import {
  ARROW_TOWER_ARCHER_SCALE, ARROW_TOWER_RELEASE, drawArrowTowerArcher, getArrowTowerShotOrigin,
} from '../../src/assets/art/arrowTower/archer';
import { drawFlyingArrow, RANGER_AIM_HEIGHT } from '../../src/assets/art/ranger';
import { drawMeadowChunk } from '../../src/assets/art/groundMeadow';
import { makeCanvas } from '../../src/assets/art/canvas';
import { makeHD } from '../../src/assets/art/hd';
import { drawBow, drawPlayer, playerFrameBob, TOWER_ARCHER } from '../../src/assets/art/player';
import { drawArrow } from '../../src/assets/art/projectiles';
import baseOneUrl from '../../src/assets/sprites/tower_base.png?inline';
import baseTwoUrl from '../../src/assets/sprites/arrow_base_1.png?inline';
import baseThreeUrl from '../../src/assets/sprites/arrow_base_2.png?inline';

const TAU = 2 * Math.PI;
const AIM_Y = ARROW_TOWER_DECK_Y - RANGER_AIM_HEIGHT * ARROW_TOWER_ARCHER_SCALE;
const SHOT_LENGTH = .9;
const SHOT_INTERVAL = 1.55;
const ARROW_SPEED = 430;
const ART_WIDTH = 218;
const ART_HEIGHT = 228;
const BASE_CENTER_X = 84;
const BASE_GROUND_Y = 144;

const autoAimButton = document.querySelector('#auto-aim');
const autoFireButton = document.querySelector('#auto-fire');
const pauseButton = document.querySelector('#pause');
const fireButton = document.querySelector('#fire');
const speed = document.querySelector('#speed');
const angleControl = document.querySelector('#angle');
const heading = document.querySelector('#heading');
const directions = [...document.querySelectorAll('[data-aim]')];
const grid = document.querySelector('#tiers');
const template = document.querySelector('#card');

const preference = matchMedia('(prefers-reduced-motion: reduce)');
let autoAim = !preference.matches;
let autoFire = !preference.matches;
let paused = false;
let angle = -.23;
let clock = 0;
let nextAutoShot = .4;
let shotTime = null;
let releasedArrow = null;
let previous;

function makeGround() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 800;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);
  drawMeadowChunk(image.data, canvas.width, -48, 80);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const ground = makeGround();
const oldArrow = makeCanvas(32, drawArrow(0));

function spriteBounds(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = canvas.height - 1; y >= 0; y--) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 24) return y + 1;
    }
  }
  return canvas.height;
}

async function makeCurrentArt(tier, source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const outfit = TOWER_ARCHER[tier];
  const poses = ['up', 'level', 'down'];
  const bodies = Object.fromEntries(poses.map(pose => [
    pose,
    Array.from({ length: 4 }, (_, index) => makeHD(64, drawPlayer('idle' + index, pose, outfit))),
  ]));
  const bows = [false, true].map(shooting => makeHD(64, drawBow(shooting, outfit.tunic)));
  return { image, feet: spriteBounds(image), bodies, bows };
}

function makeTowerBase(tier) {
  const canvas = document.createElement('canvas');
  canvas.width = BASE_CENTER_X * 2;
  canvas.height = BASE_GROUND_Y + 16;
  const ctx = canvas.getContext('2d');
  ctx.translate(BASE_CENTER_X, BASE_GROUND_Y);
  drawArrowTowerBase(ctx, tier);
  return canvas;
}

const cards = [baseOneUrl, baseTwoUrl, baseThreeUrl].map((source, tier) => {
  const card = template.content.firstElementChild.cloneNode(true);
  const art = card.querySelector('.art');
  const field = card.querySelector('.field');
  const label = 'Level ' + (tier + 1);
  card.querySelector('h2').textContent = label;
  art.setAttribute('aria-label', label + ' animated arrow tower');
  field.setAttribute('aria-label', label + ' original and illustrated towers at approximate game scale on Meadow terrain');
  const item = {
    tier, art, field,
    base: makeTowerBase(tier),
    current: null,
  };
  makeCurrentArt(tier, source).then(current => {
    item.current = current;
    if (paused) paint();
  });
  grid.append(card);
  return item;
});

function canvasContext(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  const pixelsWide = Math.max(1, Math.round(width * ratio));
  const pixelsHigh = Math.max(1, Math.round(height * ratio));
  if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
    canvas.width = pixelsWide;
    canvas.height = pixelsHigh;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function drawArt(ctx, card, x, y, scale, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.drawImage(card.base, -BASE_CENTER_X, -BASE_GROUND_Y);
  ctx.save();
  ctx.translate(0, ARROW_TOWER_DECK_Y);
  drawArrowTowerArcher(ctx, card.tier, angle, phase, clock);
  ctx.restore();
  if (releasedArrow && releasedArrow.age < .64) {
    const { x, y, heading: arrowHeading, age } = releasedArrow;
    const travel = age * ARROW_SPEED;
    ctx.translate(x + Math.cos(arrowHeading) * travel, ARROW_TOWER_DECK_Y + y + Math.sin(arrowHeading) * travel);
    ctx.rotate(arrowHeading);
    ctx.scale(ARROW_TOWER_ARCHER_SCALE, ARROW_TOWER_ARCHER_SCALE);
    ctx.lineJoin = ctx.lineCap = 'round';
    drawFlyingArrow(ctx);
  }
  ctx.restore();
}

function drawCurrent(ctx, card, x, groundY) {
  if (!card.current) return;
  const { image, feet, bodies, bows } = card.current;
  const topY = groundY - feet * .5;
  const standY = topY + image.height * .25 - 24;
  const towardLeft = Math.cos(angle) < 0;
  const sine = Math.sin(angle);
  const cosine = Math.cos(angle);
  const pose = sine < -.45 ? 'up' : sine > .45 ? 'down' : 'level';
  const behind = sine < -.3;
  const idleFrame = Math.floor(clock * 4) % 4;
  const bob = playerFrameBob('ta0_idle_' + idleFrame);
  const offset = 6 + Math.abs(cosine) * 5;
  const bowX = x + cosine * offset;
  const bowY = standY + bob + sine * offset + (pose === 'up' ? 0 : pose === 'down' ? 4 : 2);
  const firing = releasedArrow && releasedArrow.age < 2 / 14;
  const bow = bows[Number(firing && releasedArrow.age < 1 / 14)];
  function drawBowAndArrow() {
    ctx.save();
    ctx.translate(bowX, bowY);
    ctx.rotate(angle);
    ctx.scale(1, towardLeft ? -1 : 1);
    ctx.drawImage(bow, -8, -16, 32, 32);
    if (!firing) ctx.drawImage(oldArrow, -1, -16, 32, 32);
    ctx.restore();
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, x - image.width * .25, topY, image.width * .5, image.height * .5);
  if (behind) drawBowAndArrow();
  ctx.save();
  ctx.translate(x, standY);
  if (towardLeft) ctx.scale(-1, 1);
  ctx.drawImage(bodies[pose][idleFrame], -16, -16, 32, 32);
  ctx.restore();
  if (!behind) drawBowAndArrow();
  ctx.restore();
}

function paint() {
  const phase = shotTime === null ? 0 : (clock - shotTime) / SHOT_LENGTH;
  for (const card of cards) {
    const art = canvasContext(card.art);
    const scale = Math.min(art.width / ART_WIDTH, art.height / ART_HEIGHT);
    drawArt(art.ctx, card, art.width * .5, art.height * .83, scale, phase);

    const field = canvasContext(card.field);
    field.ctx.drawImage(ground, 20 + card.tier * 31, 120 + card.tier * 19, field.width * 2, field.height * 2, 0, 0, field.width, field.height);
    field.ctx.fillStyle = '#f4ead55e';
    field.ctx.fillRect(field.width * .5, 0, 1, field.height);
    drawCurrent(field.ctx, card, field.width * .25, field.height * .9);
    field.ctx.save();
    field.ctx.beginPath();
    field.ctx.rect(field.width * .5 + 1, 0, field.width * .5 - 1, field.height);
    field.ctx.clip();
    drawArt(field.ctx, card, field.width * .75, field.height * .9, ARROW_TOWER_ART_SCALE, phase);
    field.ctx.restore();
  }

  const degrees = (Math.round(angle * 180 / Math.PI) + 360) % 360;
  angleControl.value = degrees;
  heading.value = degrees + '°';
  for (const button of directions) button.setAttribute('aria-pressed', String(Number(button.dataset.aim) === degrees));
}

function setAutoAim(enabled) {
  autoAim = enabled;
  autoAimButton.setAttribute('aria-pressed', String(enabled));
}

function setAutoFire(enabled) {
  autoFire = enabled;
  autoFireButton.setAttribute('aria-pressed', String(enabled));
  if (enabled) nextAutoShot = clock + .2;
}

function setPaused(enabled) {
  paused = enabled;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
}

function manualAim(nextAngle) {
  setAutoAim(false);
  angle = nextAngle;
  if (paused) paint();
}

function aimAtPointer(event, canvas) {
  const box = canvas.getBoundingClientRect();
  const scale = Math.min(box.width / ART_WIDTH, box.height / ART_HEIGHT);
  const x = event.clientX - box.left - box.width * .5;
  const y = event.clientY - box.top - (box.height * .83 + AIM_Y * scale);
  if (Math.hypot(x, y) > 5) manualAim(Math.atan2(y, x));
}

function fire() {
  if (shotTime !== null) return;
  shotTime = clock;
  nextAutoShot = clock + SHOT_INTERVAL;
  setPaused(false);
}

autoAimButton.addEventListener('click', () => setAutoAim(!autoAim));
autoFireButton.addEventListener('click', () => setAutoFire(!autoFire));
pauseButton.addEventListener('click', () => setPaused(!paused));
fireButton.addEventListener('click', fire);
angleControl.addEventListener('input', () => manualAim(Number(angleControl.value) * Math.PI / 180));
for (const button of directions) {
  button.addEventListener('click', () => manualAim(Number(button.dataset.aim) * Math.PI / 180));
}
for (const { art } of cards) {
  art.addEventListener('pointermove', event => aimAtPointer(event, art));
  art.addEventListener('click', event => {
    aimAtPointer(event, art);
    fire();
  });
  art.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (!event.repeat) fire();
  });
}

preference.addEventListener('change', ({ matches }) => {
  if (!matches) return;
  setAutoAim(false);
  setAutoFire(false);
});

function advance(delta) {
  clock += delta;
  if (autoAim) angle = (angle + delta * 1.03) % TAU;
  if (releasedArrow) releasedArrow.age += delta;
  if (autoFire && clock >= nextAutoShot && shotTime === null) fire();
  if (shotTime === null) return;
  const elapsed = clock - shotTime;
  if (elapsed >= SHOT_LENGTH * ARROW_TOWER_RELEASE && elapsed - delta < SHOT_LENGTH * ARROW_TOWER_RELEASE) {
    const tip = getArrowTowerShotOrigin(angle, clock);
    releasedArrow = { ...tip, heading: angle, age: 0 };
  }
  if (elapsed >= SHOT_LENGTH) shotTime = null;
}

function frame(now) {
  const delta = previous === undefined ? 0 : Math.min(.04, (now - previous) / 1000);
  previous = now;
  if (!paused) {
    advance(delta * Number(speed.value));
    paint();
  }
  requestAnimationFrame(frame);
}

const observer = new ResizeObserver(paint);
for (const { art, field } of cards) {
  observer.observe(art);
  observer.observe(field);
}
setAutoAim(autoAim);
setAutoFire(autoFire);
paint();
requestAnimationFrame(frame);
