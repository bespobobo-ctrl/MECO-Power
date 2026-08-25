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

  static async initBot(token: string = '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA', webAppUrl: string = 'https://meco-power.vercel.app') {
    if (!token) return;

    // Enforce HTTPS URL for Telegram WebApp compatibility
    const targetUrl = (webAppUrl && webAppUrl.startsWith('https://')) 
      ? webAppUrl 
      : 'https://meco-power.vercel.app';

    try {
      if (this.botInstance && typeof this.botInstance.stop === 'function') {
        try {
          this.botInstance.stop();
        } catch (e) {}
      }

      this.botToken = token;
      this.botInstance = new Bot(token);

      logger.info(`🚀 MECO Power Telegram Bot listener starting for Token (${token.slice(0, 10)}...)...`);

      // Set Permanent Web App Menu Button next to chat input field for 1-tap Mini App launch
      try {
        await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text: '⚡ Mini App',
              web_app: { url: targetUrl }
            }
          })
        });
        logger.info(`📱 Telegram Bot Mini App Menu Button configured successfully for ${targetUrl}!`);
      } catch (menuErr: any) {
        logger.warn(`SetChatMenuButton note: ${menuErr.message}`);
      }

      // Load registered users from Supabase / cache
      await this.loadRegisteredUsers();

      // Handle /start command
      this.botInstance.command('start', async (ctx: any) => {
        const chatId = ctx.chat?.id || ctx.from?.id;
        const userName = ctx.from?.first_name || 'Hurmatli Mijoz';

        const user: BotUser = {
          chatId,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          username: ctx.from?.username,
          registeredAt: new Date().toISOString(),
        };

        this.registeredUsers.set(chatId, user);
        await this.saveUserToSupabase(user);

        const welcomeText = 
          `🌟 *Assalomu aleykum, ${userName}!*\n\n` +
          `🇺🇿 *MECO POWER UZBEKISTAN* rasmiy Telegram Botiga xush kelibsiz!\n\n` +
          `🏢 *MECO Power Uzbekistan haqida:* \n` +
          `Biz O'zbekiston bo'yicha fotovoltaik quyosh panellari, invertorlar hamda 300Wh dan 5.4kWh gacha bo'lgan *LiFePO4 akkumulyatorli quyosh energiya saqlash generatorlarini* yetkazib beruvchi rasmiy markazmiz.\n\n` +
          `✨ *Bizning Afzalliklarimiz:*\n` +
          `• ⚡ *GaN 92%* yuqori energiya konversiyasi\n` +
          `• 🔋 *LiFePO4 8000+* uzoq muddatli batareya sikli\n` +
          `• 🛡️ *UN38.3 va IEC62368* xalqaro xavfsizlik sertifikatlari\n` +
          `• 🚚 *O'zbekiston bo'ylab* kafolatli yetkazib berish va Qo'qon Shaxridagi Bosh Shourum\n\n` +
          `👇 *Bizning MECO Power Uzbekistan Mini App-imizni ochish uchun pastdagi tugmani bosing:*`;

        const inlineKeyboard = [
          [
            { text: '🚀 MECO Power Uzbekistan Mini App', web_app: { url: targetUrl } }
          ],
          [
            { text: '📦 Mahsulotlar Narxlari Katologi', callback_data: 'ACTION_CATALOG' },
            { text: '🏢 BOSH SHOURUMI', callback_data: 'ACTION_CONTACT' }
          ]
        ];

        try {
          await ctx.reply(welcomeText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inlineKeyboard }
          });
        } catch (sendErr: any) {
          logger.warn(`Reply error fallback: ${sendErr.message}`);
          await ctx.reply(`Assalomu aleykum, ${userName}!\nMECO Power Uzbekistan rasmiy botiga xush kelibsiz!\nRasmiy portal: https://meco-power.vercel.app`);
        }
      });

      // Handle Callback queries
      this.botInstance.on('callback_query', async (ctx: any) => {
        const queryData = ctx.callbackQuery?.data || ctx.data;

        if (queryData === 'ACTION_CATALOG') {
          const catalogMsg = 
            `📦 *MECO POWER UZBEKISTAN BARCHA MAHSULOTLARI VA NARXLARI:*\n\n` +
            `1. 🔋 *Meco 300Wh Solar Power Bank* — 3,200,000 UZS\n` +
            `2. ⚡ *Meco 1kWh Solar Generator* — 8,900,000 UZS\n` +
            `3. ⚡ *Meco 1kWh Pro Solar Generator* — 10,500,000 UZS\n` +
            `4. ⚡ *Meco 1.8kWh Solar Generator* — 14,200,000 UZS\n` +
            `5. ⚡ *Meco 2kWh Solar Generator* — 16,800,000 UZS\n` +
            `6. ⚡ *Meco 3.6kWh Solar Generator* — 21,000,000 UZS\n` +
            `7. ⚡ *Meco 3.6kWh Pro Solar Generator* — 24,500,000 UZS\n` +
            `8. ⚡ *Meco 5.4kWh Heavy Duty Generator* — 38,000,000 UZS\n` +
            `9. ☀️ *Meco F200W Solar Panel* — 2,100,000 UZS\n` +
            `10. ☀️ *Meco 580W Solar Panel* — 2,800,000 UZS\n` +
            `11. ☀️ *Meco 620W Solar Panel* — 3,100,000 UZS\n\n` +
            `🌐 Rasmiy Mini App: https://meco-power.vercel.app`;

          try {
            await ctx.reply(catalogMsg, { parse_mode: 'Markdown' });
          } catch (e) {
            await ctx.reply(catalogMsg);
          }
        } else if (queryData === 'ACTION_CONTACT') {
          const contactMsg = 
            `🏢 *MECO POWER UZBEKISTAN BOSH SHOURUMI:*\n\n` +
            `📍 *Manzil:* Qo'qon Shaxar, A.Navoiy Mavzesi, ko'chasi 42, Farg'ona Qo'qon, O'zbekiston\n` +
            `📞 *Telefon:* +998 94 399 39 97\n` +
            `✉️ *Email:* uzbekistan@mecopower.com\n` +
            `🌐 *Portal:* https://meco-power.vercel.app`;

          try {
            await ctx.reply(contactMsg, { parse_mode: 'Markdown' });
          } catch (e) {
            await ctx.reply(contactMsg);
          }
        }
      });

      // Catch unhandled errors
      this.botInstance.catch((err: any) => {
        logger.warn(`Telegram Bot Handler Note: ${err.message || err}`);
      });

      // Only start long polling in non-Vercel environment (local/VPS)
      if (!process.env.VERCEL) {
        this.botInstance.startPolling();
        logger.info('🚀 MECO Power Telegram Bot polling listener started successfully!');
      } else {
        logger.info('⚡ Vercel Serverless environment detected: Serverless Function active.');
      }

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
          await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.chatId,
              text: messageText,
              parse_mode: 'Markdown'
            })
          });
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

  // Send Instant Admin Notification for New Order
  static async sendAdminOrderNotification(order: any) {
    const locText = order.mapUrl 
      ? `[📍 Google Maps Manzilni Ochish](${order.mapUrl})`
      : `Koordinata kiritilmagan`;

    const msg = 
      `🚨 *YANGI BUYURTMA KELIB TUSHDI!*\n\n` +
      `🆔 *Buyurtma ID:* \`${order.id}\`\n` +
      `👤 *Mijoz Nomi:* *${order.customerName}*\n` +
      `📞 *Telefon:* \`${order.customerPhone}\`\n` +
      `📦 *Mahsulot:* *${order.productName}*\n` +
      `💰 *Jami Summa:* *${(order.totalAmountUzS || order.priceUzS || 0).toLocaleString('uz-UZ')} UZS*\n` +
      `🏠 *Qo'shimcha Manzil:* ${order.addressNotes || 'Ko\'rsatilmadi'}\n` +
      `🗺️ *Geolokatsiya:* ${locText}\n\n` +
      `⏰ *Vaqti:* ${new Date(order.createdAt || Date.now()).toLocaleString('uz-UZ')}`;

    return this.sendBroadcastMessage(msg);
  }

  static getRegisteredUsersCount(): number {
    return this.registeredUsers.size;
  }
}
