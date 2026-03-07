import Unit, { UNIT_STATE } from './Unit.js';
import { distance } from '../utils/MathHelpers.js';

const SOLDIER_STATE = {
  IDLE: 0,
  PATROL: 1,
  CHASE_ENEMY: 2,
  ATTACK_ENEMY: 3,
  RETURN_HOME: 4,
  MOVE_TO: UNIT_STATE.MOVE_TO,
};

export default class Soldier extends Unit {
  constructor(scene, x, y, typeKey, config, owner, homeBuilding) {
    super(scene, x, y, typeKey, config, owner, homeBuilding);
    this.unitType = 'soldier';
    this.soldierState = SOLDIER_STATE.IDLE;
    this.targetEnemy = null;
    this.patrolTargetX = null;
    this.patrolTargetY = null;
    this.idleTimer = 0;
    this.wanderTimer = 1500 + Math.random() * 2000;
    this.homeX = x;
    this.homeY = y;
    this.hasChargeBoost = false;
    this.chargeTimer = 0;

    // Fear aura on spawn for Black Knight
    if (config.special === 'lifesteal') {
      this._applyFearAura();
    }
  }

  _applyFearAura() {
    if (!this.scene.unitManager) return;
    // Get nearby enemies and make them flee briefly
    const enemies = this.scene.enemySpawner ? this.scene.enemySpawner.getActiveEnemies() : [];
    for (const enemy of enemies) {
      const dist = distance(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
      if (dist < this.config.fearRadius && enemy.active) {
        // Push enemy away
        const dx = enemy.sprite.x - this.sprite.x;
        const dy = enemy.sprite.y - this.sprite.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.sprite.body.setVelocity((dx / len) * 150, (dy / len) * 150);
      }
    }
  }

  _updateState(dt, dtMs) {
    // If player gave a move command, prioritize it
    if (this.state === UNIT_STATE.MOVE_TO) {
      const arrived = this._moveToward(this.targetX, this.targetY, this.config.speed);
      if (arrived) {
        this.state = UNIT_STATE.IDLE;
        this.soldierState = SOLDIER_STATE.IDLE;
        this.homeX = this.sprite.x;
        this.homeY = this.sprite.y;
        this._stopMoving();
      }
      return;
    }

    // Get nearby enemies
    const enemies = this.scene.enemySpawner ? this.scene.enemySpawner.getActiveEnemies() : [];

    switch (this.soldierState) {
      case SOLDIER_STATE.IDLE:
      case SOLDIER_STATE.PATROL:
        this._updatePatrol(dt, dtMs, enemies);
        break;
      case SOLDIER_STATE.CHASE_ENEMY:
        this._updateChase(dt, dtMs, enemies);
        break;
      case SOLDIER_STATE.ATTACK_ENEMY:
        this._updateAttack(dt, dtMs, enemies);
        break;
      case SOLDIER_STATE.RETURN_HOME:
        this._updateReturn(dt, dtMs, enemies);
        break;
    }
  }

  _updatePatrol(dt, dtMs, enemies) {
    // Check for enemies in aggro range
    const nearestEnemy = this._findNearestEnemy(enemies, 96);
    if (nearestEnemy) {
      this.targetEnemy = nearestEnemy;
      this.soldierState = SOLDIER_STATE.CHASE_ENEMY;
      // White Knight charge boost
      if (this.config.special === 'armor' && !this.hasChargeBoost) {
        this.hasChargeBoost = true;
        this.chargeTimer = 1000;
      }
      return;
    }

    // Patrol around home
    this.idleTimer += dtMs;
    if (this.idleTimer >= this.wanderTimer || this.patrolTargetX === null) {
      this.idleTimer = 0;
      this.wanderTimer = 1500 + Math.random() * 2500;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 64;
      this.patrolTargetX = this.homeX + Math.cos(angle) * r;
      this.patrolTargetY = this.homeY + Math.sin(angle) * r;
    }

    const arrived = this._moveToward(this.patrolTargetX, this.patrolTargetY, this.config.speed * 0.3);
    if (arrived) {
      this._stopMoving();
    }
  }

  _updateChase(dt, dtMs, enemies) {
    if (!this.targetEnemy || !this.targetEnemy.active) {
      this.targetEnemy = null;
      this.soldierState = SOLDIER_STATE.RETURN_HOME;
      return;
    }

    const distToHome = distance(this.sprite.x, this.sprite.y, this.homeX, this.homeY);
    if (distToHome > 200) {
      this.targetEnemy = null;
      this.soldierState = SOLDIER_STATE.RETURN_HOME;
      return;
    }

    const dist = distance(this.sprite.x, this.sprite.y, this.targetEnemy.sprite.x, this.targetEnemy.sprite.y);

    if (dist < this.config.attackRange) {
      this.soldierState = SOLDIER_STATE.ATTACK_ENEMY;
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    // Charge boost for White Knight
    let speed = this.config.speed;
    if (this.chargeTimer > 0) {
      speed *= 1.5;
      this.chargeTimer -= dtMs;
    }

    this._moveToward(this.targetEnemy.sprite.x, this.targetEnemy.sprite.y, speed);
  }

  _updateAttack(dt, dtMs, enemies) {
    if (!this.targetEnemy || !this.targetEnemy.active) {
      this.targetEnemy = null;
      this.soldierState = SOLDIER_STATE.RETURN_HOME;
      return;
    }

    const dist = distance(this.sprite.x, this.sprite.y, this.targetEnemy.sprite.x, this.targetEnemy.sprite.y);

    if (dist > this.config.attackRange * 1.5) {
      this.soldierState = SOLDIER_STATE.CHASE_ENEMY;
      return;
    }

    this.sprite.body.setVelocity(0, 0);

    if (this.attackTimer <= 0) {
      this.attackTimer = this.config.attackCooldown;
      this._performAttack(enemies);
    }
  }

  _performAttack(enemies) {
    let dmg = this.config.damage;

    // Berserker rage
    if (this.config.special === 'berserker' && this.health < this.maxHealth * this.config.berserkThreshold) {
      dmg = Math.round(dmg * this.config.berserkMult);
    }

    if (this.config.special === 'ranged') {
      // Archer: ranged projectile
      this._fireArrow(this.targetEnemy, dmg);
      return;
    }

    // Melee attack
    if (this.targetEnemy && this.targetEnemy.active) {
      this.targetEnemy.takeDamage(dmg);
      this.targetEnemy.applyKnockback(this.sprite.x, this.sprite.y, 80, 100);

      if (this.scene.particleManager) {
        this.scene.particleManager.emitSparks(this.targetEnemy.sprite.x, this.targetEnemy.sprite.y);
      }

      // Lifesteal for Black Knight
      if (this.config.special === 'lifesteal') {
        const heal = Math.round(dmg * this.config.lifestealPercent);
        this.health = Math.min(this.maxHealth, this.health + heal);
      }

      // Check enemy death
      if (this.targetEnemy.health <= 0) {
        const drop = this.targetEnemy.getDrops();
        this.owner.collectResource(drop.type, drop.value);
        this.scene.events.emit('resourceCollected', drop.type, drop.value);
        this.scene.events.emit('enemyKilled', this.targetEnemy);
        this.targetEnemy = null;
        this.soldierState = SOLDIER_STATE.RETURN_HOME;
      }
    }

    // Barbarian AoE cleave
    if (this.config.special === 'berserker' && this.config.cleaveRadius) {
      for (const enemy of enemies) {
        if (enemy === this.targetEnemy || !enemy.active) continue;
        const dist = distance(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < this.config.cleaveRadius) {
          enemy.takeDamage(Math.round(dmg * 0.5));
          if (enemy.health <= 0) {
            const drop = enemy.getDrops();
            this.owner.collectResource(drop.type, drop.value);
            this.scene.events.emit('resourceCollected', drop.type, drop.value);
            this.scene.events.emit('enemyKilled', enemy);
          }
        }
      }
    }
  }

  _fireArrow(target, dmg) {
    if (!target || !target.active) return;

    const arrow = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'unit_arrow');
    arrow.setTint(0x8b6b4a);
    arrow.setDepth(10);

    // Rotate toward target
    const angle = Math.atan2(target.sprite.y - this.sprite.y, target.sprite.x - this.sprite.x);
    arrow.setRotation(angle);

    this.scene.tweens.add({
      targets: arrow,
      x: target.sprite.x,
      y: target.sprite.y,
      duration: 300,
      onComplete: () => {
        arrow.destroy();
        if (target.active) {
          // Reduced damage at melee range
          const dist = distance(this.sprite.x, this.sprite.y, target.sprite.x, target.sprite.y);
          const finalDmg = dist < 24 ? Math.round(dmg * 0.5) : dmg;
          target.takeDamage(finalDmg);

          if (target.health <= 0) {
            const drop = target.getDrops();
            this.owner.collectResource(drop.type, drop.value);
            this.scene.events.emit('resourceCollected', drop.type, drop.value);
            this.scene.events.emit('enemyKilled', target);
          }
        }
      },
    });
  }

  _updateReturn(dt, dtMs, enemies) {
    // Check for enemies on the way back
    const nearestEnemy = this._findNearestEnemy(enemies, 64);
    if (nearestEnemy) {
      this.targetEnemy = nearestEnemy;
      this.soldierState = SOLDIER_STATE.CHASE_ENEMY;
      return;
    }

    const arrived = this._moveToward(this.homeX, this.homeY, this.config.speed);
    if (arrived) {
      this.soldierState = SOLDIER_STATE.IDLE;
      this.patrolTargetX = null;
      this._stopMoving();
    }
  }

  _findNearestEnemy(enemies, range) {
    let nearest = null;
    let nearestDist = range;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = distance(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  // Override moveTo for player commands
  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.state = UNIT_STATE.MOVE_TO;
    this.soldierState = SOLDIER_STATE.MOVE_TO;
    this.targetEnemy = null;
  }
}
