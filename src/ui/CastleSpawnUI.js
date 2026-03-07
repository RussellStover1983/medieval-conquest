import { GAME_WIDTH, GAME_HEIGHT, SOLDIER_TYPES, VILLAGER_TYPES } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class CastleSpawnUI {
  constructor(scene, unitManager) {
    this.scene = scene;
    this.unitManager = unitManager;
    this.isOpen = false;
    this.building = null;
    this.buildingType = null;
    this.elements = [];
  }

  open(building, buildingType) {
    if (this.isOpen) this.close();
    this.building = building;
    this.buildingType = buildingType;
    this.isOpen = true;
    this._render();
  }

  close() {
    this.isOpen = false;
    this.building = null;
    this.buildingType = null;
    for (const el of this.elements) {
      el.destroy();
    }
    this.elements = [];
  }

  _render() {
    const panelW = 280;
    const isCastle = this.buildingType === 'castle';
    const soldiers = isCastle ? Object.entries(SOLDIER_TYPES) : [];
    const villagers = Object.entries(VILLAGER_TYPES);
    const totalRows = soldiers.length + villagers.length;
    const panelH = 80 + totalRows * 34;
    const px = GAME_WIDTH / 2;
    const py = GAME_HEIGHT / 2;

    // Background
    const bg = this.scene.add.rectangle(px, py, panelW, panelH, 0x2c1810, 0.92);
    bg.setScrollFactor(0).setDepth(300);
    this.elements.push(bg);

    // Border
    const border = this.scene.add.rectangle(px, py, panelW + 2, panelH + 2);
    border.setStrokeStyle(2, 0x8b6b4a);
    border.setScrollFactor(0).setDepth(299);
    this.elements.push(border);

    // Title
    const title = this.scene.add.text(px, py - panelH / 2 + 16, isCastle ? 'Castle' : 'Fort', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
    });
    title.setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.elements.push(title);

    // Unit count
    const countText = this.scene.add.text(px, py - panelH / 2 + 36,
      `Units: ${this.unitManager.getUnitCount()} / ${this.unitManager.unitCap}`, {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#f4e4c1',
      });
    countText.setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.elements.push(countText);

    let yOff = py - panelH / 2 + 56;

    // Soldiers section
    if (soldiers.length > 0) {
      const soldierLabel = this.scene.add.text(px - panelW / 2 + 10, yOff, 'Soldiers', {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'italic',
      });
      soldierLabel.setScrollFactor(0).setDepth(301);
      this.elements.push(soldierLabel);
      yOff += 18;

      for (const [key, config] of soldiers) {
        this._renderSpawnRow(key, config, 'soldier', yOff, px, panelW);
        yOff += 34;
      }
    }

    // Villagers section
    const villagerLabel = this.scene.add.text(px - panelW / 2 + 10, yOff, 'Villagers', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'italic',
    });
    villagerLabel.setScrollFactor(0).setDepth(301);
    this.elements.push(villagerLabel);
    yOff += 18;

    for (const [key, config] of villagers) {
      this._renderSpawnRow(key, config, 'villager', yOff, px, panelW);
      yOff += 34;
    }

    // Close button
    const closeBtn = this.scene.add.text(px + panelW / 2 - 12, py - panelH / 2 + 6, 'X', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#cc6644', fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5).setScrollFactor(0).setDepth(302);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.elements.push(closeBtn);
  }

  _renderSpawnRow(key, config, unitType, y, centerX, panelW) {
    const leftX = centerX - panelW / 2 + 16;

    // Icon (colored square)
    const icon = this.scene.add.rectangle(leftX + 6, y + 8, 12, 12, config.color);
    icon.setScrollFactor(0).setDepth(301);
    this.elements.push(icon);

    // Name
    const name = this.scene.add.text(leftX + 18, y + 2, config.name, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#f4e4c1',
    });
    name.setScrollFactor(0).setDepth(301);
    this.elements.push(name);

    // Cost text
    const costParts = Object.entries(config.cost).map(([r, a]) => `${a} ${r}`);
    const costStr = costParts.join(', ');
    const costText = this.scene.add.text(leftX + 18, y + 16, costStr, {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#a08060',
    });
    costText.setScrollFactor(0).setDepth(301);
    this.elements.push(costText);

    // Can afford?
    const canAfford = this._canAfford(config.cost);
    const atCap = this.unitManager.getUnitCount() >= this.unitManager.unitCap;
    const enabled = canAfford && !atCap;

    // Spawn button
    const btnX = centerX + panelW / 2 - 42;
    const btn = this.scene.add.text(btnX, y + 8, 'Spawn', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: enabled ? '#ffd700' : '#666666',
      backgroundColor: enabled ? '#4a3420' : '#2a2a2a',
      padding: { x: 6, y: 3 },
    });
    btn.setOrigin(0.5).setScrollFactor(0).setDepth(302);

    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout', () => btn.setColor('#ffd700'));
      btn.on('pointerdown', () => {
        const bld = this.building;
        const bldType = this.buildingType;
        let spawned;
        if (unitType === 'soldier') {
          spawned = this.unitManager.spawnSoldier(key, bld);
        } else {
          spawned = this.unitManager.spawnVillager(key, bld);
        }
        if (spawned) {
          // Re-render to update counts and button states
          this.close();
          this.open(bld, bldType);
        }
      });
    }

    this.elements.push(btn);
  }

  _canAfford(cost) {
    const currency = this.unitManager.player.currency;
    for (const [res, amount] of Object.entries(cost)) {
      if ((currency[res] || 0) < amount) return false;
    }
    return true;
  }
}
