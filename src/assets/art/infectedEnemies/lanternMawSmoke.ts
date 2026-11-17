import { makeHD } from '../hd';
import { drawPoisonSmoke, POISON_SMOKE_FRAME_MS, type PoisonSmokePalette } from '../poisonSmoke';

export const LANTERN_MAW_WAKE_MS = 900;
export const LANTERN_MAW_WAKE_VARIANTS = 3;
export const LANTERN_MAW_WAKE_FRAMES = Array.from({ length: LANTERN_MAW_WAKE_MS / POISON_SMOKE_FRAME_MS }, (_, frame) => frame);
export const LANTERN_MAW_WAKE_SCALE = 0.42;
export const LANTERN_MAW_GAS_FIRST_FRAME = 5;

const PLUM_SMOKE = {
  ground: '#49324e', deep: '#392742', shade: '#67405d',
  mist: '#9b5f87', light: '#cd93b6', spark: '#e5b3c8',
} satisfies PoisonSmokePalette;

export function lanternMawWakeKey(variant: number, frame: number): string {
  return `iboss_wake_${variant}_${frame}`;
}

export function makeLanternMawWakeFrame(variant: number, frame: number): HTMLCanvasElement {
  const ageMs = frame * POISON_SMOKE_FRAME_MS;
  return makeHD(128, drawPoisonSmoke(ageMs, LANTERN_MAW_WAKE_MS, PLUM_SMOKE, 'plume', variant), { outline: false });
}
