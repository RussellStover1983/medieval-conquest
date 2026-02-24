export const TILE_SIZE = 32;
export const MAP_WIDTH = 128;
export const MAP_HEIGHT = 128;
export const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;   // 4096
export const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;  // 4096

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const MAP_ZOOM = 0.15;
export const EXPLORE_ZOOM = 1.5;

export const PLAYER_BASE_SPEED = 160;

export const TERRITORY_CAPTURE_THRESHOLD = 0.6; // 60% explored to capture

export const TERRAIN = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  PLAINS: 3,
  FOREST: 4,
  HILLS: 5,
  MOUNTAINS: 6,
  SNOW: 7,
  VILLAGE: 8,
  ROAD: 9,
  RIVER: 10,
};

export const RESOURCES = {
  GOLD: 'gold',
  SILVER: 'silver',
  EMERALD: 'emerald',
  RUBY: 'ruby',
};

// Combat system constants
export const COMBAT = {
  AGGRO_RANGE: 96,
  DEAGGRO_RANGE: 192,
  ATTACK_COOLDOWN: 600,      // ms base cooldown
  ATTACK_WIDTH: 28,
  ATTACK_DEPTH: 32,
  MAX_ENEMIES: 12,
  SPAWN_RADIUS: 200,         // px from player to spawn
  DESPAWN_RADIUS: 400,        // px from player to despawn
  SPAWN_INTERVAL: 3000,       // ms between spawn checks
  KNOCKBACK_FORCE: 120,
  KNOCKBACK_DURATION: 150,    // ms
  RESPAWN_HP_PERCENT: 0.5,
};

export const ENEMY_TYPES = {
  Wolf: {
    name: 'Wolf',
    terrains: [TERRAIN.FOREST],
    color: 0x666666,
    hp: 30,
    damage: 8,
    speed: 130,
    size: 18,
    aggroRange: 80,
    attackRange: 20,
    attackCooldown: 800,
    drop: { type: 'silver', min: 1, max: 3 },
  },
  Bandit: {
    name: 'Bandit',
    terrains: [TERRAIN.ROAD, TERRAIN.PLAINS, TERRAIN.VILLAGE],
    color: 0x8b4513,
    hp: 50,
    damage: 12,
    speed: 80,
    size: 22,
    aggroRange: 96,
    attackRange: 24,
    attackCooldown: 1000,
    drop: { type: 'gold', min: 2, max: 5 },
  },
  Troll: {
    name: 'Troll',
    terrains: [TERRAIN.MOUNTAINS, TERRAIN.HILLS],
    color: 0x556b2f,
    hp: 100,
    damage: 20,
    speed: 50,
    size: 28,
    aggroRange: 64,
    attackRange: 28,
    attackCooldown: 1500,
    drop: { type: 'ruby', min: 1, max: 2 },
  },
  SeaSerpent: {
    name: 'Sea Serpent',
    terrains: [TERRAIN.WATER, TERRAIN.DEEP_WATER],
    color: 0x2e8b57,
    hp: 40,
    damage: 10,
    speed: 100,
    size: 20,
    aggroRange: 96,
    attackRange: 22,
    attackCooldown: 900,
    drop: { type: 'emerald', min: 1, max: 3 },
  },
  Skeleton: {
    name: 'Skeleton',
    terrains: [TERRAIN.SNOW, TERRAIN.SAND],
    color: 0xd2b48c,
    hp: 35,
    damage: 10,
    speed: 90,
    size: 20,
    aggroRange: 96,
    attackRange: 22,
    attackCooldown: 900,
    drop: { type: 'gold', min: 1, max: 3 },
  },
};
