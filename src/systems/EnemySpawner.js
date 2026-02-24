import { TILE_SIZE, COMBAT, ENEMY_TYPES } from '../constants.js';
import { worldToTile, distance } from '../utils/MathHelpers.js';
import Enemy from '../entities/Enemy.js';

export default class EnemySpawner {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.enemies = [];
    this.spawnTimer = 0;

    // Build terrain-to-enemy lookup
    this.terrainEnemyMap = {};
    for (const [key, config] of Object.entries(ENEMY_TYPES)) {
      for (const t of config.terrains) {
        if (!this.terrainEnemyMap[t]) this.terrainEnemyMap[t] = [];
        this.terrainEnemyMap[t].push(config);
      }
    }
  }

  update(dt, playerX, playerY) {
    const dtMs = dt * 1000;
    this.spawnTimer += dtMs;

    // Spawn check
    if (this.spawnTimer >= COMBAT.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.trySpawn(playerX, playerY);
    }

    // Despawn far enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }
      const dist = distance(enemy.sprite.x, enemy.sprite.y, playerX, playerY);
      if (dist > COMBAT.DESPAWN_RADIUS) {
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // Update active enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, playerX, playerY);
    }
  }

  trySpawn(playerX, playerY) {
    if (this.enemies.length >= COMBAT.MAX_ENEMIES) return;

    // Pick a random point around the player within spawn radius
    const angle = Math.random() * Math.PI * 2;
    const dist = COMBAT.SPAWN_RADIUS * (0.5 + Math.random() * 0.5);
    const spawnX = playerX + Math.cos(angle) * dist;
    const spawnY = playerY + Math.sin(angle) * dist;

    // Check terrain at spawn point
    const tile = worldToTile(spawnX, spawnY, TILE_SIZE);
    if (tile.x < 0 || tile.x >= this.terrain[0].length ||
        tile.y < 0 || tile.y >= this.terrain.length) return;

    const terrainType = this.terrain[tile.y][tile.x];
    const possibleEnemies = this.terrainEnemyMap[terrainType];
    if (!possibleEnemies || possibleEnemies.length === 0) return;

    // Pick random enemy type for this terrain
    const config = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

    // Don't spawn too close to player
    if (distance(spawnX, spawnY, playerX, playerY) < 80) return;

    const enemy = new Enemy(this.scene, spawnX, spawnY, config);
    this.enemies.push(enemy);
  }

  getActiveEnemies() {
    return this.enemies.filter(e => e.active);
  }

  destroyAll() {
    for (const enemy of this.enemies) {
      if (enemy.active) enemy.destroy();
    }
    this.enemies = [];
  }
}
