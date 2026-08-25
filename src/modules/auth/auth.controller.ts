import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, 'Login successful', result);
    } catch (err: any) {
      return sendError(res, err.message || "Login yoki parol noto'g'ri!", err.statusCode || 401);
    }
  }

  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, 'Registration successful', result, 201);
    } catch (err: any) {
      return sendError(res, err.message || "Ro'yxatdan o'tishda xatolik!", 400);
    }
  }
}
