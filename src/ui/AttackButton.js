import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class AttackButton {
  constructor(scene, onAttack) {
    this.scene = scene;
    this.onAttack = onAttack;

    // Bottom-right attack button
    const x = GAME_WIDTH - 60;
    const y = GAME_HEIGHT - 60;
    const radius = 28;

    // Button background
    this.bg = scene.add.circle(x, y, radius, 0x8b0000, 0.7);
    this.bg.setDepth(200);
    this.bg.setScrollFactor(0);
    this.bg.setInteractive();

    // Sword icon (simple cross shape)
    this.icon = scene.add.text(x, y, '\u2694', {
      fontSize: '24px',
      color: '#f4e4c1',
    });
    this.icon.setOrigin(0.5);
    this.icon.setDepth(201);
    this.icon.setScrollFactor(0);

    // Touch handler
    this.bg.on('pointerdown', () => {
      this.bg.setFillStyle(0xcc0000, 0.9);
      if (this.onAttack) this.onAttack();
    });

    this.bg.on('pointerup', () => {
      this.bg.setFillStyle(0x8b0000, 0.7);
    });

    this.bg.on('pointerout', () => {
      this.bg.setFillStyle(0x8b0000, 0.7);
    });

    this.visible = true;
  }

  setVisible(visible) {
    this.visible = visible;
    this.bg.setVisible(visible);
    this.icon.setVisible(visible);
  }
}
