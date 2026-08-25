export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  badgeText: string;
  buttonText: string;
}

export interface TelegramBotConfig {
  miniAppBot: {
    botToken: string;
    webAppUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  notificationBot: {
    botToken: string;
    adminChatId: string;
    notifyNewOrders: boolean;
    notifyTrafficAlerts: boolean;
    notifyDailyReport: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  };
}

export class SettingsService {
  private static botSettings: TelegramBotConfig = {
    miniAppBot: {
      botToken: '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA',
      webAppUrl: 'https://meco-power.vercel.app',
      status: 'ACTIVE',
    },
    notificationBot: {
      botToken: '8886522625:AAEMOf4SKXVYhdZwML4qfzYQwFQz02USzFA',
      adminChatId: '987654321',
      notifyNewOrders: true,
      notifyTrafficAlerts: true,
      notifyDailyReport: true,
      status: 'ACTIVE',
    },
  };

  private static slides: HeroSlide[] = [
    {
      id: 1,
      badgeText: '⚡ Global Energy Storage Leader',
      title: 'MECO POWER',
      subtitle: 'Pioneer of advanced solar energy storage solutions for China, Pakistan, Nigeria, and Uzbekistan',
      imageUrl: '/images/hero1.png',
      buttonText: 'Mahsulotlarimizni ko\'rish →',
    },
    {
      id: 2,
      badgeText: '☀️ Smart Photovoltaic Architecture',
      title: 'Energy Storage System',
      subtitle: 'Fotovoltaik panellar, integratsiyalashgan LiFePO4 batareya hamda aqlli invertor tizimi',
      imageUrl: '/images/hero2.png',
      buttonText: 'Tizim bilan tanishish →',
    },
    {
      id: 3,
      badgeText: '🇺🇿 MECO Uzbekistan Portal',
      title: 'MECO POWER UZBEKISTAN',
      subtitle: 'Sanoatdagi yetakchi yuqori quvvatli va avtonom energiya saqlash stansiyalari',
      imageUrl: '/images/hero1.png',
      buttonText: 'Admin Panelga Kirish →',
    },
  ];

  async getTelegramSettings() {
    return SettingsService.botSettings;
  }

  async saveTelegramSettings(newSettings: Partial<TelegramBotConfig>) {
    if (newSettings.miniAppBot) {
      SettingsService.botSettings.miniAppBot = {
        ...SettingsService.botSettings.miniAppBot,
        ...newSettings.miniAppBot,
      };
    }

    if (newSettings.notificationBot) {
      SettingsService.botSettings.notificationBot = {
        ...SettingsService.botSettings.notificationBot,
        ...newSettings.notificationBot,
      };
    }

    return SettingsService.botSettings;
  }

  async getSliders() {
    return SettingsService.slides;
  }

  async updateSliders(newSlides: HeroSlide[]) {
    SettingsService.slides = newSlides;
    return SettingsService.slides;
  }
}
