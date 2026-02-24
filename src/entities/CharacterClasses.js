import { CLASS_COLORS } from '../utils/ParchmentColors.js';

export const CHARACTER_CLASSES = {
  Knight: {
    name: 'Knight',
    description: 'Armored warrior with great strength and defense',
    strength: 8,
    speed: 4,
    defense: 7,
    build: 2,
    trade: 2,
    color: CLASS_COLORS.Knight,
    icon: 'sword',
  },
  Archer: {
    name: 'Archer',
    description: 'Quick and precise, balanced in trade',
    strength: 5,
    speed: 7,
    defense: 4,
    build: 3,
    trade: 4,
    color: CLASS_COLORS.Archer,
    icon: 'bow',
  },
  Builder: {
    name: 'Builder',
    description: 'Master of construction and fortification',
    strength: 4,
    speed: 4,
    defense: 5,
    build: 9,
    trade: 3,
    color: CLASS_COLORS.Builder,
    icon: 'hammer',
  },
  Merchant: {
    name: 'Merchant',
    description: 'Shrewd trader with unmatched commerce skills',
    strength: 3,
    speed: 5,
    defense: 3,
    build: 4,
    trade: 9,
    color: CLASS_COLORS.Merchant,
    icon: 'coin',
  },
  Scout: {
    name: 'Scout',
    description: 'Fastest explorer, sees farther than anyone',
    strength: 4,
    speed: 9,
    defense: 3,
    build: 3,
    trade: 5,
    color: CLASS_COLORS.Scout,
    icon: 'eye',
  },
};

export function getClassNames() {
  return Object.keys(CHARACTER_CLASSES);
}
