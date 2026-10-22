import type { HdDraw } from './hd';
import { CANNON_GROUND_Y } from './cannon';

export const CANNON_MOUNT_SIZE = 128;

type Paint = `#${string}`;
type Palette = readonly Paint[];

const EDGE: Paint = '#141b25';
const GROOVE: Paint = '#1a2330';
const IRON: Palette = ['#252f3c', '#303b4b', '#3b4758', '#4c5a6d', '#637287'];
const PLATE: Palette = ['#293340', '#303b49', '#3a4655', '#465363'];

function tone(palette: Palette, light: number): Paint {
  return palette[Math.max(0, Math.min(palette.length - 1, Math.floor(light * palette.length)))];
}

function bevel(palette: Palette, x: number, y: number, radius: number, inward = false): Paint {
  const light = (-x * 0.54 - y * 0.72) / Math.max(1, radius);
  return tone(palette, 0.52 + light * (inward ? -0.38 : 0.42));
}

function surface(x: number, y: number, radius: number): Paint {
  return tone(PLATE, 0.60 - (x * 0.34 + y * 0.53) / radius * 0.19);
}

function topColor(x: number, y: number, radius: number): Paint {
  const r = Math.hypot(x, y);
  if (r > radius - 1.0) return EDGE;
  if (r > radius - 3.4) return bevel(IRON, x, y, r);
  if (r > radius - 4.4) return GROOVE;
  if (r > radius - 5.4) return bevel(IRON, x, y, r, true);
  return surface(x, y, radius);
}

export const drawCannonMount: HdDraw = put => {
  const profileRadius = 24;
  const radius = 19;
  const profileScale = radius / profileRadius;
  const thickness = 2;
  const colors: (Paint | undefined)[] = new Array(CANNON_MOUNT_SIZE * CANNON_MOUNT_SIZE);
  const paint = (x: number, y: number, color: Paint) => { colors[y * CANNON_MOUNT_SIZE + x] = color; };

  for (let y = 44; y <= 86; y++) {
    for (let x = 37; x <= 90; x++) {
      const dx = x + 0.5 - 64;
      const wallY = (y + 0.5 - 64 - thickness) / CANNON_GROUND_Y;
      if (dx * dx + wallY * wallY <= radius * radius) {
        paint(x, y, tone(IRON, 0.22 - dx / radius * 0.13));
      }
      const topY = (y + 0.5 - 64) / CANNON_GROUND_Y;
      if (dx * dx + topY * topY <= radius * radius) {
        paint(x, y, topColor(dx / profileScale, topY / profileScale, profileRadius));
      }
    }
  }

  for (let y = 44; y <= 86; y++) {
    for (let x = 37; x <= 90; x++) {
      const i = y * CANNON_MOUNT_SIZE + x;
      const color = colors[i];
      if (!color) continue;
      const outside = !colors[i - 1] || !colors[i + 1]
        || !colors[i - CANNON_MOUNT_SIZE] || !colors[i + CANNON_MOUNT_SIZE];
      put(x, y, outside ? EDGE : color);
    }
  }
};
