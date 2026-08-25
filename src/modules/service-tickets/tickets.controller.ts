import { Request, Response } from 'express';
import { TicketsService } from './tickets.service';
import { sendSuccess } from '../../utils/response';

const service = new TicketsService();

export class TicketsController {
  async createTicket(req: Request, res: Response) {
    const ticket = await service.createServiceTicket(req.body);
    return sendSuccess(res, 'Warranty/service ticket created successfully', ticket, 201);
  }

  async getManuals(req: Request, res: Response) {
    const manuals = await service.getManuals();
    return sendSuccess(res, 'User manuals and spec sheets retrieved', manuals);
  }
}
