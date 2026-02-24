export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function tileToWorld(tileX, tileY, tileSize) {
  return {
    x: tileX * tileSize + tileSize / 2,
    y: tileY * tileSize + tileSize / 2,
  };
}

export function worldToTile(worldX, worldY, tileSize) {
  return {
    x: Math.floor(worldX / tileSize),
    y: Math.floor(worldY / tileSize),
  };
}

// Simple A* pathfinding for road generation
export function findPath(startX, startY, endX, endY, isPassable, width, height) {
  const key = (x, y) => `${x},${y}`;
  const openSet = new Map();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const h = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);

  const startKey = key(startX, startY);
  openSet.set(startKey, { x: startX, y: startY });
  gScore.set(startKey, 0);
  fScore.set(startKey, h(startX, startY));

  const dirs = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },  { dx: -1, dy: 0 },
  ];

  while (openSet.size > 0) {
    let currentKey = null;
    let lowestF = Infinity;
    for (const [k, _] of openSet) {
      const f = fScore.get(k) || Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentKey = k;
      }
    }

    const current = openSet.get(currentKey);
    if (current.x === endX && current.y === endY) {
      const path = [];
      let ck = currentKey;
      while (ck) {
        const [cx, cy] = ck.split(',').map(Number);
        path.unshift({ x: cx, y: cy });
        ck = cameFrom.get(ck);
      }
      return path;
    }

    openSet.delete(currentKey);

    for (const dir of dirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (!isPassable(nx, ny)) continue;

      const nKey = key(nx, ny);
      const tentativeG = (gScore.get(currentKey) || 0) + 1;

      if (tentativeG < (gScore.get(nKey) || Infinity)) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + h(nx, ny));
        if (!openSet.has(nKey)) {
          openSet.set(nKey, { x: nx, y: ny });
        }
      }
    }
  }

  return []; // no path found
}
