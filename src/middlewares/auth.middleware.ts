import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access Token Required', 401);
  }

  // Placeholder token verification
  req.user = {
    id: 'usr-1',
    role: 'ADMIN',
    email: 'admin@mecopower.uz',
  };
  next();
};
