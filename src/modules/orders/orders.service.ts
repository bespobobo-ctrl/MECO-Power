export class OrdersService {
  async createQuoteRequest(data: any) {
    return {
      quoteId: `MECO-UZ-QT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'PENDING_REVIEW',
      customerName: data.customerName,
      region: data.region || 'Tashkent',
      items: data.items,
      createdAt: new Date().toISOString(),
    };
  }
}
