export interface MeadowEnemyPose {
  mode: 'move' | 'attack';
  phase: number;
  anticipation: number;
  lunge: number;
  strike: number;
  recovery: number;
  tongueFlick?: number;
}

function ease(phase: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, (phase - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function pulse(phase: number, start: number, peak: number, hold: number, end: number): number {
  return ease(phase, start, peak) * (1 - ease(phase, hold, end));
}

export function meadowEnemyPose(mode: MeadowEnemyPose['mode'], phase: number, tongueFlick?: number): MeadowEnemyPose {
  const attack = mode === 'attack';
  return {
    mode,
    phase,
    anticipation: attack ? pulse(phase, .05, .33, .4, .54) : 0,
    lunge: attack ? pulse(phase, .38, .53, .59, .84) : 0,
    strike: attack ? pulse(phase, .42, .55, .61, .79) : 0,
    recovery: attack ? pulse(phase, .57, .74, .76, .98) : 0,
    tongueFlick,
  };
}
