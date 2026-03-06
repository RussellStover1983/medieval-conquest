const connectedPlayers = new Map();
const chatHistory = [];
const MAX_CHAT_HISTORY = 50;

export function broadcast(message, excludePlayerId) {
  const data = JSON.stringify(message);
  for (const [playerId, player] of connectedPlayers) {
    if (playerId !== excludePlayerId && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  }
}

export function addPlayer(playerId, ws, displayName, selectedClass) {
  connectedPlayers.set(playerId, {
    ws,
    displayName,
    selectedClass,
    x: 0,
    y: 0,
    facing: 'down',
    animation: ''
  });
}

export function removePlayer(playerId) {
  connectedPlayers.delete(playerId);
}

export function updatePosition(playerId, x, y, facing, animation) {
  const player = connectedPlayers.get(playerId);
  if (player) {
    player.x = x;
    player.y = y;
    player.facing = facing || player.facing;
    player.animation = animation || '';
  }
}

export function addChatMessage(playerId, displayName, message) {
  const msg = {
    playerId,
    displayName,
    message,
    timestamp: Date.now()
  };
  chatHistory.push(msg);
  if (chatHistory.length > MAX_CHAT_HISTORY) {
    chatHistory.shift();
  }
  return msg;
}

export function getConnectedPlayers() {
  return connectedPlayers;
}

export function getChatHistory() {
  return [...chatHistory];
}
