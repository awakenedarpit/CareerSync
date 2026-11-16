/**
 * CarrerSync Backend Server Entrypoint
 * Re-exports the HTTP server and graceful shutdown lifecycle management.
 */

import server, { gracefulShutdown } from './server';

export { server, gracefulShutdown };
export default server;
