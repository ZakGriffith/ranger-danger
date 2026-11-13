export type RangerView = 'east' | 'south' | 'west' | 'north';

export type RangerPose = {
  view: RangerView;
  phase: number;
  run: number;
  bob: number;
  draw: number;
  recoil: number;
  angle: number;
  loaded: boolean;
};
