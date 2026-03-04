import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../constants.js';
import { TERRAIN_COLORS } from '../utils/ParchmentColors.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class MiniMap {
  constructor(scene, x, y, size) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.scaleX = size / MAP_WIDTH;
    this.scaleY = size / MAP_HEIGHT;

    // Background
    this.bg = scene.add.rectangle(x, y, size + 4, size + 4, UI_COLORS.INK_DARK, 0.7);
    this.bg.setOrigin(0, 0);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(100);

    // Mini-map render texture
    this.rt = scene.add.renderTexture(x + 2, y + 2, size, size);
    this.rt.setOrigin(0, 0);
    this.rt.setScrollFactor(0);
    this.rt.setDepth(101);

    // Player dot
    this.playerDot = scene.add.circle(x, y, 3, 0xff0000);
    this.playerDot.setScrollFactor(0);
    this.playerDot.setDepth(102);

    // Border
    this.border = scene.add.rectangle(x, y, size + 4, size + 4);
    this.border.setStrokeStyle(2, UI_COLORS.BORDER);
    this.border.setOrigin(0, 0);
    this.border.setScrollFactor(0);
    this.border.setDepth(103);
  }

  renderTerrain(terrain) {
    const g = this.scene.add.graphics();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const color = TERRAIN_COLORS[terrain[y][x]] || 0x888888;
        g.fillStyle(color, 1);
        g.fillRect(
          x * this.scaleX,
          y * this.scaleY,
          Math.ceil(this.scaleX),
          Math.ceil(this.scaleY)
        );
      }
    }

    this.rt.draw(g);
    g.destroy();
  }

  renderCamps(camps) {
    if (!camps || camps.length === 0) return;
    this.campDots = [];
    for (const camp of camps) {
      const mx = this.x + 2 + camp.x * this.scaleX;
      const my = this.y + 2 + camp.y * this.scaleY;
      const dot = this.scene.add.circle(mx, my, 2, 0xcc4444);
      dot.setScrollFactor(0);
      dot.setDepth(102);
      this.campDots.push(dot);
    }
  }

  updatePlayerPosition(worldX, worldY) {
    const mx = this.x + 2 + (worldX / (MAP_WIDTH * TILE_SIZE)) * this.size;
    const my = this.y + 2 + (worldY / (MAP_HEIGHT * TILE_SIZE)) * this.size;
    this.playerDot.setPosition(mx, my);
  }

  setVisible(visible) {
    this.bg.setVisible(visible);
    this.rt.setVisible(visible);
    this.playerDot.setVisible(visible);
    this.border.setVisible(visible);
    if (this.campDots) {
      for (const dot of this.campDots) dot.setVisible(visible);
    }
  }
}
