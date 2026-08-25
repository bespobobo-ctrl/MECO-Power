import { OrdersService } from '../orders/orders.service';

const ordersService = new OrdersService();

export interface VisitLog {
  timestamp: string;
  source: string;
  ip: string;
}

export class AnalyticsService {
  private static activeVisitors: Set<string> = new Set();
  private static totalVisits: number = 0;
  private static linkReferrals: Record<string, number> = {
    'Telegram Bot/Channel': 0,
    'Instagram Ads': 0,
    'Google Search': 0,
    'Tog\'ridan-tog\'ri (Direct)': 0,
  };
  private static visitLogs: VisitLog[] = [];

  public static recordVisit(ref: string | undefined, ip: string) {
    this.totalVisits += 1;
    this.activeVisitors.add(ip);

    let source = 'Tog\'ridan-tog\'ri (Direct)';
    if (ref) {
      if (ref.includes('tg') || ref.includes('telegram')) source = 'Telegram Bot/Channel';
      else if (ref.includes('insta') || ref.includes('instagram')) source = 'Instagram Ads';
      else if (ref.includes('google')) source = 'Google Search';
      else source = `Link (${ref})`;
    }

    this.linkReferrals[source] = (this.linkReferrals[source] || 0) + 1;
    this.visitLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      source,
      ip: ip.replace('::ffff:', ''),
    });

    if (this.visitLogs.length > 50) this.visitLogs.pop();
  }

  async getDashboardStats() {
    const orders = await ordersService.getAllOrders();

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    let dailySalesUzS = 0;
    let weeklySalesUzS = 0;
    let monthlySalesUzS = 0;

    orders.forEach(o => {
      // Exclude cancelled orders from revenue calculation
      if (o.status === 'Bekor qilindi') return;

      const orderTime = new Date(o.createdAt).getTime();
      const amount = Number(o.totalAmountUzS || o.priceUzS) || 0;
      const diff = now - orderTime;

      if (diff <= oneDayMs) {
        dailySalesUzS += amount;
      }
      if (diff <= sevenDaysMs) {
        weeklySalesUzS += amount;
      }
      if (diff <= thirtyDaysMs) {
        monthlySalesUzS += amount;
      }
    });

    return {
      activeVisitorsCount: Math.max(1, AnalyticsService.activeVisitors.size),
      totalVisitsCount: AnalyticsService.totalVisits,
      sales: {
        dailySalesUzS,
        weeklySalesUzS,
        monthlySalesUzS,
        totalOrdersCount: orders.length,
      },
      referralSources: AnalyticsService.linkReferrals,
      recentVisits: AnalyticsService.visitLogs.slice(0, 10),
    };
  }
}
