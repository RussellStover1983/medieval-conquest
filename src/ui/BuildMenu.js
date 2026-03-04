import { GAME_WIDTH, GAME_HEIGHT, BUILDING_TYPES } from '../constants.js';
import { RESOURCE_COLORS } from '../utils/ParchmentColors.js';

const PANEL_W = 420;
const PANEL_H = 320;
const ROW_HEIGHT = 52;
const PAD = 20;

const BUILDING_KEYS = Object.keys(BUILDING_TYPES);

export default class BuildMenu {
  constructor(scene, player, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.buildingSystem = buildingSystem;
    this.isOpen = false;
    this.elements = [];

    this._build();
    this._hideAll();
  }

  _build() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const left = cx - PANEL_W / 2;
    const top = cy - PANEL_H / 2;

    // Background
    this.bg = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x1a1008, 0.94);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(520);
    this.elements.push(this.bg);

    // Border
    const border = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H);
    border.setStrokeStyle(2, 0x665533);
    border.setFillStyle(0, 0);
    border.setScrollFactor(0);
    border.setDepth(521);
    this.elements.push(border);

    // Title
    const title = this.scene.add.text(cx, top + 14, 'BUILD', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#e67e22',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    title.setDepth(522);
    this.elements.push(title);

    // Close button
    const closeBtn = this.scene.add.text(left + PANEL_W - 16, top + 8, 'X', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#cc6666',
    });
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setScrollFactor(0);
    closeBtn.setDepth(522);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.close());
    this.elements.push(closeBtn);

    // Building rows
    const rowTop = top + 44;
    this.costTexts = [];

    for (let i = 0; i < BUILDING_KEYS.length; i++) {
      const typeKey = BUILDING_KEYS[i];
      const config = BUILDING_TYPES[typeKey];
      const ry = rowTop + i * ROW_HEIGHT;

      // Row background
      const rowBg = this.scene.add.rectangle(cx, ry + ROW_HEIGHT / 2,
        PANEL_W - PAD * 2, ROW_HEIGHT - 4, i % 2 === 0 ? 0x2c1810 : 0x241408, 0.6);
      rowBg.setScrollFactor(0);
      rowBg.setDepth(522);
      this.elements.push(rowBg);

      // Icon
      const iconKey = `building_${typeKey}`;
      if (this.scene.textures.exists(iconKey)) {
        const icon = this.scene.add.sprite(left + PAD + 16, ry + ROW_HEIGHT / 2, iconKey);
        icon.setScrollFactor(0);
        icon.setDepth(523);
        icon.setScale(0.5);
        this.elements.push(icon);
      }

      // Name
      const nameText = this.scene.add.text(left + PAD + 38, ry + 6, config.name, {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        color: '#f4e4c1',
        fontStyle: 'bold',
      });
      nameText.setScrollFactor(0);
      nameText.setDepth(523);
      this.elements.push(nameText);

      // Description
      const descText = this.scene.add.text(left + PAD + 38, ry + 24, config.description, {
        fontSize: '10px',
        fontFamily: 'Georgia, serif',
        color: '#a08060',
      });
      descText.setScrollFactor(0);
      descText.setDepth(523);
      this.elements.push(descText);

      // Cost display (updated dynamically for Builder discount)
      const costText = this.scene.add.text(left + PANEL_W - PAD - 140, ry + ROW_HEIGHT / 2, '', {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: '#f4e4c1',
      });
      costText.setOrigin(0, 0.5);
      costText.setScrollFactor(0);
      costText.setDepth(523);
      this.elements.push(costText);
      this.costTexts.push({ text: costText, typeKey });

      // Cost gem icons
      let costX = left + PANEL_W - PAD - 140;
      for (const [res, amount] of Object.entries(config.cost)) {
        const gemColor = RESOURCE_COLORS[res] || 0xffffff;
        const dot = this.scene.add.circle(costX, ry + ROW_HEIGHT / 2 - 8, 4, gemColor);
        dot.setScrollFactor(0);
        dot.setDepth(523);
        this.elements.push(dot);
        costX += 40;
      }

      // Build button
      const buildBtn = this.scene.add.text(left + PANEL_W - PAD - 36, ry + ROW_HEIGHT / 2, 'BUILD', {
        fontSize: '10px',
        fontFamily: 'Georgia, serif',
        color: '#1a1008',
        backgroundColor: '#e67e22',
        padding: { x: 6, y: 3 },
        fontStyle: 'bold',
      });
      buildBtn.setOrigin(0.5, 0.5);
      buildBtn.setScrollFactor(0);
      buildBtn.setDepth(523);
      buildBtn.setInteractive();
      buildBtn.on('pointerdown', () => this._startBuild(typeKey));
      buildBtn.on('pointerover', () => buildBtn.setStyle({ backgroundColor: '#f0922e' }));
      buildBtn.on('pointerout', () => buildBtn.setStyle({ backgroundColor: '#e67e22' }));
      this.elements.push(buildBtn);
    }

    // Resource display at bottom
    this.resourceText = this.scene.add.text(cx, top + PANEL_H - 24, '', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#8b5e3c',
    });
    this.resourceText.setOrigin(0.5, 0.5);
    this.resourceText.setScrollFactor(0);
    this.resourceText.setDepth(522);
    this.elements.push(this.resourceText);

    // Feedback text
    this.feedbackDisplay = this.scene.add.text(cx, top + PANEL_H - 46, '', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#88ff88',
    });
    this.feedbackDisplay.setOrigin(0.5, 0.5);
    this.feedbackDisplay.setScrollFactor(0);
    this.feedbackDisplay.setDepth(522);
    this.elements.push(this.feedbackDisplay);
  }

  _startBuild(typeKey) {
    this.close();
    this.buildingSystem.startPlacement(typeKey);
    // Unpause game input so player can move during placement
    const gameScene = this.scene.scene.get('GameScene');
    gameScene.events.emit('pauseInput', false);
  }

  _updateResources() {
    const c = this.player.currency;
    this.resourceText.setText(`Wood: ${c.wood || 0}  Stone: ${c.stone || 0}`);

    // Update cost displays with Builder discount
    for (const { text, typeKey } of this.costTexts) {
      const effectiveCost = this.buildingSystem.getEffectiveCost(typeKey);
      const parts = [];
      for (const [res, amount] of Object.entries(effectiveCost)) {
        parts.push(`${amount} ${res}`);
      }
      text.setText(parts.join('  '));
    }
  }

  open() {
    this.isOpen = true;
    this._updateResources();
    this.feedbackDisplay.setText('Press E to place, ESC to cancel');
    this._showAll();
  }

  close() {
    this.isOpen = false;
    this._hideAll();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  _showAll() {
    for (const el of this.elements) el.setVisible(true);
  }

  _hideAll() {
    for (const el of this.elements) el.setVisible(false);
  }

  destroy() {
    for (const el of this.elements) el.destroy();
    this.elements = [];
  }
}
