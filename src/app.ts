import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

// Services & Routes
import { AnalyticsService } from './modules/analytics/analytics.service';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import ordersRoutes from './modules/orders/orders.routes';
import distributorsRoutes from './modules/distributors/distributors.routes';
import ticketsRoutes from './modules/service-tickets/tickets.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app: Application = express();

// Middlewares - Increased payload limit to 50MB for uploading large PC images
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.ALLOWED_ORIGINS }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Real-time visitor traffic tracker middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    const ref = (req.query.ref as string) || (req.headers.referer as string);
    AnalyticsService.recordVisit(ref, req.ip || '127.0.0.1');
  }
  next();
});

// Serve static frontend UI safely using process.cwd() for Vercel compatibility
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'MECO Power Uzbekistan Web API & Admin System',
    region: env.REGION,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/distributors', distributorsRoutes);
app.use('/api/v1/service', ticketsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Fallback to index.html for root navigation
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
