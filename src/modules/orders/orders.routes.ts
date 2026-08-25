import { Router } from 'express';
import { OrdersController } from './orders.controller';

const router = Router();
const controller = new OrdersController();

router.post('/quote', controller.requestQuote);

export default router;
