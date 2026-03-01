import { INVENTORY_SLOTS, HOTBAR_SLOTS, ITEMS } from '../constants.js';

export default class Inventory {
  constructor() {
    this.slots = new Array(INVENTORY_SLOTS).fill(null);
    this.hotbar = new Array(HOTBAR_SLOTS).fill(-1);
    this.activeHotbarIndex = 0;
    this.onChange = null;
  }

  addItem(id, qty = 1) {
    const itemDef = ITEMS[id];
    if (!itemDef) return false;

    let remaining = qty;

    // Stack into existing slots first
    if (itemDef.stackable) {
      for (let i = 0; i < this.slots.length && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot && slot.itemId === id && slot.quantity < itemDef.maxStack) {
          const canAdd = Math.min(remaining, itemDef.maxStack - slot.quantity);
          slot.quantity += canAdd;
          remaining -= canAdd;
        }
      }
    }

    // Place in empty slots
    while (remaining > 0) {
      const emptyIdx = this.slots.indexOf(null);
      if (emptyIdx === -1) return false; // inventory full
      const addQty = itemDef.stackable ? Math.min(remaining, itemDef.maxStack) : 1;
      this.slots[emptyIdx] = { itemId: id, quantity: addQty };
      remaining -= addQty;

      // Auto-assign first item of this type to an empty hotbar slot
      this._tryAutoAssignHotbar(emptyIdx);
    }

    if (this.onChange) this.onChange();
    return true;
  }

  removeItem(id, qty = 1) {
    let remaining = qty;

    // Remove from last stacks first (preserve earlier slots)
    for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = this.slots[i];
      if (slot && slot.itemId === id) {
        const removeQty = Math.min(remaining, slot.quantity);
        slot.quantity -= removeQty;
        remaining -= removeQty;
        if (slot.quantity <= 0) {
          this.slots[i] = null;
          // Clear any hotbar references to this slot
          for (let h = 0; h < this.hotbar.length; h++) {
            if (this.hotbar[h] === i) this.hotbar[h] = -1;
          }
        }
      }
    }

    if (this.onChange) this.onChange();
    return remaining === 0;
  }

  swapSlots(a, b) {
    if (a < 0 || a >= this.slots.length || b < 0 || b >= this.slots.length) return;
    const temp = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = temp;

    // Update hotbar references
    for (let h = 0; h < this.hotbar.length; h++) {
      if (this.hotbar[h] === a) this.hotbar[h] = b;
      else if (this.hotbar[h] === b) this.hotbar[h] = a;
    }

    if (this.onChange) this.onChange();
  }

  assignToHotbar(invIdx, hotbarSlot) {
    if (hotbarSlot < 0 || hotbarSlot >= HOTBAR_SLOTS) return;
    if (invIdx < 0 || invIdx >= this.slots.length) return;
    if (!this.slots[invIdx]) return;

    // Remove existing hotbar ref to this inv slot
    for (let h = 0; h < this.hotbar.length; h++) {
      if (this.hotbar[h] === invIdx) this.hotbar[h] = -1;
    }

    this.hotbar[hotbarSlot] = invIdx;
    if (this.onChange) this.onChange();
  }

  getActiveItem() {
    const invIdx = this.hotbar[this.activeHotbarIndex];
    if (invIdx === -1 || !this.slots[invIdx]) return null;
    return ITEMS[this.slots[invIdx].itemId];
  }

  getHotbarItem(hotbarSlot) {
    const invIdx = this.hotbar[hotbarSlot];
    if (invIdx === -1 || !this.slots[invIdx]) return null;
    const slot = this.slots[invIdx];
    return { ...ITEMS[slot.itemId], quantity: slot.quantity };
  }

  hasItem(id) {
    return this.slots.some(s => s && s.itemId === id);
  }

  countItem(id) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.itemId === id) total += slot.quantity;
    }
    return total;
  }

  isFull() {
    return this.slots.every(s => s !== null);
  }

  _tryAutoAssignHotbar(invIdx) {
    // Only auto-assign if no hotbar slot already points to an item with the same id
    const slot = this.slots[invIdx];
    if (!slot) return;

    for (let h = 0; h < this.hotbar.length; h++) {
      const ref = this.hotbar[h];
      if (ref !== -1 && this.slots[ref] && this.slots[ref].itemId === slot.itemId) return;
    }

    // Find first empty hotbar slot
    const emptyH = this.hotbar.indexOf(-1);
    if (emptyH !== -1) {
      this.hotbar[emptyH] = invIdx;
    }
  }
}
