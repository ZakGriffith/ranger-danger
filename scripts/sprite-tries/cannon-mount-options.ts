import type { HdDraw } from '../../src/assets/art/hd';

export const CANNON_MOUNT_SIZE = 128;
export const CANNON_MOUNT_OPTIONS = [
  { id: '1', name: 'Iron turntable', description: 'A compact charcoal disc with a fine bevel and a low swivel plate.' },
  { id: '2', name: 'Bronze bearing', description: 'A restrained bronze bearing rim around a dark iron plate, secured by four small rivets.' },
  { id: '3', name: 'Recessed swivel', description: 'Two concentric iron rings around a recessed circular swivel track.' },
] as const;

type Paint = `#${string}`;
type Palette = readonly Paint[];

const EDGE: Paint = '#141b25';
const GROOVE: Paint = '#1a2330';
const IRON: Palette = ['#252f3c', '#303b4b', '#3b4758', '#4c5a6d', '#637287'];
const PLATE: Palette = ['#293340', '#303b49', '#3a4655', '#465363'];
const BRONZE: Palette = ['#4b4233', '#63553e', '#7b694a', '#97815a', '#b09a70'];
const GROUND_Y = 0.68;

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

function topColor(id: string, x: number, y: number, radius: number): Paint {
  const r = Math.hypot(x, y);
  if (id === '1') {
    if (r > radius - 1.0) return EDGE;
    if (r > radius - 3.4) return bevel(IRON, x, y, r);
    if (r > radius - 4.4) return GROOVE;
    if (r > radius - 5.4) return bevel(IRON, x, y, r, true);
    return surface(x, y, radius);
  }
  if (id === '2') {
    if (r > radius - 1.0) return EDGE;
    if (r > radius - 2.6) return bevel(IRON, x, y, r);
    if (r > radius - 5.3) return bevel(BRONZE, x, y, r);
    if (r > radius - 6.3) return GROOVE;
    if (r > radius - 7.3) return bevel(IRON, x, y, r, true);
    return surface(x, y, radius);
  }
  if (r > radius - 1.0) return EDGE;
  if (r > radius - 3.4) return bevel(IRON, x, y, r);
  if (r > radius - 5.2) return GROOVE;
  if (r > radius - 6.8) return bevel(IRON, x, y, r, true);
  if (r > radius - 9.5) return bevel(IRON, x, y, r);
  if (r > radius - 10.3) return GROOVE;
  return surface(x, y, radius);
}

export function drawCannonMountOption(id: string): HdDraw {
  if (!CANNON_MOUNT_OPTIONS.some(option => option.id === id)) throw new Error(`Unknown cannon mount option: ${id}`);
  return put => {
    const profileRadius = id === '1' ? 24 : 25;
    const radius = id === '1' ? 19 : 20;
    const profileScale = radius / profileRadius;
    const thickness = 2;
    const colors: (Paint | undefined)[] = new Array(CANNON_MOUNT_SIZE * CANNON_MOUNT_SIZE);
    const paint = (x: number, y: number, color: Paint) => { colors[y * CANNON_MOUNT_SIZE + x] = color; };

    for (let y = 44; y <= 86; y++) {
      for (let x = 37; x <= 90; x++) {
        const dx = x + 0.5 - 64;
        const wallY = (y + 0.5 - 64 - thickness) / GROUND_Y;
        if (dx * dx + wallY * wallY <= radius * radius) {
          paint(x, y, tone(IRON, 0.22 - dx / radius * 0.13));
        }
        const topY = (y + 0.5 - 64) / GROUND_Y;
        if (dx * dx + topY * topY <= radius * radius) {
          paint(x, y, topColor(id, dx / profileScale, topY / profileScale, profileRadius));
        }
      }
    }

    if (id === '2') {
      for (const angle of [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75]) {
        const x = Math.round(64 + Math.cos(angle) * 21 * profileScale - 0.5);
        const y = Math.round(64 + Math.sin(angle) * 21 * profileScale * GROUND_Y - 0.5);
        paint(x, y, '#b09a70');
        paint(x + 1, y, '#79684c');
        paint(x, y + 1, '#79684c');
        paint(x + 1, y + 1, '#4b4233');
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
}
