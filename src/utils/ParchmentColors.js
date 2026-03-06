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
  [TERRAIN.DEEP_WATER]: { base: 0x2b4570, light: 0x3d5985, dark: 0x182e5e, detail: 0x213d65, accent1: 0x1a3055, accent2: 0x324d78 },
  [TERRAIN.WATER]:      { base: 0x3d6b8e, light: 0x4f7d9a, dark: 0x2a5580, detail: 0x357393, accent1: 0x5588aa, accent2: 0x2a5570 },
  [TERRAIN.SAND]:       { base: 0xd4bc8b, light: 0xe4cc96, dark: 0xbaa078, detail: 0xbfa870, accent1: 0xc9a86a, accent2: 0x9e8860 },
  [TERRAIN.PLAINS]:     { base: 0x8faa6b, light: 0xa8c07a, dark: 0x6e8e58, detail: 0x87a264, accent1: 0x6b9948, accent2: 0x7a8855 },
  [TERRAIN.FOREST]:     { base: 0x4a6741, light: 0x5e7d4e, dark: 0x2e4a35, detail: 0x3e5f38, accent1: 0x556b3a, accent2: 0x2e4428 },
  [TERRAIN.HILLS]:      { base: 0x8b7d5e, light: 0xa49470, dark: 0x6a604e, detail: 0x847656, accent1: 0x6e6040, accent2: 0x7a8858 },
  [TERRAIN.MOUNTAINS]:  { base: 0x6b6157, light: 0x847a6e, dark: 0x4e4850, detail: 0x635a50, accent1: 0x4e4840, accent2: 0x8a8078 },
  [TERRAIN.SNOW]:       { base: 0xc8c0b0, light: 0xe0d8c4, dark: 0xa0a8b0, detail: 0xd0c8b8, accent1: 0xa8b8c8, accent2: 0xe0dcd4 },
  [TERRAIN.VILLAGE]:    { base: 0xb08050, light: 0xc89860, dark: 0x886248, detail: 0xa87848, accent1: 0x8a6838, accent2: 0xc49868 },
  [TERRAIN.ROAD]:       { base: 0x9e8e6e, light: 0xb8a67c, dark: 0x7a7060, detail: 0x968666, accent1: 0x786850, accent2: 0x887858 },
  [TERRAIN.RIVER]:      { base: 0x4a7fa5, light: 0x5c92b8, dark: 0x326090, detail: 0x4287ad, accent1: 0x3a6888, accent2: 0x5a95bb },
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
