import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { getDatabase } from './config/database.js';
import { initSocket } from './socket.js';

// Ensure DB connects on startup
getDatabase();

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(` SETHU Server running on http://localhost:${env.PORT}`);
  console.log(` WebRTC Signaling: Socket.IO active`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health Check: http://localhost:${env.PORT}/api/health`);
  console.log(`====================================================`);
});

export { httpServer, io };
