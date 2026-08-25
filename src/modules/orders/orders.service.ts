import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';
import { TelegramBotService } from '../../services/telegramBot.service';

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
  status: 'Yangi' | 'Jarayonda' | 'Yetkazildi' | 'Bekor qilindi';
  createdAt: string;
}

export class OrdersService {
  private static orders: Order[] = [
    {
      id: 'ORD-984201',
      customerName: 'Abdurahmon Karimov',
      customerPhone: '+998 90 123 45 67',
      addressNotes: 'Qo\'qon Sh., Navoiy Mfyi 14-uy',
      latitude: 40.528,
      longitude: 70.942,
      mapUrl: 'https://maps.google.com/?q=40.528,70.942',
      productId: 'prod-1kwh',
      productName: 'Meco 1kWh Solar Generator',
      priceUzS: 8900000,
      quantity: 1,
      totalAmountUzS: 8900000,
      status: 'Yangi',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ORD-984202',
      customerName: 'Sardorbek Alimov',
      customerPhone: '+998 94 399 39 97',
      addressNotes: 'Farg\'ona Sh., Al-Farg\'oniy ko\'chasi 5-uy',
      latitude: 40.386,
      longitude: 71.786,
      mapUrl: 'https://maps.google.com/?q=40.386,71.786',
      productId: 'prod-3k6wh',
      productName: 'Meco 3.6kWh Solar Generator',
      priceUzS: 21000000,
      quantity: 1,
      totalAmountUzS: 21000000,
      status: 'Jarayonda',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  async createOrder(orderData: Partial<Order>): Promise<Order> {
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

    // Save to memory cache
    OrdersService.orders.unshift(newOrder);

    // Save to Supabase PostgreSQL database if configured
    try {
      await supabase.from('orders').insert({
        id: newOrder.id,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        address_notes: newOrder.addressNotes,
        latitude: newOrder.latitude,
        longitude: newOrder.longitude,
        map_url: newOrder.mapUrl,
        product_id: newOrder.productId,
        product_name: newOrder.productName,
        price_uzs: newOrder.priceUzS,
        quantity: newOrder.quantity,
        total_amount_uzs: newOrder.totalAmountUzS,
        status: newOrder.status,
        created_at: newOrder.createdAt
      });
    } catch (err: any) {
      logger.warn(`Supabase order save note: stored in memory (${err.message})`);
    }

    // Send INSTANT notification to Admin Telegram Bot!
    try {
      await TelegramBotService.sendAdminOrderNotification(newOrder);
    } catch (err: any) {
      logger.warn(`Telegram Bot Order Notification note: ${err.message}`);
    }

    return newOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    return OrdersService.orders;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const order = OrdersService.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }

  async createQuoteRequest(data: any) {
    return this.createOrder({
      customerName: data.customerName,
      productId: data.items?.[0]?.productId,
      productName: data.items?.[0]?.name,
    });
  }
}
