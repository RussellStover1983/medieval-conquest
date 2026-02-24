import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(UI_COLORS.PARCHMENT_BG);
    this.cameras.main.fadeIn(300, 44, 24, 16);

    // Decorative border
    const border = this.add.graphics();
    border.lineStyle(3, UI_COLORS.INK_DARK, 0.4);
    border.strokeRect(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);
    border.lineStyle(1, UI_COLORS.INK_LIGHT, 0.3);
    border.strokeRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100);

    // Title
    this.add.text(GAME_WIDTH / 2, 150, 'Medieval\nConquest', {
      fontSize: '56px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Ornamental line
    const line = this.add.graphics();
    line.lineStyle(2, UI_COLORS.INK_MED, 0.5);
    line.lineBetween(GAME_WIDTH / 2 - 100, 250, GAME_WIDTH / 2 + 100, 250);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 280, 'Explore. Build. Conquer.', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#5c3a1e',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Play button
    this.createButton(GAME_WIDTH / 2, 400, 'Begin Adventure', () => {
      this.cameras.main.fadeOut(300, 44, 24, 16);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharSelectScene');
      });
    });

    // Version
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Phase 1 - Map Exploration', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#8b6b4a',
    }).setOrigin(0.5);
  }

  createButton(x, y, text, onClick) {
    const bg = this.add.rectangle(x, y, 220, 50, UI_COLORS.INK_DARK, 0.1);
    bg.setInteractive({ useHandCursor: true });

    const border = this.add.rectangle(x, y, 220, 50);
    border.setStrokeStyle(2, UI_COLORS.INK_DARK, 0.6);

    const label = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.fillAlpha = 0.2;
      label.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.fillAlpha = 0.1;
      label.setScale(1);
    });
    bg.on('pointerdown', onClick);
  }
}
