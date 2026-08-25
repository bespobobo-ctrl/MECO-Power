import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { sendSuccess, sendError } from '../../utils/response';

const ordersService = new OrdersService();

export class OrdersController {
  async createOrder(req: Request, res: Response) {
    try {
      const { customerPhone } = req.body;
      const cleanPhone = (customerPhone || '').replace(/[\s\-\(\)\+]/g, '');

      if (!cleanPhone || !/^\d{9,15}$/.test(cleanPhone)) {
        return sendError(res, "Iltimos, to'g'ri telefon raqam kiriting! (Masalan: +998 90 123 45 67)", 400);
      }

      const order = await ordersService.createOrder(req.body);
      return sendSuccess(res, 'Buyurtma muvaffaqiyatli qabul qilindi!', order, 201);
    } catch (err: any) {
      return sendError(res, `Buyurtma saqlashda xatolik: ${err.message}`, 500);
    }
  }

  async getAllOrders(req: Request, res: Response) {
    const orders = await ordersService.getAllOrders();
    return sendSuccess(res, 'Buyurtmalar ro\'yxati olindi', orders);
  }

  async updateOrderStatus(req: Request, res: Response) {
    const { id, status } = req.body;
    const updated = await ordersService.updateOrderStatus(id, status);
    if (!updated) {
      return sendError(res, 'Buyurtma topilmadi', 404);
    }
    return sendSuccess(res, 'Buyurtma holati yangilandi', updated);
  }

  async deleteOrder(req: Request, res: Response) {
    const { id } = req.body;
    const deleted = await ordersService.deleteOrder(id);
    if (!deleted) {
      return sendError(res, 'Buyurtma topilmadi', 404);
    }
    return sendSuccess(res, 'Buyurtma o\'chirildi', { id });
  }

  async requestQuote(req: Request, res: Response) {
    const result = await ordersService.createQuoteRequest(req.body);
    return sendSuccess(res, 'Quote request submitted successfully to MECO Uzbekistan sales team', result, 201);
  }
}
