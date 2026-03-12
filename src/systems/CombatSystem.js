import Phaser from 'phaser';
import { COMBAT, TILE_SIZE, WEAPONS } from '../constants.js';
import { distance, tileToWorld } from '../utils/MathHelpers.js';

export default class CombatSystem {
  constructor(scene, player, enemySpawner) {
    this.scene = scene;
    this.player = player;
    this.spawner = enemySpawner;

    this.attackCooldown = 0;
    this.isAttacking = false;

    // SPACE key for attack
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Callback for attack button (touch)
    this.attackRequested = false;
  }

  requestAttack() {
    this.attackRequested = true;
  }

  update(dt) {
    const dtMs = dt * 1000;

    // Cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dtMs;
    }

    // Check for attack input
    if ((Phaser.Input.Keyboard.JustDown(this.attackKey) || this.attackRequested) &&
        this.attackCooldown <= 0 && this.player.health > 0) {
      this.performPlayerAttack();
      // Speed stat modifies cooldown: faster class = shorter cooldown
      const speedMod = 1.4 - (this.player.classData.speed - 3) * (0.6 / 6);
      const weapon = this.player.getWeaponData();
      this.attackCooldown = COMBAT.ATTACK_COOLDOWN * speedMod * weapon.speedMult;
    }
    this.attackRequested = false;

    // Check enemy attacks on player and soldiers
    const enemies = this.spawner.getActiveEnemies();
    const soldiers = this.scene.unitManager ? this.scene.unitManager.getSoldiers() : [];

    for (const enemy of enemies) {
      if (enemy.canAttack()) {
        // Find nearest target: player or soldier
        const playerDist = distance(enemy.sprite.x, enemy.sprite.y,
                              this.player.sprite.x, this.player.sprite.y);

        let nearestSoldier = null;
        let nearestSoldierDist = Infinity;
        for (const soldier of soldiers) {
          if (!soldier.active) continue;
          const d = distance(enemy.sprite.x, enemy.sprite.y, soldier.sprite.x, soldier.sprite.y);
          if (d < nearestSoldierDist) {
            nearestSoldierDist = d;
            nearestSoldier = soldier;
          }
        }

        if (nearestSoldier && nearestSoldierDist < enemy.config.attackRange * 1.5 &&
            nearestSoldierDist <= playerDist) {
          // Attack soldier
          enemy.performAttack();
          nearestSoldier.takeDamage(enemy.config.damage);
          if (this.scene.particleManager) {
            this.scene.particleManager.emitBlood(nearestSoldier.sprite.x, nearestSoldier.sprite.y);
          }
        } else if (playerDist < enemy.config.attackRange * 1.5) {
          enemy.performAttack();
          this.damagePlayer(enemy);
        }
      }

      // Also allow enemies to chase soldiers (aggro on nearest soldier)
      if (enemy.state === 0 /* IDLE */) {
        for (const soldier of soldiers) {
          if (!soldier.active) continue;
          const d = distance(enemy.sprite.x, enemy.sprite.y, soldier.sprite.x, soldier.sprite.y);
          if (d < enemy.config.aggroRange) {
            enemy.state = 1; // CHASE
            break;
          }
        }
      }
    }
  }

  performPlayerAttack() {
    this.isAttacking = true;

    // Play attack animation
    this.player.playAttackAnim();

    // Calculate hitbox position based on facing direction + weapon reach
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const weaponData = this.player.getWeaponData();
    const reach = weaponData.reach;
    const offsets = {
      up:    { x: 0, y: -COMBAT.ATTACK_DEPTH / 2 - 12 - reach },
      down:  { x: 0, y: COMBAT.ATTACK_DEPTH / 2 + 12 + reach },
      left:  { x: -COMBAT.ATTACK_DEPTH / 2 - 12 - reach, y: 0 },
      right: { x: COMBAT.ATTACK_DEPTH / 2 + 12 + reach, y: 0 },
    };
    const off = offsets[this.player.facing];
    const hitX = px + off.x;
    const hitY = py + off.y;

    // 3-part weapon trail (white→light blue, staggered 25ms, each fades with scaleX stretch)
    const isHorizontal = this.player.facing === 'left' || this.player.facing === 'right';
    const flashW = isHorizontal ? COMBAT.ATTACK_DEPTH : COMBAT.ATTACK_WIDTH;
    const flashH = isHorizontal ? COMBAT.ATTACK_WIDTH : COMBAT.ATTACK_DEPTH;

    const trailColors = weaponData.trailColors;
    const trailAlphas = [0.6, 0.4, 0.25];

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 25, () => {
        const trail = this.scene.add.rectangle(hitX, hitY, flashW, flashH, trailColors[i], trailAlphas[i]);
        trail.setDepth(15);

        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: isHorizontal ? 1.5 : 1,
          scaleY: isHorizontal ? 1 : 1.5,
          duration: 120,
          ease: 'Power2',
          onComplete: () => trail.destroy(),
        });
      });
    }

    // Clear attack state after last trail
    this.scene.time.delayedCall(120, () => {
      this.isAttacking = false;
    });

    // Check hits against enemies
    const enemies = this.spawner.getActiveEnemies();
    const strength = this.player.classData.strength;
    const baseDmg = strength * (1 + Math.random() * 0.3) * weaponData.damageMult;

    let hitAny = false;
    for (const enemy of enemies) {
      const dist = distance(hitX, hitY, enemy.sprite.x, enemy.sprite.y);
      const hitRadius = (flashW + flashH) / 4 + enemy.config.size / 2;
      if (dist < hitRadius) {
        enemy.takeDamage(Math.round(baseDmg));
        enemy.applyKnockback(px, py, COMBAT.KNOCKBACK_FORCE, COMBAT.KNOCKBACK_DURATION);

        // Blood particles on hit
        if (this.scene.particleManager) {
          this.scene.particleManager.emitBlood(enemy.sprite.x, enemy.sprite.y);
          // Impact sparks
          this.scene.particleManager.emitSparks(enemy.sprite.x, enemy.sprite.y);
        }

        hitAny = true;

        // Enemy died - drop resources
        if (enemy.health <= 0) {
          const drop = enemy.getDrops();
          this.player.collectResource(drop.type, drop.value);
          this.scene.events.emit('resourceCollected', drop.type, drop.value);
          this.scene.events.emit('enemyKilled', enemy);
        }
      }
    }

    // Screen shake on hit
    if (hitAny) {
      this.scene.cameras.main.shake(100, 0.003);
    }

    // Harvesting: check tool or weapon against harvestable sprites
    // Axe weapon chops trees, pickaxe tool mines stone
    if (this.scene.mapRenderer) {
      const harvestTool = this.player.activeTool || (this.player.weapon !== 'none' ? this.player.weapon : null);
      if (harvestTool) {
        const harvestHitRadius = (flashW + flashH) / 3;
        const result = this.scene.mapRenderer.tryHarvest(hitX, hitY, harvestHitRadius, harvestTool);
        if (result) {
          this.player.collectResource(result.resource, result.amount);
          this.scene.events.emit('resourceCollected', result.resource, result.amount);
        }
      }
    }
  }

  damagePlayer(enemy) {
    const defense = this.player.classData.defense;
    const rawDmg = enemy.config.damage;
    const damage = Math.max(1, Math.round(rawDmg * (1 - defense * 0.05)));

    this.player.takeDamage(damage);

    // Blood particles on player hit
    if (this.scene.particleManager) {
      this.scene.particleManager.emitBlood(this.player.sprite.x, this.player.sprite.y);
    }

    // Knockback player away from enemy
    const dx = this.player.sprite.x - enemy.sprite.x;
    const dy = this.player.sprite.y - enemy.sprite.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.player.sprite.body.setVelocity(
      (dx / len) * COMBAT.KNOCKBACK_FORCE,
      (dy / len) * COMBAT.KNOCKBACK_FORCE
    );

    // Brief red tint flash
    this.player.sprite.setTintFill(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.player.sprite.setTint(this.player.classData.color);
    });

    // Screen shake + red flash on player damage
    this.scene.cameras.main.shake(150, 0.005);
    this.scene.cameras.main.flash(100, 255, 0, 0);

    // Check death
    if (this.player.health <= 0) {
      this.handlePlayerDeath();
    }
  }

  handlePlayerDeath() {
    this.player.sprite.body.setVelocity(0, 0);
    this.scene.events.emit('playerDied');

    // Fade out then respawn
    this.scene.cameras.main.fadeOut(800, 0, 0, 0);
    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      this.respawnPlayer();
      this.scene.cameras.main.fadeIn(800, 0, 0, 0);
    });
  }

  respawnPlayer() {
    // Find nearest village
    const villages = this.scene.mapData.villages;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    let nearestVillage = villages[0];
    let nearestDist = Infinity;

    for (const v of villages) {
      const vWorld = tileToWorld(v.x, v.y, TILE_SIZE);
      const d = distance(px, py, vWorld.x, vWorld.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestVillage = v;
      }
    }

    const spawnPos = tileToWorld(nearestVillage.x, nearestVillage.y, TILE_SIZE);
    this.player.respawn(spawnPos.x, spawnPos.y);

    // Clear nearby enemies
    this.spawner.destroyAll();

    this.scene.events.emit('playerRespawned');
  }
}
