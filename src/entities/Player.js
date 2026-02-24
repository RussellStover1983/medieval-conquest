import { TILE_SIZE, PLAYER_BASE_SPEED, COMBAT } from '../constants.js';
import { CHARACTER_CLASSES } from './CharacterClasses.js';
import { getTerrainConfig } from '../map/TerrainTypes.js';
import { worldToTile } from '../utils/MathHelpers.js';

export default class Player {
  constructor(scene, x, y, className) {
    this.scene = scene;
    this.className = className;
    this.classData = CHARACTER_CLASSES[className];

    // Create animated sprite (white silhouette tinted per class)
    this.sprite = scene.add.sprite(x, y, 'player_idle_down_0');
    this.sprite.setTint(this.classData.color);
    this.sprite.setDepth(10);

    // Physics body
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setSize(16, 16);
    this.sprite.body.setOffset(4, 4);
    this.sprite.body.setCollideWorldBounds(true);

    // Stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.inventory = {
      gold: 0,
      silver: 0,
      emerald: 0,
      ruby: 0,
    };

    // Movement
    this.baseSpeed = PLAYER_BASE_SPEED;
    this.currentSpeedMod = 1;
    this.facing = 'down';
    this.isMoving = false;

    // Combat
    this.isAttacking = false;
    this.isDead = false;

    // Animation state
    this.currentAnim = '';
    this.dustTimer = 0;

    // Idle breathing tween
    this.breathTween = scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.04,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start idle animation
    this._playAnim('idle', this.facing);
  }

  _playAnim(type, dir) {
    const key = `player_${type}_${dir}`;
    if (this.currentAnim === key) return;
    this.currentAnim = key;

    if (this.sprite.anims) {
      this.sprite.play(key, true);
    }
  }

  getSpeed() {
    const statMod = 0.6 + (this.classData.speed - 3) * (0.8 / 6);
    return this.baseSpeed * statMod * this.currentSpeedMod;
  }

  updateTerrainSpeed(terrain) {
    const tile = worldToTile(this.sprite.x, this.sprite.y, TILE_SIZE);
    if (tile.x >= 0 && tile.x < terrain[0].length && tile.y >= 0 && tile.y < terrain.length) {
      const terrainType = terrain[tile.y][tile.x];
      const config = getTerrainConfig(terrainType);
      this.currentSpeedMod = config.speedModifier;
    }
  }

  isPassable(tileX, tileY, terrain) {
    if (tileX < 0 || tileX >= terrain[0].length || tileY < 0 || tileY >= terrain.length) return false;
    return getTerrainConfig(terrain[tileY][tileX]).passable;
  }

  move(velocityX, velocityY, terrain) {
    this.updateTerrainSpeed(terrain);
    const speed = this.getSpeed();

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const len = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      velocityX = (velocityX / len) * speed;
      velocityY = (velocityY / len) * speed;
    } else {
      velocityX *= speed;
      velocityY *= speed;
    }

    // Check current tile — if already on impassable, always allow movement out
    const curTile = worldToTile(this.sprite.x, this.sprite.y, TILE_SIZE);
    const onImpassable = !this.isPassable(curTile.x, curTile.y, terrain);

    if (!onImpassable) {
      const dt = 1 / 60;
      const nextTileX = worldToTile(this.sprite.x + velocityX * dt, this.sprite.y, TILE_SIZE);
      if (!this.isPassable(nextTileX.x, nextTileX.y, terrain)) {
        velocityX = 0;
      }
      const nextTileY = worldToTile(this.sprite.x, this.sprite.y + velocityY * dt, TILE_SIZE);
      if (!this.isPassable(nextTileY.x, nextTileY.y, terrain)) {
        velocityY = 0;
      }
    }

    this.sprite.body.setVelocity(velocityX, velocityY);

    // Update facing direction
    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      this.facing = velocityX > 0 ? 'right' : 'left';
    } else if (velocityY !== 0) {
      this.facing = velocityY > 0 ? 'down' : 'up';
    }

    // Track moving state for animations
    const wasMoving = this.isMoving;
    this.isMoving = velocityX !== 0 || velocityY !== 0;

    if (this.isMoving && !this.isAttacking) {
      this._playAnim('walk', this.facing);

      // Pause breathing while walking
      if (this.breathTween && this.breathTween.isPlaying) {
        this.breathTween.pause();
        this.sprite.setScale(1, 1);
      }
    }
  }

  playAttackAnim() {
    this.isAttacking = true;
    this._playAnim('attack', this.facing);

    // Pause breathing during attack
    if (this.breathTween && this.breathTween.isPlaying) {
      this.breathTween.pause();
      this.sprite.setScale(1, 1);
    }

    this.scene.time.delayedCall(250, () => {
      this.isAttacking = false;
    });
  }

  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;

    if (!this.isAttacking) {
      this._playAnim('idle', this.facing);

      // Resume breathing
      if (this.breathTween && !this.breathTween.isPlaying) {
        this.breathTween.resume();
      }
    }
  }

  collectResource(type, value) {
    if (this.inventory[type] !== undefined) {
      this.inventory[type] += value;
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.isDead = true;
  }

  respawn(x, y) {
    this.sprite.setPosition(x, y);
    this.health = Math.round(this.maxHealth * COMBAT.RESPAWN_HP_PERCENT);
    this.isDead = false;
    this.sprite.setTint(this.classData.color);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getTilePosition() {
    return worldToTile(this.sprite.x, this.sprite.y, TILE_SIZE);
  }

  update(dt) {
    // Dust particle emission while moving (throttled)
    if (this.isMoving && this.scene.particleManager) {
      this.dustTimer += (dt || 1 / 60) * 1000;
      if (this.dustTimer >= 200) {
        this.dustTimer = 0;
        this.scene.particleManager.emitDust(this.sprite.x, this.sprite.y + 8);
      }
    } else {
      this.dustTimer = 0;
    }
  }
}
