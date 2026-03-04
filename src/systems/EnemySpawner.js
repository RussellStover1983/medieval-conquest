import CampManager from './CampManager.js';

export default class EnemySpawner {
  constructor(scene, terrain, camps) {
    this.scene = scene;
    this.terrain = terrain;
    this.campManager = new CampManager(scene, camps || []);

    // Render camp sprites on the map
    this.campManager.renderCamps(scene);
  }

  update(dt, playerX, playerY) {
    this.campManager.update(dt, playerX, playerY);
  }

  getActiveEnemies() {
    return this.campManager.getActiveEnemies();
  }

  getCampPositions() {
    return this.campManager.getCampPositions();
  }

  destroyAll() {
    this.campManager.destroyAll();
  }
}
