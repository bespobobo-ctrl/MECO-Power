import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const SLIDES_FILE = path.join(DATA_DIR, 'slides.json');
const INSTAGRAM_FILE = path.join(DATA_DIR, 'instagram_config.json');

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

export interface InstagramConfig {
  username: string;
  profileUrl: string;
  dmUrl: string;
  accessToken?: string;
  showOnWebsite: boolean;
  status: 'CONNECTED' | 'DISCONNECTED';
  updatedAt?: string;
}

export class SettingsService {
  private static isInitialized = false;

  private static instagramSettings: InstagramConfig = {
    username: 'mecopower_uzbekistan',
    profileUrl: 'https://www.instagram.com/mecopower_uzbekistan',
    dmUrl: 'https://ig.me/m/mecopower_uzbekistan',
    accessToken: '',
    showOnWebsite: true,
    status: 'CONNECTED',
  };

  private static botSettings: TelegramBotConfig = {
    miniAppBot: {
      botToken: '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog',
      webAppUrl: 'https://meco-power.vercel.app',
      status: 'ACTIVE',
    },
    notificationBot: {
      botToken: '8733193378:AAE-FdK9cXbM7gKsTy3Rpe3uklCdQyaZJog',
      adminChatId: '987654321',
      notifyNewOrders: true,
      notifyTrafficAlerts: true,
      notifyDailyReport: true,
      status: 'ACTIVE',
    },
  };

  private static defaultSlides: HeroSlide[] = [
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

  private static slides: HeroSlide[] = [];

  private static async syncFromCloudStorage() {
    // 1. Instagram settings sync
    try {
      const { data: downData } = await supabase.storage.from('meco-assets').download('instagram_config.json');
      if (downData) {
        const text = await downData.text();
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          this.instagramSettings = { ...this.instagramSettings, ...parsed };
        }
      }
    } catch (e) {}

    // 2. Slides sync
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(SLIDES_FILE)) {
        const fileContent = fs.readFileSync(SLIDES_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.slides = parsed;
          this.isInitialized = true;
          return;
        }
      }
    } catch (err: any) {
      logger.warn(`Slides load note: ${err.message}`);
    }

    this.slides = [...this.defaultSlides];
    this.isInitialized = true;
  }

  private static async saveInstagramToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(INSTAGRAM_FILE, JSON.stringify(this.instagramSettings, null, 2), 'utf-8');

      const buffer = Buffer.from(JSON.stringify(this.instagramSettings, null, 2));
      await supabase.storage.from('meco-assets').upload('instagram_config.json', buffer, {
        contentType: 'application/json',
        upsert: true
      });
      logger.info(`📸 Instagram account config updated and synced to Supabase Cloud!`);
    } catch (err: any) {
      logger.warn(`Instagram save note: ${err.message}`);
    }
  }

  private static saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SLIDES_FILE, JSON.stringify(this.slides, null, 2), 'utf-8');
    } catch (err: any) {
      logger.warn(`Slides save note: ${err.message}`);
    }
  }

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

  async getInstagramSettings(): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();
    return SettingsService.instagramSettings;
  }

  async saveInstagramSettings(newSettings: Partial<InstagramConfig>): Promise<InstagramConfig> {
    await SettingsService.syncFromCloudStorage();

    SettingsService.instagramSettings = {
      ...SettingsService.instagramSettings,
      ...newSettings,
      status: 'CONNECTED',
      updatedAt: new Date().toISOString()
    };

    await SettingsService.saveInstagramToDisk();
    return SettingsService.instagramSettings;
  }

  async getSliders() {
    await SettingsService.syncFromCloudStorage();
    return SettingsService.slides;
  }

  async updateSliders(newSlides: HeroSlide[]) {
    await SettingsService.syncFromCloudStorage();
    SettingsService.slides = newSlides;
    SettingsService.saveToDisk();
    return SettingsService.slides;
  }
}
