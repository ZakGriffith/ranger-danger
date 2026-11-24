import { drawRotback } from './rotback';
import { drawRootbound } from './rootbound';
import { drawFungalBrute } from '../../src/assets/art/infectedEnemies/fungalBrute';
export const STUDIES = [
  { id: 'rotback', letter: 'A', name: 'Rotback Boar', draw: drawRotback },
  { id: 'rootbound', letter: 'B', name: 'Rootbound Hulk', draw: drawRootbound },
  { id: 'fungal', letter: 'C', name: 'Fungal Brute', draw: drawFungalBrute },
] as const;

export const FUNGAL_STUDIES = [
  { id: 'fungal-punch', letter: 'C', name: 'Heavy punch', draw: drawFungalBrute },
] as const;
