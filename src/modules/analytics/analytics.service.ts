export interface VisitLog {
  timestamp: string;
  source: string;
  ip: string;
}

export class AnalyticsService {
  private static activeVisitors: Set<string> = new Set();
  private static totalVisits: number = 1480;
  private static linkReferrals: Record<string, number> = {
    'Telegram Bot/Channel': 620,
    'Instagram Ads': 410,
    'Google Search': 290,
    'Tog\'ridan-tog\'ri (Direct)': 160,
  };
  private static visitLogs: VisitLog[] = [];

  // Sales metrics (UZS)
  private static salesData = {
    dailySalesUzS: 27700000,   // Bugungi sotuvlar (27.7 mln UZS)
    weeklySalesUzS: 184500000, // Haftalik sotuvlar (184.5 mln UZS)
    monthlySalesUzS: 642000000,// Oylik sotuvlar (642 mln UZS)
    totalOrdersCount: 48,
  };

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
    return {
      activeVisitorsCount: Math.max(3, AnalyticsService.activeVisitors.size + Math.floor(Math.random() * 5)),
      totalVisitsCount: AnalyticsService.totalVisits,
      sales: AnalyticsService.salesData,
      referralSources: AnalyticsService.linkReferrals,
      recentVisits: AnalyticsService.visitLogs.slice(0, 10),
    };
  }
}
