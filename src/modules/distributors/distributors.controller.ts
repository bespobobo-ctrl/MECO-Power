import { Request, Response } from 'express';
import { DistributorsService } from './distributors.service';
import { sendSuccess } from '../../utils/response';

const service = new DistributorsService();

export class DistributorsController {
  async getHubs(req: Request, res: Response) {
    const hubs = await service.getHubs();
    return sendSuccess(res, 'Distributor hubs retrieved successfully', hubs);
  }

  async apply(req: Request, res: Response) {
    const application = await service.applyForDistributor(req.body);
    return sendSuccess(res, 'Distributor application submitted successfully', application, 201);
  }
}
