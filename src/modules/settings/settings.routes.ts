import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

router.get('/telegram', controller.getTelegram);
router.post('/telegram', controller.saveTelegram);
router.post('/telegram/test', controller.sendTestNotification);
router.post('/telegram/broadcast', controller.sendBroadcast);

router.get('/sliders', controller.getSliders);
router.post('/sliders', controller.saveSliders);
router.post('/upload-slide-image', controller.uploadSlideImage);

router.get('/instagram', controller.getInstagram);
router.post('/instagram', controller.saveInstagram);
router.post('/instagram/fetch-insights', controller.fetchInstagramInsights);
router.post('/instagram/connect-login', controller.connectInstagramLogin);

export default router;
