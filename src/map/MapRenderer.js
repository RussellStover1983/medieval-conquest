import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TERRAIN, CHUNK_SIZE, TERRAIN_PRIORITY } from '../constants.js';
import { TERRAIN_COLORS, TERRAIN_PALETTE, RESOURCE_COLORS } from '../utils/ParchmentColors.js';

const TERRAIN_NAMES = {
  [TERRAIN.DEEP_WATER]: 'deep_water',
  [TERRAIN.WATER]: 'water',
  [TERRAIN.SAND]: 'sand',
  [TERRAIN.PLAINS]: 'plains',
  [TERRAIN.FOREST]: 'forest',
  [TERRAIN.HILLS]: 'hills',
  [TERRAIN.MOUNTAINS]: 'mountains',
  [TERRAIN.SNOW]: 'snow',
  [TERRAIN.VILLAGE]: 'village',
  [TERRAIN.ROAD]: 'road',
  [TERRAIN.RIVER]: 'river',
};

// Detect mobile for reduced detail (prevents WebGL memory crashes on iPad/phones)
const IS_MOBILE = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || /iPad|iPhone|Android/i.test(navigator.userAgent));

export default class MapRenderer {
  constructor(scene) {
    this.scene = scene;
    this.chunkRTs = [];
    this.resourceSprites = [];
    this.terrain = null;
    this.waterSprites = [];
    this.waterPositions = [];
  }

  renderTerrain(terrain) {
    this.terrain = terrain;
    this.waterPositions = [];

    const chunksX = Math.ceil(MAP_WIDTH / CHUNK_SIZE);
    const chunksY = Math.ceil(MAP_HEIGHT / CHUNK_SIZE);
    const chunkPx = CHUNK_SIZE * TILE_SIZE;

    // Create a 1x1 dummy texture for the temp sprite, then swap textures during stamping
    if (!this.scene.textures.exists('_rt_dummy')) {
      const dg = this.scene.add.graphics();
      dg.fillStyle(0x000000, 0);
      dg.fillRect(0, 0, 1, 1);
      dg.generateTexture('_rt_dummy', 1, 1);
      dg.destroy();
    }
    const tempSprite = this.scene.add.sprite(0, 0, '_rt_dummy').setVisible(false).setOrigin(0, 0);

    // Build each chunk as a RenderTexture
    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const rt = this.scene.add.renderTexture(
          cx * chunkPx,
          cy * chunkPx,
          chunkPx,
          chunkPx
        );
        rt.setOrigin(0, 0);
        rt.setDepth(0);

        this._stampChunk(rt, terrain, cx, cy, tempSprite);
        this.chunkRTs.push(rt);
      }
    }

    tempSprite.destroy();

    // Add terrain detail sprites
    this._placeDetailSprites(terrain);

    // Set up water animation overlay sprites (sparse, not every tile)
    this._setupWaterOverlays();
  }

  _stampChunk(rt, terrain, chunkX, chunkY, tempSprite) {
    const startX = chunkX * CHUNK_SIZE;
    const startY = chunkY * CHUNK_SIZE;
    const endX = Math.min(startX + CHUNK_SIZE, MAP_WIDTH);
    const endY = Math.min(startY + CHUNK_SIZE, MAP_HEIGHT);

    // Pass 1: Stamp base textured tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const terrainType = terrain[y][x];
        const name = TERRAIN_NAMES[terrainType];

        // Track water positions for animation
        const isWater = (terrainType === TERRAIN.WATER ||
                         terrainType === TERRAIN.DEEP_WATER ||
                         terrainType === TERRAIN.RIVER);
        if (isWater) {
          this.waterPositions.push({ x, y, type: terrainType });
        }

        // Pick variant using deterministic hash
        const variant = (x * 7919 + y * 6271) % 4;
        const key = `terrain_${name}_${variant}`;

        if (!this.scene.textures.exists(key)) continue;

        // Position within the RenderTexture (local coords)
        const lx = (x - startX) * TILE_SIZE;
        const ly = (y - startY) * TILE_SIZE;

        tempSprite.setTexture(key);
        tempSprite.setPosition(lx, ly);
        rt.draw(tempSprite);
      }
    }

    // Pass 2: Stamp transition overlays
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const terrainType = terrain[y][x];
        const myPriority = TERRAIN_PRIORITY[terrainType];
        if (myPriority === undefined) continue;

        const lx = (x - startX) * TILE_SIZE;
        const ly = (y - startY) * TILE_SIZE;

        // Check 4 cardinal neighbors
        const neighbors = [
          { dx: 0, dy: -1, dir: 'n' },
          { dx: 0, dy: 1,  dir: 's' },
          { dx: -1, dy: 0, dir: 'w' },
          { dx: 1, dy: 0,  dir: 'e' },
        ];

        for (const { dx, dy, dir } of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;

          const neighborType = terrain[ny][nx];
          const neighborPriority = TERRAIN_PRIORITY[neighborType];
          if (neighborPriority === undefined) continue;

          // If neighbor has higher priority, stamp its edge overlay onto this tile
          if (neighborPriority > myPriority) {
            const neighborName = TERRAIN_NAMES[neighborType];
            const transKey = `transition_${neighborName}_${dir}`;
            if (!this.scene.textures.exists(transKey)) continue;
            tempSprite.setTexture(transKey);
            tempSprite.setPosition(lx, ly);
            rt.draw(tempSprite);
          }
        }
      }
    }

    // Pass 3: Elevation drop shadows (higher terrain casts shadow south/east)
    const chunkPx = CHUNK_SIZE * TILE_SIZE;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const terrainType = terrain[y][x];
        const myPriority = TERRAIN_PRIORITY[terrainType];
        if (myPriority === undefined) continue;

        const shadowDirs = [
          { dx: 0, dy: 1, key: 'shadow_n' },
          { dx: 1, dy: 0, key: 'shadow_w' },
        ];

        for (const { dx, dy, key } of shadowDirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;

          const neighborType = terrain[ny][nx];
          const neighborPriority = TERRAIN_PRIORITY[neighborType];
          if (neighborPriority === undefined) continue;

          if (myPriority - neighborPriority >= 2) {
            const nlx = (nx - startX) * TILE_SIZE;
            const nly = (ny - startY) * TILE_SIZE;

            if (nlx < 0 || nlx >= chunkPx || nly < 0 || nly >= chunkPx) continue;
            if (!this.scene.textures.exists(key)) continue;
            tempSprite.setTexture(key);
            tempSprite.setPosition(nlx, nly);
            rt.draw(tempSprite);
          }
        }
      }
    }
  }

  _placeDetailSprites(terrain) {
    // On mobile, skip every other tile to reduce sprite count by 75%
    const step = IS_MOBILE ? 2 : 1;
    for (let y = 0; y < MAP_HEIGHT; y += step) {
      for (let x = 0; x < MAP_WIDTH; x += step) {
        const t = terrain[y][x];
        const hash = (x * 7919 + y * 6271) % 100;
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE + TILE_SIZE / 2;

        // Offset within tile for variation
        const ox = ((x * 3571 + y * 1301) % 11) - 5;
        const oy = ((x * 2137 + y * 4519) % 11) - 5;

        if (t === TERRAIN.FOREST) {
          if (hash < 15) {
            this._addDetail(cx + ox, cy + oy, 'detail_tree', 0.8);
          } else if (hash < 27) {
            this._addDetail(cx + ox, cy + oy, 'detail_tree_pine', 0.85);
          } else if (hash < 40) {
            this._addDetail(cx + ox, cy + oy, 'detail_bush', 0.7);
          }
          if (hash >= 40 && hash < 70) {
            const gox = ((x * 4871 + y * 2311) % 13) - 6;
            const goy = ((x * 1193 + y * 5417) % 13) - 6;
            this._addDetail(cx + gox, cy + goy, 'detail_grass', 0.6);
          }
        } else if (t === TERRAIN.MOUNTAINS) {
          if (hash < 10) {
            this._addDetail(cx + ox, cy + oy, 'detail_mountain', 0.7);
          } else if (hash < 20) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock_large', 0.75);
          } else if (hash < 30) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.7);
          }
        } else if (t === TERRAIN.PLAINS) {
          if (hash < 25) {
            this._addDetail(cx + ox, cy + oy, 'detail_grass', 0.65);
          } else if (hash < 30) {
            const flowerIdx = (x * 31 + y * 17) % 3;
            this._addDetail(cx + ox, cy + oy, `detail_flower_${flowerIdx}`, 0.8);
          } else if (hash < 33) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.6);
          }
        } else if (t === TERRAIN.HILLS) {
          if (hash < 12) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.7);
          } else if (hash < 20) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock_large', 0.65);
          } else if (hash < 30) {
            this._addDetail(cx + ox, cy + oy, 'detail_grass', 0.6);
          }
        } else if (t === TERRAIN.SAND) {
          if (hash < 6) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.5);
          }
        } else if (t === TERRAIN.VILLAGE) {
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
          if (hash < 5) {
            this._addDetail(cx + ox, cy + oy, 'detail_rock', 0.5);
          }
        }

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

  _setupWaterOverlays() {
    this.waterSprites = [];
    const waterStep = IS_MOBILE ? 8 : 4;
    for (let i = 0; i < this.waterPositions.length; i++) {
      if (i % waterStep !== 0) continue;
      const wp = this.waterPositions[i];
      const px = wp.x * TILE_SIZE + TILE_SIZE / 2;
      const py = wp.y * TILE_SIZE + TILE_SIZE / 2;

      const pal = TERRAIN_PALETTE[wp.type];
      if (!pal) continue;

      const ripple = this.scene.add.rectangle(px, py, TILE_SIZE - 4, 2, pal.light, 0.3);
      ripple.setDepth(0.5);
      this.waterSprites.push(ripple);

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

      const gem = this.scene.add.sprite(x, y, textureKey);
      gem.setDepth(5);
      gem.setData('resourceData', res);

      const color = RESOURCE_COLORS[res.type] || 0xffffff;
      const glow = this.scene.add.circle(x, y, 8, color, 0.25);
      glow.setDepth(4);

      this.scene.tweens.add({
        targets: gem,
        y: y - 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

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
