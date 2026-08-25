import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();

router.get('/dashboard', controller.getDashboard);
router.post('/ping', controller.ping);

export default router;
