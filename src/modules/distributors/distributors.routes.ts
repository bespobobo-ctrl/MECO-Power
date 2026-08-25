import { Router } from 'express';
import { DistributorsController } from './distributors.controller';

const router = Router();
const controller = new DistributorsController();

router.get('/hubs', controller.getHubs);
router.post('/apply', controller.apply);

export default router;
