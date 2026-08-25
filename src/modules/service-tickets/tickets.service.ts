export class TicketsService {
  async createServiceTicket(data: any) {
    return {
      ticketNumber: `MECO-SRV-${Math.floor(100000 + Math.random() * 900000)}`,
      serialNumber: data.serialNumber,
      issueType: data.issueType || 'WARRANTY_CLAIM',
      status: 'OPEN',
      assignedTechnicalCenter: 'MECO Service Tashkent',
      createdAt: new Date().toISOString(),
    };
  }

  async getManuals() {
    return [
      {
        title: 'Meco 3.6kWh Pro User Manual & Specs',
        downloadUrl: 'https://mecopower.uz/manuals/meco-3.6kwh-pro.pdf',
        format: 'PDF',
      },
      {
        title: 'Meco Solar Panels Installation Guide',
        downloadUrl: 'https://mecopower.uz/manuals/meco-solar-panels.pdf',
        format: 'PDF',
      },
    ];
  }
}
