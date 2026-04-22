const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');

// Seeded random
const rand = (s) => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };

// --- Background gradient ---
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, '#0a1628');
bg.addColorStop(0.4, '#0d1f1a');
bg.addColorStop(0.7, '#122010');
bg.addColorStop(1, '#0a1a08');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// --- Stars ---
for (let i = 0; i < 80; i++) {
  const x = rand(i * 7.3) * W;
  const y = rand(i * 3.1) * H * 0.5;
  const r = rand(i * 11.7) * 1.5 + 0.5;
  const a = rand(i * 2.9) * 0.4 + 0.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(200,220,255,${a})`;
  ctx.fill();
}

// --- Ground ---
const groundY = H * 0.62;
const ground = ctx.createLinearGradient(0, groundY, 0, H);
ground.addColorStop(0, '#2a5a1a');
ground.addColorStop(0.3, '#1e4a14');
ground.addColorStop(1, '#143a0c');
ctx.fillStyle = ground;
ctx.fillRect(0, groundY, W, H - groundY);

// Grass blades
for (let i = 0; i < 200; i++) {
  const x = rand(i * 4.7) * W;
  const h = rand(i * 9.1) * 18 + 6;
  const lean = (rand(i * 5.3) - 0.5) * 8;
  ctx.strokeStyle = `rgba(${Math.floor(50 + rand(i*2.1)*40)}, ${Math.floor(100 + rand(i*3.3)*60)}, ${Math.floor(20 + rand(i*1.7)*30)}, 0.6)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + lean * 0.5, groundY - h * 0.6, x + lean, groundY - h);
  ctx.stroke();
}

// --- Trees ---
function drawTree(x, y, size, shade) {
  ctx.fillStyle = `rgb(${Math.floor(30+shade*10)},${Math.floor(20+shade*5)},${Math.floor(15+shade*5)})`;
  ctx.fillRect(x - size*0.08, y - size*0.1, size*0.16, size*0.3);
  for (let i = 0; i < 3; i++) {
    const ly = y - size*0.1 - i * size*0.25;
    const lw = size * (0.5 - i*0.1);
    const lh = size * 0.35;
    ctx.fillStyle = `rgba(${Math.floor(20+shade*15+i*8)},${Math.floor(50+shade*20+i*12)},${Math.floor(15+shade*8+i*5)},${0.7+shade*0.15})`;
    ctx.beginPath();
    ctx.moveTo(x - lw, ly);
    ctx.lineTo(x, ly - lh);
    ctx.lineTo(x + lw, ly);
    ctx.closePath();
    ctx.fill();
  }
}
for (let i = 0; i < 12; i++) {
  drawTree(rand(i*6.1) * W, groundY + 5, 40 + rand(i*8.3) * 30, 0.3);
}
drawTree(60, groundY + 8, 90, 0.8);
drawTree(150, groundY + 3, 70, 0.6);
drawTree(W - 80, groundY + 6, 85, 0.7);
drawTree(W - 170, groundY + 4, 65, 0.5);

// --- Dirt path ---
ctx.strokeStyle = '#3a2a18';
ctx.lineWidth = 28;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(0, groundY + 50);
ctx.quadraticCurveTo(W*0.3, groundY + 30, W*0.5, groundY + 55);
ctx.quadraticCurveTo(W*0.7, groundY + 75, W, groundY + 45);
ctx.stroke();
ctx.strokeStyle = '#4a3a24';
ctx.lineWidth = 18;
ctx.stroke();

// --- Tower ---
function drawTower(tx, ty) {
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(tx-20, ty-5, 40, 25);
  ctx.fillStyle = '#6a5a48';
  ctx.fillRect(tx-18, ty-3, 36, 21);
  ctx.fillStyle = '#7a6a54';
  ctx.fillRect(tx-16, ty-50, 32, 50);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#8a7a62';
    ctx.fillRect(tx - 16 + i*10, ty - 58, 6, 10);
  }
  ctx.fillStyle = '#ffd040';
  ctx.shadowColor = '#ffd040';
  ctx.shadowBlur = 8;
  ctx.fillRect(tx-4, ty-38, 8, 10);
  ctx.shadowBlur = 0;
}
drawTower(240, groundY + 5);
drawTower(W - 260, groundY + 5);

// --- Enemies ---
function drawEnemy(ex, ey, size) {
  ctx.fillStyle = 'rgba(20,10,10,0.7)';
  ctx.beginPath();
  ctx.arc(ex, ey - size*0.5, size*0.4, 0, Math.PI*2);
  ctx.fill();
  ctx.fillRect(ex - size*0.2, ey - size*0.3, size*0.4, size*0.4);
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff2020';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(ex - size*0.12, ey - size*0.55, 2.5, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex + size*0.12, ey - size*0.55, 2.5, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
drawEnemy(W - 100, groundY + 10, 30);
drawEnemy(W - 50, groundY + 15, 25);
drawEnemy(W - 130, groundY + 20, 22);

// --- Ranger ---
function drawRanger(rx, ry) {
  ctx.fillStyle = '#2a6a2a';
  ctx.fillRect(rx-8, ry-30, 16, 24);
  ctx.fillStyle = '#ddb89a';
  ctx.beginPath();
  ctx.arc(rx, ry-38, 9, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#1a5a20';
  ctx.beginPath();
  ctx.arc(rx, ry-40, 10, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#8a6a40';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(rx+14, ry-28, 16, -Math.PI*0.4, Math.PI*0.4);
  ctx.stroke();
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx+14 + 16*Math.cos(-Math.PI*0.4), ry-28 + 16*Math.sin(-Math.PI*0.4));
  ctx.lineTo(rx+10, ry-28);
  ctx.lineTo(rx+14 + 16*Math.cos(Math.PI*0.4), ry-28 + 16*Math.sin(Math.PI*0.4));
  ctx.stroke();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx+10, ry-28);
  ctx.lineTo(rx+36, ry-28);
  ctx.stroke();
  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  ctx.moveTo(rx+38, ry-28);
  ctx.lineTo(rx+33, ry-31);
  ctx.lineTo(rx+33, ry-25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a3020';
  ctx.fillRect(rx-6, ry-6, 5, 12);
  ctx.fillRect(rx+1, ry-6, 5, 12);
}
drawRanger(W*0.42, groundY + 8);

// --- Coins ---
function drawCoin(cx, cy, r) {
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#ffea60';
  ctx.beginPath();
  ctx.arc(cx - r*0.2, cy - r*0.2, r*0.4, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
drawCoin(380, groundY + 40, 6);
drawCoin(520, groundY + 60, 5);
drawCoin(460, groundY + 35, 7);
drawCoin(600, groundY + 50, 5);

// --- Stone walls ---
function drawWall(wx, wy) {
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(wx, wy, 18, 14);
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(wx+1, wy+1, 7, 5);
  ctx.fillRect(wx+10, wy+1, 7, 5);
  ctx.fillRect(wx+5, wy+8, 8, 5);
}
drawWall(270, groundY + 8);
drawWall(290, groundY + 8);
drawWall(310, groundY + 8);

// --- Arrow projectile ---
ctx.strokeStyle = '#fff';
ctx.lineWidth = 2;
ctx.shadowColor = '#7cc4ff';
ctx.shadowBlur = 4;
ctx.beginPath();
ctx.moveTo(W*0.48, groundY - 22);
ctx.lineTo(W*0.62, groundY - 15);
ctx.stroke();
ctx.strokeStyle = 'rgba(124,196,255,0.4)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W*0.44, groundY - 24);
ctx.lineTo(W*0.48, groundY - 22);
ctx.stroke();
ctx.shadowBlur = 0;

// --- Title ---
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Glow passes
ctx.shadowColor = '#7cc4ff';
ctx.shadowBlur = 30;
ctx.font = 'bold 72px sans-serif';
ctx.fillStyle = '#7cc4ff';
ctx.fillText('RANGER DANGER', W/2, H * 0.22);
ctx.shadowBlur = 15;
ctx.fillText('RANGER DANGER', W/2, H * 0.22);
ctx.shadowBlur = 0;

// Solid text
ctx.fillStyle = '#fff';
ctx.fillText('RANGER DANGER', W/2, H * 0.22);

// Subtitle
ctx.font = '600 24px sans-serif';
ctx.fillStyle = '#a0c8e0';
ctx.fillText('BUILD  \u00B7  DEFEND  \u00B7  SURVIVE', W/2, H * 0.34);

// --- Vignette ---
const vig = ctx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.7);
vig.addColorStop(0, 'rgba(0,0,0,0)');
vig.addColorStop(1, 'rgba(0,0,0,0.5)');
ctx.fillStyle = vig;
ctx.fillRect(0, 0, W, H);

// --- Border ---
ctx.strokeStyle = '#7cc4ff';
ctx.lineWidth = 3;
ctx.shadowColor = '#7cc4ff';
ctx.shadowBlur = 6;
ctx.strokeRect(8, 8, W-16, H-16);
ctx.shadowBlur = 0;

// --- Save ---
const outPath = path.join(__dirname, '..', 'public', 'og-image.png');
const buf = c.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log(`OG image saved to ${outPath} (${(buf.length/1024).toFixed(1)} KB)`);
