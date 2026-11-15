import { CANNON_TOWER_ART_SCALE, CANNON_TOWER_DECK_Y, drawCannonTowerBase } from '../../src/assets/art/cannonTower/base';
import { CANNON_TOWER_RELEASE, drawCannonTowerGun, getCannonTowerMuzzle } from '../../src/assets/art/cannonTower/gun';
import { drawForgeCannonGun, getForgeCannonMuzzle } from '../../src/assets/art/cannonTower/forgeGun';
import { drawFieldGun, getFieldGunMuzzle } from '../../src/assets/art/cannonTower/fieldGun';
import { drawTwinCannonTowerGun, getTwinCannonTowerMuzzle } from '../../src/assets/art/cannonTower/twinGun';
import { drawMeadowChunk } from '../../src/assets/art/groundMeadow';
import { makeHD } from '../../src/assets/art/hd';
import {
  CANNON_BARREL_HEIGHT, CANNON_GROUND_Y, CANNON_HEIGHT_Y, CANNON_MUZZLE_DISTANCE, CANNON_PIVOT_Y, CANNON_SIZE,
  drawCannon, drawCannonFlash,
} from '../../src/assets/art/cannon';
import { CANNON_MOUNT_SIZE, drawCannonMount } from '../../src/assets/art/cannonMount';
import baseOneUrl from '../../src/assets/sprites/cannon_base.png?inline';
import baseTwoUrl from '../../src/assets/sprites/cannon_base_1.png?inline';
import baseThreeUrl from '../../src/assets/sprites/cannon_base_2.png?inline';

const TAU = Math.PI * 2;
const ART_WIDTH = 228;
const ART_HEIGHT = 212;
const GROUND_FRACTION = .82;
const BASE_CENTER_X = 80;
const BASE_GROUND_Y = 130;
const SHOT_LENGTH = .84;
const SHOT_INTERVAL = 1.8;
const FLIGHT_TIME = .58;
const IMPACT_TIME = .28;
const LEGACY_FRAMES = 72;
const SPEED_MULTIPLIERS = [1, 1.12, 1.25];
const MODELS = [
  { label: 'Current Cannon', draw: drawCannonTowerGun, muzzle: getCannonTowerMuzzle },
  { label: 'Iron Bombard', draw: drawForgeCannonGun, muzzle: getForgeCannonMuzzle },
  { label: 'Field Gun', draw: drawFieldGun, muzzle: getFieldGunMuzzle },
  { label: 'Twin Cannon', draw: drawTwinCannonTowerGun, muzzle: getTwinCannonTowerMuzzle },
];

const grid = document.querySelector('#tiers');
const template = document.querySelector('#card');
const autoAimButton = document.querySelector('#auto-aim');
const autoFireButton = document.querySelector('#auto-fire');
const pauseButton = document.querySelector('#pause');
const fireButton = document.querySelector('#fire');
const angleControl = document.querySelector('#angle');
const heading = document.querySelector('#heading');
const speed = document.querySelector('#speed');
const levelControl = document.querySelector('#level');
const directions = [...document.querySelectorAll('[data-aim]')];
const preference = matchMedia('(prefers-reduced-motion: reduce)');

let autoAim = !preference.matches;
let autoFire = !preference.matches;
let paused = false;
let angle = -.15;
let clock = 0;
let nextShot = .4;
let shotStart = null;
let shotIndex = 0;
let projectile = null;
let previous;

const ground = document.createElement('canvas');
ground.width = ground.height = 800;
const groundCtx = ground.getContext('2d');
const groundImage = groundCtx.createImageData(ground.width, ground.height);
drawMeadowChunk(groundImage.data, ground.width, -48, 80);
groundCtx.putImageData(groundImage, 0, 0);

const oldMount = makeHD(CANNON_MOUNT_SIZE, drawCannonMount, { outline: false });
const oldFlash = makeHD(32, drawCannonFlash, { outline: false });
const oldBarrels = new Map();

function oldBarrel(heading) {
  const yaw = Math.atan2(Math.sin(heading) / CANNON_GROUND_Y, Math.cos(heading));
  const index = (Math.round(yaw / TAU * LEGACY_FRAMES) + LEGACY_FRAMES) % LEGACY_FRAMES;
  const cached = oldBarrels.get(index);
  if (cached) return cached;
  const actualYaw = index / LEGACY_FRAMES * TAU;
  const canvas = makeHD(CANNON_SIZE, drawCannon(actualYaw), { outline: false });
  const barrel = { canvas, yaw: actualYaw };
  oldBarrels.set(index, barrel);
  return barrel;
}

async function loadOriginalBase(source, tier) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let feet = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b, alpha] = pixels.data.subarray(i, i + 4);
    if (tier === 0 && r > 180 && g < 100 && b > 180) pixels.data[i + 3] = 0;
    else if (alpha > 24) feet = Math.floor(i / 4 / canvas.width) + 1;
  }
  if (tier === 0) ctx.putImageData(pixels, 0, 0);
  return { canvas, feet };
}

function paintBase(tier) {
  const canvas = document.createElement('canvas');
  canvas.width = BASE_CENTER_X * 2;
  canvas.height = BASE_GROUND_Y + 18;
  const ctx = canvas.getContext('2d');
  ctx.translate(BASE_CENTER_X, BASE_GROUND_Y);
  drawCannonTowerBase(ctx, tier);
  return canvas;
}

const groups = [baseOneUrl, baseTwoUrl, baseThreeUrl].map((source, tier) => {
  const group = document.createElement('section');
  const title = document.createElement('p');
  const modelGrid = document.createElement('div');
  const level = 'Level ' + (tier + 1);
  group.className = 'tier-group';
  group.dataset.tier = tier;
  group.setAttribute('aria-label', level);
  title.className = 'tier-title';
  title.textContent = level;
  modelGrid.className = 'grid';
  group.append(title, modelGrid);

  const item = { tier, element: group, base: paintBase(tier), original: null, cards: [] };
  item.cards = MODELS.map((model, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const art = card.querySelector('.art');
    const field = card.querySelector('.field');
    card.querySelector('h2').textContent = model.label;
    art.setAttribute('aria-label', level + ' ' + model.label + ', animated preview');
    field.setAttribute('aria-label', level + ' ' + model.label + ' and the original pixel art at approximate game scale');
    modelGrid.append(card);
    return { model, art, field, index };
  });
  loadOriginalBase(source, tier).then(original => {
    item.original = original;
    if (paused) paint();
  });
  grid.append(group);
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

function oval(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawImpact(ctx, tier, x, y, age) {
  const p = age / IMPACT_TIME;
  const spread = (10 + 15 * p) * (1 + tier * .12);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  oval(ctx, x, y, spread, spread * .29, '#3b2c2b');
  for (let i = 0; i < 6; i++) {
    const direction = i * TAU / 6 - .3;
    const px = x + Math.cos(direction) * spread * .66;
    const py = y + Math.sin(direction) * spread * .18 - p * 9;
    oval(ctx, px, py, 4 + p * 2, 2 + p, i % 2 ? '#ba9165' : '#8c674b');
  }
  ctx.restore();
}

function drawRound(ctx, tier, x, y, onGroundX, onGroundY) {
  const radius = 10 + tier;
  oval(ctx, onGroundX, onGroundY, radius * 1.25, radius * .4, '#1e24287a');
  oval(ctx, x, y, radius, radius, '#26252f');
  const metal = ctx.createRadialGradient(
    x - radius * .32, y - radius * .38, radius * .05,
    x, y, radius * .91,
  );
  metal.addColorStop(0, '#b0b9bc');
  metal.addColorStop(.42, '#727e8b');
  metal.addColorStop(1, '#3c414f');
  oval(ctx, x, y, radius * .86, radius * .86, metal);
  oval(ctx, x - radius * .30, y - radius * .37, radius * .22, radius * .12, '#cad0ce');
}

function drawFlight(ctx, tier, shot, launch, reach) {
  const { heading: angle, age } = shot;
  const duration = FLIGHT_TIME / SPEED_MULTIPLIERS[tier];
  const x = Math.cos(angle) * 99 * reach;
  const y = Math.sin(angle) * 31 * reach;
  if (age > duration) {
    if (age < duration + IMPACT_TIME) drawImpact(ctx, tier, x, y, age - duration);
    return;
  }
  const p = age / duration;
  const lift = Math.max(16 * reach, (y - launch.y - Math.sin(angle) * Math.abs(x - launch.x)) / 4);
  drawRound(ctx, tier, launch.x + (x - launch.x) * p, launch.y + (y - launch.y) * p - 4 * lift * p * (1 - p), x * p, y * p);
}

function drawIllustrated(ctx, group, card, x, y, scale, cycle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.drawImage(group.base, -BASE_CENTER_X, -BASE_GROUND_Y);
  ctx.save();
  ctx.translate(0, CANNON_TOWER_DECK_Y);
  card.model.draw(ctx, group.tier, angle, cycle, shotIndex);
  ctx.restore();
  if (projectile) drawFlight(ctx, group.tier, projectile, projectile.launches[group.tier][card.index], 1);
  ctx.restore();
}

function drawOriginal(ctx, group, x, groundY) {
  if (!group.original) return;
  const { canvas, feet } = group.original;
  const baseY = -feet * .5;
  const pivot = baseY + canvas.height * .25 + CANNON_PIVOT_Y;
  const { canvas: barrel, yaw } = oldBarrel(angle);
  ctx.save();
  ctx.translate(x, groundY);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, -canvas.width * .25, baseY, canvas.width * .5, canvas.height * .5);
  ctx.drawImage(oldMount, -32, pivot - 32, 64, 64);
  ctx.drawImage(barrel, -32, pivot - 32, 64, 64);
  if (projectile && projectile.age < .12) {
    const shotYaw = oldBarrel(projectile.heading).yaw;
    const dx = Math.cos(shotYaw);
    const dy = Math.sin(shotYaw) * CANNON_GROUND_Y;
    const muzzleX = CANNON_MUZZLE_DISTANCE * .5 * dx;
    const muzzleY = pivot + .5 * (CANNON_MUZZLE_DISTANCE * dy - CANNON_BARREL_HEIGHT * CANNON_HEIGHT_Y);
    ctx.save();
    ctx.translate(muzzleX, muzzleY);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.globalAlpha = 1 - projectile.age / .12;
    ctx.drawImage(oldFlash, -4, -8, 16, 16);
    ctx.restore();
  }
  ctx.restore();
}

function paint() {
  const cycle = shotStart === null ? 0 : (clock - shotStart) / SHOT_LENGTH;
  for (const group of groups) {
    if (group.element.hidden) continue;
    for (const card of group.cards) {
      const art = canvasContext(card.art);
      const scale = Math.min(art.width / ART_WIDTH, art.height / ART_HEIGHT);
      drawIllustrated(art.ctx, group, card, art.width * .5, art.height * GROUND_FRACTION, scale, cycle);

      const field = canvasContext(card.field);
      const sourceX = 20 + group.tier * 31;
      const sourceY = 120 + group.tier * 19;
      const crop = Math.min(2, (ground.width - sourceX) / field.width, (ground.height - sourceY) / field.height);
      field.ctx.drawImage(ground, sourceX, sourceY, field.width * crop, field.height * crop, 0, 0, field.width, field.height);
      field.ctx.fillStyle = '#f4ead55e';
      field.ctx.fillRect(field.width * .5, 0, 1, field.height);
      drawOriginal(field.ctx, group, field.width * .25, field.height * .78);
      field.ctx.save();
      field.ctx.beginPath();
      field.ctx.rect(field.width * .5 + 1, 0, field.width * .5 - 1, field.height);
      field.ctx.clip();
      drawIllustrated(field.ctx, group, card, field.width * .75, field.height * .78, CANNON_TOWER_ART_SCALE, cycle);
      field.ctx.restore();
    }
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
  if (enabled) nextShot = clock + .2;
}

function setPaused(enabled) {
  paused = enabled;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
}

function aim(nextAngle) {
  setAutoAim(false);
  angle = nextAngle;
  if (paused) paint();
}

function aimAtPointer(event, canvas) {
  const box = canvas.getBoundingClientRect();
  const scale = Math.min(box.width / ART_WIDTH, box.height / ART_HEIGHT);
  const x = event.clientX - box.left - box.width * .5;
  const y = event.clientY - box.top - (box.height * GROUND_FRACTION + CANNON_TOWER_DECK_Y * scale);
  if (Math.hypot(x, y) > 5) aim(Math.atan2(y, x));
}

function fire() {
  setPaused(false);
  if (shotStart !== null) return;
  shotStart = clock;
  nextShot = clock + SHOT_INTERVAL;
}

function showLevel() {
  const level = levelControl.value;
  grid.dataset.level = level;
  for (const { tier, element } of groups) {
    element.hidden = level !== 'all' && tier + 1 !== Number(level);
  }
  paint();
}

autoAimButton.addEventListener('click', () => setAutoAim(!autoAim));
autoFireButton.addEventListener('click', () => setAutoFire(!autoFire));
pauseButton.addEventListener('click', () => setPaused(!paused));
fireButton.addEventListener('click', fire);
levelControl.addEventListener('change', showLevel);
angleControl.addEventListener('input', () => aim(Number(angleControl.value) * Math.PI / 180));
for (const button of directions) {
  button.addEventListener('click', () => aim(Number(button.dataset.aim) * Math.PI / 180));
}
const cards = groups.flatMap(({ cards }) => cards);
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
  if (autoAim) angle = (angle + delta * 1.05) % TAU;
  if (projectile) projectile.age += delta;
  if (autoFire && clock >= nextShot && shotStart === null) fire();
  if (shotStart === null) return;
  const elapsed = clock - shotStart;
  const releaseTime = SHOT_LENGTH * CANNON_TOWER_RELEASE;
  if (elapsed >= releaseTime && elapsed - delta < releaseTime) {
    projectile = {
      heading: angle,
      age: elapsed - releaseTime,
      launches: groups.map(({ tier, cards }) => cards.map(({ model }) => {
        const muzzle = model.muzzle(tier, angle, CANNON_TOWER_RELEASE, shotIndex);
        return { x: muzzle.x, y: muzzle.y + CANNON_TOWER_DECK_Y };
      })),
    };
  }
  if (elapsed >= SHOT_LENGTH) {
    shotStart = null;
    shotIndex++;
  }
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
heading.setAttribute('aria-live', 'off');
setAutoAim(autoAim);
setAutoFire(autoFire);
showLevel();
requestAnimationFrame(frame);
