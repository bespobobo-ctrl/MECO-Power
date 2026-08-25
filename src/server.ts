import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { TelegramBotService } from './services/telegramBot.service';

async function startServer() {
  await connectDatabase();

  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA';
  const webAppUrl = process.env.VERCEL ? 'https://meco-power.vercel.app' : `http://localhost:${env.PORT}`;
  
  await TelegramBotService.initBot(botToken, webAppUrl);

  if (!process.env.VERCEL) {
    app.listen(env.PORT, () => {
      logger.info(`==================================================`);
      logger.info(`🚀 MECO POWER UZBEKISTAN API & PORTAL IS RUNNING!`);
      logger.info(`🌐 Web Portal URL: http://localhost:${env.PORT}`);
      logger.info(`📡 API Base URL:  http://localhost:${env.PORT}/api/v1`);
      logger.info(`🤖 Telegram Bot:   Token configured (${botToken.slice(0, 10)}...)`);
      logger.info(`==================================================`);
    });
  }
}

startServer();

export default app;
