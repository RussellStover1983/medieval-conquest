import { KEEP_PLOTS } from '../world/WorldDefinition.js';
import { TILE_SIZE } from '../constants.js';

export default class PersonalKeep {
  static async assignPlot(playerData, authToken) {
    // Fetch all players to find which plots are taken
    // For simplicity, we just use the player's own personal_space
    let personalSpace = playerData.personal_space;
    if (typeof personalSpace === 'string') {
      try { personalSpace = JSON.parse(personalSpace); } catch { personalSpace = {}; }
    }

    if (personalSpace && personalSpace.plotId !== undefined) {
      return personalSpace; // Already assigned
    }

    // Assign first available plot (in a real scenario, check server for all players)
    const plotId = 0; // Default to first plot
    const newSpace = { plotId, placed_items: [] };

    // Save to server
    if (authToken && playerData.id) {
      try {
        await fetch(`/api/player/${playerData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ personal_space: newSpace }),
        });
      } catch { /* offline */ }
    }

    return newSpace;
  }

  static isInOwnKeep(playerTileX, playerTileY, personalSpace) {
    if (!personalSpace || personalSpace.plotId === undefined) return false;
    const plot = KEEP_PLOTS[personalSpace.plotId];
    if (!plot) return false;
    return (
      playerTileX >= plot.tileX &&
      playerTileX < plot.tileX + plot.width &&
      playerTileY >= plot.tileY &&
      playerTileY < plot.tileY + plot.height
    );
  }

  static isInAnyKeep(playerTileX, playerTileY) {
    for (const plot of KEEP_PLOTS) {
      if (
        playerTileX >= plot.tileX &&
        playerTileX < plot.tileX + plot.width &&
        playerTileY >= plot.tileY &&
        playerTileY < plot.tileY + plot.height
      ) {
        return true;
      }
    }
    return false;
  }

  static getPlotBounds(plotId) {
    const plot = KEEP_PLOTS[plotId];
    if (!plot) return null;
    return {
      x: plot.tileX * TILE_SIZE,
      y: plot.tileY * TILE_SIZE,
      width: plot.width * TILE_SIZE,
      height: plot.height * TILE_SIZE,
    };
  }
}
