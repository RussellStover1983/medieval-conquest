import { GAME_WIDTH, GAME_HEIGHT, ITEMS, SHOP_ITEMS } from '../constants.js';

const PANEL_W = 500;
const PANEL_H = 400;
const ROW_HEIGHT = 48;
const PAD = 20;

const ICON_KEYS = {
  sword: 'item_icon_sword',
  axe: 'item_icon_axe',
  spear: 'item_icon_spear',
  health_potion: 'item_icon_potion',
  pickaxe: 'item_icon_pickaxe',
  torch: 'item_icon_torch',
};

export default class ShopPanel {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.elements = [];
    this.feedbackText = null;
    this.feedbackTimer = null;

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
    const title = this.scene.add.text(cx, top + 14, 'BLACKSMITH', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
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

    // Item rows
    const rowTop = top + 48;
    this.buyButtons = [];

    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const itemId = SHOP_ITEMS[i];
      const item = ITEMS[itemId];
      const ry = rowTop + i * ROW_HEIGHT;

      // Row background (alternating)
      const rowBg = this.scene.add.rectangle(cx, ry + ROW_HEIGHT / 2,
        PANEL_W - PAD * 2, ROW_HEIGHT - 4, i % 2 === 0 ? 0x2c1810 : 0x241408, 0.6);
      rowBg.setScrollFactor(0);
      rowBg.setDepth(522);
      this.elements.push(rowBg);

      // Icon
      const iconKey = ICON_KEYS[itemId];
      if (iconKey) {
        const icon = this.scene.add.sprite(left + PAD + 16, ry + ROW_HEIGHT / 2, iconKey);
        icon.setScrollFactor(0);
        icon.setDepth(523);
        this.elements.push(icon);
      }

      // Item name
      const nameText = this.scene.add.text(left + PAD + 38, ry + 6, item.name, {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        color: '#f4e4c1',
        fontStyle: 'bold',
      });
      nameText.setScrollFactor(0);
      nameText.setDepth(523);
      this.elements.push(nameText);

      // Description
      const descText = this.scene.add.text(left + PAD + 38, ry + 24, item.description, {
        fontSize: '10px',
        fontFamily: 'Georgia, serif',
        color: '#a08060',
      });
      descText.setScrollFactor(0);
      descText.setDepth(523);
      this.elements.push(descText);

      // Cost
      const costText = this.scene.add.text(left + PANEL_W - PAD - 120, ry + ROW_HEIGHT / 2, `${item.cost} gold`, {
        fontSize: '12px',
        fontFamily: 'Georgia, serif',
        color: '#ffd700',
      });
      costText.setOrigin(0, 0.5);
      costText.setScrollFactor(0);
      costText.setDepth(523);
      this.elements.push(costText);

      // Buy button
      const buyBtn = this.scene.add.text(left + PANEL_W - PAD - 40, ry + ROW_HEIGHT / 2, 'BUY', {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: '#1a1008',
        backgroundColor: '#b8960c',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold',
      });
      buyBtn.setOrigin(0.5, 0.5);
      buyBtn.setScrollFactor(0);
      buyBtn.setDepth(523);
      buyBtn.setInteractive();
      buyBtn.on('pointerdown', () => this._buyItem(itemId));
      buyBtn.on('pointerover', () => buyBtn.setStyle({ backgroundColor: '#d4b00e' }));
      buyBtn.on('pointerout', () => buyBtn.setStyle({ backgroundColor: '#b8960c' }));
      this.elements.push(buyBtn);
      this.buyButtons.push(buyBtn);
    }

    // Gold display at bottom
    this.goldText = this.scene.add.text(cx, top + PANEL_H - 24, '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
    });
    this.goldText.setOrigin(0.5, 0.5);
    this.goldText.setScrollFactor(0);
    this.goldText.setDepth(522);
    this.elements.push(this.goldText);

    // Feedback text
    this.feedbackDisplay = this.scene.add.text(cx, top + PANEL_H - 46, '', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#88ff88',
    });
    this.feedbackDisplay.setOrigin(0.5, 0.5);
    this.feedbackDisplay.setScrollFactor(0);
    this.feedbackDisplay.setDepth(522);
    this.elements.push(this.feedbackDisplay);
  }

  _buyItem(itemId) {
    const item = ITEMS[itemId];
    if (!item) return;

    if (this.player.currency.gold < item.cost) {
      this._showFeedback('Not enough gold!', '#cc4444');
      return;
    }

    // For non-stackable items, check if already owned
    if (!item.stackable && this.player.bag.hasItem(itemId)) {
      this._showFeedback('Already owned!', '#cccc44');
      return;
    }

    if (this.player.bag.isFull() && !this.player.bag.hasItem(itemId)) {
      this._showFeedback('Inventory full!', '#cc4444');
      return;
    }

    this.player.currency.gold -= item.cost;
    this.player.bag.addItem(itemId, 1);
    this._showFeedback(`Bought ${item.name}!`, '#88ff88');
    this._updateGold();
  }

  _showFeedback(text, color) {
    this.feedbackDisplay.setText(text);
    this.feedbackDisplay.setColor(color);
    if (this.feedbackTimer) this.feedbackTimer.remove();
    this.feedbackTimer = this.scene.time.delayedCall(2000, () => {
      this.feedbackDisplay.setText('');
    });
  }

  _updateGold() {
    this.goldText.setText(`Your Gold: ${this.player.currency.gold}`);
  }

  open() {
    this.isOpen = true;
    this._updateGold();
    this.feedbackDisplay.setText('');
    this._showAll();
  }

  close() {
    this.isOpen = false;
    this._hideAll();
  }

  _showAll() {
    for (const el of this.elements) el.setVisible(true);
  }

  _hideAll() {
    for (const el of this.elements) el.setVisible(false);
  }

  destroy() {
    if (this.feedbackTimer) this.feedbackTimer.remove();
    for (const el of this.elements) el.destroy();
    this.elements = [];
    this.buyButtons = [];
  }
}
