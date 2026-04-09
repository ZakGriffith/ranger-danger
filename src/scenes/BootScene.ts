import Phaser from 'phaser';
import { generateAllArt, registerAnimations } from '../assets/generateArt';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    generateAllArt(this);
    registerAnimations(this);
    this.scene.start('Game', { playerName: (window as any).__playerName || 'hero' });
    this.scene.launch('UI');
  }
}
