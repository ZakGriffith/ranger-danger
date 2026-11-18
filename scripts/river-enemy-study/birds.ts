import { drawRiverBat, drawRiverCrow } from '../../src/assets/art/riverEnemies/birds';

type BirdStudy = {
  name: string;
  description: string;
  draw(ctx: CanvasRenderingContext2D, action: 'move' | 'attack', phase: number): void;
};

export const crowOptions: readonly BirdStudy[] = [
  { name: 'Slatewing', description: 'Blue charcoal plumage, long fingered feathers, and a sharp dive into a peck.', draw: drawRiverCrow },
  { name: 'Reedcrest', description: 'A swept crest and pale throat set off broader, rounded flight feathers.', draw: (ctx, action, phase) => drawRiverCrow(ctx, action, phase, 'reed') },
];

export const batOptions: readonly BirdStudy[] = [
  { name: 'Dusk Velvet', description: 'Tall ears, plum membranes, and a wide bite at the end of a low lunge.', draw: drawRiverBat },
  { name: 'Copper Ruff', description: 'A shaggy tawny collar, short ears, and broader wings with deep scallops.', draw: (ctx, action, phase) => drawRiverBat(ctx, action, phase, 'copper') },
];
