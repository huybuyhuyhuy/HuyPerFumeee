import app, { env } from './app.js';
import { getDbPool } from './src/config/database.js';
import logger from './src/config/logger.js';

let server = null;

async function bootstrap() {
  try {
    await getDbPool();

    server = app.listen(env.port, () => {
      logger.info(`huyperfume-server listening on http://localhost:${env.port}`, {
        nodeEnv: env.nodeEnv,
        port: env.port,
      });
      if (typeof process.send === 'function') {
        process.send('ready');
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(
          `Port ${env.port} is already in use. Stop the existing process or change PORT.`,
        );
        process.exit(1);
      }
      throw err;
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`${signal} received — starting graceful shutdown`);
  if (server) {
    // Force-close all connections so the port is released immediately.
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP server closed');
  }
  try {
    const pool = await getDbPool();
    if (pool && typeof pool.close === 'function') {
      await pool.close();
      logger.info('Database pool closed');
    }
  } catch {
    // pool may not be initialized yet
  }
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { stack: reason?.stack, message: reason?.message });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { stack: err.stack, message: err.message });
  process.exit(1);
});

bootstrap();
