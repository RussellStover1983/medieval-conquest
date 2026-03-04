import { TILE_SIZE } from '../constants.js';
import { distance } from '../utils/MathHelpers.js';

const STATE = { IDLE: 0, CHASE: 1, ATTACK: 2, DEAD: 3, RETURN: 4 };

export default class Enemy {
  constructor(scene, x, y, config, campX = null, campY = null, patrolRadius = 80, ventureRadius = 160) {
    this.scene = scene;
    this.config = config;
    this.state = STATE.IDLE;

    // Camp-aware properties
    this.campX = campX;
    this.campY = campY;
    this.patrolRadius = patrolRadius;
    this.ventureRadius = ventureRadius;

    // Determine enemy type key for texture lookup
    this.typeKey = config.name.replace(/\s/g, '');

    // Create animated sprite with tint
    const idleKey = `enemy_${this.typeKey}_idle_0`;
    this.sprite = scene.add.sprite(x, y, idleKey);
    this.sprite.setTint(config.color);
    this.sprite.setDepth(9);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // Play idle animation
    this.sprite.play(`enemy_${this.typeKey}_idle`, true);

    // Health
    this.maxHealth = config.hp;
    this.health = this.maxHealth;

    // Health bar with border
    const size = config.size;
    const barWidth = size + 4;
    const barHeight = 4;
    const barY = y - size / 2 - 8;

    // 1px border (slightly larger bg)
    this.healthBarBorder = scene.add.rectangle(x, barY, barWidth + 2, barHeight + 2, 0x222222);
    this.healthBarBorder.setDepth(11);
    this.healthBarBorder.setOrigin(0.5, 0.5);

    // Background
    this.healthBarBg = scene.add.rectangle(x, barY, barWidth, barHeight, 0x333333);
    this.healthBarBg.setDepth(12);
    this.healthBarBg.setOrigin(0.5, 0.5);

    // Fill (starts green)
    this.healthBarFill = scene.add.rectangle(x, barY, barWidth, barHeight, 0x6aaa3a);
    this.healthBarFill.setDepth(13);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setPosition(x - barWidth / 2, barY);

    // 1px white highlight on top
    this.healthBarHighlight = scene.add.rectangle(x, barY - 1, barWidth, 1, 0xffffff);
    this.healthBarHighlight.setDepth(13);
    this.healthBarHighlight.setAlpha(0.3);
    this.healthBarHighlight.setOrigin(0.5, 0.5);

    // Combat timing
    this.attackTimer = 0;
    this.knockbackTimer = 0;

    // Idle wander / patrol
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 1000 + Math.random() * 2000;
    this.idleTimer = 0;
    this.patrolTargetX = null;
    this.patrolTargetY = null;

    // Track if active
    this.active = true;
  }

  update(dt, playerX, playerY) {
    if (!this.active) return;

    const dtMs = dt * 1000;

    // Update timers
    if (this.attackTimer > 0) this.attackTimer -= dtMs;
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dtMs;
      this.updateHealthBar();
      return;
    }

    const dist = distance(this.sprite.x, this.sprite.y, playerX, playerY);

    switch (this.state) {
      case STATE.IDLE:
        this.updateIdle(dt, dtMs, dist, playerX, playerY);
        break;
      case STATE.CHASE:
        this.updateChase(dist, playerX, playerY);
        break;
      case STATE.ATTACK:
        this.updateAttack(dtMs, dist, playerX, playerY);
        break;
      case STATE.RETURN:
        this.updateReturn(dist, playerX, playerY);
        break;
    }

    this.updateHealthBar();
  }

  updateIdle(dt, dtMs, dist, playerX, playerY) {
    // Check aggro
    if (dist < this.config.aggroRange) {
      this.state = STATE.CHASE;
      this.sprite.play(`enemy_${this.typeKey}_chase`, true);
      return;
    }

    // Play idle anim if not already
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== `enemy_${this.typeKey}_idle`) {
      this.sprite.play(`enemy_${this.typeKey}_idle`, true);
    }

    // Camp patrol or random wander
    if (this.campX !== null) {
      // Patrol around camp
      this.idleTimer += dtMs;
      if (this.idleTimer >= this.wanderTimer || this.patrolTargetX === null) {
        this.idleTimer = 0;
        this.wanderTimer = 1500 + Math.random() * 2500;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * this.patrolRadius;
        this.patrolTargetX = this.campX + Math.cos(angle) * r;
        this.patrolTargetY = this.campY + Math.sin(angle) * r;
      }

      const dx = this.patrolTargetX - this.sprite.x;
      const dy = this.patrolTargetY - this.sprite.y;
      const patrolDist = Math.sqrt(dx * dx + dy * dy);

      if (patrolDist < 5) {
        this.sprite.body.setVelocity(0, 0);
      } else {
        const wanderSpeed = this.config.speed * 0.3;
        this.sprite.body.setVelocity(
          (dx / patrolDist) * wanderSpeed,
          (dy / patrolDist) * wanderSpeed
        );
        this.sprite.setFlipX(dx < 0);
      }
    } else {
      // Original random wander (no camp)
      this.idleTimer += dtMs;
      if (this.idleTimer >= this.wanderTimer) {
        this.idleTimer = 0;
        this.wanderTimer = 1000 + Math.random() * 2000;
        this.wanderAngle = Math.random() * Math.PI * 2;
      }

      const wanderSpeed = this.config.speed * 0.3;
      const vx = Math.cos(this.wanderAngle) * wanderSpeed;
      const vy = Math.sin(this.wanderAngle) * wanderSpeed;
      this.sprite.body.setVelocity(vx, vy);
      this.sprite.setFlipX(vx < 0);
    }
  }

  updateChase(dist, playerX, playerY) {
    // Check venture radius — if too far from camp, return
    if (this.campX !== null) {
      const campDist = distance(this.sprite.x, this.sprite.y, this.campX, this.campY);
      if (campDist > this.ventureRadius) {
        this.state = STATE.RETURN;
        this.sprite.play(`enemy_${this.typeKey}_chase`, true);
        return;
      }
    }

    // Deaggro if too far
    if (dist > 192) {
      if (this.campX !== null) {
        this.state = STATE.RETURN;
      } else {
        this.state = STATE.IDLE;
        this.sprite.body.setVelocity(0, 0);
        this.sprite.play(`enemy_${this.typeKey}_idle`, true);
      }
      return;
    }

    // In attack range?
    if (dist < this.config.attackRange) {
      this.state = STATE.ATTACK;
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    // Play chase anim if not already
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== `enemy_${this.typeKey}_chase`) {
      this.sprite.play(`enemy_${this.typeKey}_chase`, true);
    }

    // Chase player
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.sprite.body.setVelocity(
      (dx / len) * this.config.speed,
      (dy / len) * this.config.speed
    );

    // Flip sprite based on direction
    this.sprite.setFlipX(dx < 0);
  }

  updateAttack(dtMs, dist, playerX, playerY) {
    if (dist > this.config.attackRange * 1.5) {
      this.state = STATE.CHASE;
      return;
    }

    this.sprite.body.setVelocity(0, 0);

    if (this.attackTimer <= 0) {
      this.attackTimer = this.config.attackCooldown;
      return true;
    }
    return false;
  }

  updateReturn(dist, playerX, playerY) {
    if (this.campX === null) {
      this.state = STATE.IDLE;
      return;
    }

    // Walk back to camp
    const dx = this.campX - this.sprite.x;
    const dy = this.campY - this.sprite.y;
    const campDist = Math.sqrt(dx * dx + dy * dy);

    if (campDist < this.patrolRadius * 0.5) {
      // Close enough to camp, go idle
      this.state = STATE.IDLE;
      this.sprite.body.setVelocity(0, 0);
      this.sprite.play(`enemy_${this.typeKey}_idle`, true);
      this.patrolTargetX = null;
      return;
    }

    // Play chase anim (reuse for movement)
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== `enemy_${this.typeKey}_chase`) {
      this.sprite.play(`enemy_${this.typeKey}_chase`, true);
    }

    const len = campDist || 1;
    this.sprite.body.setVelocity(
      (dx / len) * this.config.speed,
      (dy / len) * this.config.speed
    );
    this.sprite.setFlipX(dx < 0);
  }

  canAttack() {
    return this.state === STATE.ATTACK && this.attackTimer <= 0;
  }

  performAttack() {
    this.attackTimer = this.config.attackCooldown;
  }

  takeDamage(amount) {
    if (!this.active) return;
    this.health -= amount;

    // Two-phase flash: white 50ms → red 80ms → restore
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (!this.active) return;
      this.sprite.setTintFill(0xff4444);
      this.scene.time.delayedCall(80, () => {
        if (this.active) this.sprite.setTint(this.config.color);
      });
    });

    // Squash-stretch effect
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 0.7,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  applyKnockback(fromX, fromY, force, duration) {
    const dx = this.sprite.x - fromX;
    const dy = this.sprite.y - fromY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.sprite.body.setVelocity((dx / len) * force, (dy / len) * force);
    this.knockbackTimer = duration;
  }

  die() {
    this.state = STATE.DEAD;
    this.active = false;
    this.sprite.body.setVelocity(0, 0);

    // Emit blood + sparks on death
    if (this.scene.particleManager) {
      this.scene.particleManager.emitBlood(this.sprite.x, this.sprite.y);
      this.scene.particleManager.emitSparks(this.sprite.x, this.sprite.y);
    }

    // Enhanced death: flash white → expand + fade (400ms)
    this.sprite.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });

    // Fade health bars immediately
    this.scene.tweens.add({
      targets: [this.healthBarBorder, this.healthBarBg, this.healthBarFill, this.healthBarHighlight],
      alpha: 0,
      duration: 200,
    });
  }

  updateHealthBar() {
    const size = this.config.size;
    const barWidth = size + 4;
    const barY = this.sprite.y - size / 2 - 8;
    const barX = this.sprite.x;

    this.healthBarBorder.setPosition(barX, barY);
    this.healthBarBg.setPosition(barX, barY);
    this.healthBarHighlight.setPosition(barX, barY - 1);

    const hpPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.setPosition(barX - barWidth / 2, barY);
    this.healthBarFill.setScale(hpPercent, 1);

    // Color transitions: green (>50%) → yellow (>25%) → red
    let fillColor;
    if (hpPercent > 0.5) {
      fillColor = 0x6aaa3a; // green
    } else if (hpPercent > 0.25) {
      fillColor = 0xddaa22; // yellow
    } else {
      fillColor = 0xcc3333; // red
    }
    this.healthBarFill.setFillStyle(fillColor);
  }

  destroy() {
    this.sprite.destroy();
    this.healthBarBorder.destroy();
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.healthBarHighlight.destroy();
  }

  getDrops() {
    const drop = this.config.drop;
    const value = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
    return { type: drop.type, value };
  }
}

export { STATE };
