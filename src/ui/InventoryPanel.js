import { GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS, ITEMS } from '../constants.js';

const COLS = 6;
const ROWS = 5;
const CELL_SIZE = 56;
const CELL_GAP = 4;
const PANEL_PAD = 20;
const PANEL_W = COLS * CELL_SIZE + (COLS - 1) * CELL_GAP + PANEL_PAD * 2;
const PANEL_H = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP + PANEL_PAD * 2 + 40; // +40 for title

const ICON_KEYS = {
  sword: 'item_icon_sword',
  axe: 'item_icon_axe',
  spear: 'item_icon_spear',
  health_potion: 'item_icon_potion',
  pickaxe: 'item_icon_pickaxe',
  torch: 'item_icon_torch',
};

export default class InventoryPanel {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.selectedSlot = -1;
    this.elements = [];
    this.slotElements = [];
    this.detailElements = [];

    this._build();
    this._hideAll();
  }

  _build() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const left = cx - PANEL_W / 2;
    const top = cy - PANEL_H / 2;

    // Background
    this.bg = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x1a1008, 0.92);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(510);
    this.elements.push(this.bg);

    // Border
    this.borderRect = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H);
    this.borderRect.setStrokeStyle(2, 0x665533);
    this.borderRect.setFillStyle(0, 0);
    this.borderRect.setScrollFactor(0);
    this.borderRect.setDepth(511);
    this.elements.push(this.borderRect);

    // Title
    this.title = this.scene.add.text(cx, top + 16, 'INVENTORY', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.title.setOrigin(0.5, 0);
    this.title.setScrollFactor(0);
    this.title.setDepth(512);
    this.elements.push(this.title);

    // Close button
    this.closeBtn = this.scene.add.text(left + PANEL_W - 14, top + 6, 'X', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#cc6666',
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setScrollFactor(0);
    this.closeBtn.setDepth(512);
    this.closeBtn.setInteractive();
    this.closeBtn.on('pointerdown', () => this.close());
    this.elements.push(this.closeBtn);

    // Grid slots
    const gridTop = top + 40;
    const gridLeft = left + PANEL_PAD;

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const sx = gridLeft + col * (CELL_SIZE + CELL_GAP);
      const sy = gridTop + row * (CELL_SIZE + CELL_GAP);

      const cellBg = this.scene.add.rectangle(sx + CELL_SIZE / 2, sy + CELL_SIZE / 2,
        CELL_SIZE, CELL_SIZE, 0x2c1810, 0.8);
      cellBg.setScrollFactor(0);
      cellBg.setDepth(512);

      const cellBorder = this.scene.add.rectangle(sx + CELL_SIZE / 2, sy + CELL_SIZE / 2,
        CELL_SIZE, CELL_SIZE);
      cellBorder.setStrokeStyle(1, 0x554433);
      cellBorder.setFillStyle(0, 0);
      cellBorder.setScrollFactor(0);
      cellBorder.setDepth(513);

      const icon = this.scene.add.sprite(sx + CELL_SIZE / 2, sy + CELL_SIZE / 2, '');
      icon.setScrollFactor(0);
      icon.setDepth(514);
      icon.setVisible(false);

      const qtyText = this.scene.add.text(sx + CELL_SIZE - 4, sy + CELL_SIZE - 4, '', {
        fontSize: '10px',
        fontFamily: 'Georgia, serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      });
      qtyText.setOrigin(1, 1);
      qtyText.setScrollFactor(0);
      qtyText.setDepth(515);

      // Click to select
      cellBg.setInteractive();
      const slotIdx = i;
      cellBg.on('pointerdown', () => this._selectSlot(slotIdx));

      this.slotElements.push({ cellBg, cellBorder, icon, qtyText });
      this.elements.push(cellBg, cellBorder, icon, qtyText);
    }

    // Detail area (below grid)
    const detailY = gridTop + ROWS * (CELL_SIZE + CELL_GAP) + 4;
    this.detailText = this.scene.add.text(left + PANEL_PAD, detailY, '', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      wordWrap: { width: PANEL_W - PANEL_PAD * 2 - 120 },
    });
    this.detailText.setScrollFactor(0);
    this.detailText.setDepth(512);
    this.elements.push(this.detailText);

    // Assign to hotbar button
    this.assignBtn = this.scene.add.text(left + PANEL_W - PANEL_PAD - 110, detailY, '', {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      backgroundColor: '#3d2b1f',
      padding: { x: 6, y: 3 },
    });
    this.assignBtn.setScrollFactor(0);
    this.assignBtn.setDepth(512);
    this.assignBtn.setInteractive();
    this.assignBtn.on('pointerdown', () => this._assignPrompt());
    this.assignBtn.setVisible(false);
    this.elements.push(this.assignBtn);

    // Drop button
    this.dropBtn = this.scene.add.text(left + PANEL_W - PANEL_PAD - 110, detailY + 22, 'Drop', {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#cc6666',
      backgroundColor: '#3d2b1f',
      padding: { x: 6, y: 3 },
    });
    this.dropBtn.setScrollFactor(0);
    this.dropBtn.setDepth(512);
    this.dropBtn.setInteractive();
    this.dropBtn.on('pointerdown', () => this._dropSelected());
    this.dropBtn.setVisible(false);
    this.elements.push(this.dropBtn);
  }

  _selectSlot(index) {
    this.selectedSlot = index;
    const slot = this.player.bag.slots[index];

    // Reset all borders
    for (let i = 0; i < this.slotElements.length; i++) {
      this.slotElements[i].cellBorder.setStrokeStyle(1, i === index && slot ? 0xffd700 : 0x554433);
    }

    if (slot) {
      const item = ITEMS[slot.itemId];
      this.detailText.setText(`${item.name} (x${slot.quantity})\n${item.description}`);
      this.assignBtn.setText('Assign to Hotbar');
      this.assignBtn.setVisible(true);
      this.dropBtn.setVisible(true);
    } else {
      this.detailText.setText('');
      this.assignBtn.setVisible(false);
      this.dropBtn.setVisible(false);
    }
  }

  _assignPrompt() {
    if (this.selectedSlot < 0) return;
    const slot = this.player.bag.slots[this.selectedSlot];
    if (!slot) return;

    // Assign to the currently active hotbar slot
    this.player.bag.assignToHotbar(this.selectedSlot, this.player.bag.activeHotbarIndex);
    this.refresh();
  }

  assignToHotbarSlot(hotbarIndex) {
    if (this.selectedSlot < 0) return;
    const slot = this.player.bag.slots[this.selectedSlot];
    if (!slot) return;
    this.player.bag.assignToHotbar(this.selectedSlot, hotbarIndex);
    this.refresh();
  }

  _dropSelected() {
    if (this.selectedSlot < 0) return;
    const slot = this.player.bag.slots[this.selectedSlot];
    if (!slot) return;

    this.player.bag.removeItem(slot.itemId, slot.quantity);
    this.selectedSlot = -1;
    this.detailText.setText('');
    this.assignBtn.setVisible(false);
    this.dropBtn.setVisible(false);
    this.refresh();
  }

  open() {
    this.isOpen = true;
    this.selectedSlot = -1;
    this.detailText.setText('');
    this.assignBtn.setVisible(false);
    this.dropBtn.setVisible(false);
    this.refresh();
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

  refresh() {
    const bag = this.player.bag;

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const el = this.slotElements[i];
      const slot = bag.slots[i];

      if (slot) {
        const iconKey = ICON_KEYS[slot.itemId];
        if (iconKey && this.scene.textures.exists(iconKey)) {
          el.icon.setTexture(iconKey);
          el.icon.setVisible(true);
        } else {
          el.icon.setVisible(false);
        }
        el.qtyText.setText(slot.quantity > 1 ? `${slot.quantity}` : '');
      } else {
        el.icon.setVisible(false);
        el.qtyText.setText('');
      }

      el.cellBorder.setStrokeStyle(1, i === this.selectedSlot && slot ? 0xffd700 : 0x554433);
    }
  }

  _showAll() {
    for (const el of this.elements) el.setVisible(true);
    // Re-hide icons for empty slots
    for (let i = 0; i < this.slotElements.length; i++) {
      const slot = this.player.bag.slots[i];
      if (!slot) {
        this.slotElements[i].icon.setVisible(false);
        this.slotElements[i].qtyText.setVisible(false);
      }
    }
    this.assignBtn.setVisible(false);
    this.dropBtn.setVisible(false);
  }

  _hideAll() {
    for (const el of this.elements) el.setVisible(false);
  }

  destroy() {
    for (const el of this.elements) el.destroy();
    this.elements = [];
    this.slotElements = [];
  }
}
