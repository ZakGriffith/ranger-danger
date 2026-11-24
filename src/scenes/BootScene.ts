import Phaser from 'phaser';
import levelMapBgImg from '../assets/sprites/level_map_bg.jpg';
import greenCheckImg from '../assets/sprites/green_check.png';
import { SFX } from '../audio/sfx';
import { isDebugGalleryRequested } from './DebugGalleryScene';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Only load what the level-select map actually needs — the tower-base
    // textures used by generateAllArt() are deferred to GameScene.preload
    // so the player sees the map ASAP after clicking PLAY.
    this.load.image('level_map_bg', levelMapBgImg);
    this.load.image('green_check', greenCheckImg);
  }

  create() {
    // Synchronous unlock happens in main.ts on the Play click. This kicks off
    // async fetch+decode of all audio assets so they're ready by gameplay.
    SFX.loadAssets();
    if (isDebugGalleryRequested()) {
      this.scene.start('DebugGallery');
      return;
    }
    // Art generation deferred to GameScene — go straight to level select,
    // once the map's Cinzel faces are in (they're already requested by
    // index.html for the title; the race keeps a slow font from holding the map).
    const fonts = (document as { fonts?: { load(spec: string): Promise<unknown> } }).fonts;
    const ready = fonts
      ? Promise.race([Promise.all([fonts.load('700 20px "Cinzel"'), fonts.load('700 20px "Cinzel Decorative"')]), new Promise(r => setTimeout(r, 1500))])
      : Promise.resolve();
    ready.then(() => this.scene.start('LevelSelect'));
  }
}
