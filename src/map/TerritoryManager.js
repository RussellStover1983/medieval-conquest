import { MAP_WIDTH, MAP_HEIGHT, TERRITORY_CAPTURE_THRESHOLD } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class TerritoryManager {
  constructor(scene) {
    this.scene = scene;
    this.regions = this.defineRegions();
    this.discoveredTiles = new Set();
    this.capturedRegions = new Set();
    this.overlayGraphics = null;
  }

  defineRegions() {
    // Divide map into a 4x4 grid = 16 regions
    const regions = [];
    const regionW = Math.floor(MAP_WIDTH / 4);
    const regionH = Math.floor(MAP_HEIGHT / 4);
    const regionNames = [
      'Northern Wastes', 'Frozen Peaks', 'Dragon Coast', 'Storm Islands',
      'Westwood', 'Irondale', 'Central Plains', 'Eastmarch',
      'Goldshire', 'Heartland', 'Silverbrook', 'Emerald Coast',
      'Sunken Marshes', 'Southern Cross', 'Jade Valley', 'Crystal Bay',
    ];

    for (let ry = 0; ry < 4; ry++) {
      for (let rx = 0; rx < 4; rx++) {
        const idx = ry * 4 + rx;
        regions.push({
          id: idx,
          name: regionNames[idx],
          startX: rx * regionW,
          startY: ry * regionH,
          width: regionW,
          height: regionH,
          totalTiles: regionW * regionH,
        });
      }
    }
    return regions;
  }

  discoverTile(tileX, tileY) {
    const key = `${tileX},${tileY}`;
    if (this.discoveredTiles.has(key)) return null;

    this.discoveredTiles.add(key);

    // Check which region this tile is in
    const region = this.getRegionAt(tileX, tileY);
    if (!region || this.capturedRegions.has(region.id)) return null;

    const progress = this.getRegionProgress(region);
    if (progress >= TERRITORY_CAPTURE_THRESHOLD) {
      this.capturedRegions.add(region.id);
      return { captured: true, region };
    }

    return { captured: false, region, progress };
  }

  getRegionAt(tileX, tileY) {
    for (const region of this.regions) {
      if (tileX >= region.startX && tileX < region.startX + region.width &&
          tileY >= region.startY && tileY < region.startY + region.height) {
        return region;
      }
    }
    return null;
  }

  getRegionProgress(region) {
    let discovered = 0;
    for (let y = region.startY; y < region.startY + region.height; y++) {
      for (let x = region.startX; x < region.startX + region.width; x++) {
        if (this.discoveredTiles.has(`${x},${y}`)) {
          discovered++;
        }
      }
    }
    return discovered / region.totalTiles;
  }

  restoreTerritory(savedTerritory) {
    if (!savedTerritory) return;
    if (Array.isArray(savedTerritory.discovered)) {
      for (const key of savedTerritory.discovered) {
        this.discoveredTiles.add(key);
      }
    }
    if (Array.isArray(savedTerritory.captured)) {
      for (const id of savedTerritory.captured) {
        this.capturedRegions.add(id);
      }
    }
  }

  renderOverlay(tileSize) {
    if (this.overlayGraphics) this.overlayGraphics.destroy();

    this.overlayGraphics = this.scene.add.graphics();
    this.overlayGraphics.setDepth(3);

    for (const region of this.regions) {
      const x = region.startX * tileSize;
      const y = region.startY * tileSize;
      const w = region.width * tileSize;
      const h = region.height * tileSize;

      // Region border
      this.overlayGraphics.lineStyle(2, UI_COLORS.INK_DARK, 0.3);
      this.overlayGraphics.strokeRect(x, y, w, h);

      // Capture status overlay
      if (this.capturedRegions.has(region.id)) {
        this.overlayGraphics.fillStyle(UI_COLORS.TERRITORY_ALLY, 0.1);
        this.overlayGraphics.fillRect(x, y, w, h);
      }

      // Region name label
      const label = this.scene.add.text(
        x + w / 2, y + h / 2,
        region.name,
        {
          fontSize: '14px',
          fontFamily: 'Georgia, serif',
          color: '#3d2b1f',
          align: 'center',
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setAlpha(0.5);
    }
  }
}
