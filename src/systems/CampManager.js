import { TILE_SIZE, ENEMY_TYPES } from '../constants.js';
import { distance } from '../utils/MathHelpers.js';
import Enemy from '../entities/Enemy.js';

const ACTIVE_RADIUS = 400;
const DEACTIVATE_RADIUS = 600;

export default class CampManager {
  constructor(scene, campData) {
    this.scene = scene;
    this.camps = campData.map(c => ({
      x: c.x,
      y: c.y,
      worldX: c.x * TILE_SIZE + TILE_SIZE / 2,
      worldY: c.y * TILE_SIZE + TILE_SIZE / 2,
      config: c.config,
      typeKey: c.typeKey,
      enemies: [],
      respawnTimers: [],
      sprites: [],
      active: false,
    }));
  }

  renderCamps(scene) {
    for (const camp of this.camps) {
      // Tent sprite
      if (scene.textures.exists('detail_camp_tent')) {
        const tent = scene.add.sprite(camp.worldX, camp.worldY, 'detail_camp_tent');
        tent.setDepth(2);
        tent.setAlpha(0.9);
        camp.sprites.push(tent);
      }
      // Campfire sprite offset slightly
      if (scene.textures.exists('detail_camp_fire')) {
        const fire = scene.add.sprite(camp.worldX + 12, camp.worldY + 8, 'detail_camp_fire');
        fire.setDepth(2);
        camp.sprites.push(fire);

        // Flicker animation
        scene.tweens.add({
          targets: fire,
          alpha: 0.6,
          scaleX: 0.9,
          scaleY: 1.1,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  update(dt, playerX, playerY) {
    for (const camp of this.camps) {
      const dist = distance(camp.worldX, camp.worldY, playerX, playerY);

      if (dist < ACTIVE_RADIUS) {
        // Activate camp
        if (!camp.active) {
          camp.active = true;
        }

        // Update respawn timers
        const dtMs = dt * 1000;
        for (let i = camp.respawnTimers.length - 1; i >= 0; i--) {
          camp.respawnTimers[i] -= dtMs;
          if (camp.respawnTimers[i] <= 0) {
            camp.respawnTimers.splice(i, 1);
            this._spawnEnemy(camp);
          }
        }

        // Spawn initial enemies if needed
        const totalEnemies = camp.enemies.length + camp.respawnTimers.length;
        while (totalEnemies < camp.config.maxEnemies && camp.enemies.length < camp.config.maxEnemies) {
          this._spawnEnemy(camp);
        }

        // Update active enemies
        for (let i = camp.enemies.length - 1; i >= 0; i--) {
          const enemy = camp.enemies[i];
          if (!enemy.active) {
            camp.enemies.splice(i, 1);
            // Queue respawn
            camp.respawnTimers.push(camp.config.respawnTime);
            continue;
          }
          enemy.update(dt, playerX, playerY);
        }
      } else if (dist > DEACTIVATE_RADIUS && camp.active) {
        // Deactivate camp - despawn enemies
        camp.active = false;
        for (const enemy of camp.enemies) {
          if (enemy.active) enemy.destroy();
        }
        camp.enemies = [];
        camp.respawnTimers = [];
      }
    }
  }

  _spawnEnemy(camp) {
    const enemyConfig = ENEMY_TYPES[camp.config.enemyType];
    if (!enemyConfig) return;

    // Spawn at random offset within patrol radius
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * camp.config.patrolRadius * 0.5;
    const spawnX = camp.worldX + Math.cos(angle) * dist;
    const spawnY = camp.worldY + Math.sin(angle) * dist;

    const enemy = new Enemy(
      this.scene, spawnX, spawnY, enemyConfig,
      camp.worldX, camp.worldY, camp.config.patrolRadius, camp.config.ventureRadius
    );
    camp.enemies.push(enemy);
  }

  getActiveEnemies() {
    const all = [];
    for (const camp of this.camps) {
      for (const enemy of camp.enemies) {
        if (enemy.active) all.push(enemy);
      }
    }
    return all;
  }

  getCampPositions() {
    return this.camps.map(c => ({ x: c.x, y: c.y }));
  }

  destroyAll() {
    for (const camp of this.camps) {
      for (const enemy of camp.enemies) {
        if (enemy.active) enemy.destroy();
      }
      camp.enemies = [];
      camp.respawnTimers = [];
      camp.active = false;
    }
  }
}
