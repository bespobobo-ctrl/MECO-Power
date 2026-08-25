import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    const stats = await analyticsService.getDashboardStats();
    return sendSuccess(res, 'Dashboard statistikasi muvaffaqiyatli olindi', stats);
  }
}
