let instance = null;

export default class PlayerState {
  constructor(scene) {
    this.scene = scene;
    this.playerId = null;
    this.authToken = null;
    this.saveInterval = null;
    this._boundBeforeUnload = null;
  }

  init(playerId, authToken) {
    this.playerId = playerId;
    this.authToken = authToken;
    this.stats = { exploration: 0, building: 0, combat: 0, contribution: 0 };

    // Load existing stats from playerData
    const playerData = this.scene.registry.get('playerData');
    if (playerData && playerData.stats) {
      const s = typeof playerData.stats === 'string' ? JSON.parse(playerData.stats) : playerData.stats;
      Object.assign(this.stats, s);
    }

    // Listen for stat events
    this.scene.events.on('enemyKilled', () => {
      this.stats.combat++;
      this._updatePlayerDataStats();
    });

    this.scene.events.on('territoryCaptured', () => {
      this.stats.exploration++;
      this._updatePlayerDataStats();
    });

    // Auto-save every 30 seconds
    this.saveInterval = setInterval(() => this.save(), 30000);

    // Save on page unload
    this._boundBeforeUnload = () => this.save();
    window.addEventListener('beforeunload', this._boundBeforeUnload);
  }

  _updatePlayerDataStats() {
    const playerData = this.scene.registry.get('playerData');
    if (playerData) {
      playerData.stats = { ...this.stats };
      this.scene.registry.set('playerData', playerData);
    }
  }

  save() {
    if (!this.playerId || !this.authToken || !this.scene.player) return;

    const player = this.scene.player;
    const pos = player.getPosition();

    const data = {
      current_position: { x: pos.x, y: pos.y },
      currency: player.currency,
      stats: this.stats,
      last_seen: new Date().toISOString(),
      health: player.health,
    };

    // Serialize inventory
    if (player.bag && player.bag.slots) {
      const items = [];
      for (const slot of player.bag.slots) {
        if (slot && slot.itemId) {
          items.push({ itemId: slot.itemId, quantity: slot.quantity || 1 });
        }
      }
      data.inventory = items;
      data.equipped = {
        weapon: player.weapon || 'none',
        activeTool: player.activeTool || null,
        hotbarIndex: player.bag.activeHotbarIndex || 0,
        hotbar: player.bag.hotbar || [],
      };
    }

    // Serialize buildings
    if (this.scene.buildingSystem) {
      data.buildings = this.scene.buildingSystem.buildings.map(b => ({
        tileX: b.tileX, tileY: b.tileY, type: b.type,
      }));
    }

    // Serialize territory
    if (this.scene.territoryManager) {
      const tm = this.scene.territoryManager;
      data.territory = {
        discovered: Array.from(tm.discoveredTiles),
        captured: Array.from(tm.capturedRegions),
      };
    }

    // Serialize units
    if (this.scene.unitManager) {
      data.units = this.scene.unitManager.units
        .filter(u => u.active)
        .map(u => ({
          typeKey: u.typeKey,
          unitType: u.unitType || 'soldier',
          x: u.sprite.x,
          y: u.sprite.y,
          health: u.health,
          homeTileX: u.homeBuilding ? u.homeBuilding.tileX : 0,
          homeTileY: u.homeBuilding ? u.homeBuilding.tileY : 0,
        }));
    }

    // Fire and forget
    fetch(`/api/player/${this.playerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(data),
    }).catch(() => {
      // Silently ignore save failures
    });
  }

  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    if (this._boundBeforeUnload) {
      window.removeEventListener('beforeunload', this._boundBeforeUnload);
      this._boundBeforeUnload = null;
    }
  }

  static getInstance() {
    return instance;
  }

  static setInstance(inst) {
    instance = inst;
  }
}
