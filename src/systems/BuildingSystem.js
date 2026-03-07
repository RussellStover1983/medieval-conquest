import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TERRAIN, BUILDING_TYPES } from '../constants.js';

export default class BuildingSystem {
  constructor(scene, player, terrain, territoryManager) {
    this.scene = scene;
    this.player = player;
    this.terrain = terrain;
    this.territoryManager = territoryManager;
    this.buildings = [];
    this.isPlacing = false;
    this.placingType = null;
    this.ghostSprite = null;
    this.ghostTileX = 0;
    this.ghostTileY = 0;
  }

  startPlacement(buildingTypeKey) {
    this.cancelPlacement();
    this.isPlacing = true;
    this.placingType = buildingTypeKey;
    const textureKey = `building_${buildingTypeKey}`;

    if (this.scene.textures.exists(textureKey)) {
      this.ghostSprite = this.scene.add.sprite(0, 0, textureKey);
      this.ghostSprite.setDepth(20);
      this.ghostSprite.setAlpha(0.6);
    }
  }

  cancelPlacement() {
    this.isPlacing = false;
    this.placingType = null;
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }

  confirmPlacement() {
    if (!this.isPlacing || !this.placingType) return false;

    const config = BUILDING_TYPES[this.placingType];
    if (!config) return false;

    const tileX = this.ghostTileX;
    const tileY = this.ghostTileY;

    if (!this._canBuildAt(tileX, tileY, config.size)) return false;

    // Check costs (with Builder discount)
    const buildStat = this.player.classData.build;
    const costMult = Math.max(0.5, 1 - (buildStat - 2) * 0.05);

    for (const [res, amount] of Object.entries(config.cost)) {
      const needed = Math.ceil(amount * costMult);
      if ((this.player.currency[res] || 0) < needed) return false;
    }

    // Deduct resources
    for (const [res, amount] of Object.entries(config.cost)) {
      const needed = Math.ceil(amount * costMult);
      this.player.currency[res] -= needed;
    }

    // Place building
    const building = { tileX, tileY, type: this.placingType, config, sprites: [] };
    this._renderBuilding(building);
    this.buildings.push(building);

    // Territory bonus — discover tiles around building
    if (config.territoryBonus > 0 || config.discoveryRadius) {
      const radius = config.discoveryRadius || config.size * 4;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          this.territoryManager.discoverTile(tileX + dx, tileY + dy);
        }
      }
    }

    this.cancelPlacement();
    return true;
  }

  _canBuildAt(tileX, tileY, size) {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const tx = tileX + dx;
        const ty = tileY + dy;
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
        const t = this.terrain[ty][tx];
        if (t === TERRAIN.WATER || t === TERRAIN.DEEP_WATER || t === TERRAIN.RIVER ||
            t === TERRAIN.VILLAGE || t === TERRAIN.MOUNTAINS) return false;
        // Check existing buildings
        for (const b of this.buildings) {
          for (let by = 0; by < b.config.size; by++) {
            for (let bx = 0; bx < b.config.size; bx++) {
              if (b.tileX + bx === tx && b.tileY + by === ty) return false;
            }
          }
        }
      }
    }
    return true;
  }

  _renderBuilding(building) {
    const { tileX, tileY, type, config } = building;
    const worldX = tileX * TILE_SIZE + (config.size * TILE_SIZE) / 2;
    const worldY = tileY * TILE_SIZE + (config.size * TILE_SIZE) / 2;
    const textureKey = `building_${type}`;

    if (this.scene.textures.exists(textureKey)) {
      const sprite = this.scene.add.sprite(worldX, worldY, textureKey);
      sprite.setDepth(8);
      building.sprites.push(sprite);
    }
  }

  _canAfford(typeKey) {
    const config = BUILDING_TYPES[typeKey];
    if (!config) return false;
    const buildStat = this.player.classData.build;
    const costMult = Math.max(0.5, 1 - (buildStat - 2) * 0.05);
    for (const [res, amount] of Object.entries(config.cost)) {
      const needed = Math.ceil(amount * costMult);
      if ((this.player.currency[res] || 0) < needed) return false;
    }
    return true;
  }

  update(dt) {
    if (!this.isPlacing || !this.ghostSprite) return;

    // Position ghost in front of player
    const tilePos = this.player.getTilePosition();
    const offsets = { up: { dx: 0, dy: -2 }, down: { dx: 0, dy: 2 }, left: { dx: -2, dy: 0 }, right: { dx: 2, dy: 0 } };
    const off = offsets[this.player.facing] || offsets.down;

    const config = BUILDING_TYPES[this.placingType];
    const size = config ? config.size : 1;

    this.ghostTileX = tilePos.x + off.dx;
    this.ghostTileY = tilePos.y + off.dy;

    const worldX = this.ghostTileX * TILE_SIZE + (size * TILE_SIZE) / 2;
    const worldY = this.ghostTileY * TILE_SIZE + (size * TILE_SIZE) / 2;
    this.ghostSprite.setPosition(worldX, worldY);

    const canBuild = this._canBuildAt(this.ghostTileX, this.ghostTileY, size) && this._canAfford(this.placingType);
    this.ghostSprite.setTint(canBuild ? 0x88ff88 : 0xff8888);
    this.ghostSprite.setAlpha(0.6);
  }

  restoreBuildings(savedBuildings) {
    if (!savedBuildings || !Array.isArray(savedBuildings)) return;
    for (const b of savedBuildings) {
      const config = BUILDING_TYPES[b.type];
      if (!config) continue;
      const building = { tileX: b.tileX, tileY: b.tileY, type: b.type, config, sprites: [] };
      this._renderBuilding(building);
      this.buildings.push(building);
    }
  }

  getEffectiveCost(typeKey) {
    const config = BUILDING_TYPES[typeKey];
    if (!config) return {};
    const buildStat = this.player.classData.build;
    const costMult = Math.max(0.5, 1 - (buildStat - 2) * 0.05);
    const result = {};
    for (const [res, amount] of Object.entries(config.cost)) {
      result[res] = Math.ceil(amount * costMult);
    }
    return result;
  }
}
