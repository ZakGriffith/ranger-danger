export { ink, shape, line, oval, wash } from '../../src/assets/art/forestEnemies/paint';
export type Action = 'move' | 'attack';
export const TAU = Math.PI * 2;
export function ease(a: number, b: number, phase: number) {
  const t = Math.max(0, Math.min(1, (phase - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function pose(action: Action, phase: number) {
  return { gait: action === 'move' ? phase * TAU : 0,
    wind: action === 'attack' ? ease(.02, .32, phase) - ease(.34, .52, phase) : 0,
    hit: action === 'attack' ? ease(.34, .52, phase) - ease(.65, 1, phase) : 0 };
}
