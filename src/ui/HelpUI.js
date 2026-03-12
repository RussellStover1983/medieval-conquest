export default class HelpUI {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this._createDOM();
  }

  _createDOM() {
    // Tab handle on left edge (positioned above chat tab)
    this.tab = document.createElement('div');
    this.tab.style.cssText = `
      position: fixed;
      bottom: 160px;
      left: 0;
      width: 28px;
      height: 70px;
      background: rgba(44, 24, 16, 0.85);
      border: 1px solid rgba(139, 107, 74, 0.5);
      border-left: none;
      border-radius: 0 6px 6px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1001;
      pointer-events: auto;
      transition: background 0.2s;
    `;
    this.tab.addEventListener('mouseenter', () => {
      this.tab.style.background = 'rgba(44, 24, 16, 1)';
    });
    this.tab.addEventListener('mouseleave', () => {
      this.tab.style.background = 'rgba(44, 24, 16, 0.85)';
    });

    // Tab label (vertical text)
    const tabLabel = document.createElement('span');
    tabLabel.style.cssText = `
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-family: Georgia, serif;
      font-size: 11px;
      color: #c8a860;
      user-select: none;
      letter-spacing: 1px;
    `;
    tabLabel.textContent = 'Help';
    this.tab.appendChild(tabLabel);

    this.tab.addEventListener('click', () => this._togglePanel());
    document.body.appendChild(this.tab);

    // Slide-out panel
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: -330px;
      width: 320px;
      height: 420px;
      background: rgba(44, 24, 16, 0.93);
      border: 1px solid rgba(139, 107, 74, 0.5);
      border-left: none;
      border-radius: 0 6px 6px 0;
      display: flex;
      flex-direction: column;
      font-family: Georgia, serif;
      font-size: 12px;
      color: #f4e4c1;
      z-index: 1000;
      pointer-events: auto;
      transition: left 0.25s ease;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-bottom: 1px solid rgba(139, 107, 74, 0.3);
      flex-shrink: 0;
    `;
    const title = document.createElement('span');
    title.textContent = 'How to Play';
    title.style.cssText = 'color: #ffd700; font-size: 14px; font-weight: bold;';
    header.appendChild(title);
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '\u2716';
    closeBtn.style.cssText = 'color: #8b6b4a; cursor: pointer; font-size: 13px; padding: 0 2px;';
    closeBtn.addEventListener('click', () => this._togglePanel());
    header.appendChild(closeBtn);
    this.container.appendChild(header);

    // Scrollable content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(139,107,74,0.5) transparent;
      line-height: 1.5;
    `;

    content.innerHTML = this._getInstructions();
    this.container.appendChild(content);

    document.body.appendChild(this.container);

    // H key to toggle
    this._keyHandler = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        this._togglePanel();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _togglePanel() {
    this.isOpen = !this.isOpen;
    this.container.style.left = this.isOpen ? '0px' : '-330px';
    this.tab.style.left = this.isOpen ? '320px' : '0';
  }

  _getInstructions() {
    return `
      ${this._section('Movement')}
      ${this._key('W A S D', 'Move your character')}
      ${this._key('Arrow keys', 'Also moves your character')}
      ${this._key('Touch joystick', 'On-screen pad (iPad/mobile)')}

      ${this._section('Combat')}
      ${this._key('Space', 'Attack nearby enemies')}
      ${this._key('Attack button', 'Tap the sword icon (iPad/mobile)')}
      ${this._tip('Equip better weapons from the hotbar for more damage')}

      ${this._section('Interaction')}
      ${this._key('E', 'Enter villages, open castles/forts, confirm building placement')}
      ${this._key('B', 'Open the build menu')}
      ${this._key('C', 'Open character stats & titles')}
      ${this._key('Tab', 'Open inventory')}
      ${this._key('1 - 5', 'Use hotbar slots')}
      ${this._key('ESC', 'Close menus / cancel placement')}

      ${this._section('Building')}
      ${this._tip('Press <b>B</b> to open the build menu and select a structure')}
      ${this._tip('Move your character to position the ghost, press <b>E</b> to place')}
      ${this._tip('Buildings cost wood and stone — harvest trees and rocks first')}
      ${this._tip('<b>Castles</b> let you spawn soldiers and villagers')}
      ${this._tip('<b>Forts</b> let you spawn villagers only')}

      ${this._section('Units (Command & Conquer style)')}
      ${this._tip('Build a <b>Castle</b> and press <b>E</b> near it to open the spawn menu')}
      ${this._key('Left-click', 'Select a unit')}
      ${this._key('Left-click + drag', 'Draw a box to select multiple units')}
      ${this._key('Left-click ground', 'Send selected units to that location')}
      ${this._key('Right-click ground', 'Also sends selected units (desktop)')}
      ${this._key('Double-click unit', 'Select all units of the same type on screen')}
      ${this._key('Shift + click', 'Add or remove a unit from your selection')}
      ${this._key('S', 'Stop selected units')}
      ${this._tip('Use the <b>Select All</b> button near the minimap')}
      ${this._tip('Soldiers patrol and auto-attack enemies nearby')}
      ${this._tip('Villagers auto-gather resources and return them to base')}
      ${this._tip('Max 20 units at a time')}

      ${this._section('Resources')}
      ${this._tip('Walk over gems on the ground to collect them')}
      ${this._tip('Equip a <b>pickaxe</b> to mine stone from rocks')}
      ${this._tip('Equip an <b>axe</b> to chop wood from trees')}
      ${this._tip('Kill enemies to earn gold, silver, emeralds, and rubies')}

      ${this._section('Exploration')}
      ${this._tip('The world map shows discovered territory')}
      ${this._tip('Walk through new areas to explore and capture regions')}
      ${this._tip('Visit <b>villages</b> to trade with NPCs')}
      ${this._tip('Scouts explore a wider area around them')}

      ${this._section('Multiplayer')}
      ${this._key('T / Enter', 'Open chat')}
      ${this._tip('Log in with a player code to save progress and chat')}
      ${this._tip('Your game auto-saves every 30 seconds')}

      <div style="height: 12px;"></div>
    `;
  }

  _section(title) {
    return `<div style="color: #ffd700; font-size: 13px; font-weight: bold; margin: 10px 0 4px 0; border-bottom: 1px solid rgba(139,107,74,0.3); padding-bottom: 2px;">${title}</div>`;
  }

  _key(key, desc) {
    return `<div style="margin: 2px 0;"><span style="display: inline-block; background: rgba(250,240,220,0.12); border: 1px solid rgba(139,107,74,0.4); border-radius: 3px; padding: 0 5px; font-size: 11px; color: #c8a860; min-width: 24px; text-align: center;">${key}</span> <span style="color: #d4bc8b;">${desc}</span></div>`;
  }

  _tip(text) {
    return `<div style="margin: 2px 0 2px 4px; color: #d4bc8b;">\u2022 ${text}</div>`;
  }

  destroy() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    if (this.tab && this.tab.parentNode) {
      this.tab.remove();
    }
  }
}
