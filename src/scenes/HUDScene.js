import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WEAPONS } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';
import HealthBar from '../ui/HealthBar.js';
import CurrencyDisplay from '../ui/CurrencyDisplay.js';
import MiniMap from '../ui/MiniMap.js';
import TouchControls from '../ui/TouchControls.js';
import ViewToggleButton from '../ui/ViewToggleButton.js';
import AttackButton from '../ui/AttackButton.js';
import Hotbar from '../ui/Hotbar.js';
import InventoryPanel from '../ui/InventoryPanel.js';
import BuildMenu from '../ui/BuildMenu.js';
import CharacterMenu from '../ui/CharacterMenu.js';
import { VERSION } from '../version.js';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  init(data) {
    this.player = data.player;
    this.cameraController = data.cameraController;
    this.movementSystem = data.movementSystem;
    this.territoryManager = data.territoryManager;
    this.mapData = data.mapData;
    this.combatSystem = data.combatSystem;
    this.buildingSystem = data.buildingSystem;
  }

  create() {
    // Health bar (top-left)
    this.healthBar = new HealthBar(this, 16, 16, 150, 20);

    // Currency display (top-left, below health)
    this.currencyDisplay = new CurrencyDisplay(this, 24, 48);

    // Mini-map (bottom-right)
    this.miniMap = new MiniMap(this, GAME_WIDTH - 142, GAME_HEIGHT - 142, 128);
    this.miniMap.renderTerrain(this.mapData.terrain);
    if (this.mapData.camps) {
      this.miniMap.renderCamps(this.mapData.camps);
    }

    // View toggle button (top-right)
    this.viewToggle = new ViewToggleButton(this, GAME_WIDTH - 60, 30, () => {
      this.cameraController.toggleView(this.player);
      this.updateViewState();
    });

    // Touch controls (bottom-left) - only visible in explore view
    this.touchControls = new TouchControls(this, (x, y) => {
      this.movementSystem.setJoystickInput(x, y);
    });
    this.touchControls.setVisible(false);

    // Territory capture notification
    this.captureText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#2c1810',
      strokeThickness: 4,
    });
    this.captureText.setOrigin(0.5);
    this.captureText.setScrollFactor(0);
    this.captureText.setDepth(300);
    this.captureText.setAlpha(0);

    // Territory progress (shown in explore view)
    this.territoryProgress = this.add.text(GAME_WIDTH / 2, 16, '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    this.territoryProgress.setOrigin(0.5, 0);
    this.territoryProgress.setScrollFactor(0);
    this.territoryProgress.setDepth(100);

    // Class name display (moved above hotbar)
    this.classLabel = this.add.text(16, GAME_HEIGHT - 82, this.player.className, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#8b6b4a',
    });
    this.classLabel.setOrigin(0, 1);
    this.classLabel.setScrollFactor(0);
    this.classLabel.setDepth(100);

    // Title label (below class label)
    this.titleLabel = this.add.text(16, GAME_HEIGHT - 70, '', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'italic',
    });
    this.titleLabel.setOrigin(0, 1);
    this.titleLabel.setScrollFactor(0);
    this.titleLabel.setDepth(100);

    // Weapon label (moved above hotbar)
    this.weaponLabel = this.add.text(16, GAME_HEIGHT - 56, 'Fists', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#a08060',
    });
    this.weaponLabel.setOrigin(0, 1);
    this.weaponLabel.setScrollFactor(0);
    this.weaponLabel.setDepth(100);

    // Attack button (bottom-right, for touch/iPad)
    this.attackButton = new AttackButton(this, () => {
      if (this.combatSystem) this.combatSystem.requestAttack();
    });

    // Hotbar (bottom center, always visible)
    this.hotbar = new Hotbar(this, this.player);

    // Inventory panel (Tab to toggle)
    this.inventoryPanel = new InventoryPanel(this, this.player);

    // Wire up inventory onChange to refresh hotbar
    this.player.bag.onChange = () => {
      this.hotbar.refresh();
      if (this.inventoryPanel.isOpen) this.inventoryPanel.refresh();
    };

    // Character menu (C key to toggle)
    this.characterMenu = new CharacterMenu(this, this.player);
    this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.cKeyJustPressed = false;

    // Build menu (B key to toggle)
    this.buildMenu = new BuildMenu(this, this.player, this.buildingSystem);
    this.bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.bKeyJustPressed = false;

    // ESC key for cancelling placement
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKeyJustPressed = false;

    // Tab key to toggle inventory (capture to prevent browser focus switch)
    this.input.keyboard.addCapture('TAB');
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.tabJustPressed = false;

    // Number keys 1-5 for hotbar
    this.numKeys = [];
    for (let i = 0; i < 5; i++) {
      this.numKeys.push(this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ONE + i
      ));
    }
    this.numKeysJustPressed = [false, false, false, false, false];

    // Village entry prompt (hidden by default)
    this.villagePrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#2c1810',
      strokeThickness: 3,
    });
    this.villagePrompt.setOrigin(0.5);
    this.villagePrompt.setScrollFactor(0);
    this.villagePrompt.setDepth(150);
    this.villagePrompt.setVisible(false);

    // Village name banner (shown when inside village)
    this.villageBanner = this.add.text(GAME_WIDTH / 2, 20, '', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      fontStyle: 'bold',
      stroke: '#2c1810',
      strokeThickness: 4,
    });
    this.villageBanner.setOrigin(0.5, 0);
    this.villageBanner.setScrollFactor(0);
    this.villageBanner.setDepth(150);
    this.villageBanner.setVisible(false);

    // Village mode flag
    this.inVillageMode = false;

    // Death overlay (hidden by default)
    this.deathOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT, 0x000000, 0);
    this.deathOverlay.setDepth(400);
    this.deathOverlay.setScrollFactor(0);
    this.deathText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'You Died', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#cc0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.deathText.setOrigin(0.5);
    this.deathText.setScrollFactor(0);
    this.deathText.setDepth(401);
    this.deathText.setAlpha(0);

    // Listen for game events
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('resourceCollected', (type, value) => {
      this.showCollectFeedback(type, value);
    });

    gameScene.events.on('territoryCaptured', (region) => {
      this.showCaptureNotification(region);
    });

    gameScene.events.on('playerMoved', (tilePos) => {
      this.updateTerritoryProgress(tilePos);
    });

    gameScene.events.on('nearVillage', (village) => {
      this.villagePrompt.setText(`Press E to Enter ${village.name}`);
      this.villagePrompt.setVisible(true);
    });

    gameScene.events.on('leftVillage', () => {
      this.villagePrompt.setVisible(false);
    });

    gameScene.events.on('nearStructure', (struct) => {
      this.villagePrompt.setText(`Press E to Enter ${struct.label}`);
      this.villagePrompt.setVisible(true);
    });

    gameScene.events.on('leftStructure', () => {
      this.villagePrompt.setVisible(false);
    });

    // Village mode events (from VillageScene via HUDScene events)
    this.events.on('enterVillage', (villageName) => {
      this.inVillageMode = true;
      this.miniMap.setVisible(false);
      this.attackButton.setVisible(false);
      this.villagePrompt.setVisible(false);
      this.touchControls.setVisible(false);
      this.territoryProgress.setVisible(false);
      this.villageBanner.setText(villageName);
      this.villageBanner.setVisible(true);
    });

    this.events.on('exitVillage', () => {
      this.inVillageMode = false;
      this.villageBanner.setVisible(false);
      this.updateViewState();
    });

    gameScene.events.on('playerDied', () => {
      this.showDeathOverlay();
    });

    gameScene.events.on('playerRespawned', () => {
      this.hideDeathOverlay();
    });

    // Version label
    this.versionLabel = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, `v${VERSION}`, {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#8b6b4a',
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

    // Initial view state
    this.updateViewState();
  }

  updateViewState() {
    const isMap = this.cameraController.isMapView;
    this.touchControls.setVisible(!isMap);
    this.miniMap.setVisible(!isMap);
    this.healthBar.setVisible(!isMap);
    this.currencyDisplay.setVisible(!isMap);
    this.territoryProgress.setVisible(!isMap);
    this.attackButton.setVisible(!isMap);
    this.hotbar.setVisible(!isMap);
  }

  showDeathOverlay() {
    this.deathText.setAlpha(1);
    this.tweens.add({
      targets: this.deathOverlay,
      fillAlpha: 0.6,
      duration: 600,
    });
  }

  hideDeathOverlay() {
    this.tweens.add({
      targets: [this.deathOverlay, this.deathText],
      alpha: 0,
      duration: 500,
    });
  }

  showCollectFeedback(type, value) {
    const label = `+${value} ${type}`;
    const feedbackText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, label, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#2c1810',
      strokeThickness: 3,
    });
    feedbackText.setOrigin(0.5);
    feedbackText.setScrollFactor(0);
    feedbackText.setDepth(300);

    this.tweens.add({
      targets: feedbackText,
      y: GAME_HEIGHT / 2 - 100,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => feedbackText.destroy(),
    });
  }

  showCaptureNotification(region) {
    this.captureText.setText(`Territory Captured!\n${region.name}`);
    this.captureText.setAlpha(1);

    this.tweens.add({
      targets: this.captureText,
      alpha: 0,
      duration: 3000,
      delay: 1500,
      ease: 'Power2',
    });
  }

  updateTerritoryProgress(tilePos) {
    const region = this.territoryManager.getRegionAt(tilePos.x, tilePos.y);
    if (region) {
      const progress = this.territoryManager.getRegionProgress(region);
      const captured = this.territoryManager.capturedRegions.has(region.id);
      if (captured) {
        this.territoryProgress.setText(`${region.name} - Captured!`);
      } else {
        this.territoryProgress.setText(`${region.name} - ${Math.floor(progress * 100)}% explored`);
      }
    }
  }

  update() {
    // Always update health and currency (visible in village too)
    this.healthBar.update(this.player.health, this.player.maxHealth);
    this.currencyDisplay.update(this.player.currency);

    // Update weapon display
    const wpn = WEAPONS[this.player.weapon] || WEAPONS.none;
    this.weaponLabel.setText(wpn.name);

    // C key: toggle character menu
    const cDown = this.cKey.isDown;
    if (cDown && !this.cKeyJustPressed) {
      this.cKeyJustPressed = true;
      this.characterMenu.toggle();
      const gameScene = this.scene.get('GameScene');
      gameScene.events.emit('pauseInput', this.characterMenu.isOpen);
    } else if (!cDown) {
      this.cKeyJustPressed = false;
    }

    // B key: toggle build menu
    const bDown = this.bKey.isDown;
    if (bDown && !this.bKeyJustPressed) {
      this.bKeyJustPressed = true;
      if (!this.inventoryPanel.isOpen) {
        this.buildMenu.toggle();
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('pauseInput', this.buildMenu.isOpen);
      }
    } else if (!bDown) {
      this.bKeyJustPressed = false;
    }

    // ESC key: cancel building placement
    const escDown = this.escKey.isDown;
    if (escDown && !this.escKeyJustPressed) {
      this.escKeyJustPressed = true;
      if (this.buildingSystem && this.buildingSystem.isPlacing) {
        this.buildingSystem.cancelPlacement();
      } else if (this.buildMenu.isOpen) {
        this.buildMenu.close();
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('pauseInput', false);
      }
    } else if (!escDown) {
      this.escKeyJustPressed = false;
    }

    // Tab key: toggle inventory
    const tabDown = this.tabKey.isDown;
    if (tabDown && !this.tabJustPressed) {
      this.tabJustPressed = true;
      this.inventoryPanel.toggle();
      // Emit pause/resume to GameScene
      const gameScene = this.scene.get('GameScene');
      gameScene.events.emit('pauseInput', this.inventoryPanel.isOpen);
    } else if (!tabDown) {
      this.tabJustPressed = false;
    }

    // Number keys 1-5: select hotbar slot
    for (let i = 0; i < 5; i++) {
      const down = this.numKeys[i].isDown;
      if (down && !this.numKeysJustPressed[i]) {
        this.numKeysJustPressed[i] = true;
        // If inventory is open and a slot is selected, assign to this hotbar slot
        if (this.inventoryPanel.isOpen && this.inventoryPanel.selectedSlot >= 0) {
          this.inventoryPanel.assignToHotbarSlot(i);
        } else {
          this.player.equipFromHotbar(i);
          this.hotbar.setActiveSlot(i);
        }
        this.hotbar.refresh();
      } else if (!down) {
        this.numKeysJustPressed[i] = false;
      }
    }

    // Skip overworld-specific updates during village mode
    if (this.inVillageMode) return;

    const pos = this.player.getPosition();
    this.miniMap.updatePlayerPosition(pos.x, pos.y);

    // Sync view state during transitions
    if (this.cameraController.isTransitioning) {
      return;
    }
    const isMap = this.cameraController.isMapView;
    this.touchControls.setVisible(!isMap);
    this.miniMap.setVisible(!isMap);
    this.healthBar.setVisible(!isMap);
    this.currencyDisplay.setVisible(!isMap);
    this.territoryProgress.setVisible(!isMap);
    this.attackButton.setVisible(!isMap);
    this.hotbar.setVisible(!isMap);
  }
}
