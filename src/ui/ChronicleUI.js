export default class ChronicleUI {
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
      width: 450px; max-height: 500px; background: rgba(30, 16, 8, 0.95);
      border: 2px solid #8b6b4a; border-radius: 6px; font-family: Georgia, serif;
      color: #f4e4c1; z-index: 2000; display: flex; flex-direction: column;
    `;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'padding: 12px 16px; background: rgba(139,107,74,0.3); font-size: 18px; font-weight: bold; display: flex; justify-content: space-between;';
    titleBar.innerHTML = '<span>The Chronicle</span>';
    const closeBtn = document.createElement('span');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'cursor: pointer; color: #aa6633;';
    closeBtn.onclick = () => this.close();
    titleBar.appendChild(closeBtn);
    this.container.appendChild(titleBar);

    // Content
    const content = document.createElement('div');
    content.style.cssText = 'padding: 16px; overflow-y: auto; flex: 1; max-height: 420px;';

    try {
      const res = await fetch('/api/changelog');
      const entries = await res.json();

      const playerData = this.scene.registry.get('playerData');
      const joinDate = playerData ? new Date(playerData.join_date) : null;

      if (entries.length === 0) {
        content.innerHTML = '<p style="color:#8b6b4a;font-style:italic;">No chronicle entries yet. The story has yet to be written.</p>';
      } else {
        for (const entry of entries) {
          const div = document.createElement('div');
          div.style.cssText = 'padding: 12px 0; border-bottom: 1px solid rgba(139,107,74,0.2);';

          const releaseDate = new Date(entry.release_date);
          const wasHere = joinDate && joinDate <= releaseDate;

          let changesHtml = '';
          let changes = entry.changes;
          if (typeof changes === 'string') {
            try { changes = JSON.parse(changes); } catch { changes = []; }
          }
          if (changes && changes.length > 0) {
            changesHtml = '<ul style="margin: 4px 0 0 16px; padding: 0; font-size: 12px; color: #d4bc8b;">' +
              changes.map(c => `<li>${this._esc(c)}</li>`).join('') + '</ul>';
          }

          let contributors = entry.contributors;
          if (typeof contributors === 'string') {
            try { contributors = JSON.parse(contributors); } catch { contributors = []; }
          }

          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #ffd700; font-weight: bold; font-size: 15px;">v${this._esc(entry.version)}</span>
              <span style="color: #8b6b4a; font-size: 11px;">${releaseDate.toLocaleDateString()}</span>
            </div>
            <div style="font-size: 14px; margin: 4px 0; font-weight: bold;">${this._esc(entry.title)}</div>
            <div style="font-size: 12px; color: #c8a870;">${this._esc(entry.description)}</div>
            ${changesHtml}
            ${contributors && contributors.length > 0 ? `<div style="font-size: 11px; color: #8b6b4a; margin-top: 4px;">Contributors: ${contributors.map(c => this._esc(c)).join(', ')}</div>` : ''}
            ${wasHere ? '<div style="color: #ffd700; font-size: 10px; margin-top: 2px; font-style: italic;">You were here</div>' : ''}
          `;
          content.appendChild(div);
        }
      }
    } catch {
      content.innerHTML = '<p style="color:#aa3a3a;">Could not load chronicle.</p>';
    }

    this.container.appendChild(content);
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
