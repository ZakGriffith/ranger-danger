import { drawCopperDarter, drawMosquitoStudy, drawRiverDragonfly } from '../../src/assets/art/riverEnemies/insects';

type StudyOption = {
  name: string;
  description: string;
  draw(ctx: CanvasRenderingContext2D, action: 'move' | 'attack', phase: number): void;
};

export const dragonflyOptions: StudyOption[] = [
  { name: 'Kingfisher Skimmer', description: 'Bright teal shell, broad glass wings, and amber eyes. Cocks back, then darts forward with open jaws.',
    draw: (ctx, action, phase) => drawRiverDragonfly(ctx, action, phase, 0) },
  { name: 'Copper Darter', description: 'Russet armor and swept copper wings with dark tips. The curved tail makes the lunge read like a whip.',
    draw: drawCopperDarter },
];

export const mosquitoOptions: StudyOption[] = [
  { name: 'Reed Needle', description: 'Amber belly, feathery feelers, and a dark needle. Hangs over the water before firing a single dart.',
    draw: (ctx, action, phase) => drawMosquitoStudy(ctx, action, phase, false) },
  { name: 'Dusk Stinger', description: 'Long slate belly, pale notched wings, and plum eyes. The needle snaps forward when it fires.',
    draw: (ctx, action, phase) => drawMosquitoStudy(ctx, action, phase, true) },
];
