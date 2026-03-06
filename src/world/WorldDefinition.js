export const WORLD_VERSION = '0.1.0';
export const WORLD_TITLE = 'The First Dawn';

// PROTECTED ZONES — Claude Code must NEVER modify these coordinates
// Player keeps exist in these areas. Modifying them will destroy player data.
export const PROTECTED_ZONES = [
  { x: 5, y: 5, width: 20, height: 20 }
];

// Defines plot locations for player keeps within the residential district
// Each plot is 4x4 tiles (128x128 px)
export const KEEP_PLOTS = [
  { id: 0,  tileX: 6,  tileY: 6,  width: 4, height: 4 },
  { id: 1,  tileX: 11, tileY: 6,  width: 4, height: 4 },
  { id: 2,  tileX: 16, tileY: 6,  width: 4, height: 4 },
  { id: 3,  tileX: 21, tileY: 6,  width: 4, height: 4 },
  { id: 4,  tileX: 6,  tileY: 11, width: 4, height: 4 },
  { id: 5,  tileX: 11, tileY: 11, width: 4, height: 4 },
  { id: 6,  tileX: 16, tileY: 11, width: 4, height: 4 },
  { id: 7,  tileX: 21, tileY: 11, width: 4, height: 4 },
  { id: 8,  tileX: 6,  tileY: 16, width: 4, height: 4 },
  { id: 9,  tileX: 11, tileY: 16, width: 4, height: 4 },
  { id: 10, tileX: 16, tileY: 16, width: 4, height: 4 },
  { id: 11, tileX: 21, tileY: 16, width: 4, height: 4 },
  { id: 12, tileX: 6,  tileY: 21, width: 4, height: 4 },
  { id: 13, tileX: 11, tileY: 21, width: 4, height: 4 },
  { id: 14, tileX: 16, tileY: 21, width: 4, height: 4 },
  { id: 15, tileX: 21, tileY: 21, width: 4, height: 4 },
];

// Item definitions: overnight builds ADD to this, never remove
export const KEEP_ITEMS = {
  table_oak:    { name: 'Oak Table',     size: { w: 2, h: 1 }, color: 0x8b6b4a },
  chair_oak:    { name: 'Oak Chair',     size: { w: 1, h: 1 }, color: 0x7b5b3a },
  bed_basic:    { name: 'Straw Bed',     size: { w: 2, h: 1 }, color: 0xc8a870 },
  chest_wood:   { name: 'Wooden Chest',  size: { w: 1, h: 1 }, color: 0x6b4226 },
  torch_wall:   { name: 'Wall Torch',    size: { w: 1, h: 1 }, color: 0xff8800 },
  banner_basic: { name: 'Banner',        size: { w: 1, h: 2 }, color: 0xcc3333 },
  trophy_wolf:  { name: 'Wolf Trophy',   size: { w: 1, h: 1 }, color: 0x666666 },
};

// World structures
export const WORLD_STRUCTURES = [
  { type: 'builders_hall',   tileX: 64, tileY: 60, label: "Builder's Hall" },
  { type: 'chronicle',       tileX: 64, tileY: 64, label: 'The Chronicle' },
  { type: 'notice_board',    tileX: 60, tileY: 62, label: 'Notice Board' },
  { type: 'portal',          tileX: 5,  tileY: 120, label: 'Testing Grounds' },
];

// Features currently in testing grounds (empty initially)
export const TESTING_GROUNDS_FEATURES = [];
