import { Router } from 'express';
import { TicketsController } from './tickets.controller';

const router = Router();
const controller = new TicketsController();

router.post('/ticket', controller.createTicket);
router.get('/manuals', controller.getManuals);

export default router;
