import { KEEP_PLOTS, KEEP_ITEMS } from '../world/WorldDefinition.js';
import { TILE_SIZE } from '../constants.js';

export default class KeepRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprites = [];
  }

  renderKeep(personalSpace) {
    this.clearKeep();

    if (!personalSpace || personalSpace.plotId === undefined) return;
    const plot = KEEP_PLOTS[personalSpace.plotId];
    if (!plot) return;

    const baseX = plot.tileX * TILE_SIZE;
    const baseY = plot.tileY * TILE_SIZE;

    // Render placed items
    const items = personalSpace.placed_items || [];
    for (const item of items) {
      const def = KEEP_ITEMS[item.itemId];
      if (!def) continue;

      const textureKey = `keep_${item.itemId}`;
      if (!this.scene.textures.exists(textureKey)) continue;

      const x = baseX + item.tileX * TILE_SIZE + TILE_SIZE / 2;
      const y = baseY + item.tileY * TILE_SIZE + TILE_SIZE / 2;

      const sprite = this.scene.add.sprite(x, y, textureKey);
      sprite.setDepth(6);
      this.sprites.push(sprite);
    }
  }

  clearKeep() {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites = [];
  }

  renderPlotBoundaries() {
    const g = this.scene.add.graphics();
    g.lineStyle(1, 0x8b6b4a, 0.3);

    for (const plot of KEEP_PLOTS) {
      const x = plot.tileX * TILE_SIZE;
      const y = plot.tileY * TILE_SIZE;
      const w = plot.width * TILE_SIZE;
      const h = plot.height * TILE_SIZE;
      g.strokeRect(x, y, w, h);
    }

    g.setDepth(3);
    return g;
  }
}
