import Unit, { UNIT_STATE } from './Unit.js';
import { TILE_SIZE, TERRAIN } from '../constants.js';
import { distance, worldToTile, tileToWorld } from '../utils/MathHelpers.js';

const VILLAGER_STATE = {
  IDLE: 0,
  MOVE_TO_RESOURCE: 1,
  GATHERING: 2,
  RETURNING: 3,
  DEPOSITING: 4,
  FLEEING: 5,
  MOVE_TO: UNIT_STATE.MOVE_TO,
};

export default class Villager extends Unit {
  constructor(scene, x, y, typeKey, config, owner, homeBuilding) {
    super(scene, x, y, typeKey, config, owner, homeBuilding);
    this.unitType = 'villager';
    this.villagerState = VILLAGER_STATE.IDLE;
    this.homeX = x;
    this.homeY = y;
    this.gatherTimer = 0;
    this.carried = 0;
    this.maxCarry = 3;
    this.resourceTarget = null;
    this.fleeTimer = 0;
    this.idleTimer = 0;
  }

  _updateState(dt, dtMs) {
    // If player gave a move command, prioritize it
    if (this.state === UNIT_STATE.MOVE_TO) {
      const arrived = this._moveToward(this.targetX, this.targetY, this.config.speed);
      if (arrived) {
        this.state = UNIT_STATE.IDLE;
        this.villagerState = VILLAGER_STATE.IDLE;
        this.homeX = this.sprite.x;
        this.homeY = this.sprite.y;
        this._stopMoving();
      }
      return;
    }

    // Check for nearby enemies — flee behavior
    if (this.villagerState !== VILLAGER_STATE.FLEEING) {
      const enemies = this.scene.enemySpawner ? this.scene.enemySpawner.getActiveEnemies() : [];
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dist = distance(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < 64) {
          this.villagerState = VILLAGER_STATE.FLEEING;
          this.fleeTimer = 5000;
          this._fleeFrom = { x: enemy.sprite.x, y: enemy.sprite.y };
          break;
        }
      }
    }

    switch (this.villagerState) {
      case VILLAGER_STATE.IDLE:
        this._updateIdle(dt, dtMs);
        break;
      case VILLAGER_STATE.MOVE_TO_RESOURCE:
        this._updateMoveToResource(dt, dtMs);
        break;
      case VILLAGER_STATE.GATHERING:
        this._updateGathering(dt, dtMs);
        break;
      case VILLAGER_STATE.RETURNING:
        this._updateReturning(dt, dtMs);
        break;
      case VILLAGER_STATE.DEPOSITING:
        this._updateDepositing(dt, dtMs);
        break;
      case VILLAGER_STATE.FLEEING:
        this._updateFleeing(dt, dtMs);
        break;
    }
  }

  _updateIdle(dt, dtMs) {
    this.idleTimer += dtMs;
    if (this.idleTimer > 1000) {
      this.idleTimer = 0;
      // Find a resource to gather
      this._findResourceTarget();
      if (this.resourceTarget) {
        this.villagerState = VILLAGER_STATE.MOVE_TO_RESOURCE;
      }
    }
    this._stopMoving();
  }

  _updateMoveToResource(dt, dtMs) {
    if (!this.resourceTarget) {
      this.villagerState = VILLAGER_STATE.IDLE;
      return;
    }

    const arrived = this._moveToward(this.resourceTarget.x, this.resourceTarget.y, this.config.speed);
    if (arrived) {
      this.villagerState = VILLAGER_STATE.GATHERING;
      this.gatherTimer = 0;
      this._stopMoving();
    }
  }

  _updateGathering(dt, dtMs) {
    this._stopMoving();
    this.gatherTimer += dtMs;

    if (this.gatherTimer >= this.config.gatherRate) {
      this.gatherTimer = 0;

      if (this.config.gatherResource) {
        const amount = this.config.gatherMin +
          Math.floor(Math.random() * (this.config.gatherMax - this.config.gatherMin + 1));
        this.carried += amount;
      }

      // Check if we've gathered enough (3 cycles worth)
      const cyclesDone = this.carried / Math.max(1, this.config.gatherMin);
      if (cyclesDone >= this.maxCarry || !this.config.gatherResource) {
        this.villagerState = VILLAGER_STATE.RETURNING;
      }
    }
  }

  _updateReturning(dt, dtMs) {
    const arrived = this._moveToward(this.homeX, this.homeY, this.config.speed);
    if (arrived) {
      this.villagerState = VILLAGER_STATE.DEPOSITING;
      this._stopMoving();
    }
  }

  _updateDepositing(dt, dtMs) {
    // Deposit carried resources
    if (this.carried > 0 && this.config.gatherResource) {
      this.owner.collectResource(this.config.gatherResource, this.carried);
      this.scene.events.emit('resourceCollected', this.config.gatherResource, this.carried);
    }
    this.carried = 0;
    this.villagerState = VILLAGER_STATE.IDLE;
    this.idleTimer = 0;
  }

  _updateFleeing(dt, dtMs) {
    this.fleeTimer -= dtMs;

    if (this.fleeTimer <= 0) {
      this.villagerState = VILLAGER_STATE.IDLE;
      this._stopMoving();
      return;
    }

    // Check if enemies are far enough away
    if (this._fleeFrom) {
      const enemies = this.scene.enemySpawner ? this.scene.enemySpawner.getActiveEnemies() : [];
      let closestDist = Infinity;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dist = distance(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < closestDist) closestDist = dist;
      }
      if (closestDist > 128) {
        this.villagerState = VILLAGER_STATE.IDLE;
        this._stopMoving();
        return;
      }

      // Run away from the threat
      const dx = this.sprite.x - this._fleeFrom.x;
      const dy = this.sprite.y - this._fleeFrom.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const fleeX = this.sprite.x + (dx / len) * 100;
      const fleeY = this.sprite.y + (dy / len) * 100;
      this._moveToward(fleeX, fleeY, this.config.speed * 1.3);
    }
  }

  _findResourceTarget() {
    if (!this.config.targetTerrains || this.config.targetTerrains.length === 0) {
      // Builder — skip for now (no building repair implemented)
      this.resourceTarget = null;
      return;
    }

    const terrain = this.scene.mapData ? this.scene.mapData.terrain : null;
    if (!terrain) return;

    const tilePos = worldToTile(this.sprite.x, this.sprite.y, TILE_SIZE);
    const searchRadius = 8;
    let bestDist = Infinity;
    let bestTile = null;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const tx = tilePos.x + dx;
        const ty = tilePos.y + dy;
        if (ty < 0 || ty >= terrain.length || tx < 0 || tx >= terrain[0].length) continue;
        const t = terrain[ty][tx];
        if (this.config.targetTerrains.includes(t)) {
          const worldPos = tileToWorld(tx, ty, TILE_SIZE);
          const dist = distance(this.sprite.x, this.sprite.y, worldPos.x, worldPos.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestTile = worldPos;
          }
        }
      }
    }

    this.resourceTarget = bestTile;
  }

  // Override moveTo for player commands
  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.state = UNIT_STATE.MOVE_TO;
    this.villagerState = VILLAGER_STATE.MOVE_TO;
    this.resourceTarget = null;
  }
}
