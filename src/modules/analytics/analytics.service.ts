import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';
import { OrdersService } from '../orders/orders.service';

const DATA_DIR = path.join(process.cwd(), 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'analytics_visitors.json');
const ordersService = new OrdersService();

export interface VisitorPing {
  visitorId: string;
  source: 'telegram_mini_app' | 'instagram' | 'google' | 'direct_web';
  timestamp: string;
  ip?: string;
  ref?: string;
}

export class AnalyticsService {
  private static isInitialized = false;
  private static visitorLogs: VisitorPing[] = [];

  private static async syncFromCloudStorage() {
    try {
      const { data: downData } = await supabase.storage.from('meco-assets').download('analytics_visitors_config.json');
      if (downData) {
        const text = await downData.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          this.visitorLogs = parsed;
          this.isInitialized = true;
          this.saveLocalDiskOnly();
          return;
        }
      }
    } catch (sbErr: any) {
      logger.warn(`Supabase analytics load note: ${sbErr.message}`);
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(VISITORS_FILE)) {
        const fileContent = fs.readFileSync(VISITORS_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          this.visitorLogs = parsed;
          this.isInitialized = true;
        }
      }
    } catch (err: any) {
      logger.warn(`Analytics disk load note: ${err.message}`);
    }
  }

  private static saveLocalDiskOnly() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(VISITORS_FILE, JSON.stringify(this.visitorLogs, null, 2), 'utf-8');
    } catch (e) {}
  }

  private static async saveToDisk() {
    this.saveLocalDiskOnly();
    try {
      const buffer = Buffer.from(JSON.stringify(this.visitorLogs, null, 2));
      await supabase.storage.from('meco-assets').upload('analytics_visitors_config.json', buffer, {
        contentType: 'application/json',
        upsert: true
      });
    } catch (err: any) {
      logger.warn(`Analytics cloud save note: ${err.message}`);
    }
  }

  public async recordVisitPing(data: { visitorId: string; source: string; ref?: string; ip?: string }) {
    await AnalyticsService.syncFromCloudStorage();

    let cleanSource: 'telegram_mini_app' | 'instagram' | 'google' | 'direct_web' = 'direct_web';
    const s = (data.source || '').toLowerCase();
    const r = (data.ref || '').toLowerCase();

    if (s.includes('telegram') || r.includes('telegram') || r.includes('tg')) {
      cleanSource = 'telegram_mini_app';
    } else if (s.includes('instagram') || r.includes('instagram') || r.includes('insta')) {
      cleanSource = 'instagram';
    } else if (s.includes('google') || r.includes('google')) {
      cleanSource = 'google';
    }

    const nowIso = new Date().toISOString();
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;

    // Throttle duplicate pings from same visitorId within 5 minutes
    const existing = AnalyticsService.visitorLogs.find(
      v => v.visitorId === data.visitorId && new Date(v.timestamp).getTime() > fiveMinsAgo
    );

    if (!existing) {
      AnalyticsService.visitorLogs.unshift({
        visitorId: data.visitorId || `v-${Math.random().toString(36).substring(2, 9)}`,
        source: cleanSource,
        timestamp: nowIso,
        ip: data.ip ? data.ip.replace('::ffff:', '') : '127.0.0.1',
        ref: data.ref
      });

      // Keep last 10,000 logs for analytics
      if (AnalyticsService.visitorLogs.length > 10000) {
        AnalyticsService.visitorLogs = AnalyticsService.visitorLogs.slice(0, 10000);
      }

      await AnalyticsService.saveToDisk();
      logger.info(`📊 Recorded real visitor ping: [${cleanSource}] visitorId=${data.visitorId}`);
    }
  }

  async getDashboardStats() {
    await AnalyticsService.syncFromCloudStorage();
    const orders = await ordersService.getAllOrders();

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;
    const threeSixtyFiveDaysMs = 365 * oneDayMs;

    let dailySalesUzS = 0;
    let weeklySalesUzS = 0;
    let monthlySalesUzS = 0;
    let yearlySalesUzS = 0;

    orders.forEach(o => {
      if (o.status === 'Bekor qilindi') return;
      const orderTime = new Date(o.createdAt).getTime();
      const amount = Number(o.totalAmountUzS || o.priceUzS) || 0;
      const diff = now - orderTime;

      if (diff <= oneDayMs) dailySalesUzS += amount;
      if (diff <= sevenDaysMs) weeklySalesUzS += amount;
      if (diff <= thirtyDaysMs) monthlySalesUzS += amount;
      if (diff <= threeSixtyFiveDaysMs) yearlySalesUzS += amount;
    });

    const logs = AnalyticsService.visitorLogs;

    // Helper to calculate unique visitors for timeframe & source
    const getStatsForTimeframe = (filterSource?: string) => {
      const getUniqueCount = (maxAgeMs: number) => {
        const uniqueSet = new Set<string>();
        logs.forEach(log => {
          if (filterSource && log.source !== filterSource) return;
          const age = now - new Date(log.timestamp).getTime();
          if (age <= maxAgeMs) {
            uniqueSet.add(log.visitorId);
          }
        });
        return uniqueSet.size;
      };

      return {
        daily: getUniqueCount(oneDayMs),
        weekly: getUniqueCount(sevenDaysMs),
        monthly: getUniqueCount(thirtyDaysMs),
        yearly: getUniqueCount(threeSixtyFiveDaysMs)
      };
    };

    const totalWebApp = getStatsForTimeframe();
    const telegramBotApp = getStatsForTimeframe('telegram_mini_app');
    const instagramApp = getStatsForTimeframe('instagram');
    const googleApp = getStatsForTimeframe('google');
    const directApp = getStatsForTimeframe('direct_web');

    // Active visitors in last 5 minutes
    const activeVisitorsSet = new Set<string>();
    const fiveMinsAgo = now - 5 * 60 * 1000;
    logs.forEach(l => {
      if (new Date(l.timestamp).getTime() > fiveMinsAgo) {
        activeVisitorsSet.add(l.visitorId);
      }
    });

    const calculateConvRate = (ordersCount: number, visitsCount: number) => {
      if (!visitsCount || visitsCount === 0) return '0.0%';
      const rate = (ordersCount / visitsCount) * 100;
      return `${rate.toFixed(1)}%`;
    };

    const referralsTable = [
      {
        key: 'telegram',
        name: '📱 Telegram Bot & Mini App (?ref=telegram)',
        daily: telegramBotApp.daily,
        weekly: telegramBotApp.weekly,
        monthly: telegramBotApp.monthly,
        yearly: telegramBotApp.yearly,
        ordersCount: orders.length,
        conversionRate: calculateConvRate(orders.length, Math.max(1, telegramBotApp.yearly))
      },
      {
        key: 'instagram',
        name: '📸 Instagram Ads Linki (?ref=instagram)',
        daily: instagramApp.daily,
        weekly: instagramApp.weekly,
        monthly: instagramApp.monthly,
        yearly: instagramApp.yearly,
        ordersCount: 0,
        conversionRate: calculateConvRate(0, Math.max(1, instagramApp.yearly))
      },
      {
        key: 'google',
        name: '🔍 Google Search (?ref=google)',
        daily: googleApp.daily,
        weekly: googleApp.weekly,
        monthly: googleApp.monthly,
        yearly: googleApp.yearly,
        ordersCount: 0,
        conversionRate: calculateConvRate(0, Math.max(1, googleApp.yearly))
      },
      {
        key: 'direct',
        name: "🌐 To'g'ridan-to'g'ri Web Sayt (Direct)",
        daily: directApp.daily,
        weekly: directApp.weekly,
        monthly: directApp.monthly,
        yearly: directApp.yearly,
        ordersCount: 0,
        conversionRate: calculateConvRate(0, Math.max(1, directApp.yearly))
      }
    ];

    return {
      activeVisitorsCount: Math.max(1, activeVisitorsSet.size),
      totalVisitsCount: logs.length,
      sales: {
        dailySalesUzS,
        weeklySalesUzS,
        monthlySalesUzS,
        yearlySalesUzS,
        totalOrdersCount: orders.length,
      },
      webAppVisits: totalWebApp,
      telegramMiniAppVisits: telegramBotApp,
      referralsTable,
      recentVisits: logs.slice(0, 10),
    };
  }
}
