export default class BuildersHallUI {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.container = null;
    this.currentTab = 'submit';
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

  _createDOM() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 500px; max-height: 500px; background: rgba(30, 16, 8, 0.95);
      border: 2px solid #8b6b4a; border-radius: 6px; font-family: Georgia, serif;
      color: #f4e4c1; z-index: 2000; display: flex; flex-direction: column;
      overflow: hidden;
    `;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'padding: 12px 16px; background: rgba(139,107,74,0.3); font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;';
    titleBar.innerHTML = "<span>Builder's Hall</span>";
    const closeBtn = document.createElement('span');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'cursor: pointer; color: #aa6633;';
    closeBtn.onclick = () => this.close();
    titleBar.appendChild(closeBtn);
    this.container.appendChild(titleBar);

    // Tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display: flex; border-bottom: 1px solid rgba(139,107,74,0.4);';
    ['Submit Idea', 'Current Ideas', 'Being Built'].forEach((label, i) => {
      const tabKeys = ['submit', 'current', 'approved'];
      const tab = document.createElement('div');
      tab.textContent = label;
      tab.style.cssText = `flex: 1; text-align: center; padding: 8px; cursor: pointer; font-size: 13px;
        background: ${this.currentTab === tabKeys[i] ? 'rgba(139,107,74,0.3)' : 'transparent'};`;
      tab.onclick = () => { this.currentTab = tabKeys[i]; this._refreshContent(); };
      tabs.appendChild(tab);
    });
    this.container.appendChild(tabs);

    // Content area
    this.contentArea = document.createElement('div');
    this.contentArea.style.cssText = 'padding: 16px; overflow-y: auto; flex: 1; max-height: 380px;';
    this.container.appendChild(this.contentArea);

    document.body.appendChild(this.container);

    // ESC to close
    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    };
    document.addEventListener('keydown', this._escHandler);

    this._refreshContent();
  }

  async _refreshContent() {
    if (!this.contentArea) return;
    this.contentArea.innerHTML = '';

    if (this.currentTab === 'submit') {
      this._renderSubmitTab();
    } else {
      const status = this.currentTab === 'current' ? 'pending' : 'approved';
      await this._renderListTab(status);
    }
  }

  _renderSubmitTab() {
    const textarea = document.createElement('textarea');
    textarea.maxLength = 300;
    textarea.placeholder = 'Describe your idea for the game...';
    textarea.style.cssText = `width: 100%; height: 100px; background: rgba(250,240,220,0.1);
      border: 1px solid rgba(139,107,74,0.4); color: #f4e4c1; font-family: Georgia, serif;
      font-size: 13px; padding: 8px; outline: none; resize: none; box-sizing: border-box;`;
    this.contentArea.appendChild(textarea);

    const select = document.createElement('select');
    select.style.cssText = `margin-top: 8px; background: rgba(250,240,220,0.1); border: 1px solid rgba(139,107,74,0.4);
      color: #f4e4c1; font-family: Georgia, serif; padding: 4px 8px;`;
    ['general', 'feature', 'content', 'bugfix'].forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      select.appendChild(opt);
    });
    this.contentArea.appendChild(select);

    const btn = document.createElement('button');
    btn.textContent = 'Submit Idea';
    btn.style.cssText = `display: block; margin-top: 12px; padding: 8px 20px;
      background: rgba(139,107,74,0.4); border: 1px solid #8b6b4a; color: #f4e4c1;
      font-family: Georgia, serif; cursor: pointer; border-radius: 3px;`;
    btn.onclick = async () => {
      const content = textarea.value.trim();
      if (!content) return;
      const token = this.scene.registry.get('authToken');
      if (!token) return;
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ content, category: select.value }),
        });
        textarea.value = '';
        this._showMessage('Idea submitted!');
      } catch { this._showMessage('Failed to submit'); }
    };
    this.contentArea.appendChild(btn);
  }

  async _renderListTab(status) {
    try {
      const res = await fetch(`/api/submissions?status=${status}`);
      const submissions = await res.json();
      if (submissions.length === 0) {
        this.contentArea.innerHTML = '<p style="color:#8b6b4a;font-style:italic;">No submissions yet.</p>';
        return;
      }
      for (const sub of submissions) {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 10px; border-bottom: 1px solid rgba(139,107,74,0.2); font-size: 13px;';
        div.innerHTML = `
          <div style="color:#d4bc8b;font-weight:bold;">${this._esc(sub.display_name || 'Unknown')}</div>
          <div style="margin:4px 0;">${this._esc(sub.content)}</div>
          <div style="color:#8b6b4a;font-size:11px;">
            ${sub.category} | ${sub.votes || 0} votes | ${new Date(sub.submitted_at).toLocaleDateString()}
          </div>
        `;
        if (status === 'pending') {
          const voteBtn = document.createElement('button');
          voteBtn.textContent = 'Support This';
          voteBtn.style.cssText = 'margin-top: 4px; padding: 3px 10px; background: rgba(139,107,74,0.3); border: 1px solid #8b6b4a; color: #f4e4c1; font-family: Georgia, serif; font-size: 11px; cursor: pointer;';
          voteBtn.onclick = async () => {
            const token = this.scene.registry.get('authToken');
            if (!token) return;
            try {
              await fetch(`/api/submissions/${sub.id}/vote`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              this._refreshContent();
            } catch {}
          };
          div.appendChild(voteBtn);
        }
        this.contentArea.appendChild(div);
      }
    } catch {
      this.contentArea.innerHTML = '<p style="color:#aa3a3a;">Could not load submissions.</p>';
    }
  }

  _showMessage(text) {
    const msg = document.createElement('p');
    msg.textContent = text;
    msg.style.cssText = 'color: #ffd700; font-style: italic; margin-top: 8px;';
    this.contentArea.appendChild(msg);
  }

  _esc(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  }

  destroy() {
    this.close();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
  }
}
