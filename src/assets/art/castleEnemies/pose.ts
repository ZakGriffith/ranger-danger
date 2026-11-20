export type CastleAction = 'move' | 'attack';
export type CastleDraw = (ctx: CanvasRenderingContext2D, action: CastleAction, phase: number) => void;

export const TAU = Math.PI * 2;

export function ease(from: number, to: number, phase: number): number {
  const t = Math.max(0, Math.min(1, (phase - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function strikePhase(phase: number): number {
  return ease(.22, .48, phase) - ease(.59, .95, phase);
}
