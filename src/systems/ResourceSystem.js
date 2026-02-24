import { TILE_SIZE } from '../constants.js';

export default class ResourceSystem {
  constructor(scene, player, mapRenderer) {
    this.scene = scene;
    this.player = player;
    this.mapRenderer = mapRenderer;
    this.collectRadius = TILE_SIZE * 0.8;
    this.onCollect = null; // callback: (type, value) => {}
  }

  update() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (let i = this.mapRenderer.resourceSprites.length - 1; i >= 0; i--) {
      const res = this.mapRenderer.resourceSprites[i];
      if (res.data.collected) continue;

      const dx = px - res.circle.x;
      const dy = py - res.circle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.collectRadius) {
        res.data.collected = true;
        this.player.collectResource(res.data.type, res.data.value);
        this.mapRenderer.removeResource(res);

        if (this.onCollect) {
          this.onCollect(res.data.type, res.data.value);
        }
      }
    }
  }
}
