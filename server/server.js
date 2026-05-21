import app, { env } from './app.js';
import { getDbPool } from './src/config/database.js';

async function bootstrap() {
  try {
    await getDbPool();
    app.listen(env.port, () => {
      console.log(`huyperfume-server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
