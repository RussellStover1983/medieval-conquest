import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class HealthBar {
  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Background
    this.bg = scene.add.rectangle(x, y, width, height, UI_COLORS.INK_DARK, 0.5);
    this.bg.setOrigin(0, 0);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(100);

    // Health fill
    this.fill = scene.add.rectangle(x + 2, y + 2, width - 4, height - 4, UI_COLORS.HEALTH_GREEN);
    this.fill.setOrigin(0, 0);
    this.fill.setScrollFactor(0);
    this.fill.setDepth(101);

    // Border
    this.border = scene.add.rectangle(x, y, width, height);
    this.border.setStrokeStyle(2, UI_COLORS.BORDER);
    this.border.setOrigin(0, 0);
    this.border.setScrollFactor(0);
    this.border.setDepth(102);

    // Label
    this.label = scene.add.text(x + width / 2, y + height / 2, 'HP', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
    });
    this.label.setOrigin(0.5);
    this.label.setScrollFactor(0);
    this.label.setDepth(103);
  }

  update(current, max) {
    const ratio = current / max;
    this.fill.width = (this.width - 4) * ratio;
    this.fill.fillColor = ratio > 0.5 ? UI_COLORS.HEALTH_GREEN : UI_COLORS.HEALTH_RED;
    this.label.setText(`${current}/${max}`);
  }

  setVisible(visible) {
    this.bg.setVisible(visible);
    this.fill.setVisible(visible);
    this.border.setVisible(visible);
    this.label.setVisible(visible);
  }
}
