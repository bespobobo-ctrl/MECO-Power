import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';
import { TelegramBotService } from '../../services/telegramBot.service';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

export type OrderStatus = 'Yangi' | 'Jarayonda' | 'Qabul qilindi' | 'Yetkazilmoqda' | 'Bajarildi va Yopildi' | 'Bekor qilindi';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  addressNotes?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string;
  productId: string;
  productName: string;
  priceUzS: number;
  quantity: number;
  totalAmountUzS: number;
  status: OrderStatus;
  createdAt: string;
}

export class OrdersService {
  private static isInitialized = false;
  private static defaultOrders: Order[] = [];
  private static orders: Order[] = [];

  private static async syncFromCloudStorage() {
    try {
      const { data: downData } = await supabase.storage.from('meco-assets').download('orders_config.json');
      if (downData) {
        const text = await downData.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          this.orders = parsed;
          this.isInitialized = true;
          this.saveLocalDiskOnly();
          return;
        }
      }
    } catch (sbErr: any) {
      logger.warn(`Supabase orders storage load note: ${sbErr.message}`);
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ORDERS_FILE)) {
        const fileContent = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          this.orders = parsed;
          this.isInitialized = true;
        }
      }
    } catch (err: any) {
      logger.warn(`Orders file persistence load note: ${err.message}`);
    }
  }

  private static saveLocalDiskOnly() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(this.orders, null, 2), 'utf-8');
    } catch (e) {}
  }

  private static async saveToDisk() {
    this.saveLocalDiskOnly();

    // Sync cloud storage (meco-assets/orders_config.json)
    try {
      const buffer = Buffer.from(JSON.stringify(this.orders, null, 2));
      await supabase.storage.from('meco-assets').upload('orders_config.json', buffer, {
        contentType: 'application/json',
        upsert: true
      });
      logger.info(`💾 Orders list (${this.orders.length}) synced to Supabase cloud storage!`);
    } catch (err: any) {
      logger.warn(`Orders cloud save note: ${err.message}`);
    }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    await OrdersService.syncFromCloudStorage();

    const lat = orderData.latitude ? Number(orderData.latitude) : null;
    const lng = orderData.longitude ? Number(orderData.longitude) : null;
    const generatedMapUrl = orderData.mapUrl || (lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '');

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: orderData.customerName || 'Xaridor',
      customerPhone: orderData.customerPhone || '+998900000000',
      addressNotes: orderData.addressNotes || '',
      latitude: lat,
      longitude: lng,
      mapUrl: generatedMapUrl,
      productId: orderData.productId || 'prod-1kwh',
      productName: orderData.productName || 'Meco Solar Generator',
      priceUzS: Number(orderData.priceUzS) || 8900000,
      quantity: Number(orderData.quantity) || 1,
      totalAmountUzS: (Number(orderData.priceUzS) || 8900000) * (Number(orderData.quantity) || 1),
      status: 'Yangi',
      createdAt: new Date().toISOString()
    };

    OrdersService.orders.unshift(newOrder);
    await OrdersService.saveToDisk();

    // Send INSTANT notification to Admin Telegram Bot!
    try {
      await TelegramBotService.sendAdminOrderNotification(newOrder);
    } catch (err: any) {
      logger.warn(`Telegram Bot Order Notification note: ${err.message}`);
    }

    return newOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    await OrdersService.syncFromCloudStorage();
    return OrdersService.orders;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await OrdersService.syncFromCloudStorage();
    const order = OrdersService.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = status;
    await OrdersService.saveToDisk();
    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    await OrdersService.syncFromCloudStorage();
    const idx = OrdersService.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      OrdersService.orders.splice(idx, 1);
      await OrdersService.saveToDisk();
      return true;
    }
    return false;
  }

  async createQuoteRequest(data: any) {
    return this.createOrder({
      customerName: data.customerName,
      productId: data.items?.[0]?.productId,
      productName: data.items?.[0]?.name,
    });
  }
}
