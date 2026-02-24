import { createNoise2D } from 'simplex-noise';
import { MAP_WIDTH, MAP_HEIGHT, TERRAIN, RESOURCES } from '../constants.js';

export default class MapGenerator {
  constructor(seed) {
    this.seed = seed || 1;
    this.rng = this.createRNG(this.seed);
    this.elevationNoise = createNoise2D(this.createRNG(this.seed + 1));
    this.moistureNoise = createNoise2D(this.createRNG(this.seed + 2));
    this.detailNoise = createNoise2D(this.createRNG(this.seed + 3));
    this.terrain = [];
    this.villages = [];
    this.resources = [];
  }

  createRNG(seed) {
    let s = (seed | 0) >>> 0;
    if (s === 0) s = 1;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  generate() {
    this.generateBaseTerrain();
    this.placeVillages();
    this.carveRivers();
    this.generateRoads();
    this.scatterResources();
    return {
      terrain: this.terrain,
      villages: this.villages,
      resources: this.resources,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    };
  }

  generateBaseTerrain() {
    this.terrain = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const elevation = this.getElevation(x, y);
        const moisture = this.getMoisture(x, y);
        row.push(this.classifyTerrain(elevation, moisture));
      }
      this.terrain.push(row);
    }
  }

  getElevation(x, y) {
    const nx = x / MAP_WIDTH;
    const ny = y / MAP_HEIGHT;
    let e = 0.5 * this.elevationNoise(nx * 4, ny * 4)
          + 0.25 * this.elevationNoise(nx * 8, ny * 8)
          + 0.125 * this.detailNoise(nx * 16, ny * 16);
    e = (e + 0.875) / 1.75;
    const dx = 2 * nx - 1;
    const dy = 2 * ny - 1;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const falloff = 1 - distFromCenter * distFromCenter;
    e = e * (0.4 + 0.6 * Math.max(0, falloff));
    return Math.max(0, Math.min(1, e));
  }

  getMoisture(x, y) {
    const nx = x / MAP_WIDTH;
    const ny = y / MAP_HEIGHT;
    let m = 0.5 * this.moistureNoise(nx * 4, ny * 4)
          + 0.25 * this.moistureNoise(nx * 8, ny * 8);
    return (m + 0.75) / 1.5;
  }

  classifyTerrain(elevation, moisture) {
    if (elevation < 0.2) return TERRAIN.DEEP_WATER;
    if (elevation < 0.3) return TERRAIN.WATER;
    if (elevation < 0.35) return TERRAIN.SAND;
    if (elevation < 0.55) {
      return moisture > 0.6 ? TERRAIN.FOREST : TERRAIN.PLAINS;
    }
    if (elevation < 0.7) {
      return moisture > 0.65 ? TERRAIN.FOREST : TERRAIN.HILLS;
    }
    if (elevation < 0.85) return TERRAIN.MOUNTAINS;
    return TERRAIN.SNOW;
  }

  inBounds(x, y) {
    return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
  }

  placeVillages() {
    this.villages = [];
    const minDist = 20;
    const suffixes = ['Keep', 'Market', 'Crossing', 'Haven', 'Watch', 'Rest', 'Gate', 'Hall'];
    const regionNames = [
      'Northern Wastes', 'Frozen Peaks', 'Dragon Coast', 'Storm Islands',
      'Westwood', 'Irondale', 'Central Plains', 'Eastmarch',
      'Goldshire', 'Heartland', 'Silverbrook', 'Emerald Coast',
      'Sunken Marshes', 'Southern Cross', 'Jade Valley', 'Crystal Bay',
    ];
    const regionW = Math.floor(MAP_WIDTH / 4);
    const regionH = Math.floor(MAP_HEIGHT / 4);
    let attempts = 0;
    while (this.villages.length < 8 && attempts < 500) {
      attempts++;
      const x = Math.floor(this.rng() * (MAP_WIDTH - 20)) + 10;
      const y = Math.floor(this.rng() * (MAP_HEIGHT - 20)) + 10;
      if (!this.inBounds(x, y)) continue;
      const t = this.terrain[y][x];
      if (t !== TERRAIN.PLAINS && t !== TERRAIN.FOREST) continue;
      let tooClose = false;
      for (const v of this.villages) {
        const dx = v.x - x;
        const dy = v.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) { tooClose = true; break; }
      }
      if (tooClose) continue;

      // Generate village name from region + suffix
      const rx = Math.floor(x / regionW);
      const ry = Math.floor(y / regionH);
      const regionIdx = Math.min(ry * 4 + rx, regionNames.length - 1);
      const regionBase = regionNames[regionIdx].split(' ')[0];
      const suffix = suffixes[this.villages.length % suffixes.length];
      const name = `${regionBase} ${suffix}`;

      this.villages.push({ x, y, name });
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const vx = x + dx, vy = y + dy;
          if (this.inBounds(vx, vy)) this.terrain[vy][vx] = TERRAIN.VILLAGE;
        }
      }
    }
  }

  carveRivers() {
    for (let r = 0; r < 3; r++) {
      let bestX = 0, bestY = 0, bestElev = 0;
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(this.rng() * (MAP_WIDTH - 2)) + 1;
        const y = Math.floor(this.rng() * (MAP_HEIGHT - 2)) + 1;
        const elev = this.getElevation(x, y);
        if (elev > 0.65 && elev > bestElev) {
          bestElev = elev; bestX = x; bestY = y;
        }
      }
      if (bestElev === 0) continue;

      let cx = bestX, cy = bestY;
      const visited = new Set();
      for (let step = 0; step < 150; step++) {
        if (!this.inBounds(cx, cy)) break;
        const key = `${cx},${cy}`;
        if (visited.has(key)) break;
        visited.add(key);
        const t = this.terrain[cy][cx];
        if (t === TERRAIN.WATER || t === TERRAIN.DEEP_WATER) break;
        if (t !== TERRAIN.VILLAGE) this.terrain[cy][cx] = TERRAIN.RIVER;

        let lowestElev = this.getElevation(cx, cy);
        let nextX = cx, nextY = cy;
        const dirs = [{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
        for (const d of dirs) {
          const nx = cx + d.dx, ny = cy + d.dy;
          if (!this.inBounds(nx, ny)) continue;
          const ne = this.getElevation(nx, ny);
          if (ne < lowestElev) { lowestElev = ne; nextX = nx; nextY = ny; }
        }
        if (nextX === cx && nextY === cy) {
          const d = dirs[Math.floor(this.rng() * dirs.length)];
          nextX = cx + d.dx; nextY = cy + d.dy;
        }
        cx = nextX; cy = nextY;
      }
    }
  }

  generateRoads() {
    // Simple bresenham-style roads between villages instead of A*
    if (this.villages.length < 2) return;
    const connected = new Set();
    for (let i = 0; i < this.villages.length; i++) {
      let nearestIdx = -1, nearestDist = Infinity;
      for (let j = 0; j < this.villages.length; j++) {
        if (i === j) continue;
        const pk = `${Math.min(i,j)}-${Math.max(i,j)}`;
        if (connected.has(pk)) continue;
        const dx = this.villages[i].x - this.villages[j].x;
        const dy = this.villages[i].y - this.villages[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) { nearestDist = dist; nearestIdx = j; }
      }
      if (nearestIdx < 0) continue;
      connected.add(`${Math.min(i,nearestIdx)}-${Math.max(i,nearestIdx)}`);

      // Walk from v1 to v2 stepping toward target
      const v1 = this.villages[i], v2 = this.villages[nearestIdx];
      let cx = v1.x, cy = v1.y;
      for (let step = 0; step < 300; step++) {
        if (cx === v2.x && cy === v2.y) break;
        if (this.inBounds(cx, cy)) {
          const t = this.terrain[cy][cx];
          if (t !== TERRAIN.VILLAGE && t !== TERRAIN.RIVER &&
              t !== TERRAIN.WATER && t !== TERRAIN.DEEP_WATER) {
            this.terrain[cy][cx] = TERRAIN.ROAD;
          }
        }
        // Step toward target, with slight randomness
        const dx = v2.x - cx, dy = v2.y - cy;
        if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && this.rng() > 0.5)) {
          cx += dx > 0 ? 1 : -1;
        } else {
          cy += dy > 0 ? 1 : -1;
        }
      }
    }
  }

  scatterResources() {
    this.resources = [];
    const resourceTypes = [
      { type: RESOURCES.GOLD, count: 30, terrain: [TERRAIN.HILLS, TERRAIN.MOUNTAINS] },
      { type: RESOURCES.SILVER, count: 40, terrain: [TERRAIN.HILLS, TERRAIN.PLAINS] },
      { type: RESOURCES.EMERALD, count: 20, terrain: [TERRAIN.FOREST] },
      { type: RESOURCES.RUBY, count: 15, terrain: [TERRAIN.MOUNTAINS, TERRAIN.HILLS] },
    ];
    for (const res of resourceTypes) {
      let placed = 0, attempts = 0;
      while (placed < res.count && attempts < 500) {
        attempts++;
        const x = Math.floor(this.rng() * (MAP_WIDTH - 2)) + 1;
        const y = Math.floor(this.rng() * (MAP_HEIGHT - 2)) + 1;
        if (!this.inBounds(x, y)) continue;
        const t = this.terrain[y][x];
        if (res.terrain.includes(t) || (t === TERRAIN.PLAINS && this.rng() < 0.1)) {
          let tooClose = false;
          for (const r of this.resources) {
            if (Math.abs(r.x - x) < 3 && Math.abs(r.y - y) < 3) { tooClose = true; break; }
          }
          if (tooClose) continue;
          this.resources.push({ type: res.type, x, y, collected: false, value: Math.floor(this.rng() * 5) + 1 });
          placed++;
        }
      }
    }
  }

  findSpawnPoint() {
    const cx = Math.floor(MAP_WIDTH / 2);
    const cy = Math.floor(MAP_HEIGHT / 2);
    for (let radius = 0; radius < 30; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx, y = cy + dy;
          if (!this.inBounds(x, y)) continue;
          const t = this.terrain[y][x];
          if (t === TERRAIN.PLAINS || t === TERRAIN.ROAD || t === TERRAIN.VILLAGE) return { x, y };
        }
      }
    }
    return { x: cx, y: cy };
  }
}
