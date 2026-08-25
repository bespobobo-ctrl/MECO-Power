import { logger } from '../config/logger';
import { supabase } from '../config/supabase';
const { Bot } = require('node-telegram-bot-api');

export interface BotUser {
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  registeredAt: string;
}

export class TelegramBotService {
  private static botInstance: any = null;
  private static botToken: string = '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA';
  private static registeredUsers: Map<number, BotUser> = new Map();
  private static isPolling: boolean = false;

  static async initBot(token: string = '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA', webAppUrl: string = 'http://localhost:5000') {
    if (!token) return;

    try {
      this.botToken = token;
      this.botInstance = new Bot(token);

      logger.info(`🚀 MECO Power Telegram Bot initialized with Token (${token.slice(0, 10)}...)`);

      // Load registered users from Supabase / cache
      await this.loadRegisteredUsers();

      // Start custom long polling loop
      if (!this.isPolling) {
        this.isPolling = true;
        this.startLongPolling(webAppUrl);
      }

    } catch (err: any) {
      logger.error(`Telegram Bot Startup Error: ${err.message}`);
    }
  }

  // Robust Telegram Polling Loop that handles updates reliably
  private static async startLongPolling(webAppUrl: string) {
    let offset = 0;
    logger.info('🚀 Telegram Bot custom polling listener active and listening for /start...');

    while (this.isPolling) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=20`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await this.handleTelegramUpdate(update, webAppUrl);
          }
        }
      } catch (err: any) {
        // Sleep 3 seconds on error before retrying
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  // Handle incoming Telegram message updates
  private static async handleTelegramUpdate(update: any, webAppUrl: string) {
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text.startsWith('/start')) {
        const userName = msg.from?.first_name || 'Hurmatli Mijoz';

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
          `🌟 *Assalomu aleykum, ${userName}!*\n\n` +
          `⚡ *MECO POWER UZBEKISTAN* rasmiy Telegram Botiga xush kelibsiz!\n\n` +
          `🏢 *MECO Power haqida qisqacha:*\n` +
          `Biz fotovoltaik quyosh panellari, invertorlar hamda 300Wh dan 5.4kWh gacha bo'lgan *LiFePO4 akkumulyatorli quyosh energiya saqlash generatorlarini* ishlab chiqarish va yetkazib berish bo'yicha dunyodagi yetakchi brendlardan birimiz.\n\n` +
          `✨ *Bizning Afzalliklarimiz:*\n` +
          `• ⚡ *GaN 92%* yuqori energiya konversiyasi\n` +
          `• 🔋 *LiFePO4 8000+* uzoq muddatli batareya sikli\n` +
          `• 🛡️ *UN38.3 va IEC62368* xalqaro xavfsizlik sertifikatlari\n` +
          `• 🚚 *O'zbekiston bo'ylab* kafolatli yetkazib berish va servis\n\n` +
          `👇 *Kerakli bo'limni tanlang:*`;

        const isHttps = webAppUrl.startsWith('https://');

        const inlineKeyboard = [
          [
            isHttps 
              ? { text: '🚀 MECO Mini App (Katalog va Buyurtma)', web_app: { url: webAppUrl } }
              : { text: '🌐 MECO Veb Portalini Ochish', url: 'https://www.mecopower.com' }
          ],
          [
            { text: '📦 Mahsulotlar Ro\'yxati', callback_data: 'ACTION_CATALOG' },
            { text: '📞 Toshkent Shourumi', callback_data: 'ACTION_CONTACT' }
          ],
          [
            { text: '🌐 Rasmiy Veb Sayt', url: 'https://www.mecopower.com' }
          ]
        ];

        await this.sendTelegramApiMessage(chatId, welcomeText, inlineKeyboard);
      }
    } else if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message.chat.id;

      if (query.data === 'ACTION_CATALOG') {
        const catalogMsg = 
          `📦 *MECO POWER UZBEKISTAN MAHSULOTLAR KATALOGI:*\n\n` +
          `1. 🔋 *Meco 300Wh Solar Power Bank* — 3,200,000 UZS\n` +
          `2. ⚡ *Meco 1kWh Solar Generator* — 8,900,000 UZS\n` +
          `3. ⚡ *Meco 1.8kWh Solar Generator* — 14,200,000 UZS\n` +
          `4. ⚡ *Meco 2kWh Solar Generator* — 16,800,000 UZS\n` +
          `5. ⚡ *Meco 3.6kWh Pro Solar Generator* — 24,500,000 UZS\n` +
          `6. ⚡ *Meco 5.4kWh Heavy Duty Generator* — 38,000,000 UZS\n` +
          `7. ☀️ *Meco F200W Solar Panel* — 2,100,000 UZS\n` +
          `8. ☀️ *Meco 620W Solar Panel* — 3,100,000 UZS\n\n` +
          `🌐 Rasmiy sayt: www.mecopower.com`;

        await this.sendTelegramApiMessage(chatId, catalogMsg);
      } else if (query.data === 'ACTION_CONTACT') {
        const contactMsg = 
          `🏢 *MECO POWER UZBEKISTAN BOSH SHOURUMI:*\n\n` +
          `📍 Manzil: Toshkent tumani, Chilonzor 42, Bunyodkor shox ko'chasi.\n` +
          `📞 Telefon: +998 71 200 00 00\n` +
          `✉️ Email: uzbekistan@mecopower.com\n` +
          `🌐 Sayt: www.mecopower.com`;

        await this.sendTelegramApiMessage(chatId, contactMsg);
      }
    }
  }

  // Send message via Telegram Bot HTTP REST API
  private static async sendTelegramApiMessage(chatId: number, text: string, inlineKeyboard?: any[]) {
    try {
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      };

      if (inlineKeyboard) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      logger.error(`Send message error: ${err.message}`);
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
      logger.warn('Bot users load note: Memory cache active');
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
      logger.warn('Bot user save note: user stored in memory cache');
    }
  }

  // Admin Broadcast Message to all Telegram Bot Users
  static async sendBroadcastMessage(messageText: string, imageUrl?: string): Promise<{ totalUsers: number; successCount: number; failCount: number }> {
    const userList = Array.from(this.registeredUsers.values());
    let successCount = 0;
    let failCount = 0;

    for (const user of userList) {
      try {
        if (imageUrl && imageUrl.startsWith('http')) {
          await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.chatId,
              photo: imageUrl,
              caption: messageText,
              parse_mode: 'Markdown'
            })
          });
        } else {
          await this.sendTelegramApiMessage(user.chatId, messageText);
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
