import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Parchment background
    this.cameras.main.setBackgroundColor(UI_COLORS.PARCHMENT_BG);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Medieval Conquest', {
      fontSize: '48px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'A Strategy Adventure', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#5c3a1e',
    });
    subtitle.setOrigin(0.5);

    // Loading text
    const loadText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Loading...', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#8b6b4a',
    });
    loadText.setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(500, 44, 24, 16);

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300, 44, 24, 16);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }
}
