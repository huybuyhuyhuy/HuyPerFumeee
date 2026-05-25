import app, { env } from './app.js';
import { getDbPool } from './src/config/database.js';
import logger from './src/config/logger.js';
import { execSync } from 'child_process';

let server = null;

/**
 * On Windows, forcefully release the configured port when a previous instance
 * didn't shut down cleanly.  This prevents the EADDRINUSE crash loop that
 * `node --watch` triggers when the old process hasn't exited yet.
 */
function killPortProcess(port) {
  if (process.platform !== 'win32') return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', timeout: 3000 });
    const lines = out.trim().split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/:(\d+)\s+.*LISTENING\s+(\d+)/);
      if (match && Number(match[1]) === port) {
        execSync(`taskkill /F /PID ${match[2]}`, { timeout: 5000 });
        logger.info(`Killed stale process PID ${match[2]} on port ${port}`);
      }
    }
  } catch {
    // best-effort — port may already be free
  }
}

async function bootstrap() {
  try {
    await getDbPool();
    await killPortProcess(env.port);

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
