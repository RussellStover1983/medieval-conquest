import { distance } from '../utils/MathHelpers.js';

export const UNIT_STATE = {
  IDLE: 0,
  MOVE_TO: 1,
  WORKING: 2,
  RETURNING: 3,
  FLEEING: 4,
  DEAD: 5,
};

export default class Unit {
  constructor(scene, x, y, typeKey, config, owner, homeBuilding) {
    this.scene = scene;
    this.typeKey = typeKey;
    this.config = config;
    this.owner = owner;
    this.homeBuilding = homeBuilding;
    this.state = UNIT_STATE.IDLE;
    this.selected = false;
    this.active = true;

    // Target movement
    this.targetX = x;
    this.targetY = y;

    // Create sprite
    const idleKey = `unit_${typeKey}_idle_0`;
    this.sprite = scene.add.sprite(x, y, idleKey);
    this.sprite.setTint(config.color);
    this.sprite.setDepth(9);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.play(`unit_${typeKey}_idle`, true);

    // Health
    this.maxHealth = config.hp;
    this.health = this.maxHealth;

    // Health bar
    const barWidth = config.size + 4;
    const barHeight = 3;
    const barY = y - config.size / 2 - 6;

    this.healthBarBorder = scene.add.rectangle(x, barY, barWidth + 2, barHeight + 2, 0x222222);
    this.healthBarBorder.setDepth(11).setOrigin(0.5, 0.5);

    this.healthBarBg = scene.add.rectangle(x, barY, barWidth, barHeight, 0x333333);
    this.healthBarBg.setDepth(12).setOrigin(0.5, 0.5);

    this.healthBarFill = scene.add.rectangle(x, barY, barWidth, barHeight, 0x4488ff);
    this.healthBarFill.setDepth(13).setOrigin(0, 0.5);
    this.healthBarFill.setPosition(x - barWidth / 2, barY);

    // Selection circle (hidden by default)
    this.selectionCircle = scene.add.sprite(x, y, 'unit_selection_circle');
    this.selectionCircle.setTint(0x44ff44);
    this.selectionCircle.setDepth(8);
    this.selectionCircle.setAlpha(0);

    // Timers
    this.attackTimer = 0;
    this.knockbackTimer = 0;
  }

  update(dt) {
    if (!this.active) return;

    const dtMs = dt * 1000;
    if (this.attackTimer > 0) this.attackTimer -= dtMs;
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dtMs;
      this._updateVisuals();
      return;
    }

    this._updateState(dt, dtMs);
    this._updateVisuals();
  }

  _updateState(dt, dtMs) {
    // Override in subclass
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.state = UNIT_STATE.MOVE_TO;
  }

  _moveToward(tx, ty, speed) {
    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
      this.sprite.body.setVelocity(0, 0);
      return true; // arrived
    }

    this.sprite.body.setVelocity(
      (dx / dist) * speed,
      (dy / dist) * speed
    );
    this.sprite.setFlipX(dx < 0);

    // Play move anim
    const moveKey = `unit_${this.typeKey}_move`;
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== moveKey) {
      this.sprite.play(moveKey, true);
    }

    return false;
  }

  _stopMoving() {
    this.sprite.body.setVelocity(0, 0);
    const idleKey = `unit_${this.typeKey}_idle`;
    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== idleKey) {
      this.sprite.play(idleKey, true);
    }
  }

  select() {
    this.selected = true;
    this.selectionCircle.setAlpha(0.6);
  }

  deselect() {
    this.selected = false;
    this.selectionCircle.setAlpha(0);
  }

  takeDamage(amount) {
    if (!this.active) return;

    // Apply armor reduction for White Knight
    if (this.config.damageReduction) {
      amount = Math.round(amount * (1 - this.config.damageReduction));
    }

    this.health -= amount;

    // Flash
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (!this.active) return;
      this.sprite.setTintFill(0xff4444);
      this.scene.time.delayedCall(80, () => {
        if (this.active) this.sprite.setTint(this.config.color);
      });
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.state = UNIT_STATE.DEAD;
    this.active = false;
    this.sprite.body.setVelocity(0, 0);

    if (this.scene.particleManager) {
      this.scene.particleManager.emitBlood(this.sprite.x, this.sprite.y);
    }

    this.sprite.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });

    this.scene.tweens.add({
      targets: [this.healthBarBorder, this.healthBarBg, this.healthBarFill, this.selectionCircle],
      alpha: 0,
      duration: 200,
    });
  }

  _updateVisuals() {
    const barWidth = this.config.size + 4;
    const barY = this.sprite.y - this.config.size / 2 - 6;
    const barX = this.sprite.x;

    this.healthBarBorder.setPosition(barX, barY);
    this.healthBarBg.setPosition(barX, barY);

    const hpPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.setPosition(barX - barWidth / 2, barY);
    this.healthBarFill.setScale(hpPercent, 1);

    let fillColor;
    if (hpPercent > 0.5) fillColor = 0x4488ff;
    else if (hpPercent > 0.25) fillColor = 0xddaa22;
    else fillColor = 0xcc3333;
    this.healthBarFill.setFillStyle(fillColor);

    // Selection circle follows
    this.selectionCircle.setPosition(this.sprite.x, this.sprite.y);
  }

  destroy() {
    this.sprite.destroy();
    this.healthBarBorder.destroy();
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.selectionCircle.destroy();
  }
}
