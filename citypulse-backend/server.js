require('dotenv').config();

const app = require('./src/app');
const { createWebSocketServer } = require('./src/websocket/server');

const PORT = Number(process.env.PORT || 3008);
const WS_PORT = Number(process.env.WS_PORT || 8080);

const server = app.listen(PORT, () => {
  console.log(`REST API listening on http://localhost:${PORT}`);
});

const wsServer = createWebSocketServer(WS_PORT);
console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);

function shutdown() {
  wsServer.wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

