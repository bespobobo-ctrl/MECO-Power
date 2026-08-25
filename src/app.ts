import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
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
app.use(helmet({ 
  contentSecurityPolicy: false,
  frameguard: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable Telegram WebApp iframe embedding
app.use((req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    const ref = (req.query.ref as string) || (req.headers.referer as string);
    const analyticsService = new AnalyticsService();
    analyticsService.recordVisitPing({
      visitorId: `v-ssr-${Math.random().toString(36).substring(2, 8)}`,
      source: ref || 'direct_web',
      ref,
      ip: req.ip || '127.0.0.1'
    }).catch(() => {});
  }
  next();
});

// Serve static frontend UI safely
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));
app.use(express.static(process.cwd()));

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

// Catch-all route to serve index.html for Web App Portal
app.get('*', (req: Request, res: Response) => {
  const rootIndex = path.join(process.cwd(), 'index.html');
  const publicIndex = path.join(publicPath, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  res.status(404).send('MECO Power Uzbekistan Portal index.html not found');
});

// Global Error Handler
app.use(errorHandler);

export default app;
