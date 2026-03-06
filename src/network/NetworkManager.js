import RemotePlayer from '../entities/RemotePlayer.js';

let instance = null;

export default class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.ws = null;
    this.connected = false;
    this.playerId = null;
    this.token = null;
    this.remotePlayers = new Map();
    this.positionSendTimer = 0;
    this.positionSendInterval = 100; // 10hz
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(playerId, token) {
    this.playerId = playerId;
    this.token = token;

    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${location.host}/ws`;

    this._createConnection(wsUrl);
  }

  _createConnection(wsUrl) {
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('[NetworkManager] WebSocket connection failed:', e);
      return;
    }

    this.ws.onopen = () => {
      console.log('[NetworkManager] Connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.ws.send(JSON.stringify({
        type: 'join',
        payload: { playerId: this.playerId, token: this.token }
      }));
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      this._handleMessage(msg);
    };

    this.ws.onclose = () => {
      console.log('[NetworkManager] Disconnected');
      this.connected = false;
      this._attemptReconnect(wsUrl);
    };

    this.ws.onerror = (err) => {
      console.warn('[NetworkManager] WebSocket error:', err);
    };
  }

  _attemptReconnect(wsUrl) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[NetworkManager] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[NetworkManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this._createConnection(wsUrl), delay);
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'world_state':
        this._handleWorldState(msg.payload);
        break;
      case 'player_joined':
        this._handlePlayerJoined(msg.payload);
        break;
      case 'player_left':
        this._handlePlayerLeft(msg.payload);
        break;
      case 'player_moved':
        this._handlePlayerMoved(msg.payload);
        break;
      case 'chat_message':
        this._handleChatMessage(msg.payload);
        break;
    }
  }

  _handleWorldState(payload) {
    if (payload.players) {
      for (const p of payload.players) {
        if (p.playerId !== this.playerId) {
          const remote = new RemotePlayer(
            this.scene, p.playerId, p.displayName,
            p.selectedClass, p.x, p.y
          );
          this.remotePlayers.set(p.playerId, remote);
        }
      }
    }
    if (payload.chatHistory) {
      this.scene.events.emit('chatHistory', payload.chatHistory);
    }
  }

  _handlePlayerJoined(payload) {
    if (payload.playerId === this.playerId) return;
    const remote = new RemotePlayer(
      this.scene, payload.playerId, payload.displayName,
      payload.selectedClass, payload.x, payload.y
    );
    this.remotePlayers.set(payload.playerId, remote);
    this.scene.events.emit('playerJoined', payload);
  }

  _handlePlayerLeft(payload) {
    const remote = this.remotePlayers.get(payload.playerId);
    if (remote) {
      remote.destroy();
      this.remotePlayers.delete(payload.playerId);
    }
    this.scene.events.emit('playerLeft', payload);
  }

  _handlePlayerMoved(payload) {
    const remote = this.remotePlayers.get(payload.playerId);
    if (remote) {
      remote.setTargetPosition(payload.x, payload.y, payload.facing, payload.animation);
    }
  }

  _handleChatMessage(payload) {
    this.scene.events.emit('chatMessage', payload);
  }

  sendPosition(x, y, facing, animation) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      type: 'position',
      payload: { x, y, facing, animation }
    }));
  }

  sendChat(message) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      type: 'chat',
      payload: { message }
    }));
  }

  update(dt) {
    this.positionSendTimer += dt;
    if (this.positionSendTimer >= this.positionSendInterval && this.scene.player) {
      this.positionSendTimer = 0;
      const pos = this.scene.player.getPosition();
      const facing = this.scene.player.facing;
      const isMoving = this.scene.player.isMoving;
      this.sendPosition(pos.x, pos.y, facing, isMoving ? `player_walk_${facing}` : `player_idle_${facing}`);
    }

    for (const remote of this.remotePlayers.values()) {
      remote.update(dt);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    for (const remote of this.remotePlayers.values()) {
      remote.destroy();
    }
    this.remotePlayers.clear();
  }

  static getInstance() {
    return instance;
  }

  static setInstance(inst) {
    instance = inst;
  }
}
