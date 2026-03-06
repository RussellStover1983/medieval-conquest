import { GAME_WIDTH, GAME_HEIGHT, TITLE_DEFINITIONS } from '../constants.js';
import { getTitleName } from '../player/TitleManager.js';

const PANEL_W = 320;
const PANEL_H = 420;

export default class CharacterMenu {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
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
    this.bg = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x1a1008, 0.92);
    this.bg.setScrollFactor(0).setDepth(510);
    this.elements.push(this.bg);

    // Border
    const border = this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H);
    border.setStrokeStyle(2, 0x665533);
    border.setFillStyle(0, 0);
    border.setScrollFactor(0).setDepth(511);
    this.elements.push(border);

    // Title
    this.titleText = this.scene.add.text(cx, top + 16, 'CHARACTER', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(512);
    this.elements.push(this.titleText);

    // Player name
    this.nameText = this.scene.add.text(cx, top + 50, this.player.className, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f4e4c1', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(512);
    this.elements.push(this.nameText);

    // Active title
    this.activeTitleText = this.scene.add.text(cx, top + 76, '', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'italic',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(512);
    this.elements.push(this.activeTitleText);

    // Class with color indicator
    const classColor = this.player.classData.color;
    this.classIndicator = this.scene.add.rectangle(left + 20, top + 108, 12, 12, classColor);
    this.classIndicator.setScrollFactor(0).setDepth(512);
    this.elements.push(this.classIndicator);

    this.classText = this.scene.add.text(left + 34, top + 102, `Class: ${this.player.className}`, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#d4bc8b',
    }).setScrollFactor(0).setDepth(512);
    this.elements.push(this.classText);

    // Join date
    this.joinDateText = this.scene.add.text(left + 20, top + 124, 'Joined: -', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#8b6b4a',
    }).setScrollFactor(0).setDepth(512);
    this.elements.push(this.joinDateText);

    // Stats section
    this.scene.add.text(left + 20, top + 154, 'STATS', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(512);
    this.elements.push(this.elements[this.elements.length]); // won't push, just a label

    const statNames = ['Exploration', 'Building', 'Combat', 'Contribution'];
    const statKeys = ['exploration', 'building', 'combat', 'contribution'];
    this.statTexts = [];

    statKeys.forEach((key, i) => {
      const sy = top + 178 + i * 28;

      const label = this.scene.add.text(left + 20, sy, statNames[i], {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#d4bc8b',
      }).setScrollFactor(0).setDepth(512);
      this.elements.push(label);

      // Bar bg
      const barBg = this.scene.add.rectangle(left + 120, sy + 6, 140, 10, 0x2c1810, 0.5);
      barBg.setOrigin(0, 0.5).setScrollFactor(0).setDepth(512);
      this.elements.push(barBg);

      // Bar fill
      const barFill = this.scene.add.rectangle(left + 120, sy + 6, 0, 10, 0x6aaa3a, 0.7);
      barFill.setOrigin(0, 0.5).setScrollFactor(0).setDepth(513);
      this.elements.push(barFill);

      // Value
      const valueText = this.scene.add.text(left + 268, sy, '0', {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#f4e4c1',
      }).setScrollFactor(0).setDepth(512);
      this.elements.push(valueText);

      this.statTexts.push({ key, barFill, valueText });
    });

    // Titles section
    const titlesY = top + 300;
    this.scene.add.text(left + 20, titlesY, 'TITLES', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(512);

    this.titleListTexts = [];
    for (let i = 0; i < 3; i++) {
      const t = this.scene.add.text(left + 20, titlesY + 22 + i * 18, '', {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#d4bc8b',
      }).setScrollFactor(0).setDepth(512);
      this.elements.push(t);
      this.titleListTexts.push(t);
    }

    // Player code
    this.codeText = this.scene.add.text(cx, top + PANEL_H - 24, '', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#8b6b4a',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(512);
    this.elements.push(this.codeText);
  }

  _hideAll() {
    for (const el of this.elements) {
      if (el && el.setVisible) el.setVisible(false);
    }
    for (const t of this.titleListTexts) t.setVisible(false);
    for (const s of this.statTexts) {
      s.barFill.setVisible(false);
      s.valueText.setVisible(false);
    }
    this.bg.setVisible(false);
    this.titleText.setVisible(false);
    this.nameText.setVisible(false);
    this.activeTitleText.setVisible(false);
    this.classIndicator.setVisible(false);
    this.classText.setVisible(false);
    this.joinDateText.setVisible(false);
    this.codeText.setVisible(false);
  }

  _showAll() {
    for (const el of this.elements) {
      if (el && el.setVisible) el.setVisible(true);
    }
    for (const t of this.titleListTexts) t.setVisible(true);
    for (const s of this.statTexts) {
      s.barFill.setVisible(true);
      s.valueText.setVisible(true);
    }
    this.bg.setVisible(true);
    this.titleText.setVisible(true);
    this.nameText.setVisible(true);
    this.activeTitleText.setVisible(true);
    this.classIndicator.setVisible(true);
    this.classText.setVisible(true);
    this.joinDateText.setVisible(true);
    this.codeText.setVisible(true);
  }

  refresh() {
    const playerData = this.scene.registry.get('playerData');
    if (playerData) {
      this.nameText.setText(playerData.display_name || this.player.className);
      this.codeText.setText(`Your code: ${playerData.player_code || '------'}`);

      // Join date
      if (playerData.join_date) {
        const d = new Date(playerData.join_date);
        const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        this.joinDateText.setText(`Joined: ${d.toLocaleDateString()} (Day ${days + 1})`);
      }

      // Stats
      let stats = playerData.stats || {};
      if (typeof stats === 'string') {
        try { stats = JSON.parse(stats); } catch { stats = {}; }
      }

      for (const s of this.statTexts) {
        const val = stats[s.key] || 0;
        s.valueText.setText(String(val));
        const barWidth = Math.min(val, 100) / 100 * 140;
        s.barFill.width = barWidth;
      }

      // Titles
      let titles = playerData.titles || [];
      if (typeof titles === 'string') {
        try { titles = JSON.parse(titles); } catch { titles = []; }
      }

      for (let i = 0; i < this.titleListTexts.length; i++) {
        if (i < titles.length) {
          const def = TITLE_DEFINITIONS[titles[i]];
          this.titleListTexts[i].setText(`- ${getTitleName(titles[i])}${def ? ': ' + def.description : ''}`);
        } else {
          this.titleListTexts[i].setText('');
        }
      }

      // Active title
      if (titles.length > 0) {
        this.activeTitleText.setText(getTitleName(titles[0]));
      }
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.refresh();
    this._showAll();
  }

  close() {
    this.isOpen = false;
    this._hideAll();
  }
}
