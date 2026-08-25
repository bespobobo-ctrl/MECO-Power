import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';

async function startServer() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`==================================================`);
    logger.info(`🚀 MECO POWER UZBEKISTAN API & PORTAL IS RUNNING!`);
    logger.info(`🌐 Web Portal URL: http://localhost:${env.PORT}`);
    logger.info(`📡 API Base URL:  http://localhost:${env.PORT}/api/v1`);
    logger.info(`⚡ Supabase URL:  ${env.supabaseUrl}`);
    logger.info(`==================================================`);
  });
}

startServer();
