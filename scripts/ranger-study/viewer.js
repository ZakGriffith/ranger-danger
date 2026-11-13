import { drawFlyingArrow, drawRanger as drawRangerArt, getArrowOrigin, RANGER_AIM_HEIGHT } from '../../src/assets/art/ranger';
import { drawRange, drawTarget } from './range.js';

const stage = document.querySelector('#range');
const context = stage.getContext('2d');
const native = document.querySelector('#native');
const views = document.querySelector('#views');
const demoButton = document.querySelector('#demo');
const pauseButton = document.querySelector('#pause');
const speed = document.querySelector('#speed');
const direction = document.querySelector('#direction');
const action = document.querySelector('#action');

const WIDTH = 840;
const HEIGHT = 530;
const RANGER_SCALE = 1.42;
const NATIVE_SCALE = .44;
const FULL_DRAW = .31;
const RELOAD = .36;
const TAU = Math.PI * 2;
const FACINGS = ['east', 'south', 'west', 'north'];
const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

const backdrop = document.createElement('canvas');
backdrop.width = WIDTH;
backdrop.height = HEIGHT;
drawRange(backdrop.getContext('2d'), WIDTH, HEIGHT);
const targets = [
  { x: 192, y: 118, hit: 0 },
  { x: 560, y: 109, hit: 0 },
  { x: 710, y: 278, hit: 0 },
  { x: 641, y: 412, hit: 0 },
  { x: 213, y: 403, hit: 0 },
  { x: 125, y: 268, hit: 0 },
];
const arrows = [];
const keys = new Set();
const pointer = { x: 640, y: 258 };
const player = { x: 420, y: 318, phase: 0, run: 0, aim: 0, view: 'east' };
let playing = true;
let demo = true;
let clock = 0;
let draw = 0;
let reload = 0;
let drawing = false;
let releaseQueued = false;
let shotControl = null;
let freeAim = false;

function setDemo(enabled) {
  demo = enabled;
  demoButton.setAttribute('aria-pressed', String(demo));
  if (!demo) {
    drawing = false;
    releaseQueued = false;
  }
}

function setPlaying(enabled) {
  playing = enabled;
  pauseButton.setAttribute('aria-pressed', String(!playing));
  pauseButton.textContent = playing ? 'Pause' : 'Resume';
}

function reset() {
  Object.assign(player, { x: 420, y: 318, phase: 0, run: 0, aim: 0, view: 'east' });
  Object.assign(pointer, { x: 640, y: 258 });
  arrows.length = 0;
  targets.forEach(target => { target.hit = 0; });
  keys.clear();
  clock = 0;
  draw = 0;
  reload = 0;
  drawing = false;
  releaseQueued = false;
  shotControl = null;
  freeAim = false;
  setPlaying(true);
}

function eventPoint(event) {
  const box = stage.getBoundingClientRect();
  pointer.x = (event.clientX - box.left) * WIDTH / box.width;
  pointer.y = (event.clientY - box.top) * HEIGHT / box.height;
}

function startShot(control) {
  if (shotControl !== null) return;
  if (demo) setDemo(false);
  shotControl = control;
  drawing = true;
  setPlaying(true);
}

function endShot(control) {
  if (shotControl !== control) return;
  shotControl = null;
  releaseQueued = true;
}

stage.addEventListener('pointermove', event => {
  eventPoint(event);
  freeAim = true;
  if (demo) setDemo(false);
});
stage.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  stage.focus({ preventScroll: true });
  stage.setPointerCapture(event.pointerId);
  eventPoint(event);
  freeAim = true;
  startShot(event.pointerId);
});
stage.addEventListener('pointerup', event => endShot(event.pointerId));
stage.addEventListener('pointercancel', event => {
  if (shotControl === event.pointerId) cancelInput();
});
stage.addEventListener('lostpointercapture', event => {
  if (shotControl === event.pointerId) cancelInput();
});
window.addEventListener('keydown', event => {
  if (event.code === 'Space' && event.target.closest?.('button, select')) return;
  if (event.code.startsWith('Arrow') && event.target.closest?.('select')) return;
  if (event.code !== 'Space' && !MOVEMENT_KEYS.has(event.code)) return;
  event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'Space') startShot('keyboard');
  else {
    if (demo) setDemo(false);
    keys.add(event.code);
    setPlaying(true);
  }
});
window.addEventListener('keyup', event => {
  keys.delete(event.code);
  if (event.code === 'Space') endShot('keyboard');
});
function cancelInput() {
  keys.clear();
  shotControl = null;
  drawing = false;
  releaseQueued = false;
}
window.addEventListener('blur', cancelInput);
stage.addEventListener('blur', cancelInput);
demoButton.addEventListener('click', () => {
  if (demo) setDemo(false);
  else {
    reset();
    setDemo(true);
  }
});
pauseButton.addEventListener('click', () => setPlaying(!playing));
document.querySelector('#reset').addEventListener('click', () => {
  reset();
  if (!demo) stage.focus({ preventScroll: true });
});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (reducedMotion.matches) {
  setDemo(false);
  setPlaying(false);
}

function viewForAim(angle, previous) {
  const prior = FACINGS.indexOf(previous) * Math.PI / 2;
  const turn = Math.atan2(Math.sin(angle - prior), Math.cos(angle - prior));
  if (Math.abs(turn) < Math.PI / 4 + .055) return previous;
  return FACINGS[(Math.round(angle / (Math.PI / 2)) + 4) % 4];
}

function currentPose() {
  const recoil = reload > 0 ? Math.max(0, 1 - (RELOAD - reload) / .17) : 0;
  const bob = player.run * (1.8 * Math.cos(player.phase * 2) - .65)
    + (1 - player.run) * .7 * Math.sin(clock * 3.2);
  return {
    view: player.view,
    phase: player.phase,
    run: player.run,
    bob,
    draw,
    recoil,
    angle: player.aim,
    loaded: reload === 0,
  };
}

function shoot(pose) {
  const origin = getArrowOrigin(pose);
  const angle = pose.angle;
  arrows.push({
    x: player.x + origin.x * RANGER_SCALE,
    y: player.y + origin.y * RANGER_SCALE,
    angle,
    speed: 540 + 230 * draw,
    age: 0,
    stuck: false,
  });
  reload = RELOAD;
  draw = 0;
  drawing = false;
  releaseQueued = false;
}

function advanceArrows(delta) {
  for (let index = arrows.length - 1; index >= 0; index--) {
    const arrow = arrows[index];
    arrow.age += delta;
    if (arrow.age > (arrow.stuck ? 1.25 : 2.4) || arrow.x < -55 || arrow.x > WIDTH + 55 || arrow.y < -55 || arrow.y > HEIGHT + 55) {
      arrows.splice(index, 1);
      continue;
    }
    if (arrow.stuck) continue;
    const vx = Math.cos(arrow.angle);
    const vy = Math.sin(arrow.angle);
    const travel = arrow.speed * delta;
    let nearest = travel;
    let struck = null;
    for (const target of targets) {
      const dx = target.x - arrow.x;
      const dy = target.y - arrow.y;
      const along = dx * vx + dy * vy;
      const across = dx * vy - dy * vx;
      if (Math.abs(across) >= 16) continue;
      const halfChord = Math.sqrt(16 ** 2 - across ** 2);
      const entry = Math.max(0, along - halfChord);
      if (along + halfChord >= 0 && entry < nearest) {
        struck = target;
        nearest = entry;
      }
    }
    arrow.x += vx * nearest;
    arrow.y += vy * nearest;
    if (struck) {
      struck.hit = 1;
      arrow.stuck = true;
      arrow.age = 0;
    }
  }
}

function tick(delta) {
  clock += delta;
  reload = Math.max(0, reload - delta);

  let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  let y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
  if (demo && clock % 7.2 > 3.2) {
    x = Math.cos(clock * 1.55);
    y = .55 * Math.sin(clock * 1.55);
  }
  const motion = Math.hypot(x, y);
  const length = Math.max(1, motion);
  const moveSpeed = demo ? 57 : 130;
  player.x = Math.max(83, Math.min(WIDTH - 83, player.x + x / length * moveSpeed * delta));
  player.y = Math.max(125, Math.min(HEIGHT - 44, player.y + y / length * moveSpeed * delta));
  player.run += (Math.min(1, motion * 2) - player.run) * Math.min(1, delta * 13);
  player.phase = (player.phase + player.run * 12.7 * delta) % TAU;

  const pose = currentPose();
  if (demo) player.aim = Math.atan2(Math.sin(clock * 1.02), Math.cos(clock * 1.02));
  else if (freeAim) {
    const aimX = pointer.x - player.x;
    const aimY = pointer.y - (player.y + (pose.bob - RANGER_AIM_HEIGHT) * RANGER_SCALE);
    if (Math.hypot(aimX, aimY) > 2) player.aim = Math.atan2(aimY, aimX);
  } else if (motion && !drawing) player.aim = Math.atan2(y, x);
  player.view = viewForAim(player.aim, player.view);

  if (demo && reload === 0 && clock % 1.65 > 1.13 && !drawing) drawing = true;
  if (demo && draw >= .99) releaseQueued = true;
  if (reload === 0 && drawing) draw = Math.min(1, draw + delta / FULL_DRAW);
  else if (!drawing) draw = Math.max(0, draw - delta * 5);
  if (reload === 0 && releaseQueued && draw >= .36) shoot(currentPose());

  for (const target of targets) target.hit = Math.max(0, target.hit - delta * 3);
  advanceArrows(delta);
}

function drawRanger(ctx, x, y, scale, pose) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  drawRangerArt(ctx, pose);
  ctx.restore();
}

function drawArrow(arrow) {
  const opacity = arrow.stuck ? Math.min(1, (1.25 - arrow.age) * 4) : 1;
  context.save();
  context.translate(arrow.x, arrow.y);
  context.rotate(arrow.angle);
  context.scale(RANGER_SCALE, RANGER_SCALE);
  context.globalAlpha = opacity;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  drawFlyingArrow(context);
  context.restore();
}

function drawReticle(x, y) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = '#eadcaeab';
  context.lineWidth = 1.25;
  context.beginPath();
  context.arc(0, 0, 8, 0, TAU);
  for (let axis = 0; axis < 4; axis++) {
    context.moveTo(11, 0);
    context.lineTo(15, 0);
    context.rotate(Math.PI / 2);
  }
  context.stroke();
  context.restore();
}

function panelContext(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelsWide = Math.round(width * ratio);
  const pixelsHigh = Math.round(height * ratio);
  if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
    canvas.width = pixelsWide;
    canvas.height = pixelsHigh;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.drawImage(backdrop, 320, 188, 270, 165, 0, 0, width, height);
  return { ctx, width, height };
}

function paint(pose) {
  context.drawImage(backdrop, 0, 0);
  const subjects = [
    ...targets.map(target => ({ depth: target.y + 24, draw: () => drawTarget(context, target.x, target.y, target.hit) })),
    { depth: player.y, draw: () => drawRanger(context, player.x, player.y, RANGER_SCALE, pose) },
  ];
  subjects.sort((a, b) => a.depth - b.depth);
  for (const subject of subjects) subject.draw();
  for (const arrow of arrows) drawArrow(arrow);

  if (demo) {
    const distance = 152;
    drawReticle(player.x + Math.cos(pose.angle) * distance,
      player.y + (pose.bob - RANGER_AIM_HEIGHT) * RANGER_SCALE + Math.sin(pose.angle) * distance);
  } else if (freeAim) drawReticle(pointer.x, pointer.y);

  const nativePanel = panelContext(native);
  drawRanger(nativePanel.ctx, nativePanel.width / 2, 65, NATIVE_SCALE, pose);

  const viewPanel = panelContext(views);
  const spacing = viewPanel.width / FACINGS.length;
  const scale = Math.min(.48, spacing / 100);
  for (const [index, view] of FACINGS.entries()) {
    const center = spacing * (index + .5);
    if (view === pose.view) {
      viewPanel.ctx.fillStyle = '#e5ca7e24';
      viewPanel.ctx.fillRect(index * spacing, 0, spacing, viewPanel.height);
    }
    drawRanger(viewPanel.ctx, center, 74, scale, { ...pose, view, angle: index * Math.PI / 2 });
  }

  const degrees = Math.round((pose.angle * 180 / Math.PI + 360) % 360) % 360;
  const facing = pose.view[0].toUpperCase() + pose.view.slice(1);
  const heading = facing + ' · ' + String(degrees).padStart(3, '0') + '°';
  const status = pose.recoil > .05 ? 'Release' : reload > 0 ? 'Reload' : draw > .05 ? 'Drawing' : 'Ready';
  if (direction.textContent !== heading) direction.textContent = heading;
  if (action.textContent !== status) action.textContent = status;
}

let last = performance.now();
function frame(time) {
  const delta = Math.min(.04, (time - last) / 1000);
  last = time;
  if (playing) tick(delta * Number(speed.value));
  paint(currentPose());
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
