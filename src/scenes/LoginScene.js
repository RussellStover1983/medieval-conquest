import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { UI_COLORS } from '../utils/ParchmentColors.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(UI_COLORS.PARCHMENT_BG);
    this.cameras.main.fadeIn(300, 44, 24, 16);

    // Decorative border
    const border = this.add.graphics();
    border.lineStyle(3, UI_COLORS.INK_DARK, 0.4);
    border.strokeRect(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);

    // Title
    this.add.text(GAME_WIDTH / 2, 100, 'Medieval Conquest', {
      fontSize: '42px',
      fontFamily: 'Georgia, serif',
      color: '#2c1810',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Ornamental line
    const line = this.add.graphics();
    line.lineStyle(2, UI_COLORS.INK_MED, 0.5);
    line.lineBetween(GAME_WIDTH / 2 - 80, 140, GAME_WIDTH / 2 + 80, 140);

    // State tracking
    this.currentFlow = null;
    this.inputElement = null;
    this.statusText = null;
    this.codeDisplay = null;
    this.flowElements = [];

    // Two buttons
    this._createButton(GAME_WIDTH / 2, 280, 'New Player', () => this._showNewPlayerFlow());
    this._createButton(GAME_WIDTH / 2, 360, 'Returning Player', () => this._showReturningFlow());
  }

  _createButton(x, y, text, onClick) {
    const bg = this.add.rectangle(x, y, 220, 50, UI_COLORS.INK_DARK, 0.1);
    bg.setInteractive({ useHandCursor: true });
    const bdr = this.add.rectangle(x, y, 220, 50);
    bdr.setStrokeStyle(2, UI_COLORS.INK_DARK, 0.6);
    const label = this.add.text(x, y, text, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#2c1810',
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.fillAlpha = 0.2; label.setScale(1.05); });
    bg.on('pointerout', () => { bg.fillAlpha = 0.1; label.setScale(1); });
    bg.on('pointerdown', onClick);

    return { bg, bdr, label };
  }

  _clearFlow() {
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }
    for (const el of this.flowElements) {
      if (el && el.destroy) el.destroy();
    }
    this.flowElements = [];
    this.statusText = null;
    this.codeDisplay = null;
  }

  _createInput(y, placeholder, maxLength) {
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / GAME_WIDTH;
    const scaleY = canvasRect.height / GAME_HEIGHT;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.maxLength = maxLength || 20;
    input.style.cssText = `
      position: absolute;
      left: ${canvasRect.left + (GAME_WIDTH / 2 - 120) * scaleX}px;
      top: ${canvasRect.top + y * scaleY}px;
      width: ${240 * scaleX}px;
      height: ${36 * scaleY}px;
      font-family: Georgia, serif;
      font-size: ${16 * scaleY}px;
      text-align: center;
      background: #faf0dc;
      border: 2px solid #8b6b4a;
      color: #2c1810;
      outline: none;
      border-radius: 4px;
      box-sizing: border-box;
    `;
    document.body.appendChild(input);
    this.inputElement = input;

    // Focus after short delay
    setTimeout(() => input.focus(), 100);
    return input;
  }

  _showNewPlayerFlow() {
    if (this.currentFlow === 'new') return;
    this._clearFlow();
    this.currentFlow = 'new';

    const label = this.add.text(GAME_WIDTH / 2, 440, 'Enter your name:', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#5c3a1e',
    }).setOrigin(0.5);
    this.flowElements.push(label);

    const input = this._createInput(470, 'Your display name', 20);

    this.statusText = this.add.text(GAME_WIDTH / 2, 560, '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#aa3a3a',
      align: 'center', wordWrap: { width: 400 },
    }).setOrigin(0.5);
    this.flowElements.push(this.statusText);

    const submitBtn = this._createSmallButton(GAME_WIDTH / 2, 530, 'Create', async () => {
      const name = input.value.trim();
      if (!name) {
        this.statusText.setText('Please enter a name');
        return;
      }
      this.statusText.setText('Creating player...');
      try {
        const res = await fetch('/api/auth/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: name, selectedClass: 'Knight' }),
        });
        const data = await res.json();
        if (!res.ok) {
          this.statusText.setText(data.error || 'Error creating player');
          return;
        }
        this._showPlayerCode(data);
      } catch (e) {
        this.statusText.setText('Server not available. Playing offline.');
        setTimeout(() => this._goToCharSelect(), 1500);
      }
    });
    this.flowElements.push(submitBtn.bg, submitBtn.bdr, submitBtn.label);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBtn.bg.emit('pointerdown');
    });
  }

  _showReturningFlow() {
    if (this.currentFlow === 'returning') return;
    this._clearFlow();
    this.currentFlow = 'returning';

    const label = this.add.text(GAME_WIDTH / 2, 440, 'Enter your 6-character code:', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#5c3a1e',
    }).setOrigin(0.5);
    this.flowElements.push(label);

    const input = this._createInput(470, 'e.g. K7X2M9', 6);
    input.style.textTransform = 'uppercase';
    input.style.letterSpacing = '4px';
    input.style.fontSize = `${20 * (this.game.canvas.getBoundingClientRect().height / GAME_HEIGHT)}px`;

    this.statusText = this.add.text(GAME_WIDTH / 2, 560, '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#aa3a3a',
    }).setOrigin(0.5);
    this.flowElements.push(this.statusText);

    const submitBtn = this._createSmallButton(GAME_WIDTH / 2, 530, 'Login', async () => {
      const code = input.value.trim().toUpperCase();
      if (code.length !== 6) {
        this.statusText.setText('Code must be 6 characters');
        return;
      }
      this.statusText.setText('Logging in...');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerCode: code }),
        });
        const data = await res.json();
        if (!res.ok) {
          this.statusText.setText(data.error || 'Code not found');
          return;
        }
        this.registry.set('playerData', data.player);
        this.registry.set('authToken', data.token);
        this._clearFlow();
        this._goToCharSelect();
      } catch (e) {
        this.statusText.setText('Server not available. Playing offline.');
        setTimeout(() => this._goToCharSelect(), 1500);
      }
    });
    this.flowElements.push(submitBtn.bg, submitBtn.bdr, submitBtn.label);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBtn.bg.emit('pointerdown');
    });
  }

  _showPlayerCode(data) {
    this._clearFlow();
    this.currentFlow = 'code';

    this.registry.set('playerData', data.player);
    this.registry.set('authToken', data.token);

    const welcome = this.add.text(GAME_WIDTH / 2, 430, `Welcome, ${data.player.display_name}!`, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#2c1810', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.flowElements.push(welcome);

    const codeLabel = this.add.text(GAME_WIDTH / 2, 480, 'YOUR CODE:', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#5c3a1e',
    }).setOrigin(0.5);
    this.flowElements.push(codeLabel);

    const codeText = this.add.text(GAME_WIDTH / 2, 520, data.playerCode, {
      fontSize: '36px', fontFamily: 'Georgia, serif', color: '#c0392b',
      fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5);
    this.flowElements.push(codeText);

    const warning = this.add.text(GAME_WIDTH / 2, 570, 'Write this down! You need it to log back in.', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#aa3a3a',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    this.flowElements.push(warning);

    const continueBtn = this._createSmallButton(GAME_WIDTH / 2, 630, 'Continue', () => {
      this._clearFlow();
      this._goToCharSelect();
    });
    this.flowElements.push(continueBtn.bg, continueBtn.bdr, continueBtn.label);
  }

  _createSmallButton(x, y, text, onClick) {
    const bg = this.add.rectangle(x, y, 140, 36, UI_COLORS.INK_DARK, 0.1);
    bg.setInteractive({ useHandCursor: true });
    const bdr = this.add.rectangle(x, y, 140, 36);
    bdr.setStrokeStyle(1, UI_COLORS.INK_DARK, 0.6);
    const label = this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#2c1810',
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.fillAlpha = 0.2; });
    bg.on('pointerout', () => { bg.fillAlpha = 0.1; });
    bg.on('pointerdown', onClick);

    return { bg, bdr, label };
  }

  _goToCharSelect() {
    this.cameras.main.fadeOut(300, 44, 24, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharSelectScene');
    });
  }

  shutdown() {
    this._clearFlow();
  }
}
