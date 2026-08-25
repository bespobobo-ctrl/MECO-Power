import { Router } from 'express';
import { OrdersController } from './orders.controller';

const router = Router();
const controller = new OrdersController();

router.get('/all', controller.getAllOrders);
router.post('/create', controller.createOrder);
router.post('/update-status', controller.updateOrderStatus);
router.post('/quote', controller.requestQuote);

export default router;
