export interface DistributorHub {
  id: string;
  city: string;
  companyName: string;
  address: string;
  contactPhone: string;
  email: string;
}

export class DistributorsService {
  private hubs: DistributorHub[] = [
    {
      id: 'hub-tashkent',
      city: 'Tashkent',
      companyName: 'MECO Power Tashkent Central Showroom',
      address: 'Chilanzar district, Bunyodkor avenue 42',
      contactPhone: '+998 71 200 00 00',
      email: 'tashkent@mecopower.uz',
    },
    {
      id: 'hub-samarkand',
      city: 'Samarkand',
      companyName: 'MECO Solar Samarkand Hub',
      address: 'Registan street 15',
      contactPhone: '+998 66 230 00 00',
      email: 'samarkand@mecopower.uz',
    },
  ];

  async getHubs() {
    return this.hubs;
  }

  async applyForDistributor(data: any) {
    return {
      applicationId: `DIST-APP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'UNDER_REVIEW',
      applicantName: data.fullName,
      company: data.companyName,
      region: data.region,
      createdAt: new Date().toISOString(),
    };
  }
}
