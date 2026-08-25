import { logger } from '../config/logger';
import { supabase } from '../config/supabase';
const TelegramBot = require('node-telegram-bot-api');

export interface BotUser {
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  registeredAt: string;
}

export class TelegramBotService {
  private static botInstance: any = null;
  private static botToken: string = '';
  private static registeredUsers: Map<number, BotUser> = new Map();

  static async initBot(token: string, webAppUrl: string = 'http://localhost:5000') {
    if (!token || token.includes('Example')) {
      logger.info('Telegram Bot token is not configured or is placeholder.');
      return;
    }

    try {
      if (this.botInstance) {
        this.botInstance.stopPolling();
      }

      this.botToken = token;
      this.botInstance = new TelegramBot(token, { polling: true });

      logger.info('🚀 Telegram Mini App Bot initialized and listening...');

      // Load registered users from Supabase / cache
      await this.loadRegisteredUsers();

      // Handle /start command
      this.botInstance.onText(/\/start/, async (msg: any) => {
        const chatId = msg.chat.id;
        const user: BotUser = {
          chatId,
          firstName: msg.from?.first_name,
          lastName: msg.from?.last_name,
          username: msg.from?.username,
          registeredAt: new Date().toISOString(),
        };

        this.registeredUsers.set(chatId, user);
        await this.saveUserToSupabase(user);

        const welcomeText = 
          `👋 **Assalomu aleykum, ${msg.from?.first_name || 'Xaridor'}!**\n\n` +
          `⚡ **MECO POWER Uzbekistan** rasmiy Telegram botiga xush kelibsiz!\n\n` +
          `Ushbu bot orqali siz quyosh energiyasini saqlash stansiyalari, generatorlar hamda panellar katalogi bilan tanishishingiz va Telegram ichida to'g'ridan-to'g'ri buyurtma berishingiz mumkin.\n\n` +
          `Pastdagi **"🚀 MECO Mini App"** tugmasini bosing!`;

        const keyboardOptions: any = {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 MECO Mini App (Katalog & Buyurtma)',
                  web_app: { url: webAppUrl }
                }
              ],
              [
                { text: '📦 Mahsulotlar Ro\'yxati', callback_data: 'ACTION_CATALOG' },
                { text: '📞 Biz Bilan Bog\'lanish', callback_data: 'ACTION_CONTACT' }
              ],
              [
                { text: '🌐 Rasmiy Veb Sayt', url: 'https://www.mecopower.com' }
              ]
            ]
          }
        };

        this.botInstance?.sendMessage(chatId, welcomeText, keyboardOptions);
      });

      // Handle Callback queries
      this.botInstance.on('callback_query', async (query: any) => {
        if (!query.message) return;
        const chatId = query.message.chat.id;

        if (query.data === 'ACTION_CATALOG') {
          const catalogMsg = 
            `📦 **MECO POWER UZBEKISTAN MAHSULOTLARI:**\n\n` +
            `1. 🔋 **Meco 300Wh Solar Power Bank** — 3,200,000 UZS\n` +
            `2. ⚡ **Meco 1kWh Solar Generator** — 8,900,000 UZS\n` +
            `3. ⚡ **Meco 1.8kWh Solar Generator** — 14,200,000 UZS\n` +
            `4. ⚡ **Meco 2kWh Solar Generator** — 16,800,000 UZS\n` +
            `5. ⚡ **Meco 3.6kWh Pro Solar Generator** — 24,500,000 UZS\n` +
            `6. ⚡ **Meco 5.4kWh Heavy Duty Generator** — 38,000,000 UZS\n` +
            `7. ☀️ **Meco F200W Solar Panel** — 2,100,000 UZS\n` +
            `8. ☀️ **Meco 620W Solar Panel** — 3,100,000 UZS\n\n` +
            `🛒 Buyurtma berish uchun Telegram Mini App'ni oching!`;

          this.botInstance?.sendMessage(chatId, catalogMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '🚀 Mini App-ni Ochish', web_app: { url: webAppUrl } }]]
            }
          });
        } else if (query.data === 'ACTION_CONTACT') {
          const contactMsg = 
            `📍 **MECO POWER Uzbekistan Bosh Shourumi:**\n` +
            `Toshkent tumani, Chilonzor 42, Bunyodkor shox ko'chasi.\n\n` +
            `📞 Telefon: +998 71 200 00 00\n` +
            `✉️ Email: uzbekistan@mecopower.com\n` +
            `🌐 Sayt: www.mecopower.com`;

          this.botInstance?.sendMessage(chatId, contactMsg);
        }
      });

    } catch (err: any) {
      logger.error(`Telegram Bot Startup Error: ${err.message}`);
    }
  }

  // Load user database from Supabase
  private static async loadRegisteredUsers() {
    try {
      const { data } = await supabase.from('bot_users').select('*');
      if (data && Array.isArray(data)) {
        data.forEach(u => {
          this.registeredUsers.set(u.chat_id, {
            chatId: u.chat_id,
            firstName: u.first_name,
            lastName: u.last_name,
            username: u.username,
            registeredAt: u.registered_at
          });
        });
      }
    } catch (err) {
      logger.warn('Bot users load note: Table will sync upon first user interaction');
    }
  }

  private static async saveUserToSupabase(user: BotUser) {
    try {
      await supabase.from('bot_users').upsert({
        chat_id: user.chatId,
        first_name: user.firstName,
        last_name: user.lastName,
        username: user.username,
        registered_at: user.registeredAt
      });
    } catch (err) {
      logger.warn('Bot user save note: user stored in active memory');
    }
  }

  // Admin Broadcast Message to all Telegram Bot Users
  static async sendBroadcastMessage(messageText: string, imageUrl?: string): Promise<{ totalUsers: number; successCount: number; failCount: number }> {
    if (!this.botInstance) {
      throw new Error('Telegram bot faol emas. Iltimos avval Admin Panelda Bot Tokenini saqlang va ishga tushiring!');
    }

    const userList = Array.from(this.registeredUsers.values());
    let successCount = 0;
    let failCount = 0;

    for (const user of userList) {
      try {
        if (imageUrl && imageUrl.startsWith('http')) {
          await this.botInstance.sendPhoto(user.chatId, imageUrl, { caption: messageText, parse_mode: 'Markdown' });
        } else {
          await this.botInstance.sendMessage(user.chatId, messageText, { parse_mode: 'Markdown' });
        }
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    return {
      totalUsers: userList.length,
      successCount,
      failCount
    };
  }

  static getRegisteredUsersCount(): number {
    return this.registeredUsers.size;
  }
}
