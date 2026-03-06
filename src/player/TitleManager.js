import { TITLE_DEFINITIONS } from '../constants.js';

export function checkAndAwardTitles(playerData, territoryManager) {
  const currentTitles = typeof playerData.titles === 'string'
    ? JSON.parse(playerData.titles || '[]')
    : (playerData.titles || []);
  const newTitles = [];

  // Founder: everyone who joined before v1.0 gets this
  if (playerData.is_founder && !currentTitles.includes('founder')) {
    newTitles.push('founder');
  }

  // Explorer: visited all regions
  if (territoryManager) {
    const total = territoryManager.regions ? territoryManager.regions.length : 0;
    const captured = territoryManager.capturedRegions ? territoryManager.capturedRegions.size : 0;
    if (total > 0 && captured >= total && !currentTitles.includes('explorer')) {
      newTitles.push('explorer');
    }
  }

  // Veteran: 30+ days since join
  if (playerData.join_date) {
    const joinDate = new Date(playerData.join_date);
    const daysSinceJoin = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoin >= 30 && !currentTitles.includes('veteran')) {
      newTitles.push('veteran');
    }
  }

  return newTitles;
}

export function getTitleName(titleKey) {
  const def = TITLE_DEFINITIONS[titleKey];
  return def ? def.name : titleKey;
}
