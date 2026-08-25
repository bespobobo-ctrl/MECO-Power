import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess, sendError } from '../../utils/response';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getDashboardStats();
      return sendSuccess(res, 'Dashboard statistikasi muvaffaqiyatli olindi', stats);
    } catch (err: any) {
      return sendError(res, `Statistika olishda xatolik: ${err.message}`, 500);
    }
  }

  async ping(req: Request, res: Response) {
    try {
      const { visitorId, source, ref } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      await analyticsService.recordVisitPing({
        visitorId: visitorId || `v-${Math.random().toString(36).substring(2, 9)}`,
        source: source || 'direct_web',
        ref,
        ip
      });

      return sendSuccess(res, 'Visit ping recorded', { recorded: true });
    } catch (err: any) {
      return sendError(res, `Ping error: ${err.message}`, 500);
    }
  }
}
