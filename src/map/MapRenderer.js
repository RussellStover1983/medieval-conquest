import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TERRAIN } from '../constants.js';
import { TERRAIN_COLORS, TERRAIN_PALETTE, RESOURCE_COLORS } from '../utils/ParchmentColors.js';

export default class MapRenderer {
  constructor(scene) {
    this.scene = scene;
    this.terrainGraphics = null;
    this.resourceSprites = [];
    this.terrain = null;
    this.waterSprites = [];
    this.waterPositions = [];
  }

  renderTerrain(terrain) {
    this.terrain = terrain;

    // Draw terrain tiles with a persistent Graphics object using palette variation
    this.terrainGraphics = this.scene.add.graphics();
    this.terrainGraphics.setDepth(0);
    this.waterPositions = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const terrainType = terrain[y][x];
        const pal = TERRAIN_PALETTE[terrainType];

        // Hash-based color variation per tile
        const hash = (x * 7919 + y * 6271) % 100;
        let color;
        if (pal) {
          if (hash < 25) color = pal.dark;
          else if (hash < 60) color = pal.base;
          else if (hash < 85) color = pal.light;
          else color = pal.detail;
        } else {
          color = TERRAIN_COLORS[terrainType] || 0x8faa6b;
        }

        this.terrainGraphics.fillStyle(color, 1);
        this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Track water positions for animation
        const isWater = (terrainType === TERRAIN.WATER ||
                         terrainType === TERRAIN.DEEP_WATER ||
                         terrainType === TERRAIN.RIVER);
        if (isWater) {
          this.waterPositions.push({ x, y, type: terrainType });
        }
      }
    }

    // Add terrain detail sprites
    this._placeDetailSprites(terrain);

    // Set up water animation overlay sprites (sparse, not every tile)
    this._setupWaterOverlays();

    return this.terrainGraphics;
  }

  _placeDetailSprites(terrain) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = terrain[y][x];
        const hash = (x * 7919 + y * 6271) % 100;
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE + TILE_SIZE / 2;

        // Offset within tile for variation
        const ox = ((x * 3571 + y * 1301) % 11) - 5;
        const oy = ((x * 2137 + y * 4519) % 11) - 5;

        if (t === TERRAIN.FOREST) {
          // ~40% trees/pines/bushes
          if (hash < 15) {
            this._addDetail(cx + ox, cy + oy, 'detail_tree', 0.8);
          } else if (hash < 27) {
            this._addDetail(cx + ox, cy + oy, 'detail_tree_pine', 0.85);
          } else if (hash < 40) {
            this._addDetail(cx + ox, cy + oy, 'detail_bush', 0.7);
          }
          // ~30% additional grass tufts
          if (hash >= 40 && hash < 70) {
            const gox = ((x * 4871 + y * 2311) % 13) - 6;
            const goy = ((x * 1193 + y * 5417) % 13) - 6;
            this._addDetail(cx + gox, cy + goy, 'detail_grass', 0.6);
          }
        } else if (t === TERRAIN.MOUNTAINS) {
          // ~30% peaks + rocks
          if (hash < 10) {
            this._addDetail(cx + ox, cy + oy, 'detail_mountain', 0.7);
          } else if (hash < 20) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock_large', 0.75);
          } else if (hash < 30) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.7);
          }
        } else if (t === TERRAIN.PLAINS) {
          // ~25% grass, 5% flowers, 3% rocks
          if (hash < 25) {
            this._addDetail(cx + ox, cy + oy, 'detail_grass', 0.65);
          } else if (hash < 30) {
            const flowerIdx = (x * 31 + y * 17) % 3;
            this._addDetail(cx + ox, cy + oy, `detail_flower_${flowerIdx}`, 0.8);
          } else if (hash < 33) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.6);
          }
        } else if (t === TERRAIN.HILLS) {
          // ~30% rocks + grass
          if (hash < 12) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.7);
          } else if (hash < 20) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock_large', 0.65);
          } else if (hash < 30) {
            this._addDetail(cx + ox, cy + oy, 'detail_grass', 0.6);
          }
        } else if (t === TERRAIN.SAND) {
          // 6% small rocks
          if (hash < 6) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.5);
          }
        } else if (t === TERRAIN.VILLAGE) {
          // ~35% (houses, rocks, flowers)
          if (hash < 12) {
            this._addDetail(cx + ox, cy + oy, 'detail_house', 0.8);
          } else if (hash < 20) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.6);
          } else if (hash < 30) {
            const flowerIdx = (x * 31 + y * 17) % 3;
            this._addDetail(cx + ox, cy + oy, `detail_flower_${flowerIdx}`, 0.75);
          } else if (hash < 35) {
            this._addDetail(cx + ox, cy + oy, 'detail_grass', 0.6);
          }
        } else if (t === TERRAIN.SNOW) {
          // Sparse rocks
          if (hash < 5) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.5);
          }
        }

        // Water edge cattails: if this is water and adjacent to land
        const isWater = (t === TERRAIN.WATER || t === TERRAIN.RIVER);
        if (isWater && hash < 12) {
          if (this._hasLandNeighbor(terrain, x, y)) {
            this._addDetail(cx + ox, cy + oy, 'detail_cattail', 0.7);
          }
        }
      }
    }
  }

  _hasLandNeighbor(terrain, x, y) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
      const nt = terrain[ny][nx];
      if (nt !== TERRAIN.WATER && nt !== TERRAIN.DEEP_WATER && nt !== TERRAIN.RIVER) {
        return true;
      }
    }
    return false;
  }

  _addDetail(x, y, textureKey, alpha) {
    if (!this.scene.textures.exists(textureKey)) return;
    const sprite = this.scene.add.sprite(x, y, textureKey);
    sprite.setDepth(1);
    sprite.setAlpha(alpha);
  }

  // Water animation: create sparse overlay sprites on water tiles
  _setupWaterOverlays() {
    this.waterSprites = [];
    // Only animate every 4th water tile to keep sprite count low
    for (let i = 0; i < this.waterPositions.length; i++) {
      if (i % 4 !== 0) continue;
      const wp = this.waterPositions[i];
      const px = wp.x * TILE_SIZE + TILE_SIZE / 2;
      const py = wp.y * TILE_SIZE + TILE_SIZE / 2;

      const pal = TERRAIN_PALETTE[wp.type];
      if (!pal) continue;

      // Create a small ripple highlight line
      const ripple = this.scene.add.rectangle(px, py, TILE_SIZE - 4, 2, pal.light, 0.3);
      ripple.setDepth(0.5);
      this.waterSprites.push(ripple);

      // Gentle drift animation
      this.scene.tweens.add({
        targets: ripple,
        y: py + 6,
        alpha: 0,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }
  }

  renderResources(resources) {
    this.resourceSprites = [];
    for (const res of resources) {
      if (res.collected) continue;

      const x = res.x * TILE_SIZE + TILE_SIZE / 2;
      const y = res.y * TILE_SIZE + TILE_SIZE / 2;
      const textureKey = `resource_${res.type}`;

      // Gem sprite
      const gem = this.scene.add.sprite(x, y, textureKey);
      gem.setDepth(5);
      gem.setData('resourceData', res);

      // Glow halo
      const color = RESOURCE_COLORS[res.type] || 0xffffff;
      const glow = this.scene.add.circle(x, y, 8, color, 0.25);
      glow.setDepth(4);

      // Gentle bob animation
      this.scene.tweens.add({
        targets: gem,
        y: y - 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Pulse glow
      this.scene.tweens.add({
        targets: glow,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.1,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.resourceSprites.push({ circle: gem, glow, data: res });
    }
    return this.resourceSprites;
  }

  removeResource(resourceSprite) {
    // Pickup animation
    this.scene.tweens.add({
      targets: [resourceSprite.circle, resourceSprite.glow],
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        resourceSprite.circle.destroy();
        resourceSprite.glow.destroy();
      },
    });

    const idx = this.resourceSprites.indexOf(resourceSprite);
    if (idx >= 0) this.resourceSprites.splice(idx, 1);
  }
}
