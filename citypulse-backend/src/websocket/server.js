const WebSocket = require('ws');

const { handleMessage } = require('./messageHandler');

function createWebSocketServer(port = Number(process.env.WS_PORT || 8080)) {
  const wss = new WebSocket.Server({ port });
  const clients = new Set();

  function broadcastToClients(message) {
    const serialized = JSON.stringify(message);

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  }

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('message', async (message) => {
      await handleMessage(ws, message, broadcastToClients);
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return {
    wss,
    clients,
    broadcastToClients,
  };
}

module.exports = {
  createWebSocketServer,
};

