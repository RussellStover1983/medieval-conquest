import { RESOURCE_COLORS } from '../utils/ParchmentColors.js';

export default class CurrencyDisplay {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.items = {};

    const types = ['gold', 'silver', 'emerald', 'ruby', 'wood', 'stone'];
    const labels = ['Gold', 'Silver', 'Emerald', 'Ruby', 'Wood', 'Stone'];

    types.forEach((type, i) => {
      const yOff = y + i * 22;

      const icon = scene.add.circle(x, yOff + 6, 6, RESOURCE_COLORS[type]);
      icon.setScrollFactor(0);
      icon.setDepth(100);

      const text = scene.add.text(x + 14, yOff, '0', {
        fontSize: '14px',
        fontFamily: 'Georgia, serif',
        color: '#f4e4c1',
      });
      text.setScrollFactor(0);
      text.setDepth(100);

      this.items[type] = { icon, text };
    });
  }

  update(inventory) {
    for (const [type, item] of Object.entries(this.items)) {
      item.text.setText(`${inventory[type] || 0}`);
    }
  }

  setVisible(visible) {
    for (const item of Object.values(this.items)) {
      item.icon.setVisible(visible);
      item.text.setVisible(visible);
    }
  }
}
