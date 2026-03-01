import { GAME_WIDTH, GAME_HEIGHT, HOTBAR_SLOTS, ITEMS } from '../constants.js';

const SLOT_SIZE = 48;
const SLOT_GAP = 4;
const BAR_WIDTH = HOTBAR_SLOTS * SLOT_SIZE + (HOTBAR_SLOTS - 1) * SLOT_GAP;

const ICON_KEYS = {
  sword: 'item_icon_sword',
  axe: 'item_icon_axe',
  spear: 'item_icon_spear',
  health_potion: 'item_icon_potion',
  pickaxe: 'item_icon_pickaxe',
  torch: 'item_icon_torch',
};

export default class Hotbar {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.slots = [];

    const startX = (GAME_WIDTH - BAR_WIDTH) / 2;
    const y = GAME_HEIGHT - SLOT_SIZE - 8;

    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const slot = this._createSlot(x, y, i);
      this.slots.push(slot);
    }

    this.refresh();
  }

  _createSlot(x, y, index) {
    const bg = this.scene.add.rectangle(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2,
      SLOT_SIZE, SLOT_SIZE, 0x1a1008, 0.85);
    bg.setScrollFactor(0);
    bg.setDepth(500);

    const border = this.scene.add.rectangle(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2,
      SLOT_SIZE, SLOT_SIZE);
    border.setStrokeStyle(2, index === 0 ? 0xffd700 : 0x665533);
    border.setFillStyle(0x000000, 0);
    border.setScrollFactor(0);
    border.setDepth(501);

    const icon = this.scene.add.sprite(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, '');
    icon.setScrollFactor(0);
    icon.setDepth(502);
    icon.setVisible(false);

    const qtyText = this.scene.add.text(x + SLOT_SIZE - 4, y + SLOT_SIZE - 4, '', {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    qtyText.setOrigin(1, 1);
    qtyText.setScrollFactor(0);
    qtyText.setDepth(503);

    const label = this.scene.add.text(x + 4, y + 2, `${index + 1}`, {
      fontSize: '9px',
      fontFamily: 'Georgia, serif',
      color: '#887755',
    });
    label.setScrollFactor(0);
    label.setDepth(503);

    // Click to select
    bg.setInteractive();
    bg.on('pointerdown', () => {
      this.player.equipFromHotbar(index);
      this.setActiveSlot(index);
    });

    return { bg, border, icon, qtyText, label, x, y };
  }

  setActiveSlot(index) {
    if (index < 0 || index >= HOTBAR_SLOTS) return;
    this.player.bag.activeHotbarIndex = index;

    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].border.setStrokeStyle(2, i === index ? 0xffd700 : 0x665533);
    }
  }

  refresh() {
    const bag = this.player.bag;

    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const slot = this.slots[i];
      const itemData = bag.getHotbarItem(i);

      if (itemData) {
        const iconKey = ICON_KEYS[itemData.id];
        if (iconKey && this.scene.textures.exists(iconKey)) {
          slot.icon.setTexture(iconKey);
          slot.icon.setVisible(true);
        } else {
          slot.icon.setVisible(false);
        }
        slot.qtyText.setText(itemData.quantity > 1 ? `${itemData.quantity}` : '');
      } else {
        slot.icon.setVisible(false);
        slot.qtyText.setText('');
      }
    }

    // Highlight active
    this.setActiveSlot(bag.activeHotbarIndex);
  }

  setVisible(visible) {
    for (const slot of this.slots) {
      slot.bg.setVisible(visible);
      slot.border.setVisible(visible);
      slot.icon.setVisible(visible && slot.icon.texture.key !== '');
      slot.qtyText.setVisible(visible);
      slot.label.setVisible(visible);
    }
    if (visible) this.refresh();
  }

  destroy() {
    for (const slot of this.slots) {
      slot.bg.destroy();
      slot.border.destroy();
      slot.icon.destroy();
      slot.qtyText.destroy();
      slot.label.destroy();
    }
    this.slots = [];
  }
}
