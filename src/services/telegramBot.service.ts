import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';
import { supabase } from '../config/supabase';
import { OrdersService } from '../modules/orders/orders.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
const { Bot } = require('node-telegram-bot-api');

const DATA_DIR = path.join(process.cwd(), 'data');
const BOT_USERS_FILE = path.join(DATA_DIR, 'bot_users.json');

const ordersService = new OrdersService();
const analyticsService = new AnalyticsService();

export interface BotUser {
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  registeredAt: string;
}

export class TelegramBotService {
  private static botInstance: any = null;
  private static botToken: string = '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog';
  private static registeredUsers: Map<number, BotUser> = new Map();
  private static authenticatedChatIds: Set<number> = new Set();
  private static SECRET_CODE: string = 'meco3997';

  static async initBot(token: string = '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog', webAppUrl: string = 'https://meco-power.vercel.app') {
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

      // Load registered & authenticated users from disk & Supabase / cache
      await this.loadRegisteredUsers();

      // Keyboard markup with user requested buttons:
      // 1. 🚀 MECO Power Web Portal Mini App
      // 2. 🛍️ Faol Buyurtmalar | ✅ Bajarilgan Buyurtmalar
      // 3. 📊 Sotuvlar Statistikasi (Kunlik, Haftalik, Oylik)
      const getAdminKeyboard = () => ({
        inline_keyboard: [
          [
            { text: '🚀 MECO Power Web Portal Mini App', web_app: { url: targetUrl } }
          ],
          [
            { text: '🛍️ Faol Buyurtmalar', callback_data: 'ACTION_ACTIVE_ORDERS' },
            { text: '✅ Bajarilgan Buyurtmalar', callback_data: 'ACTION_CLOSED_ORDERS' }
          ],
          [
            { text: '📊 Sotuvlar Statistikasi (Kunlik, Haftalik, Oylik)', callback_data: 'ACTION_SALES_STATS' }
          ]
        ]
      });

      // Handle text messages and password verification
      this.botInstance.on('message', async (ctx: any) => {
        const chatId = ctx.chatId || ctx.message?.chat?.id || ctx.chat?.id || ctx.from?.id;
        if (!chatId) return;

        const rawText = ctx.message?.text || ctx.text || '';
        const text = rawText.trim();
        const userName = ctx.from?.first_name || ctx.message?.from?.first_name || 'Foydalanuvchi';

        logger.info(`📱 Telegram Bot message from ${chatId} (${userName}): "${text}"`);

        // 1. Check if user enters the correct password code "meco3997"
        if (text.toLowerCase() === this.SECRET_CODE.toLowerCase()) {
          this.authenticatedChatIds.add(chatId);

          const user: BotUser = {
            chatId,
            firstName: ctx.from?.first_name || ctx.message?.from?.first_name,
            lastName: ctx.from?.last_name || ctx.message?.from?.last_name,
            username: ctx.from?.username || ctx.message?.from?.username,
            registeredAt: new Date().toISOString(),
          };
          this.registeredUsers.set(chatId, user);
          await this.saveUserToSupabase(user);

          const successMsg = 
            `✅ *KOD TO'G'RI! TIZIMGA XUSH KELIBSIZ!* 🎉\n\n` +
            `Siz MECO Power Uzbekistan boshqaruv va bildirishnomalar botiga muvaffaqiyatli kirdingiz.\n\n` +
            `⚡ *Yangi buyurtmalar kelishi bilan ushbu botga darhol xabarnoma yetib keladi!*\n\n` +
            `👇 *Buyurtmalarni va sotuvlar statistikasini ko'rish uchun pastdagi tugmalardan foydalaning:*`;

          return this.replyMessage(chatId, successMsg, getAdminKeyboard());
        }

        // 2. If user is already authenticated
        if (this.authenticatedChatIds.has(chatId)) {
          if (text === '/start') {
            const welcomeText = 
              `🌟 *Assalomu aleykum, ${userName}!*\n\n` +
              `🇺🇿 *MECO POWER UZBEKISTAN* boshqaruv botiga xush kelibsiz!\n\n` +
              `✨ *Tizim imkoniyatlari:*\n` +
              `• 🛍️ Kelgan yangi buyurtmalarni nazorat qilish\n` +
              `• 📊 Kunlik, haftalik va oylik tushumlarni ko'rish\n` +
              `• 🚀 Mini App orqali barcha mahsulotlarni boshqarish\n\n` +
              `👇 *Boshqaruv menyusidan kerakli bo'limni tanlang:*`;

            return this.replyMessage(chatId, welcomeText, getAdminKeyboard());
          }
          return; // Allow authenticated user text
        }

        // 3. User is NOT authenticated -> Prompt for Password Code
        const authPromptText = 
          `🔐 *XAVFSIZLIK TEKSHIRUVI (KIRISH CHEKLANGAN)*\n\n` +
          `Assalomu aleykum, *${userName}*!\n` +
          `*MECO POWER UZBEKISTAN* rasmiy botidan foydalanish hamda buyurtmalar xabarnomasini olish uchun maxsus kirish kodini kiriting.\n\n` +
          `✍️ *Iltimos, maxsus parolni (kodni) yozib yuboring:*`;

        return this.replyMessage(chatId, authPromptText);
      });

      // Handle Callback queries for 3 custom requested buttons
      this.botInstance.on('callback_query', async (ctx: any) => {
        const chatId = ctx.chatId || ctx.callbackQuery?.message?.chat?.id || ctx.from?.id;
        if (chatId && !this.authenticatedChatIds.has(chatId)) {
          return this.replyMessage(chatId, '🔒 Maxsus kirish kodi kiritilmagan. Iltimos parolni yozib yuboring.');
        }

        const queryData = ctx.callbackQuery?.data || ctx.data;

        // Button 1: 🛍️ FAOL BUYURTMALAR (Active Orders)
        if (queryData === 'ACTION_ACTIVE_ORDERS') {
          const allOrders = await ordersService.getAllOrders();
          const activeOrders = allOrders.filter(o => o.status !== 'Bajarildi va Yopildi' && o.status !== 'Bekor qilindi');

          if (!activeOrders || activeOrders.length === 0) {
            return this.replyMessage(chatId, `🛍️ *Hozircha faol buyurtmalar mavjud emas (0 ta).*`, getAdminKeyboard());
          }

          let msg = `🛍️ *FAOL BUYURTMALAR RO'YXATI (${activeOrders.length} ta):*\n\n`;
          activeOrders.forEach((o, i) => {
            msg += 
              `*${i + 1}. Buyurtma ID:* \`${o.id}\`\n` +
              `👤 *Mijoz:* ${o.customerName} (\`${o.customerPhone}\`)\n` +
              `📦 *Mahsulot:* ${o.productName} (${o.quantity} dona)\n` +
              `💰 *Jami Summa:* *${o.totalAmountUzS.toLocaleString('uz-UZ')} UZS*\n` +
              `📌 *Holati:* ${o.status}\n` +
              `🏠 *Manzil:* ${o.addressNotes || 'Ko\'rsatilmadi'}\n` +
              `${o.mapUrl ? `🗺️ [Google Maps Manzilni Ochish](${o.mapUrl})\n` : ''}` +
              `----------------------------------------\n\n`;
          });

          return this.replyMessage(chatId, msg, getAdminKeyboard());
        }

        // Button 2: ✅ BAJARILGAN BUYURTMALAR (Completed Orders)
        if (queryData === 'ACTION_CLOSED_ORDERS') {
          const allOrders = await ordersService.getAllOrders();
          const closedOrders = allOrders.filter(o => o.status === 'Bajarildi va Yopildi');

          if (!closedOrders || closedOrders.length === 0) {
            return this.replyMessage(chatId, `✅ *Hozircha bajarilgan buyurtmalar mavjud emas (0 ta).*`, getAdminKeyboard());
          }

          const totalClosedRevenue = closedOrders.reduce((sum, o) => sum + (o.totalAmountUzS || 0), 0);

          let msg = 
            `✅ *BAJARILGAN VA YOPILGAN BUYURTMALAR (${closedOrders.length} ta):*\n` +
            `💰 *Bajarilgan jami savdo tushumi:* *${totalClosedRevenue.toLocaleString('uz-UZ')} UZS*\n\n`;

          closedOrders.forEach((o, i) => {
            msg += 
              `*${i + 1}. ID:* \`${o.id}\` | ${o.customerName} (\`${o.customerPhone}\`)\n` +
              `📦 ${o.productName} — *${o.totalAmountUzS.toLocaleString('uz-UZ')} UZS*\n` +
              `⏰ ${new Date(o.createdAt).toLocaleString('uz-UZ')}\n\n`;
          });

          return this.replyMessage(chatId, msg, getAdminKeyboard());
        }

        // Button 3: 📊 SOTUVLAR STATISTIKASI (Daily, Weekly, Monthly Revenue Analytics)
        if (queryData === 'ACTION_SALES_STATS') {
          const analytics = await analyticsService.getDashboardStats();
          const sales = analytics.sales;

          const statsMsg = 
            `📊 *MECO POWER UZBEKISTAN SOTUVLAR STATISTIKASI:*\n\n` +
            `💰 *Bugungi Sotuvlar (Daily):* *${sales.dailySalesUzS.toLocaleString('uz-UZ')} UZS*\n` +
            `📈 *Haftalik Sotuvlar (Weekly):* *${sales.weeklySalesUzS.toLocaleString('uz-UZ')} UZS*\n` +
            `🏆 *Oylik Sotuvlar (Monthly):* *${sales.monthlySalesUzS.toLocaleString('uz-UZ')} UZS*\n\n` +
            `👁️ *Real-vaqtdagi Faol Tashrifchilar:* *${analytics.activeVisitorsCount} kishi*\n` +
            `⚡ *Barcha sotuvlar real kelgan buyurtmalar bo'yicha avtomatik hisoblanadi!*`;

          return this.replyMessage(chatId, statsMsg, getAdminKeyboard());
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

  private static async replyMessage(chatId: number, text: string, replyMarkup?: any) {
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      });
    } catch (e: any) {
      logger.error(`SendMessage error: ${e.message}`);
    }
  }

  // Load user database from local disk & Supabase
  private static async loadRegisteredUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(BOT_USERS_FILE)) {
        const fileContent = fs.readFileSync(BOT_USERS_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          parsed.forEach(u => {
            this.registeredUsers.set(u.chatId, u);
            this.authenticatedChatIds.add(u.chatId);
          });
          logger.info(`👥 Loaded ${parsed.length} authenticated Telegram bot users from disk.`);
        }
      }
    } catch (err: any) {
      logger.warn(`Bot users disk load note: ${err.message}`);
    }

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
          this.authenticatedChatIds.add(u.chat_id);
        });
      }
    } catch (err) {
      logger.warn('Bot users Supabase load note: Memory cache active');
    }
  }

  private static async saveUserToSupabase(user: BotUser) {
    try {
      this.registeredUsers.set(user.chatId, user);
      this.authenticatedChatIds.add(user.chatId);

      // Save to local disk file
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const userList = Array.from(this.registeredUsers.values());
      fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(userList, null, 2), 'utf-8');

      // Save to Supabase
      await supabase.from('bot_users').upsert({
        chat_id: user.chatId,
        first_name: user.firstName,
        last_name: user.lastName,
        username: user.username,
        registered_at: user.registeredAt
      });
    } catch (err: any) {
      logger.warn(`Bot user save note: ${err.message}`);
    }
  }

  // Admin Broadcast Message to all Authenticated Telegram Bot Users
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

    const res = await this.sendBroadcastMessage(msg);
    logger.info(`🚨 Sent instant order notification to ${res.successCount} admin Telegram chats!`);
    return res;
  }

  static getRegisteredUsersCount(): number {
    return this.registeredUsers.size;
  }
}
