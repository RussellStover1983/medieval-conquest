import { UNIT_CAP, SOLDIER_TYPES, VILLAGER_TYPES } from '../constants.js';
import Soldier from '../entities/Soldier.js';
import Villager from '../entities/Villager.js';

export default class UnitManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.units = [];
    this.selectedUnits = [];
    this.unitCap = UNIT_CAP;
  }

  spawnSoldier(typeKey, building) {
    if (this.units.length >= this.unitCap) return null;

    const config = SOLDIER_TYPES[typeKey];
    if (!config) return null;

    // Check costs
    for (const [res, amount] of Object.entries(config.cost)) {
      if ((this.player.currency[res] || 0) < amount) return null;
    }

    // Deduct costs
    for (const [res, amount] of Object.entries(config.cost)) {
      this.player.currency[res] -= amount;
    }

    const x = building.worldX || (building.tileX * 32 + 16);
    const y = building.worldY || (building.tileY * 32 + 16);
    const soldier = new Soldier(this.scene, x, y + 20, typeKey, config, this.player, building);

    // Fade in
    soldier.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: soldier.sprite, alpha: 1, duration: 300 });

    this.units.push(soldier);
    return soldier;
  }

  spawnVillager(typeKey, building) {
    if (this.units.length >= this.unitCap) return null;

    const config = VILLAGER_TYPES[typeKey];
    if (!config) return null;

    // Check costs
    for (const [res, amount] of Object.entries(config.cost)) {
      if ((this.player.currency[res] || 0) < amount) return null;
    }

    // Deduct costs
    for (const [res, amount] of Object.entries(config.cost)) {
      this.player.currency[res] -= amount;
    }

    const x = building.worldX || (building.tileX * 32 + 16);
    const y = building.worldY || (building.tileY * 32 + 16);
    const villager = new Villager(this.scene, x, y + 20, typeKey, config, this.player, building);

    // Fade in
    villager.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: villager.sprite, alpha: 1, duration: 300 });

    this.units.push(villager);
    return villager;
  }

  update(dt) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      if (!unit.active) {
        this.units.splice(i, 1);
        const selIdx = this.selectedUnits.indexOf(unit);
        if (selIdx >= 0) this.selectedUnits.splice(selIdx, 1);
        continue;
      }
      unit.update(dt);
    }
  }

  getUnitsNear(x, y, radius) {
    return this.units.filter(u => {
      if (!u.active) return false;
      const dx = u.sprite.x - x;
      const dy = u.sprite.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }

  selectInRect(x1, y1, x2, y2) {
    this.clearSelection();
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.sprite.x >= minX && unit.sprite.x <= maxX &&
          unit.sprite.y >= minY && unit.sprite.y <= maxY) {
        unit.select();
        this.selectedUnits.push(unit);
      }
    }
  }

  selectAll() {
    this.clearSelection();
    for (const unit of this.units) {
      if (!unit.active) continue;
      unit.select();
      this.selectedUnits.push(unit);
    }
  }

  selectUnit(unit) {
    this.clearSelection();
    if (unit && unit.active) {
      unit.select();
      this.selectedUnits.push(unit);
    }
  }

  commandMoveTo(x, y) {
    for (const unit of this.selectedUnits) {
      if (unit.active) {
        unit.moveTo(x, y);
      }
    }
  }

  clearSelection() {
    for (const unit of this.selectedUnits) {
      unit.deselect();
    }
    this.selectedUnits = [];
  }

  restoreUnits(savedUnits, buildings) {
    if (!savedUnits || !Array.isArray(savedUnits)) return;
    for (const u of savedUnits) {
      // Find home building by tile position
      const home = buildings.find(b => b.tileX === u.homeTileX && b.tileY === u.homeTileY) || { tileX: 0, tileY: 0 };

      let unit;
      if (u.unitType === 'soldier') {
        const config = SOLDIER_TYPES[u.typeKey];
        if (!config) continue;
        unit = new Soldier(this.scene, u.x, u.y, u.typeKey, config, this.player, home);
      } else {
        const config = VILLAGER_TYPES[u.typeKey];
        if (!config) continue;
        unit = new Villager(this.scene, u.x, u.y, u.typeKey, config, this.player, home);
      }

      // Restore health
      if (u.health !== undefined) {
        unit.health = Math.min(u.health, unit.maxHealth);
      }

      this.units.push(unit);
    }
  }

  getUnitCount() {
    return this.units.length;
  }

  getSoldiers() {
    return this.units.filter(u => u instanceof Soldier && u.active);
  }

  getVillagers() {
    return this.units.filter(u => u instanceof Villager && u.active);
  }
}
