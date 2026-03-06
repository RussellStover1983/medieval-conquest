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
    // Container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      width: 350px;
      height: 200px;
      background: rgba(44, 24, 16, 0.7);
      border: 1px solid rgba(139, 107, 74, 0.5);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      font-family: Georgia, serif;
      font-size: 12px;
      color: #f4e4c1;
      z-index: 1000;
      pointer-events: auto;
    `;

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
  }
}
