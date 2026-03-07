import NetworkManager from '../network/NetworkManager.js';

export default class ChatUI {
  constructor(scene) {
    this.scene = scene;
    this.messages = [];
    this.maxMessages = 20;
    this.isInputOpen = false;

    this._createDOM();
    this._setupKeyListeners();
    this._wireNetworkEvents();
  }

  _createDOM() {
    this.isOpen = false;
    this._notifyTimer = null;

    // Tab handle on left edge
    this.tab = document.createElement('div');
    this.tab.style.cssText = `
      position: fixed;
      bottom: 80px;
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
    this.tabLabel = document.createElement('span');
    this.tabLabel.style.cssText = `
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-family: Georgia, serif;
      font-size: 11px;
      color: #c8a860;
      user-select: none;
      letter-spacing: 1px;
    `;
    this.tabLabel.textContent = 'Chat';
    this.tab.appendChild(this.tabLabel);

    // Notification badge (hidden by default)
    this.badge = document.createElement('div');
    this.badge.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: #cc3333;
      border-radius: 50%;
      border: 1px solid rgba(44, 24, 16, 0.9);
      display: none;
    `;
    this.tab.appendChild(this.badge);

    this.tab.addEventListener('click', () => this._togglePanel());
    document.body.appendChild(this.tab);

    // Slide-out panel
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: -310px;
      width: 300px;
      height: 260px;
      background: rgba(44, 24, 16, 0.9);
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

    // Header bar with close button
    this.header = document.createElement('div');
    this.header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      border-bottom: 1px solid rgba(139, 107, 74, 0.3);
      flex-shrink: 0;
    `;
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Chat (T)';
    headerTitle.style.cssText = 'color: #c8a860; font-size: 11px;';
    this.header.appendChild(headerTitle);
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '\u2716';
    closeBtn.style.cssText = 'color: #8b6b4a; cursor: pointer; font-size: 13px; padding: 0 2px;';
    closeBtn.addEventListener('click', () => this._togglePanel());
    this.header.appendChild(closeBtn);
    this.container.appendChild(this.header);

    // Message list
    this.messageList = document.createElement('div');
    this.messageList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 6px 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(139,107,74,0.5) transparent;
    `;
    this.container.appendChild(this.messageList);

    // Input container (hidden by default)
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.cssText = `
      display: none;
      padding: 4px;
      border-top: 1px solid rgba(139, 107, 74, 0.3);
      flex-shrink: 0;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.maxLength = 200;
    this.input.placeholder = 'Type a message...';
    this.input.style.cssText = `
      width: 100%;
      background: rgba(250, 240, 220, 0.15);
      border: 1px solid rgba(139, 107, 74, 0.4);
      color: #f4e4c1;
      font-family: Georgia, serif;
      font-size: 12px;
      padding: 4px 8px;
      outline: none;
      border-radius: 2px;
      box-sizing: border-box;
    `;
    this.inputContainer.appendChild(this.input);
    this.container.appendChild(this.inputContainer);

    document.body.appendChild(this.container);

    // Input event handlers
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this._sendMessage();
      } else if (e.key === 'Escape') {
        this._closeInput();
      }
    });

    this.input.addEventListener('focus', () => {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('pauseInput', true);
      }
      this.scene.input.keyboard.enabled = false;
    });

    this.input.addEventListener('blur', () => {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('pauseInput', false);
      }
      this.scene.input.keyboard.enabled = true;
    });
  }

  _togglePanel() {
    this.isOpen = !this.isOpen;
    this.container.style.left = this.isOpen ? '0px' : '-310px';
    this.tab.style.left = this.isOpen ? '300px' : '0';
    this.badge.style.display = 'none';
  }

  _setupKeyListeners() {
    // Listen for T or Enter to open chat
    this._keyHandler = (e) => {
      if (this.isInputOpen) return;
      if (e.key === 't' || e.key === 'T' || e.key === 'Enter') {
        // Don't open chat if another UI is capturing input
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        e.preventDefault();
        this._openInput();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _wireNetworkEvents() {
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene) return;

    gameScene.events.on('chatMessage', (payload) => {
      this.addMessage(payload.displayName, payload.message, false);
    });

    gameScene.events.on('chatHistory', (history) => {
      for (const msg of history) {
        this.addMessage(msg.displayName, msg.message, false);
      }
    });

    gameScene.events.on('playerJoined', (payload) => {
      this.addMessage(null, `${payload.displayName} joined the realm`, true);
    });

    gameScene.events.on('playerLeft', (payload) => {
      this.addMessage(null, `${payload.displayName} left the realm`, true);
    });
  }

  _openInput() {
    // Auto-open panel if closed
    if (!this.isOpen) {
      this._togglePanel();
    }
    this.isInputOpen = true;
    this.inputContainer.style.display = 'block';
    this.input.focus();
  }

  _closeInput() {
    this.isInputOpen = false;
    this.inputContainer.style.display = 'none';
    this.input.value = '';
    this.input.blur();
  }

  _sendMessage() {
    const text = this.input.value.trim();
    if (!text) {
      this._closeInput();
      return;
    }

    const nm = NetworkManager.getInstance();
    if (nm) {
      nm.sendChat(text);
    }

    this._closeInput();
  }

  addMessage(displayName, message, isSystem) {
    const div = document.createElement('div');
    div.style.marginBottom = '3px';
    div.style.lineHeight = '1.3';

    const time = new Date();
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

    if (isSystem) {
      div.style.color = '#ffd700';
      div.style.fontStyle = 'italic';
      div.textContent = `[${timeStr}] ${message}`;
    } else {
      div.innerHTML = `<span style="color:#8b6b4a">[${timeStr}]</span> <strong>${this._escapeHtml(displayName)}</strong>: ${this._escapeHtml(message)}`;
    }

    this.messages.push(div);
    if (this.messages.length > this.maxMessages) {
      const old = this.messages.shift();
      old.remove();
    }

    this.messageList.appendChild(div);
    this.messageList.scrollTop = this.messageList.scrollHeight;

    // Show notification badge if panel is closed
    if (!this.isOpen) {
      this.badge.style.display = 'block';
    }
  }

  _escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
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
