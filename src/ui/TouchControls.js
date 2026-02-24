import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class TouchControls {
  constructor(scene, onMove) {
    this.scene = scene;
    this.onMove = onMove;
    this.isActive = false;
    this.pointerId = null;

    const baseX = 120;
    const baseY = scene.scale.height - 120;
    this.baseX = baseX;
    this.baseY = baseY;
    this.radius = 50;

    // Joystick base
    this.base = scene.add.circle(baseX, baseY, this.radius, UI_COLORS.INK_DARK, 0.3);
    this.base.setScrollFactor(0);
    this.base.setDepth(200);
    this.base.setInteractive();

    // Joystick thumb
    this.thumb = scene.add.circle(baseX, baseY, 22, UI_COLORS.PARCHMENT_DARK, 0.7);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(201);

    this.setupInput();
  }

  setupInput() {
    this.scene.input.on('pointerdown', (pointer) => {
      // Only activate if touch is in the joystick area (left side of screen)
      if (pointer.x < this.scene.scale.width / 3 && pointer.y > this.scene.scale.height / 2) {
        this.isActive = true;
        this.pointerId = pointer.id;
      }
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (!this.isActive || pointer.id !== this.pointerId) return;

      const dx = pointer.x - this.baseX;
      const dy = pointer.y - this.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.radius;

      let thumbX, thumbY;
      if (dist > maxDist) {
        thumbX = this.baseX + (dx / dist) * maxDist;
        thumbY = this.baseY + (dy / dist) * maxDist;
      } else {
        thumbX = pointer.x;
        thumbY = pointer.y;
      }

      this.thumb.setPosition(thumbX, thumbY);

      // Normalize to -1 to 1
      const nx = (thumbX - this.baseX) / maxDist;
      const ny = (thumbY - this.baseY) / maxDist;
      this.onMove(nx, ny);
    });

    this.scene.input.on('pointerup', (pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.isActive = false;
      this.pointerId = null;
      this.thumb.setPosition(this.baseX, this.baseY);
      this.onMove(0, 0);
    });
  }

  setVisible(visible) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }
}
