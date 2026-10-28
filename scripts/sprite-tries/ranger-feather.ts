// Ranger hood-feather concepts. The shipped plume is the first row; the rest
// swap colour and curve to compare against it.
import { drawPlayer, drawPlume, RANGER, type PFrame, type Plume, type PPose } from '../../src/assets/art/player';
import { type HdDraw, type HdPut } from '../../src/assets/art/hd';

// Head anchor per frame/pose, mirroring drawPlayer's bob / lean / aim offsets.
const head = (f: PFrame, pose: PPose) => {
  const idle = f.startsWith('idle') ? +f[4] : -1, move = f.startsWith('move') ? +f[4] : -1;
  const bob = 2 * (idle >= 0 ? [0, 1, 1, 0][idle] : move >= 0 ? [1, 0, 0, 1, 0, 0][move] : 0);
  const crouch = pose === 'down' ? 2 : 0;
  const capCx = 32 + (move >= 0 ? 2 : 0) + (pose === 'up' ? -2 : 0);
  const headCy = 17 + bob + (pose === 'up' ? -2 : pose === 'down' ? 2 : 0) + crouch;
  return { capCx, headCy };
};

type Feather = (capCx: number, headCy: number, put: HdPut) => void;
const withFeather = (feather: Feather) => (f: PFrame, pose: PPose): HdDraw => (put, raw) => {
  drawPlayer(f, pose, { ...RANGER, feather: null })(put, raw);
  const { capCx, headCy } = head(f, pose);
  feather(capCx, headCy, put);
};

const crown = (cx: number, cy: number, p: Partial<Plume>): Plume => ({
  base: [cx + 11, cy - 4], tip: [cx - 5, cy - 14], bow: 3, width: 2.6,
  vane: 'red', quill: 'gold.d', edge: 'red.l', notches: [0.45, 0.65], ...p,
});

const VARIANTS: Record<string, Feather> = {
  'A gold plume, gold quill': (cx, cy, put) => drawPlume(put, crown(cx, cy, { vane: 'gold', quill: 'gold.d', edge: 'gold.l' })),
  'C cream plume, wood quill': (cx, cy, put) => drawPlume(put, crown(cx, cy, { vane: 'cream', quill: 'wood', edge: 'cream.l' })),
  'E flatter / longer, lies along the hood': (cx, cy, put) =>
    drawPlume(put, crown(cx, cy, { base: [cx + 12, cy - 3], tip: [cx - 9, cy - 13], bow: 2, width: 2.4, notches: [0.4, 0.6, 0.78] })),
  'F steeper / taller plume': (cx, cy, put) =>
    drawPlume(put, crown(cx, cy, { base: [cx + 10, cy - 5], tip: [cx - 1, cy - 18], bow: 3.5, width: 2.8, notches: [0.5, 0.7] })),
};

const frames: [PFrame, PPose][] = [['idle0', 'level'], ['idle1', 'level'], ['move0', 'level'], ['move2', 'level'], ['idle0', 'up'], ['idle0', 'down']];
export const TRIES = [
  { name: 'shipped (red plume, gold quill, over the crown)', frames: frames.map(([f, p]) => ({ label: `${f}/${p}`, draw: drawPlayer(f, p) })) },
  ...Object.entries(VARIANTS).map(([name, feather]) => ({
    name,
    frames: frames.map(([f, p]) => ({ label: `${f}/${p}`, draw: withFeather(feather)(f, p) })),
  })),
];
