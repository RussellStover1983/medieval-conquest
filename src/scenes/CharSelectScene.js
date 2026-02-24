import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';
import { CHARACTER_CLASSES, getClassNames } from '../entities/CharacterClasses.js';

export default class CharSelectScene extends Phaser.Scene {
  constructor() {
    super('CharSelectScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(UI_COLORS.PARCHMENT_BG);
    this.cameras.main.fadeIn(300, 44, 24, 16);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'Choose Your Class', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const classNames = getClassNames();
    const cardWidth = 160;
    const totalWidth = classNames.length * cardWidth + (classNames.length - 1) * 16;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    classNames.forEach((name, i) => {
      const x = startX + i * (cardWidth + 16);
      this.createClassCard(x, 340, name, CHARACTER_CLASSES[name]);
    });
  }

  createClassCard(x, y, name, classData) {
    const cardH = 380;

    // Card background
    const bg = this.add.rectangle(x, y, 150, cardH, UI_COLORS.PARCHMENT_LIGHT, 0.9);
    bg.setInteractive({ useHandCursor: true });

    // Card border
    const border = this.add.rectangle(x, y, 150, cardH);
    border.setStrokeStyle(2, UI_COLORS.BORDER, 0.6);

    // Class color indicator
    this.add.rectangle(x, y - cardH / 2 + 30, 130, 40, classData.color, 0.8);

    // Class name
    this.add.text(x, y - cardH / 2 + 30, name, {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description
    this.add.text(x, y - cardH / 2 + 70, classData.description, {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#5c3a1e',
      wordWrap: { width: 130 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Stat bars
    const stats = ['strength', 'speed', 'defense', 'build', 'trade'];
    const statLabels = ['STR', 'SPD', 'DEF', 'BLD', 'TRD'];

    stats.forEach((stat, i) => {
      const sy = y - cardH / 2 + 140 + i * 28;
      const value = classData[stat];

      // Label
      this.add.text(x - 60, sy, statLabels[i], {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: '#5c3a1e',
      }).setOrigin(0, 0.5);

      // Bar background
      this.add.rectangle(x + 10, sy, 80, 12, UI_COLORS.INK_DARK, 0.15).setOrigin(0, 0.5);

      // Bar fill
      const fillWidth = (value / 10) * 80;
      const fillColor = value >= 7 ? 0x6aaa3a : value >= 5 ? 0xd4a843 : 0xaa6633;
      this.add.rectangle(x + 10, sy, fillWidth, 12, fillColor, 0.7).setOrigin(0, 0.5);

      // Value text
      this.add.text(x + 95, sy, `${value}`, {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: '#2c1810',
      }).setOrigin(0.5);
    });

    // Select button
    const btnY = y + cardH / 2 - 30;
    const btn = this.add.rectangle(x, btnY, 120, 30, classData.color, 0.2);
    const btnBorder = this.add.rectangle(x, btnY, 120, 30);
    btnBorder.setStrokeStyle(1, classData.color, 0.6);
    const btnLabel = this.add.text(x, btnY, 'Select', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
    }).setOrigin(0.5);

    // Interactions
    bg.on('pointerover', () => {
      bg.fillAlpha = 1;
      border.setStrokeStyle(2, classData.color, 0.8);
    });
    bg.on('pointerout', () => {
      bg.fillAlpha = 0.9;
      border.setStrokeStyle(2, UI_COLORS.BORDER, 0.6);
    });
    bg.on('pointerdown', () => {
      this.selectClass(name);
    });
  }

  selectClass(className) {
    this.registry.set('selectedClass', className);

    this.cameras.main.fadeOut(300, 44, 24, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
