import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, 'Login successful', result);
  }

  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'Registration successful', result, 201);
  }
}
