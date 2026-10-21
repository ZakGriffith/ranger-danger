import { makeHD } from './hd';
import { drawJellyBlob } from './infectedBlobJelly';
import { drawColonyBlob } from './infectedBlobColony';

export const BLOB_COLOR_NAMES = ['Moss', 'Lichen', 'Jade', 'Fern', 'Seafoam', 'Sulfur'] as const;
export const BLOB_MODEL_NAMES = ['Blight jelly', 'Boil colony'] as const;
export const BLOB_VARIANTS = BLOB_COLOR_NAMES.length * BLOB_MODEL_NAMES.length;
export const BLOB_MOVE_FRAMES = Array.from({ length: 32 }, (_, frame) => `move${frame}`);
export const BLOB_ATTACK_FRAMES = Array.from({ length: 24 }, (_, frame) => `atk${frame}`);
export const BLOB_FRAMES = [...BLOB_MOVE_FRAMES, ...BLOB_ATTACK_FRAMES, 'hit'];
export const BLOB_ATTACK_FRAME_MS = 40;
export const BLOB_ATTACK_DURATION_MS = BLOB_ATTACK_FRAMES.length * BLOB_ATTACK_FRAME_MS;
export const BLOB_WINDUP_MS = 200;
export const BLOB_FLIGHT_MS = 320;
export const BLOB_IMPACT_MS = BLOB_WINDUP_MS + BLOB_FLIGHT_MS;
export const BLOB_FRAME_WIDTH = 96;
export const BLOB_FRAME_HEIGHT = 112;
export const BLOB_FOOT_Y = 104;
export const BLOB_ORIGIN_Y = 88 / BLOB_FRAME_HEIGHT;
export const BLOB_AIR_HEIGHT = 32;

const sourceTextures = new Map<number, Uint8ClampedArray>();
const frameCanvases = new Map<string, HTMLCanvasElement>();
const smooth = (t: number) => t * t * (3 - 2 * t);

function prepareTexture(variant: number): Uint8ClampedArray {
  const color = variant % BLOB_COLOR_NAMES.length;
  const draw = variant < BLOB_COLOR_NAMES.length ? drawJellyBlob(color) : drawColonyBlob(color);
  const source = makeHD(64, draw, { outline: false });
  const data = source.getContext('2d')!.getImageData(0, 0, 64, 64).data;
  const colors = new Uint8ClampedArray(256 * 64 * 4);
  for (let direction = 0; direction < 256; direction++) {
    const angle = direction / 256 * Math.PI * 2;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let edge = 30;
    const sourceIndex = (radius: number) => (Math.round(31.5 + dy * radius) * 64 + Math.round(31.5 + dx * radius)) * 4;
    while (data[sourceIndex(edge) + 3] === 0) edge -= .25;
    for (let depth = 0; depth < 64; depth++) {
      let radius = edge * depth / 63;
      // Extend painted surfaces through the gaps between the original rounded lobes.
      while (data[sourceIndex(radius) + 3] === 0) radius -= .25;
      const src = sourceIndex(radius), dest = (direction * 64 + depth) * 4;
      colors.set(data.subarray(src, src + 4), dest);
    }
  }
  return colors;
}

function framePose(frame: string): { angle: number; squash: number; lift: number } {
  if (frame === 'hit') return { angle: 0, squash: 1.15, lift: 0 };
  if (frame.startsWith('move')) {
    const phase = Number(frame.slice(4)) / BLOB_MOVE_FRAMES.length * Math.PI * 2;
    return { angle: phase, squash: 1 + .065 * Math.sin(phase * 2), lift: 0 };
  }
  const time = Number(frame.slice(3)) * BLOB_ATTACK_FRAME_MS;
  if (time < BLOB_WINDUP_MS) {
    return { angle: 0, squash: 1 + .3 * smooth(time / BLOB_WINDUP_MS), lift: 0 };
  }
  if (time < BLOB_IMPACT_MS) {
    const progress = (time - BLOB_WINDUP_MS) / BLOB_FLIGHT_MS;
    const launch = smooth(Math.min(1, progress * 4));
    return {
      angle: progress * Math.PI * 1.1,
      squash: 1.3 * (1 - launch) + (.84 + .08 * progress) * launch,
      lift: BLOB_AIR_HEIGHT * Math.sin(Math.PI * progress),
    };
  }
  const recovery = (time - BLOB_IMPACT_MS) / (BLOB_ATTACK_DURATION_MS - BLOB_IMPACT_MS - BLOB_ATTACK_FRAME_MS);
  const settle = 1 - smooth(recovery);
  return {
    angle: Math.PI * 1.1 * settle,
    squash: 1 + .38 * settle * Math.cos(recovery * Math.PI * 2),
    lift: 0,
  };
}

export function makeInfectedBlobFrame(frame: string, variant: number): HTMLCanvasElement {
  const key = `${variant}:${frame}`;
  const existing = frameCanvases.get(key);
  if (existing) return existing;
  let texture = sourceTextures.get(variant);
  if (!texture) {
    texture = prepareTexture(variant);
    sourceTextures.set(variant, texture);
  }

  const canvas = document.createElement('canvas');
  canvas.width = BLOB_FRAME_WIDTH;
  canvas.height = BLOB_FRAME_HEIGHT;
  const context = canvas.getContext('2d')!;
  const output = context.createImageData(BLOB_FRAME_WIDTH, BLOB_FRAME_HEIGHT);
  const { angle, squash, lift } = framePose(frame);
  const air = smooth(Math.min(1, lift / 14));
  const phase = angle * 2;
  const bodyHeight = ((35 + 2 * Math.sin(phase + .5)) * (1 - air) + 40 * air) / squash;
  const foot = BLOB_FOOT_Y - lift;
  const top = foot - bodyHeight;
  for (let y = Math.floor(top); y < foot; y++) {
    const t = (y + .5 - top) / bodyHeight;
    if (t < 0 || t > 1) continue;
    const footTaper = smooth(Math.max(0, (t - .79) / .21));
    const mound = Math.sqrt(Math.max(0, 1 - ((t - .72) / .72) ** 2)) * (21 + 9 * t) * (1 - .43 * footTaper);
    const drop = 20 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * (.86 + .25 * t);
    const radius = (mound * (1 - air) + drop * air) * squash;
    const drift = (1 - air) * ((2.6 + 3 * Math.sin(phase)) * (1 - t) ** 1.8 + 1.5 * Math.sin(phase - t * 4) * Math.sin(Math.PI * t));
    const center = BLOB_FRAME_WIDTH / 2 + drift;
    const left = radius * (1 + .065 * Math.sin(phase - t * 4)) * (1 - .04 * air);
    const right = radius * (1 + .07 * Math.sin(phase + t * 5 + 1));
    const ny = t * 2 - 1;
    for (let x = Math.ceil(center - left); x < center + right; x++) {
      const nx = (x + .5 - center) / (x < center ? left : right);
      if (Math.abs(nx) > 1) continue;
      const circleX = nx * Math.sqrt(Math.max(0, 1 - ny * ny));
      const radiusInTexture = Math.min(1, Math.hypot(circleX, ny));
      const direction = ((Math.round((Math.atan2(ny, circleX) - angle) / (Math.PI * 2) * 256) % 256) + 256) % 256;
      const src = (direction * 64 + Math.round(radiusInTexture * 63)) * 4;
      output.data.set(texture.subarray(src, src + 4), (y * BLOB_FRAME_WIDTH + x) * 4);
    }
  }
  context.putImageData(output, 0, 0);
  frameCanvases.set(key, canvas);
  return canvas;
}
