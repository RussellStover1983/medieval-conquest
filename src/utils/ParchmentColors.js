import { TERRAIN } from '../constants.js';

// Muted earthy parchment-style color palette
export const TERRAIN_COLORS = {
  [TERRAIN.DEEP_WATER]: 0x2b4570,
  [TERRAIN.WATER]:      0x3d6b8e,
  [TERRAIN.SAND]:       0xd4bc8b,
  [TERRAIN.PLAINS]:     0x8faa6b,
  [TERRAIN.FOREST]:     0x4a6741,
  [TERRAIN.HILLS]:      0x8b7d5e,
  [TERRAIN.MOUNTAINS]:  0x6b6157,
  [TERRAIN.SNOW]:       0xc8c0b0,
  [TERRAIN.VILLAGE]:    0xb08050,
  [TERRAIN.ROAD]:       0x9e8e6e,
  [TERRAIN.RIVER]:      0x4a7fa5,
};

export const TERRAIN_PALETTE = {
  [TERRAIN.DEEP_WATER]: { base: 0x2b4570, light: 0x3b5580, dark: 0x1b3560, detail: 0x213d65 },
  [TERRAIN.WATER]:      { base: 0x3d6b8e, light: 0x4d7b9e, dark: 0x2d5b7e, detail: 0x357393 },
  [TERRAIN.SAND]:       { base: 0xd4bc8b, light: 0xe0c89a, dark: 0xc8b07c, detail: 0xbfa870 },
  [TERRAIN.PLAINS]:     { base: 0x8faa6b, light: 0x9fba7b, dark: 0x7f9a5b, detail: 0x87a264 },
  [TERRAIN.FOREST]:     { base: 0x4a6741, light: 0x5a7751, dark: 0x3a5731, detail: 0x3e5f38 },
  [TERRAIN.HILLS]:      { base: 0x8b7d5e, light: 0x9b8d6e, dark: 0x7b6d4e, detail: 0x847656 },
  [TERRAIN.MOUNTAINS]:  { base: 0x6b6157, light: 0x7b7167, dark: 0x5b5147, detail: 0x635a50 },
  [TERRAIN.SNOW]:       { base: 0xc8c0b0, light: 0xd8d0c0, dark: 0xb8b0a0, detail: 0xd0c8b8 },
  [TERRAIN.VILLAGE]:    { base: 0xb08050, light: 0xc09060, dark: 0xa07040, detail: 0xa87848 },
  [TERRAIN.ROAD]:       { base: 0x9e8e6e, light: 0xae9e7e, dark: 0x8e7e5e, detail: 0x968666 },
  [TERRAIN.RIVER]:      { base: 0x4a7fa5, light: 0x5a8fb5, dark: 0x3a6f95, detail: 0x4287ad },
};

export const RESOURCE_COLORS = {
  gold:    0xffd700,
  silver:  0xc0c0c0,
  emerald: 0x50c878,
  ruby:    0xe0115f,
  wood:    0x8b5e3c,
  stone:   0x7a7068,
};

export const UI_COLORS = {
  PARCHMENT_BG:    0xf4e4c1,
  PARCHMENT_DARK:  0xd4bc8b,
  PARCHMENT_LIGHT: 0xfaf0dc,
  INK_DARK:        0x2c1810,
  INK_MED:         0x5c3a1e,
  INK_LIGHT:       0x8b6b4a,
  HEALTH_GREEN:    0x6aaa3a,
  HEALTH_RED:      0xaa3a3a,
  TERRITORY_ALLY:  0x4488cc,
  TERRITORY_ENEMY: 0xcc4444,
  BORDER:          0x3d2b1f,
};

export const CLASS_COLORS = {
  Knight:   0xc0392b,
  Archer:   0x27ae60,
  Builder:  0xe67e22,
  Merchant: 0x8e44ad,
  Scout:    0x2980b9,
};
