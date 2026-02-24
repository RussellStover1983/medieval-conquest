import { TERRAIN } from '../constants.js';
import { TERRAIN_COLORS } from '../utils/ParchmentColors.js';

export const TERRAIN_CONFIG = {
  [TERRAIN.DEEP_WATER]: {
    name: 'Deep Water',
    color: TERRAIN_COLORS[TERRAIN.DEEP_WATER],
    speedModifier: 0.15,
    passable: true,
  },
  [TERRAIN.WATER]: {
    name: 'Water',
    color: TERRAIN_COLORS[TERRAIN.WATER],
    speedModifier: 0.25,
    passable: true,
  },
  [TERRAIN.SAND]: {
    name: 'Sand',
    color: TERRAIN_COLORS[TERRAIN.SAND],
    speedModifier: 0.7,
    passable: true,
  },
  [TERRAIN.PLAINS]: {
    name: 'Plains',
    color: TERRAIN_COLORS[TERRAIN.PLAINS],
    speedModifier: 1.0,
    passable: true,
  },
  [TERRAIN.FOREST]: {
    name: 'Forest',
    color: TERRAIN_COLORS[TERRAIN.FOREST],
    speedModifier: 0.6,
    passable: true,
  },
  [TERRAIN.HILLS]: {
    name: 'Hills',
    color: TERRAIN_COLORS[TERRAIN.HILLS],
    speedModifier: 0.5,
    passable: true,
  },
  [TERRAIN.MOUNTAINS]: {
    name: 'Mountains',
    color: TERRAIN_COLORS[TERRAIN.MOUNTAINS],
    speedModifier: 0.2,
    passable: true,
  },
  [TERRAIN.SNOW]: {
    name: 'Snow',
    color: TERRAIN_COLORS[TERRAIN.SNOW],
    speedModifier: 0.4,
    passable: true,
  },
  [TERRAIN.VILLAGE]: {
    name: 'Village',
    color: TERRAIN_COLORS[TERRAIN.VILLAGE],
    speedModifier: 1.0,
    passable: true,
  },
  [TERRAIN.ROAD]: {
    name: 'Road',
    color: TERRAIN_COLORS[TERRAIN.ROAD],
    speedModifier: 1.3,
    passable: true,
  },
  [TERRAIN.RIVER]: {
    name: 'River',
    color: TERRAIN_COLORS[TERRAIN.RIVER],
    speedModifier: 0.3,
    passable: true,
  },
};

export function getTerrainConfig(terrainType) {
  return TERRAIN_CONFIG[terrainType] || TERRAIN_CONFIG[TERRAIN.PLAINS];
}
