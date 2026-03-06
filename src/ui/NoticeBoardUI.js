import NetworkManager from '../network/NetworkManager.js';

export default class NoticeBoardUI {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.container = null;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._createDOM();
    this._pauseInput(true);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this._pauseInput(false);
  }

  _pauseInput(paused) {
    const gameScene = this.scene.scene ? this.scene.scene.get('GameScene') : this.scene;
    if (gameScene && gameScene.events) {
      gameScene.events.emit('pauseInput', paused);
    }
    if (this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = !paused;
    }
  }

  async _createDOM() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 360px; max-height: 400px; background: rgba(30, 16, 8, 0.95);
      border: 2px solid #8b6b4a; border-radius: 6px; font-family: Georgia, serif;
      color: #f4e4c1; z-index: 2000; padding: 16px;
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = 'font-size: 18px; font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between;';
    title.innerHTML = '<span>Notice Board</span>';
    const closeBtn = document.createElement('span');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'cursor: pointer; color: #aa6633;';
    closeBtn.onclick = () => this.close();
    title.appendChild(closeBtn);
    this.container.appendChild(title);

    // Online count
    const nm = NetworkManager.getInstance();
    const onlineCount = nm ? nm.remotePlayers.size + 1 : 1;
    const onlineDiv = document.createElement('div');
    onlineDiv.style.cssText = 'color: #6aaa3a; font-size: 13px; margin-bottom: 12px;';
    onlineDiv.textContent = `Players online: ${onlineCount}`;
    this.container.appendChild(onlineDiv);

    // Latest changelog
    try {
      const latestRes = await fetch('/api/changelog/latest');
      const latest = await latestRes.json();
      if (latest) {
        const latestDiv = document.createElement('div');
        latestDiv.style.cssText = 'margin-bottom: 12px; padding: 8px; background: rgba(139,107,74,0.15); border-radius: 3px;';
        latestDiv.innerHTML = `
          <div style="color: #ffd700; font-size: 13px; font-weight: bold;">Latest: v${this._esc(latest.version)} - ${this._esc(latest.title)}</div>
          <div style="color: #c8a870; font-size: 12px; margin-top: 4px;">${this._esc(latest.description)}</div>
        `;
        this.container.appendChild(latestDiv);
      }
    } catch {}

    // Top 5 voted submissions
    try {
      const subRes = await fetch('/api/submissions?status=pending');
      const submissions = await subRes.json();
      const top5 = submissions.slice(0, 5);

      if (top5.length > 0) {
        const header = document.createElement('div');
        header.style.cssText = 'color: #ffd700; font-size: 13px; font-weight: bold; margin-bottom: 6px;';
        header.textContent = 'Top Ideas:';
        this.container.appendChild(header);

        for (const sub of top5) {
          const div = document.createElement('div');
          div.style.cssText = 'font-size: 12px; color: #d4bc8b; padding: 4px 0; border-bottom: 1px solid rgba(139,107,74,0.15);';
          div.textContent = `[${sub.votes || 0}] ${sub.content.substring(0, 60)}${sub.content.length > 60 ? '...' : ''}`;
          this.container.appendChild(div);
        }
      }
    } catch {}

    document.body.appendChild(this.container);

    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  }

  _esc(text) {
    const el = document.createElement('span');
    el.textContent = text || '';
    return el.innerHTML;
  }

  destroy() {
    this.close();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
  }
}
