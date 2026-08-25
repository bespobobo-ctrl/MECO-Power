import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { sendSuccess } from '../../utils/response';

const ordersService = new OrdersService();

export class OrdersController {
  async requestQuote(req: Request, res: Response) {
    const result = await ordersService.createQuoteRequest(req.body);
    return sendSuccess(res, 'Quote request submitted successfully to MECO Uzbekistan sales team', result, 201);
  }
}
