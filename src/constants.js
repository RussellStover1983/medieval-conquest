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

// Smaller chunks on mobile to avoid exceeding WebGL texture size limits (iPad Safari)
const isMobile = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || /iPad|iPhone|Android/i.test(navigator.userAgent));
export const CHUNK_SIZE = isMobile ? 16 : 32; // 16 = 512×512px chunks (mobile-safe), 32 = 1024×1024px

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

export const TERRAIN_PRIORITY = {
  [TERRAIN.DEEP_WATER]: 0,
  [TERRAIN.WATER]: 1,
  [TERRAIN.RIVER]: 2,
  [TERRAIN.SAND]: 3,
  [TERRAIN.ROAD]: 4,
  [TERRAIN.PLAINS]: 5,
  [TERRAIN.HILLS]: 6,
  [TERRAIN.FOREST]: 7,
  [TERRAIN.MOUNTAINS]: 8,
  [TERRAIN.SNOW]: 9,
  [TERRAIN.VILLAGE]: 10,
};

export const RESOURCES = {
  GOLD: 'gold',
  SILVER: 'silver',
  EMERALD: 'emerald',
  RUBY: 'ruby',
  WOOD: 'wood',
  STONE: 'stone',
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
    hp: 15,
    damage: 4,
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
    hp: 25,
    damage: 6,
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
    hp: 50,
    damage: 10,
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
    hp: 20,
    damage: 5,
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
    hp: 18,
    damage: 5,
    speed: 90,
    size: 20,
    aggroRange: 96,
    attackRange: 22,
    attackCooldown: 900,
    drop: { type: 'gold', min: 1, max: 3 },
  },
};

export const WEAPONS = {
  none: {
    name: 'Fists',
    damageMult: 1.0,
    speedMult: 1.0,
    reach: 0,
    cost: 0,
    trailColors: [0xffffff, 0xaaddff, 0x6699cc],
    description: 'Bare hands',
  },
  sword: {
    name: 'Sword',
    damageMult: 1.5,
    speedMult: 1.0,
    reach: 4,
    cost: 25,
    trailColors: [0xffffff, 0xb0c4de, 0x4682b4],
    description: '1.5x damage',
  },
  axe: {
    name: 'Axe',
    damageMult: 2.0,
    speedMult: 1.3,
    reach: 2,
    cost: 40,
    trailColors: [0xffa500, 0xcd853f, 0x8b4513],
    description: '2x damage, slower',
  },
  spear: {
    name: 'Spear',
    damageMult: 1.3,
    speedMult: 0.8,
    reach: 10,
    cost: 30,
    trailColors: [0x90ee90, 0x228b22, 0x006400],
    description: 'Long reach, fast',
  },
};

export const ITEM_TYPES = {
  WEAPON: 'weapon',
  CONSUMABLE: 'consumable',
  TOOL: 'tool',
};

export const INVENTORY_SLOTS = 30;
export const HOTBAR_SLOTS = 5;

export const ITEMS = {
  sword: {
    id: 'sword',
    name: 'Sword',
    type: ITEM_TYPES.WEAPON,
    gemCost: { ruby: 3 },
    weaponKey: 'sword',
    iconColor: 0xb0c4de,
    description: '1.5x damage',
    stackable: false,
    maxStack: 1,
  },
  axe: {
    id: 'axe',
    name: 'Axe',
    type: ITEM_TYPES.WEAPON,
    gemCost: { ruby: 5 },
    weaponKey: 'axe',
    iconColor: 0xcd853f,
    description: '2x damage, slower',
    stackable: false,
    maxStack: 1,
  },
  spear: {
    id: 'spear',
    name: 'Spear',
    type: ITEM_TYPES.WEAPON,
    gemCost: { emerald: 4 },
    weaponKey: 'spear',
    iconColor: 0x228b22,
    description: 'Long reach, fast',
    stackable: false,
    maxStack: 1,
  },
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    type: ITEM_TYPES.CONSUMABLE,
    gemCost: { silver: 8 },
    healAmount: 40,
    iconColor: 0xcc3333,
    description: 'Restores 40 HP',
    stackable: true,
    maxStack: 10,
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Pickaxe',
    type: ITEM_TYPES.TOOL,
    gemCost: { gold: 20 },
    resourceMultiplier: 2.0,
    iconColor: 0x888888,
    description: 'Mine stone from rocks',
    stackable: false,
    maxStack: 1,
  },
  torch: {
    id: 'torch',
    name: 'Torch',
    type: ITEM_TYPES.TOOL,
    gemCost: { gold: 10 },
    visibilityBonus: 3,
    iconColor: 0xff8800,
    description: '+3 discovery radius',
    stackable: false,
    maxStack: 1,
  },
};

export const SHOP_ITEMS = ['sword', 'axe', 'spear', 'health_potion', 'pickaxe', 'torch'];

export const CAMP_TYPES = {
  WolfDen: {
    name: 'Wolf Den',
    enemyType: 'Wolf',
    maxEnemies: 3,
    patrolRadius: 80,
    ventureRadius: 160,
    respawnTime: 15000,
    terrains: [TERRAIN.FOREST],
  },
  BanditCamp: {
    name: 'Bandit Camp',
    enemyType: 'Bandit',
    maxEnemies: 4,
    patrolRadius: 96,
    ventureRadius: 192,
    respawnTime: 20000,
    terrains: [TERRAIN.ROAD, TERRAIN.PLAINS],
  },
  TrollCave: {
    name: 'Troll Cave',
    enemyType: 'Troll',
    maxEnemies: 2,
    patrolRadius: 64,
    ventureRadius: 128,
    respawnTime: 30000,
    terrains: [TERRAIN.MOUNTAINS, TERRAIN.HILLS],
  },
  SerpentNest: {
    name: 'Serpent Nest',
    enemyType: 'SeaSerpent',
    maxEnemies: 3,
    patrolRadius: 80,
    ventureRadius: 160,
    respawnTime: 18000,
    terrains: [TERRAIN.WATER, TERRAIN.DEEP_WATER],
  },
  SkeletonCrypt: {
    name: 'Skeleton Crypt',
    enemyType: 'Skeleton',
    maxEnemies: 3,
    patrolRadius: 80,
    ventureRadius: 160,
    respawnTime: 15000,
    terrains: [TERRAIN.SNOW, TERRAIN.SAND],
  },
};

export const CAMP_SETTINGS = {
  totalCamps: 20,
  minDistFromVillage: 15,
  minDistBetween: 10,
};

export const TITLE_DEFINITIONS = {
  founder: { name: 'Founder', description: 'Joined before v1.0', auto: true },
  veteran: { name: 'Veteran', description: 'Active 30+ days', auto: true },
  explorer: { name: 'Explorer', description: 'Visited all regions', auto: true },
};

export const UNIT_CAP = 20;

export const SOLDIER_TYPES = {
  Pawn: {
    name: 'Pawn',
    level: 1,
    hp: 30,
    damage: 3,
    speed: 60,
    attackRange: 20,
    attackCooldown: 1200,
    cost: { wood: 10, stone: 5 },
    color: 0xc0c0c0,
    size: 16,
    special: 'none',
  },
  Archer: {
    name: 'Archer',
    level: 2,
    hp: 25,
    damage: 5,
    speed: 50,
    attackRange: 80,
    attackCooldown: 1500,
    cost: { wood: 15, stone: 10, gold: 5 },
    color: 0x4a7a2e,
    size: 16,
    special: 'ranged',
  },
  WhiteKnight: {
    name: 'White Knight',
    level: 3,
    hp: 60,
    damage: 7,
    speed: 70,
    attackRange: 24,
    attackCooldown: 1000,
    cost: { wood: 30, stone: 25, gold: 15 },
    color: 0xe8e8f0,
    size: 18,
    special: 'armor',
    damageReduction: 0.3,
  },
  Barbarian: {
    name: 'Barbarian',
    level: 4,
    hp: 80,
    damage: 12,
    speed: 90,
    attackRange: 28,
    attackCooldown: 800,
    cost: { wood: 40, stone: 30, gold: 30 },
    color: 0x8b4513,
    size: 20,
    special: 'berserker',
    berserkThreshold: 0.4,
    berserkMult: 1.5,
    cleaveRadius: 24,
  },
  BlackKnight: {
    name: 'Black Knight',
    level: 5,
    hp: 120,
    damage: 15,
    speed: 75,
    attackRange: 26,
    attackCooldown: 900,
    cost: { wood: 60, stone: 50, gold: 50, ruby: 10 },
    color: 0x2a2a3a,
    size: 20,
    special: 'lifesteal',
    lifestealPercent: 0.2,
    fearRadius: 128,
    fearDuration: 2000,
  },
};

export const VILLAGER_TYPES = {
  Farmer: {
    name: 'Farmer',
    hp: 20,
    speed: 55,
    gatherRate: 5000,
    gatherMin: 2,
    gatherMax: 3,
    gatherResource: 'gold',
    targetTerrains: [TERRAIN.PLAINS, TERRAIN.VILLAGE],
    cost: { wood: 8, stone: 4 },
    color: 0xc8a870,
    size: 14,
  },
  Builder: {
    name: 'Builder',
    hp: 25,
    speed: 50,
    gatherRate: 8000,
    gatherMin: 0,
    gatherMax: 0,
    gatherResource: null,
    targetTerrains: [],
    cost: { wood: 10, stone: 8 },
    color: 0xcd853f,
    size: 14,
    repairAmount: 5,
  },
  Miner: {
    name: 'Miner',
    hp: 25,
    speed: 45,
    gatherRate: 6000,
    gatherMin: 2,
    gatherMax: 4,
    gatherResource: 'stone',
    targetTerrains: [TERRAIN.MOUNTAINS, TERRAIN.HILLS],
    cost: { wood: 12, stone: 6 },
    color: 0x7a7068,
    size: 14,
  },
  Lumberjack: {
    name: 'Lumberjack',
    hp: 25,
    speed: 50,
    gatherRate: 5000,
    gatherMin: 2,
    gatherMax: 4,
    gatherResource: 'wood',
    targetTerrains: [TERRAIN.FOREST],
    cost: { wood: 10, stone: 4 },
    color: 0x5e8e3a,
    size: 14,
  },
};

export const BUILDING_TYPES = {
  wall: {
    name: 'Wall',
    description: 'Basic defensive barrier',
    cost: { wood: 5, stone: 3 },
    size: 1,
    territoryBonus: 0.02,
  },
  tower: {
    name: 'Tower',
    description: 'Watch tower, extends discovery',
    cost: { wood: 10, stone: 8 },
    size: 1,
    territoryBonus: 0.05,
    discoveryRadius: 5,
  },
  fort: {
    name: 'Fort',
    description: 'Small fortification',
    cost: { wood: 25, stone: 20 },
    size: 2,
    territoryBonus: 0.15,
  },
  castle: {
    name: 'Castle',
    description: 'Grand castle, dominates region',
    cost: { wood: 60, stone: 50 },
    size: 3,
    territoryBonus: 0.30,
  },
};
