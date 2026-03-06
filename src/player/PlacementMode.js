import { KEEP_ITEMS, KEEP_PLOTS } from '../world/WorldDefinition.js';
import { TILE_SIZE } from '../constants.js';
import PersonalKeep from './PersonalKeep.js';

export default class PlacementMode {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isActive = false;
    this.selectedItem = null;
    this.ghostSprite = null;
    this.toolbar = null;
    this.toolbarElements = [];
  }

  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  activate() {
    const playerData = this.scene.registry.get('playerData');
    if (!playerData) return;

    let personalSpace = playerData.personal_space;
    if (typeof personalSpace === 'string') {
      try { personalSpace = JSON.parse(personalSpace); } catch { personalSpace = {}; }
    }

    const tilePos = this.player.getTilePosition();
    if (!PersonalKeep.isInOwnKeep(tilePos.x, tilePos.y, personalSpace)) {
      return; // Not in own keep
    }

    this.isActive = true;
    this._showToolbar();
  }

  deactivate() {
    this.isActive = false;
    this._hideToolbar();
    this._clearGhost();
  }

  _showToolbar() {
    this._hideToolbar();
    const items = Object.entries(KEEP_ITEMS);
    const startX = 200;
    const y = this.scene.cameras.main.height - 40;

    items.forEach(([key, def], i) => {
      const x = startX + i * 50;
      const textureKey = `keep_${key}`;

      const bg = this.scene.add.rectangle(x, y, 40, 40, 0x1a1008, 0.8);
      bg.setScrollFactor(0).setDepth(600).setInteractive({ useHandCursor: true });
      this.toolbarElements.push(bg);

      if (this.scene.textures.exists(textureKey)) {
        const icon = this.scene.add.sprite(x, y, textureKey);
        icon.setScrollFactor(0).setDepth(601);
        this.toolbarElements.push(icon);
      }

      const label = this.scene.add.text(x, y + 24, def.name, {
        fontSize: '8px', fontFamily: 'Georgia, serif', color: '#d4bc8b',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
      this.toolbarElements.push(label);

      bg.on('pointerdown', () => {
        this.selectedItem = key;
        this._updateGhost();
      });
    });
  }

  _hideToolbar() {
    for (const el of this.toolbarElements) {
      el.destroy();
    }
    this.toolbarElements = [];
  }

  _updateGhost() {
    this._clearGhost();
    if (!this.selectedItem) return;

    const textureKey = `keep_${this.selectedItem}`;
    if (!this.scene.textures.exists(textureKey)) return;

    this.ghostSprite = this.scene.add.sprite(0, 0, textureKey);
    this.ghostSprite.setAlpha(0.5).setDepth(20);
  }

  _clearGhost() {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }

  update(dt) {
    if (!this.isActive || !this.ghostSprite) return;

    // Follow mouse, snapped to tile grid
    const pointer = this.scene.input.activePointer;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const snapX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const snapY = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.ghostSprite.setPosition(snapX, snapY);
  }

  placeItem() {
    if (!this.isActive || !this.selectedItem) return false;

    const playerData = this.scene.registry.get('playerData');
    const authToken = this.scene.registry.get('authToken');
    if (!playerData) return false;

    let personalSpace = playerData.personal_space;
    if (typeof personalSpace === 'string') {
      try { personalSpace = JSON.parse(personalSpace); } catch { personalSpace = {}; }
    }

    const plot = KEEP_PLOTS[personalSpace.plotId];
    if (!plot) return false;

    const pointer = this.scene.input.activePointer;
    const tileX = Math.floor(pointer.worldX / TILE_SIZE) - plot.tileX;
    const tileY = Math.floor(pointer.worldY / TILE_SIZE) - plot.tileY;

    // Bounds check
    if (tileX < 0 || tileX >= plot.width || tileY < 0 || tileY >= plot.height) return false;

    if (!personalSpace.placed_items) personalSpace.placed_items = [];
    personalSpace.placed_items.push({ itemId: this.selectedItem, tileX, tileY });

    playerData.personal_space = personalSpace;
    this.scene.registry.set('playerData', playerData);

    // Save to server
    if (authToken) {
      fetch(`/api/player/${playerData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ personal_space: personalSpace }),
      }).catch(() => {});
    }

    return true;
  }
}
