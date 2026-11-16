import app from './app';
import env from './config/env';
import { realtimeWebSocketServer } from './realtime/websocket.server';
import { closeDatabaseConnections } from './db/client';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;

const server = app.listen(port, () => {
  console.log(`[CarrerSync API] Server listening on port ${port} in [${env.NODE_ENV}] mode`);
  console.log(`[CarrerSync API] Health check: http://localhost:${port}/health`);
  console.log(`[CarrerSync API] API Health check: http://localhost:${port}/api/v1/health`);
  console.log(`[CarrerSync API] CORS Origin: ${env.CLIENT_URL}`);
});

// Mount self-hosted WebSocket server on existing Express 5 HTTP server
realtimeWebSocketServer.init(server);

let isShuttingDown = false;

export const gracefulShutdown = (signal: string): Promise<void> => {
  return new Promise((resolve) => {
    if (isShuttingDown) {
      resolve();
      return;
    }
    isShuttingDown = true;
    console.log(`[CarrerSync API] Received ${signal}. Shutting down HTTP server, WebSocket, and database pools gracefully...`);

    // Force shutdown after 10 seconds if hanging
    const forceTimer = setTimeout(() => {
      console.error('[CarrerSync API] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    // 1. Close WebSocket server connections
    try {
      realtimeWebSocketServer.close();
      console.log('[CarrerSync API] WebSocket server closed.');
    } catch (wsErr) {
      console.error('[CarrerSync API] Error closing WebSocket server:', wsErr);
    }

    // 2. Stop accepting new HTTP connections
    server.close(async (err) => {
      if (err) {
        console.error('[CarrerSync API] Error during HTTP server close:', err);
      } else {
        console.log('[CarrerSync API] HTTP server closed.');
      }

      // 3. Close database pools
      try {
        await closeDatabaseConnections();
        console.log('[CarrerSync API] Database connection pools closed.');
      } catch (dbErr) {
        console.error('[CarrerSync API] Error closing database connections:', dbErr);
      }

      clearTimeout(forceTimer);
      resolve();
      if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
      }
    });
  });
};

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

export default server;
