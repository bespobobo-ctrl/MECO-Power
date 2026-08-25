import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';

const startServer = async () => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`⚡️ MECO Power Uzbekistan API server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🔗 Base URL: http://localhost:${env.PORT}/api/v1`);
    logger.info(`❤️ Health check: http://localhost:${env.PORT}/health`);
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err}`);
});
