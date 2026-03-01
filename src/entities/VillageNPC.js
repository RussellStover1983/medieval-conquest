import { WEAPONS } from '../constants.js';

const SHOP_WEAPONS = Object.entries(WEAPONS).filter(([key]) => key !== 'none');

const NPC_CONFIGS = {
  innkeeper: {
    name: 'Innkeeper',
    tint: 0xcc8844,
    dialog: [
      'Welcome, weary traveler!',
      'Rest here to restore your health.',
    ],
  },
  shopkeeper: {
    name: 'Merchant',
    tint: 0x44aa44,
    dialog: [
      'Fine wares for sale!',
      "I'll buy your gems for gold coins.",
    ],
  },
  blacksmith: {
    name: 'Blacksmith',
    tint: 0x8888cc,
    dialog: [
      'Welcome to the forge!',
      'Browse my weapons with E.',
    ],
  },
};

export default class VillageNPC {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.config = NPC_CONFIGS[type];

    this.shopIndex = 0;

    this.sprite = scene.add.sprite(x, y, 'detail_npc');
    this.sprite.setTint(this.config.tint);
    this.sprite.setDepth(10);

    // Label above NPC
    this.label = scene.add.text(x, y - 20, this.config.name, {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    this.label.setOrigin(0.5);
    this.label.setDepth(11);
  }

  getDialog() {
    return this.config.dialog;
  }

  interact(player) {
    if (this.type === 'innkeeper') {
      player.health = player.maxHealth;
      return 'Your health has been fully restored!';
    }

    if (this.type === 'shopkeeper') {
      let totalGold = 0;
      const rates = { silver: 2, emerald: 5, ruby: 10 };
      for (const [resource, rate] of Object.entries(rates)) {
        const amount = player.inventory[resource] || 0;
        if (amount > 0) {
          totalGold += amount * rate;
          player.inventory[resource] = 0;
        }
      }
      if (totalGold > 0) {
        player.inventory.gold += totalGold;
        return `Sold gems for ${totalGold} gold!`;
      }
      return 'You have nothing to sell.';
    }

    if (this.type === 'blacksmith') {
      const [key, weapon] = SHOP_WEAPONS[this.shopIndex];
      this.shopIndex = (this.shopIndex + 1) % SHOP_WEAPONS.length;
      const equipped = player.weapon === key ? ' [EQUIPPED]' : '';
      return `${weapon.name} - ${weapon.cost} gold${equipped}\n${weapon.description}\nPress F to buy`;
    }

    return '';
  }

  purchase(player) {
    if (this.type !== 'blacksmith') return '';

    // shopIndex was advanced by interact(), so the displayed weapon is one behind
    const idx = (this.shopIndex - 1 + SHOP_WEAPONS.length) % SHOP_WEAPONS.length;
    const [key, weapon] = SHOP_WEAPONS[idx];

    if (player.weapon === key) {
      return `Already equipped ${weapon.name}!`;
    }
    if (player.inventory.gold < weapon.cost) {
      return `Not enough gold! Need ${weapon.cost}.`;
    }
    player.inventory.gold -= weapon.cost;
    player.equipWeapon(key);
    return `Bought ${weapon.name}!`;
  }

  isNear(x, y, range = 50) {
    const dx = this.sprite.x - x;
    const dy = this.sprite.y - y;
    return Math.sqrt(dx * dx + dy * dy) < range;
  }

  destroy() {
    this.sprite.destroy();
    this.label.destroy();
  }
}
