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
    cost: 25,
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
    cost: 40,
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
    cost: 30,
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
    cost: 15,
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
    cost: 20,
    resourceMultiplier: 2.0,
    iconColor: 0x888888,
    description: '2x resource value',
    stackable: false,
    maxStack: 1,
  },
  torch: {
    id: 'torch',
    name: 'Torch',
    type: ITEM_TYPES.TOOL,
    cost: 10,
    visibilityBonus: 3,
    iconColor: 0xff8800,
    description: '+3 discovery radius',
    stackable: false,
    maxStack: 1,
  },
};

export const SHOP_ITEMS = ['sword', 'axe', 'spear', 'health_potion', 'pickaxe', 'torch'];
