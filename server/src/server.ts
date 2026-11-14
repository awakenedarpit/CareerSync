import app from './app';
import env from './config/env';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;

const server = app.listen(port, () => {
  console.log(`[CarrerSync API] Server listening on port ${port} in [${env.NODE_ENV}] mode`);
  console.log(`[CarrerSync API] Health check: http://localhost:${port}/api/v1/health`);
  console.log(`[CarrerSync API] CORS Origin: ${env.CLIENT_URL}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[CarrerSync API] Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    console.log('[CarrerSync API] HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    console.error('[CarrerSync API] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
