import Phaser from 'phaser';
import SpriteFactory from '../utils/SpriteFactory.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // No external assets — everything is procedurally generated
  }

  create() {
    // Generate all pixel-art textures
    SpriteFactory.generateAll(this);

    // Register all animation definitions
    SpriteFactory.registerAnimations(this);

    this.scene.start('BootScene');
  }
}
