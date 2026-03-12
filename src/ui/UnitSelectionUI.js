import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class UnitSelectionUI {
  constructor(scene, unitManager) {
    this.scene = scene; // HUDScene
    this.unitManager = unitManager;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartWorldX = 0;
    this.dragStartWorldY = 0;
    this.lastClickTime = 0;
    this.lastClickedUnit = null;

    // Selection box graphics (drawn on HUD, screen-space)
    this.selectionBox = scene.add.graphics();
    this.selectionBox.setDepth(200);
    this.selectionBox.setScrollFactor(0);

    // Move marker drawn in GameScene (world-space)
    const gameScene = scene.scene.get('GameScene');
    this.gameScene = gameScene;
    this.moveMarker = gameScene.add.graphics();
    this.moveMarker.setDepth(7);
    this._moveMarkerTimer = null;

    // Bottom command panel
    this._createCommandPanel();

    // Unit count display (near minimap)
    this.unitCountText = scene.add.text(GAME_WIDTH - 152, GAME_HEIGHT - 160, '', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    this.unitCountText.setScrollFactor(0).setDepth(100);

    // Select All button
    this.selectAllBtn = scene.add.text(GAME_WIDTH - 152, GAME_HEIGHT - 176, 'Select All', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      backgroundColor: '#2c1810',
      padding: { x: 6, y: 3 },
    });
    this.selectAllBtn.setScrollFactor(0).setDepth(100);
    this.selectAllBtn.setInteractive();
    this.selectAllBtn.on('pointerdown', () => this.unitManager.selectAll());
    this.selectAllBtn.setVisible(false);

    // Prevent browser context menu on game canvas
    gameScene.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this._setupInput();
  }

  _createCommandPanel() {
    this.panelBg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 24, 280, 32, 0x2c1810, 0.85);
    this.panelBg.setScrollFactor(0).setDepth(199).setVisible(false);

    this.selectionInfoText = this.scene.add.text(GAME_WIDTH / 2 - 60, GAME_HEIGHT - 24, '', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
    });
    this.selectionInfoText.setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

    // Stop button
    this.stopBtn = this.scene.add.text(GAME_WIDTH / 2 + 60, GAME_HEIGHT - 24, 'Stop (S)', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#ff6644',
      backgroundColor: '#1a0e08',
      padding: { x: 5, y: 2 },
    });
    this.stopBtn.setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
    this.stopBtn.setInteractive({ useHandCursor: true });
    this.stopBtn.on('pointerdown', () => this._stopSelected());

    // Deselect button
    this.deselectBtn = this.scene.add.text(GAME_WIDTH / 2 + 120, GAME_HEIGHT - 24, 'Deselect', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#aaaaaa',
      backgroundColor: '#1a0e08',
      padding: { x: 5, y: 2 },
    });
    this.deselectBtn.setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
    this.deselectBtn.setInteractive({ useHandCursor: true });
    this.deselectBtn.on('pointerdown', () => this.unitManager.clearSelection());
  }

  /** Convert HUD screen coords to GameScene world coords */
  _screenToWorld(screenX, screenY) {
    const cam = this.gameScene.cameras.main;
    // Use Phaser's built-in conversion which properly handles zoom + scroll + center offset
    const point = cam.getWorldPoint(screenX, screenY);
    return { x: point.x, y: point.y };
  }

  _setupInput() {
    // Listen on HUDScene input (topmost scene, actually receives pointer events)
    // Then convert coordinates to GameScene world space via camera

    this.scene.input.on('pointerdown', (pointer) => {
      if (this.gameScene.inputPaused) return;

      const world = this._screenToWorld(pointer.x, pointer.y);

      if (pointer.rightButtonDown()) {
        // Right-click: command selected units to move (C&C style)
        if (this.unitManager.selectedUnits.length > 0) {
          this.unitManager.commandMoveTo(world.x, world.y);
          this._showMoveMarker(world.x, world.y);
        }
        return;
      }

      // Left click: start drag selection
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.dragStartWorldX = world.x;
      this.dragStartWorldY = world.y;
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;

      const dx = Math.abs(pointer.x - this.dragStartX);
      const dy = Math.abs(pointer.y - this.dragStartY);

      if (dx > 6 || dy > 6) {
        this.selectionBox.clear();
        this.selectionBox.lineStyle(1, 0x44ff44, 0.8);
        this.selectionBox.fillStyle(0x44ff44, 0.12);
        const x = Math.min(this.dragStartX, pointer.x);
        const y = Math.min(this.dragStartY, pointer.y);
        const w = Math.abs(pointer.x - this.dragStartX);
        const h = Math.abs(pointer.y - this.dragStartY);
        this.selectionBox.fillRect(x, y, w, h);
        this.selectionBox.strokeRect(x, y, w, h);
      }
    });

    this.scene.input.on('pointerup', (pointer) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.selectionBox.clear();

      if (this.gameScene.inputPaused) return;
      if (pointer.rightButtonReleased) return;

      const world = this._screenToWorld(pointer.x, pointer.y);
      const dx = Math.abs(pointer.x - this.dragStartX);
      const dy = Math.abs(pointer.y - this.dragStartY);
      const isShift = pointer.event && pointer.event.shiftKey;

      if (dx > 6 || dy > 6) {
        // Drag-box selection
        const endWorld = this._screenToWorld(pointer.x, pointer.y);
        if (!isShift) this.unitManager.clearSelection();
        this._selectInWorldRect(this.dragStartWorldX, this.dragStartWorldY, endWorld.x, endWorld.y, isShift);
      } else {
        // Single click / tap
        this._handleClick(world.x, world.y, isShift, pointer.wasTouch);
      }
    });

    // S key = stop selected units
    this._sKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this._sKeyJustPressed = false;
  }

  _handleClick(worldX, worldY, isShift, wasTouch) {
    const nearUnits = this.unitManager.getUnitsNear(worldX, worldY, 20);
    const now = Date.now();

    if (nearUnits.length > 0) {
      const clickedUnit = nearUnits[0];

      // Double-click: select all units of same type on screen (C&C style)
      if (now - this.lastClickTime < 400 && this.lastClickedUnit === clickedUnit) {
        this._selectAllOfType(clickedUnit);
        this.lastClickTime = 0;
        this.lastClickedUnit = null;
        return;
      }

      this.lastClickTime = now;
      this.lastClickedUnit = clickedUnit;

      if (isShift) {
        // Shift+click: toggle unit in selection
        const idx = this.unitManager.selectedUnits.indexOf(clickedUnit);
        if (idx >= 0) {
          clickedUnit.deselect();
          this.unitManager.selectedUnits.splice(idx, 1);
        } else {
          clickedUnit.select();
          this.unitManager.selectedUnits.push(clickedUnit);
        }
      } else {
        this.unitManager.selectUnit(clickedUnit);
      }
    } else {
      // Clicked empty ground
      if (this.unitManager.selectedUnits.length > 0) {
        // Move command (left-click on ground with units selected — C&C classic style)
        this.unitManager.commandMoveTo(worldX, worldY);
        this._showMoveMarker(worldX, worldY);
      }
      // If no units selected and click empty ground, do nothing
      this.lastClickTime = 0;
      this.lastClickedUnit = null;
    }
  }

  /** Select all same-type units visible on screen */
  _selectAllOfType(refUnit) {
    this.unitManager.clearSelection();
    const cam = this.gameScene.cameras.main;
    const left = cam.scrollX;
    const top = cam.scrollY;
    const right = left + cam.width / cam.zoom;
    const bottom = top + cam.height / cam.zoom;

    for (const unit of this.unitManager.units) {
      if (!unit.active) continue;
      if (unit.typeKey !== refUnit.typeKey) continue;
      if (unit.sprite.x >= left && unit.sprite.x <= right &&
          unit.sprite.y >= top && unit.sprite.y <= bottom) {
        unit.select();
        this.unitManager.selectedUnits.push(unit);
      }
    }
  }

  _selectInWorldRect(x1, y1, x2, y2, addToSelection) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (const unit of this.unitManager.units) {
      if (!unit.active) continue;
      if (unit.sprite.x >= minX && unit.sprite.x <= maxX &&
          unit.sprite.y >= minY && unit.sprite.y <= maxY) {
        if (this.unitManager.selectedUnits.indexOf(unit) < 0) {
          unit.select();
          this.unitManager.selectedUnits.push(unit);
        }
      }
    }
  }

  _showMoveMarker(worldX, worldY) {
    this.moveMarker.clear();

    // Expanding ring effect (C&C style)
    this.moveMarker.lineStyle(2, 0x44ff44, 0.8);
    this.moveMarker.strokeCircle(worldX, worldY, 6);
    this.moveMarker.lineStyle(1, 0x44ff44, 0.4);
    this.moveMarker.strokeCircle(worldX, worldY, 12);

    if (this._moveMarkerTimer) this._moveMarkerTimer.remove();
    this._moveMarkerTimer = this.gameScene.time.delayedCall(800, () => {
      this.moveMarker.clear();
    });
  }

  _stopSelected() {
    for (const unit of this.unitManager.selectedUnits) {
      unit._stopMoving();
      unit.state = 0; // IDLE
      if (unit.soldierState !== undefined) unit.soldierState = 0;
      if (unit.villagerState !== undefined) unit.villagerState = 0;
    }
  }

  update() {
    const count = this.unitManager.getUnitCount();
    const cap = this.unitManager.unitCap;

    if (count > 0) {
      this.unitCountText.setText(`Units: ${count}/${cap}`);
      this.selectAllBtn.setVisible(true);
    } else {
      this.unitCountText.setText('');
      this.selectAllBtn.setVisible(false);
    }

    // S key: stop
    const sDown = this._sKey.isDown;
    if (sDown && !this._sKeyJustPressed) {
      this._sKeyJustPressed = true;
      if (this.unitManager.selectedUnits.length > 0 && !this.gameScene.inputPaused) {
        this._stopSelected();
      }
    } else if (!sDown) {
      this._sKeyJustPressed = false;
    }

    // Show/hide command panel
    const selected = this.unitManager.selectedUnits.length;
    const show = selected > 0;
    this.panelBg.setVisible(show);
    this.selectionInfoText.setVisible(show);
    this.stopBtn.setVisible(show);
    this.deselectBtn.setVisible(show);

    if (show) {
      this.selectionInfoText.setText(`${selected} unit${selected > 1 ? 's' : ''} selected`);
    }
  }
}
