import type { HdDraw } from '../../src/assets/art/hd';
import { drawGrayWolf } from './wolf-gray';

export const drawBalancedWolf: HdDraw = (put, raw) => {
  drawGrayWolf((x, y, paint) => {
    switch (paint) {
      case '#24252b': put(x, y, '#363b43'); break;
      case '#363840': put(x, y, '#4a5159'); break;
      case '#53565d': put(x, y, '#676e74'); break;
      case '#767b80': put(x, y, '#8a9194'); break;
      case '#929895': put(x, y, '#a3aaa7'); break;
      case '#b2b7ae': put(x, y, '#bdc3b9'); break;
      default: put(x, y, paint);
    }
  }, raw);
};

export const TRIES = [{ name: 'D Soft charcoal edge', frames: [{ label: 'static concept', draw: drawBalancedWolf }] }];
