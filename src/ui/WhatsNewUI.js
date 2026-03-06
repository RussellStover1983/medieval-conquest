import { VERSION } from '../version.js';

export default class WhatsNewUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
  }

  async checkAndShow() {
    try {
      const res = await fetch('/api/changelog/latest');
      const latest = await res.json();
      if (!latest) return;

      // Compare versions
      if (latest.version && latest.version !== VERSION && this._isNewer(latest.version, VERSION)) {
        this._show(latest);
      }
    } catch {
      // Server not available, skip
    }
  }

  _isNewer(serverVersion, clientVersion) {
    const s = serverVersion.split('.').map(Number);
    const c = clientVersion.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((s[i] || 0) > (c[i] || 0)) return true;
      if ((s[i] || 0) < (c[i] || 0)) return false;
    }
    return false;
  }

  _show(entry) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 400px; background: rgba(30, 16, 8, 0.95);
      border: 2px solid #ffd700; border-radius: 6px; font-family: Georgia, serif;
      color: #f4e4c1; z-index: 3000; padding: 24px; text-align: center;
    `;

    let changes = entry.changes;
    if (typeof changes === 'string') {
      try { changes = JSON.parse(changes); } catch { changes = []; }
    }

    let changesHtml = '';
    if (changes && changes.length > 0) {
      changesHtml = '<ul style="text-align: left; margin: 12px 0; padding-left: 20px; font-size: 13px; color: #d4bc8b;">' +
        changes.map(c => `<li style="margin: 4px 0;">${this._esc(c)}</li>`).join('') + '</ul>';
    }

    this.container.innerHTML = `
      <div style="font-size: 22px; font-weight: bold; color: #ffd700; margin-bottom: 8px;">
        What's New in v${this._esc(entry.version)}!
      </div>
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${this._esc(entry.title)}</div>
      <div style="font-size: 13px; color: #c8a870; margin-bottom: 8px;">${this._esc(entry.description)}</div>
      ${changesHtml}
      <div style="font-size: 12px; color: #8b6b4a; margin-top: 12px; font-style: italic;">
        Click anywhere or press any key to continue
      </div>
    `;

    document.body.appendChild(this.container);

    const dismiss = () => {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('click', dismiss);
    };

    setTimeout(() => {
      document.addEventListener('keydown', dismiss, { once: true });
      document.addEventListener('click', dismiss, { once: true });
    }, 500);
  }

  _esc(text) {
    const el = document.createElement('span');
    el.textContent = text || '';
    return el.innerHTML;
  }
}
