import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class ViewToggleButton {
  constructor(scene, x, y, onClick) {
    this.scene = scene;

    // Button background
    this.bg = scene.add.rectangle(x, y, 80, 36, UI_COLORS.PARCHMENT_DARK, 0.85);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(200);
    this.bg.setInteractive({ useHandCursor: true });

    // Border
    this.border = scene.add.rectangle(x, y, 80, 36);
    this.border.setStrokeStyle(2, UI_COLORS.BORDER);
    this.border.setScrollFactor(0);
    this.border.setDepth(201);

    // Label
    this.label = scene.add.text(x, y, 'Explore', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
      align: 'center',
    });
    this.label.setOrigin(0.5);
    this.label.setScrollFactor(0);
    this.label.setDepth(202);

    this.isMapView = true;

    this.bg.on('pointerdown', () => {
      this.isMapView = !this.isMapView;
      this.label.setText(this.isMapView ? 'Explore' : 'Map');
      onClick();
    });

    // Hover effect
    this.bg.on('pointerover', () => {
      this.bg.fillColor = UI_COLORS.PARCHMENT_LIGHT;
    });
    this.bg.on('pointerout', () => {
      this.bg.fillColor = UI_COLORS.PARCHMENT_DARK;
    });
  }

  setVisible(visible) {
    this.bg.setVisible(visible);
    this.border.setVisible(visible);
    this.label.setVisible(visible);
  }
}
